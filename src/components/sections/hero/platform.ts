// Jedno źródło prawdy dla DETEKCJI PLATFORMY i breakpointu hero (krok 2
// refactoru — docs/analiza-refactor-hero-odkruszenie.md, problemy S2/S3).

/** Czy bieżące urządzenie to Android (smartfon/tablet z Androidem). */
export const IS_ANDROID =
  typeof navigator !== "undefined" && /android/i.test(navigator.userAgent);

/** Breakpoint układu mobilnego hero. Media queries w CSS (Hero.astro,
 *  DeviceScene.astro) trzymają literał 760/761 — przy zmianie zaktualizuj
 *  je razem z tą stałą (oznaczone komentarzem „= MOBILE_MAX"). */
export const MOBILE_MAX = 760;
export const MOBILE_MQ = `(max-width: ${MOBILE_MAX}px)`;
export const DESKTOP_MQ = `(min-width: ${MOBILE_MAX + 1}px)`;

/** Współczynnik rozmiaru PROJEKTOWEGO sceny urządzeń na Androidzie.
 *  Scena autorowana w dużych design-px przekraczała limit rozmiaru warstwy
 *  GPU Androida (obcinany spód telefonu) — mniejsze px projektu × kompensata
 *  w fit() = identyczny wygląd, rasteryzowana warstwa ~K× mniejsza.
 *  Spec: docs/naprawa-android-scena-urzadzen-mobile.md.
 *
 *  Konsumenci (oba czytają TĘ stałą — nie duplikuj wartości):
 *  - device-scene.ts: K() do geometrii/bbox w JS,
 *  - Hero.astro: wystawia ją jako --android-design-scale na <html> razem
 *    z klasą is-android; CSS DeviceScene.astro robi z niej --k WYŁĄCZNIE
 *    pod (max-width: MOBILE_MAX) + html.is-android. iPhone/iOS nigdy nie
 *    dostaje is-android → --k=1 (starszy Safari bez @property zostaje na
 *    gołych px — patrz komentarze w DeviceScene.astro). */
export const ANDROID_DESIGN_SCALE = 0.6;
