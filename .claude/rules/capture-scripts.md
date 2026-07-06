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

## Siatka regresyjna hero (`verify-hero.mjs`)

- `--baseline` zapisuje wzorzec do `.hero-verify/baseline/` (poza gitem);
  bez flagi porównuje pixel-diffem (obrazy różnic → `.hero-verify/diff/`).
- WYMAGA preview builda: `pnpm build && pnpm preview --port 4399` +
  `BASE_URL=http://localhost:4399` (na 4321 często wisi dev server do
  testów na telefonie — skrypt wykrywa `/@vite/client` i przerwie).
- Determinizm: skrypt sam wyłącza czasowe animacje CSS i chowa piksele
  wideo (odtwarzanie sprawdza funkcjonalnie — log `paused`/`currentTime`).
- Zamierzona zmiana wyglądu hero = po akceptacji przez Mateusza nagraj
  nowy baseline.
