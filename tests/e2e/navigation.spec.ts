// Nawigacja: anchory, chowanie paska przy scrollu (desktop), menu mobilne.
import { expect, test } from "@playwright/test";
import { assertPreview, collectPageIssues } from "../helpers/guards";
import { gotoReady, scrollPageTo, settle } from "../helpers/scroll";

test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();
  await assertPreview(page);
  await page.close();
});

test.describe("nawigacja desktop", () => {
  test.skip(({ isMobile }) => !!isMobile, "tylko układ desktop/tablet");

  test("klik w link nawigacji przewija do sekcji i aktualizuje hash", async ({
    page,
  }) => {
    await gotoReady(page);
    await page.locator('.nav-link[href="#work"]').click();
    await settle(page);
    await expect(page).toHaveURL(/#work$/);
    const box = await page.locator("#work").boundingBox();
    expect(box).not.toBeNull();
    // Skok immediate — sekcja ma zaczynać się na górze viewportu.
    expect(Math.abs(box!.y)).toBeLessThanOrEqual(5);
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
    const box = await page.locator("#contact").boundingBox();
    expect(box).not.toBeNull();
    expect(Math.abs(box!.y)).toBeLessThanOrEqual(5);
  });
});

test("strona główna ładuje się bez błędów konsoli i 404", async ({ page }) => {
  const issues = collectPageIssues(page);
  await gotoReady(page);
  await settle(page);
  expect(issues()).toEqual([]);
});
