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
