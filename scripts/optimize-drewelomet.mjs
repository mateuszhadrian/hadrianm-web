// Jednorazowa optymalizacja assetów drewelomet (PNG → WebP z resize).
// Uruchom: node scripts/optimize-drewelomet.mjs
// Idempotentny: pomija obrazy, które mają już wariant .webp (brak PNG = nic do roboty).
import sharp from "sharp";
import { readdir, stat, unlink } from "node:fs/promises";
import { join, extname } from "node:path";

const DIR = "public/drewelomet";

// Max dłuższy bok + jakość wg sposobu użycia na ekranie laptopa (max ~1150×720,
// część warstw zoomuje do ~2–2,4×). Jakość świadomie obniżona (mały ekran, showcase).
const rules = (rel) => {
  if (rel.startsWith("products/")) return { max: 1100, q: 74 }; // galeria: wys. ≈ ekran
  if (rel.startsWith("carpenter/")) return { max: 1500, q: 70 }; // scena 2, zoom 1.8×
  if (rel.startsWith("table_corner_")) return { max: 1300, q: 74 }; // rysunki/makro
  return { max: 1700, q: 70 }; // background/bookshelf/table — pełnoekranowe, zoom 2–2,4×
};

async function walk(dir, base = "") {
  const out = [];
  for (const name of await readdir(dir)) {
    const full = join(dir, name);
    const rel = base ? `${base}/${name}` : name;
    if ((await stat(full)).isDirectory()) out.push(...(await walk(full, rel)));
    else if (extname(name).toLowerCase() === ".png") out.push({ full, rel });
  }
  return out;
}

const files = await walk(DIR);
let before = 0;
let after = 0;
for (const { full, rel } of files) {
  const { max, q } = rules(rel);
  const meta = await sharp(full).metadata();
  const outPath = full.replace(/\.png$/i, ".webp");
  const info = await sharp(full)
    .resize({ width: max, height: max, fit: "inside", withoutEnlargement: true })
    .webp({ quality: q, effort: 6, alphaQuality: 90 })
    .toFile(outPath);
  const inSize = (await stat(full)).size;
  before += inSize;
  after += info.size;
  await unlink(full); // usuń oryginał PNG
  console.log(
    `${rel}  ${meta.width}×${meta.height} → ${info.width}×${info.height}  ` +
      `${(inSize / 1024).toFixed(0)}KB → ${(info.size / 1024).toFixed(0)}KB`,
  );
}
console.log(
  `\nTOTAL  ${(before / 1024 / 1024).toFixed(2)}MB → ${(after / 1024 / 1024).toFixed(2)}MB  ` +
    `(-${before ? (100 - (after / before) * 100).toFixed(0) : 0}%)`,
);
