// Strażnik progów breakpointów (T4). Stała `*_DESKTOP_MIN_PX` w configu
// sekcji i próg zaszyty w `@media` pliku `.astro` utrzymuje się W PARZE
// ręcznie (CSS nie zaimportuje stałej) — ten helper łapie rozjazd: mierzy
// własność wyliczoną elementu przy `minPx - 1` (ostatni piksel mobile)
// i `minPx` (pierwszy piksel desktop) i wymaga, by się RÓŻNIŁA. Przesunięcie
// progu w CSS o choćby 1 px w którąkolwiek stronę daje dwa takie same odczyty.
import { expect, type Page } from "@playwright/test";
import { gotoReady } from "./scroll";

export interface BreakpointFlip {
  /** wartość przy `minPx - 1` */
  below: string;
  /** wartość przy `minPx` */
  atMin: string;
}

/** Odczyt `prop` (domyślnie `display`) pierwszego `selector` po świeżym
 *  załadowaniu `url` przy szerokości `width`. Pełne przeładowanie, nie sam
 *  resize: część sekcji wybiera gałąź desktop/mobile przy inicjalizacji
 *  (`motionMedia`), więc resize w locie nie mierzyłby stanu po wejściu. */
async function readAt(
  page: Page,
  url: string,
  selector: string,
  width: number,
  prop: string,
): Promise<string> {
  const height = page.viewportSize()?.height ?? 900;
  await page.setViewportSize({ width, height });
  await gotoReady(page, url);
  const el = page.locator(selector).first();
  await expect(el, `${selector} na ${url} (${width}px)`).toBeAttached();
  return el.evaluate(
    (node, p) => getComputedStyle(node).getPropertyValue(p),
    prop,
  );
}

export async function expectBreakpointFlip(
  page: Page,
  url: string,
  selector: string,
  minPx: number,
  prop = "display",
): Promise<BreakpointFlip> {
  const below = await readAt(page, url, selector, minPx - 1, prop);
  const atMin = await readAt(page, url, selector, minPx, prop);
  expect(
    atMin,
    `${selector} (${prop}) na ${url}: ${minPx - 1}px = „${below}", ${minPx}px = „${atMin}" — próg w CSS rozjechał się z ${minPx}`,
  ).not.toBe(below);
  return { below, atMin };
}
