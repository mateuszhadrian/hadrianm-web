---
name: test
description: Inteligentny wybór warstwy testów — czyta zmienione pliki (git), mapuje ścieżki na warstwy (unit/dist/e2e/visual) wg .claude/rules/testing.md, uruchamia tylko potrzebne i raportuje zbiorczo. Domyślne wejście do testowania w codziennej pracy.
---

Uruchom właściwe warstwy testów dla bieżących zmian — nie więcej, nie mniej.
Kontrakt testowy projektu: `.claude/rules/testing.md`.

## 1. Ustal zakres zmian

```!
git status --short
git diff --name-only HEAD
```

Gdy working tree czysty (weryfikacja gałęzi przed PR-em) — porównaj
z main: `git diff --name-only origin/main...HEAD`.

## 2. Mapa ścieżek → warstwy

| Zmienione pliki                                                                                         | Warstwy do uruchomienia                          |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `src/components/sections/hero/**`                                                                       | unit + visual (+ e2e przy zmianach wideo/sticky) |
| `src/content.schema.ts`, `src/content.config.ts`, `src/content/realizacje/*`                            | unit (kontrakt CMS)                              |
| `src/i18n/**`, `src/lib/img.ts`                                                                         | unit + e2e (i18n.spec)                           |
| `src/scripts/**`, `src/components/navbar/**`, `src/components/ui/**`, `src/components/sections/work/**` | e2e                                              |
| `src/layouts/**`, `src/styles/**`, komponenty sekcji                                                    | visual (+ e2e gdy zmiana dotyka interakcji)      |
| `tests/**`, configi testów                                                                              | zmieniona warstwa w całości                      |
| `public/**`, `astro.config.mjs`                                                                         | build + dist + e2e (smoke); meta/SEO → seo.spec  |
| nowa/usunięta trasa (`src/pages/**`), head SEO, dane kontaktowe w HTML, `functions/**`                  | build + dist (+ e2e: seo.spec, contact.spec)     |

Zmiana przekrojowa albo wątpliwość → pełne `pnpm test`.

## 3. Wykonanie (kolejność od najszybszej warstwy)

1. `pnpm test:unit` — zawsze, gdy cokolwiek z mapy się łapie (sekundy).
2. `pnpm build && pnpm test:dist` — warstwa „dist" z mapy (sekunda po
   buildzie; skan ZBUDOWANEGO HTML: localhost/porty dev, pełne e-maile,
   robots + sitemapa; przechodzi też na dist z `build:visual`). Ten sam
   `pnpm build` służy zaraz pod e2e.
3. Warstwy Playwright wymagają świeżego builda — DWA RÓŻNE:
   `pnpm build` (treść produkcyjna) → `pnpm test:e2e`;
   `pnpm build:visual` (zamrożony fixture `tests/fixtures/realizacje`) →
   `pnpm test:visual`. Kolejność jak w CI: e2e na zwykłym buildzie, potem
   `build:visual` i visual. Strażnik `assertVisualFixture` przerwie visual
   na niewłaściwym dist z instrukcją — to nie regresja.
   - Zawężenie do pliku/projektu, gdy zmiana jest punktowa:
     `pnpm exec playwright test tests/e2e/i18n.spec.ts`,
     `pnpm exec playwright test tests/visual/hero.spec.ts`.
4. Interpretacja FAIL-i wizualnych: skill `/verify-mobile` (diffy w
   `test-results/`, flaky klatki desktop 05–09, procedura baseline'ów).

## 4. Raport zbiorczy

Podsumuj: co uruchomiono i dlaczego (mapa), wyniki per warstwa,
FAIL-e z interpretacją (regresja vs zamierzona zmiana vs znany flake).
Przy zamierzonej zmianie wyglądu przypomnij procedurę DWÓCH kompletów
baseline'ów (darwin lokalnie + linux przez workflow) — bez zgody Mateusza
baseline'ów nie aktualizujemy.
