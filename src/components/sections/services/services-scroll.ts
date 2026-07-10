// Sekcja „Oferta" — animacje scrolla (port oferta.js z referencji
// docs/design/oferta-referencja/; decyzje: docs/analiza-sekcja-oferta.md).
//
// Desktop (≥SERVICES_DESKTOP_MIN_PX): zero pinów — wszystko w naturalnym flow.
// Intro: słowa (spany .of-w) zapala jeden tween ze staggerem pod scrubem;
// nić = scaleY na .of-fill (czysty transform); kroki/węzły dostają klasy
// on/lit z progów ScrollTriggera (animuje CSS transition); cyfry-ghost mają
// leniwy parallax; fixed progres 01–05 włącza klasa of-prog-on NA SEKCJI.
// Mobile: wersja lekka — zapalanie ZDANIAMI (kilka spanów zamiast ~80),
// nić = ten sam pojedynczy scaleY, kroki wyłącznie toggleClass. Zero filtrów,
// zero pinów, zero mierzenia w rAF (budżet iPhone SE 2020 / tanie Androidy).
// Pakiety: bez animacji scrollowych (tylko hover w CSS).
//
// Moduł ładowany DYNAMICZNIE tylko przy prefers-reduced-motion: no-preference
// (bramka w Services.astro — wzorzec Audience/About); przy reduce i bez JS
// statyczny, w pełni widoczny układ realizuje czysty CSS. Warunek motionOK
// w matchMedia niżej to pas bezpieczeństwa na zmianę preferencji w sesji.
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  SERVICES_DESKTOP_MIN_PX,
  SERVICES_GHOST_PARALLAX,
  SERVICES_READ,
  SERVICES_READ_MOBILE,
  SERVICES_STEP_COUNT,
  SERVICES_STEP_LIT,
  SERVICES_STEP_LIT_MOBILE,
  SERVICES_STEP_ON,
  SERVICES_STEP_ON_MOBILE,
  SERVICES_THREAD,
  SERVICES_THREAD_MOBILE,
} from "./services-config";

gsap.registerPlugin(ScrollTrigger);

/* Podział akapitów intro na spany .of-w: desktop = słowa, mobile = zdania.
   Fraza akcentowa (<span class="acc">) zachowuje klasę na swoich spanach.
   Dzielimy RAZ przy inicie (zachowanie 1:1 z referencją) — markup niesie
   czyste <p> z i18n, więc treść bez JS pozostaje nietknięta. */
function splitLit(section: HTMLElement, mode: "words" | "sentences"): void {
  for (const p of section.querySelectorAll<HTMLElement>(".of-lit")) {
    const nodes = Array.from(p.childNodes);
    p.textContent = "";
    const push = (txt: string, acc: boolean) => {
      if (!txt) return;
      const s = document.createElement("span");
      s.className = "of-w" + (acc ? " acc" : "");
      s.textContent = txt;
      p.appendChild(s);
    };
    for (const nd of nodes) {
      const isAccent = nd.nodeType === Node.ELEMENT_NODE;
      const text = nd.textContent ?? "";
      if (mode === "words") {
        for (const t of text.split(/\s+/)) {
          if (!t) continue;
          push(t, isAccent);
          p.appendChild(document.createTextNode(" "));
        }
      } else if (isAccent) {
        push(text, true);
      } else {
        const parts = text.split(". ");
        parts.forEach((t, i) => {
          if (t) push(i < parts.length - 1 ? `${t}. ` : t, false);
        });
      }
    }
  }
}

export function initServicesScroll(): void {
  const section = document.querySelector<HTMLElement>("#services");
  if (!section) return;

  const q = (s: string) => section.querySelector<HTMLElement>(s);
  const qa = (s: string) =>
    Array.from(section.querySelectorAll<HTMLElement>(s));

  const els = {
    intro: q(".of-intro"),
    introhint: q(".of-introhint"),
    ghost: q(".of-ghost"),
    proces: q(".of-proces"),
    fill: q(".of-fill"),
    steps: qa(".of-step"),
    ghostds: qa(".of-ghostd"),
    endcap: q(".of-endcap"),
    ticks: qa(".of-progress .ticks i"),
    pcount: q(".of-progress .pcount"),
  };
  if (
    !els.intro ||
    !els.introhint ||
    !els.ghost ||
    !els.proces ||
    !els.fill ||
    !els.endcap ||
    !els.pcount ||
    els.steps.length !== SERVICES_STEP_COUNT ||
    els.ghostds.length !== SERVICES_STEP_COUNT ||
    els.ticks.length !== SERVICES_STEP_COUNT
  ) {
    return;
  }
  const { intro, introhint, ghost, proces, fill, endcap } = els;
  const pcount = els.pcount;
  // Alias po zawężeniu typu: deklaracje function niżej (hoisting) nie widzą
  // narrowingu `section` z wczesnego returnu.
  const root = section;

  const isMobileNow = !matchMedia(`(min-width: ${SERVICES_DESKTOP_MIN_PX}px)`)
    .matches;
  splitLit(section, isMobileNow ? "sentences" : "words");

  /* ── wspólne: kroki + węzły + endcap + hint (toggleClass, animuje CSS) ── */
  function stepTriggers(isMobile: boolean): void {
    for (const step of els.steps) {
      ScrollTrigger.create({
        trigger: step,
        start: isMobile ? SERVICES_STEP_ON_MOBILE : SERVICES_STEP_ON,
        toggleClass: { targets: step, className: "on" },
      });
      ScrollTrigger.create({
        trigger: step,
        start: isMobile ? SERVICES_STEP_LIT_MOBILE : SERVICES_STEP_LIT,
        toggleClass: { targets: step, className: "lit" },
      });
    }
    ScrollTrigger.create({
      trigger: endcap,
      start: "top 88%",
      toggleClass: { targets: endcap, className: "on" },
    });
    ScrollTrigger.create({
      trigger: introhint,
      start: "top 92%",
      toggleClass: { targets: introhint, className: "on" },
    });
  }

  /* Zapalanie intro pod scrubem — wspólny kształt tweena desktop/mobile. */
  function readTween(cfg: typeof SERVICES_READ): void {
    const spans = qa(".of-lit .of-w");
    gsap.to(spans, {
      opacity: 1,
      ease: "none",
      duration: cfg.duration,
      stagger: { each: cfg.span / Math.max(spans.length, 1) },
      scrollTrigger: {
        trigger: intro,
        start: cfg.start,
        end: cfg.end,
        scrub: cfg.scrub,
      },
    });
  }

  /* Nić: jeden scaleY pod scrubem (transform-origin: top w CSS). */
  function threadTween(cfg: typeof SERVICES_THREAD): void {
    gsap.fromTo(
      fill,
      { scaleY: 0 },
      {
        scaleY: 1,
        ease: "none",
        scrollTrigger: {
          trigger: proces,
          start: cfg.start,
          end: cfg.end,
          scrub: cfg.scrub,
        },
      },
    );
  }

  /* ── progres 01–05 (desktop, fixed) ── */
  let stepIdx = -1;
  function setStep(i: number): void {
    if (i === stepIdx) return;
    stepIdx = i;
    pcount.textContent = `0${i + 1} / 05`;
    els.ticks.forEach((t, k) => t.classList.toggle("on", k <= i));
  }

  /* ═══ DESKTOP ═══ */
  function buildDesktop(): void {
    readTween(SERVICES_READ);

    /* ghost „oferta": leniwy parallax */
    gsap.fromTo(
      ghost,
      { y: 0 },
      {
        y: 90,
        ease: "none",
        scrollTrigger: {
          trigger: intro,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      },
    );

    threadTween(SERVICES_THREAD);

    /* cyfry-ghost: parallax ±SERVICES_GHOST_PARALLAX */
    for (const g of els.ghostds) {
      gsap.fromTo(
        g,
        { y: SERVICES_GHOST_PARALLAX },
        {
          y: -SERVICES_GHOST_PARALLAX,
          ease: "none",
          scrollTrigger: {
            trigger: g.parentElement,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        },
      );
    }

    stepTriggers(false);

    /* progres: widoczny w trakcie procesu, ticki wg progu `lit` kroku */
    setStep(0);
    ScrollTrigger.create({
      trigger: proces,
      start: "top 55%",
      end: "bottom 65%",
      onToggle: (self) => root.classList.toggle("of-prog-on", self.isActive),
    });
    els.steps.forEach((step, i) => {
      ScrollTrigger.create({
        trigger: step,
        start: SERVICES_STEP_LIT,
        onEnter: () => setStep(i),
        onLeaveBack: () => setStep(Math.max(0, i - 1)),
      });
    });
  }

  /* ═══ MOBILE — wersja lekka ═══ */
  function buildMobile(): void {
    readTween(SERVICES_READ_MOBILE);
    threadTween(SERVICES_THREAD_MOBILE);
    stepTriggers(true);
  }

  /* ═══ matchMedia: desktop / mobile (reduce → moduł w ogóle nieładowany) ═══ */
  const mm = gsap.matchMedia();
  mm.add(
    {
      isDesktop: `(min-width: ${SERVICES_DESKTOP_MIN_PX}px)`,
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
        // Stan poza kontrolą gsap (klasy on/lit/of-prog-on, ticki) — sprzątamy sami.
        section.classList.remove("of-prog-on");
        for (const step of els.steps) step.classList.remove("on", "lit");
        endcap.classList.remove("on");
        introhint.classList.remove("on");
        els.ticks.forEach((t, k) => t.classList.toggle("on", k === 0));
        pcount.textContent = "01 / 05";
        stepIdx = -1;
      };
    },
  );

  // Pozycje triggerów po zbudowaniu sekcji (wzorzec About/Audience).
  ScrollTrigger.refresh();
}
