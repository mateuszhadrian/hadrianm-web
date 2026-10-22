// Strona 404 (backlog ewolucji S1) — kontrakty: PRAWDZIWY status 404 pod
// nieistniejącym adresem (bez dist/404.html Cloudflare Pages serwował stronę
// główną z kodem 200 — soft-404), noindex BEZ canonicala/og:url/hreflang,
// jeden plik dla obu języków (język po ścieżce: skrypt inline usuwa
// nieaktywny blok, bez JS widoczny PL), komunikat + jedna akcja na stronę
// główną właściwego języka, pełny chrome podstron (navbar + wstecz + stopka).
// Ten sam dokument odpowiada pod adresem dowolnej głębokości — stąd warianty
// ścieżek. Treść/meta są niezależne od profilu — jak policy.spec.ts biega
// na chromium-1920 (wyjątek: geometria pierwszego ekranu, wszystkie profile).
import { expect, test } from "@playwright/test";
import { ui } from "../../src/i18n/ui";
import { HOME_PATH } from "../../src/lib/routes";
import { usePreviewGuard } from "../helpers/guards";
import { gotoReady } from "../helpers/scroll";

usePreviewGuard();

const MISSING_PL = ["/fgsdfgsdf", "/nie-ma-takiej-strony/", "/a/b/c/"];
const MISSING_EN = ["/en/fgsdfgsdf", "/en/no-such-page/", "/en/a/b/c/"];

const only1920 = (testInfo: { project: { name: string } }) =>
  test.skip(
    testInfo.project.name !== "chromium-1920",
    "treść/meta 404 są niezależne od profilu — jeden projekt wystarczy",
  );

test("nieistniejący adres odpowiada statusem 404 (nie soft-404 z kodem 200)", async ({
  request,
}, testInfo) => {
  only1920(testInfo);
  for (const path of [...MISSING_PL, ...MISSING_EN]) {
    const res = await request.get(path);
    expect(res.status(), path).toBe(404);
    expect(await res.text(), path).toContain("data-nf-lang");
  }
});

test("meta: noindex, BEZ canonicala, og:url, hreflang i JSON-LD", async ({
  page,
}, testInfo) => {
  only1920(testInfo);
  await gotoReady(page, MISSING_PL[1]);
  const head = page.locator("head");
  await expect(page).toHaveTitle(ui.pl["notFound.title"]);
  await expect(head.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    "noindex",
  );
  await expect(head.locator('link[rel="canonical"]')).toHaveCount(0);
  await expect(head.locator('meta[property="og:url"]')).toHaveCount(0);
  await expect(head.locator('link[rel="alternate"][hreflang]')).toHaveCount(0);
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(
    0,
  );
});

for (const [lang, paths] of [
  ["pl", MISSING_PL],
  ["en", MISSING_EN],
] as const) {
  test(`${lang}: język po ścieżce — jeden aktywny blok, tytuł, komunikat, CTA`, async ({
    page,
  }, testInfo) => {
    only1920(testInfo);
    await gotoReady(page, paths[1]);
    await expect(page.locator("html")).toHaveAttribute("lang", lang);
    await expect(page).toHaveTitle(ui[lang]["notFound.title"]);
    // skrypt usunął nieaktywny blok (Navbar wiąże się z pierwszym [data-nav])
    await expect(page.locator("[data-nf-lang]")).toHaveCount(1);
    await expect(page.locator("[data-nf-lang]")).toHaveAttribute(
      "data-nf-lang",
      lang,
    );
    const h1 = page.locator("h1");
    await expect(h1).toHaveCount(1);
    await expect(h1).toContainText(ui[lang]["notFound.headLead"]);
    await expect(h1).toContainText(ui[lang]["notFound.headAccent"]);
    await expect(page.locator(".nf-mono")).toHaveText(
      ui[lang]["notFound.eyebrow"],
    );
    await expect(page.locator(".nf-txt")).toHaveText(ui[lang]["notFound.text"]);
    const cta = page.getByRole("link", { name: ui[lang]["notFound.cta"] });
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute("href", HOME_PATH[lang]);
    // pełny chrome: navbar (jeden), wstecz do strony głównej języka, stopka
    await expect(page.locator("[data-nav]")).toHaveCount(1);
    await expect(page.locator("a[data-back]")).toHaveAttribute(
      "href",
      HOME_PATH[lang],
    );
    await expect(page.locator(".nf-foot .ft-soc a").first()).toBeAttached();
    // przełącznik języka celuje w strony główne (404 nie ma odpowiednika)
    await expect(
      page.locator('a.lang-btn[hreflang="pl"]').first(),
    ).toHaveAttribute("href", HOME_PATH.pl);
    await expect(
      page.locator('a.lang-btn[hreflang="en"]').first(),
    ).toHaveAttribute("href", HOME_PATH.en);
  });

  test(`${lang}: CTA prowadzi na stronę główną także z adresu zagnieżdżonego`, async ({
    page,
  }, testInfo) => {
    only1920(testInfo);
    await gotoReady(page, paths[2]);
    await page.getByRole("link", { name: ui[lang]["notFound.cta"] }).click();
    await expect(page).toHaveURL(new RegExp(`${HOME_PATH[lang]}$`));
    expect(new URL(page.url()).pathname).toBe(HOME_PATH[lang]);
  });
}

test.describe("bez JS strona jest kompletna (PL)", () => {
  test.use({ javaScriptEnabled: false });

  test("widoczny blok PL, EN schowany CSS-em, komunikat i CTA", async ({
    page,
  }, testInfo) => {
    only1920(testInfo);
    await page.goto(MISSING_PL[0]);
    await expect(page.locator("html")).toHaveAttribute("lang", "pl");
    await expect(page.locator('[data-nf-lang="pl"]')).toBeVisible();
    await expect(page.locator('[data-nf-lang="en"]')).toBeHidden();
    await expect(page.locator('[data-nf-lang="pl"] h1')).toContainText(
      ui.pl["notFound.headLead"],
    );
    const cta = page.getByRole("link", { name: ui.pl["notFound.cta"] });
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute("href", HOME_PATH.pl);
  });
});

test("komunikat mieści się w pierwszym ekranie pod paskiem (każdy profil)", async ({
  page,
}) => {
  await gotoReady(page, MISSING_PL[1]);
  const geo = await page.evaluate(() => {
    const box = document.querySelector(".nf-in")!.getBoundingClientRect();
    const main = document.querySelector(".nf")!.getBoundingClientRect();
    const bar = document.querySelector(".nav-bar")!.getBoundingClientRect();
    return {
      top: box.top,
      bottom: box.bottom,
      cx: box.left + box.width / 2,
      // Środek z pudełka `main`, NIE z okna: na linuksowym runnerze pasek
      // przewijania jest klasyczny, a `scrollbar-gutter: stable` rezerwuje
      // mu miejsce — środek okna i obszaru treści różnią się o pół paska.
      mainCx: main.left + main.width / 2,
      barBottom: bar.bottom,
      vh: window.innerHeight,
    };
  });
  expect(geo.top).toBeGreaterThanOrEqual(geo.barBottom);
  expect(geo.bottom).toBeLessThanOrEqual(geo.vh);
  expect(Math.abs(geo.cx - geo.mainCx)).toBeLessThanOrEqual(1);
});
