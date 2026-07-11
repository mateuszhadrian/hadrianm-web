// Zrzuty stabilnych sekcji po hero + nakładki WorkDetail — na WSZYSTKICH
// 6 profilach. Diff per sekcja (screenshot elementu, nie całej strony) →
// czytelniejsze raporty. Determinizm: freeze.css (czasowe animacje CSS off).
import { fileURLToPath } from "node:url";
import { expect, test, type Page } from "@playwright/test";
import { assertPreview } from "../helpers/guards";
import { gotoReady, settle } from "../helpers/scroll";

const FREEZE = fileURLToPath(new URL("../helpers/freeze.css", import.meta.url));

// Kolejność jak w Home.astro (hero, audience, services, about i faq mają
// własne sweepy w hero.spec.ts, audience.spec.ts, services.spec.ts,
// about.spec.ts i faq.spec.ts — sekcje animowane, element-screenshot nie
// niesie informacji).
const SECTIONS = ["work", "contact"];

test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();
  await assertPreview(page);
  await page.close();
});

async function prepare(page: Page) {
  await gotoReady(page);
  await page.addStyleTag({ path: FREEZE });
}

for (const id of SECTIONS) {
  test(`sekcja #${id} vs baseline`, async ({ page }) => {
    await prepare(page);
    const section = page.locator(`#${id}`);
    await section.scrollIntoViewIfNeeded();
    await settle(page);
    await expect(section).toHaveScreenshot(`section-${id}.png`);
  });
}

test.describe("nakładki WorkDetail", () => {
  test("otwarty Modal vs baseline", async ({ page, isMobile }) => {
    test.skip(!!isMobile, "modal tylko na desktop");
    await prepare(page);
    const card = page.locator("[data-work-slug]").first();
    await card.scrollIntoViewIfNeeded();
    await settle(page);
    await card.click();
    await expect(page.locator("#work-modal")).toHaveClass(/is-open/);
    await settle(page);
    // Zrzut VIEWPORTU, nie panelu: panel jest wyższy niż okno i żyje w fixed
    // scroll-containerze — element-screenshot doscrollowuje między próbami
    // i nigdy nie jest stabilny (złapane przy generowaniu baseline'ów).
    await expect(page).toHaveScreenshot("work-modal.png");
  });

  test("otwarty BottomSheet vs baseline", async ({ page, isMobile }) => {
    test.skip(!isMobile, "sheet tylko na mobile");
    await prepare(page);
    const card = page.locator("[data-work-slug]").first();
    await card.scrollIntoViewIfNeeded();
    // Guard „strona w ruchu" w Work.astro: odczekaj zanim CTA zadziała.
    await page.waitForTimeout(300);
    await card.locator(".rz-card__cta").click();
    await expect(page.locator("#work-sheet")).toHaveClass(/is-open/);
    await settle(page);
    // Zrzut viewportu — jak w modalu (stabilność > kadr samego panelu).
    await expect(page).toHaveScreenshot("work-sheet.png");
  });
});
