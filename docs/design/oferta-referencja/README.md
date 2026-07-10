# Oferta — pakiet referencyjny (Nić A + Pakiety P4)

Sekcja „Oferta" (nav: **02 / Oferta**) w wersji desktop i mobile — **czysta
referencja** do implementacji w projekcie Astro (`hadrianm-web`). Bez paneli
i zaślepek; wszystkie wartości dobrane w prototypie są zapisane na sztywno.

Trzy podsekcje w jednym komponencie:
1. **Intro** — „czytanie scrollem": tekst zapala się słowo po słowie (desktop)
   / zdanie po zdaniu (mobile); gwarancja mobilna rozświetla się na akcent.
2. **Proces współpracy** — „nić": pionowa linia rysuje się scrubem (`scaleY`),
   5 kroków naprzemiennie L/P, węzły-diamenty zapalają się na progach.
3. **Pakiety (P4, ghost-ceny)** — **bez animacji scrollowych**, tylko hover;
   pas „Rozwiązania dedykowane" + rząd opcji dodatkowych.

## Pliki

- **`oferta.html`** — działający podgląd (otwórz w przeglądarce; jeden plik,
  responsywny: desktop ≥861px, poniżej wersja lekka mobile).
- **`oferta.css`** — style sekcji. Ustalone wartości w `:root` na górze pliku.
- **`oferta.js`** — podział tekstu intro + cała choreografia GSAP ScrollTrigger.
  Konfiguracja w `OF_CFG` na górze.

## Wartości ustalone (nie zmieniać bez powodu)

- breakpoint: **861px** (spójny z sekcją „Dla kogo")
- czytanie intro: desktop `start top 58% / end bottom 44%`, scrub **0.45**,
  stagger span **8**; mobile `top 70% / bottom 52%`, scrub **0.4**, span **6**
- nić: desktop `top 52% → bottom 82%`, scrub **0.5**; mobile `top 60% → bottom 88%`, scrub **0.4**
- progi kroków: reveal `top 76%` (mobile 84%), zapłon węzła `top 56%` (mobile 66%)
- parallax cyfr-ghost: **±70px** (tylko desktop)
- stany początkowe (przygaszone słowa 0.14 / 0.24 acc, kroki y+44px itd.)
  siedzą w CSS pod `@media (prefers-reduced-motion: no-preference)`
  i selektorem `body.js:not(.of-static)`

## Jak to działa

**Desktop (≥861px):** zero pinów — wszystko w naturalnym flow. Słowa intro
(spany `.of-w`) zapala jeden tween ze staggerem pod scrubem; nić = `scaleY`
na `.of-fill` (czysty transform); kroki i węzły dostają klasy `on` / `lit`
z progów ScrollTriggera, a animuje CSS transition; cyfry-ghost mają leniwy
parallax; fixed progres `01–05` włącza klasa `body.of-prog-on`.

**Mobile (<861px) — wersja lekka:** podział intro na **zdania** (kilka spanów
zamiast ~80), nić = ten sam pojedynczy `scaleY`, kroki/węzły wyłącznie przez
toggleClass + CSS transition. **Zero filtrów, zero pinów, zero mierzenia w rAF**
— działa płynnie na iPhone SE 2020 i tanich Androidach. Bloby mgły i mesh są
statyczne (malowane raz).

**Tryb statyczny** (wszystko widoczne, GSAP nie startuje):
- brak JS (brak klasy `body.js`),
- `prefers-reduced-motion: reduce`,
- **`body.of-static`** — ustaw z zewnątrz PRZED initem `oferta.js`
  (np. globalny mechanizm low-power / oszczędzania baterii).

## Przeniesienie do Astro (skrót)

1. **Markup** → jeden komponent `src/components/Oferta.astro`
   (podsekcje wyraźnie okomentowane w HTML). `.of-progress` jest `position:
   fixed` — trzymaj go w markupie komponentu, poza `<section>`.
2. **GSAP** (masz w deps): `import gsap from 'gsap'; import ScrollTrigger from
   'gsap/ScrollTrigger';` — usuń CDN-y. `oferta.js` jako `<script>` komponentu
   (Astro zbunduje) albo `src/scripts/oferta.ts`.
3. **Fonty** przez fontsource (masz w deps): `@fontsource-variable/archivo`,
   `@fontsource/instrument-serif` (400 italic), `@fontsource/space-mono` (400+700).
   ⚠️ Wariant variable rejestruje rodzinę **`'Archivo Variable'`** — zaktualizuj
   `font-family` w CSS albo dodaj alias `@font-face` (ta sama uwaga co przy
   `dla-kogo-referencja` — zrób to raz, globalnie).
4. **Lenis** — spięcie ze ScrollTriggerem masz już globalnie (z sekcji „Dla
   kogo"). W CSS celowo **nie ma** `scroll-behavior: smooth`; kotwice
   `#pakiety` / `#kontakt` obsłuż przez Lenisa, raz, globalnie:
   ```js
   document.querySelectorAll('a[href^="#"]').forEach((a) => {
     a.addEventListener('click', (e) => {
       const el = document.querySelector(a.getAttribute('href'));
       if (el && window.lenis) { e.preventDefault(); lenis.scrollTo(el); }
     });
   });
   ```
5. **Tailwind 4** — style to czysty CSS na klasach `of-*` / `pk-*`, brak
   kolizji; wrzuć jako global CSS lub `<style is:global>`.
6. **`body.js`** — skrypt w `<head>`/początku body dodaje klasę `js`
   (fallback bez JS = wszystko widoczne statycznie). Masz to już w layoutcie.
7. **Kotwice:** sekcja `id="oferta"` (CTA z „Dla kogo" celuje w `#oferta`),
   pakiety `id="pakiety"`, CTA kart i „Omówmy pomysł" → `#kontakt`.

## Checklista testów (Playwright visual / axe)

- [ ] desktop: intro w połowie czytania (część słów przygaszona) — snapshot
- [ ] desktop: krok 2 z zapalonym węzłem (`.of-step.lit`) + nić częściowo wypełniona
- [ ] desktop: endcap + CTA widoczne, progres `05 / 05`
- [ ] desktop: hover na `.pk-col.mid` (lift + jaśniejszy ghost + strzałka)
- [ ] mobile (<861px): intro zapala się zdaniami, nić przy lewej krawędzi,
  cyfry-ghost ukryte, progres ukryty
- [ ] `prefers-reduced-motion: reduce` → wszystko widoczne bez animacji
- [ ] `body.of-static` → jak wyżej (symulacja low-power)
- [ ] brak JS → pełna treść widoczna (SEO/fallback)
- [ ] axe: kontrasty mono-etykiet, `aria-hidden` na dekoracjach, `<ol>` procesu

## Paleta i typografia

- Tło `#070507`, tekst `#F5F0EC`, akcent `#FF5A47`, mgła `rgba(214,38,38,…)`
  / `rgba(130,20,32,…)`; linie `rgba(245,240,236,0.14)`.
- **Archivo** 800 (nagłówki, ghost-typografia), **Instrument Serif** italic
  (akcenty serif z gradientem `--serif-grad`), **Space Mono** (etykiety, tagi,
  kickery, ceny-metadane).
