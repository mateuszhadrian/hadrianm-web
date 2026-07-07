// Kompletność słowników i18n + zachowanie utili. Test generyczny po kluczach:
// nowy klucz dodany tylko w jednym języku = czerwony test, nie cichy fallback.
import { describe, expect, it } from "vitest";
import { defaultLang, languages, ui } from "../../src/i18n/ui";
import { getLangFromUrl, useTranslations } from "../../src/i18n/utils";
import { navItems, navLabel } from "../../src/i18n/nav";

const langs = Object.keys(ui) as (keyof typeof ui)[];

describe("i18n: słowniki ui", () => {
  it("języki słownika i przełącznika languages są spójne, defaultLang istnieje", () => {
    expect(Object.keys(languages).sort()).toEqual([...langs].sort());
    expect(langs).toContain(defaultLang);
  });

  it("każdy klucz ma wersję we WSZYSTKICH językach (te same zbiory kluczy)", () => {
    const reference = Object.keys(ui[defaultLang]).sort();
    for (const lang of langs) {
      expect(Object.keys(ui[lang]).sort(), `język: ${lang}`).toEqual(reference);
    }
  });

  it("żadne tłumaczenie nie jest pustym stringiem", () => {
    for (const lang of langs) {
      for (const [key, value] of Object.entries(ui[lang])) {
        expect(value.trim(), `${lang}:${key}`).not.toBe("");
      }
    }
  });
});

describe("i18n: useTranslations", () => {
  it("t() zwraca wartość związanego języka", () => {
    for (const lang of langs) {
      const t = useTranslations(lang);
      for (const key of Object.keys(ui[lang]) as Parameters<typeof t>[0][]) {
        expect(t(key)).toBe(ui[lang][key]);
      }
    }
  });
});

describe("i18n: getLangFromUrl", () => {
  it("rozpoznaje język z prefiksu ścieżki", () => {
    expect(getLangFromUrl(new URL("https://hadrianm.pl/"))).toBe("pl");
    expect(getLangFromUrl(new URL("https://hadrianm.pl/en/"))).toBe("en");
    expect(getLangFromUrl(new URL("https://hadrianm.pl/en"))).toBe("en");
  });

  it("nieznany prefiks spada na język domyślny (bez dopasowania po prefiksie)", () => {
    expect(getLangFromUrl(new URL("https://hadrianm.pl/kontakt"))).toBe(
      defaultLang,
    );
    // "enigma" zaczyna się od "en", ale NIE jest językiem.
    expect(getLangFromUrl(new URL("https://hadrianm.pl/enigma"))).toBe(
      defaultLang,
    );
  });
});

describe("i18n: nawigacja", () => {
  it("pozycje mają unikalne id oraz niepuste etykiety pl i en", () => {
    const ids = navItems.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const item of navItems) {
      expect(item.pl.trim(), `nav:${item.id}:pl`).not.toBe("");
      expect(item.en.trim(), `nav:${item.id}:en`).not.toBe("");
    }
  });

  it("navLabel zwraca etykietę właściwego języka", () => {
    const item = navItems[0];
    expect(navLabel(item, "pl")).toBe(item.pl);
    expect(navLabel(item, "en")).toBe(item.en);
  });
});
