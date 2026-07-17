/* ════════════════════════════════════════════════════════════════
   FAQ — PODSTRONA (30 pytań) · akordeon + wyszukiwarka + wejścia
   Konfiguracja w FQ_CFG. Wymaga: gsap + ScrollTrigger (globalne
   z CDN w podglądzie; w Astro — importy, patrz README pkt 2).

   Akordeon: klasy sterują stanem (kolory/plus/aria), wysokość
   rozwija tween GSAP height 0 ↔ auto (pomiar tylko przy kliknięciu,
   po tweenie clearProps). Na długiej liście pytania działają
   NIEZALEŻNIE (może być otwartych kilka) — dzięki temu zamknięcie
   pytania powyżej viewportu nie szarpie scrollem.

   Wyszukiwarka: 100% frontend. Filtr live po pytaniu + odpowiedzi,
   odporny na polskie znaki (norm()), podświetlanie trafień w treści
   pytania (<mark>), licznik (aria-live), czyszczenie (× / Esc).

   Wejścia (desktop i mobile jednakowo lekkie — budżet jak Oferta
   mobile): ScrollTrigger.batch reveluje wiersze partiami w miarę
   wchodzenia w viewport (stagger = --d), więc na 30 pytań nigdy nie
   animuje się wszystko naraz. Hero + CTA: proste toggleClass.
   Desktop dodatkowo: leniwy parallax ghosta "FAQ".

   Tryby statyczne (wszystko widoczne, rozwinięte, bez animacji):
   brak JS · prefers-reduced-motion: reduce (akordeon i search dalej
   działają) · body.fq-static ustawione PRZED tym skryptem.
   ════════════════════════════════════════════════════════════════ */
(function () {
  var FQ_CFG = {
    breakpoint: '(min-width: 861px)',
    openDur: 0.55, closeDur: 0.45,
    batchStart: 'top 94%', ctaStart: 'top 94%',
    batchStagger: 0.05, ghostY: [-30, 46]
  };

  var MOTION_OK = window.matchMedia('(prefers-reduced-motion: no-preference)').matches;
  var STATIC = document.body.classList.contains('fq-static');
  var items = Array.prototype.slice.call(document.querySelectorAll('.fq-item'));

  function refresh() { if (window.ScrollTrigger) ScrollTrigger.refresh(); }

  /* ── akordeon (niezależne toggle) ── */
  function setOpen(item, open) {
    var a = item.querySelector('.fq-a');
    var animate = !!window.gsap && MOTION_OK && !STATIC;
    if (animate) {
      gsap.killTweensOf(a);
      if (!open) gsap.set(a, { height: a.offsetHeight }); /* zamrożenie przed zdjęciem klasy */
    }
    item.classList.toggle('open', open);
    item.querySelector('.fq-q').setAttribute('aria-expanded', open ? 'true' : 'false');
    if (!animate) return;
    if (open) {
      var startH = a.style.height ? a.offsetHeight : 0; /* przerwany tween — start z miejsca */
      gsap.fromTo(a, { height: startH }, { height: 'auto', duration: FQ_CFG.openDur, ease: 'power3.out',
        onComplete: function () { gsap.set(a, { clearProps: 'height' }); refresh(); } });
    } else {
      gsap.to(a, { height: 0, duration: FQ_CFG.closeDur, ease: 'power3.inOut',
        onComplete: function () { gsap.set(a, { clearProps: 'height' }); refresh(); } });
    }
  }

  if (STATIC) return; /* low-power: CSS trzyma wszystko otwarte */

  items.forEach(function (item) {
    var btn = item.querySelector('.fq-q');
    btn.setAttribute('aria-expanded', 'false'); /* markup startuje z "true" = stan bez JS */
    btn.addEventListener('click', function () { setOpen(item, !item.classList.contains('open')); });
  });

  /* ── wyszukiwarka (100% frontend) ── */
  var input = document.getElementById('fq-search-input');
  if (input) {
    var clearBtn = document.querySelector('.fq-clear');
    var countEl = document.getElementById('fq-search-count');
    var noRes = document.getElementById('fq-noresults');
    var endline = document.getElementById('fq-endline');
    var PL = { 'ą':'a','ć':'c','ę':'e','ł':'l','ń':'n','ó':'o','ś':'s','ż':'z','ź':'z' };
    function norm(s) { return s.toLowerCase().replace(/[ąćęłńóśżź]/g, function (c) { return PL[c]; }); }
    function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
    function highlight(text, nq) {
      if (!nq) return esc(text);
      var nText = norm(text), out = '', idx = 0, pos;
      while ((pos = nText.indexOf(nq, idx)) !== -1) {
        out += esc(text.slice(idx, pos)) + '<mark class="fq-hl">' + esc(text.slice(pos, pos + nq.length)) + '</mark>';
        idx = pos + nq.length;
      }
      return out + esc(text.slice(idx));
    }
    var records = items.map(function (item) {
      var qtEl = item.querySelector('.qt');
      var qText = qtEl.textContent;
      var aEl = item.querySelector('.fq-a p');
      return { item: item, qtEl: qtEl, qText: qText, hay: norm(qText + ' ' + (aEl ? aEl.textContent : '')) };
    });
    function applyFilter() {
      var raw = input.value.trim(), nq = norm(raw), shown = 0;
      records.forEach(function (r) {
        var match = !nq || r.hay.indexOf(nq) !== -1;
        r.item.classList.toggle('fq-hidden', !match);
        if (match) { shown++; r.item.classList.add('on'); r.qtEl.innerHTML = highlight(r.qText, nq); }
      });
      clearBtn.hidden = !raw;
      countEl.textContent = raw ? (shown + ' z ' + records.length + ' pytań') : (records.length + ' pytań');
      countEl.classList.toggle('is-filtered', !!raw);
      noRes.hidden = shown !== 0;
      noRes.querySelector('.q').textContent = '„' + raw + '”';
      if (endline) endline.style.display = shown === 0 ? 'none' : '';
      refresh();
    }
    input.addEventListener('input', applyFilter);
    input.addEventListener('keydown', function (e) { if (e.key === 'Escape') { input.value = ''; applyFilter(); } });
    clearBtn.addEventListener('click', function () { input.value = ''; applyFilter(); input.focus(); });
  }

  /* ── wejścia ── */
  function showAll() {
    document.querySelectorAll('.fq-rev, .fq-ghost, .fq-item, .fq-cta').forEach(function (el) { el.classList.add('on'); });
  }
  if (!window.gsap || !window.ScrollTrigger) { showAll(); return; } /* brak GSAP: pokaż wszystko */
  gsap.registerPlugin(ScrollTrigger);
  if (!MOTION_OK) return; /* reduced motion: CSS nie chowa niczego */

  /* hero (nad zakładką) — pokaż od razu */
  requestAnimationFrame(function () {
    document.querySelectorAll('.fq-hero .fq-rev, .fq-ghost').forEach(function (el) { el.classList.add('on'); });
  });

  /* rejestr — partiami; stagger tylko w obrębie partii */
  ScrollTrigger.batch('.fq-item', {
    start: FQ_CFG.batchStart,
    onEnter: function (batch) {
      batch.forEach(function (el, i) { el.style.setProperty('--d', (i * FQ_CFG.batchStagger) + 's'); el.classList.add('on'); });
    }
  });

  ScrollTrigger.create({ trigger: '.fq-cta', start: FQ_CFG.ctaStart, once: true,
    toggleClass: { targets: '.fq-cta', className: 'on' } });

  /* desktop: leniwy parallax ghosta */
  gsap.matchMedia().add(FQ_CFG.breakpoint, function () {
    gsap.fromTo('.fq-ghost', { y: FQ_CFG.ghostY[0] }, {
      y: FQ_CFG.ghostY[1], ease: 'none',
      scrollTrigger: { trigger: '.fq-hero', start: 'top top', end: 'bottom top', scrub: true }
    });
  });
})();
