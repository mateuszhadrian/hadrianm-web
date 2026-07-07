// Kontrakt imgAt() — jedyne miejsce wiedzy o rozmiarach obrazów (Cloudflare
// Image Transformations). imgAt czyta import.meta.env.DEV w momencie
// wywołania, więc stubujemy env per test (vi.stubEnv wspiera boolean dla DEV).
import { afterEach, describe, expect, it, vi } from "vitest";
import { imgAt } from "../../src/lib/img";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("imgAt: produkcja (DEV=false)", () => {
  it("buduje URL /cdn-cgi/image z szerokością 960 (full) i 320 (mobile) + format=auto", () => {
    vi.stubEnv("DEV", false);
    const src = "https://media.hadrianm.pl/realizacje/aura-desktop.webp";
    expect(imgAt(src, "full")).toBe(
      `/cdn-cgi/image/width=960,format=auto/${src}`,
    );
    expect(imgAt(src, "mobile")).toBe(
      `/cdn-cgi/image/width=320,format=auto/${src}`,
    );
  });

  it("zdejmuje wiodący '/' ze starych ścieżek repo (unika //)", () => {
    vi.stubEnv("DEV", false);
    expect(imgAt("/realizacje/foo.webp", "full")).toBe(
      "/cdn-cgi/image/width=960,format=auto/realizacje/foo.webp",
    );
  });
});

describe("imgAt: dev (DEV=true)", () => {
  it("zwraca oryginał bez zmian — endpoint /cdn-cgi/image nie istnieje lokalnie", () => {
    vi.stubEnv("DEV", true);
    const src = "https://media.hadrianm.pl/realizacje/aura-desktop.webp";
    expect(imgAt(src, "full")).toBe(src);
    expect(imgAt(src, "mobile")).toBe(src);
  });
});
