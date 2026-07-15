// Sweep wizualny sekcji „FAQ" — sekcja we flow (bez pinów i scrubu na
// treści), więc celujemy scrollem w KONKRETNE elementy (klatki z checklisty
// README referencji): szew + nagłówek + ghost, rejestr zamknięty, pytanie 03
// otwarte (numer/plus na akcencie, odpowiedź widoczna), CTA + endline,
// desktop dodatkowo hover na wierszu. freeze.css zeruje transitions → stany
// toggleClass (.on) siadają natychmiast (dlatego klatka „w połowie staggera"
// z checklisty jest niedeterministyczna — pomijamy); tween wysokości
// akordeonu jest JS-owy (GSAP) — dogania settle. Decyzje:
// docs/analiza-sekcja-faq.md §III.4.
import { expect, test } from "@playwright/test";
import { usePreviewGuard } from "../helpers/guards";
import { scrollPageTo, settle } from "../helpers/scroll";
import {
  prepareSweep,
  sectionAnchors,
  SWEEP_PROJECTS,
} from "../helpers/visual";

// Tween akordeonu (0.55 s) + ScrollTrigger.refresh() po nim muszą usiąść.
const SETTLE_MS = 1500;

usePreviewGuard();

test("sweep scrolla sekcji FAQ vs baseline", async ({ page }, testInfo) => {
  test.skip(
    !SWEEP_PROJECTS.includes(testInfo.project.name),
    "sweep FAQ tylko na profilach hero (desktop/iPhone/Pixel)",
  );
  test.setTimeout(240_000);

  await prepareSweep(page);

  // Kotwice klatek: patrz sectionAnchors (klatki celują w elementy,
  // nie w ułamki osi — sekcja we flow).
  const { anchors, vh, max } = await sectionAnchors(page, "#faq", {
    head: ".fq-head",
    item3: ".fq-item:nth-child(3)",
    cta: ".fq-cta",
  });
  const clamp = (y: number) => Math.max(0, Math.min(y, max));
  const shoot = (name: string) =>
    // Prefiks „faq-": snapshoty wszystkich speców trafiają do wspólnego
    // katalogu per-projekt. expect.soft: jedna rozjechana klatka nie
    // ucina sweepa (jak w hero/services).
    expect.soft(page).toHaveScreenshot(`faq-${name}.png`);

  // 01: szew + tag + ghost + nagłówek (wejścia .on siadają przez freeze).
  await scrollPageTo(page, clamp(anchors.head - vh * 0.35));
  await settle(page, SETTLE_MS);
  await shoot("01-head");

  // 02: rejestr w kadrze, wszystkie pytania zamknięte.
  await scrollPageTo(page, clamp(anchors.item3 - vh * 0.5));
  await settle(page, SETTLE_MS);
  await shoot("02-list-closed");

  // 03: pytanie 03 otwarte — numer/plus na akcencie, odpowiedź widoczna.
  const q3 = page.locator("#faq .fq-item:nth-child(3) .fq-q");
  await q3.click();
  await settle(page, SETTLE_MS);
  await shoot("03-open-q3");

  // Domknięcie 03 wraca do wyjściowej wysokości strony (kotwica CTA
  // mierzona przy zamkniętym rejestrze zostaje aktualna).
  await q3.click();
  await settle(page, SETTLE_MS);

  // 04: endline + CTA „Napisz do mnie".
  await scrollPageTo(page, clamp(anchors.cta - vh * 0.65));
  await settle(page, SETTLE_MS);
  await shoot("04-cta");

  // 05: hover na wierszu (tło row, pytanie x+8, plus na biało) — tylko
  // desktop (na dotyku hover nie istnieje).
  if (testInfo.project.name === "chromium-1920") {
    await scrollPageTo(page, clamp(anchors.item3 - vh * 0.5));
    await settle(page, SETTLE_MS);
    await page.locator("#faq .fq-item:nth-child(2) .fq-q .qt").hover();
    await settle(page, 600);
    await shoot("05-hover-q2");
  }
});
