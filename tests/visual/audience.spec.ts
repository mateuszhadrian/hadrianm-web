// Sweep wizualny sekcji „Dla kogo" — sekcja scrubowana jak hero/about, więc
// zamiast element-screenshotu (sections.spec.ts) fotografujemy viewport
// w punktach osi scrolla sekcji. Desktop: DOKŁADNIE punkty spoczynku snapa
// (AUDIENCE_SNAP_POINTS) — snap do bieżącej pozycji jest no-opem, więc klatka
// nie dryfuje między przebiegami. Mobile: flow — punkty pokrywają rozdziały
// z oknami po crossfade blur→sharp. freeze.css gasi też marquee i kursor
// mocków (czasowe animacje CSS) — determinizm klatek desktop.
// Decyzje: docs/analiza-sekcja-dla-kogo.md §IV.
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import {
  AUDIENCE_DESKTOP_MIN_PX,
  AUDIENCE_SNAP_POINTS,
} from "../../src/components/sections/audience/audience-config";
import { assertPreview } from "../helpers/guards";
import { gotoReady, scrollPageToStable, settle } from "../helpers/scroll";

// Te same profile co sweepy hero i about (desktop/iPhone/Pixel).
const AUDIENCE_PROJECTS = [
  "chromium-1920",
  "webkit-iphone-14",
  "chromium-pixel-5",
];

// Mobile: ułamki zakresu scrolla sekcji (offsetHeight − innerHeight).
const MOBILE_POINTS = [0.12, 0.4, 0.7, 1];

// Scrub (0.6 s, lerp asymptotyczny) + reveale mobile muszą zdążyć usiąść.
const SETTLE_MS = 2000;

const FREEZE = fileURLToPath(new URL("../helpers/freeze.css", import.meta.url));

test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();
  await assertPreview(page);
  await page.close();
});

test("sweep scrolla sekcji dla-kogo vs baseline", async ({
  page,
}, testInfo) => {
  test.skip(
    !AUDIENCE_PROJECTS.includes(testInfo.project.name),
    "sweep audience tylko na profilach hero (desktop/iPhone/Pixel)",
  );
  test.setTimeout(240_000);

  // ?nosnap: snap wyłączony na czas testu — programowy dojazd do punktów osi
  // nie ściga się ze snapem na wolnych runnerach CI (kadry bez zmian: punkty
  // sweepa to i tak pozycje spoczynku snapa).
  await gotoReady(page, "/?nosnap");
  await page.addStyleTag({ path: FREEZE });
  await page.waitForTimeout(400);

  const range = await page.evaluate((minPx) => {
    const audience = document.querySelector<HTMLElement>("#audience");
    if (!audience) return null;
    return {
      top: audience.offsetTop,
      span: audience.offsetHeight - window.innerHeight,
      max: document.documentElement.scrollHeight - window.innerHeight,
      desktop: matchMedia(`(min-width: ${minPx}px)`).matches, // scena przypięta?
    };
  }, AUDIENCE_DESKTOP_MIN_PX);
  if (!range) throw new Error("Brak #audience na stronie");

  const points = range.desktop ? [...AUDIENCE_SNAP_POINTS] : MOBILE_POINTS;

  for (let i = 0; i < points.length; i++) {
    const frac = points[i];
    await scrollPageToStable(
      page,
      Math.min(range.top + range.span * frac, range.max),
    );
    await settle(page, SETTLE_MS);

    // Prefiks „audience-": snapshoty wszystkich speców trafiają do wspólnego
    // katalogu per-projekt — bez prefiksu nazwy mogłyby kolidować.
    const name = `audience-${String(i).padStart(2, "0")}-p${String(
      Math.round(frac * 100),
    ).padStart(3, "0")}.png`;
    // expect.soft: jedna rozjechana klatka nie ucina sweepa (jak w hero).
    await expect.soft(page).toHaveScreenshot(name);
  }
});
