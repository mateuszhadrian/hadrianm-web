// Schemat wpisu Realizacji — CZYSTY Zod, bez importów z "astro:content",
// żeby dało się go używać poza pipeline'em Astro (kontrakt CMS w testach
// jednostkowych: tests/unit/cms-contract.test.ts). Konsumowany przez
// src/content.config.ts (walidacja w buildzie) — jedno źródło prawdy.
//
// Zmiana schematu = zmiana w TRZECH miejscach naraz (reguła cms-realizacje):
// ten plik, public/admin/config.yml, src/components/sections/work/*.
import { z } from "zod";

// „Pole tłumaczone": jedno pole, dwie wersje językowe — jak dotąd w work-data.ts.
const localized = z.object({ pl: z.string(), en: z.string() });
const localizedList = z.object({
  pl: z.array(z.string()),
  en: z.array(z.string()),
});
// Tagi: strona pokazuje maks. 3 — walidacja pilnuje tego już przy zapisie,
// żeby edytor w CMS nie wpisał 5 tagów i nie dziwił się, że widać tylko 3.
const localizedTags = z.object({
  pl: z.array(z.string()).max(3),
  en: z.array(z.string()).max(3),
});

export const realizacjaSchema = z.object({
  slug: z.string(), // np. "aura" — używane w URL/anchorach
  order: z.number().default(0), // kolejność na liście (mniejsze = wyżej)
  name: z.string(), // np. "Aura Aesthetics"
  year: z.string(), // np. "2025"
  category: localized,
  blurb: localized,
  tags: localizedTags,
  intro: localized,
  screens: z
    .array(
      z.object({
        key: z.string(), // "home" | "gallery" | "order" (dowolne)
        label: localized,
        desktop: z.string(), // ścieżka/URL zrzutu desktop
        mobile: z.string(), // ścieżka/URL zrzutu mobile
      }),
    )
    .min(1),
  results: z.array(z.object({ metric: localized, label: localized })),
  quote: localized,
  author: z.string(),
  role: localized,
  scope: localizedList,
  liveUrl: z.string().optional(),
});
