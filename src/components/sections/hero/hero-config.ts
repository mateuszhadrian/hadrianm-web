// Jedno źródło prawdy dla OSI SCROLLA hero (krok 1 refactoru — patrz
// docs/analiza-refactor-hero-odkruszenie.md, problem S1).
//
// Zasada: wartości POCHODNE (CAP_END, *_MIN_HEIGHT_SVH) liczy kod — nigdy nie
// przeliczaj ich ręcznie i nie wpisuj wyników do CSS/komentarzy. Wartości w
// CSS Hero.astro (1233svh / 1500svh) są wyłącznie wstępne (przed hydracją);
// finalne ustawia JS z tego modułu.

/* ── DESKTOP: oś timeline (scrub w „sekundach" osi tl; scroll w ekranach) ── */

/** Długość scrubu: ScrollTrigger end = innerHeight × SCREENS (≈ 1200svh). */
export const DESKTOP_SCREENS = 12;
/** Krótsza scena, gdy LaptopSite nie wstał (degradacja bez fazy 3). */
export const DESKTOP_SCREENS_FALLBACK = 4;

/** Start fazy 3 — przejazd strony drewelomet na ekranie laptopa. */
export const PH3_START = 0.9;
export const DREWELOMET_DUR = 5.0;

/** Przejazd strony telefonu (faza 3b). */
export const PHONE_START = 2.0;
export const PHONE_END = 5.9;
/** Efektywna długość timeline'u = koniec ostatniego tweena (przejazd telefonu). */
export const TL_LENGTH = PHONE_END;

/** Start karuzeli captionów (lewa kolumna, desktop). */
export const CAP_START = 1.95;
/** Moment doghouse.webp w przejeździe drewelomet — koniec karuzeli ma z nim
 *  być zsynchronizowany (finalny caption osiada, gdy budka jest w kadrze). */
export const DOG_SITE_PROGRESS = 0.934;
/** POCHODNA: koniec karuzeli na osi tl. */
export const CAP_END = PH3_START + DREWELOMET_DUR * DOG_SITE_PROGRESS;

/** POCHODNA: wysokość sekcji (desktop). Pin (CSS-sticky) jest rozłączony od
 *  scrubu GSAP; dystans przypięcia = min-height − stage(100svh). Sticky ma
 *  puścić dokładnie, gdy finalny caption osiada (CAP_END na osi tl):
 *  100svh stage + (CAP_END / TL_LENGTH) × SCREENS × 100svh scrubu.
 *  Math.round → 1233 (zgodność 1:1 z dotychczasową wartością w CSS). */
export const DESKTOP_MIN_HEIGHT_SVH = Math.round(
  100 + (CAP_END / TL_LENGTH) * DESKTOP_SCREENS * 100,
);

/* ── MOBILE: oś w jednostkach wysokości viewportu (svh od góry #hero) ── */

/** Skraca scenę Hero (Lenis spowalnia scroll globalnie); niżej = krótsze. */
export const SCROLL_SCALE = 0.95;
/** buildBase(MOBILE_SCREENS_BASE × SCROLL_SCALE) — długość scrubu wejścia. */
export const MOBILE_SCREENS_BASE = 4;

/** Wspólne okno „osadzania" urządzeń: wjazd z boków ORAZ rozsunięcie/
 *  pomniejszenie dzielą start/czas/ease → jeden ciągły ruch. */
export const MOB_SETTLE_START = 0.5; // start po zaniku słowa "Ciebie"
export const MOB_SETTLE_DUR = 0.9;
export const MOB_SETTLE_EASE = "power3.out";

/** Głębia wjazdu urządzeń w px projektu (dzielona przez skalę .fit). */
export const MOB_ENTRY_Z_PX = 340;

/** Powiększenie ekranu wideo w szczycie strefy + kształt krzywej:
 *  1→MAX (do GROW_END), MAX (do HOLD_END ≈ 2 ekrany), MAX→1. */
export const VID_MAX = 1.5;
export const GROW_END = 1 / 4;
export const HOLD_END = 3 / 4;

/** Strefy urządzeń (vh od góry #hero) — skalowane razem z długością sceny. */
export const LAP_ZONE = {
  start: 4.4 * SCROLL_SCALE,
  end: 8.4 * SCROLL_SCALE,
};
export const PH_ZONE = {
  start: 8.8 * SCROLL_SCALE,
  end: 12.8 * SCROLL_SCALE,
};

/** Ekrany od dojechania kulki paska do odpięcia sticky. */
export const HERO_END_BUFFER = 0.2;
/** POCHODNA: wysokość sekcji (mobile) — odpięcie tuż po dojechaniu kulki;
 *  sticky puszcza przy scrollu = min-height − stage(100svh). */
export const MOBILE_MIN_HEIGHT_SVH = Math.round(
  (PH_ZONE.end + 1 + HERO_END_BUFFER) * 100,
);

/** Odstępy divider→spód urządzenia (px viewportu; pozycjonowanie Android). */
export const GAP_LAP_DIV = 23; // laptop.bottom → divider 02
export const GAP_PH_DIV = 21; // phone.bottom → divider 03
