// Sekcja „FAQ" — choreografia (port faq.js z referencji
// docs/design/faq-referencja/; decyzje: docs/analiza-sekcja-faq.md).
//
// Wejścia (desktop i mobile identycznie — budżet CPU jak Oferta mobile):
// zero pinów, zero scrubu na treści. Trzy ScrollTriggery `once: true`
// dodają klasy `.on` (toggleClass), a całą animację robi CSS transition —
// stagger wierszy to transition-delay z --d (nth-child w Faq.astro).
// Desktop dodatkowo: leniwy parallax ghosta „FAQ" (sam transform, scrub).
//
// Akordeon: logika stanu w faq-accordion.ts (ładowana zawsze); ten moduł
// wpina animator GSAP — tween `height 0 ↔ auto` (pomiar wyłącznie przy
// kliknięciu, po tweenie clearProps → kontrola wraca do CSS). Po każdym
// open/close ScrollTrigger.refresh(): akordeon zmienia wysokość strony,
// więc triggery sekcji niżej (Kontakt) muszą dostać świeże pozycje
// (Lenis sam nadąża).
//
// Ładowany DYNAMICZNIE z bramki motion w Faq.astro (przy reduce akordeon
// działa bez tweenów — sam faq-accordion.ts); pas bezpieczeństwa motionOK
// w runtime: motionMedia() w @/scripts/section-helpers.
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
import {
  FAQ_CTA_START,
  FAQ_DESKTOP_MIN_PX,
  FAQ_GHOST_PARALLAX,
  FAQ_HEAD_START,
  FAQ_LIST_START,
} from "./faq-config";

gsap.registerPlugin(ScrollTrigger);

export function initFaqScroll(): void {
  const section = document.querySelector<HTMLElement>("#faq");
  if (!section) return;

  const { q } = scopedQueries(section);
  const head = q(".fq-head");
  const ghost = q(".fq-ghost");
  const list = q(".fq-list");
  const more = q(".fq-more");
  const cta = q(".fq-cta");

  /* ── akordeon: animator wysokości (tween GSAP, wspólna fabryka) ── */
  initFaqAccordion(section, createFaqHeightAnimator());

  /* ── wejścia: once → klasa .on (animuje CSS transition) ── */
  if (head && ghost) revealOnce(head, FAQ_HEAD_START, [head, ghost]);
  if (list) revealOnce(list, FAQ_LIST_START);
  // Blok „więcej" (→ /faq/) dzieli próg wejścia z CTA (referencja: top 92%).
  if (more) revealOnce(more, FAQ_CTA_START);
  if (cta) revealOnce(cta, FAQ_CTA_START);

  /* ── desktop: leniwy parallax ghosta (sam transform, scrub) ── */
  motionMedia(FAQ_DESKTOP_MIN_PX, (isDesktop) => {
    if (!isDesktop || !ghost) return;
    ghostParallax(ghost, section, FAQ_GHOST_PARALLAX);
  });

  // Pozycje triggerów po zbudowaniu sekcji (wzorzec pozostałych sekcji).
  ScrollTrigger.refresh();
}
