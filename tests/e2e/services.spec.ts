// Sekcja „Oferta": kotwice CTA (#packages, #contact), fallback bez JS
// (pełna treść widoczna — stany startowe animacji uzbraja dopiero klasa .js)
// i wersja EN. Choreografię scrolla weryfikuje sweep tests/visual/services.spec.ts.
import { expect, test } from "@playwright/test";
import { usePreviewGuard } from "../helpers/guards";
import {
  expectSectionAtTop,
  gotoReady,
  settle,
  syncLenis,
} from "../helpers/scroll";

usePreviewGuard();

test("CTA procesu skacze do #packages (hash + pozycja)", async ({ page }) => {
  await gotoReady(page);
  const cta = page.locator("#services .of-cta");
  await cta.scrollIntoViewIfNeeded();
  // Reveal endcapu (klasa .on z progu ScrollTriggera) musi usiąść przed klikiem.
  await settle(page, 800);
  // Sync po natywnym scrollu — handler liczy cel z pozycji Lenisa.
  await syncLenis(page);
  await cta.click();
  await settle(page);
  await expect(page).toHaveURL(/#packages$/);
  // Skok immediate — cel ma siąść na górze viewportu (retry: sporadyczny brak
  // precyzji Lenisa pod obciążeniem N warstw tła).
  await expectSectionAtTop(page, "packages");
});

test("CTA pakietu prowadzi do #contact", async ({ page }) => {
  await gotoReady(page);
  const cta = page.locator("#services .pk-col.mid .pk-cta");
  await cta.scrollIntoViewIfNeeded();
  await settle(page, 800);
  await syncLenis(page);
  await cta.click();
  await settle(page);
  await expect(page).toHaveURL(/#contact$/);
  await expectSectionAtTop(page, "contact");
});

test.describe("fallback bez JS", () => {
  test.use({ javaScriptEnabled: false });

  test("pełna treść sekcji jest widoczna statycznie (SEO)", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    // Intro nieprzygaszone (split na spany robi dopiero JS) + proces + pakiety.
    await expect(page.locator("#services .of-lead").first()).toContainText(
      "Każda firma jest na innym etapie",
    );
    await expect(page.locator("#services .of-step")).toHaveCount(5);
    await expect(
      page.locator("#services .of-step article h3").last(),
    ).toBeVisible();
    await expect(page.locator("#services .pk-col")).toHaveCount(3);
    await expect(page.locator("#services .of-cta")).toBeVisible();
  });
});

test("wersja EN ma przetłumaczoną sekcję services", async ({ page }) => {
  await gotoReady(page, "/en/");
  await expect(page.locator("#services .pk-head h2")).toContainText(
    "choose your",
  );
  await expect(
    page.locator("#services .of-step article h3").first(),
  ).toContainText("Conversation and goals");
});
