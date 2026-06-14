# Architektura sekcji i teł — start budowy strony GSAP (Hero → kolejne sekcje)

> Decyzja, od której zależy cała reszta strony: **jak sekcje przechowują swoje tła**, tak żeby
> tło hero żyło dokładnie przez pierwszą sekcję, **znikało po jej przescrollowaniu**, a następna
> sekcja miała **własne, inne tło**. Poniżej diagnoza stanu obecnego, trzy rozwiązania z wadami/zaletami,
> rekomendacja oraz odpowiedzi na Twoje dwa konkretne pytania (rozbić `Hero` na `HeroBackground`? usunąć `ScrollDemo`?).

---

## 0. Stan obecny — co dokładnie mamy i dlaczego nie pasuje do nowego celu

Strona składa się w jednym miejscu: `src/components/Home.astro`. Tam jest sedno:

```astro
<div class="hero-bg"><Hero /></div>
<ScrollDemo
  intro={t("demo.intro")}
  box={t("demo.box")}
  outro={t("demo.outro")}
/>

<style>
  .hero-bg {
    position: fixed; /* ← tło hero przyklejone do okna na CAŁY czas scrollowania */
    inset: 0;
    z-index: 0; /* ← leży pod ScrollDemo (z-index 1) przez całą stronę */
  }
</style>
```

Czyli aktualnie:

- `Hero.astro` to **wyłącznie warstwa wizualna** (chmury + raster kropek + winieta), bez własnej treści sekcji.
- `Home.astro` wsadza go w `position: fixed` → to tło **wypełnia okno przez całą długość strony** i prześwituje pod przezroczystymi sekcjami `ScrollDemo`.
- Efekt: **jedno tło na wszystko**. Nie ma mechanizmu „tło hero kończy się tu, dalej jest inne".

**Wniosek:** żeby tło znikało po sekcji hero, trzeba zabrać tło z globalnego `position: fixed` i **związać każde tło z jego sekcją**. To jest właściwa zmiana architektoniczna — niezależnie od tego, które z poniższych rozwiązań wybierzesz.

---

## 1. Model docelowy (wspólny dla wszystkich wariantów)

Zasada przewodnia: **każda sekcja jest samowystarczalnym komponentem, który nosi własne tło.**
Nie ma jednego globalnego tła sterowanego z `Home`. `Home` tylko układa sekcje jedna pod drugą:

```astro
<!-- Home.astro — docelowo -->
<BaseLayout title={t("meta.title")} lang={lang}>
  <Hero />
  {/* sekcja 1: niesie tło-chmury */}
  <Services />
  {/* sekcja 2: niesie SWOJE tło */}
  <Work />
  {/* sekcja 3: itd. */}
</BaseLayout>
```

```
src/components/
  Hero.astro            ← SEKCJA hero: layout + treść + własne tło
  HeroBackground.astro  ← (zalecane) sama warstwa wizualna chmur/kropek, używana przez Hero
  Services.astro        ← kolejna sekcja z własnym tłem
  …
```

Różnica między wariantami sprowadza się do **jednej rzeczy: jak technicznie tło „trzyma się" ekranu przez czas trwania sekcji i jak znika** — czystym CSS (`sticky`), pinem GSAP, czy crossfade'em na wspólnej scenie.

---

## 2. Rozwiązanie A — `position: sticky` na tle wewnątrz sekcji (czysty CSS) ⭐ REKOMENDACJA na start

Każda sekcja jest `position: relative` i ma wysokość ≥ `100svh`. W środku — warstwa tła `position: sticky; top: 0; height: 100svh` (przykleja się do góry okna, dopóki sekcja jest widoczna) oraz treść nad nią. Gdy doscrollujesz do końca sekcji, **sticky-tło wyjeżdża razem z sekcją**, a `sticky`-tło następnej sekcji naturalnie przejmuje ekran. Mechanika „trwa, potem znika" wychodzi **sama z układu**, bez ani linijki JS.

```astro
---
// Hero.astro — sekcja hero niosąca własne tło
import HeroBackground from "@/components/HeroBackground.astro";
---

<section class="hero">
  <div class="hero__bg">
    <HeroBackground />
    <!-- chmury + kropki, position:absolute inset:0 -->
  </div>
  <div class="hero__content">
    <slot />
    <!-- treść hero (LCP) -->
  </div>
</section>

<style>
  .hero {
    position: relative;
    min-height: 100svh; /* ≥ 1 ekran; zwiększ (np. 150svh), jeśli chcesz dłuższy „pobyt" tła */
  }
  .hero__bg {
    position: sticky; /* ← serce mechaniki: trzyma się, póki sekcja w kadrze */
    top: 0;
    height: 100svh;
    z-index: 0;
    overflow: clip;
  }
  .hero__content {
    position: relative;
    z-index: 1;
    min-height: 100svh;
    display: grid;
    place-items: center;
    color: #fff;
    /* sticky-tło jest „pod" treścią; treść leci normalnym scrollem nad nim */
    margin-top: -100svh; /* nakłada treść na sticky-tło tej samej sekcji */
  }
</style>
```

Następna sekcja robi **dokładnie to samo** ze swoim tłem — i automatycznie wypycha hero z ekranu.

**Zalety**

- **Zero JS** dla efektu „trwa → znika → inne". Najmniej rzeczy do zepsucia, najlepszy perf i a11y.
- Każda sekcja w pełni **enkapsulowana** — dodanie sekcji 3/4/5 to skopiowanie wzorca, bez dotykania `Home`.
- Twarda, przewidywalna kolejność teł = brak walki o `z-index` między sekcjami.

**Wady / pułapki**

- Przejścia między tłami są **„cięte"** (jedno wyjeżdża, drugie wjeżdża). Crossfade trzeba dodać osobno (→ Rozwiązanie C).
- `position: sticky` **przestaje działać, jeśli któryś przodek ma `overflow: hidden/clip` albo `transform`/`filter`** (tworzy kontekst, który ubija sticky). Trzymaj `overflow: clip` **wewnątrz** `.hero__bg`, nie na przodkach sekcji.
- Animacja chmur (CSS) zostaje jak jest; pauzę poza ekranem nadal robi `IntersectionObserver` (masz to już w `Hero.astro`).

> **Kiedy wybrać:** to domyślny wybór na teraz. Realizuje Twoje wymaganie 1:1 najprostszymi środkami i nie blokuje żadnej przyszłej animacji GSAP **wewnątrz** sekcji (scrub/pin treści robisz niezależnie).

---

## 3. Rozwiązanie B — pin tła per sekcja przez GSAP ScrollTrigger

Tło sekcji jest „przypinane" (`pin: true`) na czas jej przewijania, a po przekroczeniu `end` — odpinane. To samo zachowanie co sticky, ale sterowane GSAP-em, dzięki czemu **postęp scrolla przez sekcję jest dostępny jako wartość** (`scrub`) — możesz nim animować samo tło (parallax chmur, przyciemnianie, przesuw kropek) albo zsynchronizować wejście treści.

```astro
<script>
  import { gsap } from "gsap";
  import { ScrollTrigger } from "gsap/ScrollTrigger";
  gsap.registerPlugin(ScrollTrigger);

  const mm = gsap.matchMedia();
  mm.add("(prefers-reduced-motion: no-preference)", () => {
    const section = document.querySelector<HTMLElement>(".hero");
    const bg = document.querySelector<HTMLElement>(".hero__bg");
    if (!section || !bg) return;

    ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "bottom top", // tło trzyma się przez całą wysokość sekcji
      pin: bg, // przypnij SAMO tło (nie całą sekcję)
      pinSpacing: false, // następna sekcja wjeżdża „na" odpinane tło
    });

    return () => ScrollTrigger.getAll().forEach((t) => t.kill());
  });
</script>
```

**Zalety**

- Pełna kontrola: `scrub` daje postęp 0→1 przez sekcję → parallax/zanikanie tła, zsynchronizowane wejścia treści.
- Naturalnie łączy się z resztą animacji scrollowych, które i tak będziesz pisać w GSAP.

**Wady / pułapki**

- GSAP wstrzykuje **pin-spacer** (dodatkowy `<div>` w DOM) — trzeba pilnować `pinSpacing`, bo inaczej pojawia się pusta przerwa między sekcjami.
- Więcej kodu i **obowiązkowe sprzątanie** (`kill()` przy HMR / View Transitions), inaczej duplikaty triggerów.
- Refresh przy zmianie wysokości (fonty, obrazki) — `ScrollTrigger.refresh()` po załadowaniu zasobów.

> **Kiedy wybrać:** gdy tło ma **żyć ze scrollem** (parallax, przyciemnianie, scrub), a nie tylko stać i zniknąć. Na pierwszą, statyczną wersję hero to nadmiar — `sticky` (A) wystarczy. Łatwo zmigrujesz A→B później, bo struktura sekcji jest ta sama.

---

## 4. Rozwiązanie C — wspólna scena `fixed` + crossfade teł sterowany ScrollTriggerem

Zostawiasz **jedną** warstwę `position: fixed` na całe okno (jak dziś), ale trzymasz w niej **wszystkie tła sekcji** ułożone na sobie. ScrollTrigger przy wejściu każdej sekcji **przełącza widoczność** odpowiedniego tła (crossfade `opacity`). Tła nigdy nie „scrollują" — płynnie się **przenikają**.

```astro
<!-- Home.astro -->
<div class="bg-stage" aria-hidden="true">
  <div class="bg bg--hero" data-bg="hero"></div>
  <div class="bg bg--services" data-bg="services"></div>
</div>

<main>
  <section data-section="hero"><!-- treść hero --></section>
  <section data-section="services"><!-- treść sekcji 2 --></section>
</main>

<style>
  .bg-stage {
    position: fixed;
    inset: 0;
    z-index: 0;
  }
  .bg {
    position: absolute;
    inset: 0;
    opacity: 0;
    transition: opacity 0.6s ease;
  }
  .bg.is-active {
    opacity: 1;
  }
  main {
    position: relative;
    z-index: 1;
  }
</style>

<script>
  // każda sekcja aktywuje swoje tło na wspólnej scenie
  import { gsap } from "gsap";
  import { ScrollTrigger } from "gsap/ScrollTrigger";
  gsap.registerPlugin(ScrollTrigger);

  document.querySelectorAll<HTMLElement>("[data-section]").forEach((sec) => {
    const key = sec.dataset.section!;
    ScrollTrigger.create({
      trigger: sec,
      start: "top center",
      end: "bottom center",
      onToggle: ({ isActive }) => {
        document
          .querySelector(`[data-bg="${key}"]`)
          ?.classList.toggle("is-active", isActive);
      },
    });
  });
</script>
```

**Zalety**

- **Najładniejsze przejścia** — miękki crossfade między tłami zamiast cięcia.
- Tło stoi idealnie nieruchomo (zero „pływania" sticky), centralna kontrola stanu.

**Wady / pułapki**

- **Wszystkie tła w DOM naraz** → cięższy pierwszy render; pilnuj, by nieaktywne tła nie animowały (pauza CSS / `content-visibility`).
- **Mniejsza enkapsulacja** — tło i treść sekcji żyją w dwóch różnych miejscach; dodanie sekcji = dwie edycje (scena + `main`).
- Centralny koordynator z `data-*` — trzeba trzymać spójność kluczy.

> **Kiedy wybrać:** gdy zależy Ci na **filmowych przenikaniach** teł i akceptujesz wspólną scenę zamiast samowystarczalnych sekcji. To naturalny „upgrade" estetyczny po A.

---

## 5. Porównanie

| Kryterium                | A — `sticky` (CSS) ⭐ | B — pin GSAP        | C — scena + crossfade  |
| ------------------------ | --------------------- | ------------------- | ---------------------- |
| Ilość JS                 | zero                  | średnia             | średnia                |
| „Trwa → znika → inne"    | z układu, za darmo    | pełna kontrola      | przez przełączanie     |
| Przejście między tłami   | cięte                 | dowolne (scrub)     | **crossfade**          |
| Parallax / scrub tła     | nie (bez dod. JS)     | **tak, natywnie**   | ograniczony            |
| Enkapsulacja sekcji      | **pełna**             | pełna               | słabsza (centralne)    |
| Ryzyko/utrzymanie        | **najniższe**         | pin-spacer, cleanup | stan + z-index         |
| Koszt pierwszego renderu | niski                 | niski               | wyższy (wszystkie tła) |

**Rekomendacja:** zacznij od **A (`sticky`)**. Realizuje wymaganie najprościej, jest najtańsze w utrzymaniu i nie zamyka drogi do GSAP-owych animacji _wewnątrz_ sekcji. Gdy zechcesz parallax tła → przejdź na **B** dla danej sekcji. Gdy zechcesz przenikania → wprowadź **C**. Wszystkie trzy dzielą ten sam model sekcji z §1, więc migracja jest lokalna, nie przepisuje strony.

---

## 6. Odpowiedzi na Twoje dwa pytania

### 6.1 Rozbić `Hero` na osobny `HeroBackground`, czy modyfikować `Hero` w miejscu?

**Rozbij — `HeroBackground.astro` (sama warstwa wizualna) + `Hero.astro` (sekcja: layout + treść + wpięte tło).** Powody:

- `Hero.astro` ma już ~200 linii CSS samego tła (chmury, dryf, raster, winieta). Gdy dołożysz do tego layout i treść hero, plik stanie się nieczytelny. Rozdzielenie = **separacja odpowiedzialności**: „jak hero wygląda jako tło" vs „czym hero jest jako sekcja".
- Warstwa wizualna bywa **wielokrotnego użytku** (np. mniejszy wariant chmur w stopce/CTA) i łatwiej ją podmienić/przetestować w izolacji.
- Pasuje do modelu z §1: sekcja _niesie_ tło jako wewnętrzny komponent — ta sama konwencja dla każdej kolejnej sekcji.

To, co dziś jest w `Hero.astro` (cały blok chmur/kropek + `IntersectionObserver` pauzujący animację), **przenosisz prawie 1:1 do `HeroBackground.astro`**. `Hero.astro` zostaje cienką sekcją, która go opakowuje wg wybranego wariantu (A/B/C).

### 6.2 Usunąć `ScrollDemo`?

**Wyjmij `ScrollDemo` ze strony (`Home.astro`), ale nie kasuj pliku — zostaw jako prywatny „playground".** Powody:

- `ScrollDemo` to **demo dydaktyczne** (pin + scrub), nie część produktu. Twoje docsy się do niego odwołują jako do miejsca nauki ScrollTriggera — wartościowe, gdy będziesz pisać animacje kolejnych sekcji.
- W stronie produkcyjnej jego miejsce zajmują realne sekcje (`Hero`, `Services`, …). Zostawienie go w `Home` mieszałoby demo z treścią.
- Konkretnie: usuń import i użycie `ScrollDemo` z `Home.astro` oraz globalne `.hero-bg { position: fixed }` (to ono blokuje znikanie tła). Sam plik `ScrollDemo.astro` może zostać w `components/` jako referencja albo trafić do `docs/`/`src/components/_playground/`.

> Jeśli wolisz czysty `components/` — przenieś `ScrollDemo.astro` do `src/components/_playground/` (podkreślnik = „nie sekcja produkcyjna"). Kod dema masz i tak utrwalony w `docs/instrukcja-praca-gsap-podglad-tlo-hero.md`, więc nic nie tracisz.

---

## 7. Pierwszy krok wdrożenia (kolejność)

1. `HeroBackground.astro` — przenieś tu cały wizual z obecnego `Hero.astro` (chmury, kropki, winieta, `IntersectionObserver`). Ustaw na nim `position: absolute; inset: 0`.
2. `Hero.astro` — przepisz na sekcję wg **Rozwiązania A**: `.hero` (relative, `min-height`), `.hero__bg` (sticky, hostuje `HeroBackground`), `.hero__content` (treść + `<slot/>`).
3. `Home.astro` — usuń `.hero-bg { position: fixed }` i `ScrollDemo`; wstaw `<Hero>` z treścią hero. Dołóż **drugą sekcję** z własnym, innym tłem (choćby placeholder), żeby na żywo zobaczyć, że tło hero **znika** i wjeżdża kolejne.
4. Podgląd: `pnpm dev --host` (desktop + telefon). Sprawdź na realnym Androidzie płynność dryfu chmur i moment „odklejenia" tła.
5. Bramki przed commitem: `pnpm format && pnpm lint && pnpm typecheck && pnpm build`. Commit w Conventional Commits, np. `refactor: split Hero into section + HeroBackground, per-section sticky bg`.

> Gdy hero zacznie potrzebować parallaxu/scrubu tła → podmień warstwę przyklejania w `Hero.astro` z `sticky` (A) na pin GSAP (B); reszta struktury zostaje bez zmian.
> </content>
> </invoke>
