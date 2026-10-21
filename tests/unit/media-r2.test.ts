// Dostępność mediów R2: HEAD do każdego URL-a media.hadrianm.pl z JSON-ów
// realizacji. Zewnętrzna sieć = flaky ⇒ test NIE biega na PR-ach; odpala się
// wyłącznie z CHECK_REMOTE_MEDIA=1 (CI na main, /release-check).
import { describe, expect, it } from "vitest";
import { readRealizacjaRaw, realizacjeFiles } from "../helpers/realizacje";

// realizacjeFiles(): pusta tablica, gdy katalogu nie ma — bez wywrotki
// modułu na ENOENT (sygnał o braku treści daje cms-contract.test.ts).
function collectMediaUrls(): string[] {
  const urls = new Set<string>();
  for (const name of realizacjeFiles()) {
    const raw = readRealizacjaRaw(name);
    for (const match of raw.matchAll(
      /https:\/\/media\.hadrianm\.pl\/[^"\s]+/g,
    )) {
      urls.add(match[0]);
    }
  }
  return [...urls];
}

describe.skipIf(!process.env.CHECK_REMOTE_MEDIA)(
  "media R2: każdy URL media.hadrianm.pl odpowiada na HEAD",
  () => {
    it("wszystkie media istnieją w R2", { timeout: 60_000 }, async () => {
      const urls = collectMediaUrls();
      expect(urls.length).toBeGreaterThan(0);

      const results = await Promise.all(
        urls.map(async (url) => {
          try {
            const res = await fetch(url, { method: "HEAD" });
            return { url, ok: res.ok, status: res.status };
          } catch (error) {
            return { url, ok: false, status: String(error) };
          }
        }),
      );

      const broken = results.filter((r) => !r.ok);
      expect(
        broken,
        `Niedostępne media:\n${broken.map((b) => `${b.status} ${b.url}`).join("\n")}`,
      ).toEqual([]);
    });
  },
);
