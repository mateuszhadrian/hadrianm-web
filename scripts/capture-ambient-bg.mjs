// DEV-ONLY: renderuje statyczny podkład AmbientBackground do płaskich grafik
// public/ambient-bg-mobile-{red,blue}.webp — używanych na mobile zamiast
// czterech rozmytych, kompozytowanych warstw (blur 40–55px) + maski kropek.
// Grafika to pojedyncza tekstura: zero animacji, zero filtrów, minimalne
// GPU/CPU.
//
// Zamraża stan do wersji „mobile" (animacje off → brak transformów). Kolory
// oklch renderuje Chromium (jak nowoczesne przeglądarki) i pochodzą z
// JEDNEGO źródła prawdy: src/components/backgrounds/ambient-palette.ts
// (Node 24 importuje TS natywnie). Uruchom po każdej zmianie wyglądu
// AmbientBackground / palety:
//   node scripts/capture-ambient-bg.mjs

import { chromium } from "playwright";
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { AMBIENT_VARIANTS } from "../src/components/backgrounds/ambient-palette.ts";

const ROOT = path.resolve(fileURLToPath(import.meta.url), "../..");

// Portret 1:2 w gęstości 2x → 1080×2160. Miękkie gradienty kompresują się do kilku KB.
const CSS_W = 540;
const CSS_H = 1080;

// CSS skopiowany 1:1 z AmbientBackground.astro, ale: animacje wyłączone
// (stan statyczny = obecny mobile), will-change usunięty, blur obecny
// (koszt renderu ponosimy raz, offline — nie na urządzeniu).
const htmlFor = ({
  ink,
  colors: c,
}) => `<!doctype html><html><head><meta charset="utf-8"><style>
  html,body{margin:0;padding:0}
  .ambient-bg{position:absolute;inset:0;width:${CSS_W}px;height:${CSS_H}px;background:#000000;overflow:clip;isolation:isolate}
  .ambient-bg::after{content:"";position:absolute;inset:0;z-index:3;pointer-events:none;box-shadow:inset 0 0 90px 14px ${ink}}
  .ambient-bg__clouds{position:absolute;inset:0;z-index:1;pointer-events:none}
  .ambient-bg__clouds::before,.ambient-bg__clouds::after{content:"";position:absolute;width:65%;height:78%;filter:blur(55px)}
  .ambient-bg__clouds::before{bottom:-10%;left:-15%;background:
    radial-gradient(55% 65% at 35% 65%,${c.a1.oklch},transparent 72%),
    radial-gradient(50% 45% at 62% 40%,${c.a2.oklch},transparent 78%),
    radial-gradient(34% 42% at 18% 88%,${c.a3.oklch},transparent 68%)}
  .ambient-bg__clouds::after{top:-25%;right:-25%;width:80%;height:94%;background:
    radial-gradient(62% 55% at 65% 38%,${c.b1.oklch},transparent 74%),
    radial-gradient(48% 50% at 38% 58%,${c.b2.oklch},transparent 80%),
    radial-gradient(30% 38% at 85% 18%,${c.b3.oklch},transparent 66%)}
  .ambient-bg__cloud-c{position:absolute;top:20%;right:-28%;width:60%;height:50%;filter:blur(40px);background:radial-gradient(closest-side,${c.c1.oklch},transparent 70%)}
  .ambient-bg__cloud-d{position:absolute;top:-20%;left:28%;width:60%;height:50%;filter:blur(40px);background:radial-gradient(closest-side,${c.d1.oklch},transparent 70%)}
  .ambient-bg__dots{position:absolute;inset:0;z-index:2;pointer-events:none;
    background-image:radial-gradient(circle,${ink} 0 1.1px,transparent 4px);background-size:10px 9px;
    -webkit-mask-image:radial-gradient(ellipse 100% 95% at 50% 45%,#000 60%,transparent 100%);
    mask-image:radial-gradient(ellipse 100% 95% at 50% 45%,#000 60%,transparent 100%)}
</style></head><body>
  <div class="ambient-bg"><div class="ambient-bg__clouds"><span class="ambient-bg__cloud-c"></span><span class="ambient-bg__cloud-d"></span></div><div class="ambient-bg__dots"></div></div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: CSS_W, height: CSS_H },
  deviceScaleFactor: 2,
});

for (const [name, variant] of Object.entries(AMBIENT_VARIANTS)) {
  const out = path.join(ROOT, "public", variant.mobileImage);
  await page.setContent(htmlFor(variant), { waitUntil: "load" });
  const png = await page.locator(".ambient-bg").screenshot({ type: "png" });
  await sharp(png).webp({ quality: 82 }).toFile(out);
  console.log(`✓ zapisano [${name}]`, path.relative(ROOT, out));
}

await browser.close();
