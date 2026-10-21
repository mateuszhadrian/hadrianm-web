// Strażniki wspólne dla testów Playwright (port wzorców z verify-hero.mjs).
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { test, type Page } from "@playwright/test";

/** Ile wpisów ma zamrożony zestaw testów wizualnych (tests/fixtures/realizacje).
 *  Katalog jest commitowany i nigdy pusty (kontrakt: tests/unit/visual-fixture.test.ts). */
const FIXTURE_DIR = fileURLToPath(
  new URL("../fixtures/realizacje", import.meta.url),
);
const FIXTURE_ENTRIES = readdirSync(FIXTURE_DIR).filter((f) =>
  f.endsWith(".json"),
).length;

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

/** Strażnik zamrożonej treści: baseline'y wizualne realizacji stoją na
 *  tests/fixtures/realizacje, więc `dist` pod testem MUSI pochodzić
 *  z `pnpm build:visual`. Zwykły `pnpm build` wciąga treść z panelu i każdy
 *  zrzut kafli, karuzeli, siatki /realizacje/ i nakładek WorkDetail rozjeżdża
 *  się co do piksela. Bez strażnika objawem jest pixel-diff, z nim — jedno
 *  czytelne zdanie. Liczymy <template data-work-detail> na /realizacje/
 *  (pełna lista; strona główna kapuje do 3, więc nie odróżniłaby zestawów). */
export async function assertVisualFixture(page: Page): Promise<void> {
  const res = await page.request.get("/realizacje/");
  if (!res.ok()) return; // brak strony diagnozuje assertPreview
  const html = await res.text();
  const entries = (html.match(/data-work-detail=/g) ?? []).length;
  if (entries !== FIXTURE_ENTRIES) {
    throw new Error(
      `Testy wizualne wymagają buildu na zamrożonej treści: /realizacje/ ma ` +
        `${entries} wpisów, a tests/fixtures/realizacje ma ${FIXTURE_ENTRIES}. ` +
        `Odpal: pnpm build:visual && pnpm test:visual (zwykły pnpm build ` +
        `wciąga treść z panelu i rozjeżdża baseline'y).`,
    );
  }
}

/** Rejestruje `beforeAll` z obydwoma strażnikami wizualnymi (preview +
 *  zamrożona treść) — dla speców, których zrzuty zależą od kolekcji
 *  realizacji (sections.spec.ts: #work + nakładki; work-index.spec.ts). */
export function useVisualFixtureGuard(): void {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await assertPreview(page);
    await assertVisualFixture(page);
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
