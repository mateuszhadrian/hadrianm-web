// Podstrona „O mnie" (PL: /o-mnie/, EN: /en/about/): pełna animowana
// sekcja About przeniesiona ze strony głównej (tam statyczna zajawka
// z buttonem SolidButton), scroll w trybie smoothScroll="desktop" (Lenis
// na desktopie — scena pinned+scrub+snap jak wcześniej na głównej, mobile
// natywnie), BackButton + Footer wg wzorca /dla-kogo.
// Plan: docs/analiza-podstrona-o-mnie.md.
import { expect, test } from "@playwright/test";
import { ui } from "../../src/i18n/ui";
import { CONTACT_PATH, SERVICES_PATH } from "../../src/lib/routes";
import { collectPageIssues, usePreviewGuard } from "../helpers/guards";
import { gotoReady, scrollPageTo } from "../helpers/scroll";

const SITE = "https://hadrianm.pl";

const PAGES = [
  { path: "/o-mnie/", lang: "pl", homePath: "/" },
  { path: "/en/about/", lang: "en", homePath: "/en/" },
] as const;

usePreviewGuard();

for (const p of PAGES) {
  test.describe(`${p.path}: meta i treść (jeden profil)`, () => {
    // eslint-disable-next-line no-empty-pattern -- Playwright wymaga destrukturyzacji fixtures
    test.beforeEach(async ({}, testInfo) => {
      test.skip(
        testInfo.project.name !== "chromium-1920",
        "meta/treść niezależne od profilu — jeden projekt wystarczy",
      );
    });

    test(`lang, tytuł, description, canonical, hreflang`, async ({ page }) => {
      await gotoReady(page, p.path);
      await expect(page.locator("html")).toHaveAttribute("lang", p.lang);
      await expect(page).toHaveTitle(ui[p.lang]["aboutPage.title"]);
      await expect(
        page.locator('head meta[name="description"]'),
      ).toHaveAttribute("content", ui[p.lang]["aboutPage.description"]);
      await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute(
        "href",
        `${SITE}${p.path}`,
      );
      // Para hreflang PL↔EN (obie strony deklarują obie wersje).
      await expect(
        page.locator('head link[rel="alternate"][hreflang="pl"]'),
      ).toHaveAttribute("href", `${SITE}/o-mnie/`);
      await expect(
        page.locator('head link[rel="alternate"][hreflang="en"]'),
      ).toHaveAttribute("href", `${SITE}/en/about/`);
    });

    test(`pełny wariant sekcji: rozdziały, finał, progres, CTA-placeholder`, async ({
      page,
    }) => {
      await gotoReady(page, p.path);
      const section = page.locator("#about");
      await expect(section).toHaveAttribute("data-variant", "full");
      // Rozdziały/finał są sterowane timeline'em (ukryte poza swoim oknem
      // progresu) — sprawdzamy obecność w DOM, nie widoczność.
      await expect(section.locator(".om-ch")).toHaveCount(3);
      await expect(section.locator(".om-final")).toBeAttached();
      await expect(section.locator(".om-progress")).toBeAttached();
      // Portret w pierwszym viewporcie podstrony = kandydat LCP → eager.
      await expect(section.locator(".om-photo")).toHaveAttribute(
        "loading",
        "eager",
      );
      // CTA finału prowadzi na podstronę kontaktu.
      await expect(section.locator(".om-cta")).toHaveAttribute(
        "href",
        CONTACT_PATH[p.lang],
      );
      // Zajawkowy button SolidButton żyje tylko na stronie głównej.
      await expect(section.locator(".om-morewrap")).toHaveCount(0);
    });

    test(`desktop: scroll na Lenisie (scrub+snap jak na stronie głównej)`, async ({
      page,
    }) => {
      await gotoReady(page, p.path);
      await expect(page.locator("body")).toHaveAttribute(
        "data-smooth-scroll",
        "desktop",
      );
      // Lenis ładuje się dynamicznie — daj mu chwilę na init (profil
      // chromium-1920 = bez dotyku, więc tryb "desktop" go ładuje).
      await expect
        .poll(() => page.evaluate(() => Boolean(window.__lenis)))
        .toBe(true);
    });

    test(`navbar podstrony: kotwice → strona główna, O mnie = bieżąca, język → odpowiednik`, async ({
      page,
    }) => {
      await gotoReady(page, p.path);
      // Pozycja „Oferta" prowadzi na hub /oferta/ (migracja: analiza huba).
      await expect(
        page.locator(`.nav-link[href="${SERVICES_PATH[p.lang]}"]`),
      ).toBeAttached();
      // Link O mnie wskazuje bieżącą podstronę (aria-current).
      const self = page.locator(`.nav-link[href="${p.path}"]`);
      await expect(self).toBeAttached();
      await expect(self).toHaveAttribute("aria-current", "page");
      // Przełącznik języka celuje w odpowiedniki podstrony.
      await expect(
        page.locator('a.lang-btn[hreflang="pl"]').first(),
      ).toHaveAttribute("href", "/o-mnie/");
      await expect(
        page.locator('a.lang-btn[hreflang="en"]').first(),
      ).toHaveAttribute("href", "/en/about/");
      // Stopka: współdzielony Footer (ten sam co finał strony głównej).
      await expect(
        page.locator(
          `.abp-foot .ft-leg a[href="${ui[p.lang]["contact.policyHref"]}"]`,
        ),
      ).toBeAttached();
      await expect(page.locator(".abp-foot .ft-soc a").first()).toBeAttached();
    });

    test(`back button w miejscu brandu, widoczny mimo schowanego paska`, async ({
      page,
    }) => {
      await gotoReady(page, p.path);
      // Brand ustępuje miejsca przyciskowi „wstecz" (fallback → strona główna).
      await expect(page.locator(".brand")).toHaveCount(0);
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

test.describe("scroll mobile: natywny (tryb smoothScroll='desktop')", () => {
  test.skip(({ isMobile }) => !isMobile, "gałąź dotykowa trybu desktop");

  test("Lenis NIE ładuje się na urządzeniu dotykowym", async ({ page }) => {
    await gotoReady(page, "/o-mnie/");
    await expect(page.locator("body")).toHaveAttribute(
      "data-smooth-scroll",
      "desktop",
    );
    // GOTCHA emulacji: WebKit (profile iphone-*) NIE raportuje
    // maxTouchPoints mimo hasTouch, więc produkcyjna bramka (kontrakt
    // maxTouchPoints z .claude/rules/scroll-lenis.md) widzi tam „desktop".
    // Realny iPhone raportuje 5 — właściwe zachowanie weryfikuje
    // chromium-pixel-5 (maxTouchPoints=1); tu skip zamiast fałszywej
    // czerwieni.
    const mtp = await page.evaluate(() => navigator.maxTouchPoints);
    test.skip(mtp === 0, "emulacja WebKit nie raportuje maxTouchPoints");
    // Chwila na ewentualny (błędny) dynamiczny import — potem asercja.
    await page.waitForTimeout(500);
    expect(await page.evaluate(() => Boolean(window.__lenis))).toBe(false);
  });
});

test.describe("CTA finału nawiguje na podstronę kontaktu", () => {
  test.skip(({ isMobile }) => !isMobile, "we flow mobile CTA jest widoczne");

  test("tap w CTA przechodzi na /kontakt/", async ({ page }) => {
    await gotoReady(page, "/o-mnie/");
    const cta = page.locator("#about .om-cta");
    await cta.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await cta.click();
    await expect(page).toHaveURL(/\/kontakt\/?$/);
    await expect(page.locator("#contact .kt-form")).toBeAttached();
  });
});

test.describe("zajawka na stronie głównej", () => {
  for (const { home, href } of [
    { home: "/", href: "/o-mnie/" },
    { home: "/en/", href: "/en/about/" },
  ]) {
    test(`${home}: tylko rozdział 01, bez finału/progresu/meta, button → ${href}`, async ({
      page,
    }) => {
      await gotoReady(page, home);
      const section = page.locator("#about");
      await expect(section).toHaveAttribute("data-variant", "teaser");
      await expect(section.locator(".om-ch")).toHaveCount(1);
      await expect(section.locator(".om-final")).toHaveCount(0);
      await expect(section.locator(".om-progress")).toHaveCount(0);
      await expect(section.locator(".om-meta")).toHaveCount(0);
      // Portret w zajawce jest ostry — bez nakładki wypieczonej mgły.
      await expect(section.locator(".om-photo-veil")).toHaveCount(0);
      await expect(section.locator(".om-photo")).toHaveAttribute(
        "loading",
        "lazy",
      );
      await expect(section.locator(".om-morewrap a")).toHaveAttribute(
        "href",
        href,
      );
      // Pozycja navbara „O mnie" prowadzi wprost na podstronę.
      await expect(
        page.locator(`[data-nav] a[href="${href}"]`).first(),
      ).toBeAttached();
    });
  }

  test("klik w button zajawki nawiguje na podstronę", async ({ page }) => {
    await gotoReady(page);
    const btn = page.locator("#about .om-morewrap a");
    await btn.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await btn.click();
    await expect(page).toHaveURL(/\/o-mnie\/?$/);
    await expect(page.locator('#about[data-variant="full"]')).toBeAttached();
  });
});
