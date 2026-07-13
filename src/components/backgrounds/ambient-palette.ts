// JEDYNE źródło prawdy o kolorach tła ambient — wariant red i blue.
// Konsumenci: AmbientBackground.astro (zmienne CSS przez define:vars)
// oraz scripts/capture-ambient-bg.mjs (render statycznych tekstur mobile;
// Node 24 importuje ten plik natywnie — type stripping).
//
// Każdy kolor ma parę oklch/rgb: oklch renderują nowoczesne przeglądarki,
// rgb to fallback dla @supports not (color: oklch(...)). Wartości rgb są
// PRZELICZONE z oklch przez Chromium (canvas sRGB) — nie dobierane na oko;
// przy zmianie oklch przelicz rgb tą samą metodą.

export interface AmbientColor {
  oklch: string;
  rgb: string;
}

export interface AmbientVariant {
  /** Prawie-czerń winiety i tekstury kropek (mikro-odcień pod wariant). */
  ink: string;
  /** Statyczna tekstura mobile (public/) — regeneracja: capture-ambient-bg.mjs. */
  mobileImage: string;
  /** a1–a3: chmura dolna-lewa (::before), b1–b3: górna-prawa (::after),
      c1/d1: chmury-plamy cloud-c / cloud-d. */
  colors: {
    a1: AmbientColor;
    a2: AmbientColor;
    a3: AmbientColor;
    b1: AmbientColor;
    b2: AmbientColor;
    b3: AmbientColor;
    c1: AmbientColor;
    d1: AmbientColor;
  };
}

export type AmbientVariantName = "red" | "blue";

export const AMBIENT_VARIANTS: Record<AmbientVariantName, AmbientVariant> = {
  red: {
    ink: "#070506",
    mobileImage: "/ambient-bg-mobile-red.webp",
    colors: {
      a1: { oklch: "oklch(0.395 0.143 21.99)", rgb: "rgb(130, 20, 32)" },
      a2: {
        oklch: "oklch(0.3 0.07 14 / 0.5)",
        rgb: "rgba(75, 29, 35, 0.5)",
      },
      a3: {
        oklch: "oklch(0.42 0.09 18 / 0.65)",
        rgb: "rgba(118, 54, 58, 0.65)",
      },
      b1: { oklch: "oklch(0.686 0.204 29.765)", rgb: "rgb(255, 90, 71)" },
      b2: {
        oklch: "oklch(0.3 0.07 22 / 0.45)",
        rgb: "rgba(75, 29, 29, 0.45)",
      },
      b3: {
        oklch: "oklch(0.43 0.092 28 / 0.6)",
        rgb: "rgba(122, 58, 50, 0.6)",
      },
      c1: {
        oklch: "oklch(0.468 0.147 21.133 / 0.85)",
        rgb: "rgba(156, 44, 52, 0.85)",
      },
      d1: {
        oklch: "oklch(0.42 0.091 26.222 / 0.68)",
        rgb: "rgba(119, 55, 50, 0.68)",
      },
    },
  },
  blue: {
    ink: "#050607",
    mobileImage: "/ambient-bg-mobile-blue.webp",
    colors: {
      a1: { oklch: "oklch(0.62 0.204 264.82)", rgb: "rgb(71, 123, 255)" },
      a2: {
        oklch: "oklch(0.383 0.135 268.99 / 0.65)",
        rgb: "rgba(39, 58, 138, 0.65)",
      },
      a3: {
        oklch: "oklch(0.383 0.135 268.99 / 0.65)",
        rgb: "rgba(39, 58, 138, 0.65)",
      },
      b1: { oklch: "oklch(0.396 0.153 264.808)", rgb: "rgb(28, 61, 151)" },
      b2: {
        oklch: "oklch(0.307 0.099 268.468 / 0.65)",
        rgb: "rgba(27, 42, 97, 0.65)",
      },
      b3: {
        oklch: "oklch(0.383 0.135 268.99 / 0.65)",
        rgb: "rgba(39, 58, 138, 0.65)",
      },
      c1: { oklch: "oklch(0.378 0.152 264.273)", rgb: "rgb(22, 56, 145)" },
      d1: {
        oklch: "oklch(0.383 0.135 268.99 / 0.65)",
        rgb: "rgba(39, 58, 138, 0.65)",
      },
    },
  },
};
