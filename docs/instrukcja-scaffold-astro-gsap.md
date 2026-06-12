# Scaffold projektu — Astro + GSAP (strona-wizytówka)

> Instrukcja krok po kroku do postawienia czystego, w pełni skonfigurowanego scaffolda
> pod stronę-wizytówkę z ciężkimi animacjami GSAP. Po wykonaniu części głównej
> (bez sekcji „Testy") projekt jest gotowy do pierwszego commita i dalszej pracy.
>
> Baza decyzji: [`analiza-stack-struktura-hosting.md`](./analiza-stack-struktura-hosting.md).
> Wersje narzędzi zweryfikowane przez Context7 (czerwiec 2026).

## Zakres i decyzje (ustalone)

| Obszar                 | Decyzja                                                                        |
| ---------------------- | ------------------------------------------------------------------------------ |
| Framework              | **Astro 6.x** (Islands, `output: 'static'`)                                    |
| Menedżer pakietów      | **pnpm**                                                                       |
| Node                   | **22 LTS** (pinned `.nvmrc`)                                                   |
| UI islands             | **React** (`@astrojs/react`) — tylko tam, gdzie potrzebny stan                 |
| Animacje               | **GSAP + ScrollTrigger**, vanilla w `<script>` Astro, `gsap.matchMedia`        |
| Treści                 | **MDX** (`@astrojs/mdx`)                                                       |
| Style                  | **Tailwind v4** (CSS-first, `@tailwindcss/vite`)                               |
| i18n                   | wbudowany routing Astro, `pl` default + `en`                                   |
| SEO                    | `@astrojs/sitemap` + komponent meta/OG + JSON-LD `LocalBusiness`               |
| Walidacja              | **Zod** (formularze / dane; content collections dorobisz na etapie realizacji) |
| TypeScript             | **strict** (`astro/tsconfigs/strict`) + alias `@/*`                            |
| Jakość kodu            | ESLint (flat) + Prettier (+ pluginy astro/tailwind)                            |
| Git hooks              | Husky + lint-staged + commitlint (Conventional Commits)                        |
| Testy + GitHub Actions | **część opcjonalna** (na końcu)                                                |

**Świadomie pominięte na tym etapie** (dorobisz w fazie implementacji): schemat content collections dla realizacji, adapter Cloudflare (dodasz dopiero przy SSR/formularzach server-side), konkretny font brandowy (na razie placeholder Inter).

---

## Wynik końcowy — checklista

Po części głównej będziesz mieć w repo:

- [ ] Działający `pnpm dev` / `pnpm build` (Astro static)
- [ ] React + MDX + Sitemap + Tailwind v4 wpięte w `astro.config.mjs`
- [ ] GSAP + ScrollTrigger zainstalowane i gotowe do użycia
- [ ] Fontsource (przykład Inter Variable)
- [ ] Zod zainstalowany
- [ ] TypeScript strict + alias `@/*`
- [ ] i18n routing (`pl`/`en`)
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm format` — przechodzą
- [ ] Husky: `pre-commit` (lint-staged) + `commit-msg` (commitlint)
- [ ] Pliki pomocnicze: `.nvmrc`, `.npmrc`, `.editorconfig`, `.gitignore`, `.vscode/`
- [ ] Pierwszy commit (Conventional Commits) przechodzi bramki

---

## Wymagania wstępne

1. **Node 22 LTS** — sprawdź `node -v` (powinno być `v22.x`). Jeśli używasz `nvm`:
   ```bash
   nvm install 22
   nvm use 22
   ```
2. **pnpm** — jeśli nie masz, włącz przez Corepack (wbudowany w Node):
   ```bash
   corepack enable
   corepack prepare pnpm@latest --activate
   pnpm -v
   ```
3. **git** — `git --version` (potrzebny do Husky i deployu).

---

## Krok 1 — Utworzenie projektu Astro

W katalogu nadrzędnym (NIE w istniejącym repo — kreator tworzy własny folder):

```bash
pnpm create astro@latest
```

W kreatorze wybierz:

- **Where** → nazwa folderu projektu (np. `hadrianm-web`)
- **Template** → `Empty` (czysty start — sami zbudujemy strukturę)
- **TypeScript** → `Yes` → **Strict**
- **Install dependencies** → `Yes`
- **Initialize git repository** → `Yes`

> Jeśli scaffold ma trafić do już istniejącego katalogu/repo, utwórz projekt obok i przenieś zawartość, albo uruchom kreator z `.` jako nazwą folderu w pustym katalogu.

Wejdź do projektu:

```bash
cd hadrianm-web
```

---

## Krok 2 — Integracje: React, MDX, Sitemap, Tailwind v4

Jedną komendą (`astro add` instaluje paczki **i** automatycznie wstrzykuje konfigurację do `astro.config.mjs`, dopisuje plugin Tailwind do Vite oraz tworzy/aktualizuje `tsconfig.json` pod React):

```bash
pnpm astro add react mdx sitemap tailwind
```

Na pytania o modyfikację plików odpowiedz **Yes**.

Co to robi:

- `@astrojs/react` + `react` + `react-dom` + typy
- `@astrojs/mdx`
- `@astrojs/sitemap`
- **Tailwind v4**: instaluje `tailwindcss` + `@tailwindcss/vite` i dodaje plugin do sekcji `vite.plugins` (v4 nie używa `tailwind.config.js` — konfiguracja jest CSS-first; patrz Krok 9)

> Uwaga: w Astro 6 integracja Tailwind = oficjalny plugin Vite (`@tailwindcss/vite`), nie stary `@astrojs/tailwind`. `astro add tailwind` robi to poprawnie.

---

## Krok 3 — GSAP + ScrollTrigger

```bash
pnpm add gsap
```

GSAP jest framework-agnostyczny — używasz go w `<script>` wewnątrz plików `.astro` (vanilla), nie potrzebujesz wrappera React. Wzorzec użycia (do zapamiętania na etapie implementacji, **nie wklejaj teraz nigdzie**):

```js
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger); // konieczne — chroni przed tree-shakingiem

// responsywność + a11y w jednym:
const mm = gsap.matchMedia();
mm.add("(prefers-reduced-motion: no-preference)", () => {
  // animacje tylko gdy user nie wyłączył ruchu
});
```

---

## Krok 4 — Fontsource (przykład: Inter Variable)

```bash
pnpm add @fontsource-variable/inter
```

To tylko mechanizm/placeholder — gdy ustalisz font brandowy, podmienisz paczkę. Import zrobisz później w globalnym CSS lub layoucie (`import "@fontsource-variable/inter";`).

---

## Krok 5 — Zod

Zod przyda się do walidacji formularzy oraz (później) schematów content collections:

```bash
pnpm add zod
```

> Astro ma własny re-export Zoda dla kolekcji (`import { z } from 'astro:content'`), ale osobny `zod` daje go też poza kolekcjami (formularz kontaktowy, API). Trzymanie jednej, jawnej wersji jest czytelniejsze.

---

## Krok 6 — TypeScript strict + alias `@/*`

`tsconfig.json` po `create astro` rozszerza już `astro/tsconfigs/strict`. Dodaj alias ścieżek — w `tsconfig.json` w `compilerOptions`:

```jsonc
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
    },
    "jsx": "react-jsx",
    "jsxImportSource": "react",
  },
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"],
}
```

> `jsx`/`jsxImportSource` zwykle dodaje już `astro add react` — zostaw jeśli są. Alias `@/*` działa w Astro out-of-the-box (Vite czyta `tsconfig paths`).

---

## Krok 7 — Konfiguracja i18n (PL/EN)

W `astro.config.mjs` dopisz blok `i18n` (obok istniejących `integrations`):

```js
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://twoja-domena.pl", // potrzebne dla sitemap i canonical
  output: "static",
  i18n: {
    defaultLocale: "pl",
    locales: ["pl", "en"],
    routing: {
      prefixDefaultLocale: false, // pl bez prefixu (/), en pod /en/
    },
  },
  integrations: [react(), mdx(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
```

Konwencja struktury treści (utworzysz na etapie implementacji, tu tylko ustalenie):

```
src/pages/
  index.astro        → PL (/)
  en/index.astro     → EN (/en/)
src/i18n/
  pl.json, en.json   → stringi UI odseparowane od komponentów
```

---

## Krok 8 — SEO: sitemap + meta + JSON-LD LocalBusiness

- `@astrojs/sitemap` już wpięty (Krok 2/7); wymaga ustawionego `site` w configu (Krok 7). Generuje `sitemap-index.xml` przy buildzie.
- Na etapie implementacji utworzysz komponent `src/components/Seo.astro` (title/description/canonical/OG) oraz wstrzykniesz JSON-LD `LocalBusiness` w `<head>`. **Teraz nic nie kodujemy** — to tylko notatka, że integracja jest gotowa.
- Rozważ dodanie pliku `public/robots.txt` ze wskazaniem na sitemap (jednolinijkowy plik statyczny).

---

## Krok 9 — Tailwind v4 (CSS-first)

Tailwind v4 **nie ma** `tailwind.config.js`. Konfiguracja żyje w CSS:

1. Utwórz `src/styles/global.css`:

   ```css
   @import "tailwindcss";

   @theme {
     /* tu definiujesz design tokens, np. */
     /* --font-display: "Inter Variable", sans-serif; */
     /* --color-brand-500: oklch(0.7 0.15 250); */
   }
   ```

2. Zaimportuj go raz w głównym layoucie (`src/layouts/*.astro`):
   ```js
   import "@/styles/global.css";
   ```

> Plugin `@tailwindcss/vite` (Krok 2) skanuje klasy automatycznie — nie konfigurujesz `content`. Customizację robisz przez `@theme`.

---

## Krok 10 — ESLint (flat config)

Instalacja narzędzi lintujących:

```bash
pnpm add -D eslint typescript-eslint eslint-plugin-astro eslint-plugin-jsx-a11y eslint-plugin-react-hooks globals
```

Utwórz `eslint.config.mjs` w korzeniu:

```js
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import astro from "eslint-plugin-astro";
import jsxA11y from "eslint-plugin-jsx-a11y";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
  ...astro.configs["jsx-a11y-recommended"],
  {
    files: ["**/*.{jsx,tsx}"],
    plugins: { "jsx-a11y": jsxA11y, "react-hooks": reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  },
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
  {
    ignores: ["dist/", ".astro/", "node_modules/"],
  },
);
```

> `eslint-plugin-astro` dostarcza zarówno reguły Astro, jak i preset `jsx-a11y-recommended` dla szablonów `.astro`; osobny `eslint-plugin-jsx-a11y` pokrywa pliki React (`.tsx`).

---

## Krok 11 — Prettier (+ pluginy Astro i Tailwind)

```bash
pnpm add -D prettier prettier-plugin-astro prettier-plugin-tailwindcss
```

Utwórz `.prettierrc.json`:

```jsonc
{
  "plugins": ["prettier-plugin-astro", "prettier-plugin-tailwindcss"],
  "overrides": [{ "files": "*.astro", "options": { "parser": "astro" } }],
}
```

Utwórz `.prettierignore`:

```
dist
.astro
pnpm-lock.yaml
```

> **Kolejność pluginów ma znaczenie**: `prettier-plugin-tailwindcss` musi być **ostatni** (sam doczepia się na końcu i sortuje klasy). `prettier-plugin-astro` rozumie składnię `.astro`.

---

## Krok 12 — Skrypty w `package.json`

Dodaj/uzupełnij sekcję `scripts`:

```jsonc
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "astro": "astro",
    "typecheck": "astro check",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
  },
}
```

`astro check` wymaga `@astrojs/check` + `typescript` (kreator zwykle je dodaje; jeśli `pnpm typecheck` poprosi o instalację, potwierdź lub uruchom `pnpm add -D @astrojs/check typescript`).

---

## Krok 13 — Husky + lint-staged

```bash
pnpm add -D husky lint-staged
pnpm exec husky init
```

`husky init` tworzy katalog `.husky/` i przykładowy hook `pre-commit` oraz dopisuje skrypt `prepare`. Podmień zawartość `.husky/pre-commit` na:

```sh
pnpm exec lint-staged
```

Dodaj konfigurację `lint-staged` do `package.json`:

```jsonc
{
  "lint-staged": {
    "*.{astro,js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,mdx,css}": ["prettier --write"],
  },
}
```

> Upewnij się, że w `package.json` istnieje `"prepare": "husky"` (dodaje go `husky init`) — dzięki temu hooki zainstalują się po `pnpm install` u każdego.

---

## Krok 14 — commitlint (Conventional Commits)

```bash
pnpm add -D @commitlint/cli @commitlint/config-conventional
```

Utwórz `commitlint.config.js`:

```js
export default { extends: ["@commitlint/config-conventional"] };
```

Dodaj hook `commit-msg`:

```bash
printf '%s\n' 'pnpm exec commitlint --edit "$1"' > .husky/commit-msg
```

> Od teraz commity muszą mieć format `type(scope): opis`, np. `feat: hero section`, `chore: scaffold setup`. Typy: `feat`, `fix`, `chore`, `docs`, `style`, `refactor`, `test`, `ci`, `build`, `perf`.

---

## Krok 15 — Pliki pomocnicze

1. **`.nvmrc`** (pin wersji Node):
   ```
   22
   ```
2. **`.npmrc`** (deterministyczne instalacje z pnpm):
   ```
   engine-strict=true
   ```
   Opcjonalnie dopisz w `package.json`:
   ```jsonc
   { "packageManager": "pnpm@<wersja>", "engines": { "node": ">=22" } }
   ```
   (`<wersja>` = wynik `pnpm -v`).
3. **`.editorconfig`**:

   ```ini
   root = true

   [*]
   charset = utf-8
   end_of_line = lf
   indent_style = space
   indent_size = 2
   insert_final_newline = true
   trim_trailing_whitespace = true
   ```

4. **`.vscode/extensions.json`** (rekomendowane wtyczki dla zespołu/siebie):
   ```jsonc
   {
     "recommendations": [
       "astro-build.astro-vscode",
       "dbaeumer.vscode-eslint",
       "esbenp.prettier-vscode",
       "bradlc.vscode-tailwindcss",
     ],
   }
   ```
5. **`.vscode/settings.json`** (format on save + ESLint flat):
   ```jsonc
   {
     "editor.formatOnSave": true,
     "editor.defaultFormatter": "esbenp.prettier-vscode",
     "editor.codeActionsOnSave": { "source.fixAll.eslint": "explicit" },
     "eslint.useFlatConfig": true,
   }
   ```
6. **`.gitignore`** — `create astro` generuje sensowny domyślny; upewnij się, że zawiera `node_modules`, `dist`, `.astro`, `.env*`.

---

## Krok 16 — Weryfikacja scaffolda

Uruchom po kolei i upewnij się, że wszystko przechodzi:

```bash
pnpm install          # gdyby coś doszło ręcznie
pnpm format           # sformatuje cały kod
pnpm lint             # 0 błędów
pnpm typecheck        # 0 błędów typów
pnpm build            # build static przechodzi
pnpm dev              # http://localhost:4321 wstaje
```

Jeśli `pnpm build`/`typecheck` zgłasza brak strony — utwórz minimalny `src/pages/index.astro` (jedna linijka HTML) tylko po to, by build miał co zbudować.

---

## Krok 17 — Pierwszy commit

Hooki są aktywne, więc commit przejdzie tylko gdy lint/format/format-commita są OK:

```bash
git add -A
git commit -m "chore: scaffold astro + gsap project setup"
```

Następnie podłącz zdalne repo (GitHub) i wypchnij:

```bash
git branch -M main
git remote add origin git@github.com:<user>/<repo>.git
git push -u origin main
```

> Deploy: nie buduj custom CI do deployu. Po wypchnięciu do GitHuba podłącz repo w **Cloudflare Pages** (build command `pnpm build`, output `dist`, framework preset = Astro). Cloudflare robi build + preview deployments na każdy PR. (Szczegóły hostingu: sekcja 3 analizy.)

✅ **Po tym kroku scaffold jest kompletny — możesz spokojnie zaczynać pracę nad stroną.**

---

---

# CZĘŚĆ OPCJONALNA — Środowiska testowe + CI

> Nie jest wymagane do startu pracy. Dodaj, gdy chcesz wprowadzić bramki jakości.
> Większość tych narzędzi NIE instaluje się sama — trzeba je dodać ręcznie.

## A. Vitest (unit / integration + testy komponentów Astro)

```bash
pnpm add -D vitest
```

Astro integruje się z Vitest przez `getViteConfig()`. Utwórz `vitest.config.ts`:

```ts
/// <reference types="vitest/config" />
import { getViteConfig } from "astro/config";

export default getViteConfig({
  test: {
    // np. environment: "jsdom" jeśli testujesz DOM/React (doinstaluj jsdom)
  },
});
```

Komponenty `.astro` testujesz natywnie przez **Container API** (Astro ≥ 4.9):

```ts
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { expect, test } from "vitest";
import Card from "@/components/Card.astro";

test("Card renderuje slot", async () => {
  const container = await AstroContainer.create();
  const result = await container.renderToString(Card, {
    slots: { default: "Treść" },
  });
  expect(result).toContain("Treść");
});
```

Dla testów React/DOM doinstaluj wg potrzeb:

```bash
pnpm add -D jsdom @testing-library/react @testing-library/dom
```

Skrypty:

```jsonc
{ "scripts": { "test": "vitest run", "test:watch": "vitest" } }
```

## B. Playwright (E2E + testy wizualne / regresja snapshotów)

```bash
pnpm create playwright
```

Kreator instaluje `@playwright/test`, ściąga przeglądarki, tworzy `playwright.config.ts` oraz folder `tests/`/`e2e/`. W konfiguracji ustaw `webServer`, by Playwright sam stawiał Astro:

```ts
// w playwright.config.ts
export default defineConfig({
  webServer: {
    command: "pnpm preview", // lub "pnpm dev"
    url: "http://localhost:4321",
    reuseExistingServer: !process.env.CI,
  },
  use: { baseURL: "http://localhost:4321" },
});
```

- **E2E**: `await page.goto("/")`, asercje na treść/nawigację.
- **Wizualne**: `await expect(page).toHaveScreenshot()` — pierwsza generuje baseline, kolejne porównują. Ważne przy animacjach: stabilizuj testy (`prefers-reduced-motion`, wyłączenie animacji, `await page.waitForLoadState`).

Skrypty:

```jsonc
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
  },
}
```

Dodaj do `.gitignore`: `test-results/`, `playwright-report/`, `playwright/.cache/`.

## C. Lighthouse CI (bramka Core Web Vitals)

Kluczowe przy ciężkich animacjach — pilnuje, by GSAP nie zabił wydajności.

```bash
pnpm add -D @lhci/cli
```

Utwórz `lighthouserc.cjs`:

```js
module.exports = {
  ci: {
    collect: {
      staticDistDir: "./dist",
      url: ["http://localhost/index.html"],
    },
    assert: {
      preset: "lighthouse:recommended",
      assertions: {
        "categories:performance": ["error", { minScore: 0.9 }],
        "categories:seo": ["error", { minScore: 0.9 }],
        "categories:accessibility": ["error", { minScore: 0.9 }],
      },
    },
    upload: { target: "temporary-public-storage" },
  },
};
```

Uruchomienie (najpierw build): `pnpm build && pnpm exec lhci autorun`.

## D. GitHub Actions (quality gates)

Model z analizy: **deploy robi platforma (Cloudflare), Actions pilnuje jakości.** Utwórz `.github/workflows/ci.yml`:

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm build
      # - run: pnpm test            # gdy dodasz Vitest
      # - run: pnpm exec lhci autorun  # gdy dodasz Lighthouse CI
```

> E2E Playwright zwykle trzyma się w osobnym jobie/workflow (instaluje przeglądarki: `pnpm exec playwright install --with-deps`), by nie spowalniać szybkiej bramki lint/typecheck/build.

---

## Mapa zainstalowanych paczek (ściąga)

**Runtime / framework**
`astro` · `@astrojs/react` (`react`, `react-dom`) · `@astrojs/mdx` · `@astrojs/sitemap` · `tailwindcss` + `@tailwindcss/vite` · `gsap` · `@fontsource-variable/inter` · `zod`

**Dev / jakość**
`@astrojs/check` + `typescript` · `eslint` + `typescript-eslint` + `eslint-plugin-astro` + `eslint-plugin-jsx-a11y` + `eslint-plugin-react-hooks` + `globals` · `prettier` + `prettier-plugin-astro` + `prettier-plugin-tailwindcss` · `husky` · `lint-staged` · `@commitlint/cli` + `@commitlint/config-conventional`

**Opcjonalne (testy)**
`vitest` (+ `jsdom`, `@testing-library/*`) · `@playwright/test` · `@lhci/cli`
