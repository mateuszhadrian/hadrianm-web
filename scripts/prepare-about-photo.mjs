// Przygotowanie portretu sekcji „O mnie" (docs/design → src/assets/about/).
// Uruchom: node scripts/prepare-about-photo.mjs
// Powtarzalny przy podmianie portretu; wyniki commitowane do repo.
// Decyzje: docs/analiza-sekcja-o-mnie.md §II.3.
import sharp from "sharp";
import { mkdir, stat } from "node:fs/promises";

const SRC = "docs/design/o mnie/o-mnie-referencja/foto.png";
const OUT_DIR = "src/assets/about";

// portrait.webp — źródło dla astro:assets <Image> (srcset liczy Astro).
// Jakość wysoka: plik jest re-enkodowany w buildzie, nie serwowany wprost.
const PORTRAIT = { width: 1510, quality: 90, alphaQuality: 95 };

// portrait-blur.webp — tło finału 04 na mobile, rozmycie WYPIECZONE w pliku
// (zero filter: blur() w runtime). Referencja: blur(4px) saturate(1.05) przy
// ekspozycji ~350px wysokości; przy 640px szerokości pliku σ ≈ 4 × (640/350).
const BLUR = { width: 640, sigma: 7.3, saturation: 1.05, quality: 60 };

await mkdir(OUT_DIR, { recursive: true });
const meta = await sharp(SRC).metadata();

async function emit(name, pipeline) {
  const out = `${OUT_DIR}/${name}`;
  const info = await pipeline.toFile(out);
  const kb = ((await stat(out)).size / 1024).toFixed(0);
  console.log(`${name}  ${info.width}×${info.height}  ${kb}KB`);
}

console.log(`źródło: ${SRC}  ${meta.width}×${meta.height}`);

await emit(
  "portrait.webp",
  sharp(SRC).resize({ width: PORTRAIT.width, withoutEnlargement: true }).webp({
    quality: PORTRAIT.quality,
    alphaQuality: PORTRAIT.alphaQuality,
    effort: 6,
  }),
);

await emit(
  "portrait-blur.webp",
  sharp(SRC)
    .resize({ width: BLUR.width, withoutEnlargement: true })
    .blur(BLUR.sigma)
    .modulate({ saturation: BLUR.saturation })
    .webp({ quality: BLUR.quality, alphaQuality: 80, effort: 6 }),
);
