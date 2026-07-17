// Sekcja „FAQ": TEASER na stronie głównej (akordeon 6 pytań — jedno otwarte
// naraz, CTA → /kontakt/, fallback bez JS, wersja EN, reduce) oraz PEŁNY
// rejestr na podstronie /faq/ (akordeon z NIEZALEŻNYMI toggle'ami,
// wyszukiwarka 100% frontend — filtr/diakrytyki/licznik/brak wyników,
// reduce i no-JS). Meta/nawigację podstrony testuje faq-index.spec.ts;
// choreografię wejść — sweepy tests/visual/. Decyzje:
// docs/analiza-sekcja-faq.md + docs/analiza-podstrona-faq.md.
import { expect, test, type Locator, type Page } from "@playwright/test";
import { faqItems } from "../../src/i18n/faq";
import { usePreviewGuard } from "../helpers/guards";
import { gotoReady, settle } from "../helpers/scroll";

usePreviewGuard();

const boxHeight = async (loc: Locator) =>
  (await loc.boundingBox())?.height ?? 0;

const item = (page: Page, n: number) =>
  page.locator(`#faq .fq-item:nth-child(${n})`);
const button = (page: Page, n: number) => item(page, n).locator(".fq-q");
const answerHeight = (page: Page, n: number) =>
  boxHeight(item(page, n).locator(".fq-a"));

/* Podstrona /faq/ — rejestr żyje w rootcie .fqf (FaqFull.astro). */
const pItem = (page: Page, n: number) =>
  page.locator(`.fqf .fq-item:nth-child(${n})`);
const pButton = (page: Page, n: number) => pItem(page, n).locator(".fq-q");

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

/* ═══ Podstrona /faq/ — pełny rejestr (FaqFull.astro) ═══ */

test.describe("podstrona /faq/: akordeon z niezależnymi toggle'ami", () => {
  test("kilka pytań otwartych naraz; zamknięcie nie rusza pozostałych", async ({
    page,
  }) => {
    await gotoReady(page, "/faq/");
    await pButton(page, 1).scrollIntoViewIfNeeded();
    await settle(page, 800);

    // Init akordeonu zamknął markupowe aria-expanded="true".
    await expect(pButton(page, 1)).toHaveAttribute("aria-expanded", "false");

    // Otwarcie 01 i 02 — NIEZALEŻNE (referencja: exclusive=false, długi
    // rejestr nie może szarpać scrollem przy domykaniu pytania wyżej).
    await pButton(page, 1).click();
    await settle(page, 900);
    await pButton(page, 2).click();
    await settle(page, 900);
    await expect(pButton(page, 1)).toHaveAttribute("aria-expanded", "true");
    await expect(pButton(page, 2)).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator(".fqf .fq-item.open")).toHaveCount(2);

    // Zamknięcie 01 zostawia 02 otwarte.
    await pButton(page, 1).click();
    await settle(page, 900);
    await expect(page.locator(".fqf .fq-item.open")).toHaveCount(1);
    await expect(pButton(page, 2)).toHaveAttribute("aria-expanded", "true");
  });
});

test.describe("podstrona /faq/: wyszukiwarka (100% frontend)", () => {
  const visibleItems = (page: Page) =>
    page.locator(".fqf .fq-item:not(.fq-hidden)");

  test("filtr live: fraza zawęża rejestr, licznik i podświetlenie", async ({
    page,
  }) => {
    await gotoReady(page, "/faq/");
    const input = page.locator("#fq-search-input");
    // „faktur" żyje wyłącznie w pozycji 27 — zostaje jedna. (UWAGA: fraza
    // testowa musi być unikalna PO normalizacji diakrytyków — np. „rodo"
    // łapie też „środowisk" → „srodowisk" z odpowiedzi 13.)
    await input.fill("faktur");
    await expect(visibleItems(page)).toHaveCount(1);
    await expect(page.locator(".fqf mark.fq-hl").first()).toHaveText("faktur");
    const count = page.locator("#fq-search-count");
    await expect(count).toHaveClass(/is-filtered/);
    await expect(count).toHaveText(new RegExp(`1 .*${faqItems.length}`));
  });

  test("diakrytyki: zapytanie ASCII trafia w polskie znaki (moge → mogę)", async ({
    page,
  }) => {
    await gotoReady(page, "/faq/");
    await page.locator("#fq-search-input").fill("moge");
    // Pytanie 29 („Czy mogę zlecić…") widoczne, podświetlenie ZACHOWUJE
    // diakrytyki (norm() jest 1:1 znak-w-znak).
    const q29 = page.locator(".fqf .fq-item", {
      hasText: faqItems[28].q.pl,
    });
    await expect(q29).toBeVisible();
    await expect(q29.locator("mark.fq-hl").first()).toHaveText("mogę");
  });

  test("brak wyników: komunikat z frazą, endline schowany; × przywraca całość", async ({
    page,
  }) => {
    await gotoReady(page, "/faq/");
    const input = page.locator("#fq-search-input");
    await input.fill("xxyyzz");
    await expect(visibleItems(page)).toHaveCount(0);
    const noRes = page.locator("#fq-noresults");
    await expect(noRes).toBeVisible();
    await expect(noRes).toContainText("xxyyzz");
    await expect(page.locator("#fq-endline")).toBeHidden();

    // Czyszczenie przyciskiem × przywraca pełny rejestr i licznik bazowy.
    await page.locator(".fq-clear").click();
    await expect(visibleItems(page)).toHaveCount(faqItems.length);
    await expect(noRes).toBeHidden();
    await expect(page.locator("#fq-search-count")).not.toHaveClass(
      /is-filtered/,
    );
    // Fokus wraca do inputu (dalsze pisanie bez klikania).
    await expect(input).toBeFocused();
  });

  test("Esc czyści zapytanie", async ({ page }) => {
    await gotoReady(page, "/faq/");
    const input = page.locator("#fq-search-input");
    await input.fill("faktur");
    await expect(visibleItems(page)).toHaveCount(1);
    await input.press("Escape");
    await expect(input).toHaveValue("");
    await expect(visibleItems(page)).toHaveCount(faqItems.length);
  });
});

test.describe("podstrona /faq/: fallback bez JS", () => {
  test.use({ javaScriptEnabled: false });

  test("pełna treść 30 pytań rozwinięta statycznie; wyszukiwarka nieaktywna", async ({
    page,
  }) => {
    await page.goto("/faq/", { waitUntil: "networkidle" });
    await expect(page.locator(".fqf .fq-item")).toHaveCount(faqItems.length);
    // Markup startuje z aria-expanded="true" = stan bez JS.
    await expect(page.locator(".fqf .fq-q").first()).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    // Odpowiedzi widoczne bez żadnej interakcji (CSS nie chowa niczego).
    for (const n of [1, faqItems.length]) {
      expect(await boxHeight(pItem(page, n).locator(".fq-a"))).toBeGreaterThan(
        0,
      );
    }
    // Wyszukiwarka: progresywne wzbogacanie — bez JS wpisanie frazy nic
    // nie filtruje (cała treść zostaje w HTML dla SEO).
    await page.locator("#fq-search-input").fill("xxyyzz");
    await expect(page.locator(".fqf .fq-item:not(.fq-hidden)")).toHaveCount(
      faqItems.length,
    );
    await expect(page.locator(".fq-clear")).toBeHidden();
  });
});

/* Świadomy, PUNKTOWY wyjątek od zakazu emulacji reduced-motion — ten sam
   kontrakt co describe teasera wyżej: akordeon i WYSZUKIWARKA na podstronie
   muszą działać także przy reduce (moduły interakcji ładowane poza bramką
   motion). */
test.describe("podstrona /faq/: reduce — akordeon i wyszukiwarka bez animacji", () => {
  test.use({ contextOptions: { reducedMotion: "reduce" } });

  test("toggle natychmiastowy (niezależny) + filtr działa", async ({
    page,
  }) => {
    await page.goto("/faq/", { waitUntil: "networkidle" });
    // Init akordeonu zadziałał także przy reduce (zamknął odpowiedzi)…
    await expect(pButton(page, 1)).toHaveAttribute("aria-expanded", "false");
    expect(await boxHeight(pItem(page, 1).locator(".fq-a"))).toBe(0);
    // …a wejścia nie chowają treści (stany startowe bramkuje media query).
    await expect(page.locator(".fqf .fq-head h1")).toBeVisible();

    // Przełączenie bez tweenów — stan siada od razu; toggle niezależne.
    await pButton(page, 1).click();
    await pButton(page, 2).click();
    await settle(page, 100);
    await expect(page.locator(".fqf .fq-item.open")).toHaveCount(2);
    expect(await boxHeight(pItem(page, 1).locator(".fq-a"))).toBeGreaterThan(0);

    // Wyszukiwarka działa przy reduce (bez GSAP w bundle'u).
    await page.locator("#fq-search-input").fill("faktur");
    await expect(page.locator(".fqf .fq-item:not(.fq-hidden)")).toHaveCount(1);
  });
});
