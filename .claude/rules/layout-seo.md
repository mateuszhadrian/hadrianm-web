---
paths:
  - "src/layouts/BaseLayout.astro"
  - "src/pages/404.astro"
  - "src/styles/global.css"
  - "public/og-image.png"
  - "public/site.webmanifest"
---

# Chrome strony i SEO (BaseLayout, 404, tokeny globalne) — reguły

Kontekst decyzji: `docs/analiza-ewolucja-vs-nowsze-projekty.md` §4.7 i §6
(punkty S1–S5), paczka P6 (2026-10-22).

## Strona 404 (`src/pages/404.astro`)

- **Jeden statyczny plik** → `dist/404.html`; Cloudflare Pages serwuje go
  pod KAŻDYM nieistniejącym adresem ze statusem 404. Bez tego pliku Pages
  odpowiadał stroną główną z kodem 200 (soft-404, prod do 2026-10). NIE
  twórz `src/pages/en/404.astro` — Pages i tak użyje tylko `dist/404.html`.
- **Język po ścieżce w przeglądarce**, nie z SSR: oba warianty (razem
  z chrome'em Navbar/BackButton/Footer) są wyrenderowane w blokach
  `[data-nf-lang]`; inline skrypt PRZED blokami ustawia `html[lang]`
  (CSS chowa zły blok od pierwszego malowania), inline skrypt PO blokach
  USUWA nieaktywny blok z DOM. Usunięcie jest konieczne: skrypt Navbara
  wiąże się z pierwszym `[data-nav]`, a menu mobilne ma stałe `id` —
  dwa egzemplarze w DOM = martwy burger. Bez JS widoczny PL.
- Linki wyłącznie ABSOLUTNE od `/` (ta sama treść pod `/a/b/c/`).
- `noindex` (prop BaseLayout) = `robots noindex`, BEZ canonicala, `og:url`
  i hreflang. `@astrojs/sitemap` pomija 404 sam.
- Testy: `tests/e2e/not-found.spec.ts` (preview) + smoke `@prod-smoke`
  w `smoke.spec.ts` (status 404 na produkcji) + axe w `a11y.spec.ts`.
  `astro preview` serwuje `404.html` ze statusem 404 — testy statusu
  działają także lokalnie.

## BaseLayout — głowa dokumentu

- **Komentarze NIE w blokach `is:inline`** — Astro wysyła treść takiego
  bloku 1:1 na każdej trasie (−575 B/trasę po wyniesieniu, S3). Opis
  dawaj w `{/* … */}` NAD blokiem; `<style>`/`<style is:global>` są
  minifikowane, więc komentarzy CSS to nie dotyczy.
- `theme-color` = `#000000` = tło `body` każdej trasy (każdy `*Page.astro`
  ustawia `:global(body) { background: #000 }`, ambient też startuje od
  `#000`). Zmiana tła strony = zmiana `theme-color` + `theme_color`
  i `background_color` w `public/site.webmanifest` (trzy miejsca w parze).
- `og:image` = `public/og-image.png`, kadr **1200×630** +
  `twitter:card summary_large_image`. Wymiary w meta i w pliku pilnuje
  `tests/unit/og-image.test.ts` (czyta IHDR PNG; limit wagi 300 KB) —
  podmiana obrazu = plik + meta w jednym commicie.

## Fonty (F1, P8)

- `@font-face` WŁASNE: `src/styles/fonts.css` (Archivo, Instrument Serif
  TYLKO italic) + `src/styles/fonts-hero.css` (Saira, import w Hero).
  `latin` z plików Fontsource'a, `latin-ext` = polskie subsety
  `src/assets/fonts/*-pl.woff2` (generat `node scripts/subset-fonts.mjs`,
  commitowany). NIE importuj gotowych `index.css`/`400-italic.css`/
  `latin-ext-*.css` z pakietów — kontrakt `tests/unit/fonts-subset.test.ts`
  (także: znak latin-ext spoza `SUBSET_CHARS` w treści = FAIL → dopisz
  i przegeneruj). Deskryptory 1:1 z arkuszy Fontsource'a, które były
  importowane (Saira `latin-ext` w `fonts-hero.css` bez `unicode-range`,
  jak dawny `latin-ext-600.css`). Zmiana ładowania fontów potrafi
  przesunąć timingowo wrażliwe klatki hero (ekran telefonu 05–09) —
  lokalny preview tego nie pokaże, weryfikacja na CI.
- Preloady w BaseLayout wskazują TE SAME pliki co `@font-face` (subsety);
  `assetsInlineLimit` = `false` dla `.woff2` w `astro.config.mjs` (subsety
  < 4 KB inaczej lądują jako `data:` w CSS blokującym render).
- `pnpm add` przelicza pływający zakres `@paulirish/trace_engine`
  (Lighthouse) — po dodaniu zależności sprawdź diff lockfile'a pod kątem
  `third-party-web`/`legacy-javascript` i cofnij przy-okazyjne podbicie.

## global.css

- `:root { color-scheme: dark }` — strona jest wyłącznie ciemna; kontrolki
  natywne (pola formularza, scrollbary) w wariancie ciemnym, bez
  auto-darkeningu Chrome Android. NIE dodawaj wariantu `light`.
- `html { text-size-adjust: none }` (z prefiksem `-webkit-`) nadpisuje
  preflight Tailwinda (`100%`) — bez auto-powiększania tekstu w iOS Safari
  w poziomie i WebView Androida. Pinch-zoom działa dalej.
