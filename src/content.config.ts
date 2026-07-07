import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { realizacjaSchema } from "./content.schema";

const realizacje = defineCollection({
  // Każda realizacja = jeden plik JSON w src/content/realizacje/
  // Schemat: src/content.schema.ts (czysty Zod — współdzielony z testami).
  loader: glob({ pattern: "**/*.json", base: "./src/content/realizacje" }),
  schema: realizacjaSchema,
});

export const collections = { realizacje };
