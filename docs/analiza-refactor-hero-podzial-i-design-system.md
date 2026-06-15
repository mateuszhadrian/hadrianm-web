# Analiza refaktoru `Hero.astro` — podział pliku i design system

> Dokument decyzyjny przed refaktorem komponentu `src/components/sections/hero/Hero.astro`.
> Zakres: **(A)** podział pliku w Astro, **(B)** organizacja kodu wg etapów animacji GSAP,
> **(C)** wyodrębnienie kolorów/stylów do globalnego design systemu.
> Sekcja Hero **nie jest skończona** — dojdzie jeszcze animacja treści wyświetlanej na ekranach
> (laptop + smartfon), więc scena urządzeń będzie rosła i refaktor ma jej zrobić miejsce.
>
> Kierunki zatwierdzone z użytkownikiem (2026-06-15): 1 → stopniowy podział na pod-komponenty
> (najpierw scena urządzeń) + wydzielony skrypt; 2 → design system wprowadzamy teraz, minimalnie;
> 3 → tokeny jako custom properties w `:root`; 4 → globalnie tylko warstwa brandowa + wspólna paleta coral,
> `chassis`/wymiary urządzeń zostają lokalnie; 5 → najpierw ten dokument, kod po akceptacji planu.

---

## 0. Stan obecny — diagnoza

`Hero.astro` ma **1308 linii** w jednym pliku:

| Część       | Linie    | ~Rozmiar | Co zawiera                                                             |
| ----------- | -------- | -------- | ---------------------------------------------------------------------- |
| Frontmatter | 1–12     | 12       | i18n, rozbicie akcentu na litery                                       |
| Template    | 14–118   | 105      | head (eyebrow/headline/scroll), `--live` accent, copy, scena urządzeń  |
| `<style>`   | 120–686  | 567      | tokeny lokalne, layout, scena 3D, media queries, keyframes             |
| `<script>`  | 688–1308 | 621      | budowa ekstruzji 3D, pomiary/geometria, `matchMedia`, 2× timeline GSAP |

To **najcięższy komponent w projekcie** i jednocześnie ten, który ma jeszcze urosnąć. Dla porównania reszta aplikacji jest drobna i czytelna: `Navbar.astro` (~712 l. z rozbudowaną logiką responsywności), sekcje `Problem`/tła — po kilkadziesiąt linii.

### Co już działa dobrze (czego NIE psujemy)

- **Czysty kontrakt CSS↔JS przez zmienne CSS.** JS ustawia `--sl-lap`, `--sz-ph`, `--cx`, `--lap-yaw` itd., a CSS składa z nich `transform`. To dobry, rozszerzalny wzorzec — zostaje.
- **Atrybuty `data-gsap="…"` / `data-extrude`** jako stabilne hooki selektorów — zostają.
- **Dostępność i `prefers-reduced-motion`** przemyślane (ghost zostaje w drzewie a11y, fallback bez ruchu) — zostają.
- **`matchMedia` desktop vs mobile** z osobnym timeline i `cleanup()` — poprawny wzorzec GSAP w Astro.

### Realne problemy

1. **Jeden plik miesza trzy odrębne odpowiedzialności**: tekstowy hero (headline + copy) oraz samodzielna **scena urządzeń 3D** (własny model geometrii, ekstruzja, kamera, fit). Scena to ~60% CSS i ~75% JS pliku i będzie rosła o animację ekranów.
2. **Tokeny brandowe zduplikowane między komponentami** (szczegóły w §3) — z realnym **rozjazdem wartości**.
3. **Gradient akcentu powtórzony** wewnątrz samego Hero (litery + `em`).
4. Skrypt 621 linii bez podziału — trudny do nawigacji; przyszła animacja ekranów nie ma gdzie „usiąść" bez dalszego puchnięcia pliku.

---

## A. Podział pliku w Astro

### Czy Astro ma podział na html/ts/css jak np. Vue SFC?

**Nie.** Plik `.astro` jest z założenia jednoplikowy: frontmatter (`---`) + template + **scoped** `<style>` + `<script>`. Nie istnieje oficjalna konwencja „rozbij komponent na `Hero.html` + `Hero.ts` + `Hero.css`" w stylu rozdzielonego Vue SFC. To, co Astro **wspiera i co jest idiomatyczne**:

- **(a) Pod-komponenty `.astro`** — wydzielenie fragmentu template’u (z jego `<style scoped>` i `<script>`) do osobnego pliku `.astro`. To podstawowy mechanizm dekompozycji w Astro.
- **(b) Wydzielenie logiki do modułu `.ts`** — `<script>` importuje funkcję inicjalizującą z `./hero.ts`. Bundler (Vite) i tak pakuje `<script>` jako moduł, więc import zewnętrznego `.ts` jest naturalny. Zysk: logika testowalna/nawigowalna poza `.astro`.
- **(c) Wydzielenie CSS do pliku** — import `./hero.css` lub współdzielony plik globalny. **Uwaga:** CSS zaimportowany z zewnętrznego pliku **traci scoping** Astro (przestaje być automatycznie ograniczony do komponentu). Dlatego CSS sceny lepiej zostawić w `<style>` jej własnego pod-komponentu (zachowuje scoping), a do globala wyciągać tylko **tokeny** (§3).

### Rekomendacja (zatwierdzona): podział stopniowy, scena urządzeń najpierw

Scena urządzeń jest najlepszym pierwszym kandydatem, bo jest **najbardziej samodzielna i najbardziej urośnie**. Docelowa struktura katalogu:

```
src/components/sections/hero/
├─ Hero.astro            # kompozycja: head + copy + <DeviceScene/>, timeline-orkiestrator
├─ DeviceScene.astro     # markup sceny (.fit/.camera/.laptop/.phone) + scoped <style> sceny
├─ device-scene.ts       # ekstruzja 3D, geometry(), fit(), centerGroup(), measure/computeFrameC
└─ (opcjonalnie później)
   ├─ HeroHeadline.astro  # eyebrow + h1 + accent (ghost/live) + scroll
   └─ HeroCopy.astro      # bloki 01/02/03
```

**Kolejność wdrożenia (każdy krok osobno, weryfikowalny wizualnie):**

1. **`device-scene.ts`** — przenieść z `<script>` cały blok budowy/pomiarów sceny (obecne linie ~712–964: `buildExtrude`, `geometry`, `applyFrame`, `fit`, `centerGroup`, `measureCBbox`, `computeFrameC`, `layoutDevices`). Wyeksponować jako `initDeviceScene(devicesEl)` zwracające API potrzebne timeline’owi (np. `getFrameC()`, `relayout()`). `FRAME_C` staje się współdzieloną stałą modułu.
2. **`DeviceScene.astro`** — przenieść markup `.hero__devices` (linie 77–116) + cały CSS sceny (`.device-scene`, `.fit`, `.camera`, `.device`, `.extrude`, `.face`, `.screen`, `.laptop*`, `.phone*`, glow, oraz mobile’owe media tej sceny) do jego scoped `<style>`. Lokalne tokeny `--chassis-*`, wymiary `--lap-*`/`--ph-*`, `--glow`, `--glow-strength` **zostają tutaj** (decyzja 4).
3. **(opcjonalnie)** `HeroHeadline.astro` + `HeroCopy.astro` — gdy uznasz, że warto; nie jest to konieczne dla nadchodzącej animacji.

**Granica odpowiedzialności (ważna decyzja architektoniczna):**
timeline GSAP (`buildBase`, oba `mm.add(...)`) **zostaje w `Hero.astro`**, bo orkiestruje _relacje_ między head, copy i sceną (np. słowo „inna" → wyostrzenie urządzeń → przesuw grupy + wjazd copy). `device-scene.ts` odpowiada wyłącznie za **wewnętrzny stan sceny** (geometria, fit, pozycje bazowe), a timeline tylko czyta z niego dane (`frameC`) i animuje zmienne CSS. Dzięki temu **przyszła animacja ekranów** ma naturalne miejsce: nową treść/logikę ekranów dorabiamy w `DeviceScene.astro` + `device-scene.ts`, a ewentualne sprzęgnięcie ze scrollem — jako kolejny fragment timeline w `Hero.astro`.

---

## B. Podział wg etapów animacji GSAP

Rozważana alternatywa: zamiast (lub obok) podziału „po komponentach" — rozbić kod wg faz (faza 1: przelot słowa → urządzenia; faza 2: morph 3D / rozsunięcie + copy).

**Ocena: tak, ale jako organizacja _wewnątrz_ skryptu, nie jako osobne pliki.** Fazy są ze sobą ściśle sprzężone czasowo (wspólny scrub timeline, wspólne `start/end`, wspólny `cleanup`) — rozbijanie ich na osobne pliki rozerwałoby jeden obiekt `timeline` i pogorszyło czytelność. Zamiast tego:

- Zostawić wzorzec **`buildBase()` (wspólny szkielet) + `mm.add(desktop)` + `mm.add(mobile)`** — jest dobry.
- Wewnątrz każdego wariantu **wydzielić fazy do nazwanych funkcji-builderów**, np. `phase1WordToDevices(b, refs)` i `phase2MorphAndCopy(b, refs)`, każda dokładająca swoje `tl.to(...)` na własnym oknie czasu. Stałe faz (`PH2`, `APART_START`, `FRAME_C`) — pogrupowane na górze wariantu.
- Komentarze fazowe, które już masz (`// FAZA 2 …`), stają się granicami funkcji.

To daje czytelność „po etapach" bez łamania spójności timeline’u i bez sztucznego rozbijania na pliki. **Animacja ekranów** dołączy najpewniej jako nowa faza (np. `phase3ScreenContent`) — wzorzec funkcji-builderów przyjmie ją bez tarcia.

---

## C. Design system — tokeny globalne

### Stan obecny: tokeny są, ale rozproszone i niespójne

Co już jest scentralizowane: **fonty** w `src/styles/global.css` przez Tailwind v4 `@theme` (`--font-display/-body/-serif/-mono`). To znaczy, że częściowy design system już istnieje — brakuje warstwy **kolorów**.

Zduplikowane tokeny brandowe (to samo, definiowane 2×):

| Token      | `.hero` (Hero.astro:124–129)     | `.nav-root` (Navbar.astro:125–131) | Uwaga                                          |
| ---------- | -------------------------------- | ---------------------------------- | ---------------------------------------------- |
| `--ink`    | `#f5f0ec`                        | `#f5f0ec`                          | zgodne                                         |
| `--muted`  | `rgba(245,240,236,.58)`          | `rgba(245,240,236,.58)`            | zgodne                                         |
| `--faint`  | `rgba(245,240,236,.34)`          | `rgba(245,240,236,.34)`            | zgodne                                         |
| `--line`   | `rgba(245,240,236,.14)`          | `rgba(245,240,236,.12)`            | **ROZJAZD** (.14 vs .12)                       |
| `--accent` | `#ff5a47`                        | `#ff5a47`                          | zgodne                                         |
| `--glow`   | `255,90,71` (w `.hero__devices`) | `255,90,71`                        | zgodne, ale w Hero żyje tylko w bloku urządzeń |

Inne powtórzenia:

- **Gradient akcentu** `linear-gradient(105deg,#fff6f0 0%,#ffb3a6 100%)` — Hero.astro:192–194 (litery akcentu) **i** :285 (`em` w copy). Identyczny, 2×.
- **Paleta coral w `oklch(...)`** — powtarzana między `HeroBackground.astro` i `ProblemBackground.astro` (m.in. `oklch(0.468 0.147 21.133)`, `oklch(0.395 0.143 21.99)`, `oklch(0.42 0.09 …)`). To „chmury/glow" tła — rodzina kolorów, nie pojedyncza wartość.
- **Near-black** `#070506` w `HeroBackground` (winieta + raster).

### Decyzja (zatwierdzona): mechanizm = `:root` custom properties

Projekt pisze CSS „ręcznie" przez `var(--…)`, nie utilitami Tailwinda. Dlatego tokeny kolorów trafiają do **`:root` w `global.css`** (a nie do `@theme`). Fonty zostają w `@theme` jak teraz. (`@theme` rozważymy tylko, jeśli kiedyś przejdziemy na pisanie klasami utility — wtedy tokeny stałyby się też `text-ink` itd.)

### Zakres (zatwierdzony): warstwa brandowa + wspólna paleta coral; reszta lokalnie

**Do globala (`:root`):**

```css
:root {
  /* foreground / brand */
  --ink: #f5f0ec;
  --muted: rgba(245, 240, 236, 0.58);
  --faint: rgba(245, 240, 236, 0.34);
  --line: rgba(245, 240, 236, 0.14); /* ujednolicenie rozjazdu — patrz niżej */

  /* accent */
  --accent: #ff5a47;
  --glow: 255, 90, 71; /* trzymane jako składowe RGB pod rgba(var(--glow), α) */
  --accent-gradient: linear-gradient(105deg, #fff6f0 0%, #ffb3a6 100%);
}
```

Opcjonalnie (do rozważenia w trakcie, nie blokujące): rodzina coralowych tonów tła jako `--bg-coral-1..n` w `oklch`, jeśli chcemy spójności między tłami sekcji. Wymaga świadomej decyzji „która wartość jest kanoniczna" — proponuję zrobić to **osobnym krokiem** po podstawowych tokenach, żeby nie mieszać refaktoru z dostrajaniem wyglądu teł.

**Zostaje lokalnie (decyzja 4):** w `DeviceScene.astro` — `--chassis-1/2/3`, `--glow-strength`, wszystkie wymiary `--lap-*` / `--ph-*`. Są specyficzne dla sceny; globalizacja tylko by je rozmyła.

### Jedna decyzja do potwierdzenia w trakcie: `--line` = `.14` czy `.12`?

Rozjazd trzeba rozstrzygnąć przy ujednoliceniu. Rekomendacja: **`.14`** (delikatnie czytelniejsze linie; Hero używa go na dividerach copy, gdzie ma znaczenie). Navbar wizualnie nie ucierpi. Jeśli wolisz wartość z navbara — zmiana to jedna liczba.

### Po wprowadzeniu tokenów

- Z `.hero` i `.nav-root` **usuwamy lokalne definicje** tych zmiennych (zostają tylko `var(--…)` w użyciach — dziedziczą z `:root`).
- W Hero `linear-gradient(105deg,…)` → `var(--accent-gradient)` w obu miejscach.
- `--glow` w `.hero__devices` można usunąć (odziedziczy z `:root`), o ile scena ma dostęp do globalnego `:root` — ma, bo `:root` jest globalny.

---

## Rekomendowany plan wdrożenia (po akceptacji)

Każdy krok to osobny, mały, weryfikowalny commit. Wizualnie **nic się nie zmienia** (poza świadomym ujednoliceniem `--line`).

1. **Design system — tokeny.** Dodać `:root` w `global.css`; usunąć duplikaty z `.hero`/`.nav-root`; podmienić gradient na `--accent-gradient`. Ujednolicić `--line`. _(Najniższe ryzyko, natychmiastowy zysk, niezależne od podziału pliku.)_
2. **Wydzielić `device-scene.ts`** ze skryptu Hero; `Hero.astro` importuje `initDeviceScene`.
3. **Wydzielić `DeviceScene.astro`** (markup + scoped CSS sceny + lokalne tokeny). `Hero.astro` osadza `<DeviceScene/>`.
4. **Uporządkować timeline wg faz** (funkcje-buildery `phase1…`, `phase2…`) wewnątrz wariantów `mm.add`.
5. **(Opcjonalnie)** `HeroHeadline.astro` + `HeroCopy.astro`.

Po kroku 3 nadchodząca **animacja ekranów** ma gotowe miejsce: treść/logika w `DeviceScene.astro` + `device-scene.ts`, sprzęgnięcie ze scrollem jako nowa faza w `Hero.astro`.

---

## Ryzyka i czego pilnować

- **Scoping CSS przy podziale.** Przenosząc CSS sceny do `DeviceScene.astro`, zachowujemy go w `<style>` tego komponentu (scoped). Uwaga na obecny `:global(.extrude__layer)` (Hero.astro:391) — warstwy są tworzone z JS, więc selektor i tak musi być `:global`; po przeniesieniu zostaje `:global` wewnątrz `DeviceScene`.
- **Selektory cross-komponentowe.** Timeline w `Hero.astro` używa `q("[data-gsap='laptop']")` itd. Po wydzieleniu sceny te elementy nadal są w DOM (renderowane przez `<DeviceScene/>`), więc `document.querySelector` działa bez zmian — ale to świadoma zależność: `Hero` zna `data-gsap` hooki sceny. Utrzymać te atrybuty jako stabilny „kontrakt".
- **Kolejność inicjalizacji.** `device-scene.ts` musi policzyć layout zanim timeline odczyta `frameC`. Zachować obecną sekwencję (`layoutDevices()` przed budową timeline) przy przenoszeniu.
- **Nie globalizować za dużo.** `--chassis-*` i wymiary urządzeń zostają lokalne; paleta coral tła — osobny, świadomy krok.
- **`prefers-reduced-motion` i `matchMedia`** muszą przetrwać podział bez zmian zachowania — weryfikować po każdym kroku.

---

## TL;DR

- **A. Podział pliku:** Astro nie ma „SFC z osobnymi plikami". Idziemy stopniowo w pod-komponenty + wydzielony skrypt — **najpierw scena urządzeń** (`DeviceScene.astro` + `device-scene.ts`), bo jest samodzielna i urośnie o animację ekranów. Timeline-orkiestrator zostaje w `Hero.astro`.
- **B. Etapy GSAP:** organizować jako **funkcje-buildery faz wewnątrz skryptu**, nie osobne pliki (jeden timeline scrub trzeba trzymać razem).
- **C. Design system:** tokeny brandowe są zduplikowane (z rozjazdem `--line` .14/.12) i gradient akcentu powtórzony. Wyciągamy warstwę brandową + gradient do **`:root` w `global.css`**; `chassis`/wymiary urządzeń zostają lokalnie; paleta coral tła — opcjonalny osobny krok.
- **Plan:** 5 małych kroków, zaczynając od tokenów (zerowe ryzyko), kończąc na opcjonalnym rozbiciu head/copy. Wizualnie bez zmian.
