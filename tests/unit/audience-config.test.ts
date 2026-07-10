// Inwarianty osi scrolla sekcji „Dla kogo" (audience-config.ts). Testujemy
// WYŁĄCZNIE publiczne stałe — kontrakt, nie implementację. Gdy Mateusz
// świadomie zmienia choreografię, ten test aktualizuje się razem z konfigiem
// w tym samym PR. Decyzje portu: docs/analiza-sekcja-dla-kogo.md.
import { describe, expect, it } from "vitest";
import {
  AUDIENCE_DESKTOP_MIN_PX,
  AUDIENCE_FAN,
  AUDIENCE_SCRUB,
  AUDIENCE_SNAP_POINTS,
  AUDIENCE_STAGE_THRESHOLDS,
} from "../../src/components/sections/audience/audience-config";

describe("audience-config: oś przypiętej sceny", () => {
  it("breakpoint desktopu = 861 (kontrakt z literałami @media w Audience.astro)", () => {
    // Świadoma zmiana progu ⇒ zaktualizuj RAZEM: tę asercję oraz oba
    // @media (min-width: 861px) w Audience.astro i AudienceMockWindow.astro.
    expect(AUDIENCE_DESKTOP_MIN_PX).toBe(861);
  });

  it("scrub i wachlarz są dodatnie", () => {
    expect(AUDIENCE_SCRUB).toBeGreaterThan(0);
    expect(AUDIENCE_FAN).toBeGreaterThan(0);
  });

  it("punkty snapa: 4 punkty spoczynku (intro + 3 karty), rosnące w (0, 1)", () => {
    expect(AUDIENCE_SNAP_POINTS).toHaveLength(4);
    for (const p of AUDIENCE_SNAP_POINTS) {
      expect(p).toBeGreaterThan(0);
      expect(p).toBeLessThan(1);
    }
    for (let i = 1; i < AUDIENCE_SNAP_POINTS.length; i++) {
      expect(AUDIENCE_SNAP_POINTS[i]).toBeGreaterThan(
        AUDIENCE_SNAP_POINTS[i - 1],
      );
    }
  });

  it("progi progresu: 3 progi (4 stany), rosnące w (0, 1)", () => {
    expect(AUDIENCE_STAGE_THRESHOLDS).toHaveLength(3);
    for (const t of AUDIENCE_STAGE_THRESHOLDS) {
      expect(t).toBeGreaterThan(0);
      expect(t).toBeLessThan(1);
    }
    for (let i = 1; i < AUDIENCE_STAGE_THRESHOLDS.length; i++) {
      expect(AUDIENCE_STAGE_THRESHOLDS[i]).toBeGreaterThan(
        AUDIENCE_STAGE_THRESHOLDS[i - 1],
      );
    }
  });

  it("mapowanie snap→stan zamrożone z prototypu: [01, 01, 02, 04]", () => {
    // Bespoke zachowanie referencji (intro i karta 1 dzielą stan „01",
    // finał-wachlarz przeskakuje na „04") — zamrożone świadomie; zmiana
    // wymaga decyzji Mateusza, nie „poprawki".
    const [s1, s2, s3] = AUDIENCE_STAGE_THRESHOLDS;
    const stageAt = (p: number) => (p < s1 ? 0 : p < s2 ? 1 : p < s3 ? 2 : 3);
    expect(AUDIENCE_SNAP_POINTS.map(stageAt)).toEqual([0, 0, 1, 3]);
  });
});
