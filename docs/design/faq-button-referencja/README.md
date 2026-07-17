# BLOK „WIĘCEJ" — button „Zobacz wszystkie pytania" (referencja)

Domknięcie **teasera FAQ na stronie głównej**: nadpis z licznikiem + button
prowadzący do pełnej podstrony `/faq`. Osobny, samodzielny komponent — do wklejenia
pod 6 pytaniami teasera (nad CTA „Napisz do mnie"). Desktop i mobile.

## Pliki

- **`more-button.html`** — podgląd (button wyśrodkowany na tle panelu #100B0D).
- **`more-button.css`** — style. Sekcja `.fq-demo-stage` to **tylko scena podglądu — nie kopiuj jej do repo**; przenosisz `.fq-more` + `.fq-all` (+ `:root`).
- **`more-button.js`** — synchronizacja licznika z `data-*` + delikatne wejście.

## Markup do wklejenia

```html
<div class="fq-more">
  <span class="lead" data-tpl="Pokazano {shown} z {total} pytań">Pokazano 6 z 30 pytań</span>
  <a class="fq-all" href="/faq" data-shown="6" data-total="30">
    <span class="count">06 / 30</span>
    <span class="label">Zobacz wszystkie pytania</span>
    <span class="arr" aria-hidden="true">→</span>
  </a>
</div>
```

## Licznik (konfigurowalny)

- `data-shown` / `data-total` na `.fq-all` → JS formatuje `.count` do „06 / 30”
  (dopełnienie do 2 cyfr, `pad()`).
- `data-tpl` na `.lead` → szablon nadpisu; `{shown}` i `{total}` podstawiane z powyższych.
- Wartości w markupie (`06 / 30`, „Pokazano 6 z 30 pytań") to **fallback bez JS** —
  ustaw je równe `data-*`. W Astro najlepiej wyliczyć z liczby pytań w danych, np.:
  `data-shown={teaser.length}` `data-total={faq.length}`.

## Zachowanie

- **Hover** (desktop): ramka → akcent, delikatne tło, strzałka `+6px`.
- **Wejście**: `ScrollTrigger` dodaje klasę `.on` (fade-up 18px, `once`) — animuje CSS transition.
- **Fallbacki**: brak GSAP / `prefers-reduced-motion` / `body.fq-static` → blok od razu widoczny; licznik z data-* nadal działa.

## Przeniesienie do Astro

1. **Markup** → do sekcji teasera FAQ (`src/components/Faq.astro`), pod listą pytań, nad CTA.
2. **Style** → `.fq-more` i `.fq-all` dopisz do CSS sekcji FAQ (globalny / `<style is:global>`).
   Jeśli teaser już definiuje `:root` z tymi tokenami — pomiń duplikat. **Nie** przenoś `.fq-demo-stage`.
3. **GSAP** (masz w deps): `import gsap from 'gsap'; import ScrollTrigger from 'gsap/ScrollTrigger';` — usuń CDN.
   Logikę licznika/wejścia dołącz do skryptu sekcji FAQ (albo zostaw jako mały osobny moduł).
4. **href** — `/faq` to placeholder; podmień na docelową ścieżkę podstrony.
5. **`body.js`** — klasę `js` dodaje layout globalnie (w podglądzie robi to inline `<script>`).

## Checklista testów

- [ ] licznik z `data-*` renderuje „06 / 30" i „Pokazano 6 z 30 pytań"
- [ ] hover: ramka akcent + strzałka +6px (desktop)
- [ ] wejście: fade-up przy wejściu w viewport (`once`)
- [ ] mobile: mniejszy padding/label, layout bez przepełnień
- [ ] reduced-motion / brak JS: blok widoczny, licznik poprawny, link działa
- [ ] a11y: link fokusowalny (focus-visible), `aria-hidden` na strzałce

## Paleta i typografia

- Tło osadzenia `#100B0D`; tekst `#F5F0EC`, akcent `#FF5A47`, linie `rgba(245,240,236,0.15)`.
- **Archivo** 600 (label buttona); **Space Mono** (licznik + nadpis).
