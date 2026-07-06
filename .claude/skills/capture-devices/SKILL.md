---
name: capture-devices
description: Regeneracja nagrań MP4 ekranów urządzeń w hero (laptop + telefon) przez scripts/capture-device-videos.mjs, z pre-checkami środowiska i weryfikacją wyniku. Użyj po zmianach w LaptopSite/PhoneSite lub gdy wideo w hero jest nieaktualne.
---

## Pre-checki (wszystkie muszą przejść zanim odpalisz nagranie)

```!
command -v ffmpeg >/dev/null && echo "ffmpeg OK" || echo "BRAK ffmpeg (brew install ffmpeg)"
command -v cwebp >/dev/null && echo "cwebp OK" || echo "BRAK cwebp (brew install webp)"
lsof -nP -iTCP:4337 -sTCP:LISTEN || echo "dev server na 4337 NIE dziala"
```

1. Skrypt domyślnie celuje w port **4337** — uruchom `pnpm dev --port 4337`
   w tle, albo wskaż działający port przez zmienną `CAP_PORT`.
2. NIE uruchamiaj nagrania świeżo po `pnpm typecheck` — Vite potrafi
   zwracać 504 na moduły; w razie 504 zrestartuj dev server.
3. Upewnij się, że nic nie wymusza `prefers-reduced-motion` (nagrałbyś
   statyczną scenę).

## Nagranie

- Oba urządzenia: `node scripts/capture-device-videos.mjs`
- Tylko jedno: dopisz `laptop` lub `phone`; `--recapture` wymusza nowe
  klatki; `--sample` = szybka próbka tempa.
- Skrypt tymczasowo tworzy `src/pages/capture.astro` — po zakończeniu
  sprawdź, że plik ZNIKNĄŁ (gdyby proces padł: usuń ręcznie).

## Weryfikacja wyniku

```!
ls -la public/drewelomet/video/ 2>/dev/null
```

- `ffprobe` na obu MP4: wymiary, fps, czas trwania zgodne z poprzednimi;
  rozmiary plików w okolicach dotychczasowych (twardy limit wagi w enkodzie).
- Postery `.webp` odświeżone.
- Wizualnie: `/verify-mobile` albo szybki screenshot hero na mobile.
