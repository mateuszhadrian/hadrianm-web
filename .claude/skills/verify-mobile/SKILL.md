---
name: verify-mobile
description: Weryfikacja regresyjna hero przez scripts/verify-hero.mjs — sweep scrolla × 3 profile (desktop/iPhone/Pixel), pixel-diff vs baseline. Użyj po KAŻDEJ zmianie w src/components/sections/hero/ oraz przed release.
---

Zweryfikuj hero istniejącym harnessem (NIE pisz własnych sweepów —
`scripts/verify-hero.mjs` jest siatką regresyjną z baseline'em).

## 1. Serwer — preview, NIGDY dev

```!
lsof -nP -iTCP:4321 -sTCP:LISTEN | tail -1
ls .hero-verify/baseline 2>/dev/null | head -3 || echo "BRAK BASELINE"
```

- Baseline był robiony na buildzie produkcyjnym; dev server daje fałszywe
  FAILe (skrypt wykrywa `/@vite/client` i przerwie z instrukcją).
- Na 4321 często wisi dev do testów na telefonie — nie ubijaj go bez
  pytania; użyj: `pnpm build && pnpm preview --port 4399 &`, potem
  `BASE_URL=http://localhost:4399`.

## 2. Przebieg

- Porównanie: `BASE_URL=... node scripts/verify-hero.mjs` — oczekiwane
  „Zero różnic" przy zmianach behawioralnie neutralnych.
- Brak baseline'u: najpierw `--baseline` na czystym stanie (main przed
  Twoimi zmianami), potem porównanie.
- Raport skryptu obejmuje też funkcjonalny stan wideo (`x/2 gra`) i błędy
  konsoli — czytaj całość, nie tylko FAIL/OK.

## 3. Interpretacja

- FAIL → obejrzyj obraz różnic w `.hero-verify/diff/` (Read) i oceń: to
  regresja czy ZAMIERZONA zmiana wyglądu? Zamierzona → pokaż Mateuszowi
  diff, po akceptacji nagraj nowy baseline (`--baseline`).
- Emulacja NIE wykrywa: limitu warstwy GPU Androida, Low Power Mode,
  zwijanego toolbara iOS, zimnego cache. Przy zmianach w tych obszarach
  poproś Mateusza o test na fizycznych urządzeniach (co dokładnie
  sprawdzić: tabela §4 w docs/analiza-refactor-hero-odkruszenie.md).
- Nie emuluj `prefers-reduced-motion: reduce` (bramka w BaseLayout
  wyłączyłaby animacje) — chyba że celowo testujesz ścieżkę reduced.
