# Realizacje — karuzela mobile + przycisk „Więcej realizacji" (plan wykonawczy)

> **Status:** plan wykonawczy. Design/behawior z pakietu referencyjnego
> `docs/design/Karuzela Mobile - referencja/` (podgląd HTML + komponenty
> `.rz-*`) oraz `docs/design/WiecejRealizacjiDesktopButton.astro`. Referencje
> to WYŁĄCZNIE wzorzec wizualny/behawioralny — wpinamy je w istniejące
> fundamenty projektu (Content Collections, `imgAt`, `overlay.ts`, tokeny
> `global.css`, i18n, próg 760 px). Ustalenia potwierdzone z Mateuszem
> (12 pytań, 2026-07-14).

## Cel

- **Desktop (≥761 px) bez zmian** w układzie kart (`WorkCard` naprzemienny,
  klik → `Modal`). Dochodzi POD galerią wyśrodkowany przycisk „Więcej
  realizacji" w stylu kafla (`WiecejRealizacjiDesktopButton.astro`).
- **Mobile (≤760 px) → pozioma karuzela**: karty ze snapowaniem + „peek"
  następnej, kropki, boczne strzałki (znikają na krańcach), a na końcu kafel
  CTA „Więcej realizacji" (ostatni slajd). Tap w kartę → istniejący
  `BottomSheet` z `WorkDetail`.
- **Przycisk „Więcej" (desktop i mobile) na razie donikąd** — `<a href="#">`
  z `preventDefault` (placeholder pod przyszłą podstronę `/realizacje`).
- Strona główna pokazuje **tylko pierwsze 3** realizacje (`slice(0,3)` po
  `order`) — reszta docelowo na podstronie.
- **Reduced-motion na mobile**: wygląd jak referencja, zero animacji
  (przejścia/transformy/smooth-scroll off), karuzela nadal używalna.

## Decyzje portu (potwierdzone)

1. **Bottom sheet**: reużywamy `BottomSheet` + `overlay.ts` + `WorkDetail`
   (focus-trap, Esc, drag-to-dismiss, blokada Lenisa) — NIE port
   `RealizacjaSheet` z referencji.
2. **Urządzenia**: `WorkDeviceDuo` (czysty CSS + `imgAt()` transformacje),
   NIE `DeviceDuo` z referencji (skalowanie JS-em, surowe `<img>`).
3. **„Więcej"**: `<a href="#">` + `preventDefault` (gotowe do podmiany `href`).
4. **Limit 3**: `projects.slice(0, 3)` w `Work.astro`.
5. **Kafel „coming soon"** USUNIĘTY ze strony głównej (+ parametr
   `showComingSoonTile` z `src/config/site.ts`; sam plik zostaje pod przyszłe
   parametry). i18n `work.soon` usunięte.
6. **„Więcej" na mobile**: tylko jako ostatni slajd karuzeli (nie pod spodem).
7. **Tło „Czerwona Mgła"**: całkowicie zignorowane — globalny
   `AmbientBackground` jak w reszcie strony.
8. **Tap vs swipe**: cała karta klikalna; próg ruchu (>10 px w poziomie =
   swipe, nie otwieraj) + zachowany „scroll-momentum guard".
9. **Nawigacja**: strzałki boczne + kropki (obie).
10. **Karta karuzeli**: bez tagów (kategoria·rok, nazwa, 2-liniowy blurb, CTA).
11. **Pliki**: nowe komponenty w `src/components/sections/work/`.
12. **Testy**: implementacja → diff wizualny do akceptacji → dopiero
    regeneracja baseline'ów (darwin + linux, jeden PR) + e2e.

## Mapowanie tokenów (referencja → projekt)

| referencja | projekt |
| --- | --- |
| `--rz-ink #F5F0EC` | `--ink` |
| `--rz-muted 0.58` | `--muted` |
| `--rz-line 0.14` | `--line` |
| `--rz-accent #E3BE7F` | `--accent-gold` |
| `--rz-glow rgba(...,.20)` | `rgba(var(--accent-gold-rgb),.2)` |
| serif gradient tytułu | `--accent-gradient` |

Kolizja nazw: desktop `WorkCard` używa scoped `.rz-card`. Karuzela dostaje
własny namespace **`.wk-car*`**, żeby nic nie mieszać (style i tak scoped).

## Architektura

Nowe pliki (`src/components/sections/work/`):

- `WorkMoreButton.astro` — wspólne CTA, prop `variant: "tile" | "slide"`
  (`tile` = kafel pod galerią desktop; `slide` = ostatni slajd karuzeli),
  placeholder `href="#"` + `data-work-more` (JS `preventDefault`).
- `WorkCarouselCard.astro` — kompaktowa karta mobile (`WorkDeviceDuo`),
  `data-work-slug` / `data-work-name`, `<button>` z aria-label.
- `WorkCarousel.astro` — viewport + track (snap+peek) + kropki + strzałki +
  slajd `WorkMoreButton variant="slide"` + inline `<script>` (idx/kropki/
  strzałki + tap-vs-swipe → `openWorkDetail`).
- `open-detail.ts` — współdzielony helper: klonuje `<template
  data-work-detail>` do hosta nakładki i woła `window.overlay.open` (id z
  `matchMedia(760)`). Używany przez `Work.astro` (desktop→modal) i
  `WorkCarousel` (mobile→sheet).

Zmiany:

- `Work.astro` — usuń kafel coming-soon; `slice(0,3)`; owiń galerię +
  `WorkMoreButton variant="tile"` w `.work__desktop` (hidden ≤760);
  dodaj `WorkCarousel` (hidden ≥761); skrypt galerii → `openWorkDetail`
  (desktop modal); `<template>`/`Modal`/`BottomSheet` bez zmian.
- `src/config/site.ts` — usuń `showComingSoonTile` (plik zostaje).
- `src/i18n/ui.ts` — dodaj `work.more`, `work.moreBig`, `work.moreSub`,
  `work.prev`, `work.next`, `work.goto` (PL+EN); usuń `work.soon`.

## Etapy

1. **Docs + config + i18n** — ten plik; `site.ts`; stringi i18n.
2. **`WorkMoreButton.astro`** — dwa warianty, tokeny projektu.
3. **`open-detail.ts` + `WorkCarouselCard.astro`**.
4. **`WorkCarousel.astro`** — CSS `.wk-car*` (port `.rz*`), skrypt, reduce.
5. **`Work.astro`** — wpięcie, desktop/mobile toggle, uproszczenie skryptu.
6. **Testy** — `pnpm typecheck` + `pnpm lint`; e2e (`work.spec.ts`:
   scope selektorów do layoutu, mobile = tap w kartę karuzeli;
   `sections.spec.ts`: sheet z karuzeli); `pnpm test:e2e`.
7. **Wizualne** — `pnpm build && pnpm test:visual`; diff do akceptacji;
   po zgodzie baseline'y darwin (`test:visual:update`) + linux (workflow).

## Korekty po pierwszym podglądzie (2026-07-14)

Po review mobile (Mateusz) — cztery poprawki, zweryfikowane w realnej
przeglądarce (393px):

1. **Większe kafle**: `--wk-peek` 66→50 px, `--lap-w` karty
   `clamp(150,52vw,210)` → `clamp(168,58vw,232)`.
2. **Przyklejanie po swipe = jak strzałka**: dodane `scroll-snap-stop: always`
   na kartach (jedna karta na machnięcie, zawsze do krawędzi).
3. **BUG Android — pionowy scroll strony ginął nad kafelkiem**: `data-lenis-prevent`
   na torze wyłączał Lenisa dla CAŁEGO gestu (Lenis prowadzi scroll strony przez
   `syncTouch`), więc pionowy drag nad kartą nie ruszał strony. FIX:
   **`data-lenis-prevent-horizontal`** — Lenis wycofuje się TYLKO dla gestu
   poziomego (natywny scroll toru), a pionowy nadal prowadzi stronę (Lenis
   sprawdza orientację per-event, `lenis.mjs:580`). Czysto poziomy gest i tak
   był ignorowany przez Lenisa (`deltaY===0` → `isUnknownGesture`).
4. **Slajd „Więcej" wyśrodkowany**: usunięte `height:100%` (walczyło z
   `align-items:stretch` toru); slajd wypełnia wysokość rzędu, treść centruje
   `justify-content:center` (zweryfikowane: 127/127 px gór/dół).

## Korekty po drugim podglądzie (2026-07-14)

1. **Kafle jeszcze większe**: `--lap-w` → `clamp(180,62vw,246)`.
2. **Równa wysokość kafli + wyrównane CTA**: usunięte `height:100%` z
   `.wk-car-card` — `height:100%` na `<button>` łamał `align-items:stretch`
   toru (kafle 371/397/371, CTA rozjechane). Bez niego wszystkie kafle +
   slajd „Więcej" mają równą wysokość (zmierzone 407×4), CTA w jednym rzędzie
   (719×3); `margin-top:auto` na CTA trzyma je przy dole.
3. **Strzałka w prawo znika na maksymalnym przesunięciu**: widoczność strzałek
   liczona z realnej pozycji scrolla (`scrollLeft` vs `scrollWidth-clientWidth`),
   nie z indeksu — ostatni slajd przez „peek" nie dociera do lewej krawędzi,
   więc indeks nigdy nie sięgał `count-1` (strzałka zostawała). Kropki nadal
   wg najbliższego indeksu.

## Czego emulacja nie złapie → telefon

Feel swipe'a karuzeli (Lenis `syncTouch` vs natywny scroll-snap poziomy),
inercja snapu na iOS, dotknięcie vs przewinięcie na realnym ekranie —
poproszę Mateusza o test na telefonie po wdrożeniu.
