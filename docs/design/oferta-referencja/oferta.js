/* ════════════════════════════════════════════════════════════════
   OFERTA — wariant A (Nić + czytanie scrollem) + pakiety P4
   GSAP ScrollTrigger (referencja produkcyjna)

   Desktop (≥861px):
   · intro — słowa zapalają się (opacity) pod scrubem, jeden tween ze staggerem
   · nić — scaleY pod scrubem (sam transform, zero rysowania SVG)
   · kroki — toggleClass (animuje CSS transition), węzły zapalają się na progu
   · cyfry-ghost — delikatny parallax scrubem; progres fixed 01–05

   Mobile (<861px) — wersja lekka (iPhone SE 2020 i starsze budżetowce):
   · zapalanie ZDANIAMI (kilka spanów zamiast ~80), nić = jeden scaleY,
     kroki i węzły toggleClass — zero filtrów, zero pinów, zero measure w rAF

   Pakiety: bez animacji scrollowych (tylko hover w CSS).
   Tryb statyczny (wszystko widoczne, zero GSAP): brak JS,
   prefers-reduced-motion LUB body.of-static (ustaw PRZED init —
   np. globalny mechanizm low-power).

   W Astro zamień CDN-y na:
     import gsap from 'gsap';
     import ScrollTrigger from 'gsap/ScrollTrigger';
   Wartości ustalone w prototypie — patrz OF_CFG poniżej.
   ════════════════════════════════════════════════════════════════ */
gsap.registerPlugin(ScrollTrigger);

/* ── konfiguracja (na sztywno, dobrana w prototypie) ── */
const OF_CFG = {
  bp: 861,                                             /* breakpoint desktop/mobile (spójny z Dla kogo) */
  read:      { start: 'top 58%', end: 'bottom 44%', scrub: 0.45, duration: 1.6, span: 8 },
  readMob:   { start: 'top 70%', end: 'bottom 52%', scrub: 0.4,  duration: 1.4, span: 6 },
  thread:    { start: 'top 52%', end: 'bottom 82%', scrub: 0.5 },
  threadMob: { start: 'top 60%', end: 'bottom 88%', scrub: 0.4 },
  stepOn:  'top 76%',  stepLit: 'top 56%',             /* progi krok: reveal / zapłon węzła (desktop) */
  stepOnMob: 'top 84%', stepLitMob: 'top 66%',         /* progi krok (mobile) */
  ghostParallax: 70,                                   /* ± px jazdy cyfr-ghost (desktop) */
};

(function () {
  const MOTION = '(prefers-reduced-motion: no-preference)';
  const MQ_DESK = '(min-width: ' + OF_CFG.bp + 'px)';
  const MQ_MOB = '(max-width: ' + (OF_CFG.bp - 0.02) + 'px)';

  /* tryb statyczny: reduced motion lub flaga low-power ustawiona z zewnątrz */
  if (!window.matchMedia(MOTION).matches) return;
  if (document.body.classList.contains('of-static')) return;

  /* ── podział tekstu intro: desktop = słowa, mobile = zdania ──
     (element .acc — fraza akcentowa — zachowuje klasę na swoich spanach) */
  function splitLit(mode) {
    document.querySelectorAll('#oferta .of-lit').forEach(function (p) {
      const nodes = Array.prototype.slice.call(p.childNodes);
      p.textContent = '';
      function push(txt, acc) {
        if (!txt) return;
        const s = document.createElement('span');
        s.className = 'of-w' + (acc ? ' acc' : '');
        s.textContent = txt;
        p.appendChild(s);
      }
      nodes.forEach(function (nd) {
        const isEl = nd.nodeType === 1;
        const text = nd.textContent;
        if (mode === 'w') {
          text.split(/\s+/).forEach(function (t) {
            if (!t) return;
            push(t, isEl);
            p.appendChild(document.createTextNode(' '));
          });
        } else {
          if (isEl) { push(text, true); return; }
          const parts = text.split('. ');
          parts.forEach(function (t, i) {
            if (!t) return;
            push(i < parts.length - 1 ? t + '. ' : t, false);
          });
        }
      });
    });
  }
  splitLit(window.matchMedia(MQ_MOB).matches ? 's' : 'w');

  /* ── wspólne: kroki + węzły + endcap + hint (toggleClass, animuje CSS) ── */
  function stepTriggers(isMobile) {
    document.querySelectorAll('.of-step').forEach(function (step) {
      ScrollTrigger.create({
        trigger: step, start: isMobile ? OF_CFG.stepOnMob : OF_CFG.stepOn,
        toggleClass: { targets: step, className: 'on' }
      });
      ScrollTrigger.create({
        trigger: step, start: isMobile ? OF_CFG.stepLitMob : OF_CFG.stepLit,
        toggleClass: { targets: step, className: 'lit' }
      });
    });
    ScrollTrigger.create({ trigger: '.of-endcap', start: 'top 88%',
      toggleClass: { targets: '.of-endcap', className: 'on' } });
    ScrollTrigger.create({ trigger: '.of-introhint', start: 'top 92%',
      toggleClass: { targets: '.of-introhint', className: 'on' } });
  }

  const mm = gsap.matchMedia();

  /* ═══ DESKTOP ═══ */
  mm.add(MQ_DESK, function () {
    const words = gsap.utils.toArray('#oferta .of-lit .of-w');
    const R = OF_CFG.read;

    /* intro: czytanie słowo po słowie */
    gsap.to(words, {
      opacity: 1, ease: 'none', duration: R.duration,
      stagger: { each: R.span / Math.max(words.length, 1) },
      scrollTrigger: { trigger: '.of-intro', start: R.start, end: R.end, scrub: R.scrub }
    });

    /* ghost „oferta": leniwy parallax */
    gsap.fromTo('.of-ghost', { y: 0 }, {
      y: 90, ease: 'none',
      scrollTrigger: { trigger: '.of-intro', start: 'top bottom', end: 'bottom top', scrub: true }
    });

    /* nić: scaleY pod scrubem */
    gsap.fromTo('.of-fill', { scaleY: 0 }, {
      scaleY: 1, ease: 'none',
      scrollTrigger: { trigger: '.of-proces', start: OF_CFG.thread.start, end: OF_CFG.thread.end, scrub: OF_CFG.thread.scrub }
    });

    /* cyfry-ghost: parallax */
    gsap.utils.toArray('.of-ghostd').forEach(function (g) {
      gsap.fromTo(g, { y: OF_CFG.ghostParallax }, {
        y: -OF_CFG.ghostParallax, ease: 'none',
        scrollTrigger: { trigger: g.parentNode, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });

    stepTriggers(false);

    /* progres fixed: widoczny w trakcie procesu, ticki wg aktywnego kroku */
    const count = document.querySelector('.of-progress .pcount');
    const ticks = Array.prototype.slice.call(document.querySelectorAll('.of-progress .ticks i'));
    function setStep(i) {
      count.textContent = '0' + (i + 1) + ' / 05';
      ticks.forEach(function (el, k) { el.classList.toggle('on', k <= i); });
    }
    setStep(0);
    ScrollTrigger.create({
      trigger: '.of-proces', start: 'top 55%', end: 'bottom 65%',
      onToggle: function (self) { document.body.classList.toggle('of-prog-on', self.isActive); }
    });
    document.querySelectorAll('.of-step').forEach(function (step, i) {
      ScrollTrigger.create({
        trigger: step, start: OF_CFG.stepLit,
        onEnter: function () { setStep(i); },
        onLeaveBack: function () { setStep(Math.max(0, i - 1)); }
      });
    });

    return function () { document.body.classList.remove('of-prog-on'); };
  });

  /* ═══ MOBILE — lekki ═══ */
  mm.add(MQ_MOB, function () {
    const sents = gsap.utils.toArray('#oferta .of-lit .of-w');
    const R = OF_CFG.readMob;

    /* intro: zapalanie zdaniami (kilka elementów) */
    gsap.to(sents, {
      opacity: 1, ease: 'none', duration: R.duration,
      stagger: { each: R.span / Math.max(sents.length, 1) },
      scrollTrigger: { trigger: '.of-intro', start: R.start, end: R.end, scrub: R.scrub }
    });

    /* nić: jeden transform */
    gsap.fromTo('.of-fill', { scaleY: 0 }, {
      scaleY: 1, ease: 'none',
      scrollTrigger: { trigger: '.of-proces', start: OF_CFG.threadMob.start, end: OF_CFG.threadMob.end, scrub: OF_CFG.threadMob.scrub }
    });

    stepTriggers(true);
  });
})();
