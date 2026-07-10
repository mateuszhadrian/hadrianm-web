# Sekcja „Oferta" — plan wykonawczy portu referencji

Port designu z `docs/design/oferta-referencja/` (wariant „Nić A + Pakiety P4")
do sekcji `#services` na stronie głównej (PL + EN, desktop + mobile).
Referencja jest **wizualno-behawioralna**: wygląd i choreografia 1:1, ale
implementacja ma być integralną częścią projektu (tokeny, wzorce Audience/About,
kontrakt testowy). Decyzje z rozmowy z Mateuszem (2026-07-10) — wszystkie
rekomendacje zaakceptowane.

## I. Decyzje portu (ustalone)

1. **Teksty PL 1:1** z `oferta.html`; EN — tłumaczenie własne (ton jak
   `audience.*` w `ui.ts`), **wszystko** tłumaczone łącznie z ghost-typografią
   („oferta" → „services"), kickerami („Krok 01 / 05" → „Step 01 / 05") i metą.
2. **Ceny w EN**: te same kwoty w PLN, etykiety po angielsku
   („FROM 1,500 PLN", „NET", „Range: 1,500–1,900 PLN net").
3. **Kotwice**: sekcja `id="services"` (kontrakt nav), pakiety `id="packages"`
   (spójnie z angielskimi id sekcji), CTA kart i „Omówmy pomysł" → `#contact`.
   Skoki **natychmiastowe** przez Lenisa (`immediate: true` + podmiana hash),
   wzorzec `dk-cta` z Audience; fallback natywny bez Lenisa.
4. **Fixed progres `01–05`** (desktop, podczas procesu) — zostaje jak
   w referencji. Klasa włączająca (`of-prog-on`) na **sekcji**, nie na `body`
   (element fixed żyje w markupie komponentu; sekcja nie ma transformów,
   więc `position: fixed` działa względem viewportu).
5. **Bez haka `of-static`** — globalny mechanizm low-power został usunięty
   z projektu; tryb statyczny dają: brak JS (brak klasy `.js` na sekcji)
   oraz `prefers-reduced-motion: reduce` (desktop i mobile tak samo).
6. **Fonty/paleta z tokenów projektu** (`global.css`): `--font-display`,
   `--font-serif`, `--font-mono` (ui-monospace — jak w „Dla kogo", NIE Space
   Mono z referencji), `--ink/--muted/--faint/--line/--accent/
   --accent-gradient`. Lokalny `:root` referencji odpada; drobne różnice
   krycia (muted 0.58 vs 0.62 itd.) — świadomie na rzecz spójności strony.
7. **Breakpoint 861 px** — literał w `@media` + `SERVICES_DESKTOP_MIN_PX`
   w configu (kontrakt jak `AUDIENCE_DESKTOP_MIN_PX`; `@media` nie czyta
   `var()`).
8. **Budżet mobile** wg wzorca Audience/About: bloby atmosfery bez
   `filter: blur` na mobile (miękkość z samego radial-gradientu; blur tylko
   ≥861 px), `mix-blend-mode: multiply` mesha tylko na desktopie, zero pinów,
   zero filtrów w runtime, zero mierzenia w rAF, nić = jeden `scaleY`.

## II. Architektura

```
src/components/sections/services/
├── Services.astro       — markup + style scoped (3 podsekcje: intro / proces /
│                          pakiety) + inline <script> dodający klasę .js na
│                          sekcji + bramka dynamicznego importu modułu animacji
├── services-config.ts   — stałe „zamrożone" z prototypu (OF_CFG): breakpoint,
│                          triggery read/thread (desktop+mobile), progi kroków,
│                          parallax ±70 px
└── services-scroll.ts   — port oferta.js: split intro (słowa/zdania),
                           tween stagger pod scrubem, scaleY nici, toggleClass
                           kroków/węzłów, parallax cyfr-ghost, progres 01–05
```

- Stany początkowe animacji (przygaszone słowa 0.14/0.24, kroki y+44 px,
  `scaleY(0)` nici) w CSS pod `@media (prefers-reduced-motion: no-preference)`
  i selektorem `.js` sekcji → no-JS i reduce renderują pełną, statyczną treść
  (SEO/fallback) — dokładnie zachowanie referencji, mechanizmem projektu.
- Moduł animacji ładowany dynamicznie **tylko** przy `no-preference`
  (ta sama bramka co Lenis w BaseLayout i Audience); w module dodatkowo
  `gsap.matchMedia` desktop/mobile z warunkiem `motionOK` (pas bezpieczeństwa).
- Podział intro na spany robi JS w runtime (jak referencja) — markup niesie
  czyste `<p>` z i18n, więc treść bez JS pozostaje nietknięta.
- Teksty: klucze `services.*` w `src/i18n/ui.ts` (PL + EN); kickery kroków
  składane w Astro z `services.step` + numeracji (bez 5 × duplikatu wzorca).

## III. Etapy

1. **i18n** — komplet kluczy `services.*` PL/EN w `ui.ts` (test parności
   kluczy pilnuje kompletności).
2. **Komponent** — `Services.astro` (zastępuje placeholder), markup wg
   referencji z klasami `of-*`/`pk-*`, style scoped na tokenach, media query
   861 px i 861–1280 px; `#packages`, CTA → `#contact`.
3. **Animacje** — `services-config.ts` + `services-scroll.ts` (port 1:1
   choreografii; wartości z README referencji „nie zmieniać bez powodu").
4. **Testy**:
   - unit: `services-config.test.ts` (inwarianty stałych — wzorzec
     `audience-config.test.ts`),
   - visual: **osobny `tests/visual/services.spec.ts`** — sweep punktów osi
     sekcji (flow, bez snapa) wg checklisty README referencji: intro w połowie
     czytania, krok z zapalonym węzłem + nić, endcap + CTA, pakiety;
     `services` wypada z listy `sections.spec.ts` (element-screenshot sekcji
     scrubowanej nie niesie informacji — jak hero/audience/about),
   - e2e: kotwice CTA (`#packages`, `#contact`), pełna treść bez JS,
     axe obejmie nową sekcję automatycznie (`a11y.spec.ts`).
5. **Weryfikacja** — `pnpm test:unit` + `pnpm build && pnpm test:visual`
   + `pnpm test:e2e`. Nowa wysokość sekcji przesunie baseline'y sekcji
   poniżej (work/about/faq/contact) — diffy do akceptacji Mateusza,
   potem kolejność z `visual-baselines-ci-ordering`: kod → workflow linux →
   darwin na końcu, wszystko w jednym PR.

## IV. Choreografia (skrót; wartości w `services-config.ts`)

- **Intro**: desktop split na **słowa** (~80 spanów), jeden tween
  `opacity 0.14→1` ze staggerem pod scrubem (`top 58% → bottom 44%`,
  scrub 0.45, span 8); mobile split na **zdania** (`top 70% → bottom 52%`,
  scrub 0.4, span 6). Fraza akcentowa zachowuje klasę `acc` na spanach.
- **Ghost „oferta"**: leniwy parallax y 0→90 px (tylko desktop).
- **Nić**: `scaleY` na `.of-fill` (transform-origin top), desktop
  `top 52% → bottom 82%` scrub 0.5; mobile `top 60% → bottom 88%` scrub 0.4.
- **Kroki**: `toggleClass` `on` (reveal, `top 76%` / mobile 84%) i `lit`
  (zapłon węzła, `top 56%` / mobile 66%) — animuje CSS transition.
- **Cyfry-ghost**: parallax ±70 px (tylko desktop; mobile ukryte).
- **Progres**: widoczny gdy `.of-proces` w oknie (`top 55% → bottom 65%`),
  ticki/licznik wg progu `lit` bieżącego kroku.
- **Pakiety**: zero animacji scrollowych — wyłącznie hover w CSS
  (lift −6 px, jaśniejszy ghost, strzałka; na mobile hover-lift wyłączony).
