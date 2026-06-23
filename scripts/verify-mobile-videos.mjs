// DEV-ONLY smoke-test zachowania video na mobile (iPhone Pro Max).
// Ładuje stronę główną w viewporcie mobile i sprawdza: odchudzenie DOM, wpięcie
// src tylko na mobile oraz sekwencję skali/odtwarzania w strefie (grow→hold→shrink).
// Wymaga `pnpm dev` w tle. Port: CAP_PORT (domyślnie 4337). Kod wyjścia 1 = FAIL.
//
//   CAP_PORT=<port> node scripts/verify-mobile-videos.mjs

import { chromium } from "playwright";
import { mkdtempSync } from "node:fs";
import path from "node:path";
import os from "node:os";

const URL = `http://localhost:${process.env.CAP_PORT || 4337}/`;
const OUT = mkdtempSync(path.join(os.tmpdir(), "hadrianm-verify-"));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// strefy muszą być spójne z makeVideoZone() w Hero.astro
const LAP = { start: 4.4, end: 8.4 };
const PH = { start: 8.8, end: 12.8 };
const GROW_END = 1 / 4;
const HOLD_END = 3 / 4;
const VID_MAX = 1.5;
const expectScale = (p) =>
  p <= GROW_END
    ? 1 + (VID_MAX - 1) * (p / GROW_END)
    : p < HOLD_END
      ? VID_MAX
      : 1 + (VID_MAX - 1) * ((1 - p) / (1 - HOLD_END));

let fails = 0;
const check = (cond, msg) => {
  console.log(`${cond ? "✓" : "✗ FAIL:"} ${msg}`);
  if (!cond) fails++;
};
const near = (a, b, tol = 0.06) => Math.abs(a - b) <= tol;

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 430, height: 932 }, // iPhone 16 Pro Max (CSS px)
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  reducedMotion: "no-preference", // Playwright domyślnie 'reduce' → blokuje animacje
});
const page = await ctx.newPage();
await page.goto(URL, { waitUntil: "load", timeout: 60000 });
await sleep(1500);
const ih = await page.evaluate(() => window.innerHeight);

// ── DOM / wpięcie src ──
const dom = await page.evaluate(() => {
  const lv = document.querySelector("[data-gsap='video-laptop']");
  return {
    dwRoot: !!document.querySelector(".screen--laptop .dw-root"),
    dwmRoot: !!document.querySelector(".screen--phone .dwm-root"),
    lapSrc: lv?.getAttribute("src") || null,
    lapDisplay: lv ? getComputedStyle(lv).display : null,
  };
});
check(!dom.dwRoot && !dom.dwmRoot, "ciężkie .dw-root/.dwm-root usunięte z DOM");
check(!!dom.lapSrc, `src wpięte na mobile (${dom.lapSrc})`);
check(dom.lapDisplay === "block", "video widoczne na mobile (display:block)");

// ── przebieg skali/odtwarzania w strefie ──
const dev = (key) => `[data-gsap='${key}']`;
const probe = async (zone, p, scaleEl, videoEl) => {
  await page.evaluate(
    (y) => window.scrollTo(0, y),
    (zone.start + p * (zone.end - zone.start)) * ih,
  );
  await sleep(500);
  return page.evaluate(
    ([s, v]) => {
      const el = document.querySelector(s);
      const vid = document.querySelector(v);
      return {
        scale: parseFloat(el.style.getPropertyValue("--vid-scale") || "1"),
        paused: vid.paused,
      };
    },
    [scaleEl, videoEl],
  );
};

console.log("\n— STREFA LAPTOPA (grow→hold→shrink) —");
for (const [p, label, playing] of [
  [0.125, "grow", false],
  [0.25, "szczyt", true],
  [0.5, "hold #1", true],
  [0.7, "hold #2", true],
  [0.875, "shrink", true],
]) {
  const r = await probe(LAP, p, dev("laptop"), dev("video-laptop"));
  check(
    near(r.scale, expectScale(p)) && r.paused === !playing,
    `${label} (p=${p}): scale=${r.scale.toFixed(2)} (≈${expectScale(p).toFixed(2)}), ${r.paused ? "pauza" : "gra"}`,
  );
}

console.log("\n— między strefami (stop + reset) —");
const between = await probe(
  { start: 8.5, end: 8.5 },
  0,
  dev("laptop"),
  dev("video-laptop"),
);
check(
  near(between.scale, 1) && between.paused,
  `scale=${between.scale.toFixed(2)}, pauza`,
);

console.log("\n— STREFA TELEFONU (szczyt) —");
const phPeak = await probe(PH, 0.4, dev("phone"), dev("video-phone"));
check(
  near(phPeak.scale, VID_MAX) && !phPeak.paused,
  `hold: scale=${phPeak.scale.toFixed(2)}, gra`,
);

await page.screenshot({ path: path.join(OUT, "verify-final.png") });
await browser.close();

console.log(`\n${fails ? `✗ ${fails} FAIL` : "✓ wszystko OK"} (zrzut: ${OUT})`);
process.exit(fails ? 1 : 0);
