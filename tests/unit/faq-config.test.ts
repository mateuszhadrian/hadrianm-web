// Inwarianty sekcji „FAQ" (faq-config.ts) i jedynego źródła pytań
// (src/i18n/faq.ts). Testujemy WYŁĄCZNIE publiczne stałe i dane — kontrakt,
// nie implementację. Świadoma zmiana choreografii/liczby pytań ⇒ aktualizacja
// testu razem z konfigiem/danymi w tym samym PR. Decyzje portu:
// docs/analiza-sekcja-faq.md + docs/analiza-podstrona-faq.md.
import { describe, expect, it } from "vitest";
import { SERVICES_DESKTOP_MIN_PX } from "../../src/components/sections/services/services-config";
import {
  FAQ_BATCH_STAGGER,
  FAQ_CLOSE_DUR,
  FAQ_DESKTOP_MIN_PX,
  FAQ_GHOST_PARALLAX,
  FAQ_OPEN_DUR,
  FAQ_PAGE_GHOST_PARALLAX,
  FAQ_TEASER_COUNT,
} from "../../src/components/sections/faq/faq-config";
import { faqItems } from "../../src/i18n/faq";

describe("faq-config: sekcja FAQ", () => {
  it("breakpoint desktopu = 861 (kontrakt z literałami @media w Faq.astro i FaqFull.astro)", () => {
    // Świadoma zmiana progu ⇒ zaktualizuj RAZEM: tę asercję oraz literały
    // @media (861px / 860.98px) w Faq.astro i FaqFull.astro.
    expect(FAQ_DESKTOP_MIN_PX).toBe(861);
  });

  it("breakpoint spójny z sekcją Oferta (jedna granica desktop/mobile strony)", () => {
    expect(FAQ_DESKTOP_MIN_PX).toBe(SERVICES_DESKTOP_MIN_PX);
  });

  it("tweeny akordeonu są dodatnie, zamykanie krótsze niż otwieranie", () => {
    expect(FAQ_OPEN_DUR).toBeGreaterThan(0);
    expect(FAQ_CLOSE_DUR).toBeGreaterThan(0);
    expect(FAQ_CLOSE_DUR).toBeLessThan(FAQ_OPEN_DUR);
  });

  it("parallax ghosta jedzie w dół (od ujemnego do dodatniego px) — sekcja i podstrona", () => {
    for (const [from, to] of [FAQ_GHOST_PARALLAX, FAQ_PAGE_GHOST_PARALLAX]) {
      expect(from).toBeLessThan(0);
      expect(to).toBeGreaterThan(0);
    }
  });

  it("stagger batcha rejestru podstrony jest dodatni", () => {
    expect(FAQ_BATCH_STAGGER).toBeGreaterThan(0);
  });
});

describe("faq-config: jedno źródło pytań (src/i18n/faq.ts)", () => {
  it("teaser na głównej = 6 pytań (kontrakt slice ↔ stagger --d nth-child 1..6 w CSS)", () => {
    expect(FAQ_TEASER_COUNT).toBe(6);
    // Teaser to prefiks pełnej listy — slice nie może wyjść poza dane.
    expect(faqItems.length).toBeGreaterThanOrEqual(FAQ_TEASER_COUNT);
  });

  it("pełna lista podstrony /faq/ = 30 pytań (docelowa liczba wg referencji)", () => {
    expect(faqItems).toHaveLength(30);
  });

  it("każda pozycja ma niepuste pytanie i odpowiedź w PL i EN", () => {
    faqItems.forEach((item, i) => {
      for (const lang of ["pl", "en"] as const) {
        expect(item.q[lang].trim(), `faqItems[${i}].q.${lang}`).not.toBe("");
        expect(item.a[lang].trim(), `faqItems[${i}].a.${lang}`).not.toBe("");
      }
    });
  });

  it("pytania są unikalne w obu językach (copy-paste guard)", () => {
    for (const lang of ["pl", "en"] as const) {
      const questions = faqItems.map((item) => item.q[lang]);
      expect(new Set(questions).size, `duplikaty: ${lang}`).toBe(
        questions.length,
      );
    }
  });
});
