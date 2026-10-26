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
      // Baseline 2026-10-24 po F1 (workflow lhci-measure.yml, run
      // 40124168778, mediany z 5 przebiegów na main cc3a05a; gorszy z dwóch
      // URL-i — tym razem /): perf 0.92 (oba), LCP 1877 ms (/), TBT 0 ms,
      // CLS 0.0000, script 88 KB, total 1716 KB, fonty 7 × 107 275 B (/).
      // Poprzedni baseline (L1, run 40079996952, main fe4914f, przed F1):
      // perf 0.91 (/en/), LCP 1910 ms (/en/), fonty 7 × 153 419 B.
      aggregationMethod: "median-run",
      assertions: {
        // perf = mediana 0.92 (oba URL-e, run 40124168778) − 0.05 = 0.87,
        // w dół do wielokrotności 0.05 → 0.85 — bez zmiany po F1 (wcześniej
        // z mediany 0.91 /en/; decyzja Mateusza 2026-10-23, reguła jak
        // w lighthouserc.cjs).
        "categories:performance": ["error", { minScore: 0.85 }],
        // LCP = max(1877 × 1,15 = 2159; 1877 + 1300 = 3177) = 3177
        // (run 40124168778 po F1, ratchet 2026-10-26; gorszy URL /;
        // poprzednio 3210 z mediany 1910 /en/, run 40079996952). Próg
        // sprzed L1 (2000) miał nad medianą tylko 90 ms zapasu — ta sama
        // pułapka „próg na medianie" co LCP mobile.
        "largest-contentful-paint": ["error", { maxNumericValue: 3177 }],
        // TBT = max(0 × 2; 0 + 300) = 300 (L1, run 40079996952, mediana
        // 0 ms — w 40124168778 też 0). Granice Google to 200/600 — 300 leży
        // między nimi; snap
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
        // size zacieśniony 2026-10-24 po F1 (polskie subsety latin-ext,
        // PR #59): run lhci-measure.yml 40124168778 na main cc3a05a —
        // 7 × 107 275 B na /, deterministycznie 5/5 (było 153 419 B, próg
        // 168 800); próg = mediana + 10% w górę do setki.
        "resource-summary:font:count": ["error", { maxNumericValue: 7 }],
        "resource-summary:font:size": ["error", { maxNumericValue: 118100 }],
      },
    },
    upload: { target: "temporary-public-storage" },
  },
};
