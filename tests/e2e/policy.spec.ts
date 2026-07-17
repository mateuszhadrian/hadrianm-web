// Polityka prywatności (Etap 5): podstrony PL/EN — meta/i18n, komplet
// sekcji RODO, linki strona główna ↔ polityka, e-mail administratora
// składany w JS (antyscraping — patrz test dist w contact.spec.ts)
// i strzałka „wstecz" (a[data-back] → history.back() przywraca pozycję
// scrolla strony głównej). Treść jest niezależna od profilu — jak
// seo.spec.ts biega tylko na chromium-1920.
import { expect, test } from "@playwright/test";
import { ui } from "../../src/i18n/ui";
import { useChromium1920Only } from "../helpers/guards";
import { gotoReady } from "../helpers/scroll";

const SITE = "https://hadrianm.pl";

useChromium1920Only(
  "treść/meta polityki są niezależne od profilu — jeden projekt wystarczy",
);

const PAGES = [
  {
    path: "/polityka-prywatnosci/",
    lang: "pl",
    title: "Polityka prywatności — hadrianm.pl",
    backHref: "/",
    contactHref: "/kontakt/",
    altHref: "/en/privacy-policy/",
    nip: "NIP: 8322016376",
  },
  {
    path: "/en/privacy-policy/",
    lang: "en",
    title: "Privacy policy — hadrianm.pl",
    backHref: "/en/",
    contactHref: "/en/contact/",
    altHref: "/polityka-prywatnosci/",
    nip: "NIP): 8322016376",
  },
] as const;

for (const p of PAGES) {
  test(`${p.path}: lang, tytuł, canonical, komplet sekcji`, async ({
    page,
  }) => {
    await gotoReady(page, p.path);
    await expect(page.locator("html")).toHaveAttribute("lang", p.lang);
    await expect(page).toHaveTitle(p.title);
    await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute(
      "href",
      `${SITE}${p.path}`,
    );
    // 9 punktów zakresu RODO (§7 analizy) — strażnik przed przypadkowym
    // wycięciem sekcji przy edycji treści.
    await expect(page.locator(".pp-sec")).toHaveCount(9);
    // dane administratora (dokument prawny musi identyfikować podmiot)
    await expect(page.locator(".pp-sec").first()).toContainText(p.nip);
  });

  test(`${p.path}: nawigacja — wstecz, przełącznik języka, formularz`, async ({
    page,
  }) => {
    await gotoReady(page, p.path);
    await expect(page.locator("a[data-back]")).toHaveAttribute(
      "href",
      p.backHref,
    );
    await expect(page.locator(".pp-lang")).toHaveAttribute("href", p.altHref);
    // CTA formularza prowadzi na podstronę kontaktu (migracja:
    // docs/analiza-podstrona-kontakt.md).
    await expect(page.locator(".pp-foot a")).toHaveAttribute(
      "href",
      p.contactHref,
    );
  });

  test(`${p.path}: e-mail administratora złożony w JS (mailto)`, async ({
    page,
  }) => {
    await gotoReady(page, p.path);
    // Pełny adres NIE występuje w HTML (kontrakt antyscrapingowy w
    // contact.spec.ts) — skrypt strony składa go z fragmentów po załadowaniu.
    const mail = page.locator('.pp-sec a[href^="mailto:"]');
    await expect(mail).toHaveAttribute("href", "mailto:info@hadrianm.pl");
    await expect(mail).toHaveText("info@hadrianm.pl");
  });
}

test("linki polityki celują w podstrony: stopka głównej + nota na /kontakt/ (PL i EN)", async ({
  page,
}) => {
  // Nota RODO (.kt-note) żyje od migracji przy formularzu na /kontakt/
  // (docs/analiza-podstrona-kontakt.md); na głównej został footer.
  for (const [home, contactPath, lang] of [
    ["/", "/kontakt/", "pl"],
    ["/en/", "/en/contact/", "en"],
  ] as const) {
    const href = ui[lang]["contact.policyHref"];
    await gotoReady(page, home);
    await expect(page.locator(`.ft-leg a[href="${href}"]`)).toBeAttached();
    await gotoReady(page, contactPath);
    await expect(page.locator(`.kt-note a[href="${href}"]`)).toBeAttached();
    await expect(page.locator(`.ft-leg a[href="${href}"]`)).toBeAttached();
  }
});

test("strzałka „wstecz” wraca na stronę główną w zapamiętane miejsce", async ({
  page,
}) => {
  await gotoReady(page, "/");
  // Playwright doscrolluje do linku natywnie przy kliknięciu — to zwykła
  // nawigacja stronicowa (bez kotwic), więc sync Lenisa nie jest potrzebny.
  await page.locator('.ft-leg a[href="/polityka-prywatnosci/"]').click();
  await expect(page).toHaveURL(/\/polityka-prywatnosci\/?$/);
  const saved = await page.evaluate(() => window.scrollY);

  await page.locator("a[data-back]").click();
  await expect(page).toHaveURL(/\/$/);
  // history.back() → natywne scroll restoration przywraca pozycję sprzed
  // przejścia (koniec strony, nie góra). Poll: przywrócenie bywa asynchroniczne.
  await expect
    .poll(() => page.evaluate(() => window.scrollY), { timeout: 5000 })
    .toBeGreaterThan(10000);
  expect(saved).toBe(0); // sanity: polityka otwarta od góry
});
