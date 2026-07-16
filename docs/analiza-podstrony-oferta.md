# Analiza: podział sekcji „Oferta" na podstrony `/proces-wspolpracy` i `/pakiety`

Data: 2026-07-16 · Status: **W REALIZACJI** (branch
`feat/oferta-section-subpage-init`). Log wykonawczy: §VII.

## I. Cel

Sekcja `#services` (Nić A + Pakiety P4, `docs/analiza-sekcja-oferta.md`)
rozchodzi się na trzy miejsca:

1. **Strona główna** — zostaje tylko intro „czytane scrollem" (ghost
   „oferta", tag `02 / Oferta`, trzy akapity do „…Pomogę Ci dobrać optymalne
   rozwiązanie."), a pod nim **para CTA** wg referencji
   `docs/design/export-buttony-oferta/` (primary „Przeglądaj pakiety",
   secondary split „Proces współpracy").
2. **`/proces-wspolpracy/`** — nić A z 5 krokami + endcap + fixed progres
   `01/05`, z pełnoprawnym nagłówkiem sekcyjnym (dziś proces nie ma
   nagłówka — tylko mono-hint „Proces współpracy" nad nicią).
3. **`/pakiety/`** — nagłówek „wybierz swój *pakiet*", grid 3 pakietów,
   pas „Dedykowane", „Opcje dodatkowe".

Wzorzec podstron: `/dla-kogo/` (`docs/analiza-podstrona-dla-kogo.md`) —
BackButton w miejscu brandu, współdzielony Footer, jedna statyczna warstwa
ambientu (tu **red** — tak wygląda tło sekcji na stronie głównej),
`smoothScroll="desktop"` (Lenis na desktopie, mobile natywnie). Kolejny krok
migracji „prawie całe menu na podstrony".

## II. Decyzje (ustalone z Mateuszem, 2026-07-16)

| #   | Decyzja                                                                                                                                                              |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Trasy: PL `/proces-wspolpracy/` + `/pakiety/`, EN `/en/process/` + `/en/packages/` (konwencja tłumaczonych slugów).                                                    |
| D2  | Jeden komponent `Services.astro` z propem `variant: "teaser" \| "process" \| "packages"` (precedens Audience) — style i config w jednym miejscu.                       |
| D3  | CTA pakietów (`pk-cta`, link „Dedykowanych") **na razie nigdzie nie prowadzą** — placeholder `href="#"` + `preventDefault` (wzorzec D5 z `/dla-kogo`); sekcja kontakt też dostanie podstronę w kolejnych etapach i cel wskażemy wtedy. |
| D4  | Endcap procesu zostaje i prowadzi na `/pakiety/` (pełna nawigacja, strzałka `→` zamiast `↓`).                                                                          |
| D5  | Nagłówek `/proces-wspolpracy/` = wzorzec `pk-head`: kicker mono (akcent) + h2 display „proces" + serif italic „*współpracy*" (EN: „collaboration *process*").          |
| D6  | Chrome podstron: tag `Oferta / Proces` i `Oferta / Pakiety` (bez `02` — numeracja dotyczy porządku sekcji na stronie głównej); teaser zachowuje `02 / Oferta`.        |
| D7  | Fixed progres `01/05` przenosi się w całości na `/proces-wspolpracy/`.                                                                                                  |
| D8  | Buttony: zmienne `--pp-*` podpięte pod tokeny globalne tam, gdzie wartości są zgodne (`--accent`, `--ink`, `--line`); reszta (faint .38, on-accent, hover) lokalnie — wizualnie 1:1 z referencją. Wyrównanie do lewej, w linii z tekstem intro. Teksty w `ui.ts` (PL/EN). |
| D9  | Animacje: intro-scrub na głównej 1:1; buttony dostają reveal (toggleClass `on`, jak dotychczasowy introhint). Podstrona procesu: nić + kroki + progres 1:1. `/pakiety/` bez modułu scrolla (tylko hover CSS). |
| D10 | Ambient na obu podstronach: **red**, jedna statyczna warstwa fixed (bez crossfade'u).                                                                                   |
| D11 | Scroll podstron: `smoothScroll="desktop"` (jak `/dla-kogo/`) — desktop na Lenisie, mobile natywnie (gałąź mobile to scrub bez pinu + toggleClass, natywny scroll wystarcza). |
| D12 | Testy: pełen komplet jak przy `/dla-kogo` (e2e + visual + baseline'y darwin/linux w jednym PR, diffy do akceptacji przed regeneracją). Docs-first: niniejszy dokument.  |

## III. Architektura

### III.1. `Services.astro` — trzy warianty

`interface Props { lang: Lang; variant: "teaser" | "process" | "packages" }`.
Sekcja dostaje `data-variant` (bramka skryptów) i klasę `of--sub` na
podstronach (korekty paddingów/tagu). `id="services"` zostaje we wszystkich
wariantach (na głównej: kotwica navbara + warstwa `data-bg="services"`
crossfade'u; na podstronach jedna sekcja na stronę — kolizji brak).

**`teaser` (strona główna)** — renderuje: tag `02 / Oferta`, metę, intro
(ghost + 2×lead + close), a po `of-close` blok `.of-ctas` z komponentem
`OfertaButtons` (primary → `/pakiety/`, secondary → `/proces-wspolpracy/`
wg języka). NIE renderuje: procesu, endcapu, `#packages`, progresu.
`of-introhint` znika z kodu w ogóle (rolę „zapowiedzi procesu" przejmuje
secondary button; klucz `services.introHint` usunięty z obu języków).

**`process` (`/proces-wspolpracy/`)** — renderuje: tag `Oferta / Proces`,
metę, nowy nagłówek `.of-pghead` (kicker + h2 wg D5), `of-proces`
(nić + 5 kroków + endcap z CTA → `/pakiety/`), fixed `of-progress`.

**`packages` (`/pakiety/`)** — renderuje: tag `Oferta / Pakiety`, metę,
`#packages` (pk-head, grid, dedy, extra). CTA = placeholdery `href="#"`
(D3) z tym samym, skomentowanym wyjątkiem
`eslint-disable astro/jsx-a11y/anchor-is-valid` co w Audience.

Inline skrypt `.js` zostaje bezwarunkowy (gotcha z §VII analizy
`/dla-kogo`: warunkowy `<script is:inline>` w JSX wywala parser
`astro check`); dla `packages` klasa jest neutralna (żaden uzbrajany
selektor tam nie występuje). Skrypt modułowy: `services-scroll` importowany
tylko dla `teaser`/`process` (bramka po `data-variant`, `packages` nie
pobiera chunka GSAP); dla `packages` — wyłącznie `preventDefault` na
placeholderach. Import `@/scripts/anchors` znika (żaden wariant nie ma już
linków kotwicowych: endcap to pełna ścieżka, buttony to strony).

### III.2. `services-scroll.ts` — rozgałęzienie po wariancie

- `initServicesScroll()` czyta `data-variant` i buduje odpowiedni zestaw:
  - **teaser**: `splitLit` + `readTween` (desktop słowa / mobile zdania,
    stałe bez zmian) + parallax ghosta (desktop) + reveal `.of-ctas`
    (toggleClass `on`, próg `top 92%` — po dawnym introhincie);
  - **process**: `threadTween` + `stepTriggers` + reveal endcapu + parallax
    cyfr-ghost (desktop) + progres `01–05` (desktop);
  - guardy elementów per wariant (dotychczasowy jeden wspólny guard
    wymagał WSZYSTKICH elementów).
- Progi/stałe w `services-config.ts` bez zmian — triggery liczą się
  względem elementów, nie strony.

### III.3. Nowe pliki

| Plik                                     | Rola                                                                                                              |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `src/components/ui/OfertaButtons.astro`  | Port referencji `docs/design/export-buttony-oferta/` (scoped style, container query, a11y); tokeny wg D8; props: hrefy + etykiety (i18n podaje strona). |
| `src/components/ServicesSubpage.astro`   | Wspólny layout obu podstron (wzorzec `AudiencePage.astro`, prefiks klas `osp-`): ambient **red** statyczny, Navbar bez brandu, BackButton, Footer; prop `kind: "process" \| "packages"` dobiera trasę/meta/wariant. |
| `src/pages/proces-wspolpracy.astro`      | `<ServicesSubpage lang="pl" kind="process" />`                                                                       |
| `src/pages/pakiety.astro`                | `<ServicesSubpage lang="pl" kind="packages" />`                                                                      |
| `src/pages/en/process.astro`             | `<ServicesSubpage lang="en" kind="process" />`                                                                       |
| `src/pages/en/packages.astro`            | `<ServicesSubpage lang="en" kind="packages" />`                                                                      |

### III.4. Zmiany w istniejących plikach

- `src/lib/routes.ts` — `SERVICES_PROCESS_PATH` + `SERVICES_PACKAGES_PATH`.
- `src/i18n/ui.ts` — nowe klucze PL/EN: `services.tagProcess/tagPackages`,
  `services.ctaPackages/ctaProcess/ctaProcessSub`,
  `services.proc.kick/headLead/headAccent`, `processPage.title/description/back`,
  `packagesPage.title/description/back`; usunięty `services.introHint`.
- `src/components/Home.astro` — `<Services lang={lang} variant="teaser" />`;
  warstwa `data-bg="services"` (red) bez zmian.
- `Navbar.astro` — BEZ zmian: pozycja „Oferta" dalej celuje w `#services`
  na głównej (sekcja-zajawka zostaje; dwie podstrony nie mają jednego celu).
- CSS w `Services.astro`: `.of-ctas` (margines + reveal jak introhint),
  `.of-pghead` (typografia współdzielona selektorami z `.pk-head`),
  `.of--sub` (podstrony: górne paddingi `~235px` desktop / `~170px` mobile;
  mobile tag niżej — na stronie startującej od góry `top: 56px` koliduje
  z fixed BackButtonem), hover strzałki endcapu `translateX` (D4).

## IV. Testy (kontrakt `.claude/rules/testing.md`)

1. **Unit** — parytet kluczy i18n łapie `i18n.test.ts`;
   `services-config.test.ts` bez zmian (stałe nietknięte).
2. **E2E** — `services.spec.ts` przepisany pod teaser (data-variant, brak
   kroków/pakietów na głównej, hrefy i nawigacja buttonów, fallback bez JS,
   EN); nowy `services-subpages.spec.ts` (lustro `audience-index.spec.ts`,
   4 strony × [meta/canonical/hreflang, treść per wariant, navbar + język,
   BackButton, Lenis desktop / natywnie na dotyku (gotcha maxTouchPoints
   WebKit — runtime-skip), placeholdery nie nawigują, endcap → `/pakiety/`,
   fallback bez JS, zero błędów konsoli]).
   `a11y.spec.ts`: 4 nowe ścieżki w pętli skanu.
3. **Visual** — `tests/visual/services.spec.ts` przepisany na trzy przebiegi
   (kotwice elementowe jak dotąd): strona główna (intro w połowie czytania,
   buttony po revealu), `/proces-wspolpracy/` (nagłówek, krok 2 lit,
   endcap + progres), `/pakiety/` (nagłówek+grid, ogon dedy+extra, hover
   `mid` na chromium-1920). Nowe nazwy zrzutów (`services-home-*`,
   `services-proces-*`, `services-pakiety-*`) — stare `services-0*` do
   skasowania z `__screenshots__` (orphany po zmianie nazw).
4. **Baseline'y** — zmienią się: wszystkie klatki services (nowe nazwy),
   sekcje poniżej services na stronie głównej (strona skraca się o proces
   i pakiety — `section-work/contact`, sweepy about/faq, klatki hero z
   zajawką audience raczej nie, ale pełny przebieg kontrolny obowiązkowy).
   Procedura: kod → diffy do akceptacji Mateusza → `pnpm test:visual:update`
   (darwin) → workflow `update-visual-baselines.yml` (linux) → commit darwin
   NA KOŃCU (reguła `visual-baselines-ci-ordering`). UWAGA na auto-zapis
   brakujących snapshotów przez Playwright (gotcha z `/dla-kogo`).
5. **Lighthouse/SEO** — LHCI mierzy tylko `/` i `/en/` (bez zmian; strona
   główna lżejsza). Sitemap generuje się sama; `seo.spec.ts` crawluje
   sitemapę → nowe strony wchodzą w istniejące asercje.

## V. Etapy

1. **Fundament**: `routes.ts`, klucze i18n (PL/EN), `OfertaButtons.astro`.
2. **Refactor `Services.astro`**: prop `variant`, markup warunkowy,
   `.of-ctas`/`.of-pghead`/`.of--sub` w CSS, bramki skryptów, endcap → D4,
   placeholdery → D3.
3. **`services-scroll.ts`**: rozgałęzienie teaser/process, guardy per wariant.
4. **Podstrony**: `ServicesSubpage.astro` + 4 pliki w `src/pages`.
5. **Nawigacja**: `Home.astro` (variant teaser).
6. **Testy**: przepisanie `services.spec.ts` (e2e+visual), nowy
   `services-subpages.spec.ts`, `a11y.spec.ts` (+4 ścieżki).
7. **Weryfikacja + baseline'y**: `pnpm typecheck && pnpm lint && pnpm
   test:unit`, `pnpm build && pnpm test:e2e && pnpm test:visual` → diffy →
   akceptacja → regeneracja darwin + workflow linux (D12).

## VI. Ryzyka / gotchas

- **Spany `.of-w` w runtime** — reguły `:global` w scoped CSS zostają
  (memory `services-section-oferta`); split dotyczy tylko teasera.
- **`of-prog-on` na sekcji, nie na body** — bez zmian, przenosi się
  z wariantem process.
- **Warunkowy `<script is:inline>` w JSX zabija `astro check`** — inline
  skrypt `.js` bezwarunkowy (gotcha `/dla-kogo` §VII).
- **Scoped CSS a komponent potomny** — BackButton i buttony pozycjonowane
  wrapperami (`.osp-back`, `.of-ctas`), nie klasą na komponencie.
- **Emulacja WebKit nie raportuje `maxTouchPoints`** — asercje natywnego
  scrolla mobile na chromium-pixel-5, WebKit runtime-skip.
- **Kotwica `#packages`** znika ze strony głównej (stare linki
  `/#packages` przestaną dojeżdżać — akceptowalne, nigdzie nie
  publikowana); `#services` zostaje.
- **Skok paska URL na mobile** — zaakceptowany na `/realizacje` i
  `/dla-kogo`, tu identycznie.
- **Wysokość strony głównej spada drastycznie** — element-screenshoty
  sekcji niżej złapią znany churn navbara/ghosting (≠ regresja); pełny
  przebieg kontrolny przed oceną diffów.
- **CTA „Poznaj ofertę" na `/dla-kogo/`** (placeholder z D5 tamtej analizy)
  celowo NADAL placeholder — cel wskaże Mateusz przy dalszej migracji.

## VII. Log wykonawczy

- 2026-07-16: dokument utworzony po ustaleniu D1–D12; etapy 1–6 wdrożone
  zgodnie z planem (bez korekt architektury). Wyniki weryfikacji (Etap 7):
  - `typecheck` / `lint` / `format:check` / `test:unit` — zielone;
    build: 12 stron (8 + 4 nowe).
  - `test:e2e` — 433 pass, 0 fail (w tym nowy `services-subpages.spec.ts`
    i przepisany `services.spec.ts`).
  - `test:visual` — 19 failów = W CAŁOŚCI oczekiwany zestaw: 9× sweepy
    services (brak baseline'ów dla nowych nazw klatek), about/faq
    (chromium-1920, pixel-5) + `section-work`/`section-contact`
    (1920/1366/firefox) — subpikselowy ghosting po skróceniu strony
    głównej (zweryfikowane na diffach: obrysy AA tekstu, zero zmian
    strukturalnych). Sweep hero i sekcja audience bez diffów (nad services).
  - Auto-zapisane brakujące snapshoty services (26 plików darwin) USUNIĘTE
    — powstaną przy zatwierdzonym `pnpm test:visual:update`; wtedy też
    `git rm` 32 osieroconych `services-0*-{darwin,linux}.png` (stare nazwy
    klatek sprzed podziału).
  - Czeka na Mateusza: akceptacja wyglądu/diffów → regeneracja darwin →
    workflow linux → commit darwin na końcu (D12).
- Korekta po review Mateusza (mobile): para CTA dosunięta do dołu sekcji —
  odstęp NAD buttonami (`.of-ctas` margin-top 64→110px) większy niż pod
  nimi (`.of-intro` padding-bottom 90→48px); desktop bez zmian.
