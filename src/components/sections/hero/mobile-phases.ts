// Fazy mobilne hero (krok 4 refactoru — kod 1:1 z inline <script> Hero.astro;
// zmiany wyłącznie mechaniczne: `hero` jako jawny parametr initCaptionGrowth
// i initDividers zamiast domknięcia). Faza 3 (wideo/pasek): android-mobile.ts.
// Stałe osi: hero-config.ts.

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { IS_ANDROID, ANDROID_DESIGN_SCALE } from "./platform";
import { q, type Base, type DeviceRefs } from "./timeline-base";
import { SEL, devWarnMissing } from "./selectors";
import {
  MOB_SETTLE_START,
  MOB_SETTLE_DUR,
  MOB_SETTLE_EASE,
  MOB_COPY_FADE_LEAD,
  MOB_COPY_FADE_DUR,
  GROW_END,
  LAP_SPAN,
  PH_SPAN,
  GAP_LAP_DIV,
  GAP_PH_DIV,
} from "./hero-config";

export const phase1Mobile = (
  b: Base,
  refs: DeviceRefs,
  slide: () => number,
  zDepth: () => number,
) => {
  const { tl, live, devices, startX, startY } = b;
  const { laptop, phone } = refs;

  // słowo: hold w miejscu, potem sam zanik (bez skali/blura/przejazdu)
  tl.fromTo(
    live,
    { x: startX, y: startY, scale: 1, autoAlpha: 1 },
    { autoAlpha: 0, duration: 0.17 },
    0.45,
  );

  // filter/scale sprzątamy od razu, ale WIDOCZNOŚĆ bramkuje timeline:
  // przed wejściem urządzeń wrapper zostaje ukryty (CSS opacity:0). Chroni
  // to przed pokazaniem urządzeń na środku ekranu, gdyby resize/refresh
  // wyzerował offsety wjazdu, zanim scrub dojdzie do ich tweenów
  // (objaw: iPhone po zimnym cache widział laptop+telefon na starcie).
  gsap.set(devices, { filter: "none", scale: 1 });
  tl.set(devices, { autoAlpha: 1 }, MOB_SETTLE_START);
  if (laptop) {
    tl.fromTo(
      laptop,
      { "--sl-lap": () => slide() + "px" },
      { "--sl-lap": "0px", duration: MOB_SETTLE_DUR, ease: MOB_SETTLE_EASE },
      MOB_SETTLE_START,
    );
    tl.fromTo(
      laptop,
      { "--sz-lap": () => -zDepth() + "px" },
      { "--sz-lap": "0px", duration: MOB_SETTLE_DUR, ease: MOB_SETTLE_EASE },
      MOB_SETTLE_START,
    );
  }
  if (phone) {
    tl.fromTo(
      phone,
      { "--sl-ph": () => -slide() + "px" },
      { "--sl-ph": "0px", duration: MOB_SETTLE_DUR, ease: MOB_SETTLE_EASE },
      MOB_SETTLE_START,
    );
    tl.fromTo(
      phone,
      { "--sz-ph": () => zDepth() + "px" },
      { "--sz-ph": "0px", duration: MOB_SETTLE_DUR, ease: MOB_SETTLE_EASE },
      MOB_SETTLE_START,
    );
  }
};

export const phase2Mobile = (b: Base, refs: DeviceRefs) => {
  const { tl, copy, devices } = b;
  const { laptop, phone } = refs;
  // Scalone z wjazdem: rozsunięcie + pomniejszenie biegną RAZEM z fazą 1
  // (ten sam start/czas/ease) → jeden ciągły ruch, bez etapu pośredniego.
  const APART_START = MOB_SETTLE_START;
  // px projektu skalują się razem ze sceną (S2: wartość tylko w platform.ts);
  // gałąź mobile (mm.add) = isStacked, więc warunek zgodny z K() w device-scene.
  const K = IS_ANDROID ? ANDROID_DESIGN_SCALE : 1;
  const APART_LAP = -150 * K; // laptop w górę (px projektu)
  const APART_PH = 170 * K; // telefon w dół (px projektu)
  const MOB_END_SCALE = 0.82; // pomniejszenie grupy (miejsce na tekst góra/dół)

  if (laptop) {
    tl.to(
      laptop,
      {
        "--apart-lap": APART_LAP + "px",
        duration: MOB_SETTLE_DUR,
        ease: MOB_SETTLE_EASE,
      },
      APART_START,
    );
  }
  if (phone) {
    tl.to(
      phone,
      {
        "--apart-ph": APART_PH + "px",
        duration: MOB_SETTLE_DUR,
        ease: MOB_SETTLE_EASE,
      },
      APART_START,
    );
  }
  tl.to(
    devices,
    {
      scale: MOB_END_SCALE,
      transformOrigin: "50% 50%",
      duration: MOB_SETTLE_DUR,
      ease: MOB_SETTLE_EASE,
    },
    APART_START,
  );
  if (copy) {
    // copy wjeżdża wraz z dolotem urządzeń i domyka się tuż po osadzeniu;
    // koniec tego tweena = MOBILE_TL_LENGTH (pochodna w hero-config.ts) —
    // stałe fade żyją tam, żeby długość osi liczyła się z jednego źródła
    tl.fromTo(
      copy,
      { autoAlpha: 0 },
      { autoAlpha: 1, duration: MOB_COPY_FADE_DUR, ease: "power2.out" },
      APART_START + MOB_SETTLE_DUR - MOB_COPY_FADE_LEAD,
    );
  }
};

// ── Wzrost tekstów 02/03 (mobile, wspólny iOS + Android) ──────────────────
// Spójnie z desktopową karuzelą: powiększenie + szary→biały + 600→800.
// Geometria przez transform: scale z origin lewo-środek → tekst rośnie
// w prawo i równomiernie w górę/dół, lewa krawędź stoi, zero reflow
// (nic innego się nie przesuwa). Sterowane scrubem → w pełni odwracalne.
export const initCaptionGrowth = (hero: HTMLElement | null) => {
  if (!hero) return () => {};
  const t1 = q<HTMLElement>(SEL.copyRow1Text);
  const t2 = q<HTMLElement>(SEL.copyRow2Text);
  const t3 = q<HTMLElement>(SEL.copyRow3Text);
  if (!t1 || !t2 || !t3) {
    if (!t1) devWarnMissing("copyRow1Text");
    if (!t2) devWarnMissing("copyRow2Text");
    if (!t3) devWarnMissing("copyRow3Text");
    return () => {};
  }

  const muted = getComputedStyle(t2).color; // bazowy szary 02/03
  const ink = getComputedStyle(t1).color; // biel tekstu 01

  // Docelowa "część drogi" z rozmiaru bazowego do rozmiaru 01.
  // 02 rośnie w połowę drogi; 03 ("Płynnie…") mniej, bo dłuższy tekst
  // wystawałby poza kontener z prawej.
  const REACH_02 = 0.5;
  const REACH_03 = 0.3;
  // transform nie zmienia computed font-size, więc odczyt jest zawsze
  // rozmiarem bazowym niezależnie od bieżącej skali (bezpieczne przy refresh).
  const targetScale = (base: HTMLElement, reach: number) => {
    const s0 = parseFloat(getComputedStyle(t1).fontSize) || 32;
    const sb = parseFloat(getComputedStyle(base).fontSize) || 16;
    return 1 + reach * (s0 / sb - 1);
  };

  // Start wzrostu tekstu = szczyt powiększenia ekranu urządzenia.
  const peakVh = (z: { start: number; end: number }) =>
    z.start + GROW_END * (z.end - z.start);
  // Okno wzrostu = pierwsze GROW_FRACTION drogi szczyt→koniec okna urządzenia.
  // Mniejsza wartość = teksty szybciej osiągają maksymalny rozmiar.
  const GROW_FRACTION = 0.18;
  const growEndVh = (z: { start: number; end: number }) => {
    const s = peakVh(z);
    return s + GROW_FRACTION * (z.end - s);
  };

  const make = (
    text: HTMLElement,
    z: { start: number; end: number },
    reach: number,
  ) =>
    gsap.fromTo(
      text,
      { scale: 1, color: muted, fontWeight: 600 },
      {
        scale: () => targetScale(text, reach),
        color: ink,
        fontWeight: 800,
        transformOrigin: "0% 50%",
        ease: "none",
        scrollTrigger: {
          trigger: hero,
          start: () => "top+=" + peakVh(z) * window.innerHeight + " top",
          end: () => "top+=" + growEndVh(z) * window.innerHeight + " top",
          scrub: true,
          invalidateOnRefresh: true,
        },
      },
    );

  const tweens = [make(t2, LAP_SPAN, REACH_02), make(t3, PH_SPAN, REACH_03)];

  return () => {
    tweens.forEach((tw) => {
      tw.scrollTrigger?.kill();
      tw.kill();
    });
    [t2, t3].forEach((t) => {
      t.style.removeProperty("transform");
      t.style.removeProperty("color");
      t.style.removeProperty("font-weight");
    });
  };
};

// ── Dividery 02/03 kotwiczone do spodów urządzeń (render-only, Android) ───
export const initDividers = (hero: HTMLElement | null, refs: DeviceRefs) => {
  const stageEl = q(SEL.stage);
  const div02 = q<HTMLElement>(SEL.copyRow2);
  const div03 = q<HTMLElement>(SEL.copyRow3);
  if (!stageEl) devWarnMissing("stage");
  if (!div02) devWarnMissing("copyRow2");
  if (!div03) devWarnMissing("copyRow3");
  // Hot path scrolla (onUpdate na Androidzie): wszystkie odczyty geometrii
  // PRZED zapisami (przeplot read/write wymuszał reflow per-frame) + pomijanie
  // redundantnych zapisów `top` (wzorzec lastScale z android-mobile.ts).
  let lastTop02 = "";
  let lastTop03 = "";
  const placeDividers = () => {
    if (!stageEl) return;
    const stageTop = stageEl.getBoundingClientRect().top;
    const lapBottom = refs.laptop?.getBoundingClientRect().bottom;
    const phBottom = refs.phone?.getBoundingClientRect().bottom;
    if (div02 && lapBottom !== undefined) {
      const top = lapBottom - stageTop + GAP_LAP_DIV + "px";
      if (top !== lastTop02) {
        lastTop02 = top;
        div02.style.top = top;
      }
    }
    if (div03 && phBottom !== undefined) {
      const top = phBottom - stageTop + GAP_PH_DIV + "px";
      if (top !== lastTop03) {
        lastTop03 = top;
        div03.style.top = top;
      }
    }
  };
  const dividerTrigger =
    IS_ANDROID && hero
      ? ScrollTrigger.create({
          trigger: hero,
          start: "top top",
          end: () => "top+=" + LAP_SPAN.start * window.innerHeight + " top",
          onUpdate: placeDividers,
          onLeave: placeDividers,
          onLeaveBack: placeDividers,
        })
      : null;
  if (IS_ANDROID) {
    ScrollTrigger.addEventListener("refresh", placeDividers);
    placeDividers();
  }
  return () => {
    dividerTrigger?.kill();
    ScrollTrigger.removeEventListener("refresh", placeDividers);
    div02?.style.removeProperty("top");
    div03?.style.removeProperty("top");
  };
};
