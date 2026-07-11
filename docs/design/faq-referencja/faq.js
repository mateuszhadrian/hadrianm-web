/* ════════════════════════════════════════════════════════════════
   FAQ (05) — wariant A "Rejestr" · choreografia
   Konfiguracja w FQ_CFG. Wymaga: gsap + ScrollTrigger (globalne
   z CDN w podglądzie; w Astro — importy, patrz README pkt 2).

   Akordeon: klasy sterują stanem (kolory/plus/aria), wysokość
   rozwija tween height 0 ↔ auto (pomiar tylko przy kliknięciu,
   po tweenie clearProps — wraca kontrola CSS). Jedno pytanie
   naraz, wszystkie zamknięte na starcie.

   Wejścia (desktop i mobile identycznie, budżet jak Oferta mobile):
   3 × ScrollTrigger once → toggleClass .on; animuje CSS transition,
   stagger wierszy = transition-delay (--d w CSS).
   Desktop dodatkowo: leniwy parallax ghosta "FAQ" (scrub, transform).

   Tryby statyczne (wszystko widoczne, rozwinięte, bez animacji):
   brak JS · prefers-reduced-motion: reduce (akordeon działa bez
   tweenów) · body.fq-static ustawione PRZED tym skryptem.
   ════════════════════════════════════════════════════════════════ */
(function () {
  var FQ_CFG = {
    breakpoint: '(min-width: 861px)',
    openDur: 0.55, closeDur: 0.45,
    headStart: 'top 84%', listStart: 'top 80%', ctaStart: 'top 92%',
    ghostY: [-34, 44]
  };

  var MOTION_OK = window.matchMedia('(prefers-reduced-motion: no-preference)').matches;
  var STATIC = document.body.classList.contains('fq-static');
  var items = Array.prototype.slice.call(document.querySelectorAll('.fq-item'));

  /* ── tryb statyczny: nic nie ruszaj (CSS trzyma wszystko otwarte) ── */
  if (STATIC) return;

  /* ── akordeon ── */
  function setOpen(item, open) {
    var a = item.querySelector('.fq-a');
    var animate = !!window.gsap && MOTION_OK;
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

  /* zmiana wysokości strony → przelicz pozycje triggerów (Lenis sam nadąży) */
  function refresh() {
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  }

  items.forEach(function (item) {
    var btn = item.querySelector('.fq-q');
    btn.setAttribute('aria-expanded', 'false'); /* markup startuje z "true" = stan bez JS */
    btn.addEventListener('click', function () {
      var wasOpen = item.classList.contains('open');
      items.forEach(function (o) {
        if (o !== item && o.classList.contains('open')) setOpen(o, false);
      });
      setOpen(item, !wasOpen);
    });
  });

  /* ── wejścia ── */
  if (!window.gsap || !window.ScrollTrigger) {
    /* GSAP niedostępny: pokaż wszystko, akordeon działa bez tweenów */
    document.querySelectorAll('.fq-head, .fq-ghost, .fq-list, .fq-cta').forEach(function (el) { el.classList.add('on'); });
    return;
  }
  gsap.registerPlugin(ScrollTrigger);
  if (!MOTION_OK) return; /* reduced motion: CSS nie chowa niczego */

  ScrollTrigger.create({ trigger: '.fq-head', start: FQ_CFG.headStart, once: true,
    toggleClass: { targets: '.fq-head, .fq-ghost', className: 'on' } });
  ScrollTrigger.create({ trigger: '.fq-list', start: FQ_CFG.listStart, once: true,
    toggleClass: { targets: '.fq-list', className: 'on' } });
  ScrollTrigger.create({ trigger: '.fq-cta', start: FQ_CFG.ctaStart, once: true,
    toggleClass: { targets: '.fq-cta', className: 'on' } });

  /* desktop: leniwy parallax ghosta (sam transform, scrub) */
  gsap.matchMedia().add(FQ_CFG.breakpoint, function () {
    gsap.fromTo('.fq-ghost', { y: FQ_CFG.ghostY[0] }, {
      y: FQ_CFG.ghostY[1], ease: 'none',
      scrollTrigger: { trigger: '#faq', start: 'top bottom', end: 'bottom top', scrub: true }
    });
  });
})();
