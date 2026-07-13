// Sekcja „O mnie": treść PL/EN w DOM, oś desktopowa (progres 01→04, finał
// odblokowuje CTA), reveale mobile, CTA → #contact (skok jak w navbarze).
import { expect, test } from "@playwright/test";
import { ABOUT_SNAP_POINTS } from "../../src/components/sections/about/about-config";
import { assertPreview } from "../helpers/guards";
import {
  expectSectionAtTop,
  gotoReady,
  scrollPageTo,
  scrollPageToStable,
  settle,
} from "../helpers/scroll";

test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();
  await assertPreview(page);
  await page.close();
});

/** Absolutna pozycja scrolla dla ułamka osi sekcji #about. */
async function aboutScrollAt(
  page: import("@playwright/test").Page,
  frac: number,
): Promise<number> {
  return page.evaluate((f) => {
    const about = document.querySelector<HTMLElement>("#about")!;
    return about.offsetTop + (about.offsetHeight - window.innerHeight) * f;
  }, frac);
}

for (const { path, chapterHead, cta } of [
  {
    path: "/",
    chapterHead: "solidna technologia",
    cta: "Zapraszam do kontaktu",
  },
  { path: "/en/", chapterHead: "solid technology", cta: "Get in touch" },
]) {
  test(`treść sekcji na ${path}: rozdziały, portret, CTA do #contact`, async ({
    page,
  }) => {
    await gotoReady(page, path);
    const about = page.locator("#about");
    await expect(about.locator(".om-ch")).toHaveCount(3);
    await expect(about.locator(".om-ch").first()).toContainText(chapterHead);
    await expect(about.locator(".om-photo")).toHaveCount(1);
    const link = about.locator(".om-cta");
    await expect(link).toHaveAttribute("href", "#contact");
    await expect(link).toContainText(cta);
  });
}

test.describe("desktop: przypięta scena", () => {
  test.skip(({ isMobile }) => !!isMobile, "scena przypięta tylko na desktop");

  test("progres dochodzi do 04/04, finał odblokowuje CTA, klik wiezie do #contact", async ({
    page,
  }) => {
    // ?nosnap — jak w sweepie wizualnym: bez wyścigu ze snapem na runnerach CI.
    await gotoReady(page, "/?nosnap");
    const finalFrac = ABOUT_SNAP_POINTS[ABOUT_SNAP_POINTS.length - 1];
    // Snap wyłączony (?nosnap wyżej) — dojazd siada dokładnie w punkcie osi.
    await scrollPageToStable(page, await aboutScrollAt(page, finalFrac));
    // Scrub (1 s) musi dogonić oś zanim finał będzie widoczny/klikalny.
    await settle(page, 1600);

    const about = page.locator("#about");
    await expect(about.locator(".om-progress .pcount")).toHaveText("04 / 04");
    await expect(about.locator(".om-final")).toHaveClass(/on/);

    await about.locator(".om-cta").click();
    await settle(page);
    await expect(page).toHaveURL(/#contact$/);
    await expectSectionAtTop(page, "contact");
  });
});

test.describe("mobile: flow z revealami", () => {
  test.skip(({ isMobile }) => !isMobile, "flow tylko na mobile");

  test("finał wjeżdża revealem i CTA jest klikalne", async ({ page }) => {
    await gotoReady(page);
    await scrollPageTo(page, await aboutScrollAt(page, 1));
    // Kaskada reveali (~1,2 s) musi się dograć.
    await settle(page, 1600);

    const about = page.locator("#about");
    await expect(about.locator(".om-final .ch-head")).toBeVisible();
    const cta = about.locator(".om-cta");
    await expect(cta).toBeVisible();
    await cta.click();
    await settle(page);
    await expect(page).toHaveURL(/#contact$/);
  });
});
