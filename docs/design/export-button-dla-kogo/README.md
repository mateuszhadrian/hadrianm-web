# MoreLink — button „Zobacz więcej” (wariant Solid)

Sekcyjny button prowadzący ze strony głównej (pierwsza, statyczna klatka sekcji)
na dedykowaną podstronę z pełną animacją — np. `/dla-kogo`.

Wariant: **Solid** (wypełniony akcentem marki). Referencja dopasowana do stacku
projektu: **Astro + Tailwind CSS v4 + `@fontsource-variable/archivo`**.

## Pliki

| Plik | Do czego |
| --- | --- |
| `MoreLink.astro` | Gotowy komponent Astro (scoped style, props, a11y). **Zalecany.** |
| `more-link.css` | Ta sama stylistyka jako czysty CSS (framework-agnostic). |
| `preview.html` | Żywy podgląd na tle marki — otwórz w przeglądarce. |
| `README.md` | Ten plik. |

## Astro (zalecane)

```astro
---
import MoreLink from '@/components/MoreLink.astro';
---
<MoreLink href="/dla-kogo" />
<MoreLink href="/oferta" label="Zobacz ofertę" />
```

Props: `href` (wymagane), `label` (domyślnie `„Zobacz więcej”`), `class` (dopisanie klas).

## Tailwind v4 (alternatywa)

Jeśli wolisz utility zamiast scoped CSS — podmień arbitralne wartości na swoje
tokeny theme (np. `bg-accent`), gdy je masz:

```html
<a
  href="/dla-kogo"
  class="group inline-flex items-center gap-3 rounded-lg bg-[#FF5A47] px-[30px] py-4
         font-bold text-[#120A09] shadow-[0_12px_28px_rgba(255,90,71,0.2)]
         transition duration-300 hover:-translate-y-0.5 hover:bg-[#FF6E5D]
         hover:shadow-[0_18px_38px_rgba(255,90,71,0.34)]
         focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#FF6E5D]
         motion-reduce:transition-none motion-reduce:hover:translate-y-0"
>
  Zobacz więcej
  <span aria-hidden="true" class="transition-transform duration-300 group-hover:translate-x-1.5">→</span>
</a>
```

## Tokeny

| Token | Wartość | Rola |
| --- | --- | --- |
| akcent | `#FF5A47` | tło buttona |
| akcent (hover) | `#FF6E5D` | tło na hover |
| tekst | `#120A09` | kolor napisu + strzałki |
| font | `Archivo Variable` | `@fontsource-variable/archivo` |
| radius | `8px` | zaokrąglenie |
| padding | `16px 30px` | wysokość ~52px (tap ≥ 44px) |

## Uwagi

- **Dostępność:** ma `:focus-visible` (widoczny fokus) oraz `prefers-reduced-motion`
  (wyłącza ruch) — pod testy axe/a11y w projekcie.
- **Desktop i mobile:** identyczny styl. Umiejscowienie w sekcji: pod akapitem,
  wyrównane do lewej (jak na płótnie z podglądem).
- **Strzałka** jest `aria-hidden` — czyta się tylko etykieta.
- Kolory podane jako HEX dla przenośności; podłącz pod zmienne/theme wedle uznania.
