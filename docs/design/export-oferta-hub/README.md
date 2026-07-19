# Oferta — „sedno” podstrony (Wariant B: wstęp + karty Pakiety / Proces)

Rdzeń podstrony **Oferta**: **od** nagłówka „Stawiam na konkrety i pełną
przejrzystość” **do dolnych krawędzi** dwóch kart-ścieżek. Jeden responsywny
blok: **karty obok siebie na desktop → słupek na mobile** (Pakiety na górze,
pełna szerokość). Bez nawigacji, chrome sekcji i tła — to dostarcza sekcja
`#oferta` w projekcie.

- **Pakiety** — karta wyróżniona (akcentowa górna krawędź) · CTA primary
  „Przeglądaj pakiety” (button **wypełniony jasny**) → `/pakiety`
- **Proces** — CTA secondary „Proces współpracy” (button **panel split**
  z podpisem mono) → `/proces`

Framework-agnostic (czysty HTML + CSS na klasach, jak `oferta.css` /
`dla-kogo.css`). Buttony **wbudowane** — plik jest samowystarczalny.

## Pliki

| Plik | Do czego |
| --- | --- |
| `oferta-hub.css` | **Źródło prawdy.** Style bloku `.ofh` + wbudowane buttony `pp-*`. Tokeny w `.ofh` na górze. |
| `oferta-hub.html` | Samodzielny, działający blok (otwórz w przeglądarce). Zawiera markup do skopiowania + opcjonalny reveal. Jest też źródłem `<iframe>` w podglądzie. |
| `preview.html` | Żywy podgląd **desktop i mobile jednocześnie** (dwa iframe’y) na tle marki + kod do wklejenia + tokeny. |
| `README.md` | Ten plik. |

## Jak użyć

1. Dołącz `oferta-hub.css` (albo wklej zawartość do swojego globalnego CSS /
   `<style is:global>`; tokeny z `.ofh` zmapuj na globalne zmienne / Tailwind `@theme`).
2. Wstaw blok `.ofh` **wewnątrz** sekcji `#oferta` (ta daje ciemne tło i „mgłę”).
   Pełny markup — patrz `oferta-hub.html` lub zakładka „Wklej u siebie” w `preview.html`.

```html
<div class="ofh">
  <div class="ofh-intro">
    <p class="ofh-lead">Stawiam na konkrety i <span class="ofh-serif">pełną przejrzystość</span>.</p>
    <p class="ofh-sub">Sprawdź, z jakich rozwiązań możesz skorzystać i jak krok po kroku poprowadzę Cię przez cały proces wdrożenia.</p>
  </div>
  <div class="ofh-cards">
    <article class="ofh-card ofh-card--feat">
      <div class="ofh-kick">01 / Pakiety</div>
      <h3 class="ofh-name">Pakiety</h3>
      <p class="ofh-desc">Przejrzyste warianty i zakres usług.</p>
      <div class="ofh-foot">
        <a class="pp-btn pp-btn--solid" href="/pakiety">
          <span class="pp-label">Przeglądaj pakiety</span>
          <span class="pp-arrow" aria-hidden="true">→</span>
        </a>
      </div>
    </article>
    <article class="ofh-card">
      <div class="ofh-kick">02 / Proces</div>
      <h3 class="ofh-name">Proces</h3>
      <p class="ofh-desc">Od pierwszej rozmowy do publikacji w sieci.</p>
      <div class="ofh-foot">
        <a class="pp-btn pp-btn--split" href="/proces">
          <span class="pp-txt">
            <span class="pp-label">Proces współpracy</span>
            <span class="pp-sub">Jak wygląda praca ze mną</span>
          </span>
          <span class="pp-arrowcell"><span class="pp-arrow" aria-hidden="true">→</span></span>
        </a>
      </div>
    </article>
  </div>
</div>
```

## Responsywność

Próg **`@media (max-width: 860.98px)`** — spójny z sekcjami **Oferta** i **Dla
kogo** (861px). Powyżej: dwie kolumny (`grid-template-columns: 1fr 1fr`).
Poniżej: jedna kolumna, karty pełnej szerokości, **Pakiety na górze** (wynika
z kolejności w DOM — nie trzeba nic przestawiać). Podgląd pokazuje oba stany
naraz przez dwa `<iframe>` (media-query reaguje na viewport iframe’a).

## Wejście / animacje (opcjonalne)

Delikatny reveal (wstęp → karta 1 → karta 2, ze staggerem) siedzi w CSS pod
`@media (prefers-reduced-motion: no-preference)` i selektorze `.ofh.js.is-inview`:

- **Bez JS** lub `prefers-reduced-motion: reduce` → wszystko od razu widoczne
  (fallback SEO, zero animacji).
- Blok startuje z klasą `js`; dodanie `is-inview` odpala wejście. W
  `oferta-hub.html` robi to mały `IntersectionObserver`. W realnym kodzie
  podłącz to pod **istniejący obserwator / GSAP ScrollTrigger** (masz w sekcji
  Oferta) — albo dodaj `is-inview` od razu, albo usuń klasę `js` dla trybu
  w pełni statycznego (`body.of-static` / low-power).
- **Hover** działa zawsze: karta unosi się o 5px + jaśnieje ramka; primary
  lift+glow; split podświetla pole strzałki (tekst celowo nie). `:focus-visible`
  na buttonach.

## Tokeny (`.ofh`)

| Zmienna | Wartość | Rola |
| --- | --- | --- |
| `--ink` | `#F5F0EC` | tekst · **tło primary** |
| `--on-solid` | `#1B1310` | tekst na jasnym primary |
| `--accent` | `#FF5A47` | akcent, strzałki, wyróżniona krawędź karty |
| `--muted` | `rgba(245,240,236,.62)` | podtekst, opisy |
| `--faint` | `rgba(245,240,236,.38)` | kickery mono, podpis split |
| `--line` | `rgba(245,240,236,.14)` | ramki kart i buttona split |
| `--serif-grad` | `linear-gradient(105deg,#FFF6F0,#FFB3A6)` | akcent serif we wstępie |

Fonty: **Archivo Variable** (600 wstęp / 800 nazwy), **Instrument Serif** (400
italic — `.ofh-serif`), **Space Mono** (kickery, podpis split). Radius: karta
`4px`, button `3px`.

> ⚠️ **Uwaga o primary.** Tutaj primary „Przeglądaj pakiety” jest **jasny**
> (`background: var(--ink)`, tekst `--on-solid`, strzałka akcentowa) — zgodnie
> z aktualną wersją na żywej stronie. Starszy `export-buttony-oferta` ma primary
> **wypełniony akcentem** (`background: var(--accent)`). Jeśli chcesz jedno
> źródło, ujednolić warto właśnie do tej jasnej wersji.

## Uwaga o Astro / fontsource

Wariant variable rejestruje rodzinę **`'Archivo Variable'`** — upewnij się, że
`font-family` w CSS to trafia (albo dodaj alias `@font-face`), tak samo jak przy
`oferta-referencja` / `dla-kogo-referencja`. Fonty: `@fontsource-variable/archivo`,
`@fontsource/instrument-serif` (400 italic), `@fontsource/space-mono` (400).
Podgląd używa Google Fonts tylko dla wygody.

## Checklista (Playwright visual / axe)

- [ ] desktop ≥861px: dwie karty równej wysokości, Pakiety z akcentową krawędzią, buttony pełnej szerokości w stopce
- [ ] mobile <861px: słupek, Pakiety na górze, split — podpis mono w jednej linii
- [ ] hover: karta lift + jaśniejsza ramka; primary lift+glow; split — pole strzałki
- [ ] `prefers-reduced-motion: reduce` → statycznie, bez transformacji
- [ ] brak JS → cała treść widoczna (fallback)
- [ ] axe: kontrast opisów/kickerów, `aria-hidden` na strzałkach, `:focus-visible`
