// Sekcja Realizacje: kafle z Content Collections + otwieranie/zamykanie
// WorkDetail. Desktop (≥761px): galeria `.work__gallery` → Modal. Mobile
// (≤760px): karuzela `.wk-car` → BottomSheet. Strona główna pokazuje max 3.
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { expect, test, type Page } from "@playwright/test";
import { gotoReady } from "../helpers/scroll";

const ENTRY_COUNT = readdirSync(
  fileURLToPath(new URL("../../src/content/realizacje", import.meta.url)),
).filter((f) => f.endsWith(".json")).length;

// Strona główna kapuje listę do 3 (pełna lista: /realizacje/, work-index.spec.ts).
const HOME_COUNT = Math.min(3, ENTRY_COUNT);

/** Dociera do kafla i uspokaja scroll (guard „strona w ruchu" blokuje otwarcie
 *  nakładki przez ~110 ms po scrollu). Selektor zależny od layoutu. */
async function revealFirstCard(page: Page, selector: string) {
  const card = page.locator(selector).first();
  await card.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  return card;
}

test("galeria desktopowa pokazuje max 3 realizacje", async ({ page }) => {
  await gotoReady(page);
  await expect(page.locator(".work__gallery [data-work-slug]")).toHaveCount(
    HOME_COUNT,
  );
});

test.describe("desktop: Modal", () => {
  test.skip(({ isMobile }) => !!isMobile, "modal tylko na desktop");

  test("klik w kafel otwiera modal z treścią projektu, × i Escape zamykają", async ({
    page,
  }) => {
    await gotoReady(page);
    const card = await revealFirstCard(page, ".work__gallery [data-work-slug]");
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

test.describe("mobile: BottomSheet (karuzela)", () => {
  test.skip(({ isMobile }) => !isMobile, "sheet tylko na mobile");

  test("tap w kartę karuzeli otwiera sheet; zamykanie przyciskiem", async ({
    page,
  }) => {
    await gotoReady(page);
    const card = await revealFirstCard(page, ".wk-car [data-work-slug]");
    const sheet = page.locator("#work-sheet");

    await card.click();
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
