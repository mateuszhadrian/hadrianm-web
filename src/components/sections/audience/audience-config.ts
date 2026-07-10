// Oś scrolla sekcji „Dla kogo" — stałe współdzielone przez moduł animacji
// (audience-scroll.ts), style (Audience.astro) i sweep wizualny
// (tests/visual/audience.spec.ts). Wartości „zamrożone" z prototypu referencji
// (docs/design/dla-kogo-referencja/) — decyzje portu:
// docs/analiza-sekcja-dla-kogo.md.

/** Próg desktop/mobile w px — MUSI być równy @media (min-width) w Audience.astro. */
export const AUDIENCE_DESKTOP_MIN_PX = 861;

/** Bezwładność scrubu (s). */
export const AUDIENCE_SCRUB = 0.6;

/**
 * Punkty spoczynku snapa (progress 0–1 osi sekcji): intro / karta 1 / karta 2
 * / karta 3 + finał-wachlarz. Sweep wizualny fotografuje dokładnie te punkty
 * (snap w spoczynku = brak dryfu między przebiegami).
 */
export const AUDIENCE_SNAP_POINTS = [0.04, 0.3, 0.58, 0.94] as const;

/** Rozrzut wachlarza w finale (mnożnik przesunięć i rotacji kart). */
export const AUDIENCE_FAN = 1.4;

/**
 * Progi przełączania progresu 01→02→03→04 (progress w onUpdate).
 * UWAGA: mapowanie progres↔snap jest bespoke z prototypu (intro i karta 1
 * dzielą stan „01") — zachowane 1:1, nie „poprawiać" bez decyzji Mateusza.
 */
export const AUDIENCE_STAGE_THRESHOLDS = [0.32, 0.6, 0.86] as const;
