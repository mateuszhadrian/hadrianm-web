---
name: verify-mobile
description: Weryfikacja regresyjna hero przez testy wizualne Playwright (tests/visual/hero.spec.ts) — sweep scrolla × 3 profile (desktop/iPhone/Pixel), pixel-diff vs baseline. Użyj po KAŻDEJ zmianie w src/components/sections/hero/ oraz przed release.
---

Zweryfikuj hero istniejącą siatką wizualną (NIE pisz własnych sweepów —
`tests/visual/hero.spec.ts` jest siatką regresyjną z commitowanym baseline'em
w `tests/visual/__screenshots__/`).

## 1. Build + przebieg

```!
git status --short tests/visual/__screenshots__ | head -5
```

- Testy wizualne biegają na PREVIEW (build produkcyjny) — webServer configu
  wstaje sam na porcie 4399 (nie 4321 — tam często wisi dev do testów na
  telefonie). Helper `assertPreview` wykrywa dev server i przerwie.
- Przebieg: `pnpm build && pnpm test:visual` (sweep hero biega na projektach
  chromium-1920 / webkit-iphone-14 / chromium-pixel-5; sekcje na wszystkich 6).
- Tylko sweep hero:
  `pnpm exec playwright test tests/visual/hero.spec.ts`

## 2. Interpretacja

- FAIL → obejrzyj diff w `test-results/**/…-diff.png` (Read) lub raport HTML
  (`pnpm exec playwright show-report`) i oceń: regresja czy ZAMIERZONA zmiana
  wyglądu? Zamierzona → pokaż Mateuszowi diff, po akceptacji zaktualizuj
  baseline'y (`pnpm test:visual:update`) — TYLKO darwin; komplet linuksowy
  aktualizuje ręcznie wyzwalany workflow `update-visual-baselines.yml`
  (procedura: docs/testing-tools-and-environemnts-setup-analysis.md §III.4c).
- Klatki desktop 05–09 mają podwyższony próg (utrwalona flaky wiedza:
  ekran telefonu + ambient, ~0.5–2%) — FAIL tam porównaj najpierw
  z przebiegiem kontrolnym, dopiero potem podejrzewaj regresję.
- Wideo ekranów jest maskowane na zrzutach; jego stan funkcjonalny
  (odtwarzanie, currentTime) sprawdza `tests/e2e/hero-functional.spec.ts`
  (`pnpm test:e2e`).
- Emulacja NIE wykrywa: limitu warstwy GPU Androida, Low Power Mode,
  zwijanego toolbara iOS, zimnego cache. Przy zmianach w tych obszarach
  poproś Mateusza o test na fizycznych urządzeniach (co dokładnie
  sprawdzić: tabela §4 w docs/analiza-refactor-hero-odkruszenie.md).
- Nie emuluj `prefers-reduced-motion: reduce` (bramka w BaseLayout
  wyłączyłaby animacje) — chyba że celowo testujesz ścieżkę reduced.
