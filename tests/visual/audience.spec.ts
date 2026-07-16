// Sweep wizualny sekcji „Dla kogo" — od migracji na podstronę
// (docs/analiza-podstrona-dla-kogo.md) pełna animowana sekcja żyje na
// /dla-kogo/ i tam ją sweepujemy (zajawka na stronie głównej ma
// element-screenshot w sections.spec.ts). Sekcja scrubowana jak hero/about,
// więc fotografujemy viewport w punktach osi scrolla. Desktop: DOKŁADNIE
// punkty spoczynku snapa (AUDIENCE_SNAP_POINTS) — snap do bieżącej pozycji
// jest no-opem, więc klatka nie dryfuje między przebiegami. Mobile: flow —
// punkty pokrywają rozdziały z oknami po wjeździe (once:true, x osiada na 0).
// freeze.css gasi resztki animacji CSS — determinizm klatek desktop.
// Decyzje: docs/analiza-sekcja-dla-kogo.md §IV oraz
// docs/analiza-podmiana-ekranow-lumea-dla-kogo.md (jasne ekrany LUMÉA,
// mobile: wjazd okien L/R/L zamiast crossfade blur→sharp).
import { test } from "@playwright/test";
import {
  AUDIENCE_DESKTOP_MIN_PX,
  AUDIENCE_SNAP_POINTS,
} from "../../src/components/sections/audience/audience-config";
import { AUDIENCE_PATH } from "../../src/lib/routes";
import { usePreviewGuard } from "../helpers/guards";
import { snappedSectionSweep, SWEEP_PROJECTS } from "../helpers/visual";

// Scrub (0.6 s, lerp asymptotyczny) + reveale mobile muszą zdążyć usiąść.
const SETTLE_MS = 2000;

usePreviewGuard();

test("sweep scrolla sekcji dla-kogo vs baseline", async ({
  page,
}, testInfo) => {
  test.skip(
    !SWEEP_PROJECTS.includes(testInfo.project.name),
    "sweep audience tylko na profilach hero (desktop/iPhone/Pixel)",
  );
  test.setTimeout(240_000);

  await snappedSectionSweep(page, {
    section: "audience",
    desktopMinPx: AUDIENCE_DESKTOP_MIN_PX,
    snapPoints: AUDIENCE_SNAP_POINTS,
    settleMs: SETTLE_MS,
    path: AUDIENCE_PATH.pl,
  });
});
