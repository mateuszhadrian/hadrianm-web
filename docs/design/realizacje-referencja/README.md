# Realizacje — pakiet referencyjny

Sekcja „Realizacje” (galeria + modal szczegółów) w wersji desktop i mobile.
Materiał **referencyjny** do przeniesienia do projektu Astro — pokazuje docelowy
wygląd, układ, animacje, copy i strukturę danych. To nie jest gotowy pakiet npm.

## Co jest w środku

Pliki HTML (otwórz dwuklikiem w przeglądarce — działają od razu, offline poza fontami/CDN):

- **`Realizacje - Galeria.html`** — pełny „playground”. Przełączniki układu
  (Grid/Lista/Zygzak/Poziomo), przełącznik Desktop/Mobile oraz panel Tweaks
  (kolor akcentu, hover, odstępy). Dobry do podejrzenia wszystkich wariantów.
- **`Realizacje Desktop.html`** — docelowy widok desktop: układ **zygzak**,
  hover „wszystko”, klik w kartę otwiera **modal** dwukolumnowy.
- **`Realizacje Mobile.html`** — docelowy widok mobile: układ **stos**,
  klik w kartę otwiera **bottom sheet** (zjeżdża z dołu, scrollowalny).

Komponenty (React + JSX, transpilowane w przeglądarce przez Babel standalone):

- `realizacje-data.jsx` — **dane + treść**: lista realizacji, kategorie, tagi,
  3 ekrany (home/galeria/zamówienie) oraz treść modala (intro, liczby/wyniki,
  opinia klienta, zakres prac, link na żywo). Tu podmieniasz wszystkie teksty.
- `realizacje-devices.jsx` — laptop + telefon „na wprost” (proste kontenery,
  bez CSS 3D) i poświata. Ekran wypełnia `<img>`.
- `realizacje-card.jsx` — tło „Czerwona Mgła”, duet urządzeń, karta realizacji,
  metadane (kategoria, tytuł, opis, tagi, CTA).
- `realizacje-mobile.jsx` — jednokolumnowa galeria mobilna (warianty stos/zwarty/karty).
- `realizacje-modal.jsx` — modal desktop (`RzModal`) i bottom sheet (`RzModalSheet`)
  oraz wspólne sekcje treści.
- `tweaks-panel.jsx` — tylko dla playgrounda (panel Tweaks). W produkcji niepotrzebny.

Obrazy: `realizacje/img/*.jpg` — testowe screenshoty (home / galeria / zamówienie,
desktop + mobile) dla 3 realizacji. Podmień na własne, zachowując nazwy lub
aktualizując ścieżki w `realizacje-data.jsx`.

## Paleta i typografia

- Tło `#0A0709`, tekst `#F5F0EC`, akcent **`#E3BE7F`** (złoty).
- Fonty: **Archivo** (nagłówki/tekst), **Instrument Serif** italic (akcent w tytule).
- Definicja motywu i smug tła: `RZ_THEME` w `realizacje-data.jsx`.

## Przeniesienie do Astro (skrót)

To są komponenty React. W Astro najprościej:

1. **Integracja React** — `npx astro add react`.
2. **Pliki komponentów** → `src/components/realizacje/`, zmień rozszerzenia na
   `.jsx` i zamień globalne `Object.assign(window, …)` na zwykłe
   `export`/`import` między plikami.
3. **Dane** `realizacje-data.jsx` → `src/data/realizacje.ts` (zwykły moduł z tablicą).
4. **Obrazy** → `src/assets/realizacje/` (import + `astro:assets`) lub `public/realizacje/img/`.
5. **Style** — globalny CSS (klasy `.rz-*`, animacje modala/sheetu) przenieś do
   pliku `.css` importowanego globalnie lub do `<style is:global>`; resztę
   stylów masz inline w komponentach.
6. **Osadzenie w stronie** — w `.astro` użyj wyspy z hydracją, np.
   `<RealizacjeGaleria client:visible />`. Sekcja sama wykrywa szerokość ekranu
   i pokazuje zygzak (desktop) lub stos + bottom sheet (mobile).
7. **Fonty** — przez `@fontsource/archivo` + `@fontsource/instrument-serif`
   albo `<link>` do Google Fonts (jak w plikach HTML).
8. **Babel niepotrzebny** — w produkcji JSX kompiluje Astro/Vite; usuń tagi
   `@babel/standalone` i `type="text/babel"`.

## Uwaga o treści

Liczby, opinie i nazwy klientów to realistyczne **placeholdery** — podmień na
prawdziwe dane w `realizacje-data.jsx`. Linki „Zobacz stronę na żywo” prowadzą
na razie do `#`.
