// DEV-ONLY: nagrywa pętlę „wejście → scroll w dół → powrót" PUBLICZNEJ strony
// klienta jako dwa MP4 (ekran laptopa 1440×900 i telefonu 390×800) + postery
// WebP z klatki 0 — materiał do pola `screens[].video` realizacji (plan:
// docs/analiza-realizacje-wideo.md, D7–D9). Pliki lądują POZA repo; do R2
// wgrywa je panel Sveltia (pola „Wideo" i „Zrzut" ekranu).
//
//   pnpm capture:site -- --url https://delung.pl --slug delung
//   pnpm capture:site -- --url https://delung.pl --slug delung --device desktop --sample
//   pnpm capture:site -- --url … --slug … --mode record        # wariant B (czas rzeczywisty)
//   pnpm capture:site -- --url … --slug … --hide ".cookie,.chat" --depth-desktop 2 --hold 3
//
// Opcje: --key home | --device desktop,mobile | --mode clock|record |
//        --depth-desktop 2.2 --depth-mobile 2.5 (× wysokość viewportu) |
//        --hold 2.5 --down 4 --hold-bottom 0.8 --up 3 --hold-end 0.7 (s) |
//        --hide "<sel>,<sel>" | --lenis | --out <dir> (domyślnie ~/hadrianm-site-videos) |
//        --sample (co 3. klatka — szybki podgląd tempa) | --recapture | --keep-frames |
//        --no-loop-blend (bez wtapiania końcówki w klatkę 0)
//
// Determinizm czasu (D9): tryb `clock` używa fałszywego zegara Playwrighta
// (page.clock: Date, timery, rAF, performance.now) + ręcznego krokowania
// animacji CSS przez Web Animations API — każda klatka to dokładnie 1/30 s
// czasu strony niezależnie od tempa zrzutów. Tryb `record` nagrywa webm
// kontekstu w czasie rzeczywistym (choreografia w rAF strony) i transkoduje.
// CDP `Emulation.setVirtualTimePolicy` odrzucone: przy zatrzymanym czasie
// wirtualnym `captureScreenshot` potrafi wisieć (znany problem headless).
//
// Wymaga: ffmpeg + cwebp (brew install ffmpeg webp) + Playwright chromium.

import { chromium } from "playwright";
import sharp from "sharp";
import { execFileSync } from "node:child_process";
import {
  mkdirSync,
  rmSync,
  readdirSync,
  statSync,
  copyFileSync,
} from "node:fs";
import path from "node:path";
import os from "node:os";

// ── CLI ───────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const flag = (name) => argv.includes(`--${name}`);
const opt = (name, def) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1] : def;
};
const num = (name, def) => Number(opt(name, def));

const URL = opt("url");
const SLUG = opt("slug");
if (!URL || !SLUG) {
  console.error(
    "Użycie: node scripts/capture-site-videos.mjs --url https://… --slug <slug> [opcje]",
  );
  process.exit(2);
}
const KEY = opt("key", "home");
const MODE = opt("mode", "clock"); // clock | record
const DEVICES_ARG = opt("device", "desktop,mobile").split(",");
const HIDE = opt("hide", "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const LENIS = flag("lenis");
// Szew pętli: strony klientów mają elementy żyjące w czasie (slider w hero,
// licznik, ken-burns), więc ostatnia klatka ≠ klatka 0 mimo tej samej pozycji
// scrolla. Końcowy hold wtapiamy liniowo w klatkę 0 (wypieczony crossfade
// w pliku — runtime nic nie robi, D7/§10 planu). Tylko tryb clock (klatki).
const LOOP_BLEND = !flag("no-loop-blend");
const SAMPLE = flag("sample");
const OUT_DIR = path.resolve(
  opt("out", path.join(os.homedir(), "hadrianm-site-videos")),
  SLUG,
);
const TMP = path.join(os.tmpdir(), "hadrianm-site-frames", SLUG);

const FPS = 30;
const TARGET_KB = 800; // twardy limit wagi / plik (jak w hero)
const R2_BASE = "https://media.hadrianm.pl/realizacje/video";

// ── Choreografia (D7): hold → zjazd → hold → powrót → hold; cięcie do klatki 0 ──
const T = {
  hold: num("hold", 2.5),
  down: num("down", 4),
  holdBottom: num("hold-bottom", 0.8),
  up: num("up", 3),
  holdEnd: num("hold-end", 0.7),
};
const DURATION = T.hold + T.down + T.holdBottom + T.up + T.holdEnd;
const smooth = (t) => t * t * t * (t * (t * 6 - 15) + 10); // smootherstep
/** Pozycja scrolla w ułamku głębokości D dla czasu t (s). */
function depthAt(t) {
  let a = T.hold;
  if (t < a) return 0;
  if (t < a + T.down) return smooth((t - a) / T.down);
  a += T.down;
  if (t < a + T.holdBottom) return 1;
  a += T.holdBottom;
  if (t < a + T.up) return 1 - smooth((t - a) / T.up);
  return 0;
}

const DEVICES = [
  {
    key: "desktop",
    viewport: { width: 1440, height: 900 }, // aspekt 1.6 = ekran laptopa w WorkDeviceDuo
    dpr: 1,
    depth: num("depth-desktop", 2.2),
    scale: "720:-2",
    posterWidth: 1440,
    isMobile: false,
  },
  {
    key: "mobile",
    viewport: { width: 390, height: 800 }, // aspekt 0.4875 = ekran telefonu
    dpr: 2, // źródło 780 px → skalowanie w dół do 432, nie w górę
    depth: num("depth-mobile", 2.5),
    scale: "432:-2",
    posterWidth: 780,
    isMobile: true,
  },
].filter((d) => DEVICES_ARG.includes(d.key));

const ff = (args) => execFileSync("ffmpeg", ["-y", ...args], { stdio: "pipe" });
const sizeKB = (f) => statSync(f).size / 1024;
const fileName = (dev, ext) => `${SLUG}-${KEY}-${dev.key}.${ext}`;

// ── Wspólne przygotowanie strony ──────────────────────────────────────────
async function preparePage(page) {
  await page.goto(URL, { waitUntil: "networkidle", timeout: 90_000 });
  if (HIDE.length) {
    await page.addStyleTag({
      content: `${HIDE.join(",")}{display:none!important;visibility:hidden!important}`,
    });
  }
  await page.evaluate(() => document.fonts?.ready);
  // Zasięg scrolla mierzony PO załadowaniu (lazy sekcje mogą go zmienić —
  // mierzymy jeszcze raz po pierwszym zjeździe? nie: pętla musi wrócić do tej
  // samej klatki 0, więc D ustalamy raz).
  return page.evaluate(() => ({
    vh: window.innerHeight,
    max: document.documentElement.scrollHeight - window.innerHeight,
  }));
}

function scrollExpr(y) {
  return LENIS
    ? `(window.__lenis ? window.__lenis.scrollTo(${y}, {immediate:true, force:true}) : 0, window.scrollTo(0, ${y}))`
    : `window.scrollTo(0, ${y})`;
}

// ── Tryb A: fałszywy zegar + krokowanie animacji CSS ──────────────────────
/** Przesuwa animacje CSS/WAAPI do czasu strony `now` (ms od startu nagrania):
 *  każda nowo napotkana animacja startuje w chwili, w której ją zobaczyliśmy. */
const STEP_ANIMATIONS = `(now) => {
  for (const a of document.getAnimations()) {
    if (a.__capStart === undefined) { a.__capStart = now; try { a.pause(); } catch {} }
    try { a.currentTime = Math.max(0, now - a.__capStart); } catch {}
  }
}`;

async function captureFramesClock(browser, dev) {
  const dir = path.join(TMP, dev.key);
  const N = Math.round(FPS * DURATION);
  const step = SAMPLE ? 3 : 1;
  const want = Math.ceil(N / step);
  if (!flag("recapture") && framesReady(dir, want)) {
    console.log(
      `  ${dev.key}: ${want} klatek już jest — pomijam (--recapture wymusza)`,
    );
    return { dir, fps: FPS / step };
  }
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });

  const ctx = await browser.newContext({
    viewport: dev.viewport,
    deviceScaleFactor: dev.dpr,
    isMobile: dev.isMobile,
    hasTouch: dev.isMobile,
    reducedMotion: "no-preference",
    userAgent: dev.isMobile
      ? "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
      : undefined,
  });
  const page = await ctx.newPage();
  // Zegar fałszywy OD STARTU: animacje wejścia biegną tylko wtedy, gdy my
  // przesuwamy czas — stan „po wejściu" jest powtarzalny co do klatki.
  await page.clock.install();
  const { vh, max } = await preparePage(page);
  const D = Math.min(dev.depth * vh, max);
  console.log(
    `  ${dev.key}: vh=${vh}, maxScroll=${max}, D=${Math.round(D)} (${dev.depth}×vh), ${want} klatek @ ${FPS / step} fps`,
  );

  // „Po wejściu": 2.5 s czasu strony w krokach, żeby animacje wejścia usiadły.
  let now = 0;
  for (let i = 0; i < 10; i++) {
    await page.clock.runFor(250);
    now += 250;
    await page.evaluate(STEP_ANIMATIONS, now);
    await page.waitForTimeout(20);
  }
  const t0 = now;

  for (let i = 0; i < want; i++) {
    const t = (i * step) / FPS;
    const y = Math.round(depthAt(t) * D);
    await page.evaluate(scrollExpr(y));
    // Realne ~25 ms: IntersectionObserver / scroll event dostarczane są
    // przez prawdziwą klatkę kompozytora, nie przez fałszywy zegar.
    await page.waitForTimeout(25);
    await page.clock.runFor(Math.round((1000 * step) / FPS));
    now = t0 + Math.round(t * 1000);
    await page.evaluate(STEP_ANIMATIONS, now);
    await page.screenshot({
      path: path.join(dir, String(i).padStart(4, "0") + ".png"),
      animations: "allow",
      caret: "hide",
    });
    if (i % 30 === 0)
      process.stdout.write(
        `    klatka ${i}/${want} (t=${t.toFixed(1)}s, y=${y})\n`,
      );
  }
  await ctx.close();
  return { dir, fps: FPS / step };
}

// ── Tryb B: nagranie w czasie rzeczywistym (recordVideo) ──────────────────
async function captureRecord(browser, dev) {
  const recDir = path.join(TMP, `${dev.key}-record`);
  rmSync(recDir, { recursive: true, force: true });
  mkdirSync(recDir, { recursive: true });
  const size = {
    width: dev.viewport.width * dev.dpr,
    height: dev.viewport.height * dev.dpr,
  };
  const ctx = await browser.newContext({
    viewport: dev.viewport,
    deviceScaleFactor: dev.dpr,
    isMobile: dev.isMobile,
    hasTouch: dev.isMobile,
    reducedMotion: "no-preference",
    recordVideo: { dir: recDir, size },
  });
  const page = await ctx.newPage();
  const started = Date.now();
  const { vh, max } = await preparePage(page);
  const D = Math.min(dev.depth * vh, max);
  await page.waitForTimeout(2000); // animacje wejścia w czasie rzeczywistym
  const offsetMs = Date.now() - started;
  console.log(
    `  ${dev.key}: vh=${vh}, maxScroll=${max}, D=${Math.round(D)}; start choreografii po ${offsetMs} ms nagrania`,
  );
  // Choreografia w rAF strony (czas rzeczywisty).
  await page.evaluate(
    ({ D, T, lenis }) => {
      const smooth = (t) => t * t * t * (t * (t * 6 - 15) + 10);
      const dur = T.hold + T.down + T.holdBottom + T.up + T.holdEnd;
      const depthAt = (t) => {
        let a = T.hold;
        if (t < a) return 0;
        if (t < a + T.down) return smooth((t - a) / T.down);
        a += T.down;
        if (t < a + T.holdBottom) return 1;
        a += T.holdBottom;
        if (t < a + T.up) return 1 - smooth((t - a) / T.up);
        return 0;
      };
      return new Promise((resolve) => {
        const start = performance.now();
        const tick = (ts) => {
          const t = (ts - start) / 1000;
          const y = Math.round(depthAt(Math.min(t, dur)) * D);
          if (lenis && window.__lenis)
            window.__lenis.scrollTo(y, { immediate: true, force: true });
          window.scrollTo(0, y);
          if (t < dur) requestAnimationFrame(tick);
          else resolve();
        };
        requestAnimationFrame(tick);
      });
    },
    { D, T, lenis: LENIS },
  );
  await page.waitForTimeout(300);
  const video = page.video();
  await ctx.close();
  const webm = await video.path();
  return { webm, offsetMs };
}

// ── Wtopienie końcówki w klatkę 0 (bezszwowa pętla) ───────────────────────
/** Zwraca katalog z klatkami do enkodu: kopie oryginałów + ostatnie klatki
 *  (segment holdEnd) zblendowane z klatką 0 narastającą alfą (ostatnia = 0). */
async function blendLoop(dir, fps) {
  const out = `${dir}-blend`;
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  const frames = readdirSync(dir)
    .filter((f) => f.endsWith(".png"))
    .sort();
  const n = Math.max(2, Math.round(T.holdEnd * fps));
  const start = frames.length - n;
  const frame0 = await sharp(path.join(dir, frames[0]))
    .ensureAlpha()
    .toBuffer();
  const meta = await sharp(frame0).metadata();
  for (let i = 0; i < frames.length; i++) {
    const src = path.join(dir, frames[i]);
    const dst = path.join(out, frames[i]);
    if (i < start) {
      copyFileSync(src, dst);
      continue;
    }
    const alpha = (i - start + 1) / n; // 1/n … 1
    const overlay = await sharp(frame0).ensureAlpha(alpha).png().toBuffer();
    await sharp(src)
      .composite([{ input: overlay, blend: "over" }])
      .png()
      .toFile(dst);
  }
  console.log(
    `  pętla: ostatnie ${n} klatek wtopione w klatkę 0 (${meta.width}×${meta.height})`,
  );
  return out;
}

// ── Enkod ─────────────────────────────────────────────────────────────────
function framesReady(dir, n) {
  try {
    return readdirSync(dir).filter((f) => f.endsWith(".png")).length >= n;
  } catch {
    return false;
  }
}

function encodeTwoPass(dev, inputArgs, framesDirForLog, duration) {
  mkdirSync(OUT_DIR, { recursive: true });
  const mp4 = path.join(OUT_DIR, fileName(dev, "mp4"));
  const passlog = path.join(framesDirForLog, "ff2pass");
  let kbps = Math.floor((TARGET_KB * 8 * 0.96) / duration);
  for (let attempt = 0; attempt < 4; attempt++) {
    const common = [
      ...inputArgs,
      "-an",
      "-c:v",
      "libx264",
      "-profile:v",
      "high",
      "-pix_fmt",
      "yuv420p",
      "-vf",
      `scale=${dev.scale}:flags=lanczos`,
      "-r",
      String(FPS),
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
      `  ${path.basename(mp4)}: ${kb.toFixed(0)} KB @ ${kbps} kbps (próba ${attempt + 1})`,
    );
    if (kb <= TARGET_KB) break;
    kbps = Math.floor(kbps * (TARGET_KB / kb) * 0.95);
  }
  for (const f of readdirSync(framesDirForLog)) {
    if (f.startsWith("ff2pass"))
      rmSync(path.join(framesDirForLog, f), { force: true });
  }
  return mp4;
}

function poster(dev, pngFrame0) {
  const out = path.join(OUT_DIR, fileName(dev, "webp"));
  execFileSync(
    "cwebp",
    ["-q", "80", "-resize", String(dev.posterWidth), "0", pngFrame0, "-o", out],
    { stdio: "pipe" },
  );
  console.log(
    `  ${path.basename(out)} (poster, klatka 0): ${sizeKB(out).toFixed(0)} KB`,
  );
  return out;
}

// ── Main ──────────────────────────────────────────────────────────────────
async function main() {
  console.log(
    `▶ ${URL} → ${OUT_DIR}\n  tryb: ${MODE}, ${DURATION.toFixed(1)} s, D7: ${JSON.stringify(T)}`,
  );
  mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const made = [];
  for (const dev of DEVICES) {
    console.log(
      `\n■ ${dev.key} (${dev.viewport.width}×${dev.viewport.height} @${dev.dpr}x)`,
    );
    if (MODE === "record") {
      const { webm, offsetMs } = await captureRecord(browser, dev);
      const dir = path.dirname(webm);
      // webm zaczyna się od startu kontekstu — przycinamy do choreografii.
      const mp4 = encodeTwoPass(
        dev,
        [
          "-ss",
          (offsetMs / 1000).toFixed(3),
          "-t",
          DURATION.toFixed(3),
          "-i",
          webm,
        ],
        dir,
        DURATION,
      );
      const frame0 = path.join(dir, "frame0.png");
      ff([
        "-ss",
        (offsetMs / 1000).toFixed(3),
        "-i",
        webm,
        "-frames:v",
        "1",
        frame0,
      ]);
      made.push(mp4, poster(dev, frame0));
    } else {
      const { dir, fps } = await captureFramesClock(browser, dev);
      const encDir = LOOP_BLEND ? await blendLoop(dir, fps) : dir;
      const mp4 = encodeTwoPass(
        dev,
        ["-framerate", String(fps), "-i", path.join(encDir, "%04d.png")],
        encDir,
        DURATION,
      );
      made.push(mp4, poster(dev, path.join(dir, "0000.png")));
      // Klatki (setki PNG) zostają tylko na życzenie — do szybkiego re-enkodu
      // bez ponownego nagrania (`--keep-frames`, potem bez `--recapture`).
      if (encDir !== dir) rmSync(encDir, { recursive: true, force: true });
      if (!flag("keep-frames")) rmSync(dir, { recursive: true, force: true });
    }
  }
  await browser.close();

  console.log("\n✓ Pliki:");
  for (const f of made) {
    const probe = f.endsWith(".mp4")
      ? execFileSync(
          "ffprobe",
          [
            "-v",
            "error",
            "-select_streams",
            "v:0",
            "-show_entries",
            "stream=width,height,r_frame_rate,duration",
            "-of",
            "csv=p=0",
            f,
          ],
          { encoding: "utf8" },
        ).trim()
      : "";
    console.log(`  ${f}  ${probe ? `(${probe})` : ""}`);
  }
  console.log(
    "\nURL-e do pola „Wideo” ekranu w panelu (po wgraniu przez widget file):",
  );
  for (const dev of DEVICES)
    console.log(`  ${R2_BASE}/${fileName(dev, "mp4")}`);
  console.log(
    "Postery (.webp) wgraj przez pola „Zrzut DESKTOP / MOBILE” tego samego ekranu.",
  );
  if (SAMPLE)
    console.log(
      "\n(--sample: 10 fps — tylko podgląd tempa; do publikacji nagraj bez --sample)",
    );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
