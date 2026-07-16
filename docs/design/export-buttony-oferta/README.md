# Buttony Oferta — „Przeglądaj pakiety” + „Proces współpracy”

Para CTA do sekcji **Oferta**. Jeden responsywny komponent: **obok siebie na desktop → w słupku na mobile** (primary na górze, pełna szerokość).

- **Primary** — „Przeglądaj pakiety” · wypełniony akcentem (→ `/pakiety`)
- **Secondary** — „Proces współpracy” · panel split z podpisem mono (→ `/proces`)

Referencja dopasowana do stacku projektu: **Astro + Tailwind CSS v4 + `@fontsource-variable/archivo` + `@fontsource/space-mono`**.

## Pliki

| Plik | Do czego |
| --- | --- |
| `OfertaButtons.astro` | Gotowy komponent Astro (scoped style, propsy, a11y). **Zalecany.** |
| `oferta-buttons.css` | Ta sama stylistyka jako czysty CSS (framework-agnostic). |
| `preview.html` | Żywy podgląd na tle marki (desktop + mobile + hover). Otwórz w przeglądarce. |
| `README.md` | Ten plik. |

## Astro (zalecane)

Skopiuj `OfertaButtons.astro` do `src/components/` i:

```astro
---
import OfertaButtons from "@/components/OfertaButtons.astro";
---
<OfertaButtons packagesHref="/pakiety" processHref="/proces" />
```

Propsy (wszystkie opcjonalne):

| Prop | Domyślnie | Rola |
| --- | --- | --- |
| `packagesHref` | `#pakiety` | adres CTA primary |
| `packagesLabel` | `Przeglądaj pakiety` | etykieta primary |
| `processHref` | `#proces` | adres CTA secondary |
| `processLabel` | `Proces współpracy` | etykieta secondary |
| `processSub` | `Jak wygląda praca ze mną` | podpis mono (pusty = ukryty) |
| `class` | — | dopisanie klas na kontenerze (np. wyśrodkowanie) |

## HTML / czysty CSS (alternatywa)

Dołącz `oferta-buttons.css` i wklej markup:

```html
<div class="pp-cta-wrap">
  <div class="pp-cta">
    <a class="pp-btn pp-btn--solid" href="/pakiety">
      <span class="pp-label">Przeglądaj pakiety</span>
      <span class="pp-arrow" aria-hidden="true">→</span>
    </a>
    <a class="pp-btn pp-btn--split" href="/proces">
      <span class="pp-txt">
        <span class="pp-label">Proces współpracy</span>
        <span class="pp-sub">Jak wygląda praca ze mną</span>
      </span>
      <span class="pp-arrowcell"><span class="pp-arrow" aria-hidden="true">→</span></span>
    </a>
  </div>
</div>
```

## Responsywność

Komponent reaguje na **szerokość kontenera** (`@container (max-width: 640px)`), nie viewportu — dzięki temu układa się poprawnie w dowolnej sekcji (kolumna boczna, siatka itp.), a nie tylko względem okna. `container-type: inline-size` jest ustawiony na `.pp-cta-wrap`.

Wolisz klasyczny próg okna? Zamień w CSS `@container (max-width: 640px)` na `@media (max-width: 640px)` — reszta bez zmian.

Domyślnie para trzyma `max-width: 760px` i jest wyrównana do lewej. Wyśrodkuj przez `margin-inline: auto` na `.pp-cta` (albo `class` z odpowiednimi utility Tailwinda).

## Tokeny

Kolory są wystawione jako zmienne CSS na `.pp-cta` — podmień na globalne tokeny theme, jeśli chcesz.

| Zmienna | Wartość | Rola |
| --- | --- | --- |
| `--pp-accent` | `#FF5A47` | tło primary, strzałki |
| `--pp-on-accent` | `#210A06` | tekst na primary |
| `--pp-ink` | `#F5F0EC` | tekst secondary |
| `--pp-faint` | `rgba(245,240,236,.38)` | podpis mono |
| `--pp-line` | `rgba(245,240,236,.14)` | ramka + separator split |
| `--pp-line-hover` | `rgba(245,240,236,.34)` | ramka split na hover |
| `--pp-panel-hover` | `rgba(245,240,236,.09)` | tło pola strzałki na hover |

font: `Archivo Variable` (etykiety) + `Space Mono` (podpis) · radius `3px`

## Uwagi

- **Hover:** primary unosi się o 3px + poświata akcentu; secondary rozjaśnia ramkę i **tło pola strzałki** — tekst celowo się nie podświetla. Strzałka jedzie +5px w obu.
- **Dostępność:** `:focus-visible` (widoczny fokus) + `prefers-reduced-motion` (wyłącza ruch) — pod testy axe/a11y w projekcie. Strzałki są `aria-hidden`, więc czyta się tylko etykietę.
- Kolory podane jako HEX/rgba dla przenośności; podłącz pod zmienne/theme wedle uznania.
