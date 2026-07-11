# FAQ — pakiet referencyjny (wariant A "Rejestr")

Sekcja „FAQ" (nav: **05 / FAQ**) w wersji desktop i mobile — **czysta
referencja** do implementacji w projekcie Astro (`hadrianm-web`). Bez zaślepek
sąsiednich sekcji; wszystkie wartości dobrane w prototypie zapisane na sztywno.

Samodzielna sekcja-panel: cieplejsza czerń **#100B0D** na tle strony
**#070507**, szew = hairline (`border-top/bottom`) + gasnąca poświata akcentu
(`::before`, 5% → 0 przez 150px). Rejestr 6 pytań (akordeon, jedno otwarte
naraz, wszystkie zamknięte na starcie) + domknięcie „Napisz do mnie" → `#kontakt`.

## Pliki

- **`faq.html`** — działający podgląd (otwórz w przeglądarce; jeden plik,
  responsywny: desktop ≥861px, poniżej wersja lekka mobile).
- **`faq.css`** — style sekcji. Ustalone wartości w `:root` na górze pliku.
- **`faq.js`** — akordeon + choreografia wejść. Konfiguracja w `FQ_CFG` na górze.

## Wartości ustalone (nie zmieniać bez powodu)

- breakpoint: **861px** (spójny z resztą sekcji)
- panel `#100B0D`, szew `rgba(245,240,236,0.14)`, poświata `rgba(255,90,71,0.05)`
- wejścia (`once: true`): nagłówek `top 84%`, lista `top 80%`, CTA `top 92%`;
  stagger wierszy **0.07s** (`--d` w CSS), linie `scaleX` 0.95s, wiersze y+24px
  (mobile y+16px)
- akordeon: open **0.55s** `power3.out`, close **0.45s** `power3.inOut`,
  treść odpowiedzi fade +0.08s; hover pytania x+8px (tylko `hover: hover`)
- parallax ghosta „FAQ": **−34 → +44px** scrub (tylko desktop)
- mgła: 2 bloby (`46vw` / `40vw`, blur 48px) — **cichsza niż w Ofercie**, statyczna

## Jak to działa

**Wejścia (desktop i mobile identycznie — budżet CPU jak Oferta mobile):**
zero pinów, zero scrubu na treści. Trzy ScrollTriggery `once: true` dodają
klasy `.on` (toggleClass), a całą animację robi CSS transition — stagger
wierszy to `transition-delay` z `--d`. Desktop dodatkowo: leniwy parallax
ghosta (sam transform). Mobile: te same triggery, mniejsze przesunięcia,
parallax wyłączony przez `gsap.matchMedia`.

**Akordeon:** stan trzymają klasy (`.open` → kolory, obrót plusa, aria),
wysokość rozwija tween GSAP `height: 0 ↔ auto` na `.fq-a` — pomiar tylko
przy kliknięciu, po tweenie `clearProps` (kontrola wraca do CSS). Otwarcie
nowego pytania domyka poprzednie tym samym mechanizmem. Po każdym tweenie
`ScrollTrigger.refresh()` — patrz Lenis niżej.

**Tryb statyczny** (wszystko widoczne, odpowiedzi rozwinięte, GSAP nie startuje):
- brak JS (brak klasy `body.js`),
- `prefers-reduced-motion: reduce` — akordeon nadal działa (przełączanie
  klas bez tweenów),
- **`body.fq-static`** — ustaw z zewnątrz PRZED initem `faq.js`
  (globalny mechanizm low-power; ten sam kontrakt co `of-static` w Ofercie).

## Przeniesienie do Astro (skrót)

1. **Markup** → jeden komponent `src/components/Faq.astro` (sekcja jest
   samodzielna, bez elementów `fixed`). Przyciski startują z
   `aria-expanded="true"` (= stan bez JS); `faq.js` przy inicie zamyka
   wszystko i ustawia `"false"` — nie „poprawiaj" tego w markupie.
2. **GSAP** (masz w deps): `import gsap from 'gsap'; import ScrollTrigger from
   'gsap/ScrollTrigger';` — usuń CDN-y. `faq.js` jako `<script>` komponentu
   (Astro zbunduje) albo `src/scripts/faq.ts`.
3. **Fonty** przez fontsource (masz w deps): `@fontsource-variable/archivo`,
   `@fontsource/instrument-serif` (400 italic), `@fontsource/space-mono` (400+700).
   ⚠️ Wariant variable rejestruje rodzinę **`'Archivo Variable'`** — alias
   `@font-face` masz już globalnie z poprzednich sekcji; nic nowego.
4. **Lenis** — spięcie ze ScrollTriggerem masz globalnie. Akordeon zmienia
   wysokość strony, dlatego `faq.js` woła `ScrollTrigger.refresh()` po każdym
   open/close — triggery sekcji niżej (Kontakt) dostają świeże pozycje.
   Kotwica `#kontakt` przez globalny handler `lenis.scrollTo` (masz z
   poprzednich sekcji); w CSS celowo **nie ma** `scroll-behavior: smooth`.
5. **Tailwind 4** — style to czysty CSS na klasach `fq-*`, brak kolizji;
   wrzuć jako global CSS lub `<style is:global>`.
6. **`body.js`** — skrypt w `<head>` dodaje klasę `js` (fallback bez JS =
   wszystko widoczne). Masz to już w layoutcie — usuń inline'owy z `faq.html`.
7. **Kotwice:** sekcja `id="faq"` (nav: 05 / FAQ), CTA → `#kontakt`.
   Nagłówek sekcji to `<h2>`, pytania to `<h3><button>` — zachowaj hierarchię
   względem sąsiednich sekcji.

## Checklista testów (Playwright visual / axe)

- [ ] desktop: wejście w połowie staggera (część wierszy poniżej progu) — snapshot
- [ ] desktop: pytanie 03 otwarte (`.fq-item.open` — numer/plus na akcencie,
  odpowiedź widoczna), pozostałe zamknięte
- [ ] desktop: hover na `.fq-q` (tło row, pytanie x+8, plus na biało)
- [ ] mobile (<861px): rejestr z kolumną `44px`, meta ukryta, ghost mały;
  otwarcie/zamknięcie pytania płynne
- [ ] klik drugiego pytania domyka pierwsze (jedno `.open` naraz)
- [ ] `aria-expanded` zgodne ze stanem po kliknięciach (axe + e2e)
- [ ] `prefers-reduced-motion: reduce` → wszystko widoczne, akordeon
  przełącza bez animacji
- [ ] `body.fq-static` → wszystko rozwinięte statycznie (symulacja low-power)
- [ ] brak JS → pełna treść widoczna, odpowiedzi rozwinięte (SEO/fallback)
- [ ] axe: kontrasty mono-etykiet, `aria-hidden` na dekoracjach,
  focus-visible na `.fq-q` i `.fq-link`
- [ ] po otwarciu pytania triggery sekcji niżej mają świeże pozycje
  (`ScrollTrigger.refresh()` zawołany)

## Paleta i typografia

- Panel `#100B0D` na tle `#070507`; tekst `#F5F0EC`, akcent `#FF5A47`,
  mgła `rgba(214,38,38,…)` / `rgba(130,20,32,…)`; linie `rgba(245,240,236,0.15)`,
  szew `rgba(245,240,236,0.14)`.
- **Archivo** 800 (nagłówek, ghost „FAQ"), 700 (pytania); **Instrument Serif**
  italic („odpowiedzi" z gradientem `--serif-grad`); **Space Mono**
  (numery, kickery, meta, CTA-kicker).
