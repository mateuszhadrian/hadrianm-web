// Inwarianty osi scrolla sekcji „Oferta" (services-config.ts). Testujemy
// WYŁĄCZNIE publiczne stałe — kontrakt, nie implementację. Gdy Mateusz
// świadomie zmienia choreografię, ten test aktualizuje się razem z konfigiem
// w tym samym PR. Decyzje portu: docs/analiza-sekcja-oferta.md.
import { describe, expect, it } from "vitest";
import { AUDIENCE_DESKTOP_MIN_PX } from "../../src/components/sections/audience/audience-config";
import {
  SERVICES_DESKTOP_MIN_PX,
  SERVICES_GHOST_PARALLAX,
  SERVICES_READ,
  SERVICES_READ_MOBILE,
  SERVICES_STEP_COUNT,
  SERVICES_THREAD,
  SERVICES_THREAD_MOBILE,
} from "../../src/components/sections/services/services-config";

describe("services-config: oś sekcji Oferta", () => {
  it("breakpoint desktopu = 861 (kontrakt z literałami @media w Services.astro)", () => {
    // Świadoma zmiana progu ⇒ zaktualizuj RAZEM: tę asercję oraz literały
    // @media (861px / 860.98px) w Services.astro.
    expect(SERVICES_DESKTOP_MIN_PX).toBe(861);
  });

  it("breakpoint spójny z sekcją Dla kogo (jedna granica desktop/mobile strony)", () => {
    expect(SERVICES_DESKTOP_MIN_PX).toBe(AUDIENCE_DESKTOP_MIN_PX);
  });

  it("scruby i czasy czytania intro są dodatnie", () => {
    for (const cfg of [SERVICES_READ, SERVICES_READ_MOBILE]) {
      expect(cfg.scrub).toBeGreaterThan(0);
      expect(cfg.duration).toBeGreaterThan(0);
      expect(cfg.span).toBeGreaterThan(0);
    }
    expect(SERVICES_THREAD.scrub).toBeGreaterThan(0);
    expect(SERVICES_THREAD_MOBILE.scrub).toBeGreaterThan(0);
  });

  it("mobile czyta lżej niż desktop (mniejszy rozrzut staggera zdań)", () => {
    // Zamrożone z prototypu: desktop span 8 (słowa), mobile span 6 (zdania).
    expect(SERVICES_READ_MOBILE.span).toBeLessThan(SERVICES_READ.span);
  });

  it("proces ma 5 kroków (kontrakt markup ↔ moduł ↔ progres 01–05)", () => {
    expect(SERVICES_STEP_COUNT).toBe(5);
  });

  it("parallax cyfr-ghost jest dodatni", () => {
    expect(SERVICES_GHOST_PARALLAX).toBeGreaterThan(0);
  });
});
