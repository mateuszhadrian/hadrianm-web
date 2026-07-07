# Analiza: „odkruszenie" sekcji hero — refactor bez zmiany zachowania

> Cel: zmniejszyć **kruchość strukturalną** kodu hero (łatwość przypadkowego
> złamania inwariantów podczas edycji) przy zachowaniu identycznego działania
> co do piksela. Gotchas platformowe (GPU Androida, dekoder iOS, LPM) NIE
> znikną — to środowisko, nie kod — ale ich złamanie ma przestać być domyślnym
> skutkiem nieuważnej edycji.
>
> Powiązane: `docs/analiza-android-obudowy-3d-glodza-rasteryzacje.md`,
> `docs/naprawa-android-scena-urzadzen-mobile.md`,
> `docs/claude-code-ecosystem-initialization.md` (krok 0 = skill `/verify-mobile`).

---

## 1. Diagnoza

### 1.1. Dwa rodzaje kruchości

1. **Złożoność niezbywalna** — ograniczenia platform (limit warstwy GPU
   Androida, mimowolne pauzy dekodera iOS, Low Power Mode, brak `@property`
   w Safari < 16.4, dynamiczny toolbar). Nierefaktorowalne. Kod obsługuje je
   poprawnie (guardy, try/catch, cleanupy, self-heal, komentarze „dlaczego").
2. **Kruchość strukturalna** — sprzężenia utrzymywane pamięcią/komentarzem
   zamiast kodem. Refaktorowalna — i to jest przedmiot tego planu.

### 1.2. Dowody kruchości strukturalnej (stan na 2026-07-06)

| # | Problem | Gdzie |
|---|---|---|
| S1 | `min-height: 1233svh` (desktop) ręcznie wyliczone w komentarzu z `CAP_END=5.57 / 5.9 = 0.944 · 1200svh`; składniki żyją w JS (`PH3_START`, `DREWELOMET_DUR`, `DOG_PROGRESS`, `PHONE_END`) — zmiana któregokolwiek cicho rozjeżdża CSS. Gałąź mobile liczy analogiczną wartość POPRAWNIE w JS (`Hero.astro:1239-1242`) | `Hero.astro:512-522` vs `:681-682, :809-810, :841-843` |
| S2 | `K = 0.6` zduplikowane JS↔CSS z komentarzem „MUSI być spójny" | `device-scene.ts:107` ↔ `DeviceScene.astro:338` |
| S3 | Breakpoint `760px` w ~6 miejscach: media queries CSS + stringi `mm.add()` + `matchMedia` w JS | `Hero.astro:395,512,1129,1178`, `DeviceScene.astro:317`, `device-scene.ts:80,96` |
| S4 | Protokół zmiennych CSS sceny (`--sl-lap`, `--apart-ph`, `--ph-dx`, `--vid-scale`…) wypisywany ręcznie w 4 miejscach (2× cleanup, `centerGroup`, `measureCBbox`) — nowa zmienna wymaga pamiętania o wszystkich | `Hero.astro:660-677, 1386-1400`, `device-scene.ts:174-185, 227-233` |
| S5 | Monolityczny inline `<script>` ~840 linii w `Hero.astro`; karuzela captionów (~200 linii arytmetyki layoutu) nietestowalna, bo żyje w domknięciu | `Hero.astro:565-1403` |
| S6 | Kontrakt selektorów (`[data-gsap=…]`, `.dw-root`, `.hero__*`) rozproszony między pliki; brak węzła = cicha degradacja (`if (laptop)`) bez żadnego sygnału | `Hero.astro:653-658, 1133-1150`, `device-scene.ts:90-94` |

Precedens kosztu: scalenie stałych Lenis desktop/touch (`0640aa1`) —
regresja naprawiana osobnym commitem (`99ef97a`). Ten sam mechanizm
(niejawny inwariant + nieuważna edycja) czeka na każdy z punktów S1–S6.

---

## 2. Zasada nadrzędna i kryteria

**Inwarianty egzekwowane strukturą zamiast pamięcią.** Wartości pochodne
liczy kod (nie komentarz), wartości współdzielone mają jedno źródło,
protokoły są rejestrami (nie listami do ręcznego synchronizowania).

Kryterium ukończenia KAŻDEGO kroku (1–5):

- pixel-diff harnessu (krok 0) względem baseline'u = zero różnic,
- `pnpm typecheck` + `pnpm build` zielone,
- osobny commit (propozycja treści od Claude'a, commituje Mateusz),
- przy krokach oznaczonych 📱 — test na fizycznych urządzeniach PRZED
  commitem (sekcja 4).

Refactor najkruchszego kodu bez siatki regresyjnej byłby sam w sobie
najryzykowniejszą operacją w repo → krok 0 jest warunkiem wstępnym i
nie podlega pominięciu.

---

## 3. Kroki

### Krok 0 — siatka regresyjna (`scripts/verify-hero.mjs`) — NAJPIERW

> ℹ️ **AKTUALIZACJA (2026-07-07):** `scripts/verify-hero.mjs` został
> WYCOFANY — sweep hero żyje w `tests/visual/hero.spec.ts` (Playwright
> Test; mechanika 1:1, baseline'y per-platform commitowane w
> `tests/visual/__screenshots__/`, wideo maskowane natywnie zamiast
> `visibility:hidden`, część funkcjonalna w
> `tests/e2e/hero-functional.spec.ts`). Opis poniżej ma wartość
> historyczną; aktualny kontrakt: `.claude/rules/testing.md` i
> `docs/testing-tools-and-environemnts-setup-analysis.md`.

Harness screenshotowy: sweep progresu scrolla hero (ok. 10 punktów, od 0 do
tuż za odpięciem sticky) na 3 profilach (desktop 1440×900, iPhone 14,
Pixel 7 — Pixel dostaje UA Androida → ścieżka `is-android`), PL.

- Tryb `--baseline`: zapis wzorca do `.hero-verify/baseline/` (poza gitem).
- Tryb domyślny: nowe zrzuty + pixel-diff vs baseline (sharp, raw RGBA);
  raport per klatka; obrazy różnic do `.hero-verify/diff/`.
- Determinizm: injektowany styl wyłącza animacje CSS czasowe (drift tła,
  accent-wave, scroll-pulse) i chowa `.screen__video` (klatki wideo różnią
  się między przebiegami); scroll przez `window.__lenis.scrollTo(y,
  {immediate:true})` z fallbackiem `window.scrollTo`; settle = 2×rAF + timeout.
- Funkcjonalnie (poza pikselami): log stanu wideo (`paused`/`currentTime`)
  w strefach odtwarzania na profilach mobile.
- Serwer: `pnpm preview` (stan jak produkcja); URL przez `BASE_URL`.

Ograniczenie (świadome): emulacja NIE wykrywa problemów zależnych od
realnego GPU (limit warstwy → S2/`--k`) ani Low Power Mode — dokładnie
dlatego kroki dotykające tych obszarów mają obowiązkowy test 📱.

### Krok 1 — `hero-config.ts`: jedno źródło prawdy dla osi scrolla 📱(lekki)

- Wszystkie stałe osi czasu/scrolla do jednego typowanego modułu:
  desktop: `SCREENS=12`, `PH3_START`, `DREWELOMET_DUR`, `PHONE_START`,
  `PHONE_END`, `CAP_START`, `DOG_PROGRESS` (+ stałe karuzeli);
  mobile: `SCROLL_SCALE`, `LAP_SPAN`, `PH_SPAN`, `VID_MAX`, `GROW_END`,
  `HOLD_END`, `HERO_END_BUFFER`, `MOB_SETTLE_*`, `GAP_*_DIV`, `Z_PX`.
- Wartości pochodne LICZONE: `CAP_END = PH3_START + DREWELOMET_DUR *
  DOG_PROGRESS` (eksport, nie lokalna kopia w karuzeli); desktopowy
  `min-height` hero wyliczany w JS z tych stałych i ustawiany na elemencie
  (dokładnie jak robi to już gałąź mobile). CSS `1233svh` zostaje wyłącznie
  jako wartość wstępna przed hydracją z komentarzem „finalną ustawia JS".
- Test 📱: desktop (moment odpięcia przy „…najlepszy przedstawiciel") +
  szybki rzut na telefonach, że nic się nie przesunęło.

### Krok 2 — `platform.ts`: platforma w jednym miejscu 📱(KRYTYCZNY: Android)

- `IS_ANDROID` (przenosiny z android-mobile.ts), `MOBILE_MAX = 760`
  (stringi `matchMedia`/`mm.add` budowane z tej stałej),
  `ANDROID_DESIGN_SCALE = 0.6`.
- Usunięcie duplikacji `--k`: blok `html.is-android` w CSS i tak aplikuje
  się dopiero po dodaniu klasy przez JS → wartość `--k` ustawia JS
  (`setProperty`) z importowanej stałej w tym samym miejscu, gdzie dodaje
  klasę; CSS trzyma default `--k: 1`, a nadpisania `--ph-w/--ph-h` zostają
  w CSS pod klasą. Wartość 0.6 istnieje odtąd w JEDNYM pliku.
- Breakpoint w media queries CSS zostaje literałem z komentarzem-kontraktem
  (`/* = MOBILE_MAX w platform.ts */`) — pełne DRY w CSS kosztuje więcej
  niż daje.
- Test 📱 OBOWIĄZKOWY na fizycznym Androidzie: pełny przejazd hero —
  spód telefonu nieobcięty, captiony/bar nie znikają (emulacja tego NIE
  pokaże). Kontrolnie iPhone (w tym możliwie stary Safari — ścieżka bez
  `@property` ma pozostać nietknięta: iOS nigdy nie dostaje `is-android`).

### Krok 3 — `scene-vars.ts`: protokół zmiennych CSS jako rejestr

- Jedna stała z pełną listą custom properties protokołu sceny (nazwa +
  wartość spoczynkowa) + helpery `resetSceneVars(el, subset?)`.
- Cztery ręczne listy (S4) wołają helper. Nowa zmienna = jedno miejsce,
  cleanup pokrywa ją automatycznie.

### Krok 4 — rozbicie monolitu `<script>` Hero.astro 📱(pełna regresja)

Przeniesienie MECHANICZNE (zero zmian logiki), moduły w `hero/`:

- `timeline-base.ts` — `buildBase`, `cleanup`, `deviceRefs`;
- `desktop-phases.ts` — `phase1/2/3Desktop`, `phase3PhoneDesktop`;
- `caption-carousel.ts` — `initCaptionCarousel` (matematyka `render(u)`
  wydzielona jako czysta funkcja — od tej chwili testowalna jednostkowo);
- `mobile-phases.ts` — `phase1/2Mobile`, `initCaptionGrowth`, dividery.
- `Hero.astro` zostaje ~80-liniowym orkiestratorem (`mm.add` + wiring +
  importy).
- Test 📱: pełny przejazd na fizycznym iPhonie i Androidzie (desktop
  pokrywa harness).

### Krok 5 — `selectors.ts`: kontrakt selektorów + głośny dev

- Wszystkie selektory używane między plikami w jednym module.
- W dev (`import.meta.env.DEV`) brak wymaganego węzła → `console.warn`
  z nazwą kontraktu; w produkcji zachowanie bez zmian (graceful degrade).

### Krok 6 — inwarianty: kod ↔ rules

- Aktualizacja `.claude/rules/hero-device-scene.md` (z planu ekosystemu)
  o nowe ścieżki plików; skrócenie reguł, które przestały być potrzebne
  (spójność wymuszana kodem zamiast pamięcią: S1, S2, S4).
- Krótkie komentarze-kotwice w kodzie przy inwariantach niezbywalnych
  (G1–G8) wskazujące na docs/rules — większość już istnieje.

---

## 4. Testy na fizycznych urządzeniach (kiedy proszę Mateusza)

| Po kroku | Urządzenia | Co sprawdzić |
|---|---|---|
| 1 | desktop + szybki rzut na oba telefony | moment odpięcia sticky (desktop); brak przesunięć na mobile |
| 2 | **Android — obowiązkowo**, iPhone kontrolnie | spód telefonu nieobcięty; captiony + pasek widoczne przez cały przejazd; wideo gra |
| 4 | iPhone + Android — pełny przejazd | całość: wjazd urządzeń, wzrost captionów, pasek postępu z kulką, odpięcie, powrót scrollem w górę |
| 0, 3, 5, 6 | niepotrzebne | brak zmian w kodzie produktu (0, 6) / zmiany czysto mechaniczne pokryte harnessem (3, 5) |

Emulacja Playwright NIE wykrywa: limitu warstwy GPU (Android), zachowań
Low Power Mode, realnej termiki dekodera — stąd powyższa tabela.

## 4a. Interwencja 2026-07-06 (po kroku 3): iPhone, zimny cache — dwa objawy

Zgłoszone na produkcji (iPhone 15 Pro, po wyczyszczeniu danych przeglądania):
(1) hero odpinało się ~w połowie strefy telefonu na pasku; (2) urządzenia
widoczne od wejścia na stronę, znikały po chwili scrollowania. Oba objawy to
PRE-ISTNIEJĄCE wyścigi, które ujawnia dopiero zimny cache (późny
`window.load` przez duże MP4) — nie regresja kroków 1–3.

Przyczyny i naprawy (wszystkie trzy wdrożone):

1. **Rozjazd metryk svh ↔ innerHeight.** Wysokość sekcji była w `svh`
   (stabilne), a strefy/scrub liczą z `window.innerHeight` (rośnie ~15% po
   zwinięciu toolbara iOS). Późny refresh ScrollTriggera (window.load po
   zimnym cache, już po zwinięciu toolbara) rozciągał strefy, sekcja stała
   w miejscu → wczesne odpięcie (wyliczone: kulka na ~83% paska = ~52%
   w głąb strefy telefonu — zgodne z obserwacją). FIX: min-height w PX
   z `window.innerHeight` (ta sama metryka co triggery), przeliczany na
   `refreshInit` — obie gałęzie; przy starcie px ≡ dawnym svh (harness:
   identyczne wartości inline).
2. **`centerGroup()` bezpowrotnie zerował offsety wjazdu** (`--sl-*`,
   `--sz-*`…) przy pomiarze na resize. Desktop maskował to refreshem
   (re-render scruba), mobile z `ignoreMobileResize` — nie → urządzenia
   na środku ekranu do czasu dojechania scruba do tweenów wjazdu.
   FIX: snapshot → pomiar → restore (wyniki `--gx/--gy` zostają nowe).
3. **Widoczność wrappera urządzeń włączana bezwarunkowo przy budowie**
   (`gsap.set(devices, autoAlpha:1)`), zabezpieczona tylko off-screenowymi
   offsetami. FIX: widoczność bramkowana timeline'em
   (`tl.set(..., MOB_SETTLE_START)`) — przed wejściem urządzenia nie mogą
   być widoczne niezależnie od stanu offsetów.

4. **„za Ciebie" poniżej „mówi" na starcie (zgłoszone przy retescie).**
   Pozycja startowa słowa (from-values scruba) liczona przy budowie
   timeline'u; font Archivo z zimnego cache doładowuje się później i
   przesuwa nagłówek (zmierzone: −3,1 px), słowo zostawało na starej
   pozycji. Desktop miał częściową ochronę (fonts.ready→refresh w karuzeli),
   mobile żadnej. FIX: w `buildBase` po `document.fonts.ready` dociągnięcie
   słowa `gsap.set(live, {x,y})` (bez globalnego refresh — zbędny; naturalny
   refresh przeliczy from-values przez invalidateOnRefresh). Zweryfikowane
   emulacją z opóźnionymi fontami (route-delay 2,5 s): delta 0,0 px.

Weryfikacja: harness 33/33 = 0.000% diff (w emulacji px ≡ svh, brak zmiany
wyglądu); sondy inline min-height równe co do piksela wartościom sprzed
zmiany. Scenariusza „zimny cache + zwijany toolbar iOS" emulacja nie
odtwarza → wymagany test 📱 na iPhone 15 Pro po wyczyszczeniu danych.

Lekcja operacyjna (utrwalona strażnikiem w verify-hero.mjs; ℹ️ dziś ten
strażnik żyje jako `assertPreview` w `tests/helpers/guards.ts`): gdy na
4321 działa dev server (testy na telefonie przez --host), preview się nie
zbindował i harness porównywał DEV z baseline'em preview → fałszywe FAILe
(0,5–2% na ekranie telefonu). Harness wykrywa /@vite/client i przerywa
z instrukcją (preview na 4399).

Do kroku 6 (rules): inwariant „wysokość sekcji i triggery scrolla muszą
dzielić JEDNĄ metrykę viewportu"; wzorzec snapshot/restore przy pomiarach;
uwaga, że `normalizeScroll` i mechanizm `is-lowpower` NIE istnieją już w
kodzie (stare notatki wprowadzały w błąd).

## 5. Czego celowo NIE robimy

- NIE przepisujemy karuzeli na CSS scroll-driven animations.
- NIE ruszamy rozdziału gałęzi iOS/Android (jest minimalny i celowy).
- NIE zamieniamy łańcuchów `calc()` w `applyFrame` na tweeny GSAP —
  kompozycja zmiennych CSS to mechanizm, nie dług.
- NIE wymuszamy DRY breakpointu wewnątrz CSS (PostCSS/codegen — nadmiar).
- NIE „upraszczamy" logiki wideo mobile (`initMobilePhase3`) — działa i jest
  wspólna dla iOS/Android zgodnie z twardą zasadą.

## 6. Status

- [x] Krok 0 — harness `scripts/verify-hero.mjs` + baseline (2026-07-06;
      walidacja determinizmu: 33/33 klatek 0.000% diff; wideo mobile gra 2/2)
- [x] Krok 1 — `hero-config.ts` + pochodny min-height 📱 (2026-07-06:
      harness 33/33 = 0.000% diff; test na urządzeniach OK; zacommitowane)
- [x] Krok 2 — `platform.ts` + `--k` z JS 📱 KRYTYCZNY (2026-07-06: harness
      33/33 = 0.000% diff; sondа tokenów OK; znaleziona i podpięta CZWARTA
      kopia 0.6 — phase2Mobile/APART; test 📱 Android+iPhone OK; zacommitowane)
- [x] Krok 3 — `scene-vars.ts` (2026-07-06: rejestr + setRest/removeVars w 4
      miejscach — semantyka remove vs set zachowana 1:1, centerGroup celowo
      nadal bez --lap-pitch; harness 33/33 = 0.000% diff; bez testu 📱
      zgodnie z tabelą)
- [ ] Krok 4 — rozbicie monolitu 📱 (2026-07-06: wdrożone — timeline-base /
      desktop-phases / caption-carousel / mobile-phases; Hero.astro script
      890→216 linii orkiestracji; zmiany wyłącznie mechaniczne + jawne
      parametry (scene, hero) i deduplikacja heroHeightSync; harness 33/33 =
      0.000% diff; CZEKA na pełny test 📱 na obu telefonach przed commitem)
- [x] Krok 5 — `selectors.ts` + głośny dev (2026-07-06: mapa SEL 27
      selektorów + devWarnMissing z dedupem; harness 33/33 = 0.000% diff;
      DEV-kod wycięty z builda prod; smoke-test ostrzeżeń OK; zacommitowane)
- [x] Krok 6 — aktualizacja rules / komentarzy (2026-07-06: wykonane w
      `docs/claude-code-ecosystem-initialization.md` — sekcja 0 „Stan repo",
      skorygowany inwentarz G1–G15 (usunięte martwe mechanizmy:
      normalizeScroll, is-lowpower, --vh/use-dvh, loader, ?flat/?svh/?dvh),
      przebudowane rules/hero-device-scene.md i skill /verify-mobile
      (otoczka verify-hero.mjs), zaktualizowany CLAUDE.md, capture-scripts,
      moduł white-label. Same pliki .claude/ powstaną przy wykonaniu tego
      planu w świeżej sesji. Kotwice w kodzie: nagłówki modułów →
      analiza-refactor; pamięć Claude'a skorygowana 4a/krok 6)

Szacunek: krok 0 — jedna sesja; 1–3 — jedna sesja; 4 — jedna–dwie sesje;
5–6 — szybkie. Efekt uboczny: czystsza ekstrakcja hero jako modułu
white-label (mniej macek między plikami).
