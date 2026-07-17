---
paths:
  - "src/components/sections/about/**"
  - "src/components/sections/audience/**"
  - "src/components/sections/services/**"
  - "src/components/sections/faq/**"
  - "src/components/sections/contact/**"
  - "src/components/sections/work/**"
---

# Sekcje strony (poza hero) — gotchas

Plany wykonawcze (pełny kontekst decyzji): `docs/analiza-sekcja-o-mnie.md`
(about), `docs/analiza-sekcja-dla-kogo.md` +
`docs/analiza-podmiana-ekranow-lumea-dla-kogo.md` (audience),
`docs/analiza-sekcja-oferta.md` (services), `docs/analiza-sekcja-faq.md`
(faq), `docs/contact-me-form-analysis-implementation.md` (contact),
`docs/analiza-realizacje-karuzela-mobile.md` (work — dane/CMS osobno:
reguła `cms-realizacje.md`).

## Wspólne dla about/audience/services/faq/contact

- Moduły `*-scroll.ts` ładowane DYNAMICZNIE tylko przy
  `prefers-reduced-motion: no-preference`; bez JS / przy reduce sekcja
  renderuje pełną, statyczną treść.
- Zakaz emulacji `reduce` w testach (kontrakt: `.claude/rules/testing.md`)
  dotyczy bramki całostronicowej; testy FAQ i contact mają ŚWIADOME,
  punktowe wyjątki `test.use({ contextOptions: { reducedMotion: "reduce" } })`
  weryfikujące działanie przy reduce — nie usuwaj ich.
- Wspólne helpery już istnieją — nie kopiuj bloków między sekcjami:
  `src/scripts/section-helpers.ts` (`revealOnce`, `motionMedia`,
  `ghostParallax`, `makeProgress`, `scopedQueries`) oraz
  `src/scripts/anchors.ts` (`scrollToAnchor`, `handleAnchorClick`).
- Breakpoint desktop 861 px: stała `*_DESKTOP_MIN_PX` w configu sekcji
  ORAZ ten sam próg zaszyty w `@media` pliku `.astro` — CSS nie
  zaimportuje stałej, utrzymuj W PARZE. Testy importują stałą,
  nie hardkodują.
- Warstwy testów po zmianie: `.claude/rules/testing.md`; sekcje mają
  własne specy w `tests/visual/`.

## About (`om`) i Audience (`dk`) — pinned+scrub+snap

- Testowy wyłącznik snapa `?nosnap` (programowy scroll w testach przegrywa
  wyścig ze snapem na wolnych runnerach CI) — konsumowany przez testy
  wizualne, NIE usuwaj.
- Audience mobile: wejścia ekranów to wjazd L/R/L (translate + stała
  rotacja) — NIGDY nie animuj `filter` na mobile (blur żyje wyłącznie
  w gałęzi desktop `audience-scroll.ts`).
- Ekrany-dowody audience to wypieczone screeny LUMÉA
  (`src/assets/audience/ekran-*.webp`, te same PL/EN) — regeneracja przez
  `scripts/capture-audience-screens.mjs`, nie ręczna edycja markupu.
- Ułamkowa wysokość sekcji audience na mobile przesuwa subpikselowo
  baseline'y WSZYSTKICH sekcji poniżej (ghosting ~1px ≠ regresja).

## Services (`of`)

- Spany `.of-w`/`.acc` tworzy w RUNTIME `services-scroll.ts` (split
  intro) — w scoped CSS Astro muszą stać pod `:global(...)`.
- Klasę `of-prog-on` przełącza ScrollTrigger NA SEKCJI (nie na body).
- Ceny w PLN także w wersji EN — CELOWE (decyzja z analizy).

## FAQ (`fq`)

- Dwie powierzchnie z JEDNEGO źródła pytań `src/i18n/faq.ts` (tablica
  `{pl,en}`, 30 pozycji): teaser na głównej (`Faq.astro`,
  `slice(0, FAQ_TEASER_COUNT)`) i podstrona `/faq/` (`FaqFull.astro`,
  całość + wyszukiwarka) — decyzje: `docs/analiza-podstrona-faq.md`.
- Split modułów: ładowane ZAWSZE (działają też przy reduce, ZERO gsap
  w ich grafie importów!) — `faq-accordion.ts` (opcja `exclusive`:
  główna `true`, podstrona `false` — niezależne toggle) oraz
  `faq-search.ts` (filtr live, diakrytyki, podświetlanie); tylko przy
  no-preference — `faq-scroll.ts` (teaser), `faq-page-scroll.ts`
  (podstrona) i współdzielony `faq-animator.ts` (tween wysokości).
  NIE scalaj, nie importuj animatora z modułów „zawsze".
- Klasa `.js` na rootcie (inline script) uzbraja stany startowe animacji
  i zamknięte odpowiedzi — bez JS obie strony pokazują pełną treść
  (wyszukiwarka nieaktywna — progresywne wzbogacanie).
- JSON-LD FAQPage emituje WYŁĄCZNIE podstrona (komplet 30 z tego samego
  źródła co markup) — nie przywracaj go na stronę główną i nie duplikuj
  treści pytań/odpowiedzi poza `src/i18n/faq.ts`.
- Frazy testowe wyszukiwarki muszą być unikalne PO normalizacji
  diakrytyków (np. „rodo" łapie też „środowisk" → „srodowisk").

## Contact (`kt`)

- Adres e-mail składany z fragmentów dopiero po kliknięciu `[ POKAŻ ]`
  (antyscraping) — nie „upraszczaj" do zwykłego mailto w markupie.
- Honeypot jest `readonly` (autofill Chrome'a nie wypełnia readonly;
  focus zdejmuje atrybut w `contact-ui.ts`) — nie usuwaj atrybutu.
- Turnstile ładowany leniwie (pierwszy `focusin` w formularzu) — nie
  przenoś do eager loadu.
- Breakpoint: `CONTACT_DESKTOP_MIN_PX` z `contact-config.ts` (importują
  go też testy e2e).
- Pułapki klienckie mają serwerowy odpowiednik w `functions/api/kontakt.ts`
  (Pages Function: honeypot, czas wypełnienia, weryfikacja Turnstile) —
  zmiany po jednej stronie kontraktu wymagają przeglądu drugiej.

## Work (`wk`) — karuzela mobile

- Track karuzeli wymaga `data-lenis-prevent-horizontal` (NIE
  `data-lenis-prevent` — zabija pionowy scroll na Androidzie) oraz
  `scroll-snap-stop: always`.
