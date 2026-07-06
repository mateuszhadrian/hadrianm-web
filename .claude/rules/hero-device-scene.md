---
paths:
  - "src/components/sections/hero/**"
---

# Hero / scena urządzeń — reguły krytyczne

Najbardziej wrażliwy kod w repo. Każda zasada = naprawiona kosztowna
regresja — NIE cofaj ich „przy okazji" refaktorów. Mapa modułów i pełna
historia: `docs/analiza-refactor-hero-odkruszenie.md`.

## Jedno źródło prawdy (inwarianty wymuszane kodem — nie duplikuj wartości)

- Oś scrolla (fazy, strefy, długości): `hero-config.ts`. Wartości POCHODNE
  (`CAP_END`, `*_MIN_HEIGHT_SVH`) liczy kod — nigdy nie wpisuj wyników
  ręcznie do CSS/komentarzy (svh w CSS to tylko fallback przed hydracją).
- Platforma: `platform.ts` (`IS_ANDROID`, `MOBILE_MAX` — literały 760/761
  w media queries CSS mają komentarze „zmieniaj razem",
  `ANDROID_DESIGN_SCALE` — CSS dostaje ją przez `--android-design-scale`).
- Protokół zmiennych CSS sceny (`--sl-*`, `--apart-*`, `--vid-scale`…):
  rejestr `scene-vars.ts`; wartości spoczynkowe = defaulty w CSS
  DeviceScene.astro. Nowa zmienna → dopisz do rejestru, cleanupy pokryją.
- Selektory międzyplikowe: `selectors.ts` (SEL) — zmiana klasy w markupie =
  zmiana jednej stałej; brak węzła loguje ostrzeżenie w dev.

## Metryki viewportu (iOS/Android — NAJCZĘSTSZE źródło regresji)

- Wysokość sekcji hero i triggery ScrollTriggera MUSZĄ dzielić JEDNĄ
  metrykę: px z `window.innerHeight`, przeliczane w `refreshInit`
  (`heroHeightSync` w Hero.astro). NIGDY `svh` z JS — późny refresh
  (zimny cache → `window.load` po zwinięciu toolbara iOS) rozjeżdżał
  odpięcie sticky o pół strefy telefonu.
- Pomiary geometrii sceny: snapshot → rest → pomiar → restore (wzorzec w
  `centerGroup`, device-scene.ts). Na mobile `ignoreMobileResize` blokuje
  refresh, więc nadpisane zmienne NIE samonaprawiają się.
- Widoczność elementów wejściowych bramkuj TIMELINE'em
  (`tl.set(..., START)`), nie bezwarunkowym `gsap.set` przy budowie.
- Pozycje mierzone przy budowie starzeją się po doładowaniu fontów —
  wzorzec re-glue po `document.fonts.ready` jest w `buildBase`
  (timeline-base.ts); nie wymuszaj tam globalnego `ScrollTrigger.refresh()`.

## Architektura render (Android/iOS)

- Obudowy urządzeń na mobile są PŁASKIE (`transform-style: flat`, bez
  ekstruzji/perspektywy/blur). Ciężkie CSS-3D głodziło rasteryzację GPU na
  Androidzie → znikające captiony i progress bar. Analiza:
  `docs/analiza-android-obudowy-3d-glodza-rasteryzacje.md`.
- Skala projektowa na Androidzie MUSI zostać (limit rozmiaru warstwy GPU —
  obcinany spód telefonu); `fit()` kompensuje. Spec:
  `docs/naprawa-android-scena-urzadzen-mobile.md`.
- Jedyne dopuszczalne rozjazdy Android vs iOS są RENDER-ONLY (skala
  projektowa, dividery). Logika odtwarzania wideo jest wspólna i MA zostać.

## Wideo ekranów (mobile)

- Oba systemy grają wideo CIĄGLE przez `initMobilePhase3` + self-heal na
  mimowolne pauzy dekodera iOS. Czerwone odcinki paska = czysto wizualne.
- NIGDY nie ponawiaj zablokowanego `video.play()` co klatkę scrolla.
- iOS Low Power Mode ≠ `prefers-reduced-motion` (osobny przełącznik);
  jedyna obsługa LPM to toast `LowPowerNotice.astro`. UWAGA: mechanizmy
  `normalizeScroll` / `html.is-lowpower` / `--vh` / `use-dvh` / loader /
  `?flat` NIE istnieją w kodzie — jeśli stara notatka je nakazuje, jest
  nieaktualna.

## Sekwencja captionów (desktop)

- Karuzela: faza A (swap) → faza B (center-pinned scroll); koniec
  zsynchronizowany z `doghouse.webp` przez `DOG_SITE_PROGRESS` w
  hero-config.ts (`CAP_END` = pochodna — zmieniasz próg, reszta się liczy).

## Weryfikacja (obowiązkowa dla KAŻDEJ zmiany w tym katalogu)

1. `scripts/verify-hero.mjs` vs baseline (skill `/verify-mobile`) — wymaga
   PREVIEW, nie dev (skrypt ma strażnika); zamierzona zmiana wyglądu =
   nowy baseline (`--baseline`) po akceptacji.
2. Emulacja NIE pokrywa: limitu warstwy GPU Androida, LPM, zwijanego
   toolbara iOS, zimnego cache (czyszczenie danych przeglądania) — przy
   zmianach w tych obszarach poproś Mateusza o test na fizycznych
   urządzeniach (tabela: `docs/analiza-refactor-hero-odkruszenie.md` §4).
3. Po zmianach w `LaptopSite`/`PhoneSite` — regeneracja wideo:
   `/capture-devices`.
