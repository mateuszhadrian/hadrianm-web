// Kontrakt CMS: każdy JSON zapisany przez Sveltię w src/content/realizacje/
// przechodzi schemę Zod (src/content.schema.ts — ta sama, którą waliduje
// build). Build też to łapie, ale ten test daje sygnał w 2 s i czytelny
// raport błędów zamiast wybuchu w środku `astro build`.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { realizacjaSchema } from "../../src/content.schema";

const DIR = fileURLToPath(
  new URL("../../src/content/realizacje", import.meta.url),
);

const files = readdirSync(DIR).filter((name) => name.endsWith(".json"));

describe("kontrakt CMS: src/content/realizacje/*.json", () => {
  it("katalog zawiera co najmniej jeden wpis", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files)("%s: poprawny JSON zgodny ze schemą", (name) => {
    const raw = readFileSync(join(DIR, name), "utf8");
    const data: unknown = JSON.parse(raw);
    const result = realizacjaSchema.safeParse(data);
    expect(
      result.success,
      result.success ? "" : `${name}:\n${z.prettifyError(result.error)}`,
    ).toBe(true);
  });

  it("slugi wpisów są unikalne", () => {
    const slugs = files.map(
      (name) =>
        (JSON.parse(readFileSync(join(DIR, name), "utf8")) as { slug: string })
          .slug,
    );
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
