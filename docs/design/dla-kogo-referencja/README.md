# Dla kogo — pakiet referencyjny („Talia kart")

Sekcja „Dla kogo" (nav: **01 / Dla kogo**) w wersji desktop i mobile — **czysta
referencja** do implementacji w projekcie Astro (`hadrianm-web`). Bez paneli,
suwaków i zaślepek; wszystkie wartości dobrane w prototypie są zapisane na sztywno.

## Pliki

- **`dla-kogo.html`** — działający podgląd (otwórz w przeglądarce; jeden plik,
  responsywny: desktop ≥861px = przypięta scena, poniżej = flow mobile).
  Zawiera też `<template>` z trzema mockupami okien.
- **`dla-kogo.css`** — style sekcji. Wszystkie ustalone wartości siedzą
  w `:root` na górze pliku.
- **`dla-kogo-mocks.css`** — style mockupów-skeletonów (okno przeglądarki,
  panel CMS, kafle narzędzi).
- **`dla-kogo.js`** — stemplowanie mocków + cała choreografia GSAP ScrollTrigger.
  Konfiguracja w `DK_CFG` na górze.
- **`img/ekran-{wow,cms,tools}.png`** + wersje **`-blur`** — gotowe ekrany
  mockupów dla mobile (712×528, ~1.9× względem szerokości 378px).
- **`eksport-ekrany.html`** — narzędzie do odtworzenia PNG po zmianie mocków:
  otwórz, wywołaj `showEkran('wow'|'cms'|'tools')`, zrób zrzut i przytnij
  712×528 od punktu (4,4); wersja blur = ten sam obraz + blur 23px (canvas).

## Wartości ustalone (nie zmieniać bez powodu)

- scrub: **0.6** · snap: **on**, punkty `[0.04, 0.30, 0.58, 0.94]`
- długość pinu: **`--dklen: 700vh`**
- wachlarz w finale: **`fan: 1.4`**
- zaokrąglenia: **`--rk: 0.12`**, pille **`--rkp: 0.9px`** (wzór: `pow(rk, 2.2) × 99px`)
- pasek okna przeglądarki: **`--mkch: 32px`**
- mgła: wartości bazowe w timeline (intro 0.38/0.20 → szczyt 0.85/0.65 → finał 0.30)

## Jak to działa

**Desktop (≥861px):** `#dlakogo` ma wysokość `--dklen`, `.dk-stage` jest sticky.
Jeden timeline pod scrubem: intro (tekst + talia rewersów we mgle) → karta 1
„Efekt WOW" wjeżdża z prawej-dołu z rotacją → przygasa pod kartą 2 „CMS" →
karta 3 „Narzędzia" + CTA → finał: wachlarz wszystkich trzech. Teksty
(`.dk-ch[data-ch=0..3]`) i cyfry-ghost wymieniają się na progach; progres
(kreski + `01/04`) i podpis „DOWÓD x/03" aktualizuje `setStage()`.

**Mobile (<861px):** zwykły flow; każdy punkt = okno + tekst. Okno to **dwa
gotowe obrazki**: `img/ekran-*.png` (ostry) i `img/ekran-*-blur.png` (rozmycie
wypieczone w pliku — odpowiednik `blur(12px)` przy szerokości 378px). Wejście =
transform/opacity; „wyostrzenie z mgły" = crossfade wyłącznie na `opacity` —
przeglądarka **nie liczy żadnego blura**. Cień i poświata okna siedzą w CSS na
`.lay-sharp` (nie w pliku), zaokrąglenie narożników daje `border-radius` na `img`.
**Nigdy nie animować `filter` na mobile.**

**Reduced motion:** `body.dk-static` → statyczny układ flow, wszystko widoczne.

**Mockupy:** kanwa ma stałe 880×574px i jest skalowana do szerokości okna
(`fitMocks()` ustawia `transform: scale()`); wysokość ciała okna trzyma
`aspect-ratio: 880/574`. Klasa `.mk-anim` (tylko żywe karty desktop) włącza
marquee i mrugający kursor; klony `.is-blur` mają animacje wyłączone.
To skeleton-placeholdery — w przyszłości można podmienić na screenshoty realizacji.

## Przeniesienie do Astro (skrót)

1. **Markup** sekcji + template'y → komponent `src/components/DlaKogo.astro`.
   JS jako `<script>` w komponencie (Astro zbunduje) albo `src/scripts/dla-kogo.ts`.
2. **GSAP** (masz w deps): `import gsap from 'gsap'; import ScrollTrigger from
   'gsap/ScrollTrigger'; gsap.registerPlugin(ScrollTrigger);` — usuń CDN-y.
3. **Fonty** przez fontsource (masz w deps):
   `@fontsource-variable/archivo`, `@fontsource/instrument-serif` (400 italic),
   `@fontsource/space-mono` (400 + 700).
   ⚠️ Wariant variable rejestruje rodzinę **`'Archivo Variable'`** — zaktualizuj
   `font-family` w CSS albo dodaj alias `@font-face`.
4. **Lenis** — spięcie ze ScrollTriggerem (raz, globalnie):
   ```js
   const lenis = new Lenis();
   lenis.on('scroll', ScrollTrigger.update);
   gsap.ticker.add((t) => lenis.raf(t * 1000));
   gsap.ticker.lagSmoothing(0);
   ```
   Snap ScrollTriggera działa na natywnym scrollu — z Lenisem przetestuj
   dociąganie; w razie walki zmniejsz `lerp` Lenisa albo wyłącz `snap`.
5. **Tailwind 4** — style są czystym CSS na klasach `dk-*` / `mk-*`, brak
   kolizji; wrzuć jako global CSS lub `<style is:global>`.
6. **`body.js`** — skrypt w `<head>`/początku body dodaje klasę `js`
   (fallback bez JS = statyczny flow). W Astro możesz dodać ją w layoutcie.
7. Kotwice: sekcja `id="dlakogo"`, CTA prowadzi do `#oferta`.

## Paleta i typografia

- Tło `#070507`, tekst `#F5F0EC`, akcent `#FF5A47`, głęboka czerwień mgły
  `rgba(214,38,38,…)` / `rgba(130,20,32,…)`.
- **Archivo** 800 (nagłówki, ghost-typografia), **Instrument Serif** italic
  (akcent w nagłówku, gradient `--serif-grad`), **Space Mono** (etykiety,
  tagi, metadane).
