// Lighthouse CI — profil DESKTOP (preset lighthouse:desktop).
// Reszta zasad jak w lighthouserc.cjs (tam pełny opis ratchetu).
module.exports = {
  ci: {
    collect: {
      staticDistDir: "./dist",
      url: ["/", "/en/"],
      numberOfRuns: 5, // mediana z 5 (L1) — jak w lighthouserc.cjs
      settings: { preset: "desktop" },
    },
    assert: {
      // Baseline 2026-10-24 (L1; workflow lhci-measure.yml, run 40079996952,
      // mediany z 5 przebiegów na main fe4914f; gorszy z dwóch URL-i —
      // na desktopie to /en/): perf 0.91 (/en/), LCP 1910 ms (/en/),
      // TBT 0 ms, CLS 0.0000, script 88 KB, total 1761 KB,
      // fonty 7 × 153 419 B (/).
      aggregationMethod: "median-run",
      assertions: {
        // perf = mediana gorszego URL-a 0.91 (/en/) − 0.05, w dół do
        // wielokrotności 0.05 → 0.85 (decyzja Mateusza 2026-10-23, reguła
        // jak w lighthouserc.cjs).
        "categories:performance": ["error", { minScore: 0.85 }],
        // LCP = max(1910 × 1,15 = 2197; 1910 + 1300 = 3210) = 3210
        // (run 40079996952, 2026-10-24; gorszy URL /en/). Poprzedni próg
        // 2000 miał nad dzisiejszą medianą tylko 90 ms zapasu — ta sama
        // pułapka „próg na medianie" co LCP mobile przed L1.
        "largest-contentful-paint": ["error", { maxNumericValue: 3210 }],
        // TBT = max(0 × 2; 0 + 300) = 300 (L1, run 40079996952; mediana
        // 0 ms). Granice Google to 200/600 — 300 leży między nimi; snap
        // w dół (200) łamałby regułę minimalnego zapasu, w górę (600)
        // rozbrajałby strażnika, więc zostaje wynik formuły.
        "total-blocking-time": ["error", { maxNumericValue: 300 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.005 }],
        // Re-baseline 2026-07-10 po sekcji Oferta, potem 2026-07-14 po
        // komponencie Toast — ten sam bundle co mobile (szczegóły i pomiar
        // w lighthouserc.cjs): 86 941 × 1,1 ≈ 95 700. Mediana 2026-10-24:
        // 90 065 B — w budżecie, próg bez zmian.
        "resource-summary:script:size": ["error", { maxNumericValue: 95700 }],
        "resource-summary:total:size": [
          "error",
          { maxNumericValue: 1935000 }, // 1716 KB × 1,1; mediana 2026-10-24: 1761 KB — w budżecie
        ],
        // Desktop ładuje fonty drewelomet (LaptopSite) — baseline to 7,
        // nie 6 jak w pierwotnym szkicu analizy (stan = wzorzec).
        // L1 (run 40079996952): count warn → error (próg 7 bez zmian);
        // size NOWY error = mediana 153 419 B + 10% ≈ 168 800. Po F1
        // zacieśnić do świeżego pomiaru.
        "resource-summary:font:count": ["error", { maxNumericValue: 7 }],
        "resource-summary:font:size": ["error", { maxNumericValue: 168800 }],
      },
    },
    upload: { target: "temporary-public-storage" },
  },
};
