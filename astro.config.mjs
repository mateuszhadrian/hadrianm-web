// @ts-check
import { defineConfig } from "astro/config";

import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  site: "https://hadrianm.pl",
  output: "static",
  i18n: {
    defaultLocale: "pl",
    locales: ["pl", "en"],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  integrations: [sitemap()],

  vite: {
    plugins: [tailwindcss()],
    build: {
      // Domyślny assetsInlineLimit Vite (4096 B) wciągnąłby polskie subsety
      // fontów (3,9–5 KB, F1) wprost do arkusza jako data: URI — bajty kroju
      // w CSS BLOKUJĄCYM RENDER zamiast asynchronicznie przez
      // font-display: swap (wzorzec pracownia-eha-web). Pozostałe assety
      // bez zmian.
      assetsInlineLimit: (filePath) =>
        filePath.endsWith(".woff2") ? false : undefined,
    },
  },
});
