// Kontrakt CMS: każdy JSON zapisany przez Sveltię w src/content/realizacje/
// przechodzi schemę Zod (src/content.schema.ts — ta sama, którą waliduje
// build). Build też to łapie, ale ten test daje sygnał w 2 s i czytelny
// raport błędów zamiast wybuchu w środku `astro build`.
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { realizacjaSchema } from "../../src/content.schema";
import {
  readRealizacja,
  readRealizacjaRaw,
  realizacjeFiles,
} from "../helpers/realizacje";

// Katalog może nie istnieć (usunięcie ostatniego wpisu w panelu) — patrz
// komentarz w helperze. Zero wpisów zapala TYLKO asercję niżej; to JEDYNE
// miejsce, które ma świecić na czerwono z komunikatem dla człowieka (testy
// e2e/visual pustą listę pomijają albo stoją na zamrożonym fixture).
const files = realizacjeFiles();

describe("kontrakt CMS: src/content/realizacje/*.json", () => {
  it("katalog zawiera co najmniej jeden wpis", () => {
    expect(
      files.length,
      "Brak realizacji w src/content/realizacje. Strona zbuduje się i wdroży " +
        "bez nich, ale sekcja #work i /realizacje/ będą puste. Dodaj co " +
        "najmniej jedną realizację w panelu /admin.",
    ).toBeGreaterThan(0);
  });

  it.each(files)("%s: poprawny JSON zgodny ze schemą", (name) => {
    const data: unknown = JSON.parse(readRealizacjaRaw(name));
    const result = realizacjaSchema.safeParse(data);
    expect(
      result.success,
      result.success ? "" : `${name}:\n${z.prettifyError(result.error)}`,
    ).toBe(true);
  });

  it("slugi wpisów są unikalne", () => {
    const slugs = files.map(
      (name) => readRealizacja<{ slug: string }>(name).slug,
    );
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  // R2 backlogu ewolucji: prawdziwe realizacje nie mają jeszcze zmierzonych
  // metryk ani opinii — pola są opcjonalne, `results` domyślnie puste.
  it("wpis bez results/quote/author/role przechodzi schemę (pola opcjonalne)", () => {
    const base: Record<string, unknown> = {
      slug: "bez-wynikow",
      name: "Bez wyników",
      year: "2026",
      category: { pl: "Strona", en: "Website" },
      blurb: { pl: "Opis", en: "Blurb" },
      tags: { pl: ["a"], en: ["a"] },
      intro: { pl: "Wstęp", en: "Intro" },
      screens: [
        {
          key: "home",
          label: { pl: "Start", en: "Home" },
          desktop: "https://media.hadrianm.pl/realizacje/x-desktop.webp",
          mobile: "https://media.hadrianm.pl/realizacje/x-mobile.webp",
        },
      ],
      scope: { pl: ["Projekt"], en: ["Design"] },
    };
    const result = realizacjaSchema.safeParse(base);
    expect(
      result.success,
      result.success ? "" : z.prettifyError(result.error),
    ).toBe(true);
    if (result.success) {
      expect(result.data.results).toEqual([]);
      expect(result.data.quote).toBeUndefined();
      expect(result.data.author).toBeUndefined();
      expect(result.data.role).toBeUndefined();
    }
  });

  // R1 (plan wideo, D2): `screens[].video` opcjonalne, oba URL-e naraz.
  describe("screens[].video (pętla wideo ekranu)", () => {
    const screen = {
      key: "home",
      label: { pl: "Start", en: "Home" },
      desktop: "https://media.hadrianm.pl/realizacje/x-desktop.webp",
      mobile: "https://media.hadrianm.pl/realizacje/x-mobile.webp",
    };
    const entry = (video?: unknown) => ({
      slug: "wideo",
      name: "Wideo",
      year: "2026",
      category: { pl: "Strona", en: "Website" },
      blurb: { pl: "Opis", en: "Blurb" },
      tags: { pl: ["a"], en: ["a"] },
      intro: { pl: "Wstęp", en: "Intro" },
      screens: [video === undefined ? screen : { ...screen, video }],
      scope: { pl: ["Projekt"], en: ["Design"] },
    });

    it("ekran bez video przechodzi (pole opcjonalne)", () => {
      expect(realizacjaSchema.safeParse(entry()).success).toBe(true);
    });

    it("ekran z video {desktop, mobile} przechodzi", () => {
      const r = realizacjaSchema.safeParse(
        entry({
          desktop:
            "https://media.hadrianm.pl/realizacje/video/wideo-home-desktop.mp4",
          mobile:
            "https://media.hadrianm.pl/realizacje/video/wideo-home-mobile.mp4",
        }),
      );
      expect(r.success, r.success ? "" : z.prettifyError(r.error)).toBe(true);
    });

    it("video bez mobile NIE przechodzi (oba urządzenia albo żadne)", () => {
      expect(
        realizacjaSchema.safeParse(
          entry({
            desktop: "https://media.hadrianm.pl/realizacje/video/a.mp4",
          }),
        ).success,
      ).toBe(false);
    });

    it("video z wartością niebędącą URL-em NIE przechodzi", () => {
      expect(
        realizacjaSchema.safeParse(entry({ desktop: "a.mp4", mobile: "b.mp4" }))
          .success,
      ).toBe(false);
    });
  });
});
