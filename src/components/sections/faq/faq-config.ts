// Oś sekcji „FAQ" — stałe współdzielone przez moduł animacji, akordeon,
// style i testy; decyzje portu: docs/analiza-sekcja-faq.md.

/** Próg desktop/mobile w px — MUSI być równy @media (min-width) w Faq.astro. */
export const FAQ_DESKTOP_MIN_PX = 861;

/** Akordeon: tween wysokości odpowiedzi (s). */
export const FAQ_OPEN_DUR = 0.55;
export const FAQ_CLOSE_DUR = 0.45;

/** Progi wejść (ScrollTrigger `once` → klasa .on; animuje CSS transition). */
export const FAQ_HEAD_START = "top 84%";
export const FAQ_LIST_START = "top 80%";
export const FAQ_CTA_START = "top 92%";

/** Jazda parallaxu ghosta „FAQ" (od → do px, tylko desktop). */
export const FAQ_GHOST_PARALLAX: readonly [number, number] = [-34, 44];

/** Liczba pytań (kontrakt markup ↔ i18n ↔ stagger --d w CSS). */
export const FAQ_ITEM_COUNT = 6;
