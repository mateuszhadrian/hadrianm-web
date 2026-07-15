// Funkcjonalny stan hero (port z verify-hero.mjs — część niewizualna):
// wideo mobilne gra w środku sweepa, sticky odpina się na końcu osi,
// zero błędów konsoli/404 w całym przejeździe.
import { expect, test } from "@playwright/test";
import { collectPageIssues, usePreviewGuard } from "../helpers/guards";
import {
  gotoReady,
  heroScrollRange,
  scrollPageTo,
  settle,
} from "../helpers/scroll";

usePreviewGuard();

test.describe("mobile: wideo ekranów urządzeń", () => {
  test.skip(({ isMobile }) => !isMobile, "wideo tylko w układzie mobile");

  test("w środku sweepa oba wideo grają (paused=false, currentTime rośnie)", async ({
    page,
  }) => {
    await gotoReady(page);
    const range = await heroScrollRange(page);
    await scrollPageTo(page, range.hero * 0.5);

    const read = () =>
      page.evaluate(() =>
        [...document.querySelectorAll<HTMLVideoElement>(".screen__video")].map(
          (v) => ({ src: !!v.src, paused: v.paused, t: v.currentTime }),
        ),
      );

    const first = await read();
    expect(first.length).toBeGreaterThan(0);
    for (const v of first) {
      expect(v.src, "wideo ma wstrzyknięte src").toBe(true);
      expect(v.paused, "wideo nie jest zapauzowane").toBe(false);
    }
    await page.waitForTimeout(600);
    const second = await read();
    second.forEach((v, i) => {
      expect(v.t, `wideo #${i}: currentTime rośnie`).toBeGreaterThan(
        first[i].t,
      );
    });
  });
});

test("sticky odpina się na końcu osi scrolla hero", async ({ page }) => {
  await gotoReady(page);
  const range = await heroScrollRange(page);

  // W środku osi stage jest przypięty do góry viewportu…
  await scrollPageTo(page, range.hero * 0.5);
  const pinned = await page.locator(".hero__stage").boundingBox();
  expect(pinned).not.toBeNull();
  expect(Math.abs(pinned!.y)).toBeLessThanOrEqual(2);

  // …a tuż za końcem osi (1.06 — jak w verify-hero) odjeżdża w górę.
  await scrollPageTo(page, Math.min(range.hero * 1.06, range.max));
  const released = await page.locator(".hero__stage").boundingBox();
  expect(released).not.toBeNull();
  expect(released!.y).toBeLessThan(0);
});

test("przejazd przez całą oś hero bez błędów konsoli i 404", async ({
  page,
}) => {
  const issues = collectPageIssues(page);
  await gotoReady(page);
  const range = await heroScrollRange(page);
  for (const frac of [0, 0.25, 0.5, 0.75, 1.0, 1.06]) {
    await scrollPageTo(page, Math.min(range.hero * frac, range.max));
  }
  await settle(page);
  expect(issues()).toEqual([]);
});
