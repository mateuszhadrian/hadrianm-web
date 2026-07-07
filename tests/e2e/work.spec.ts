// Sekcja Realizacje: karty z Content Collections + otwieranie/zamykanie
// WorkDetail (Modal na desktop, BottomSheet na mobile — próg 760px).
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { expect, test, type Page } from "@playwright/test";
import { gotoReady } from "../helpers/scroll";

const ENTRY_COUNT = readdirSync(
  fileURLToPath(new URL("../../src/content/realizacje", import.meta.url)),
).filter((f) => f.endsWith(".json")).length;

/** Dociera do pierwszej karty i uspokaja scroll (guard „strona w ruchu"
 *  w Work.astro blokuje otwarcie nakładki przez ~110 ms po scrollu). */
async function revealFirstCard(page: Page) {
  const card = page.locator("[data-work-slug]").first();
  await card.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  return card;
}

test("liczba kart = liczba JSON-ów w src/content/realizacje", async ({
  page,
}) => {
  await gotoReady(page);
  await expect(page.locator("[data-work-slug]")).toHaveCount(ENTRY_COUNT);
});

test.describe("desktop: Modal", () => {
  test.skip(({ isMobile }) => !!isMobile, "modal tylko na desktop");

  test("klik w kartę otwiera modal z treścią projektu, × i Escape zamykają", async ({
    page,
  }) => {
    await gotoReady(page);
    const card = await revealFirstCard(page);
    const name = await card.getAttribute("data-work-name");
    const modal = page.locator("#work-modal");

    await card.click();
    await expect(modal).toBeVisible();
    await expect(modal).toHaveClass(/is-open/);
    await expect(modal.locator(".wdx__title")).toHaveText(name ?? "");

    await modal.locator("[data-overlay-close]").click();
    await expect(modal).toBeHidden();
    // Host czyszczony po zamknięciu (zwalnia obrazy/DOM).
    await expect(modal.locator(".wdx")).toHaveCount(0);

    await card.click();
    await expect(modal).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(modal).toBeHidden();
  });
});

test.describe("mobile: BottomSheet", () => {
  test.skip(({ isMobile }) => !isMobile, "sheet tylko na mobile");

  test("otwiera wyłącznie CTA (nie cały kafelek); zamykanie przyciskiem", async ({
    page,
  }) => {
    await gotoReady(page);
    const card = await revealFirstCard(page);
    const sheet = page.locator("#work-sheet");

    // Dotknięcie kafelka poza CTA NIE otwiera nakładki (celowe na mobile).
    await card.locator(".rz-card__name").click();
    await expect(sheet).toBeHidden();

    await card.locator(".rz-card__cta").click();
    await expect(sheet).toBeVisible();
    await expect(sheet).toHaveClass(/is-open/);
    await expect(sheet.locator(".wdx__title")).toHaveText(
      (await card.getAttribute("data-work-name")) ?? "",
    );

    await sheet.locator("[data-overlay-close]").click();
    await expect(sheet).toBeHidden();
    await expect(sheet.locator(".wdx")).toHaveCount(0);
  });
});
