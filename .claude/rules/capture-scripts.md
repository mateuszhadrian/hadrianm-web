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

## Siatka regresyjna hero

- Dawny `scripts/verify-hero.mjs` został WYCOFANY (2026-07-07) — sweep
  hero żyje w `tests/visual/hero.spec.ts` (mechanika 1:1, baseline'y
  commitowane w `tests/visual/__screenshots__/`). Kontrakt testowy:
  `.claude/rules/testing.md`; wejście: skill `/verify-mobile`.
