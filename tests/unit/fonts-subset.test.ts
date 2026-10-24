// Kontrakt polskich subsetów fontów (F1, P8; wzorzec pracownia-eha-web).
// Subsety `latin-ext` w src/assets/fonts/ są GENERATEM
// (scripts/subset-fonts.mjs) i zawierają WYŁĄCZNIE znaki z SUBSET_CHARS.
// Jeżeli w treści pojawi się znak z zakresu `latin-ext` spoza tej listy
// (np. „†", czeskie „ř"), przeglądarka narysuje go krojem ZASTĘPCZYM —
// layout się nie wywróci, więc nikt tego nie zauważy. Ten test jest jedynym
// strażnikiem tej granicy.
//
// Skanujemy źródła treści (nie `dist`), żeby kontrakt działał bez builda:
// komponenty/strony .astro, moduły .ts komponentów (makiety hero), słownik
// i18n, lib oraz wpisy CMS.
import { existsSync, globSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { REALIZACJE_DIR, realizacjeFiles } from "../helpers/realizacje";

/** Zakres `latin-ext` wg subsetów Fontsource — ZGODNY z `unicode-range`
 *  w src/styles/fonts.css i fonts-hero.css. */
const LATIN_EXT: [number, number][] = [
  [0x0100, 0x02ba],
  [0x02bd, 0x02c5],
  [0x02c7, 0x02cc],
  [0x02ce, 0x02d7],
  [0x02dd, 0x02ff],
  [0x1d00, 0x1dbf],
  [0x1e00, 0x1e9f],
  [0x1ef2, 0x1eff],
  [0x2020, 0x2020],
  [0x20a0, 0x20ab],
  [0x20ad, 0x20c0],
  [0x2113, 0x2113],
  [0x2c60, 0x2c7f],
  [0xa720, 0xa7ff],
];

/** Kopia stałej z scripts/subset-fonts.mjs (skrypt .mjs bez typów —
 *  kontrakt porównuje się z jego ŹRÓDŁEM, nie z importem). */
const SUBSET_CHARS = "ĄąĆćĘęŁłŃńŚśŹźŻż";

/** plik subsetu → arkusz, który go deklaruje */
const SUBSETS: [string, string][] = [
  ["archivo-latin-ext-wght-normal-pl", "src/styles/fonts.css"],
  ["instrument-serif-latin-ext-400-italic-pl", "src/styles/fonts.css"],
  ["saira-condensed-latin-ext-600-normal-pl", "src/styles/fonts-hero.css"],
];

const inLatinExt = (cp: number) =>
  LATIN_EXT.some(([a, b]) => cp >= a && cp <= b);

const SOURCES = [
  ...globSync("src/**/*.astro"),
  ...globSync("src/components/**/*.ts"),
  ...globSync("src/i18n/**/*.ts"),
  ...globSync("src/lib/**/*.ts"),
  // Treść z panelu też — znak spoza subsetu w tytule realizacji narysowałby
  // się krojem zastępczym. Katalog może nie istnieć (helper zwraca wtedy []).
  ...realizacjeFiles().map((name) => join(REALIZACJE_DIR, name)),
];

describe("subsety polskie fontów", () => {
  it("skrypt generujący deklaruje dokładnie te znaki co kontrakt", () => {
    const script = readFileSync("scripts/subset-fonts.mjs", "utf8");
    expect(script).toContain(`SUBSET_CHARS = "${SUBSET_CHARS}"`);
  });

  it("każdy subset istnieje i ma swój @font-face", () => {
    for (const [name, sheet] of SUBSETS) {
      expect(
        existsSync(`src/assets/fonts/${name}.woff2`),
        `brak pliku ${name}.woff2 — uruchom node scripts/subset-fonts.mjs`,
      ).toBe(true);
      expect(readFileSync(sheet, "utf8"), `brak @font-face ${name}`).toContain(
        `${name}.woff2`,
      );
    }
  });

  it("nikt nie importuje gotowych arkuszy latin-ext Fontsource'a", () => {
    // Gdyby wróciły, przeglądarka pobrałaby ZNOWU pełne latin-ext (subsety
    // stałyby się martwym kodem, a test wyglądu i tak by przeszedł).
    for (const file of globSync("src/**/*.{astro,ts,css}")) {
      const src = readFileSync(file, "utf8");
      expect(src, file).not.toMatch(
        /import\s+["']@fontsource(-variable)?\/[a-z-]+\/(index|400-italic|latin-ext-\d{3})\.css["']/,
      );
      expect(src, file).not.toMatch(
        /@fontsource(-variable)?\/[a-z-]+\/files\/[a-z-]+-latin-ext-[a-z0-9-]+\.woff2/,
      );
    }
  });

  it("treść serwisu nie używa znaku latin-ext spoza subsetu", () => {
    const allowed = new Set([...SUBSET_CHARS].map((c) => c.codePointAt(0)!));
    const offenders = new Map<string, string[]>();
    for (const file of SOURCES) {
      for (const ch of new Set(readFileSync(file, "utf8"))) {
        const cp = ch.codePointAt(0)!;
        if (!inLatinExt(cp) || allowed.has(cp)) continue;
        const key = `U+${cp.toString(16).toUpperCase().padStart(4, "0")} ${ch}`;
        offenders.set(key, [...(offenders.get(key) ?? []), file]);
      }
    }
    expect(
      [...offenders].map(([k, v]) => `${k} → ${v[0]}`),
      "znak z latin-ext poza subsetem: dopisz go do SUBSET_CHARS " +
        "w scripts/subset-fonts.mjs i przegeneruj pliki",
    ).toEqual([]);
  });
});
