// Zrzuty stabilnych sekcji po hero + nakładki WorkDetail — na WSZYSTKICH
// 6 profilach. Diff per sekcja (screenshot elementu, nie całej strony) →
// czytelniejsze raporty. Determinizm: freeze.css (czasowe animacje CSS off).
import { expect, test, type Page } from "@playwright/test";
import { usePreviewGuard } from "../helpers/guards";
import { gotoReady, settle } from "../helpers/scroll";
import { FREEZE } from "../helpers/visual";

// Kolejność jak w Home.astro (hero, audience, services, about i faq mają
// własne sweepy w hero.spec.ts, audience.spec.ts, services.spec.ts,
// about.spec.ts i faq.spec.ts — sekcje animowane, element-screenshot nie
// niesie informacji).
const SECTIONS = ["work", "contact"];

usePreviewGuard();

// Celowo NIE prepareSweep: element-screenshoty i tak poprzedza
// scrollIntoView + settle, więc czekanie na repaint po freeze jest zbędne.
async function prepare(page: Page) {
  await gotoReady(page);
  await page.addStyleTag({ path: FREEZE });
}

for (const id of SECTIONS) {
  test(`sekcja #${id} vs baseline`, async ({ page }, testInfo) => {
    await prepare(page);
    const section = page.locator(`#${id}`);
    await section.scrollIntoViewIfNeeded();
    await settle(page);
    // #contact na chromium-pixel-5 (DPR 2.75) to wysoka sekcja PRZEZROCZYSTA
    // nad globalnym ambientem — element-screenshot bywa niestabilny między
    // dwoma kolejnymi próbami (subpikselowy jitter stitchowania, ~1% pikseli;
    // ta sama rodzina co flaky klatki pixel-5 w hero.spec.ts). Podniesiony
    // próg pochłania jitter zarówno w kontroli stabilności, jak i w
    // porównaniu z baseline'em; realną regresję (>2% pikseli) i tak złapie.
    const ratio =
      id === "contact" && testInfo.project.name === "chromium-pixel-5"
        ? 0.02
        : undefined;
    await expect(section).toHaveScreenshot(`section-${id}.png`, {
      ...(ratio !== undefined ? { maxDiffPixelRatio: ratio } : {}),
    });
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
    // Mobile: sheet otwiera tap w kartę karuzeli (.wk-car). Galeria desktopowa
    // jest tu ukryta (display:none) — celujemy w kartę karuzeli.
    const card = page.locator(".wk-car [data-work-slug]").first();
    await card.scrollIntoViewIfNeeded();
    // Guard „strona w ruchu" w WorkCarousel: odczekaj zanim tap zadziała.
    await page.waitForTimeout(300);
    await card.click();
    await expect(page.locator("#work-sheet")).toHaveClass(/is-open/);
    await settle(page);
    // Zrzut viewportu — jak w modalu (stabilność > kadr samego panelu).
    await expect(page).toHaveScreenshot("work-sheet.png");
  });
});
