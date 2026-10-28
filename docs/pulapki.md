# Pułapki pomiarowe i środowiskowe — katalog

> **Status: AKTUALNY — katalog żywy** (założony 2026-10-25 w paczce P9,
> punkt D5 `analiza-ewolucja-vs-nowsze-projekty.md` §6). Skondensowane
> pułapki z tego projektu i z rodziny (delung / pracownia-eha / hetman):
> rzeczy, które WYGLĄDAJĄ jak regresja albo jak dowód, a nim nie są — oraz
> narzędzia, które milcząco robią coś innego, niż sugeruje nazwa. Jedna
> linia na pułapkę + „gdzie ugryzło / gdzie opisane". Reguły operacyjne
> (co robić) żyją w `.claude/rules/*`; decyzje — w `decyzje.md`; ten plik
> odpowiada na „dlaczego mój odczyt kłamie".
>
> Konwencja wiersza: **objaw → przyczyna → jak nie wpaść**. Pozycje
> z rodziny bez naszego incydentu mają znacznik `[rodzina]`.

## 1. Pomiar geometrii i czasu w przeglądarce

| # | Pułapka | Gdzie ugryzło / opisane |
| --- | --- | --- |
| P-01 | **Przejście CSS fałszuje odczyt geometrii** — `getBoundingClientRect` w trakcie `transition` zwraca stan pośredni; mierz po `transitionend` lub po wyłączeniu przejść (`freeze.css` w testach) | `[rodzina]`; `tests/helpers/freeze.css` |
| P-02 | **`opacity: 0` łapie kliknięcia i trzyma warstwę kompozytora** — element „niewidoczny" nadal przyjmuje zdarzenia i kosztuje teksturę GPU (delung: 17 warstw / 475 MB); używaj `visibility: hidden` w keyframes/stanach spoczynku | `[rodzina]` `analiza-poprawki-5.md` delung; ewolucja §4.1, backlog **H3** |
| P-03 | **Geometria sub-pikselowo** — `offsetHeight` zaokrągla; w asercjach `getBoundingClientRect` + tolerancja (ułamkowa wysokość sekcji audience przesuwa baseline'y wszystkich sekcji niżej o ~1 px — ghosting ≠ regresja) | `.claude/rules/sections.md` „About/Audience"; backlog **T8** |
| P-04 | **Czas mierz wewnątrz przeglądarki** (`performance.now()` + `MutationObserver`), nie timerami testu — timery Node liczą też IPC Playwrighta | `[rodzina]`; backlog **T8** |
| P-05 | **`document.fonts.ready` jest fałszywym sygnałem przy preloadowanych fontach** — rozwiązuje się zanim preloadowany plik jest użyty; do bramek `document.fonts.load()` | ewolucja §4.6, backlog **F2** |
| P-06 | **Pozycje zmierzone przy budowie timeline'u starzeją się po doładowaniu fontów** — wzorzec re-glue po `fonts.ready` w `timeline-base.ts`, bez globalnego `ScrollTrigger.refresh()` | `.claude/rules/hero-device-scene.md` „Metryki viewportu" |
| P-07 | **Sekcja i ScrollTrigger na różnych metrykach viewportu** (`svh` vs `innerHeight`) — późny refresh po zimnym cache (toolbar iOS) odpina sticky za wcześnie; jedna metryka px w `refreshInit` | `hero-device-scene.md`; `analiza-refactor-hero-odkruszenie.md` |
| P-08 | **Kontrast liczony przez axe to nie kontrast widziany** — axe nie liczy tekstu nad obrazem/szkłem/ambientem i łapie stan STARTOWY animacji (krycie 0,14 → 1,31:1), gdy stan końcowy ma 4,6–5,1:1; pomiar ręczny na najjaśniejszym pikselu tła, w kilku szerokościach i obu silnikach | ewolucja §6 **A1**; `.claude/rules/testing.md` „a11y" |
| P-09 | **Czysty skan axe niczego nie dowodzi** przy naruszeniu „losowym" — węzeł może siedzieć w `incomplete` (zależnie od geometrii skanu) i raz na kilka biegów wpadać do `violations`; diagnoza przez `withRules([...])` i porównanie `incomplete` vs `passes` | ewolucja §6 **A2**, §10 sesja 7; `testing.md` |
| P-10 | **Obrazy pod `/cdn-cgi/image/` nie istnieją na preview** — pixel-diff widzi placeholder/ikonę błędu, więc NIE wykryje regresji obrazów R2; lazy obraz pod foldem bywał w baseline pusty (wyścig) → `settleImages()` | ewolucja §6 **T3**; `.claude/rules/cms-realizacje.md` „Media" |

## 2. Testy wizualne i baseline'y

| # | Pułapka | Gdzie ugryzło / opisane |
| --- | --- | --- |
| P-11 | **Zielony ≠ aktualny** — próg per-shot (`maxDiffPixelRatio`) pochłania dryf pod progiem; przechodzący test porównuje się z baseline'em o nieaktualnej treści. Pomiar realnego dryfu: próg 0 na jeden przebieg | backlog **T6**; `testing.md` |
| P-12 | **`--update-snapshots` nadpisuje też pliki różniące się W GRANICACH progu** (flaky klatki hero) — po `test:visual:update` zawsze `git status` i `git checkout --` plików spoza zaakceptowanego zestawu | `testing.md` (P5 2026-10-22); pamięć `visual-baselines-ci-ordering` |
| P-13 | **Identyczny co do piksela diff w N przebiegach ≠ brak timingu** — runner CI bywa deterministyczny per maszyna, a stan i tak zależy od środowiska (ładowanie fontów przesunęło klatkę telefonu). Zanim szukasz „winnego pliku": porównaj kadry między środowiskami — **płynne przesunięcie treści = timing, skok/zawinięcie = metryka** | ewolucja §10 sesja 7 (P8, dwie obalone hipotezy); backlog **T9**, **H4** |
| P-14 | **Docker Playwright (arm64 i amd64) ≠ runner GitHub** — w Dockerze klatki telefonu odbiegały od baseline'u CI także na main, a main i branch dawały tam identyczne zrzuty; Docker nie odtwarza runnera, służy tylko awaryjnie do generowania baseline'ów linux | ewolucja §10 sesja 7; `testing.md` |
| P-15 | **Loteria maszyn runnerów** — różne CPU → inne zaokrąglenia AA przy ułamkowym DPR 2.75 (pixel-5 00–03, ~0,35%, deterministycznie per maszyna); regeneracja baseline'u trafi na inną maszynę i „nie zobaczy" zmian — workflow nic nie commituje | `testing.md`; pamięć `verify-hero-desktop-flaky-frames` (2026-07-12) |
| P-16 | **Rozjazd darwin↔linux to nie powód do globalnego progu** — od tego są komplety per platforma (`{platform}` w ścieżce) | `testing.md` |
| P-17 | **Playwright auto-zapisuje brakujące baseline'y** przy pierwszym przebiegu bez `--update-snapshots=none` — „zielony" nowy spec może oznaczać, że dopiero co utworzył wzorzec | pamięć `dla-kogo-subpage`; backlog **T5** (dry-run `--update-snapshots=none`) |
| P-18 | **Klatka wideo to loteria** — wideo na zrzutach zawsze pod maską; odtwarzanie sprawdza e2e | `testing.md`; plan wideo D10 |
| P-19 | **Element-screenshot ma „wszyty" navbar** zależny od wysokości strony (sections.spec) — churn navbara w diffie sekcji ≠ regresja sekcji | pamięć `faq-section-rejestr` |
| P-20 | **Programowy scroll przegrywa wyścig ze snapem** na wolnych runnerach — testy About/Audience chodzą z `?nosnap` | `sections.md`; pamięć `visual-baselines-ci-ordering` |
| P-21 | **Emulacja WebKit nie raportuje `maxTouchPoints`** — bramka dotyku w testach webkit-iphone zachowuje się jak desktop; `webkit-iphone-se` to SE 1. gen. 320×568, nie SE 2020 | pamięć `dla-kogo-subpage`, `kontakt-baner-se-geometry` |
| P-22 | **Emulacja `prefers-reduced-motion: reduce` = testy na martwej stronie** (bramka w BaseLayout wyłącza Lenis i moduły scroll) — nie emulować globalnie; PW 1.61 reduce przez `contextOptions` | `testing.md`; `sections.md` |
| P-23 | **Fixture wizualny ≠ treść produkcyjna** — wpis dodany/usunięty w panelu rozjeżdżał WSZYSTKIE zrzuty work i blokował PR-y; `build` zamiast `build:visual` = czytelny błąd strażnika, nie pixel-diff | backlog **T1**; `testing.md` |

## 3. Playwright API i gesty

| # | Pułapka | Gdzie ugryzło / opisane |
| --- | --- | --- |
| P-24 | **`page.evaluate(STRING, arg)` ewaluuje string jako wyrażenie i NIC nie wywołuje** — krokowanie animacji w P4 „działało" tylko pozornie (slider delung 13× za szybko w zaakceptowanym spike'u); przekazuj prawdziwą funkcję | plan wideo §3 D9 korekta 2; `.claude/rules/capture-scripts.md` |
| P-25 | **`page.mouse` nie testuje dotyku** — idzie ścieżką `pointer*` i przechodzi przy martwym `touch*`; gesty przez CDP `Input.dispatchTouchEvent` (tylko Chromium); `cancelable` jest `true` tylko w pierwszej klatce ruchu | backlog **U1**; `testing.md`; `tests/e2e/overlay-swipe.spec.ts` |
| P-26 | **Funkcja w `test.skip(fn, …)` dostaje TYLKO fixture'y** (bez `testInfo`) — skip po nazwie projektu rób w `test.beforeEach(({…}, testInfo) => …)` | `testing.md` (P8) |
| P-27 | **Fałszywy zegar `page.clock` obejmuje tylko `Date`/timery/`rAF`/`performance.now`** — animacje CSS i `<video>` trzeba krokować osobno (WAAPI `currentTime`, `video.currentTime` + czekanie na `seeked` po stronie Node, bo timery strony są fałszywe) | plan wideo §3 D9 |
| P-28 | **Przy zatrzymanym czasie wirtualnym CDP `Page.captureScreenshot` potrafi wisieć** — stąd `page.clock` zamiast `Emulation.setVirtualTimePolicy` | plan wideo §3 D9 korekta 1 |
| P-29 | **Chromium nie przewija `<video>` bez odpowiedzi 206/`Accept-Ranges`** (`seekable` = [0,0], każdy seek = klatka 0 — film wygląda jak zdjęcie); **Chromium nie pobiera `poster` przy `preload="none"`** (0/7 na produkcji delung) — poster jako `<picture>` pod spodem | plan wideo §3 D5, D9 korekta 3 |
| P-30 | **Animacja widziana po raz pierwszy liczy się od POPRZEDNIEGO kroku**, nie od zera — przejścia CSS wyzwalane co klatkę ze scrolla inaczej „zacinają się" w nagraniu | plan wideo §3 D9 korekta 3 |
| P-31 | **Pełny `test:e2e` pod obciążeniem daje flaki, których nie ma w izolacji** (wideo `currentTime` 0, axe `.pp-sub` pixel-5) — lokalnie od 2026-10-24, a wideo także w CI od 2026-10-27 (PR #65 docs-only, run 40553896112: `work.spec.ts:123` pixel-5 czerwone w obu próbach Playwrighta, rerun joba zielony). „Czerwone w izolacji = z definicji nie flake", ale czerwone tylko pod obciążeniem wymaga kontroli na main w tych samych warunkach (lokalnie: worktree + osobny preview; w CI: diff bez bajtów strony albo rerun tego samego SHA) | ewolucja §10 sesja 7 i 10; pamięć `navbar-measure-nie-optymalizuj`, `ci-flakes-catalog` |

## 4. CI, runnery, workflowy GitHub

| # | Pułapka | Gdzie ugryzło / opisane |
| --- | --- | --- |
| P-32 | **Bot-push na `GITHUB_TOKEN` NIE wyzwala CI** — PR z baseline'ami linux na końcu utknie z checkami „Expected"; kolejność kod → workflow linux → commit darwin NA KOŃCU | `daily-workflow.md` „Celowa zmiana wyglądu"; pamięć `visual-baselines-ci-ordering` |
| P-33 | **`strict_required_status_checks`: zapis w panelu Sveltii (commit na main) unieważnia „up to date" każdego otwartego PR-a** → rebase/`gh pr update-branch`; sam rerun po update-branch bywa czerwony z innego powodu (A2) | `[rodzina]`; ewolucja §8 pkt 6, §10 2026-10-21 |
| P-34 | **`ubuntu-latest` zmienia wersję bez naszej decyzji** (2026-10-19) → dryf baseline'ów linux bez zmiany kodu; runnery przypięte `ubuntu-24.04` | backlog **C3**; `testing.md` |
| P-35 | **`gh workflow run` działa dopiero, gdy plik workflowu jest na main** — nowy `workflow_dispatch` nie da się odpalić z brancha PR-a | backlog **C4** (korekta); `[rodzina]` hetman |
| P-36 | **Awaria webhooków GitHuba nie odtwarza odrzuconych zdarzeń** (2026-08-06) — bez `workflow_dispatch` jedynym wyjściem jest pusty commit | backlog **C2**; `daily-workflow.md` „Czerwony check" |
| P-37 | **Cron GitHub Actions bywa opóźniony o godziny (~6 h)** — nie planuj na nim niczego, co ma „zdążyć" | `[rodzina]` |
| P-38 | **Strażnik prod-smoke czekający na PIERWSZY asset** (`head -1`) startował w środku propagacji Cloudflare (pierwszym bywał font o stałym hashu) → flake „MIME `text/html` na `_astro/*.css`"; dziś komplet assetów + `200` na każdym; `echo | grep` w pętli = Broken pipe | backlog **C1**; pamięć `ci-flakes-catalog` |
| P-39 | **Deploy Cloudflare potrafi trwać > 10 min** — czerwony Prod smoke po merge'u przy deterministycznych hashach = rerun, nie regresja | ewolucja §10 sesja 2 |
| P-40 | **Zawieszony lub POWOLNY `playwright install --with-deps`** (> 1 h 2026-07-13; 2026-10-26 TRZY razy timeout 10 min przy ~40 KB/s z `azure.archive.ubuntu.com` — main po docs-only #61, PR #62, main po #63; 2026-10-27 czwarty raz, na #65) — „wszystko padło na apt-get" = infra GitHuba, nie kod. Od #64: zależności apt osobnym krokiem z drugą próbą i limitem 6 min, binaria osobno z cache (8 min), job `e2e` 40 min; od DEC-111 próba 2 CZEKA na `apt-get` z próby 1 zamiast padać na blokadzie (P-72). Czerwony tu = rerun failed jobs, nie diagnoza kodu | `ci.yml` job `e2e`, `prod-smoke.yml`, `update-visual-baselines.yml`; katalog flake'ów |
| P-41 | **Workflow baseline'ów z `mode=changed` NIE przepisze zmiany pod progiem** (zielonej, ale nieaktualnej) — do tego `mode=all` zawężone filtrem `plik:linia` w inpucie `spec` (bez spacji) | backlog **T6**; `testing.md` |
| P-72 | **`timeout-minutes` kroku GitHub Actions zabija shell, NIE procesy pod `sudo`** — `apt-get` z `playwright install-deps` (root) po timeoucie kroku pobiera dalej i trzyma `/var/lib/dpkg/lock-frontend`; „druga próba" tego samego polecenia pada po 2 s: `E: Could not get lock … held by process N (apt-get)`, exit 100 (run 40567119421, 2026-10-27 — pierwszy realny bieg ścieżki awaryjnej DEC-105). Nie zabijaj go (i tak dokończy instalację), każ apt czekać: `DPkg::Lock::Timeout "420";` w `/etc/apt/apt.conf.d/` przed powtórką (apt ≥ 1.9.11; obejmuje blokadę frontend/dpkg przy `install`, NIE `lists/lock` z `update` — ten z osieroconym `install` nie koliduje, w logu `update` próby 2 przeszedł), limit próby 2 dłuższy od czekania | `ci.yml` job `e2e` (próba 2), `prod-smoke.yml`, `update-visual-baselines.yml`; DEC-111; katalog flake'ów |

## 5. Lighthouse / LHCI

| # | Pułapka | Gdzie ugryzło / opisane |
| --- | --- | --- |
| P-42 | **Zapas progu mniejszy niż szum runnera** — LCP ±1300 ms przy identycznym co do bajta `resource-summary` (eha, dwa runy A/B); próg 3100 × 1,15 leżał NA medianie → main czerwony 2× na tym samym SHA bez regresji | ewolucja §4.4, §10 sesja 5; backlog **L1** |
| P-43 | **Pojedynczy czerwony `lighthouse` nie dowodzi regresji** — porównaj `resource-summary` obu runów; sygnał = bajty (script/total/document), nie pojedynczy LCP; `benchmarkIndex` runnerów 2410–4551 | `testing.md` „LHCI" |
| P-44 | **Lokalny `lhci collect` liczy niżej niż CI także na main** (perf 0,85–0,89 lokalnie vs 0,89–0,92 na runnerze) — lokalny wynik nie jest podstawą progów; LCP lokalnie ±300 ms = za szumne do małych delt (mierz Playwrightem) | pamięć `visual-corrections-part1-branch`, `loading-overlay-route-only`; `testing.md` |
| P-45 | **Pomiar bazowy musi mierzyć TEN SAM build, co bramka** — `lhci-measure.yml` buduje `pnpm build` (treść produkcyjna), nie `build:visual` | backlog **C4** (korekta) |
| P-46 | **Stały `minScore: 0.9` leżał na krawędzi** (main 0,88–0,92) — próg perf także z pomiaru | backlog **L1** decyzje 2026-10-23 |
| P-47 | **`pnpm add` przelicza pływający zakres `@paulirish/trace_engine`** (Lighthouse) i podbija przy okazji `third-party-web`/`legacy-javascript` w lockfile'u — sprawdź diff lockfile'a po każdym dodaniu zależności | `.claude/rules/layout-seo.md` „Fonty" (P8) |

## 6. Astro, Vite, Tailwind, build

| # | Pułapka | Gdzie ugryzło / opisane |
| --- | --- | --- |
| P-48 | **Astro inlinuje małe CSS przed bundlami** → override w `:root` z późniejszego arkusza przegrywa; potrzebny `html:root` (wyższa specyficzność) | `[rodzina]` |
| P-49 | **Komentarz frontmatteru z `<` psuje `astro check`** — unikaj `<` w komentarzach `---` | `[rodzina]` |
| P-50 | **`*/` w komentarzu CSS wywraca Tailwind 4** (parser traktuje jako koniec komentarza) — także w opisach selektorów typu `a/*b*/` | `[rodzina]` |
| P-51 | **`git worktree` + symlink `node_modules`** — w rodzinie psuł Tailwind (rozwiązywanie ścieżek przez symlink). **Obserwacja z P8 (2026-10-24, kontrola na main):** worktree + symlink `node_modules` + `./node_modules/.bin/astro build` zbudował POPRAWNIE i posłużył do kontrolnego `test:e2e`; natomiast `pnpm` w worktree ODMAWIA (sprawdza status zależności względem katalogu projektu). Obie obserwacje bez rozstrzygnięcia — przed poleganiem na worktree sprawdź oba warianty w danym stanie repo | `[rodzina]`; ewolucja §10 sesja 7 |
| P-52 | **Subset fontu < 4096 B wpada pod `assetsInlineLimit`** → Vite wkleja go jako `data:` do CSS blokującego render, a preload wskazuje plik, którego nikt nie używa; `assetsInlineLimit` = `false` dla `.woff2` | ewolucja §4.6; `layout-seo.md` |
| P-53 | **Komentarze w blokach `is:inline` są wysyłane na każdej trasie** (−575 B/trasę po wyniesieniu) | backlog **S3**; `layout-seo.md` |
| P-54 | **Inline `<script>` w JSX Astro nie może być warunkowy** — renderuj zawsze, bramkuj w środku | pamięć `dla-kogo-subpage` |
| P-55 | **Świeżo po `pnpm typecheck` Vite potrafi zwracać 504 na moduły** — odczekaj/zrestartuj dev przed nagraniem | `.claude/rules/capture-scripts.md` |
| P-56 | **Dwa egzemplarze chrome'u w DOM = martwy burger** — skrypt Navbara wiąże się z pierwszym `[data-nav]`, menu ma stałe `id`; na 404 nieaktywny blok językowy trzeba USUNĄĆ, nie ukryć | backlog **S1**; `layout-seo.md` |
| P-57 | **Scoped CSS Astro nie łapie komponentu potomnego ani spanów tworzonych w runtime** — `:global(...)` dla `.of-w`/`.acc`; pozycjonowanie BackButtona przez wrapper | `sections.md` „Services"; pamięć `realizacje-subpage` |
| P-58 | **`-webkit-text-size-adjust` z preflightu Tailwinda (`100%`)** nadpisuje intencję — jawne `text-size-adjust: none` na `html` | backlog **S3**; `layout-seo.md` |

## 7. CMS (Sveltia), R2, treść

| # | Pułapka | Gdzie ugryzło / opisane |
| --- | --- | --- |
| P-59 | **Usunięcie ostatniego wpisu w panelu kasuje CAŁY katalog** (git nie trzyma pustych katalogów) → goły `readdirSync` przy ładowaniu modułu = `ENOENT` w `quality`/`prod-smoke` (incydent delung 2026-08-06) | backlog **T2**; `testing.md` |
| P-60 | **Slug wklejony z telefonu w formie NFD** → macOS pokazuje „ten sam plik dwa razy", `git add .` tworzy duplikat na Linuksie; stąd slugi ASCII + jawne ścieżki w `git add` | backlog **M1**, **D1**; `cms-realizacje.md` |
| P-61 | **Panel na localhoście bez `site_domain` wysyła `site_id=cms.netlify.com`** i wpada na `ALLOWED_DOMAINS` Workera | ewolucja §4.5; `cms-realizacje.md` |
| P-62 | **Sveltia nie kasuje plików z R2** przy usuwaniu wpisu/zdjęcia; biblioteka Assets poza polem nie trafia do R2; nazwy już wgranych plików nie są slugifikowane wstecz | `cms-realizacje.md`; `optional-todos.md` C7 |
| P-63 | **Gwiazdka w panelu Sveltii = pole wymagane** — pola opcjonalne (`required: false`) muszą być bez gwiazdki, inaczej redaktor „musi" wypełnić | ewolucja §10 sesja 2 (P3) |
| P-64 | **R2 w jurysdykcji EU wymaga endpointu `.eu.`** (`{account}.eu.r2.cloudflarestorage.com`) — bez tego listowanie/S3 pada | `[rodzina]`; backlog **M3**; `optional-todos.md` §4.3 |
| P-65 | **Jeden prefix uploadu Sveltii dla `image` i `file`** — MP4 lądują płasko obok zdjęć, podfolder z planu nie powstaje | plan wideo D4 korekta P5 |
| P-66 | **Test mediów R2 w ścieżce PR = flaky** (zewnętrzna sieć) — `CHECK_REMOTE_MEDIA=1` tylko ręcznie | `testing.md` |

## 8. Ekosystem Claude Code (settings, hooki)

| # | Pułapka | Gdzie ugryzło / opisane |
| --- | --- | --- |
| P-67 | **`Bash(pnpm test:*)` w allowliście NIE łapie `pnpm test:unit`** — `:*` to skrót na „spacja + cokolwiek", więc dwukropek w nazwie skryptu wymaga jawnej listy | ewolucja §10 sesja 6 (#58) |
| P-68 | **Reguły `Write(...)` w permissions są martwe** — uprawnienia plikowe matchują `Edit`/`Read` (`Edit` pokrywa Write/NotebookEdit) | ewolucja §10 sesja 6 (#58) |
| P-69 | **`git worktree` do kontroli na main** — patrz P-51 (pnpm odmawia, `./node_modules/.bin/astro` działa) | ewolucja §10 sesja 7 |
| P-70 | **Cudzysłów „…" w konwencji repo zamyka się ASCII `"`** — wklejony do literału TS/Pythona w podwójnych cudzysłowach KOŃCZY string (esbuild: „Expected ) but found…", heredoc Pythona: SyntaxError; trzy potknięcia w jednej sesji) — w tytułach testów i komunikatach pisz bez cudzysłowów albo w template literal / potrójnych cudzysłowach | ewolucja §10 sesja 10 (T7) |
| P-71 | **`dist/` w `.gitignore` bez wiodącego `/` ignoruje KAŻDY katalog o tej nazwie** — `git add tests/dist` odmówił („ignored by one of your .gitignore files"); od T7 wzorzec to `/dist/` (tylko katalog główny) | ewolucja §10 sesja 10 (T7); `.gitignore` |
