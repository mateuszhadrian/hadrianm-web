import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";

const SRC = "public/drewelomet";
const OUT = "public/drewelomet/phone";
const MAX = 720;
const Q = 72;

const files = [
  "background.webp",
  "table.webp",
  "table_corner_macro_alt.webp",
  "table_corner_project1_no_background.webp",
  "table_corner_project2_no_background.webp",
  "table_corner_project3_no_background.webp",
  "carpenter/carpenter_background1.webp",
  "carpenter/carpenter_wood2.webp",
  "carpenter/carpenter_man3.webp",
  "carpenter/carpenter_table4.webp",
  "products/table.webp",
  "products/rtv2.webp",
  "products/coffee_table1.webp",
  "products/high_shelf.webp",
  "products/bookshelf.webp",
  "products/door.webp",
  "products/doghouse.webp",
  "products/bench.webp",
];

let before = 0;
let after = 0;
for (const rel of files) {
  const inPath = join(SRC, rel);
  const outPath = join(OUT, rel);
  await mkdir(dirname(outPath), { recursive: true });
  const info = await sharp(inPath)
    .resize({
      width: MAX,
      height: MAX,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: Q, effort: 6, alphaQuality: 90 })
    .toFile(outPath);
  const inSize = (await sharp(inPath).metadata()).size || 0;
  before += inSize;
  after += info.size;
  console.log(
    `${rel} → ${info.width}×${info.height}  ${(info.size / 1024).toFixed(0)}KB`,
  );
}
console.log(`\nTOTAL phone variants: ${(after / 1024).toFixed(0)}KB`);
