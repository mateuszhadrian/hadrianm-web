// DEV-ONLY: renderuje trzy referencyjne ekrany LUMÉA (home / cms / reservation)
// z docs/design/lumea-ekrany-referencyjne/*.html do wypieczonych obrazów WebP
// używanych w sekcji „Dla kogo" (desktop + mobile).
//
// Referencje to samodzielne dokumenty HTML o kadrze 880×574 (wnętrze okna,
// BEZ chrome'u przeglądarki — ten dorysowuje AudienceMockWindow.astro).
// Renderujemy je @2× (1760×1148) dla ostrości na retinie, z oryginalnymi
// fontami referencji (Cormorant Garamond + Jost z Google Fonts — wypieczone
// w obraz, więc nie trafiają do package.json) i `reducedMotion: reduce`
// (kursor edycji w CMS zamrożony na widocznym, zero migania w kadrze).
//
// Idempotentny — nadpisuje pliki wynikowe. Wymaga sieci (Google Fonts).
//   node scripts/capture-audience-screens.mjs            # wszystkie
//   node scripts/capture-audience-screens.mjs home cms   # wybrane
//
// Decyzje: docs/analiza-podmiana-ekranow-lumea-dla-kogo.md (Etap 1).

import { chromium } from "playwright";
import sharp from "sharp";
import { pathToFileURL, fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(fileURLToPath(import.meta.url), "../..");
const REF_DIR = path.join(ROOT, "docs/design/lumea-ekrany-referencyjne");
const OUT_DIR = path.join(ROOT, "src/assets/audience");

// Natywny kadr wnętrza okna (== html,body w referencjach) i skala renderu.
const W = 880;
const H = 574;
const SCALE = 2; // 1760×1148 na wyjściu

// źródłowy plik HTML → docelowa nazwa assetu (rozdział sekcji)
const SCREENS = [
  { src: "lumea-home.html", out: "ekran-home.webp" },
  { src: "lumea-cms.html", out: "ekran-cms.webp" },
  { src: "lumea-reservation.html", out: "ekran-reservation.webp" },
];

async function capture(browser, { src, out }) {
  const context = await browser.newContext({
    viewport: { width: W, height: H },
    deviceScaleFactor: SCALE,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const url = pathToFileURL(path.join(REF_DIR, src)).href;
  await page.goto(url, { waitUntil: "networkidle" });
  // Fonty i obraz tła muszą być gotowe, zanim złapiemy klatkę.
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(200);

  const png = await page.locator(".lumea").screenshot({ type: "png" });
  await context.close();

  const outPath = path.join(OUT_DIR, out);
  const info = await sharp(png)
    .webp({ quality: 82, effort: 6 })
    .toFile(outPath);
  console.log(
    `✓ ${out}  ${info.width}×${info.height}  ${(info.size / 1024).toFixed(1)} kB`,
  );
}

const pick = process.argv.slice(2);
const jobs = pick.length
  ? SCREENS.filter((s) =>
      pick.some((p) => s.out.includes(p) || s.src.includes(p)),
    )
  : SCREENS;
if (!jobs.length) {
  console.error(`Brak dopasowania dla: ${pick.join(", ")}`);
  process.exit(1);
}

const browser = await chromium.launch();
try {
  for (const job of jobs) await capture(browser, job);
} finally {
  await browser.close();
}
