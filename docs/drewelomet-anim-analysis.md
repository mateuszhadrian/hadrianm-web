# Osadzenie animacji `drewelomet` na ekranie laptopa w Hero — analiza i plan

> Dokument decyzyjny przed implementacją. Cel: ekran laptopa w scenie urządzeń Hero ma stać się
> żywym oknem na stronę `ref_sources/drewelomet-gsap-page/index.html`, której **wewnętrzna animacja
> GSAP/ScrollTrigger jest w 100% sprzężona z naszym master-timeline Hero** — użytkownik scrolluje
> dalej, a „strona na laptopie" przewija się tak, jakby była integralną częścią naszej animacji.
> Gdy strona drewelomet dojdzie do końca, sekcja Hero odpina się i odjeżdża w górę (handoff do `Problem`).
>
> Plik z `ref_sources/` jest **wyłącznie referencją**. Docelowo treść/CSS/JS przepisujemy do
> dedykowanego komponentu, a assety kopiujemy do projektu. Wartości liczbowe to punkty startowe do
> strojenia. Kod implementacyjny powstaje **po akceptacji tego planu** (tu tylko pseudokod kluczowych miejsc).

---

## 0. Potwierdzone decyzje (z ustaleń)

| #   | Decyzja                                                                                                                                                                         |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Laptop **NIE rusza się** z obecnej pozycji — drewelomet scrolluje się pod kątem klatki C. Czytelność nieistotna (to showcase). Wolno **degradować jakość** drewelomet dla perf. |
| 2   | Telefon: **biały ekran** jak teraz. Telefonem zajmiemy się w kolejnym etapie.                                                                                                   |
| 3   | Kompromis scrolla: kompresja do **~10–12 ekranów**, częściowo przez tempo, częściowo przez **skrócenie końcówki** (galeria).                                                    |
| 4   | **Tylko desktop/tablet.** Mobile = biały ekran (osobny, okrojony etap później).                                                                                                 |
| 5   | Priorytet: **maksymalna płynność i jakość efektu**, nawet kosztem trudności przepisania → podejście **inline**.                                                                 |
| 6   | Assety → `public/drewelomet/…` (ścieżki względne działają 1:1).                                                                                                                 |
| 7   | Fonty → paczki `@fontsource/*` + tokeny w `global.css` (nasz mechanizm, nie Google Fonts).                                                                                      |
| 8   | `prefers-reduced-motion` → statyczny „poster" (jeden kadr) na ekranie, bez ruchu.                                                                                               |
| 9   | Navbar i cała strona drewelomet: **wyłącznie wizualne**, przepisać navbar pod **minimalne zużycie GPU**.                                                                        |
| 10  | Detach po końcu drewelomet = wpięcie w **istniejący** handoff Hero→Problem.                                                                                                     |
| 11  | **Zero interaktywności** poza scrollem. Traktujemy to jak „wideo, którego timeline steruje scroll".                                                                             |
| 12  | Ten dokument = decyzja + plan + pseudokod (bez pełnej implementacji).                                                                                                           |

---

## 1. Diagnoza — co mamy po obu stronach

### 1.1 Nasz Hero (punkt zaczepienia)

- `Hero.astro` to przypięta sekcja (`@media no-preference`: `.hero { min-height: 700svh }`, `.hero__stage { position: sticky; top:0; height:100svh; overflow:clip }`), sterowana **jednym** `gsap.timeline` ze `scrollTrigger` (`scrub: true`, `end: () => "+=" + window.innerHeight * 4`, `invalidateOnRefresh`). Po fazach następuje ~2 ekrany holdu (różnica 700svh − 4×vh).
- **Faza 1** (`phase1Desktop`): słowo „inna" leci do środka, skaluje się, rozmywa → zanik; scena urządzeń wyostrza się w centrum.
- **Faza 2** (`phase2Desktop`, start `PH2 = 0.95` na osi timeline): morph do **klatki C** — telefon w lewo/przód (`--ph-dx/dy/dz`), zanik paska bazy, kamera `--cx/--cy`, laptop `--lap-yaw/--lap-pitch`, cała grupa `x`/`scale` do prawej strefy (`scene.getFrameC()`), z lewej wjeżdża `.hero__copy` (pierwszy wiersz: **„wzniecaj emocje"**).
- **Ekran laptopa** = `DeviceScene.astro` → `.laptop .lid > .face > .screen[data-gsap="screen-laptop"]`. Dziś: `background:#fff` + `.screen__glass`. To jest **slot na treść** (potwierdza to `analiza-refactor-hero...`: „dojdzie animacja treści wyświetlanej na ekranach"). Rozmiar projektowy ekranu: lid `840×534`, bezel `11` → **content ≈ 818×512 px** (potem skalowany przez `.fit` × `--fit`, `GROUP_SCALE 0.72`, `frameC.scale` i renderowany pod kątem 3D).
- Kontrakt selektorów: `data-gsap="…"`, `data-extrude`. Timeline w `Hero.astro` jest orkiestratorem; geometria sceny w `device-scene.ts` (`FRAME_C`, `getFrameC()`, `relayout()`).
- `Home.astro`: tła sekcji (`HeroBackground`/`ProblemBackground`) krzyżowo przenikane osobnym timeline zakotwiczonym do `#problem` (`start: top bottom`, `end: top top`). To jest istniejący **handoff Hero→Problem** (pkt 10).

### 1.2 Strona drewelomet (referencja)

- **Trzy niezależne `ScrollTrigger`y** reagujące na scroll okna, każdy z własnym, ogromnym „scroll-containerem": `.scroll-container` (1086vh, scena 1), `.scroll-container-2` (240vh, scena 2), `.scroll-container-3` (612vh, galeria). Łącznie ~**19× wysokości viewportu**.
- **Scena 1** (`tl`): parallax warstw pokoju (`layer-bg/shelf/table/text/steel`), najazd kamery (`.camera`/`.camera-zoom`), crossfade do makro/rysunków (`#proj1..3`), typewriter nagłówka (`onUpdate`), miarka, bullety, na końcu detach (`.stage yPercent -100`, `.section2` wjeżdża).
- **Scena 2** (`s2tl`): parallax warsztatu, bullety, miarka prawa, detach do `.section3`, twardnienie krawędzi navbara.
- **Galeria** (`galTl` + proxy `galProxy.p` + `galleryRender`): pozioma taśma produktów (rząd 1), pionowy zjazd, rząd 2. **Najdłuższa i najłatwiejsza do skrócenia** (pkt 3).
- Layout zakłada, że strona **jest całym viewportem**: masowo `position: fixed` (`.parallax-viewport`, `.stage`, `.section2`, `.section3`, `.site-nav`) i jednostki `vh`/`vw`. JS używa `window.innerWidth/innerHeight` (zwłaszcza `galleryLayout`).
- **Fonty**: bezpośrednie `@import` z Google Fonts — Chakra Petch, Raleway, Stardos Stencil, Zilla Slab.
- **Assety**: ~**14 MB** PNG (część plików 0,6–1,7 MB). Istotne dla wagi strony i pierwszego renderu.
- **Kosztowne wizualnie**: wielowarstwowy `text-shadow` navbara (10+ cieni) + animacja `color-mix`, podwójny `-webkit-text-stroke` z `::before` dla napisów „z drewna"/„i stali" + `drop-shadow`, maski `mask-image` (frame, parallax-viewport, ruler, nav `::before`), kilka pełnoekranowych warstw `opacity`.

---

## 2. Sedno problemu — trzy wyzwania

1. **Sprzężenie zamiast własnego scrolla.** Drewelomet musi przestać słuchać scrolla okna. Jego 3 timeline'y trzeba przekuć w **jeden spauzowany master-timeline**, którego postęp (`progress 0→1`) napędza nasz Hero. Scroll-containery (1086/240/612vh) **znikają**.
2. **„Uwięzienie" layoutu w ekranie.** `position: fixed` i `vh/vw` zakładają viewport. W ekranie laptopa trzeba je przekierować na **wymiar ekranu**: `position: absolute` względem ekranu-kontenera + jednostki **container-query** (`cqh`/`cqw`), oraz w JS `window.inner*` → `screenEl.client*`.
3. **Wydajność na małej, pochylonej, animowanej powierzchni.** Laptop zostaje pod kątem klatki C (pkt 1). Sam kąt 3D jest tani (jedna skompozytowana warstwa-tekstura), ale **treść animuje się co klatkę** (scrub) i musi być co klatkę odmalowana, a potem przekompozytowana przez transform 3D. To główny koszt → degradujemy jakość drewelomet (pkt 1, 9).

---

## 3. Wybór podejścia: inline vs iframe

| Kryterium                  | **A — inline (rewrite do komponentu)** ⭐                  | B — iframe (`/public/...html`)                                  |
| -------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------- |
| Sprzężenie ze scrollem     | **idealne** (`master.progress(p)`, ta sama pętla rAF GSAP) | pośrednie (`scrollTo`/proxy, granica dokumentu, ryzyko desyncu) |
| Fonty „naszym mechanizmem" | **tak** (fontsource współdzielony)                         | osobny dokument → własny `@font-face`                           |
| `fixed`/`vh` w ekranie     | rozwiązywalne (`cqh/cqw` + `absolute`)                     | „za darmo" (iframe ma własny viewport)                          |
| Kontrola perf (degradacja) | **pełna** (jeden CSS, jedno drzewo)                        | ograniczona (oddzielny kontekst, +overhead iframe)              |
| Integralność z projektem   | **pełna** (komponent, build, lint)                         | obcy artefakt w `/public`                                       |
| Koszt przepisania          | wysoki                                                     | niski                                                           |

**Rekomendacja: A (inline).** Zgodne z priorytetem „efekt jak najlepszy i jak najpłynniejszy" (pkt 5), wymogiem fontów (pkt 7) i „integralną częścią" projektu. iframe odrzucamy: granica dokumentu psuje frame-perfect sprzężenie i utrudnia spójną degradację jakości oraz fonty. Wyższy koszt przepisania jest akceptowalny (pkt 5).

---

## 4. Architektura docelowa

```
src/components/sections/hero/
├─ Hero.astro            # orkiestrator — dokłada FAZĘ 3 (drewelomet) i rozszerza end/hold
├─ DeviceScene.astro     # ekran laptopa hostuje <LaptopSite/> zamiast pustej .screen__glass
├─ device-scene.ts       # bez zmian (geometria/fit/frameC)
├─ LaptopSite.astro      # NOWY: markup + scoped CSS strony drewelomet (cqh/cqw, absolute)
└─ laptop-site.ts        # NOWY: budowa spauzowanego master-timeline + render galerii; API dla Hero

public/drewelomet/        # NOWY: wszystkie PNG (docelowo zoptymalizowane — patrz §9)
```

**Wpięcie w `DeviceScene.astro`** — wnętrze ekranu laptopa staje się kontenerem strony:

```astro
<div class="screen" data-gsap="screen-laptop">
  <LaptopSite />
  <!-- zamiast samego .screen__glass -->
  <div class="screen__glass"></div>
  <!-- refleks zostaje NAD treścią -->
</div>
```

```css
/* .screen jako viewport drewelomet: definitywny rozmiar (z lid), własny kontekst */
.screen {
  position: relative;
  overflow: hidden;
  container-type: size; /* cqw/cqh w LaptopSite = wymiar ekranu, nie okna */
  contain: layout paint;
}
```

**Kontrakt `LaptopSite` ↔ `Hero`** (analogiczny do `device-scene.ts`): `laptop-site.ts` eksponuje
`initLaptopSite(screenEl)` zwracające API, którego timeline Hero używa do sprzężenia:

```ts
interface LaptopSiteApi {
  master: gsap.core.Timeline; // spauzowany, progres 0→1 = cała animacja drewelomet
  relayout: () => void; // przelicz po resize/refresh (woła ScrollTrigger.refresh w Hero)
  setActive: (on: boolean) => void; // włącz/zdejmij will-change tylko na czas fazy 3
  destroy: () => void;
}
```

---

## 5. Mechanika sprzężenia (serce rozwiązania)

### 5.1 Jeden spauzowany master-timeline

Trzy `ScrollTrigger`y drewelomet → trzy **zwykłe** `gsap.timeline({ paused: true })` (BEZ `scrollTrigger`), złożone sekwencyjnie w jeden master:

```ts
// laptop-site.ts (pseudokod)
const scene1 = buildScene1(screenEl); // te same .to/.fromTo co w drewelomet, bez scrollTrigger
const scene2 = buildScene2(screenEl);
const gallery = buildGallery(screenEl); // tween galProxy.p + onUpdate: galleryRender(p)

const master = gsap.timeline({ paused: true });
master.add(scene1).add(scene2, ">").add(gallery, ">");
// handoffy sekcji (stage yPercent -100, section2/3 wjazd) zostają WEWNĄTRZ scene1/scene2 —
// kolejność sekwencyjna odtwarza oryginalny porządek wizualny.
```

- `onUpdate`-y zostają (typewriter sceny 1, `galleryRender` galerii, toggling `display`) — odpalają się przy scrubowaniu.
- `gpu-active` z oryginału zastępujemy `setActive()` (will-change tylko w fazie 3 — §9).

### 5.2 Hero napędza master (FAZA 3)

W `Hero.astro`, po `phase2Desktop`, dokładamy fazę 3 sprzęgającą scroll z `master.progress`:

```ts
// proxy zamiast bezpośredniego tween na progress (czytelny scrub + jeden punkt kontroli)
const p = { v: 0 };
tl.to(
  p,
  {
    v: 1,
    ease: "none",
    duration: DREWELOMET_DUR, // udział fazy 3 w osi timeline (patrz 5.3)
    onUpdate: () => site.master.progress(p.v),
    onStart: () => site.setActive(true),
    onComplete: () => site.setActive(false),
  },
  PH3_START,
); // PH3_START = koniec fazy 2 (grupa w klatce C)
```

### 5.3 Budżet scrolla i kompresja (pkt 3)

- `ScrollTrigger` Hero mapuje **całą oś timeline na całkowity dystans scrolla** (`end`). Dziś `end: +=4×vh` + hold do 700svh. Faza 3 ma zająć **~10–12 ekranów**:
  - zwiększyć `end` do np. `+=window.innerHeight * 14` (4 dotychczasowe + ~10 na drewelomet) i `min-height` Hero odpowiednio (np. ~1500–1700svh; do strojenia),
  - dobrać `DREWELOMET_DUR` względem `PH3_START` tak, by faza 3 dostała ~10/14 całkowitego dystansu.
- **Kompresja podwójna** (zgodnie z pkt 3): (a) tempo — master skraca ~19vh oryginału do ~10–12 ekranów; (b) **skrócenie końcówki** — w `buildGallery` przyciąć rząd 2 produktów lub jego część (`ROW2_VH`, `g-r2 *`), ewentualnie skrócić `DROP_VH`. To zdejmuje najwięcej „pustego" przewijania przy najmniejszej stracie wrażenia.

### 5.4 Detach (pkt 10)

Po `progress(1)` master nie animuje już nic; dalszy scroll wchodzi w **istniejący** handoff Hero→Problem (`Home.astro`, trigger `#problem`). Wystarczy, że `end` Hero + `min-height` zostawią naturalny „wyjazd" stage'u w górę i Problem wjedzie z crossfade tła jak dziś. Nie tworzymy osobnego mechanizmu odjazdu — tylko upewniamy się, że końcowy hold/odpięcie następuje **po** `progress(1)`.

---

## 6. „Uwięzienie" layoutu w ekranie (pkt wyzwania #2)

Drewelomet renderujemy w `LaptopSite.astro` przy **stałym rozmiarze projektowym ekranu** (kontener `.screen` ma definitywne wymiary z lid → `container-type: size` działa):

1. **`position: fixed` → `position: absolute`.** Wszystkie warstwy `inset:0` (`.parallax-viewport`, `.stage`, `.section2`, `.section3`, `.site-nav`) stają się `absolute` względem `.screen` (najbliższy kontener pozycjonujący). Eliminuje to też kruchość „fixed łapie się transformowanego przodka 3D" (`.camera`/`.laptop`/`.face` mają transformy — `fixed` przyczepiłby się do nich, nie do ekranu).
2. **`vh` → `cqh`, `vw` → `cqw`** w całym CSS strony. Dzięki `container-type: size` na `.screen` rozwiązują się do wymiaru **ekranu**, nie okna. (Scroll-containery i ich wysokości w `vh` i tak usuwamy — §5.1.)
3. **JS: `window.innerWidth/innerHeight` → `screenEl.clientWidth/clientHeight`.** Dotyczy głównie `galleryLayout` (zmienne `iw`, `cx`, wszystkie pozycje taśmy) oraz pomiarów ramki sceny 1. Parametryzujemy cały moduł elementem `screenEl`.
4. **`--nav-h`/`--gh`** (galeria liczy wysokość kadru = ekran − navbar) — liczone z `screenEl`, nie z okna.
5. **`relayout()`** woła się przy `ScrollTrigger.refresh` Hero (`invalidateOnRefresh`) i przy resize — przelicza layout galerii pod aktualny wymiar ekranu (ekran zmienia rozmiar wraz z `--fit`/`frameC`).

> Uwaga: zamiana `vh→cqh`/`vw→cqw` musi być **świadoma, nie hurtowa** — w kilku miejscach drewelomet używa `vh`/`vw` do efektów (rozmiary fontów `font-size: 3.8vw`, pozycje miarki). Wszystkie powinny iść na `cq*`, by skalowały się z ekranem laptopa, ale każdą trzeba zweryfikować wizualnie.

---

## 7. Fonty (pkt 7)

- Dodać paczki: `@fontsource/chakra-petch`, `@fontsource/raleway`, `@fontsource/stardos-stencil`, `@fontsource/zilla-slab` (wagi użyte w drewelomet: Chakra Petch 600/700, Raleway 800, Stardos Stencil 700, Zilla Slab 600/700).
- Importy w `BaseLayout.astro` (obok Archivo/Instrument Serif) **lub** — dla izolacji — w `<style>`/skrypcie `LaptopSite`. Rekomendacja: w `BaseLayout` (spójnie z obecnym wzorcem), z subsetowaniem do potrzebnych wag.
- Tokeny w `global.css` `@theme`, np. `--font-drewelomet-display`, `--font-drewelomet-wood`, `--font-drewelomet-steel`, `--font-drewelomet-ui`; w `LaptopSite` używać `var(--font-…)` zamiast literałów `"Chakra Petch"` itd.
- Usunąć `<link>` do Google Fonts z przepisanego markupu (zero zewnętrznych żądań — lepsze CWV i offline).

---

## 8. Assety (pkt 6)

- Skopiować całe drzewo PNG do `public/drewelomet/` (zachować podkatalogi `carpenter/`, `products/`) — ścieżki względne w CSS/markupie (`background.png`, `carpenter/…`, `products/…`) działają 1:1 jako `/drewelomet/…`.
- **Optymalizacja (osobny krok, ale ważny — ~14 MB):** konwersja do WebP/AVIF + **downscale** (ekran ≈ 818×512 px i jeszcze pomniejszony — pełne rozdzielczości są zbędne). To zdejmuje wagę strony i koszt dekodowania/malowania (sprzęga się z §9). `/public` nie przechodzi przez optymalizator Astro, więc albo konwertujemy ręcznie, albo rozważamy `src/assets` + import dla tych obrazów w kroku optymalizacyjnym.

---

## 9. Wydajność — degradacja jakości drewelomet (pkt 1 i 9, kluczowe)

Skoro czytelność nieistotna, a ekran mały i pochylony — tniemy koszt malowania per klatkę. Kolejność wg zysku:

1. **Navbar (pkt 9) — przepisać pod minimalny GPU:** usunąć wielowarstwowy `text-shadow` (10+ cieni) → 0–1 cień; usunąć animację `color-mix`/`--nav-t` (kolor statyczny); usunąć `::before` z `mask-image` (tło proste albo żadne). Navbar ma tylko „wyglądać".
2. **Napisy „z drewna" / „i stali":** podwójny `-webkit-text-stroke` + `::before` + `drop-shadow`/`text-shadow` to drogi paint. Opcje: zredukować do pojedynczego stroke bez `::before`, **albo** wypiec napisy jako statyczne obrazy (PNG/WebP) i tylko je transformować (parallax `transform` = tanio).
3. **`filter: blur()`** (parallax-viewport mask, glow, drop-shadow): obniżyć promienie lub usunąć tam, gdzie efekt i tak ginie na małym ekranie.
4. **Maski `mask-image`** (frame feather, ruler draw, nav): upraszczać/usuwać — feather na 818 px jest ledwo widoczny.
5. **Pełnoekranowe warstwy `opacity`/crossfade:** ograniczyć liczbę jednocześnie promowanych warstw.
6. **`will-change` tylko w fazie 3** przez `setActive(true/false)` (oryginał robił to klasą `gpu-active` per-ScrollTrigger — u nas jeden master, więc bramkujemy ręcznie). Poza fazą 3 — zdejmować.
7. **Render w niższej rozdzielczości wewnętrznej:** kontener strony np. 60–70% docelowego rozmiaru ekranu + upscale (treść i tak mała i pod kątem). Mniej pikseli do odmalowania co klatkę.
8. **Pojedyncza skompozytowana warstwa ekranu:** `.screen` z `transform: translateZ(0)`/`will-change: transform` (w fazie 3) → kąt 3D kompozytuje cache'owaną teksturę; koszt to repaint treści, nie sam tilt.
9. **Skrócenie galerii** (§5.3) — mniej elementów = mniej pracy w `galleryRender`.

> Wszystkie powyższe są „pokrętłami" — wprowadzać i **mierzyć** (DevTools → Rendering → Paint flashing / FPS meter; test na realnym sprzęcie). Zaczynać od navbara i napisów (największy stały koszt paintu).

---

## 10. Fallbacki

- **`prefers-reduced-motion: reduce` (pkt 8):** Hero GSAP jest wyłączony (istniejący wzorzec), scena urządzeń w stanie bazowym. Na ekranie laptopa pokazać **statyczny poster** (jeden reprezentatywny kadr drewelomet wyeksportowany do `public/drewelomet/poster.webp`) zamiast uruchamiać master-timeline. Sekcja pozostaje sensowna bez ruchu.
- **Mobile ≤760px (pkt 4):** ekran laptopa **biały jak dziś** — `LaptopSite` renderuje się tylko w wariancie desktop/tablet (`@media (min-width: 761px)`), na mobile nie inicjalizujemy `initLaptopSite` (oszczędność: zero ciężkiego DOM/JS na telefonie). Pełna/okrojona wersja mobilna — osobny etap.
- **Brak JS / błąd inicjalizacji:** ekran zostaje biały (`.screen` ma `background:#fff`) — degradacja bezpieczna.

---

## 11. Ryzyka i pułapki

- **Kruchość `position: fixed` na transformowanym przodku 3D.** Najważniejszy powód, by konsekwentnie zamienić `fixed→absolute` względem `.screen` — inaczej warstwy „przyczepią się" do `.camera/.laptop/.face` i rozjadą podczas morphu. Wymaga audytu **każdego** `fixed` w drewelomet.
- **`container-type: size` a `contain`.** Ustawia silne containment — sprawdzić, że nic w drewelomet nie polega na „wyciekaniu" rozmiaru z dzieci (drewelomet ma definitywne wymiary, więc OK), oraz że `overflow:hidden` ekranu nie ucina pożądanych elementów na krawędziach.
- **Desync scruba.** `master.progress(p.v)` w `onUpdate` jest deterministyczny (dobrze), ale oryginał używał `scrub: 0.6` (inercja). U nas inercję daje `scrub: true` Hero — zachowanie będzie inne (bardziej „przyklejone" do scrolla). Do akceptacji wizualnej; ewentualnie `scrub: <liczba>` na Hero.
- **`invalidateOnRefresh`/resize.** Ekran zmienia rozmiar wraz z `--fit`/`frameC`. `relayout()` galerii musi przeliczać się po każdym refreshu, inaczej taśma produktów rozjedzie się przy zmianie okna. Spiąć z `ScrollTrigger.addEventListener("refreshInit", …)` jak w oryginale, ale na `screenEl`.
- **Kolejność inicjalizacji.** `initLaptopSite` musi zbudować master **zanim** Hero zbuduje fazę 3 (Hero czyta `site.master`). Analogicznie do obecnego `initDeviceScene` przed timeline.
- **Waga/LCP (~14 MB PNG).** Bez optymalizacji (§8) ucierpi pierwszy render i bramka Lighthouse (`docs/analiza-stack...`: perf ≥0,9). Optymalizacja obrazów to nie „nice-to-have".
- **Cleanup `matchMedia`.** `LaptopSite`/master muszą być killowane w `cleanup()` wariantu desktop (HMR / przejście desktop↔mobile), inaczej zostaną duplikaty timeline'ów i wycieki.
- **Sprzężenie typewriter/`onUpdate`.** Funkcje zależne od czasu (typewriter liczy progi 0..1) muszą działać na progresie sub-timeline, nie na `tl.time()` globalnym — przy przenoszeniu do paused-timeline zweryfikować źródło progresu.
- **`ScrollTrigger.normalizeScroll(true)`** (ustawione w Hero) bywa kapryśne z zagnieżdżonymi scrubami — przetestować na touchpadzie i na tablecie.

---

## 12. Plan wdrożenia (małe, weryfikowalne kroki)

1. **Assety + fonty (infra).** Skopiować PNG do `public/drewelomet/`. Dodać paczki `@fontsource/*`, importy w `BaseLayout`, tokeny w `global.css`. (Bez efektu wizualnego — fundament.)
2. **`LaptopSite.astro` — statyczny render.** Przepisać markup + CSS drewelomet do komponentu; `fixed→absolute`, `vh/vw→cqh/cqw`, fonty na tokeny, ścieżki na `/drewelomet/…`. Wpiąć w `.screen` (`container-type: size`). Cel kroku: **pierwsza klatka** drewelomet wyświetla się poprawnie na ekranie laptopa (bez animacji).
3. **`laptop-site.ts` — master-timeline.** Przekuć 3 ScrollTriggery w 3 paused-timeline'y + `master`. Parametryzować `screenEl` (`window.inner*` → `client*`). Tymczasowo wystawić kontrolkę debug (np. `master.progress(0.5)`), by zweryfikować całość animacji w izolacji.
4. **Sprzężenie z Hero (FAZA 3).** Dodać proxy `p`+`onUpdate: master.progress`, `setActive`, `PH3_START`, `DREWELOMET_DUR`; zwiększyć `end` Hero i `min-height`. Zestroić budżet ~10–12 ekranów. Zweryfikować handoff do `Problem` (pkt 10).
5. **Kompresja końcówki.** Przyciąć galerię (rząd 2/`DROP_VH`) wg odczucia tempa (pkt 3).
6. **Wydajność (§9).** Przepisać navbar pod min. GPU; zredukować napisy/blur/maski; `will-change` gating; ewentualnie niższa rozdzielczość wewnętrzna. Mierzyć (Paint flashing, FPS, realny sprzęt).
7. **Fallbacki.** Poster dla reduced-motion; biały ekran na mobile (nie inicjalizować `LaptopSite`).
8. **Optymalizacja obrazów.** WebP/AVIF + downscale (§8).
9. **Bramki:** `pnpm format && pnpm lint && pnpm typecheck && pnpm build`; podgląd `pnpm dev --host` (desktop + tablet). Commit(y) w Conventional Commits (np. `feat(hero): embed scroll-coupled drewelomet site on laptop screen`).

---

## 13. TL;DR

- **Cel:** ekran laptopa (klatka C, pod kątem, bez ruchu) staje się oknem na stronę drewelomet, której animacja jest **w 100% sprzężona** z master-timeline Hero; po końcu drewelomet — handoff do `Problem`.
- **Podejście:** **inline** (rewrite do `LaptopSite.astro` + `laptop-site.ts`), nie iframe — dla frame-perfect sprzężenia, fontów naszym mechanizmem i pełnej kontroli perf.
- **Sprzężenie:** 3 ScrollTriggery drewelomet → **jeden spauzowany `master`**; Hero scrubuje `master.progress(p)` w nowej **FAZIE 3**; budżet **~10–12 ekranów** (tempo + skrócenie galerii).
- **Uwięzienie layoutu:** `.screen` jako `container-type: size`; `fixed→absolute`, `vh/vw→cqh/cqw`, `window.inner*→screenEl.client*`.
- **Wydajność (priorytet):** wolno degradować jakość drewelomet — navbar bez ciężkich cieni, napisy/blur/maski uproszczone lub wypieczone w obraz, `will-change` tylko w fazie 3, niższa rozdzielczość wewnętrzna, lżejsze obrazy.
- **Zakres teraz:** tylko desktop/tablet; telefon i mobile = biały ekran (kolejny etap); reduced-motion = statyczny poster; **zero interaktywności** poza scrollem.
  </content>
  </invoke>
