// i18n: PL pod /, EN pod /en/, przełącznik języka, brak przecieków drugiego
// języka. Oczekiwane teksty importujemy ze słownika — test nie dubluje treści.
import { expect, test } from "@playwright/test";
import { ui } from "../../src/i18n/ui";
import { gotoReady } from "../helpers/scroll";

test("/ jest po polsku: lang, tytuł, hero", async ({ page }) => {
  await gotoReady(page, "/");
  await expect(page.locator("html")).toHaveAttribute("lang", "pl");
  await expect(page).toHaveTitle(ui.pl["meta.title"]);
  await expect(page.locator(".hero__eyebrow")).toHaveText(
    ui.pl["hero.eyebrow"],
  );
});

test("/en/ jest po angielsku: lang, tytuł, hero", async ({ page }) => {
  await gotoReady(page, "/en/");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page).toHaveTitle(ui.en["meta.title"]);
  await expect(page.locator(".hero__eyebrow")).toHaveText(
    ui.en["hero.eyebrow"],
  );
});

test("przełącznik języka: poprawne linki hreflang i aria-current", async ({
  page,
}) => {
  await gotoReady(page, "/");
  // Atrybuty sprawdzamy na pierwszym wystąpieniu (pasek lub panel mobilny —
  // markup jest wspólny, widoczność zależy od breakpointu).
  const toEn = page.locator('a.lang-btn[hreflang="en"]').first();
  const toPl = page.locator('a.lang-btn[hreflang="pl"]').first();
  await expect(toEn).toHaveAttribute("href", "/en/");
  await expect(toPl).toHaveAttribute("href", "/");
  await expect(toPl).toHaveAttribute("aria-current", "true");
  await expect(toEn).not.toHaveAttribute("aria-current", "true");

  await gotoReady(page, "/en/");
  await expect(
    page.locator('a.lang-btn[hreflang="en"]').first(),
  ).toHaveAttribute("aria-current", "true");
});

test("przełącznik przenosi na drugą wersję językową", async ({
  page,
  isMobile,
}) => {
  await gotoReady(page, "/");
  if (isMobile) {
    // Na mobile przełącznik żyje w panelu burgera.
    await page.locator("[data-burger]").click();
    await page.locator('[data-menu] a.lang-btn[hreflang="en"]').click();
  } else {
    await page.locator('.lang a.lang-btn[hreflang="en"]').click();
  }
  await expect(page).toHaveURL(/\/en\/$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

test("brak przecieków drugiego języka w treści", async ({ page }) => {
  await gotoReady(page, "/");
  await expect(page.getByText(ui.en["hero.eyebrow"])).toHaveCount(0);
  await expect(page.getByText(ui.en["work.eyebrow"])).toHaveCount(0);

  await gotoReady(page, "/en/");
  await expect(page.getByText(ui.pl["hero.eyebrow"])).toHaveCount(0);
  await expect(page.getByText(ui.pl["work.eyebrow"])).toHaveCount(0);
});
