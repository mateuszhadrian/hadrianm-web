# Sekcja „O mnie" — plan wdrożenia (design „Z mgły")

> Status: **PLAN WYKONAWCZY** (2026-07-09). Referencja wizualna:
> `docs/design/o mnie/o-mnie-referencja/` (o-mnie.html/.css/.js + foto.png)
> — samodzielny eksport z notkami „PORT DO ASTRO". Ten dokument opisuje
> decyzje portu do projektu; wygląd i zachowanie mają być 1:1 z referencją.

## I. Czym jest sekcja (skrót referencji)

- **Desktop (≥861px):** `#about` ma wysokość `440vh`; scena (`.om-stage`)
  jest `position: sticky` i zajmuje 100vh. Jedna oś GSAP scrubowana scrollem
  (scrub=1, snap do 4 punktów spoczynku): rozdziały 01–03 wymieniają się na
  scenie (wjazd z dołu / zejście w górę), portret wyłania się „z mgły"
  (blur 16px→0, opacity 0.12→1) między rozdziałami 02–03, żar (czerwone
  bloby) narasta i cofa się w finale, ghost-typografia dryfuje. Finał
  „04 · Kontakt" to wycentrowany overlay z CTA `#contact` i podpisem.
  Progres 01/04 (ticki + licznik) sterowany z `onUpdate`.
- **Mobile (<861px):** zwykły flow (tag → 01 → foto → 02 → 03 → 04), lekkie
  dwukierunkowe reveale (transform/opacity, `toggleActions: play/reverse`),
  jednorazowe wyłonienie portretu, w finale zblurowany portret za treścią.
- **Reduced motion / brak JS:** statyczny układ flow (jak mobile) na każdej
  szerokości, wszystko widoczne w stanach docelowych, zero animacji.

## II. Decyzje portu (ustalone z Mateuszem 2026-07-09)

1. **Architektura plików** — wzorzec hero (markup w `.astro`, logika w TS
   obok):
   - `src/components/sections/about/About.astro` — markup + scoped styles,
   - `src/components/sections/about/about-scroll.ts` — GSAP/ScrollTrigger
     (desktop scrub + mobile reveale), importy npm (bez CDN),
   - stała breakpointu `ABOUT_DESKTOP_MIN_PX = 861` w `about-scroll.ts`;
     wartość MUSI być identyczna z `@media` w stylach `About.astro`
     (kontrakt jak w referencji: CSS ↔ `gsap.matchMedia`).
2. **Zdjęcie w repo, nie w R2** — portret to asset strony (nie treść CMS):
   `src/assets/about/` + `astro:assets <Image>` (srcset build-time).
   Ścieżka R2/`imgAt()` pozostaje wyłącznie dla realizacji.
3. **Pipeline obrazu** — skrypt dev-only `scripts/prepare-about-photo.mjs`
   (sharp, jak `optimize-drewelomet*.mjs`), źródło: PNG z referencji
   (1510×1509, alfa, 2.6 MB). Generuje i commituje się do
   `src/assets/about/`:
   - `portrait.webp` — bezstratnie wyglądający webp z alfą (q≈90) jako
     źródło dla `<Image>` (Astro robi z niego srcset),
   - `portrait-blur.webp` — mały, **wstępnie rozmyty** wariant dla tła
     finału 04 na mobile (rozmycie i saturacja wypieczone w pliku → zero
     `filter: blur()` w runtime; desktop nie pobiera go wcale — tło przez
     `background-image` w gałęzi `@media`, nie `<img>`).
     Portret jest finalny; skrypt zostaje na wypadek podmiany.
4. **Reduced motion = czysty CSS, bez klasy z JS.** Zamiast `.om-static`
   dodawanej przez `gsap.matchMedia` (wariant referencji): układ desktopowy
   żyje w `@media (min-width: 861px) and (prefers-reduced-motion:
   no-preference)`, a moduł GSAP jest w ogóle nieładowany przy `reduce`
   (dynamiczny import za bramką `matchMedia` — ten sam wzorzec co Lenis
   w `BaseLayout`). Przy `reduce`: bazowy układ flow na każdej szerokości,
   stany spoczynkowe (portret ostry, żar stonowany do ~0.55) zapisane
   w CSS; na szerokich ekranach jedynie powiększony padding boczny
   (czytelność — jedyne świadome odejście od restrykcyjnego 1:1,
   referencyjny `om-static` używał mobilnych 26px).
5. **Fallback bez JS** — jak w referencji: klasa `js` dodawana skryptem
   `is:inline` (na elemencie sekcji, przez `document.currentScript` —
   zamiast `body.js`, dzięki czemu style zostają scoped bez `:global`).
   Bez JS desktop renderuje statyczny układ flow.
6. **Numeracja „04"** — zwykły tekst zgodny z kolejnością sekcji
   (audience=01, services=02, work=03, about=04); bez globalnego systemu
   numeracji (do ewentualnej decyzji przy pozostałych sekcjach).
7. **i18n** — wszystkie teksty jako klucze `about.*` w `src/i18n/ui.ts`
   (test jednostkowy parzystości kluczy pokrywa je automatycznie).
   Nagłówki mają serifowy akcent ZAWSZE na końcu → wzorzec `headLead` +
   `headAccent` (jak `work.headline*`). Ghost: „o mnie" / „about me".
   EN copy autorstwa Claude, zaakceptowane do korekt po deployu.
8. **Snap zostaje** (jak w referencji); do zweryfikowania odczuciowo
   z Lenisem na preview — gdyby walczył ze scrollem, decyzja Mateusza.
9. **Tło sekcji** — nieprzezroczyste `#070507` (lokalna wartość sekcji,
   jak w referencji) przykrywa `bg-stage`; `bg-crossfade` nie wymaga zmian
   (brak warstwy `data-bg="about"` = warstwa work naturalnie gaśnie przy
   wjeździe about). Tokeny `--sec-about-*` (teal) NIE są używane — design
   sekcji ma własny czerwony żar; do ewentualnego sprzątnięcia, gdy
   zapadnie decyzja o tłach pozostałych sekcji.
10. **Kolory/fonty z tokenów projektu** — `--ink`, `--muted`, `--faint`,
    `--line`, `--accent`, `--accent-gradient`, `--font-*` z `global.css`
    pokrywają się z paletą referencji (drobne różnice alfa w `--muted`
    0.58 vs 0.62 i `--faint` 0.34 vs 0.38 — przyjmujemy tokeny projektu,
    jedno źródło prawdy). Wartości „zamrożone" z prototypu zostają:
    `--omlen: 440vh`, mgła `scale(1.193)`, zdjęcie finału `opacity 0.59`.

## III. Dostępność (ratchet axe)

Chrom sekcji pisany drobnym monospacem na `--faint`/`rgba(…,0.45)` nie
przechodzi progu kontrastu 4.5:1, a reguła projektu zabrania dopisywania
nowych wpisów do allowlisty bez decyzji Mateusza. Rozwiązanie bez zmiany
wyglądu: elementy czysto dekoracyjne (duplikujące treść dostępną gdzie
indziej) dostają `aria-hidden="true"` → axe ich nie bramkuje:

- `om-meta` („Mateusz Hadrian — Software Developer" — treść jest w akapicie
  01 i w alt portretu),
- `om-photo-meta` (podpis „portret · 2026" — alt portretu niesie treść),
- `om-progress` (czysto wizualny wskaźnik postępu scrolla),
- separator `/` w tagu sekcji i ghost-typografia (jak w referencji).

Nagłówki rozdziałów: `h3` (poziom niżej po `h2` sekcji Work — poprawna
hierarchia, axe `heading-order` OK). Sekcja ma `aria-label` z etykietą
nawigacji. CTA finału jest zwykłym linkiem `#contact` (klikalność bramkuje
klasa `on` dopiero w finale — jak w referencji; na mobile zawsze klikalny).

## IV. Weryfikacja (kontrakt testowy)

1. **Unit** — bez nowych testów: parzystość `about.*` łapie istniejący
   `i18n.test.ts`.
2. **Visual** — `#about` jest sekcją scrubowaną jak hero, więc element-
   screenshot całej sekcji (440vh) w `sections.spec.ts` nie niesie
   informacji na desktopie. Zmiana: `about` wypada z listy `SECTIONS`
   (komentarz jak przy hero), dochodzi **`tests/visual/about.spec.ts`** —
   sweep na profilach hero (`chromium-1920`, `webkit-iphone-14`,
   `chromium-pixel-5`):
   - desktop: punkty = **punkty spoczynku snapa** `[0, 0.13, 0.42, 0.71,
     0.97, 1.0]` zakresu scrolla sekcji (snap w spoczynku = determinizm;
     klatki przejściowe scrubu celowo pomijamy — scrub=1s dogania
     asymptotycznie i klatki pośrednie byłyby flaky),
   - mobile: kilka punktów flow (wjazd tagu, portret po wyłonieniu,
     rozdziały, finał) + wydłużony settle na dojście tweenów reveali.
   Nowe baseline'y (darwin + linux) wchodzą w tym samym PR po akceptacji
   zrzutów przez Mateusza (`pnpm test:visual:update` + workflow
   `update-visual-baselines.yml`).
3. **E2E** — a11y/SEO przechodzą po zmianach z §III; funkcjonalnie: CTA
   prowadzi do `#contact`, treść PL/EN obecna, progres desktop aktualizuje
   się po scrollu (drobne asercje w istniejącym stylu speców).
4. **Fizyczne urządzenie** (emulacja nie pokrywa): płynność wyłonienia
   portretu i reveali na iOS/Android (blur na dużej bitmapie), zachowanie
   sticky przy zwijanym toolbarze Safari (desktopowa gałąź nie dotyczy
   telefonów — flow, więc ryzyko niskie), odczucie snapa z Lenisem na
   trackpadzie/rolce. Po merge'u — prośba do Mateusza o test na telefonie.

## V. Ustalenia z wdrożenia (2026-07-09)

1. **Snap × scrub × testy.** Skok `immediate` do punktu osi NIE jest
   deterministyczny: snap podejmuje decyzję na podstawie SCRUBOWANEGO
   (opóźnionego ~1 s) postępu i po skoku cofa scroll do poprzedniego
   rozdziału (ping-pong). Rozwiązanie: `scrollPageToStable`
   (tests/helpers/scroll.ts) — płynny dojazd rAF z wyhamowaniem (scrub
   nadąża, snap w punkcie spoczynku jest no-opem) + pętla zbieżności.
   Sweep fotografuje WYŁĄCZNIE punkty spoczynku snapa.
2. **Przesunięte zrzuty sekcji za about.** Zmiana wysokości about
   (100svh → 440vh na desktopie, ~2400px flow na mobile) przesuwa
   geometrię strony: `section-work` (chromium-pixel-5; stan ambientu
   przy szwach zszywanego zrzutu) i `section-contact` (webkit-iphone-14;
   subpikselowe przesunięcie) wymagają nowych baseline'ów — wygląd samych
   sekcji BEZ zmian (zweryfikowane na diffach).
3. **Baseline'y `section-about-*.png` są martwe** (about wypadł z listy
   `SECTIONS`) — do usunięcia w tym samym PR.
4. **Warianty portretu z builda:** Astro generuje 5 plików webp 14–109 kB
   (srcset 420–1510 px); źródła w repo: `portrait.webp` 182 kB
   + `portrait-blur.webp` 21 kB (zamiast 2.6 MB PNG).
5. **Weryfikacja reduce/no-JS** (Playwright, emulacja `reducedMotion`):
   mobile i desktop renderują statyczny flow ze stanami docelowymi
   (portret ostry, żar stonowany, zblurowane tło finału z pliku);
   identyczny układ przy wyłączonym JS. Wysokość about: desktop-flow
   1962px (nie 4752px) = scena przypięta poprawnie wygaszona.
6. **Koszt malowania na mobile** (zgłoszenie Mateusza: „wystrzeliwujący"
   / zacinający się scroll dotykowy na iPhone SE 2020 i Androidach —
   symptom destabilizacji `syncTouch` Lenisa przez zacięcia głównego
   wątku/rasteryzacji). Zdjęte z gałęzi mobilnej (<861px), desktop bez
   zmian: `filter: blur(48px)` na blobach żaru (miękkość daje sam
   radial-gradient; analogia do flatten hero na Androidzie) oraz
   `mix-blend-mode: multiply` na siatce (multiply czystej czerni ==
   zwykłe krycie, a blend wymuszał kompozycję offscreen całej ~2400px
   sekcji). Klatki sweepa mobile wizualnie identyczne. Test A/B na
   telefonie (iPhone SE 2020): produkcja OK, strzela przy portrecie
   → winna była animacja rozmycia w emerge (pkt 7).
7. **Emerge na mobile = crossfade, nie animowany blur.** Rasteryzacja
   `filter: blur(14→0)` klatka po klatce na dużej bitmapie zacinała
   główny wątek dokładnie w momencie wjazdu portretu. Nowa mechanika:
   nakładka `.om-photo-veil` (wypieczony `portrait-blur.webp`,
   `background-size: 100% 100%`) nad ostrym portretem w `.om-photo-frame`;
   emerge animuje wyłącznie opacity (photo 0.08→1, veil 0.55→0) i scale
   ramki (1.07→1) — czysto kompozytowe. Desktop bez zmian (scrub blura
   1:1 z referencją; veil ma tam `display: none` i się nie pobiera).
   No-JS/reduce: veil domyślnie `opacity: 0` → ostry portret.
8. **Mobile: minimalny budżet animacji** (decyzja Mateusza: płynność
   ponad bogactwo animacji). Gałąź mobilna po odchudzeniu:
   ghost i żar W PEŁNI statyczne (CSS `opacity` 0.65/0.55 przy
   `.bl-e1/.bl-e2`; scrub-dryf ghosta usunięty — zero pracy per-tick
   scrolla), reveal = jeden tween `autoAlpha+y` na cały blok (bez kaskady
   per-element; tło finału jedzie razem z blokiem), emerge = wyłącznie
   dwa tweeny opacity (photo+veil, bez scale), wszystko `once: true`
   (po pierwszym pokazaniu nic nie animuje, także przy scrollu w górę —
   celowe odejście od dwukierunkowych reveali referencji). Desktop 1:1
   z referencją, bez zmian.
9. **Podpis portretu (`om-photo-meta`) tylko na mobile.** Na scenie
   desktopowej nachodził na `om-meta` w prawym górnym rogu — decyzja
   Mateusza (2026-07-09): desktop `display: none` + usunięte tweeny
   podpisu z osi desktopowej (odstępstwo od referencji).

## VI. Etapy

1. Skrypt `prepare-about-photo.mjs` + wygenerowanie assetów do
   `src/assets/about/`.
2. Klucze `about.*` w `src/i18n/ui.ts` (PL + EN).
3. `About.astro` — markup + style (base flow → desktop scene → reduce).
4. `about-scroll.ts` — port `o-mnie.js` na moduł (matchMedia desktop/
   mobile, bramka reduced-motion przy imporcie, `ScrollTrigger.refresh()`
   po zbudowaniu).
5. Testy: korekta `sections.spec.ts`, nowy `about.spec.ts`, przebieg
   `pnpm test` (unit/e2e/visual) + zrzuty dla Mateusza.
6. Po akceptacji: baseline'y darwin/linux, propozycja commita, PR.
