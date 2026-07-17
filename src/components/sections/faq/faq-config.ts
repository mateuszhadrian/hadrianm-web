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

/** Liczba pytań TEASERA na stronie głównej (kontrakt markup ↔ slice
 *  faqItems ↔ stagger --d w CSS Faq.astro — nth-child 1..6). Pełna lista
 *  żyje w src/i18n/faq.ts i renderuje ją podstrona /faq/ (FaqFull.astro). */
export const FAQ_TEASER_COUNT = 6;

/* ── Podstrona /faq/ (port referencji docs/design/faq-podstrona-referencja/;
   decyzje: docs/analiza-podstrona-faq.md). Wartości „zamrożone". ── */

/** Reveal rejestru: próg batcha i stagger w obrębie partii (s). */
export const FAQ_BATCH_START = "top 94%";
export const FAQ_BATCH_STAGGER = 0.05;

/** Jazda parallaxu ghosta „FAQ" na hero podstrony (od → do px, desktop). */
export const FAQ_PAGE_GHOST_PARALLAX: readonly [number, number] = [-30, 46];
