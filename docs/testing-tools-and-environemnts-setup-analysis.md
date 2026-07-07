# Analiza: środowiska testowe i testy dla hadrianm-web (lokalnie + CI/CD)

> **Status:** AKTUALNY — dokument wykonawczy (plan do wdrożenia).
> Data: 2026-07-07. Autor analizy: Claude Code (research: Context7 — aktualne
> wersje narzędzi; audyt wydajnościowy read-only całego codebase'u).
>
> Cel: (I) bezpieczne optymalizacje „pod spodem" bez zmiany wyglądu/zachowania,
> (II) dobór środowisk testowych i typów testów, (III) plan wdrożenia krok po
> kroku, (IV) integracja z ekosystemem Claude Code. Obecny stan strony —
> przetestowany na fizycznych urządzeniach — traktujemy jako **wzorzec
> poprawności**: testy mają zamrozić ten stan i łapać każdą regresję.

## Ustalenia z Mateuszem (2026-07-07) — ramy decyzyjne

| Obszar | Decyzja |
| --- | --- |
| Budżet | **Tylko darmowe narzędzia** (Playwright, GitHub Actions free tier, Lighthouse CI); realne urządzenia → manualna checklista |
| Git flow | **PR-y + branch protection na main**; Cloudflare Pages preview per PR |
| Warstwy testów | Wizualne regresyjne + E2E funkcjonalne + jednostkowe (Vitest) + wydajnościowe/a11y |
| Optymalizacje | **Safe-first**, hero tylko obserwacje o zerowym ryzyku |
| Baseline'y wizualne | **Dwa komplety**: lokalny (macOS) + CI (Linux), per-platform snapshots |
| Blokowanie | Testy wizualne **blokują merge**, flaky obszary maskowane/z podwyższonym progiem |
| Środowisko E2E | **Lokalny build w runnerze CI** (`pnpm build` + `pnpm preview`) |
| Profile urządzeń | **6 profili** (szczegóły w §II.2) |
| verify-hero.mjs | **Pełna migracja do Playwright Test od razu** |
| Progi wydajności | **Baseline = stan obecny + ratchet** (łapiemy regresje, nie oceniamy absolutnie) |
| Dodatki | Walidacja kontraktu CMS, smoke produkcji po deployu, testy linków/SEO |
| Claude Code | Aktualizacja skilli + hooki wymuszające + reguły/CLAUDE.md + checklista urządzeń fizycznych |

**Zasada nadrzędna kolejności wdrożenia:** najpierw budujemy siatkę testów na
OBECNYM stanie (etapy 1–6), dopiero potem wdrażamy optymalizacje z Części I
(etap 7) — każdą pod osłoną już działających testów. Dzięki temu „mniej
zasobów" nigdy nie oznacza „coś się cicho zepsuło".

---

# Część I — Rekomendacje optymalizacyjne „pod spodem" (safe-first)

Audyt objął: fonty, obrazy/wideo, bundle JS, skrypty/listenery, CSS,
`astro.config.mjs`, `BaseLayout`, `AmbientBackground`. **Wniosek ogólny:
codebase jest już bardzo dobrze zoptymalizowany** — wideo `preload="none"`
z lazy-injection `src` tylko na mobile, Lenis ładowany dynamicznie za bramką
`prefers-reduced-motion`, listenery pasywne/throttlowane, `will-change`
bramkowane klasami faz, AmbientBackground pauzuje niewidoczne warstwy i na
mobile degraduje do statycznego WebP, zero `setInterval`, zero stałych
blur/backdrop-filter. Poniżej wszystko, co da się jeszcze bezpiecznie zyskać.

## I.1 — Usunięcie martwych integracji React + MDX (największy porządek)

**Obserwacja (zweryfikowana w buildzie):** zero dyrektyw `client:` w całym
`src` (żadna wyspa się nie hydratuje); `dist/_astro/client.*.js` = **189 KB**
runtime'u Reacta, **niereferencjonowany w żadnym HTML-u** (przeglądarki go nie
pobierają, ale puchnie build i deploy). Brak jakichkolwiek plików `.mdx`/`.md`
w `src` — integracja `mdx()` jest całkowicie nieużywana (treści realizacji to
JSON + Zod).

**Akcja:** usunąć `react()` i `mdx()` z `astro.config.mjs:20` oraz zależności
`react`, `react-dom`, `@types/react`, `@types/react-dom`, `@astrojs/react`,
`@astrojs/mdx` z `package.json`.

**Zysk:** −189 KB artefaktu deployu, mniejszy `node_modules`, szybszy build.
**Ryzyko:** niskie. **Weryfikacja:** `pnpm build` przechodzi, a `dist/*.html`
są bajt-w-bajt identyczne (poza zniknięciem `client.*.js` z `_astro`) —
`diff -r` starego i nowego `dist` z pominięciem hashy; dodatkowo pełny
przebieg testów wizualnych (po etapie 4).

## I.2 — Rekompresja ciężkich zasobów statycznych (ryzyko zerowe)

- `public/og-image.png` = **649 KB** (1200×1200) — pobierany wyłącznie przez
  crawlery social (iMessage/X/Messenger), zero wpływu na odwiedzających, ale
  warto zejść do ~100–150 KB (mocniejsza kompresja PNG lub konwersja do JPEG;
  uwaga: nie każdy crawler lubi WebP w OG — bezpieczniej PNG/JPEG).
- `public/icon-512.png` = **173 KB** — manifest PWA, rekompresja bezpieczna.

**Weryfikacja:** podgląd linka (np. opengraph.xyz) wygląda identycznie.

## I.3 — `preconnect` do `media.hadrianm.pl`

Obrazy sekcji Realizacje ładują się w produkcji z R2 przez `imgAt()`, a w
`BaseLayout.astro` nie ma `preconnect`. Dodać w `<head>`:

```html
<link rel="preconnect" href="https://media.hadrianm.pl" crossorigin />
```

**Zysk:** wcześniejszy handshake TLS → szybszy pierwszy obraz sekcji Work.
**Ryzyko:** niskie (czysty dodatek). **Weryfikacja:** DevTools → Network —
połączenie do media.hadrianm.pl startuje przed scrollem do Work.

## I.4 — Preload głównego fontu (Archivo latin)

Wszystkie fonty mają `font-display: swap` (brak FOIT), ale główny krój tekstu
above-the-fold (Archivo Variable) nie jest preloadowany — pierwszy paint może
pokazać font systemowy i „przeskoczyć". Preload skróci okno swapa.

**Uwaga wykonawcza:** hash pliku woff2 zmienia się co build — preload NIE może
być hardkodowany. W Astro rozwiązuje to import URL-a asseta w frontmatterze:

```astro
---
import archivoWoff2 from "@fontsource-variable/archivo/files/archivo-latin-wght-normal.woff2?url";
---
<link rel="preload" as="font" type="font/woff2" href={archivoWoff2} crossorigin />
```

**Ryzyko:** niskie — zmienia się timing ładowania, nie wygląd docelowy.
**Weryfikacja:** testy wizualne bez zmian + Network (font startuje z HTML-em);
Lighthouse: mniejszy CLS/„flash".

## I.5 — Sprzątanie martwego kodu źródłowego

`src/playground/ScrollDemo.astro` — nieimportowany, nie trafia do builda
(potwierdzone grep + brak w `dist`). Usunąć wyłącznie jako porządek źródeł.
**Ryzyko:** zerowe.

## I.6 — Obserwacje BEZ akcji (świadomie zostawiamy)

- **Hero** (`LaptopSite`/`PhoneSite`): `<img>` bez `width`/`height` — układ
  trzymają sztywne ramki urządzeń + `object-fit`, CLS kontrolowany przez CSS.
  Nie ruszać bez pełnego `/verify-mobile`; zysk wątpliwy, ryzyko realne.
- **3 listenery `resize` w hero bez debounce** — resize jest rzadki, na mobile
  `ignoreMobileResize` blokuje refresh ScrollTriggera. Zostawić.
- **`.nav-bar { will-change: transform }` na stałe** — drobny koszt warstwy
  GPU, ale transform faktycznie animuje się przy chowaniu paska. Zostawić.
- **Subset vietnamese w Archivo** — dzięki `unicode-range` nigdy nie jest
  pobierany; koszt to jedna reguła `@font-face`. Nie warto zmieniać importu.
- **`prefetch` Astro** — dla strony z dwiema trasami (PL/EN) zysk marginalny.
  Notatka na przyszłość, gdy podstron będzie więcej.
- **AmbientBackground** — już wzorcowy (pauzowanie nieaktywnych warstw,
  statyczny WebP na mobile, brak blur). Każda dalsza „optymalizacja" = zmiana
  wyglądu. Zostawić.

**Kolejność wdrażania optymalizacji (etap 7 planu):** I.1 → I.2 → I.3 → I.4
→ I.5, każda jako osobny commit z osobnym przebiegiem testów.

---

# Część II — Analiza: jakie środowiska testowe i jakie testy

## II.1 — Wybrane narzędzia (zweryfikowane przez Context7, 2026-07-07)

| Narzędzie | Wersja | Rola | Dlaczego to (a nie alternatywy) |
| --- | --- | --- | --- |
| **@playwright/test** | 1.61.x (spójnie z już obecnym `playwright@^1.61.0`) | E2E funkcjonalne + wizualne regresyjne + a11y + SEO/linki | Jedyny darmowy runner z trzema silnikami (Chromium/WebKit/Firefox) — WebKit to jedyna droga do „prawie-Safari" bez Maca w CI; natywne `toHaveScreenshot` z per-platform snapshots, maskami i progami per-test; emulacja urządzeń z wbudowanego rejestru (`devices`); projekt już go zna (capture, verify-hero) |
| **Vitest** | 4.x | testy jednostkowe czystej logiki TS + kontrakt CMS | Vite-native — Astro oficjalnie dokumentuje `getViteConfig()` z `astro/config`; zero dodatkowych kompilatorów; szybka pętla watch. Uwaga Astro 6: komponenty `.astro` renderować tylko w środowisku `node` (Container API jest experimental — NIE opieramy na nim siatki, patrz §II.4) |
| **@lhci/cli (Lighthouse CI)** | 0.15.x | budżety wydajnościowe + ratchet | Standard branżowy Google; `staticDistDir` idealny dla Astro static; asercje per-metryka i per-zasób (`resource-summary:*`); darmowy `temporary-public-storage` na raporty |
| **@axe-core/playwright** | najnowszy stabilny | dostępność (a11y) | Standard de facto; wpinany w istniejące testy Playwright — zero osobnej infrastruktury |
| **GitHub Actions** | — | CI/CD | już używane; darmowe dla publicznych/małych repo |

Świadomie odrzucone: **Cypress** (brak WebKit — dyskwalifikacja przy macierzy
z iPhone'ami; wolniejszy), **BackstopJS/reg-suit** (osobna infrastruktura
wizualna, gdy Playwright ma to natywnie), **Percy/Chromatic** (płatne),
**Selenium/WebdriverIO** (przewaga tylko przy realnych device farmach, które
są poza budżetem), **jsdom/happy-dom jako główne środowisko** (strona jest
scroll/GPU-centryczna — DOM-symulacja niczego istotnego tu nie udowadnia).

## II.2 — 6 profili emulacji vs Twoja macierz urządzeń

Konfiguracja `projects` w Playwright (nazwy = nazwy projektów w configu):

| Projekt | Emulacja | Co pokrywa z macierzy |
| --- | --- | --- |
| `chromium-1920` | Chromium, 1920×1080, DPR 1 | nowoczesne komputery Mac/Windows, Chrome/Edge |
| `chromium-1366` | Chromium, 1366×768, DPR 1 | ~10-letnie laptopy Windows (najpopularniejsza stara rozdzielczość); mały viewport łapie łamanie layoutu |
| `firefox-desktop` | Firefox, 1920×1080 | silnik Gecko — regresje CSS/JS specyficzne dla Firefoksa |
| `webkit-iphone-se` | WebKit, `devices["iPhone SE"]` | ~5-letnie iPhone'y i najmniejszy ekran iOS (375×667) — silnik Safari |
| `webkit-iphone-14` | WebKit, `devices["iPhone 14"]` | współczesne iPhone'y (notch, 390×844, DPR 3); spójny z dzisiejszym profilem verify-hero |
| `chromium-pixel-5` | Chromium, `devices["Pixel 5"]` | Android (silnik Blink mobile, touch, DPR 2.75); słabsze Androidy → patrz throttling niżej |

„Słabszy smartfon" i „10-letni komputer" to nie tylko rozdzielczość, ale i moc
CPU — to pokrywa **Lighthouse CI** (domyślna emulacja mobile = Moto G Power
z throttlingiem CPU 4× i siecią 4G), a nie screenshot-testy. Dzięki temu
para „Playwright (poprawność) + LHCI (koszt)" domyka macierz bez płatnych
device farm.

## II.3 — Czego emulacja NIE wykryje → checklista fizyczna

Zgodnie z dotychczasową wiedzą projektu (`analiza-refactor-hero-odkruszenie.md` §4):

| Obszar | Dlaczego emulacja ślepa | Kiedy test fizyczny |
| --- | --- | --- |
| Limit rozmiaru warstwy GPU Androida | desktopowy GPU nie ma tego limitu | każda zmiana rozmiarów/transformów sceny urządzeń |
| iOS Low Power Mode | brak przełącznika w WebKit playwrightowym | zmiany w wideo/autoplay/LowPowerNotice |
| Zwijany toolbar Safari (late refresh, metryki viewportu) | emulacja ma stały viewport | zmiany w hero-config/timeline/sticky |
| Zimny cache + realne łącze komórkowe | CI ma ciepły localhost | przed release po większych zmianach zasobów |
| Dotyk/scroll fizyczny (Lenis syncTouch feel) | scripted scroll ≠ palec | zmiany w smooth-scroll.ts |

Ta tabela staje się formalną **checklistą urządzeń fizycznych** w skillu
`/release-check` (Część IV) — Claude ma wiedzieć, KIEDY poprosić Cię o telefon
do ręki i NA CO patrzeć.

## II.4 — Piramida testów dla tego projektu

1. **Jednostkowe (Vitest, sekundy)** — czysta logika TS bez przeglądarki:
   - `hero-config.ts` — **pochodne osi scrolla liczy kod**: asercje na
     inwarianty (monotoniczność faz, zakresy 0–1, zależności między stałymi
     typu `DOG_SITE_PROGRESS`/`CAP_END`). To zamienia „magiczne liczby"
     w kontrakt.
   - `src/i18n/utils.ts` + kompletność słowników `ui.ts`/`nav.ts` (każdy klucz
     ma wersję pl i en — test generyczny po kluczach).
   - `src/lib/img.ts` — kształt URL-i `/cdn-cgi/image/...` (width, format,
     zachowanie w dev).
   - `platform.ts` — detekcja UA/skala Androida na zamockowanym `navigator`.
   - **Kontrakt CMS**: każdy `src/content/realizacje/*.json` przechodzi schemę
     Zod (schemat importowany z `src/content.config.ts` lub wydzielony do
     współdzielonego modułu). Build też to waliduje, ale test daje sygnał
     w 2 s zamiast w minutę i czytelny komunikat.
   - Zasada: `.astro` komponentów NIE testujemy jednostkowo (Container API
     experimental) — ich zachowanie pokrywają E2E i wizualne.
2. **E2E funkcjonalne (Playwright, ~1–2 min)** — na buildzie produkcyjnym
   (`pnpm preview`):
   - nawigacja/anchory, otwieranie-zamykanie Modal/BottomSheet (WorkDetail),
     przełącznik PL↔EN (poprawne linki hreflang i treści), 200 dla `/`
     i `/en/`, brak błędów konsoli i nieoczekiwanych 404 (wzorzec z
     verify-hero: ignoruj `/cdn-cgi/image/` na preview),
   - funkcjonalny stan hero (przeniesione z verify-hero): wideo mobilne gra
     w środku sweepa (`paused === false`, `currentTime` rośnie), sticky
     odpina się na końcu osi,
   - **a11y**: skan axe-core na `/` i `/en/` (poziom WCAG A/AA, raport
     w artefaktach CI),
   - **SEO/linki**: sitemap istnieje i linkuje obie wersje, canonical, meta
     OG/Twitter, `robots.txt` blokuje `/admin`, wszystkie wewnętrzne linki
     odpowiadają < 400.
3. **Wizualne regresyjne (Playwright `toHaveScreenshot`, ~2–4 min)** —
   pełna migracja verify-hero + reszta strony; szczegóły §III etap 4.
4. **Wydajnościowe (Lighthouse CI)** — budżety ratchet od zmierzonego
   baseline'u; szczegóły §III etap 5.
5. **Smoke produkcji** — po deployu na main lekki przebieg przeciw
   `https://hadrianm.pl` (osobny, mały tag testów).

## II.5 — Środowiska uruchomieniowe

| Środowisko | Co biega | Kiedy |
| --- | --- | --- |
| **Lokalnie (macOS)** | Vitest watch; Playwright E2E + wizualne vs baseline **darwin**; wybrane projekty (`--project=...`) dla szybkiej pętli | podczas pracy; obowiązkowo przed push |
| **CI na PR (ubuntu-latest)** | pełna macierz: quality gate → unit → build → E2E+wizualne (baseline **linux**) → LHCI; wszystkie jako required checks | każdy PR do main |
| **CI po merge (main)** | to samo + smoke produkcji po deployu Cloudflare | każdy push na main |
| **Docker lokalnie (opcjonalnie)** | `mcr.microsoft.com/playwright:v1.61.x-noble` do generowania/debugowania baseline'ów linuksowych bez pushowania | przy aktualizacji baseline'ów CI |

Dwa komplety baseline'ów (decyzja Mateusza) obsługuje natywnie
`snapshotPathTemplate` z tokenem `{platform}` — pliki `*-darwin.png`
i `*-linux.png` żyją obok siebie w repo. Konsekwencja: **zamierzona zmiana
wyglądu = aktualizacja obu kompletów** (lokalnie `--update-snapshots`, dla
linuksa: workflow ręczny w CI wystawiający artefakt lub przebieg w Dockerze
— procedura w etapie 4).

---

# Część III — Plan wdrożenia krok po kroku

Każdy etap = osobny PR (od etapu 6 — wcześniej można na main, bo testy jeszcze
nie bramkują). Wszystkie wersje przykładowe — przy instalacji brać najnowsze
patche z tych samych linii major/minor.

## Etap 1 — Fundament: zależności i konfiguracja

1. Instalacja (dev):

   ```bash
   pnpm add -D @playwright/test@1.61 vitest @axe-core/playwright @lhci/cli
   pnpm exec playwright install chromium webkit firefox
   ```

   Uwagi projektowe:
   - `playwright` (library) ZOSTAJE w devDeps — używają go
     `scripts/capture-device-videos.mjs` i spółka; **wersje `playwright`
     i `@playwright/test` muszą być identyczne** (jeden binarny zestaw
     przeglądarek). Przy bumpach podnosić parą.
   - pnpm 11: jeśli instalacja zgłosi `ERR_PNPM_IGNORED_BUILDS` (np. dla
     zależności lhci), ustawić w `package.json` →
     `pnpm.allowBuilds.<pkg>: true` — nie kasować stuba.
2. Struktura katalogów:

   ```
   tests/
     unit/            # Vitest
     e2e/             # Playwright: funkcjonalne + a11y + seo
     visual/          # Playwright: screenshot-testy (w tym hero sweep)
     visual/__screenshots__/   # baseline'y (commitowane, per-platform)
     helpers/         # freeze-css, scroll przez Lenisa, guard preview
   ```

3. `vitest.config.ts` (wg oficjalnego wzorca Astro):

   ```ts
   /// <reference types="vitest/config" />
   import { getViteConfig } from "astro/config";

   export default getViteConfig({
     test: {
       environment: "node",
       include: ["tests/unit/**/*.test.ts"],
     },
   });
   ```

4. `playwright.config.ts` — szkielet (kluczowe decyzje w komentarzach):

   ```ts
   import { defineConfig, devices } from "@playwright/test";

   export default defineConfig({
     testDir: "./tests",
     fullyParallel: true,
     forbidOnly: !!process.env.CI,
     retries: process.env.CI ? 1 : 0,
     reporter: process.env.CI ? [["html"], ["github"]] : "list",
     // Baseline'y per-platform: iPhone-se-01-darwin.png / -linux.png
     snapshotPathTemplate:
       "{testDir}/visual/__screenshots__/{projectName}/{arg}-{platform}{ext}",
     expect: {
       toHaveScreenshot: {
         maxDiffPixelRatio: 0.0005, // odpowiednik FAIL_PIXEL_RATIO z verify-hero
         animations: "disabled",
       },
     },
     webServer: {
       command: "pnpm preview --port 4399",
       url: "http://localhost:4399",
       reuseExistingServer: !process.env.CI,
       timeout: 120_000,
     },
     use: { baseURL: "http://localhost:4399" },
     projects: [
       { name: "chromium-1920", use: { ...devices["Desktop Chrome"], viewport: { width: 1920, height: 1080 } } },
       { name: "chromium-1366", use: { ...devices["Desktop Chrome"], viewport: { width: 1366, height: 768 } } },
       { name: "firefox-desktop", use: { ...devices["Desktop Firefox"], viewport: { width: 1920, height: 1080 } } },
       { name: "webkit-iphone-se", use: { ...devices["iPhone SE"] } },
       { name: "webkit-iphone-14", use: { ...devices["iPhone 14"] } },
       { name: "chromium-pixel-5", use: { ...devices["Pixel 5"] } },
     ],
   });
   ```

   Decyzje wpisane w config:
   - **port 4399, nie 4321** — na 4321 często wisi dev server do testów na
     telefonie (utrwalona konwencja projektu); `reuseExistingServer: !CI`
     pozwala lokalnie trzymać preview w tle.
   - `webServer.command` NIE builduje — build jest osobnym krokiem
     (lokalnie: `pnpm build` przed testami; w CI: osobny step). To utrzymuje
     regułę „testy wizualne tylko na preview, nigdy dev". Dodatkowo helper
     `assertPreview()` (port z verify-hero) sprawdza brak `/@vite/client`
     w HTML-u i przerywa z czytelnym komunikatem.
   - `reducedMotion` zostaje domyślne (`no-preference` w przeglądarkach
     headless z flagą playwrightową nie jest emulowane na `reduce`) —
     NIE ustawiać `reducedMotion: "reduce"`, bramka w BaseLayout wyłączyłaby
     animacje (utrwalona reguła projektu).
5. Skrypty w `package.json`:

   ```jsonc
   "test": "pnpm test:unit && pnpm test:e2e && pnpm test:visual",
   "test:unit": "vitest run",
   "test:unit:watch": "vitest",
   "test:e2e": "playwright test tests/e2e",
   "test:visual": "playwright test tests/visual",
   "test:visual:update": "playwright test tests/visual --update-snapshots",
   "test:smoke:prod": "BASE_URL=https://hadrianm.pl playwright test tests/e2e --grep @prod-smoke"
   ```

## Etap 2 — Testy jednostkowe (Vitest)

Zakres z §II.4 pkt 1. Wskazówki wykonawcze:

- **Kontrakt CMS:** schemę `realizacje` wydzielić z `src/content.config.ts` do
  `src/content.schema.ts` (czysty Zod, bez importów `astro:content`) i używać
  w obu miejscach — wtedy test robi `import { realizacjeSchema }`,
  `fs.readdir` po `src/content/realizacje/*.json` i `safeParse` każdego pliku
  z czytelnym raportem błędów. (To jedyna wymagana zmiana w kodzie źródłowym
  — czysty refaktor bez zmiany zachowania; NIE dotyka samych JSON-ów, więc
  nie łamie zasady „nie edytuj realizacje/*.json".)
- **hero-config:** testować WYŁĄCZNIE inwarianty publicznych stałych/pochodnych
  (nie implementację), np. „fazy nie nakładają się", „każda pochodna w [0,1]",
  „suma długości segmentów = długość osi". Gdy Mateusz świadomie zmieni
  choreografię — test aktualizuje się razem z konfigiem w tym samym PR.
- **Dostępność mediów R2** (rozszerzenie kontraktu CMS): test wysyłający HEAD
  do każdego URL-a `media.hadrianm.pl` z JSON-ów, oznaczony osobno
  (`describe.skipIf(!process.env.CHECK_REMOTE_MEDIA)`) — odpalany w CI na
  main i w `/release-check`, NIE na każdym PR (zewnętrzna sieć = flaky).

## Etap 3 — E2E funkcjonalne + a11y + SEO/linki (Playwright)

Zakres z §II.4 pkt 2, pliki w `tests/e2e/`:

- `navigation.spec.ts` — anchory, navbar (chowanie przy scrollu), mobile menu.
- `work.spec.ts` — karty realizacji renderują dane z Content Collections
  (liczba kart = liczba JSON-ów), otwarcie WorkDetail (Modal na desktop /
  BottomSheet na touch), zamknięcie (klik, Escape).
- `i18n.spec.ts` — `/` po polsku, `/en/` po angielsku, linki przełącznika,
  hreflang w `<head>`, brak „przecieków" drugiego języka.
- `hero-functional.spec.ts` — port funkcjonalnej części verify-hero: po
  scrollu do środka osi na profilach mobile wideo gra (`!paused`,
  `currentTime` rośnie między dwoma odczytami); zero błędów `console.error`
  i `pageerror` w całym przebiegu; 404 tylko dla `/cdn-cgi/image/`.
- `a11y.spec.ts` — `new AxeBuilder({ page }).analyze()` na `/` i `/en/`;
  na start `expect(violations).toEqual([])` dla poziomu critical/serious,
  reszta raportowana do artefaktu (ratchet jak w LHCI).
- `seo.spec.ts` — canonical, OG/Twitter meta, `sitemap-index.xml`,
  `robots.txt` (blokada `/admin`), crawl wewnętrznych linków (< 400).

Tag `@prod-smoke` na minimalnym podzbiorze (strona wstaje, hero renderuje,
oba języki 200, brak błędów konsoli) — ten sam kod obsłuży smoke produkcji
przez `BASE_URL`.

## Etap 4 — Testy wizualne: migracja verify-hero + reszta strony

**4a. Migracja sweepa hero do `tests/visual/hero.spec.ts`.** Mechanika 1:1
z `scripts/verify-hero.mjs` (to sedno decyzji „pełna migracja od razu"):

- `tests/helpers/freeze.css` = dzisiejszy `FREEZE_CSS` (bez reguły chowającej
  wideo — wideo maskujemy natywnie): wyłącza czasowe animacje CSS, zostawia
  scroll-driven GSAP scrub (to je testujemy).
- Punkty sweepa: te same `POINTS = [0, 0.06, …, 1.06]` jako ułamek
  `hero.offsetHeight − innerHeight`, scroll przez
  `window.__lenis.scrollTo(y, { immediate: true, force: true })` +
  `window.scrollTo`, settle = 2×rAF + timeout (helper `scrollHeroTo()`).
- Każdy punkt = `expect(page).toHaveScreenshot(`${String(i).padStart(2, "0")}-p${pct}.png`, { stylePath, mask: [page.locator(".screen__video")], maskColor: "#000" })`
  — maska zastępuje dzisiejsze `visibility: hidden` na wideo.
- **Flaky klatki desktop 05–09** (utrwalona wiedza: ~0.5–2% różnicy między
  przebiegami — ekran telefonu + ambient): per-wywołanie podwyższony próg
  `maxDiffPixelRatio: 0.02` LUB maska na kontener ekranu telefonu w tych
  klatkach. Zaczynamy od progu (mniej inwazyjne), maska w odwodzie. Profile
  mobilne bez luzów — dziś dają 0.000%.
- Sweep tylko na projektach `chromium-1920` (odpowiednik dzisiejszego
  desktop), `webkit-iphone-14`, `chromium-pixel-5` (odpowiedniki iPhone/
  Pixel) — `test.skip()` dla pozostałych projektów, żeby nie mnożyć
  baseline'ów hero ponad potrzebę.

**4b. Reszta strony — `tests/visual/sections.spec.ts`:** screenshoty
stabilnych sekcji po hero (About, Services, Work, Audience, FAQ, Contact,
stopka) na wszystkich 6 projektach: scroll do sekcji, freeze.css, screenshot
elementu (`expect(section).toHaveScreenshot()` — diff per sekcja, nie cała
strona → czytelniejsze raporty). Plus otwarty Modal i BottomSheet WorkDetail.

**4c. Procedura baseline'ów (dwa komplety):**

1. Lokalnie (macOS): `pnpm build && pnpm test:visual:update` → pliki
   `*-darwin.png`.
2. Linux: workflow ręczny `update-visual-baselines.yml`
   (`workflow_dispatch`) uruchamia to samo w CI i **wystawia artefakt**
   z `*-linux.png`; Mateusz pobiera, podmienia lokalnie i commituje razem
   z darwin (zgodnie z zasadą „commituje wyłącznie Mateusz" — bez bot-commitów).
   Alternatywa bez CI: `docker run --rm -v "$PWD":/work -w /work mcr.microsoft.com/playwright:v1.61.2-noble sh -c "corepack enable && pnpm install --frozen-lockfile && pnpm build && pnpm test:visual:update"`.
3. Zamierzona zmiana wyglądu = w JEDNYM PR: kod + oba komplety baseline'ów
   + diff pokazany Mateuszowi do akceptacji (procedura w regule
   `.claude/rules/testing.md`, Część IV).
4. Baseline'y to PNG w repo — przy obecnej skali (kilkadziesiąt–~200 plików
   po kilkaset KB) commit wprost jest OK; **Git LFS dopiero gdy katalog
   przekroczy ~100 MB** (odnotować w regule, nie wdrażać na zapas).

**4d. Wycofanie starego harnessu:** po dwóch zielonych przebiegach nowej
siatki (w tym jednym celowo zepsutym dla dowodu, że łapie regresję — np.
tymczasowa zmiana stałej w hero-config): usunąć `scripts/verify-hero.mjs`
i `.hero-verify/`, zaktualizować skill `/verify-mobile`, reguły i pamięć
projektu. Do tego czasu oba systemy żyją równolegle (stary jako plan B).

## Etap 5 — Lighthouse CI: budżety ratchet

1. `lighthouserc.cjs` w root:

   ```js
   module.exports = {
     ci: {
       collect: {
         staticDistDir: "./dist",
         url: ["/", "/en/"], // ścieżki w obrębie staticDistDir
         numberOfRuns: 3, // mediana — tłumi szum runnera
       },
       assert: {
         assertions: {
           // WARTOŚCI WSTAWIĆ PO POMIARZE BAZOWYM (procedura niżej):
           // metryka: ["error", { maxNumericValue: baseline * 1.15 }]
           "categories:performance": ["error", { minScore: 0 /* TODO */ }],
           "largest-contentful-paint": ["error", { maxNumericValue: 0 /* TODO */ }],
           "total-blocking-time": ["error", { maxNumericValue: 0 /* TODO */ }],
           "cumulative-layout-shift": ["error", { maxNumericValue: 0.02 }],
           "resource-summary:script:size": ["error", { maxNumericValue: 0 /* TODO */ }],
           "resource-summary:total:size": ["error", { maxNumericValue: 0 /* TODO */ }],
           "resource-summary:font:count": ["warn", { maxNumericValue: 6 }],
         },
       },
       upload: { target: "temporary-public-storage" },
     },
   };
   ```

2. **Procedura baseline + ratchet:**
   - pomiar bazowy: 5× `lhci collect` w CI (nie lokalnie — progi muszą
     odpowiadać maszynie, która będzie bramkować), mediana → do tabeli
     w tym dokumencie (dopisać po pomiarze);
   - próg = baseline × 1,15 dla metryk czasowych, baseline + 10% dla wag
     zasobów — margines na szum runnera, zero fałszywych czerwonych;
   - **ratchet:** po każdej wdrożonej optymalizacji z Części I ponowny pomiar
     i zacieśnienie progów do nowego baseline'u × 1,15 (osobny mały PR
     „chore(perf): tighten LHCI budgets after X");
   - raz na kwartał przegląd progów (rosnąca strona = świadome podniesienie,
     nigdy ciche).
3. LHCI mierzy na **domyślnej emulacji mobile (Moto G Power, CPU 4×,
   sieć 4G)** — to nasz proxy „słabszego Androida" (§II.2). Dodatkowo drugi
   przebieg z `preset: "desktop"` dla profilu komputerowego.

## Etap 6 — CI/CD: workflow, branch protection, smoke produkcji

1. Rozbudowa `.github/workflows/ci.yml` do postaci (szkic):

   ```yaml
   name: CI
   on:
     push: { branches: [main] }
     pull_request:
   jobs:
     quality:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v7
         - uses: pnpm/action-setup@v6
         - uses: actions/setup-node@v6
           with: { node-version-file: .nvmrc, cache: pnpm }
         - run: pnpm install --frozen-lockfile
         - run: pnpm format:check
         - run: pnpm lint
         - run: pnpm typecheck
         - run: pnpm test:unit
         - run: pnpm build
         - uses: actions/upload-artifact@v4
           with: { name: dist, path: dist/ }
     e2e:
       needs: quality
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v7
         - uses: pnpm/action-setup@v6
         - uses: actions/setup-node@v6
           with: { node-version-file: .nvmrc, cache: pnpm }
         - run: pnpm install --frozen-lockfile
         - uses: actions/download-artifact@v4
           with: { name: dist, path: dist/ }
         - run: pnpm exec playwright install --with-deps chromium webkit firefox
         - run: pnpm test:e2e
         - run: pnpm test:visual
         - uses: actions/upload-artifact@v4
           if: failure()
           with: { name: playwright-report, path: playwright-report/ }
     lighthouse:
       needs: quality
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v7
         - uses: pnpm/action-setup@v6
         - uses: actions/setup-node@v6
           with: { node-version-file: .nvmrc, cache: pnpm }
         - run: pnpm install --frozen-lockfile
         - uses: actions/download-artifact@v4
           with: { name: dist, path: dist/ }
         - run: pnpm exec lhci autorun
   ```

   Optymalizacje: cache przeglądarek Playwright
   (`~/.cache/ms-playwright` kluczem z wersją z lockfile'a); raport HTML
   Playwright jako artefakt przy porażce (diffy wizualne do obejrzenia
   w przeglądarce).
2. **Smoke produkcji** — osobny workflow `prod-smoke.yml`: `on: push:
   branches: [main]`, krok `sleep`/poll aż `https://hadrianm.pl` zwróci
   świeży deploy (nagłówek `cf-ray` + porównanie hasha assetu z dist),
   potem `pnpm test:smoke:prod`. Porażka = mail z GitHuba natychmiast po
   zepsutym deployu.
3. **Branch protection na main** (GitHub → Settings → Branches → Add rule):
   - Require a pull request before merging (bez wymaganych approvals —
     jednoosobowy zespół),
   - Require status checks to pass: `quality`, `e2e`, `lighthouse`,
   - Require branches to be up to date before merging,
   - (opcjonalnie na start) Do not allow bypassing the above settings —
     można włączyć po tygodniu docierania, żeby mieć furtkę awaryjną.
4. Konsekwencja dla trybu pracy: **koniec pracy bezpośrednio na main** —
   feature branch → PR → zielone checki → merge. Cloudflare Pages
   automatycznie wystawia preview URL per PR (bonus do ręcznego klikania,
   testy go nie wymagają).

## Etap 7 — Wdrożenie optymalizacji z Części I pod osłoną testów

Kolejność I.1 → I.5, każda jako osobny PR z pełnym przebiegiem CI; dla I.1
dodatkowo ręczny `diff -r` HTML-i w dist; dla I.4 przebieg LHCI przed/po
(oczekiwany spadek LCP/CLS). Po całości: ratchet progów LHCI (etap 5.2).

## Definicja ukończenia (Definition of Done)

- [ ] `pnpm test` zielony lokalnie (darwin) i w CI (linux),
- [ ] celowo wprowadzona regresja testowa (zmiana stałej hero + zepsuty JSON
      realizacji) jest łapana przez odpowiednią warstwę,
- [ ] branch protection aktywne; push prosto na main odrzucany,
- [ ] smoke produkcji przeszedł po pierwszym merge'u,
- [ ] stary verify-hero usunięty, skille/reguły/pamięć zaktualizowane,
- [ ] baseline'y LHCI zmierzone i wpisane do tego dokumentu,
- [ ] optymalizacje I.1–I.5 wdrożone, progi LHCI zacieśnione.

---

# Część IV — Aktualizacje ekosystemu Claude Code

## IV.1 — `.claude/settings.json` (permissions)

Dopisać do `allow` (testy muszą być bezprompt'owe, inaczej hooki/skille
będą się dławić):

```jsonc
"Bash(pnpm test)",
"Bash(pnpm test:*)",
"Bash(pnpm exec playwright test*)",
"Bash(pnpm exec vitest*)",
"Bash(pnpm exec lhci*)",
"Bash(curl -s https://hadrianm.pl*)"
```

Dopisać do `deny` ochronę baseline'ów przed „naprawianiem" testów podmianą
wzorca (aktualizacja TYLKO przez `test:visual:update` po akceptacji Mateusza):

```jsonc
"Edit(tests/visual/__screenshots__/**)",
"Write(tests/visual/__screenshots__/**)"
```

## IV.2 — Hooki

1. **`stop-typecheck.sh` → rozszerzyć o szybkie warstwy:** po typechecku
   dorzucić `pnpm test:unit` (sekundy). Testów Playwright NIE wpinać w Stop —
   za wolne na każdy stop; od tego są skille i CI.
2. **Nowy hook PostToolUse `remind-tests.sh`** (matcher `Edit|Write`):
   mapuje edytowaną ścieżkę na wymaganą warstwę i wypisuje przypomnienie
   (exit 0 + stdout, nieblokujący):
   - `src/components/sections/hero/**` → „zmiana w hero NIE jest
     zweryfikowana bez `pnpm test:visual --project=...` (skill
     /verify-mobile)",
   - `src/content.schema.ts`, `src/content.config.ts` → „uruchom kontrakt CMS
     (`pnpm test:unit`)",
   - `src/i18n/**`, `src/lib/img.ts`, `src/scripts/**` → analogicznie.
     To realizuje „hooki wymuszające" bez blokowania pracy w pół zdania;
     twarda bramka i tak stoi w CI.
3. **guard-realizacje.sh** — bez zmian (nadal chroni JSON-y CMS); nowy guard
   baseline'ów załatwia `deny` z IV.1.

## IV.3 — Nowa reguła `.claude/rules/testing.md`

Treść (skrót — kontrakt testowy projektu):

- mapa „co zmieniasz → co uruchamiasz" (warstwy z §II.4),
- testy wizualne WYŁĄCZNIE na preview (port 4399, nigdy dev; guard
  `/@vite/client`),
- baseline'y: dwa komplety darwin+linux; procedura aktualizacji (4c);
  ZAKAZ regenerowania baseline'u w celu „naprawienia" czerwonego testu bez
  pokazania diffu Mateuszowi,
- flaky klatki hero desktop 05–09: najpierw porównaj z przebiegiem
  kontrolnym, dopiero potem podejrzewaj regresję,
- LHCI: progi to ratchet — podnosić wolno tylko świadomą decyzją Mateusza
  w osobnym commicie,
- czego emulacja nie wykrywa → tabela §II.3 + kiedy prosić o urządzenie
  fizyczne.

## IV.4 — Skille

1. **`/verify-mobile`** — przepisać z `scripts/verify-hero.mjs` na
   `pnpm test:visual --project=chromium-1920 --project=webkit-iphone-14
   --project=chromium-pixel-5 tests/visual/hero.spec.ts`; sekcje
   o interpretacji diffów i baseline'ach zostają (wskazują na
   `playwright-report/` zamiast `.hero-verify/diff/`).
2. **`/release-check`** — bramka jakości rozszerzona o `pnpm test:unit`,
   `pnpm test:e2e`, `pnpm test:visual`, `pnpm exec lhci autorun` i przebieg
   `CHECK_REMOTE_MEDIA=1` (media R2); dodać sekcję **„Checklista urządzeń
   fizycznych"** = tabela §II.3 z instrukcją „poproś Mateusza o test na
   telefonie, gdy zmiana dotyka obszaru X, i wskaż, na co patrzeć". Po
   wdrożeniu branch protection skill kończy się propozycją PR-a, nie pusha.
3. **Nowy skill `/test`** — inteligentny wybór warstwy: czyta `git status`/
   `git diff --name-only`, mapuje ścieżki na warstwy (ta sama mapa co hook
   IV.2), uruchamia tylko potrzebne, raportuje zbiorczo. Domyślne wejście
   do testowania w codziennej pracy.
4. **`/capture-devices`, `/new-realizacja`** — bez zmian merytorycznych;
   w `/new-realizacja` dopisać krok „`pnpm test:unit` (kontrakt CMS) po
   dodaniu wpisu".

## IV.5 — `CLAUDE.md`

- **Komendy:** dopisać `pnpm test`, `test:unit`, `test:e2e`, `test:visual`,
  `test:visual:update`, `test:smoke:prod`; adnotacja „typecheck to już NIE
  jedyna weryfikacja — patrz testy".
- **Zasady twarde:** dodać pkt „Nie aktualizuj baseline'ów wizualnych bez
  pokazania diffu i zgody Mateusza" (blokada też w settings.json).
- **Konwencje pracy → Weryfikacja wizualna:** zastąpić opis verify-hero
  opisem nowej siatki (`tests/visual/`, dwa komplety baseline'ów, port 4399).
- **Mapa projektu:** dodać `tests/` z jednozdaniowym opisem warstw.
- Po etapie 6: zaktualizować opis flow („main = produkcja, zmiany przez PR
  z wymaganymi checkami").

## IV.6 — Pamięć projektu i dokumentacja

- Zaktualizować wpisy pamięci: `verify-hero: flaky desktop 05–09` (nowa
  lokalizacja siatki), nowy wpis o kontrakcie testowym po wdrożeniu.
- `docs/README.md`: dopisać ten dokument do indeksu (zrobione razem z tą
  analizą); po pełnym wdrożeniu zaktualizować status na „wdrożony".
- Rozważyć banner ℹ️ w `analiza-refactor-hero-odkruszenie.md` przy sekcji
  o verify-hero po jego wycofaniu (etap 4d).

---

# Ryzyka i pułapki (żeby nie uczyć się ich drugi raz)

1. **WebKit playwrightowy ≠ Safari** — to ten sam silnik, ale bez
   safari'owych ograniczeń energetycznych i toolbara; dlatego checklista
   fizyczna (§II.3) jest częścią systemu, nie opcją.
2. **Baseline'y linux vs darwin nigdy nie będą wspólne** — antyaliasing
   fontów różni się fundamentalnie; nie „naprawiać" tego progami globalnymi
   (maskowałoby realne regresje), od tego jest `{platform}` w ścieżce.
3. **Szum runnerów GitHub Actions w LHCI** — stąd `numberOfRuns: 3`,
   mediana i margines ×1,15; metryki czasowe z pojedynczego przebiegu są
   bezwartościowe.
4. **Wersje `playwright` i `@playwright/test` muszą iść parą** — rozjazd =
   dwa komplety binariów przeglądarek i niedeterministyczne różnice pikseli.
   Bump = też bump tagu obrazu Dockera i cache'a przeglądarek w CI.
5. **`document.fonts.ready` + settle 2×rAF + timeout** przed każdym
   screenshotem (wzorzec z verify-hero) — bez tego flaki na WebKit.
6. **Nie emulować `prefers-reduced-motion: reduce`** w testach animacji —
   bramka w BaseLayout wyłączy Lenisa/GSAP i testy „przejdą" na martwej
   stronie (utrwalona reguła projektu).
7. **Testy wideo w screenshotach zawsze przez maskę**, nigdy przez piksele —
   klatka wideo między przebiegami to loteria.
8. **HEAD do R2 tylko poza ścieżką PR** — zewnętrzna sieć w bramce PR
   = fałszywe czerwone w najgorszym momencie.
