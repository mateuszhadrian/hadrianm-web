// Oś scrolla sekcji „O mnie" — stałe współdzielone przez moduł animacji,
// style i sweep wizualny; decyzje portu: docs/analiza-sekcja-o-mnie.md.

/** Próg desktop/mobile w px — MUSI być równy @media (min-width) w About.astro. */
export const ABOUT_DESKTOP_MIN_PX = 861;

/** Bezwładność scrubu (s). */
export const ABOUT_SCRUB = 1;

/**
 * Punkty spoczynku snapa (progress 0–1 osi sekcji) — rozdziały 01–03 + finał.
 * Sweep wizualny fotografuje dokładnie te punkty (snap w spoczynku = brak
 * dryfu między przebiegami).
 */
export const ABOUT_SNAP_POINTS = [0.13, 0.42, 0.71, 0.97] as const;

/** Wjazd rozdziałów 01–03 na osi 0–1 (ch0 startuje widoczny). */
export const ABOUT_CH_IN = [0.02, 0.31, 0.6] as const;

/** Zejście rozdziałów 01–03 na osi 0–1. */
export const ABOUT_CH_OUT = [0.24, 0.5, 0.8] as const;

/** Progi przełączania progresu 01→02→03→04 (progress w onUpdate). */
export const ABOUT_STAGE_THRESHOLDS = [0.3, 0.58, 0.855] as const;
