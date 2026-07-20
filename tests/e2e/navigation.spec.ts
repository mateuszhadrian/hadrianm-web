// Nawigacja: anchory, chowanie paska przy scrollu (desktop), menu mobilne.
import { expect, test } from "@playwright/test";
import { collectPageIssues, usePreviewGuard } from "../helpers/guards";
import { gotoReady, scrollPageTo, settle } from "../helpers/scroll";

usePreviewGuard();

test.describe("nawigacja desktop", () => {
  test.skip(({ isMobile }) => !!isMobile, "tylko układ desktop/tablet");

  test("link Oferta nawiguje na podstronę /oferta/", async ({ page }) => {
    await gotoReady(page);
    // Od migracji huba Oferty (docs/analiza-podstrona-oferta-hub.md)
    // WSZYSTKIE pozycje navbara prowadzą na podstrony — w menu nie ma już
    // ŻADNEJ kotwicy sekcji strony głównej.
    await page.locator('.nav-link[href="/oferta/"]').click();
    await expect(page).toHaveURL(/\/oferta\/?$/);
    await expect(page.locator("#services .ofh-card")).toHaveCount(2);
  });

  test("link Realizacje nawiguje na podstronę /realizacje/", async ({
    page,
  }) => {
    await gotoReady(page);
    await page.locator('.nav-link[href="/realizacje/"]').click();
    await expect(page).toHaveURL(/\/realizacje\/?$/);
    await expect(page.locator(".wix-grid")).toBeVisible();
  });

  test("pasek chowa się przy scrollu w dół i wraca przy scrollu w górę", async ({
    page,
  }) => {
    await gotoReady(page);
    const nav = page.locator("[data-nav]");
    await scrollPageTo(page, 400);
    await scrollPageTo(page, 1200);
    await expect(nav).toHaveAttribute("data-hidden", "");
    await scrollPageTo(page, 700);
    await expect(nav).not.toHaveAttribute("data-hidden", "");
  });
});

test.describe("nawigacja mobile", () => {
  test.skip(({ isMobile }) => !isMobile, "tylko układ mobile");

  test("burger otwiera panel, Escape zamyka i oddaje fokus", async ({
    page,
  }) => {
    await gotoReady(page);
    const root = page.locator("[data-nav]");
    const burger = page.locator("[data-burger]");
    await burger.click();
    await expect(root).toHaveAttribute("data-open", "");
    await expect(burger).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("[data-menu] .m-link").first()).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(root).not.toHaveAttribute("data-open", "");
    await expect(burger).toHaveAttribute("aria-expanded", "false");
  });

  test("pozycja Oferta w panelu nawiguje na podstronę", async ({ page }) => {
    await gotoReady(page);
    await page.locator("[data-burger]").click();
    // Od migracji huba Oferty menu nie ma już żadnej pozycji-kotwicy —
    // wszystkie prowadzą na podstrony.
    await page.locator('.m-link[href="/oferta/"]').click();
    await expect(page).toHaveURL(/\/oferta\/?$/);
    await expect(page.locator("#services .ofh-card")).toHaveCount(2);
  });

  test("pozycja FAQ w panelu nawiguje na podstronę", async ({ page }) => {
    await gotoReady(page);
    await page.locator("[data-burger]").click();
    await page.locator('.m-link[href="/faq/"]').click();
    await expect(page).toHaveURL(/\/faq\/?$/);
    await expect(page.locator(".fqf .fq-list")).toBeVisible();
  });

  test("pozycja Realizacje w panelu nawiguje na podstronę", async ({
    page,
  }) => {
    await gotoReady(page);
    await page.locator("[data-burger]").click();
    await page.locator('.m-link[href="/realizacje/"]').click();
    await expect(page).toHaveURL(/\/realizacje\/?$/);
    await expect(page.locator(".wix-grid")).toBeVisible();
  });

  test("pozycja Kontakt w panelu nawiguje na podstronę", async ({ page }) => {
    await gotoReady(page);
    await page.locator("[data-burger]").click();
    await page.locator('.m-link[href="/kontakt/"]').click();
    await expect(page).toHaveURL(/\/kontakt\/?$/);
    await expect(page.locator("#contact .kt-form")).toBeVisible();
  });

  // Podstrony: slot brandu zajmuje BackButton, więc dopiero otwarte menu daje
  // drogę powrotną na GÓRĘ strony głównej (BackButton = history.back, czyli
  // przywrócona pozycja scrolla — inna intencja).
  test("podstrona: otwarte menu podmienia BackButton na logo do strony głównej", async ({
    page,
  }) => {
    await gotoReady(page, "/o-mnie/");
    const back = page.locator(".bkb");
    const brand = page.locator(".brand-menu");

    // zamknięte menu: widać „wstecz", logo schowane
    await expect(back).toBeVisible();
    await expect(brand).toBeHidden();

    await page.locator("[data-burger]").click();

    // otwarte menu: podmiana w obie strony
    await expect(brand).toBeVisible();
    await expect(back).toBeHidden();

    // logo to ZWYKŁA nawigacja — bez data-back, więc bez przywracania scrolla
    await expect(brand).toHaveAttribute("href", "/");
    await expect(brand).not.toHaveAttribute("data-back", /.*/);

    // scroll na podstronie nie może „przejechać" na stronę główną
    await brand.click();
    await expect(page).toHaveURL(/\/$/);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });

  test("podstrona: zamknięcie menu przywraca BackButton", async ({ page }) => {
    await gotoReady(page, "/realizacje/");
    const burger = page.locator("[data-burger]");
    await burger.click();
    await expect(page.locator(".brand-menu")).toBeVisible();
    await burger.click();
    await expect(page.locator(".brand-menu")).toBeHidden();
    await expect(page.locator(".bkb")).toBeVisible();
  });
});

test("strona główna ładuje się bez błędów konsoli i 404", async ({ page }) => {
  const issues = collectPageIssues(page);
  await gotoReady(page);
  await settle(page);
  expect(issues()).toEqual([]);
});
