---
paths:
  - "scripts/**/*.mjs"
  - "scripts/**/*.astro"
---

# Skrypty dev-only (capture / optymalizacja) — reguły

- `capture-device-videos.mjs` nagrywa MP4 ekranów urządzeń do
  `public/drewelomet/video/`. Wymaga: działający `pnpm dev` (port z
  `CAP_PORT`, domyślnie 4337), `ffmpeg`, `cwebp` (brew install ffmpeg webp).
- Skrypt kopiuje harness `scripts/capture-harness.astro` do
  `src/pages/capture.astro` NA CZAS nagrania i usuwa po — jeśli nagranie
  padnie w połowie, sprawdź czy plik nie został; nie może trafić do builda.
- Gotchas: świeżo po `pnpm typecheck` Vite potrafi zwracać 504 na moduły —
  odczekaj/zrestartuj dev server; Playwright musi mieć WYŁĄCZONE
  emulowanie `prefers-reduced-motion` (inaczej nagrywa statyczną scenę).
- Po nagraniu weryfikuj `ffprobe` (wymiary, fps, czas) i rozmiar plików —
  pipeline enkoduje dwuprzebiegowo pod twardy limit wagi.
- Preferowane wejście: skill `/capture-devices` (ma pre-checki).
- `capture-ambient-bg.mjs` (`pnpm capture:ambient-bg`) to INNY pipeline:
  samowystarczalny (Playwright + sharp, paleta z `ambient-palette.ts`) —
  bez dev servera, ffmpeg/cwebp i skilla `/capture-devices`; regeneruje
  `public/ambient-bg-mobile-{red,blue}.webp` po zmianie wyglądu
  `AmbientBackground` / palety.

## Wideo realizacji — `capture-site-videos.mjs` (`pnpm capture:site`)

- Nagrywa PUBLICZNĄ stronę klienta (nie nasz dev server): choreografia D7
  z `docs/analiza-realizacje-wideo.md` (hold → zjazd → hold → powrót → hold,
  ~11 s, 30 fps), viewporty 1440×900 (laptop, DPR 1) i 390×800 (telefon,
  DPR 2 → skalowanie w dół do 432 px), ≤ 800 KB/plik, poster = klatka 0.
- Tryb domyślny `clock`: fałszywy zegar Playwrighta (`page.clock`) +
  krokowanie animacji CSS przez Web Animations API i `<video>` strony
  klienta (pauza + `currentTime`) → każda klatka = 1/30 s czasu strony,
  powtarzalne co do klatki. Funkcja krokująca (`stepPageTime`) MUSI być
  prawdziwą funkcją: `page.evaluate(STRING)` ewaluuje string jako
  wyrażenie i NIC nie wywołuje (błąd P4 — animacje CSS biegły w czasie
  rzeczywistym). Objaw do rozpoznania na kontakt-arkuszu: slider/ken-burns
  zmienia się szybciej niż na żywo. Animacja widziana po raz pierwszy liczy
  się od POPRZEDNIEGO kroku (przejścia CSS sterowane scrollem powstają po
  kroku — od zera element „zacina się"). `<video>` klienta: Δt ×
  `playbackRate`, `ended` po końcu, klatka 0 w fazie „po wejściu"; pliki
  wideo idą przez `route` z obsługą Range (bez 206 Chromium nie przewija —
  `nowa.hetmannieruchomosci.com`). `--mode record` = nagranie webm w
  czasie rzeczywistym (fallback, gdy strona nie znosi fałszywego zegara).
- Szew pętli: elementy „żyjące w czasie" (slider hero, ken-burns) robią
  ostatnią klatkę ≠ klatce 0 — końcowy hold jest WTAPIANY w klatkę 0
  (wypieczony crossfade; `--no-loop-blend` wyłącza). Runtime NIE robi
  crossfade'u (plan §10).
- Nakładki stron klientów (cookie, chat): `--hide ".sel,.sel"`; strona
  z Lenisem: `--lenis`. Strojenie: `--depth-desktop/--depth-mobile` (× vh),
  `--hold/--down/--hold-bottom/--up/--hold-end` (s). `--sample` = 10 fps
  do szybkiego podglądu tempa; `--keep-frames` + brak `--recapture` =
  re-enkod bez ponownego nagrania. Pozostałe ekrany wpisu (galeria,
  oferta…): `--screens "gallery=/realizacje/,offer=/oferta/"` = statyczne
  zrzuty podstron tym samym viewportem (1440 px / 780 px, WebP q80) do
  `<slug>/screens/`; z `--device none` bez nagrania.
- Wyjście POZA repo (`~/hadrianm-site-videos/<slug>/`); skrypt wypisuje
  gotowe URL-e R2 (`…/realizacje/<slug>-<key>-desktop.mp4` — płasko obok
  zdjęć: Sveltia ma jeden prefix uploadu dla `image` i `file`) — do R2
  wgrywa panel (pola „Wideo ekranu" = widget `file`, postery `.webp` przez
  pola „Zrzut"). Po wpisie: `CHECK_REMOTE_MEDIA=1 pnpm exec vitest run
tests/unit/media-r2.test.ts` (regex łapie też `.mp4`).

## Siatka regresyjna hero

- Dawny `scripts/verify-hero.mjs` został WYCOFANY (2026-07-07) — sweep
  hero żyje w `tests/visual/hero.spec.ts` (mechanika 1:1, baseline'y
  commitowane w `tests/visual/__screenshots__/`). Kontrakt testowy:
  `.claude/rules/testing.md`; wejście: skill `/verify-mobile`.
