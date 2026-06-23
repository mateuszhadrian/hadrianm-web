// DEV-ONLY: nagrywa animacje ekranów urządzeń (laptop + telefon) z desktopowego
// renderu do public/drewelomet/video/{laptop,phone}.mp4 (+ poster .webp).
//
// Pipeline: Playwright steruje master.progress() krzywą „realnego scrolla"
// (3 szybkie rzuty + 2 przystanki), przechwytuje klatki płaskiego roota
// (bez zniekształcenia transformem 3D), ffmpeg składa H.264 MP4 dwuprzebiegowo
// pod twardy limit wagi, a cwebp wycina poster z klatki 0.
//
// Harness src/pages/capture.astro tworzony jest automatycznie na czas nagrania
// (z scripts/capture-harness.astro) i usuwany po — nie trafia do produkcji.
//
// Wymaga: `pnpm dev` w tle + ffmpeg + cwebp (brew install ffmpeg webp).
// Port dev servera: zmienna CAP_PORT (domyślnie 4337).
//   pnpm capture:devices                               # oba
//   node scripts/capture-device-videos.mjs laptop      # tylko laptop
//   node scripts/capture-device-videos.mjs --recapture # wymuś ponowne klatki
//   node scripts/capture-device-videos.mjs --sample    # próbka tempa (1/3 klatek)

import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import {
  mkdirSync,
  rmSync,
  readdirSync,
  statSync,
  existsSync,
  copyFileSync,
} from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import os from "node:os";

const ROOT = path.resolve(fileURLToPath(import.meta.url), "../..");
const OUT_DIR = path.join(ROOT, "public/drewelomet/video");
// Harness renderujący płaskie roota — kopiowany do src/pages/ tylko na czas
// nagrania (potem usuwany), żeby nie trafił do produkcyjnego buildu jako route.
const HARNESS_SRC = path.join(ROOT, "scripts/capture-harness.astro");
const HARNESS_DEST = path.join(ROOT, "src/pages/capture.astro");
// klatki w katalogu tymczasowym systemu (reużywane między uruchomieniami → szybki re-enkod)
const TMP = path.join(os.tmpdir(), "hadrianm-device-frames");
const URL = `http://localhost:${process.env.CAP_PORT || 4337}/capture`;

const argv = process.argv.slice(2);
const SAMPLE = argv.includes("--sample");
const only = argv.filter((a) => !a.startsWith("--"));

const FPS = 30;
const DURATION = 10; // s
const N = SAMPLE ? Math.round((FPS * DURATION) / 3) : FPS * DURATION;
const TARGET_KB = 800; // twardy limit / plik

// ── Krzywa tempa: t∈[0,1] (czas) → progress∈[0,1]. 3 ruchy + 2 przystanki. ──
const smooth = (t) => t * t * t * (t * (t * 6 - 15) + 10); // smootherstep
const SEGMENTS = [
  { t0: 0.0, t1: 0.26, p0: 0.0, p1: 0.42, ease: smooth }, // szybki rzut
  { t0: 0.26, t1: 0.32, p0: 0.42, p1: 0.42, ease: null }, // przystanek ~0.6s
  { t0: 0.32, t1: 0.6, p0: 0.42, p1: 0.74, ease: smooth }, // szybki rzut
  { t0: 0.6, t1: 0.66, p0: 0.74, p1: 0.74, ease: null }, // przystanek ~0.6s
  { t0: 0.66, t1: 1.0, p0: 0.74, p1: 1.0, ease: smooth }, // szybki rzut do końca
];
const curve = (t) => {
  for (const s of SEGMENTS) {
    if (t <= s.t1 || s === SEGMENTS[SEGMENTS.length - 1]) {
      const local = (t - s.t0) / (s.t1 - s.t0 || 1);
      const e = s.ease ? s.ease(Math.max(0, Math.min(1, local))) : 0;
      return s.p0 + (s.p1 - s.p0) * e;
    }
  }
  return 1;
};

const DEVICES = [
  {
    key: "laptop",
    selector: "#cap-laptop",
    seek: "seekLaptop",
    has: "hasLaptop",
    scale: "720:-2", // finalna szerokość 720 (aspekt 1.598)
    width: 720,
  },
  {
    key: "phone",
    selector: "#cap-phone",
    seek: "seekPhone",
    has: "hasPhone",
    scale: "432:-2", // finalna szerokość 432 (aspekt 0.4698)
    width: 432,
  },
].filter((d) => only.length === 0 || only.includes(d.key));

const ff = (args) => execFileSync("ffmpeg", ["-y", ...args], { stdio: "pipe" });
const sizeKB = (f) => statSync(f).size / 1024;

function framesReady(dir) {
  try {
    return readdirSync(dir).filter((f) => f.endsWith(".png")).length >= N;
  } catch {
    return false;
  }
}

async function captureFrames(page, dev) {
  const dir = path.join(TMP, dev.key);
  if (!argv.includes("--recapture") && framesReady(dir)) {
    console.log(
      `  ${dev.key}: ${N} klatek już jest — pomijam capture (--recapture aby wymusić)`,
    );
    return dir;
  }
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const el = page.locator(dev.selector);
  for (let i = 0; i < N; i++) {
    const p = curve(i / (N - 1));
    await page.evaluate(
      ([seek, val]) => window.__cap[seek](val),
      [dev.seek, p],
    );
    // settle: rAF + krótka pauza na ewentualny repaint poddrzewa 3D/clip-path
    await page.evaluate(
      () =>
        new Promise((r) =>
          requestAnimationFrame(() => requestAnimationFrame(r)),
        ),
    );
    await el.screenshot({
      path: path.join(dir, String(i).padStart(4, "0") + ".png"),
    });
  }
  return dir;
}

function encode(dev, framesDir) {
  mkdirSync(OUT_DIR, { recursive: true });
  const mp4 = path.join(OUT_DIR, `${dev.key}.mp4`);
  const poster = path.join(OUT_DIR, `${dev.key}.webp`);
  const input = path.join(framesDir, "%04d.png");
  const passlog = path.join(framesDir, "ff2pass");

  // bitrate z twardego limitu (bez audio), 4% zapasu na kontener
  let kbps = Math.floor((TARGET_KB * 8 * 0.96) / DURATION);

  for (let attempt = 0; attempt < 4; attempt++) {
    const common = [
      "-r",
      String(FPS),
      "-i",
      input,
      "-an",
      "-c:v",
      "libx264",
      "-profile:v",
      "high",
      "-pix_fmt",
      "yuv420p",
      "-vf",
      `scale=${dev.scale}:flags=lanczos`,
      "-b:v",
      `${kbps}k`,
      "-maxrate",
      `${Math.round(kbps * 1.45)}k`,
      "-bufsize",
      `${kbps * 2}k`,
    ];
    ff([
      ...common,
      "-pass",
      "1",
      "-passlogfile",
      passlog,
      "-f",
      "mp4",
      "/dev/null",
    ]);
    ff([
      ...common,
      "-pass",
      "2",
      "-passlogfile",
      passlog,
      "-movflags",
      "+faststart",
      mp4,
    ]);
    const kb = sizeKB(mp4);
    console.log(
      `  ${dev.key}.mp4: ${kb.toFixed(0)} KB @ ${kbps}kbps (próba ${attempt + 1})`,
    );
    if (kb <= TARGET_KB) break;
    kbps = Math.floor(kbps * (TARGET_KB / kb) * 0.95);
  }

  // poster = klatka 0 (cwebp — ten build ffmpeg nie ma enkodera webp)
  try {
    execFileSync(
      "cwebp",
      [
        "-q",
        "78",
        "-resize",
        String(dev.width),
        "0",
        path.join(framesDir, "0000.png"),
        "-o",
        poster,
      ],
      { stdio: "pipe" },
    );
    console.log(`  ${dev.key}.webp poster: ${sizeKB(poster).toFixed(0)} KB`);
  } catch (e) {
    console.warn(`  ⚠ ${dev.key} poster nieudany:`, e.message);
  }
  // sprzątanie logów dwuprzebiegowych
  for (const f of readdirSync(framesDir)) {
    if (f.startsWith("ff2pass"))
      rmSync(path.join(framesDir, f), { force: true });
  }
}

async function waitForRoute(maxMs = 30000) {
  const t0 = Date.now();
  while (Date.now() - t0 < maxMs) {
    try {
      const r = await fetch(URL);
      if (r.ok) return;
    } catch {
      /* dev server jeszcze nie podał route */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Dev server nie poda ${URL} (czy działa pnpm dev?)`);
}

async function main() {
  // utwórz tymczasowy harness w src/pages (dev server poda /capture przez HMR)
  let createdHarness = false;
  if (!existsSync(HARNESS_DEST)) {
    copyFileSync(HARNESS_SRC, HARNESS_DEST);
    createdHarness = true;
    console.log("Harness → src/pages/capture.astro (tymczasowo)");
  }
  try {
    await runCapture();
  } finally {
    if (createdHarness) {
      rmSync(HARNESS_DEST, { force: true });
      console.log("Harness usunięty.");
    }
  }
}

async function runCapture() {
  await waitForRoute();
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 2400, height: 1300 },
    deviceScaleFactor: 1,
  });
  console.log(`Ładowanie ${URL} …`);
  await page.goto(URL, { waitUntil: "load", timeout: 60000 });
  await page.waitForFunction(() => !!window.__cap, null, { timeout: 30000 });
  await page.evaluate(() => window.__cap.ready());
  console.log("ready ✓");

  for (const dev of DEVICES) {
    const has = await page.evaluate((h) => window.__cap[h], dev.has);
    if (!has) {
      console.warn(`⚠ ${dev.key}: root nie zainicjalizowany — pomijam`);
      continue;
    }
    console.log(`\n▶ ${dev.key}: ${N} klatek …`);
    const dir = await captureFrames(page, dev);
    try {
      encode(dev, dir);
    } catch (e) {
      console.error(`✗ ${dev.key} enkod nieudany:`, e.message);
    }
  }

  await browser.close();
  console.log("\n✓ Gotowe →", OUT_DIR);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
