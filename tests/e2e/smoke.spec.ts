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

  test("kluczowe zasoby odpowiadają", async ({ request }) => {
    for (const path of ["/favicon.svg", "/site.webmanifest", "/og-image.png"]) {
      const res = await request.get(path);
      expect(res.ok(), path).toBe(true);
    }
  });
});
