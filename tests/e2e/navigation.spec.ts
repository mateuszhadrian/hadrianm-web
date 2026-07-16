// Nawigacja: anchory, chowanie paska przy scrollu (desktop), menu mobilne.
import { expect, test } from "@playwright/test";
import { collectPageIssues, usePreviewGuard } from "../helpers/guards";
import {
  expectSectionAtTop,
  gotoReady,
  scrollPageTo,
  settle,
} from "../helpers/scroll";

usePreviewGuard();

test.describe("nawigacja desktop", () => {
  test.skip(({ isMobile }) => !!isMobile, "tylko układ desktop/tablet");

  test("klik w link nawigacji przewija do sekcji i aktualizuje hash", async ({
    page,
  }) => {
    await gotoReady(page);
    // #about, nie #work — link Realizacje prowadzi już na podstronę.
    await page.locator('.nav-link[href="#about"]').click();
    await settle(page);
    await expect(page).toHaveURL(/#about$/);
    // Skok immediate — sekcja ma siąść na górze viewportu (retry: sporadyczny
    // brak precyzji Lenisa pod obciążeniem N warstw tła).
    await expectSectionAtTop(page, "about");
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

  test("link w panelu zamyka menu i przewija do sekcji", async ({ page }) => {
    await gotoReady(page);
    await page.locator("[data-burger]").click();
    await page.locator('.m-link[href="#contact"]').click();
    await settle(page);
    await expect(page.locator("[data-nav]")).not.toHaveAttribute(
      "data-open",
      "",
    );
    await expectSectionAtTop(page, "contact");
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
});

test("strona główna ładuje się bez błędów konsoli i 404", async ({ page }) => {
  const issues = collectPageIssues(page);
  await gotoReady(page);
  await settle(page);
  expect(issues()).toEqual([]);
});
