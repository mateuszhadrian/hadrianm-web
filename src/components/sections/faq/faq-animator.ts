// Animator wysokości akordeonu FAQ — tween GSAP `height 0 ↔ auto` (pomiar
// wyłącznie przy kliknięciu, po tweenie clearProps → kontrola wraca do CSS).
// Po każdym open/close ScrollTrigger.refresh(): akordeon zmienia wysokość
// strony, więc triggery poniżej muszą dostać świeże pozycje (Lenis nadąża).
// Wspólny dla faq-scroll.ts (strona główna) i faq-page-scroll.ts (podstrona
// /faq/) — importować WYŁĄCZNIE z modułów motion (gsap nie może trafić do
// bundle'a gałęzi reduce; decyzje: docs/analiza-podstrona-faq.md §III.3).
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { FaqHeightAnimator } from "./faq-accordion";
import { FAQ_CLOSE_DUR, FAQ_OPEN_DUR } from "./faq-config";

gsap.registerPlugin(ScrollTrigger);

export function createFaqHeightAnimator(): FaqHeightAnimator {
  return {
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
}
