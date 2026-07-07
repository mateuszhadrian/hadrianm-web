// Inwarianty osi scrolla hero (hero-config.ts). Testujemy WYŁĄCZNIE publiczne
// stałe i pochodne — kontrakt, nie implementację. Gdy Mateusz świadomie zmienia
// choreografię, ten test aktualizuje się razem z konfigiem w tym samym PR.
import { describe, expect, it } from "vitest";
import {
  BAR_END_SCREENS,
  BAR_START_SCREENS,
  CAP_END,
  CAP_START,
  DESKTOP_MIN_HEIGHT_SVH,
  DESKTOP_SCREENS,
  DESKTOP_SCREENS_FALLBACK,
  DOG_SITE_PROGRESS,
  DREWELOMET_DUR,
  GAP_LAP_DIV,
  GAP_PH_DIV,
  GROW_END,
  HERO_END_BUFFER,
  HOLD_END,
  LAP_SPAN,
  MOB_COPY_FADE_DUR,
  MOB_COPY_FADE_LEAD,
  MOB_SETTLE_DUR,
  MOB_SETTLE_END_SCREENS,
  MOB_SETTLE_START,
  MOBILE_MIN_HEIGHT_SVH,
  MOBILE_SCREENS,
  MOBILE_TL_LENGTH,
  PH_SPAN,
  PH3_START,
  PHONE_END,
  PHONE_START,
  SCROLL_SCALE,
  TL_LENGTH,
  VID_MAX,
} from "../../src/components/sections/hero/hero-config";

describe("hero-config: desktop — oś timeline", () => {
  it("scrub fallback jest krótszy niż pełny", () => {
    expect(DESKTOP_SCREENS_FALLBACK).toBeGreaterThan(0);
    expect(DESKTOP_SCREENS_FALLBACK).toBeLessThan(DESKTOP_SCREENS);
  });

  it("fazy następują po sobie: PH3_START < PHONE_START < PHONE_END", () => {
    expect(PH3_START).toBeGreaterThan(0);
    expect(PH3_START).toBeLessThan(PHONE_START);
    expect(PHONE_START).toBeLessThan(PHONE_END);
  });

  it("długość timeline'u = koniec ostatniego tweena (przejazd telefonu)", () => {
    expect(TL_LENGTH).toBe(PHONE_END);
  });

  it("DOG_SITE_PROGRESS to ułamek przejazdu drewelomet w (0, 1]", () => {
    expect(DOG_SITE_PROGRESS).toBeGreaterThan(0);
    expect(DOG_SITE_PROGRESS).toBeLessThanOrEqual(1);
  });

  it("karuzela captionów mieści się na osi i kończy w oknie drewelomet", () => {
    expect(CAP_START).toBeGreaterThan(0);
    expect(CAP_START).toBeLessThan(CAP_END);
    // CAP_END zsynchronizowany z doghouse.webp — musi wypadać w trakcie
    // przejazdu drewelomet i przed końcem osi (sticky puszcza na CAP_END).
    expect(CAP_END).toBeGreaterThan(PH3_START);
    expect(CAP_END).toBeLessThanOrEqual(PH3_START + DREWELOMET_DUR);
    expect(CAP_END).toBeLessThanOrEqual(TL_LENGTH);
  });

  it("wysokość sekcji desktop = 1233 (zgodność 1:1 z fallbackiem CSS w Hero.astro)", () => {
    // Świadoma zmiana choreografii desktop ⇒ zaktualizuj RAZEM: tę asercję
    // oraz wstępny fallback `min-height: 1233svh` w CSS Hero.astro.
    expect(DESKTOP_MIN_HEIGHT_SVH).toBe(1233);
    expect(Number.isInteger(DESKTOP_MIN_HEIGHT_SVH)).toBe(true);
  });
});

describe("hero-config: mobile — oś w ekranach viewportu", () => {
  it("SCROLL_SCALE to ułamek w (0, 1]", () => {
    expect(SCROLL_SCALE).toBeGreaterThan(0);
    expect(SCROLL_SCALE).toBeLessThanOrEqual(1);
  });

  it("okno osadzania urządzeń jest poprawne i fade copy startuje w jego trakcie", () => {
    expect(MOB_SETTLE_START).toBeGreaterThanOrEqual(0);
    expect(MOB_SETTLE_DUR).toBeGreaterThan(0);
    expect(MOB_COPY_FADE_DUR).toBeGreaterThan(0);
    // Start fade'u = koniec osadzania − LEAD; nie może wypaść przed startem
    // osadzania.
    expect(MOB_COPY_FADE_LEAD).toBeLessThanOrEqual(MOB_SETTLE_DUR);
  });

  it("długość osi tl = koniec ostatniego tweena (nie krótsza niż osadzanie)", () => {
    expect(MOBILE_TL_LENGTH).toBeGreaterThanOrEqual(
      MOB_SETTLE_START + MOB_SETTLE_DUR,
    );
    expect(MOBILE_SCREENS).toBeGreaterThan(0);
  });

  it("krzywa powiększenia ekranu: 0 < GROW_END < HOLD_END < 1, VID_MAX > 1", () => {
    expect(GROW_END).toBeGreaterThan(0);
    expect(GROW_END).toBeLessThan(HOLD_END);
    expect(HOLD_END).toBeLessThan(1);
    expect(VID_MAX).toBeGreaterThan(1);
  });

  it("segmenty paska nie nakładają się: start < laptop < przerwa < telefon = koniec", () => {
    expect(BAR_START_SCREENS).toBeGreaterThanOrEqual(0);
    expect(BAR_START_SCREENS).toBeLessThan(LAP_SPAN.start);
    expect(LAP_SPAN.start).toBeLessThan(LAP_SPAN.end);
    // Przerwa między oknem laptopa a telefonu (DEV_GAP_FRAC > 0).
    expect(LAP_SPAN.end).toBeLessThan(PH_SPAN.start);
    expect(PH_SPAN.start).toBeLessThan(PH_SPAN.end);
    // Okno telefonu domyka się dokładnie z końcem paska.
    expect(PH_SPAN.end).toBe(BAR_END_SCREENS);
  });

  it("okno laptopa startuje DOKŁADNIE z końcem osadzania (zero martwego scrolla)", () => {
    expect(LAP_SPAN.start).toBeCloseTo(
      MOB_SETTLE_END_SCREENS * SCROLL_SCALE,
      10,
    );
  });

  it("sticky puszcza dopiero po dojechaniu kulki paska", () => {
    expect(HERO_END_BUFFER).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(MOBILE_MIN_HEIGHT_SVH)).toBe(true);
    // min-height − stage(100svh) ≥ koniec paska ⇒ odpięcie nie utnie animacji.
    expect(MOBILE_MIN_HEIGHT_SVH).toBeGreaterThanOrEqual(
      Math.floor((BAR_END_SCREENS + 1) * 100),
    );
  });

  it("odstępy divider→spód urządzenia są dodatnie", () => {
    expect(GAP_LAP_DIV).toBeGreaterThan(0);
    expect(GAP_PH_DIV).toBeGreaterThan(0);
  });
});
