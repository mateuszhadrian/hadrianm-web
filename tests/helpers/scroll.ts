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

/**
 * Zsynchronizuj wewnętrzny scroll Lenisa z realnym window.scrollY.
 * Playwrightowe `scrollIntoViewIfNeeded()` scrolluje NATYWNIE, z pominięciem
 * Lenisa — na wolnych runnerach CI jego sync z natywnego scrolla potrafi nie
 * zdążyć przed klikiem w kotwicę, a handlery CTA liczą cel skoku z
 * wewnętrznej pozycji Lenisa → lądowanie z offsetem (flaki CTA FAQ/Oferty
 * na chromium-1920). Wywołaj po natywnym scrollu, przed klikiem w kotwicę.
 * Realnych użytkowników desync nie dotyczy (scrollują PRZEZ Lenisa).
 */
export async function syncLenis(page: Page): Promise<void> {
  await page.evaluate(() => {
    const lenis = window.__lenis;
    if (lenis && typeof lenis.scrollTo === "function") {
      lenis.scrollTo(window.scrollY, { immediate: true, force: true });
    }
  });
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

/**
 * Płynny dojazd do y (ease-out, rAF) — dla sekcji ze scrubem i snapem
 * ScrollTriggera (about). Skok „immediate" NIE działa tam deterministycznie:
 * snap podejmuje decyzję na podstawie SCRUBOWANEGO (opóźnionego ~1 s)
 * postępu, więc po skoku cofa scroll do poprzedniego punktu osi. Dojazd
 * z wyhamowaniem pozwala scrubowi nadążyć; gdy y JEST punktem snapa,
 * snap staje się no-opem.
 */
async function scrollPageToSmooth(
  page: Page,
  y: number,
  ms = 1500,
): Promise<void> {
  await page.evaluate(
    async ({ top, ms }) => {
      const lenis = window.__lenis;
      const from = window.scrollY;
      const delta = top - from;
      const t0 = performance.now();
      await new Promise<void>((done) => {
        const tick = (now: number) => {
          const t = Math.min((now - t0) / ms, 1);
          const eased = 1 - Math.pow(1 - t, 3);
          const pos = from + delta * eased;
          if (lenis) lenis.scrollTo(pos, { immediate: true, force: true });
          window.scrollTo(0, pos);
          if (t < 1) requestAnimationFrame(tick);
          else done();
        };
        requestAnimationFrame(tick);
      });
    },
    { top: Math.round(y), ms },
  );
  await settle(page);
}

/**
 * Dojeżdża płynnie do y i czeka aż pozycja USIĄDZIE dokładnie tam.
 * Cel musi być punktem spoczynku snapa (albo sekcją bez snapa) — inaczej
 * snap odciągnie scroll i funkcja rzuci po wyczerpaniu prób. Sekcje ze
 * snapem testuj z wyłącznikiem `?nosnap` (about-scroll.ts): snap decyduje
 * na scrubowanym postępie i na wolnych runnerach CI potrafi uciec o cały
 * segment osi mimo dojazdu dokładnie w punkt.
 */
export async function scrollPageToStable(
  page: Page,
  y: number,
  tries = 3,
): Promise<void> {
  const target = Math.round(y);
  for (let i = 0; i < tries; i++) {
    await scrollPageToSmooth(page, target);
    // Okno snapa: delay 0.08 s + tween do 0.55 s.
    await page.waitForTimeout(900);
    const at = await page.evaluate(() => window.scrollY);
    if (Math.abs(at - target) <= 2) return;
  }
  const at = await page.evaluate(() => window.scrollY);
  throw new Error(
    `scrollPageToStable: pozycja nie zbiegła do ${target} (jest ${at}) — ` +
      `czy cel na pewno jest punktem spoczynku snapa?`,
  );
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
