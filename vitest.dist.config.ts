// Testy na ZBUDOWANYM `dist/` (`pnpm test:dist`, po `pnpm build` albo
// `pnpm build:visual`): skan HTML pod kątem wycieków środowiska dev i pełnych
// adresów e-mail oraz spójność `robots.txt`/sitemapy (T7 w analizie ewolucji
// §6). Osobny config, bo `vitest.config.ts` (`test:unit`) ma `include`
// zawężony do `tests/unit/**` i wstaje przez `getViteConfig` Astro —
// `test:unit` ma zostać szybkie i niezależne od istnienia `dist/`.
// Biega w jobie `quality` (ci.yml) po `pnpm build` i w `/release-check`.
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/dist/**/*.test.ts"],
  },
});
