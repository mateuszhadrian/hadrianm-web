// Minimalny smoke (@prod-smoke): strona wstaje, hero renderuje, oba języki
// odpowiadają, brak błędów konsoli. Ten sam kod biega w E2E na preview
// i po deployu przeciw produkcji: pnpm test:smoke:prod (BASE_URL).
import { expect, test } from "@playwright/test";
import { collectPageIssues } from "../helpers/guards";

test.describe("smoke", { tag: "@prod-smoke" }, () => {
  test("/ wstaje: 200, hero renderuje, bez błędów konsoli", async ({
    page,
  }) => {
    const issues = collectPageIssues(page);
    const res = await page.goto("/", { waitUntil: "networkidle" });
    expect(res?.status()).toBe(200);
    await expect(page.locator("#hero")).toBeVisible();
    await expect(page.locator(".hero__eyebrow")).not.toBeEmpty();
    expect(issues()).toEqual([]);
  });

  test("/en/ wstaje: 200, lang=en, bez błędów konsoli", async ({ page }) => {
    const issues = collectPageIssues(page);
    const res = await page.goto("/en/", { waitUntil: "networkidle" });
    expect(res?.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("#hero")).toBeVisible();
    expect(issues()).toEqual([]);
  });

  test("/kontakt/ wstaje: 200, formularz w DOM (PL + EN)", async ({ page }) => {
    // Podstrona z formularzem (docs/analiza-podstrona-kontakt.md) — deploy
    // musi ją serwować; sam endpoint sonduje osobny test niżej.
    for (const path of ["/kontakt/", "/en/contact/"]) {
      const res = await page.goto(path, { waitUntil: "networkidle" });
      expect(res?.status(), path).toBe(200);
      await expect(page.locator("#contact .kt-form")).toBeAttached();
    }
  });

  test("kluczowe zasoby odpowiadają", async ({ request }) => {
    for (const path of ["/favicon.svg", "/site.webmanifest", "/og-image.png"]) {
      const res = await request.get(path);
      expect(res.ok(), path).toBe(true);
    }
  });

  test("POST /api/kontakt z honeypotem → 200 bez wysyłki maila", async ({
    request,
  }, testInfo) => {
    // Pages Function żyje tylko na deployu Cloudflare — lokalny preview
    // serwuje sam dist (kontrakt: docs/contact-me-form-analysis-implementation.md §10).
    test.skip(
      !process.env.BASE_URL,
      "endpoint istnieje tylko na deployu (BASE_URL)",
    );
    // Jedna sonda, nie 6: reguła WAF kontakt-form-burst blokuje serie
    // POST-ów z jednego IP (>3/10 s) — probe per projekt by ją strącał.
    test.skip(
      testInfo.project.name !== "chromium-1920",
      "sonda endpointu niezależna od przeglądarki — wystarczy raz",
    );
    // Wypełniony honeypot = ścieżka bot-trap: funkcja odpowiada 200 i CICHO
    // odrzuca PRZED wysyłką przez Resend — sonda nie generuje maili.
    const res = await request.post("/api/kontakt", {
      multipart: {
        name: "Prod Smoke",
        email: "prod-smoke@example.com",
        temat: "",
        message: "Sonda żywotności endpointu — honeypot celowo wypełniony.",
        firma: "smoke-probe-bot-trap",
        elapsed: "10000",
        lang: "pl",
        "cf-turnstile-response": "",
      },
    });
    expect(res.status()).toBe(200);
  });
});
