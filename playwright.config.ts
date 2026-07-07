import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["html"], ["github"]] : "list",
  // Baseline'y per-platform: <nazwa>-darwin.png / <nazwa>-linux.png
  snapshotPathTemplate:
    "{testDir}/visual/__screenshots__/{projectName}/{arg}-{platform}{ext}",
  expect: {
    toHaveScreenshot: {
      // Odpowiednik FAIL_PIXEL_RATIO z scripts/verify-hero.mjs
      maxDiffPixelRatio: 0.0005,
      animations: "disabled",
    },
  },
  webServer: {
    // Celowo BEZ builda — build jest osobnym krokiem (lokalnie: `pnpm build`
    // przed testami; w CI: osobny step). Testy wizualne tylko na preview,
    // nigdy dev. Port 4399, nie 4321 — na 4321 często wisi dev server.
    command: "pnpm preview --port 4399",
    url: "http://localhost:4399",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  use: { baseURL: "http://localhost:4399" },
  // UWAGA: nie ustawiać `reducedMotion: "reduce"` — bramka w BaseLayout
  // wyłączyłaby Lenisa/GSAP i testy przechodziłyby na martwej stronie.
  projects: [
    {
      name: "chromium-1920",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      name: "chromium-1366",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1366, height: 768 },
      },
    },
    {
      name: "firefox-desktop",
      use: {
        ...devices["Desktop Firefox"],
        viewport: { width: 1920, height: 1080 },
      },
    },
    { name: "webkit-iphone-se", use: { ...devices["iPhone SE"] } },
    { name: "webkit-iphone-14", use: { ...devices["iPhone 14"] } },
    { name: "chromium-pixel-5", use: { ...devices["Pixel 5"] } },
  ],
});
