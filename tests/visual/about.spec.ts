// Sweep wizualny sekcji „O mnie" — od migracji na podstronę
// (docs/analiza-podstrona-o-mnie.md) pełna animowana sekcja żyje na
// /o-mnie/ i tam ją sweepujemy (zajawka na stronie głównej ma
// element-screenshot w sections.spec.ts). Sekcja scrubowana jak hero, więc
// fotografujemy viewport w punktach osi scrolla. Desktop: DOKŁADNIE punkty
// spoczynku snapa (ABOUT_SNAP_POINTS) — snap do bieżącej pozycji jest
// no-opem, więc klatka nie dryfuje między przebiegami. Mobile: flow —
// punkty pokrywają portret po wyłonieniu, rozdziały i finał. Settle
// wydłużony: scrub=1 s dogania asymptotycznie, reveale mobile mają ~1,2 s
// kaskady. Decyzje: docs/analiza-sekcja-o-mnie.md §IV.2.
import { test } from "@playwright/test";
import {
  ABOUT_DESKTOP_MIN_PX,
  ABOUT_SNAP_POINTS,
} from "../../src/components/sections/about/about-config";
import { ABOUT_PATH } from "../../src/lib/routes";
import { usePreviewGuard } from "../helpers/guards";
import { snappedSectionSweep, SWEEP_PROJECTS } from "../helpers/visual";

// Scrub (1 s, lerp asymptotyczny) + ewentualny snap muszą zdążyć usiąść.
const SETTLE_MS = 2000;

usePreviewGuard();

test("sweep scrolla sekcji o-mnie vs baseline", async ({ page }, testInfo) => {
  test.skip(
    !SWEEP_PROJECTS.includes(testInfo.project.name),
    "sweep about tylko na profilach hero (desktop/iPhone/Pixel)",
  );
  test.setTimeout(240_000);

  await snappedSectionSweep(page, {
    section: "about",
    desktopMinPx: ABOUT_DESKTOP_MIN_PX,
    snapPoints: ABOUT_SNAP_POINTS,
    settleMs: SETTLE_MS,
    path: ABOUT_PATH.pl,
  });
});
