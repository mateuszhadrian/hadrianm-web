import sharp from "sharp";
import { mkdir, stat } from "node:fs/promises";
import { dirname } from "node:path";

const SRC = "docs/testing-data/test-projects";
const OUT = "public/realizacje";

const DESKTOP = { width: 1600, quality: 72 };
const MOBILE = { width: 1000, quality: 72 };

// Ekrany realizacji: home / galeria / zamówienie. „home" zachowuje historyczne
// nazwy plików (desktop.webp / mobile.webp) — używane przez kafelki galerii.
// Pozostałe ekrany dostają prefiks (gallery-* / order-*) i zasilają modal/sheet.
const SCREENS = [
  { key: "home", out: { desktop: "desktop.webp", mobile: "mobile.webp" } },
  {
    key: "gallery",
    out: { desktop: "gallery-desktop.webp", mobile: "gallery-mobile.webp" },
  },
  {
    key: "order",
    out: { desktop: "order-desktop.webp", mobile: "order-mobile.webp" },
  },
];

// Źródłowe pliki PNG per projekt. Uwaga: w danych testowych desktop „gallery"
// dla dab ma literówkę w nazwie (`dab-gellery.png`).
const PROJECTS = [
  {
    slug: "aura",
    dir: `${SRC}/aura-aestetics`,
    src: {
      home: { d: "aura-home.png", m: "mobile/aura-home-mobile.png" },
      gallery: { d: "aura-gallery.png", m: "mobile/aura-gallery-mobile.png" },
      order: { d: "aura-order.png", m: "mobile/aura-order-mobile.png" },
    },
  },
  {
    slug: "dab",
    dir: `${SRC}/dab-forma`,
    src: {
      home: { d: "dab-home.png", m: "mobile/dab-home-mobile.png" },
      gallery: { d: "dab-gellery.png", m: "mobile/dab-gallery-mobile.png" },
      order: { d: "dab-order.png", m: "mobile/dab-order-mobile.png" },
    },
  },
  {
    slug: "sielski",
    dir: `${SRC}/sielski-zakatek`,
    src: {
      home: { d: "sielski-home.png", m: "mobile/sielski-home-mobile.png" },
      gallery: {
        d: "sielski-gallery.png",
        m: "mobile/sielski-gallery-mobile.png",
      },
      order: { d: "sielski-order.png", m: "mobile/sielski-order-mobile.png" },
    },
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
for (const p of PROJECTS) {
  for (const screen of SCREENS) {
    const s = p.src[screen.key];
    const d = await convert(
      `${p.dir}/${s.d}`,
      `${OUT}/${p.slug}/${screen.out.desktop}`,
      DESKTOP,
    );
    const m = await convert(
      `${p.dir}/${s.m}`,
      `${OUT}/${p.slug}/${screen.out.mobile}`,
      MOBILE,
    );
    before += d.inSize + m.inSize;
    after += d.outSize + m.outSize;
  }
}
console.log(
  `\nTOTAL  ${(before / 1024 / 1024).toFixed(2)}MB → ${(after / 1024 / 1024).toFixed(2)}MB  ` +
    `(-${before ? (100 - (after / before) * 100).toFixed(0) : 0}%)`,
);
