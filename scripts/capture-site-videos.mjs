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
//        --no-loop-blend (bez wtapiania końcówki w klatkę 0) |
//        --screens "gallery=/realizacje/,offer=/oferta/" (statyczne zrzuty
//        podstron jako pozostałe ekrany wpisu → <out>/<slug>/screens/;
//        z `--device none` = same zrzuty, bez nagrania)
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
// Pozostałe ekrany wpisu (galeria, oferta…) = zwykłe zrzuty podstron tym
// samym viewportem co nagranie (spójny kadr z posterem `home`), po
// odczekaniu na animacje wejścia w czasie rzeczywistym; "klucz=ścieżka".
const SCREENS = opt("screens", "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean)
  .map((s) => {
    const [key, p] = s.split("=");
    if (!key || !p) {
      console.error(`--screens: oczekiwano "klucz=/sciezka/", dostałem "${s}"`);
      process.exit(2);
    }
    return { key, path: p };
  });
const OUT_DIR = path.resolve(
  opt("out", path.join(os.homedir(), "hadrianm-site-videos")),
  SLUG,
);
const TMP = path.join(os.tmpdir(), "hadrianm-site-frames", SLUG);

const FPS = 30;
const TARGET_KB = 800; // twardy limit wagi / plik (jak w hero)
// Panel wgrywa pliki widgetu `file` do prefixu `realizacje/` z config.yml
// (płasko, bez podfolderu `video/` — korekta D4 planu, 2026-10-21).
const R2_BASE = "https://media.hadrianm.pl/realizacje";

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

const ALL_DEVICES = [
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
];
// `--device none --screens …` = same zrzuty podstron, bez nagrania.
const DEVICES = ALL_DEVICES.filter((d) => DEVICES_ARG.includes(d.key));

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

// ── Tryb A: fałszywy zegar + krokowanie animacji CSS i <video> ────────────
/** Przesuwa animacje CSS/WAAPI i elementy <video> z czasu strony `prev` do
 *  `now` (ms od startu nagrania). MUSI być prawdziwą funkcją, nie stringiem:
 *  `page.evaluate("(now) => {…}")` traktuje string jako WYRAŻENIE (wynik =
 *  niewywołana funkcja, zwrot `undefined`) — tak było w P4 i animacje CSS
 *  biegły w czasie rzeczywistym (slider hero delung ~13× za szybko).
 *  - Animacja napotkana po raz pierwszy liczy się od POPRZEDNIEGO kroku
 *    (`prev`), nie od zera: przejścia CSS wyzwalane przez JS co klatkę
 *    (pasek kart „Co tworzymy?" delung: `transition: transform` na wartość
 *    ze scrolla) powstają po kroku i są zastępowane przed następnym — ze
 *    startem od 0 element stałby w miejscu przez cały zjazd. Start od
 *    `prev` = dokładnie 1 klatka postępu, jak w prawdziwej przeglądarce
 *    przy 30 fps. Ujemny `animation-delay` jest w `currentTime` już
 *    uwzględniony — nie dodawać go drugi raz.
 *  - <video> grające samo (hero Hetmana) jest pauzowane i przewijane
 *    (`currentTime`) przyrostowo: Δt × `playbackRate` (strona klienta może
 *    zwalniać film pod koniec); po dojściu do końca dostaje zdarzenie
 *    `ended` (seek go nie wyzwala), żeby JS klienta zrobił to, co na żywo
 *    (Hetman: podmiana na zdjęcie). W fazie „po wejściu" (`holdVideo`)
 *    film stoi na klatce 0 — pętla zaczyna się tam, gdzie wejście
 *    odwiedzającego: animacje wejścia usiadły, film rusza od początku.
 *    Czekanie na `seeked` robi strona Node (fałszywy zegar nie odpala
 *    `setTimeout` w stronie). Wymaga serwera z obsługą Range — patrz
 *    `installMediaRangeShim`. */
function stepPageTime({ now, prev, holdVideo }) {
  for (const a of document.getAnimations()) {
    if (a.__capStart === undefined) {
      a.__capStart = prev;
      try {
        a.pause();
      } catch {
        /* animacja już zakończona — nic do pauzy */
      }
    }
    try {
      a.currentTime = Math.max(0, now - a.__capStart);
    } catch {
      /* animacja usunięta między wywołaniami */
    }
  }
  let seeking = 0;
  for (const v of document.querySelectorAll("video")) {
    if (v.__capT === undefined) {
      if (v.paused) continue; // jeszcze nie gra — nie ruszamy
      v.__capT = 0;
    }
    if (!v.paused) v.pause();
    const dur = Number.isFinite(v.duration) ? v.duration : Infinity;
    const rate = v.playbackRate || 1;
    if (!holdVideo)
      v.__capT = Math.min(v.__capT + ((now - prev) / 1000) * rate, dur);
    if (Math.abs(v.currentTime - v.__capT) > 0.001) {
      v.currentTime = v.__capT;
      seeking++;
    }
    if (v.__capT >= dur && !v.__capEnded) {
      v.__capEnded = true;
      v.dispatchEvent(new Event("ended"));
    }
  }
  return seeking;
}
/** Chromium pozwala przewijać <video> tylko wtedy, gdy serwer obsługuje
 *  Range (206 + `Accept-Ranges`); bez tego `seekable` = [0, 0] i każdy seek
 *  ląduje na 0 (tak serwuje np. podgląd `nowa.hetmannieruchomosci.com`).
 *  Pliki wideo przechodzą więc przez `route`: pobrane raz w całości,
 *  odpowiedzi na Range składane lokalnie. */
const mediaCache = new Map();
async function installMediaRangeShim(ctx) {
  await ctx.route(/\.(mp4|webm|mov|m4v)(\?.*)?$/i, async (route) => {
    const req = route.request();
    const url = req.url();
    let entry = mediaCache.get(url);
    if (!entry) {
      const headers = { ...req.headers() };
      delete headers.range;
      const res = await route.fetch({ headers });
      entry = {
        body: await res.body(),
        type: res.headers()["content-type"] || "video/mp4",
      };
      mediaCache.set(url, entry);
    }
    const total = entry.body.length;
    const m = /bytes=(\d*)-(\d*)/.exec(req.headers().range || "");
    if (!m) {
      return route.fulfill({
        status: 200,
        headers: {
          "content-type": entry.type,
          "accept-ranges": "bytes",
          "content-length": String(total),
        },
        body: entry.body,
      });
    }
    const start = m[1] ? Number(m[1]) : Math.max(0, total - Number(m[2]));
    const end = m[1] && m[2] ? Math.min(Number(m[2]), total - 1) : total - 1;
    return route.fulfill({
      status: 206,
      headers: {
        "content-type": entry.type,
        "accept-ranges": "bytes",
        "content-range": `bytes ${start}-${end}/${total}`,
        "content-length": String(end - start + 1),
      },
      body: entry.body.subarray(start, end + 1),
    });
  });
}
/** Krok czasu strony + (gdy trzeba) oczekiwanie na dosunięcie <video>;
 *  limit po stronie Node, bo timery strony są fałszywe. */
async function stepPage(page, now, prev, holdVideo = false) {
  const seeking = await page.evaluate(stepPageTime, { now, prev, holdVideo });
  if (!seeking) return;
  await Promise.race([
    page.evaluate(
      () =>
        new Promise((resolve) => {
          const pending = [...document.querySelectorAll("video")].filter(
            (v) => v.seeking,
          );
          if (!pending.length) return resolve();
          let left = pending.length;
          for (const v of pending)
            v.addEventListener("seeked", () => --left || resolve(), {
              once: true,
            });
        }),
    ),
    new Promise((r) => setTimeout(r, 1000)),
  ]);
}

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
  await installMediaRangeShim(ctx);
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
  let prev = 0;
  for (let i = 0; i < 10; i++) {
    await page.clock.runFor(250);
    now += 250;
    await stepPage(page, now, prev, true);
    prev = now;
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
    await stepPage(page, now, prev);
    prev = now;
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

// ── Pozostałe ekrany: statyczne zrzuty podstron (--screens) ───────────────
async function captureScreens(browser) {
  if (!SCREENS.length) return [];
  const dir = path.join(OUT_DIR, "screens");
  mkdirSync(dir, { recursive: true });
  const origin = new globalThis.URL(URL).origin;
  const out = [];
  for (const { key, path: p } of SCREENS) {
    console.log(`\n■ ekran ${key} ← ${origin}${p}`);
    for (const dev of ALL_DEVICES) {
      const ctx = await browser.newContext({
        viewport: dev.viewport,
        deviceScaleFactor: dev.dpr,
        isMobile: dev.isMobile,
        hasTouch: dev.isMobile,
        reducedMotion: "no-preference",
      });
      const page = await ctx.newPage();
      await page.goto(origin + p, {
        waitUntil: "networkidle",
        timeout: 90_000,
      });
      if (HIDE.length) {
        await page.addStyleTag({
          content: `${HIDE.join(",")}{display:none!important;visibility:hidden!important}`,
        });
      }
      await page.evaluate(() => document.fonts?.ready);
      await page.waitForTimeout(3500); // animacje wejścia w czasie rzeczywistym
      const png = await page.screenshot({
        animations: "disabled",
        caret: "hide",
      });
      const file = path.join(dir, `${SLUG}-${key}-${dev.key}.webp`);
      await sharp(png).webp({ quality: 80 }).toFile(file);
      console.log(`  ${path.basename(file)}: ${sizeKB(file).toFixed(0)} KB`);
      out.push(file);
      await ctx.close();
    }
  }
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
  const shots = await captureScreens(browser);
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
  if (shots.length) {
    console.log(
      "\nZrzuty pozostałych ekranów (pola „Zrzut” kolejnych ekranów wpisu):",
    );
    for (const f of shots) console.log(`  ${f}`);
  }
  if (SAMPLE)
    console.log(
      "\n(--sample: 10 fps — tylko podgląd tempa; do publikacji nagraj bez --sample)",
    );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
