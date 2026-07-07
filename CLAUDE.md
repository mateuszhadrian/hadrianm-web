# hadrianm-web — CLAUDE.md

Strona-wizytówka hadrianm.pl. Astro 6 **static** (bez SSR), PL pod `/`,
EN pod `/en/` (`prefixDefaultLocale: false`). Hosting: Cloudflare Pages,
deploy automatyczny z gałęzi `main` → **main = produkcja**.

## Zasady twarde

1. **NIGDY nie wykonuj `git commit` ani `git push`** — commituje wyłącznie
   Mateusz. Twoja rola: zostawić zmiany w working tree i ZAPROPONOWAĆ
   treść commita (conventional commits ze scope, po angielsku, np.
   `fix(hero): …`, `feat(work): …`, `docs(cms): …`). Blokada jest też
   egzekwowana w `.claude/settings.json`.
2. **Nie edytuj `src/content/realizacje/*.json`** — te pliki pisze Sveltia
   CMS (własny formater, commituje przez GitHub API). Zmiany treści robi
   się w panelu `/admin`. Wyjątek wymaga wyraźnej zgody Mateusza.
3. **Nie dotykaj `dist/` i `.astro/`** — generowane.
4. Sekrety (`.env*`, tokeny Cloudflare/GitHub) — nie czytaj, nie loguj.
5. **Nie aktualizuj baseline'ów wizualnych** (`tests/visual/__screenshots__/`)
   bez pokazania diffu i zgody Mateusza (blokada też w settings.json).
   Aktualizacja wyłącznie przez `pnpm test:visual:update` po akceptacji;
   komplet linuksowy → workflow `update-visual-baselines.yml`.

## Komendy

- `pnpm dev` — dev server (port 4321)
- `pnpm build` / `pnpm preview`
- `pnpm typecheck` — `astro check` (typy; to już NIE jedyna weryfikacja —
  patrz testy niżej)
- `pnpm lint` / `pnpm lint:fix` / `pnpm format` / `pnpm format:check`
- Testy (kontrakt: `.claude/rules/testing.md`): `pnpm test` (wszystko);
  `pnpm test:unit` (Vitest, sekundy); `pnpm test:e2e` (Playwright:
  funkcjonalne+a11y+SEO); `pnpm test:visual` (screenshoty vs baseline;
  wymaga `pnpm build`; webServer sam wstaje na 4399);
  `pnpm test:visual:update` (nowe baseline'y — TYLKO za zgodą Mateusza);
  `pnpm test:smoke:prod` (smoke przeciw produkcji)
- `pnpm capture:devices` — regeneracja MP4 ekranów urządzeń (użyj skilla
  `/capture-devices`, ma pre-checki)
- CI (GitHub Actions) na push/PR: format:check → lint → typecheck → build.
  Lokalnie husky: pre-commit lint-staged, commit-msg commitlint.

## Mapa projektu

- `src/components/sections/hero/` — scroll-driven scena urządzeń (platform-
  specific gotchas iOS/Android). Architektura: `Hero.astro` = orkiestrator;
  moduły: `hero-config.ts` (oś scrolla — POCHODNE liczy kod), `platform.ts`
  (detekcja + skala Androida), `scene-vars.ts` (protokół zmiennych CSS),
  `selectors.ts` (kontrakt selektorów), `timeline-base` / `desktop-phases` /
  `mobile-phases` / `caption-carousel` (fazy), `device-scene`,
  `android-mobile`. Przed edycją przeczytaj reguły, które się załadują.
  Zmiana NIE jest zweryfikowana bez `pnpm test:visual` (sweep w
  `tests/visual/hero.spec.ts`, pixel-diff vs baseline; skill `/verify-mobile`).
- `src/components/sections/work/` — Realizacje: dane z Content Collections
  (`src/content/realizacje/*.json`, schema Zod w `src/content.config.ts`).
- `src/scripts/smooth-scroll.ts` — Lenis; stałe desktop/touch są rozdzielone
  CELOWO (szczegóły w regułach).
- `src/lib/img.ts` — `imgAt()`: JEDYNE miejsce wiedzy o rozmiarach obrazów
  (Cloudflare Image Transformations; w dev pokazuje oryginały).
- `src/i18n/` — teksty UI i nawigacji; treści CMS mają pola `{pl, en}`.
- `src/styles/global.css` — design tokens w `:root` (kolory, fonty).
- `tests/` — `unit/` (Vitest: inwarianty hero-config, i18n, img, platform,
  kontrakt CMS), `e2e/` (Playwright: nawigacja, Work, i18n, hero
  funkcjonalnie, a11y, SEO, smoke `@prod-smoke`), `visual/` (screenshoty
  vs baseline'y per-platform w `visual/__screenshots__/` — commitowane),
  `helpers/` (assertPreview, scroll przez Lenisa, freeze.css).
- `public/admin/` — panel Sveltia CMS (config.yml = definicja pól panelu).
- `scripts/` — narzędzia dev-only (capture wideo, optymalizacja obrazów).
- `docs/` — analizy decyzyjne po polsku; **statusy plików w `docs/README.md`**
  (dokumenty z bannerem „DOKUMENT HISTORYCZNY" nie są źródłem ustaleń).
  Prettier i ESLint je ignorują.

## Konwencje pracy

- **Docs-first**: większe decyzje/refaktory poprzedzaj analizą w `docs/`
  (po polsku), jak dotychczasowe pliki `analiza-*.md`. Plany rozpisuj na
  numerowane etapy.
- Media realizacji żyją w R2 (`https://media.hadrianm.pl`), NIE w repo.
  Upload wyłącznie przez pola Image w panelu Sveltia.
- Weryfikacja wizualna: `pnpm build && pnpm test:visual` — hero (sweep
  `tests/visual/hero.spec.ts`, 3 profile) + sekcje (6 profili); baseline'y
  per-platform (darwin lokalnie + linux z workflow
  `update-visual-baselines.yml`) commitowane w
  `tests/visual/__screenshots__/`. WYMAGA preview, nie dev (strażnik
  `assertPreview`; port 4399). Emulacja NIE wykrywa: limitu warstwy GPU
  Androida, Low Power Mode, zwijanego toolbara iOS, zimnego cache — tam
  poproś Mateusza o test na fizycznym urządzeniu i wskaż, na co patrzeć.

## Kluczowe dokumenty (czytaj przed pracą w danym obszarze)

- **Najpierw indeks statusów: `docs/README.md`** — dokumenty z bannerem
  „DOKUMENT HISTORYCZNY" nie są źródłem ustaleń; pliki mieszane mają
  adnotacje ⚠️/ℹ️ przy nieaktualnych fragmentach.
- Hero — refactor, inwarianty, naprawy zimnego startu iOS:
  `docs/analiza-refactor-hero-odkruszenie.md` (NAJWAŻNIEJSZY dla pracy w hero)
- Hero/Android: `docs/analiza-android-obudowy-3d-glodza-rasteryzacje.md`,
  `docs/naprawa-android-scena-urzadzen-mobile.md`
- Tło ambient + crossfade sekcji: `docs/analiza-tlo-hero-animowane-chmury.md`
  (wdrożone jako `src/components/backgrounds/AmbientBackground.astro`)
- CMS + hosting (plan i stan): `docs/hosting_second_analysis_sveltia.md`,
  `docs/photos-management-for-cms-analysis.md`
- Utrzymanie cykliczne (Worker auth, sekrety): `docs/optional-todos.md`
