import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { realizacjaSchema } from "./content.schema";

// Testy wizualne porównują zrzuty z baseline'ami, a treść realizacji pisze
// panel (Sveltia) — każdy wpis dodany/usunięty/przestawiony w panelu
// rozjeżdżałby zrzuty siatki, kafli i nakładek, blokując wszystkie PR-y.
// Dlatego `pnpm build:visual` przestawia kolekcję na zamrożony zestaw
// tests/fixtures/realizacje (strażnik: assertVisualFixture w tests/helpers).
// Testy e2e (funkcjonalne) NIE używają tej ścieżki — czytają treść
// produkcyjną dynamicznie i są na jej zmiany odporne.
const REALIZACJE_DIR = process.env.REALIZACJE_DIR ?? "./src/content/realizacje";

const realizacje = defineCollection({
  // Każda realizacja = jeden plik JSON w katalogu wyżej.
  // Schemat: src/content.schema.ts (czysty Zod — współdzielony z testami).
  loader: glob({ pattern: "**/*.json", base: REALIZACJE_DIR }),
  schema: realizacjaSchema,
});

export const collections = { realizacje };
