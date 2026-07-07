// Scroll w testach — mechanika 1:1 z verify-hero.mjs: Lenis (immediate,
// force) + natywny window.scrollTo, settle = 2×rAF + timeout.
import type { Page } from "@playwright/test";

/** Czeka aż strona „usiądzie": 2×rAF (GSAP scrub dogania) + timeout. */
export async function settle(page: Page, ms = 350): Promise<void> {
  await page.evaluate(
    () =>
      new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
  );
  await page.waitForTimeout(ms);
}

/** Przewija stronę do pozycji y przez Lenisa i natywnie, potem settle. */
export async function scrollPageTo(page: Page, y: number): Promise<void> {
  await page.evaluate((top) => {
    const lenis = window.__lenis;
    if (lenis && typeof lenis.scrollTo === "function") {
      lenis.scrollTo(top, { immediate: true, force: true });
    }
    window.scrollTo(0, top);
  }, Math.round(y));
  await settle(page);
}

/** Zakres scrolla sekcji #hero (offsetHeight − innerHeight) + maks. strony. */
export async function heroScrollRange(
  page: Page,
): Promise<{ hero: number; max: number }> {
  const range = await page.evaluate(() => {
    const hero = document.querySelector<HTMLElement>("#hero");
    if (!hero) return null;
    return {
      hero: hero.offsetHeight - window.innerHeight,
      max: document.documentElement.scrollHeight - window.innerHeight,
    };
  });
  if (!range) throw new Error("Brak #hero na stronie");
  return range;
}

/** Nawigacja + fonty gotowe — wspólny start testów E2E. */
export async function gotoReady(page: Page, path = "/"): Promise<void> {
  await page.goto(path, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts?.ready);
}
