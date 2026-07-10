// Lighthouse CI — profil DESKTOP (preset lighthouse:desktop).
// Reszta zasad jak w lighthouserc.cjs (tam pełny opis ratchetu).
module.exports = {
  ci: {
    collect: {
      staticDistDir: "./dist",
      url: ["/", "/en/"],
      numberOfRuns: 3,
      settings: { preset: "desktop" },
    },
    assert: {
      // Baseline CI 2026-07-07 (run 28884218254, mediany z 5 przebiegów;
      // gorszy z dwóch URL-i): perf 0.93, LCP 1733 ms, TBT 0 ms,
      // CLS 0.0098, script 68 KB, total 1716 KB, fonty 7.
      // Ratchet po etapie 7 (run 28894534750): CLS 0.0007 → zacieśniony.
      aggregationMethod: "median-run",
      assertions: {
        "categories:performance": ["error", { minScore: 0.88 }],
        "largest-contentful-paint": ["error", { maxNumericValue: 2000 }],
        // Baseline 0 ms — podłoga 100 ms zamiast ×1,15 (szum runnera).
        "total-blocking-time": ["error", { maxNumericValue: 100 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.005 }],
        // Re-baseline 2026-07-10 po sekcji Oferta — ten sam bundle co
        // mobile (szczegóły w lighthouserc.cjs): 78 875 × 1,1 ≈ 86 800.
        "resource-summary:script:size": ["error", { maxNumericValue: 86800 }],
        "resource-summary:total:size": [
          "error",
          { maxNumericValue: 1935000 }, // 1716 KB × 1,1
        ],
        // Desktop ładuje fonty drewelomet (LaptopSite) — baseline to 7,
        // nie 6 jak w pierwotnym szkicu analizy (stan = wzorzec).
        "resource-summary:font:count": ["warn", { maxNumericValue: 7 }],
      },
    },
    upload: { target: "temporary-public-storage" },
  },
};
