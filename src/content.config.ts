import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
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

const realizacje = defineCollection({
  // Każda realizacja = jeden plik JSON w src/content/realizacje/
  loader: glob({ pattern: "**/*.json", base: "./src/content/realizacje" }),
  schema: z.object({
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
  }),
});

export const collections = { realizacje };
