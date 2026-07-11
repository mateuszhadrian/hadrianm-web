/* ════════════════════════════════════════════════════════════════
   KONTAKT (06) — wariant A "Split" · logika sekcji
   Konfiguracja w KT_CFG. Wymaga: gsap + ScrollTrigger (globalne
   z CDN w podglądzie; w Astro — importy, patrz README pkt 2).

   1) Reveal danych: e-mail i telefon składane z fragmentów dopiero
      w handlerze kliknięcia — w źródle HTML/JS nie ma pełnego
      adresu ani numeru (regexy botów nie mają czego zebrać).
      Po odkryciu wartość staje się linkiem (mailto:/tel:),
      a akcja zmienia się w KOPIUJ (Clipboard API).
   2) Formularz: walidacja (imię, e-mail, wiadomość ≥10 znaków),
      honeypot + min. czas wypełnienia (antyspam), wysyłka przez
      sendForm() → KT_CFG.endpoint. Pusty endpoint = tryb prototypu
      (symulacja sukcesu po 600ms). Po sukcesie crossfade na
      potwierdzenie; po błędzie serwera komunikat .kt-srv.
   3) Wejścia: ScrollTrigger once → klasy .on, animuje CSS
      transition (stagger = --d). Desktop: leniwy parallax ghosta.

   Tryby statyczne (wszystko widoczne od razu, bez animacji wejść;
   reveal danych i formularz DZIAŁAJĄ dalej — to funkcja, nie dekoracja):
   brak JS (brak body.js — ale wtedy reveal/submit nieaktywne) ·
   prefers-reduced-motion: reduce · body.kt-static ustawione PRZED
   tym skryptem (globalny mechanizm low-power, kontrakt jak fq-static).
   ════════════════════════════════════════════════════════════════ */
(function () {
  var KT_CFG = {
    /* ── WYSYŁKA: wstaw URL endpointu; '' = tryb prototypu ── */
    endpoint: '',
    minFillMs: 4000,           /* submit szybciej niż to od loadu = bot */
    /* ── wejścia / parallax ── */
    desktop: '(min-width: 861px)',
    leadStart: 'top 84%', sideStart: 'top 88%',
    frameStart: 'top 82%', footStart: 'top 97%',
    ghostY: [-30, 40]
  };

  var MOTION_OK = window.matchMedia('(prefers-reduced-motion: no-preference)').matches;
  var STATIC = document.body.classList.contains('kt-static');

  /* ── 1. reveal danych — fragmenty, składanie on-demand ── */
  var FR = { e: ['mateusz', 'hadrianm', 'pl'], p: [48, 783, 983, 600] };
  function buildEmail() { return FR.e[0] + String.fromCharCode(64) + FR.e[1] + '.' + FR.e[2]; }
  function buildPhone(sep) { return '+' + FR.p.join(sep); }

  document.querySelectorAll('.kt-rev').forEach(function (rev) {
    var kind = rev.getAttribute('data-kind');
    var val = rev.querySelector('.kt-val');
    var act = rev.querySelector('.kt-act');
    var value = '', tmr = null;

    act.addEventListener('click', function () {
      if (!rev.classList.contains('open')) {
        /* pierwsze kliknięcie: złóż + pokaż + podlinkuj */
        value = kind === 'email' ? buildEmail() : buildPhone(' ');
        var href = kind === 'email' ? 'mailto:' + value : 'tel:' + buildPhone('');
        var link = document.createElement('a');
        link.href = href;
        link.textContent = value;
        val.textContent = '';
        val.appendChild(link);
        rev.classList.add('open');
        act.textContent = '[ KOPIUJ ]';
        act.setAttribute('aria-label', kind === 'email' ? 'Kopiuj adres e-mail' : 'Kopiuj numer telefonu');
        return;
      }
      /* kolejne kliknięcia: kopiuj */
      var done = function () {
        act.textContent = '[ SKOPIOWANO ]';
        act.classList.add('ok');
        clearTimeout(tmr);
        tmr = setTimeout(function () { act.textContent = '[ KOPIUJ ]'; act.classList.remove('ok'); }, 1900);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(value).then(done, done);
      } else { done(); }
    });
  });

  /* ── 2. wysyłka ──
     Kontrakt endpointu (serwer MUSI powtórzyć antyspam i walidację):
     POST multipart/form-data: name, email, temat (może być puste),
     message, firma (honeypot — niepuste = bot, odpowiedz 200 i wyrzuć),
     elapsed (ms od załadowania — < minFillMs = bot, jw.).
     Odpowiedź 2xx = sukces; inna / wyjątek sieci = .kt-srv. */
  function sendForm(formData) {
    if (!KT_CFG.endpoint) {
      /* TRYB PROTOTYPU: symulacja sukcesu */
      return new Promise(function (res) { setTimeout(res, 600); });
    }
    return fetch(KT_CFG.endpoint, { method: 'POST', body: formData })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); });
  }

  /* ── 3. formularz ── */
  var frame = document.querySelector('.kt-frame');
  var form = document.querySelector('.kt-form');
  var sendBtn = form.querySelector('.kt-send');
  var srvErr = form.querySelector('.kt-srv');
  var t0 = Date.now();
  var busy = false;

  function setErr(wrap, on) {
    wrap.classList.toggle('err', on);
    var input = wrap.querySelector('input, textarea');
    if (input) input.setAttribute('aria-invalid', on ? 'true' : 'false');
  }
  var fName = form.querySelector('[data-f="name"]');
  var fMail = form.querySelector('[data-f="email"]');
  var fMsg = form.querySelector('[data-f="msg"]');
  [fName, fMail, fMsg].forEach(function (w) {
    w.querySelector('input, textarea').addEventListener('input', function () { setErr(w, false); });
  });

  /* chipsy: klasa .sel (niezależnie od :has) */
  form.querySelectorAll('.kt-chip input').forEach(function (r) {
    r.addEventListener('change', function () {
      form.querySelectorAll('.kt-chip').forEach(function (c) { c.classList.remove('sel'); });
      r.closest('.kt-chip').classList.add('sel');
    });
  });

  function setBusy(on) {
    busy = on;
    sendBtn.disabled = on;
    form.setAttribute('aria-busy', on ? 'true' : 'false');
    sendBtn.querySelector('.lb').textContent = on ? 'Wysyłam…' : 'Wyślij wiadomość';
  }
  function showDone() {
    frame.classList.add('sent');
    var h = frame.querySelector('.kt-done h3');
    if (h) h.focus({ preventScroll: true });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (busy) return;

    var okName = form.querySelector('#kt-name').value.trim().length > 0;
    var okMail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.querySelector('#kt-email').value.trim());
    var okMsg = form.querySelector('#kt-msg').value.trim().length >= 10;
    setErr(fName, !okName); setErr(fMail, !okMail); setErr(fMsg, !okMsg);
    if (!okName || !okMail || !okMsg) {
      var firstErr = form.querySelector('.err input, .err textarea');
      if (firstErr) firstErr.focus();
      return;
    }

    /* antyspam po stronie klienta: honeypot lub submit < minFillMs
       → udawaj sukces, nic nie wysyłaj (serwer i tak powtarza test) */
    var trap = form.querySelector('[name="firma"]').value !== '' ||
      (Date.now() - t0 < KT_CFG.minFillMs);
    if (trap) { showDone(); return; }

    srvErr.hidden = true;
    setBusy(true);
    var fd = new FormData(form);
    fd.append('elapsed', String(Date.now() - t0));
    sendForm(fd).then(function () {
      setBusy(false);
      showDone();
    }, function () {
      setBusy(false);
      srvErr.hidden = false;
    });
  });

  frame.querySelector('.kt-done .again').addEventListener('click', function () {
    form.reset();
    form.querySelectorAll('.kt-chip').forEach(function (c) { c.classList.remove('sel'); });
    [fName, fMail, fMsg].forEach(function (w) { setErr(w, false); });
    srvErr.hidden = true;
    frame.classList.remove('sent');
    t0 = Date.now();
    form.querySelector('#kt-name').focus({ preventScroll: true });
  });

  /* ── do góry — W ASTRO: podmień na globalny handler lenis.scrollTo ── */
  document.querySelector('.kt-fleg .up').addEventListener('click', function (e) {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: MOTION_OK ? 'smooth' : 'auto' });
  });

  /* ── 4. wejścia ── */
  var ENTER_ELS = '.kt-lead, .kt-ghost, .kt-side, .kt-frame, .kt-footer';
  if (!window.gsap || !window.ScrollTrigger || STATIC) {
    document.querySelectorAll(ENTER_ELS).forEach(function (el) { el.classList.add('on'); });
    return;
  }
  gsap.registerPlugin(ScrollTrigger);
  if (!MOTION_OK) return; /* CSS nie ukrywa niczego przy reduce */

  ScrollTrigger.create({ trigger: '.kt-lead', start: KT_CFG.leadStart, once: true,
    toggleClass: { targets: '.kt-lead, .kt-ghost', className: 'on' } });
  ScrollTrigger.create({ trigger: '.kt-side', start: KT_CFG.sideStart, once: true,
    toggleClass: { targets: '.kt-side', className: 'on' } });
  ScrollTrigger.create({ trigger: '.kt-frame', start: KT_CFG.frameStart, once: true,
    toggleClass: { targets: '.kt-frame', className: 'on' } });
  ScrollTrigger.create({ trigger: '.kt-footer', start: KT_CFG.footStart, once: true,
    toggleClass: { targets: '.kt-footer', className: 'on' } });

  /* desktop: leniwy parallax ghosta (sam transform) */
  gsap.matchMedia().add(KT_CFG.desktop, function () {
    gsap.fromTo('.kt-ghost', { y: KT_CFG.ghostY[0] }, {
      y: KT_CFG.ghostY[1], ease: 'none',
      scrollTrigger: { trigger: '#kontakt', start: 'top bottom', end: 'bottom top', scrub: true }
    });
  });
})();
