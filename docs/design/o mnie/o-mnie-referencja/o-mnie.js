/* ═══════════════════════════════════════════════════════════════════
   O MNIE — „Z mgły" · GSAP ScrollTrigger (eksport referencyjny)

   Desktop (≥861px): sekcja #omnie ma wysokość 440vh, scena .om-stage
   jest sticky; jedna oś czasu scrubowana przez 4 rozdziały + snap.
   Mobile (<861px): zwykły flow; lekkie reveale (transform/opacity),
   dwukierunkowe (toggleActions play/reverse).
   Reduced motion: klasa .om-static → układ statyczny, zero animacji.

   PORT DO ASTRO:
     import gsap from 'gsap';
     import { ScrollTrigger } from 'gsap/ScrollTrigger';
   Po inicjalizacji Lenisa:
     lenis.on('scroll', ScrollTrigger.update);
     gsap.ticker.add((t) => lenis.raf(t * 1000));
     gsap.ticker.lagSmoothing(0);
   Breakpoint 861px musi zgadzać się z @media w o-mnie.css.
   ═══════════════════════════════════════════════════════════════════ */
gsap.registerPlugin(ScrollTrigger);

/* Wartości zamrożone z prototypu (mgła i opacity zdjęcia 04 → w CSS) */
const SCRUB = 1;      // bezwładność scrubu (s)
const SNAP  = true;   // dociąganie do rozdziałów

const $  = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

const els = {
  section:  $('#omnie'),
  stage:    $('.om-stage'),
  ghost:    $('.om-ghost'),
  photoW:   $('.om-photo-wrap'),
  photo:    $('.om-photo'),
  photoMeta:$('.om-photo-meta'),
  ember:    $('.om-ember'),
  e1:       $('.bl-e1'),
  e2:       $('.bl-e2'),
  chapters: $$('.om-ch'),
  final:    $('.om-final'),
  ticks:    $$('.om-progress .ticks i'),
  pcount:   $('.om-progress .pcount'),
  tag:      $('.om-tag'),
};

/* ── progres 01–04 (desktop) ── */
let stageIdx = -1;
function setStage(i) {
  if (i === stageIdx) return;
  stageIdx = i;
  els.ticks.forEach((t, k) => t.classList.toggle('on', k === i));
  els.pcount.textContent = String(i + 1).padStart(2, '0') + ' / 04';
  els.final.classList.toggle('on', i === 3);   // CTA klikalne dopiero w finale
}

/* ═══ DESKTOP: przypięta scena + scrub ═══ */
function buildDesktop() {
  /* pozycje na osi 0–1: wjazd i zejście rozdziałów 01–03 */
  const chIn  = [0.02, 0.31, 0.60];
  const chOut = [0.24, 0.50, 0.80];

  /* stany startowe */
  gsap.set(els.chapters, { yPercent: -50 });               /* pion: środek sceny */
  gsap.set(els.chapters[0], { autoAlpha: 1, y: 0 });
  gsap.set([els.chapters[1], els.chapters[2]], { autoAlpha: 0 });
  gsap.set(els.final, { autoAlpha: 0 });
  gsap.set(els.photoMeta, { autoAlpha: 0 });
  gsap.set(els.photo, { opacity: 0.12, scale: 1.05, xPercent: 5, filter: 'blur(16px)' });
  gsap.set([els.e1, els.e2], { opacity: 0.16 });

  const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

  /* rozdziały 01–03: wjazd z dołu / zejście w górę */
  els.chapters.forEach((ch, i) => {
    if (i > 0) tl.fromTo(ch, { autoAlpha: 0, y: 52 }, { autoAlpha: 1, y: 0, duration: 0.055 }, chIn[i]);
    tl.to(ch, { autoAlpha: 0, y: -44, duration: 0.05, ease: 'power2.in' }, chOut[i]);
  });

  /* portret: wyłonienie z mgły (rozdz. 02→03), potem wycofanie pod finał */
  tl.to(els.photo, { opacity: 1, scale: 1, xPercent: 0, filter: 'blur(0px)', duration: 0.30, ease: 'power1.inOut' }, 0.30);
  tl.fromTo(els.photoMeta, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.05 }, 0.62);
  tl.to(els.photoMeta, { autoAlpha: 0, duration: 0.04, ease: 'power2.in' }, 0.80);
  tl.to(els.photo, { opacity: 0.22, scale: 1.16, filter: 'blur(5px)', duration: 0.11, ease: 'power1.inOut' }, 0.82);

  /* żar: narasta z portretem, wycofuje się w finale */
  tl.to(els.e1, { opacity: 0.85, duration: 0.30, ease: 'power1.inOut' }, 0.30);
  tl.to(els.e2, { opacity: 0.70, duration: 0.26, ease: 'power1.inOut' }, 0.36);
  tl.to([els.e1, els.e2], { opacity: 0.30, duration: 0.12, ease: 'power1.inOut' }, 0.82);

  /* ghost: dryf przez całość + przygaśnięcie w finale */
  tl.to(els.ghost, { xPercent: -11, duration: 1, ease: 'none' }, 0);
  tl.to(els.ghost, { opacity: 0.45, duration: 0.14 }, 0.84);

  /* finał 04: nagłówek → CTA → podpis */
  tl.fromTo(els.final, { autoAlpha: 0, y: 46 }, { autoAlpha: 1, y: 0, duration: 0.08 }, 0.87);
  tl.fromTo(els.final.querySelector('.om-cta'), { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.06 }, 0.91);
  tl.fromTo(els.final.querySelector('.om-sign'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.06 }, 0.93);

  ScrollTrigger.create({
    trigger: els.section,
    start: 'top top',
    end: 'bottom bottom',
    scrub: SCRUB,
    animation: tl,
    snap: SNAP ? {
      snapTo: [0.13, 0.42, 0.71, 0.97],          /* punkty spoczynku rozdziałów */
      duration: { min: 0.2, max: 0.55 },
      delay: 0.08,
      ease: 'power1.inOut',
    } : false,
    onUpdate(self) {
      const p = self.progress;
      setStage(p < 0.30 ? 0 : p < 0.58 ? 1 : p < 0.855 ? 2 : 3);
    },
  });
}

/* ═══ MOBILE: flow + lekkie reveale dwukierunkowe ═══
   Tylko transform/opacity (tanio na telefonach); blur jedynie
   w one-shot wyłonieniu portretu, bez scrubu. */
function buildMobile() {
  gsap.set(els.ember.children, { opacity: 0.55 });

  /* ghost: delikatny dryf scrubem (sam transform) */
  gsap.to(els.ghost, {
    yPercent: 16, xPercent: -5, ease: 'none',
    scrollTrigger: { trigger: els.stage, start: 'top bottom', end: 'bottom top', scrub: true },
  });

  /* tag sekcji: wjazd z lewej */
  gsap.fromTo(els.tag, { autoAlpha: 0, x: -26 }, {
    autoAlpha: 1, x: 0, duration: 0.6, ease: 'power3.out',
    scrollTrigger: { trigger: els.stage, start: 'top 78%', toggleActions: 'play none none reverse' },
  });

  /* rozdziały + finał: kaskada (tag ← z lewej, nagłówek/akapit/CTA ↑ z dołu);
     w finale dodatkowo fade-in zblurowanego portretu w tle */
  [...els.chapters, els.final].forEach((block) => {
    const tag  = block.querySelector('.ch-tag');
    const rest = ['.ch-head', '.ch-para', '.om-cta', '.om-sign']
      .map((s) => block.querySelector(s)).filter(Boolean);
    const tl = gsap.timeline({
      defaults: { ease: 'power3.out' },
      scrollTrigger: { trigger: block, start: 'top 84%', toggleActions: 'play none none reverse' },
    });
    const bg = block.querySelector('.om-final-bg');
    if (bg) tl.fromTo(bg, { opacity: 0 }, { opacity: 1, duration: 1.1, ease: 'power1.inOut' }, 0);
    tl.fromTo(tag, { autoAlpha: 0, x: -26 }, { autoAlpha: 1, x: 0, duration: 0.55 }, 0);
    tl.fromTo(rest, { autoAlpha: 0, y: 34 }, { autoAlpha: 1, y: 0, duration: 0.65, stagger: 0.12 }, 0.1);
  });

  /* portret: jednorazowe wyłonienie z mgły */
  const emerge = gsap.timeline({
    scrollTrigger: { trigger: els.photoW, start: 'top 76%', toggleActions: 'play none none reverse' },
  });
  emerge.fromTo(els.photo,
    { opacity: 0.08, scale: 1.07, filter: 'blur(14px)' },
    { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 1.25, ease: 'power2.out' }, 0);
  emerge.fromTo(els.e1, { opacity: 0.2 }, { opacity: 0.65, duration: 1.1, ease: 'power1.inOut' }, 0);
  emerge.fromTo(els.photoMeta, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.5 }, 0.55);
}

/* ═══ matchMedia: desktop / mobile / reduced motion ═══ */
const mm = gsap.matchMedia();
mm.add({
  isDesktop: '(min-width: 861px)',
  isMobile:  '(max-width: 860.98px)',
  motionOK:  '(prefers-reduced-motion: no-preference)',
  reduce:    '(prefers-reduced-motion: reduce)',
}, (ctx) => {
  const { isDesktop, motionOK, reduce } = ctx.conditions;
  if (reduce) {
    document.body.classList.add('om-static');
    return () => document.body.classList.remove('om-static');
  }
  if (isDesktop && motionOK) buildDesktop();
  if (!isDesktop && motionOK) buildMobile();
});
