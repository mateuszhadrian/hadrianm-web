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
      // TODO(etap 5): wartości wstawiane po pomiarze bazowym w CI.
      aggregationMethod: "median-run",
      assertions: {
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.02 }],
        "resource-summary:font:count": ["warn", { maxNumericValue: 6 }],
      },
    },
    upload: { target: "temporary-public-storage" },
  },
};
