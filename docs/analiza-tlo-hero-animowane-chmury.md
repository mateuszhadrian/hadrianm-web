# Animowane tło hero — „czerwone chmury na czarnym niebie" (czysty CSS, max performance)

> Dokument-baza pod implementację warstwowego, animowanego tła sekcji hero.
> Stack: Astro 6 (`output: 'static'`) + Tailwind v4 + GSAP (osobno, **nie** dla tego tła).
> Decyzja kierunkowa: **wariant A — czysty CSS, animacja tylko na `transform`**, kropki statyczne,
> degradacja na mobile + `prefers-reduced-motion`, pauza poza ekranem.
> Cel twardy: nie ruszyć bramki Lighthouse CI (≥ 0.9 perf) i lecieć 60 fps także na mid-range Androidzie.

---

## 0. Model mentalny (analogia → warstwy)

Tło to **niebo nocą z czerwoną łuną**. Cztery warstwy, każda ma jedno zadanie:

```
  z3  ┌─────────────────────────────────────────┐
      │  TREŚĆ: logo, nagłówek, "SCROLL"          │  ← to jest LCP, nic go nie blokuje
  z2  │  RASTER KROPEK (statyczny, CZARNY)          │  ← czarne, NIEPRZEZROCZYSTE kropki na wierzchu
      │  └ czerwone tło widać MIĘDZY kropkami       │     (zero animacji, rasteryzowany RAZ)
  z1  │  CHMURY: 2–3 rozmyte czerwone bloby         │  ← JEDYNE co się rusza (transform)
      │  └ dryfują z różną prędkością → organicznie  │     leci na kompozytorze / GPU
  z0  │  NIEBO: jednolite ciemne tło (#0a0507)      │  ← statyczne, baza
      └─────────────────────────────────────────┘
```

**Dlaczego kropki NAD chmurami:** czarne kropki to siatka leżąca _na_ ciągłym czerwono-czarnym tle.
W obszarze łuny pod kropkami jest czerwień → czarne kropki czytają się wyraźnie (czarny raster na
czerwieni). Tam, gdzie tło jest czarne, czarne kropki zlewają się z czernią → znikają. To **czarny
halftone na czerwonej łunie** — czerwień jest ciągłym tłem widocznym _między_ kropkami, a nie zbiorem
„czerwonych kropek". Kropki są nieprzezroczyste i czarne; przezroczyste są tylko _przerwy_ między nimi
(żeby tło prześwitywało).

**Analogia perf (kluczowa):** animacja `background-position`/`background` = **malowanie ściany od nowa co
klatkę**. Animacja `transform` = **przesuwanie gotowej naklejki**. Naklejka jest namalowana raz, potem
GPU tylko ją przesuwa. Cała sztuka tego tła = sprowadzić ruch do przesuwania naklejek.

---

## 1. Dlaczego wariant A (i dlaczego nie wideo / nie WebGL teraz)

### Mechanika renderowania — co jest tanie, a co drogie

Pipeline klatki w przeglądarce:

```
  JS → Style → Layout → Paint → Composite
                  │        │         │
  drogie ─────────┘        │         └─ tanie, osobny wątek (compositor), GPU
  (główny wątek)  ─────────┘
```

- `transform`, `opacity` → **pomijają Layout i Paint**, lecą prosto do Composite (GPU). To jedyne
  właściwości, które animujesz dla płynności.
- `background-position`, `background-color`, `width/height`, `top/left`, `filter` w keyframes → **Paint
  na całej powierzchni co klatkę**, na głównym wątku. Na dużym hero = murowany jank na mobile.
- `filter: blur()` jako **statyczny** na warstwie promowanej do własnego compositor-layera → liczony
  **raz** (tekstura cache'owana), potem `transform` tylko ją przesuwa. Blur w _keyframes_ = liczony co
  klatkę = zakaz.

### Werdykt: A vs WebGL vs wideo

| Kryterium                     | A — czysty CSS (transform)                            | B — shader WebGL                 | Wideo (WebM/MP4)           |
| ----------------------------- | ----------------------------------------------------- | -------------------------------- | -------------------------- |
| Wygląd „chmur"                | dobry (organiczny przez 2–3 warstwy o różnych fazach) | najlepszy (prawdziwy noise)      | dokładnie jak design       |
| Perf desktop                  | znakomity                                             | bardzo dobry                     | dobry (HW decode)          |
| Perf mobile                   | znakomity                                             | dobry, ale grzeje/bateria        | ryzyko (decode + transfer) |
| Bateria / termika             | minimalna                                             | zauważalna przy ciągłej animacji | decode ciągły              |
| Bundle / waga                 | **0 KB** (sam CSS)                                    | +lib/shader, +kontekst GL        | ciężki plik (setki KB–MB)  |
| LCP / CWV                     | czyste (brak assetu)                                  | OK (kontekst po starcie)         | **zagrożone** (duży asset) |
| Ostrość kropek nad tłem       | idealna (osobna warstwa)                              | idealna                          | **psuje się** na kompresji |
| Złożoność wdrożenia           | niska                                                 | wysoka                           | średnia (autoplay, pętla)  |
| Fit do stacku (Astro/zero-JS) | idealny                                               | obcy ciału                       | obcy filozofii             |

**Wniosek:** A pokrywa 100% Twojego efektu („wolny dryf łuny") przy zerowym koszcie bundla i najlepszym
mobile. Wideo odpada (LCP + transfer + traci ostrość kropek nad kompresją + pętla widoczna). WebGL zostaw
jako _świadomy upgrade_, gdyby kiedyś CSS-owe chmury wydały Ci się za mało „płynne" — ale przy 2–3
warstwach o niepodzielnych czasach tego nie poczujesz.

---

## 2. Architektura warstw (DOM + z-index)

Minimalny, czysty DOM w `.astro`. Chmury robimy na **pseudo-elementach** (`::before`/`::after`) kontenera
`__clouds`, żeby nie zaśmiecać markupu. To daje 2 bloby; trzeci (opcjonalny) dorzucasz jako dziecko-div.

```html
<section class="hero">
  <div class="hero__clouds" aria-hidden="true"></div>
  <!-- z1: ::before + ::after = 2 chmury -->
  <div class="hero__dots" aria-hidden="true"></div>
  <!-- z2: statyczny raster -->
  <div class="hero__content"><!-- logo, h1, scroll: z3 --></div>
</section>
```

`aria-hidden="true"` na warstwach dekoracyjnych — to czysta ozdoba, czytnik ekranu ma ją pomijać.

---

## 3. Kod produkcyjny (do wklejenia, potem strojenie)

> Wartości kolorów/rozmiarów to punkt startowy pod Twój design — dostroisz pod screen.
> Trzymaj to w `global.css` albo w `<style>` komponentu hero.

### 3.1 Niebo + kontener

```css
.hero {
  position: relative;
  min-height: 100svh; /* svh = stabilna wysokość na mobile (pasek adresu) */
  background: #0a0507; /* NIEBO (z0) */
  overflow: clip; /* bloby oversized nie robią poziomego scrolla */
  isolation: isolate; /* własny stacking context — blend modes nie wyciekają */
}
```

### 3.2 Chmury (z1) — jedyna animowana warstwa

```css
.hero__clouds {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
}

/* wspólne cechy obu chmur */
.hero__clouds::before,
.hero__clouds::after {
  content: "";
  position: absolute;
  /* OVERSIZE: większe niż kadr, by ruch nigdy nie odsłonił krawędzi blobu */
  width: 130%;
  height: 130%;
  /* miękkie krawędzie ZA DARMO — radial-gradient z przezroczystym wygaszeniem.
     Żadnego filter: blur w keyframes. */
  will-change: transform; /* promocja do compositor-layera — TYLKO tu */
  border-radius: 50%;
}

/* chmura A — cieplejszy rdzeń, bliżej centrum */
.hero__clouds::before {
  top: -25%;
  left: -10%;
  background: radial-gradient(
    closest-side,
    oklch(0.42 0.17 25 / 0.6),
    /* czerwony rdzeń */ oklch(0.3 0.14 22 / 0.25) 45%,
    transparent 72%
  );
  animation: drift-a 42s ease-in-out infinite alternate;
}

/* chmura B — chłodniejsza, inny tor i FAZA → brak synchronu */
.hero__clouds::after {
  top: -15%;
  right: -20%;
  left: auto;
  background: radial-gradient(
    closest-side,
    oklch(0.38 0.15 18 / 0.45),
    transparent 70%
  );
  animation: drift-b 57s ease-in-out infinite alternate;
}

/* tory ruchu — translate + delikatny rotate + scale.
   Czasy 42s vs 57s są NIEPODZIELNE → pętla nigdy się nie „spina" wizualnie. */
@keyframes drift-a {
  from {
    transform: translate3d(0, 0, 0) rotate(0deg) scale(1);
  }
  to {
    transform: translate3d(7%, 6%, 0) rotate(7deg) scale(1.18);
  }
}
@keyframes drift-b {
  from {
    transform: translate3d(0, 0, 0) rotate(0deg) scale(1.12);
  }
  to {
    transform: translate3d(-6%, -5%, 0) rotate(-6deg) scale(1);
  }
}
```

> **Opcjonalny akcent:** `mix-blend-mode: screen;` na pseudo-elementach daje ładne „dodawanie" czerwieni
> tam, gdzie chmury się nakładają. Blend ma koszt — włącz i zmierz; jeśli na mobile cokolwiek tnie, zdejmij.

### 3.3 Raster kropek (z2) — statyczny

```css
.hero__dots {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  /* CZARNA, nieprzezroczysta kropka + przezroczysta przerwa.
     Czerwone tło (chmury) widać MIĘDZY kropkami; same kropki są czarne. */
  background-image: radial-gradient(
    circle,
    #000 0 1.1px,
    /* czarna kropka */ transparent 1.5px
      /* przerwa — tędy widać czerwień spod spodu */
  );
  background-size: 7px 7px; /* gęstość rastra — mniejsza wartość = gęściej */
  /* opcjonalna delikatna winieta SAMEGO rastra (gęstość „gaśnie" na brzegach) */
  -webkit-mask-image: radial-gradient(
    ellipse 80% 80% at 50% 45%,
    #000 35%,
    transparent 85%
  );
  mask-image: radial-gradient(
    ellipse 80% 80% at 50% 45%,
    #000 35%,
    transparent 85%
  );
}
```

> **HiDPI / shimmer:** sub-pikselowe rozmiary kropek (1.1px) na retinie potrafią lekko „migotać" przy
> skalowaniu. Jeśli zauważysz — albo zaokrąglij do pełnych px, albo zamień raster na malutki kafel
> SVG/WebP (`background-image: url(...)`, `background-repeat`). CSS daje pełną kontrolę i 0 assetu —
> zostań przy nim, dopóki nie widać problemu.

### 3.4 Treść (z3)

```css
.hero__content {
  position: relative;
  z-index: 3;
}
```

---

## 4. Mobile + reduced-motion + pauza poza ekranem

### 4.1 `prefers-reduced-motion` — twardy zakaz ruchu

```css
@media (prefers-reduced-motion: reduce) {
  .hero__clouds::before,
  .hero__clouds::after {
    animation: none;
  }
}
```

### 4.2 Mobile — degradacja (zgodnie z decyzją: spowolnić / mniej / zamrozić)

```css
@media (max-width: 768px) {
  /* domyślnie: mocno spowolnij (mniej pracy GPU, spokojniejszy ruch przy scrollu) */
  .hero__clouds::before {
    animation-duration: 80s;
  }
  .hero__clouds::after {
    animation-duration: 105s;
  }

  /* gdyby testy na realnym telefonie pokazały jakikolwiek jank — zamroź całkiem:
  .hero__clouds::before,
  .hero__clouds::after { animation: none; } */
}
```

> Zacznij od „spowolnij". Zamrożenie trzymaj jako bezpiecznik włączany dopiero po pomiarze na sprzęcie.

### 4.3 Pauza, gdy hero zjedzie z ekranu (mały vanilla, BEZ GSAP)

CSS keyframes nie pauzują się same poza ekranem. Togglujemy klasę przez `IntersectionObserver`
(animacja siedzi na pseudo-elementach, więc sterujemy nią z poziomu CSS, nie inline-stylem):

```css
.hero.is-paused .hero__clouds::before,
.hero.is-paused .hero__clouds::after {
  animation-play-state: paused;
}
```

```astro
<script>
  // hero/index.astro — ~10 linii, zero zależności
  const hero = document.querySelector<HTMLElement>(".hero");
  if (hero) {
    const io = new IntersectionObserver(
      ([entry]) => hero.classList.toggle("is-paused", !entry.isIntersecting),
      { threshold: 0 },
    );
    io.observe(hero);
  }
</script>
```

To świadomie poza GSAP — zero kosztu względem Twoich animacji scrollowych, brak żywego tickera.

---

## 5. Checklista performance (zanim uznasz „gotowe")

- [ ] W keyframes **tylko** `transform` (i ewentualnie `opacity`). Zero `background-position`, `width`, `top/left`, `filter`.
- [ ] `will-change: transform` **wyłącznie** na warstwie chmur — nigdy na kropkach, nigdy globalnie (zżera pamięć GPU).
- [ ] Miękkość chmur z `radial-gradient` (przezroczyste wygaszenie), **nie** z `filter: blur` w animacji.
- [ ] Bloby **oversized** (~130%) + ruch w `%` → krawędzie nigdy nie wjeżdżają w kadr.
- [ ] Czasy trwania **niepodzielne** (42s vs 57s) → brak widocznego „spięcia" pętli.
- [ ] `overflow: clip` na `.hero` (oversized bloby nie robią poziomego scrolla).
- [ ] `isolation: isolate` (czysty stacking context; blend modes nie wyciekają na resztę strony).
- [ ] `prefers-reduced-motion: reduce` → `animation: none`.
- [ ] Degradacja `@media (max-width: 768px)` ustawiona.
- [ ] Pauza `IntersectionObserver` aktywna.
- [ ] **Test na realnym mid-range Androidzie**, nie tylko na CPU-throttlingu w DevTools.
- [ ] DevTools → Rendering → „Paint flashing": podczas animacji **nie powinno migać** (zero repaintów). Jeśli miga → coś animuje Paint, szukaj winowajcy.
- [ ] LCP = nagłówek hero, nie tło. Sprawdź w Lighthouse, że tło nie jest LCP-elementem.

---

## 6. Pułapki specyficzne (na co się nadziejesz)

- **`filter: blur` w keyframes** — najczęstszy zabójca fps. Blur ma być statyczny na warstwie (albo wcale, jeśli używasz miękkiego radial-gradient).
- **`will-change` „na wszelki wypadek" wszędzie** — odwrotny efekt: za dużo compositor-layerów = wyczerpana pamięć GPU = jank. Tylko na tym, co realnie się rusza.
- **Animowanie kontenera `__clouds` zamiast blobów** — jeśli ruszysz rodzica, ruszą się oba bloby zgodnie (sztywno). Ruch ma być na _każdym blobie osobno_, z inną fazą — stąd organiczność.
- **`100vh` na mobile** — pasek adresu „skacze". Użyj `100svh` (albo `dvh`/`lvh` zależnie od pożądanego zachowania).
- **Synchron pętli** — równe czasy (np. 40s i 40s) dadzą widoczny rytm. Trzymaj wartości niepodzielne.
- **`mask-image` na Safari** — pamiętaj o prefiksie `-webkit-mask-image` (ujęte w kodzie wyżej).
- **Kolizja z animacjami scrollowymi GSAP** — to tło żyje na kompozytorze (CSS), Twój GSAP po scrollu działa na innych elementach. Nie wchodzą sobie w drogę; pauza offscreen dodatkowo zwalnia GPU, gdy scrollujesz dalej w dół.

---

## TL;DR pod implementację

- **Technika:** czysty CSS, 4 warstwy (niebo → chmury → kropki → treść). Animacja **wyłącznie `transform`** na 2–3 rozmytych blobach `radial-gradient` o niepodzielnych czasach i różnych fazach → organiczny, wolny dryf łuny.
- **Kropki:** statyczny raster `radial-gradient` — **czarne, nieprzezroczyste kropki** (przerwy przezroczyste) **nad** chmurami. Czerwone tło widać _między_ kropkami → czyta się jako czarny halftone na czerwonej łunie (nie jako „czerwone kropki"). Zero animacji, rasteryzowany raz.
- **Miękkość:** z przezroczystego wygaszenia gradientu, **nie** z `filter: blur` w keyframes.
- **Mobile:** spowolnienie przez `@media`, bezpiecznik „zamroź" po pomiarze; `prefers-reduced-motion` → stop.
- **Pauza offscreen:** ~10 linii vanilla `IntersectionObserver` + klasa `is-paused`. Bez GSAP — nie obciąża animacji scrollowych.
- **Wideo / WebGL:** odrzucone na tym etapie (LCP/transfer/ostrość kropek; obcość stackowi). WebGL = ewentualny późniejszy upgrade jakości, nie potrzeba.
- **Bramka:** Paint flashing czysty, LCP = nagłówek, test na realnym Androidzie.
