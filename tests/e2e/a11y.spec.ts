// Dostępność: skan axe-core na / i /en/. Poziom bramkujący: zero naruszeń
// critical/serious; pełny raport (wszystkie poziomy) ląduje w artefaktach
// testu — ratchet jak w LHCI. Skan na jednym profilu desktop i jednym mobile
// (układy się różnią); pozostałe projekty nie wnoszą nowych informacji.
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { gotoReady } from "../helpers/scroll";

const A11Y_PROJECTS = ["chromium-1920", "chromium-pixel-5"];

// RATCHET — Test bramkuje wyłącznie NOWE naruszenia; usunięcie wpisu stąd
// wolno tylko po realnej poprawie kontrastu (wtedy ratchet się zacieśnia).
//
// 2026-07-13: token --faint podniesiony 0.34→0.5 (2.69:1 → ~4.8:1), więc cały
// drobny druk (metki/kickery/liczniki, w tym dawne .work__eyebrow/.rz-card__year)
// spełnia AA — te wpisy USUNIĘTE (ratchet zacieśniony).
//
// Pozostają .of-w / .acc: słowa akapitów intro Oferty w stanie startowym
// animacji „czytania scrollem” (opacity 0.14, akcent .acc 0.24). Efekt istnieje
// TYLKO przy prefers-reduced-motion: no-preference (reduce/no-JS = pełny
// kontrast od razu), a czytnik ekranu ma pełny tekst zawsze; słowa rozjaśniają
// się do --ink/--accent przy scrollu. Podniesienie krycia do AA (~0.49)
// zabiłoby efekt → świadomy wyjątek. (.acc występuje tylko w tym intro.)
//
// 2026-10-24 (A1, P8): kolor nie jest problemem — axe zgłasza WYŁĄCZNIE stan
// startowy (słowo 0.14 → #222221, akcent 0.24 → #3d1611; 1.31:1 na czerni),
// przy takim kryciu żaden kolor nie da 4.5:1. Stan końcowy spełnia AA na
// najjaśniejszym pikselu ambientu (kontrast): akcent 4.60:1 (WebKit 1920) –
// 5.07:1 (Chromium 390), --ink ≥ 12.5:1 — osobny token akcentu niepotrzebny.
// Decyzja Mateusza: wyjątek zostaje, wpisy NIE do usunięcia bez zmiany efektu.
const KNOWN_VIOLATIONS: Record<string, RegExp[]> = {
  "color-contrast": [/\.of-w/, /\.acc\b/],
};

function isKnown(ruleId: string, target: string): boolean {
  return (KNOWN_VIOLATIONS[ruleId] ?? []).some((re) => re.test(target));
}

for (const path of [
  "/",
  "/en/",
  "/realizacje/",
  "/en/projects/",
  "/dla-kogo/",
  "/en/who-its-for/",
  "/oferta/",
  "/en/services/",
  "/proces-wspolpracy/",
  "/en/process/",
  "/pakiety/",
  "/en/packages/",
  "/o-mnie/",
  "/en/about/",
  "/kontakt/",
  "/en/contact/",
  "/faq/",
  "/en/faq/",
  // strona 404 (jeden plik dist/404.html; język po ścieżce — oba warianty)
  "/nie-ma-takiej-strony/",
  "/en/no-such-page/",
]) {
  test(`axe: brak naruszeń critical/serious na ${path}`, async ({
    page,
  }, testInfo) => {
    test.skip(
      !A11Y_PROJECTS.includes(testInfo.project.name),
      "skan a11y tylko na chromium-1920 i chromium-pixel-5",
    );
    await gotoReady(page, path);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();

    await testInfo.attach(`axe-report${path.replaceAll("/", "-")}.json`, {
      body: JSON.stringify(results.violations, null, 2),
      contentType: "application/json",
    });

    const gating = results.violations
      .filter((v) => ["critical", "serious"].includes(v.impact ?? ""))
      .map((v) => ({
        id: v.id,
        impact: v.impact,
        help: v.help,
        // Ratchet: węzły z allowlisty odpadają; nowe węzły bramkują.
        nodes: v.nodes
          .map((n) => n.target.join(" "))
          .filter((target) => !isKnown(v.id, target)),
      }))
      .filter((v) => v.nodes.length > 0);
    expect(gating).toEqual([]);
  });
}
