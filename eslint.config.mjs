import js from "@eslint/js";
import tseslint from "typescript-eslint";
import astro from "eslint-plugin-astro";
import globals from "globals";

// eslint-plugin-jsx-a11y zostaje w devDeps — używa go pośrednio
// astro.configs["jsx-a11y-recommended"] (a11y w plikach .astro).
export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
  ...astro.configs["jsx-a11y-recommended"],
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
  {
    ignores: [
      "dist/",
      ".astro/",
      "node_modules/",
      "docs/",
      // artefakty Playwright
      "test-results/",
      "playwright-report/",
    ],
  },
);
