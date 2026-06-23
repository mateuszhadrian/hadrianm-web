# Osadzenie video na ekranach urządzeń (mobile) — plan implementacji i analiza

> Status: **ZAIMPLEMENTOWANE** (2026-06-23). Plan zatwierdzony, video wygenerowane, kod zmieniony i zweryfikowany. Szczegóły wyniku → sekcja 13.
> Dotyczy sekcji Hero: `src/components/sections/hero/*`.

---

## 1. Cel i kontekst

Na **desktopie** scena Hero pokazuje dwa urządzenia (laptop + telefon) z animacjami GSAP sterowanymi scrollem (scrub). Ekrany wyświetlają żywe podglądy strony „drewelomet":

- laptop → `.dw-root` (`LaptopSite.astro` + `laptop-site.ts`), animowany w **fazie 3 desktop**,
- telefon → `.dwm-root` (`PhoneSite.astro` + `phone-site.ts`), animowany w **phase3PhoneDesktop**.

Na **mobile** (`max-width: 760px`) te podglądy są `display:none` → ekrany są białe/puste. Powód: animacje DOM/CSS sterowane scrubem są zbyt ciężkie dla GPU/CPU smartfona.

**Rozwiązanie:** zamiast odtwarzać żywą animację na mobile, nagrywamy ją z desktopu do dwóch lekkich plików MP4 i odtwarzamy je **autonomicznie w czasie rzeczywistym** (nie scrub), wyzwalane pozycją scrolla. Ekran urządzenia na mobile staje się elementem `<video>` w istniejącej obudowie CSS.

### Ważne sprostowanie architektoniczne

W projekcie **nie ma modeli 3D ani WebGL**. Cała scena to CSS 3D (perspektywa + `rotateX/Y` + warstwy `.extrude`). Ekrany `.screen--laptop` / `.screen--phone` **już są zwykłymi kontenerami DOM** (białe tło, `overflow:hidden`). „3D" jest wyłącznie obudowa urządzenia. Zatem wymóg „ekrany mają być zwykłymi kontenerami, nie modelami 3D" jest **już spełniony** na poziomie ekranu — realne odciążenie mobile uzyskamy przez:

1. zamianę zawartości ekranu na `<video>`,
2. **usunięcie z DOM na mobile** ciężkich `.dw-root` / `.dwm-root` (dziś obecne mimo `display:none` — kosztują pamięć, dekodowanie obrazów i parsing).

---

## 2. Decyzje (zatwierdzone z użytkownikiem)

| #   | Temat                    | Decyzja                                                                                                                                                                                                                                              |
| --- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Metoda nagrania          | Automatyczna: Playwright steruje `master.progress()`, przechwytuje klatki płaskiego roota, ffmpeg składa MP4                                                                                                                                         |
| 2   | Zakres treści            | Pełna animacja każdej „strony" (laptop: cała faza 3; telefon: pełny zakres PHONE) spakowana w ~10 s                                                                                                                                                  |
| 3   | Tempo                    | 3 szybkie „rzuty" przewijania + 2 krótkie przystanki (~0,6 s), ease typu power3; próbka do akceptacji przed finalizacją                                                                                                                              |
| 4   | Format                   | **H.264 MP4** (`muted`, `playsinline`), 30 fps; bez WebM                                                                                                                                                                                             |
| 5   | Waga                     | **Twardszy limit ≤ 800 KB / plik** (kosztem detalu)                                                                                                                                                                                                  |
| 6   | Scroll mobile            | Wydłużyć o ~2–3 ekrany; urządzenia „przypięte" (nieruchome) w trakcie sekwencji video                                                                                                                                                                |
| 7+8 | Play/stop                | Video gra **w czasie rzeczywistym od zera** i **w pętli** (`loop`), dopóki strefa aktywna. Zatrzymane = **reset do pierwszej klatki** (nie zamrożenie). Każde wejście w strefę = odtworzenie od początku. Gdy nie gra → widoczna **pierwsza klatka** |
| 9   | Replay                   | Tak — po cofnięciu i ponownym wejściu video gra od nowa                                                                                                                                                                                              |
| 10  | `prefers-reduced-motion` | Respektować: bez autoplay, statyczny poster (pierwsza klatka)                                                                                                                                                                                        |
| 11  | Poster                   | Generować poster (WebP, klatka 0) dla obu video. _Realizacja: `preload="none"` + `data-src`, `src` wpinane z JS tylko na mobile (desktop nic nie pobiera); poster pokazuje pierwszą klatkę._                                                         |
| 12  | Obudowa                  | Zostawić obudowę CSS; ekran = `<video>`; usunąć z DOM `.dw-root`/`.dwm-root` na mobile                                                                                                                                                               |

### Sekwencja scrolla na mobile (model docelowy)

```
[faza 1] wjazd urządzeń łukiem
[faza 2] rozsunięcie + grupa 0.82  ──►  FINALNA POZYCJA (urządzenia przypięte)
   │
   ├─ STREFA L  (scrubowana skala, dół przyklejony; 4 ekrany: 1+2+1):
   │     p 0→1/4    POWIĘKSZANIE 1→1.5×        (video stoi na 1. klatce, ~1 ekran)
   │     p = 1/4    SZCZYT → start odtwarzania (pętla)
   │     p 1/4→3/4  PRZYTRZYMANIE w 1.5×       (video gra, ~2 ekrany)
   │     p 3/4→1    ZMNIEJSZANIE 1.5×→1        (video gra, ~1 ekran)
   │     p = 1      BAZA → stop + reset do 1. klatki
   │     (telefon stoi na 1. klatce)
   │
   ├─ STREFA P: identycznie dla telefonu
   │
[koniec sekcji] przejście do następnej sekcji
```

Strefy L i P to kolejne odcinki scrolla wewnątrz wydłużonego pinu. Skala urządzenia to **scrubowany przebieg trapezowy** 1→1.5× → przytrzymanie 1.5× → 1.5×→1 (4 ekrany: grow 1 + hold 2 + shrink 1), z dolną krawędzią przyklejoną w miejscu (origin „dół-środek": `scale(var(--vid-scale))` + kompensujący `translateY(calc((1 - var(--vid-scale)) * (var(--lap-h)/2)))` w transformie z `device-scene.ts`). Odtwarzanie od **szczytu do bazy** `p ∈ [1/4, 1)` (przytrzymanie + zmniejszanie); `onLeave`/`onLeaveBack` → skala 1 + pauza + reset. Wszystko scrubowane, więc symetryczne w obie strony scrolla.

---

## 3. Wymiary i parametry video

Wymiary ekranów (content box = wymiar urządzenia − 2× bezel):

| Ekran                                          | Źródło wymiaru    | Content box | Aspect     |
| ---------------------------------------------- | ----------------- | ----------- | ---------- |
| Laptop (desktop = mobile, `--lap-w/h` te same) | 840×534, bezel 11 | **818×512** | ~1,598 : 1 |
| Telefon **mobile** (`--ph-w/h` w `@media`)     | 286×584, bezel 11 | **264×562** | ~0,470 : 1 |
| Telefon desktop (kontekst nagrania)            | 212×432, bezel 8  | 196×416     | ~0,471 : 1 |

Aspect telefonu desktop ≈ mobile (różnica <0,3%), więc nagranie wykonamy w docelowym aspekcie mobile, wymuszając rozmiar kontenera roota na czas capture (container queries `.dwm-root` ułożą layout zgodnie z tym, co zobaczy użytkownik).

**Proponowane parametry kodowania** (do strojenia pod limit ≤ 800 KB):

| Parametr                  | Laptop                                            | Telefon                   |
| ------------------------- | ------------------------------------------------- | ------------------------- |
| Rozdz. nagrania (capture) | 818×512 (lub 2×, downscale przy enkodzie)         | 528×1124 (2× content box) |
| Rozdz. finalna (encode)   | ~720×450                                          | ~432×920                  |
| fps                       | 30                                                | 30                        |
| Długość                   | ~10 s                                             | ~10 s                     |
| Kodek                     | H.264 High, `yuv420p`, `+faststart`               | jw.                       |
| Sterowanie wagą           | **two-pass**, bitrate z limitu, pętla do ≤ 800 KB | jw.                       |
| Poster                    | `cwebp` z klatki 0, q~78                          | jw.                       |

Uwaga: przy 30 fps × 10 s = 300 klatek. ≤ 800 KB → ~2,1 Mbps średnio. Dla treści głównie statycznej z fazami ruchu to realne bez wyraźnej utraty jakości na ekranie wielkości ~360 px. Jeśli laptop (bogatsza treść) nie zmieści się w 800 KB przy akceptowalnej jakości, fallbacky w kolejności: (a) zejście do 24 fps, (b) downscale do ~640 px, (c) skrócenie do 8–9 s. Każdy z nich raportuję.

---

## 4. Pipeline generowania video

Nowy skrypt `scripts/capture-device-videos.mjs` (Node + Playwright) + montaż ffmpeg.

### Wymóg wstępny (tooling)

- `ffmpeg` — `brew install ffmpeg`. Weryfikacja: `which ffmpeg`.
- `cwebp` (z pakietu `webp`) — `brew install webp`. **Konieczny do posterów**: build ffmpeg z Homebrew **nie ma enkodera webp** (`Default encoder for format webp ... is probably disabled`). Poster generujemy więc przez `cwebp`, nie ffmpeg. Weryfikacja: `which cwebp`.
- `playwright` — `pnpm add -D playwright` + `npx playwright install chromium`.

Wszystko to zależności **deweloperskie / build-time** — **nie** trafiają do bundla produkcyjnego ani do `dependencies`. Produkcja dostaje tylko gotowe pliki w `public/`.

> Jednolinijkowy preflight: `brew install ffmpeg webp && pnpm add -D playwright && npx playwright install chromium`

### Kroki capture (zgodne z gotowym `scripts/capture-device-videos.mjs`)

Najprościej: `pnpm dev` w tle, potem `pnpm capture:devices`. Skrypt robi całość sam. Mechanika:

1. **Harness.** Skrypt kopiuje szablon `scripts/capture-harness.astro` → `src/pages/capture.astro` (tylko na czas nagrania; usuwa po). Harness montuje oba roota (`.dw-root`, `.dwm-root`) w **płaskich** kontenerach o docelowych wymiarach (2× content box) — bez transformu 3D laptopa, który zniekształca `getBoundingClientRect` (patrz komentarz w `laptop-site.ts`).
   - ⚠️ **Strona NIE może mieć prefiksu `_`** — Astro wyklucza `src/pages/_*.astro` z routingu, więc `astro dev` ich nie poda (404). Dlatego `capture.astro`, nie `_capture.astro`.
2. **Hooki.** Harness inicjalizuje `initLaptopSite/initPhoneSite`, pauzuje ich `master` i wystawia `window.__cap = { seekLaptop(p), seekPhone(p), ready(), hasLaptop, hasPhone }`.
3. **Gotowość (`ready()`).** Czeka aż dekodują się obrazy i fonty. ⚠️ Obrazy są `loading="lazy"` i część leży poza widocznym obszarem (przesunięte transformami / przycięte `overflow:hidden`) → ich `onload` **nigdy nie odpala**, więc trzeba: ustawić `loading="eager"`, **re-set `src`** (remove+set, nie self-assign), `img.decode()` **z twardym timeoutem per-obraz** (i `document.fonts.ready` też z timeoutem). Bez tego `ready()` wisi w nieskończoność.
4. **Capture.** Playwright otwiera `http://localhost:${CAP_PORT||4337}/capture` z `waitUntil: "load"` (⚠️ **nie `networkidle`** — websocket HMR Vite potrafi nie osiągnąć idle). Dla każdej z 300 klatek: `window.__cap.seekLaptop(curve(i/299))`, settle = 2× rAF, `page.locator('#cap-laptop').screenshot()` → `scratchpad/frames/{laptop|phone}/####.png`.
5. **Krzywa tempa.** `curve(t)`: 3 odcinki szybkie (smootherstep) przedzielone 2 plateau (przystanki ~0,6 s). `--sample` (1/3 klatek) do szybkiego podglądu tempa.
6. **Enkod MP4 (two-pass, nie CRF).** Bitrate liczony z twardego limitu: `kbps = floor(TARGET_KB*8*0.96 / 10s)`. `libx264 -profile:v high -pix_fmt yuv420p -vf scale=W:-2:flags=lanczos -b:v kbps -maxrate 1.45× -bufsize 2× -movflags +faststart`, pass 1 → `/dev/null`, pass 2 → mp4. Jeśli > 800 KB: zmniejsz bitrate proporcjonalnie i powtórz (pętla do limitu). Two-pass daje przewidywalny rozmiar.
7. **Poster (cwebp, nie ffmpeg).** `cwebp -q 78 -resize W 0 0000.png -o poster.webp`. Owinięte w `try/catch`, żeby błąd postera nie przerwał enkodu video.
8. **Idempotencja.** Klatki są reużywane jeśli już są w `scratchpad/frames/<dev>` (≥300 PNG) — `--recapture` wymusza ponowne nagranie. Enkod każdego urządzenia w osobnym `try/catch`, by awaria jednego nie zabiła drugiego.

### Artefakty wyjściowe (produkcyjne)

```
public/drewelomet/video/
├── laptop.mp4
├── laptop.webp      (poster, klatka 0)
├── phone.mp4
└── phone.webp       (poster, klatka 0)
```

(katalog `public/drewelomet/video/` już istnieje, dziś pusty)

---

## 5. Zmiany w kodzie

### 5.1 `DeviceScene.astro`

- Dodać do każdego ekranu `<video class="screen__video" muted playsinline loop preload="none" poster="…webp" data-src="…mp4">` (CSS `display:none` na desktopie, `block` w `@media (max-width:760px)`).
  - `playsinline` + `muted` = warunek autoplay inline na iOS Safari.
  - **`loop`** — film leci w pętli, dopóki jego strefa scrolla jest aktywna; pauzę + reset do pierwszej klatki przy wyjściu ze strefy robi logika scrolla (ScrollTrigger).
  - ⚠️ **`preload="none"` + `data-src` (nie `src`/`<source>`).** `src` wpinamy z JS **dopiero w gałęzi mobile** (`v.src = v.dataset.src; v.load()`). Inaczej desktop, mimo `display:none`, mógłby pobierać plik mp4. Poster (mała webp) zostawiamy jako atrybut — pokazuje pierwszą klatkę także w trybie `reduce`.
- Atrybuty hooków: `data-gsap="video-laptop"` / `data-gsap="video-phone"` dla sterowania z `Hero.astro`.

### 5.2 Warunkowy render treści stron (odchudzenie DOM mobile)

Cel: `.dw-root` / `.dwm-root` **nie istnieją w DOM na mobile**. Astro renderuje statycznie po stronie serwera, więc nie wie o szerokości ekranu. Dwie opcje:

- **Opcja A (rekomendowana):** zostawić render w HTML, ale `LaptopSite`/`PhoneSite` ładować w `<div>` z `data-desktop-only`, a w skrypcie inicjalizującym Hero **usuwać te węzły z DOM w gałęzi matchMedia mobile** (`el.remove()`) zanim cokolwiek się zainicjalizuje. Proste, bez zmian w SSR, deterministyczne.
- **Opcja B:** przenieść treść stron do osobnych fragmentów ładowanych dynamicznie tylko na desktop (np. `client:media`). Większa zmiana, ryzyko FOUC; odrzucone.

→ Wybór: **Opcja A**. Na desktopie nic się nie zmienia; na mobile DOM jest odchudzony, a inicjalizacja `initLaptopSite`/`initPhoneSite` i tak nigdy nie startuje w gałęzi mobile (już dziś tak jest).

### 5.3 `Hero.astro` — gałąź mobile (`max-width: 760px`)

- Po `phase1Mobile` + `phase2Mobile` dodać sekwencję video (`makeVideoZone`):
  - wydłużyć oś sekcji (`min-height: 1500svh`); urządzenia trzymane w finalnej pozycji istniejącym `.hero__stage` sticky (brak dalszych tweenów pozycji),
  - dla każdego urządzenia 1 `ScrollTrigger` ze **`scrub: true`** w jego strefie (4 ekrany: laptop 4.4–8.4, telefon 8.8–12.8 ekr.):
    - `onUpdate(self)` liczy **skalę trapezową** z `self.progress` (`GROW_END=1/4`, `HOLD_END=3/4`, `MAX=1.5`): `p≤1/4` → grow `1+(MAX-1)·(p/(1/4))`; `1/4<p<3/4` → `MAX` (przytrzymanie ~2 ekr.); `p≥3/4` → shrink `1+(MAX-1)·((1-p)/(1/4))`; ustawia `el.style.setProperty("--vid-scale", s)`,
    - odtwarzanie dla `p ∈ [1/4, 1)` (szczyt → przytrzymanie → zmniejszanie): jeśli `video.paused` → `currentTime=0; play().catch()`; inaczej (poza zakresem) → `pause(); currentTime=0`,
    - `onLeave`/`onLeaveBack` → `--vid-scale=1` + `pause()` + `currentTime=0`.
  - `--vid-scale` ustawiamy na elemencie urządzenia (`[data-gsap='laptop']`/`[data-gsap='phone']`), bo to tam żyje transform z `var(--vid-scale)` (patrz 5.6).
  - `play()` w `try/catch`/`.catch()` — autoplay zablokowany zostawia poster.
- Usunąć z DOM treść stron (Opcja A) na wejściu gałęzi mobile; w cleanup reset `--vid-scale=1`.

### 5.6 `device-scene.ts` — skala „dół przyklejony"

Transform urządzeń składa JS (`laptop.style.transform = …`) i zawiera live'owe custom properties. Dopisujemy na końcu łańcucha (najgłębiej):

```
… rotateY(var(--lap-yaw,0deg)) rotateX(var(--lap-pitch,0deg))
  translateY(calc((1 - var(--vid-scale,1)) * (var(--lap-h)/2)))
  scale(var(--vid-scale,1))
```

`scale` rośnie wokół środka; kompensujący `translateY` o `(1−s)·H/2` przesuwa tak, że **dolna krawędź zostaje w miejscu**, a urządzenie rośnie w górę i symetrycznie na boki. `H` bierzemy z `var(--lap-h)`/`var(--ph-h)` (auto-poprawne per breakpoint). Domyślnie `--vid-scale:1` → na desktopie `translateY(0) scale(1)` = brak zmian.

### 5.4 `prefers-reduced-motion`

- Cała animacja Hero jest dziś za `(prefers-reduced-motion: no-preference)`. Dla `reduce`:
  - urządzenia w statycznej finalnej pozycji (już zapewnione brakiem dopasowania media → trzeba dodać statyczny fallback layout, jeśli go nie ma),
  - `<video>` bez autoplay; widoczny `poster` (pierwsza klatka). `autoplay` nie ustawiamy nigdy — start zawsze przez JS, więc w trybie `reduce` po prostu nie wywołujemy `play()`.

### 5.5 CSS

- `.screen__video { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; display:none; }`
- `@media (max-width:760px){ .screen__video{ display:block } }`
- Upewnić się, że `<video>` jest pod `.screen__glass` (refleks szkła zostaje na wierzchu) i nad białym tłem `.screen`.

---

## 6. Analiza za / przeciw

### Zalety

- **Drastyczne odciążenie mobile:** zamiast scrubowanej animacji DOM (dziesiątki warstw, container queries, typewriter, miarki, galerie) — jeden dekodowany sprzętowo strumień H.264. Dekodowanie wideo na iOS/Androidzie idzie przez dedykowany blok sprzętowy, nie główny wątek JS.
- **Odchudzony DOM i pamięć:** usunięcie `.dw-root`/`.dwm-root` z mobile zdejmuje kilkadziesiąt `<img>` (lazy, ale wciąż w drzewie) + złożone poddrzewa.
- **Stabilny, deterministyczny efekt:** to samo na każdym telefonie; brak jank-u od scrubu na słabszym GPU.
- **Mały transfer:** 2× ≤ 800 KB = ≤ 1,6 MB, ładowane tylko na mobile, `preload` można dostroić.
- **Pełna kontrola play/stop** przez ScrollTrigger — spójna z resztą sekcji.

### Wady / koszty

- **Treść video jest „zamrożona"** — zmiana strony drewelomet wymaga ponownego nagrania (proces zautomatyzowany skryptem, więc tani, ale to dodatkowy krok w workflow).
- **Utrata ostrości tekstu** względem żywego DOM (wideo 720/432 px + kompresja). Mitigacja: limit 800 KB strojony tak, by tekst pozostał czytelny; ekran fizycznie mały.
- **Ryzyko zablokowanego autoplay** na części przeglądarek mimo `muted+playsinline`. Mitigacja: zawsze widoczny poster (pierwsza klatka) jako stan bazowy; brak autoplay = po prostu statyczny kadr.
- **Dwie nowe zależności dev** (Playwright, ffmpeg) — tylko build-time, nie w produkcji.
- **Lekko większy `public/`** (≤ 1,6 MB) — pomijalne.

### Wpływ na performance (urządzenia do ~4 lat)

- iPhone: od iPhone 8/X wzwyż sprzętowe dekodowanie H.264 — koszt CPU minimalny.
- Android budżetowy 4-letni: H.264 High profile @ ~432–720 px to trywialny dekod; ryzykiem bywa tylko **jednoczesne** odtwarzanie wielu wideo. Tu w danym momencie gra **maks. jedno** (drugie zatrzymane na klatce 0) — bezpiecznie.
- Ładowanie: `preload="none"` + `src` wpinane z JS dopiero na mobile → desktop **nie pobiera** mp4 mimo `display:none`; na mobile `v.load()` w gałęzi matchMedia. 2 pliki ≤ 800 KB to znikomy transfer.

---

## 7. Ryzyka i mitigacje

| Ryzyko                                             | Prawdopodobieństwo    | Mitigacja                                                                                                                                  |
| -------------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Autoplay zablokowany                               | Średnie               | `muted playsinline`; poster jako stan bazowy; `play()` w `try/catch`                                                                       |
| Waga > 800 KB przy akceptowalnej jakości (laptop)  | Średnie               | Pętla CRF; fallback 24 fps / 640 px / 9 s — raportowane                                                                                    |
| Migotanie przy seek/reset (czarna klatka)          | Niskie                | `poster` + `object-fit:cover`; reset `currentTime=0` na spauzowanym video pokazuje klatkę 0; ewentualnie utrzymać pierwszą klatkę jako tło |
| Różnica aspectu telefonu desktop↔mobile            | Bardzo niskie (<0,3%) | Capture w wymuszonym rozmiarze mobile                                                                                                      |
| Niespójny `decode()` przy capture → rozjazd klatek | Niskie                | Czekanie na rAF + `img.decode()` wszystkich obrazów przed screenshotem                                                                     |
| Regresja desktopu                                  | Niskie                | Wszystkie zmiany w gałęzi mobile / warstwie `@media`; desktop bez zmian funkcjonalnych                                                     |

---

## 8. Alternatywy (rozważone, odrzucone)

1. **Pozostawić scrubowaną animację DOM na mobile** — odrzucone: jank na słabszym sprzęcie (powód istnienia tego zadania).
2. **Animowany WebP / APNG zamiast MP4** — odrzucone: większa waga, brak sprzętowego dekodu, brak kontroli klatek.
3. **Sekwencja obrazów + scrub na mobile (jak "image sequence")** — odrzucone: duży transfer + dekodowanie dziesiątek obrazów = ten sam problem, który eliminujemy.
4. **WebM/VP9 zamiast/obok MP4** — odrzucone (decyzja #4): mniejszy plik, ale słabsze wsparcie autoplay inline na starszym iOS i podwójna praca.
5. **Lottie / Canvas re-render** — odrzucone: wymaga przepisania animacji; nie ma źródła wektorowego.

---

## 9. Lista zmian (plikowo)

| Plik                                                | Zmiana                                                                                                                                                                              |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scripts/capture-device-videos.mjs`                 | **nowy** — Playwright capture + ffmpeg two-pass + poster `cwebp` + pętla limitu wagi + auto-zarządzanie harnessem                                                                   |
| `scripts/capture-harness.astro`                     | **nowy** — szablon harnessu (płaskie roota + hooki `__cap`); kopiowany do `src/pages/capture.astro` tylko na czas nagrania, potem usuwany → **zero śladu w produkcji**              |
| `scripts/verify-mobile-videos.mjs`                  | **nowy** — Playwright: weryfikacja sekwencji play/reset w viewporcie mobile                                                                                                         |
| `package.json`                                      | dev-dep `playwright`; skrypt `capture:devices`                                                                                                                                      |
| `DeviceScene.astro`                                 | `<video class="screen__video" loop>` + poster na obu ekranach (warstwa mobile); `--vid-scale:1`; CSS                                                                                |
| `Hero.astro`                                        | gałąź mobile: wydłużenie osi, `makeVideoZone` (skala trapezowa 1→1.5× → przytrzymanie 2 ekr. → 1.5×→1, play na `[1/4,1)`), usunięcie `.dw-root`/`.dwm-root` z DOM, obsługa `reduce` |
| `device-scene.ts`                                   | transform urządzeń: `translateY(...) scale(var(--vid-scale))` — powiększanie „dół przyklejony"                                                                                      |
| `public/drewelomet/video/{laptop,phone}.{mp4,webp}` | **nowe artefakty**                                                                                                                                                                  |
| `docs/on_mobile_devices_video_analysis.md`          | ten dokument                                                                                                                                                                        |

---

## 10. Plan testów

- **Wizualnie (mobile emulacja + realny iPhone/Android):** sekwencja final pos → laptop gra → reset+pierwsza klatka → telefon gra → reset; scroll w obie strony; replay od zera.
- **Autoplay:** Safari iOS (inline), Chrome Android, tryb oszczędzania danych.
- **`prefers-reduced-motion`:** brak autoplay, widoczny poster.
- **Performance:** DevTools Performance na throttlingu CPU 4×/6× — brak długich tasków przy odtwarzaniu; pamięć po usunięciu `.dw-root`/`.dwm-root`.
- **Desktop regresja:** pełna faza 3 bez zmian.
- **Lighthouse mobile:** porównanie przed/po (TBT, transfer).

---

## 11. Kolejność wdrożenia (zoptymalizowana — kolejność ma znaczenie)

> Złota zasada: **najpierw cały kod, potem nagranie**. Edycja plików w trakcie capture przeładowuje stronę (HMR) i zabija sesję Playwright (`Execution context destroyed`). Patrz sekcja 14.

1. **Preflight tooling** (raz): `brew install ffmpeg webp && pnpm add -D playwright && npx playwright install chromium`. Sprawdź `which ffmpeg cwebp`.
2. **Najpierw wszystkie zmiany w kodzie** (żeby nie edytować nic w trakcie nagrania):
   - `DeviceScene.astro` (warstwa `<video>` + CSS),
   - `Hero.astro` (sekwencja, ScrollTrigger, usunięcie DOM, reduce, wydłużenie scrolla),
   - `scripts/capture-harness.astro` + `scripts/capture-device-videos.mjs` + `verify-mobile-videos.mjs`.
3. **Typecheck/lint TERAZ, przed startem dev servera do nagrania** (nie po): `pnpm typecheck && pnpm lint`. ⚠️ `astro check` przeoptymalizowuje zależności i unieważnia cache _działającego_ `astro dev` (504, sekcja 14) — robiąc to przed uruchomieniem serwera do capture, unikamy problemu.
4. `pnpm dev` w tle. Poczekaj na „ready" w logu i właściwy port.
5. (Opcjonalnie) `pnpm capture:devices --sample` → szybka próbka tempa do akceptacji.
6. `pnpm capture:devices` → finalne `laptop.mp4/phone.mp4` + postery; sprawdź wagę ≤ 800 KB i `ffprobe` (wymiary/fps/czas).
7. **Weryfikacja**: `CAP_PORT=<port> node scripts/verify-mobile-videos.mjs` (sekwencja play/reset). ⚠️ Jeśli serwer był używany do typecheck w trakcie → zrestartuj (sekcja 14).
8. `pnpm build` → potwierdź brak route `/capture` w `dist/` i obecność video.
9. Commit (po akceptacji).

---

## 12. Pytania otwarte do potwierdzenia przed startem

1. Czy mogę zainstalować lokalnie `ffmpeg` (`brew install ffmpeg`) i dodać `playwright` jako **devDependency**? (oba tylko build-time) → **TAK** (dodatkowo `webp`/`cwebp` na poster, bo ten build ffmpeg nie ma enkodera webp).
2. Czy akceptujesz harness dev-only do nagrania (nie trafia do produkcji)? → **TAK** — harness żyje jako szablon `scripts/capture-harness.astro`, kopiowany do `src/pages/capture.astro` tylko na czas nagrania i usuwany po (zero śladu w buildzie).
3. Limit ≤ 800 KB twardy? → **TAK** — oba pliki zmieściły się bez sięgania po fallbacki.

---

## 13. Wynik implementacji (2026-06-23)

**Wygenerowane assety** (`public/drewelomet/video/`):

| Plik                   | Wymiary | fps | Czas   | Waga       |
| ---------------------- | ------- | --- | ------ | ---------- |
| `laptop.mp4`           | 720×450 | 30  | 10,0 s | **740 KB** |
| `phone.mp4`            | 432×920 | 30  | 10,0 s | **750 KB** |
| `laptop.webp` (poster) | 720×    | —   | —      | 30 KB      |
| `phone.webp` (poster)  | 432×    | —   | —      | 12 KB      |

Oba video < 800 KB za pierwszym podejściem (614 kbps, dwuprzebiegowy H.264 High, `+faststart`). Łączny transfer mobile ≤ ~1,5 MB, ładowany tylko na mobile.

**Zmiany w kodzie:**

- `DeviceScene.astro` — warstwa `<video.screen__video>` na obu ekranach (`muted playsinline loop preload="none"` + `poster`, `data-src`); CSS `display:none`/`block`; domyślne `--vid-scale:1` na `.laptop`/`.phone`.
- `device-scene.ts` — w transformie urządzeń dopisane `translateY(...) scale(var(--vid-scale))` (powiększanie „dół przyklejony", sekcja 5.6).
- `Hero.astro` — gałąź mobile: wydłużony scroll (`min-height: 1500svh`), `setupVideo()` (wpięcie `src` tylko na mobile → desktop nie pobiera), `makeVideoZone()` = scrubowany `ScrollTrigger` na strefę 4-ekranową (laptop 4.4–8.4, telefon 8.8–12.8 ekr.) ze skalą trapezową 1→1.5× → przytrzymanie ~2 ekrany → 1.5×→1 i odtwarzaniem na `p∈[1/4,1)`; usunięcie `.dw-root`/`.dwm-root` z DOM; reset `--vid-scale`/video w cleanup.
- `package.json` — `playwright` (dev) + skrypt `capture:devices`.
- Narzędzia dev: `scripts/capture-device-videos.mjs`, `scripts/capture-harness.astro`, `scripts/verify-mobile-videos.mjs`.

**Weryfikacja** (Playwright, viewport iPhone 16 Pro Max 430×932) — strefa laptopa [4.4→8.4], 4 ekrany (grow 1 + hold 2 + shrink 1):

| Pozycja (progress)            | `--vid-scale`  | video                   |
| ----------------------------- | -------------- | ----------------------- |
| grow (p≈0,05–0,25)            | 1,05 → 1,25    | pauza, 1. klatka        |
| **szczyt (p=1/4)**            | **1,5**        | **start + gra**         |
| **HOLD ~2 ekr.** (p≈0,3–0,75) | **1,5** trzyma | **gra (pełny rozmiar)** |
| shrink (p≈0,83)               | 1,25           | gra                     |
| baza (p≈1)                    | ~1,0           | (na granicy) → stop     |
| między strefami               | 1,0            | pauza, 1. klatka        |
| reverse (w górę)              | symetrycznie   | gra                     |

Potwierdzono wizualnie: urządzenie rośnie **w górę i symetrycznie na boki, dolna krawędź w miejscu**; **przytrzymuje pełny rozmiar przez ~2 ekrany z grającym video**, potem zmniejsza się (wciąż grając); pętla na całym `[1/4,1)`; `.dw-root`/`.dwm-root` usunięte z DOM na mobile; `src` tylko na mobile; build produkcyjny zielony, brak route `/capture` w `dist/`.

**Re-nagranie po zmianie strony drewelomet:** `pnpm dev` w tle, potem `pnpm capture:devices` (opcjonalnie `--recapture`).

---

## 14. Pułapki napotkane przy realizacji (żeby następnym razem przejść gładko)

Każda z tych rzeczy realnie zatrzymała pierwsze podejście. Tabela = objaw → przyczyna → fix. Wszystkie są **już zaadresowane** w gotowych skryptach/kodzie; lista służy przyszłym modyfikacjom i debugowaniu.

| #   | Objaw                                                                                                   | Przyczyna                                                                                                                                                                | Fix (zastosowany)                                                                                                                                  |
| --- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `page.evaluate: Execution context was destroyed, most likely because of a navigation` w trakcie capture | Edycja dowolnego pliku w trakcie nagrania → Vite HMR przeładował stronę harnessu                                                                                         | **Najpierw cały kod, potem nagranie.** Nie dotykać plików podczas `capture:devices`. (sekcja 11)                                                   |
| 2   | `capture.astro` zwraca 404 w dev                                                                        | Astro **wyklucza `src/pages/_*.astro`** z routingu — pod `_` strona nie jest serwowana też w dev                                                                         | Nazwa **bez** `_`: `capture.astro`. Harness żyje jako szablon w `scripts/`, kopiowany na czas nagrania.                                            |
| 3   | `ready()` wisi w nieskończoność, 0 klatek                                                               | Obrazy `loading="lazy"` poza viewportem (przesunięte transformami / `overflow:hidden`) → `onload` nigdy nie odpala                                                       | W `ready()`: `loading="eager"` + **re-set `src`** (remove+set) + `img.decode()` **z timeoutem per-obraz**; `document.fonts.ready` też z timeoutem. |
| 4   | `Default encoder for format webp ... is probably disabled` — poster pada, przerywa run                  | Homebrew ffmpeg bez `libwebp`                                                                                                                                            | Poster przez **`cwebp`** (`brew install webp`), w `try/catch`, na końcu (po MP4).                                                                  |
| 5   | Po teście: `dwRoot:true`, `src:null`, video nie gra, animacja Hero martwa                               | `504 (Outdated Optimize Dep)` — wcześniejszy `astro check`/`typecheck` unieważnił cache **działającego** `astro dev`; gsap się nie ładuje → branch matchMedia nie odpala | **Restart dev servera** (`pkill -f "astro dev"; rm -rf node_modules/.vite; pnpm dev`). Lepiej: typecheck **przed** startem serwera do nagrania.    |
| 6   | W teście Playwright żadna gałąź matchMedia nie działa (i na desktop, i mobile)                          | Kontekst Playwright domyślnie ustawia `prefers-reduced-motion: reduce` → blokuje całą animację Hero (wymaga `no-preference`)                                             | W `newContext`: `reducedMotion: "no-preference"`.                                                                                                  |
| 7   | `goto` wisi / timeout                                                                                   | `waitUntil: "networkidle"` nie kończy się przez websocket HMR Vite                                                                                                       | `waitUntil: "load"` + `waitForFunction(() => window.__cap)`.                                                                                       |
| 8   | Zrzut „zatrzymanego" video pokazuje stałą klatkę zamiast pierwszej                                      | `currentTime=0` na pauzie przemalowuje dopiero po zdarzeniu `seeked` (dziesiątki ms)                                                                                     | To **artefakt czasu zrzutu**, nie bug. W teście dać settle ~1–2 s przed asercją; w realnym UX user nie zdąży zauważyć.                             |
| 9   | Port dev servera inny niż zakładany (4321→4337→4338…)                                                   | Astro auto-inkrementuje zajęte porty; równolegle bywa kilka serwerów                                                                                                     | Skrypty czytają **`CAP_PORT`** (domyślnie 4337). Port bierz z logu `pnpm dev`.                                                                     |
| 10  | Lint: `no-self-assign` / `no-explicit-any` na harnessie                                                 | `img.src = img.src`; `(window as any)` / `(document as any)`                                                                                                             | Remove+set zamiast self-assign; `document.fonts` bez castu; `window as Window & { __cap?: unknown }`.                                              |
| 11  | Sporo czasu na powtórnych nagraniach                                                                    | Każdy run nagrywał od zera                                                                                                                                               | Reuse klatek z `scratchpad/frames/<dev>` (≥300 PNG); `--recapture` wymusza nowe.                                                                   |

### Checklista TL;DR przed startem

1. `brew install ffmpeg webp && pnpm add -D playwright && npx playwright install chromium`; `which ffmpeg cwebp`.
2. Zrób **wszystkie** edycje kodu. Potem `pnpm typecheck && pnpm lint`.
3. **Dopiero teraz** `pnpm dev` (zanotuj port). Nie edytuj już plików.
4. `pnpm capture:devices` → sprawdź wagi + `ffprobe`.
5. `CAP_PORT=<port> node scripts/verify-mobile-videos.mjs` (jeśli 504 → restart dev servera).
6. `pnpm build` → brak `/capture` w `dist/`, video obecne.
