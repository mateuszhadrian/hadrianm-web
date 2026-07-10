// Sweep wizualny sekcji „Oferta" — sekcja we flow (bez pinów i snapa), więc
// zamiast ułamków osi celujemy scrollem w KONKRETNE elementy (kotwice klatek
// z checklisty README referencji): intro w połowie czytania, krok 2 z zapalonym
// węzłem + częściowo wypełniona nić, endcap + CTA (desktop: progres 05/05),
// nagłówek pakietów, ogon sekcji (dedykowane + opcje). freeze.css zeruje
// transitions → stany toggleClass (on/lit) siadają natychmiast; scrubowane
// tweeny (słowa intro, nić) dogania settle. Decyzje:
// docs/analiza-sekcja-oferta.md §III.
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { assertPreview } from "../helpers/guards";
import { gotoReady, scrollPageTo, settle } from "../helpers/scroll";

// Te same profile co sweepy hero/audience/about (desktop/iPhone/Pixel).
const SERVICES_PROJECTS = [
  "chromium-1920",
  "webkit-iphone-14",
  "chromium-pixel-5",
];

// Scrub intro (0.45 s) i nici (0.5 s) — lerp asymptotyczny musi usiąść.
const SETTLE_MS = 2000;

const FREEZE = fileURLToPath(new URL("../helpers/freeze.css", import.meta.url));

test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();
  await assertPreview(page);
  await page.close();
});

test("sweep scrolla sekcji oferta vs baseline", async ({ page }, testInfo) => {
  test.skip(
    !SERVICES_PROJECTS.includes(testInfo.project.name),
    "sweep services tylko na profilach hero (desktop/iPhone/Pixel)",
  );
  test.setTimeout(240_000);

  await gotoReady(page);
  await page.addStyleTag({ path: FREEZE });
  await page.waitForTimeout(400);

  // Kotwice klatek: pozycja dokumentowa elementu + przesunięcie w vh —
  // odporne na zmiany długości treści (PL/EN) i wysokości sekcji.
  const anchors = await page.evaluate(() => {
    const sec = document.querySelector<HTMLElement>("#services");
    if (!sec) return null;
    const abs = (s: string) => {
      const el = sec.querySelector<HTMLElement>(s);
      return el ? el.getBoundingClientRect().top + window.scrollY : null;
    };
    return {
      intro: abs(".of-intro"),
      step2: abs(".of-step:nth-child(2)"),
      endcap: abs(".of-endcap"),
      packages: abs("#packages"),
      extra: abs(".pk-extra"),
      vh: window.innerHeight,
      max: document.documentElement.scrollHeight - window.innerHeight,
    };
  });
  if (
    !anchors ||
    anchors.intro === null ||
    anchors.step2 === null ||
    anchors.endcap === null ||
    anchors.packages === null ||
    anchors.extra === null
  ) {
    throw new Error("Brak #services lub jego elementów na stronie");
  }

  const { vh, max } = anchors;
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
