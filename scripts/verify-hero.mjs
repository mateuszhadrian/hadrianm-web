// Siatka regresyjna refactoru hero (krok 0 — docs/analiza-refactor-hero-odkruszenie.md).
// Sweep progresu scrolla sekcji #hero na 3 profilach (desktop / iPhone / Pixel),
// screenshoty → baseline / pixel-diff vs baseline.
//
// Użycie:
//   pnpm build && pnpm preview          # w tle (stan jak produkcja)
//   node scripts/verify-hero.mjs --baseline   # zapisz wzorzec (obecny stan = wzorzec)
//   node scripts/verify-hero.mjs              # porównaj bieżący stan ze wzorcem
//
//   BASE_URL=http://localhost:4321 (domyślnie)  PROFILES=desktop,iphone,pixel
//
// Determinizm zrzutów:
//   - injektowany styl wyłącza czasowe animacje CSS (drift tła, accent-wave,
//     scroll-pulse) i chowa .screen__video (klatki wideo różnią się między
//     przebiegami); animacje scroll-driven (GSAP scrub) zostają — to je testujemy;
//   - scroll przez window.__lenis.scrollTo(y, {immediate}) + window.scrollTo;
//   - settle: 2×rAF + timeout.
// Emulacja NIE wykrywa: limitu warstwy GPU Androida, Low Power Mode — te
// obszary wymagają testu na fizycznych urządzeniach (tabela w analizie).

import { chromium, devices } from "playwright";
import sharp from "sharp";
import { mkdirSync, existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(fileURLToPath(import.meta.url), "../..");
const OUT_ROOT = path.join(ROOT, ".hero-verify");
const BASELINE_DIR = path.join(OUT_ROOT, "baseline");
const CURRENT_DIR = path.join(OUT_ROOT, "current");
const DIFF_DIR = path.join(OUT_ROOT, "diff");

const BASE_URL = process.env.BASE_URL || "http://localhost:4321";
const IS_BASELINE = process.argv.includes("--baseline");

// Punkty sweepa jako ułamek zakresu scrolla hero (offsetHeight − innerHeight);
// ostatni > 1 = tuż za odpięciem sticky (clamp do maksymalnego scrolla strony).
const POINTS = [0, 0.06, 0.14, 0.24, 0.36, 0.5, 0.64, 0.78, 0.9, 1.0, 1.06];

// Progi diffu: kanał różny gdy |Δ| > 25; klatka FAIL gdy > 0.05% pikseli.
const CHANNEL_TOLERANCE = 25;
const FAIL_PIXEL_RATIO = 0.0005;

const ALL_PROFILES = {
  desktop: {
    label: "desktop 1440×900",
    options: { viewport: { width: 1440, height: 900 } },
  },
  iphone: { label: "iPhone 14", options: { ...devices["iPhone 14"] } },
  pixel: { label: "Pixel 7", options: { ...devices["Pixel 7"] } },
};
const profileNames = (process.env.PROFILES || "desktop,iphone,pixel")
  .split(",")
  .map((s) => s.trim())
  .filter((s) => s in ALL_PROFILES);

const FREEZE_CSS = `
  *, *::before, *::after {
    animation: none !important;
    transition: none !important;
  }
  .screen__video { visibility: hidden !important; }
`;

async function assertServer() {
  let html;
  try {
    const res = await fetch(BASE_URL, { redirect: "follow" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    html = await res.text();
  } catch (e) {
    console.error(
      `Serwer nie odpowiada pod ${BASE_URL} (${e.message}).\n` +
        `Uruchom najpierw: pnpm build && pnpm preview (lub ustaw BASE_URL).`,
    );
    process.exit(1);
  }
  // Strażnik: baseline jest robiony na PREVIEW (build produkcyjny). Jeśli na
  // porcie siedzi dev server (np. odpalony do testów na telefonie), diff
  // porówna dev z preview i zgłosi fałszywe regresje. Astro dev wstrzykuje
  // klienta Vite — wykrywamy i przerywamy.
  if (html.includes("/@vite/client")) {
    console.error(
      `Pod ${BASE_URL} działa DEV SERVER (wykryto /@vite/client) — harness ` +
        `wymaga preview.\nZostaw dev na 4321 i odpal: pnpm preview --port 4399, ` +
        `potem BASE_URL=http://localhost:4399 node scripts/verify-hero.mjs`,
    );
    process.exit(1);
  }
}

async function sweepProfile(browser, name, outDir) {
  const { label, options } = ALL_PROFILES[name];
  const context = await browser.newContext({
    ...options,
    reducedMotion: "no-preference",
  });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(String(err)));
  // /cdn-cgi/image istnieje tylko na produkcji (Cloudflare) — lokalne 404
  // obrazów realizacji to znany artefakt preview, nie błąd hero.
  page.on("response", (res) => {
    if (res.status() === 404 && !res.url().includes("/cdn-cgi/image/")) {
      consoleErrors.push(`404: ${res.url()}`);
    }
  });

  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts?.ready);
  await page.addStyleTag({ content: FREEZE_CSS });
  await page.waitForTimeout(400);

  const range = await page.evaluate(() => {
    const hero = document.querySelector("#hero");
    if (!hero) return null;
    return {
      hero: hero.offsetHeight - window.innerHeight,
      max: document.documentElement.scrollHeight - window.innerHeight,
    };
  });
  if (!range) {
    await context.close();
    throw new Error(`[${name}] brak #hero na stronie`);
  }

  const videoStates = [];
  for (let i = 0; i < POINTS.length; i++) {
    const frac = POINTS[i];
    const y = Math.min(Math.round(range.hero * frac), range.max);
    await page.evaluate((top) => {
      const lenis = window.__lenis;
      if (lenis && typeof lenis.scrollTo === "function") {
        lenis.scrollTo(top, { immediate: true, force: true });
      }
      window.scrollTo(0, top);
    }, y);
    await page.evaluate(
      () =>
        new Promise((r) =>
          requestAnimationFrame(() => requestAnimationFrame(r)),
        ),
    );
    await page.waitForTimeout(350);

    const file = `${name}-${String(i).padStart(2, "0")}-p${String(
      Math.round(frac * 100),
    ).padStart(3, "0")}.png`;
    await page.screenshot({
      path: path.join(outDir, file),
      animations: "disabled",
    });

    // stan wideo (funkcjonalnie, poza pikselami — wideo jest schowane stylem)
    const vids = await page.evaluate(() =>
      [...document.querySelectorAll(".screen__video")].map((v) => ({
        paused: v.paused,
        t: Math.round(v.currentTime * 10) / 10,
        src: !!v.src,
      })),
    );
    videoStates.push({ frac, vids });
  }

  await context.close();
  return { name, label, videoStates, consoleErrors };
}

async function diffPair(baseFile, currFile, diffFile) {
  const [a, b] = await Promise.all(
    [baseFile, currFile].map((f) =>
      sharp(f).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
    ),
  );
  if (a.info.width !== b.info.width || a.info.height !== b.info.height) {
    return { status: "SIZE", ratio: 1 };
  }
  const { width, height } = a.info;
  const total = width * height;
  const out = Buffer.alloc(total * 4);
  let bad = 0;
  for (let p = 0; p < total; p++) {
    const o = p * 4;
    const dr = Math.abs(a.data[o] - b.data[o]);
    const dg = Math.abs(a.data[o + 1] - b.data[o + 1]);
    const db = Math.abs(a.data[o + 2] - b.data[o + 2]);
    if (
      dr > CHANNEL_TOLERANCE ||
      dg > CHANNEL_TOLERANCE ||
      db > CHANNEL_TOLERANCE
    ) {
      bad++;
      out[o] = 255;
      out[o + 1] = 0;
      out[o + 2] = 60;
      out[o + 3] = 255;
    } else {
      // przygaszony oryginał jako tło diffu
      out[o] = a.data[o] >> 2;
      out[o + 1] = a.data[o + 1] >> 2;
      out[o + 2] = a.data[o + 2] >> 2;
      out[o + 3] = 255;
    }
  }
  const ratio = bad / total;
  if (ratio > 0) {
    await sharp(out, { raw: { width, height, channels: 4 } })
      .png()
      .toFile(diffFile);
  }
  return { status: ratio > FAIL_PIXEL_RATIO ? "FAIL" : "OK", ratio };
}

async function main() {
  await assertServer();
  const outDir = IS_BASELINE ? BASELINE_DIR : CURRENT_DIR;
  [OUT_ROOT, outDir, DIFF_DIR].forEach((d) =>
    mkdirSync(d, { recursive: true }),
  );

  if (!IS_BASELINE && !existsSync(BASELINE_DIR)) {
    console.error(
      "Brak baseline'u — najpierw: node scripts/verify-hero.mjs --baseline",
    );
    process.exit(1);
  }

  const browser = await chromium.launch();
  const reports = [];
  for (const name of profileNames) {
    console.log(`▶ ${ALL_PROFILES[name].label} …`);
    reports.push(await sweepProfile(browser, name, outDir));
  }
  await browser.close();

  // raport funkcjonalny: wideo powinno grać na profilach mobile w środku sweepa
  for (const r of reports) {
    if (r.name !== "desktop") {
      const mid = r.videoStates[Math.floor(POINTS.length / 2)];
      const playing = mid.vids.filter((v) => v.src && !v.paused).length;
      console.log(
        `  [${r.name}] wideo w połowie sweepa: ${playing}/${mid.vids.length} gra ` +
          `(currentTime: ${mid.vids.map((v) => v.t).join("s, ")}s)`,
      );
    }
    const realErrors = [...new Set(r.consoleErrors)].filter(
      (e) => !/Failed to load resource.*404/.test(e),
    );
    if (realErrors.length) {
      console.log(`  [${r.name}] BŁĘDY KONSOLI (${realErrors.length}):`);
      realErrors
        .slice(0, 5)
        .forEach((e) => console.log(`    - ${e.slice(0, 200)}`));
    }
  }

  if (IS_BASELINE) {
    const n = readdirSync(BASELINE_DIR).filter((f) =>
      f.endsWith(".png"),
    ).length;
    console.log(`\n✔ Baseline zapisany: ${n} klatek → ${BASELINE_DIR}`);
    return;
  }

  console.log("\nPorównanie z baseline:");
  let failures = 0;
  const files = readdirSync(BASELINE_DIR)
    .filter((f) => f.endsWith(".png"))
    .sort();
  for (const f of files) {
    const curr = path.join(CURRENT_DIR, f);
    if (!existsSync(curr)) {
      console.log(`  MISSING  ${f}`);
      failures++;
      continue;
    }
    const { status, ratio } = await diffPair(
      path.join(BASELINE_DIR, f),
      curr,
      path.join(DIFF_DIR, f),
    );
    const pct = (ratio * 100).toFixed(3);
    if (status !== "OK") failures++;
    console.log(`  ${status.padEnd(7)} ${f}  (${pct}% pikseli)`);
  }
  console.log(
    failures
      ? `\n✘ ${failures} klatek się różni — obrazy różnic w ${DIFF_DIR}`
      : "\n✔ Zero różnic względem baseline'u",
  );
  process.exit(failures ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
