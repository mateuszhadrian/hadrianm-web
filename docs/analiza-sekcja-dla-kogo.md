# Sekcja „Dla kogo" — plan wdrożenia (design „Talia kart")

> Port referencji `docs/design/dla-kogo-referencja/` (dla-kogo.html/.css/.js,
> dla-kogo-mocks.css, img/) do sekcji `#audience` strony. Decyzje ustalone
> z Mateuszem 2026-07-10. Wzorzec strukturalny portu: sekcja „O mnie"
> (`analiza-sekcja-o-mnie.md`) — ta sama rodzina designu „z mgły".

## I. Czym jest sekcja (skrót referencji)

Sekcja „01 / Dla kogo" w dwóch trybach:

- **Desktop (≥861px):** sekcja o wysokości `--dklen: 700vh`, scena sticky,
  jeden timeline GSAP pod scrubem 0.6 ze snapem `[0.04, 0.30, 0.58, 0.94]`.
  Choreografia: intro (ghost „dla kogo" + talia rewersów we mgle) → karta
  „Efekt WOW" wjeżdża z prawej-dołu z rotacją → przygasa pod kartą „CMS" →
  karta „Narzędzia" + CTA → finał: wachlarz trzech kart (`fan: 1.4`).
  Rozdziały tekstowe i cyfry-ghost wymieniają się na progach; progres
  (kreski + `01/04`) i podpis „DOWÓD x/03" aktualizuje `setStage()`.
  Karty to żywe mockupy DOM (okno przeglądarki + skeleton) z marquee
  i mrugającym kursorem (`.mk-anim`).
- **Mobile (<861px):** zwykły flow; każdy rozdział = okno + tekst. Okno to
  DWA wypieczone obrazki (ostry + blur w pliku) — „wyostrzenie z mgły" to
  crossfade wyłącznie na `opacity`; przeglądarka nie liczy żadnego blura.
- **Reduced motion / no-JS:** statyczny układ flow, wszystko widoczne.

Wartości „zamrożone" w prototypie (nie zmieniać bez powodu): scrub 0.6,
snap on `[0.04, 0.30, 0.58, 0.94]`, `--dklen: 700vh`, `fan: 1.4`,
`--rk: 0.12`, `--rkp: 0.9px`, `--mkch: 32px`, mgła 0.38/0.20 → 0.85/0.65
→ 0.30.

## II. Decyzje portu (ustalone z Mateuszem 2026-07-10)

1. **Mockupy desktop = statyczny markup Astro** (bez stemplowania JS
   z `<template>` jak w referencji): komponent `AudienceMockWindow.astro`
   renderuje okno + wariant WOW/CMS/Tools serwerowo. Zero JS na budowę DOM,
   brak mignięcia. Marquee/kursor zostają w CSS (`.mk-anim`, tylko desktop
   + `no-preference`). Siatka rezerwacji: 28 komórek, `i === 9` → `sel`
   („14"), `i % 5 === 0` → `alt` (wzór `(i*7)%5===0` z referencji ≡ `i%5===0`).
2. **EN tłumaczy Claude** w tonie sekcji About; korekty Mateusza w kolejnym
   etapie.
3. **Teksty WEWNĄTRZ mockupów zostają po polsku w OBU wersjach językowych**
   („ZOBACZ WIĘCEJ →", „OPUBLIKUJ ZMIANY", „twoja-firma.pl"…) — mocki są
   dekoracyjne (`aria-hidden`), jeden komplet obrazków mobile. Etykiety-pille
   na kartach desktop („PIERWSZE WRAŻENIE", „TWÓJ PANEL CMS", „MODUŁY
   ZAROBKOWE") są częścią mocka → też PL. Chrome sekcji (tag, meta, „DOWÓD
   x/03", progres, rozdziały, CTA) — pełne i18n.
4. **Obrazki mobile:** `img/ekran-*.png` (712×528, ~1.9× względem 378px)
   → WebP przez sharp → `src/assets/audience/`, osadzone przez `astro:assets`
   (`<Image>`). Wersje `-blur` analogicznie (rozmycie wypieczone w pliku).
5. **Kotwice projektu, nie referencji:** sekcja `id="audience"` (nav,
   bg-crossfade, testy), CTA „Poznaj ofertę" → `#services` (w referencji
   `#dlakogo` / `#oferta`).
6. **Font mono = token projektu** `var(--font-mono)` (systemowy stack, jak
   About) zamiast Space Mono z referencji — sekcje „z mgły" mają wyglądać
   jak jeden system. Nagłówki `var(--font-display)` (Archivo Variable),
   akcenty `var(--font-serif)` + `var(--accent-gradient)` (identyczny
   gradient jak `--serif-grad` referencji). Paleta = tokeny `global.css`
   (są 1:1 z referencją).
7. **Mobile w dyscyplinie wydajnościowej About** (świadome odejście od
   referencji na rzecz płynności syncTouch):
   - reveale `once: true` (referencja: `play…reverse`) — po pierwszym
     pokazaniu nic już nie animuje,
   - jeden tween na blok tekstu zamiast kaskady per-element,
   - ghost „dla kogo" w pełni statyczny (referencja: scrubowany dryf),
   - crossfade blur→sharp okien ZOSTAJE (sedno efektu; wyłącznie opacity
     + transform, zero `filter` w runtime — zasada z referencji),
   - `.bl` bez `filter: blur` na mobile (miękkość daje radial-gradient);
     mesh bez `mix-blend-mode` na mobile — oba wracają na desktopie
     (wzorzec About).
8. **Snap zostaje** (wartości referencji) + testowy wyłącznik `?nosnap`
   (wzorzec About — programowy scroll w testach nie ściga się ze snapem
   na wolnych runnerach CI).
9. Ten dokument = konwencja docs-first; wpis w `docs/README.md`.
10. **Plan testów — patrz §IV.**
11. Ghost intro EN: „who it's for" (spójnie z nav).
12. **Wyjście z sekcji jak w referencji:** pin kończy się wachlarzem
    (~0.94–1.0) i sekcja odkleja się naturalnie w stronę `#services`;
    bez dodatkowego przejścia.

## III. Architektura portu

```
src/components/sections/audience/
├── Audience.astro            # markup + style (port dla-kogo.css + mocks.css)
├── AudienceMockWindow.astro  # okno przeglądarki + warianty wow/cms/tools
├── audience-config.ts        # oś scrolla — stałe współdzielone z testami
└── audience-scroll.ts        # port dla-kogo.js (GSAP ScrollTrigger)
src/assets/audience/          # ekran-{wow,cms,tools}{,-blur}.webp
```

- **Gating jak w About:** inline `<script is:inline>` dodaje klasę `.js`
  na sekcji; scena przypięta wyłącznie pod
  `@media (min-width: 861px) and (prefers-reduced-motion: no-preference)`
  + `.dk.js`. Moduł `audience-scroll.ts` ładowany dynamicznie tylko przy
  `no-preference`. Bez JS / przy reduce: bazowy układ flow z obrazkami
  (stany docelowe czystym CSS — blur-warstwa `opacity: 0`, żar statyczny).
- **`audience-config.ts`** trzyma: `AUDIENCE_DESKTOP_MIN_PX = 861`
  (== literały `@media` w Audience.astro), `AUDIENCE_SCRUB = 0.6`,
  `AUDIENCE_SNAP_POINTS = [0.04, 0.30, 0.58, 0.94]`, `AUDIENCE_FAN = 1.4`,
  `AUDIENCE_STAGE_THRESHOLDS = [0.32, 0.60, 0.86]`. Pozycje tweenów
  na osi timeline'u zostają literalnie w module (bespoke choreografia,
  jak w referencji).
- **`fitMocks` → ResizeObserver** na `.mk-body` (kanwa 880×574 skalowana
  do szerokości okna), inicjowany w gałęzi desktop modułu; sprzątany
  w cleanupie `gsap.matchMedia`.
- **Choreografia desktop portowana 1:1** z dla-kogo.js (pozycje, easingi,
  wartości mgły, wachlarz), łącznie z progami `setStage` (0.32/0.60/0.86)
  i mapowaniem podpisów CAPS — świadomie bez „poprawiania" prototypu
  (zachowanie przetestowane i zaakceptowane w przeglądarce).
  Uwaga: `filter: blur/brightness/saturate` na kartach animowany TYLKO
  na desktopie (≥861px) — na mobile karty desktopowe w ogóle nie istnieją
  w DOM-ie widocznym (display: none).
- **bg-crossfade:** sekcja jest kryjąca (`#070507`, jak About) — warstwy
  `bg-stage` pod spodem bez zmian.

## IV. Weryfikacja (kontrakt testowy)

- **Unit** (`tests/unit/audience-config.test.ts`): inwarianty osi — punkty
  snapa rosnące w (0,1), progi stage rosnące i zgodne z liczbą rozdziałów,
  scrub/fan > 0, breakpoint == 861.
- **Visual** (`tests/visual/audience.spec.ts`, wzór `about.spec.ts`):
  sweep viewportu w punktach osi — desktop DOKŁADNIE punkty snapa
  (`AUDIENCE_SNAP_POINTS`; snap w spoczynku = brak dryfu), mobile ułamki
  zakresu flow; profile `chromium-1920` / `webkit-iphone-14` /
  `chromium-pixel-5`; `?nosnap` + freeze.css (gasi też marquee/kursor
  mocków — determinizm).
- **`sections.spec.ts`:** `audience` wypada ze statycznej listy (sekcja
  scrubowana — element-screenshot nie niesie informacji); stare baseline'y
  `section-audience-*` do usunięcia w tym samym PR.
- **Baseline'y:** kolejność z ustaleń CI — kod → workflow
  `update-visual-baselines.yml` (linux) → commit darwin NA KOŃCU;
  darwin generowany lokalnie po akceptacji zrzutów przez Mateusza.
- **e2e:** istniejące specy (nawigacja do `#audience`, a11y, SEO) muszą
  przejść; heading-order: rozdział 00 = `<h2>`, rozdziały 01–03 = `<h3>`
  (audience jest pierwszą sekcją po hero z `<h1>`).
- **Fizyczne urządzenie:** emulacja nie wykryje limitu warstw GPU Androida
  ani feel syncTouch — po merge'u sprawdzić na telefonie crossfade okien
  (czy nie „wystrzeliwuje" scroll) i płynność sceny desktop na słabszym
  sprzęcie.

## V. Etapy

1. ✅ Ten dokument + wpis w `docs/README.md`.
2. ✅ Konwersja obrazków (sharp → WebP → `src/assets/audience/`;
   q82 ostre / q72 blur — 3–10 KB na plik).
3. ✅ `audience-config.ts` + `AudienceMockWindow.astro` + rewrite
   `Audience.astro` + `audience-scroll.ts`.
4. ✅ Klucze i18n `audience.*` (PL + EN).
5. ✅ Testy (unit + visual sweep + korekta sections.spec.ts).
6. ✅ Weryfikacja lokalna (format/lint/typecheck/unit/build/e2e/visual);
   klatki zaakceptowane przez Mateusza 2026-07-10, baseline'y darwin
   zaktualizowane. Commituje Mateusz.

## VI. Ustalenia z wdrożenia (2026-07-10)

- **Fala subpikselowa w baseline'ach sekcji poniżej:** flow mobile sekcji ma
  UŁAMKOWĄ wysokość (okna 712×528 skalowane do szerokości viewportu), więc
  podmiana placeholdera (równe 100svh) przesunęła `#services/#work/#about/…`
  na inną fazę subpikselową. Skutek: kosmetyczne diffy AA w `section-work`
  (mobile; na webkit clip elementu zmienił się o 1px wysokości) i w sweepie
  about (mobile) — zaktualizowane za zgodą Mateusza. Reguła na przyszłość:
  zmiana WYSOKOŚCI dowolnej sekcji na mobile może wymagać odświeżenia
  baseline'ów wszystkich sekcji poniżej; to nie jest regresja treści.
- Klatka hero `10-p106` (za końcem osi hero) pokazuje początek nowej sekcji —
  baseline odświeżony (×3 profile).
- Stare baseline'y `section-audience-*` (12 plików) usunięte razem z wpisem
  w `sections.spec.ts`.
- Playwright przy PIERWSZYM przebiegu sam zapisuje brakujące baseline'y
  nowego speca (i faila test) — nowe pliki audience-* powstały z przebiegu
  `pnpm test:visual`, potwierdzone potem przebiegiem kontrolnym bez diffów.
