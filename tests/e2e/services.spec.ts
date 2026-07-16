// Sekcja „Oferta" na stronie głównej = zajawka (wariant teaser): intro
// czytane scrollem + para CTA na podstrony /proces-wspolpracy/ i /pakiety/
// (docs/analiza-podstrony-oferta.md). Pełne warianty (proces, pakiety)
// testuje services-subpages.spec.ts; choreografię scrolla weryfikuje sweep
// tests/visual/services.spec.ts.
import { expect, test } from "@playwright/test";
import { usePreviewGuard } from "../helpers/guards";
import { gotoReady } from "../helpers/scroll";

usePreviewGuard();

for (const { home, processHref, packagesHref } of [
  { home: "/", processHref: "/proces-wspolpracy/", packagesHref: "/pakiety/" },
  { home: "/en/", processHref: "/en/process/", packagesHref: "/en/packages/" },
]) {
  test(`${home}: zajawka — samo intro, para CTA prowadzi na podstrony`, async ({
    page,
  }) => {
    await gotoReady(page, home);
    const section = page.locator("#services");
    await expect(section).toHaveAttribute("data-variant", "teaser");
    // Tylko intro: bez kroków procesu, pakietów i fixed progresu.
    await expect(section.locator(".of-step")).toHaveCount(0);
    await expect(section.locator(".pk-col")).toHaveCount(0);
    await expect(section.locator(".of-progress")).toHaveCount(0);
    // Para CTA: primary → pakiety, secondary (panel split) → proces.
    await expect(section.locator(".pp-btn--solid")).toHaveAttribute(
      "href",
      packagesHref,
    );
    await expect(section.locator(".pp-btn--split")).toHaveAttribute(
      "href",
      processHref,
    );
  });
}

test("klik w primary CTA nawiguje na /pakiety/", async ({ page }) => {
  await gotoReady(page);
  const btn = page.locator("#services .pp-btn--solid");
  await btn.scrollIntoViewIfNeeded();
  // Reveal pary CTA (klasa .on z progu ScrollTriggera) musi usiąść.
  await page.waitForTimeout(300);
  await btn.click();
  await expect(page).toHaveURL(/\/pakiety\/?$/);
  await expect(
    page.locator('#services[data-variant="packages"]'),
  ).toBeAttached();
});

test.describe("fallback bez JS", () => {
  test.use({ javaScriptEnabled: false });

  test("intro zajawki widoczne statycznie (SEO)", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    // Intro nieprzygaszone (split na spany robi dopiero JS) + para CTA.
    await expect(page.locator("#services .of-lead").first()).toContainText(
      "Każda firma jest na innym etapie",
    );
    await expect(page.locator("#services .of-close")).toBeVisible();
    await expect(page.locator("#services .pp-btn--solid")).toBeVisible();
    await expect(page.locator("#services .pp-btn--split")).toBeVisible();
  });
});

test("wersja EN ma przetłumaczoną zajawkę services", async ({ page }) => {
  await gotoReady(page, "/en/");
  await expect(page.locator("#services .of-lead").first()).toContainText(
    "Every company is at a different stage",
  );
  await expect(page.locator("#services .pp-btn--solid")).toContainText(
    "Browse packages",
  );
  await expect(page.locator("#services .pp-btn--split")).toContainText(
    "Collaboration process",
  );
});
