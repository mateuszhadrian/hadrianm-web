// Kontrakt og:image (backlog ewolucji S2): plik public/og-image.png ma
// DOKŁADNIE wymiary zadeklarowane w <meta property="og:image:width/height">
// w BaseLayout (1200×630, proporcja 1.91:1 — FB/X/LinkedIn/iMessage
// pokazują taki kadr w całości) i rozsądną wagę (lekcja delung: 649 → 98 KB;
// podgląd linku pobiera plik przy każdym udostępnieniu). Wymiary czytamy
// z nagłówka IHDR PNG (bajty 16–23) — bez zależności od sharp w testach.
import { readFileSync, statSync } from "node:fs";
import { describe, expect, it } from "vitest";

const OG_PATH = new URL("../../public/og-image.png", import.meta.url);
const LAYOUT_PATH = new URL(
  "../../src/layouts/BaseLayout.astro",
  import.meta.url,
);
const MAX_BYTES = 300 * 1024;

function pngSize(buf: Buffer): { width: number; height: number } {
  const signature = "89504e470d0a1a0a";
  expect(buf.subarray(0, 8).toString("hex")).toBe(signature);
  expect(buf.subarray(12, 16).toString("ascii")).toBe("IHDR");
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function declaredSize(): { width: number; height: number } {
  const src = readFileSync(LAYOUT_PATH, "utf8");
  const w = /property="og:image:width"\s+content="(\d+)"/.exec(src);
  const h = /property="og:image:height"\s+content="(\d+)"/.exec(src);
  expect(w, "brak og:image:width w BaseLayout").not.toBeNull();
  expect(h, "brak og:image:height w BaseLayout").not.toBeNull();
  return { width: Number(w![1]), height: Number(h![1]) };
}

describe("og:image", () => {
  it("BaseLayout deklaruje kadr 1200×630 i kartę summary_large_image", () => {
    expect(declaredSize()).toEqual({ width: 1200, height: 630 });
    const src = readFileSync(LAYOUT_PATH, "utf8");
    expect(src).toMatch(/name="twitter:card"\s+content="summary_large_image"/);
  });

  it("public/og-image.png ma wymiary z meta (plik i deklaracja w parze)", () => {
    expect(pngSize(readFileSync(OG_PATH))).toEqual(declaredSize());
  });

  it(`public/og-image.png waży ≤ ${MAX_BYTES / 1024} KB`, () => {
    expect(statSync(OG_PATH).size).toBeLessThanOrEqual(MAX_BYTES);
  });
});
