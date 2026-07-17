// Podstrona /kontakt — zrzuty statycznych regionów na WSZYSTKICH
// 6 profilach (strona bez pinowanych scen → element-screenshoty jak
// sections.spec.ts, żaden sweep nie jest potrzebny; wzorzec
// work-index.spec.ts). Determinizm: freeze.css (zatrzymuje drift chmur
// ambientu na desktopie i wejścia sekcji; mobile ma statyczną teksturę).
// Formularz zrzucamy PRZED interakcją (stan spoczynkowy — mechanikę
// weryfikuje e2e contact.spec.ts).
import { expect, test, type Page } from "@playwright/test";
import { usePreviewGuard } from "../helpers/guards";
import { settle } from "../helpers/scroll";
import { prepareSweep } from "../helpers/visual";

const PATH = "/kontakt/";

usePreviewGuard();

async function prepare(page: Page) {
  // prepareSweep = gotoReady + freeze.css + repaint (wspólny helper).
  await prepareSweep(page, PATH);
}

test("podstrona kontakt: widok startowy vs baseline", async ({ page }) => {
  await prepare(page);
  // Zrzut viewportu: navbar bez brandu + przyklejony back button + nagłówek
  // sekcji na warstwie ambientu (red).
  await expect(page).toHaveScreenshot("contact-index-top.png");
});

test("podstrona kontakt: sekcja formularza vs baseline", async ({
  page,
}, testInfo) => {
  await prepare(page);
  const section = page.locator("#contact");
  await section.scrollIntoViewIfNeeded();
  await settle(page);
  // Wysoki, PRZEZROCZYSTY element nad ambientem na chromium-pixel-5
  // (DPR 2.75) — ta sama rodzina subpikselowego jittera stitchowania co
  // #contact w sections.spec.ts; podniesiony próg pochłania jitter, realną
  // regresję (>2% pikseli) i tak złapie.
  const ratio = testInfo.project.name === "chromium-pixel-5" ? 0.02 : undefined;
  await expect(section).toHaveScreenshot("contact-index-form.png", {
    ...(ratio !== undefined ? { maxDiffPixelRatio: ratio } : {}),
  });
});

test("podstrona kontakt: stopka vs baseline", async ({ page }) => {
  await prepare(page);
  const foot = page.locator(".ktp-foot");
  await foot.scrollIntoViewIfNeeded();
  await settle(page);
  await expect(foot).toHaveScreenshot("contact-index-footer.png");
});
