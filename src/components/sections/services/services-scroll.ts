// Sekcja „Oferta" — animacje scrolla (port oferta.js z referencji
// docs/design/oferta-referencja/; decyzje: docs/analiza-sekcja-oferta.md,
// podział na warianty: docs/analiza-podstrony-oferta.md).
//
// Trzy animowane warianty (bramka data-variant w Services.astro; wariant
// packages jest statyczny i tego modułu nie ładuje):
// - teaser (strona główna): słowa intro (spany .of-w) zapala tween ze
//   staggerem pod scrubem, osobny per akapit .of-lit (mobile: zdaniami —
//   kilka spanów zamiast ~80),
//   ghost „oferta" ma leniwy parallax (desktop), para CTA dostaje reveal
//   klasą on (animuje CSS transition);
// - hub (/oferta/): jednorazowy reveal wstępu i kart klasą on (stagger
//   robi CSS transition-delay) — blok siedzi u szczytu strony, więc trigger
//   odpala zwykle od razu po init;
// - process (/proces-wspolpracy/): nić = scaleY na .of-fill (czysty
//   transform); kroki/węzły dostają klasy on/lit z progów ScrollTriggera;
//   cyfry-ghost mają leniwy parallax (desktop); fixed progres 01–05 włącza
//   klasa of-prog-on NA SEKCJI. Mobile: nić + toggleClass, zero filtrów,
//   zero pinów (budżet iPhone SE 2020 / tanie Androidy).
//
// Ładowany DYNAMICZNIE z bramki motion w Services.astro; pas bezpieczeństwa
// motionOK w runtime: motionMedia() w @/scripts/section-helpers.
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ghostParallax,
  makeProgress,
  motionMedia,
  revealOnce,
  scopedQueries,
} from "@/scripts/section-helpers";
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

/* ═══ TEASER (strona główna): intro czytane scrollem + reveal pary CTA ═══ */
function initTeaser(section: HTMLElement): void {
  const { q, qa } = scopedQueries(section);
  const els = {
    intro: q(".of-intro"),
    ghost: q(".of-ghost"),
    ctas: q(".of-ctas"),
  };
  if (!els.intro || !els.ghost || !els.ctas) return;
  const { intro, ghost, ctas } = els;

  const isMobileNow = !matchMedia(`(min-width: ${SERVICES_DESKTOP_MIN_PX}px)`)
    .matches;
  splitLit(section, isMobileNow ? "sentences" : "words");

  /* Zapalanie intro pod scrubem — osobny tween + trigger PER AKAPIT .of-lit
     (poprawka 5: docs/visual-corrections-part1.md). Start akapitu bierze
     cfg.paraStarts[i]; end liczy kod tak, by TEMPO (sekundy osi tweenu na
     px scrolla) było równe dawnej wspólnej osi na całym .of-intro
     (refStartVh/refEndVh): gęstość staggera liczona od WSZYSTKICH spanów,
     a dystans scrolla proporcjonalny do długości tweenu akapitu. */
  function readTween(cfg: typeof SERVICES_READ): void {
    const total = qa(".of-lit .of-w").length;
    const each = cfg.span / Math.max(total, 1);
    const tweenLen = (n: number) => each * Math.max(n - 1, 0) + cfg.duration;
    /* px scrolla na sekundę osi tweenu — dystans dawnego triggera
       (introHeight + (refStart − refEnd)·vh) rozłożony na pełną oś.
       Funkcja, nie stała: end jest funkcyjny, refresh mierzy na świeżo. */
    const pxPerSec = () =>
      (intro.offsetHeight +
        (cfg.refStartVh - cfg.refEndVh) * window.innerHeight) /
      tweenLen(total);
    qa(".of-lit").forEach((para, i) => {
      const spans = Array.from(para.querySelectorAll<HTMLElement>(".of-w"));
      if (!spans.length) return;
      gsap.to(spans, {
        opacity: 1,
        ease: "none",
        duration: cfg.duration,
        stagger: { each },
        scrollTrigger: {
          trigger: para,
          start: cfg.paraStarts[i] ?? cfg.paraStarts[2],
          end: () => `+=${pxPerSec() * tweenLen(spans.length)}`,
          scrub: cfg.scrub,
        },
      });
    });
  }

  motionMedia(SERVICES_DESKTOP_MIN_PX, (isDesktop) => {
    readTween(isDesktop ? SERVICES_READ : SERVICES_READ_MOBILE);

    /* ghost „oferta": leniwy parallax (desktop) */
    if (isDesktop) ghostParallax(ghost, intro, [0, 90]);

    /* para CTA: reveal jak dawny introhint (animuje CSS transition) */
    ScrollTrigger.create({
      trigger: ctas,
      start: "top 92%",
      toggleClass: { targets: ctas, className: "on" },
    });

    return () => {
      // Stan poza kontrolą gsap (klasa on) — sprzątamy sami.
      ctas.classList.remove("on");
    };
  });

  // Pozycje triggerów po zbudowaniu sekcji (wzorzec About/Audience).
  ScrollTrigger.refresh();
}

/* ═══ HUB (/oferta/): jednorazowy reveal wstępu i kart ═══ */
function initHub(section: HTMLElement): void {
  const { q, qa } = scopedQueries(section);
  const hub = q(".ofh");
  if (!hub) return;
  const intro = q(".ofh-intro");
  const targets = [intro, ...qa(".ofh-card")].filter(
    (el): el is HTMLElement => el !== null,
  );
  if (!targets.length) return;

  // motionMedia tylko jako pas bezpieczeństwa motionOK (układ hub jest
  // wspólny desktop/mobile); stagger kart robi CSS transition-delay.
  motionMedia(SERVICES_DESKTOP_MIN_PX, () => {
    revealOnce(hub, "top 85%", targets);
    return () => {
      // Stan poza kontrolą gsap (klasa on) — sprzątamy sami.
      for (const el of targets) el.classList.remove("on");
    };
  });

  // Pozycje triggerów po zbudowaniu sekcji (wzorzec About/Audience).
  ScrollTrigger.refresh();
}

/* ═══ PROCESS (/proces-wspolpracy/): nić + kroki + progres ═══ */
function initProcess(section: HTMLElement): void {
  const { q, qa } = scopedQueries(section);
  const els = {
    proces: q(".of-proces"),
    fill: q(".of-fill"),
    steps: qa(".of-step"),
    ghostds: qa(".of-ghostd"),
    endcap: q(".of-endcap"),
    ticks: qa(".of-progress .ticks i"),
    pcount: q(".of-progress .pcount"),
  };
  if (
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
  const { proces, fill, endcap } = els;
  const pcount = els.pcount;
  // Alias po zawężeniu typu: deklaracje function niżej (hoisting) nie widzą
  // narrowingu `section` z wczesnego returnu.
  const root = section;

  /* kroki + węzły + endcap (toggleClass, animuje CSS) */
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

  /* ── progres 01–05 (desktop, fixed; ticki kumulatywnie do bieżącego) ── */
  const progress = makeProgress(els.ticks, pcount, 5, { cumulative: true });

  motionMedia(SERVICES_DESKTOP_MIN_PX, (isDesktop) => {
    threadTween(isDesktop ? SERVICES_THREAD : SERVICES_THREAD_MOBILE);
    stepTriggers(!isDesktop);

    if (isDesktop) {
      /* cyfry-ghost: parallax ±SERVICES_GHOST_PARALLAX */
      for (const g of els.ghostds) {
        ghostParallax(g, g.parentElement!, [
          SERVICES_GHOST_PARALLAX,
          -SERVICES_GHOST_PARALLAX,
        ]);
      }

      /* progres: widoczny w trakcie procesu, ticki wg progu `lit` kroku */
      progress.set(0);
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
          onEnter: () => progress.set(i),
          onLeaveBack: () => progress.set(Math.max(0, i - 1)),
        });
      });
    }

    return () => {
      // Stan poza kontrolą gsap (klasy on/lit/of-prog-on, ticki) — sami.
      root.classList.remove("of-prog-on");
      for (const step of els.steps) step.classList.remove("on", "lit");
      endcap.classList.remove("on");
      progress.reset();
    };
  });

  // Pozycje triggerów po zbudowaniu sekcji (wzorzec About/Audience).
  ScrollTrigger.refresh();
}

export function initServicesScroll(): void {
  const section = document.querySelector<HTMLElement>("#services");
  if (!section) return;
  if (section.dataset.variant === "teaser") initTeaser(section);
  else if (section.dataset.variant === "hub") initHub(section);
  else if (section.dataset.variant === "process") initProcess(section);
}
