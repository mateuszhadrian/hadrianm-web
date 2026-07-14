# Karuzela Mobile — realizacje (pakiet referencyjny)

Pozioma karuzela realizacji **na wersję mobilną** podstrony „Realizacje”. Karta zajmuje
większość ekranu, a z prawej **wystaje kawałek kolejnej realizacji** („peek”) — od razu
widać, że można przewijać. Po trzech realizacjach jest **kafel CTA „Więcej”** prowadzący
do osobnej strony ze wszystkimi realizacjami. Tap w kartę otwiera **bottom sheet** ze
szczegółami (te same treści co obecny modal mobilny).

Materiał **referencyjny** — dopasowany do stacku z `package.json` (Astro + Tailwind, **bez
Reacta**, fonty z `@fontsource`). Pokazuje docelowy wygląd, układ, animacje, copy i strukturę
danych. Nie jest to gotowy pakiet npm — pliki wkleja się do projektu.

---

## Szybki podgląd

Otwórz **`Realizacja Karuzela — podglad.html`** w przeglądarce (dwuklik — działa offline
poza fontami z Google Fonts). To ta sama implementacja co komponent Astro, tylko spłaszczona
do jednego pliku HTML (dane + skrypt inline). Podgląd celowo ograniczony do szerokości
telefonu.

## Co jest w środku

```
Karuzela Mobile - referencja/
├─ Realizacja Karuzela — podglad.html   ← podgląd (vanilla, do dwukliku)
├─ components/
│  ├─ RealizacjeKaruzela.astro          ← komponent główny (karuzela + skrypt)
│  ├─ RealizacjaCard.astro              ← karta w karuzeli
│  ├─ RealizacjaSheet.astro             ← bottom sheet ze szczegółami
│  └─ DeviceDuo.astro                   ← laptop + telefon
├─ data/
│  └─ realizacje.ts                     ← dane + typy (źródło prawdy)
├─ styles/
│  └─ realizacje-karuzela.css           ← wszystkie style (klasy .rz-*)
└─ img/                                 ← testowe screeny (podmień na własne)
```

## Wpięcie do projektu Astro (skrót)

1. **Komponenty** → `src/components/realizacje/` (4 pliki `.astro`).
2. **Dane** `data/realizacje.ts` → `src/data/realizacje.ts`. Tu podmieniasz teksty, liczby,
   opinie i nazwy plików obrazów.
3. **Style** `styles/realizacje-karuzela.css` → `src/styles/`. Import jest już w
   `RealizacjeKaruzela.astro` (`import '../styles/realizacje-karuzela.css'`) — popraw ścieżkę,
   jeśli trzeba. To zwykły globalny CSS na klasach `.rz-*` (nie koliduje z Tailwindem).
4. **Obrazy** → `public/realizacje/img/` (domyślnie). Katalog zmienisz propsem `imgBase`.
5. **Fonty** — komponent importuje `@fontsource-variable/archivo` i
   `@fontsource/instrument-serif` (są już w `package.json`). Jeśli ładujesz je globalnie
   w layoucie, usuń importy z góry `RealizacjeKaruzela.astro`.
6. **Osadzenie** w `.astro`:

   ```astro
   ---
   import RealizacjeKaruzela from '../components/realizacje/RealizacjeKaruzela.astro';
   ---
   <RealizacjeKaruzela moreHref="/realizacje" imgBase="/realizacje/img" />
   ```

### Propsy `RealizacjeKaruzela`

- `moreHref` (string, domyślnie `#`) — dokąd prowadzi kafel „Więcej”.
- `imgBase` (string, domyślnie `/realizacje/img`) — katalog z obrazami.
- `withBackground` (bool, domyślnie `true`) — dekoracyjne tło „Czerwona Mgła”. Ustaw
  `false`, jeśli strona ma już własne ambientowe tło.

## Tylko na mobile

Sekcja jest zaprojektowana pod wąski ekran (wnętrze ma `max-width: 460px`). Aby pokazać ją
wyłącznie na mobile, a na desktopie zostawić obecny widok, ukryj ją powyżej breakpointu, np.:

```css
@media (min-width: 768px) {
  .rz-kar { display: none; }
}
```

…lub renderuj warunkowo obok komponentu desktopowego.

## Lenis (smooth scroll)

- Ścieżka karuzeli i scroll bottom sheeta mają `data-lenis-prevent`, więc Lenis nie przejmuje
  ich przewijania (poziomego / wewnątrz modala).
- Przy otwarciu sheeta skrypt blokuje tło (`overflow:hidden`) i — jeśli w `window.lenis`
  jest instancja — wywołuje `lenis.stop()` / `lenis.start()`. Jeśli trzymasz Lenis inaczej,
  podłącz własne wstrzymanie w funkcji `lockScroll`.

## Nawigacja

- **Swipe / scroll** w bok (snap do karty).
- **Kropki** pod karuzelą (aktywna = pigułka) — klik przewija do danej pozycji.
- **Strzałki boczne** — lewa **znika** na pierwszej realizacji, prawa **znika** na kaflu
  „Więcej” (nie są wyszarzane, po prostu ich nie ma).

## Paleta i typografia

- Tło `#0A0709`, tekst `#F5F0EC`, akcent złoty **`#E3BE7F`**, poświata `rgba(227,190,127,·)`.
- Tło „Czerwona Mgła” — czerwone smugi (`#D62626`, `#FF5A47`, `#821420`) + winieta + siatka
  kropek + ziarno.
- Fonty: **Archivo** (nagłówki/tekst), **Instrument Serif** italic (akcent w tytule i cytat),
  mono systemowy (etykiety).
- Wszystkie kolory jako zmienne CSS na `.rz-kar` — łatwo je nadpisać.

## Uwaga o treści

Liczby, opinie i nazwy klientów to realistyczne **placeholdery** — podmień na prawdziwe dane
w `data/realizacje.ts`. Link „Zobacz stronę na żywo” oraz kafel „Więcej” prowadzą na razie
do `#`.
