# Inicjalizacja ekosystemu Claude Code w hadrianm-web (+ baza white-label)

> Dokument: analiza stanu projektu + kompletna, etapowa instrukcja wdrożenia
> plików ekosystemu Claude Code (CLAUDE.md, rules, skills, hooks, settings,
> MCP), zakończona planem ekstrakcji wersji white-label pod strony klientów.
>
> Wszystkie treści plików są **copy-paste ready** — wdrożenie etapu to
> dosłownie utworzenie plików z tego dokumentu.
>
> Formaty zweryfikowane z oficjalną dokumentacją Claude Code (2.1.200+,
> lipiec 2026): https://code.claude.com/docs/en/memory.md ·
> /skills.md · /hooks-guide.md · /settings.md · /sub-agents.md · /mcp.md

---

## Spis treści

0. [Stan repo na start — aktualizacja 2026-07-06](#0-stan-repo-na-start-aktualizacja-2026-07-06--przeczytaj-najpierw)
1. [Analiza stanu obecnego](#1-analiza-stanu-obecnego)
2. [Docelowa architektura ekosystemu](#2-docelowa-architektura-ekosystemu)
3. [Etap 1 — Root CLAUDE.md](#etap-1--root-claudemd)
4. [Etap 2 — settings.json: permissions + hooks](#etap-2--claudesettingsjson-permissions--hooks)
5. [Etap 3 — Rules: kodyfikacja wiedzy o hotspotach](#etap-3--rules-kodyfikacja-wiedzy-o-hotspotach)
6. [Etap 4 — Skills: powtarzalne workflow](#etap-4--skills-powtarzalne-workflow)
7. [Etap 5 — MCP](#etap-5--mcp)
8. [Etap 6 (propozycja) — minimalne testy Playwright](#etap-6-propozycja--minimalne-testy-playwright)
9. [Etap 7 — White-label: template repo + skille inicjujące](#etap-7--white-label-template-repo--skille-inicjujące)
10. [Kolejność wdrożenia i utrzymanie](#10-kolejność-wdrożenia-i-utrzymanie)

---

## 0. Stan repo na start (aktualizacja 2026-07-06 — PRZECZYTAJ NAJPIERW)

Między napisaniem tego planu a jego wykonaniem przeprowadzono **refactor
„odkruszający" hero** (kroki 0–6, pełny opis i status:
`docs/analiza-refactor-hero-odkruszenie.md`) oraz serię napraw zimnego
startu na iOS. Sesja wykonująca ten plan startuje więc z nowym stanem:

1. **Hero jest zmodularyzowane.** Inline `<script>` Hero.astro to ~220-liniowy
   orkiestrator; logika żyje w `src/components/sections/hero/`:
   `hero-config.ts` (oś scrolla; wartości POCHODNE liczone kodem),
   `platform.ts` (IS_ANDROID, MOBILE_MAX, ANDROID_DESIGN_SCALE — jedno
   źródło), `scene-vars.ts` (rejestr protokołu zmiennych CSS),
   `selectors.ts` (kontrakt selektorów + ostrzeżenia dev),
   `timeline-base.ts` / `desktop-phases.ts` / `mobile-phases.ts` /
   `caption-carousel.ts` (fazy), `device-scene.ts`, `android-mobile.ts`.
2. **Istnieje siatka regresyjna**: `scripts/verify-hero.mjs` — sweep scrolla
   × 3 profile (desktop / iPhone 14 / Pixel 7), pixel-diff vs baseline w
   `.hero-verify/` (poza gitem); wymaga PREVIEW i ma strażnika przeciw dev
   serverowi. Skill `/verify-mobile` (Etap 4) jest OTOCZKĄ na ten skrypt —
   nie pisze własnych sweepów.
3. **Część dawnych gotchas jest dziś WYMUSZONA KODEM** — reguły mają je
   wskazywać, nie dyktować wartości: skala `--k` (platform.ts), oś scrolla
   i min-height (hero-config + `heroHeightSync`), protokół zmiennych
   (scene-vars), selektory (selectors), doklejanie „za Ciebie" po fontach
   (timeline-base).
4. **Mechanizmy, których JUŻ NIE MA w kodzie** (nie przenosić do reguł ze
   starych notatek/pamięci!): `ScrollTrigger.normalizeScroll`,
   `html.is-lowpower` / revert scen (z sondy LPM został wyłącznie toast
   `LowPowerNotice.astro`), flaga `html.use-dvh` / zmienna `--vh`, loader
   bootujący, parametry debug `?flat` / `?svh` / `?dvh`.
5. Sekcja 1.4 i treści plików w Etapach 1–4 są zaktualizowane do tego stanu.
   Przy wątpliwościach źródłem prawdy jest KOD +
   `docs/analiza-refactor-hero-odkruszenie.md` (sekcje 1.2, 3, 4a).
6. **`docs/` przeszło audyt spójności (2026-07-06).** Istnieje
   `docs/README.md` — indeks statusów wszystkich analiz. Dokumenty w całości
   nieaktualne mają banner „⚠️ DOKUMENT HISTORYCZNY" (nie są źródłem
   ustaleń), częściowo nieaktualne — adnotacje ⚠️/ℹ️ przy konkretnych
   fragmentach. Wykonując ten plan, przy każdym linkowanym docu sprawdź jego
   status w indeksie. Checklista etapów w
   `hosting_second_analysis_sveltia.md` jest zsynchronizowana ze stanem
   faktycznym (etapy 1–5 i 7 wykonane; został opcjonalny Etap 6 — Stream).

---

## 1. Analiza stanu obecnego

### 1.1. Czym jest projekt

Strona-wizytówka `hadrianm.pl` (portfolio usług tworzenia stron), zbudowana
jako **statyczny Astro 6** z dwoma językami (PL pod `/`, EN pod `/en/`,
`prefixDefaultLocale: false`). Kluczowe elementy:

| Obszar | Rozwiązanie |
|---|---|
| Framework | Astro 6 (`output: "static"`), wyspy React 19 (dostępne, prawie nieużywane) |
| Styling | Tailwind 4 (via `@tailwindcss/vite`) + design tokens w `:root` (`src/styles/global.css`) |
| Animacje | GSAP 3.15 + ScrollTrigger; Lenis 1.3 (smooth scroll desktop + mobile) |
| Hero | ~5 tys. linii najbardziej dopracowanego kodu (`src/components/sections/hero/`) — scroll-driven scena urządzeń, wideo ekranów, karuzela captionów. Po refactorze „odkruszającym" (2026-07-06): zmodularyzowane (orkiestrator + 8 modułów TS), inwarianty wymuszane kodem, siatka regresyjna `scripts/verify-hero.mjs` |
| CMS | Sveltia CMS (`public/admin/`) → commituje JSON-y do `src/content/realizacje/` przez GitHub; logowanie przez Worker `sveltia-cms-auth` |
| Media | Cloudflare R2 (`media.hadrianm.pl`, bucket `hadrianm-media`) + Cloudflare Image Transformations; jedyny punkt wiedzy o rozmiarach: `src/lib/img.ts` (`imgAt()`) |
| Treść | Content Collections + walidacja Zod (`src/content.config.ts`), pola dwujęzyczne `{pl, en}` |
| Hosting | Cloudflare Pages, deploy z gałęzi `main` |
| CI | GitHub Actions: `format:check` → `lint` → `typecheck` → `build` |
| Lokalna jakość | husky (`pre-commit`: lint-staged; `commit-msg`: commitlint conventional) |
| Narzędzia dev | `scripts/capture-device-videos.mjs` (Playwright + ffmpeg + cwebp — nagrywanie MP4 ekranów urządzeń), optymalizatory obrazów (sharp) |
| Testy | Brak formalnych testów w CI; jest **siatka regresyjna hero** (`scripts/verify-hero.mjs`: pixel-diff vs baseline, 3 profile) + weryfikacja ręczna na fizycznych urządzeniach |

### 1.2. Wnioski z historii gita (84 commity)

Rozkład typów commitów: **38 feat · 13 fix · 8 docs · 7 refactor · 4 perf ·
3 ci · 2 chore · 1 style** + commity Sveltii („Create/Update/Delete
Realizacja …"). Co z tego wynika:

1. **Mobile-first perf to główna oś pracy.** Niemal wszystkie `fix`/`perf`
   dotyczą iOS/Android: Low Power Mode, decoder pauses, GPU layer limits,
   svh/dvh, notched-wheel judder. Każda zmiana w hero była iterowana na
   fizycznych urządzeniach. → Ta wiedza MUSI trafić do rules, bo jej utrata
   oznacza regresje (precedens: commit `0640aa1` scalił stałe Lenis
   desktop/touch i wywołał regresję naprawianą w `99ef97a`).
2. **Docs-first.** Duże decyzje poprzedzają pisemne analizy w `docs/`
   (20+ plików, po polsku; statusy AKTUALNY/HISTORYCZNY w indeksie
   `docs/README.md`): hosting, CMS, refaktory hero, naprawy Android.
   → Ekosystem powinien tę praktykę sformalizować (CLAUDE.md) i **linkować**
   istniejące analizy zamiast je duplikować — ale wyłącznie te ze statusem
   aktualnym.
3. **Plany etapowe z numeracją** (Etap 1–5, kroki 7.1, 8.4a…) i odhaczanie
   w dokumentach — czyli preferencja dla kontrolowanego, krokowego wdrażania.
   Ten dokument jest zbudowany tak samo.
4. **Conventional commits ze scope** (`feat(hero)`, `fix(scroll)`,
   `docs(cms)`) egzekwowane commitlintem — commity Sveltii omijają husky
   (idą przez GitHub API), co jest akceptowanym wyjątkiem.
5. **Trunk-based na `main`** (tylko 2 PR-y w historii); `main` = produkcja
   (Cloudflare Pages). → Skill `/release-check` przed wypchnięciem ma sens.
6. **Zasada twarda: commituje wyłącznie Mateusz.** Claude proponuje treść
   commita i zostawia zmiany w working tree. Dotąd trzymane tylko w
   prywatnej pamięci Claude'a → przechodzi do twardego `deny` w settings.

### 1.3. Stan ekosystemu Claude Code: zerowy + entropia

- **Brak** jakiegokolwiek `CLAUDE.md` (root i katalogowych), `.claude/rules/`,
  `.claude/skills/`, `.claude/agents/`, `.mcp.json`, współdzielonego
  `.claude/settings.json`.
- Jedyny plik: `.claude/settings.local.json` — ~250 wpisów `allow`
  nazbieranych przez pół roku sesji (jednorazowe komendy sips/ffmpeg/curl
  wymieszane z trwale przydatnymi `pnpm *`/`git *`). Plik jest lokalny
  (poza gitem), więc nowa maszyna/współpracownik startuje od zera.
- Cała wiedza operacyjna żyje w dwóch miejscach niedostępnych dla repo:
  w `docs/` (świetne, ale Claude musi *wiedzieć*, że ma tam zajrzeć) oraz
  w prywatnej pamięci Claude'a (działa tylko u Ciebie, na tej maszynie).

### 1.4. Wiedza plemienna do skodyfikowania (inwentarz gotchas)

To jest serce całego przedsięwzięcia — poniższe fakty kosztowały
najwięcej iteracji i **nie wynikają z samego kodu**:

| # | Gotcha | Dziś udokumentowane w | Trafi do |
|---|---|---|---|
| G1 | Ciężkie CSS-3D obudowy urządzeń głodzą rasteryzację GPU na Androidzie (znikające captiony/bar) — modele MUSZĄ zostać płaskie na mobile (`transform-style: flat`, bez ekstruzji/perspektywy/blur) | `docs/analiza-android-obudowy-3d-glodza-rasteryzacje.md` | `rules/hero-device-scene.md` |
| G2 | Scena projektowana w dużych design-px przekracza limit rozmiaru warstwy GPU Androida → skala projektowa MUSI zostać. WYMUSZONE KODEM: wartość tylko w `platform.ts` (`ANDROID_DESIGN_SCALE`), CSS dostaje ją przez `--android-design-scale` | `docs/naprawa-android-scena-urzadzen-mobile.md` + `platform.ts` | `rules/hero-device-scene.md` (wskaźnik) |
| G3 | iOS Low Power Mode ≠ `prefers-reduced-motion` (osobny przełącznik; blokuje autoplay, dławi CPU). Obecna obsługa: wideo gra CIĄGLE z self-heal (`android-mobile.ts`), a sonda LPM istnieje wyłącznie jako toast `LowPowerNotice.astro`. UWAGA: `normalizeScroll` i `html.is-lowpower` NIE istnieją w kodzie — stare notatki o nich są historyczne | kod + skorygowana pamięć | `rules/hero-device-scene.md` |
| G4 | iOS decoder potrafi mimowolnie pauzować wideo → oba systemy grają ciągle przez `initMobilePhase3` + pause self-heal; jedyne dopuszczalne splity Android/iOS są render-only (skala projektowa, dividery) | kod (`android-mobile.ts`) | `rules/hero-device-scene.md` |
| G5 | JEDNA METRYKA viewportu: wysokość sekcji hero MUSI być liczona z `window.innerHeight` (px, przeliczane na `refreshInit`) — tej samej metryki co triggery — NIGDY w `svh` z JS. Późny refresh (zimny cache, zwinięty toolbar iOS) rozjeżdżał odpięcie sticky o ~50% strefy telefonu. WYMUSZONE KODEM: `heroHeightSync` w Hero.astro | `docs/analiza-refactor-hero-odkruszenie.md` (4a) | `rules/hero-device-scene.md` (wskaźnik) |
| G6 | NIGDY nie scalać stałych Lenis desktop (`WHEEL_LERP=0.05`) i touch (`syncTouch`) — regresja `0640aa1`; gate przez `maxTouchPoints`, nie media queries hover/pointer | kod (`smooth-scroll.ts`) | `rules/scroll-lenis.md` |
| G7 | Pomiary geometrii sceny = snapshot → rest → pomiar → restore (nigdy „wyzeruj i zostaw"): na mobile `ignoreMobileResize` blokuje refresh, więc nadpisane zmienne NIE samonaprawiają się — urządzenia lądowały na środku ekranu. WYMUSZONE KODEM: `centerGroup` w device-scene.ts | `docs/analiza-refactor-hero-odkruszenie.md` (4a) | `rules/hero-device-scene.md` (wskaźnik) |
| G8 | Nie ponawiać zablokowanego `video.play()` co klatkę scrolla (judder na iOS LPM); widoczność elementów wejściowych bramkować timeline'em, nie bezwarunkowym set przy budowie | commit `fb7be64` + `mobile-phases.ts` | `rules/hero-device-scene.md` |
| G9 | JSON-y realizacji pisze Sveltia (własny formater) — nie edytować ręcznie, nie formatować Prettierem (są w `.prettierignore`) | `.prettierignore` + komentarze | `rules/cms-realizacje.md` + hook guard |
| G10 | Sveltia wgrywa do R2 **tylko** przez pola Image (nie przez bibliotekę Assets) i **nie kasuje** plików z R2 przy usuwaniu wpisu (osierocone pliki sprząta się ręcznie) | pamięć + `docs/cms-hosting…` | `rules/cms-realizacje.md` |
| G11 | Zmiana schematu realizacji = trzy miejsca naraz: Zod (`content.config.ts`), panel (`public/admin/config.yml`), komponenty `work/` | struktura kodu | `rules/cms-realizacje.md` |
| G12 | Capture pipeline: wymaga działającego `pnpm dev` + ffmpeg + cwebp; harness kopiowany chwilowo do `src/pages/capture.astro`; Vite potrafi rzucać 504 po świeżym typechecku; Playwright musi mieć wyłączone reduced-motion | nagłówek skryptu + pamięć | `rules/capture-scripts.md` + skill |
| G13 | Worker `sveltia-cms-auth` wdrożony ręcznie — nie aktualizuje się sam; sekrety przeżywają redeploy | `docs/optional-todos.md` | CLAUDE.md (link) |
| G14 | Fonty z zimnego cache przesuwają layout nagłówka PO zbudowaniu timeline'u → pozycje mierzone przy budowie się starzeją. WYMUSZONE KODEM: re-glue „za Ciebie" po `fonts.ready` w `timeline-base.ts` | `docs/analiza-refactor-hero-odkruszenie.md` (4a) | `rules/hero-device-scene.md` (wskaźnik) |
| G15 | Weryfikacja zmian w hero: OBOWIĄZKOWO `scripts/verify-hero.mjs` (pixel-diff vs baseline; wymaga PREVIEW — dev server daje fałszywe FAILe, jest strażnik) + fizyczne urządzenia dla obszarów, których emulacja nie pokrywa (GPU Androida, LPM, toolbar iOS, zimny cache) | `docs/analiza-refactor-hero-odkruszenie.md` (krok 0, 4a) | `rules/hero-device-scene.md` + skill `/verify-mobile` |

---

## 2. Docelowa architektura ekosystemu

### 2.1. Struktura plików (stan po Etapach 1–5)

```
hadrianm-web/
├── CLAUDE.md                          # Etap 1 — konstytucja projektu (<200 linii)
├── .mcp.json                          # Etap 5 — Playwright MCP (projektowy, w gicie)
├── .claude/
│   ├── settings.json                  # Etap 2 — permissions + hooks (w gicie, wspólne)
│   ├── settings.local.json            # istnieje — osobiste, poza gitem (zostaje)
│   ├── hooks/
│   │   ├── guard-realizacje.sh        # Etap 2 — PreToolUse: blokada edycji JSON-ów CMS (filtr ścieżki w skrypcie)
│   │   ├── format-file.sh             # Etap 2 — PostToolUse: prettier(+eslint) na edytowanym pliku
│   │   └── stop-typecheck.sh          # Etap 2 — Stop: typecheck gdy zmieniono .ts/.astro
│   ├── rules/
│   │   ├── hero-device-scene.md       # Etap 3 — paths: src/components/sections/hero/**
│   │   ├── scroll-lenis.md            # Etap 3 — paths: src/scripts/smooth-scroll.ts
│   │   ├── cms-realizacje.md          # Etap 3 — paths: content, admin, img.ts
│   │   └── capture-scripts.md         # Etap 3 — paths: scripts/**/*.{mjs,astro}
│   └── skills/
│       ├── new-realizacja/SKILL.md    # Etap 4
│       ├── capture-devices/SKILL.md   # Etap 4
│       ├── verify-mobile/SKILL.md     # Etap 4
│       └── release-check/SKILL.md     # Etap 4
└── docs/…                             # bez zmian — rules/CLAUDE.md LINKUJĄ analizy
```

### 2.2. Zasady podziału treści (żeby się nie dublowało)

| Warstwa | Co trafia | Kiedy się ładuje |
|---|---|---|
| **CLAUDE.md** (root) | Stack, komendy, konwencje, zasady twarde, mapa katalogów, mapa `docs/` | Zawsze, start sesji |
| **rules z `paths:`** | Gotchas G1–G12 przypięte do plików, których dotyczą | Leniwie — dopiero gdy Claude czyta/edytuje pasujący plik |
| **skills** | Procedury wieloetapowe uruchamiane na żądanie (`/nazwa`) | Na wywołanie |
| **hooks** | Egzekwowanie mechaniczne (format, blokady, typecheck) | Automatycznie na zdarzeniach |
| **settings permissions** | Twarde `deny` (git commit, sekrety, dist) + kuratorowany `allow` | Zawsze |
| **docs/** | Pełne analizy i uzasadnienia decyzji (jak dotąd) | Gdy rules/CLAUDE.md odeślą |

Kluczowa własność: **path-scoped rules nie zjadają kontekstu**, gdy pracujesz
nad czymś innym — wiedza o hero ładuje się tylko przy dotknięciu hero.

### 2.3. Czego świadomie NIE wdrażamy (i dlaczego)

- **Custom subagents** (`.claude/agents/`) — przy tej skali projektu skills +
  rules pokrywają potrzeby; subagenty wrócą przy white-label, jeśli pojawi
  się praca nad wieloma klientami naraz.
- **Per-katalogowe CLAUDE.md** — wybrany wariant to root + path-scoped
  rules; nested CLAUDE.md dałby to samo lazy-loading, ale rozprasza pliki
  po `src/` — rules trzymają wszystko w `.claude/rules/`.
- **Pluginy/marketplace** — nadmiarowe dla jednoosobowego zespołu; format
  plugin.json warto znać przy white-label (sekcja 9.6), ale nie teraz.

---

## Etap 1 — Root CLAUDE.md

**Cel:** każda sesja (Twoja, na innej maszynie, subagenta) startuje ze
znajomością projektu. Największy zysk najmniejszym kosztem.

**Krok 1.1.** Utwórz plik `CLAUDE.md` w katalogu głównym repo o treści:

````markdown
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

## Komendy

- `pnpm dev` — dev server (port 4321)
- `pnpm build` / `pnpm preview`
- `pnpm typecheck` — `astro check` (jedyna weryfikacja typów; brak testów)
- `pnpm lint` / `pnpm lint:fix` / `pnpm format` / `pnpm format:check`
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
  Zmiana NIE jest zweryfikowana bez `scripts/verify-hero.mjs` (pixel-diff
  vs baseline; skill `/verify-mobile`).
- `src/components/sections/work/` — Realizacje: dane z Content Collections
  (`src/content/realizacje/*.json`, schema Zod w `src/content.config.ts`).
- `src/scripts/smooth-scroll.ts` — Lenis; stałe desktop/touch są rozdzielone
  CELOWO (szczegóły w regułach).
- `src/lib/img.ts` — `imgAt()`: JEDYNE miejsce wiedzy o rozmiarach obrazów
  (Cloudflare Image Transformations; w dev pokazuje oryginały).
- `src/i18n/` — teksty UI i nawigacji; treści CMS mają pola `{pl, en}`.
- `src/styles/global.css` — design tokens w `:root` (kolory, fonty).
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
- Weryfikacja wizualna: hero → `scripts/verify-hero.mjs` (baseline w
  `.hero-verify/`; WYMAGA preview, nie dev — skrypt ma strażnika); reszta →
  headless Playwright/Chrome + screenshoty na profilach iPhone i Pixel.
  Emulacja NIE wykrywa: limitu warstwy GPU Androida, Low Power Mode,
  zwijanego toolbara iOS, zimnego cache — tam poproś Mateusza o test na
  fizycznym urządzeniu i wskaż, na co patrzeć.

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
````

**Krok 1.2.** Sprawdź rozmiar: plik ma być < 200 linii (limit adherencji wg
dokumentacji). Powyższy ma ~90 — jest zapas na przyszłe zasady.

**Krok 1.3.** Weryfikacja: nowa sesja `claude` → komenda `/context` —
CLAUDE.md powinien być widoczny w załadowanym kontekście.

---

## Etap 2 — `.claude/settings.json`: permissions + hooks

**Cel:** twarde egzekwowanie zasad (commit, sekrety, CMS) + automatyzacje
(format po edycji, typecheck na koniec tury). Jeden plik, w gicie, działa
u każdego i dla subagentów.

**Krok 2.1.** Dopisz do `.gitignore` (Claude Code sam nie gitignoruje tego
pliku):

```
# osobiste ustawienia Claude Code
.claude/settings.local.json
```

**Krok 2.2.** Utwórz `.claude/settings.json`:

```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "permissions": {
    "deny": [
      "Bash(git commit)",
      "Bash(git commit *)",
      "Bash(git push)",
      "Bash(git push *)",
      "Read(.env*)",
      "Read(**/.env*)",
      "Edit(.env*)",
      "Write(.env*)",
      "Edit(dist/**)",
      "Write(dist/**)",
      "Edit(.astro/**)",
      "Write(.astro/**)",
      "Edit(pnpm-lock.yaml)"
    ],
    "allow": [
      "Bash(pnpm install)",
      "Bash(pnpm install *)",
      "Bash(pnpm dev)",
      "Bash(pnpm dev *)",
      "Bash(pnpm build)",
      "Bash(pnpm preview)",
      "Bash(pnpm preview *)",
      "Bash(pnpm typecheck)",
      "Bash(pnpm lint)",
      "Bash(pnpm lint:fix)",
      "Bash(pnpm format)",
      "Bash(pnpm format:check)",
      "Bash(pnpm -s *)",
      "Bash(pnpm exec *)",
      "Bash(node scripts/*)",
      "Bash(npx playwright *)",
      "Bash(git status)",
      "Bash(git diff *)",
      "Bash(git log *)",
      "Bash(git show *)",
      "Bash(git branch)",
      "Bash(ls *)",
      "Bash(ffprobe *)",
      "Bash(curl -s http://localhost:*)"
    ]
  },
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "if": "Edit(src/content/realizacje/**)",
        "hooks": [
          {
            "type": "command",
            "command": "echo 'STOP: src/content/realizacje/*.json pisze Sveltia CMS (panel /admin). Reczna edycja rozjedzie formater i historie CMS. Jesli Mateusz wyraznie kazal edytowac ten plik, popros go o jednorazowe potwierdzenie.' >&2; exit 2"
          }
        ]
      },
      {
        "matcher": "Edit|Write",
        "if": "Write(src/content/realizacje/**)",
        "hooks": [
          {
            "type": "command",
            "command": "echo 'STOP: nowe wpisy realizacji tworzy sie w panelu Sveltia (/admin), nie plikami z reki.' >&2; exit 2"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/format-file.sh",
            "timeout": 60
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/stop-typecheck.sh",
            "timeout": 180
          }
        ]
      }
    ]
  }
}
```

> ⚠️ **Korekta z wdrożenia (2026-07-06):** pole `if` w hookach PreToolUse
> NIE zadziałało jak wyżej — w praktyce (Claude Code 2.1.200+) hooki z `if`
> odpalały się na KAŻDYM Edit/Write, blokując całą pracę w repo. Wdrożone
> rozwiązanie: jeden wpis PreToolUse `matcher: "Edit|Write"` wywołujący
> `.claude/hooks/guard-realizacje.sh`, który sam filtruje `file_path` ze
> stdin (case na `src/content/realizacje/`) i przy trafieniu zwraca exit 2
> z komunikatem. Źródłem prawdy jest `.claude/settings.json` w repo.

Uwagi projektowe:

- **`deny` na `git commit/push`** — pokrywa Twoją zasadę „commituję
  osobiście". `deny` scala się między plikami settings i wygrywa z każdym
  `allow` (także tym starym w `settings.local.json`, gdzie `git *` był
  dopuszczony).
- **Ochrona sekretów** zrealizowana przez `deny` w permissions (prostsze i
  pewniejsze niż hook — egzekwuje harness, zero kodu).
- **Guard CMS przez hook**, nie `deny` — bo hook zwraca **czytelny powód**,
  dzięki któremu Claude wie, co zamiast tego zrobić (panel `/admin`).
- ~~Pole `if` w hooku używa składni reguł permissions (wymaga Claude Code
  ≥ 2.1.85 — masz nowszy).~~ ⚠️ Patrz korekta wyżej — `if` porzucone na
  rzecz filtra w skrypcie guard.

**Krok 2.3.** Utwórz `.claude/hooks/format-file.sh`:

```bash
#!/bin/bash
# PostToolUse(Edit|Write): auto-format pliku edytowanego przez Claude.
# Prettier respektuje .prettierignore (docs/, JSON-y CMS zostaną pominięte).
set -u
file=$(jq -r '.tool_input.file_path // empty')
[ -z "$file" ] && exit 0
cd "$CLAUDE_PROJECT_DIR" || exit 0

case "$file" in
  *.astro|*.ts|*.tsx|*.js|*.jsx|*.mjs)
    pnpm exec prettier --write --ignore-unknown "$file" >/dev/null 2>&1
    pnpm exec eslint --fix "$file" >/dev/null 2>&1
    ;;
  *.json|*.css|*.md|*.mdx)
    pnpm exec prettier --write --ignore-unknown "$file" >/dev/null 2>&1
    ;;
esac
exit 0
```

**Krok 2.4.** Utwórz `.claude/hooks/stop-typecheck.sh`:

```bash
#!/bin/bash
# Stop: odpal typecheck, gdy w working tree sa zmienione pliki .ts/.tsx/.astro.
# Exit 2 = zablokuj zakonczenie tury i kaz Claude'owi naprawic bledy.
set -u
input=$(cat)

# Zabezpieczenie przed petla: jesli tura juz trwa z powodu tego hooka — przepusc.
echo "$input" | jq -e '.stop_hook_active == true' >/dev/null 2>&1 && exit 0

cd "$CLAUDE_PROJECT_DIR" || exit 0
git diff --name-only HEAD 2>/dev/null | grep -qE '\.(ts|tsx|astro)$' || exit 0

out=$(pnpm -s typecheck 2>&1)
if [ $? -ne 0 ]; then
  {
    echo "pnpm typecheck nie przechodzi — napraw przed zakonczeniem tury:"
    echo "$out" | tail -40
  } >&2
  exit 2
fi
exit 0
```

**Krok 2.5.** Nadaj prawa wykonania i sprawdź działanie:

```bash
chmod +x .claude/hooks/format-file.sh .claude/hooks/stop-typecheck.sh
```

Test: nowa sesja → poproś Claude'a o (a) `git commit` → ma zostać odmówione
przez permissions; (b) edycję `src/content/realizacje/aura.json` → hook ma
zablokować z komunikatem; (c) drobną edycję `.ts` z celowym błędem typu →
Stop hook ma wymusić naprawę.

**Uwaga o koszcie:** Stop hook dodaje 10–30 s (astro check) na koniec tur,
w których zmieniano pliki TS/Astro. Jeśli zacznie uwierać, usuń blok `Stop`
— CI nadal łapie błędy.

**Krok 2.6 (higiena, opcjonalny).** `settings.local.json` zostaje (osobiste
odchyłki), ale możesz go wyczyścić do pustego `{"permissions":{"allow":[]}}`
— trwałe uprawnienia przejęła wersja projektowa i lista przestanie puchnąć
bez kontroli.

---

## Etap 3 — Rules: kodyfikacja wiedzy o hotspotach

**Cel:** gotchas G1–G12 przypięte do plików, których dotyczą. Ładują się
leniwie — tylko gdy sesja dotyka pasującego pliku. Format: markdown z
frontmatterem `paths:` (globy).

**Krok 3.1.** Utwórz `.claude/rules/hero-device-scene.md`:

````markdown
---
paths:
  - "src/components/sections/hero/**"
---

# Hero / scena urządzeń — reguły krytyczne

Najbardziej wrażliwy kod w repo. Każda zasada = naprawiona kosztowna
regresja — NIE cofaj ich „przy okazji" refaktorów. Mapa modułów i pełna
historia: `docs/analiza-refactor-hero-odkruszenie.md`.

## Jedno źródło prawdy (inwarianty wymuszane kodem — nie duplikuj wartości)

- Oś scrolla (fazy, strefy, długości): `hero-config.ts`. Wartości POCHODNE
  (`CAP_END`, `*_MIN_HEIGHT_SVH`) liczy kod — nigdy nie wpisuj wyników
  ręcznie do CSS/komentarzy (svh w CSS to tylko fallback przed hydracją).
- Platforma: `platform.ts` (`IS_ANDROID`, `MOBILE_MAX` — literały 760/761
  w media queries CSS mają komentarze „zmieniaj razem",
  `ANDROID_DESIGN_SCALE` — CSS dostaje ją przez `--android-design-scale`).
- Protokół zmiennych CSS sceny (`--sl-*`, `--apart-*`, `--vid-scale`…):
  rejestr `scene-vars.ts`; wartości spoczynkowe = defaulty w CSS
  DeviceScene.astro. Nowa zmienna → dopisz do rejestru, cleanupy pokryją.
- Selektory międzyplikowe: `selectors.ts` (SEL) — zmiana klasy w markupie =
  zmiana jednej stałej; brak węzła loguje ostrzeżenie w dev.

## Metryki viewportu (iOS/Android — NAJCZĘSTSZE źródło regresji)

- Wysokość sekcji hero i triggery ScrollTriggera MUSZĄ dzielić JEDNĄ
  metrykę: px z `window.innerHeight`, przeliczane w `refreshInit`
  (`heroHeightSync` w Hero.astro). NIGDY `svh` z JS — późny refresh
  (zimny cache → `window.load` po zwinięciu toolbara iOS) rozjeżdżał
  odpięcie sticky o pół strefy telefonu.
- Pomiary geometrii sceny: snapshot → rest → pomiar → restore (wzorzec w
  `centerGroup`, device-scene.ts). Na mobile `ignoreMobileResize` blokuje
  refresh, więc nadpisane zmienne NIE samonaprawiają się.
- Widoczność elementów wejściowych bramkuj TIMELINE'em
  (`tl.set(..., START)`), nie bezwarunkowym `gsap.set` przy budowie.
- Pozycje mierzone przy budowie starzeją się po doładowaniu fontów —
  wzorzec re-glue po `document.fonts.ready` jest w `buildBase`
  (timeline-base.ts); nie wymuszaj tam globalnego `ScrollTrigger.refresh()`.

## Architektura render (Android/iOS)

- Obudowy urządzeń na mobile są PŁASKIE (`transform-style: flat`, bez
  ekstruzji/perspektywy/blur). Ciężkie CSS-3D głodziło rasteryzację GPU na
  Androidzie → znikające captiony i progress bar. Analiza:
  `docs/analiza-android-obudowy-3d-glodza-rasteryzacje.md`.
- Skala projektowa na Androidzie MUSI zostać (limit rozmiaru warstwy GPU —
  obcinany spód telefonu); `fit()` kompensuje. Spec:
  `docs/naprawa-android-scena-urzadzen-mobile.md`.
- Jedyne dopuszczalne rozjazdy Android vs iOS są RENDER-ONLY (skala
  projektowa, dividery). Logika odtwarzania wideo jest wspólna i MA zostać.

## Wideo ekranów (mobile)

- Oba systemy grają wideo CIĄGLE przez `initMobilePhase3` + self-heal na
  mimowolne pauzy dekodera iOS. Czerwone odcinki paska = czysto wizualne.
- NIGDY nie ponawiaj zablokowanego `video.play()` co klatkę scrolla.
- iOS Low Power Mode ≠ `prefers-reduced-motion` (osobny przełącznik);
  jedyna obsługa LPM to toast `LowPowerNotice.astro`. UWAGA: mechanizmy
  `normalizeScroll` / `html.is-lowpower` / `--vh` / `use-dvh` / loader /
  `?flat` NIE istnieją w kodzie — jeśli stara notatka je nakazuje, jest
  nieaktualna.

## Sekwencja captionów (desktop)

- Karuzela: faza A (swap) → faza B (center-pinned scroll); koniec
  zsynchronizowany z `doghouse.webp` przez `DOG_SITE_PROGRESS` w
  hero-config.ts (`CAP_END` = pochodna — zmieniasz próg, reszta się liczy).

## Weryfikacja (obowiązkowa dla KAŻDEJ zmiany w tym katalogu)

1. `scripts/verify-hero.mjs` vs baseline (skill `/verify-mobile`) — wymaga
   PREVIEW, nie dev (skrypt ma strażnika); zamierzona zmiana wyglądu =
   nowy baseline (`--baseline`) po akceptacji.
2. Emulacja NIE pokrywa: limitu warstwy GPU Androida, LPM, zwijanego
   toolbara iOS, zimnego cache (czyszczenie danych przeglądania) — przy
   zmianach w tych obszarach poproś Mateusza o test na fizycznych
   urządzeniach (tabela: `docs/analiza-refactor-hero-odkruszenie.md` §4).
3. Po zmianach w `LaptopSite`/`PhoneSite` — regeneracja wideo:
   `/capture-devices`.
````

**Krok 3.2.** Utwórz `.claude/rules/scroll-lenis.md`:

````markdown
---
paths:
  - "src/scripts/smooth-scroll.ts"
  - "src/layouts/BaseLayout.astro"
---

# Smooth scroll (Lenis) — reguły

- Stałe desktop (`WHEEL_LERP = 0.05` — fix na skokowe rolki z zapadkami)
  i touch (`syncTouch`, `SYNC_TOUCH_LERP`, `TOUCH_INERTIA_EXPONENT`) są
  rozdzielone CELOWO. Scalenie ich wywołało regresję (commit `0640aa1`,
  naprawa `99ef97a`). NIE ujednolicaj.
- Detekcja dotyku: `navigator.maxTouchPoints > 0` — NIE media queries
  `hover`/`pointer` (laptopy z dotykiem kłamią).
- Lenis ładowany tylko przy `prefers-reduced-motion: no-preference`
  (bramka w `BaseLayout`); instancja wystawiona jako `window.__lenis`
  (używa jej navbar do `scrollTo`).
- Każda zmiana stałych = test na fizycznym macOS (gładkie kółko), myszy
  z zapadkami i telefonie (wybieg po machnięciu).
````

**Krok 3.3.** Utwórz `.claude/rules/cms-realizacje.md`:

````markdown
---
paths:
  - "src/content/**"
  - "src/content.config.ts"
  - "public/admin/**"
  - "src/lib/img.ts"
  - "src/components/sections/work/**"
---

# CMS (Sveltia) + Realizacje + media R2 — reguły

## Własność plików

- `src/content/realizacje/*.json` pisze WYŁĄCZNIE Sveltia (panel `/admin`,
  commituje przez GitHub API na `main`, omijając husky). Ręczna edycja
  zabroniona (jest hook-guard); pliki są w `.prettierignore` — Sveltia ma
  własny formater (tablice zawsze wielolinijkowe).

## Schemat danych — zmiana w TRZECH miejscach naraz

1. Zod: `src/content.config.ts` (waliduje w buildzie),
2. panel: `public/admin/config.yml` (definicje pól, tłumaczenia PL/EN
   przez obiekty `{pl, en}`),
3. konsumenci: `src/components/sections/work/*`.
   Niespójność = build przechodzi lokalnie, a wpis z panelu wybucha w CI.

## Media (Cloudflare R2)

- Bucket `hadrianm-media`, domena publiczna `https://media.hadrianm.pl`,
  prefix `realizacje/`. Zdjęcia NIE trafiają do repo.
- Sveltia wgrywa do R2 TYLKO przez pola Image (nie przez bibliotekę
  Assets) i NIE kasuje plików z R2 przy usuwaniu wpisu — osierocone pliki
  trzeba sprzątać ręcznie w dashboardzie R2.
- Rozmiary obrazów: wyłącznie przez `imgAt()` (`src/lib/img.ts`) —
  Cloudflare Image Transformations (`/cdn-cgi/image/...`). W dev endpoint
  nie istnieje → funkcja zwraca oryginał; NIE debuguj „złych rozmiarów"
  lokalnie.
- Tagi: max 3 na język (pilnuje Zod i UI) — nie zwiększaj bez zmiany UI.

## Autoryzacja panelu

- Logowanie przez Worker `sveltia-cms-auth` (`base_url` w config.yml).
  Worker wdrożony ręcznie — procedura odświeżania i rotacji sekretów:
  `docs/optional-todos.md`.
````

**Krok 3.4.** Utwórz `.claude/rules/capture-scripts.md`:

> ⚠️ **Korekta z wdrożenia (2026-07-06):** glob `scripts/**` w praktyce
> ładował regułę także przy plikach z `src/scripts/` (wbrew dokumentacji,
> wg której wzorce kotwiczą się w root projektu). Wdrożone `paths:` to
> `scripts/**/*.mjs` + `scripts/**/*.astro` — rozłączne z `src/scripts/`
> (tam są wyłącznie `.ts`) niezależnie od semantyki kotwiczenia.

````markdown
---
paths:
  - "scripts/**/*.mjs"
  - "scripts/**/*.astro"
---

# Skrypty dev-only (capture / optymalizacja) — reguły

- `capture-device-videos.mjs` nagrywa MP4 ekranów urządzeń do
  `public/drewelomet/video/`. Wymaga: działający `pnpm dev` (port z
  `CAP_PORT`, domyślnie 4337), `ffmpeg`, `cwebp` (brew install ffmpeg webp).
- Skrypt kopiuje harness `scripts/capture-harness.astro` do
  `src/pages/capture.astro` NA CZAS nagrania i usuwa po — jeśli nagranie
  padnie w połowie, sprawdź czy plik nie został; nie może trafić do builda.
- Gotchas: świeżo po `pnpm typecheck` Vite potrafi zwracać 504 na moduły —
  odczekaj/zrestartuj dev server; Playwright musi mieć WYŁĄCZONE
  emulowanie `prefers-reduced-motion` (inaczej nagrywa statyczną scenę).
- Po nagraniu weryfikuj `ffprobe` (wymiary, fps, czas) i rozmiar plików —
  pipeline enkoduje dwuprzebiegowo pod twardy limit wagi.
- Preferowane wejście: skill `/capture-devices` (ma pre-checki).

## Siatka regresyjna hero (`verify-hero.mjs`)

- `--baseline` zapisuje wzorzec do `.hero-verify/baseline/` (poza gitem);
  bez flagi porównuje pixel-diffem (obrazy różnic → `.hero-verify/diff/`).
- WYMAGA preview builda: `pnpm build && pnpm preview --port 4399` +
  `BASE_URL=http://localhost:4399` (na 4321 często wisi dev server do
  testów na telefonie — skrypt wykrywa `/@vite/client` i przerwie).
- Determinizm: skrypt sam wyłącza czasowe animacje CSS i chowa piksele
  wideo (odtwarzanie sprawdza funkcjonalnie — log `paused`/`currentTime`).
- Zamierzona zmiana wyglądu hero = po akceptacji przez Mateusza nagraj
  nowy baseline.
````

**Krok 3.5.** Weryfikacja: nowa sesja → poproś o otwarcie
`src/scripts/smooth-scroll.ts` → w `/context` (lub w zachowaniu Claude'a)
reguła `scroll-lenis` powinna być aktywna; przy pracy poza hero reguły hero
nie powinny się ładować.

---

## Etap 4 — Skills: powtarzalne workflow

**Cel:** procedury, które dotąd odtwarzaliśmy z pamięci/z docs, stają się
komendami `/nazwa`. Format: `.claude/skills/<nazwa>/SKILL.md` z
frontmatterem YAML. Wszystkie cztery są też auto-wywoływalne przez model
(gdy rozpozna kontekst), poza miejscami, gdzie wskazano inaczej.

**Krok 4.1.** `.claude/skills/new-realizacja/SKILL.md`:

````markdown
---
name: new-realizacja
description: Pipeline dodania nowej realizacji do portfolio — przygotowanie zdjęć pod R2, wpis w panelu Sveltia, walidacja i weryfikacja na stronie. Użyj gdy Mateusz chce dodać/zmienić projekt w sekcji Realizacje.
argument-hint: "[nazwa-projektu]"
---

Prowadzisz proces dodania realizacji „$ARGUMENTS" (jeśli brak nazwy — zapytaj).

## 1. Zbierz materiały

Potrzebne per ekran (min. 1 ekran, typowo: home/gallery/order):
zrzut desktop + zrzut mobile. Plus: nazwa, rok, kategoria PL/EN, blurb
PL/EN, intro PL/EN, max 3 tagi na język, wyniki (metric+label), cytat
klienta (autor, rola PL/EN), zakres prac PL/EN, opcjonalnie liveUrl.

## 2. Przygotuj zdjęcia (lokalnie, PRZED uploadem)

- Ujednolić format do WebP/wysokiej jakości JPEG; sensowne wymiary źródła:
  desktop ~1920 px szer., mobile ~800 px szer. (serving robi Cloudflare
  Image Transformations przez `imgAt()` — do R2 idzie JEDEN oryginał).
- Do konwersji użyj `sharp` przez node (wzorce w `scripts/optimize-*.mjs`).
- Pliki wynikowe zostaw w katalogu wskazanym przez Mateusza (NIE w repo).

## 3. Wpis w panelu — robi Mateusz, Ty pilnujesz zasad

Przypomnij checklistę (sam NIE edytuj JSON-ów — pisze je Sveltia):
- panel: https://hadrianm.pl/admin (login przez GitHub);
- zdjęcia wgrywać WYŁĄCZNIE przez pola Image (upload przez bibliotekę
  Assets NIE trafia do R2!);
- slug małymi literami, bez spacji (idzie do URL i nazwy pliku);
- „Kolejność": mniejsze = wyżej na liście.

## 4. Po zapisaniu wpisu (Sveltia commituje na main)

```!
git log --oneline -3
```

- `git pull`, potem `pnpm build` — Zod zwaliduje wpis; błędy schematu
  wyjaśnij i wskaż pole do poprawy W PANELU.
- Sprawdź na dev/preview: kafelek na liście, modal desktop, bottom sheet
  mobile (PL i EN).
- Przy USUWANIU realizacji przypomnij: Sveltia nie kasuje plików z R2 —
  osierocone obrazy sprząta się ręcznie w dashboardzie R2.
````

**Krok 4.2.** `.claude/skills/capture-devices/SKILL.md`:

````markdown
---
name: capture-devices
description: Regeneracja nagrań MP4 ekranów urządzeń w hero (laptop + telefon) przez scripts/capture-device-videos.mjs, z pre-checkami środowiska i weryfikacją wyniku. Użyj po zmianach w LaptopSite/PhoneSite lub gdy wideo w hero jest nieaktualne.
---

## Pre-checki (wszystkie muszą przejść zanim odpalisz nagranie)

```!
command -v ffmpeg >/dev/null && echo "ffmpeg OK" || echo "BRAK ffmpeg (brew install ffmpeg)"
command -v cwebp >/dev/null && echo "cwebp OK" || echo "BRAK cwebp (brew install webp)"
lsof -nP -iTCP:4337 -sTCP:LISTEN || echo "dev server na 4337 NIE dziala"
```

1. Skrypt domyślnie celuje w port **4337** — uruchom `pnpm dev --port 4337`
   w tle, albo wskaż działający port przez zmienną `CAP_PORT`.
2. NIE uruchamiaj nagrania świeżo po `pnpm typecheck` — Vite potrafi
   zwracać 504 na moduły; w razie 504 zrestartuj dev server.
3. Upewnij się, że nic nie wymusza `prefers-reduced-motion` (nagrałbyś
   statyczną scenę).

## Nagranie

- Oba urządzenia: `node scripts/capture-device-videos.mjs`
- Tylko jedno: dopisz `laptop` lub `phone`; `--recapture` wymusza nowe
  klatki; `--sample` = szybka próbka tempa.
- Skrypt tymczasowo tworzy `src/pages/capture.astro` — po zakończeniu
  sprawdź, że plik ZNIKNĄŁ (gdyby proces padł: usuń ręcznie).

## Weryfikacja wyniku

```!
ls -la public/drewelomet/video/ 2>/dev/null
```

- `ffprobe` na obu MP4: wymiary, fps, czas trwania zgodne z poprzednimi;
  rozmiary plików w okolicach dotychczasowych (twardy limit wagi w enkodzie).
- Postery `.webp` odświeżone.
- Wizualnie: `/verify-mobile` albo szybki screenshot hero na mobile.
````

**Krok 4.3.** `.claude/skills/verify-mobile/SKILL.md`:

````markdown
---
name: verify-mobile
description: Weryfikacja regresyjna hero przez scripts/verify-hero.mjs — sweep scrolla × 3 profile (desktop/iPhone/Pixel), pixel-diff vs baseline. Użyj po KAŻDEJ zmianie w src/components/sections/hero/ oraz przed release.
---

Zweryfikuj hero istniejącym harnessem (NIE pisz własnych sweepów —
`scripts/verify-hero.mjs` jest siatką regresyjną z baseline'em).

## 1. Serwer — preview, NIGDY dev

```!
lsof -nP -iTCP:4321 -sTCP:LISTEN | tail -1
ls .hero-verify/baseline 2>/dev/null | head -3 || echo "BRAK BASELINE"
```

- Baseline był robiony na buildzie produkcyjnym; dev server daje fałszywe
  FAILe (skrypt wykrywa `/@vite/client` i przerwie z instrukcją).
- Na 4321 często wisi dev do testów na telefonie — nie ubijaj go bez
  pytania; użyj: `pnpm build && pnpm preview --port 4399 &`, potem
  `BASE_URL=http://localhost:4399`.

## 2. Przebieg

- Porównanie: `BASE_URL=... node scripts/verify-hero.mjs` — oczekiwane
  „Zero różnic" przy zmianach behawioralnie neutralnych.
- Brak baseline'u: najpierw `--baseline` na czystym stanie (main przed
  Twoimi zmianami), potem porównanie.
- Raport skryptu obejmuje też funkcjonalny stan wideo (`x/2 gra`) i błędy
  konsoli — czytaj całość, nie tylko FAIL/OK.

## 3. Interpretacja

- FAIL → obejrzyj obraz różnic w `.hero-verify/diff/` (Read) i oceń: to
  regresja czy ZAMIERZONA zmiana wyglądu? Zamierzona → pokaż Mateuszowi
  diff, po akceptacji nagraj nowy baseline (`--baseline`).
- Emulacja NIE wykrywa: limitu warstwy GPU Androida, Low Power Mode,
  zwijanego toolbara iOS, zimnego cache. Przy zmianach w tych obszarach
  poproś Mateusza o test na fizycznych urządzeniach (co dokładnie
  sprawdzić: tabela §4 w docs/analiza-refactor-hero-odkruszenie.md).
- Nie emuluj `prefers-reduced-motion: reduce` (bramka w BaseLayout
  wyłączyłaby animacje) — chyba że celowo testujesz ścieżkę reduced.
````

**Krok 4.4.** `.claude/skills/release-check/SKILL.md`:

````markdown
---
name: release-check
description: Audyt przedwdrożeniowy — pełna bramka jakości + smoke na preview, zanim Mateusz wypchnie na main (main = produkcja na Cloudflare Pages). Użyj przed każdym push do main.
---

Przeprowadź audyt przedwdrożeniowy. NIE commituj i NIE pushuj — raport
kończy się propozycją treści commita dla Mateusza.

## 1. Stan repo

```!
git status --short
git log --oneline -5
```

## 2. Bramka jakości (identyczna z CI — kolejność jak w .github/workflows/ci.yml)

Uruchom po kolei; każdy błąd napraw albo zgłoś:
`pnpm format:check` → `pnpm lint` → `pnpm typecheck` → `pnpm build`.

## 3. Smoke na preview

Uruchom `pnpm preview` i sprawdź:
- `/` i `/en/` odpowiadają 200 i renderują hero (curl + screenshot);
- `robots.txt` blokuje `/admin`; `sitemap-index.xml` istnieje w dist;
- meta OG (`og-image.png`, tytuły PL/EN) obecne w HTML;
- brak odwołań do `localhost`/portów dev w dist (grep);
- jeśli zmieniano hero: `/verify-mobile` (harness `scripts/verify-hero.mjs`
  vs baseline) — obowiązkowo.

## 4. Raport

Podsumuj: wyniki bramki, wyniki smoke, ryzyka. Na końcu zaproponuj treść
commita (conventional, ze scope). Przypomnij, że po push na main deploy
robi Cloudflare Pages automatycznie i warto klik-sprawdzić produkcję
(hadrianm.pl + /admin) po ~2 min.
````

**Krok 4.5.** Weryfikacja: nowa sesja → `/new-realizacja`, `/capture-devices`,
`/verify-mobile`, `/release-check` widoczne w autouzupełnianiu; wywołaj
`/release-check` na czystym repo — powinien przejść całą bramkę.

---

## Etap 5 — MCP

**Cel:** interaktywna weryfikacja w przeglądarce (Playwright MCP) bez
pisania jednorazowych skryptów — Claude może sam klikać/scrollować i
oglądać stronę. Lekki wariant zgodnie z decyzją.

**Krok 5.1.** Utwórz `.mcp.json` w root repo (plik idzie do gita —
projektowy zakres; przy pierwszym użyciu Claude Code poprosi Cię o
zatwierdzenie serwera):

```json
{
  "mcpServers": {
    "playwright": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest"]
    }
  }
}
```

**Krok 5.2 (opcjonalnie, później).** Cloudflare utrzymuje oficjalne zdalne
serwery MCP (repo `cloudflare/mcp-server-cloudflare`) — m.in. do Workers/
R2/analytics. Wart rozważenia dopiero przy white-label (provisioning wielu
klientów); wtedy dodać analogiczny wpis wg README tego repo.

**Uwaga:** Context7 masz już podpięty globalnie (dokumentacja bibliotek) —
nie duplikować w projekcie.

---

## Etap 6 (propozycja) — minimalne testy Playwright

Zgodnie z decyzją: **tylko zarys, bez szczegółowej rozpiski** — do
osobnej sesji, gdy uznasz za priorytet.

Fundament już istnieje: `scripts/verify-hero.mjs` (pixel-diff regresyjny
hero, uruchamiany ręcznie/skillem) oraz wydzielona czysta arytmetyka
karuzeli (`caption-carousel.ts: render(u)`) gotowa pod testy jednostkowe.
Proponowany zakres minimum (3–5 testów, `@playwright/test`):
render PL/EN (status + widoczny H1), otwarcie modala realizacji (desktop)
i bottom sheet (mobile profile), przejście przez fazy scrolla hero bez
błędów konsoli; opcjonalnie job CI odpalający verify-hero na preview.
Zysk: `/release-check` dostaje obiektywną podstawę, CI łapie regresje
renderu, a white-label dziedziczy siatkę bezpieczeństwa. Koszt: +1 job
w CI (~2–3 min), utrzymanie selektorów (ułatwione: kontrakt w
`selectors.ts`). Kiedy wrócić: przy pierwszym prawdziwym kliencie.

---

## Etap 7 — White-label: template repo + skille inicjujące

**Cel:** z hadrianm-web powstaje **`site-template`** (GitHub template repo):
odchudzony rdzeń + moduły opt-in + kompletny `.claude/`, tak by nowa strona
klienta startowała w kilku krokach z działającym ekosystemem Claude Code.

Architektura docelowa procesu:

```
site-template (GitHub template)
   │  "Use this template" → repo klient-x
   ▼
claude → /init-client "Nazwa Klienta" klientx.pl     # podmiana placeholderów
       → /provision-client                            # runbook Cloudflare/GitHub/DNS
       → normalna praca (rules/skills już działają)
```

### 7.1. Inwentaryzacja brandu (co jest „hadrianm-specific")

Kompletna lista miejsc do parametryzacji — to jest checklista ekstrakcji:

| Miejsce | Co zawiera | Strategia w template |
|---|---|---|
| `astro.config.mjs` | `site: "https://hadrianm.pl"` | placeholder `{{SITE_URL}}` |
| `package.json` | `name: hadrianm-web` | `{{PROJECT_NAME}}` |
| `src/styles/global.css` | design tokens `:root` (kolory, fonty) | zostają jako **motyw domyślny**; `/init-client` pyta o paletę i podmienia wartości tokenów (struktura tokenów = kontrakt, nie zmienia się) |
| Fonty (`@fontsource/*`) | Archivo/Instrument Serif/Saira/Space Mono | zostają domyślne; wymiana = świadoma decyzja per klient |
| `src/i18n/*` + treści sekcji | teksty hadrianm | wyczyszczone do neutralnych placeholderów lorem-brief |
| `public/` | favicon set, OG image, manifest | generowane przez `/init-client` (skrypt render ikon — wzorzec masz w historii: commit `f61b18b`) |
| `public/admin/config.yml` | repo, branch, `base_url` Workera, `account_id`, `access_key_id`, bucket, `public_url` | `{{GITHUB_REPO}}`, `{{OAUTH_WORKER_URL}}`, `{{R2_ACCOUNT_ID}}`, `{{R2_ACCESS_KEY_ID}}`, `{{R2_BUCKET}}`, `{{MEDIA_URL}}` |
| `src/content/realizacje/` | realne projekty | 1 wpis przykładowy `_example.json` + obrazy placeholder |
| `docs/` | analizy osobiste hadrianm | NIE wchodzą do template (zostaje tylko `docs/README-template.md` z opisem architektury) |
| `public/drewelomet/**`, hero device-scene | showcase konkretnego projektu | **moduł opt-in** (patrz 7.3) |
| `docs/testing-data`, `.idea`, screenshots | osobiste | nie wchodzą |

### 7.2. Kroki utworzenia template repo

1. **(w hadrianm-web, przygotowanie)** Rozszerz `src/config/site.ts` o
   pełny obiekt konfiguracyjny (nazwa, domena, e-mail kontaktowy, socials)
   i podmień twarde wystąpienia w komponentach na importy z niego. To
   jedyny refactor przygotowawczy — zmniejsza liczbę placeholderów w
   template do minimum i **zostaje wartością także dla hadrianm-web**.
2. Utwórz nowe repo `site-template` (prywatne), skopiuj working tree
   hadrianm-web (bez `.git`, `node_modules`, `dist`, `.astro`).
3. Wykonaj cięcia z tabeli 7.1 (usuń docs/analizy, testing-data,
   realizacje→przykład, drewelomet→moduł).
4. Wstaw placeholdery `{{...}}` wg tabeli. Konwencja: **wyłącznie**
   w plikach konfiguracyjnych (astro.config, package.json, admin/config.yml,
   site.ts) — nigdy w środku komponentów.
5. Przenieś `.claude/` w całości, z korektami z 7.4.
6. `pnpm install && pnpm build` musi przechodzić **z placeholderami**
   (placeholdery tylko w stringach konfiguracyjnych — build się nie
   wywróci; jeśli się wywraca, przenieś wartość do site.ts).
7. GitHub → Settings → zaznacz **Template repository**.
8. Otaguj wersję (`template-v1`) — przyda się przy synchronizacji ulepszeń.

### 7.3. Moduły opt-in

Rdzeń template'u zawiera: layout + navbar + sekcje-placeholdery + Work/CMS +
i18n + smooth-scroll + CI + husky + `.claude/`. Moduły ponad rdzeń:

| Moduł | Pliki źródłowe (w hadrianm-web) | Kiedy włączać |
|---|---|---|
| **hero-device-scene** | cały `src/components/sections/hero/` (orkiestrator Hero.astro + moduły: hero-config, platform, scene-vars, selectors, timeline-base, desktop/mobile-phases, caption-carousel, device-scene, android-mobile, LaptopSite/PhoneSite), `scripts/capture-*.{mjs,astro}`, `scripts/verify-hero.mjs` + `scripts/verify-mobile-videos.mjs`, assety showcase, rules `hero-device-scene.md` + `capture-scripts.md`, skille `capture-devices` + `verify-mobile` | klient płaci za stronę z animowanym showcase |
| **ambient-bg** | `src/components/backgrounds/*`, `src/scripts/bg-crossfade.ts`, `scripts/capture-ambient-bg.mjs` | strony z animowanym tłem |
| **simple-hero** (do napisania) | prosta wersja hero bez sceny urządzeń — domyślna w template | zawsze (rdzeń) |

Realizacja: w template katalog `modules/<nazwa>/` przechowuje pliki modułu
w strukturze docelowej + `MANIFEST.md` (lista plików i miejsc wpięcia).
Włączenie modułu = skopiowanie plików wg manifestu (robi to skill, patrz
7.5). **Reguły `.claude/rules/` modułu podróżują razem z nim** — po
włączeniu modułu wiedza o gotchas jest od razu na miejscu.

### 7.4. `.claude/` w template — różnice względem hadrianm-web

- `CLAUDE.md`: sekcja „Zasady twarde" i „Konwencje" bez zmian; mapa
  projektu bez hero-sceny (dochodzi z modułem); dopisany blok:

  ```markdown
  ## Status inicjalizacji

  - [ ] Ten projekt powstał z site-template. Jeśli widzisz placeholdery
    {{...}} w konfiguracji — NAJPIERW uruchom /init-client.
  ```

- rules: `cms-realizacje.md` i `scroll-lenis.md` w rdzeniu; hero/capture
  w module.
- skills: `new-realizacja` i `release-check` w rdzeniu (uniwersalne);
  `capture-devices`/`verify-mobile` w module; dochodzą dwa nowe (7.5, 7.6).
- settings.json: identyczny (deny commit/push/sekrety, hooki formatu,
  guard CMS, stop-typecheck — wszystko przenośne bez zmian).

### 7.5. Skill `/init-client` (tylko w template)

`.claude/skills/init-client/SKILL.md`:

````markdown
---
name: init-client
description: Jednorazowa inicjalizacja nowego projektu klienta utworzonego z site-template — podmiana placeholderów, brand, ikony, moduły. Uruchamiać jako pierwszą komendę w świeżym repo.
disable-model-invocation: true
argument-hint: "[nazwa-klienta] [domena.pl]"
arguments: [client_name, domain]
---

Inicjalizujesz projekt dla klienta „$client_name" (domena: $domain).
Jeśli argumentów brakuje — zapytaj. NIE commituj — na końcu zostawiasz
working tree do przejrzenia.

## 1. Zbierz brief (zapytaj o wszystko naraz)

- paleta: kolor akcentu + tło (albo „zostaw domyślne");
- języki: PL-only czy PL+EN;
- moduły: hero-device-scene? ambient-bg? (opisz koszty utrzymania);
- e-mail kontaktowy i socials;
- nazwa repo GitHub (proponuj: `<slug-klienta>-web`).

## 2. Podmień placeholdery

```!
grep -rn "{{" --include="*.{mjs,json,yml,ts}" . | grep -v node_modules | head -30
```

- `{{PROJECT_NAME}}` (package.json), `{{SITE_URL}}` (astro.config),
  `{{GITHUB_REPO}}`/`{{OAUTH_WORKER_URL}}`/`{{R2_*}}`/`{{MEDIA_URL}}`
  (public/admin/config.yml — wartości z /provision-client; jeśli
  infrastruktura jeszcze nie istnieje, wpisz TODO-markery i powiedz
  o tym wprost),
- `src/config/site.ts` — pełne dane klienta.
- Weryfikacja: grep z pkt. 2 nie zwraca już nic poza TODO.

## 3. Brand

- Tokeny w `src/styles/global.css` (`:root`) — podmień wartości kolorów
  wg palety; NIE zmieniaj nazw zmiennych.
- Ikony/OG: wygeneruj favicon set i og-image z inicjałów/logo klienta
  (sharp; komplet: favicon.svg/.ico, icon-192/512, apple-touch-icon,
  og-image.png, site.webmanifest).
- i18n: jeśli PL-only — usuń `src/pages/en/` i wpisy EN z configu i18n.

## 4. Moduły (jeśli wybrano)

Dla każdego modułu: skopiuj pliki wg `modules/<nazwa>/MANIFEST.md`
(zawiera też rules i skille modułu), potem `pnpm typecheck`.

## 5. Finał

- `pnpm install && pnpm build` — musi przejść;
- usuń katalog `modules/` (niewykorzystane moduły są w template),
- zaktualizuj CLAUDE.md: odhacz „Status inicjalizacji", wpisz nazwę
  klienta do nagłówka;
- raport: co podmieniono, co zostało TODO (czeka na /provision-client),
  proponowana treść pierwszego commita.
````

### 7.6. Skill `/provision-client` (runbook infrastruktury)

Prowadzi przez czynności, których NIE da się zrobić z repo (dashboardy
Cloudflare/GitHub/rejestrator) — Claude pilnuje kolejności i weryfikuje
efekty (`dig`, `curl`), Ty klikasz. `.claude/skills/provision-client/SKILL.md`:

````markdown
---
name: provision-client
description: Runbook provisioningu infrastruktury nowego klienta — GitHub repo, Cloudflare Pages, R2, transformacje obrazów, Worker auth CMS, DNS, e-mail. Prowadzi krok po kroku i weryfikuje efekty; sam nie wykonuje operacji w dashboardach.
disable-model-invocation: true
---

Prowadź Mateusza przez provisioning klienta (dane z src/config/site.ts;
brakujące — dopytaj). Po każdym kroku ZWERYFIKUJ efekt zanim przejdziesz
dalej. Wzorcem jest wdrożenie hadrianm.pl (Etapy 1–5 + 8.x w
docs/hosting_second_analysis_sveltia.md tego projektu-matki).

## Kolejność (każdy krok = sekcja rozmowy)

1. **Repo GitHub** — utworzone z template? branch main, dostęp write dla
   edytorów treści klienta (Sveltia wymaga write przez GitHub OAuth).
2. **Cloudflare Pages** — nowy projekt z repo klienta; build:
   `pnpm build`, output `dist`; zmienna `NODE_VERSION` wg .nvmrc.
   Weryfikacja: `curl -s -o /dev/null -w "%{http_code}" https://<projekt>.pages.dev`.
3. **Domena** — DNS na Cloudflare (strefa klienta), custom domain w Pages.
   Weryfikacja: `dig +short <domena>`, curl 200 po propagacji.
4. **R2** — bucket `<slug>-media` (jurysdykcja EU), custom domain
   `media.<domena>`, klucz API (Access Key ID do config.yml; Secret
   podaje się w panelu Sveltia przy pierwszym uploadzie — NIE zapisuj go
   w repo). WŁĄCZ Image Transformations dla strefy (obie orientacje
   rozmiarów muszą działać — sprawdź URL /cdn-cgi/image/... na próbnym
   pliku).
5. **Auth CMS** — do ALLOWED_DOMAINS istniejącego Workera sveltia-cms-auth
   dopisz domenę klienta (konkretną, NIGDY wildcard *.pages.dev).
   Alternatywa przy rozdzielaniu klientów: osobny Worker + osobna GitHub
   OAuth App per klient. Weryfikacja: login na https://<domena>/admin.
6. **E-mail** (opcjonalnie) — skrzynka u rejestratora (wzorzec OVH/Zimbra:
   docs/mailbox_setup.md projektu-matki); rekordy MX/SPF/DKIM/DMARC —
   weryfikacja przez `dig`.
7. **Smoke końcowy** — /release-check na repo klienta + test wpisu w CMS
   (dodaj/usuń wpis testowy; pamiętaj o sprzątnięciu obrazów w R2).

## Raport końcowy

Tabela: krok / status / dowód weryfikacji. Wypisz sekrety-do-schowania
(menedżer haseł) i wpisy do docs/optional-todos.md klienta (rotacje,
odświeżanie Workera).
````

### 7.7. Synchronizacja ulepszeń (hadrianm-web ↔ template)

- hadrianm-web pozostaje „projektem-matką": ulepszenia rdzenia (nowe
  reguły, poprawki skilli, fixy komponentów wspólnych) przenoś do template
  świadomie, commit po commicie (`git cherry-pick` lub ręcznie), taguj
  template po każdej porcji (`template-v2`, …).
- Istniejące projekty klientów NIE są automatycznie aktualizowane —
  template to punkt startu, nie zależność. Krytyczne fixy przenosisz
  do klientów wybiórczo.
- Prowadź `CHANGELOG.md` w template — przy każdym nowym kliencie od razu
  widać, co dostaje.

---

## 10. Kolejność wdrożenia i utrzymanie

### 10.1. Harmonogram (optymalna kolejność)

| Etap | Zakres | Czas | Zależy od | Zysk |
|---|---|---|---|---|
| 1 | Root CLAUDE.md | ~15 min | — | każda sesja zna projekt i zasady |
| 2 | settings.json + hooki | ~30 min | — | twarde guardy (commit/sekrety/CMS), auto-format, typecheck |
| 3 | 4 pliki rules | ~45 min | Etap 1 (linki) | gotchas przestają zależeć od pamięci |
| 4 | 4 skille | ~1 h | Etapy 1–3 | powtarzalne workflow jako komendy |
| 5 | .mcp.json (Playwright) | ~10 min | — | interaktywna weryfikacja w przeglądarce |
| 6 | (propozycja) testy Playwright | osobna sesja | — | obiektywna siatka bezpieczeństwa |
| 7 | white-label: refactor site.ts → template repo → /init-client + /provision-client → moduły | 2–4 sesje | Etapy 1–5 **ukończone i przetestowane** | nowa strona klienta w godziny, nie dni |

Uzasadnienie kolejności: najpierw wiedza zawsze-dostępna (1), potem
bezpieczeństwo i automaty (2), potem wiedza warunkowa (3), procedury (4)
i narzędzia (5). White-label (7) celowo ostatni — template ma dziedziczyć
**przetestowany** ekosystem, nie prototyp; każdy tydzień pracy z Etapami
1–5 w hadrianm-web to darmowe QA dla template'u.

Etapy 1+2 można wdrożyć w jednej sesji („fundament"), 3+4 w następnej
(„wiedza i procedury").

### 10.2. Utrzymanie ekosystemu

- **Nowa gotcha odkryta w sesji** → od razu dopisz do właściwego pliku
  rules (a nie tylko do pamięci Claude'a); jeśli dotyczy wszystkiego —
  do CLAUDE.md. Test: „czy Claude na cudzej maszynie by o tym wiedział?"
- **CLAUDE.md < 200 linii** — gdy puchnie, wynoś treść do path-scoped
  rules albo do `docs/` z linkiem.
- **Nowe trwałe uprawnienie** → do `settings.json` (projektowego), nie do
  local; jednorazowe zgody zostawiaj w local.
- **Rules-review przy większych refaktorach** — reguła, której plik/stała
  zniknęła z kodu, myli zamiast pomagać; aktualizuj razem z kodem (rules
  są w gicie, więc review łapie rozjazdy).
- **Nowy lub zdezaktualizowany dokument w `docs/`** → zaktualizuj indeks
  `docs/README.md`; dokument unieważniony przez nowszą decyzję dostaje
  banner „⚠️ DOKUMENT HISTORYCZNY" (konwencja z audytu 2026-07-06) —
  inaczej przyszła sesja odczyta stary plan jako obowiązujący.
- **Okresowo (raz na kwartał)**: `/context` — czy coś niepotrzebnie puchnie;
  przejrzyj `docs/optional-todos.md` (Worker auth, sekrety, R2-orphany).
- **Po wdrożeniu Etapu 7**: każde ulepszenie rdzenia w hadrianm-web od razu
  oceniaj pod kątem „czy przenieść do template?" i notuj w jego CHANGELOG.

### 10.3. Definicja ukończenia (checklista całości)

- [x] Etap 1: CLAUDE.md w repo, widoczny w `/context` (zweryfikowane 2026-07-06)
- [x] Etap 2: settings.json + 3 hooki (chmod +x; guard-realizacje.sh zamiast
      pola `if` — patrz korekta w Etapie 2), `.gitignore` z wpisami
      `settings.local.json` + `scheduled_tasks.lock`; przetestowane na żywo
      (2026-07-06, sesja + agent testowy): odmowa `git commit`, blokada
      edycji JSON-a realizacji, auto-format po Write, Stop-hook exit 2 przy
      celowym błędzie typu i exit 0 na czystym drzewie. Krok 2.6 wykonany
      (backup starego local w scratchpadzie sesji)
- [x] Etap 3: 4 rules; lazy-load POTWIERDZONY (agent testowy 2026-07-06):
      reguła nieobecna przed odczytem, wstrzyknięta system-reminderem po
      Read `smooth-scroll.ts` (scroll-lenis) i `platform.ts`
      (hero-device-scene). Korekta: glob `scripts/**` w capture-scripts.md
      łapał też `src/scripts/` (wbrew dokumentacji o kotwiczeniu w root) —
      zawężony do `scripts/**/*.{mjs,astro}` (root `scripts/` to wyłącznie
      .mjs/.astro, `src/scripts/` wyłącznie .ts)
- [x] Etap 4: 4 skille — widoczne w sesji interaktywnej (Skills 51→55 w
      `/context`); procedura `/release-check` przeszła w całości: bramka
      format/lint/typecheck/build ✓, smoke na preview :4399 ✓ (200 na
      `/` i `/en/`, robots blokuje /admin, sitemap jest, zero `localhost`
      w dist). Uwaga: skille projektowe NIE są widoczne dla subagentów —
      to zachowanie harnessu, nie błąd konfiguracji
- [x] Etap 5: `.mcp.json` — serwer playwright ładuje się w nowej sesji
      (MCP tools 25→48 w `/context`)
- [ ] Etap 6: decyzja podjęta (wdrażamy / odkładamy z datą przeglądu)
- [ ] Etap 7: site-template istnieje, oznaczony jako Template repository,
      `/init-client` + `/provision-client` przetestowane na próbnym repo
      (np. fikcyjny klient), moduł hero z manifestem
