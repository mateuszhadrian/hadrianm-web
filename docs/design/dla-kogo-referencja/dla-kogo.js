/* ════════════════════════════════════════════════════════════════
   DLA KOGO — „Talia kart" · GSAP ScrollTrigger (referencja produkcyjna)

   Desktop (≥861px): sticky scena + scrub — karty-dowody wskakują
   kolejno na stos (transform + rotacja), poprzednie przygasają,
   finał = wachlarz + CTA.
   Mobile (<861px): zwykły flow + reveale; okno = 2 gotowe obrazki
   (rozmycie wypieczone w PNG + ostry) — crossfade WYŁĄCZNIE
   opacity/transform, przeglądarka nie liczy żadnego blura.
   Reduced motion: układ statyczny (body.dk-static).

   Wartości ustalone w prototypie — patrz DK_CFG poniżej
   oraz zmienne CSS w :root (dla-kogo.css).
   ════════════════════════════════════════════════════════════════ */
gsap.registerPlugin(ScrollTrigger);

/* ── konfiguracja (na sztywno, dobrana w prototypie) ── */
const DK_CFG = {
  scrub: 0.6,                          /* płynność scrubu (sekundy doganiania) */
  snap: true,                          /* dociąganie do punktów po zatrzymaniu */
  snapPoints: [0.04, 0.30, 0.58, 0.94],/* progress: intro / karta 1 / 2 / 3+finał */
  fan: 1.4,                            /* rozrzut wachlarza w finale (mnożnik) */
};

const $  = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

/* ── stemplowanie mocków z <template> ── */
function stampMock(kind) {
  const node = document.getElementById('tpl-' + kind).content.firstElementChild.cloneNode(true);
  const grid = node.querySelector('.mkt-grid');
  if (grid) for (let i = 0; i < 28; i++) {
    const c = document.createElement('span');
    if (i === 9) { c.className = 'sel'; c.textContent = '14'; }
    else if ((i * 7) % 5 === 0) { c.className = 'alt'; }
    grid.appendChild(c);
  }
  return node;
}
function buildWin(kind, label, live) {
  const w = document.getElementById('tpl-win').content.firstElementChild.cloneNode(true);
  w.querySelector('.mk-fit').appendChild(stampMock(kind));
  if (label) { const t = document.createElement('div'); t.className = 'mk-tag'; t.textContent = label; w.appendChild(t); }
  if (live) w.classList.add('mk-anim');   /* .mk-anim = żywe animacje wewnątrz mocka (marquee, kursor) */
  return w;
}
$$('.mk-slot').forEach((slot) => {
  slot.appendChild(buildWin(slot.dataset.mock, slot.dataset.label || '', slot.dataset.live === '1'));
});

/* kanwa mocka ma stałe 880×574 — skalujemy ją do szerokości okna */
function fitMocks() {
  $$('.mk-body').forEach((b) => {
    const f = b.querySelector('.mk-fit');
    if (f && b.clientWidth > 0) f.style.transform = 'scale(' + (b.clientWidth / 880) + ')';
  });
}
fitMocks();
window.addEventListener('resize', fitMocks);

const els = {
  section:  $('#dlakogo'),
  stage:    $('.dk-stage'),
  ghost:    $('.dk-ghostintro'),
  digits:   $$('.dk-digit'),
  backs:    $('.dk-backs'),
  cards:    $$('.dk-card'),
  cap:      $('.dk-cap'),
  captext:  $('.dk-cap .captext'),
  e1:       $('.bl-e1'),
  e2:       $('.bl-e2'),
  chapters: $$('.dk-ch'),
  ticks:    $$('.dk-progress .ticks i'),
  pcount:   $('.dk-progress .pcount'),
  tag:      $('.dk-tag'),
};

const CAPS = ['DOWÓD 01 / 03 — NA STOLE', 'DOWÓD 02 / 03 — NA STOLE', 'DOWÓD 03 / 03 — KOMPLET'];

/* progres 01–04 + podpis pod stosem */
let stageIdx = -1;
function setStage(i) {
  if (i === stageIdx) return;
  stageIdx = i;
  els.ticks.forEach((t, k) => t.classList.toggle('on', k === i));
  els.pcount.textContent = String(i + 1).padStart(2, '0') + ' / 04';
  if (i > 0) els.captext.textContent = CAPS[i - 1];
}

/* ── DESKTOP: przypięta scena + scrub ── */
function buildDesktop() {
  const F = DK_CFG.fan;
  const [c1, c2, c3] = els.cards;
  const chs = els.chapters;

  gsap.set(chs, { yPercent: -50 });
  gsap.set(chs[0], { autoAlpha: 1, y: 0 });
  gsap.set([chs[1], chs[2], chs[3]], { autoAlpha: 0 });
  gsap.set(els.cards, { autoAlpha: 0, xPercent: 64, yPercent: 56, rotation: 16, filter: 'blur(10px)' });
  gsap.set(els.digits, { autoAlpha: 0 });
  gsap.set(els.backs, { autoAlpha: 0.65, filter: 'blur(5px)' });
  gsap.set(els.cap, { autoAlpha: 0 });
  gsap.set(els.e1, { opacity: 0.38 });
  gsap.set(els.e2, { opacity: 0.20 });

  const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

  /* intro schodzi, talia znika, mgła narasta */
  tl.to(chs[0], { autoAlpha: 0, y: -44, duration: 0.05, ease: 'power2.in' }, 0.10);
  tl.to(els.ghost, { autoAlpha: 0, duration: 0.05 }, 0.10);
  tl.to(els.backs, { autoAlpha: 0, scale: 0.96, duration: 0.06, ease: 'power1.inOut' }, 0.11);
  tl.to(els.e1, { opacity: 0.85, duration: 0.25, ease: 'power1.inOut' }, 0.10);
  tl.to(els.e2, { opacity: 0.65, duration: 0.20, ease: 'power1.inOut' }, 0.14);

  /* karta 1 — efekt WOW */
  tl.to(c1, { autoAlpha: 1, xPercent: 0, yPercent: 0, rotation: -2, filter: 'blur(0px)', duration: 0.16 }, 0.12);
  tl.fromTo(els.digits[0], { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.07 }, 0.15);
  tl.fromTo(chs[1], { autoAlpha: 0, y: 52 }, { autoAlpha: 1, y: 0, duration: 0.055 }, 0.17);
  tl.to(els.cap, { autoAlpha: 1, duration: 0.04 }, 0.20);

  /* karta 2 — CMS przykrywa */
  tl.to(chs[1], { autoAlpha: 0, y: -44, duration: 0.05, ease: 'power2.in' }, 0.34);
  tl.to(els.digits[0], { autoAlpha: 0, duration: 0.05 }, 0.35);
  tl.to(c1, { xPercent: -7.4, yPercent: 7.2, rotation: -6.5, opacity: 0.5, filter: 'blur(1px) brightness(0.8) saturate(0.7)', duration: 0.08, ease: 'power1.inOut' }, 0.36);
  tl.to(c2, { autoAlpha: 1, xPercent: 0, yPercent: 0, rotation: 2.5, filter: 'blur(0px)', duration: 0.16 }, 0.38);
  tl.fromTo(els.digits[1], { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.07 }, 0.40);
  tl.fromTo(chs[2], { autoAlpha: 0, y: 52 }, { autoAlpha: 1, y: 0, duration: 0.055 }, 0.43);

  /* karta 3 — narzędzia + CTA */
  tl.to(chs[2], { autoAlpha: 0, y: -44, duration: 0.05, ease: 'power2.in' }, 0.62);
  tl.to(els.digits[1], { autoAlpha: 0, duration: 0.05 }, 0.63);
  tl.to(c2, { xPercent: 8, yPercent: 4.5, rotation: 4.5, opacity: 0.55, filter: 'blur(1px) brightness(0.8) saturate(0.7)', duration: 0.08, ease: 'power1.inOut' }, 0.64);
  tl.to(c3, { autoAlpha: 1, xPercent: 0, yPercent: 0, rotation: -1.5, filter: 'blur(0px)', duration: 0.16 }, 0.66);
  tl.fromTo(els.digits[2], { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.07 }, 0.68);
  tl.fromTo(chs[3], { autoAlpha: 0, y: 52 }, { autoAlpha: 1, y: 0, duration: 0.055 }, 0.71);
  tl.fromTo(chs[3].querySelector('.dk-cta'), { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.05 }, 0.75);

  /* finał — wachlarz */
  tl.to(c1, { xPercent: -18.3 * F, yPercent: 10.2 * F, rotation: -9 * F, duration: 0.09, ease: 'power1.inOut' }, 0.88);
  tl.to(c2, { xPercent: 14.9 * F, yPercent: 6.4 * F, rotation: 6.5 * F, duration: 0.09, ease: 'power1.inOut' }, 0.88);
  tl.to(c3, { yPercent: -1.6, rotation: -1.5, duration: 0.09, ease: 'power1.inOut' }, 0.88);
  tl.to([els.e1, els.e2], { opacity: 0.30, duration: 0.10, ease: 'power1.inOut' }, 0.90);

  ScrollTrigger.create({
    trigger: els.section,
    start: 'top top',
    end: 'bottom bottom',
    scrub: DK_CFG.scrub,
    animation: tl,
    snap: DK_CFG.snap ? {
      snapTo: DK_CFG.snapPoints,
      duration: { min: 0.2, max: 0.55 },
      delay: 0.08,
      ease: 'power1.inOut',
    } : false,
    onUpdate(self) {
      const p = self.progress;
      setStage(p < 0.32 ? 0 : p < 0.60 ? 1 : p < 0.86 ? 2 : 3);
    },
  });
}

/* ── MOBILE: flow + reveale; crossfade rozmyta→ostra (tylko opacity/transform) ── */
function buildMobile() {
  /* ghost „dla kogo": dryf scrubem (sam transform — tanio) */
  gsap.to(els.ghost, {
    yPercent: 14, xPercent: -4, ease: 'none',
    scrollTrigger: { trigger: els.stage, start: 'top bottom', end: 'bottom top', scrub: true },
  });

  gsap.fromTo(els.tag, { autoAlpha: 0, x: -26 }, {
    autoAlpha: 1, x: 0, duration: 0.6, ease: 'power3.out',
    scrollTrigger: { trigger: els.stage, start: 'top 78%', toggleActions: 'play none none reverse' },
  });

  els.chapters.forEach((block) => {
    const ch    = Number(block.dataset.ch);
    const tag   = block.querySelector('.ch-tag');
    const rest  = ['.ch-head', '.ch-para', '.dk-cta'].map((s) => block.querySelector(s)).filter(Boolean);
    const win   = block.querySelector('.dkm-win');
    const digit = block.querySelector('.dkm-digit');
    const tl = gsap.timeline({
      defaults: { ease: 'power3.out' },
      scrollTrigger: { trigger: block, start: 'top 84%', toggleActions: 'play none none reverse' },
    });
    if (win) {
      const sharp = win.querySelector('.lay-sharp');
      const blur  = win.querySelector('.lay-blur');
      const rot   = ch === 2 ? 1.5 : -1.5;
      tl.fromTo(win, { autoAlpha: 0, y: 38, rotation: rot * 2.8 }, { autoAlpha: 1, y: 0, rotation: rot, duration: 0.7 }, 0);
      tl.fromTo(blur,  { opacity: 0.92 }, { opacity: 0, duration: 1.0, ease: 'power1.inOut' }, 0.30);
      tl.fromTo(sharp, { opacity: 0.15 }, { opacity: 1, duration: 1.0, ease: 'power1.inOut' }, 0.30);
    }
    if (digit) tl.fromTo(digit, { autoAlpha: 0, x: 26 }, { autoAlpha: 0.9, x: 0, duration: 0.55 }, 0.12);
    tl.fromTo(tag, { autoAlpha: 0, x: -26 }, { autoAlpha: 1, x: 0, duration: 0.55 }, 0);
    tl.fromTo(rest, { autoAlpha: 0, y: 34 }, { autoAlpha: 1, y: 0, duration: 0.65, stagger: 0.12 }, 0.1);
  });
}

/* ── matchMedia: desktop / mobile / reduced motion ── */
const mm = gsap.matchMedia();
mm.add({
  isDesktop: '(min-width: 861px)',
  isMobile:  '(max-width: 860.98px)',
  motionOK:  '(prefers-reduced-motion: no-preference)',
  reduce:    '(prefers-reduced-motion: reduce)',
}, (ctx) => {
  const { isDesktop, motionOK, reduce } = ctx.conditions;
  if (reduce) {
    document.body.classList.add('dk-static');
    return () => document.body.classList.remove('dk-static');
  }
  fitMocks();
  if (isDesktop && motionOK) buildDesktop();
  if (!isDesktop && motionOK) buildMobile();
});
window.addEventListener('load', () => { fitMocks(); ScrollTrigger.refresh(); });
