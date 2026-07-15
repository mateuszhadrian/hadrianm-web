// Oś scrolla sekcji „Oferta" — stałe współdzielone przez moduł animacji
// (services-scroll.ts), style (Services.astro) i sweep wizualny
// (tests/visual/services.spec.ts). Wartości „zamrożone" z prototypu referencji
// (docs/design/oferta-referencja/, OF_CFG w oferta.js) — decyzje portu:
// docs/analiza-sekcja-oferta.md.

/** Próg desktop/mobile w px — MUSI być równy @media (min-width) w Services.astro. */
export const SERVICES_DESKTOP_MIN_PX = 861;

/** Trigger ScrollTriggera (start/end względem viewportu) + scrub. */
interface ScrubRange {
  start: string;
  end: string;
  scrub: number;
}

/** Intro „czytanie scrollem": desktop = słowa (~80 spanów). */
export const SERVICES_READ: ScrubRange & { duration: number; span: number } = {
  start: "top 58%",
  end: "bottom 44%",
  scrub: 0.45,
  duration: 1.6,
  span: 8, // łączny rozrzut staggera (s osi tweena) dzielony przez liczbę spanów
};

/** Intro mobile = zdania (kilka spanów zamiast ~80). */
export const SERVICES_READ_MOBILE: ScrubRange & {
  duration: number;
  span: number;
} = {
  start: "top 70%",
  end: "bottom 52%",
  scrub: 0.4,
  duration: 1.4,
  span: 6,
};

/** Nić procesu: scaleY na .of-fill pod scrubem. */
export const SERVICES_THREAD: ScrubRange = {
  start: "top 52%",
  end: "bottom 82%",
  scrub: 0.5,
};
export const SERVICES_THREAD_MOBILE: ScrubRange = {
  start: "top 60%",
  end: "bottom 88%",
  scrub: 0.4,
};

/** Progi kroków procesu: reveal treści (`on`) / zapłon węzła (`lit`). */
export const SERVICES_STEP_ON = "top 76%";
export const SERVICES_STEP_LIT = "top 56%";
export const SERVICES_STEP_ON_MOBILE = "top 84%";
export const SERVICES_STEP_LIT_MOBILE = "top 66%";

/** Jazda parallaxu cyfr-ghost przy krokach (± px, tylko desktop). */
export const SERVICES_GHOST_PARALLAX = 70;

/** Liczba kroków procesu (kontrakt markup ↔ moduł ↔ progres 01–05). */
export const SERVICES_STEP_COUNT = 5;
