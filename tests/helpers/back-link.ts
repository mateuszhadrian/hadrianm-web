// Strzałka „wstecz" podstron (a[data-back] → history.back(),
// src/scripts/back-link.ts) — JEDYNE miejsce, z którego testy ją klikają.
//
// Dwie pułapki, które ten helper zamyka (PI-07, PI-08, P-80):
// 1. Handler initBackLinks żyje w skrypcie-module BaseLayoutu (deferred) —
//    do DOMContentLoaded strzałka jest zwykłym linkiem `href` (zamierzony
//    fallback). `toHaveURL` / poll na `pathname` łapie dopiero COMMIT
//    nawigacji, więc pod obciążeniem test klikał przed podpięciem handlera.
// 2. Fallback `href` zwykle prowadzi na TEN SAM adres co history.back(),
//    więc sama asercja adresu przechodzi także przy zgubionym handlerze
//    (fałszywa zieleń). Rozstrzyga typ nawigacji: `back_forward` vs
//    `navigate`.
import { expect, type Page } from "@playwright/test";

/** Typ nawigacji bieżącego dokumentu (PerformanceNavigationTiming.type). */
export async function navigationType(page: Page): Promise<string> {
  return page.evaluate(
    () =>
      (
        performance.getEntriesByType(
          "navigation",
        )[0] as PerformanceNavigationTiming
      ).type,
  );
}

/**
 * Klika strzałkę „wstecz" na stronie, na którą test właśnie wszedł
 * kliknięciem, i sprawdza, że powrót był cofnięciem w historii na
 * `expectedPath` — nie nową nawigacją przez fallback `href`.
 */
export async function clickBackAndExpectHistory(
  page: Page,
  expectedPath: string,
): Promise<void> {
  // Stan, w którym klika użytkownik: strona wyrenderowana, moduły wykonane.
  await page.waitForLoadState("domcontentloaded");
  await page.locator("a[data-back]").click();
  await expect
    .poll(() => new URL(page.url()).pathname, {
      message: `powrót strzałką na ${expectedPath} (fallback href prowadzi gdzie indziej?)`,
    })
    .toBe(expectedPath);
  expect(
    await navigationType(page),
    "powrót to cofnięcie w historii (history.back), nie fallback href",
  ).toBe("back_forward");
}
