# FAQ — PODSTRONA (referencja): 30 pytań + wyszukiwarka

Pełna podstrona FAQ (`/faq`) w wersji desktop i mobile — **czysta referencja**
do implementacji w projekcie Astro (`hadrianm-web`). Zakres wycięty zgodnie z
ustaleniem: **od chrome „05 / FAQ" po CTA „Napisz do mnie"** — bez topbara,
bez nawigacji (hadventure / „Strona główna").

Rejestr wszystkich **30 pytań** (akordeon, pytania niezależne — może być otwartych
kilka) + **wyszukiwarka 100% frontend** (filtr live, podświetlanie, licznik,
brak wyników). Panel na cieplejszej czerni **#100B0D** (tło strony **#070507**),
szew = hairline + gasnąca poświata akcentu.

## Pliki

- **`faq.html`** — działający podgląd (otwórz w przeglądarce; responsywny:
  desktop ≥861px, poniżej wersja lekka mobile).
- **`faq.css`** — style sekcji. Ustalone wartości w `:root` na górze pliku.
- **`faq.js`** — akordeon + wyszukiwarka + wejścia. Konfiguracja w `FQ_CFG`.

## Wyszukiwarka (100% frontend — do przeniesienia 1:1)

- Filtr **live** przy każdym znaku; przeszukuje **pytanie + odpowiedź**
  (`records[].hay`).
- **Odporna na polskie znaki** — `norm()` sprowadza diakrytyki do ASCII po obu
  stronach (np. `moge` → `mogę`, `rodo` → `RODO`). Zamiana jest 1:1 znak-w-znak,
  więc indeksy trafień pasują do oryginalnego tekstu i **podświetlanie zachowuje
  diakrytyki** (`<mark class="fq-hl">`).
- **Licznik** „N z 30 pytań" w `#fq-search-count` (`role="status"` +
  `aria-live="polite"`); klasa `.is-filtered` koloruje go akcentem.
- **Czyszczenie**: przycisk × (pokazywany tylko przy treści) oraz klawisz **Esc**.
- **Brak wyników**: `#fq-noresults` z wpisaną frazą + linkiem do kontaktu;
  trailing hairline (`#fq-endline`) chowa się przy 0 trafień.
- Bez zależności od GSAP — wyszukiwarka działa też przy reduced-motion i bez ST.
- Wynik XSS-safe: treść wstrzykiwana przez `esc()` (encode `& < >`), `<mark>`
  dokładany wyłącznie wokół dopasowanego fragmentu.

⚠️ Bez JS wyszukiwarka jest nieaktywna (progresywne wzbogacanie) — cała treść
30 pytań pozostaje w HTML (SEO/fallback), odpowiedzi rozwinięte.

## Wartości ustalone (nie zmieniać bez powodu)

- breakpoint: **861px**; panel `#100B0D`, szew `rgba(245,240,236,0.14)`, poświata `rgba(255,90,71,0.05)`
- akordeon: open **0.55s** `power3.out`, close **0.45s** `power3.inOut`; **niezależne** toggle
- rejestr: reveal **ScrollTrigger.batch** (`start: top 94%`), stagger **0.05s** w obrębie partii, wiersze y+24px (mobile y+16px)
- hero: reveal na starcie (nad zakładką); parallax ghosta **−30 → +46px** scrub (tylko desktop)
- search sticky `top: 0`, na mobile bez `backdrop-filter`, input **16px** (brak zoomu iOS)

## Jak to działa (wejścia)

Zero pinów, zero scrubu na treści. Rejestr revealuje `ScrollTrigger.batch` —
animuje się tylko to, co wchodzi w viewport, więc 30 pozycji nigdy nie rusza się
naraz (budżet CPU jak Oferta mobile). Hero pokazywane od razu (`requestAnimationFrame`),
CTA przez pojedynczy `ScrollTrigger` + `toggleClass`. Całą animację robi CSS
transition; stagger partii to `transition-delay` (`--d`) ustawiane w JS.

**Akordeon:** stan trzymają klasy (`.open` → kolory, obrót plusa, aria), wysokość
rozwija tween `height: 0 ↔ auto` (pomiar tylko przy kliknięciu, po tweenie
`clearProps`). Po każdym open/close oraz po filtrze — `ScrollTrigger.refresh()`.

**Tryb statyczny** (wszystko widoczne, rozwinięte): brak JS · `prefers-reduced-motion: reduce`
(akordeon i search nadal działają, bez tweenów) · **`body.fq-static`** ustawione
z zewnątrz przed initem (ten sam kontrakt low-power co `of-static` w Ofercie).

## Przeniesienie do Astro (skrót)

1. **Markup** → `src/pages/faq.astro` (lub `src/components/FaqPage.astro`).
   Ten fragment to sekcja treści — **H1 jest tutaj** (`<h1>pytania i odpowiedzi</h1>`);
   jeśli Twój layout dokłada własny H1 podstrony, zamień tutejszy na `<h2>`
   lub usuń hero, by nie dublować H1. Przyciski pytań startują z
   `aria-expanded="true"` (= stan bez JS); `faq.js` przy inicie zamyka i ustawia `"false"`.
2. **GSAP** (masz w deps): `import gsap from 'gsap'; import ScrollTrigger from 'gsap/ScrollTrigger';`
   — usuń CDN-y. `faq.js` jako `<script>` komponentu lub `src/scripts/faq.ts`.
3. **Fonty** przez fontsource (masz w deps): `@fontsource-variable/archivo`,
   `@fontsource/instrument-serif` (400 italic), `@fontsource/space-mono` (400+700).
   ⚠️ Wariant variable rejestruje rodzinę **`'Archivo Variable'`** — alias masz
   już globalnie z poprzednich sekcji.
4. **Lenis** — spięcie ze ScrollTriggerem masz globalnie. Akordeon i filtr zmieniają
   wysokość strony, dlatego `faq.js` woła `ScrollTrigger.refresh()` po open/close
   i po `applyFilter()`.
5. **Tailwind 4** — style to czysty CSS na klasach `fq-*`, brak kolizji; global CSS lub `<style is:global>`.
6. **`body.js`** — skrypt w `<head>` dodaje klasę `js` (masz w layoutcie); usuń inline z `faq.html`.
7. **Kotwice/hrefy** — w tym eksporcie linki (`#kontakt`) to **placeholdery**,
   nie muszą działać. Podmień na docelowe (`/#kontakt` lub `/kontakt`) przy wdrożeniu.

## Checklista testów (Playwright visual / axe)

- [ ] desktop: wejście — kolejne partie wchodzą przy scrollu (batch), nie wszystko naraz
- [ ] desktop: pytanie otwarte (`.fq-item.open` — numer/plus na akcencie, odpowiedź widoczna)
- [ ] kilka pytań otwartych jednocześnie (toggle niezależny); brak skoku scrolla przy zamykaniu pytania nad ekranem
- [ ] hover na `.fq-q` (tło row, pytanie x+8, plus na biało)
- [ ] mobile (<861px): kolumna `44px`, meta ukryta, ghost mały, search bez blur, input 16px
- [ ] **search**: wpisanie frazy filtruje listę, licznik „N z 30", podświetlenie trafień
- [ ] **search — diakrytyki**: `moge`→„mogę", `rodo`→„RODO", `faktur`→„faktury"
- [ ] **search — brak wyników**: `#fq-noresults` z frazą, `#fq-endline` ukryty
- [ ] **search — czyszczenie**: × i Esc przywracają pełną listę i plain text (bez `<mark>`)
- [ ] **search — a11y**: `role="search"`, `aria-live` na liczniku, `aria-label` na inpucie
- [ ] `prefers-reduced-motion: reduce` → wszystko widoczne, akordeon i search działają bez animacji
- [ ] `body.fq-static` → wszystko rozwinięte statycznie
- [ ] brak JS → pełna treść 30 pytań widoczna, odpowiedzi rozwinięte (search nieaktywny)
- [ ] axe: kontrasty, `aria-hidden` na dekoracjach, focus-visible na `.fq-q` / `.fq-link` / `.fq-input`

## Paleta i typografia

- Panel `#100B0D` na tle `#070507`; tekst `#F5F0EC`, akcent `#FF5A47`;
  mgła `rgba(214,38,38,…)` / `rgba(130,20,32,…)`; linie `rgba(245,240,236,0.15)`.
- **Archivo** 800 (H1, ghost „FAQ"), 700 (pytania); **Instrument Serif** italic
  („odpowiedzi" z gradientem `--serif-grad`); **Space Mono** (numery, kickery,
  meta, licznik searcha).
