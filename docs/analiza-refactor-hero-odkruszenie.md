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
  mobile: `SCROLL_SCALE`, `LAP_ZONE`, `PH_ZONE`, `VID_MAX`, `GROW_END`,
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
| 4 | iPhone + Android — pełny przejazd | całość: wjazd urządzeń, wzrost captionów, czerwone odcinki, odpięcie, powrót scrollem w górę |
| 0, 3, 5, 6 | niepotrzebne | brak zmian w kodzie produktu (0, 6) / zmiany czysto mechaniczne pokryte harnessem (3, 5) |

Emulacja Playwright NIE wykrywa: limitu warstwy GPU (Android), zachowań
Low Power Mode, realnej termiki dekodera — stąd powyższa tabela.

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
- [ ] Krok 1 — `hero-config.ts` + pochodny min-height 📱 (2026-07-06:
      wdrożone; harness 33/33 = 0.000% diff; inline min-height potwierdzony
      na obu gałęziach; CZEKA na test 📱 przed commitem)
- [ ] Krok 2 — `platform.ts` + `--k` z JS 📱 KRYTYCZNY
- [ ] Krok 3 — `scene-vars.ts`
- [ ] Krok 4 — rozbicie monolitu 📱
- [ ] Krok 5 — `selectors.ts` + głośny dev
- [ ] Krok 6 — aktualizacja rules / komentarzy

Szacunek: krok 0 — jedna sesja; 1–3 — jedna sesja; 4 — jedna–dwie sesje;
5–6 — szybkie. Efekt uboczny: czystsza ekstrakcja hero jako modułu
white-label (mniej macek między plikami).
