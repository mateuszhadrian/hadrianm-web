// Sekcja „FAQ": akordeon (jedno otwarte naraz, aria-expanded), CTA →
// podstrona /kontakt/, fallback bez JS (wszystko rozwinięte — SEO), JSON-LD
// FAQPage, wersja EN i prefers-reduced-motion: reduce (komentarz niżej).
// Choreografię wejść weryfikuje sweep tests/visual/faq.spec.ts.
// Decyzje: docs/analiza-sekcja-faq.md.
import { expect, test, type Page } from "@playwright/test";
import { usePreviewGuard } from "../helpers/guards";
import { gotoReady, settle } from "../helpers/scroll";

usePreviewGuard();

const item = (page: Page, n: number) =>
  page.locator(`#faq .fq-item:nth-child(${n})`);
const button = (page: Page, n: number) => item(page, n).locator(".fq-q");
const answerHeight = async (page: Page, n: number) =>
  (await item(page, n).locator(".fq-a").boundingBox())?.height ?? 0;

test("akordeon: otwiera, domyka poprzednie, zamyka (jedno otwarte naraz)", async ({
  page,
}) => {
  await gotoReady(page);
  await button(page, 1).scrollIntoViewIfNeeded();
  // Reveal wierszy (klasa .on z progu ScrollTriggera) musi usiąść przed klikiem.
  await settle(page, 800);

  // Init akordeonu zamknął markupowe aria-expanded="true".
  await expect(button(page, 1)).toHaveAttribute("aria-expanded", "false");
  expect(await answerHeight(page, 1)).toBe(0);

  // Otwarcie 01 (tween 0.55 s przy motion — settle czeka aż usiądzie).
  await button(page, 1).click();
  await expect(button(page, 1)).toHaveAttribute("aria-expanded", "true");
  await settle(page, 900);
  expect(await answerHeight(page, 1)).toBeGreaterThan(0);
  await expect(page.locator("#faq .fq-item.open")).toHaveCount(1);

  // Otwarcie 02 domyka 01 tym samym mechanizmem.
  await button(page, 2).click();
  await settle(page, 900);
  await expect(button(page, 1)).toHaveAttribute("aria-expanded", "false");
  await expect(button(page, 2)).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#faq .fq-item.open")).toHaveCount(1);
  expect(await answerHeight(page, 1)).toBe(0);

  // Ponowny klik 02 zamyka wszystko.
  await button(page, 2).click();
  await settle(page, 900);
  await expect(page.locator("#faq .fq-item.open")).toHaveCount(0);
  expect(await answerHeight(page, 2)).toBe(0);
});

test("CTA (Napisz do mnie) nawiguje na podstronę /kontakt/", async ({
  page,
}) => {
  await gotoReady(page);
  const cta = page.locator("#faq .fq-link");
  await cta.scrollIntoViewIfNeeded();
  await settle(page, 800);
  // Od migracji kontaktu (docs/analiza-podstrona-kontakt.md) CTA to zwykły
  // link na podstronę — pełna nawigacja zamiast skoku kotwicznego.
  await cta.click();
  await expect(page).toHaveURL(/\/kontakt\/?$/);
  await expect(page.locator("#contact .kt-form")).toBeVisible();
});

test.describe("fallback bez JS", () => {
  test.use({ javaScriptEnabled: false });

  test("pełna treść rozwinięta statycznie (SEO)", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page.locator("#faq .fq-item")).toHaveCount(6);
    // Markup startuje z aria-expanded="true" = stan bez JS.
    await expect(page.locator("#faq .fq-q").first()).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    // Odpowiedzi widoczne bez żadnej interakcji (CSS nie chowa niczego).
    for (const n of [1, 6]) {
      expect(await answerHeight(page, n)).toBeGreaterThan(0);
    }
    await expect(page.locator("#faq .fq-q .qt").first()).toContainText(
      "Ile czasu zajmuje",
    );
  });
});

test("JSON-LD FAQPage z kompletem pytań na / i /en/", async ({ page }) => {
  for (const path of ["/", "/en/"]) {
    await page.goto(path, { waitUntil: "networkidle" });
    const raw = await page
      .locator('#faq script[type="application/ld+json"]')
      .textContent();
    expect(raw).not.toBeNull();
    const schema = JSON.parse(raw!) as {
      "@type": string;
      mainEntity: { name: string; acceptedAnswer: { text: string } }[];
    };
    expect(schema["@type"]).toBe("FAQPage");
    expect(schema.mainEntity).toHaveLength(6);
    for (const q of schema.mainEntity) {
      expect(q.name.trim()).not.toBe("");
      expect(q.acceptedAnswer.text.trim()).not.toBe("");
    }
  }
});

test("wersja EN ma przetłumaczoną sekcję FAQ", async ({ page }) => {
  await gotoReady(page, "/en/");
  await expect(page.locator("#faq .fq-head h2")).toContainText("questions");
  await expect(page.locator("#faq .fq-q .qt").first()).toContainText(
    "How long does it take",
  );
  await expect(page.locator("#faq .fq-link")).toContainText("Write to me");
});

/* Świadomy, PUNKTOWY wyjątek od zakazu emulacji reduced-motion
   (.claude/rules/testing.md): tamta reguła chroni przed testami, które
   „przechodzą" na martwej stronie (bramka w BaseLayout wyłącza animacje).
   Ten describe assertuje ODWROTNOŚĆ martwej strony — że akordeon przy
   reduce nadal DZIAŁA (interakcja ładowana poza bramką motion, wymaganie
   z docs/analiza-sekcja-faq.md §II.2). Na martwej stronie aria-expanded
   zostałoby markupowe "true" i pierwsza asercja by poległa. */
test.describe("prefers-reduced-motion: reduce — akordeon bez animacji", () => {
  test.use({ contextOptions: { reducedMotion: "reduce" } });

  test("treść widoczna od razu, akordeon przełącza natychmiast", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    // Init akordeonu zadziałał także przy reduce (zamknął odpowiedzi)…
    await expect(button(page, 1)).toHaveAttribute("aria-expanded", "false");
    expect(await answerHeight(page, 1)).toBe(0);
    // …a wejścia nie chowają treści (stany startowe bramkuje media query).
    await expect(page.locator("#faq .fq-head h2")).toBeVisible();

    // Przełączenie bez tweenów — stan siada od razu (krótki settle tylko
    // na rerender, nie na animację).
    await button(page, 1).click();
    await expect(button(page, 1)).toHaveAttribute("aria-expanded", "true");
    await settle(page, 100);
    expect(await answerHeight(page, 1)).toBeGreaterThan(0);

    await button(page, 3).click();
    await expect(button(page, 1)).toHaveAttribute("aria-expanded", "false");
    await expect(button(page, 3)).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("#faq .fq-item.open")).toHaveCount(1);
  });
});
