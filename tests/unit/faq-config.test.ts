// Inwarianty sekcji „FAQ" (faq-config.ts). Testujemy WYŁĄCZNIE publiczne
// stałe — kontrakt, nie implementację. Świadoma zmiana choreografii ⇒
// aktualizacja testu razem z konfigiem w tym samym PR. Decyzje portu:
// docs/analiza-sekcja-faq.md.
import { describe, expect, it } from "vitest";
import { SERVICES_DESKTOP_MIN_PX } from "../../src/components/sections/services/services-config";
import {
  FAQ_CLOSE_DUR,
  FAQ_DESKTOP_MIN_PX,
  FAQ_GHOST_PARALLAX,
  FAQ_ITEM_COUNT,
  FAQ_OPEN_DUR,
} from "../../src/components/sections/faq/faq-config";
import { ui } from "../../src/i18n/ui";

describe("faq-config: sekcja FAQ", () => {
  it("breakpoint desktopu = 861 (kontrakt z literałami @media w Faq.astro)", () => {
    // Świadoma zmiana progu ⇒ zaktualizuj RAZEM: tę asercję oraz literały
    // @media (861px / 860.98px) w Faq.astro.
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

  it("parallax ghosta jedzie w dół (od ujemnego do dodatniego px)", () => {
    const [from, to] = FAQ_GHOST_PARALLAX;
    expect(from).toBeLessThan(0);
    expect(to).toBeGreaterThan(0);
  });

  it("liczba pytań = 6 i każdy język ma komplet kluczy faq.qN/faq.aN", () => {
    // Kontrakt markup (Faq.astro) ↔ stagger --d (nth-child 1..6) ↔ i18n.
    expect(FAQ_ITEM_COUNT).toBe(6);
    for (const lang of Object.keys(ui) as (keyof typeof ui)[]) {
      const keys = Object.keys(ui[lang]);
      for (let n = 1; n <= FAQ_ITEM_COUNT; n++) {
        expect(keys, `${lang}: faq.q${n}`).toContain(`faq.q${n}`);
        expect(keys, `${lang}: faq.a${n}`).toContain(`faq.a${n}`);
      }
      expect(
        keys,
        `${lang}: faq.q${FAQ_ITEM_COUNT + 1} nie istnieje`,
      ).not.toContain(`faq.q${FAQ_ITEM_COUNT + 1}`);
    }
  });
});
