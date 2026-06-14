// Słownik tłumaczeń — JEDYNE miejsce, w którym dopisujesz teksty.
// Każdy klucz ma wariant dla każdego języka. Dodajesz nowy tekst tu,
// a w komponencie odwołujesz się przez t("klucz").

export const languages = {
  pl: "Polski",
  en: "English",
} as const;

// Język domyślny = trasa "/" (bez prefiksu). Zgodny z astro.config (defaultLocale).
export const defaultLang = "pl";

export const ui = {
  pl: {
    "meta.title": "hadrianm — demo GSAP",
    "demo.intro": "Start ↓",
    "demo.box": "hadrianm",
    "demo.outro": "Koniec 🎉",
  },
  en: {
    "meta.title": "hadrianm — GSAP demo",
    "demo.intro": "Start ↓",
    "demo.box": "hadrianm",
    "demo.outro": "Finish 🎉",
  },
} as const;
