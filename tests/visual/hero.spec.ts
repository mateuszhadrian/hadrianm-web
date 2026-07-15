// Sweep wizualny hero — migracja 1:1 z scripts/verify-hero.mjs: te same
// punkty osi, scroll przez Lenisa (immediate+force) + window.scrollTo,
// settle 2×rAF + timeout, freeze czasowych animacji CSS. Wideo maskowane
// natywnie (mask) zamiast visibility:hidden.
//
// Baseline'y per-platform (darwin/linux) — procedura aktualizacji:
// docs/testing-tools-and-environemnts-setup-analysis.md §III.4c.
import { expect, test } from "@playwright/test";
import { usePreviewGuard } from "../helpers/guards";
import { heroScrollRange, scrollPageTo } from "../helpers/scroll";
import { prepareSweep, SWEEP_PROJECTS } from "../helpers/visual";

// Punkty sweepa jako ułamek zakresu scrolla hero (offsetHeight − innerHeight);
// ostatni > 1 = tuż za odpięciem sticky (clamp do maks. scrolla strony).
const POINTS = [0, 0.06, 0.14, 0.24, 0.36, 0.5, 0.64, 0.78, 0.9, 1.0, 1.06];

// Utrwalona wiedza projektu: klatki desktop 05–09 różnią się ~0.5–2% między
// przebiegami (ekran telefonu + ambient) — podwyższony próg TYLKO tam.
const FLAKY_DESKTOP_FRAMES = new Set([5, 6, 7, 8, 9]);
const FLAKY_RATIO = 0.02;

// Utrwalona wiedza projektu (2026-07-12, PR polityki prywatności): flota
// runnerów GH nie renderuje jednolicie — te same binaria (cache
// playwright-Linux-1.61.1), ten sam obraz i ten sam artefakt dist dały
// PASS w attempt 1 i FAIL w attempt 2 tego samego runa. Różnica dotyka
// WYŁĄCZNIE glifów serifowego akcentu hero („za Ciebie") przy ułamkowym
// DPR Pixela 5 (2.75): inne zaokrąglenia AA między klasami CPU →
// deterministyczne ~0.0034–0.0035 diffu w ramach maszyny, 0 na innej.
// Próg 0.01 TYLKO na klatkach z akcentem (00–03); realna regresja layoutu
// to rzędy wielkości więcej. Pozostałe klatki mobilne bez luzów
// (historycznie 0.000%). Desktop DPR=1 i iPhone DPR=3 (całkowite) —
// nie dotyczy.
const FLAKY_PIXEL5_FRAMES = new Set([0, 1, 2, 3]);
const FLAKY_PIXEL5_RATIO = 0.01;

usePreviewGuard();

test("sweep scrolla hero vs baseline", async ({ page }, testInfo) => {
  test.skip(
    !SWEEP_PROJECTS.includes(testInfo.project.name),
    "sweep hero tylko na odpowiednikach profili verify-hero",
  );
  test.setTimeout(240_000);

  await prepareSweep(page);

  const range = await heroScrollRange(page);
  const mask = [page.locator(".screen__video")];

  for (let i = 0; i < POINTS.length; i++) {
    const frac = POINTS[i];
    await scrollPageTo(page, Math.min(range.hero * frac, range.max));

    const name = `${String(i).padStart(2, "0")}-p${String(
      Math.round(frac * 100),
    ).padStart(3, "0")}.png`;
    const ratio =
      testInfo.project.name === "chromium-1920" && FLAKY_DESKTOP_FRAMES.has(i)
        ? FLAKY_RATIO
        : testInfo.project.name === "chromium-pixel-5" &&
            FLAKY_PIXEL5_FRAMES.has(i)
          ? FLAKY_PIXEL5_RATIO
          : undefined;

    // expect.soft: jedna rozjechana klatka nie ucina sweepa — raport
    // pokazuje wszystkie różnice naraz (jak lista FAIL w verify-hero).
    await expect.soft(page).toHaveScreenshot(name, {
      mask,
      maskColor: "#000000",
      ...(ratio !== undefined ? { maxDiffPixelRatio: ratio } : {}),
    });
  }
});
