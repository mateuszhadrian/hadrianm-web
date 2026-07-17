// Sekcja „O mnie" — od migracji na podstronę (docs/analiza-podstrona-o-mnie.md)
// pełny wariant żyje na /o-mnie/ (EN: /en/about/) i tam testujemy mechanikę:
// treść PL/EN w DOM, oś desktopowa (progres 01→04, finał odblokowuje CTA),
// reveale mobile. CTA finału to placeholder „#" do czasu migracji sekcji
// kontaktu (nawigację-nie-nawigację weryfikuje about-index.spec.ts; tam też
// meta/navbar/BackButton podstrony i zajawka na stronie głównej).
import { expect, test } from "@playwright/test";
import { ABOUT_SNAP_POINTS } from "../../src/components/sections/about/about-config";
import { usePreviewGuard } from "../helpers/guards";
import {
  gotoReady,
  scrollPageTo,
  scrollPageToStable,
  settle,
} from "../helpers/scroll";

usePreviewGuard();

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
    path: "/o-mnie/",
    chapterHead: "solidna technologia",
    cta: "Zapraszam do kontaktu",
  },
  {
    path: "/en/about/",
    chapterHead: "solid technology",
    cta: "Get in touch",
  },
]) {
  test(`treść sekcji na ${path}: rozdziały, portret, CTA-placeholder`, async ({
    page,
  }) => {
    await gotoReady(page, path);
    const about = page.locator("#about");
    await expect(about.locator(".om-ch")).toHaveCount(3);
    await expect(about.locator(".om-ch").first()).toContainText(chapterHead);
    await expect(about.locator(".om-photo")).toHaveCount(1);
    const link = about.locator(".om-cta");
    await expect(link).toHaveAttribute("href", "#");
    await expect(link).toContainText(cta);
  });
}

test.describe("desktop: przypięta scena", () => {
  test.skip(({ isMobile }) => !!isMobile, "scena przypięta tylko na desktop");

  test("progres dochodzi do 04/04, finał odblokowuje CTA", async ({ page }) => {
    // ?nosnap — jak w sweepie wizualnym: bez wyścigu ze snapem na runnerach CI.
    await gotoReady(page, "/o-mnie/?nosnap");
    const finalFrac = ABOUT_SNAP_POINTS[ABOUT_SNAP_POINTS.length - 1];
    // Snap wyłączony (?nosnap wyżej) — dojazd siada dokładnie w punkcie osi.
    await scrollPageToStable(page, await aboutScrollAt(page, finalFrac));
    // Scrub (1 s) musi dogonić oś zanim finał będzie widoczny/klikalny.
    await settle(page, 1600);

    const about = page.locator("#about");
    await expect(about.locator(".om-progress .pcount")).toHaveText("04 / 04");
    await expect(about.locator(".om-final")).toHaveClass(/on/);
    // Finał w stanie .on oddaje pointer-events — CTA ma być klikalne
    // (samą nawigację-placeholder weryfikuje about-index.spec.ts).
    await expect(about.locator(".om-cta")).toBeVisible();
  });
});

test.describe("mobile: flow z revealami", () => {
  test.skip(({ isMobile }) => !isMobile, "flow tylko na mobile");

  test("finał wjeżdża revealem i CTA jest widoczne", async ({ page }) => {
    await gotoReady(page, "/o-mnie/");
    await scrollPageTo(page, await aboutScrollAt(page, 1));
    // Kaskada reveali (~1,2 s) musi się dograć.
    await settle(page, 1600);

    const about = page.locator("#about");
    await expect(about.locator(".om-final .ch-head")).toBeVisible();
    await expect(about.locator(".om-cta")).toBeVisible();
  });
});
