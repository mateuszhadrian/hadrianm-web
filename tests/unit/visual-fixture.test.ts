// Kontrakt zamrożonego fixture'u testów wizualnych (tests/fixtures/realizacje,
// konsumowany przez `pnpm build:visual`): każdy plik przechodzi TĘ SAMĄ schemę
// Zod co treść produkcyjna (inaczej build pod zrzuty wybuchnie dopiero w CI),
// slugi są unikalne, a zestaw nie jest pusty (puste fixture = pusta siatka
// i pusta sekcja #work na zrzutach — baseline'y straciłyby sens).
// Fixture jest NIEZALEŻNY od src/content/realizacje — nie synchronizuj go
// z panelem; zmiana = świadoma zmiana układu na zrzutach + nowe baseline'y.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { realizacjaSchema } from "../../src/content.schema";

const DIR = fileURLToPath(new URL("../fixtures/realizacje", import.meta.url));
const files = readdirSync(DIR).filter((name) => name.endsWith(".json"));

describe("fixture testów wizualnych: tests/fixtures/realizacje/*.json", () => {
  it("zestaw nie jest pusty", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files)("%s: poprawny JSON zgodny ze schemą", (name) => {
    const data: unknown = JSON.parse(readFileSync(join(DIR, name), "utf8"));
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
