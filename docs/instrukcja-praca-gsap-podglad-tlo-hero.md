# Jak zacząć pracę nad stroną GSAP — struktura, podgląd (desktop + mobile), pierwszy przykład

> Instrukcja zakłada **gotowy scaffold** z [`instrukcja-scaffold-astro-gsap.md`](./instrukcja-scaffold-astro-gsap.md)
> (Astro 6 `output: 'static'`, React islands, Tailwind v4, GSAP 3, i18n `pl`/`en`, alias `@/*`, `src/styles/global.css`).
> Po jej przejściu będziesz mieć: czystą strukturę plików, pierwszą stronę z animacją **GSAP + ScrollTrigger**
> do wklejenia oraz podgląd live **na tym komputerze i na telefonie** (ten sam WiFi).
> Na końcu — opcjonalna sekcja: animowane tło hero wg [`analiza-tlo-hero-animowane-chmury.md`](./analiza-tlo-hero-animowane-chmury.md) (wariant A, czysty CSS).

---

## 0. Mapa — co i gdzie

Pracujesz w `src/`. Docelowo każda sekcja strony to osobny komponent `.astro`, składany w stronie przez wspólny layout:

```
src/
  layouts/
    BaseLayout.astro     ← <html>/<head>/<body>, import global.css, meta viewport
  components/
    ScrollDemo.astro     ← TU piszesz i testujesz animacje GSAP (przykład z sekcji 4)
    Hero.astro           ← (opcjonalnie, sekcja 5) hero z animowanym tłem
  pages/
    index.astro          ← PL,  trasa /         → składa layout + komponenty
    en/index.astro       ← EN,  trasa /en/
  styles/
    global.css           ← Tailwind + globalne style/tokeny
```

**Gdzie ląduje kod animacji:** wewnątrz komponentu `.astro` w bloku `<script>`. Astro bundluje ten skrypt
(TypeScript + importy z `node_modules` działają out-of-the-box), wysyła go do przeglądarki jako moduł i odpala
po stronie klienta — dokładnie to, czego potrzebuje GSAP. **Nie** potrzebujesz tu Reacta.

---

## 1. Struktura plików — utwórz raz

### 1.1 `src/layouts/BaseLayout.astro`

Wspólna „rama" każdej strony. Importuje `global.css` i — **ważne dla mobile** — ustawia poprawny `viewport`
(scaffoldowy `index.astro` ma niepełny `width=device-width` bez `initial-scale=1`, przez co telefon potrafi
przeskalować layout; tu to naprawiamy raz dla wszystkich stron).

```astro
---
import "@/styles/global.css";

interface Props {
  title?: string;
  lang?: string;
}
const { title = "Hadrian — studio webdev", lang = "pl" } = Astro.props;
---

<!doctype html>
<html lang={lang}>
  <head>
    <meta charset="utf-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="generator" content={Astro.generator} />
    <title>{title}</title>
  </head>
  <body>
    <slot />
  </body>
</html>
```

### 1.2 `src/pages/index.astro` (PL, trasa `/`)

Podmień obecną zawartość pliku na:

```astro
---
import BaseLayout from "@/layouts/BaseLayout.astro";
import ScrollDemo from "@/components/ScrollDemo.astro";
---

<BaseLayout title="Hadrian — demo GSAP" lang="pl">
  <ScrollDemo />
</BaseLayout>
```

### 1.3 `src/pages/en/index.astro` (EN, trasa `/en/`)

Utwórz katalog `en/` i plik — na razie ta sama treść, inny `lang` (tłumaczenia stringów dorobisz później przez `src/i18n/`):

```astro
---
import BaseLayout from "@/layouts/BaseLayout.astro";
import ScrollDemo from "@/components/ScrollDemo.astro";
---

<BaseLayout title="Hadrian — GSAP demo" lang="en">
  <ScrollDemo />
</BaseLayout>
```

> `prefixDefaultLocale: false` (z configu) sprawia, że PL jest pod `/`, a EN pod `/en/`. Przełączanie języka
> (link `/` ↔ `/en/`) dorobisz w nawigacji na etapie implementacji.

Komponent `ScrollDemo.astro` tworzysz w sekcji 4.

---

## 2. Podgląd na desktopie (ten komputer)

```bash
pnpm dev
```

Astro wystaje na **http://localhost:4321** — otwórz w przeglądarce. Hot-reload działa: zapis pliku =
natychmiastowe odświeżenie. Trasa EN: `http://localhost:4321/en/`. Zatrzymanie serwera: `Ctrl+C`.

---

## 3. Podgląd na telefonie (ten sam WiFi) — `--host`

Domyślny `pnpm dev` słucha tylko na `localhost` (niewidoczny dla telefonu). Wystaw go w sieci lokalnej:

```bash
pnpm dev --host
```

Astro wypisze dwa adresy, np.:

```
  ┃ Local    http://localhost:4321/
  ┃ Network  http://192.168.1.23:4321/
```

Na telefonie (podłączonym do **tego samego WiFi**) wejdź na adres **Network**. Hot-reload działa też na telefonie.

**Jak ręcznie znaleźć IP komputera (macOS),** gdyby Astro go nie pokazało:

```bash
ipconfig getifaddr en0   # WiFi; jeśli pusto, spróbuj en1
```

Adres na telefonie to wtedy `http://<to-IP>:4321`.

> **Opcjonalny skrót** — w `package.json` w `scripts` możesz dodać `"dev:host": "astro dev --host"`,
> żeby nie pisać flagi za każdym razem.

**Jeśli telefon nie łączy się:**

- Sprawdź, że oba urządzenia są w **tej samej sieci** (nie „gość"/guest WiFi, nie VPN na telefonie).
- macOS firewall: _Ustawienia → Sieć → Zapora_ — albo wyłącz na czas pracy, albo zezwól node/terminalowi na połączenia przychodzące (system zwykle pyta przy pierwszym `--host`).
- Adres wpisuj z `http://` i portem `:4321` (nie `https`).

> **Tip — DevTools mobile na desktopie:** zanim sięgniesz po telefon, w Chrome DevTools (`Cmd+Opt+I`) włącz
> _Toggle device toolbar_ (`Cmd+Shift+M`) i wybierz np. iPhone — szybka iteracja layoutu. Ale fps animacji
> i zachowanie scrolla **zawsze potwierdzaj na realnym telefonie** (DevTools nie oddaje GPU/termiki urządzenia).

---

## 4. Pierwszy przykład — strona z animacją GSAP + ScrollTrigger (do wklejenia)

To minimalny, ale realistyczny przykład: wysoka strona z **przypiętą** sekcją, w której kwadrat obraca się
i skaluje **w rytm scrolla** (`pin` + `scrub`). Zawiera `gsap.matchMedia` (a11y: szanuje
`prefers-reduced-motion`) i sprzątanie — czyli wzorzec, którego będziesz używać na całej stronie.

Utwórz `src/components/ScrollDemo.astro` i wklej całość:

```astro
---
// src/components/ScrollDemo.astro
// Demo GSAP + ScrollTrigger: pin (przypięcie) + scrub (postęp = scroll).
---

<main>
  <section class="screen intro">
    <h1>Scrolluj w dół ↓</h1>
  </section>

  <section class="screen panel" data-pin>
    <div class="box" data-box>GSAP</div>
  </section>

  <section class="screen outro">
    <h2>Koniec dema 🎉</h2>
  </section>
</main>

<style>
  .screen {
    min-height: 100svh; /* svh = stabilna wysokość na mobile (pasek adresu) */
    display: grid;
    place-items: center;
    color: #fff;
    font-family: system-ui, sans-serif;
  }
  .intro {
    background: #0a0507;
  }
  .panel {
    background: #140a0d;
    overflow: clip;
  }
  .outro {
    background: #0a0507;
  }
  .box {
    display: grid;
    place-items: center;
    width: 140px;
    height: 140px;
    border-radius: 16px;
    background: oklch(0.55 0.2 25); /* czerwień */
    font-weight: 700;
    font-size: 1.25rem;
    will-change: transform; /* promocja do warstwy GPU — animujemy transform */
  }
</style>

<script>
  import { gsap } from "gsap";
  import { ScrollTrigger } from "gsap/ScrollTrigger";

  gsap.registerPlugin(ScrollTrigger); // konieczne — chroni plugin przed tree-shakingiem

  // matchMedia = responsywność + a11y w jednym; zwrócony cleanup leci automatycznie
  const mm = gsap.matchMedia();

  mm.add("(prefers-reduced-motion: no-preference)", () => {
    const panel = document.querySelector<HTMLElement>("[data-pin]");
    const box = document.querySelector<HTMLElement>("[data-box]");
    if (!panel || !box) return;

    gsap.to(box, {
      rotate: 360,
      scale: 2.4,
      ease: "none",
      scrollTrigger: {
        trigger: panel,
        start: "top top", // start, gdy góra panelu dotknie góry ekranu
        end: "+=120%", // koniec po przescrollowaniu 120% wysokości okna
        pin: true, // przypnij panel na czas animacji
        scrub: true, // postęp animacji = pozycja scrolla (płynnie tam i z powrotem)
        // markers: true, // ← odkomentuj, by zobaczyć punkty start/end
      },
    });

    // sprzątanie (HMR przy zapisie pliku / ewentualne View Transitions)
    return () => ScrollTrigger.getAll().forEach((t) => t.kill());
  });
</script>
```

**Podejrzyj efekt:** `pnpm dev --host` → na desktopie `localhost:4321`, na telefonie adres Network.
Scrolluj — kwadrat przypina się i kręci w tempie scrolla. Włącz `markers: true`, żeby zobaczyć mechanikę
`start`/`end`. Z włączonym systemowym „ogranicz ruch" (reduced motion) animacja świadomie nie startuje.

**Co tu zmieniać na start (zabawa):** `rotate`/`scale` (cel animacji), `end: "+=120%"` (jak długo trwa pin),
`scrub: true` → `scrub: 1` (dodaje „bezwładność" 1s), `ease`. To wystarczy, żeby poczuć ScrollTrigger.

> **Dlaczego `transform` (rotate/scale), a nie `width`/`top`:** `transform` i `opacity` pomijają Layout i Paint,
> lecą prosto na GPU → płynność. To ta sama zasada, na której stoi tło hero z sekcji 5.

---

## 5. (Opcjonalnie) Animowane tło hero — wariant A (czysty CSS)

Tło, które ma się pojawić **od razu po wejściu** i trwać przez całą pierwszą sekcję (hero). Realizacja wg
[`analiza-tlo-hero-animowane-chmury.md`](./analiza-tlo-hero-animowane-chmury.md): **wariant A — czysty CSS,
animacja wyłącznie na `transform`**. Cztery warstwy: niebo → czerwone chmury (jedyny ruch) → czarny raster
kropek → treść. To **nie GSAP** — żyje na kompozytorze i nie wchodzi w drogę Twoim animacjom scrollowym.

### 5.1 Komponent `src/components/Hero.astro`

```astro
---
// src/components/Hero.astro — animowane tło hero (wariant A, czysty CSS)
---

<section class="hero">
  <div class="hero__clouds" aria-hidden="true"></div>
  <!-- z1: ::before + ::after = 2 chmury -->
  <div class="hero__dots" aria-hidden="true"></div>
  <!-- z2: statyczny raster kropek -->
  <div class="hero__content">
    <!-- z3: treść (LCP) -->
    <slot />
  </div>
</section>

<style>
  /* z0 — NIEBO + kontener */
  .hero {
    position: relative;
    min-height: 100svh; /* stabilna wysokość na mobile */
    background: #0a0507;
    overflow: clip; /* oversized bloby nie robią poziomego scrolla */
    isolation: isolate; /* własny stacking context */
  }

  /* z1 — CHMURY (jedyna animowana warstwa) */
  .hero__clouds {
    position: absolute;
    inset: 0;
    z-index: 1;
    pointer-events: none;
  }
  .hero__clouds::before,
  .hero__clouds::after {
    content: "";
    position: absolute;
    width: 130%; /* oversize: ruch nigdy nie odsłoni krawędzi blobu */
    height: 130%;
    border-radius: 50%;
    will-change: transform; /* promocja do warstwy GPU — TYLKO tutaj */
  }
  .hero__clouds::before {
    top: -25%;
    left: -10%;
    background: radial-gradient(
      closest-side,
      oklch(0.42 0.17 25 / 0.6),
      oklch(0.3 0.14 22 / 0.25) 45%,
      transparent 72%
    );
    animation: drift-a 42s ease-in-out infinite alternate;
  }
  .hero__clouds::after {
    top: -15%;
    right: -20%;
    left: auto;
    background: radial-gradient(
      closest-side,
      oklch(0.38 0.15 18 / 0.45),
      transparent 70%
    );
    animation: drift-b 57s ease-in-out infinite alternate; /* czas niepodzielny z 42s → brak synchronu */
  }
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

  /* z2 — KROPKI (statyczny czarny halftone na czerwonej łunie) */
  .hero__dots {
    position: absolute;
    inset: 0;
    z-index: 2;
    pointer-events: none;
    background-image: radial-gradient(
      circle,
      #000 0 1.1px,
      /* czarna, nieprzezroczysta kropka */ transparent 1.5px
        /* przerwa — tędy widać czerwień */
    );
    background-size: 7px 7px; /* gęstość rastra; px ⇒ identycznie na mobile (patrz 5.2) */
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

  /* z3 — TREŚĆ */
  .hero__content {
    position: relative;
    z-index: 3;
    display: grid;
    place-items: center;
    min-height: 100svh;
    color: #fff;
  }

  /* a11y — twardy zakaz ruchu */
  @media (prefers-reduced-motion: reduce) {
    .hero__clouds::before,
    .hero__clouds::after {
      animation: none;
    }
  }

  /* mobile — SPOWOLNIENIE chmur (wg analizy). UWAGA: nie ruszamy tu rozmiaru kropek! */
  @media (max-width: 768px) {
    .hero__clouds::before {
      animation-duration: 80s;
    }
    .hero__clouds::after {
      animation-duration: 105s;
    }
    /* Bezpiecznik (włącz dopiero po pomiarze na realnym Androidzie, jeśli cokolwiek tnie):
    .hero__clouds::before,
    .hero__clouds::after { animation: none; } */
  }

  /* pauza, gdy hero zjedzie z ekranu (klasę toggluje skrypt niżej) */
  .hero.is-paused .hero__clouds::before,
  .hero.is-paused .hero__clouds::after {
    animation-play-state: paused;
  }
</style>

<script>
  // Pauza animacji poza ekranem — ~10 linii, zero zależności, BEZ GSAP.
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

### 5.2 Kropki o **identycznym rozmiarze w px** na mobile i desktopie — dlaczego to już działa

Twoje wymaganie: kropka ma mieć **dokładnie ten sam rozmiar w pikselach** na telefonie co na desktopie.
W powyższym kodzie jest to spełnione **z definicji**, bo:

- **Rozmiary podane są w bezwzględnych `px`** (`background-size: 7px 7px`, kropka `1.1px`, przerwa `1.5px`).
  Jednostka `px` w CSS to ten sam „kafelek" na każdym ekranie. Gdybyś użył `vw`/`vmin`/`%` — rozmiar
  skalowałby się z ekranem, czyli na telefonie byłby inny. **Nie rób tego dla kropek.**
- **Nie ma media query zmieniającej `background-size`** kropek. Na mobile zmieniamy tylko czas animacji
  _chmur_ — raster zostaje nietknięty. (To celowe; gdybyś chciał inny, ale wciąż **stały** raster na mobile,
  zmieniłbyś `background-size` na konkretną wartość w `px`, nigdy w `%`/`vw`.)
- **`viewport` z `initial-scale=1`** (z `BaseLayout`, sekcja 1.1) jest tu kluczowy: bez niego mobilne
  przeglądarki potrafią przeskalować całą stronę, co „rozjechałoby" wymiar kropek. Z nim 1 CSS px = 1 CSS px.

> **devicePixelRatio / retina:** na ekranie HiDPI (telefon, MacBook) kropka renderuje się **ostrzej** (więcej
> fizycznych pikseli na ten sam 1 CSS px), ale jej **rozmiar wizualny pozostaje identyczny** — i o to właśnie
> chodzi. Jeśli zauważysz delikatne „migotanie" sub-pikselowej kropki (`1.1px`) przy skalowaniu, zaokrąglij do
> pełnych px albo podmień raster na maleńki kafel SVG/WebP (`background-image: url(...)`, `background-repeat`).

### 5.3 Wpięcie hero na stronie

W `src/pages/index.astro` użyj `Hero` zamiast (lub obok) dema:

```astro
---
import BaseLayout from "@/layouts/BaseLayout.astro";
import Hero from "@/components/Hero.astro";
---

<BaseLayout title="Hadrian — studio webdev" lang="pl">
  <Hero>
    <div style="text-align:center">
      <h1>Nowoczesne, animowane strony WWW</h1>
      <p>Scrolluj ↓</p>
    </div>
  </Hero>
</BaseLayout>
```

Podgląd jak zwykle: `pnpm dev --host` → desktop + telefon.

### 5.4 Szybka kontrola tła (zanim uznasz „gotowe")

- DevTools → _Rendering_ → **Paint flashing**: podczas dryfu chmur ekran **nie powinien migać** (zero repaintów). Miga → coś animuje Paint, szukaj winowajcy (najczęściej `filter: blur` lub `background-position` w keyframes).
- **LCP = nagłówek hero**, nie tło (sprawdź w Lighthouse).
- `will-change: transform` **tylko** na chmurach — nigdy na kropkach ani globalnie.
- Czasy animacji **niepodzielne** (42s vs 57s) → pętla nie „spina się" wizualnie.
- Test na **realnym mid-range Androidzie**, nie tylko w throttlingu DevTools.

---

## 6. Ściąga / najczęstsze potknięcia

| Problem                           | Przyczyna / fix                                                                           |
| --------------------------------- | ----------------------------------------------------------------------------------------- |
| Telefon nie otwiera strony        | Brak `--host`; inny WiFi/guest/VPN; firewall macOS; wpisz `http://<IP>:4321` (nie https). |
| Animacja GSAP nie rusza           | Brak `gsap.registerPlugin(ScrollTrigger)`; włączony systemowy „reduced motion".           |
| ScrollTrigger źle się przypina    | Sprawdź `start`/`end` z `markers: true`; pin wymaga `trigger` o realnej wysokości.        |
| Kropki różnej wielkości na mobile | Użyto `%`/`vw` zamiast `px`, albo brak `initial-scale=1` w `viewport` (sekcja 1.1).       |
| Tło miga / spada fps              | `transform`/`opacity` only w keyframes; `filter: blur` ma być statyczny, nie animowany.   |
| Poziomy scroll od chmur           | Brak `overflow: clip` na `.hero` (bloby są oversized 130%).                               |
| Import `@/...` nie działa         | Alias `@/*` → `src/*` jest w `tsconfig.json` (scaffold); restart dev servera po zmianach. |

> Po skończonej zabawie pamiętaj o bramkach scaffolda przed commitem: `pnpm format && pnpm lint && pnpm typecheck && pnpm build`.
> Commity w formacie Conventional Commits (np. `feat: hero background + scroll demo`).
