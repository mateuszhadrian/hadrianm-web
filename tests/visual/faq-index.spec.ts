// Podstrona /faq — zrzuty na WSZYSTKICH 6 profilach (strona bez pinowanych
// scen → celowane widoki jak contact-index.spec.ts, żaden sweep nie jest
// potrzebny). Determinizm: freeze.css (zatrzymuje drift chmur ambientu na
// desktopie i wejścia; mobile ma statyczną teksturę). Stany interaktywne
// (otwarte pytanie, filtr wyszukiwarki) są deterministyczne — ustawiamy je
// klikiem/wpisaniem przed zrzutem; mechanikę weryfikuje e2e faq.spec.ts.
import { expect, test, type Page } from "@playwright/test";
import { usePreviewGuard } from "../helpers/guards";
import { scrollPageTo, settle } from "../helpers/scroll";
import { prepareSweep, sectionAnchors } from "../helpers/visual";

const PATH = "/faq/";

// Tween akordeonu (0.55 s) + ScrollTrigger.refresh() po nim muszą usiąść.
const SETTLE_MS = 1500;

usePreviewGuard();

async function prepare(page: Page) {
  // prepareSweep = gotoReady + freeze.css + repaint (wspólny helper).
  await prepareSweep(page, PATH);
}

test("podstrona faq: widok startowy vs baseline", async ({ page }) => {
  await prepare(page);
  // Zrzut viewportu: navbar bez brandu + przyklejony back button + hero
  // (chrome „05 / FAQ", H1, lead) na warstwie ambientu (blue).
  await expect(page).toHaveScreenshot("faq-index-top.png");
});

test("podstrona faq: rejestr z otwartym pytaniem vs baseline", async ({
  page,
}) => {
  await prepare(page);
  // Kadry celowane JAWNYM scrollem (scrollPageTo synchronizuje Lenisa) —
  // implicit auto-scroll klików/filla to znana rodzina flaka „Lenis
  // desync" (memory ci-flakes-catalog).
  const { anchors, vh, max } = await sectionAnchors(page, ".fqf", {
    item3: ".fq-item:nth-child(3)",
  });
  await scrollPageTo(
    page,
    Math.max(0, Math.min(anchors.item3 - vh * 0.35, max)),
  );
  await settle(page, SETTLE_MS);
  const q3 = page.locator(".fqf .fq-item:nth-child(3) .fq-q");
  await q3.click();
  await settle(page, SETTLE_MS);
  // Zrzut viewportu (wysoki przezroczysty element nad ambientem bywa
  // niestabilny na pixel-5 — kadr okna zamiast element-screenshotu sekcji):
  // sticky wyszukiwarka u góry + pytanie 03 otwarte (numer/plus na akcencie).
  await expect(page).toHaveScreenshot("faq-index-open-q3.png");
});

test("podstrona faq: wyszukiwarka z frazą vs baseline", async ({ page }) => {
  await prepare(page);
  // Jawny scroll do paska wyszukiwarki PRZED fillem — input w viewporcie,
  // więc fill nie robi własnego auto-scrolla (determinizm kadru).
  const { anchors, vh, max } = await sectionAnchors(page, ".fqf", {
    search: ".fq-search-wrap",
  });
  await scrollPageTo(
    page,
    Math.max(0, Math.min(anchors.search - vh * 0.15, max)),
  );
  await settle(page, SETTLE_MS);
  // „faktur" = jedyna pozycja 27 (fraza unikalna PO normalizacji
  // diakrytyków — jak w e2e faq.spec.ts).
  await page.locator("#fq-search-input").fill("faktur");
  await settle(page, SETTLE_MS);
  // Licznik na akcencie (1 z 30), podświetlenie „faktur" w pytaniu 27.
  await expect(page).toHaveScreenshot("faq-index-search.png");
});

test("podstrona faq: stopka vs baseline", async ({ page }) => {
  await prepare(page);
  const foot = page.locator(".fqp-foot");
  await foot.scrollIntoViewIfNeeded();
  await settle(page, SETTLE_MS);
  await expect(foot).toHaveScreenshot("faq-index-footer.png");
});
