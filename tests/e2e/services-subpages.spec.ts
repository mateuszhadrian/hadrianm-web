// Podstrony sekcji „Oferta" (docs/analiza-podstrony-oferta.md):
// /proces-wspolpracy/ (EN: /en/process/) = wariant "process" (nić A z 5
// krokami + fixed progres), /pakiety/ (EN: /en/packages/) = wariant
// "packages" (grid P4 + dedykowane + opcje). Chrome strony wg wzorca
// /dla-kogo/ (BackButton w miejscu brandu, współdzielony Footer, ambient
// red statyczny), scroll w trybie smoothScroll="desktop" (Lenis desktop,
// mobile natywnie). Lustro audience-index.spec.ts.
import { expect, test } from "@playwright/test";
import { ui } from "../../src/i18n/ui";
import { collectPageIssues, usePreviewGuard } from "../helpers/guards";
import { gotoReady, scrollPageTo, settle } from "../helpers/scroll";

const SITE = "https://hadrianm.pl";

const PAGES = [
  {
    path: "/proces-wspolpracy/",
    lang: "pl",
    kind: "process",
    homePath: "/",
    plPath: "/proces-wspolpracy/",
    enPath: "/en/process/",
    title: ui.pl["processPage.title"],
    description: ui.pl["processPage.description"],
  },
  {
    path: "/en/process/",
    lang: "en",
    kind: "process",
    homePath: "/en/",
    plPath: "/proces-wspolpracy/",
    enPath: "/en/process/",
    title: ui.en["processPage.title"],
    description: ui.en["processPage.description"],
  },
  {
    path: "/pakiety/",
    lang: "pl",
    kind: "packages",
    homePath: "/",
    plPath: "/pakiety/",
    enPath: "/en/packages/",
    title: ui.pl["packagesPage.title"],
    description: ui.pl["packagesPage.description"],
  },
  {
    path: "/en/packages/",
    lang: "en",
    kind: "packages",
    homePath: "/en/",
    plPath: "/pakiety/",
    enPath: "/en/packages/",
    title: ui.en["packagesPage.title"],
    description: ui.en["packagesPage.description"],
  },
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
      await expect(page).toHaveTitle(p.title);
      await expect(
        page.locator('head meta[name="description"]'),
      ).toHaveAttribute("content", p.description);
      await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute(
        "href",
        `${SITE}${p.path}`,
      );
      // Para hreflang PL↔EN (obie strony deklarują obie wersje).
      await expect(
        page.locator('head link[rel="alternate"][hreflang="pl"]'),
      ).toHaveAttribute("href", `${SITE}${p.plPath}`);
      await expect(
        page.locator('head link[rel="alternate"][hreflang="en"]'),
      ).toHaveAttribute("href", `${SITE}${p.enPath}`);
    });

    if (p.kind === "process") {
      test(`wariant process: nagłówek, 5 kroków, endcap → pakiety, progres`, async ({
        page,
      }) => {
        await gotoReady(page, p.path);
        const section = page.locator("#services");
        await expect(section).toHaveAttribute("data-variant", "process");
        // Pełnoprawny nagłówek podstrony (typografia jak nagłówek pakietów).
        await expect(section.locator(".of-pghead h2")).toBeVisible();
        await expect(section.locator(".of-step")).toHaveCount(5);
        // Endcap = pełna nawigacja na podstronę pakietów (nie kotwica).
        await expect(section.locator(".of-cta")).toHaveAttribute(
          "href",
          p.lang === "pl" ? "/pakiety/" : "/en/packages/",
        );
        // Fixed progres podróżuje z procesem; pakietów tu nie ma.
        await expect(section.locator(".of-progress")).toBeAttached();
        await expect(section.locator(".pk-col")).toHaveCount(0);
        await expect(section.locator(".of-lead")).toHaveCount(0);
      });
    } else {
      test(`wariant packages: grid P4, dedykowane, opcje, CTA-placeholdery`, async ({
        page,
      }) => {
        await gotoReady(page, p.path);
        const section = page.locator("#services");
        await expect(section).toHaveAttribute("data-variant", "packages");
        await expect(section.locator(".pk-col")).toHaveCount(3);
        await expect(section.locator(".pk-dedy")).toBeAttached();
        await expect(section.locator(".pk-extra .xitem")).toHaveCount(3);
        // CTA = placeholdery do czasu migracji sekcji kontakt (D3 analizy).
        for (const cta of await section.locator(".pk-cta").all()) {
          await expect(cta).toHaveAttribute("href", "#");
        }
        await expect(section.locator(".dlink")).toHaveAttribute("href", "#");
        // Procesu i intro tu nie ma.
        await expect(section.locator(".of-step")).toHaveCount(0);
        await expect(section.locator(".of-lead")).toHaveCount(0);
      });
    }

    test(`desktop: scroll na Lenisie (tryb smoothScroll="desktop")`, async ({
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

    test(`navbar podstrony: kotwice → strona główna, język → odpowiednik, Footer`, async ({
      page,
    }) => {
      await gotoReady(page, p.path);
      // Pozycja „Oferta" prowadzi na sekcję-zajawkę strony głównej.
      await expect(
        page.locator(`.nav-link[href="${p.homePath}#services"]`),
      ).toBeAttached();
      // Przełącznik języka celuje w odpowiedniki podstrony.
      await expect(
        page.locator('a.lang-btn[hreflang="pl"]').first(),
      ).toHaveAttribute("href", p.plPath);
      await expect(
        page.locator('a.lang-btn[hreflang="en"]').first(),
      ).toHaveAttribute("href", p.enPath);
      // Stopka: współdzielony Footer (ten sam co finał strony głównej).
      await expect(
        page.locator(
          `.osp-foot .ft-leg a[href="${ui[p.lang]["contact.policyHref"]}"]`,
        ),
      ).toBeAttached();
      await expect(page.locator(".osp-foot .ft-soc a").first()).toBeAttached();
    });

    test(`back button w miejscu brandu, widoczny mimo schowanego paska`, async ({
      page,
    }) => {
      await gotoReady(page, p.path);
      // Brand ustępuje miejsca przyciskowi „wstecz" (fallback → główna).
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

    test(`strona ładuje się bez błędów konsoli i 404`, async ({ page }) => {
      const issues = collectPageIssues(page);
      await gotoReady(page, p.path);
      expect(issues()).toEqual([]);
    });
  });
}

test.describe("wejście z zajawki + powrót (history.back)", () => {
  // eslint-disable-next-line no-empty-pattern -- Playwright wymaga destrukturyzacji fixtures
  test.beforeEach(async ({}, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium-1920",
      "przepływ niezależny od profilu — jeden projekt wystarczy",
    );
  });

  for (const { btn, path } of [
    { btn: ".pp-btn--split", path: "/proces-wspolpracy/" },
    { btn: ".pp-btn--solid", path: "/pakiety/" },
  ]) {
    test(`CTA zajawki → ${path} → back button wraca na główną`, async ({
      page,
    }) => {
      await gotoReady(page, "/");
      const cta = page.locator(`#services ${btn}`);
      await cta.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await cta.click();
      await expect.poll(() => new URL(page.url()).pathname).toBe(path);
      await page.locator("a[data-back]").click();
      // history.back() → wracamy na stronę główną (przywrócona historia).
      await expect.poll(() => new URL(page.url()).pathname).toBe("/");
    });
  }
});

test.describe("scroll mobile: natywny (tryb smoothScroll='desktop')", () => {
  test.skip(({ isMobile }) => !isMobile, "gałąź dotykowa trybu desktop");

  for (const path of ["/proces-wspolpracy/", "/pakiety/"]) {
    test(`${path}: Lenis NIE ładuje się na urządzeniu dotykowym`, async ({
      page,
    }) => {
      await gotoReady(page, path);
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
  }
});

test.describe("CTA-placeholdery pakietów nie nawigują", () => {
  test("klik w CTA pakietu nie zmienia URL ani nie skacze na górę", async ({
    page,
  }) => {
    await gotoReady(page, "/pakiety/");
    const cta = page.locator("#services .pk-col.mid .pk-cta");
    await cta.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    const yBefore = await page.evaluate(() => window.scrollY);
    await cta.click();
    await settle(page);
    // preventDefault: bez natywnego skoku do góry i bez „#" w adresie.
    expect(new URL(page.url()).hash).toBe("");
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(
      yBefore - 50,
    );
  });
});

test.describe("fallback bez JS (SEO)", () => {
  test.use({ javaScriptEnabled: false });

  test("/proces-wspolpracy/: pełna treść procesu widoczna statycznie", async ({
    page,
  }) => {
    await page.goto("/proces-wspolpracy/", { waitUntil: "networkidle" });
    await expect(page.locator("#services .of-step")).toHaveCount(5);
    await expect(
      page.locator("#services .of-step article h3").last(),
    ).toBeVisible();
    await expect(page.locator("#services .of-cta")).toBeVisible();
  });

  test("/pakiety/: pełna treść pakietów widoczna statycznie", async ({
    page,
  }) => {
    await page.goto("/pakiety/", { waitUntil: "networkidle" });
    await expect(page.locator("#services .pk-col")).toHaveCount(3);
    await expect(page.locator("#services .pk-head h2")).toBeVisible();
    await expect(page.locator("#services .pk-dedy")).toBeVisible();
  });
});
