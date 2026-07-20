// Podstrona „Kontakt" (PL: /kontakt/, EN: /en/contact/): sekcja Contact
// z formularzem przeniesiona W CAŁOŚCI ze strony głównej (tam banner CTA
// KontaktBaner.astro), scroll NATYWNY (smoothScroll={false}, jak
// /realizacje/), BackButton + Footer wg wzorca /o-mnie.
// Mechanikę formularza (walidacja, pułapki, reveal, mock endpointu)
// testuje contact.spec.ts. Plan: docs/analiza-podstrona-kontakt.md.
import { expect, test } from "@playwright/test";
import { ui } from "../../src/i18n/ui";
import { SERVICES_PATH } from "../../src/lib/routes";
import {
  collectPageIssues,
  useChromium1920Only,
  usePreviewGuard,
} from "../helpers/guards";
import { gotoReady, scrollPageTo, settle } from "../helpers/scroll";

const SITE = "https://hadrianm.pl";

const PAGES = [
  { path: "/kontakt/", lang: "pl", homePath: "/" },
  { path: "/en/contact/", lang: "en", homePath: "/en/" },
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
      await expect(page).toHaveTitle(ui[p.lang]["contactPage.title"]);
      await expect(
        page.locator('head meta[name="description"]'),
      ).toHaveAttribute("content", ui[p.lang]["contactPage.description"]);
      await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute(
        "href",
        `${SITE}${p.path}`,
      );
      // Para hreflang PL↔EN (obie strony deklarują obie wersje).
      await expect(
        page.locator('head link[rel="alternate"][hreflang="pl"]'),
      ).toHaveAttribute("href", `${SITE}/kontakt/`);
      await expect(
        page.locator('head link[rel="alternate"][hreflang="en"]'),
      ).toHaveAttribute("href", `${SITE}/en/contact/`);
    });

    test(`pełna sekcja: formularz, reveal danych, footer w chrome strony`, async ({
      page,
    }) => {
      await gotoReady(page, p.path);
      const section = page.locator("#contact");
      await expect(section.locator(".kt-form")).toBeAttached();
      await expect(section.locator(".kt-rev")).toHaveCount(2);
      await expect(section.locator(".kt-chip")).toHaveCount(4);
      // Footer wyszedł z sekcji do chrome'u strony (D4 analizy).
      await expect(section.locator(".ft")).toHaveCount(0);
      await expect(page.locator(".ktp-foot .ft")).toBeAttached();
    });

    test(`desktop: scroll natywny (bez Lenisa — jak /realizacje/)`, async ({
      page,
    }) => {
      await gotoReady(page, p.path);
      await expect(page.locator("body")).toHaveAttribute(
        "data-smooth-scroll",
        "off",
      );
      // Chwila na ewentualny (błędny) dynamiczny import — potem asercja.
      await page.waitForTimeout(500);
      expect(await page.evaluate(() => Boolean(window.__lenis))).toBe(false);
    });

    test(`navbar podstrony: kotwice → strona główna, Kontakt = bieżąca, język → odpowiednik`, async ({
      page,
    }) => {
      await gotoReady(page, p.path);
      // Pozycja „Oferta" prowadzi na hub /oferta/ (migracja: analiza huba).
      await expect(
        page.locator(`.nav-link[href="${SERVICES_PATH[p.lang]}"]`),
      ).toBeAttached();
      // Link Kontakt wskazuje bieżącą podstronę (aria-current).
      const self = page.locator(`.nav-link[href="${p.path}"]`);
      await expect(self).toBeAttached();
      await expect(self).toHaveAttribute("aria-current", "page");
      // Przełącznik języka celuje w odpowiedniki podstrony.
      await expect(
        page.locator('a.lang-btn[hreflang="pl"]').first(),
      ).toHaveAttribute("href", "/kontakt/");
      await expect(
        page.locator('a.lang-btn[hreflang="en"]').first(),
      ).toHaveAttribute("href", "/en/contact/");
      // Stopka: współdzielony Footer (ten sam co finał strony głównej).
      await expect(
        page.locator(
          `.ktp-foot .ft-leg a[href="${ui[p.lang]["contact.policyHref"]}"]`,
        ),
      ).toBeAttached();
      await expect(page.locator(".ktp-foot .ft-soc a").first()).toBeAttached();
    });

    test(`back button w miejscu brandu, przyklejony u góry po scrollu`, async ({
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
      // Na 1920×1080 strona mieści się w ~jednym viewporcie (sekcja + stopka
      // ≈ wysokość okna), więc sekwencji „pasek chowa się przy scrollu w dół"
      // nie da się tu wywołać (weryfikują ją długie podstrony, np.
      // about-index.spec.ts). Sprawdzamy inwariant przycisku: po zjeździe na
      // sam dół (ile go jest) fixed „wstecz" zostaje przyklejony u góry.
      await scrollPageTo(page, 10_000);
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

test.describe("banner na stronie głównej", () => {
  for (const p of PAGES) {
    test(`${p.homePath}: status + button → ${p.path}, bez formularza`, async ({
      page,
    }) => {
      await gotoReady(page, p.homePath);
      const banner = page.locator("#contact");
      // Kotwica #contact zostaje (stare linki /#contact + crossfade RED),
      // ale sekcja to już tylko banner — formularz żyje na podstronie.
      await expect(banner).toBeAttached();
      await expect(banner.locator(".kt-form")).toHaveCount(0);
      await expect(banner.locator(".kt-rev")).toHaveCount(0);
      await expect(banner.locator(".kt-cta__status")).toContainText(
        ui[p.lang]["contact.stOn"],
      );
      await expect(banner.locator(".kt-cta__btn")).toHaveAttribute(
        "href",
        p.path,
      );
      // Pozycja navbara „Kontakt" prowadzi wprost na podstronę.
      await expect(
        page.locator(`[data-nav] a[href="${p.path}"]`).first(),
      ).toBeAttached();
      // Footer osadzony w sekcji bannera (finał strony: CTA na środku
      // viewportu, stopka na jego dole).
      await expect(page.locator("#contact .ktb-foot .ft")).toBeAttached();
    });
  }

  test("desktop: CTA startuje zzoomowane i dojeżdża do skali 1 na dnie strony", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium-1920",
      "odzoomowanie tylko desktop — jeden profil wystarczy",
    );
    const scaleOf = (m: string) =>
      m === "none" ? 1 : Number(/matrix\(([-\d.]+)/.exec(m)?.[1] ?? 1);
    await gotoReady(page);
    const cta = page.locator("#contact .kt-cta");
    // Sekcja poza viewportem → stan startowy zooma (CSS .ktb.js / GSAP).
    const before = await cta.evaluate((el) => getComputedStyle(el).transform);
    expect(scaleOf(before)).toBeGreaterThan(1.2);
    // Dno strony = koniec scruba → banner w formie docelowej (scale 1).
    await scrollPageTo(page, 100_000);
    await settle(page, 800);
    const after = await cta.evaluate((el) => getComputedStyle(el).transform);
    expect(scaleOf(after)).toBeCloseTo(1, 1);
  });

  test("klik w button bannera nawiguje na podstronę", async ({ page }) => {
    await gotoReady(page);
    const btn = page.locator("#contact .kt-cta__btn");
    await btn.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await btn.click();
    await expect(page).toHaveURL(/\/kontakt\/?$/);
    await expect(page.locator("#contact .kt-form")).toBeAttached();
  });

  test("stary link /#contact ląduje na bannerze (kotwica działa)", async ({
    page,
  }) => {
    await gotoReady(page, "/#contact");
    await expect(page.locator("#contact .kt-cta__head")).toBeVisible();
  });
});
