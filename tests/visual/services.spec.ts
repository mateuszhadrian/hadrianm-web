// Sweep wizualny sekcji „Oferta" — sekcja we flow (bez pinów i snapa), więc
// zamiast ułamków osi celujemy scrollem w KONKRETNE elementy (kotwice klatek
// z checklisty README referencji): intro w połowie czytania, krok 2 z zapalonym
// węzłem + częściowo wypełniona nić, endcap + CTA (desktop: progres 05/05),
// nagłówek pakietów, ogon sekcji (dedykowane + opcje). freeze.css zeruje
// transitions → stany toggleClass (on/lit) siadają natychmiast; scrubowane
// tweeny (słowa intro, nić) dogania settle. Decyzje:
// docs/analiza-sekcja-oferta.md §III.
import { expect, test } from "@playwright/test";
import { usePreviewGuard } from "../helpers/guards";
import { scrollPageTo, settle } from "../helpers/scroll";
import {
  prepareSweep,
  sectionAnchors,
  SWEEP_PROJECTS,
} from "../helpers/visual";

// Scrub intro (0.45 s) i nici (0.5 s) — lerp asymptotyczny musi usiąść.
const SETTLE_MS = 2000;

usePreviewGuard();

test("sweep scrolla sekcji oferta vs baseline", async ({ page }, testInfo) => {
  test.skip(
    !SWEEP_PROJECTS.includes(testInfo.project.name),
    "sweep services tylko na profilach hero (desktop/iPhone/Pixel)",
  );
  test.setTimeout(240_000);

  await prepareSweep(page);

  // Kotwice klatek: patrz sectionAnchors (klatki celują w elementy,
  // nie w ułamki osi — sekcja we flow).
  const { anchors, vh, max } = await sectionAnchors(page, "#services", {
    intro: ".of-intro",
    step2: ".of-step:nth-child(2)",
    endcap: ".of-endcap",
    packages: "#packages",
    extra: ".pk-extra",
  });
  const frames: Array<{ name: string; y: number }> = [
    // Intro w połowie zakresu czytania (start top 58% → end bottom 44%).
    { name: "01-intro-mid", y: anchors.intro - vh * 0.1 },
    // Krok 2 powyżej progu zapłonu węzła (top 56% / mobile 66%).
    { name: "02-step2-lit", y: anchors.step2 - vh * 0.4 },
    // Endcap + CTA widoczne; desktop: progres 05 / 05 nadal aktywny.
    { name: "03-endcap", y: anchors.endcap - vh * 0.7 },
    // Nagłówek pakietów + góra siatki.
    { name: "04-packages", y: anchors.packages - vh * 0.1 },
    // Ogon: pas dedykowanych + opcje dodatkowe.
    { name: "05-extra", y: anchors.extra + 300 - vh },
  ];

  for (const frame of frames) {
    await scrollPageTo(page, Math.max(0, Math.min(frame.y, max)));
    await settle(page, SETTLE_MS);
    // Prefiks „services-": snapshoty wszystkich speców trafiają do wspólnego
    // katalogu per-projekt — bez prefiksu nazwy mogłyby kolidować.
    // expect.soft: jedna rozjechana klatka nie ucina sweepa (jak w hero).
    await expect.soft(page).toHaveScreenshot(`services-${frame.name}.png`);
  }

  // Hover na wyróżnionej kolumnie (lift + jaśniejszy ghost + strzałka) —
  // tylko desktop (na dotyku hover nie istnieje; mobile ma lift wyłączony).
  if (testInfo.project.name === "chromium-1920") {
    await scrollPageTo(page, anchors.packages - vh * 0.1);
    await settle(page, SETTLE_MS);
    await page.locator("#services .pk-col.mid .pk-name").hover();
    await settle(page, 600);
    await expect.soft(page).toHaveScreenshot("services-06-mid-hover.png");
  }
});
