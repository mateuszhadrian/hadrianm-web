// Sekcja Realizacje: kafle z Content Collections + otwieranie/zamykanie
// WorkDetail. Desktop (≥761px): galeria `.work__gallery` → Modal. Mobile
// (≤760px): karuzela `.wk-car` → BottomSheet. Strona główna pokazuje max 3.
import { expect, test, type Page } from "@playwright/test";
import {
  firstScreenVideo,
  HOME_MAX,
  realizacjeFiles,
} from "../helpers/realizacje";
import { gotoReady } from "../helpers/scroll";

// Liczymy wpisy helperem (katalog może nie istnieć — pusta kolekcja to stan
// dopuszczalny: strona buduje się bez wpisów; sygnał o braku treści daje
// kontrakt CMS w tests/unit, nie te testy).
const ENTRY_COUNT = realizacjeFiles().length;

// Strona główna kapuje listę do 3 (pełna lista: /realizacje/, work-index.spec.ts).
const HOME_COUNT = Math.min(HOME_MAX, ENTRY_COUNT);

test.skip(
  ENTRY_COUNT === 0,
  "brak wpisów realizacji w panelu — nie ma czego klikać",
);

/** Dociera do kafla i uspokaja scroll (guard „strona w ruchu" blokuje otwarcie
 *  nakładki przez ~110 ms po scrollu). Selektor zależny od layoutu. */
async function revealFirstCard(page: Page, selector: string) {
  const card = page.locator(selector).first();
  await card.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  return card;
}

test("galeria desktopowa pokazuje max 3 realizacje", async ({ page }) => {
  await gotoReady(page);
  await expect(page.locator(".work__gallery [data-work-slug]")).toHaveCount(
    HOME_COUNT,
  );
});

test.describe("desktop: Modal", () => {
  test.skip(({ isMobile }) => !!isMobile, "modal tylko na desktop");

  test("klik w kafel otwiera modal z treścią projektu, × i Escape zamykają", async ({
    page,
  }) => {
    await gotoReady(page);
    const card = await revealFirstCard(page, ".work__gallery [data-work-slug]");
    const name = await card.getAttribute("data-work-name");
    const modal = page.locator("#work-modal");

    await card.click();
    await expect(modal).toBeVisible();
    await expect(modal).toHaveClass(/is-open/);
    await expect(modal.locator(".wdx__title")).toHaveText(name ?? "");

    await modal.locator("[data-overlay-close]").click();
    await expect(modal).toBeHidden();
    // Host czyszczony po zamknięciu (zwalnia obrazy/DOM).
    await expect(modal.locator(".wdx")).toHaveCount(0);

    await card.click();
    await expect(modal).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(modal).toBeHidden();
  });
});

test.describe("mobile: BottomSheet (karuzela)", () => {
  test.skip(({ isMobile }) => !isMobile, "sheet tylko na mobile");

  test("tap w kartę karuzeli otwiera sheet; zamykanie przyciskiem", async ({
    page,
  }) => {
    await gotoReady(page);
    const card = await revealFirstCard(page, ".wk-car [data-work-slug]");
    const sheet = page.locator("#work-sheet");

    await card.click();
    await expect(sheet).toBeVisible();
    await expect(sheet).toHaveClass(/is-open/);
    await expect(sheet.locator(".wdx__title")).toHaveText(
      (await card.getAttribute("data-work-name")) ?? "",
    );

    await sheet.locator("[data-overlay-close]").click();
    await expect(sheet).toBeHidden();
    await expect(sheet.locator(".wdx")).toHaveCount(0);
  });
});

// ── Pętla wideo pierwszego ekranu (plan: docs/analiza-realizacje-wideo.md, D10) ──
// Warunkowo na treści: gdy pierwszy wpis nie ma `screens[0].video`, nakładka
// nie może zawierać <video> (kod „ślepy"); gdy ma — wideo dostaje src po
// otwarciu i gra (asercje odtwarzania tylko chromium: WebKit w emulacji
// odrzuca play() nawet dla muted — D10), a zamknięcie zwalnia src.
const FIRST_VIDEO = firstScreenVideo();

test.describe("wideo ekranów w nakładce", () => {
  async function openFirst(page: Page, isMobile: boolean) {
    await gotoReady(page);
    const selector = isMobile
      ? ".wk-car [data-work-slug]"
      : ".work__gallery [data-work-slug]";
    const card = await revealFirstCard(page, selector);
    await card.click();
    const overlay = page.locator(isMobile ? "#work-sheet" : "#work-modal");
    await expect(overlay).toHaveClass(/is-open/);
    return overlay;
  }

  test("bez wpisu z wideo nakładka nie ma <video>", async ({
    page,
    isMobile,
  }) => {
    test.skip(!!FIRST_VIDEO, "pierwszy wpis MA wideo — testuje to test niżej");
    const overlay = await openFirst(page, !!isMobile);
    await expect(overlay.locator("video")).toHaveCount(0);
    // Poster/zdjęcie ekranu jest zawsze w DOM (semantyczny obraz z alt).
    await expect(overlay.locator(".wd__img").first()).toBeAttached();
  });

  test("pierwszy ekran: wideo dostaje src po otwarciu i gra; zamknięcie zwalnia", async ({
    page,
    isMobile,
    browserName,
  }, testInfo) => {
    test.skip(!FIRST_VIDEO, "brak wpisu z wideo — nic do odtworzenia");
    const overlay = await openFirst(page, !!isMobile);
    const videos = overlay.locator("video.wd__video");
    await expect(videos).toHaveCount(2); // laptop + telefon
    const read = () =>
      videos.evaluateAll((els) =>
        (els as HTMLVideoElement[]).map((v) => ({
          src: v.getAttribute("src") ?? "",
          paused: v.paused,
          t: v.currentTime,
          autoplayAttr: v.hasAttribute("autoplay"),
          muted: v.muted,
          hidden: v.getAttribute("aria-hidden"),
        })),
      );
    const first = await read();
    expect(first.map((v) => v.src)).toEqual([
      FIRST_VIDEO!.desktop,
      FIRST_VIDEO!.mobile,
    ]);
    for (const v of first) {
      expect(v.autoplayAttr, "bez atrybutu autoplay (bramka reduce w JS)").toBe(
        false,
      );
      expect(v.muted).toBe(true);
      expect(v.hidden, "dekoracyjne: aria-hidden").toBe("true");
    }
    if (
      browserName === "chromium" &&
      !testInfo.project.name.includes("firefox")
    ) {
      await expect
        .poll(async () => (await read()).every((v) => !v.paused), {
          message: "oba wideo grają",
        })
        .toBe(true);
      const before = await read();
      await page.waitForTimeout(600);
      const after = await read();
      after.forEach((v, i) =>
        expect(v.t, `wideo #${i}: currentTime rośnie`).toBeGreaterThan(
          before[i].t,
        ),
      );
    }
    await overlay.locator("[data-overlay-close]").click();
    await expect(overlay).toBeHidden();
    await expect(overlay.locator("video")).toHaveCount(0);
  });

  // Punktowy, ŚWIADOMY wyjątek od zakazu emulacji reduce (jak FAQ/contact):
  // sprawdza bramkę D6 — przy reduce <video> nie dostaje src.
  test.describe("prefers-reduced-motion: reduce", () => {
    test.use({ contextOptions: { reducedMotion: "reduce" } });
    test("wideo nie jest ładowane — zostaje zdjęcie", async ({
      page,
      isMobile,
    }) => {
      test.skip(!FIRST_VIDEO, "brak wpisu z wideo");
      const overlay = await openFirst(page, !!isMobile);
      const srcs = await overlay
        .locator("video.wd__video")
        .evaluateAll((els) => els.map((v) => v.getAttribute("src")));
      expect(srcs.every((s) => s === null)).toBe(true);
      await expect(overlay.locator(".wd__img").first()).toBeAttached();
    });
  });
});
