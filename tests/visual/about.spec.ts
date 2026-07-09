// Sweep wizualny sekcji „O mnie" — sekcja scrubowana jak hero, więc zamiast
// element-screenshotu (sections.spec.ts) fotografujemy viewport w punktach
// osi scrolla sekcji. Desktop: DOKŁADNIE punkty spoczynku snapa
// (ABOUT_SNAP_POINTS) — snap do bieżącej pozycji jest no-opem, więc klatka
// nie dryfuje między przebiegami. Mobile: flow — punkty pokrywają portret
// po wyłonieniu, rozdziały i finał. Settle wydłużony: scrub=1 s dogania
// asymptotycznie, reveale mobile mają ~1,2 s kaskady.
// Decyzje: docs/analiza-sekcja-o-mnie.md §IV.2.
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import {
  ABOUT_DESKTOP_MIN_PX,
  ABOUT_SNAP_POINTS,
} from "../../src/components/sections/about/about-config";
import { assertPreview } from "../helpers/guards";
import { gotoReady, scrollPageToStable, settle } from "../helpers/scroll";

// Te same profile co sweep hero (desktop/iPhone/Pixel).
const ABOUT_PROJECTS = [
  "chromium-1920",
  "webkit-iphone-14",
  "chromium-pixel-5",
];

// Mobile: ułamki zakresu scrolla sekcji (offsetHeight − innerHeight).
const MOBILE_POINTS = [0.12, 0.4, 0.7, 1];

// Scrub (1 s, lerp asymptotyczny) + ewentualny snap muszą zdążyć usiąść.
const SETTLE_MS = 2000;

const FREEZE = fileURLToPath(new URL("../helpers/freeze.css", import.meta.url));

test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();
  await assertPreview(page);
  await page.close();
});

test("sweep scrolla sekcji o-mnie vs baseline", async ({ page }, testInfo) => {
  test.skip(
    !ABOUT_PROJECTS.includes(testInfo.project.name),
    "sweep about tylko na profilach hero (desktop/iPhone/Pixel)",
  );
  test.setTimeout(240_000);

  await gotoReady(page);
  await page.addStyleTag({ path: FREEZE });
  await page.waitForTimeout(400);

  const range = await page.evaluate((minPx) => {
    const about = document.querySelector<HTMLElement>("#about");
    if (!about) return null;
    return {
      top: about.offsetTop,
      span: about.offsetHeight - window.innerHeight,
      max: document.documentElement.scrollHeight - window.innerHeight,
      desktop: matchMedia(`(min-width: ${minPx}px)`).matches, // scena przypięta?
    };
  }, ABOUT_DESKTOP_MIN_PX);
  if (!range) throw new Error("Brak #about na stronie");

  const points = range.desktop ? [...ABOUT_SNAP_POINTS] : MOBILE_POINTS;

  for (let i = 0; i < points.length; i++) {
    const frac = points[i];
    await scrollPageToStable(
      page,
      Math.min(range.top + range.span * frac, range.max),
    );
    await settle(page, SETTLE_MS);

    // Prefiks „about-": snapshoty wszystkich speców trafiają do wspólnego
    // katalogu per-projekt — bez prefiksu nazwy mogłyby kolidować z hero.
    const name = `about-${String(i).padStart(2, "0")}-p${String(
      Math.round(frac * 100),
    ).padStart(3, "0")}.png`;
    // expect.soft: jedna rozjechana klatka nie ucina sweepa (jak w hero).
    await expect.soft(page).toHaveScreenshot(name);
  }
});
