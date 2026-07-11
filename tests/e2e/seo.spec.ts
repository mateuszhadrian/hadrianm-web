// SEO/linki: canonical, meta OG/Twitter, sitemap (obie wersje językowe),
// robots.txt (blokada /admin), crawl wewnętrznych linków (< 400).
// Meta są identyczne między projektami — biega tylko na chromium-1920.
import { expect, test } from "@playwright/test";
import { gotoReady } from "../helpers/scroll";

const SITE = "https://hadrianm.pl";

// eslint-disable-next-line no-empty-pattern -- Playwright wymaga destrukturyzacji fixtures
test.beforeEach(async ({}, testInfo) => {
  test.skip(
    testInfo.project.name !== "chromium-1920",
    "meta/sitemap/crawl są niezależne od profilu — jeden projekt wystarczy",
  );
});

for (const { path, locale } of [
  { path: "/", locale: "pl_PL" },
  { path: "/en/", locale: "en_US" },
]) {
  test(`head ${path}: canonical + OG/Twitter`, async ({ page }) => {
    await gotoReady(page, path);
    const head = page.locator("head");

    // Canonical i og:url są absolutne (domena z astro.config — także na preview).
    await expect(head.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `${SITE}${path}`,
    );
    await expect(head.locator('meta[property="og:url"]')).toHaveAttribute(
      "content",
      `${SITE}${path}`,
    );
    await expect(head.locator('meta[property="og:image"]')).toHaveAttribute(
      "content",
      `${SITE}/og-image.png`,
    );
    await expect(head.locator('meta[property="og:locale"]')).toHaveAttribute(
      "content",
      locale,
    );
    const ogTitle = await head
      .locator('meta[property="og:title"]')
      .getAttribute("content");
    expect(ogTitle).toBe(await page.title());
    await expect(head.locator('meta[name="twitter:card"]')).toHaveAttribute(
      "content",
      "summary",
    );
  });
}

test("robots.txt blokuje /admin i wskazuje sitemapę", async ({ request }) => {
  const res = await request.get("/robots.txt");
  expect(res.ok()).toBe(true);
  const body = await res.text();
  expect(body).toContain("Disallow: /admin");
  expect(body).toContain(`Sitemap: ${SITE}/sitemap-index.xml`);
});

test("sitemapa istnieje i linkuje obie wersje językowe", async ({
  request,
}) => {
  const index = await request.get("/sitemap-index.xml");
  expect(index.ok()).toBe(true);
  const locs = [...(await index.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    (m) => m[1],
  );
  expect(locs.length).toBeGreaterThan(0);

  const urls: string[] = [];
  for (const loc of locs) {
    const res = await request.get(new URL(loc).pathname);
    expect(res.ok(), `sitemapa ${loc}`).toBe(true);
    urls.push(
      ...[...(await res.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map(
        (m) => m[1],
      ),
    );
  }
  expect(urls).toContain(`${SITE}/`);
  expect(urls).toContain(`${SITE}/en/`);
});

test("wszystkie wewnętrzne linki odpowiadają < 400", async ({
  page,
  request,
}) => {
  // ⚠️ PRZEJŚCIOWE: polityka prywatności powstaje na OSOBNYM branchu po
  // merge'u sekcji kontaktu (Etap 5, decyzja D7 w
  // docs/contact-me-form-analysis-implementation.md §7/§10 — świadome,
  // krótkie okno 404). USUŃ ten wyjątek razem z powstaniem podstron.
  const PENDING_POLICY = new Set([
    "/polityka-prywatnosci",
    "/en/privacy-policy",
  ]);
  const hrefs = new Set<string>();
  for (const path of ["/", "/en/"]) {
    await gotoReady(page, path);
    for (const href of await page
      .locator("a[href]")
      .evaluateAll((els) => els.map((el) => el.getAttribute("href")))) {
      if (!href || !href.startsWith("/") || href.startsWith("//")) continue;
      if (href.includes("/cdn-cgi/")) continue; // tylko na produkcji Cloudflare
      if (PENDING_POLICY.has(href)) continue;
      hrefs.add(href);
    }
  }
  expect(hrefs.size).toBeGreaterThan(0);
  for (const href of hrefs) {
    const res = await request.get(href);
    expect(res.status(), `link ${href}`).toBeLessThan(400);
  }
});
