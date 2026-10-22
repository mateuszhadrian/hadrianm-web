# Testy — kontrakt projektu

Plan i decyzje: `docs/testing-tools-and-environemnts-setup-analysis.md`.

## Co zmieniasz → co uruchamiasz

| Zmiana                                                        | Warstwa (komenda)                                                                                     |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `src/components/sections/hero/**`                             | `pnpm test:unit` + `pnpm build:visual && pnpm test:visual` (skill `/verify-mobile`) + `pnpm test:e2e` |
| `src/content.schema.ts` / `content.config.ts` / nowy wpis CMS | `pnpm test:unit` (kontrakt CMS)                                                                       |
| `src/i18n/**`, `src/lib/img.ts`, `platform.ts`                | `pnpm test:unit`                                                                                      |
| `src/scripts/**`, navbar, Work/overlaye                       | `pnpm test:e2e`                                                                                       |
| Każda zmiana wyglądu                                          | `pnpm build:visual && pnpm test:visual`                                                               |
| Przed release                                                 | pełne `pnpm test` + skill `/release-check`                                                            |

## Zasady twarde

- Testy wizualne WYŁĄCZNIE na preview (webServer configu, port 4399 — na
  4321 często wisi dev do telefonu). Helper `assertPreview` wykrywa
  `/@vite/client` i przerywa — nie obchodź go.
- Testy wizualne stoją na **ZAMROŻONEJ treści realizacji**
  (`tests/fixtures/realizacje` — 3 wpisy), bo baseline to obraz: realizacja
  dodana/usunięta/przestawiona w panelu rozjeżdżałaby zrzuty kafli, karuzeli,
  siatki `/realizacje/` i nakładek WorkDetail, czyli blokowała WSZYSTKIE PR-y
  do czasu regeneracji baseline'ów. Stąd `pnpm build:visual` (przestawia
  `REALIZACJE_DIR` w `content.config.ts`) zamiast `pnpm build`; strażnik
  `assertVisualFixture` porównuje liczbę wpisów w `dist` z fixture i przerywa
  z instrukcją zamiast pixel-diffa. **Fixture jest niezależny od treści
  produkcyjnej** — nie synchronizuj go z `src/content/realizacje` i nie
  „aktualizuj" po zmianach w panelu; zmieniaj wyłącznie wtedy, gdy zrzut ma
  świadomie pokazać inny UKŁAD (wtedy = nowe baseline'y w tym samym PR;
  kontrakt schematu: `tests/unit/visual-fixture.test.ts`). Testy e2e
  funkcjonalne fixture'u NIE używają: czytają treść produkcyjną dynamicznie.
- **Test NIE MOŻE wywracać się na treści z panelu.** Wpisy realizacji czyta
  się wyłącznie przez `tests/helpers/realizacje.ts` (`realizacjeFiles()` /
  `readRealizacja()`) — nigdy gołym `readdirSync` na `src/content/realizacje`:
  git nie przechowuje pustych katalogów, więc usunięcie ostatniego wpisu
  w panelu kasuje CAŁY katalog i goły odczyt wywraca moduł przy ładowaniu
  (`ENOENT` w `quality`/`prod-smoke`, incydent delung 2026-08-06). Testy
  zależne od liczby wpisów robią `test.skip(...)` z jawnym powodem — pusta
  lista jest stanem dopuszczalnym (strona buduje się i deployuje). JEDYNYM
  sygnałem o braku treści jest kontrakt „katalog zawiera co najmniej jeden
  wpis" w `tests/unit/cms-contract.test.ts`, z komunikatem dla człowieka.
- Baseline'y (`tests/visual/__screenshots__/`, commitowane): DWA komplety
  per plik — `*-darwin.png` (lokalnie: `pnpm test:visual:update`) i
  `*-linux.png` (ręcznie wyzwalany workflow `update-visual-baselines.yml`,
  bot-commit na branch PR-a; awaryjnie Docker
  `mcr.microsoft.com/playwright:v<wersja>-noble`). Zamierzona zmiana
  wyglądu = kod + OBA komplety w jednym PR.
- ZAKAZ regenerowania baseline'u w celu „naprawienia" czerwonego testu bez
  pokazania diffu Mateuszowi i jego zgody (blokada Edit/Write także
  w settings.json). Po `pnpm test:visual:update` ZAWSZE `git status`:
  `--update-snapshots` nadpisuje też pliki różniące się W GRANICACH progu
  (np. flaky klatki hero desktop 05–09, które w `test:visual` przechodzą) —
  pliki spoza zaakceptowanego zestawu cofnij `git checkout --` (P5,
  2026-10-22). Nigdy nie „naprawiaj" rozjazdu darwin↔linux globalnym
  progiem — od tego jest `{platform}` w ścieżce snapshotów.
- Flaky klatki hero desktop 05–09 (ekran telefonu + ambient, ~0.5–2%):
  mają podwyższony próg w hero.spec.ts; FAIL tam najpierw porównaj
  z przebiegiem kontrolnym, dopiero potem podejrzewaj regresję.
- Flaky klatki hero pixel-5 00–03 (loteria maszyn runnerów GH: różne CPU →
  inne zaokrąglenia AA serifowego akcentu przy ułamkowym DPR 2.75; ~0.35%
  diffu, deterministycznie per maszyna): próg 0.01 w hero.spec.ts. NIE
  regeneruj baseline'u na ten objaw — workflow trafi na inną maszynę i „nie
  zobaczy" zmian (potwierdzone 2026-07-12); kontrola: rerun joba na main.
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
- Runnery GitHub są PRZYPIĘTE (`ubuntu-24.04` we wszystkich workflowach,
  nie `ubuntu-latest`): wersja systemu wpływa na binaria Playwrighta
  i baseline'y linux. Bump obrazu = świadoma zmiana w osobnym PR z kontrolą
  baseline'ów (rerun `test:visual` na main przed i po).

## Czego emulacja NIE wykrywa → fizyczne urządzenie

Limit warstwy GPU Androida; iOS Low Power Mode; zwijany toolbar Safari
(metryki viewportu / późny refresh); zimny cache + realne łącze; dotyk
fizyczny (Lenis syncTouch feel). Przy zmianach w tych obszarach poproś
Mateusza o test na telefonie i wskaż, na co patrzeć (tabela §II.3 analizy).
