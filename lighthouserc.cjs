// Lighthouse CI — profil MOBILE (domyślna emulacja LHCI: Moto G Power,
// CPU 4×, sieć 4G) = nasz proxy „słabszego Androida" (analiza §II.2).
// Profil desktop: lighthouserc.desktop.cjs.
//
// Progi = RATCHET od baseline'u zmierzonego W CI (nie lokalnie — muszą
// odpowiadać maszynie, która bramkuje): metryki czasowe ×1,15, wagi zasobów
// +10%. Procedura pomiaru i tabela baseline'ów:
// docs/testing-tools-and-environemnts-setup-analysis.md §III.5.
// Progi podnosimy wolno TYLKO świadomą decyzją Mateusza (osobny commit);
// po każdej optymalizacji zacieśniamy do nowego baseline'u.
module.exports = {
  ci: {
    collect: {
      staticDistDir: "./dist",
      url: ["/", "/en/"], // ścieżki w obrębie staticDistDir
      numberOfRuns: 3, // mediana — tłumi szum runnera
    },
    assert: {
      // Baseline CI 2026-07-07 (run 28884218254, mediany z 5 przebiegów;
      // gorszy z dwóch URL-i): perf 0.94, LCP 2573 ms, TBT 25 ms,
      // CLS 0.0173, script 68 KB, total 1801 KB, fonty 4.
      aggregationMethod: "median-run",
      assertions: {
        "categories:performance": ["error", { minScore: 0.89 }],
        "largest-contentful-paint": ["error", { maxNumericValue: 2960 }],
        // TBT ×1,15 dałoby 29 ms — próg-podłoga 150 ms, bo pojedyncze ms
        // to czysty szum runnera; realna regresja JS i tak go przebije.
        "total-blocking-time": ["error", { maxNumericValue: 150 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.02 }],
        "resource-summary:script:size": [
          "error",
          { maxNumericValue: 76800 }, // 68 KB × 1,1
        ],
        "resource-summary:total:size": [
          "error",
          { maxNumericValue: 2030000 }, // 1801 KB × 1,1
        ],
        "resource-summary:font:count": ["warn", { maxNumericValue: 5 }],
      },
    },
    upload: { target: "temporary-public-storage" },
  },
};
