// Sekcja „Dla kogo" — animacje scrolla (port dla-kogo.js z referencji
// docs/design/dla-kogo-referencja/; decyzje: docs/analiza-sekcja-dla-kogo.md).
//
// Desktop (≥AUDIENCE_DESKTOP_MIN_PX): sekcja ma wysokość --dklen, scena
// sticky; jedna oś czasu scrubowana — karty-dowody wskakują kolejno na stos
// (transform + rotacja), poprzednie przygasają, finał = wachlarz + CTA;
// snap do punktów spoczynku.
// Mobile: zwykły flow; okno rozdziału = 2 gotowe obrazki (rozmycie wypieczone
// w pliku + ostry) — crossfade WYŁĄCZNIE opacity, przeglądarka nie liczy
// żadnego blura. NIGDY nie animować filter na mobile.
//
// Moduł ładowany DYNAMICZNIE tylko przy prefers-reduced-motion: no-preference
// (bramka w Audience.astro — wzorzec About); przy reduce układ statyczny
// realizuje czysty CSS. Warunek motionOK w matchMedia niżej to pas
// bezpieczeństwa na zmianę preferencji w trakcie sesji (gsap sam rewertuje).
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  AUDIENCE_DESKTOP_MIN_PX,
  AUDIENCE_FAN,
  AUDIENCE_SCRUB,
  AUDIENCE_SNAP_POINTS,
  AUDIENCE_STAGE_THRESHOLDS,
} from "./audience-config";

gsap.registerPlugin(ScrollTrigger);

export function initAudienceScroll(): void {
  const section = document.querySelector<HTMLElement>("#audience");
  if (!section) return;

  const q = (s: string) => section.querySelector<HTMLElement>(s);
  const qa = (s: string) =>
    Array.from(section.querySelectorAll<HTMLElement>(s));

  const els = {
    stage: q(".dk-stage"),
    ghost: q(".dk-ghostintro"),
    digits: qa(".dk-digit"),
    backs: q(".dk-backs"),
    cards: qa(".dk-card"),
    cap: q(".dk-cap"),
    captext: q(".dk-cap .captext"),
    e1: q(".bl-e1"),
    e2: q(".bl-e2"),
    chapters: qa(".dk-ch"),
    ticks: qa(".dk-progress .ticks i"),
    pcount: q(".dk-progress .pcount"),
    tag: q(".dk-tag"),
  };
  if (
    !els.stage ||
    !els.ghost ||
    !els.backs ||
    !els.cap ||
    !els.captext ||
    !els.e1 ||
    !els.e2 ||
    !els.pcount ||
    !els.tag ||
    els.digits.length !== 3 ||
    els.cards.length !== 3 ||
    els.chapters.length !== 4 ||
    els.ticks.length !== 4
  ) {
    return;
  }
  const { stage, ghost, backs, cap, captext, e1, e2, tag } = els;
  const pcount = els.pcount;

  /* Podpisy „DOWÓD x/03" pod stosem — teksty i18n niesie markup
     (data-cap1..3 na .dk-cap), moduł tylko je podmienia. */
  const caps = [cap.dataset.cap1, cap.dataset.cap2, cap.dataset.cap3];

  /* ── progres 01–04 + podpis pod stosem (desktop) ── */
  let stageIdx = -1;
  function setStage(i: number): void {
    if (i === stageIdx) return;
    stageIdx = i;
    els.ticks.forEach((t, k) => t.classList.toggle("on", k === i));
    pcount.textContent = `${String(i + 1).padStart(2, "0")} / 04`;
    /* Wstecz do stanu 0 tekst zostaje na caps[0] (ustawiony przy 1) —
       to poprawny podpis karty 1; zachowanie 1:1 z referencją. */
    if (i > 0) captext.textContent = caps[i - 1] ?? "";
  }

  /* Kanwa mocka ma stałe 880×574 — skalujemy ją do szerokości okna.
     ResizeObserver zamiast nasłuchu resize: łapie też zmianę --dkcw. */
  let mockObserver: ResizeObserver | null = null;
  function fitMocks(): void {
    for (const body of qa(".mk-body")) {
      const fit = body.querySelector<HTMLElement>(".mk-fit");
      if (fit && body.clientWidth > 0) {
        fit.style.transform = `scale(${body.clientWidth / 880})`;
      }
    }
  }

  /* ═══ DESKTOP: przypięta scena + scrub ═══ */
  function buildDesktop(): void {
    fitMocks();
    mockObserver = new ResizeObserver(fitMocks);
    for (const body of qa(".mk-body")) mockObserver.observe(body);

    const F = AUDIENCE_FAN;
    const [c1, c2, c3] = els.cards;
    const chs = els.chapters;

    gsap.set(chs, { yPercent: -50 }); /* pion: środek sceny */
    gsap.set(chs[0], { autoAlpha: 1, y: 0 });
    gsap.set([chs[1], chs[2], chs[3]], { autoAlpha: 0 });
    gsap.set(els.cards, {
      autoAlpha: 0,
      xPercent: 64,
      yPercent: 56,
      rotation: 16,
      filter: "blur(10px)",
    });
    gsap.set(els.digits, { autoAlpha: 0 });
    gsap.set(backs, { autoAlpha: 0.65, filter: "blur(5px)" });
    gsap.set(cap, { autoAlpha: 0 });
    gsap.set(e1, { opacity: 0.38 });
    gsap.set(e2, { opacity: 0.2 });

    const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

    /* intro schodzi, talia znika, mgła narasta */
    tl.to(
      chs[0],
      { autoAlpha: 0, y: -44, duration: 0.05, ease: "power2.in" },
      0.1,
    );
    tl.to(ghost, { autoAlpha: 0, duration: 0.05 }, 0.1);
    tl.to(
      backs,
      { autoAlpha: 0, scale: 0.96, duration: 0.06, ease: "power1.inOut" },
      0.11,
    );
    tl.to(e1, { opacity: 0.85, duration: 0.25, ease: "power1.inOut" }, 0.1);
    tl.to(e2, { opacity: 0.65, duration: 0.2, ease: "power1.inOut" }, 0.14);

    /* karta 1 — efekt WOW */
    tl.to(
      c1,
      {
        autoAlpha: 1,
        xPercent: 0,
        yPercent: 0,
        rotation: -2,
        filter: "blur(0px)",
        duration: 0.16,
      },
      0.12,
    );
    tl.fromTo(
      els.digits[0],
      { autoAlpha: 0, y: 40 },
      { autoAlpha: 1, y: 0, duration: 0.07 },
      0.15,
    );
    tl.fromTo(
      chs[1],
      { autoAlpha: 0, y: 52 },
      { autoAlpha: 1, y: 0, duration: 0.055 },
      0.17,
    );
    tl.to(cap, { autoAlpha: 1, duration: 0.04 }, 0.2);

    /* karta 2 — CMS przykrywa */
    tl.to(
      chs[1],
      { autoAlpha: 0, y: -44, duration: 0.05, ease: "power2.in" },
      0.34,
    );
    tl.to(els.digits[0], { autoAlpha: 0, duration: 0.05 }, 0.35);
    tl.to(
      c1,
      {
        xPercent: -7.4,
        yPercent: 7.2,
        rotation: -6.5,
        opacity: 0.5,
        filter: "blur(1px) brightness(0.8) saturate(0.7)",
        duration: 0.08,
        ease: "power1.inOut",
      },
      0.36,
    );
    tl.to(
      c2,
      {
        autoAlpha: 1,
        xPercent: 0,
        yPercent: 0,
        rotation: 2.5,
        filter: "blur(0px)",
        duration: 0.16,
      },
      0.38,
    );
    tl.fromTo(
      els.digits[1],
      { autoAlpha: 0, y: 40 },
      { autoAlpha: 1, y: 0, duration: 0.07 },
      0.4,
    );
    tl.fromTo(
      chs[2],
      { autoAlpha: 0, y: 52 },
      { autoAlpha: 1, y: 0, duration: 0.055 },
      0.43,
    );

    /* karta 3 — narzędzia + CTA */
    tl.to(
      chs[2],
      { autoAlpha: 0, y: -44, duration: 0.05, ease: "power2.in" },
      0.62,
    );
    tl.to(els.digits[1], { autoAlpha: 0, duration: 0.05 }, 0.63);
    tl.to(
      c2,
      {
        xPercent: 8,
        yPercent: 4.5,
        rotation: 4.5,
        opacity: 0.55,
        filter: "blur(1px) brightness(0.8) saturate(0.7)",
        duration: 0.08,
        ease: "power1.inOut",
      },
      0.64,
    );
    tl.to(
      c3,
      {
        autoAlpha: 1,
        xPercent: 0,
        yPercent: 0,
        rotation: -1.5,
        filter: "blur(0px)",
        duration: 0.16,
      },
      0.66,
    );
    tl.fromTo(
      els.digits[2],
      { autoAlpha: 0, y: 40 },
      { autoAlpha: 1, y: 0, duration: 0.07 },
      0.68,
    );
    tl.fromTo(
      chs[3],
      { autoAlpha: 0, y: 52 },
      { autoAlpha: 1, y: 0, duration: 0.055 },
      0.71,
    );
    const cta = chs[3].querySelector(".dk-cta");
    if (cta) {
      tl.fromTo(
        cta,
        { autoAlpha: 0, y: 20 },
        { autoAlpha: 1, y: 0, duration: 0.05 },
        0.75,
      );
    }

    /* finał — wachlarz */
    tl.to(
      c1,
      {
        xPercent: -18.3 * F,
        yPercent: 10.2 * F,
        rotation: -9 * F,
        duration: 0.09,
        ease: "power1.inOut",
      },
      0.88,
    );
    tl.to(
      c2,
      {
        xPercent: 14.9 * F,
        yPercent: 6.4 * F,
        rotation: 6.5 * F,
        duration: 0.09,
        ease: "power1.inOut",
      },
      0.88,
    );
    tl.to(
      c3,
      { yPercent: -1.6, rotation: -1.5, duration: 0.09, ease: "power1.inOut" },
      0.88,
    );
    tl.to([e1, e2], { opacity: 0.3, duration: 0.1, ease: "power1.inOut" }, 0.9);

    /* Testowy wyłącznik snapa (?nosnap — wzorzec About): programowy scroll
       w testach przegrywa na wolnych runnerach CI wyścig ze snapem.
       Produkcyjne URL-e nie mają parametru — zachowanie bez zmian. */
    const noSnap = new URLSearchParams(location.search).has("nosnap");

    ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "bottom bottom",
      scrub: AUDIENCE_SCRUB,
      animation: tl,
      ...(noSnap
        ? {}
        : {
            snap: {
              snapTo: [...AUDIENCE_SNAP_POINTS],
              duration: { min: 0.2, max: 0.55 },
              delay: 0.08,
              ease: "power1.inOut",
            },
          }),
      onUpdate(self) {
        const p = self.progress;
        const [s1, s2, s3] = AUDIENCE_STAGE_THRESHOLDS;
        setStage(p < s1 ? 0 : p < s2 ? 1 : p < s3 ? 2 : 3);
      },
    });
  }

  /* ═══ MOBILE: flow + minimalne reveale ═══
     Budżet jak w About — NAJWAŻNIEJSZA jest płynność syncTouch, świadomie
     kosztem bogactwa animacji względem referencji:
     — ghost i żar W PEŁNI statyczne (CSS) — zero pracy przy tickach scrolla,
     — reveal = JEDEN tween (autoAlpha+y) na cały blok, bez kaskady
       per-element i bez animacji rotacji okna,
     — „wyostrzenie z mgły" okna = czysty opacity-crossfade dwóch WYPIECZONYCH
       obrazków (lay-blur → lay-sharp), zero filter w runtime,
     — once: true — po pierwszym pokazaniu NIC już nie animuje. */
  function buildMobile(): void {
    gsap.fromTo(
      tag,
      { autoAlpha: 0, x: -26 },
      {
        autoAlpha: 1,
        x: 0,
        duration: 0.55,
        ease: "power3.out",
        scrollTrigger: { trigger: stage, start: "top 78%", once: true },
      },
    );

    for (const block of els.chapters) {
      const win = block.querySelector<HTMLElement>(".dkm-win");
      const sharp = win?.querySelector<HTMLElement>(".lay-sharp");
      const blur = win?.querySelector<HTMLElement>(".lay-blur");
      const tlm = gsap.timeline({
        defaults: { ease: "power3.out" },
        scrollTrigger: { trigger: block, start: "top 84%", once: true },
      });
      tlm.fromTo(
        block,
        { autoAlpha: 0, y: 28 },
        { autoAlpha: 1, y: 0, duration: 0.6 },
        0,
      );
      if (sharp && blur) {
        tlm.fromTo(
          blur,
          { opacity: 0.92 },
          { opacity: 0, duration: 1, ease: "power1.inOut" },
          0.3,
        );
        tlm.fromTo(
          sharp,
          { opacity: 0.15 },
          { opacity: 1, duration: 1, ease: "power1.inOut" },
          0.3,
        );
      }
    }
  }

  /* ═══ matchMedia: desktop / mobile (reduce → moduł w ogóle nieładowany) ═══ */
  const mm = gsap.matchMedia();
  mm.add(
    {
      isDesktop: `(min-width: ${AUDIENCE_DESKTOP_MIN_PX}px)`,
      motionOK: "(prefers-reduced-motion: no-preference)",
    },
    (ctx) => {
      const { isDesktop, motionOK } = ctx.conditions as {
        isDesktop: boolean;
        motionOK: boolean;
      };
      if (!motionOK) return;
      if (isDesktop) buildDesktop();
      else buildMobile();
      return () => {
        // Stan poza kontrolą gsap (setStage, fitMocks) — sprzątamy sami.
        mockObserver?.disconnect();
        mockObserver = null;
        els.ticks.forEach((t, k) => t.classList.toggle("on", k === 0));
        pcount.textContent = "01 / 04";
        captext.textContent = caps[0] ?? "";
        stageIdx = -1;
      };
    },
  );

  // Pozycje triggerów po zbudowaniu sekcji (wzorzec About).
  ScrollTrigger.refresh();
}
