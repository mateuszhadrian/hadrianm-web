# Analiza — podstrona `/realizacje` (pełna galeria realizacji)

Data: 2026-07-16 · Branch: `feat/realizacje-subpage-init`
Referencja wizualna: `docs/design/RealizacjeGaleria.astro` (prototyp 1:1,
motyw „Czerwona Mgła").

## 1. Cel

Strona główna pokazuje w `#work` maksymalnie 3 realizacje; przyciski
„Więcej realizacji" (kafel desktop + slajd karuzeli mobile) były dotąd
placeholderem (`href="#"` + `preventDefault`). Powstaje podstrona z pełną
listą realizacji z kolekcji `realizacje` (Content Collections), w dwóch
wersjach językowych, wyglądająca i zachowująca się jak referencja, ale
osadzona w tokenach/komponentach/danych projektu.

## 2. Decyzje (ustalone z Mateuszem 2026-07-16)

| #   | Temat                | Decyzja                                                                                                                                                                                    |
| --- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| D1  | Scroll               | **W pełni natywny — bez Lenisa.** Podstrona nie ma animacji scrollowych (GSAP/ScrollTrigger), więc Lenis nic nie wnosi, a gałąź `syncTouch` to najbardziej kruchy element projektu. Bramka: prop `smoothScroll` w `BaseLayout` (domyślnie `true` — strona główna bez zmian). |
| D2  | Klik w kartę         | **Identycznie jak na stronie głównej**: Modal (>760 px) / BottomSheet (≤760 px) z `WorkDetail`, przez współdzielone `open-detail.ts` + `overlay.ts`. Bez podstron per-slug (ewentualny przyszły etap). |
| D3  | Navbar               | **Ten sam Navbar co na stronie głównej.** Docelowa migracja linków na podstrony to osobny etap; teraz zmienia się tylko link „Realizacje" → podstrona (globalnie, także na stronie głównej). Na podstronie kotwice sekcji prowadzą na stronę główną (`/#id`, `/en/#id`). |
| D4  | Tło                  | **Jedna statyczna warstwa `AmbientBackground` wariant `blue`** (jak `#work` na stronie głównej), bez mechanizmu crossfade. Mobile dostaje wypieczoną teksturę WebP (mechanika komponentu). |
| D5  | URL EN               | `/realizacje/` (PL) ↔ **`/en/projects/`** (EN) — tłumaczony slug, spójnie z `polityka-prywatnosci` ↔ `privacy-policy`. Ścieżki w jednym miejscu: `src/lib/routes.ts`. |
| D6  | Copy nagłówka        | **„wybrane realizacje"** jak w referencji (lista będzie kuratorowana — nie wszystkie zlecenia trafią na stronę). |
| D7  | Kafel-ghost          | **Zostaje** („Kolejne realizacje wkrótce" / „More projects coming soon"). |
| D8  | Media karty          | Ekran `home` (fallback: pierwszy) z pola `screens` wpisu CMS, renderowany **reużytym `WorkDeviceDuo`** (geometria identyczna z referencją; szerokość sterowana zmienną per-breakpoint siatki) + `imgAt()`. |
| D9  | Testy                | W tym PR: **e2e** (nowy spec podstrony + aktualizacja navigation/a11y). **Baseline'y wizualne dopiero po akceptacji wyglądu** (osobny krok: spec + `pnpm test:visual:update` + workflow linux). |
| D10 | SEO                  | `BaseLayout` dostaje opcjonalne `description` i `alternates` (hreflang); podstrona ustawia tytuł, opis i parę PL↔EN. Sitemap łapie nowe strony automatycznie (`@astrojs/sitemap`). |
| D11 | Animacje wejścia     | **Brak** — jak w referencji tylko hovery CSS (z gałęzią `prefers-reduced-motion: reduce`). Zero JS animacyjnego. |
| D12 | Back button          | Okrągły przycisk „wstecz" wg `docs/design/BackButton.astro` (`src/components/ui/BackButton.astro`), na desktopie i mobile **w miejscu brandu** (`Navbar showBrand={false}`). Renderowany POZA barem navbara jako element `fixed` — nigdy nie chowa się razem z paskiem przy scrollu. Zachowanie = wstecz przeglądarki: globalny mechanizm `a[data-back]` (`scripts/back-link.ts`), fallback `href` → strona główna danego języka. |

## 3. Decyzje wykonawcze (porządkowe)

- **Breakpointy siatki: 761 px / 1024 px** (referencja: 768/1024). Świadome
  przesunięcie o 8 px: 761 px to istniejący próg całej sekcji work
  (`sheetMQ = max-width: 760px` wybiera Modal↔BottomSheet). Dzięki temu układ
  „karty w panelu" (mobile) zawsze idzie w parze z BottomSheetem, a układ
  siatkowy z Modalem — bez strefy niespójności 761–768 px.
- Szerokość duetu (`--lw` referencji): mobile 250 px → ≥761 px 300 px →
  ≥1024 px 334 px, przez nadpisanie `--lap-w` na `:global(.wd)` w karcie.
- Karty to `<button data-work-slug>` (jak `WorkCard` na stronie głównej) —
  nie linki, bo celem jest nakładka, nie nawigacja.
- Navbar: `handleAnchorClick` przechwytuje tylko `href` zaczynające się od
  `#` — pełne ścieżki (`/#services`, `/realizacje/`) przechodzą natywnie,
  więc jedyne potrzebne zmiany to (a) budowa href-ów zależna od strony,
  (b) brand przechwytuje klik **tylko gdy już jest na stronie docelowej**
  (na podstronie ma nawigować do domu, nie scrollować do góry),
  (c) parametryzowane linki przełącznika języka (podstrona ↔ podstrona).
- Nagłówek podstrony reużywa istniejące klucze `work.eyebrow` / `work.intro`;
  nowe klucze tylko tam, gdzie treść jest inna (`workPage.*`: tytuł strony,
  description, headline, ghost).
- Footer: **współdzielony `src/components/Footer.astro`** — wyodrębniony
  z finału sekcji Kontakt (© / social media / polityka + „Do góry", klasy
  `ft-*`); Contact wchłania go jak dotąd (`:global(.ft)` dla choreografii
  wejścia), podstrona owija kontenerem `.wix-foot`. Docelowo ten sam footer
  na każdej podstronie. „Do góry" ma własny skrypt w komponencie
  (`scrollToAnchor` — Lenis gdy jest, inaczej natywnie).
- `WorkMoreButton` traci skrypt-placeholder (`preventDefault` przy `href="#"`)
  — przyciski dostają realny adres z `routes.ts`.

## 4. Etapy

1. **Analiza** (ten dokument) + wpis w `docs/README.md`. ✅
2. **Fundament**: `src/lib/routes.ts`; `BaseLayout` — props `smoothScroll`,
   `description`, `alternates`; klucze `workPage.*` w `src/i18n/ui.ts`.
3. **Navbar**: href-y zależne od strony, link Realizacje → podstrona,
   brand-guard, parametryzowany przełącznik języka.
4. **Podstrona**: `WorkIndexCard.astro` (karta siatki wg referencji),
   `WorkIndexPage.astro` (Navbar + ambient blue + header + grid + ghost +
   templates/Modal/BottomSheet + footer), strony
   `src/pages/realizacje.astro` i `src/pages/en/projects.astro`.
5. **Podpięcie**: `Work.astro` przekazuje realne `moreHref`; sprzątnięcie
   placeholdera w `WorkMoreButton`.
6. **Testy e2e**: nowy `tests/e2e/work-index.spec.ts`; aktualizacja
   `navigation.spec.ts` (kotwica testowana na `#about`, nowy test linku
   Realizacje) i `a11y.spec.ts` (skan obu nowych ścieżek).
7. **Weryfikacja**: `format:check` → `lint` → `typecheck` → `test:unit` →
   `build` → `test:e2e`.
8. **Po akceptacji wyglądu** (Mateusz zaakceptował 2026-07-16): spec
   wizualny `tests/visual/work-index.spec.ts` (3 zrzuty × 6 profili:
   widok startowy / siatka / stopka; próg 0.02 dla siatki na pixel-5 —
   ta sama rodzina jittera co #contact) + baseline'y darwin wygenerowane;
   komplet linuksowy przez workflow `update-visual-baselines.yml`
   (kolejność commitów: kod → workflow linux → darwin NA KOŃCU).

## 6. Znane, zaakceptowane ograniczenie (decyzja 2026-07-16)

Na podstronie (natywny scroll) mobilny pasek URL chowa się i pokazuje przy
scrollu, a warstwa ambientu (`fixed; inset: 0`, tekstura `cover`) skacze
przy zmianie wysokości viewportu. Na stronie głównej efektu nie ma, bo
Lenis `syncTouch` preventDefaultuje gest i pasek nigdy się nie zwija.
Rozważone naprawy: (A) włączyć Lenisa na podstronie, (B) `100lvh` na
warstwie tła + padding bez `vh`. **Decyzja Mateusza: zostawić jak jest** —
świadomy trade-off za natywny scroll; wrócić do (B), gdyby zaczęło
przeszkadzać.

## 5. Czego ten etap NIE robi

- Nie przenosi pozostałych linków navbara na podstrony (osobny etap).
- Nie tworzy podstron szczegółów `/realizacje/[slug]`.
- Nie dodaje baseline'ów wizualnych (D9).
- Nie zmienia schematu CMS ani danych `src/content/realizacje/*.json`.
