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
      numberOfRuns: 5, // mediana z 5 (L1) — tłumi loterię maszyn lepiej niż 3
    },
    assert: {
      // Baseline 2026-10-24 (L1; workflow lhci-measure.yml, run 40079996952,
      // mediany z 5 przebiegów na main fe4914f — pierwszy pomiar po P5
      // (treść #work) i P6; gorszy z dwóch URL-i): perf 0.89 (/),
      // LCP 3551 ms (/), TBT 9 ms, CLS 0.0000, script 88 KB,
      // total 1868 KB, fonty 4 × 103 268 B (/).
      // Historia poprzednich baseline'ów (2026-07): git blame + §III.5
      // analizy testów. Formuły progów: §6 L1 analizy ewolucji.
      aggregationMethod: "median-run",
      assertions: {
        // perf = mediana 0.89 − 0.05, w dół do wielokrotności 0.05 → 0.80
        // (decyzja Mateusza 2026-10-23: stały 0.9 leżał NA medianie —
        // 2× czerwony na d0ce27f przy bajtach co do bajta identycznych).
        // Strażnik zgrubny; realny ratchet to budżety bajtów niżej.
        "categories:performance": ["error", { minScore: 0.8 }],
        // LCP = max(3551 × 1,15 = 4084; 3551 + 1300 = 4851) = 4851
        // (run 40079996952, 2026-10-24). Poprzedni próg 3565 (mediana
        // 2026-07-09 × 1,15) miał zapas MNIEJSZY niż dryf floty (~13%)
        // i leżał na medianie dzisiejszych runnerów.
        "largest-contentful-paint": ["error", { maxNumericValue: 4851 }],
        // TBT: mediana 9 ms (run 40079996952) — podłoga 150 ms bez zmian,
        // pojedyncze ms to czysty szum; realną regresję JS złapie
        // script:size.
        "total-blocking-time": ["error", { maxNumericValue: 150 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.005 }],
        // Re-baseline 2026-07-10 po sekcji Oferta (PR #16, run 29109723817):
        // services-scroll + config + handler kotwic podniosły script do
        // 78 875 B (oba URL-e identycznie) → próg 78 875 × 1,1 ≈ 86 800.
        // Re-baseline 2026-07-14 po komponencie Toast (reużywalny system
        // powiadomień; ~1,1 KB gzip doliczane przy starcie, montowany globalnie
        // w BaseLayout): zmierzone 86 941 B (run 29331137496) → próg
        // 86 941 × 1,1 ≈ 95 700. Rozmiar bundle'a jest deterministyczny (nie
        // dryf runnera). Mediana 2026-10-24: 90 065 B — w budżecie, próg
        // bez zmian. Po optymalizacji zacieśnić do nowego baseline'u.
        "resource-summary:script:size": ["error", { maxNumericValue: 95700 }],
        "resource-summary:total:size": [
          "error",
          { maxNumericValue: 2030000 }, // 1801 KB × 1,1; mediana 2026-10-24: 1868 KB — w budżecie
        ],
        // Fonty (L1, run 40079996952): count warn → error (mediana 4,
        // próg 5 bez zmian). size zacieśniony 2026-10-24 po F1 (polskie
        // subsety latin-ext, PR #59): run lhci-measure.yml 40124168778 na
        // main cc3a05a — 4 × 67 998 B na /, deterministycznie 5/5 (było
        // 103 268 B, próg 113 600); próg = mediana + 10% w górę do setki.
        "resource-summary:font:count": ["error", { maxNumericValue: 5 }],
        "resource-summary:font:size": ["error", { maxNumericValue: 74800 }],
      },
    },
    upload: { target: "temporary-public-storage" },
  },
};
