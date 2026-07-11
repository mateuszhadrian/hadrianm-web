// Akordeon sekcji „FAQ" — czysta logika stanu, BEZ GSAP (decyzje:
// docs/analiza-sekcja-faq.md §II.1). Ładowany zawsze (także przy
// prefers-reduced-motion: reduce — akordeon to interakcja, nie animacja):
// klasy `.open` + `aria-expanded` sterują stanem, wysokość odpowiedzi
// realizuje CSS (`height 0 ↔ auto` pod klasą .js sekcji). Płynny tween
// wysokości wpina moduł faq-scroll.ts (motion OK) przez animator —
// bez animatora przełączenie jest natychmiastowe (wymaganie reduce).
//
// Markup startuje z aria-expanded="true" (= stan bez JS: wszystko
// rozwinięte, fallback SEO); init zamyka wszystko i ustawia "false".

/** Hooki tweenu wysokości — implementuje faq-scroll.ts (GSAP). */
export interface FaqHeightAnimator {
  /** Przed przełączeniem klasy `.open` (kill tweenów, zamrożenie wysokości). */
  beforeToggle(answer: HTMLElement, open: boolean): void;
  /** Po przełączeniu klasy `.open` (tween height 0 ↔ auto + refresh). */
  afterToggle(answer: HTMLElement, open: boolean): void;
}

export function initFaqAccordion(
  section: HTMLElement,
  animator?: FaqHeightAnimator,
): void {
  const items = Array.from(
    section.querySelectorAll<HTMLElement>(".fq-item"),
  ).flatMap((item) => {
    const button = item.querySelector<HTMLElement>(".fq-q");
    const answer = item.querySelector<HTMLElement>(".fq-a");
    return button && answer ? [{ item, button, answer }] : [];
  });

  function setOpen(entry: (typeof items)[number], open: boolean): void {
    animator?.beforeToggle(entry.answer, open);
    entry.item.classList.toggle("open", open);
    entry.button.setAttribute("aria-expanded", open ? "true" : "false");
    animator?.afterToggle(entry.answer, open);
  }

  for (const entry of items) {
    entry.button.setAttribute("aria-expanded", "false");
    entry.button.addEventListener("click", () => {
      const wasOpen = entry.item.classList.contains("open");
      // Jedno pytanie otwarte naraz — otwarcie nowego domyka poprzednie.
      for (const other of items) {
        if (other !== entry && other.item.classList.contains("open")) {
          setOpen(other, false);
        }
      }
      setOpen(entry, !wasOpen);
    });
  }
}
