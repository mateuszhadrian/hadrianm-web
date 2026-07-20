// Podstrona „FAQ" (PL: /faq/, EN: /en/faq/): pełny rejestr 30 pytań
// z wyszukiwarką (FaqFull.astro), scroll w trybie smoothScroll="desktop"
// (Lenis na desktopie, mobile natywnie), BackButton + Footer wg wzorca
// /kontakt/. Na stronie głównej teaser: 6 pytań + blok „Zobacz wszystkie
// pytania". Mechanikę akordeonu/wyszukiwarki testuje faq.spec.ts.
// Plan: docs/analiza-podstrona-faq.md.
import { expect, test } from "@playwright/test";
import { FAQ_TEASER_COUNT } from "../../src/components/sections/faq/faq-config";
import { faqItems } from "../../src/i18n/faq";
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
  { path: "/faq/", lang: "pl", homePath: "/" },
  { path: "/en/faq/", lang: "en", homePath: "/en/" },
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
      await expect(page).toHaveTitle(ui[p.lang]["faqPage.title"]);
      await expect(
        page.locator('head meta[name="description"]'),
      ).toHaveAttribute("content", ui[p.lang]["faqPage.description"]);
      await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute(
        "href",
        `${SITE}${p.path}`,
      );
      // Para hreflang PL↔EN (obie strony deklarują obie wersje).
      await expect(
        page.locator('head link[rel="alternate"][hreflang="pl"]'),
      ).toHaveAttribute("href", `${SITE}/faq/`);
      await expect(
        page.locator('head link[rel="alternate"][hreflang="en"]'),
      ).toHaveAttribute("href", `${SITE}/en/faq/`);
    });

    test(`pełny rejestr: H1, 30 pytań, wyszukiwarka, JSON-LD FAQPage`, async ({
      page,
    }) => {
      await gotoReady(page, p.path);
      // H1 żyje na podstronie (hero portu referencji).
      await expect(page.locator(".fqf .fq-head h1")).toBeAttached();
      await expect(page.locator(".fqf .fq-item")).toHaveCount(faqItems.length);
      await expect(page.locator("#fq-search-input")).toBeAttached();
      // Pierwsze pytanie = pierwsza pozycja jedynego źródła (slice teasera
      // to prefiks tej samej listy).
      await expect(page.locator(".fqf .fq-q .qt").first()).toHaveText(
        faqItems[0].q[p.lang],
      );
      // JSON-LD FAQPage z KOMPLETEM pytań emituje wyłącznie podstrona (D3).
      const raw = await page
        .locator('.fqf script[type="application/ld+json"]')
        .textContent();
      expect(raw).not.toBeNull();
      const schema = JSON.parse(raw!) as {
        "@type": string;
        mainEntity: { name: string; acceptedAnswer: { text: string } }[];
      };
      expect(schema["@type"]).toBe("FAQPage");
      expect(schema.mainEntity).toHaveLength(faqItems.length);
      for (const q of schema.mainEntity) {
        expect(q.name.trim()).not.toBe("");
        expect(q.acceptedAnswer.text.trim()).not.toBe("");
      }
    });

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

    test(`navbar podstrony: kotwice → strona główna, FAQ = bieżąca, język → odpowiednik`, async ({
      page,
    }) => {
      await gotoReady(page, p.path);
      // Pozycja „Oferta" prowadzi na hub /oferta/ (migracja: analiza huba).
      await expect(
        page.locator(`.nav-link[href="${SERVICES_PATH[p.lang]}"]`),
      ).toBeAttached();
      // Link FAQ wskazuje bieżącą podstronę (aria-current).
      const self = page.locator(`.nav-link[href="${p.path}"]`);
      await expect(self).toBeAttached();
      await expect(self).toHaveAttribute("aria-current", "page");
      // Przełącznik języka celuje w odpowiedniki podstrony.
      await expect(
        page.locator('a.lang-btn[hreflang="pl"]').first(),
      ).toHaveAttribute("href", "/faq/");
      await expect(
        page.locator('a.lang-btn[hreflang="en"]').first(),
      ).toHaveAttribute("href", "/en/faq/");
      // Stopka: współdzielony Footer (ten sam co finał strony głównej).
      await expect(
        page.locator(
          `.fqp-foot .ft-leg a[href="${ui[p.lang]["contact.policyHref"]}"]`,
        ),
      ).toBeAttached();
      await expect(page.locator(".fqp-foot .ft-soc a").first()).toBeAttached();
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
      // Pasek chowa się przy scrollu w dół (strona z 30 pytaniami jest
      // długa); przycisk jest fixed POZA barem i zostaje u góry viewportu.
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
    await gotoReady(page, "/faq/");
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

test.describe("teaser na stronie głównej", () => {
  for (const p of PAGES) {
    test(`${p.homePath}: 6 pytań + blok „więcej" → ${p.path}, bez JSON-LD`, async ({
      page,
    }) => {
      await gotoReady(page, p.homePath);
      const section = page.locator("#faq");
      await expect(section.locator(".fq-item")).toHaveCount(FAQ_TEASER_COUNT);
      // Blok „więcej": licznik i nadpis policzone w Astro z faqItems.
      await expect(section.locator(".fq-all .count")).toHaveText(
        `0${FAQ_TEASER_COUNT} / ${faqItems.length}`,
      );
      await expect(section.locator(".fq-more .lead")).toHaveText(
        ui[p.lang]["faq.moreLead"]
          .replace("{shown}", String(FAQ_TEASER_COUNT))
          .replace("{total}", String(faqItems.length)),
      );
      await expect(section.locator(".fq-all")).toHaveAttribute("href", p.path);
      // JSON-LD FAQPage wyprowadził się W CAŁOŚCI na podstronę (D3).
      await expect(
        section.locator('script[type="application/ld+json"]'),
      ).toHaveCount(0);
      // Pozycja navbara „FAQ" prowadzi wprost na podstronę.
      await expect(
        page.locator(`[data-nav] a[href="${p.path}"]`).first(),
      ).toBeAttached();
    });
  }

  test("klik w button teasera nawiguje na podstronę", async ({ page }) => {
    await gotoReady(page);
    const btn = page.locator("#faq .fq-all");
    await btn.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await btn.click();
    await expect(page).toHaveURL(/\/faq\/?$/);
    await expect(page.locator(".fqf .fq-list")).toBeAttached();
  });
});
