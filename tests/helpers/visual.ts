// Wspólne klocki testów wizualnych: profile sweepów, freeze.css, start
// sweepa oraz sweep sekcji przypiętej ze snapem (about/audience).
// UWAGA: nazwy zrzutów budowane tutaj MUSZĄ zostać bajt-w-bajt takie same
// jak przed ekstrakcją — zmiana nazwy = Playwright uzna baseline za nowy.
import { fileURLToPath } from "node:url";
import { expect, type Page } from "@playwright/test";
import { gotoReady, scrollPageToStable, settle } from "./scroll";

/** Profile sweepów sekcji animowanych — odpowiedniki profili verify-hero
 *  (desktop/iPhone/Pixel); pozostałe projekty pomijamy, żeby nie mnożyć
 *  baseline'ów ponad potrzebę. */
export const SWEEP_PROJECTS = [
  "chromium-1920",
  "webkit-iphone-14",
  "chromium-pixel-5",
];

/** Arkusz zerujący czasowe animacje CSS — determinizm klatek. */
export const FREEZE = fileURLToPath(new URL("./freeze.css", import.meta.url));

/** Po wstrzyknięciu freeze.css strona musi zdążyć przemalować zatrzymane
 *  animacje, zanim zaczniemy mierzyć kotwice i fotografować. */
const FREEZE_REPAINT_MS = 400;

/** Wspólny start sweepa: nawigacja + freeze.css + odczekanie na repaint. */
export async function prepareSweep(page: Page, path = "/"): Promise<void> {
  await gotoReady(page, path);
  await page.addStyleTag({ path: FREEZE });
  await page.waitForTimeout(FREEZE_REPAINT_MS);
}

// Mobile: ułamki zakresu scrolla sekcji (offsetHeight − innerHeight) —
// wspólne dla about/audience (punkty pokrywają rozdziały i finał).
const MOBILE_POINTS = [0.12, 0.4, 0.7, 1];

/**
 * Sweep sekcji przypiętej ze snapem (about/audience). Desktop: DOKŁADNIE
 * punkty spoczynku snapa (`snapPoints`) — snap do bieżącej pozycji jest
 * no-opem, więc klatka nie dryfuje między przebiegami. Mobile: flow — stałe
 * ułamki osi (MOBILE_POINTS). Nazwy zrzutów: `{section}-NN-pPPP.png`.
 */
export async function snappedSectionSweep(
  page: Page,
  opts: {
    /** Nazwa sekcji (np. "about"): selektor to `#{section}`, a nazwa zrzutu
     *  dostaje ją jako prefiks — snapshoty wszystkich speców trafiają do
     *  wspólnego katalogu per-projekt, bez prefiksu mogłyby kolidować.
     *  Jeden parametr zamiast pary selektor+prefiks = brak ryzyka rozjazdu
     *  (zrzut sekcji A porównywany z baseline'em sekcji B). */
    section: string;
    /** Breakpoint sceny przypiętej (stała *_DESKTOP_MIN_PX configu sekcji). */
    desktopMinPx: number;
    /** Punkty spoczynku snapa (stała *_SNAP_POINTS configu sekcji). */
    snapPoints: readonly number[];
    /** Scrub + reveale sekcji muszą zdążyć usiąść przed zrzutem. */
    settleMs: number;
  },
): Promise<void> {
  // ?nosnap: snap wyłączony na czas testu — programowy dojazd do punktów osi
  // nie ściga się ze snapem na wolnych runnerach CI (kadry bez zmian: punkty
  // sweepa to i tak pozycje spoczynku snapa).
  await prepareSweep(page, "/?nosnap");

  const range = await page.evaluate(
    ({ sel, minPx }) => {
      const sec = document.querySelector<HTMLElement>(sel);
      if (!sec) return null;
      return {
        top: sec.offsetTop,
        span: sec.offsetHeight - window.innerHeight,
        max: document.documentElement.scrollHeight - window.innerHeight,
        desktop: matchMedia(`(min-width: ${minPx}px)`).matches, // scena przypięta?
      };
    },
    { sel: `#${opts.section}`, minPx: opts.desktopMinPx },
  );
  if (!range) throw new Error(`Brak #${opts.section} na stronie`);

  const points = range.desktop ? [...opts.snapPoints] : MOBILE_POINTS;

  for (let i = 0; i < points.length; i++) {
    const frac = points[i];
    await scrollPageToStable(
      page,
      Math.min(range.top + range.span * frac, range.max),
    );
    await settle(page, opts.settleMs);

    const name = `${opts.section}-${String(i).padStart(2, "0")}-p${String(
      Math.round(frac * 100),
    ).padStart(3, "0")}.png`;
    // expect.soft: jedna rozjechana klatka nie ucina sweepa (jak w hero).
    await expect.soft(page).toHaveScreenshot(name);
  }
}

/**
 * Kotwice klatek sweepa we flow (faq/services): pozycja dokumentowa
 * elementu + metryki strony — odporne na zmiany długości treści (PL/EN)
 * i wysokości sekcji. Rzuca, gdy brakuje sekcji lub któregoś elementu.
 */
export async function sectionAnchors<K extends string>(
  page: Page,
  sectionId: string,
  selectors: Record<K, string>,
): Promise<{ anchors: Record<K, number>; vh: number; max: number }> {
  const res = await page.evaluate(
    ({ sel, selectors }) => {
      const sec = document.querySelector<HTMLElement>(sel);
      if (!sec) return null;
      const anchors: Record<string, number | null> = {};
      // Object.entries<string>: generyk K degeneruje w evaluate do unknown
      // (typowanie przez serializację) — jawna adnotacja przywraca string.
      for (const [key, s] of Object.entries<string>(selectors)) {
        const el = sec.querySelector<HTMLElement>(s);
        anchors[key] = el
          ? el.getBoundingClientRect().top + window.scrollY
          : null;
      }
      return {
        anchors,
        vh: window.innerHeight,
        max: document.documentElement.scrollHeight - window.innerHeight,
      };
    },
    { sel: sectionId, selectors: selectors as Record<string, string> },
  );
  if (!res || Object.values(res.anchors).some((v) => v === null)) {
    throw new Error(`Brak ${sectionId} lub jego elementów na stronie`);
  }
  return res as { anchors: Record<K, number>; vh: number; max: number };
}
