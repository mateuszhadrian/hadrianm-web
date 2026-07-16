// Podstrona /realizacje — zrzuty statycznych regionów na WSZYSTKICH
// 6 profilach (strona bez animacji scrollowych → element-screenshoty jak
// sections.spec.ts, żaden sweep nie jest potrzebny). Determinizm: freeze.css
// (zatrzymuje drift chmur ambientu na desktopie; mobile ma statyczną
// teksturę). Ekrany urządzeń w kartach to na preview znane 404
// (/cdn-cgi/image istnieje tylko na produkcji) — renderują się jako puste,
// deterministycznie, tak samo jak w baseline'ach sekcji #work.
import { expect, test, type Page } from "@playwright/test";
import { usePreviewGuard } from "../helpers/guards";
import { settle } from "../helpers/scroll";
import { prepareSweep } from "../helpers/visual";

const PATH = "/realizacje/";

usePreviewGuard();

async function prepare(page: Page) {
  // prepareSweep = gotoReady + freeze.css + repaint (wspólny helper).
  await prepareSweep(page, PATH);
}

test("podstrona realizacje: widok startowy vs baseline", async ({ page }) => {
  await prepare(page);
  // Zrzut viewportu: navbar bez brandu + przyklejony back button + nagłówek
  // na warstwie ambientu (blue).
  await expect(page).toHaveScreenshot("work-index-top.png");
});

test("podstrona realizacje: siatka kart vs baseline", async ({
  page,
}, testInfo) => {
  await prepare(page);
  const grid = page.locator(".wix-grid");
  await grid.scrollIntoViewIfNeeded();
  await settle(page);
  // Wysoki, PRZEZROCZYSTY element nad ambientem na chromium-pixel-5
  // (DPR 2.75) — ta sama rodzina subpikselowego jittera stitchowania co
  // #contact w sections.spec.ts; podniesiony próg pochłania jitter, realną
  // regresję (>2% pikseli) i tak złapie.
  const ratio = testInfo.project.name === "chromium-pixel-5" ? 0.02 : undefined;
  await expect(grid).toHaveScreenshot("work-index-grid.png", {
    ...(ratio !== undefined ? { maxDiffPixelRatio: ratio } : {}),
  });
});

test("podstrona realizacje: stopka vs baseline", async ({ page }) => {
  await prepare(page);
  const foot = page.locator(".wix-foot");
  await foot.scrollIntoViewIfNeeded();
  await settle(page);
  await expect(foot).toHaveScreenshot("work-index-footer.png");
});
