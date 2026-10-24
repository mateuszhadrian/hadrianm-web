// Subsety polskie fontów (F1, paczka P8 — wzorzec rodziny: pracownia-eha-web).
//
// DIAGNOZA: z całego zakresu `latin-ext` Fontsource'a (U+0100–02BA i dalej,
// ~800 znaków) serwis używa WYŁĄCZNIE polskich ĄąĆćĘęŁłŃńŚśŹźŻż (skan
// .astro, i18n, lib, komponentów .ts i wpisów CMS — kontrakt
// tests/unit/fonts-subset.test.ts). Reszta pliku to balast pobierany na
// każdej trasie PL (oba pliki latin-ext mają preload).
//
// Skrypt tnie trzy pliki `latin-ext` do polskiego alfabetu (harfbuzz przez
// subset-font). Wynik ląduje w src/assets/fonts/ i JEST COMMITOWANY —
// generat w repo, build niczego nie liczy. Dzięki src/assets/ (a nie
// public/) pliki przechodzą przez hashowanie Vite (nagłówek immutable).
//
// ZAKRES ZNAKÓW jest CELOWO szerszy niż dzisiejsza treść: pełny polski
// alfabet, więc dowolne polskie słowo w panelu się nie rozjedzie. Znak
// spoza listy (np. czeskie „ř", „†") trzeba DOPISAĆ i przegenerować —
// inaczej przeglądarka narysuje go krojem zastępczym. Pilnuje tego kontrakt
// tests/unit/fonts-subset.test.ts.
//
// Użycie:  node scripts/subset-fonts.mjs
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import subsetFont from "subset-font";

const require = createRequire(import.meta.url);

/** Pełny polski alfabet poza zakresem `latin` (ó/Ó siedzą w U+0000–00FF,
 *  więc obsługuje je plik `latin` i tu ich nie ma). */
export const SUBSET_CHARS = "ĄąĆćĘęŁłŃńŚśŹźŻż";

const OUT_DIR = new URL("../src/assets/fonts/", import.meta.url);

/** Pliki źródłowe = subsety `latin-ext` Fontsource'a. `variable` decyduje
 *  o zachowaniu osi wagi (Archivo 100–900); Instrument Serif (tylko italic)
 *  i Saira Condensed 600 (ekran laptopa w hero) są statyczne. */
const SOURCES = [
  [
    "@fontsource-variable/archivo/files/archivo-latin-ext-wght-normal.woff2",
    true,
  ],
  [
    "@fontsource/instrument-serif/files/instrument-serif-latin-ext-400-italic.woff2",
    false,
  ],
  [
    "@fontsource/saira-condensed/files/saira-condensed-latin-ext-600-normal.woff2",
    false,
  ],
];

await mkdir(OUT_DIR, { recursive: true });

let before = 0;
let after = 0;
for (const [specifier, variable] of SOURCES) {
  const source = await readFile(require.resolve(specifier));
  const subset = await subsetFont(source, SUBSET_CHARS, {
    targetFormat: "woff2",
    // `undefined` = zachowaj PEŁNY zakres osi (nie instancjonuj do jednej
    // wagi — Archivo jedzie po całej osi wght).
    variationAxes: variable ? { wght: undefined } : undefined,
  });
  const name = specifier.split("/").pop().replace(".woff2", "-pl.woff2");
  await writeFile(new URL(name, OUT_DIR), subset);
  before += source.length;
  after += subset.length;
  const pct = ((100 * subset.length) / source.length).toFixed(1);
  console.log(
    `${String(source.length).padStart(7)} → ${String(subset.length).padStart(6)} B (${pct}%)  ${name}`,
  );
}
console.log(
  `${String(before).padStart(7)} → ${String(after).padStart(6)} B razem — oszczędność ${before - after} B`,
);
