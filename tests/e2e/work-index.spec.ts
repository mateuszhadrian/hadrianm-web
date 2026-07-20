// Podstrona realizacji (PL: /realizacje/, EN: /en/projects/): pełna lista
// wpisów z Content Collections (strona główna kapuje do 3), nakładki
// WorkDetail jak w sekcji #work (Modal >760 px / BottomSheet ≤760 px),
// scroll NATYWNY (bez Lenisa — decyzja D1 analizy), meta + hreflang,
// dojście z przycisków „Więcej realizacji" strony głównej.
// Plan: docs/analiza-podstrona-realizacje.md.
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { expect, test, type Page } from "@playwright/test";
import { ui } from "../../src/i18n/ui";
import { SERVICES_PATH } from "../../src/lib/routes";
import {
  collectPageIssues,
  useChromium1920Only,
  usePreviewGuard,
} from "../helpers/guards";
import { gotoReady, scrollPageTo } from "../helpers/scroll";

const SITE = "https://hadrianm.pl";

const ENTRY_COUNT = readdirSync(
  fileURLToPath(new URL("../../src/content/realizacje", import.meta.url)),
).filter((f) => f.endsWith(".json")).length;

const PAGES = [
  { path: "/realizacje/", lang: "pl", homePath: "/" },
  { path: "/en/projects/", lang: "en", homePath: "/en/" },
] as const;

usePreviewGuard();

/** Dociera do pierwszej karty siatki i uspokaja scroll przed klikiem. */
async function revealFirstCard(page: Page) {
  const card = page.locator(".wix-grid [data-work-slug]").first();
  await card.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  return card;
}

for (const p of PAGES) {
  test.describe(`${p.path}: meta i treść (jeden profil)`, () => {
    useChromium1920Only(
      "meta/treść niezależne od profilu — jeden projekt wystarczy",
    );

    test(`lang, tytuł, description, canonical, hreflang`, async ({ page }) => {
      await gotoReady(page, p.path);
      await expect(page.locator("html")).toHaveAttribute("lang", p.lang);
      await expect(page).toHaveTitle(ui[p.lang]["workPage.title"]);
      await expect(
        page.locator('head meta[name="description"]'),
      ).toHaveAttribute("content", ui[p.lang]["workPage.description"]);
      await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute(
        "href",
        `${SITE}${p.path}`,
      );
      // Para hreflang PL↔EN (obie strony deklarują obie wersje).
      await expect(
        page.locator('head link[rel="alternate"][hreflang="pl"]'),
      ).toHaveAttribute("href", `${SITE}/realizacje/`);
      await expect(
        page.locator('head link[rel="alternate"][hreflang="en"]'),
      ).toHaveAttribute("href", `${SITE}/en/projects/`);
    });

    test(`siatka pokazuje WSZYSTKIE wpisy + kafel ghost`, async ({ page }) => {
      await gotoReady(page, p.path);
      await expect(page.locator(".wix-grid [data-work-slug]")).toHaveCount(
        ENTRY_COUNT,
      );
      await expect(page.locator(".wix-ghost")).toBeVisible();
      await expect(page.locator(".wix-title")).toContainText(
        ui[p.lang]["workPage.headlineAccent"],
      );
    });

    test(`scroll natywny — Lenis nie jest ładowany`, async ({ page }) => {
      await gotoReady(page, p.path);
      await expect(page.locator("body")).toHaveAttribute(
        "data-smooth-scroll",
        "off",
      );
      expect(await page.evaluate(() => Boolean(window.__lenis))).toBe(false);
    });

    test(`navbar podstrony: kotwice → strona główna, Realizacje = bieżąca, język → odpowiednik`, async ({
      page,
    }) => {
      await gotoReady(page, p.path);
      // Pozycja „Oferta" prowadzi na hub /oferta/ (migracja: analiza huba).
      await expect(
        page.locator(`.nav-link[href="${SERVICES_PATH[p.lang]}"]`),
      ).toBeAttached();
      // Link Realizacje wskazuje bieżącą podstronę (aria-current).
      const work = page.locator(`.nav-link[href="${p.path}"]`);
      await expect(work).toBeAttached();
      await expect(work).toHaveAttribute("aria-current", "page");
      // Przełącznik języka celuje w odpowiedniki podstrony.
      await expect(
        page.locator('a.lang-btn[hreflang="pl"]').first(),
      ).toHaveAttribute("href", "/realizacje/");
      await expect(
        page.locator('a.lang-btn[hreflang="en"]').first(),
      ).toHaveAttribute("href", "/en/projects/");
      // Stopka: współdzielony Footer (ten sam co finał strony głównej) —
      // link polityki prywatności we właściwym języku + social media.
      await expect(
        page.locator(
          `.wix-foot .ft-leg a[href="${ui[p.lang]["contact.policyHref"]}"]`,
        ),
      ).toBeAttached();
      await expect(page.locator(".wix-foot .ft-soc a").first()).toBeAttached();
    });

    test(`back button w miejscu brandu, widoczny mimo schowanego paska`, async ({
      page,
    }) => {
      await gotoReady(page, p.path);
      // Brand ustępuje miejsca przyciskowi „wstecz" (fallback → strona główna).
      // W PASKU brandu nie ma — jego slot zajmuje przyklejony BackButton.
      await expect(page.locator(".brand:not(.brand-menu)")).toHaveCount(0);
      // Brand „tylko w menu" jest w DOM, ale odsłania go dopiero otwarte
      // menu mobilne (na desktopie: display:none) — patrz Navbar.astro.
      await expect(page.locator(".brand-menu")).toBeHidden();
      const back = page.locator("a[data-back]");
      await expect(back).toHaveAttribute("href", p.homePath);
      await expect(back).toBeVisible();
      // Pasek chowa się przy scrollu w dół; przycisk jest fixed POZA barem
      // i ma zostać przyklejony u góry viewportu.
      await scrollPageTo(page, 200);
      await scrollPageTo(page, 600);
      await expect(page.locator("[data-nav]")).toHaveAttribute(
        "data-hidden",
        "",
      );
      await expect(back).toBeVisible();
      const box = await back.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.y).toBeGreaterThanOrEqual(0);
      expect(box!.y).toBeLessThan(80);
    });

    test(`back button wraca na stronę główną (history.back)`, async ({
      page,
    }) => {
      await gotoReady(page, p.homePath);
      await page.locator(`.nav-link[href="${p.path}"]`).click();
      await expect.poll(() => new URL(page.url()).pathname).toBe(p.path);
      await page.locator("a[data-back]").click();
      // history.back() → wracamy na stronę główną (przywrócona historia).
      await expect.poll(() => new URL(page.url()).pathname).toBe(p.homePath);
    });

    test(`strona ładuje się bez błędów konsoli i 404`, async ({ page }) => {
      const issues = collectPageIssues(page);
      await gotoReady(page, p.path);
      expect(issues()).toEqual([]);
    });
  });
}

test.describe("desktop: Modal na podstronie", () => {
  test.skip(({ isMobile }) => !!isMobile, "modal tylko na desktop");

  test("klik w kartę otwiera modal z treścią projektu, × zamyka", async ({
    page,
  }) => {
    await gotoReady(page, "/realizacje/");
    const card = await revealFirstCard(page);
    const name = await card.getAttribute("data-work-name");
    const modal = page.locator("#work-modal");

    await card.click();
    await expect(modal).toBeVisible();
    await expect(modal).toHaveClass(/is-open/);
    await expect(modal.locator(".wdx__title")).toHaveText(name ?? "");

    await modal.locator("[data-overlay-close]").click();
    await expect(modal).toBeHidden();
    await expect(modal.locator(".wdx")).toHaveCount(0);
  });
});

test.describe("mobile: BottomSheet na podstronie", () => {
  test.skip(({ isMobile }) => !isMobile, "sheet tylko na mobile");

  test("tap w kartę otwiera sheet; zamykanie przyciskiem", async ({ page }) => {
    await gotoReady(page, "/realizacje/");
    const card = await revealFirstCard(page);
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

test.describe("dojście ze strony głównej — przyciski Więcej realizacji", () => {
  test("przyciski mają zlokalizowane adresy podstrony (PL i EN)", async ({
    page,
  }) => {
    for (const { home, href } of [
      { home: "/", href: "/realizacje/" },
      { home: "/en/", href: "/en/projects/" },
    ]) {
      await gotoReady(page, home);
      for (const a of await page.locator("a[data-work-more]").all()) {
        await expect(a).toHaveAttribute("href", href);
      }
    }
  });

  test("desktop: kafel pod galerią nawiguje na podstronę", async ({
    page,
    isMobile,
  }) => {
    test.skip(!!isMobile, "kafel widoczny tylko na desktop");
    await gotoReady(page);
    // Zwykła nawigacja stronicowa — Playwright doscrolluje do linku natywnie.
    await page.locator(".work__more-wrap a[data-work-more]").click();
    await expect(page).toHaveURL(/\/realizacje\/?$/);
    await expect(page.locator(".wix-grid")).toBeVisible();
  });

  test("mobile: slajd karuzeli nawiguje na podstronę", async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, "slajd CTA żyje w karuzeli mobilnej");
    await gotoReady(page);
    const slide = page.locator(".wk-car a[data-work-more]");
    await slide.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await slide.click();
    await expect(page).toHaveURL(/\/realizacje\/?$/);
    await expect(page.locator(".wix-grid")).toBeVisible();
  });
});
