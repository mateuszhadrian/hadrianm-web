// Podstrona „Dla kogo" (PL: /dla-kogo/, EN: /en/who-its-for/): pełna
// animowana sekcja Audience przeniesiona ze strony głównej (tam statyczna
// zajawka z buttonem SolidButton), scroll na LENISIE (inaczej niż
// /realizacje/ — scena pinned+scrub+snap wymaga tej samej mechaniki co
// wcześniej na głównej), BackButton + Footer wg wzorca /realizacje/.
// Plan: docs/analiza-podstrona-dla-kogo.md.
import { expect, test } from "@playwright/test";
import { ui } from "../../src/i18n/ui";
import { SERVICES_PATH } from "../../src/lib/routes";
import {
  collectPageIssues,
  useChromium1920Only,
  usePreviewGuard,
} from "../helpers/guards";
import { gotoReady, scrollPageTo } from "../helpers/scroll";

const SITE = "https://hadrianm.pl";

const PAGES = [
  { path: "/dla-kogo/", lang: "pl", homePath: "/" },
  { path: "/en/who-its-for/", lang: "en", homePath: "/en/" },
] as const;

usePreviewGuard();

for (const p of PAGES) {
  test.describe(`${p.path}: meta i treść (jeden profil)`, () => {
    useChromium1920Only(
      "meta/treść niezależne od profilu — jeden projekt wystarczy",
    );

    test(`lang, tytuł, description, canonical, hreflang`, async ({ page }) => {
      await gotoReady(page, p.path);
      await expect(page.locator("html")).toHaveAttribute("lang", p.lang);
      await expect(page).toHaveTitle(ui[p.lang]["audiencePage.title"]);
      await expect(
        page.locator('head meta[name="description"]'),
      ).toHaveAttribute("content", ui[p.lang]["audiencePage.description"]);
      await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute(
        "href",
        `${SITE}${p.path}`,
      );
      // Para hreflang PL↔EN (obie strony deklarują obie wersje).
      await expect(
        page.locator('head link[rel="alternate"][hreflang="pl"]'),
      ).toHaveAttribute("href", `${SITE}/dla-kogo/`);
      await expect(
        page.locator('head link[rel="alternate"][hreflang="en"]'),
      ).toHaveAttribute("href", `${SITE}/en/who-its-for/`);
    });

    test(`pełny wariant sekcji: 4 rozdziały, stos kart, licznik, CTA-placeholder`, async ({
      page,
    }) => {
      await gotoReady(page, p.path);
      const section = page.locator("#audience");
      await expect(section).toHaveAttribute("data-variant", "full");
      // Rozdziały/stos są sterowane timeline'em (ukryte poza swoim oknem
      // progresu) — sprawdzamy obecność w DOM, nie widoczność.
      await expect(section.locator(".dk-ch")).toHaveCount(4);
      await expect(section.locator(".dk-card")).toHaveCount(3);
      await expect(section.locator(".dk-progress")).toBeAttached();
      // CTA rozdziału 03 „Poznaj ofertę" prowadzi na hub /oferta/.
      await expect(section.locator(".dk-cta")).toHaveAttribute(
        "href",
        SERVICES_PATH[p.lang],
      );
      // Zajawkowy button SolidButton żyje tylko na stronie głównej.
      await expect(section.locator(".dk-morewrap")).toHaveCount(0);
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

    test(`navbar podstrony: Oferta → hub, Dla kogo = bieżąca, język → odpowiednik`, async ({
      page,
    }) => {
      await gotoReady(page, p.path);
      // Pozycja „Oferta" prowadzi na hub /oferta/ (migracja: analiza huba).
      await expect(
        page.locator(`.nav-link[href="${SERVICES_PATH[p.lang]}"]`),
      ).toBeAttached();
      // Link Dla kogo wskazuje bieżącą podstronę (aria-current).
      const self = page.locator(`.nav-link[href="${p.path}"]`);
      await expect(self).toBeAttached();
      await expect(self).toHaveAttribute("aria-current", "page");
      // Przełącznik języka celuje w odpowiedniki podstrony.
      await expect(
        page.locator('a.lang-btn[hreflang="pl"]').first(),
      ).toHaveAttribute("href", "/dla-kogo/");
      await expect(
        page.locator('a.lang-btn[hreflang="en"]').first(),
      ).toHaveAttribute("href", "/en/who-its-for/");
      // Stopka: współdzielony Footer (ten sam co finał strony głównej).
      await expect(
        page.locator(
          `.akp-foot .ft-leg a[href="${ui[p.lang]["contact.policyHref"]}"]`,
        ),
      ).toBeAttached();
      await expect(page.locator(".akp-foot .ft-soc a").first()).toBeAttached();
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
    await gotoReady(page, "/dla-kogo/");
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

test.describe("CTA rozdziału 03 nawiguje na hub oferty", () => {
  test.skip(({ isMobile }) => !isMobile, "we flow mobile CTA jest widoczne");

  test("tap w CTA przechodzi na /oferta/", async ({ page }) => {
    await gotoReady(page, "/dla-kogo/");
    const cta = page.locator("#audience .dk-cta");
    await cta.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await cta.click();
    await expect(page).toHaveURL(/\/oferta\/?$/);
    await expect(page.locator("#services .ofh-card")).toHaveCount(2);
  });
});

test.describe("zajawka na stronie głównej", () => {
  for (const { home, href } of [
    { home: "/", href: "/dla-kogo/" },
    { home: "/en/", href: "/en/who-its-for/" },
  ]) {
    test(`${home}: tylko rozdział 00, bez licznika/stosu, przycisk → ${href}`, async ({
      page,
    }) => {
      await gotoReady(page, home);
      const section = page.locator("#audience");
      await expect(section).toHaveAttribute("data-variant", "teaser");
      await expect(section.locator(".dk-ch")).toHaveCount(1);
      await expect(section.locator(".dk-progress")).toHaveCount(0);
      await expect(section.locator(".dk-stack")).toHaveCount(0);
      await expect(section.locator(".dk-cta")).toHaveCount(0);
      await expect(section.locator(".dk-morewrap a")).toHaveAttribute(
        "href",
        href,
      );
      // Pozycja navbara „Dla kogo" prowadzi wprost na podstronę.
      await expect(
        page.locator(`[data-nav] a[href="${href}"]`).first(),
      ).toBeAttached();
    });
  }

  test("klik w przycisk zajawki nawiguje na podstronę", async ({ page }) => {
    await gotoReady(page);
    const btn = page.locator("#audience .dk-morewrap a");
    await btn.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await btn.click();
    await expect(page).toHaveURL(/\/dla-kogo\/?$/);
    await expect(page.locator('#audience[data-variant="full"]')).toBeAttached();
  });
});
