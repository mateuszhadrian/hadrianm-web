// SEO/linki: canonical, meta OG/Twitter, sitemap (obie wersje językowe),
// robots.txt (blokada /admin), crawl wewnętrznych linków (< 400), ikony
// (komplet z scripts/make-icons.mjs, favicon.svg = generat — S4).
// Meta są identyczne między projektami — biega tylko na chromium-1920.
import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { useChromium1920Only } from "../helpers/guards";
import { gotoReady } from "../helpers/scroll";

const SITE = "https://hadrianm.pl";
/** Źródło ikon (S4) — public/favicon.svg i rastry są jego GENERATEM. */
const ICON_SOURCE = "src/assets/brand/hm-icon.svg";

useChromium1920Only(
  "meta/sitemap/crawl są niezależne od profilu — jeden projekt wystarczy",
);

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
    // Kadr 1.91:1 (S2): zgodność wymiarów z plikiem pilnuje
    // tests/unit/og-image.test.ts — tu tylko deklaracja w meta.
    await expect(
      head.locator('meta[property="og:image:width"]'),
    ).toHaveAttribute("content", "1200");
    await expect(
      head.locator('meta[property="og:image:height"]'),
    ).toHaveAttribute("content", "630");
    await expect(head.locator('meta[property="og:locale"]')).toHaveAttribute(
      "content",
      locale,
    );
    const ogTitle = await head
      .locator('meta[property="og:title"]')
      .getAttribute("content");
    expect(ogTitle).toBe(await page.title());
    // summary_large_image = pełny kadr; `summary` redukował podgląd do
    // kwadracika obok tytułu (S2).
    await expect(head.locator('meta[name="twitter:card"]')).toHaveAttribute(
      "content",
      "summary_large_image",
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

test("ikony: komplet z make-icons, favicon.svg = generat ze źródła", async ({
  request,
}) => {
  // Rastry: status, właściwy format i wymiar z nagłówka IHDR (bajty 16–19).
  for (const [path, size] of [
    ["/apple-touch-icon.png", 180],
    ["/icon-192.png", 192],
    ["/icon-512.png", 512],
  ] as const) {
    const res = await request.get(path);
    expect(res.status(), `ikona ${path}`).toBe(200);
    const body = await res.body();
    expect(body.subarray(1, 4).toString("latin1"), `${path}: nie PNG`).toBe(
      "PNG",
    );
    expect(body.readUInt32BE(16), `${path}: szerokość`).toBe(size);
  }
  const ico = await (await request.get("/favicon.ico")).body();
  expect(ico.readUInt16LE(2), "favicon.ico: nagłówek ICO").toBe(1);
  expect(ico.readUInt16LE(4), "favicon.ico: liczba obrazów").toBe(2);

  // favicon.svg jest GENERATEM `pnpm make:icons`: komentarz GENERAT + źródło
  // 1:1. Ręczna edycja (nawet z zachowanym komentarzem) rozjeżdża go
  // z rastrami — zmiana rysunku idzie przez źródło i generator.
  const svg = await (await request.get("/favicon.svg")).text();
  const end = svg.indexOf("-->\n");
  expect(end, "favicon.svg bez komentarza GENERAT").toBeGreaterThan(0);
  expect(svg.slice(0, end)).toContain("GENERAT: node scripts/make-icons.mjs");
  expect(
    svg.slice(end + 4),
    `favicon.svg ≠ ${ICON_SOURCE} — edytuj źródło i uruchom pnpm make:icons`,
  ).toBe(readFileSync(ICON_SOURCE, "utf8"));

  // Manifest wskazuje istniejące ikony o zadeklarowanych wymiarach.
  const manifest = await (await request.get("/site.webmanifest")).json();
  expect(manifest.icons.length).toBeGreaterThan(0);
  for (const icon of manifest.icons as { src: string; sizes: string }[]) {
    const res = await request.get(icon.src);
    expect(res.status(), `ikona z manifestu ${icon.src}`).toBe(200);
    const width = (await res.body()).readUInt32BE(16);
    expect(`${width}x${width}`, `${icon.src}: sizes w manifeście`).toBe(
      icon.sizes,
    );
  }
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
  const hrefs = new Set<string>();
  for (const path of ["/", "/en/"]) {
    await gotoReady(page, path);
    for (const href of await page
      .locator("a[href]")
      .evaluateAll((els) => els.map((el) => el.getAttribute("href")))) {
      if (!href || !href.startsWith("/") || href.startsWith("//")) continue;
      if (href.includes("/cdn-cgi/")) continue; // tylko na produkcji Cloudflare
      hrefs.add(href);
    }
  }
  expect(hrefs.size).toBeGreaterThan(0);
  for (const href of hrefs) {
    const res = await request.get(href);
    expect(res.status(), `link ${href}`).toBeLessThan(400);
  }
});
