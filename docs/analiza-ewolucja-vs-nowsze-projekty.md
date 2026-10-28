# Analiza — ewolucja warsztatu: hadrianm-web vs delung / pracownia-eha / hetman

Data: 2026-10-20 · Branch: `docs/evolution-analysis-and-video-plan`
Dokument siostrzany: `docs/analiza-realizacje-wideo.md` (punkt **R1** stąd).
Szablon sesji: `docs/sesja-utrzymaniowa-szablon.md`.

> **Status: ANALIZA + BACKLOG ŻYWY.** Decyzje ramowe (§1, §8) zapadły w sesji
> pytań 2026-10-20. Backlog (§6) jest dokumentem roboczym: każda sesja
> wdrożeniowa zmienia status punktu (☐ → ✅ z datą i PR-em) i dopisuje
> korekty pod punktem. Nowe punkty dopisuj na końcu właściwej grupy
> z kolejnym numerem — numerów nie recyklujemy.

## 1. Cel, zakres, metoda

hadrianm-web to pierwsza strona autora zbudowana i wdrożona od zera
(12.06–29.07.2026, 267 commitów). Od tego czasu powstały trzy strony
klienckie w tej samej rodzinie szablonu. Pytanie tej analizy: **czego autor
nauczył się później i co z tego naprawić lub przenieść tutaj** — oraz jak
dalej pracować nad hadrianm-web jako projektem **utrzymaniowym**, nie
greenfield.

Ramy (decyzje z sesji pytań):

- **Tożsamość zostaje**: hadrianm-web to animowana wizytówka (GSAP scrub,
  Lenis, scena urządzeń). Nowsze strony wycięły GSAP/Lenisa z powodów
  specyficznych dla ich designów (§4.1) — tu przenosimy LEKCJE
  infrastrukturalne, nie decyzję o uproszczeniu. Jeśli jakaś animacja
  mierzalnie szkodzi (LCP, a11y), wraca jako osobny punkt decyzji.
- Hero nie wchodzi w zakres poza naprawą zgłoszonych błędów (H1).
- Kolejność prac: ta analiza → mechanizm wideo w realizacjach (R1) →
  podmiana treści (R3) → paczki poprawek z backlogu.
- Repo hadrianm-web jest publiczne: w tym dokumencie opisujemy WZORCE
  z projektów klienckich, nie ich treści ani dane.

Metoda: trzy równoległe przeglądy read-only (po jednym na repo nowsze),
każdy porównujący ten sam zestaw plików z hadrianm-web; wnioski
o hadrianm-web **zweryfikowane lokalnie** (grep/curl) — oznaczenia:
`[POTWIERDZONE]` sprawdzone w tym repo lub na produkcji,
`[Z RAPORTU]` fakt o nowszym repo przyjęty z przeglądu (z odwołaniem do
pliku tamtego repo), `[DO SPRAWDZENIA]` wymaga pomiaru przy wdrażaniu.

## 2. Rodowód i linia czasu

| Repo | Okres | Commity | Rodowód | Charakter |
| --- | --- | --- | --- | --- |
| `hadrianm-web` | 12.06 – 29.07.2026 | 267 | — | wizytówka, PL/EN, GSAP+Lenis, Sveltia, R2 |
| `delung-web` | 29.07 – 09.08 | 228 | kopia hadrianm-web (`delung-web-entrance-analysis.md` §4: „zostaje / wycinamy / od nowa") | firma meblarska, PL, Sveltia, wideo klientów w realizacjach |
| `eha/pracownia-eha-web` | 21.08 – 19.09 | 46 | kopia delung-web („trzeci przebieg przepisu: hadrianm → delung → eha") | pracownia budowlana, PL, Sveltia, subsety fontów |
| `hetmannieruchomosci/hetmannieruchomosci-web` | 30.09 – 17.10 | 47 | kopia pracownia-eha-web | biuro nieruchomości, PL, bez CMS (nocny sync z CRM), Preact-wyspa |

Wniosek nr 1: **rodzina ma jeden szablon, a hadrianm-web jest jego
najstarszą instancją** — większość ulepszeń infrastruktury (CI, testy,
CMS, fonty) powstała w delung i była dziedziczona dalej, ale **nigdy nie
wróciła tu**. Wniosek nr 2: nowsze projekty wykonały rekomendacje z kroniki
hadrianm (`hadrianm-history-from-the-first-commit.md` §Rekomendacje:
ekosystem i guardraile w dniu 1, deploy pusty wcześnie, testy przed
kruchymi animacjami) — eha miała CI z baseline'ami po 4 dniach, hadrianm
po ~3,5 tygodnia. Ta pętla (analiza → implementacja → testy → PR) działa
i zostaje.

## 3. Co jest wspólne (rdzeń szablonu — nie ruszamy)

Harness Playwright (6 profili, port 4399, `snapshotPathTemplate`
per-platform, `maxDiffPixelRatio: 0.0005`), Vitest, `assertPreview`,
`freeze.css`, trzy joby CI + `update-visual-baselines.yml` + `prod-smoke`,
Zod-schema jako czysty moduł współdzielony z testem kontraktu, Sveltia + R2
+ `imgAt()`, Pages Function formularza (Resend + Turnstile + honeypot +
limit KV), mikro-fade `nav-fade`, `overlay.ts` (rdzeń), ekosystem Claude
(`settings.json`, 4 hooki, skille `/test`, `/release-check`,
`/new-realizacja`, `/verify-mobile`), `docs/README.md` jako indeks
statusów, `daily-workflow.md`, husky + commitlint. Hooki i `settings.json`
w nowszych repo są identyczne — **nic do przeniesienia** w tej warstwie.

## 4. Czym nowsze strony różnią się — per obszar

### 4.1. Scroll i animacje (decyzja: zostaje jak jest)

Delung wyciął Lenisa i GSAP (`delung-web/.claude/rules/scroll.md`
`[Z RAPORTU]`): klatkowanie w Safari macOS brało się ze **spotkania
JS-owego scrolla z warstwą drogą do przemalowania** (zdjęcie pod maską
w kształcie liter), nie z samej biblioteki; 15 wariantów zmierzonych na
fizycznym Macu; skrypty 68 → 14 KB. Eha i hetman odziedziczyły tę decyzję.
Dla hadrianm-web: scrub + snap na ScrollTriggerze to fundament hero, about,
audience; rozdzielone stałe desktop/touch Lenisa są udokumentowanym fixem
(`.claude/rules/scroll-lenis.md`). **Nie przenosimy.** Przenosimy regułę:
„Lenis nie jest za darmo przy drogich warstwach — zanim dołożysz kolejną
warstwę z maską/filtrem pod scrollem, zmierz na fizycznym Macu".

Lekcja pokrewna z delung (`analiza-poprawki-5.md`): **`opacity: 0` NIE
zwalnia warstwy kompozytora** — 17 warstw/475 MB tekstur na hero przy 4K;
fix = `visibility` w keyframes. Dla hadrianm (ambient + scena urządzeń na
DPR 2) to realny trop na flaky klatki desktop 05–09 i limit warstw GPU
Androida (punkt H3).

### 4.2. Testy

| Wzorzec | Gdzie w nowszych | Stan hadrianm `[POTWIERDZONE]` |
| --- | --- | --- |
| Zamrożony fixture treści dla `test:visual` (`REALIZACJE_DIR`, `build:visual`, strażnik `assertVisualFixture`) | delung/eha/hetman; powód: wpis z panelu rozjeżdżał zrzuty i blokował WSZYSTKIE PR-y (incydent 2026-08-05) | `content.config.ts` ma ścieżkę na sztywno; `work-index.spec.ts` (visual) i modal/sheet zależą od treści produkcyjnej |
| Testy odporne na pustą kolekcję (helper `realizacjeFiles()` → `[]`, `test.skip` z powodem) | eha/hetman; incydent 2026-08-06: klient usunął ostatni wpis → katalog zniknął z gita → `readdirSync` przy ładowaniu modułu → `quality` i `prod-smoke` czerwone z `ENOENT` | goły `readdirSync` przy ładowaniu modułu w 4 plikach: `tests/unit/cms-contract.test.ts:16`, `tests/unit/media-r2.test.ts:15`, `tests/e2e/work.spec.ts:9`, `tests/e2e/work-index.spec.ts:21` |
| `settleImages()` (eager + sync + `decode()` przed zrzutem elementu wyższego niż viewport) | delung/hetman; objaw: diff tylko na krawędziach zdjęć, zielone lokalnie, czerwone w CI | `prepareSweep` bez tego kroku |
| Kontrakt progu `expectBreakpointFlip(page, minPx)` (pomiar `display` przy `minPx-1` i `minPx`) | delung/eha/hetman; „sześć z siedmiu stałych deklarowało ochronę testami, której nie było" | pięć stałych `*_DESKTOP_MIN_PX = 861` + 760/761 (hero, work) + 768 (ambient) — reguła „utrzymuj W PARZE" bez strażnika; profile testowe tylko 1366/1920 |
| `update-visual-baselines.yml` z inputami `spec` i `mode=changed/all` | eha/hetman | gołe `workflow_dispatch`, zawsze cały `test:visual:update` |
| „Zielony ≠ aktualny": pomiar progiem 0 bez ruszania baseline'u; próg per-shot podnosić dopiero po policzeniu sufitu klasy; geometria sub-pikselowo (`getBoundingClientRect`, nie `offsetHeight`) | eha/hetman (`testing.md`) | reguły nie ma w `.claude/rules/testing.md` |
| Testy na `dist` (`vitest.dist.config.ts`: skan zbudowanego HTML pod kątem pól zabronionych, localhost, spójności `_redirects`) | hetman, w jobie `quality` | odpowiednik = ręczny grep w `/release-check` |

### 4.3. CI i deploy

- **Strażnik prod-smoke** `[POTWIERDZONE]`: `prod-smoke.yml:25` bierze
  PIERWSZY asset z `dist/index.html` (`head -1`) i czeka tylko na jego
  obecność w HTML. Pierwszym bywa font o stałym hashu → strażnik zawsze
  „świeży" → smoke startuje w środku propagacji → flake „MIME `text/html`
  na `_astro/*.css`" z katalogu flake'ów. Eha/hetman czekają na KOMPLET
  assetów i sprawdzają `200` na każdym (wzorzec `/_astro/[^"' ,)]+` ucina
  na spacji/przecinku srcset i apostrofie inline `url()`); trzy iteracje tej
  poprawki w rodzinie (2026-07-31, srcset, inline url).
- **`workflow_dispatch`** `[POTWIERDZONE: brak]` w `ci.yml`
  i `prod-smoke.yml`: awaria webhooków GitHuba 2026-08-06 (odrzucone
  zdarzenia nie są odtwarzane) — jedyne wyjście to pusty commit.
- **`runs-on: ubuntu-latest`** `[POTWIERDZONE]` we wszystkich 5 jobach;
  GitHub przełączył `latest` na nową wersję 2026-10-19 → dryf baseline'ów
  linux bez zmiany kodu. Hetman przypina `ubuntu-24.04`.
- **Pomiar LHCI jako workflow** (`lhci-measure.yml`: 5 przebiegów × 2
  configi → mediany w summary) zamiast ręcznego `lhci-median.mjs`.

### 4.4. Budżety Lighthouse

`[POTWIERDZONE]` hadrianm: `numberOfRuns: 3`, LCP mobile 3565 = mediana
3100 × 1,15 (**zapas 465 ms**), desktop TBT 100 ms, `font:count` warn.
Eha zmierzyła **wariancję runnera ±1300 ms LCP przy identycznym co do
bajta `resource-summary`** (dwa runy A/B); hetman wprowadził regułę
**LCP = max(mediana × 1,15; mediana + 1300 ms)** i jednocześnie
zacieśnił `total`; TBT = max(×2; +300) lub 1,15 × najgorszego
zaobserwowanego, zaokrąglone do granicy „poor" Google; `font:count`
i `font:size` jako `error`. Konsekwencja dla hadrianm: nasz zapas LCP
leży **wewnątrz** pasma szumu — to dokładnie klasa „LCP o ułamek % nad
budżetem" z katalogu flake'ów. Reguła hetmana: „pojedynczy czerwony
`lighthouse` NIE dowodzi regresji — porównaj `resource-summary` obu runów;
sygnałem jest różnica w BAJTACH".

### 4.5. CMS (Sveltia)

- `widget: file` **wgrywa MP4 do R2** (delung: spike + produkcja od
  2026-08-05; eha to samo) — reguła „tylko pola Image" w naszym
  `cms-realizacje.md` jest nieaktualna (prawdą zostaje: biblioteka Assets
  nie trafia do R2, Sveltia nie kasuje z R2).
- `config.yml` eha/hetman mają trzy linie, których u nas brak
  `[POTWIERDZONE]`: `site_domain` (bez tego panel na localhoście wysyła
  `site_id=cms.netlify.com` i wpada na `ALLOWED_DOMAINS` Workera),
  `slug: { encoding: ascii, clean_accents: true }` (slug wklejony
  z telefonu w formie NFD → macOS widzi plik dwa razy → `git add .`
  tworzy duplikat → test unikalności slugów pada; incydent 2026-08-06),
  `media_libraries.all.slugify_filename: true` (plik lądował w R2 jako
  `Img 9635.mp4`).
- Sveltia **0.170.0 u nas vs 0.178.0** w nowszych `[POTWIERDZONE]`;
  procedura bumpu z sondą binarium i jednolinijkowym wycofaniem:
  `delung-web/docs/analiza-remont-panelu.md` §12.
- Reguła „NIGDY `git add .` / `-A`" (delung/eha/hetman) — nasz
  `daily-workflow.md:21` w ściądze ma `git add -A` `[POTWIERDZONE]`.

### 4.6. Fonty

`[POTWIERDZONE]` `BaseLayout.astro:2` importuje
`@fontsource-variable/archivo/index.css` (komplet subsetów: cyrylica, greka,
wietnamski — Vite kopiuje wszystkie pliki do `dist`, choć pobierane są tylko
te z pasującym `unicode-range`) i preloaduje gotowe `latin-ext`. Eha
zmierzyła, że z całego `latin-ext` polski serwis używa **16 glifów**
(`ĄąĆćĘęŁłŃńŚśŹźŻż`) i tnie je harfbuzzem (`scripts/subset-fonts.mjs`,
`subset-font`), generat commitowany w `src/assets/fonts/` (hashowanie
Vite + `immutable`), własny `src/styles/fonts.css`, **`assetsInlineLimit`
wyłączony dla `.woff2`** (GOTCHA: subset 2–3 KB wpada pod 4096 B i Vite
wkleja go jako base64 do CSS blokującego render, a preload wskazuje plik,
którego nikt nie używa), test kontraktu `fonts-subset.test.ts` skanujący
źródła treści (w tym JSON-y CMS) pod kątem znaków spoza subsetu. Efekt
eha: fonty 458 → 211 KB. Dla hadrianm (lżejsze kroje) szacunek
`[DO SPRAWDZENIA]`: ~59 KB latin-ext na PL → ~7 KB; EN bez zmian
(`unicode-range`).

Lekcja pokrewna (delung): **`document.fonts.ready` to fałszywy sygnał przy
preloadowanych fontach** — przy bramce fontu używać `document.fonts.load`.
U nas `fonts.ready` zdejmuje tylko mikro-fade z twardym timeoutem — ryzyko
małe, wiedza do reguły.

### 4.7. SEO i chrome strony

- **Soft-404** `[POTWIERDZONE NA PRODUKCJI]`: `curl -o /dev/null -w
  "%{http_code}" https://hadrianm.pl/nie-ma-takiej-strony-xyz/` → **200**
  (Cloudflare Pages bez `dist/404.html` serwuje stronę główną). Brak
  `src/pages/404.astro`. Eha/hetman: `404.astro` + prop `noindex`
  w BaseLayout (bez canonicala/og:url — „canonical wskazywałby na adres,
  który nie istnieje") + smoke „status 404, nie soft-404".
- `og:image` 1200×1200 + `twitter:card summary` `[POTWIERDZONE]`; nowsze:
  1200×630 + `summary_large_image` („kwadrat: FB/X/LinkedIn kadrują po
  bokach"; `summary` redukuje podgląd do kwadracika).
- `color-scheme` niezadeklarowany `[POTWIERDZONE]` (nowsze: `only light`;
  u nas analogicznie `dark` — zapobiega auto-darkening Chrome Android
  na elementach formularza); `text-size-adjust: none` (WebView przeliczał
  skalę tekstu przy zmianie wysokości viewportu); `theme-color` = tło
  (Android: biały pas przy zwijaniu paska URL). `scrollbar-gutter: stable`
  już mamy.
- Komentarze wewnątrz `is:inline` są wysyłane na każdej stronie
  (`BaseLayout.astro:107-116` ~10 linii) — hetman wyniósł je poza blok
  (−705 B/trasę). `<slot name="head">` dla skryptów przed paintem.
- Generator ikon `make-icons.mjs` (favicon jako wektor 786 B zamiast
  43 KB base64, komplet rastrów + og jednym poleceniem).
- Fade przejść po `document.referrer` zamiast `sessionStorage` (hetman:
  polityka deklaruje brak zapisu w urządzeniu) — u nas `[DO SPRAWDZENIA]`,
  czy polityka prywatności hadrianm wspomina sessionStorage.

### 4.8. Dostępność

Nowsze projekty startują z **pustą allowlistą axe** i traktują kontrast
jako pomiar, nie gust (hetman: 14 szerokości okna × Chromium + WebKit, bo
axe nie liczy tekstu nad obrazem/szkłem; każda wartość krycia w docs ma
znacznik „(kontrast)"). Nasza allowlista `[POTWIERDZONE]`:
`color-contrast: [/\.of-w/, /\.acc\b/]` (intro Oferty) — eha cytuje ją
wprost jako „wzorzec wyjątku". Rozwiązanie z rodziny: osobny token tekstowy
(`--accent-ink` / `--copper-text` ≥ 4,5:1) dla drobnego druku zamiast
koloru akcentu. Pamięć projektu: `.pp-sub` → `--faint` (ratchet zacieśniony
2026-07-19) — ten sam kierunek.

### 4.9. Nakładki (BottomSheet)

Delung/hetman „Runda 4" `overlay.ts`: swipe-down łapany także w TREŚCI
sheeta (gdy przewinięta na górę), przez `touch*` non-passive zamiast
`pointer*` (Playwright wykonuje gest myszą — mysz nie zastępuje palca;
`preventDefault` w PIERWSZEJ klatce ruchu, bo `cancelable` jest `true`
tylko raz), `DRAG_SLOP_PX`, i druga połowa naprawy: `overscroll-behavior:
contain` na `[data-overlay-scroll],[data-overlay-panel]` — objaw:
„mocniejszy gest w dół na Androidzie odświeżał stronę zamiast zamknąć
sheet". Nasz `overlay.ts` ma starszą wersję (grab-handle, `pointer*`)
i gałąź Lenisa w lock/unlock — port ręczny, test na fizycznym Androidzie.
Ocena: nasze generyczne `Modal.astro`/`BottomSheet.astro` są lepsze do
reużycia niż inline-sheety hetmana — bierzemy poprawkę gestu, nie
organizację.

### 4.10. Dokumentacja i proces

Co nowsze repo mają, a my nie (`[Z RAPORTU]`, oceniam jako warte
przeniesienia w wersji „utrzymaniowej"):

- **Prompt sesji o stałej strukturze**: bramka startowa (oczekiwany SHA
  `origin/main`, czysty `git status`, stan `gh run list`), pytania do
  Mateusza „bez czekania na odpowiedź", **pierwsze zadanie = domknięcie
  wpisu poprzedniej sesji**, zakres, **Definition of Done**, lista „na
  telefon". Przeniesione jako `docs/sesja-utrzymaniowa-szablon.md`.
- **„Usterki zbieramy, nie naprawiamy przy okazji"**
  (`poprawki-po-implementacji.md` hetmana): każda pozycja to rozwiązanie,
  które DZIAŁA — pytanie „czy tak ma zostać", nie „czy to błąd"; PR per
  widok; **każdy naprawiony błąd dostaje test, który by go wykrył**.
- **Szablon promptu korekty** z klasyfikacją „błąd / decyzja wyglądu /
  zmiana zakresu — nie ruszaj".
- **Rejestr decyzji** (D01…, „zapadłe — nie otwierać") i oznaczenia
  pewności `[POTWIERDZONE]/[PRAWDOPODOBNE]/[DO SPRAWDZENIA]`.
- **`optional-todos.md` jako dwie tabele**: cykliczne (co / jak często /
  po co) i odłożone (co / do kiedy–warunek) + „Zamknięte w …". Nasz plik
  to lista checkboxów z przeterminowanymi punktami; brak polityki
  **backupu R2** (wskazany już w kronice §E).
- **„Rozważone i ODRZUCONE"** w analizach — żeby pomysły nie wracały.
- Mini-analizy z sekcją **„§10 Uzupełnienia po implementacji z pomiarem"**.
- **Czego NIE kopiować**: hetman/eha trzymają log etapów w `CLAUDE.md`
  (116–176 KB ładowane do każdej sesji). Nasz podział (zwarty `CLAUDE.md`
  + `docs/` + pamięć) jest lepszy; do `CLAUDE.md` tylko fakty i odsyłacze.

## 5. Błędy „pierwszej strony" — stan faktyczny

| # | Objaw | Dowód | Punkt backlogu |
| --- | --- | --- | --- |
| 1 | Safari macOS: „i stali" / „z drewna" na ekranie laptopa w hero mają grube obrysy (zgłoszenie Mateusza) | reprodukcja Playwright WebKit vs Chromium (opis w H1) | **H1** |
| 2 | Soft-404 na produkcji | `curl` → 200 dla nieistniejącego adresu; brak `404.astro` | **S1** |
| 3 | Prod smoke startuje w środku propagacji | `prod-smoke.yml:25` `head -1` | **C1** |
| 4 | Brak ręcznego wyzwalania CI przy awarii webhooków | `ci.yml` bez `workflow_dispatch` | **C2** |
| 5 | Runner `ubuntu-latest` zmienia wersję bez naszej decyzji | 5 × `runs-on: ubuntu-latest` | **C3** |
| 6 | LCP mobile: zapas 465 ms < szum runnera 1300 ms | `lighthouserc.cjs:31` | **L1** |
| 7 | Wpis z panelu rozjeżdża baseline'y; usunięcie ostatniego wpisu wywraca `quality` | `content.config.ts`, 4 × `readdirSync` | **T1**, **T2** |
| 8 | Panel: brak `site_domain`, slug NFD, nazwy plików z telefonu | `config.yml` | **M1** |
| 9 | Sveltia 0.170.0 (nowsze 0.178.0) | `public/admin/index.html:11` | **M2** |
| 10 | Fonty: pełny `index.css` + cały `latin-ext` | `BaseLayout.astro:2,22-25` | **F1** |
| 11 | og 1:1 + `summary`; brak `color-scheme`/`theme-color`/`text-size-adjust` | `BaseLayout.astro`, `global.css` | **S2**, **S3** |
| 12 | Allowlista axe z 2 wpisami | `tests/e2e/a11y.spec.ts:24-26` | **A1** |
| 13 | Trzy progi breakpointów (861 / 760–761 / 768) bez strażnika | `*-config.ts`, `sections.md` | **T4** |
| 14 | `git add -A` w ściądze vs reguła rodziny | `daily-workflow.md:21` | **D1** |
| 15 | Link „polityka prywatności" w nocie RODO formularza różni się od tekstu tylko kolorem (1,37:1 vs wymagane 3:1, bez podkreślenia) — axe `link-in-text-block`, wykrywany NIEdeterministycznie (CI PR #51 czerwone raz na trzy biegi; lokalnie zielone) | `Contact.astro` `.kt a { text-decoration: none }` + `.kt-note { color: var(--faint) }`; raport axe z run 39567243908 | **A2** |

Nie potwierdzone (odrzucone z raportów): CTA-placeholdery `href="#"`
(brak w `src/` — zmigrowane na `/kontakt/`), `scrollbar-gutter` (jest).

## 6. Backlog

Priorytety: **MUST** (naprawia realny błąd produkcyjny lub flake CI, albo
blokuje R1–R3), **SHOULD** (wymierny zysk, mały/średni koszt), **COULD**
(opcjonalne). Koszt: S (< 1 h sesji), M (1 sesja), L (> 1 sesji).
Każdy punkt ma samowystarczalną instrukcję — prompt do osobnej sesji
(razem z `docs/sesja-utrzymaniowa-szablon.md`).

### H — Hero (błędy zgłoszone)

**H1 · MUST · M · ✅ na main 2026-10-21 (PR #51; Safari na Macu potwierdzony przez Mateusza) — Safari: obrys tekstu „z drewna" / „i stali" rysowany NAD wypełnieniem**

*Korekta diagnozy po eksperymencie (2026-10-20, 14 wariantów CSS
wstrzykiwanych w obu silnikach, miara = średnia różnica pikseli crop-a;
podłoga szumu między silnikami na neutralnym fragmencie = 7,3):* w WebKicie
sama OBECNOŚĆ `paint-order: stroke fill` na elemencie (nawet przy zerowym
obrysie) **wyłącza malowanie `text-shadow`** — to, a nie tylko obrys nad
wypełnieniem, dawało „grube krawędzie" bez bevelu. Fix zgodny z opisem
niżej (pierścień na `::before` z nieprzezroczystym wypełnieniem, host =
nieprzezroczysta twarz + cienie; stal bez `.dw-mat`/`background-clip`,
twarz spłaszczona do `#d3d5d7`). Wynik: drewno WebKit↔Chromium 8,3 → 4,5
(poniżej podłogi), stal 27,5 → 11,2; Chromium: drewno bez zmian (0,03),
stal 4,5 (pierścień ~10% jaśniejszy — sweep hero na 3 profilach ZIELONY
bez regeneracji baseline'ów). PhoneSite ten sam wzorzec. e2e hero + a11y
zielone. Do potwierdzenia przez Mateusza: Safari macOS (laptop + telefon
w scenie) i iPhone (faza żywa PhoneSite przed wideo, jeśli występuje).

*Diagnoza (2026-10-20, reprodukcja Playwright 1.61 chromium vs webkit,
viewport 1440×900, DPR 2, scroll 0.24 zakresu hero).* W WebKicie glify
`.dw-wood` i `.dw-steel` mają obrys ~2× grubszy i „zjedzony" korpus:
WebKit **nie honoruje `paint-order: stroke fill` dla tekstu HTML** (działa
tylko w SVG) — `-webkit-text-stroke` jest centrowany na konturze i jego
wewnętrzna połowa maluje się NA wypełnieniu. W Chromium `paint-order`
chowa wewnętrzną połowę pod fill. Dotyczy:
`LaptopSite.astro` `.dw-wood` (stroke na hoście + `paint-order`),
`.dw-steel::before` (podwójny obrys na pseudoelemencie, `z-index:-1`;
dodatkowo w WebKicie gradient `background-clip:text` hosta `.dw-mat` maluje
się w fazie tła, czyli POD pseudoelementem — twarz traci gradient), oraz
`PhoneSite.astro` `.dwm-wood` / `.dwm-steel` (ten sam `paint-order` —
**iOS Safari ma ten sam błąd**, do potwierdzenia na telefonie). Wideo
mobile (`public/drewelomet/video/*.mp4`) nagrywane jest Chromium, więc na
telefonach obrys jest poprawny w nagraniu, ale PhoneSite renderuje się też
żywo w fazie przed wideo? — `[DO SPRAWDZENIA]` w `mobile-phases.ts`,
czy `.dwm-*` jest kiedykolwiek widoczne na iOS poza nagraniem.

*Naprawa (emulacja `paint-order` niezależna od silnika).* Obrys idzie na
pseudoelement pod spodem z **podwójną** szerokością i wypełnieniem w kolorze
obrysu; host (lub wewnętrzny span) maluje czysty fill NA WIERZCHU:

- `.dw-wood`: usuń `-webkit-text-stroke` i `paint-order` z hosta; dodaj
  `.dw-wood::before { content: attr(data-text); position:absolute; inset:0;
  z-index:-1; -webkit-text-stroke: calc(2 * var(--wood-stroke-width))
  var(--wood-stroke-color); -webkit-text-fill-color: var(--wood-stroke-color);
  text-shadow: <dotychczasowe z .dw-mat--wood>; }` i `isolation: isolate`
  na hoście (własny kontekst stackingu, żeby `z-index:-1` nie uciekł pod
  tło sceny). Host zachowuje `color`/`text-shadow` bez obrysu.
- `.dw-steel` (dwa obrysy + gradientowa twarz): markup
  `<span class="dw-steel" data-text="i stali"><span class="dw-steel__face">i stali</span></span>`;
  `::before` = obrys zewnętrzny jasny (`2 × (w1 + w2)`, fill = jasny),
  `::after` = obrys wewnętrzny czarny (`2 × w1`, fill = czarny,
  `text-shadow` ze `.dw-mat--steel`, `z-index` wyżej niż `::before`, oba
  ujemne); `.dw-steel__face` = `position:relative; z-index:1` +
  dotychczasowy gradient `background-clip:text` z `.dw-mat` / `.dw-mat--steel`
  (bez `text-shadow`, bo cień ma być pod twarzą). Pozycjonowany element
  z `z-index:1` maluje się nad ujemnymi pseudoelementami w OBU silnikach,
  niezależnie od fazy malowania `background-clip:text`.
- To samo 1:1 w `PhoneSite.astro` (`.dwm-wood`, `.dwm-steel`;
  `data-text` już jest).
- `filter: drop-shadow` z `.dw-mat--steel` zostaje na hoście.

*Weryfikacja.* (1) Skrypt ad hoc (node + `playwright` z repo): dla
chromium i webkit załaduj `/`, przewiń do 0.24 zakresu hero
(`window.__lenis?.scrollTo(y,{immediate:true,force:true})` + `scrollTo`),
zrób clip `.dw-wood` i `.dw-steel` przy DPR 2 — obrysy mają być tej samej
grubości w obu silnikach, twarz stali z gradientem. (2) `pnpm build &&
pnpm test:visual` — sweep hero chromium: klatki z widocznym napisem
(ok. 02–05) mogą zmienić się o subpiksele AA → pokazać diff, regeneracja
baseline'ów po akceptacji (darwin + workflow linux). (3) Mateusz: Safari
macOS na fizycznym Macu + iPhone (faza żywa PhoneSite, jeśli istnieje).
(4) `pnpm test:e2e` (a11y bez zmian — tekst dekoracyjny sceny).
*Luka testowa do zamknięcia przy okazji (T5):* sweep hero nie ma profilu
WebKit desktop — dlatego ten błąd przeżył 3 miesiące.

Commit: `fix(hero): emulate paint-order for device-site headings (WebKit draws stroke over fill)`

**H2 · SHOULD · S · ✅ na main 2026-10-21 (PR #51) — reguła w `hero-device-scene.md`**: „`paint-order`
nie działa dla tekstu HTML w WebKicie; obrysy tekstu zawsze przez
pseudoelement pod spodem (wzorzec H1)". Razem z H1.

**H3 · COULD · M · ☐ — audyt warstw kompozytora hero + ambient** (CDP
`LayerTree`, DPR 2 i 3): elementy `opacity:0` trzymające warstwy →
`visibility` w keyframes (lekcja delung `analiza-poprawki-5.md`). Kryterium:
liczba warstw i MB tekstur przed/po; potencjalnie flaky klatki 05–09
i limit GPU Androida. Tylko z pomiarem; bez pomiaru nie ruszać.

**H4 · COULD · S · ☐ — `phone-site.ts` bez relayoutu po fontach** (hipoteza
z P8, NIEPOTWIERDZONA): `layout()` mierzy `offsetTop`/wysokości sekcji ekranu
telefonu RAZ przy inicjalizacji (relayout tylko na `resize`). W P8
podejrzewany o czerwony sweep `webkit-1440` 05–09 (PR #59) — cofnięcie
`unicode-range` Sairy NIE zmieniło diffu ani o piksel, więc nie to było
przyczyną (faktyczna klasa: timing ekranu telefonu → T9). Zostaje jako
kandydat na źródło wrażliwości ekranu telefonu na timing: tylko z pomiarem
(np. `fonts.ready.then(relayout)` wg wzorca re-glue z `timeline-base.ts`
i porównanie rozrzutu klatek 05–09 między przebiegami). Commit:
`fix(hero): relayout phone screen after fonts load`.

### R — Realizacje (treść i prezentacja)

**R1 · MUST · L · ✅ 2026-10-22 (PR #53 P4: Etapy 1–4; PR #54 P5: Etapy 5–6; Etap 7 — telefony i desktopy na produkcji 2026-10-22, bez usterek) — wideo w podglądzie realizacji** — plan i etapy:
`docs/analiza-realizacje-wideo.md` (zamknięty; decyzje D1–D14 obowiązują).

**R2 · MUST · S · ✅ wdrożone lokalnie 2026-10-21 (PR P3) — `results` i `quote`/`author`/`role` opcjonalne**:
Zod `.optional()` / `.default([])`, `config.yml` `required: false`,
`WorkDetail.astro` renderuje blok „Liczby i wyniki" tylko gdy `results.length
> 0` i cytat tylko gdy `quote` (siatka `.wdx__results` na 1–2 pozycje:
`repeat(auto-fit, minmax(120px, 1fr))`), `work-data.ts` typy. Powód:
prawdziwe realizacje nie mają jeszcze zmierzonych metryk ani cytatów —
nie wymyślamy. Test: `cms-contract` z wpisem bez tych pól; e2e modal bez
bloku. Baseline'y modal/sheet zmienią się dopiero z treścią (R3).
Commit: `feat(cms): make results and testimonial optional`.
**Wdrożyć PRZED Etapem 6 planu wideo.**

**R3 · MUST · M (głównie praca Mateusza w panelu) · ✅ 2026-10-21 (P5; na main przez commity Sveltii, `order` 10/20/30, sieroty R2 skasowane ręcznie) — podmiana treści**:
3 wpisy (delung, pracownia-eha, hetman) wg Etapu 6 planu wideo; usunięcie
aura/dab/sielski; sprzątanie sierot w R2; `liveUrl` hetmana po
przełączeniu domeny → wydzielone jako **R5**. Warunek wstępny: **T1** (fixture), inaczej baseline'y
siatki/kafelków rozjadą się z każdą korektą wpisu.

**R4 · COULD · M · ☐ — hover-play wideo na kafelkach desktop** (po R1;
budżet LHCI: `preload="none"`, start dopiero po `mouseenter`).

**R5 · SHOULD · XS · ☐ — `liveUrl` Hetmana po przełączeniu domeny**: wpis
`hetman` wskazuje tymczasowo `https://nowa.hetmannieruchomosci.com` (tam
stoi nowa strona do czasu podmiany DNS). Gdy nowa strona wejdzie na
`https://hetmannieruchomosci.com`: w panelu zmienić pole „Adres strony"
(tylko link „Zobacz stronę na żywo" w nakładce — żaden test ani baseline nie
zależy od tej wartości; nagrania i zrzuty zostają, bo treść strony ta sama).
Sygnał: HEAD na `nowa.` zaczyna przekierowywać albo klient potwierdza
przełączenie.

### T — Testy

**T1 · MUST · M · ✅ wdrożone lokalnie 2026-10-21 (PR P3; baseline'y bez zmian — fixture = kopia wpisów) — zamrożony fixture treści dla `test:visual`**:
`content.config.ts` czyta `base` z `process.env.REALIZACJE_DIR ??
"./src/content/realizacje"`; `tests/fixtures/realizacje/*.json` (3 wpisy:
od P5 2026-10-21 kopie hetman/pracownia-eha/delung z dnia podmiany treści —
hetman jako pierwszy wpis ma `video`, więc maska `.wd__video` jest widoczna
na baseline'ach modal/sheet; pierwotnie kopie aura/dab/sielski); skrypt `build:visual` = `REALIZACJE_DIR=./tests/fixtures/
realizacje astro build`; strażnik `assertVisualFixture(page)` w
`tests/helpers/guards.ts` (liczba `template[data-work-detail]` = liczba
plików fixture, inaczej czytelny błąd „build z treścią produkcyjną —
uruchom `pnpm build:visual`"), użyty w specach visual dotykających work
(`sections.spec.ts`, `work-index.spec.ts`); `ci.yml` job `e2e`: osobny
build pod visual (lub artefakt `dist-visual`); `update-visual-baselines.yml`
analogicznie; kontrakt `tests/unit/visual-fixture.test.ts` (fixture
przechodzi schemat). `.claude/rules/testing.md`: akapit „visual =
fixture, e2e = treść produkcyjna". Wzorzec: `delung-web/tests/helpers/
guards.ts` `assertVisualFixture`, `delung-web/package.json` `build:visual`.
Commit: `test(visual): freeze realizacje fixture for screenshot builds`.

**T2 · MUST · S · ✅ wdrożone lokalnie 2026-10-21 (PR P3) — testy odporne na pustą kolekcję**:
`tests/helpers/realizacje.ts` z `realizacjeFiles(): string[]`
(`existsSync` → `[]`) i `realizacjeDir`; zamiana w 4 plikach (§5 pkt 7);
w e2e `test.skip(ENTRY_COUNT === 0, "brak wpisów w panelu")`; jeden
czerwony kontrakt zostaje w `cms-contract.test.ts` („katalog zawiera co
najmniej jeden wpis") — świadomie, bo pusta lista realizacji na wizytówce
to błąd treści, nie infrastruktury. Commit: `test: tolerate missing realizacje directory`.

**T3 · SHOULD · S · ✅ wdrożone lokalnie 2026-10-23 (PR A `ci/lhci-measure`; `settleImages()` w `tests/helpers/visual.ts`, wywołana w `prepareSweep` i w lokalnym `prepare` sections.spec.ts; weryfikacja `test:visual`: 114 passed, 1 diff `work-index-grid` webkit-iphone-se ratio 0.01 — karta Delung, trzecia i najgłębiej pod foldem na SE 320×568: baseline miał ekrany PUSTE (lazy obraz bez podjętej próby ładowania w chwili zrzutu), po T3 deterministyczny stan końcowy — ikona błędu + alt jak na kartach 1–2, bo `/cdn-cgi/image` nie istnieje na preview; czyli dokładnie klasa wyścigu, którą T3 zdejmuje; diff ZAAKCEPTOWANY przez Mateusza 2026-10-23, darwin zregenerowany zawężonym przebiegiem — jedyny przepisany plik to `work-index-grid-darwin.png` webkit-iphone-se, kontrolny przebieg speca 18/18 passed; linux przez workflow z inputami T6 — `spec=tests/visual/work-index.spec.ts`, `mode=changed` — po pushu brancha, commit darwin NA KOŃCU) — `settleImages()` w `prepareSweep`/`prepare`**
(eager + `decode()` dla obrazów w kadrze przed zrzutem) — port z
`delung-web/tests/helpers/visual.ts:14-40`. Spodziewany efekt: mniej
diffów „tylko krawędzie zdjęć" na runnerach. Commit: `test(visual): settle images before screenshots`.

**T4 · SHOULD · M · ✅ na main 2026-10-24 (PR #59 `fix/p8-quality`, merge `cc3a05a`; `tests/helpers/breakpoint.ts` + `tests/e2e/breakpoints.spec.ts`, 8 testów na chromium-1920: 861 = `.om-stage` position na /o-mnie/, `.dk-meta` /dla-kogo/, `.of-meta` /, `.fq-meta` /faq/, `.kt-meta` /kontakt/; 761 = `.wk-car` display + klik → `#work-sheet`/`#work-modal`; 769 = `.ambient-bg__clouds` (CSS `max-width: 768px`); stałe importowane z configów sekcji; mutacja kontrolna: próg Oferty w CSS przesunięty o 1 px → czytelny FAIL) — kontrakt progów breakpointów**:
`tests/helpers/breakpoint.ts` `expectBreakpointFlip(page, url, selector,
minPx)` mierzący `display`/układ przy `minPx-1` i `minPx`; po jednym teście
dla 861 (about, audience, services, faq, contact), 761 (work modal↔sheet),
768 (ambient tekstura mobile). Decyzji o ujednoliceniu progów NIE
podejmujemy (ruszyłaby baseline'y wszystkich sekcji) — tylko strażnik.
Commit: `test(e2e): guard section breakpoints at minPx-1/minPx`.

**T5 · SHOULD · M · ✅ na main 2026-10-21 (PR #51, oba komplety baseline'ów) — profil WebKit desktop w sweepie hero**:
`playwright.config.ts` projekt `webkit-1440` (viewport 1440×900, **DPR 1**
jak chromium-1920 — rozmiar PNG w repo; geometria obrysów nie zależy od
DPR) z `testMatch` zawężającym do `tests/visual/hero.spec.ts` (bez tego
doszłyby baseline'y wszystkich sekcji i siódmy przebieg e2e);
`HERO_SWEEP_PROJECTS = [...SWEEP_PROJECTS, "webkit-1440"]` w hero.spec.
Dry-run `--update-snapshots=none` przeszedł do końca sweepa (fail tylko
na brakujących snapshotach). Baseline'y: darwin przez
`pnpm exec playwright test tests/visual/hero.spec.ts --project=webkit-1440
--update-snapshots` (11 klatek), linux przez workflow na gałęzi PR-a.
Commit: `test(visual): add webkit desktop profile to hero sweep`.

**T6 · SHOULD · S · ✅ wdrożone lokalnie 2026-10-23 (PR A `ci/lhci-measure`; krok aktualizacji = `pnpm exec playwright test ${spec} --update-snapshots=${mode}` zamiast `pnpm test:visual:update`) — `update-visual-baselines.yml` z inputami `spec`
(ścieżka speca, domyślnie `tests/visual`) i `mode` (`changed`/`all`)** +
akapit „zielony ≠ aktualny: pomiar progiem 0 bez ruszania baseline'u" w
`.claude/rules/testing.md` (procedura: `maxDiffPixelRatio: 0` na jeden
przebieg, odczyt, przywrócenie). Wzorzec: `eha/pracownia-eha-web/.github/
workflows/update-visual-baselines.yml:12-33`.
Commit: `ci(baselines): allow spec and mode inputs`.

**T7 · COULD · S · ✅ na main 2026-10-27 (PR #64, merge `c178204`; wdrożone 2026-10-26, sesja 10, P10; `vitest.dist.config.ts` osobno od `vitest.config.ts` — `test:unit` dalej 12 plików bez `tests/dist`; `tests/dist/dist.test.ts` = 6 asercji: (a) `localhost`/`127.0.0.1`/porty 4321 i 4399, (b) pełny e-mail BEZ wyjątków — polityka prywatności też składa adres z fragmentów (`PolicyPage.astro` `[data-pp-mail]`), stopka bez `mailto:`, więc w HTML nie ma żadnego adresu; bundle JS/CSS zostaje w `contact.spec.ts`, (c) `robots.txt` (Disallow `/admin` + `Sitemap:`), `sitemap-index.xml` → potomne na `site`, zbiór adresów sitemapy = zbudowane strony poza `404.html`/`admin/`; zielone na `build` i `build:visual` (22 HTML, 20 adresów), negatywny test z podrzuconym plikiem = 3 czerwone z `plik:linia → „trafienie" w: …kontekst…`; `pnpm test:dist` w `quality` po `pnpm build` (przed uploadem artefaktu) i w `pnpm test` między unit a e2e; `/release-check` bez ręcznego grepa; DEC-106) — warstwa `test:dist`** (`vitest.dist.config.ts`,
`tests/dist/dist.test.ts`): skan `dist/**/*.html` pod kątem `localhost`,
portów dev, pełnych adresów e-mail poza mechanizmem „[ POKAŻ ]", obecności
`robots.txt`/`sitemap-index.xml`; w jobie `quality` po buildzie. Zastępuje
ręczny grep w `/release-check`. Wzorzec: hetman `tests/dist/dist.test.ts`.

**T8 · COULD · S · ✅ na main 2026-10-27 (PR #64, merge `c178204`; wdrożone 2026-10-26, sesja 10, P10; sekcja „Pomiar w testach" w `.claude/rules/testing.md` — geometria rect + tolerancja, czas w przeglądarce, sufit klasy, czerwone w izolacji, skan builda zamiast grepa; wiersz tabeli dla robots/sitemap/tras/danych kontaktowych → `pnpm build && pnpm test:dist`; DEC-107–110, DEC-88 → zastąpiona; `offsetHeight` w `scroll.ts`/`visual.ts`/`about.spec.ts` liczy pozycje scrolla, nie asercje — reguła to precyzuje; progi hero 0,02/0,01 sprzed reguły NIE przeliczane przy okazji → **T10** + PI-04) — reguły testów z rodziny do `testing.md`**:
geometria sub-pikselowo (`getBoundingClientRect` + tolerancja, nie
`offsetHeight`); próg per-shot podnosić dopiero po policzeniu sufitu klasy
(udział elementu w kadrze × czułość percepcyjna); czas mierz wewnątrz
przeglądarki (`performance.now()` + `MutationObserver`), nie timerami
testu; „czerwone w izolacji = z definicji nie flake".

**T9 · COULD · S · ✅ wdrożone 2026-10-24 w P8 (PR #59, decyzja Mateusza; `FLAKY_DESKTOP_PROJECTS` = chromium-1920 + webkit-1440, próg 0,02 na klatkach 05–09; wyzwalacz: po F1 CI `webkit-1440` 05–09 czerwone 4/4 z diffem wyłącznie w kadrze telefonu, max ~0,011, identycznym co do piksela w każdym przebiegu; kontrolne CI na main zielone; w Dockerze Playwright 1.61.1 (arm64 i amd64) klatki telefonu odbiegały od baseline'u CI także na main, a main i branch dawały tam identyczne zrzuty → przesunięcie treści telefonu płynne i zależne od środowiska/timingu, nie od metryki fontu) — próg `FLAKY_DESKTOP_FRAMES` także dla `webkit-1440`**:
profil `webkit-1440` (T5) NIE ma podwyższonego progu dla flaky klatek hero
05–09 (ekran telefonu + ambient) — ma go tylko `chromium-1920` w
`hero.spec.ts`. Objaw zaobserwowany przy S3 (sesja 4, §10): FAIL ratio
0.01–0.02 wyłącznie na ekranie telefonu, kontrolny rerun tego samego
buildu zielony. Nie naprawiać „przy okazji" — osobna mała zmiana z
kontrolnym przebiegiem.

**T10 · COULD · XS · ☐ — sufit klasy dla progów hero** (`FLAKY_DESKTOP_FRAMES`
0,02 na chromium-1920/webkit-1440, pixel-5 00–03 0,01; DEC-79): progi
ustalone z obserwowanych diffów (max ~0,011 / ~0,35 %), nie z policzonego
udziału kadru telefonu / akcentu serif w zrzucie (reguła T8, DEC-109). Przy
następnym dotknięciu `hero.spec.ts`: policzyć sufit (udział × ok. 0,1
percepcyjnie), dopisać komentarz z liczbą i datą; próg zmienia się tylko,
jeśli sufit wyjdzie poniżej obserwacji (wtedy = kontrolny przebieg na main).
Wpis: `poprawki-po-implementacji.md` PI-04 (zmiana zakresu). Commit:
`test(visual): document class ceiling for hero flaky thresholds`.

**T11 · SHOULD · XS · ✅ na main 2026-10-28 (PR #67, merge `0bce589`;
CI na PR run 40720478806 i na main 40730558262: `e2e` 682 passed,
0 flaky, apt przez próbę 1; wyzwalacz: `work.spec.ts:123` czerwone
w CI 2026-10-27 na PR #65 (pixel-5) i 2026-10-28 na main, run 40659086581
(chromium-1920 i pixel-5 w obu próbach, 1366 flaky; 679 passed) przy diffie
bez bajtów strony; mechanizm potwierdzony sondą: `play()` zdejmuje `paused`
od razu, `currentTime` rusza po danych z sieci — 600 ms po `!paused` to
pomiar R2, nie odtwarzania; lokalnie z fixture 12/12 na 7 profilach, cały
work.spec 24/24; DEC-112, P-73) — wideo nakładki w e2e z LOKALNEJ fixture,
nie z R2**: `page.route` na `media.hadrianm.pl/*.mp4` →
`tests/fixtures/video/screen-loop.mp4` (ffmpeg `testsrc2` 32×32, 1 s,
10 klatek, 2,3 KB; `public/lpm-probe.mp4` odpadł — w Chromium zostaje na
`readyState` 1), asercja `expect.poll(!paused && currentTime > 0, 10 s)`
zamiast odczytu po 600 ms; adres `src` nadal = R2. Commit:
`test(e2e): serve overlay video from a local fixture and poll playback`.

### C — CI / deploy

**C1 · MUST · S · ✅ na main 2026-10-21 (PR #50) — strażnik prod-smoke na komplet assetów**: w
`prod-smoke.yml` zamiast `head -1`: `assets=$(grep -oE "/_astro/[^\"' ,)]+"
dist/index.html | sort -u)`; pętla czeka, aż (a) HTML produkcji zawiera
KAŻDY asset (`[[ "$html" == *"$a"* ]]` — bez `echo | grep`, Broken pipe) i
(b) `curl -s -o /dev/null -w "%{http_code}"` każdego = `200`; dopiero
wtedy smoke. Wzorzec: `hetmannieruchomosci-web/.github/workflows/
prod-smoke.yml:35-65`. Aktualizacja wpisu w pamięci/katalogu flake'ów po
wdrożeniu. Commit: `ci(prod-smoke): wait for every hashed asset with 200`.

**C2 · MUST · S · ✅ na main 2026-10-21 (PR #50) — `workflow_dispatch`** w `ci.yml` i `prod-smoke.yml`
(z komentarzem „awaria webhooków GH 2026-08-06"). Commit:
`ci: allow manual dispatch of ci and prod-smoke`.

**C3 · MUST · S · ✅ na main 2026-10-21 (PR #50; kontrola baseline'ów linux w CI tego PR-a) — `runs-on: ubuntu-24.04`** we wszystkich workflowach
(5 miejsc) + nota w `testing.md`: „bump obrazu runnera = świadoma decyzja,
razem z kontrolą baseline'ów linux". Zrobić w JEDNYM PR z C1/C2 i sprawdzić,
czy baseline'y linux nie drgnęły (jeśli `latest` już jest 24.04 — zero
zmian). Commit: `ci: pin runners to ubuntu-24.04`.

**C4 · SHOULD · S · ✅ wdrożone lokalnie 2026-10-23 (PR A `ci/lhci-measure`; RÓŻNICA wobec wzorca hetmana: build przez `pnpm build`, NIE `pnpm build:visual` — job `lighthouse` w ci.yml mierzy artefakt `dist` z treścią produkcyjną, więc pomiar bazowy musi mierzyć ten sam build; gotcha z komentarza hetmana potwierdzona: `gh workflow run` działa dopiero, gdy plik jest na main) — `lhci-measure.yml`** (`workflow_dispatch`: 5
przebiegów × mobile/desktop → mediany w `$GITHUB_STEP_SUMMARY` + artefakt
30 dni) jako jedyne źródło liczb do L1. Wzorzec: hetman
`.github/workflows/lhci-measure.yml`. Commit: `ci(lhci): add measurement workflow`.

### L — Lighthouse

**L1 · MUST · S · ✅ na main 2026-10-24 (PR #57 `chore/lhci-budgets`, merge `d9750ce`; kontrolne CI na main run 40083791571 zielone, checki na PR za pierwszym razem; pomiar: run `lhci-measure.yml` 40079996952 na main `fe4914f`, mediany z 5; progi: LCP mobile 4851 = 3551 + 1300, desktop 3210 = 1910 + 1300 — gorszy URL to /en/; TBT desktop 300 = max(0×2; 0+300), między granicami Google 200/600 — bez snapu; perf 0,80 (m) / 0,85 (d) = mediana − 0,05 w dół do 0,05; `font:count` → error, nowy `font:size` error 113 600 (m) / 168 800 (d) = mediana + 10%, deterministyczny co do bajta w 5/5 przebiegów; `numberOfRuns: 5`; **ratchet po F1** ✅ na main 2026-10-26 — PR #63 `chore/lhci-ratchet-after-f1`, merge `d7010ba`, dane z runu 40124168778: LCP 4678 (m) / 3177 (d), perf 0,85 (m) / 0,85 (d), checki za pierwszym razem; O4 w `optional-todos.md` zamknięte) — progi LCP z zapasem ≥ szumu runnera**: po pomiarze
(C4 lub `lhci-median.mjs` z 5 przebiegów na main): LCP =
`max(mediana × 1,15; mediana + 1300)` (mobile i desktop), TBT desktop
100 → wg reguły `max(mediana × 2; mediana + 300)` zaokrąglone do granicy
Google, `numberOfRuns: 5`, `font:count` → `error`, nowy `error`
`resource-summary:font:size` (po F1 — zacieśnić), przy każdej asercji
komentarz „dlaczego ten próg" z datą i numerem runu. **Osobny commit,
osobny PR, po pomiarze na main** (ratchet-reguła). Dopisać do
`.claude/rules/testing.md`: „pojedynczy czerwony lighthouse nie dowodzi
regresji — porównaj `resource-summary` obu runów; sygnał = bajty".
Commit: `chore(lhci): set budgets to runner medians plus variance margin`.
Decyzje Mateusza 2026-10-23 (sesja 5, przed PR B):
`categories:performance` TEŻ z pomiaru — `minScore` = mediana − 0,05,
zaokrąglone W DÓŁ do wielokrotności 0,05 (stały próg 0,9 leżał na
krawędzi: main mierzy 0,88–0,92); lista URL-i bez zmian — `/en/` zostaje
w pomiarze i bramce (sensor `/polityka-prywatnosci/` = L2, osobno).

**L2 · COULD · S · ☐ — trasa-sensor** `/polityka-prywatnosci/` jako drugi
URL mobile (koszt samego chrome'u bez mediów) obok `/`; `/en/` zostaje
tylko jeśli budżet czasu joba pozwala.

### M — CMS

**M1 · MUST · S · ✅ na main 2026-10-21 (PR #50) — `config.yml`**: `site_domain: hadrianm.pl`,
`slug: { encoding: ascii, clean_accents: true }` (opcja globalna, nie per
kolekcja), `media_libraries.all.slugify_filename: true` (binarium 0.170.0
zna wszystkie trzy opcje — sprawdzone grep-em bundle'a 2026-10-20).
Weryfikacja w panelu po merge'u: otwórz istniejący wpis, zapisz bez zmian
→ nazwa pliku bez zmian; upload testowego pliku „Test Obraz.webp" → w R2
`test-obraz.webp` (potem usuń w dashboardzie). Aktualizacja
`.claude/rules/cms-realizacje.md`: (a) `file` wgrywa do R2 (Assets nadal
nie), (b) „nigdy `git add .`", (c) nazwy plików slugifikowane.
Commit: `chore(cms): ascii slugs, site_domain, slugified media names`.

**M2 · SHOULD · S · ✅ wdrożone lokalnie 2026-10-21 (PR P3; sonda binarium = wynik delung co do bajta: 1 972 914 → 2 480 375 B, `cloudflare_r2` 5→14 = tłumaczenia, reszta symboli bez zmian, brak CSP; przeklik panelu w trybie lokalnym — Mateusz) — Sveltia 0.170.0 → 0.178.0** wg procedury
`delung-web/docs/analiza-remont-panelu.md` §12 (sonda binarium, test w
trybie lokalnego repo, wycofanie = jedna linia w `public/admin/index.html`).
Robić PRZED Etapem 2 planu wideo (widget `file`, `accept`).
Commit: `chore(cms): bump sveltia to 0.178.0`.

**M3 · COULD · S · ☐ — skrypt `scripts/upload-r2.mjs`** (plan B z
`analiza-realizacje-wideo.md` §8) + `scripts/r2-orphans.mjs` (lista
plików w R2 nieużytych w żadnym JSON-ie — sprzątanie sierot zamiast
klikania w dashboardzie). Wzorzec: hetman `@aws-sdk/client-s3`,
endpoint `{account}.eu.r2.cloudflarestorage.com` (jurysdykcja EU).

### F — Fonty

**F1 · SHOULD · M · ✅ na main 2026-10-24 (PR #59; 3 subsety `latin-ext` → `src/assets/fonts/*-pl.woff2`: Archivo 32 608 → 4 736 B, Instrument Serif italic 12 384 → 4 988 B, Saira Condensed 600 14 736 → 3 864 B — razem 59 728 → 13 588 B; `src/styles/fonts.css` (globalne) + `src/styles/fonts-hero.css` (Saira, import w Hero — tylko strona główna; deklaracja bez `unicode-range`, 1:1 z dawnym `latin-ext-600.css` — wersję z zakresem cofnięto w trakcie diagnozy czerwonego sweepa `webkit-1440`, który okazał się klasą T9, nie winą zakresu); z `index.css` Archivo wypadł nieużywany `vietnamese`; preloady PL → subsety, serif tylko italic; `assetsInlineLimit` false dla `.woff2` (zero `data:` w CSS); pomiar Playwright na preview, `/` (pobrane fonty): mobile 4 pliki 66 780 B (L1: 103 268), desktop 7 plików 105 144 B (L1: 153 419), `/en/` 61 792 / 100 156 B, bez podwójnych pobrań; `subset-font` 2.9.0 jako devDependency — lockfile ręcznie oczyszczony z przy-okazyjnego podbicia `third-party-web`/`legacy-javascript` (pływający zakres w `@paulirish/trace_engine` Lighthouse'a); progi LHCI nietknięte w P8; zacieśnienie `font:size` = mini-PR `chore/lhci-font-budgets` po pomiarze `lhci-measure.yml` run 40124168778 na main `cc3a05a`: mobile 4 × 67 998 B (`/`, było 103 268) → próg 74 800 (było 113 600), desktop 7 × 107 275 B (`/`, było 153 419) → próg 118 100 (było 168 800), deterministycznie 5/5, formuła L1 mediana + 10%; ✅ na main 2026-10-24, PR #60, merge `68fe906`, CI + Prod smoke zielone) — polskie subsety fontów**: `scripts/subset-fonts.mjs`
(`subset-font`, stała `SUBSET_CHARS = "ĄąĆćĘęŁłŃńŚśŹźŻż"` + ewentualne
znaki z i18n EN spoza `latin` — test wskaże) → `src/assets/fonts/*.woff2`
(commitowane); `src/styles/fonts.css` z deskryptorami 1:1 z Fontsource
(`latin` dalej z pakietu, `latin-ext` = subset); usunięcie importów
`index.css`; `astro.config.mjs`: `vite.build.assetsInlineLimit` zwracający
`false` dla `.woff2`; preloady wskazują subsety; test
`tests/unit/fonts-subset.test.ts` skanujący `src/**/*.astro`, `src/i18n`,
`src/content/realizacje/*.json`, `docs`-nie. Pomiar przed/po:
`resource-summary:font:size` na `/` i `/en/` (wpisać do L1). Wzorzec:
`eha/pracownia-eha-web/scripts/subset-fonts.mjs`, `src/styles/fonts.css`,
`tests/unit/fonts-subset.test.ts`. Commit: `perf(fonts): ship polish subsets instead of full latin-ext`.

**F2 · COULD · S · ✅ 2026-10-28 (branch `docs/close-t11`; wpis w sekcji
„Wspólne" `sections.md` z mechanizmem: `ready` rozstrzyga się, gdy nie ma
trwających ładowań, a preloadowany font zaczyna się ładować dopiero przy
pierwszym układzie tekstu; istniejące użycia — navbar, re-glue hero,
mikro-fade — mają własny fallback i zostają) — reguła**:
„`document.fonts.ready` jest fałszywym sygnałem przy preloadowanych fontach
— do bramek używać `fonts.load()`" w `.claude/rules/sections.md`.

### S — SEO i chrome

**S1 · MUST · S · ✅ 2026-10-22 (P6, branch `feat/chrome-seo`; korekta wykonawcza: oba warianty językowe RAZEM z chrome'em w blokach `[data-nf-lang]`, skrypt po blokach USUWA nieaktywny — Navbar wiąże się z pierwszym `[data-nav]`, menu mobilne ma stałe `id`; `astro preview` serwuje `404.html` ze statusem 404, więc test statusu działa też lokalnie; 404 dopisana do skanu axe; reguła `.claude/rules/layout-seo.md`) — prawdziwa strona 404**: `src/pages/404.astro`
(jeden plik → `dist/404.html`; Cloudflare Pages używa go dla każdego
nieistniejącego adresu), dwujęzyczna (PL domyślnie, EN gdy
`location.pathname.startsWith("/en/")` — inline skrypt przełączający
widoczność bloków, bez SSR), chrome jak podstrony (Navbar + Footer, ambient
`red`), `BaseLayout` prop `noindex` (`<meta name="robots"
content="noindex">`, BEZ canonicala i `og:url`), link do strony głównej
obu języków; `tests/e2e/not-found.spec.ts` (preview: `/xyz/` → 404 +
treść); smoke `@prod-smoke`: `GET /nie-ma-takiej-strony/` → status 404
(nie 200). Wzorzec: `eha/pracownia-eha-web/src/pages/404.astro`,
`tests/e2e/not-found.spec.ts`, `smoke.spec.ts` „status 404".
Commit: `feat(seo): real 404 page with noindex`.

**S2 · SHOULD · S · ✅ 2026-10-22 (PR #55; obraz: Mateusz wybrał wariant „screenshot pierwszego ekranu hero PL" — brand + hasło, bez nav/przełącznika języka/burgera — zamiast eksportu z designu czy generatora z S4; `public/og-image.png` 1200×630, palette PNG 111 KB; kontrakt `tests/unit/og-image.test.ts`: wymiary z IHDR PNG = meta, waga ≤ 300 KB; S4 zostaje w backlogu bez zmian) — og:image 1200×630 + `summary_large_image`**:
nowy obraz (eksport z designu albo generator `make-icons.mjs` — S4),
kompresja (lekcja delung: 649 → 98 KB), `BaseLayout` meta
`og:image:width/height`, `twitter:card`. Sprawdzić podgląd w debugerze
LinkedIn/X. Commit: `feat(seo): landscape og image and large summary card`.

**S3 · SHOULD · S · ✅ 2026-10-22 (P6; `color-scheme: dark` w `:root`, `text-size-adjust: none` na `html` — nadpisuje preflight Tailwinda `100%`; komentarze wyniesione z `is:inline` = −575 B/trasę; `theme-color` `#000000` BYŁ już równy tłu `body` (każda trasa `background: #000`, manifest też `#000000`) — hipoteza z §4.7 nie potwierdziła się u nas, wartość bez zmian + komentarz; `test:visual` 114 passed, baseline'y nietknięte) — chrome mobile**: `global.css` `:root {
color-scheme: dark; }`, `html { -webkit-text-size-adjust: none;
text-size-adjust: none; }`, `<meta name="theme-color">` = kolor tła
strony; komentarze z bloków `is:inline` w `BaseLayout` przenieść nad
blok (poza wysyłany HTML). Baseline'y: brak wpływu (zweryfikować
`test:visual`). Commit: `fix(layout): color-scheme, text-size-adjust, theme-color`.

**S4 · COULD · S · ☐ — `scripts/make-icons.mjs`** (wektor → komplet ikon +
og jednym poleceniem; strażnik „GENERAT" w `seo.spec.ts`). Wzorzec: eha.

**S5 · COULD · S · ☐ — fade przejść po `document.referrer`** zamiast
`sessionStorage` — tylko jeśli polityka prywatności hadrianm deklaruje
brak zapisu w urządzeniu (sprawdzić treść `polityka-prywatnosci.astro`).

### A — Dostępność

**A1 · SHOULD · S · ✅ ZAMKNIĘTE jako przeformułowane 2026-10-24 (P8, decyzja Mateusza: wyjątek zostaje, allowlista NIE jest pusta) — pomiar obalił założenie punktu: stan końcowy akcentu spełnia AA na najjaśniejszym pikselu ambientu (kontrast): `--accent` 4,60:1 (WebKit 1920) / 4,66 (WebKit 1024, Chromium 1920) / 4,77 (Chromium 1024) / 4,81 (WebKit 390) / 5,07:1 (Chromium 390), `--ink` ≥ 12,5:1 — token `--accent-ink` niepotrzebny. axe zgłasza WYŁĄCZNIE stan startowy animacji „czytania scrollem” (słowo krycie 0,14 → `#222221`, akcent 0,24 → `#3d1611`; 1,31:1 na czerni; 60 węzłów desktop / 6 mobile na `/`), przy takim kryciu żaden kolor nie da 4,5:1. Jedyna realna droga do zera = podniesienie krycia startowego do ~0,5 (zabija efekt) — odrzucona; komentarz allowlisty w `a11y.spec.ts` z pomiarem. Baseline'y `services` nietknięte.** Pierwotny opis — allowlista axe do zera: dla `.of-w`/`.acc`
(intro Oferty) osobny token tekstowy (np. `--accent-ink`, pomiar ≥ 4,5:1
na tle sekcji w 3 szerokościach, Chromium + WebKit), zmiana koloru TYLKO
w stanie spoczynku spanów (animacja rozjaśniania zostaje), usunięcie wpisów
z `KNOWN_VIOLATIONS`. Baseline'y `services.spec.ts` do regeneracji po
akceptacji. Przy wartościach w docs znacznik „(kontrast)" = wynik pomiaru.
Commit: `fix(services): aa contrast for intro accents, empty axe allowlist`.

**A2 · MUST · S · ✅ na main 2026-10-24 (PR #59; `.kt-note a` underline/0,15em/1px, kolor bez zmian; strona główna NIE ma `.kt-note` — tylko baner; dowód deterministyczny: axe `link-in-text-block` dla linku na `/kontakt/` i `/en/contact/` przed = `incomplete` (źródło losowych zgłoszeń), po = `passes`; allowlista bez nowych wpisów; diff `contact-index-form` POD progiem 0,0005 na 6 profilach (pomiar progiem 0: tylko podkreślenie + animowane logo navbara) — zaakceptowany przez Mateusza jako „zielony, ale nieaktualny”, darwin zregenerowany filtrem `tests/visual/contact-index.spec.ts:29` (6 plików, kontrola 18/18), linux workflow z tym samym filtrem i `mode=all`) — link w nocie RODO odróżnialny nie tylko kolorem**
(§5 pkt 15): `Contact.astro` — `.kt-note a { text-decoration: underline;
text-underline-offset: 0.15em; text-decoration-thickness: 1px; }` (bez
zmiany koloru; kontrast tekst↔link 1,37:1 nie da się podnieść do 3:1 bez
porzucenia akcentu, podkreślenie spełnia regułę wprost). Dotyczy
`/kontakt/` i `/en/contact/` (ta sama nota) oraz noty na stronie głównej,
jeśli korzysta z `.kt-note`. Test: `tests/e2e/a11y.spec.ts` bez nowego wpisu
w allowliście (ratchet); baseline'y `contact-index.spec.ts` (element z notą)
do regeneracji po pokazaniu diffu. Dlaczego osobno: axe zgłasza to losowo
(zależnie od geometrii/nakładania przy skanie), więc czerwony `e2e` na
niezwiązanym PR-ze = rerun tego samego SHA, a naprawa tutaj. Commit:
`fix(contact): underline privacy link in form note (axe link-in-text-block)`.

### U — Nakładki

**U1 · SHOULD · M · ✅ na main 2026-10-24 (PR #59; port 1:1 bloku gestu z hetman do `src/scripts/overlay.ts` — `touch*` non-passive, `pending`/`DRAG_SLOP_PX`, start z treści przewiniętej na górę, `[data-overlay-nodrag]`; `overscroll-behavior: contain` na `[data-overlay-scroll], [data-overlay-panel]` w `global.css`; `lockScroll/unlockScroll` z Lenisem nietknięte; `tests/e2e/overlay-swipe.spec.ts` (CDP `Input.dispatchTouchEvent`, chromium-pixel-5): 5 testów — swipe z treści na górze zamyka, z treści przewiniętej przewija, w bok nie zamyka, uchwyt zamyka dotykiem, krótki ruch wraca; na starym `overlay.ts` pada test „z treści” — reszta to strażnicy regresji; pull-to-refresh = telefon) — swipe-down „Runda 4"**: port z hetman
`src/scripts/overlay.ts:201-261` (gest przez `touch*` non-passive,
`preventDefault` w pierwszej klatce ruchu w dół, `DRAG_SLOP_PX`, gest także
w treści sheeta przewiniętej na górę) + `overscroll-behavior: contain` na
`[data-overlay-scroll], [data-overlay-panel]`; nasza gałąź Lenisa w
`lockScroll/unlockScroll` zostaje. Testy: e2e przez CDP
`Input.dispatchTouchEvent` (nie `page.mouse`). Fizyczny Android:
pull-to-refresh nie odpala przy zamykaniu sheeta. Commit:
`fix(overlay): touch-based swipe-down and overscroll containment`.

### D — Dokumentacja i proces

**D1 · MUST · S · ✅ na main 2026-10-21 (PR #50) — `daily-workflow.md`**: `git add <ścieżki>` zamiast
`git add -A` (+ zdanie dlaczego: NFD/duplikaty z panelu, pliki
przypadkowe), zasada „decyzje ze skutkami (progi LHCI, baseline'y,
schemat) = osobne commity", krok `gh run list -L 6` w bramce startowej,
odsyłacz do `sesja-utrzymaniowa-szablon.md`. Commit: `docs(workflow): explicit git add and separate decision commits`.

**D2 · SHOULD · S · ✅ na main 2026-10-26 (P9, PR #61, merge `5f8116d`; 12 wierszy cyklicznych C1–C12 z kolumną „ostatnio", 9 odłożonych O1–O9, 5 zamkniętych, procedury w §4 pliku; dopisane: ratchet LCP/perf po F1 jako O4 z wartościami policzonymi wg formuły L1, domena/skrzynka OVH, przegląd katalogu flake'ów) — `optional-todos.md` w formie dwóch tabel**:
cykliczne (Worker auth + rotacja sekretów, przypięta wersja Sveltii, backup
R2 `rclone sync` co tydzień/miesiąc, `pnpm outdated` kwartalnie z regułą
„playwright parą", przegląd zużycia transformacji obrazów, sprzątanie
sierot R2, kontrola obrazu runnera przy bumpie Playwrighta, przegląd LHCI
po bloku zmian) i odłożone (co / do kiedy–warunek) + „Zamknięte"; usunięcie
przeterminowanych punktów. Dodatkowo: UptimeRobot (keyword) + Search
Console (brak wskazany w kronice §E). Commit: `docs(todos): recurring and deferred tables`.

**D3 · SHOULD · S · ✅ na main 2026-10-26 (P9, PR #61; 104 wpisy DEC-01…DEC-104 w 10 grupach A–J, każdy = jedna linia + odsyłacz plik/sekcja + status; zasiew z pamięci projektu, reguł `.claude/rules/`, analiz i decyzji P7/P8: L1 `minScore` = mediana − 0,05, `/en/` zostaje, wyjątek axe `.of-w`/`.acc`, T9, Saira bez `unicode-range`, visual = fixture / e2e = produkcja; dwie rozbieżności pamięć↔kod odnotowane w statusach: „tylko Image" → `file` też wgrywa, „Oferta kotwicą" → hub; DEC-29/30 mają uzasadnienie tylko w pamięci — kandydaci do `sections.md`) — `docs/decyzje.md`**: rejestr decyzji zapadłych
(numer · decyzja · gdzie uzasadnienie · status), zasiany z pamięci
projektu i analiz (stałe Lenisa rozdzielone; `data-lenis-prevent-horizontal`;
JSON-LD FAQ tylko na podstronie; entry-overlay zakazany; navbar `measure()`
nie optymalizować; `ScrollTrigger.refresh()` nie do rAF; Oferta w EN z PLN;
…). Bramka startowa sesji czyta go zamiast pamięci rozproszonej.
Commit: `docs: decision register`.

**D4 · SHOULD · S · ✅ na main 2026-10-26 (P9, PR #61; reguły §1 + tabele: otwarte/do potwierdzenia, rejestr testów bez usterek P5/P6/P8, zamknięte; zasiew po sprawdzeniu stanu: pkt 4 (`--wk-scale: 1.2`) i pkt 5 (starty reveal) są na main od PR #48 (2026-07-20) — wpisane jako „do potwierdzenia" (decyzja wyglądu, jedno słowo Mateusza), pkt 8 zamknięty testem F1 na telefonie 2026-10-24; **korekta opisu:** H1 NIE zasiany — wdrożony na main 2026-10-21 (PR #51), fragment „H1 do czasu wdrożenia" niżej jest nieaktualny) — `docs/poprawki-po-implementacji.md`**: jedno
miejsce na usterki i decyzje wyglądu z testów na urządzeniach (reguła „nie
naprawiamy przy okazji", klasyfikacja błąd / decyzja wyglądu / zmiana
zakresu, każdy naprawiony błąd dostaje test). Zasiać: strojenie pkt 4/5
i test fizyczny pkt 8 z `visual-corrections-part1.md`, H1 do czasu
wdrożenia. Commit: `docs: post-implementation corrections list`.

**D5 · COULD · S · ✅ na main 2026-10-26 (P9, PR #61; 69 pozycji P-01…P-69 w 8 grupach: pomiar geometrii/czasu, baseline'y, Playwright API, CI/workflowy, LHCI, Astro/Vite/Tailwind, CMS/R2, ekosystem Claude; każda = objaw → przyczyna → jak nie wpaść + odsyłacz; pozycje z rodziny bez naszego incydentu oznaczone `[rodzina]`; pułapki z P8 dopisane (Docker ≠ runner, identyczny diff ≠ brak timingu, `trace_engine`, `test.skip` bez `testInfo`, `spec`+`mode=all`, axe `incomplete` vs `passes`); worktree + symlink `node_modules` = DWIE obserwacje bez rozstrzygnięcia, P-51) — `docs/pulapki.md`**: skondensowany katalog pułapek
pomiarowych/środowiskowych z rodziny (przejście CSS fałszuje odczyt
geometrii; `opacity:0` łapie kliknięcia; na preview `/cdn-cgi/` nie
istnieje → pixel-diff nie widzi regresji obrazów R2; `strict_required_status_checks`
— zapis w panelu unieważnia „up to date" PR-a; Astro inlinuje małe CSS
przed bundlami → override `:root` przegrywa, potrzebny `html:root`;
komentarz frontmatteru z `<` psuje `astro check`; `*/` w komentarzu CSS
wywraca Tailwind 4; `git worktree` + symlink `node_modules` psuje Tailwind;
R2 EU wymaga endpointu `.eu.`; cron GH opóźniony ~6 h).

**D6 · COULD · S · ✅ 2026-10-26 (sesja 9, branch `docs/close-p9-readme-statuses`; 6 wierszy README + linia statusu w nagłówku każdego z 6 dokumentów; daty z `git log --merges`: #29 karuzela i #30 LUMÉA 2026-07-14, #42 o-mnie / #43 kontakt / #44 faq 2026-07-17, #46 hub 2026-07-19 — baseline'y weszły w tych samych PR-ach, więc „czekają na akceptację" było nieaktualne od merge'u) — `docs/README.md`: statusy dokumentów podstron
nieaktualne** (zauważone w P9, nie naprawiane „przy okazji"): wiersze
`analiza-podstrona-faq.md` i `analiza-podstrona-kontakt.md` mówią
„W TRAKCIE WDROŻENIA (2026-07-17)", `analiza-podstrona-o-mnie.md`
„WDROŻONE lokalnie", `analiza-podstrona-oferta-hub.md` „WDRAŻANE",
`analiza-realizacje-karuzela-mobile.md` i
`analiza-podmiana-ekranow-lumea-dla-kogo.md` „baseline'y czekają na
akceptację" — wszystkie te podstrony/sekcje są na produkcji od lipca
2026. Zrobić: per plik sprawdzić merge (`git log --merges -- <plik>`),
wpisać „WDROŻONE NA PRODUKCJI (PR #nn, data)", ewentualnie nagłówkowy
status w samym dokumencie. Commit: `docs(readme): refresh subpage document statuses`.

### Odrzucone z raportów (nie wchodzą do backlogu)

Preact (brak zastosowania); wycięcie Lenisa/GSAP (§4.1); log etapów
w `CLAUDE.md`; Cloudflare Stream i `cdn-cgi/media` jako poster
(`analiza-realizacje-wideo.md` §3.1); `site-config.ts` (nasze przełączniki
żyją w `*-config.ts` per sekcja — wystarcza); `MotionGate`/`html.js-motion`
dla istniejących sekcji (ruszyłoby baseline'y bez zysku; dla NOWYCH sekcji
wzorzec dopuszczalny); ujednolicenie progów 760/768/861 (T4 tylko
strażnik); `scrollbar-gutter` (już jest); CTA-placeholdery (już
zmigrowane).

## 7. Kolejność wdrażania (paczki = PR-y)

| Paczka | Punkty | Dlaczego razem | Baseline'y |
| --- | --- | --- | --- |
| P0 | ta analiza + `analiza-realizacje-wideo.md` + szablon sesji + README | docs | — |
| P1 „CI i panel" | C1, C2, C3, M1, D1 | zero zmian w UI, zamyka 2 flaki i 2 ryzyka incydentów | brak |
| P2 „Hero Safari" | H1, H2, T5 | jeden obszar, jedna weryfikacja na fizycznym Macu/iPhonie | hero (klatki z napisem) + nowy profil webkit |
| P3 „Fundament treści" | T2, T1, R2, M2 | warunek dla wideo i podmiany treści | brak (fixture = kopia dzisiejszych wpisów) |
| P4 „Wideo — mechanizm" | R1 Etapy 1–4 | wg planu wideo | brak (bez wpisu z wideo) |
| P5 „Wideo — treść" | R1 Etapy 5–7, R3 | panel + nagrania | ✅ PR #54 (2026-10-22): zregenerowane 26 darwin + 25 linux, WYŁĄCZNIE `work-*` (section-work, work-modal, work-sheet, work-index-*) |
| P6 „Chrome i SEO" | S1, S3, S2 | małe, niezależne | ✅ PR #55 (2026-10-22), baseline'y nietknięte |
| P7 „Pomiary" | C4 → L1 (osobny PR), T3, T6 | po P1–P6 na main — nowe mediany | PR A #56 ✅ na main 2026-10-24 (C4/T3/T6 + 1 baseline z T3: work-index-grid webkit-iphone-se, oba komplety); PR B #57 (L1) ✅ na main 2026-10-24 — **P7 ✅ W CAŁOŚCI** (PR #56 + #57) |
| P8 „Jakość" | A2 (pierwszy — usuwa losowe czerwone `e2e`), A1, T4, U1, F1 | każdy z własnym pomiarem | ✅ na main 2026-10-24 (PR #59, merge `cc3a05a`; CI + Prod smoke zielone, telefon OK): A2/T4/U1/F1 ✅, A1 zamknięte jako przeformułowane (wyjątek axe zostaje); baseline'y WYŁĄCZNIE contact-index-form (6 darwin + 6 linux), services nietknięte; progi LHCI nietknięte → po merge'u mini-PR `font:size` |
| P9 „Docs utrzymaniowe" | D2, D3, D4, D5 | docs | ✅ na main 2026-10-26 (PR #61, merge `5f8116d`; CI + Prod smoke zielone — paczka bez bajtów strony); D6 z obserwacji → sesja 9 |
| P10 „Testy z rodziny" | T7, T8 (+ retry instalacji Playwrighta, DEC-105) | same testy/docs, zero bajtów strony; retry jedzie w tym samym PR-ze = jedna loteria instalacji | ✅ na main 2026-10-27 (PR #64, merge `c178204`; CI 40536992288 + Prod smoke 40536992331 zielone za 1. razem, `test:dist` w `quality` 1 s, install-deps próba 1 = 33 s / próba 2 pominięta), baseline'y nietknięte |
| później | H3, H4, R4, R5, S4, S5, M3, L2, T10 | COULD | — (D6 ✅ sesja 9; ratchet LCP/perf po F1 = O4 ✅ #63; T11 ✅ #67; F2 ✅ `docs/close-t11`) |

Zasady: paczka = branch `typ/krotki-opis` → PR → 3 zielone checki →
merge; baseline'y regenerowane raz na paczkę, po pokazaniu diffów
(kolejność linux-workflow → darwin z `daily-workflow.md`); L1 zawsze jako
osobny PR po pomiarze na main.

## 8. Workflow kontynuacji (tryb utrzymaniowy)

1. **Jedna sesja = jedna paczka (lub jeden punkt)**, start od
   `docs/sesja-utrzymaniowa-szablon.md` wypełnionego numerami punktów.
   Pierwsze zadanie sesji: domknąć status poprzedniej (✅ + data + PR w §6,
   `docs/README.md`, ewentualnie `decyzje.md`).
2. **Bramka startowa**: `git checkout main && git pull`, oczekiwany SHA,
   czysty `git status`, `gh run list -L 6` — czerwone na main = najpierw
   diagnoza osobnym małym PR-em (nigdy „przy okazji").
3. **Definition of Done paczki**: `/test` zielone lokalnie na właściwych
   warstwach; e2e + unit zielone w CI; baseline'y (jeśli ruszone) w obu
   kompletach w tym samym PR; LHCI nietknięte albo osobny PR; wpis w §6
   i `docs/README.md`; reguła w `.claude/rules/*` jeśli powstała nowa
   wiedza; lista „na telefon" przekazana Mateuszowi, gdy emulacja nie
   wystarcza (Low Power Mode, limit GPU, toolbar Safari, zimny cache).
4. **Usterki z testów na urządzeniach** trafiają do
   `docs/poprawki-po-implementacji.md` (D4) — nie są naprawiane w trakcie
   innej paczki; każdy naprawiony błąd dostaje test, który by go wykrył.
5. **Pomiary → decyzje → osobne commity**: progi LHCI (C4 → L1),
   baseline'y, schemat CMS — nigdy doklejane do feature'a.
6. **Panel Sveltia pisze na main** — po każdej edycji treści: `git pull`,
   `pnpm test:unit`; otwarte PR-y tracą „up to date" (rebase).
7. **Co miesiąc** (D2): tabela cykliczna — Worker auth/sekrety, backup R2,
   `pnpm outdated`, sieroty R2, przegląd flake'ów w katalogu pamięci.
8. **Reguła Lenisa** (§4.1) i **reguła WebKit `paint-order`** (H2) wchodzą
   do `.claude/rules/` przy pierwszej paczce, która ich dotyka.

## 9. Rozważone i ODRZUCONE (żeby nie wracały)

- Uproszczenie hadrianm-web do natywnego scrolla jak delung/eha/hetman —
  tożsamość wizytówki; wraca tylko z pomiarem konkretnej szkody.
- Przeniesienie całego procesu greenfield (instrukcja wykonawcza Etapy
  0–9, baza wiedzy klienta) — hadrianm-web jest w utrzymaniu, zostaje
  lżejszy wariant z §8.
- Log stanu w `CLAUDE.md` (116–176 KB w nowszych repo) — koszt kontekstu
  każdej sesji; fakty do §6/§10 i pamięci.
- Generyczne nakładki zastąpione inline-sheetami (hetman) — nasze
  `Modal`/`BottomSheet` są reużywane w 3 miejscach.
- Cloudflare Stream — patrz plan wideo.

## 10. Log sesji (append-only)

- **2026-10-20** — analiza + backlog + plan wideo + szablon sesji
  (branch `docs/evolution-analysis-and-video-plan`, P0). Zweryfikowane
  lokalnie: soft-404 (prod 200), `prod-smoke` `head -1`, brak
  `workflow_dispatch`, `ubuntu-latest` ×5, Sveltia 0.170.0, LCP 3565 =
  ×1,15, allowlista axe 2 wpisy, fonty `index.css`, `config.yml` bez 3
  linii, `git add -A` w ściądze, `readdirSync` ×4, reprodukcja H1
  (WebKit vs Chromium). Nie ruszono żadnego pliku w `src/`.
- **2026-10-21** — P1 (PR #50) i P2 (PR #51) na main; prod-smoke z nowym
  strażnikiem zielony (2 m 40 s). P2: Safari na Macu potwierdzony wizualnie,
  baseline'y `webkit-1440` darwin+linux. Incydent przy merge'u P2: po
  `gh pr update-branch` czerwony `e2e` — axe `link-in-text-block` na
  `/en/contact/` (pixel-5), ten sam SHA zielony po rerunie; usterka realna
  i stara → nowy punkt **A2** (§5 pkt 15), nie allowlista. P3 wdrożone
  lokalnie (branch `feat/p3-content-foundation`): T2 (`tests/helpers/
  realizacje.ts`, 4 pliki bez gołego `readdirSync`, skipy e2e), T1
  (`REALIZACJE_DIR`, `tests/fixtures/realizacje` = kopia aura/dab/sielski,
  `build:visual`, `assertVisualFixture`/`useVisualFixtureGuard` w
  `sections.spec.ts` i `work-index.spec.ts`, drugi build w `ci.yml` i
  `update-visual-baselines.yml`, kontrakt `visual-fixture.test.ts`), R2
  (Zod `.default([])`/`.optional()`, `required: false` w panelu, WorkDetail
  bez pustych bloków, siatka 1–2 wyników przez `data-count`), M2 (0.178.0,
  sonda binarium = delung). Sveltia najnowsza to dziś 0.250.1 — świadomie
  wzięta wersja sprawdzona produkcyjnie w delung/eha; dalsze podbicie =
  osobny punkt po potrzebie (M3).
- **2026-10-21 (sesja 2)** — P3 na main (PR #52; panel potwierdzony:
  pola opcjonalne bez gwiazdek — w Sveltii gwiazdka = pole wymagane).
  P4 wdrożone lokalnie (branch `feat/work-video`, Etapy 1–4 planu wideo):
  spike `capture:site` na delung.pl w dwóch trybach (oba ≤ 800 KB, 11 s,
  720×450 / 432×886); korekta D9: zamiast CDP virtual time → `page.clock`
  + krokowanie WAAPI (`captureScreenshot` wisi przy zatrzymanym czasie
  wirtualnym); nowa decyzja: wypieczony crossfade końcówki w klatkę 0
  (slider hero delung robił szew). Schemat/panel/typy (`screens[].video`),
  `WorkDeviceDuo` warstwa `<video>` + `work-video.ts` + `open-detail.ts`,
  testy warunkowe (dziś: „bez wpisu z wideo nakładka nie ma <video>"),
  maski w visual. Prod smoke po #51 czerwony = deploy Cloudflare > 10 min
  (hashe deterministyczne, 46/46) — katalog flake'ów.
- **2026-10-21 (sesja 3)** — P4 na main (PR #53). Mateusz obejrzał spike
  i zaakceptował tryb `clock` + domyślne D7 (zapis w planie wideo, Etap 1).
  P5 Etap 5 (branch `feat/work-video-content`): sonda na żywo (bez
  nakładek, bez Lenisa na żadnej z trzech stron), 6 MP4 ≤ 800 KB + 6
  posterów + zrzuty dodatkowych ekranów (`--screens`) w
  `~/hadrianm-site-videos/`. Dwa błędy skryptu znalezione na
  kontakt-arkuszach: (1) krokowanie animacji CSS NIE wykonywało się —
  `page.evaluate(STRING, arg)` ewaluuje string jako wyrażenie i nie
  wywołuje funkcji; slider hero delung leciał ~13× za szybko, także
  w zaakceptowanym spike'u (D9 korekta 2); (2) `<video>` hero Hetmana
  biegło w czasie rzeczywistym — teraz pauza + `currentTime` per klatka.
  Po obejrzeniu przez Mateusza dwie kolejne poprawki: start nowej animacji
  od poprzedniego kroku (przejścia CSS ze scrolla w „Co tworzymy?" delung
  zacinały się) i shim Range dla `<video>` (podgląd Hetmana nie obsługuje
  Range → `seekable` [0,0], film stał na klatce 0); film rusza od klatki
  0 pętli, `ended` → zdjęcie jak na żywo. Korekta D4: Sveltia ma jeden prefix uploadu, MP4 lądują płasko
  w `realizacje/`. Mateusz zaakceptował nagrania. Etap 6 tego samego
  dnia: 3 wpisy w panelu (nowe pliki, `order` 10/20/30, nie edycja
  placeholderów w miejscu — nazwa pliku = pole slug), placeholdery
  usunięte, 18 sierot z R2 skasowanych (HEAD 404), katalog treści nigdy
  nie był pusty (Sveltia commitowała naprzemiennie). Na branchu: merge
  main, fixture → kopie 3 nowych wpisów, e2e 646 passed (testy wideo
  nakładki po raz pierwszy aktywne), `test:visual` 26 rozjazdów wyłącznie
  `work-*` (treść + maska wideo + wyższe karty mobile → stopka
  `/realizacje/` o 1 px) → baseline'y darwin+linux w P5. Nowy punkt R5
  (`liveUrl` Hetmana po domenie). Etap 7 (telefony) po merge'u.
- **2026-10-22 (sesja 4)** — P5 na main (PR #54, prod-smoke zielony).
  Baseline'y P5 faktycznie zregenerowane: 26 darwin + 25 linux, wyłącznie
  `work-*`. Gotcha z `.claude/rules/testing.md` potwierdzona w praktyce: po
  `pnpm test:visual:update` ZAWSZE `git status` i cofnięcie plików spoza
  zaakceptowanego zestawu — `--update-snapshots` nadpisuje także klatki
  różniące się W GRANICACH progu (flaky hero desktop 05–09), które
  w `test:visual` przechodzą. Etap 7 planu wideo wykonany przez Mateusza
  na produkcji (iPhone Safari + Low Power Mode, Android Chrome, desktop
  Safari/Chrome/Firefox): zero usterek → R1 ✅, plan wideo zamknięty
  (status „WDROŻONY", decyzje nadal obowiązują), `poprawki-po-implementacji.md`
  nie utworzony (brak usterek). P5 zmieniła bajty strony głównej (treść
  `#work`: 3 nowe wpisy, posterzy) — pomiar median LHCI pod L1 odkłada się
  do P7, bo `lhci-measure.yml` (C4) jeszcze nie istnieje. Start P6 „Chrome
  i SEO" (branch `feat/chrome-seo`): S1 → S3 → S2.
  Wynik sesji: S1 ✅ (404 + testy + reguła `.claude/rules/layout-seo.md`),
  S3 ✅ (`test:visual` bez zmian baseline'ów; jedyny FAIL = `webkit-1440`
  klatki 05–09 ratio 0.01–0.02 WYŁĄCZNIE na ekranie telefonu = znana loteria
  klatki wideo, kontrolny rerun tego samego buildu zielony; uwaga: profil
  `webkit-1440` z T5 NIE ma podwyższonego progu `FLAKY_DESKTOP_FRAMES`
  z `hero.spec.ts` — ma go tylko `chromium-1920`; kandydat do osobnego
  punktu T, nie naprawiany „przy okazji" — zapisany jako **T9**), S2 ◐ kod
  + kontrakt `og-image.test.ts` gotowe, czeka na obraz 1200×630.
- **2026-10-22 (sesja 5)** — P6 na main: merge PR #55 (`d0ce27f`),
  prod-smoke zielony (nowy test statusu 404 przeszedł na produkcji za
  pierwszym razem), produkcja zweryfikowana curl-em: `/nie-ma-takiej-strony/`
  i `/en/xyz/` → 404 + `noindex`, og 1200×630 + `summary_large_image`.
  Test Mateusza na telefonie (404 PL/EN + burger, Safari w poziomie bez
  powiększenia tekstu, pasek `theme-color`, karta og w
  LinkedIn/Facebook/iMessage): bez usterek na pierwszy rzut oka —
  `poprawki-po-implementacji.md` nie utworzony. **CI na main `d0ce27f`
  czerwony 2× na jobie `lighthouse`** — diagnoza: NIE regresja P6, tylko
  próg LCP leżący na medianie runnerów (przypadek z opisu L1). Liczby
  (mediany LHCI z raportów „Open the report at …" w logach jobów; raport
  HTML ma pełny LHR w `window.__LIGHTHOUSE_JSON__`):

  | bieg                                                | LCP `/`     | LCP `/en/` | perf `/` |
  | --------------------------------------------------- | ----------- | ---------- | -------- |
  | main `0d77bb8` (PRZED P6, run 39746136299)          | 3555        | 3108       | 0,89     |
  | PR #55 `2bce655` (drzewo = merge, run 39754712158)  | 3218        | 3485       | 0,92     |
  | main `d0ce27f` próba 1 / 2 (run 39758987429)        | 3578 / 3576 | – / 3113   | 0,89     |
  | próg (`lighthouserc.cjs`)                           | 3565        | 3565       | 0,90     |

  Element LCP = `h1.hero__headline` (czas fontu), `script` identyczny
  (90 065 B), dokument i total MNIEJSZE po P6, `benchmarkIndex` runnerów
  2410–4260 (loteria maszyn). Wniosek: lipcowy próg 3100 × 1,15 = 3565
  leży dziś NA medianie runnerów (main przed P6 mierzył 10 ms pod progiem);
  perf score też pływa po obu stronach 0,90. Pomiar median po P5 (bajty
  `#work`) i P6 odkładany był do P7, bo `lhci-measure.yml` (C4) nie
  istniał — powstaje w tej paczce. Start P7 „Pomiary" (branch
  `ci/lhci-measure`): C4, T3, T6 (PR A), potem L1 (PR B, osobny, po
  pomiarze na main). Wynik sesji: C4 ✅ (build przez `pnpm build`, nie
  `build:visual` — bramka w ci.yml mierzy treść produkcyjną), T3 ✅
  (114 passed, 1 diff work-index-grid webkit-iphone-se = deterministyczny
  stan obrazów karty Delung zamiast wyścigu lazy-load, szczegóły przy T3
  w §6), T6 ✅ (inputy `spec`/`mode` + akapit „zielony ≠ aktualny"
  i sekcja LHCI w `.claude/rules/testing.md`); nowy punkt T9 (próg
  FLAKY_DESKTOP_FRAMES dla webkit-1440, COULD). Progi LHCI w PR A
  nietknięte. Diff T3 zaakceptowany: darwin zregenerowany zawężonym
  przebiegiem (jedyny przepisany plik = zaakceptowany; spec 18/18
  passed), linux przez workflow z inputami T6 po pushu, commit darwin
  na końcu. Decyzje pod PR B (L1): perf `minScore` z pomiaru
  (mediana − 0,05 w dół do 0,05), lista URL-i bez zmian (`/en/` zostaje) —
  zapisane przy L1 w §6.
- **2026-10-24 (sesja 6)** — PR A **#56 zmergowany** (main `fe4914f`):
  linux baseline przez workflow z inputami T6 (pierwsze użycie: zawężony
  `spec` przepisał dokładnie 1 plik), commit darwin na końcu. Na PR
  `lighthouse` czerwony 1× — tym razem **perf 0,89 vs minScore 0,9**
  (LCP 3544 pod progiem; bajty co do bajta = main: script 90 065 B,
  benchmarkIndex 4551) → rerun zielony; kolejne potwierdzenie progu na
  medianie, tym razem drugiego. CI + Prod smoke na main po merge'u
  zielone za pierwszym razem. **Pierwszy pomiar `lhci-measure.yml`: run
  40079996952** (mediany z 5, gorszy URL): mobile perf 0,89 / LCP 3551 /
  fonty 4 × 103 268 B; desktop perf 0,91 (/en/) / LCP 1910 (/en/!) /
  fonty 7 × 153 419 B; font:size deterministyczny 5/5. Desktop LCP
  /en/ 1910 vs stary próg 2000 = 90 ms zapasu — ta sama pułapka co
  mobile, naprawiona tym samym ruchem. PR B `chore/lhci-budgets`
  wdrożony lokalnie: progi wg L1 + decyzje (tabela wartości przy L1
  w §6), komentarz „dlaczego ten próg" z datą i numerem runu przy
  każdej asercji. Po merge'u PR B czerwony `lighthouse` z `d0ce27f`
  zamknięty definitywnie. Następna paczka: P8 „Jakość" (A2 pierwszy).
  **Domknięcie (2026-10-24):** PR B **#57 zmergowany** (main `d9750ce`);
  checki na PR przeszły za pierwszym razem (bez rerunów — nowe progi mają
  zapas); kontrolne CI na main (run 40083791571): quality/e2e/lighthouse
  zielone + Prod smoke zielony → czerwony `lighthouse` z `d0ce27f`
  zamknięty definitywnie. Job `lighthouse` z `numberOfRuns: 5` trwa
  ~5 min (było ~3). Między paczkami mini-PR **#58** `chore/claude-settings`
  (reguła: zmiany ekosystemu Claude osobnym PR-em między paczkami):
  usunięte 4 martwe reguły `Write(...)` (uprawnienia plikowe matchują tylko
  `Edit`/`Read`; `Edit` pokrywa Write/NotebookEdit), duplikaty
  `Bash(git commit)`/`Bash(git push)`, gotcha `Bash(pnpm test:*)` → jawna
  lista (`:*` = skrót na ` *`, więc stare NIE łapało `test:unit`/
  `test:e2e`/`test:visual`); `test:visual:update` celowo poza allowlistą.
  Ostrzeżenia o regułach na starcie sesji znikły (potwierdził Mateusz).
- **2026-10-24 (sesja 7)** — bramka: main `dff73e4` (merge #58), CI +
  Prod smoke po #58 zielone. Start P8 „Jakość" (branch `fix/p8-quality`,
  kolejność A2 → A1 → T4 → U1 → F1, szczegóły i liczby przy punktach w §6).
  **A2** ✅: axe `link-in-text-block` dla linku w nocie RODO było
  `incomplete` (źródło losowych zgłoszeń), po podkreśleniu `passes`; diff
  `contact-index-form` pod progiem 0,0005 — zaakceptowany przez Mateusza,
  darwin zregenerowany filtrem `spec:linia` (6 plików). **A1** — pomiar
  obalił założenie (akcent w stanie końcowym AA, 4,60–5,07:1; axe łapie
  stan startowy animacji przy kryciu 0,14/0,24); decyzja Mateusza: wyjątek
  zostaje, A1 zamknięte jako przeformułowane, allowlista NIE pusta
  (świadomie niespełniony punkt DoD). **T4** ✅ (mutacja 1 px → FAIL).
  **U1** ✅ (CDP touch; stary kod oblewa test gestu z treści). **F1** ✅
  (59 728 → 13 588 B subsetów; pobrane fonty `/` mobile 66 780 B, desktop
  105 144 B). Weryfikacja lokalna: unit 13 plików zielone, `test:visual`
  115/115 (F1 bez zmian w pikselach), `test:e2e` 4 pełne przebiegi po
  681 passed + 1 fail każdy — `work.spec.ts:123` (wideo w nakładce nie
  rusza, `currentTime` 0) 2/4 i axe `.pp-sub` `/oferta/`|`/en/services/`
  pixel-5 2/4; **kontrola na main `dff73e4`** (worktree, osobny preview):
  2 przebiegi, te same dwa flaki po 1/2 → zastane, lokalne pod pełnym
  obciążeniem (CI na main zielone), nie regresja P8; w izolacji wideo 5/5.
  Progi LHCI nietknięte; po merge'u mini-PR `font:size`. Ekosystem:
  reguły w `testing.md` (axe incomplete vs passes, CDP touch, `test.skip`
  bez `testInfo`, filtr `plik:linia` + `mode=all`) i `layout-seo.md`
  (fonty F1, pułapka lockfile'a `@paulirish/trace_engine`).
  **PR #59 — checki:** `quality` i `lighthouse` zielone za pierwszym razem
  (progi nietknięte); `e2e` czerwony 3/3 na tym samym SHA — sweep hero
  `webkit-1440` klatki 05–09 (diff wyłącznie na ekranie telefonu: treść
  przesunięta o kilka px, napisy z polskimi znakami bez różnic), reszta
  zielona (e2e 682/682, visual 114). Kontrolne CI na main
  (`workflow_dispatch`, run 40101301327) ZIELONE → regresja P8, nie T9.
  Diagnoza (dwie hipotezy obalone po kolei — zapis uczciwy):
  (1) `unicode-range` Sairy `latin-ext` opóźniał pobranie subsetu za
  jednorazowy pomiar `phone-site.ts` → cofnięty (`b17193b`), diff
  IDENTYCZNY co do piksela → obalone; (2) tablice/metryki subsetów
  (hinting, hhea) — identyczne z oryginałami; znaki łączące/wietnamskie
  w treści — brak. Bisekcja w Dockerze (Playwright 1.61.1, arm64 i amd64)
  nie odtwarza runnera: tam klatki telefonu odbiegają od baseline'u CI
  także na main, a main i branch dają identyczne zrzuty; porównanie
  kadrów (baseline CI / branch CI / main Docker) pokazało PŁYNNE
  przesunięcie treści telefonu zależne od środowiska → klasa timingu
  ekranu telefonu (jak flaki 05–09 chromium-1920), którą zmiana ładowania
  fontów F1 przesunęła na runnerze ponad domyślny próg. Decyzja Mateusza:
  **T9** (próg 0,02 klatek 05–09 także dla `webkit-1440`), baseline'y
  bez zmian. Hipoteza o `phone-site.ts` → H4 jako COULD do pomiaru.
  Lekcja: identyczny co do piksela diff w N przebiegach ≠ dowód braku
  timingu — runner CI bywa deterministyczny, a stan i tak zależy od
  środowiska; przed szukaniem „winnego pliku" porównaj kadry między
  środowiskami (płynne przesunięcie = timing, skok/zawinięcie = metryka).
  **Domknięcie:** checki PR #59 zielone po T9 (`e2e` 682 + 115), merge
  `cc3a05a`; CI na main (run 40121771030) i Prod smoke (40121770985)
  zielone za pierwszym razem, subsety na produkcji. Test Mateusza na
  telefonie (U1: swipe-down sheeta bez pull-to-refresh na Androidzie,
  sheet przewinięty przewija treść; F1: fonty bez regresji FOUT) — bez
  usterek, `poprawki-po-implementacji.md` nie utworzony. Następnie:
  pomiar `lhci-measure.yml` na `cc3a05a` (run 40124168778) → mini-PR
  `chore/lhci-font-budgets`. Wynik pomiaru (mediany z 5, gorszy URL `/`):
  `font:size` mobile 67 998 B / desktop 107 275 B (−34% / −30% vs L1),
  co do bajta 5/5; LCP mobile 3378 ms (L1: 3551), desktop 1877 ms
  (L1: 1910 /en/), perf 0,90 (m) / 0,92 (d). W mini-PR WYŁĄCZNIE progi
  `font:size` (74 800 / 118 100); ratchet LCP/perf = osobna decyzja.
  **Domknięcie mini-PR:** #60 zmergowany (`68fe906`), checki na PR za
  pierwszym razem, CI (run 40129958257) i Prod smoke (40129958334) na
  main zielone. P8 zamknięta w całości.
- **2026-10-25 (sesja 8)** — bramka: main `68fe906` (merge #60), status
  czysty, 6 ostatnich biegów zielone (CI + Prod smoke po #60 i #59, LHCI
  measure 40124168778). P9 „Docs utrzymaniowe" (branch
  `docs/p9-maintenance`), paczka czysto dokumentacyjna — zero zmian
  w `src/`, `tests/`, `lighthouserc*`, workflowach, `package.json`.
  **D2** ✅ `optional-todos.md` przepisany na dwie tabele (12 cyklicznych
  z kolumną „ostatnio", 9 odłożonych, 5 zamkniętych, procedury §4);
  dopisane: ratchet LCP/perf po F1 jako odłożone O4 z progami policzonymi
  wg L1 (LCP 4678 / 3177, perf 0,85 / 0,85 — zysk mały, decyzja Mateusza),
  domena OVH, katalog flake'ów, Search Console, UptimeRobot keyword;
  przeterminowane punkty (robots.txt, `pages.dev`, sieroty z refactoru,
  Stream) do „Zamknięte". **D3** ✅ `decyzje.md`: 104 wpisy DEC-01…104
  w 10 grupach, każdy jedna linia + odsyłacz + status; zasiew z pamięci,
  reguł, analiz i P7/P8; dwie rozbieżności pamięć↔kod odnotowane (upload
  `file` do R2; navbar bez kotwic). **D4** ✅ `poprawki-po-implementacji.md`:
  reguły + tabele; stan pkt 4/5/8 `visual-corrections-part1.md`
  SPRAWDZONY przed zasiewem — wszystkie trzy na main od PR #48
  (2026-07-20, `--wk-scale: 1.2`, baseline'y `76764c6`); pkt 4/5 jako
  „do potwierdzenia" (decyzja wyglądu), pkt 8 zamknięty testem F1 na
  telefonie; H1 nie zasiany (korekta opisu D4). Testy telefoniczne
  P5/P6/P8 zapisane w rejestrze „bez usterek". **D5** ✅ `pulapki.md`:
  69 pozycji w 8 grupach, z P8 i z reguł; worktree = dwie obserwacje bez
  rozstrzygnięcia. Poza zakresem (nie naprawiane): nieaktualne statusy
  dokumentów podstron w `docs/README.md` → nowy punkt **D6** (COULD).
  Szablon sesji: bramka startowa czyta teraz `decyzje.md`,
  `poprawki-po-implementacji.md`, `pulapki.md`. `docs/README.md`: trzy
  nowe wiersze + odświeżone `optional-todos.md` i
  `visual-corrections-part1.md`. Weryfikacja: `format:check` + `lint`
  (docs ignorowane — kontrola, że diff dotyka tylko `docs/`).
- **2026-10-26 (sesja 9)** — bramka: main `5f8116d` (merge #61, P9),
  status czysty, Prod smoke po #61 zielony (run 40295885175), CI
  w trakcie przy starcie — sprawdzony przed oddaniem (zob. niżej). Zlecenie
  Mateusza: „zrób wszystko zgodnie z rekomendacjami i dalej" → kolejność:
  domknięcie P9, D6, zamknięcie PI-01/02, ratchet O4 osobnym PR-em.
  **Domknięcie P9:** D2–D5 i wiersz §7 „✅ na main (PR #61)", indeks.
  **D6** ✅ (branch `docs/close-p9-readme-statuses`): 6 wierszy
  `docs/README.md` + linia statusu w nagłówkach `analiza-podstrona-faq.md`
  (#44), `-kontakt.md` (#43), `-o-mnie.md` (#42), `-oferta-hub.md` (#46),
  `analiza-realizacje-karuzela-mobile.md` (#29),
  `analiza-podmiana-ekranow-lumea-dla-kogo.md` (#30) — daty z `git log
  --merges`; baseline'y w każdym z tych PR-ów, więc „czekają na akceptację"
  nieaktualne od lipca. **PI-01/PI-02** zamknięte jako „zostaje" — Mateusz
  przyjął rekomendację z D4 (treść karuzeli i intro Oferty oglądane na
  telefonach P5–P8 bez uwag); DEC-48 dostaje potwierdzenie; cofnięcie =
  nowy wiersz, nie edycja. Zero zmian poza `docs/`. **Ratchet O4** (LCP/perf
  po F1) przygotowany w TEJ sesji jako OSOBNY PR `chore/lhci-ratchet-after-f1`
  o rozłącznym zestawie plików (`lighthouserc*.cjs`, `optional-todos.md`):
  wg L1 z runu 40124168778 LCP mobile 4851 → 4678, desktop 3210 → 3177,
  perf mobile 0,80 → 0,85 (desktop 0,85 bez zmian); statusy L1/O4 w §6
  domyka następna sesja po merge'u. Kontrola przed zacieśnieniem: job
  `lighthouse` na main po #61 (run 40295885239) — mediany mobile `/` 0,92 /
  LCP 3197, `/en/` 0,94 / 2906; desktop `/` 0,92 / 1849, `/en/` 0,91 / 1897
  — wszystko pod nowymi progami. **CI na main po #61:** `quality`
  i `lighthouse` zielone, `e2e` czerwony na kroku `playwright install
  --with-deps` — timeout 10 min (backstop) na pobieraniu paczek apt
  z `azure.archive.ubuntu.com` (fonts-wqy-zenhei 7 MB szło 3 min); paczka
  docs-only, więc flake infrastruktury (katalog flake'ów), rerun failed
  jobs zlecony na tym samym SHA (`gh run rerun --failed`) — rerun zielony.
  **Po oddaniu (ta sama sesja):** Mateusz zacommitował i otworzył #62 (docs)
  i #63 (ratchet); **#63 zmergowany** 2026-10-26 (`d7010ba`), checki za
  pierwszym razem — nowe progi LHCI przeszły na runnerze (L1 ✅ ratchet).
  #62 po `Merge branch 'main'` dostał DRUGI dziś timeout `playwright
  install` (run 40305229025, ~40 KB/s z apt) → rerun zielony; TRZECI: CI
  na main po #63 (run 40305176483, ten sam krok; main po #62 — run
  40319111350 — do sprawdzenia w bramce następnej sesji). Trzy razy jednego
  dnia = mały osobny PR `ci/playwright-install-retry`: `playwright install-deps`
  osobnym krokiem z drugą próbą (`continue-on-error` + `if: outcome ==
  failure`, limit 6 min per próba — apt wznawia z `partial/`), binaria
  osobno z cache (8 min), job `e2e` 25 → 40 min; to samo w `prod-smoke.yml`
  i `update-visual-baselines.yml`; P-40 w `pulapki.md` rozszerzone; DEC-105.
  Statusy L1/README/DEC-105 jadą w TYM SAMYM PR-ze co retry (#62 już na
  main, jeden PR = jedna loteria instalacji zamiast dwóch). Następna paczka — propozycja: **T7 + T8** (warstwa
  `test:dist` + reguły testów z rodziny; same testy/docs, zero bajtów
  strony) albo **R5**, gdy DNS Hetmana przełączony.
- **2026-10-26 (sesja 10)** — bramka: origin/main `256d751` (merge #62),
  NIE #64 — PR `ci/playwright-install-retry` nigdy nie powstał: jego zmiany
  (3 workflowy + docs: L1 ratchet ✅, DEC-105, P-40, końcówka wpisu
  sesji 9) leżały NIEZACOMMITOWANE w working tree na zmergowanej gałęzi
  `docs/close-p9-readme-statuses`. Zachowane bez zmian i przeniesione na
  nowy branch `test/dist-layer-and-family-rules` (checkout z origin/main
  przenosi lokalne modyfikacje; pliki te nie zmieniły się między `51e43f4`
  a `256d751`) → retry jedzie w TYM PR-ze (P10) jako osobny commit `ci`
  (poza `ci.yml` zestaw plików rozłączny z T7/T8: T7 dodaje krok w
  `quality`, retry zmienia `e2e`). CI na main: po #62 run 40319111350
  zielony za pierwszym razem (`playwright install --with-deps` 44 s — bez
  retry, więc pierwszy pomiar skuteczności retry = pierwszy bieg po
  merge'u P10, krok „Zależności systemowe Playwrighta (próba 1/2)" w
  `gh run view <id> --json jobs`); po #63 run 40305176483 `e2e` czerwony
  na tym samym kroku (timeout 10 min), nie rerunowany — nadpisany
  zielonym biegiem po #62, main zielony. Prod smoke po #62 zielony
  (run 40319111343). `poprawki-po-implementacji.md`: brak nowych usterek
  z urządzeń.
  **T7 ✅**: `vitest.dist.config.ts` (osobny config; `test:unit` 12 plików,
  bez `tests/dist`), `tests/dist/dist.test.ts` — 6 asercji (hosty/porty
  dev, pełny e-mail, robots, sitemap-index, adresy sitemapy = strony).
  Pytanie o `mailto:` w polityce prywatności rozstrzygnął kod:
  `PolicyPage.astro` składa adres z fragmentów skryptem inline
  (`[data-pp-mail]`), stopka nie ma `mailto:` → w HTML nie ma żadnego
  adresu, test BEZ wyjątków (szablon `mailto:${a}` w skrypcie nie jest
  adresem i nie łapie się). Bundle JS/CSS pokrywa `contact.spec.ts`
  („antyscraping…", konkretne ciągi) — nie dublowane. Wyniki: `pnpm build
  && pnpm test:dist` 6/6 (173 ms; 22 HTML, sitemapa 20 adresów = 22 − 404
  − admin); `pnpm build:visual && pnpm test:dist` 6/6; negatywny test:
  `dist/__wyciek__/index.html` z `http://localhost:4321`,
  `127.0.0.1:4399` i `jan.kowalski@example.com` → 3 czerwone: 4 trafienia
  hostów/portów i 2 e-maile w formacie `plik:linia → „trafienie" w:
  …kontekst…` oraz „strona BEZ wpisu w sitemapie: /__wyciek__/"; po
  usunięciu pliku 6/6. `ci.yml` `quality`: `pnpm test:dist` po `pnpm
  build`, przed uploadem artefaktu; `pnpm test` = unit → dist → e2e →
  visual; `/release-check` l. 36 → `pnpm test:dist`. Bramka: format:check,
  lint, typecheck zielone.
  **T8 ✅**: sekcja „Pomiar w testach" w `testing.md` + wiersz tabeli
  dist/SEO; DEC-106–110, DEC-88 → zastąpiona. Sprzeczności z kodem:
  `offsetHeight` w `scroll.ts`/`visual.ts`/`about.spec.ts` liczy POZYCJE
  scrolla, nie asercje — reguła to precyzuje, nic nie przepisane; progi
  hero 0,02/0,01 (DEC-79) z obserwacji, nie z sufitu klasy → NIE
  przeliczane przy okazji: **T10** w §6 + PI-04 w `poprawki` (zmiana
  zakresu). DEC-103 (reguły osobnym PR-em) — z polecenia Mateusza T8
  jedzie razem z T7 (jedna loteria instalacji). Nowa pułapka **P-70**
  (cudzysłów „…" zamykany ASCII `"` kończy literał TS/Pythona — trzy
  potknięcia w tej sesji). Poza zakresem (XS, osobno): `CLAUDE.md`
  „Komendy" bez `pnpm test:dist`; mapa skilla `/test` bez warstwy dist.
  Zero bajtów strony; baseline'y nietknięte; lista „na telefon": nie
  dotyczy. Przy `git add`: `tests/dist` był IGNOROWANY przez `dist/`
  w `.gitignore` (wzorzec bez `/` łapie każdy katalog o tej nazwie) →
  `/dist/` (tylko katalog główny), pułapka **P-71**. Następna paczka:
  **R5** po DNS Hetmana (XS) albo T10 przy najbliższym dotknięciu hero.
  **Domknięcie (2026-10-27)**: PR #64 (4 commity, head `63c2e9a`) — CI na
  PR run 40362955030 zielone za 1. razem (`test:dist` po `build` 1 s;
  install-deps próba 1 = 30 s, próba 2 pominięta); merge `c178204`
  2026-10-27 16:02 UTC → CI na main run 40536992288 zielone za 1. razem
  (`quality` 1 min 26 s, `test:dist` 1 s; `e2e` 21 min, install-deps
  próba 1 = 33 s, próba 2 pominięta, binaria z cache 1 s; `lighthouse`
  6 min) + Prod smoke run 40536992331 zielony. Pierwszy pomiar retry
  (DEC-105): dwa biegi z rzędu bez apt-flake'a, 2. próba nieużyta —
  mechanizm zweryfikowany tylko na ścieżce „próba 1 OK → próba 2
  skipped"; ścieżka awaryjna sprawdzi się przy pierwszym realnym
  timeoucie (kontrola: `gh run view <id> --json jobs`, krok „próba 2"
  = success zamiast skipped). **P10 ✅ W CAŁOŚCI.** Domknięte w PR docs
  `docs/close-p10` razem z dwoma XS spoza zakresu P10: `CLAUDE.md`
  „Komendy" + linia CI z `test:dist`, mapa skilla `/test` z warstwą dist
  (wiersz dla tras/SEO/danych kontaktowych, krok 2 „build + test:dist"
  przed Playwrightem). Otwarte COULD-y bez zmian: H3, H4, R4, R5, S4, S5,
  M3, F2, L2, T10. CI na tym PR-ze docs (#65, run 40553896112): `e2e`
  czerwone 1/682 — `work.spec.ts:123` (wideo w nakładce, pixel-5,
  `currentTime` 0) w OBU próbach Playwrighta; diff = 4 pliki md, więc
  regresja wykluczona → rerun joba zielony. Pierwsze wystąpienie flake'a
  P-31 na runnerze (dotąd tylko lokalnie pod obciążeniem) — P-31
  zaktualizowana; jeśli wróci na main, kandydat na punkt T (np. poll
  `currentTime` zamiast jednego odczytu po 600 ms).
  **Pierwszy realny bieg ścieżki awaryjnej DEC-105 — i jej porażka**
  (run 40567119421 na #65 po push `394a317`): próba 1 timeout 6 min
  (mirror ~40 KB/s, 5 z 181 pakietów), próba 2 czerwona po 2 s —
  `apt-get` z próby 1 (root przez sudo) przeżył limit kroku i trzymał
  `/var/lib/dpkg/lock-frontend` (`E: Could not get lock … held by
  process 2658`, exit 100). Naprawa osobnym PR-em `ci/install-deps-wait-
  for-lock` (nad #65): próba 2 = `DPkg::Lock::Timeout "420"` w
  `/etc/apt/apt.conf.d/` + limit 8 min (apt czeka, osierocona instalacja
  się dokańcza, powtórka = no-op), komentarze w 3 workflowach; **P-72**,
  **DEC-111**, P-40 uzupełniona. Mirror zostaje loterią (zmiana mirrora
  dopiero po kolejnych 2 wystąpieniach). Weryfikacja ścieżki = następny
  realny timeout próby 1 (krok „próba 2" success zamiast failure).
  **2026-10-28**: #65 ✅ merge `c2e4085` (CI main 40585447363 + Prod smoke
  40585447397 zielone), #66 ✅ merge `aa6eb6a` (Prod smoke 40659086634
  zielony; CI main run 40659086581 `e2e` czerwone: `work.spec.ts:123` na
  chromium-1920 i pixel-5 w obu próbach, 1366 flaky, 679 passed; apt przez
  próbę 1 w 31 s). Drugie wystąpienie flake'a wideo w CI w ciągu doby,
  szersze, diff bez bajtów strony → nie rerun „na ślepo", tylko mechanizm:
  sonda w Playwrighcie pokazała `paused=false`, `readyState=1`,
  `currentTime=0` — wideo z R2 (`preload=none`, ~730 KB) na ścieżce PR
  = sieć zewnętrzna, wbrew regule `CHECK_REMOTE_MEDIA`. → **T11 ✅** na
  branchu `test/overlay-video-local-fixture` (route na fixture + poll;
  `public/lpm-probe.mp4` nie gra w Chromium; fixture z ffmpeg); **P-73**,
  **DEC-112**, P-31 uzupełniona, reguła w `testing.md`. Rerun `e2e` na
  main zielony (12:44–13:04 UTC) — main czysty; zielony rerun to loteria
  sieci, nie dowód, stąd T11 mimo wszystko.
  **2026-10-28 (wieczór)**: #67 ✅ merge `0bce589` (CI na PR run
  40720478806: `e2e` 682 passed, 0 flaky, próba 2 apt pominięta; Prod smoke
  main 40730558300 zielony; CI main 40730558262 zielone za 1. razem:
  `e2e` 682 passed, 0 flaky, visual 115 passed, apt przez próbę 1 —
  pierwszy main bez loterii R2). Domknięcie = branch `docs/close-t11`
  (ten wpis, §6/§7/README). Przy okazji dwa COULD-y bez bajtów strony:
  **F2 ✅** (reguła `fonts.ready` vs `fonts.load()` w `sections.md`, §4.6).
  **R5 — sygnał sprawdzony, jeszcze nie**: `hetmannieruchomosci.com`
  odpowiada 200 bez przekierowania, ale starą stroną (tytuł „HETMAN
  Nieruchomości", bez `generator: Astro`; `nowa.` = Astro 6.4.6, inny
  HTML) → `liveUrl` zostaje na `nowa.`. **S5 — warunek niespełniony**:
  polityka (`PolicyPage.astro`) deklaruje „bez analityki, reklam i cookies
  marketingowych", NIE „bez zapisu w urządzeniu"; jedyne zapisy to flagi
  `sessionStorage` (`hm:visited` mikro-fade, zamknięcie `LowPowerNotice`)
  — techniczne, bez danych osobowych, kasowane z kartą. Propozycja:
  zamknąć S5 jako „nie dotyczy" (przenieść do §9) — decyzja Mateusza.
