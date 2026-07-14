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
      // Ratchet po etapie 7 (run 28894534750): perf 0.95/0.97,
      // CLS 0.0007 (preload fontu) → zacieśnione minScore i CLS.
      // Re-baseline LCP 2026-07-09: dryf runnerów GitHuba (~+13%) — TEN SAM
      // SHA maina zmierzył 2745 ms o 14:01 i 3111 ms o 16:56 (re-run joba,
      // run 29023439109); kod bez zmian, czysty dryf infry. Mediana pomiarów
      // z 2026-07-09 (3017/3100/3101/3111) = 3100 → próg 3100 × 1,15 ≈ 3565.
      aggregationMethod: "median-run",
      assertions: {
        "categories:performance": ["error", { minScore: 0.9 }],
        "largest-contentful-paint": ["error", { maxNumericValue: 3565 }],
        // TBT ×1,15 dałoby 29 ms — próg-podłoga 150 ms, bo pojedyncze ms
        // to czysty szum runnera; realna regresja JS i tak go przebije.
        "total-blocking-time": ["error", { maxNumericValue: 150 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.005 }],
        // Re-baseline 2026-07-10 po sekcji Oferta (PR #16, run 29109723817):
        // services-scroll + config + handler kotwic podniosły script do
        // 78 875 B (oba URL-e identycznie) → próg 78 875 × 1,1 ≈ 86 800.
        // Re-baseline 2026-07-14 po komponencie Toast (reużywalny system
        // powiadomień; ~1,1 KB gzip doliczane przy starcie, montowany globalnie
        // w BaseLayout): zmierzone 86 941 B (run 29331137496) → próg
        // 86 941 × 1,1 ≈ 95 700. Rozmiar bundle'a jest deterministyczny (nie
        // dryf runnera). Po optymalizacji zacieśnić do nowego baseline'u.
        "resource-summary:script:size": ["error", { maxNumericValue: 95700 }],
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
