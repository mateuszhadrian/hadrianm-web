// Sekcja „Kontakt" — stałe konfiguracyjne (port referencji
// docs/design/kontakt-referencja/; decyzje:
// docs/contact-me-form-analysis-implementation.md §3.2 i §8 Etap 2).

/** Breakpoint desktop/mobile — spójny z resztą sekcji (FAQ/Oferta). */
export const CONTACT_DESKTOP_MIN_PX = 861;

/** Pages Function w tym repo (functions/api/kontakt.ts). */
export const CONTACT_ENDPOINT = "/api/kontakt";

/** Klucz PUBLICZNY widgetu Turnstile `hadrianm-kontakt` (sekret żyje
 *  wyłącznie w sekretach projektu Pages jako TURNSTILE_SECRET_KEY). */
export const TURNSTILE_SITE_KEY = "0x4AAAAAADz4VmJXKzTYru3e";
export const TURNSTILE_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

/** Ile czekamy na token — challenge w trybie managed może wymagać
 *  interakcji użytkownika, więc limit musi być ludzki, nie sieciowy. */
export const TURNSTILE_TIMEOUT_MS = 90_000;

/* Wejścia (once → .on; animuje CSS transition) — progi z referencji. */
export const CONTACT_LEAD_START = "top 84%";
export const CONTACT_SIDE_START = "top 88%";
export const CONTACT_FRAME_START = "top 82%";

/** Parallax ghosta „KONTAKT": −30 → +40 px scrub (tylko desktop). */
export const CONTACT_GHOST_PARALLAX = [-30, 40] as const;

/** Banner na stronie głównej (KontaktBaner.astro): skala startowa
 *  „odzoomowania" CTA — scrub prowadzi ją do 1 podczas wjazdu sekcji
 *  (tylko desktop + no-preference). UWAGA: literał scale(1.4) w stanie
 *  startowym CSS KontaktBaner.astro MUSI być równy tej stałej. */
export const KTB_ZOOM_FROM = 1.4;
