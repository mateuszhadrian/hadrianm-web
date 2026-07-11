# Analiza wykonawcza — sekcja „FAQ" (05)

> Port referencji `docs/design/faq-referencja/` (wariant A „Rejestr") do
> projektu. Dokument krótki celowo: referencja ma wyczerpujące README,
> tutaj wyłącznie decyzje ADAPTACJI do projektu i plan etapów.
> Ustalenia z Mateuszem: 2026-07-11.

## I. Co budujemy

Samodzielna sekcja-panel `#faq` (nav: **05 / FAQ**) między „O mnie"
a „Kontakt": cieplejsza czerń `#100B0D` na tle strony, szew hairline
+ gasnąca poświata akcentu, chrome (tag, meta, ghost „FAQ"), nagłówek
z serifowym gradientem, rejestr 6 pytań (akordeon, jedno otwarte naraz,
wszystkie zamknięte na starcie), CTA „Napisz do mnie" → `#contact`.
Desktop ≥861px + wersja lekka mobile; PL i EN (tłumaczenia własne,
nazwy pakietów spójne z Ofertą EN: „Start", „Image").

## II. Decyzje portu (delta względem referencji)

1. **Architektura skryptów — split akordeon/wejścia.** Referencyjny
   `faq.js` robi wszystko w jednym pliku; w projekcie moduły animacji
   ładują się dynamicznie tylko przy `prefers-reduced-motion:
   no-preference` (wzorzec Audience/Services/About). Akordeon MUSI
   działać także przy reduce, więc:
   - `faq-accordion.ts` — czysta logika akordeonu (jedno otwarte,
     klasy `.open`, `aria-expanded`), bez GSAP; przyjmuje opcjonalny
     „animator" wysokości. Ładowana zawsze (bundle sekcji).
   - `faq-scroll.ts` — moduł dynamiczny (motion OK): wejścia
     (3× ScrollTrigger `once` → klasy `.on`), parallax ghosta (desktop,
     `gsap.matchMedia`), ORAZ animator akordeonu (tween `height 0↔auto`,
     `clearProps`, `ScrollTrigger.refresh()` po open/close — kontrakt
     z Lenisem i triggerami sekcji niżej).
   - Przy reduce: `Faq.astro` podpina akordeon bez animatora — klik
     przełącza klasy, wysokość skacze przez CSS (`height 0 ↔ auto`),
     zero GSAP w bundle'u. `ScrollTrigger.refresh()` niepotrzebny —
     przy reduce żadna sekcja nie tworzy triggerów.
2. **Reduce-motion = „wygląda jak w referencji, nie animuje się"**
   (wymaganie Mateusza, także mobile): treść widoczna od razu (stany
   startowe wejść bramkowane `@media (prefers-reduced-motion:
   no-preference)`), pytania zamknięte na starcie, otwieranie
   natychmiastowe. Bez JS: wszystko rozwinięte (markup startuje
   z `aria-expanded="true"`, init zamyka) — fallback SEO.
3. **Klasa `.js` NA SEKCJI** (inline `document.currentScript.closest`),
   nie `body.js` z referencji — konwencja projektu. Selektory CSS
   `.fq.js …` zamiast `body.js …`.
4. **Bez haka `fq-static`** — ta sama decyzja co `of-static` w Ofercie
   (globalny mechanizm low-power nie istnieje; hook byłby martwym kodem).
5. **Tokeny projektu zamiast `:root` referencji**: `--ink/--muted/
   --faint/--line/--accent/--accent-gradient/--font-*` z `global.css`;
   lokalnie w sekcji tylko wartości specyficzne (panel `#100B0D`, szew,
   mgła). Mono = `--font-mono` (systemowy — świadoma konwencja projektu,
   nie Space Mono z referencji; tak wyglądają już kickery Oferty/O mnie).
6. **Budżet GPU mobile jak w Ofercie**: `filter: blur(48px)` blobów
   i `mix-blend-mode` mesha TYLKO ≥861px (na telefonach miękkość daje
   sam radial-gradient) — referencja trzyma blur zawsze, projekt nie.
7. **Kotwica CTA → `#contact`** (nie `#kontakt`): skok wzorcem Oferty
   (Lenis `immediate` + `history.replaceState`, fallback natywny).
8. **JSON-LD `FAQPage`** (schema.org) generowany w `Faq.astro` z tych
   samych danych i18n co markup — per język, zero duplikacji treści.
   Delta vs referencja (tam brak — plik statyczny bez frontmattera).
9. **Treści**: PL z referencji z drobną redakcją (typografia „…",
   neutralne płciowo CTA); EN — tłumaczenie własne, ton jak istniejące
   sekcje EN. Klucze `faq.*` w `src/i18n/ui.ts`.
10. **Stałe osi** w `faq-config.ts` (kontrakt moduł ↔ style ↔ testy):
    breakpoint 861, open 0.55s/close 0.45s, progi `top 84%/80%/92%`,
    parallax ghosta −34→+44px, 6 pozycji.

## III. Plan etapów

1. `docs/` — ten dokument + wpis w `docs/README.md`. ✅
2. `src/i18n/ui.ts` — klucze `faq.*` PL/EN (kontrakt parzystości pilnuje
   `tests/unit/i18n.test.ts` generycznie).
3. `src/components/sections/faq/`: `Faq.astro` (markup + scoped CSS
   + JSON-LD + bramka skryptów), `faq-config.ts`, `faq-accordion.ts`,
   `faq-scroll.ts`.
4. Testy:
   - `tests/e2e/faq.spec.ts` — akordeon (jedno otwarte naraz, toggle),
     `aria-expanded`, fallback bez JS (wszystko rozwinięte), EN,
     CTA → `#contact`, zachowanie przy reduce (patrz §IV).
   - `tests/visual/faq.spec.ts` — 3 profile (wzorzec sweepów sekcji):
     klatki „rejestr zamknięty po wejściu", „pytanie 03 otwarte",
     desktop dodatkowo „hover na wierszu". `freeze.css` zeruje
     transitions → stany `.on` siadają natychmiast (klatka „w połowie
     staggera" z checklisty referencji jest niedeterministyczna — pomijamy).
   - `tests/visual/sections.spec.ts` — `#faq` wypada z listy sekcji
     „stabilnych" (ma własny sweep, wzorzec jak services/about);
     stare baseline'y `section-faq*` do usunięcia przy aktualizacji
     baseline'ów (workflow linux → darwin na końcu, za zgodą).
5. Weryfikacja: `pnpm test:unit` + `pnpm test:e2e` + `pnpm build
   && pnpm test:visual` (nowe baseline'y wg procedury z CI-ordering);
   a11y w ramach `a11y.spec.ts` (ratchet — bez nowych wpisów).

## IV. Odstępstwo testowe do decyzji

Kontrakt testów zakazuje emulacji `prefers-reduced-motion: reduce`
(bramka w BaseLayout = testy „przechodzą" na martwej stronie). Akordeon
przy reduce to jednak ŻYWA interakcja (ładowana poza bramką) — test
z `test.use({ reducedMotion: "reduce" })` asertujący, że klik OTWIERA
odpowiedź, na martwej stronie by NIE przeszedł. Dodany jako osobny
`describe` z komentarzem; jeśli Mateusz uzna literę reguły za ważniejszą —
do wycięcia jednym blokiem.

## V. Czego emulacja nie wykryje (fizyczne urządzenie)

Jak przy Ofercie: feel syncTouch przy tweenie wysokości akordeonu
(zmiana wysokości strony pod palcem) i zachowanie przy zwijanym
toolbarze iOS. Po wdrożeniu poprosić o przeklik na telefonie:
otwieranie/zamykanie pytań podczas scrolla, brak skoków strony.
