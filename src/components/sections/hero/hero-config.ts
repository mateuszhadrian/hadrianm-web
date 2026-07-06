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
/** Tempo scrubu wejścia: ekrany scrolla na 1 jednostkę osi tl. Stała jest
 *  NIEZALEŻNA od MOB_SETTLE_START — przesunięcie startu urządzeń nie zmienia
 *  prędkości zjazdu headline'u ani zaniku słowa (skraca tylko całą scenę).
 *  Wartość utrwala tempo sprzed uzależnienia: 4 ekrany / oś długości 1.5. */
export const MOBILE_SCREENS_PER_TL = 4 / 1.5;

/** Wspólne okno „osadzania" urządzeń: wjazd z boków ORAZ rozsunięcie/
 *  pomniejszenie dzielą start/czas/ease → jeden ciągły ruch. Start w trakcie
 *  zjazdu headline'u (head: yPercent −110 na tl 0→0.6) — urządzenia mają być
 *  widoczne, gdy „strona, która" chowa się jeszcze pod navbarem. */
export const MOB_SETTLE_START = 0.15;
export const MOB_SETTLE_DUR = 0.9;
export const MOB_SETTLE_EASE = "power3.out";

/** Fade-in copy (02/03): start MOB_COPY_FADE_LEAD przed końcem osadzania. */
export const MOB_COPY_FADE_LEAD = 0.4;
export const MOB_COPY_FADE_DUR = 0.5;

/** POCHODNA: długość osi tl wejścia = koniec ostatniego tweena (fade copy). */
export const MOBILE_TL_LENGTH =
  MOB_SETTLE_START + MOB_SETTLE_DUR - MOB_COPY_FADE_LEAD + MOB_COPY_FADE_DUR;
/** POCHODNA: buildBase(MOBILE_SCREENS × SCROLL_SCALE) — długość scrubu
 *  wejścia w ekranach; wcześniejszy MOB_SETTLE_START = krótszy scrub. */
export const MOBILE_SCREENS = MOBILE_TL_LENGTH * MOBILE_SCREENS_PER_TL;

/** Głębia wjazdu urządzeń w px projektu (dzielona przez skalę .fit). */
export const MOB_ENTRY_Z_PX = 340;

/** Powiększenie ekranu wideo w szczycie strefy + kształt krzywej:
 *  1→MAX (do GROW_END), MAX (do HOLD_END ≈ 2 ekrany), MAX→1. */
export const VID_MAX = 1.5;
export const GROW_END = 1 / 4;
export const HOLD_END = 3 / 4;

/** GŁÓWNE POKRĘTŁO długości sceny urządzeń (mobile): ile ekranów scrolla
 *  trwa strefa KAŻDEGO urządzenia (laptop i telefon). Pasek postępu z prawej
 *  biegnie od startu strefy laptopa do końca strefy telefonu, więc niższa
 *  wartość = krótsza cała animacja z paskiem (i krótsza sekcja — wysokość
 *  jest pochodną). Kształt grow/hold/shrink (GROW_END/HOLD_END) to ułamki
 *  strefy, więc skaluje się sam. */
export const MOB_ZONE_SCREENS = 2;
/** Odstęp (w ekranach) między strefą laptopa a telefonu. */
export const MOB_ZONE_GAP = 0.4;

/** POCHODNA: koniec RUCHU osadzania urządzeń w ekranach scrolla — kotwica
 *  stref. Celowo bez ogona fade-inu copy (MOBILE_SCREENS): strefa laptopa
 *  (pasek z prawej + powiększanie ekranu) startuje DOKŁADNIE w chwili, gdy
 *  urządzenia nieruchomieją — zero martwego okna scrolla; fade copy domyka
 *  się równolegle z początkiem wzrostu laptopa. */
export const MOB_SETTLE_END_SCREENS =
  (MOB_SETTLE_START + MOB_SETTLE_DUR) * MOBILE_SCREENS_PER_TL;

/** Strefy urządzeń (vh od góry #hero) — POCHODNE: kotwiczone do końca
 *  osadzania (MOB_SETTLE_END_SCREENS), więc przesuwają się razem z
 *  wcześniejszym/późniejszym startem urządzeń; skalowane z długością sceny. */
export const LAP_ZONE = {
  start: MOB_SETTLE_END_SCREENS * SCROLL_SCALE,
  end: (MOB_SETTLE_END_SCREENS + MOB_ZONE_SCREENS) * SCROLL_SCALE,
};
export const PH_ZONE = {
  start:
    (MOB_SETTLE_END_SCREENS + MOB_ZONE_SCREENS + MOB_ZONE_GAP) * SCROLL_SCALE,
  end:
    (MOB_SETTLE_END_SCREENS + 2 * MOB_ZONE_SCREENS + MOB_ZONE_GAP) *
    SCROLL_SCALE,
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
