---
paths:
  - "src/content/**"
  - "src/content.schema.ts"
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
- NIGDY `git add .` / `git add -A` — zawsze jawne ścieżki. Nazwy plików
  wpisów są wymuszane jako ASCII (`slug: {encoding, clean_accents}` w
  `config.yml`), ale starsze pliki lub slug wklejony w formie NFD mogą
  pokazać się na macOS jako „ten sam plik dwa razy" — `git add .` zrobiłby
  z tego duplikat na Linuksie i wywrócił test unikalności slugów.

- `tests/fixtures/realizacje/*.json` to NASZE pliki (zamrożony zestaw pod
  testy wizualne, `pnpm build:visual`) — Sveltia ich nie dotyka, hook-guard
  ich nie blokuje, Prettier je formatuje. Nie synchronizuj ich z panelem
  (reguła: `testing.md`).

## Schemat danych — zmiana w TRZECH miejscach naraz

1. Zod: `src/content.schema.ts` — źródło prawdy (czysty Zod, współdzielony
   z testem kontraktu CMS); `src/content.config.ts` tylko go importuje
   i podpina do kolekcji (walidacja w buildzie),
2. panel: `public/admin/config.yml` (definicje pól, tłumaczenia PL/EN
   przez obiekty `{pl, en}`),
3. konsumenci: `src/components/sections/work/*`.
   Niespójność = build przechodzi lokalnie, a wpis z panelu wybucha w CI.
4. Pola OPCJONALNE (od 2026-10-21): `results` (domyślnie `[]`), `quote`,
   `author`, `role` — WorkDetail pomija puste bloki; nie wymyślamy metryk ani
   cytatów dla realizacji, które ich nie mają. Jeśli cytat jest, wypełnij OBA
   języki (schemat wymaga pary `{pl, en}`).
5. `screens[].video` (opcjonalne, R1): `{desktop, mobile}` = URL-e MP4 w R2
   (`realizacje/video/<slug>-<key>-desktop.mp4` / `-mobile.mp4`), OBA naraz
   albo żadne (Zod). Tylko nagrania z `pnpm capture:site` (1440×900 /
   390×800, ≤ 800 KB, pętla bez szwu). Zdjęcia ekranu zostają wymagane —
   są posterem, wersją reduce-motion i obrazem kafelka; najlepiej wgrać tam
   postery `.webp` z tego samego nagrania (klatka 0 = zero skoku na starcie).
   Odtwarzanie: `work-video.ts` (src z `data-src` po otwarciu nakładki,
   `play().catch`, bez autoplay w markupie, bez self-heal z hero).

## Media (Cloudflare R2)

- Bucket `hadrianm-media`, domena publiczna `https://media.hadrianm.pl`,
  prefix `realizacje/`. Zdjęcia NIE trafiają do repo.
- Sveltia wgrywa do R2 przez pola `image` ORAZ `file` (MP4 — potwierdzone
  w projektach klienckich rodziny; stara reguła „tylko Image" nieaktualna),
  ale NIE przez bibliotekę Assets poza polem, i NIE kasuje plików z R2 przy
  usuwaniu wpisu — osierocone pliki trzeba sprzątać ręcznie w dashboardzie
  R2. Nazwy wgrywanych plików są slugifikowane
  (`media_libraries.all.slugify_filename`); już wgranych nie zmienia.
- Panel z localhosta wymaga `backend.site_domain` (inaczej Worker auth
  odrzuca `site_id=cms.netlify.com`).
- Rozmiary obrazów: wyłącznie przez `imgAt()` (`src/lib/img.ts`) —
  Cloudflare Image Transformations (`/cdn-cgi/image/...`). W dev endpoint
  nie istnieje → funkcja zwraca oryginał; NIE debuguj „złych rozmiarów"
  lokalnie.
- Tagi: max 3 na język (pilnuje Zod i UI) — nie zwiększaj bez zmiany UI.

## Autoryzacja panelu

- Logowanie przez Worker `sveltia-cms-auth` (`base_url` w config.yml).
  Worker wdrożony ręcznie — procedura odświeżania i rotacji sekretów:
  `docs/optional-todos.md`.
