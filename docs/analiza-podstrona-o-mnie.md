# Analiza: przeniesienie sekcji „O mnie" na podstronę `/o-mnie`

Data: 2026-07-17 · Status: **PLAN WYKONAWCZY** (decyzje domknięte
z Mateuszem 2026-07-17; log wykonawczy będzie w §VII).

## I. Cel

Sekcja `#about` (pinned+scrub+snap, design „Z mgły" —
`docs/analiza-sekcja-o-mnie.md`) przenosi się w całości na dedykowaną
podstronę, analogicznie do `/dla-kogo` (`docs/analiza-podstrona-dla-kogo.md`)
i podziału Oferty (`docs/analiza-podstrony-oferta.md`). Strona główna
zostawia **statyczną zajawkę** z buttonem „Więcej o mnie" prowadzącym na
podstronę — button DOKŁADNIE wg referencji
`docs/design/Button - Wiecej o mnie (D5 + MB) - Eksport.html`
(desktop **D5 · Solid jasny**, mobile **MB · Pełna szerokość**).

Kolejny krok migracji navbara na podstrony (po Realizacjach, Dla kogo
i Ofercie); zajawki na głównej = zachęta do wejścia w głąb.

## II. Decyzje (ustalone z Mateuszem, 2026-07-17)

| #   | Decyzja                                                                                                                                                                                              |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Trasy: PL `/o-mnie/`, EN `/en/about/` (slug idiomatyczny, wzorzec skracania jak `proces-wspolpracy ↔ process`). Stała `ABOUT_PATH` w `src/lib/routes.ts`.                                             |
| D2  | Zajawka na głównej: tag `04 / O mnie` + ghost „o mnie" + rozdział 01 „Kim jestem" (nagłówek jako `h2` + akapit) + button pod akapitem. Rozdziały 02–03, finał 04, `om-meta` i progres `01 / 04` — tylko na podstronie. |
| D3  | Portret ZOSTAJE w zajawce — statyczny, ostry (bez veila/emerge; animacja wyłaniania z mgły zostaje atrakcją podstrony). Desktop: po prawej jak na scenie; mobile: w flow pod rozdziałem 01.            |
| D4  | Licznik `01 / 04` i `om-meta` wyłącznie na podstronie (zajawka statyczna — progres bez sceny kłamałby).                                                                                                |
| D5  | CTA finału „Zapraszam do kontaktu" na podstronie = placeholder `href="#"` + `preventDefault` (wzorzec `dk-cta` z D5 analizy dla-kogo) — sekcja kontaktu też będzie migrowana, cel wskażemy wtedy.      |
| D6  | Navbar: pozycja „O mnie" prowadzi wprost na podstronę — `SUBPAGE_PATHS` w `Navbar.astro` += `about: ABOUT_PATH`.                                                                                       |
| D7  | Scroll podstrony: `smoothScroll="desktop"` — Lenis na desktopie (scrub+snap czuje się jak na głównej), mobile natywnie (gałąź mobile = flow + reveale `once:true`), jak `/dla-kogo`.                   |
| D8  | Jeden współdzielony `About.astro` z propem `variant: "teaser" \| "full"`; podstrona = obecna sekcja 1:1 (numeracja `04 /`, rozdziały 01–04, snap — bez zmian).                                          |
| D9  | Button: nowy komponent wg referencji D5+MB, etykieta „Więcej o mnie" / "More about me" (i18n `about.more`); przełączenie MB→D5 przy 861px (`ABOUT_DESKTOP_MIN_PX` — ten sam próg co layout sekcji).     |
| D10 | Tokeny buttona: `#F5F0EC` → `var(--ink)`, `#FF5A47` (strzałka, focus) → `var(--accent)`; `#180A08` (kolor tekstu na jasnym tle) bez odpowiednika globalnego → wartość lokalna komponentu.               |
| D11 | Meta wg wzorca `audiencePage`: PL „O mnie — hadrianm.pl", EN „About me — hadrianm.pl"; description na bazie akapitu 01 (propozycje w §III.4, brzmienia do akceptacji Mateusza przy review).            |
| D12 | Zajawka mobile: `min-height: 100vh` jak zajawka Dla kogo (spójny rytm — jedna zajawka ≈ jeden ekran).                                                                                                  |
| D13 | Chrome podstrony jak `/dla-kogo`: Navbar bez brandu, fixed BackButton (a[data-back]), współdzielony Footer, JEDNA statyczna warstwa `AmbientBackground variant="red"` (tło About na głównej).           |
| D14 | Testy: pełen komplet (e2e lustro `audience-index.spec.ts`, sweep visual na podstronie, zajawka w `sections.spec.ts`, a11y +2 ścieżki); baseline'y darwin po akceptacji diffów → workflow linux → commit darwin na końcu. |

## III. Architektura

### III.1. `About.astro` — dwa warianty

`interface Props { lang: Lang; variant?: "teaser" | "full" }` (domyślnie
`full`). Sekcja dostaje `data-variant` (bramka skryptów) i klasę
`om--teaser` w zajawce. Kotwica `id="about"` zostaje na obu stronach
(na głównej dla crossfade'u tła RED i starych linków `/#about`).

**Wariant `full` (podstrona)** — dzisiejszy markup i zachowanie 1:1:

- klasa `.js` (inline skrypt BEZWARUNKOWY z bramką runtime
  `data-variant === "full"` — warunkowy `<script is:inline>` w JSX wywala
  parser `astro check`, gotcha §VII analizy dla-kogo), moduł
  `about-scroll.ts` (bramka motion bez zmian), rozdziały 01–03, finał 04,
  `om-meta`, progres `01 / 04`, veil/emerge portretu na mobile;
- jedyna zmiana: CTA finału `href="#"` + listener `preventDefault` (D5)
  zamiast `handleAnchorClick` na `#contact` (import z `@/scripts/anchors`
  wypada z komponentu) + skomentowany `eslint-disable-next-line
  astro/jsx-a11y/anchor-is-valid` (wzorzec `dk-cta`);
- portret na podstronie jest w pierwszym viewporcie (kandydat LCP) —
  `loading="eager"` w wariancie full, `lazy` zostaje w teaserze (na głównej
  sekcja jest nisko).

**Wariant `teaser` (strona główna)** — renderuje wyłącznie:

- tag `04 / O mnie`, ghost `o mnie`,
- rozdział 01 (nagłówek jako `h2` + akapit),
- portret ostry: bez `.om-photo-veil` w markupie (crossfade nie istnieje
  w zajawce), `om-photo-meta` (podpis) zostaje jak w bazowym flow mobile,
- button „Więcej o mnie" pod akapitem we wrapperze `.om-morewrap`
  (scoped CSS nie łapie elementów komponentu potomnego — wzorzec
  `.dk-morewrap`).

NIE renderuje: rozdziałów 02–03, finału, `om-meta`, `om-progress`; moduł
`about-scroll.ts` nie jest importowany (bramka `data-variant === "full"` —
chunk GSAP nie pobiera się na głównej).

CSS zajawki (bez bramki motion — scena statyczna, reduce dostaje to samo):

- **desktop ≥861px** (`om--teaser`): statyczna scena `100vh` z pozycjami
  1:1 z gałęzi `.om.js` — ghost `6.5vw / 27vh`, tag `8.8vh / 7.8vw`,
  rozdział 01 `left: 7.8vw` wyśrodkowany jako CAŁY blok
  (`top: 48%` + `translateY(-50%)` — blok urośnie o button, środek
  zostaje; gotcha zajawki dla-kogo), portret `right: 2.6vw / bottom: -10px`,
  szer. `min(48vw, 930px)` — w **STANIE FINAŁU sceny** (korekta Mateusza
  2026-07-17 po review wyglądu, zamiast ostrego): `opacity 0.22 /
  scale(1.16) / blur(5px)` — wartości z tweenu `0.82` w `about-scroll.ts`,
  utrzymywać w parze; filter statyczny (jednorazowa rasteryzacja — zakaz
  dotyczy ANIMOWANIA blura na mobile);
- **mobile**: tag → ghost → rozdział 01 z buttonem POD AKAPITEM (referencja
  mówi „pod akapitem" także dla MB); portret-obraz UKRYTY (`display: none`
  — lazy Image nie jest pobierany), zamiast niego **zblurowany portret ZA
  tekstem** jak w finale sekcji (`om-teaser-bg` = lustro `om-final-bg`,
  współdzielony `.om-final-ph`, `portrait-blur.webp`, opacity 0.59);
  `min-height: 100vh` na stage (D12), rozdział 01 rozciąga się na cały
  ekran (`flex: 1`), **button dociśnięty do dołu sekcji**
  (`margin-top: auto`) — korekta Mateusza 2026-07-17;
  padding-top zostaje bazowy (84px) — nad About nie ma sekcji pinned,
  więc nie ma problemu prześwitu jak przy zajawce dla-kogo (ewentualna
  korekta odstępów przy review wyglądu).

### III.2. Nowe pliki

| Plik                             | Rola                                                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/ui/SolidButton.astro` | Port referencji `Button - Wiecej o mnie (D5 + MB) - Eksport.html` na tokeny projektu (D10); props `href`, `label`; wariant D5 (auto-szerokość) ≥861px, MB (100%) poniżej — jeden element, przełączanie w CSS. |
| `src/components/AboutPage.astro` | Wspólny layout podstrony (lustro `AudiencePage.astro`): ambient **red** statyczny, Navbar bez brandu, fixed BackButton, Footer, `smoothScroll="desktop"`, `alternates={ABOUT_PATH}`. |
| `src/pages/o-mnie.astro`         | `<AboutPage lang="pl" />`                                                                                                               |
| `src/pages/en/about.astro`       | `<AboutPage lang="en" />`                                                                                                               |

`AboutPage.astro` vs `AudiencePage.astro` — różnica wyłącznie w treści
(`<About variant="full">`) i wariancie ambientu (`red` zamiast `blue`);
klasy `abp-bg` / `abp-back` / `abp-foot` wg tego samego wzorca.

### III.3. Zmiany w istniejących plikach

- `src/lib/routes.ts` — `ABOUT_PATH = { pl: "/o-mnie/", en: "/en/about/" }`.
- `src/i18n/ui.ts` — nowe klucze PL/EN: `about.more` („Więcej o mnie" /
  "More about me"), `aboutPage.title`, `aboutPage.description`,
  `aboutPage.back` („Wróć" / "Back").
- `src/components/navbar/Navbar.astro` — `SUBPAGE_PATHS` += `about`.
- `src/components/Home.astro` — `<About lang={lang} variant="teaser" />`;
  warstwa tła `data-bg` (red) bez zmian — crossfade liczy zakresy
  z realnych pozycji sekcji (sekcja skróci się z 440vh do ~100vh).
- `src/components/sections/about/About.astro` — refactor wariantów (§III.1).

### III.4. Propozycje meta (D11, do akceptacji przy review)

- PL title: `O mnie — hadrianm.pl`; description: „Mateusz Hadrian —
  inżynier oprogramowania i twórca stron. Solidna technologia i dopracowana
  estetyka: zobacz, kim jestem i jak pracuję nad stronami, które zarabiają."
- EN title: `About me — hadrianm.pl`; description: "Mateusz Hadrian —
  software engineer and web creator. Solid technology, refined aesthetics:
  see who I am and how I build websites that work for your business."

## IV. Testy (kontrakt `.claude/rules/testing.md`)

1. **Unit** — parytet kluczy i18n PL/EN łapie istniejący `i18n.test.ts`;
   `about-config` nieruszany (oś sceny bez zmian).
2. **E2E** — nowy `tests/e2e/about-index.spec.ts` (lustro
   `audience-index.spec.ts`): meta/canonical/hreflang obu wersji, pełny
   wariant sekcji (3 rozdziały + finał, progres w DOM, CTA-placeholder
   `href="#"` nie nawiguje — tap-test), Lenis na desktopie
   (`data-smooth-scroll="desktop"`, `window.__lenis`), natywny scroll
   mobile (runtime-skip WebKit — gotcha `maxTouchPoints`), navbar
   (aria-current, kotwice → główna, przełącznik języka → odpowiedniki),
   BackButton (widoczny mimo schowanego paska, history.back), zero błędów
   konsoli/404, zajawka na głównej (data-variant, 1 rozdział, brak
   progresu/finału, button → podstrona). Istniejący `tests/e2e/about.spec.ts`
   (oś desktopowa, reveale, treść) przechodzi na ścieżki podstrony;
   asercje CTA→`#contact` zamieniają się w asercje placeholdera. Przegląd
   `navigation.spec.ts` / `seo.spec.ts` pod kątem założeń o kotwicy
   `#about` i liście stron.
3. **Visual** — `tests/visual/about.spec.ts`: sweep przez
   `snappedSectionSweep` dostaje `path: ABOUT_PATH.pl` (helper obsłużył to
   już przy audience; `?nosnap` działa niezależnie od ścieżki). Zajawka
   wchodzi do `sections.spec.ts` (`SECTIONS` += `about`) —
   element-screenshot, 6 profili.
4. **a11y** — `a11y.spec.ts`: ścieżki += `/o-mnie/`, `/en/about/`;
   ratchet bez nowych wpisów.
5. **Baseline'y** — zmienią się: sweep about ×3 profile (podstrona — chrome
   bez brandu, BackButton, statyczny ambient red), nowy `section-about` ×6,
   subpikselowo sekcje poniżej About na głównej (faq/contact — skrót
   z 440vh do ~100vh) i ewentualne klatki sweepów wyżej, jeśli łapią
   zajawkę w kadrze. Procedura: kod → diffy do akceptacji Mateusza →
   `pnpm test:visual:update` (darwin) → workflow
   `update-visual-baselines.yml` (linux) → commit darwin NA KOŃCU
   (reguła `visual-baselines-ci-ordering`). GOTCHA: pierwszy przebieg po
   dodaniu `about` do sections.spec AUTO-ZAPISZE brakujący snapshot —
   usunąć, wygenerować dopiero zatwierdzonym updatem.
6. **Lighthouse/SEO** — sitemap sama (`@astrojs/sitemap`); nowe strony
   przechodzą przez crawl w `seo.spec.ts`.

## V. Etapy

1. **Fundament**: `routes.ts` (`ABOUT_PATH`), klucze i18n,
   `SolidButton.astro`.
2. **Refactor `About.astro`**: prop `variant`, markup warunkowy, CSS
   `om--teaser`, bramka skryptów po `data-variant`, CTA-placeholder (D5),
   `loading` portretu zależne od wariantu.
3. **Podstrona**: `AboutPage.astro` + `pages/o-mnie.astro` +
   `pages/en/about.astro`.
4. **Nawigacja**: `Home.astro` (variant teaser), `Navbar.astro`
   (`SUBPAGE_PATHS`).
5. **Testy**: `about.spec.ts` (visual) → podstrona, `sections.spec.ts` +=
   about, nowy `about-index.spec.ts`, aktualizacja `about.spec.ts` (e2e),
   a11y +2 ścieżki, przegląd istniejących asercji.
6. **Weryfikacja + baseline'y**: `pnpm typecheck && pnpm test:unit`,
   `pnpm build && pnpm test:e2e && pnpm test:visual` → diffy → akceptacja
   Mateusza → regeneracja darwin + workflow linux (D14).

## VI. Ryzyka / gotchas

- **Lenis + pinned scena na podstronie**: mechanika sticky + triggery na
  sekcji jak na głównej (bez zmian); pierwszy scroll od `y=0` na iOS
  (zwijany toolbar) poza zasięgiem emulacji → po wdrożeniu test na
  fizycznym telefonie (na co patrzeć: moment odpięcia sceny na końcu,
  emerge portretu bez skoku przy zwijaniu paska URL).
- **Skok paska URL na mobile** — zaakceptowany na `/realizacje`
  i `/dla-kogo`, tu identycznie.
- **`?nosnap`** czyta `about-scroll.ts` z `location.search` — działa na
  podstronie bez zmian ✓.
- **Scoped CSS a komponent potomny** — button i BackButton pozycjonowane
  wrapperami (`.om-morewrap`, `.abp-back`).
- **Portret eager w full** — pilnować, żeby zmiana `loading` nie ruszyła
  strony głównej (tam teaser = lazy jak dziś); budżety LHCI liczone dla
  głównej, ale nowa podstrona przechodzi przez crawl SEO.
- **Element-screenshot zajawki** dziedziczy znany churn navbara zależny od
  wysokości strony (memory `faq-section-rejestr`); wysokość głównej mocno
  się zmienia — pierwsza generacja baseline'ów to nowy punkt odniesienia,
  spodziewany ghosting ~1px sekcji poniżej.
- **Kontrakt 861px** — próg `@media` buttona i CSS zajawki MUSI być równy
  `ABOUT_DESKTOP_MIN_PX` (para literał ↔ stała, jak w całej sekcji).

## VII. Log wykonawczy (2026-07-17)

Etapy 1–5 wdrożone zgodnie z planem. Korekty względem planu:

- **Button pod akapitem także na mobile** (korekta §III.1): referencja
  mówi „pod akapitem" dla obu wariantów, więc `SolidButton` żyje
  w markupie wewnątrz rozdziału 01 — mobile: rozdział (nagłówek + akapit
  + button) → portret, nie „portret → button".
- `navigation.spec.ts` przesiadł się z kotwicy `#about` na `#services`
  (jedyna pozycja navbara, która została kotwicą obok FAQ/Kontakt).
- **Portret zajawki w stanie finału** (korekta Mateusza po review
  pierwszych zrzutów): desktop = `.om-photo` z wartościami tweenu `0.82`
  z `about-scroll.ts` (opacity 0.22 / scale 1.16 / blur 5px, statycznie);
  mobile = obraz ukryty (lazy nie pobiera), za tekstem `om-teaser-bg`
  (lustro `om-final-bg`, współdzielony `.om-final-ph`), rozdział 01
  `flex: 1` na ekranie 100vh i button `margin-top: auto` na dole sekcji.
  Po przeróbce: lint/typecheck zielone, pełne e2e ponownie 473 pass.

Wyniki weryfikacji (Etap 6, przed baseline'ami):

- typecheck / lint / unit: zielone (70 testów).
- e2e: **473 pass, 0 fail** (w tym nowy `about-index.spec.ts`
  i przerobiony `about.spec.ts` na /o-mnie/).
- visual: 16 failów — W CAŁOŚCI oczekiwane kategorie:
  1. sweep about ×3 profile — chrome podstrony (BackButton, navbar,
     statyczny ambient red) + AA tekstu; layout sceny 1:1;
  2. `section-about` ×6 — NOWY snapshot zajawki (auto-zapis Playwrighta
     usunięty, powstanie przy zatwierdzonym `pnpm test:visual:update`);
  3. sweep FAQ ×3, `section-contact` ×3, `section-work` ×1 — subpikselowy
     ghosting 0.01–0.02 po zmianie wysokości strony głównej (About skrócił
     się z 440vh do ~100vh; znane zjawisko — memory `audience-section`).
- **Korekty zajawki po review Mateusza** (2 rundy):
  1. portret w stanie finału (opis wyżej);
  2. parametry strojenia portretu w tle mobile — `--om-teaser-photo-h`
     (wysokość, svh/px) i `--om-teaser-photo-lift` (dystans dolnej
     krawędzi nad dołem treści ≈ nad buttonem) w `:root` sekcji `.om`;
     wartości ustawione przez Mateusza na telefonach: **53svh / 60px**;
  3. anty-obcinanie góry: pudełko `om-teaser-bg` kotwiczone DOŁEM
     o wysokości RÓWNEJ portretowi (`height: var(--om-teaser-photo-h)`,
     obraz `background-size: auto 100%`) — rośnie w górę razem
     z powiększanym zdjęciem; możliwy tylko naturalny bleed z lewej.
- **Baseline'y darwin ZREGENEROWANE po akceptacji** (2026-07-17):
  `pnpm test:visual:update` → 28 plików (6 nowych `section-about` + sweep
  about ×3 profile + ghosting faq/work/contact); przebieg kontrolny
  `pnpm test:visual` w całości zielony (69 pass). Zostało: commit kodu
  (bez darwin!), workflow `update-visual-baselines.yml` (linux, bot-commit
  na branch), commit darwin NA KOŃCU (reguła `visual-baselines-ci-ordering`)
  i po wdrożeniu test na fizycznym iPhonie (odpięcie sceny na końcu jazdy,
  emerge portretu przy zwijaniu paska URL).
