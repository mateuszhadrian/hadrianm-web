// Sweep wizualny „Oferty" po podziale na zajawkę + podstrony
// (docs/analiza-podstrony-oferta.md): strona główna = intro czytane scrollem
// + para CTA; /proces-wspolpracy/ = nagłówek + nić z krokami + endcap
// (desktop: fixed progres); /pakiety/ = nagłówek + grid P4 + ogon (dedykowane
// + opcje). Sekcje we flow (bez pinów i snapa) — klatki celują scrollem
// w KONKRETNE elementy (sectionAnchors). freeze.css zeruje transitions →
// stany toggleClass (on/lit) siadają natychmiast; scrubowane tweeny (słowa
// intro, nić) dogania settle. Decyzje: docs/analiza-sekcja-oferta.md §III.
import { expect, test, type Page, type TestInfo } from "@playwright/test";
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

function onlySweepProjects(testInfo: TestInfo): void {
  test.skip(
    !SWEEP_PROJECTS.includes(testInfo.project.name),
    "sweep services tylko na profilach hero (desktop/iPhone/Pixel)",
  );
  test.setTimeout(240_000);
}

async function shoot(
  page: Page,
  frames: Array<{ name: string; y: number }>,
  max: number,
): Promise<void> {
  for (const frame of frames) {
    await scrollPageTo(page, Math.max(0, Math.min(frame.y, max)));
    await settle(page, SETTLE_MS);
    // Prefiks „services-": snapshoty wszystkich speców trafiają do wspólnego
    // katalogu per-projekt — bez prefiksu nazwy mogłyby kolidować.
    // expect.soft: jedna rozjechana klatka nie ucina sweepa (jak w hero).
    await expect.soft(page).toHaveScreenshot(`${frame.name}.png`);
  }
}

test("sweep zajawki oferty (strona główna) vs baseline", async ({
  page,
}, testInfo) => {
  onlySweepProjects(testInfo);
  await prepareSweep(page);

  const { anchors, vh, max } = await sectionAnchors(page, "#services", {
    intro: ".of-intro",
    ctas: ".of-ctas",
  });
  await shoot(
    page,
    [
      // Intro w połowie zakresu czytania (osobne triggery per akapit .of-lit;
      // starty w SERVICES_READ.paraStarts, end liczony z osi tempa).
      { name: "services-home-01-intro-mid", y: anchors.intro - vh * 0.1 },
      // Para CTA po revealu (próg top 92%).
      { name: "services-home-02-ctas", y: anchors.ctas - vh * 0.7 },
    ],
    max,
  );

  // Hover secondary (panel split: ramka + tło pola strzałki) — tylko desktop.
  if (testInfo.project.name === "chromium-1920") {
    await page.locator("#services .pp-btn--split .pp-label").hover();
    await settle(page, 600);
    await expect
      .soft(page)
      .toHaveScreenshot("services-home-03-split-hover.png");
  }
});

test("sweep podstrony /oferta/ (hub) vs baseline", async ({
  page,
}, testInfo) => {
  onlySweepProjects(testInfo);
  await prepareSweep(page, "/oferta/");

  const { anchors, vh, max } = await sectionAnchors(page, "#services", {
    cards: ".ofh-cards",
  });
  await shoot(
    page,
    [
      // Góra strony: chrome (BackButton, tag 02/Oferta; mobile dodatkowo
      // ghost „oferta" + czerwony kicker) + wstęp i karty (desktop: całość
      // mieści się w jednym ekranie).
      { name: "services-hub-01-top", y: 0 },
      // Mobile: karty w słupku (na desktopie klatka pokrywa się z 01).
      { name: "services-hub-02-cards", y: anchors.cards - vh * 0.25 },
    ],
    max,
  );

  // Hover karty Proces (lift + jaśniejsza ramka + pole strzałki splita) —
  // tylko desktop.
  if (testInfo.project.name === "chromium-1920") {
    await page.locator("#services .pp-btn--split .pp-label").hover();
    await settle(page, 600);
    await expect.soft(page).toHaveScreenshot("services-hub-03-split-hover.png");
  }
});

test("sweep podstrony /proces-wspolpracy/ vs baseline", async ({
  page,
}, testInfo) => {
  onlySweepProjects(testInfo);
  await prepareSweep(page, "/proces-wspolpracy/");

  const { anchors, vh, max } = await sectionAnchors(page, "#services", {
    step2: ".of-step:nth-child(2)",
    endcap: ".of-endcap",
  });
  await shoot(
    page,
    [
      // Góra strony: chrome (BackButton, tag Oferta/Proces) + nagłówek.
      { name: "services-proces-01-head", y: 0 },
      // Krok 2 powyżej progu zapłonu węzła (top 56% / mobile 66%).
      { name: "services-proces-02-step2-lit", y: anchors.step2 - vh * 0.4 },
      // Endcap + CTA → /pakiety/; desktop: progres 05 / 05 nadal aktywny.
      { name: "services-proces-03-endcap", y: anchors.endcap - vh * 0.7 },
    ],
    max,
  );
});

test("sweep podstrony /pakiety/ vs baseline", async ({ page }, testInfo) => {
  onlySweepProjects(testInfo);
  await prepareSweep(page, "/pakiety/");

  const { anchors, vh, max } = await sectionAnchors(page, "#services", {
    grid: ".pk-grid",
    extra: ".pk-extra",
  });
  await shoot(
    page,
    [
      // Góra strony: chrome (BackButton, tag Oferta/Pakiety) + nagłówek.
      { name: "services-pakiety-01-head", y: 0 },
      // Siatka pakietów w kadrze.
      { name: "services-pakiety-02-grid", y: anchors.grid - vh * 0.15 },
      // Ogon: pas dedykowanych + opcje dodatkowe.
      { name: "services-pakiety-03-extra", y: anchors.extra + 300 - vh },
    ],
    max,
  );

  // Hover na wyróżnionej kolumnie (lift + jaśniejszy ghost + strzałka) —
  // tylko desktop (na dotyku hover nie istnieje; mobile ma lift wyłączony).
  if (testInfo.project.name === "chromium-1920") {
    await scrollPageTo(page, anchors.grid - vh * 0.15);
    await settle(page, SETTLE_MS);
    await page.locator("#services .pk-col.mid .pk-name").hover();
    await settle(page, 600);
    await expect
      .soft(page)
      .toHaveScreenshot("services-pakiety-04-mid-hover.png");
  }
});
