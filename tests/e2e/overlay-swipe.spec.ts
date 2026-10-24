// Swipe-down BottomSheet'a (U1, port „Runda 4" z hetman): gest idzie przez
// `touch*` (non-passive, preventDefault w pierwszej klatce ruchu w dół), więc
// test MUSI generować prawdziwy dotyk — CDP `Input.dispatchTouchEvent`, nie
// `page.mouse` (mysz idzie ścieżką pointer* i przechodziła mimo martwego
// dotyku). CDP = tylko Chromium → jeden profil mobile (chromium-pixel-5).
// Pull-to-refresh Androida emulacja nie pokazuje — to zostaje na telefon.
import { expect, test, type CDPSession, type Page } from "@playwright/test";
import { realizacjeFiles } from "../helpers/realizacje";
import { gotoReady } from "../helpers/scroll";

test.skip(
  realizacjeFiles().length === 0,
  "brak wpisów realizacji w panelu — nie ma sheeta do otwarcia",
);
test.beforeEach(({ browserName }, testInfo) => {
  test.skip(
    browserName !== "chromium" || testInfo.project.name !== "chromium-pixel-5",
    "CDP touch tylko w Chromium — jeden profil mobile",
  );
});

const SHEET = "#work-sheet";
const SCROLL = `${SHEET} [data-overlay-scroll]`;

/** Ruch palca z (x0,y0) do (x1,y1) w `steps` klatkach ~16 ms. */
async function swipe(
  page: Page,
  cdp: CDPSession,
  from: { x: number; y: number },
  to: { x: number; y: number },
  steps = 14,
): Promise<void> {
  const point = (x: number, y: number) => [
    { x: Math.round(x), y: Math.round(y), id: 1 },
  ];
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: point(from.x, from.y),
  });
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: point(
        from.x + (to.x - from.x) * t,
        from.y + (to.y - from.y) * t,
      ),
    });
    await page.waitForTimeout(16);
  }
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
}

async function openSheet(page: Page) {
  await gotoReady(page, "/");
  const card = page.locator(".wk-car [data-work-slug]").first();
  await card.scrollIntoViewIfNeeded();
  // guard „strona w ruchu" blokuje otwarcie nakładki ~110 ms po scrollu
  await page.waitForTimeout(300);
  await card.click();
  const sheet = page.locator(SHEET);
  await expect(sheet).toHaveClass(/is-open/);
  // koniec animacji wjazdu — gest na jadącym panelu mierzyłby co innego
  await page.waitForTimeout(500);
  // znacznik: przeładowanie strony (np. pull-to-refresh) by go skasowało
  await page.evaluate(() => {
    (window as unknown as { __noReload: boolean }).__noReload = true;
  });
  return sheet;
}

async function centerOf(page: Page, selector: string) {
  const box = await page.locator(selector).boundingBox();
  if (!box) throw new Error(`brak boxa ${selector}`);
  return { x: box.x + box.width / 2, y: box.y + Math.min(box.height / 2, 200) };
}

async function notReloaded(page: Page) {
  expect(
    await page.evaluate(
      () => (window as unknown as { __noReload?: boolean }).__noReload,
    ),
    "strona przeładowała się w trakcie gestu",
  ).toBe(true);
}

test("swipe w dół z treści przewiniętej na górę zamyka sheet", async ({
  page,
}) => {
  const sheet = await openSheet(page);
  const cdp = await page.context().newCDPSession(page);
  expect(await page.locator(SCROLL).evaluate((el) => el.scrollTop)).toBe(0);
  const from = await centerOf(page, SCROLL);
  await swipe(page, cdp, from, { x: from.x, y: from.y + 260 });
  await expect(sheet).toBeHidden();
  await notReloaded(page);
});

test("swipe w dół z treści przewiniętej niżej przewija treść, sheet zostaje", async ({
  page,
}) => {
  const sheet = await openSheet(page);
  const cdp = await page.context().newCDPSession(page);
  const scroller = page.locator(SCROLL);
  const scrollable = await scroller.evaluate(
    (el) => el.scrollHeight - el.clientHeight,
  );
  expect(scrollable, "treść sheeta musi się przewijać").toBeGreaterThan(200);
  await scroller.evaluate((el) => {
    el.scrollTop = 200;
  });
  const from = await centerOf(page, SCROLL);
  await swipe(page, cdp, from, { x: from.x, y: from.y + 120 });
  await page.waitForTimeout(400);
  await expect(sheet).toHaveClass(/is-open/);
  expect(await scroller.evaluate((el) => el.scrollTop)).toBeLessThan(200);
  await notReloaded(page);
});

test("swipe w bok w treści nie zamyka sheeta", async ({ page }) => {
  const sheet = await openSheet(page);
  const cdp = await page.context().newCDPSession(page);
  const from = await centerOf(page, SCROLL);
  await swipe(page, cdp, from, { x: from.x - 150, y: from.y + 30 });
  await page.waitForTimeout(400);
  await expect(sheet).toHaveClass(/is-open/);
});

test("swipe w dół za uchwyt zamyka sheet dotykiem", async ({ page }) => {
  const sheet = await openSheet(page);
  const cdp = await page.context().newCDPSession(page);
  // lewa część nagłówka — z dala od przycisku X (z niego gest nie startuje)
  const box = await page.locator(`${SHEET} [data-overlay-drag]`).boundingBox();
  if (!box) throw new Error("brak uchwytu");
  const from = { x: box.x + 24, y: box.y + box.height / 2 };
  await swipe(page, cdp, from, { x: from.x, y: from.y + 260 });
  await expect(sheet).toBeHidden();
  await notReloaded(page);
});

test("krótki, wolny ruch w dół wraca sheet na miejsce", async ({ page }) => {
  const sheet = await openSheet(page);
  const cdp = await page.context().newCDPSession(page);
  const from = await centerOf(page, SCROLL);
  // 40 px w ~30 klatkach: poniżej DRAG_CLOSE_PX (96) i progu „flick"
  await swipe(page, cdp, from, { x: from.x, y: from.y + 40 }, 30);
  await page.waitForTimeout(500);
  await expect(sheet).toHaveClass(/is-open/);
  expect(
    await page
      .locator(`${SHEET} [data-overlay-panel]`)
      .evaluate((el) => (el as HTMLElement).style.transform),
  ).toBe("");
});
