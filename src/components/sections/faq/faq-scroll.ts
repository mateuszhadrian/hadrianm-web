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
import { initFaqAccordion, type FaqHeightAnimator } from "./faq-accordion";
import {
  FAQ_CLOSE_DUR,
  FAQ_CTA_START,
  FAQ_DESKTOP_MIN_PX,
  FAQ_GHOST_PARALLAX,
  FAQ_HEAD_START,
  FAQ_LIST_START,
  FAQ_OPEN_DUR,
} from "./faq-config";

gsap.registerPlugin(ScrollTrigger);

export function initFaqScroll(): void {
  const section = document.querySelector<HTMLElement>("#faq");
  if (!section) return;

  const { q } = scopedQueries(section);
  const head = q(".fq-head");
  const ghost = q(".fq-ghost");
  const list = q(".fq-list");
  const cta = q(".fq-cta");

  /* ── akordeon: animator wysokości (tween GSAP) ── */
  const animator: FaqHeightAnimator = {
    beforeToggle(answer, open) {
      gsap.killTweensOf(answer);
      // Zamrożenie wysokości PRZED zdjęciem klasy .open — inaczej CSS
      // (height: 0) ściąłby odpowiedź skokiem, zanim ruszy tween.
      if (!open) gsap.set(answer, { height: answer.offsetHeight });
    },
    afterToggle(answer, open) {
      const onComplete = () => {
        gsap.set(answer, { clearProps: "height" });
        ScrollTrigger.refresh();
      };
      if (open) {
        // Przerwany tween zamykania zostawia inline height — start z miejsca.
        const startHeight = answer.style.height ? answer.offsetHeight : 0;
        gsap.fromTo(
          answer,
          { height: startHeight },
          {
            height: "auto",
            duration: FAQ_OPEN_DUR,
            ease: "power3.out",
            onComplete,
          },
        );
      } else {
        gsap.to(answer, {
          height: 0,
          duration: FAQ_CLOSE_DUR,
          ease: "power3.inOut",
          onComplete,
        });
      }
    },
  };
  initFaqAccordion(section, animator);

  /* ── wejścia: 3 × once → klasa .on (animuje CSS transition) ── */
  if (head && ghost) revealOnce(head, FAQ_HEAD_START, [head, ghost]);
  if (list) revealOnce(list, FAQ_LIST_START);
  if (cta) revealOnce(cta, FAQ_CTA_START);

  /* ── desktop: leniwy parallax ghosta (sam transform, scrub) ── */
  motionMedia(FAQ_DESKTOP_MIN_PX, (isDesktop) => {
    if (!isDesktop || !ghost) return;
    ghostParallax(ghost, section, FAQ_GHOST_PARALLAX);
  });

  // Pozycje triggerów po zbudowaniu sekcji (wzorzec pozostałych sekcji).
  ScrollTrigger.refresh();
}
