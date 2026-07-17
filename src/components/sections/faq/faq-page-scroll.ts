// Podstrona /faq/ — choreografia (port faq.js z referencji
// docs/design/faq-podstrona-referencja/; decyzje: docs/analiza-podstrona-faq.md).
//
// Zero pinów, zero scrubu na treści. Hero pokazywane od razu (rAF — jest
// nad zakładką). Rejestr 30 pozycji revealuje ScrollTrigger.batch: animuje
// się tylko to, co wchodzi w viewport (stagger --d w obrębie partii), więc
// 30 wierszy nigdy nie rusza się naraz (budżet CPU jak Oferta mobile).
// CTA: pojedynczy revealOnce. Desktop dodatkowo leniwy parallax ghosta.
//
// Akordeon: logika stanu w faq-accordion.ts (ładowana zawsze) z NIEZALEŻNYMI
// toggle'ami (exclusive: false — zamknięcie pytania nad viewportem nie
// szarpie scrollem); animator wysokości ze wspólnej fabryki faq-animator.ts.
// Wyszukiwarka: faq-search.ts (ładowana zawsze); tu dostaje onFilter →
// ScrollTrigger.refresh() (filtr zmienia wysokość strony, triggery CTA/batcha
// muszą dostać świeże pozycje).
//
// Ładowany DYNAMICZNIE z bramki motion w FaqFull.astro; przy reduce akordeon
// i wyszukiwarka działają bez tego modułu (gałąź w skrypcie komponentu).
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ghostParallax,
  motionMedia,
  revealOnce,
  scopedQueries,
} from "@/scripts/section-helpers";
import { initFaqAccordion } from "./faq-accordion";
import { createFaqHeightAnimator } from "./faq-animator";
import { initFaqSearch } from "./faq-search";
import {
  FAQ_BATCH_START,
  FAQ_BATCH_STAGGER,
  FAQ_CTA_START,
  FAQ_DESKTOP_MIN_PX,
  FAQ_PAGE_GHOST_PARALLAX,
} from "./faq-config";

gsap.registerPlugin(ScrollTrigger);

export function initFaqPageScroll(): void {
  const root = document.querySelector<HTMLElement>(".fqf");
  if (!root) return;

  const { q, qa } = scopedQueries(root);
  const hero = q(".fq-hero");
  const ghost = q(".fq-ghost");
  const cta = q(".fq-cta");

  /* ── akordeon (niezależne toggle) + wyszukiwarka ── */
  initFaqAccordion(root, createFaqHeightAnimator(), { exclusive: false });
  initFaqSearch(root, () => ScrollTrigger.refresh());

  /* ── hero: nad zakładką — pokaż od razu ── */
  requestAnimationFrame(() => {
    for (const el of qa(".fq-hero .fq-rev, .fq-ghost")) el.classList.add("on");
  });

  /* ── rejestr: partiami; stagger tylko w obrębie partii ── */
  ScrollTrigger.batch(qa(".fq-item"), {
    start: FAQ_BATCH_START,
    onEnter: (batch) => {
      batch.forEach((el, i) => {
        (el as HTMLElement).style.setProperty(
          "--d",
          `${i * FAQ_BATCH_STAGGER}s`,
        );
        el.classList.add("on");
      });
    },
  });

  /* ── CTA ── */
  if (cta) revealOnce(cta, FAQ_CTA_START);

  /* ── desktop: leniwy parallax ghosta (sam transform, scrub). Start
     "top top" — hero zaczyna u szczytu strony (osie 1:1 z referencji). ── */
  motionMedia(FAQ_DESKTOP_MIN_PX, (isDesktop) => {
    if (!isDesktop || !ghost || !hero) return;
    ghostParallax(ghost, hero, FAQ_PAGE_GHOST_PARALLAX, "top top");
  });

  // Pozycje triggerów po zbudowaniu strony (wzorzec pozostałych sekcji).
  ScrollTrigger.refresh();
}
