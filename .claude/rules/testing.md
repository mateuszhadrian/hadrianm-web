# Testy — kontrakt projektu

Plan i decyzje: `docs/testing-tools-and-environemnts-setup-analysis.md`.

## Co zmieniasz → co uruchamiasz

| Zmiana                                                        | Warstwa (komenda)                                                                              |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `src/components/sections/hero/**`                             | `pnpm test:unit` + `pnpm build && pnpm test:visual` (skill `/verify-mobile`) + `pnpm test:e2e` |
| `src/content.schema.ts` / `content.config.ts` / nowy wpis CMS | `pnpm test:unit` (kontrakt CMS)                                                                |
| `src/i18n/**`, `src/lib/img.ts`, `platform.ts`                | `pnpm test:unit`                                                                               |
| `src/scripts/**`, navbar, Work/overlaye                       | `pnpm test:e2e`                                                                                |
| Każda zmiana wyglądu                                          | `pnpm build && pnpm test:visual`                                                               |
| Przed release                                                 | pełne `pnpm test` + skill `/release-check`                                                     |

## Zasady twarde

- Testy wizualne WYŁĄCZNIE na preview (webServer configu, port 4399 — na
  4321 często wisi dev do telefonu). Helper `assertPreview` wykrywa
  `/@vite/client` i przerywa — nie obchodź go.
- Baseline'y (`tests/visual/__screenshots__/`, commitowane): DWA komplety
  per plik — `*-darwin.png` (lokalnie: `pnpm test:visual:update`) i
  `*-linux.png` (ręcznie wyzwalany workflow `update-visual-baselines.yml`,
  bot-commit na branch PR-a; awaryjnie Docker
  `mcr.microsoft.com/playwright:v<wersja>-noble`). Zamierzona zmiana
  wyglądu = kod + OBA komplety w jednym PR.
- ZAKAZ regenerowania baseline'u w celu „naprawienia" czerwonego testu bez
  pokazania diffu Mateuszowi i jego zgody (blokada Edit/Write także
  w settings.json). Nigdy nie „naprawiaj" rozjazdu darwin↔linux globalnym
  progiem — od tego jest `{platform}` w ścieżce snapshotów.
- Flaky klatki hero desktop 05–09 (ekran telefonu + ambient, ~0.5–2%):
  mają podwyższony próg w hero.spec.ts; FAIL tam najpierw porównaj
  z przebiegiem kontrolnym, dopiero potem podejrzewaj regresję.
- Wideo na zrzutach zawsze przez maskę (klatka wideo to loteria);
  odtwarzanie sprawdza funkcjonalnie `tests/e2e/hero-functional.spec.ts`.
- NIE emuluj `prefers-reduced-motion: reduce` (bramka w BaseLayout = testy
  „przechodzą" na martwej stronie).
- a11y (axe): allowlista znanych naruszeń w `tests/e2e/a11y.spec.ts` to
  RATCHET — wpis wolno usunąć po realnej poprawie; nowych nie dopisuj bez
  decyzji Mateusza.
- Test mediów R2 (`CHECK_REMOTE_MEDIA=1`) tylko poza ścieżką PR
  (zewnętrzna sieć = flaky).
- Wersje `playwright` i `@playwright/test` podnoś PARĄ (jeden zestaw
  binariów); bump = też tag obrazu Dockera w procedurze baseline'ów.

## Czego emulacja NIE wykrywa → fizyczne urządzenie

Limit warstwy GPU Androida; iOS Low Power Mode; zwijany toolbar Safari
(metryki viewportu / późny refresh); zimny cache + realne łącze; dotyk
fizyczny (Lenis syncTouch feel). Przy zmianach w tych obszarach poproś
Mateusza o test na telefonie i wskaż, na co patrzeć (tabela §II.3 analizy).
