# Analiza: przeniesienie sekcji „Dla kogo" na podstronę `/dla-kogo`

Data: 2026-07-16 · Status: **WDROŻONE (kod + testy)** — baseline'y wizualne
czekają na akceptację diffów przez Mateusza (procedura §IV.4). Log
wykonawczy: §VII.

## I. Cel

Sekcja `#audience` (pinned+scrub+snap, „Talia kart") przenosi się w całości
na dedykowaną podstronę. Strona główna zostawia tylko **statyczną zajawkę**
(pierwsza klatka sceny) z przyciskiem prowadzącym na podstronę. Wzorzec
podstrony: `/realizacje` (`docs/analiza-podstrona-realizacje.md`), z jedną
istotną różnicą — scroll na podstronie zostaje na Lenisie (animacja scrubowana
musi czuć się identycznie jak dziś na stronie głównej).

To pierwszy krok większej migracji: docelowo prawie wszystkie pozycje navbara
będą prowadzić na podstrony, a zajawki na stronie głównej będą zachętą do
wejścia w głąb.

## II. Decyzje (ustalone z Mateuszem, 2026-07-16)

| #   | Decyzja                                                                                                                                                                    |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Trasy: PL `/dla-kogo/`, EN `/en/who-its-for/` (wzorzec tłumaczonych slugów jak `realizacje ↔ projects`).                                                                    |
| D2  | Zajawka mobile: od góry sekcji do końca akapitu rozdziału 00 („…bezpośrednio przekłada się na zyski."), bez dividera i bez okien — od razu przycisk.                        |
| D3  | Zajawka desktop zachowuje wachlarz trzech okien LUMÉA po prawej (`.dk-backs`) — statyczny HTML/CSS, zero GSAP na stronie głównej.                                            |
| D4  | Zajawka desktop trzyma układ sceny 100vh (absolute), żeby pierwsza klatka wyglądała piksel w piksel jak dziś — tylko bez licznika `01 / 04` i z przyciskiem.                |
| D5  | CTA rozdziału 03 („Poznaj ofertę") zostaje na podstronie, ale z placeholderem `href="#"` i `preventDefault` — sekcja `#services` też będzie migrowana, cel wskażemy później. |
| D6  | Pozycja „Dla kogo" w navbarze prowadzi bezpośrednio na podstronę (jak „Realizacje"), nie do kotwicy.                                                                         |
| D7  | Podstrona jedzie na Lenisie (`smoothScroll` domyślne) — scrub/snap identyczny jak dziś; `/realizacje` zostaje natywne (tam nie ma animacji scrolla).                        |
| D8  | Jeden współdzielony komponent `Audience.astro` z propem `variant: "teaser" \| "full"`; podstrona = obecna sekcja 1:1 (chrome `01 /`, licznik, snap — bez zmian numeracji).   |
| D9  | Etykieta przycisku: „Zobacz więcej" / "See more" (i18n).                                                                                                                     |
| D10 | Kolory przycisku podpięte pod tokeny projektu (`--accent` = `#ff5a47` — zgodny z referencją); hover `#ff6e5d` i ink `#120a09` lokalne (brak odpowiedników w tokenach).       |
| D11 | Testy: pełen komplet jak przy `/realizacje` (e2e + visual + baseline'y darwin/linux w jednym PR, diffy do akceptacji przed regeneracją).                                    |
| D12 | Docs-first: niniejszy dokument.                                                                                                                                              |

## III. Architektura

### III.1. `Audience.astro` — dwa warianty

`interface Props { lang: Lang; variant?: "teaser" | "full" }` (domyślnie
`full`). Sekcja dostaje `data-variant` (bramka dla skryptu) i klasę
`dk--teaser` w zajawce.

**Wariant `full` (podstrona)** — dokładnie dzisiejszy markup i zachowanie:

- inline skrypt `.js`, moduł `audience-scroll.ts` (bramka motion), pełne
  rozdziały 00–03, stos kart, cyfry, licznik `01 / 04`;
- jedyna zmiana: CTA rozdziału 03 `href="#"` + listener `preventDefault`
  (D5) zamiast `handleAnchorClick` na `#services`.

**Wariant `teaser` (strona główna)** — renderuje wyłącznie:

- tag `01 / Dla kogo`, meta, widmowy napis intro (`.dk-ghostintro`),
- rozdział 00 (nagłówek + akapit) + **`MoreLink`** pod akapitem
  (wrapper `.dk-morewrap` — scoped CSS nie łapie elementów komponentu
  potomnego, wzorzec `.wix-back`),
- wachlarz `.dk-backs` (desktop; na mobile ukryty jak dziś).

NIE renderuje: `.dk-digitwrap`, `.dk-stack`, `.dk-progress`, rozdziałów
01–03, inline skryptu `.js`; moduł scrolla nie jest importowany (bramka
`data-variant === "full"` — chunk GSAP w ogóle się nie pobiera na głównej).

CSS zajawki (desktop ≥861px, **bez** bramki motion — scena jest statyczna,
więc reduce dostaje to samo): `.dk--teaser .dk-stage` = 100vh, elementy
w pozycjach 1:1 z gałęzią `.dk.js` (ghost `bottom:13vh`, tag/meta `8.8vh`,
rozdział `left:7.8vw / top:50%` + `translateY(-50%)`, backs
`58.5vw / 27vh / --dkcw`). Mobile: bazowy układ flow bez zmian (tag → ghost
→ rozdział 00 → przycisk).

Kotwica `id="audience"` zostaje na obu stronach (na głównej dla crossfade'u
tła i ewentualnych starych linków `/#audience`).

### III.2. Nowe pliki

| Plik                                  | Rola                                                                                                                      |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `src/components/ui/MoreLink.astro`    | Port referencji `docs/design/export-button-dla-kogo/` na tokeny projektu (D10); props `href`, `label`, `class`.            |
| `src/components/AudiencePage.astro`   | Wspólny layout podstrony (wzorzec `WorkIndexPage.astro`): ambient blue statyczny, Navbar bez brandu, BackButton, Footer.   |
| `src/pages/dla-kogo.astro`            | `<AudiencePage lang="pl" />`                                                                                                |
| `src/pages/en/who-its-for.astro`      | `<AudiencePage lang="en" />`                                                                                                |

`AudiencePage.astro` vs `WorkIndexPage.astro` — różnice: `smoothScroll`
domyślne (Lenis, D7), treścią jest `<Audience variant="full">` zamiast
siatki, brak nakładek Modal/BottomSheet. Wspólne: `.***-bg` (fixed ambient
blue), `.***-back` (fixed BackButton w slocie brandu, `z-index:60`),
`.***-foot` (współdzielony `Footer.astro`), meta + hreflang przez propsy
`BaseLayout`.

### III.3. Zmiany w istniejących plikach

- `src/lib/routes.ts` — `AUDIENCE_PATH = { pl: "/dla-kogo/", en: "/en/who-its-for/" }`.
- `src/i18n/ui.ts` — nowe klucze PL/EN: `audience.more` („Zobacz więcej" /
  "See more"), `audiencePage.title`, `audiencePage.description`,
  `audiencePage.back`.
- `src/components/navbar/Navbar.astro` — `itemHref`: mapa podstron
  `{ work: WORK_INDEX_PATH, audience: AUDIENCE_PATH }` zamiast specjalnego
  przypadku `work` (D6).
- `src/components/Home.astro` — `<Audience lang={lang} variant="teaser" />`;
  warstwa tła `data-bg="audience"` (blue) zostaje bez zmian — crossfade
  liczy zakresy z realnych pozycji sekcji.

## IV. Testy (kontrakt `.claude/rules/testing.md`)

1. **Unit** — parytet kluczy i18n PL/EN łapie istniejący `i18n.test.ts`;
   `audience-config.test.ts` bez zmian (oś sceny nie ruszana).
2. **E2E** — nowy `tests/e2e/audience-index.spec.ts` (lustro
   `work-index.spec.ts`): meta/canonical/hreflang obu wersji, navbar
   (pozycja „Dla kogo" = `aria-current="page"`, kotwice → strona główna,
   przełącznik języka → odpowiedniki), BackButton (widoczny mimo schowanego
   paska, `history.back`), Lenis JEST załadowany (`data-smooth-scroll="on"`,
   `window.__lenis` — odwrotność asercji z `/realizacje`), CTA `href="#"`
   nie nawiguje, zajawka na głównej: przycisk z adresem podstrony, brak
   licznika/stosu, tylko rozdział 00. Aktualizacja asercji navbara
   w istniejących specach, jeśli zakładają kotwicę `#audience`.
3. **Visual** — `tests/helpers/visual.ts`: `snappedSectionSweep` dostaje
   opcjonalny `path` (default `/` — about bez zmian); `audience.spec.ts`
   sweepuje podstronę `/dla-kogo/` (nazwy zrzutów bez zmian → diff pokaże
   różnice chrome'u strony: brak brandu, BackButton, statyczny ambient).
   Zajawka na głównej wchodzi do `sections.spec.ts` (`SECTIONS` +=
   `audience`) — element-screenshot statycznej sekcji, 6 profili.
4. **Baseline'y** — zmienią się: sweep audience (podstrona), nowy
   `section-audience.png`, oraz subpikselowo wszystko poniżej audience na
   stronie głównej (sekcja skraca się z 700vh do ~100vh — pełny przebieg
   kontrolny). Procedura: kod → diffy do akceptacji Mateusza →
   `pnpm test:visual:update` (darwin) → workflow `update-visual-baselines.yml`
   (linux) → commit darwin NA KOŃCU (reguła `visual-baselines-ci-ordering`).
5. **Lighthouse/SEO** — sitemap generuje się sama (`@astrojs/sitemap`);
   nowe strony przechodzą przez istniejące asercje `seo.spec.ts` (crawl
   sitemap → 200).

## V. Etapy

1. **Fundament**: `routes.ts` (AUDIENCE_PATH), klucze i18n, `MoreLink.astro`.
2. **Refactor `Audience.astro`**: prop `variant`, markup warunkowy, CSS
   `dk--teaser`, bramka skryptu po `data-variant`, CTA placeholder (D5).
3. **Podstrona**: `AudiencePage.astro` + `pages/dla-kogo.astro` +
   `pages/en/who-its-for.astro`.
4. **Nawigacja**: `Home.astro` (variant teaser), `Navbar.astro` (mapa
   podstron).
5. **Testy**: helper `path` w sweepie, `audience.spec.ts` → podstrona,
   `sections.spec.ts` += audience, nowy `audience-index.spec.ts`,
   przegląd istniejących asercji.
6. **Weryfikacja + baseline'y**: `pnpm typecheck && pnpm test:unit`,
   `pnpm build && pnpm test:e2e && pnpm test:visual` → diffy → akceptacja →
   regeneracja darwin + workflow linux (D11).

## VI. Ryzyka / gotchas

- **Lenis na podstronie z pinned sceną**: `hero-viewport-metric-invariant`
  dotyczy hero (iOS toolbar / późny refresh) — audience używa zwykłego
  `sticky` + triggerów `top top / bottom bottom` na sekcji, jak dziś na
  głównej; podstrona nie zmienia tej mechaniki, ale pierwszy scroll od
  `y=0` na iOS (toolbar zwijany) to obszar, którego emulacja nie wykryje →
  test na fizycznym telefonie po wdrożeniu (na co patrzeć: moment odpięcia
  sceny na końcu jazdy, brak skoku przy zwijaniu paska URL).
- **Skok paska URL na mobile** — zaakceptowany na `/realizacje` (memory
  `realizacje-subpage`), tu identycznie.
- **`?nosnap`** musi działać na podstronie — parametr czyta
  `audience-scroll.ts` z `location.search`, niezależnie od ścieżki ✓.
- **Scoped CSS a komponent potomny** — przycisk i BackButton pozycjonowane
  przez wrappery (`.dk-morewrap`, `.akp-back`), nie klasą na komponencie.
- **Element-screenshot zajawki** dziedziczy znany churn navbara zależny od
  wysokości strony (memory `faq-section-rejestr`) — wysokość głównej
  zmienia się mocno, więc pierwsza generacja baseline'ów to nowy punkt
  odniesienia.

## VII. Log wykonawczy (2026-07-16)

Etapy 1–6 wdrożone zgodnie z planem. Korekty względem planu:

- Inline skrypt klasy `.js` NIE może być renderowany warunkowo w wyrażeniu
  JSX (`{!teaser && <script is:inline>…}`) — parser `astro check` wywala się
  na treści skryptu; został bezwarunkowy z bramką runtime po
  `data-variant === "full"`.
- CTA-placeholder `href="#"` łapie regułę ESLint
  `astro/jsx-a11y/anchor-is-valid` — świadomy, skomentowany
  `eslint-disable-next-line` (element wróci do bycia linkiem przy migracji
  Oferty).
- Zajawka desktop: rozdział 00 z przyciskiem jest wyśrodkowany jako CAŁY
  blok (`translateY(-50%)`), więc tekst siedzi ~40 px wyżej niż w dawnej
  pierwszej klatce (blok urósł o przycisk, środek został) — widoczne
  w diffie klatki hero `10-p106`; zaakceptować przy regeneracji baseline'ów.
- Korekty po review Mateusza (zajawka MOBILE, media
  `not all and (min-width: 861px)` — dokładne dopełnienie progu desktop,
  bo reguła bazowa (0,3,0) przebijałaby desktopowe `margin: 0` (0,2,0)):
  1. odstęp widmowy napis → `00 · WSPÓŁPRACA` ściśnięty do ~10px
     (`margin-top` rozdziału 00: 118px → 52px; bazowa wartość celowała
     w pełny układ flow);
  2. cały blok podciągnięty do górnej krawędzi sekcji (`padding-top` stage
     84px → 8px, ghost `top` 92px → 16px, delta -76px na obu — relacja
     tag→ghost zachowana), żeby `01 / DLA KOGO` pokazywał się natychmiast
     po odpięciu hero (sticky: sekcja wchodzi w viewport dopiero po
     odpięciu, więc mała wartość nie ryzykuje prześwitu w trakcie hero);
  3. zajawka wypełnia dokładnie viewport (`min-height: 100vh` na stage) —
     „02 / OFERTA" wjeżdża dopiero, gdy tag wyjeżdża górą. 100vh na mobile
     = duży viewport (pasek URL schowany — naturalny stan przy scrollu
     w dół); przy widocznym pasku Oferta wjedzie chwilę PÓŹNIEJ (celowa
     strona kompromisu — nigdy za wcześnie). Nadmiar = pustka ambientu pod
     przyciskiem, treść kotwiczona u góry.

  Skutek uboczny: klatka hero `10-p106` na pixel-5 ORAZ webkit-iphone-14
  łapie teraz zajawkę wyżej w kadrze — do tego samego kompletu regeneracji.
  UWAGA: pierwszy przebieg visual po dodaniu `audience` do sections.spec
  AUTO-ZAPISAŁ brakujące `section-audience-darwin.png` (standard Playwright
  przy missing snapshot) — usunięte, powstaną przy zatwierdzonym
  `pnpm test:visual:update`.

- Korekta D7 (decyzja Mateusza po wdrożeniu): scroll podstrony w trybie
  `smoothScroll="desktop"` (nowy tryb propa BaseLayout) — Lenis TYLKO na
  urządzeniach bez dotyku (desktopowy scrub+snap), mobile NATYWNIE (gałąź
  mobile to flow + reveale `once:true`, Lenis nic nie wnosi; spójnie
  z `/realizacje`). Bramka w skrypcie BaseLayout przez
  `navigator.maxTouchPoints > 0` (kontrakt z `scroll-lenis.md`) — moduł
  `smooth-scroll.ts` NIETKNIĘTY. GOTCHA testowa: emulacja WebKit
  (profile iphone-\*) NIE raportuje `maxTouchPoints` mimo `hasTouch`
  (realny iPhone raportuje 5), więc tam bramka w testach widzi „desktop"
  — asercja natywnego scrolla działa na chromium-pixel-5
  (`maxTouchPoints=1`), na WebKit runtime-skip w `audience-index.spec.ts`.

Wyniki: typecheck/lint/unit zielone; e2e zielone (nowy
`audience-index.spec.ts` 35 pass; 4 znane flaki `contact.spec.ts` pod
obciążeniem pełnej suity — przechodzą solo). Visual: 20 failów = w całości
oczekiwane diffy (nowy `section-audience.png` ×6, sweep audience na
podstronie ×3, klatka hero `10-p106`, subpikselowy ghosting sekcji poniżej
audience na profilach mobile).
