import sharp from "sharp";
import { mkdir, stat } from "node:fs/promises";
import { dirname } from "node:path";

const SRC = "docs/testing-data/test-projects";
const OUT = "public/realizacje";

const DESKTOP = { width: 1600, quality: 72 };
const MOBILE = { width: 1000, quality: 72 };

const jobs = [
  {
    slug: "aura",
    desktop: `${SRC}/aura-aestetics/aura-home.png`,
    mobile: `${SRC}/aura-aestetics/mobile/aura-home-mobile.png`,
  },
  {
    slug: "dab",
    desktop: `${SRC}/dab-forma/dab-home.png`,
    mobile: `${SRC}/dab-forma/mobile/dab-home-mobile.png`,
  },
  {
    slug: "sielski",
    desktop: `${SRC}/sielski-zakatek/sielski-home.png`,
    mobile: `${SRC}/sielski-zakatek/mobile/sielski-home-mobile.png`,
  },
];

async function convert(src, outPath, { width, quality }) {
  await mkdir(dirname(outPath), { recursive: true });
  const meta = await sharp(src).metadata();
  const info = await sharp(src)
    .resize({ width, withoutEnlargement: true })
    .webp({ quality, effort: 6 })
    .toFile(outPath);
  const inSize = (await stat(src)).size;
  console.log(
    `${src}  ${meta.width}×${meta.height} → ${info.width}×${info.height}  ` +
      `${(inSize / 1024).toFixed(0)}KB → ${(info.size / 1024).toFixed(0)}KB`,
  );
  return { inSize, outSize: info.size };
}

let before = 0;
let after = 0;
for (const job of jobs) {
  const d = await convert(
    job.desktop,
    `${OUT}/${job.slug}/desktop.webp`,
    DESKTOP,
  );
  const m = await convert(job.mobile, `${OUT}/${job.slug}/mobile.webp`, MOBILE);
  before += d.inSize + m.inSize;
  after += d.outSize + m.outSize;
}
console.log(
  `\nTOTAL  ${(before / 1024 / 1024).toFixed(2)}MB → ${(after / 1024 / 1024).toFixed(2)}MB  ` +
    `(-${before ? (100 - (after / before) * 100).toFixed(0) : 0}%)`,
);
