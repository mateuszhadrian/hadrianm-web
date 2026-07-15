// Strażniki wspólne dla testów Playwright (port wzorców z verify-hero.mjs).
import { test, type Page } from "@playwright/test";

/** Strażnik preview: testy biegają na buildzie produkcyjnym (pnpm preview),
 *  NIGDY na dev serverze. Astro dev wstrzykuje klienta Vite — wykrywamy go
 *  w HTML-u i przerywamy z czytelnym komunikatem (dev vs preview = fałszywe
 *  różnice wizualne i inny timing). Na produkcji (BASE_URL) przechodzi. */
export async function assertPreview(page: Page): Promise<void> {
  const res = await page.request.get("/");
  if (!res.ok()) {
    throw new Error(
      `Serwer nie odpowiada (HTTP ${res.status()}). Uruchom najpierw: ` +
        `pnpm build && pnpm preview --port 4399 (lub ustaw BASE_URL).`,
    );
  }
  const html = await res.text();
  if (html.includes("/@vite/client")) {
    throw new Error(
      "Pod baseURL działa DEV SERVER (wykryto /@vite/client) — testy " +
        "wymagają preview. Zostaw dev na 4321 i odpal: pnpm build && " +
        "pnpm preview --port 4399.",
    );
  }
}

/** Rejestruje wspólny `beforeAll` ze strażnikiem preview — wywołaj na topie
 *  pliku speca zamiast kopiować blok hooka. */
export function usePreviewGuard(): void {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await assertPreview(page);
    await page.close();
  });
}

/** Rejestruje `beforeEach` pomijający testy poza projektem chromium-1920 —
 *  dla speców niezależnych od profilu (meta/treść), które wystarczy
 *  przebiec raz. `reason` pojawia się w raporcie jako powód skipa. */
export function useChromium1920Only(reason: string): void {
  // eslint-disable-next-line no-empty-pattern -- Playwright wymaga destrukturyzacji fixtures
  test.beforeEach(async ({}, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-1920", reason);
  });
}

/** Kolektor problemów strony: console.error + pageerror + 404 (poza
 *  /cdn-cgi/image/ — endpoint istnieje tylko na produkcji Cloudflare,
 *  lokalne 404 obrazów realizacji to znany artefakt preview).
 *  Zwraca funkcję odczytu przefiltrowanej, zdeduplikowanej listy. */
export function collectPageIssues(page: Page): () => string[] {
  const issues: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") issues.push(`console.error: ${msg.text()}`);
  });
  page.on("pageerror", (err) => issues.push(`pageerror: ${String(err)}`));
  page.on("response", (res) => {
    if (res.status() === 404 && !res.url().includes("/cdn-cgi/image/")) {
      issues.push(`404: ${res.url()}`);
    }
  });
  return () =>
    [...new Set(issues)].filter(
      // Konsolowe echo lokalnych 404 obrazów (realny 404 łapie listener response).
      (e) => !/Failed to load resource.*404/.test(e),
    );
}
