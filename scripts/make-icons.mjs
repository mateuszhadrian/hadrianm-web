// Generator ikon marki (backlog S4, wzorzec rodziny: pracownia-eha-web
// scripts/make-icons.mjs). Jedno polecenie zamiast odtwarzania parametrów
// z pamięci: wektor → favicon.svg + favicon.ico + apple-touch-icon + ikony
// manifestu.
//
// ŹRÓDŁO: src/assets/brand/hm-icon.svg — pełna ikona 512×512 (tło-gradient,
// kropki, glify „hm"), ręczny wektor z 2026-07-03. public/favicon.svg jest
// GENERATEM: źródło 1:1 + komentarz GENERAT na początku. Ręczną edycję
// generatu wykrywa tests/e2e/seo.spec.ts (porównanie z plikiem źródłowym) —
// zmiana rysunku = edycja źródła + `pnpm make:icons`.
//
// og-image.png NIE jest generatem (DEC-59, DEC-116): to screenshot hero
// 1200×630, kontrakt w tests/unit/og-image.test.ts.
//
// Rastry: librsvg rysuje SVG od razu w docelowym rozmiarze (nadpróbkowanie
// nic nie zmienia — sprawdzone 2026-11-22). Paleta 256 kolorów: wierna
// wektorowi (śr. Δ 0,3/255); lipcowy icon-512 miał 18 kolorów i pasy
// w gradiencie. Bez alfy — iOS podkłada czerń pod przezroczystość na
// ekranie początkowym; tło ikony i tak jest pełne.
//
// Użycie : pnpm make:icons                       (zapis do public/)
//          pnpm make:icons -- --out <katalog>    (podgląd obok, bez public/ —
//                                                 porównanie przed podmianą)
import sharp from "sharp";
import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";

const SRC = "src/assets/brand/hm-icon.svg";
const outArg = process.argv.indexOf("--out");
const OUT = outArg > -1 ? process.argv[outArg + 1] : "public";

const GENERAT_HEADER = `<!-- GENERAT: node scripts/make-icons.mjs — nie edytuj ręcznie; źródło: ${SRC} -->\n`;

// Tło strony i manifestu (layout-seo.md „theme-color").
const BG = "#000000";

const RASTERS = [
  ["apple-touch-icon.png", 180],
  ["icon-192.png", 192],
  ["icon-512.png", 512],
];
const ICO_SIZES = [16, 32];

const kb = (p) => `${(statSync(p).size / 1024).toFixed(1)} kB`;

const png = (svg, size) =>
  sharp(svg)
    .resize(size, size)
    .flatten({ background: BG })
    .removeAlpha()
    .png({ compressionLevel: 9, palette: true, colours: 256, effort: 10 })
    .toBuffer();

/** Kontener ICO z payloadem PNG (obsługiwany przez wszystkie żywe przeglądarki). */
function ico(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // typ: ikona
  header.writeUInt16LE(images.length, 4);
  const dir = Buffer.alloc(16 * images.length);
  let offset = header.length + dir.length;
  images.forEach(({ size, data }, i) => {
    const at = i * 16;
    dir[at] = size >= 256 ? 0 : size; // 0 = 256 px
    dir[at + 1] = size >= 256 ? 0 : size;
    dir.writeUInt16LE(1, at + 4); // płaszczyzny
    dir.writeUInt16LE(32, at + 6); // bitów na piksel
    dir.writeUInt32LE(data.length, at + 8);
    dir.writeUInt32LE(offset, at + 12);
    offset += data.length;
  });
  return Buffer.concat([header, dir, ...images.map((i) => i.data)]);
}

const svg = readFileSync(SRC);
mkdirSync(OUT, { recursive: true });

writeFileSync(`${OUT}/favicon.svg`, GENERAT_HEADER + svg.toString("utf8"));
console.log(`favicon.svg           ${kb(`${OUT}/favicon.svg`)}`);

for (const [name, size] of RASTERS) {
  writeFileSync(`${OUT}/${name}`, await png(svg, size));
  console.log(`${name.padEnd(21)} ${size}×${size}  ${kb(`${OUT}/${name}`)}`);
}

writeFileSync(
  `${OUT}/favicon.ico`,
  ico(
    await Promise.all(
      ICO_SIZES.map(async (size) => ({ size, data: await png(svg, size) })),
    ),
  ),
);
console.log(
  `favicon.ico           ${ICO_SIZES.join("+")}  ${kb(`${OUT}/favicon.ico`)}`,
);
