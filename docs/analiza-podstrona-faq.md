# Analiza: sekcja „FAQ" jako teaser + podstrona `/faq`

Data: 2026-07-17 · Status: **PLAN WYKONAWCZY** (decyzje domknięte
z Mateuszem 2026-07-17; log wykonawczy będzie w §VII).

## I. Cel

Kolejna iteracja wzorca „sekcja → podstrona" (po Realizacjach, Dla kogo,
Ofercie, O mnie i Kontakcie — najbliższy wzorzec:
`docs/analiza-podstrona-kontakt.md`). Sekcja `#faq` na stronie głównej
staje się **teaserem**: obecny akordeon 6 pytań zostaje bez zmian, pod nim
dochodzi blok „więcej" (nadpis z licznikiem + button „Zobacz wszystkie
pytania") wg referencji `docs/design/faq-button-referencja/`, prowadzący na
NOWĄ podstronę `/faq/` (EN: `/en/faq/`) zbudowaną wg referencji
`docs/design/faq-podstrona-referencja/`: pełny rejestr **30 pytań**
(akordeon z niezależnymi toggle'ami) + **wyszukiwarka 100% frontend**
(filtr live, diakrytyki, podświetlanie, licznik, brak wyników).

## II. Decyzje (ustalone z Mateuszem, 2026-07-17)

| #   | Decyzja                                                                                                                                                                                                                  |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| D1  | Trasy: PL `/faq/`, EN `/en/faq/` (slug wspólny — „FAQ" jest międzynarodowe, wyjątek od tłumaczonych slugów). Stała `FAQ_PATH` w `src/lib/routes.ts`.                                                                      |
| D2  | **Jedno źródło pytań**: nowy `src/i18n/faq.ts` — `faqItems: { q: {pl,en}, a: {pl,en} }[]` (30 pozycji). Pozycje 1–6 = dzisiejsze teksty z `ui.ts` przeniesione 1:1 (klucze `faq.qN`/`faq.aN` wypadają z `ui.ts`); 7–30 = PL z referencji + NOWE tłumaczenia EN (do review przy diffie). Teaser renderuje `slice(0, FAQ_TEASER_COUNT)`, podstrona całość. Zero duplikacji treści. |
| D3  | JSON-LD FAQPage: **pełny (30 pytań) WYŁĄCZNIE na podstronie**; strona główna przestaje emitować JSON-LD (teaser = zajawka, kanoniczne FAQ na podstronie; brak duplikacji schemy między URL-ami).                          |
| D4  | Navbar: pozycja „FAQ" prowadzi wprost na podstronę (`SUBPAGE_PATHS` += `faq: FAQ_PATH`) — wzorzec Dla kogo / O mnie / Kontakt. Na głównej zostaje JEDNA kotwica menu: `#services`. Kotwica `id="faq"` na głównej zostaje (crossfade BLUE + stare linki `/#faq`).       |
| D5  | Teaser: obecny akordeon (6 pytań, jedno otwarte naraz) bez zmian; blok `.fq-more` wchodzi między endline a CTA „Napisz do mnie". Licznik „06 / 30" i nadpis „Pokazano 6 z 30 pytań" LICZONE W ASTRO z danych (`faqItems.length`) — JS licznika z referencji zbędny; z JS zostaje tylko wejście (revealOnce, próg jak CTA). |
| D6  | Podstrona — akordeon z **niezależnymi toggle'ami** (może być otwartych kilka; zamknięcie pytania nad viewportem nie szarpie scrollem — wprost z referencji). `initFaqAccordion` dostaje opcję `exclusive` (główna: `true` — dzisiejsze zachowanie, podstrona: `false`). Ten sam split akordeon (zawsze) / wejścia+tweeny (motion) co na głównej. |
| D7  | Wyszukiwarka = port 1:1 z referencji jako `faq-search.ts` — ładowana ZAWSZE (interakcja jak akordeon: działa też przy reduce), bez zależności od GSAP; `ScrollTrigger.refresh()` po filtrze wpina moduł motion przez callback `onFilter`. Szablony licznika/braku wyników w `data-*` na markupie (i18n zostaje w Astro). Bez JS wyszukiwarka nieaktywna, pełna treść w HTML (fallback SEO jak w referencji). |
| D8  | Tło podstrony: JEDNA statyczna warstwa `AmbientBackground variant="blue"` (tło sekcji FAQ na głównej — `Home.astro` `data-bg="faq"`). Panel `#100B0D`, szew, atmo i mesh z referencji NIE przenoszą się — dokładnie ta sama decyzja co przy porcie sekcji na główną (sekcja przezroczysta nad ambientem). Sticky pasek wyszukiwarki zachowuje ciemne półprzezroczyste tło + blur z referencji (desktop; mobile bez blur — budżet). |
| D9  | Chrome podstrony jak `/kontakt/` (ContactPage.astro): Navbar bez brandu + `langHrefs`, fixed BackButton (`a[data-back]`) w slocie brandu, współdzielony Footer w kontenerze wzorem `.abp-foot`; **`smoothScroll="desktop"`** (Lenis desktop, mobile natywnie — strona z revealami i sticky search, bez pinów). |
| D10 | Hero podstrony wg referencji (chrome „05 / FAQ" + meta, kick, **H1** „pytania i odpowiedzi", lead z linkiem na `/kontakt/`); tryb statyczny bez `body.fq-static` (hak nieużywany w projekcie — jak przy porcie sekcji); bramki: klasa `.js` na rootcie komponentu + media motion. Padding-top hero powiększony względem referencji (navbar fixed) — kadr do oceny przy review diffów.  |
| D11 | Meta (zaakceptowane): PL `FAQ — hadrianm.pl` + „Pytania i odpowiedzi o współpracę: proces, technologie, koszty, marketing i utrzymanie strony. Przeszukaj bazę 30 najczęstszych pytań, a jeśli nie znajdziesz odpowiedzi — napisz do mnie."; EN `FAQ — hadrianm.pl` + „Questions and answers about working with me: process, technology, costs, marketing and website maintenance. Search 30 common questions — and if you can't find your answer, get in touch." |
| D12 | Testy: pełen komplet (§IV); baseline'y darwin DOPIERO po akceptacji diffów → workflow linux → commit darwin na końcu.                                                                                                     |

## III. Architektura

### III.1. Dane: `src/i18n/faq.ts`

`faqItems: { q: Record<Lang, string>; a: Record<Lang, string> }[]` —
wzorzec pól `{pl, en}` jak `navItems`. Słownik `ui.ts` zostaje
strings-only (generyczny test parytetu kluczy działa bez zmian).
Konsumenci: `Faq.astro` (slice 6 + licznik), `FaqFull.astro` (całość +
JSON-LD). Kontrakt liczb pilnowany unit-testem (§IV.1).

### III.2. Teaser (`Faq.astro`, strona główna)

- JSON-LD wypada (D3); pytania z `faqItems` (slice), markup/style/split
  modułów bez zmian.
- Nowy blok po `.fq-endline`, przed `.fq-cta` (port
  `faq-button-referencja`): `.fq-more` (nadpis `.lead` + link `.fq-all`
  z licznikiem `.count`, labelem i strzałką) → `FAQ_PATH[lang]`.
  Tokeny: `--ink/--faint/--line/--accent` + `var(--font-mono)`; hover
  (ramka akcent, tło, strzałka +6 px) i mobile (<861 px: mniejsze
  paddingi/label) 1:1 z referencji.
- Wejście: stan startowy w CSS za `.fq.js` + motion media (fade-up 18 px),
  klasa `.on` z `revealOnce(more, FAQ_CTA_START)` w `faq-scroll.ts`.
  No-JS / reduce: blok od razu widoczny.

### III.3. Podstrona

| Plik                                          | Rola                                                                                                                                                              |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/components/sections/faq/FaqFull.astro`   | Treść podstrony (port `faq-podstrona-referencja`): root `.fqf` z inline skryptem `.js`; hero (ghost, chrome, H1, lead) + `<section id="faq">` (wyszukiwarka sticky, rejestr 30 pozycji `aria-expanded="true"` w markupie, endline, brak wyników, CTA) + JSON-LD FAQPage (30). Style scoped na klasach `fq-*` (rejestr = wartości z sekcji głównej; hero/search wg referencji, tokeny projektu). |
| `src/components/sections/faq/faq-search.ts`   | Wyszukiwarka (D7): `norm()` diakrytyki 1:1 znak-w-znak, `esc()` XSS-safe, `highlight()` `<mark class="fq-hl">`, licznik `aria-live`, czyszczenie ×/Esc, `#fq-noresults` + chowanie `#fq-endline`; dodaje `.on` odsłoniętym wierszom (batch mógł ich jeszcze nie odsłonić); opcjonalny `onFilter`. |
| `src/components/sections/faq/faq-animator.ts` | Wspólna fabryka animatora wysokości (tween GSAP `height 0 ↔ auto` + `clearProps` + `refresh`) — dziś inline w `faq-scroll.ts`; wyciągnięta, żeby moduł podstrony jej nie duplikował. Importowana WYŁĄCZNIE z modułów motion (gsap poza bundle'em reduce). |
| `src/components/sections/faq/faq-page-scroll.ts` | Choreografia podstrony (motion): hero reveal od razu (rAF), rejestr `ScrollTrigger.batch` (`FAQ_BATCH_START`, stagger `--d` = `FAQ_BATCH_STAGGER`), CTA `revealOnce`, parallax ghosta desktop (`FAQ_PAGE_GHOST_PARALLAX`, scrub); inicjuje akordeon (animator, `exclusive: false`) i search (`onFilter: refresh`). |
| `src/components/FaqPage.astro`                | Chrome strony (lustro `ContactPage.astro`): ambient **blue**, Navbar bez brandu, fixed BackButton, Footer; klasy `fqp-bg` / `fqp-back` / `fqp-foot`; `smoothScroll="desktop"`, `alternates={FAQ_PATH}`.                     |
| `src/pages/faq.astro`                         | `<FaqPage lang="pl" />`                                                                                                                                            |
| `src/pages/en/faq.astro`                      | `<FaqPage lang="en" />`                                                                                                                                            |

Skrypt `FaqFull.astro` (wzorzec `Faq.astro`): inline `.js` bezwarunkowy
(warunkowy inline w JSX wywala parser — gotcha dla-kogo §VII); bramka
motion: `import("./faq-page-scroll")`, gałąź reduce: `initFaqAccordion`
(`exclusive: false`, bez animatora) + `initFaqSearch` (bez `onFilter`).

### III.4. Konfig i zmiany w istniejących plikach

- `faq-config.ts`: `FAQ_ITEM_COUNT` → **`FAQ_TEASER_COUNT = 6`** (nazwa
  odzwierciedla nową rolę; kontrakt markup teasera ↔ stagger nth-child
  1..6 w CSS) + nowe stałe podstrony: `FAQ_BATCH_START = "top 94%"`,
  `FAQ_BATCH_STAGGER = 0.05`, `FAQ_PAGE_GHOST_PARALLAX = [-30, 46]`
  (wartości „zamrożone" z referencji). Tweeny akordeonu wspólne
  (`FAQ_OPEN_DUR`/`FAQ_CLOSE_DUR`).
- `faq-accordion.ts`: opcja `exclusive` (default `true` — zachowanie
  główniej bez zmian).
- `faq-scroll.ts`: animator z `faq-animator.ts`; `revealOnce` dla
  `.fq-more`.
- `src/lib/routes.ts` — `FAQ_PATH = { pl: "/faq/", en: "/en/faq/" }`.
- `src/i18n/ui.ts` — wypadają `faq.q1–6`/`faq.a1–6`; dochodzą:
  `faq.moreLead` („Pokazano {shown} z {total} pytań"), `faq.moreLabel`
  („Zobacz wszystkie pytania"), `faqPage.title/description` (D11),
  `faqPage.back`, `faqPage.meta` („Baza wiedzy — {total} pytań"),
  `faqPage.kick` („Wszystko, o co pytają klienci"), `faqPage.lead*`
  (lead + pytanie + link — link reużywa `faq.ctaLink`), klucze
  wyszukiwarki: `faqPage.searchPh`, `faqPage.searchClear`,
  `faqPage.countAll` („{total} pytań"), `faqPage.countFiltered`
  („{n} z {total} pytań"), `faqPage.nores*`. Nagłówek podstrony reużywa
  `faq.headLead`/`faq.headAccent`; CTA dołu reużywa `faq.ctaMono`/
  `faq.ctaLink`.
- `src/components/navbar/Navbar.astro` — `SUBPAGE_PATHS` += `faq` (D4).

## IV. Testy (kontrakt `.claude/rules/testing.md`)

1. **Unit** — `faq-config.test.ts` do nowego źródła BEZ osłabiania:
   `FAQ_TEASER_COUNT === 6` (kontrakt stagger CSS), `faqItems.length ===
   30` (docelowa liczba wg referencji), każdy wpis ma niepuste `q.pl/en`
   i `a.pl/en`; stałe batcha/parallaxu podstrony. Parytet reszty kluczy
   i18n łapie generyczny `i18n.test.ts` (bez zmian).
2. **E2E**:
   - nowy `faq-index.spec.ts` (lustro `contact-index.spec.ts`):
     meta/canonical/hreflang obu wersji, 30 pozycji rejestru + H1 +
     wyszukiwarka w DOM, JSON-LD FAQPage z 30 pytaniami NA podstronie
     i NIEOBECNY na głównej (D3), navbar (aria-current, kotwica
     `#services` → główna, przełącznik języka), BackButton (fixed po
     scrollu + history.back), zero błędów konsoli/404; **teaser na
     głównej**: 6 pytań, blok `.fq-more` (licznik „06 / 30") i klik →
     `/faq/`.
   - `faq.spec.ts` — zostaje dla teasera (akordeon 6, CTA → `/kontakt/`,
     no-JS, EN, reduce); test JSON-LD przechodzi na podstronę (w
     faq-index); DOCHODZĄ describe'y podstrony: akordeon niezależny
     (dwa otwarte naraz), wyszukiwarka (filtr, diakrytyki `moge`→„mogę",
     licznik, brak wyników + ukryty endline, czyszczenie ×/Esc),
     reduce przez `contextOptions` (akordeon + search działają bez
     animacji), no-JS (30 pytań rozwiniętych, search nieaktywny).
   - `navigation.spec.ts` — mobilny test kotwicy przesiada się z `#faq`
     na `#services` (ostatnia kotwica); dochodzi „pozycja FAQ nawiguje
     na podstronę" (wzorzec Kontaktu).
3. **Visual** — istniejący sweep `faq.spec.ts` (teaser) bez zmian
   w kodzie: klatka `04-cta` złapie blok „więcej" (zamierzony diff).
   Nowy `tests/visual/faq-index.spec.ts` (wzorzec
   `contact-index.spec.ts`) ×6 profili: widok startowy (hero),
   rejestr z otwartym pytaniem, wyszukiwarka z wpisaną frazą
   (podświetlenia + licznik), stopka.
4. **a11y** — `a11y.spec.ts`: ścieżki += `/faq/`, `/en/faq/`; ratchet
   bez nowych wpisów.
5. **Baseline'y** — zmienią się: `faq-04-cta` ×3 (blok więcej),
   `section-contact` ×6 i ewent. inne sekcje poniżej FAQ na głównej
   (sekcja wyższa o blok → subpikselowy ghosting, znane zjawisko);
   NOWE zrzuty podstrony ×6 profili (auto-zapis Playwrighta usunąć —
   generacja zatwierdzonym `pnpm test:visual:update`). Procedura: kod →
   inwentaryzacja diffów → akceptacja Mateusza → darwin → workflow
   linux → commit darwin NA KOŃCU.

## V. Etapy

1. **Fundament**: `src/i18n/faq.ts` (30 pozycji, EN 7–30 nowe),
   `routes.ts` (`FAQ_PATH`), klucze i18n, `faq-config.ts`.
2. **Teaser**: `Faq.astro` (dane z `faqItems`, JSON-LD out, blok
   `.fq-more`), `faq-scroll.ts` (reveal bloku).
3. **Podstrona**: `FaqFull.astro`, `faq-search.ts`, `faq-animator.ts`,
   `faq-page-scroll.ts`, `faq-accordion.ts` (opcja `exclusive`),
   `FaqPage.astro`, `pages/faq.astro`, `pages/en/faq.astro`.
4. **Nawigacja**: `Navbar.astro` (`SUBPAGE_PATHS` += faq).
5. **Testy**: §IV.
6. **Weryfikacja**: `pnpm typecheck` → `test:unit` → `build` → pełne
   `test:e2e` → `test:visual` jako inwentaryzacja diffów (raport, bez
   commitowania baseline'ów) → `/code-review` na diffie.

## VI. Ryzyka / gotchas

- **Tłumaczenia EN pytań 7–30** — nowa treść (referencja jest tylko PL);
  do przeglądu Mateusza przy review diffów (nazewnictwo pakietów jak
  w istniejących: Start / Image / Business).
- **Wysokość strony przy filtrze/akordeonie** — `ScrollTrigger.refresh()`
  po open/close i po `applyFilter()` (Lenis desktop sam nadąża); przy
  reduce nie ma triggerów, refresh zbędny.
- **Sticky search a navbar** — search `top: 0` podjeżdża pod fixed
  navbar; navbar chowa się przy scrollu w dół, więc kolizja tylko
  chwilowa przy scrollu w górę — ocena przy review diffów (ewentualnie
  `top` pod wysokość paska).
- **Wyszukiwarka a wejścia batch** — elementy odfiltrowane i przywrócone
  dostają `.on` w `applyFilter` (bez tego wiersze poniżej progu batcha
  byłyby niewidoczne po filtrze).
- **Inline script w JSX nie może być warunkowy**; BackButton przez
  wrapper; kontener stopki wzorem `.abp-foot`; WebKit-emulacja nie
  raportuje `maxTouchPoints` (bramki dotyku testować na pixel-5);
  skok paska URL na mobile ZAAKCEPTOWANY; „wstecz" = `a[data-back]`
  (bfcache/pageshow już w `smooth-scroll.ts` — nie dublować).
- **Auto-zapis snapshotów** przy nowym specu visual — usunąć pierwszy
  przebieg; baseline'y wyłącznie zatwierdzonym updatem.
- **`FAQ_ITEM_COUNT` → `FAQ_TEASER_COUNT`** — jedyny konsument poza
  testami to komentarz w `Faq.astro`; testy aktualizowane w tym samym PR.

## VII. Log wykonawczy (2026-07-17)

Etapy 1–5 wdrożone zgodnie z planem. Korekty wykonawcze:

- **Parallax ghosta hero podstrony** pisany wprost w `faq-page-scroll.ts`
  zamiast helperem `ghostParallax` — helper startuje scrub od
  `top bottom`, a hero zaczyna się u szczytu strony, więc jazda ruszałaby
  od połowy; osie referencji to `top top → bottom top`.
- **Fraza testowa wyszukiwarki = „faktur"** (jedyna pozycja 27): pierwotne
  „rodo" łapało też „środowisk" → „srodowisk" (odpowiedź 13) — fraza
  testowa musi być unikalna PO normalizacji diakrytyków. Poprawione
  w e2e i specu wizualnym.

Wyniki weryfikacji (Etap 6, przed baseline'ami):

- typecheck / lint / unit: zielone (74 testy, w tym nowe kontrakty
  `faqItems`); build: 18 stron (doszły `/faq/` i `/en/faq/`).
- e2e: pełna suita **601 pass, 0 fail** (pierwszy przebieg: 583/18 —
  wszystkie 18 to fraza „rodo" wyżej).
Poprawki z code-review (8 naprawionych, 2 świadomie odłożone):

- `faq-search.ts`: refresh ScrollTriggera tylko przy realnej zmianie
  widoczności wierszy + cache `lastNq` (bez 30 przebudów innerHTML na
  znak); `.on` tylko przy aktywnej frazie (pusta fraza nie wyłącza
  choreografii batcha); cudzysłowy komunikatu braku wyników przeniesione
  do i18n (EN dostawał polską typografię); `esc()` → współdzielony
  `escapeHtml` z `@/lib/contact-form`.
- **Kolizja BackButton ↔ przyklejona wyszukiwarka na mobile** (kółko
  20–66 px nachodziło na pole od x=26): sonda `.fq-sticky-probe`
  (IntersectionObserver, bez GSAP) → klasa `is-stuck` na wrapie, mobile
  `padding-left: 84px` z przejściem; zweryfikowane sondą na buildzie.
- `ghostParallax` dostał opcjonalny parametr `start` — moduł podstrony
  woła helper zamiast trzymać kopię (zakaz z sections.md).
- Reguła FAQ w `.claude/rules/sections.md` przepisana pod nowy kształt
  (jedno źródło, dwie powierzchnie, moduły z bramkami, JSON-LD tylko na
  podstronie).
- Testy/CSS: regex licznika z `faqItems.length` zamiast literału 30,
  `answerHeight` przez wspólny `boxHeight`, jeden `pad()`, wspólny blok
  wejścia more+CTA, usunięty no-op `color` w hoverze; kadry visual
  podstrony jawnym `scrollPageTo` (anty „Lenis desync").
- ODŁOŻONE (decyzje Mateusza przy review diffów): navbar wracający przy
  scrollu w górę nakłada się na przyklejoną wyszukiwarkę (desktop
  861–1280, §VI — offset vs akceptacja); duplikacja markup/CSS wierszy
  akordeonu teaser↔podstrona (świadomy trade-off dwóch komponentów).

- visual: **32 faile — W CAŁOŚCI oczekiwane kategorie**:
  1. `faq-index-{top,open-q3,search,footer}` ×6 profili — NOWE zrzuty
     podstrony (auto-zapis Playwrighta usunięty, powstaną przy
     zatwierdzonym `pnpm test:visual:update`);
  2. sweep FAQ na głównej: `faq-04-cta` ×3 profile (nowy blok „więcej"
     w kadrze; chromium-1920 dodatkowo `02-list-closed` i `05-hover-q2`
     ratio 0.01 — wysoki kadr desktopowy łapie blok na dole ramki);
  3. `section-contact` ×5 profili (ratio 0.01–0.02) — subpikselowy
     ghosting sekcji poniżej wyższego FAQ (znane zjawisko, memory
     `audience-section`); pixel-5 przeszedł dzięki progowi 0.02.
