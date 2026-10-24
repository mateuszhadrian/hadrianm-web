// Kontrakt progów breakpointów (T4): po jednym strażniku na próg — 861
// (about, audience, services, faq, contact; stałe *_DESKTOP_MIN_PX), 761
// (work: galeria+Modal ↔ karuzela+BottomSheet, `sheetMQ` 760 px) i 769
// (ambient: statyczna tekstura mobile przy max-width 768 px). Pomiar przy
// minPx-1 i minPx (tests/helpers/breakpoint.ts). Ujednolicenia progów NIE
// robimy (ruszyłoby baseline'y wszystkich sekcji) — tylko strażnik.
// Szerokość ustawia test, więc wystarczy jeden profil desktop.
import { expect, test } from "@playwright/test";
import { ABOUT_DESKTOP_MIN_PX } from "../../src/components/sections/about/about-config";
import { AUDIENCE_DESKTOP_MIN_PX } from "../../src/components/sections/audience/audience-config";
import { CONTACT_DESKTOP_MIN_PX } from "../../src/components/sections/contact/contact-config";
import { FAQ_DESKTOP_MIN_PX } from "../../src/components/sections/faq/faq-config";
import { SERVICES_DESKTOP_MIN_PX } from "../../src/components/sections/services/services-config";
import { expectBreakpointFlip } from "../helpers/breakpoint";
import { realizacjeFiles } from "../helpers/realizacje";
import { gotoReady } from "../helpers/scroll";

// Próg sheetMQ (open-detail.ts) i layoutu Work: max-width 760 → desktop od 761.
const WORK_DESKTOP_MIN_PX = 761;
// AmbientBackground.astro: @media (max-width: 768px) → desktop od 769.
const AMBIENT_DESKTOP_MIN_PX = 769;

test.beforeEach(({ browserName }, testInfo) => {
  test.skip(
    browserName !== "chromium" || testInfo.project.name !== "chromium-1920",
    "szerokość ustawia test — jeden przebieg na chromium-1920",
  );
});

const SECTIONS_861 = [
  // About: scena przypięta (sticky) tylko na desktopie
  {
    name: "about",
    url: "/o-mnie/",
    selector: ".om-stage",
    min: ABOUT_DESKTOP_MIN_PX,
    prop: "position",
  },
  {
    name: "audience",
    url: "/dla-kogo/",
    selector: ".dk-meta",
    min: AUDIENCE_DESKTOP_MIN_PX,
  },
  {
    name: "services",
    url: "/",
    selector: ".of-meta",
    min: SERVICES_DESKTOP_MIN_PX,
  },
  { name: "faq", url: "/faq/", selector: ".fq-meta", min: FAQ_DESKTOP_MIN_PX },
  {
    name: "contact",
    url: "/kontakt/",
    selector: ".kt-meta",
    min: CONTACT_DESKTOP_MIN_PX,
  },
];

for (const s of SECTIONS_861) {
  test(`próg ${s.name}: ${s.selector} przełącza się dokładnie przy ${s.min}px`, async ({
    page,
  }) => {
    await expectBreakpointFlip(page, s.url, s.selector, s.min, s.prop);
  });
}

test(`próg work: karuzela ↔ galeria dokładnie przy ${WORK_DESKTOP_MIN_PX}px`, async ({
  page,
}) => {
  const { below, atMin } = await expectBreakpointFlip(
    page,
    "/",
    ".wk-car",
    WORK_DESKTOP_MIN_PX,
  );
  expect(atMin).toBe("none");
  expect(below).not.toBe("none");
});

test(`próg work: BottomSheet ↔ Modal dokładnie przy ${WORK_DESKTOP_MIN_PX}px`, async ({
  page,
}) => {
  test.skip(
    realizacjeFiles().length === 0,
    "brak wpisów realizacji w panelu — nie ma czego klikać",
  );
  for (const [width, cards, overlay] of [
    [WORK_DESKTOP_MIN_PX - 1, ".wk-car [data-work-slug]", "#work-sheet"],
    [WORK_DESKTOP_MIN_PX, ".work__gallery [data-work-slug]", "#work-modal"],
  ] as const) {
    await page.setViewportSize({ width, height: 900 });
    await gotoReady(page, "/");
    const card = page.locator(cards).first();
    await card.scrollIntoViewIfNeeded();
    // guard „strona w ruchu" blokuje otwarcie nakładki ~110 ms po scrollu
    await page.waitForTimeout(300);
    await card.click();
    await expect(page.locator(overlay), `${width}px → ${overlay}`).toHaveClass(
      /is-open/,
    );
  }
});

test(`próg ambient: statyczna tekstura mobile dokładnie do ${AMBIENT_DESKTOP_MIN_PX - 1}px`, async ({
  page,
}) => {
  const { below } = await expectBreakpointFlip(
    page,
    "/",
    ".ambient-bg__clouds",
    AMBIENT_DESKTOP_MIN_PX,
  );
  expect(below).toBe("none");
});
