// Detekcja platformy (platform.ts). IS_ANDROID liczy się PRZY IMPORCIE modułu
// z navigator.userAgent — stąd resetModules + stubGlobal + świeży import per
// przypadek.
import { afterEach, describe, expect, it, vi } from "vitest";

const UA = {
  android:
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36",
  iphone:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
  macChrome:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
} as const;

async function loadPlatform(userAgent?: string) {
  vi.resetModules();
  if (userAgent === undefined) {
    vi.stubGlobal("navigator", undefined);
  } else {
    vi.stubGlobal("navigator", { userAgent });
  }
  return import("../../src/components/sections/hero/platform");
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("platform: IS_ANDROID", () => {
  it("true dla UA Androida", async () => {
    expect((await loadPlatform(UA.android)).IS_ANDROID).toBe(true);
  });

  it("false dla iPhone'a i desktopowego Chrome'a", async () => {
    expect((await loadPlatform(UA.iphone)).IS_ANDROID).toBe(false);
    expect((await loadPlatform(UA.macChrome)).IS_ANDROID).toBe(false);
  });

  it("false bez navigatora (SSR/build)", async () => {
    expect((await loadPlatform(undefined)).IS_ANDROID).toBe(false);
  });
});

describe("platform: breakpoint hero", () => {
  it("media queries nie zostawiają luki ani nakładki wokół MOBILE_MAX", async () => {
    const { MOBILE_MAX, MOBILE_MQ, DESKTOP_MQ } = await loadPlatform(
      UA.macChrome,
    );
    expect(MOBILE_MQ).toBe(`(max-width: ${MOBILE_MAX}px)`);
    expect(DESKTOP_MQ).toBe(`(min-width: ${MOBILE_MAX + 1}px)`);
  });

  it("MOBILE_MAX = 760 (literały 760/761 w CSS Hero/DeviceScene zmieniaj razem)", async () => {
    // Świadoma zmiana breakpointu ⇒ zaktualizuj RAZEM: tę asercję i media
    // queries oznaczone komentarzem „= MOBILE_MAX" w CSS.
    expect((await loadPlatform(UA.macChrome)).MOBILE_MAX).toBe(760);
  });
});

describe("platform: ANDROID_DESIGN_SCALE", () => {
  it("skala projektowa jest ułamkiem w (0, 1] — kompensuje limit warstwy GPU", async () => {
    const { ANDROID_DESIGN_SCALE } = await loadPlatform(UA.android);
    expect(ANDROID_DESIGN_SCALE).toBeGreaterThan(0);
    expect(ANDROID_DESIGN_SCALE).toBeLessThanOrEqual(1);
  });
});
