# Analiza optymalizacyjna — pierwszy większy refactor porządkujący

Data analizy: 2026-07-15. Gałąź robocza: `refactor/general-refactor`.
Status: **AKTUALNY — w trakcie wdrażania**: Etapy 1–5 wdrożone i zmergowane
(PR-y `general-refactor-part1`–`part5`, do 2026-07-16), Etap 6 w PR
`general-refactor-part6`; pozostał Etap 7 (kandydaci wymagający osobnej
decyzji) i ręczne sprzątanie R2 (§6.6). Po zamknięciu całości oznaczyć
jako historyczny i zaktualizować `docs/README.md`.

Dokument jest **samowystarczalny**: zawiera pełny kontekst, ustalenia
z Mateuszem, znaleziska z odwołaniami plik:linia i plan etapów, tak by
wdrożenie mogło ruszyć w świeżej sesji Claude Code bez tej rozmowy.

---

## 0. Kontekst, ustalenia i zasady wdrożenia

### Ustalenia z Mateuszem (2026-07-15)

1. **Ból nr 1 (zgłoszony):** (a) zacinający się scroll na słabszych
   Androidach i starszych iPhone'ach (np. iPhone SE 2020); (b) po geście
   powiększania dwoma palcami (pinch) strona potrafi nagle zacząć
   scrollować bardzo szybko i „robi się bałagan".
2. **Wyłącznie zmiany baseline-neutralne** (niezmieniające pikseli na
   screenshotach `tests/visual/__screenshots__/`). Zmiany potencjalnie
   ruszające piksele są w tym dokumencie wydzielone do osobnej sekcji
   „wymaga osobnej decyzji" (§8, Etap 7) i NIE wchodzą do etapów 1–6.
3. Abstrakcje wspólne tylko przy realnej duplikacji (≥3 wystąpienia tego
   samego kształtu); hero poza wspólnymi abstrakcjami.
4. Zależności: wolno usuwać zbędne, **bez bumpów wersji** (szczególnie
   para `playwright`/`@playwright/test`).
5. Treści CMS (`src/content/realizacje/*.json`) są testowe — można
   czyścić po stronie R2, ale wg instrukcji w §6.4 (weryfikacja ręczna).
6. Testy: żadna zmiana nie może osłabić pokrycia ani progów (ratchet).
7. Blokady w `.claude/settings.json` nietykalne.
8. Wdrożenie: **seria małych, niezależnie mergowalnych PR-ów**; nazwy
   gałęzi `general-refactor-part1`, `-part2`, … (albo osobne commity na
   jednej gałęzi, jeśli etap jest trywialny i bezpieczny — decyzja
   Mateusza per etap).
9. Miara sukcesu: metryki syntetyczne (Lighthouse CI, `pnpm test:*`);
   pomiary na fizycznym urządzeniu tylko dla zmian hero/scroll — dokument
   wskazuje przy każdym etapie, co sprawdzić na telefonie.

### Twarde zasady projektu (przypomnienie dla świeżej sesji)

- **NIGDY `git commit`/`git push`** — commituje wyłącznie Mateusz;
  Claude zostawia zmiany w working tree i proponuje treść commita.
- Nie edytować `src/content/realizacje/*.json`, `dist/`, `.astro/`,
  baseline'ów wizualnych; nie czytać sekretów.
- Weryfikacja wizualna WYŁĄCZNIE na preview (port 4399):
  `pnpm build && pnpm test:visual`. Przy pracy w hero dodatkowo skill
  `/verify-mobile`. Mapowanie zmiana→testy: `.claude/rules/testing.md`.
- Oczekiwany wynik testów wizualnych po każdym etapie 1–6: **0 diff**
  (wszystkie zmiany są baseline-neutralne). Jakikolwiek diff = regresja
  etapu, nie powód do regeneracji baseline'ów.

### Stan wyjściowy (zmierzone fakty)

- `dist/` łącznie ~5,5 MB, z czego `public/drewelomet/` ~3,2 MB (w tym
  wideo ~1,5 MB) — wszystko żywe (scena hero). JS: `ScrollTrigger`
  112 KB, moduł hero 32 KB, `smooth-scroll` (z Lenisem) 20 KB, reszta
  ≤8 KB/moduł. CSS: `Home.css` 148 KB. Fonty: subsety woff2 ~250 KB
  łącznie, wszystkie używane.
- **Wniosek:** sieć/bundle NIE jest wąskim gardłem (budżety Lighthouse
  pilnowane w CI); realne koszty to **runtime GPU/CPU na mobile** —
  i tam celuje ta analiza.
- Historia projektu (pamięć/docs) zweryfikowana grep-em: usunięte
  mechanizmy (`normalizeScroll`, `--vh`/`use-dvh`/`?svh`, `is-lowpower`,
  `?flat`, czerwone strefy paska) faktycznie **nie występują** w `src/`
  ani `tests/` — kod jest po refaktorach czysty, historia się zgadza.

---

## 1. Podsumowanie wykonawcze

1. **Zidentyfikowano źródło buga pinch-zoom** (ból nr 1b) — to wada
   obsługi dotyku w Lenis 1.3.x, naprawialna w naszym kodzie
   (`src/scripts/smooth-scroll.ts`) bez zmiany biblioteki. Szczegóły
   i szkic naprawy: §2.1. To najważniejsza pojedyncza zmiana w planie.
2. **Scroll na słabszych urządzeniach** (ból nr 1a): hero jest po
   refaktorze w dobrej formie, ale zostały trzy konkretne koszty
   w gorącej ścieżce scrolla na mobile: layout thrash w `placeDividers()`
   (Android), zapis `--p` bez dedupe oraz romb postępu animowany przez
   `top` (ten ostatni nie w pełni baseline-neutralny → Etap 7). Do tego
   nieaktywne warstwy tła ambient trzymają promocję GPU na desktopie.
3. **Martwy kod jest nieliczny, ale konkretny**: cały `src/config/site.ts`,
   blok tokenów `--sec-*` w `global.css` (z komentarzem wskazującym
   nieistniejące komponenty), `screen__glass` i atrybuty `data-gsap`
   ekranów w hero, 2–3 jednorazowe skrypty w `scripts/`.
4. **Duplikacja realna, ale rozproszona**: jeden „section runner" jest
   bezzasadny (trzy różne rodziny sekcji); zasadne jest 5–6 małych
   helperów (`revealOnce`, `scrollToAnchor`, `motionMedia`,
   `ghostParallax`, `makeProgress`) i ewentualnie 2 komponenty Astro.
   W testach: 12× powielony blok `beforeAll`, zdublowane stałe sweepów.
5. **Ekosystem Claude**: mapa projektu w CLAUDE.md nie wymienia 5 z 7
   sekcji strony; dwa miejsca wskazują zły plik schemy
   (`content.config.ts` zamiast `content.schema.ts`); brak reguł
   path-triggered dla gotchas sekcji services/audience/faq/contact/about.
6. Czego NIE ruszamy (zweryfikowane jako żywe/dobre): zależności
   (wszystkie używane), fonty (wszystkie subsety konsumowane), assety
   `public/` i `src/assets/` (komplet referencji), `functions/api/kontakt.ts`
   (solidny; jedna drobna uwaga informacyjna §2.6), progi i pokrycie
   testów, komentarze w hero (gęste, ale niosą wiedzę o regresjach).

---

## 2. Analiza wydajności

### 2.1 [WYSOKI] Pinch-zoom wystrzeliwuje scroll — guard wielodotyku w Lenis

**Plik:** `src/scripts/smooth-scroll.ts` (całość konfiguracji touch:
linie 35–45). **Baseline-neutralna: TAK** (czysty JS, zero zmian pikseli).
**Złożoność: niska.**

**Stan obecny / mechanizm buga** (zweryfikowany w źródle
`node_modules/lenis/dist/lenis.mjs`, wersja 1.3.23):

1. `VirtualScroll.onTouchStart/onTouchMove` czytają wyłącznie
   `targetTouches[0]` i **nigdy nie sprawdzają `touches.length`**
   (lenis.mjs ~311–341). Podczas gestu pinch ruchy palców zamieniają się
   w duże, szarpane delty scrolla.
2. Handler `syncTouch` robi `preventDefault()` i przy `touchend` liczy
   bezwładność jako `|velocity| ** touchInertiaExponent` — u nas
   `TOUCH_INERTIA_EXPONENT = 1.95` (`smooth-scroll.ts:24`). Zawyżona
   prędkość z pincha podniesiona do potęgi ~2 daje gwałtowny wystrzał —
   dokładnie objaw „strona nagle scrolluje bardzo szybko".
3. Po powiększeniu strony (visual viewport `scale > 1`) natywne
   przesuwanie palcem nadal emituje `touchmove`, które Lenis przechwytuje
   i zamienia na wirtualny scroll — stąd „bałagan" po zoomie.

**Kluczowy niuans:** `lenis.stop()` NIE nadaje się na guard — w stanie
stopped Lenis nadal wykonuje `preventDefault` (gałąź
`if (this.isStopped || this.isLocked)` w lenis.mjs), czyli zablokowałby
też natywne panowanie po zoomie. Właściwy mechanizm to opcja **`prevent`**:
gdy zwróci `true`, Lenis ignoruje zdarzenie **bez** `preventDefault`,
więc natywny pan/zoom działa normalnie.

**Rekomendacja (szkic):** w `smooth-scroll.ts`, tylko w gałęzi touch:

```ts
// Guard pinch/zoom: Lenis 1.3.x nie rozpoznaje wielodotyku
// (VirtualScroll czyta tylko targetTouches[0]) i przechwytuje panowanie
// po powiększeniu strony. prevent -> Lenis ignoruje zdarzenie bez
// preventDefault (lenis.stop() by tu NIE zadziałał: stopped nadal
// preventuje i zablokowałby natywny pan).
let multiTouch = false;
const vv = window.visualViewport;
const isZoomed = () => (vv?.scale ?? 1) > 1.01;

const opts = { capture: true, passive: true } as const;
window.addEventListener("touchstart", (e) => {
  if (e.touches.length > 1) multiTouch = true;
}, opts);
window.addEventListener("touchend", (e) => {
  if (e.touches.length === 0) multiTouch = false;
}, opts);
window.addEventListener("touchcancel", (e) => {
  if (e.touches.length === 0) multiTouch = false;
}, opts);

// w opcjach new Lenis(...) dla isTouch:
//   prevent: () => multiTouch || isZoomed(),
```

Uwagi do implementacji:

- Po zakończeniu gestu pierwszy zwykły `touchstart` przechodzi przez
  wewnętrzny `reset()` Lenisa (gałąź `isClickOrTap` w handlerze
  `syncTouch`), co zeruje zastane `velocity` — nie trzeba nic dopisywać.
- Desktop nie wymaga zmian: pinch na trackpadzie to `wheel` z `ctrlKey`,
  a Lenis ma na to guard (`if (event.ctrlKey) return`).
- `prevent` jest wołany per-węzeł `composedPath` między targetem
  a `<html>`; dotyk zawsze trafia w element strony, więc to działa.
  Gdyby w praktyce okazało się niewystarczające (nie powinno), fallback:
  listener `touchmove` w fazie capture na `window` wołający
  `e.stopPropagation()` gdy `multiTouch || isZoomed()`.
- Zaktualizować `.claude/rules/scroll-lenis.md` o nową zasadę (guard
  pinch = naprawiony bug; nie usuwać przy kolejnych refaktorach).

**Oczekiwana korzyść:** eliminacja losowych „wystrzałów" scrolla przy
zoomie — bezpośrednia naprawa zgłoszonego buga UX.

**Weryfikacja:** emulacja NIE odda gestu pinch (tabela „czego emulacja
nie wykrywa"). Po wdrożeniu `pnpm test:e2e` (kotwice/nawigacja) +
**test na fizycznym telefonie** — checklist dla Mateusza:
1. pinch-in/pinch-out w różnych miejscach strony (hero, środek, stopka) —
   strona nie może „odjechać";
2. po powiększeniu: przesuwanie jednym palcem = natywny pan (bez skoków);
3. po powrocie do skali 1: zwykły scroll z wybiegiem działa jak dotąd
   (syncTouch feel bez zmian);
4. iPhone (Safari) i Android (Chrome) osobno.

### 2.2 [WYSOKI] `placeDividers()` — layout thrash per-frame w scrollu (Android)

**Plik:** `src/components/sections/hero/mobile-phases.ts:227–248`.
**Baseline-neutralna: TAK** (te same wartości `top`, tylko taniej liczone).
**Złożoność: niska.**

**Stan:** `placeDividers()` jest `onUpdate` ScrollTriggera i w każdej
klatce robi trzy `getBoundingClientRect()` (stage, laptop, phone — READ
wymuszający layout) przeplecione z zapisami `style.top` (WRITE). To
jedyny fragment hero łamiący wzorzec „snapshot → rest → pomiar",
wykonywany dokładnie na słabym Androidzie (bramka `IS_ANDROID`).

**Rekomendacja:** zebrać wszystkie odczyty przed zapisami (batch
read→write) oraz pomijać zapis, gdy wyliczony `top` się nie zmienił
(wzorzec `lastScale` z `android-mobile.ts`). Okno działania jest krótkie
(`top → LAP_SPAN.start`), ale to hot path scrolla na najsłabszej
platformie.

**Korzyść:** mniej wymuszonych reflow per-frame na Androidzie — wprost
adresuje „zacinający się scroll". **Weryfikacja:** `pnpm test:unit`,
`pnpm build && pnpm test:visual` (0 diff), `/verify-mobile`; na
fizycznym Androidzie: płynność w pierwszej fazie hero (zanim laptop
zacznie rosnąć).

### 2.3 [ŚREDNI] Zapis `--p` paska postępu bez dedupe

**Plik:** `src/components/sections/hero/android-mobile.ts:151–153`.
**Baseline-neutralna: TAK. Złożoność: niska.**

**Stan:** `onUpdate` progressTriggera pisze
`progressEl.style.setProperty("--p", …)` bezwarunkowo co klatkę —
w odróżnieniu od sąsiedniego `setScale`, który ma strażnik `lastScale`.
Koszt potęguje fakt, że `--p` napędza `top` rombu (patrz Etap 7 / §2.7).

**Rekomendacja:** strażnik ostatniej wartości (np. zaokrąglonej do
4 miejsc) przed `setProperty`. **Korzyść:** mniej pracy stylów per-frame
na mobile.

### 2.4 [ŚREDNI] Ambient: nieaktywne warstwy trzymają promocję GPU (desktop)

**Pliki:** `src/components/backgrounds/AmbientBackground.astro:76,106,117`
(`will-change: transform` na chmurach) + `src/components/Home.astro:83–85`.
**Baseline-neutralna: TAK** (warstwy nieaktywne mają `opacity: 0`;
zdjęcie promocji nie zmienia renderu). **Złożoność: niska.**

**Stan:** `Home.astro` renderuje 7 warstw `.bg-layer` (po jednej na
sekcję), każda z 4 elementami chmur z trwałym `will-change: transform`.
Nieaktywna warstwa pauzuje animacje
(`AmbientBackground.astro:204–209`) i zdejmuje `will-change` **tylko
z samej `.bg-layer`** (`Home.astro:83–85`), ale NIE z potomków →
na desktopie do ~28 wypromowanych warstw kompozycji (7×4), z czego
naraz potrzebne są 4 (aktywna warstwa). Mobile nie dotyczy (chmury mają
tam `display: none`, tło to statyczna tekstura).

**Rekomendacja:** dopisać w `AmbientBackground.astro` regułę analogiczną
do pauzy animacji:

```css
:global(.bg-layer.is-inactive) .ambient-bg__clouds::before,
:global(.bg-layer.is-inactive) .ambient-bg__clouds::after,
:global(.bg-layer.is-inactive) .ambient-bg__cloud-c,
:global(.bg-layer.is-inactive) .ambient-bg__cloud-d {
  will-change: auto;
}
```

**Korzyść:** zwolnienie pamięci GPU / mniej warstw kompozycji na
desktopie (istotne dla słabszych iGPU). **Weryfikacja:**
`pnpm build && pnpm test:visual` (0 diff — pełny zestaw 6 profili).

### 2.5 [INFO] Wideo hero mobile: dwa dekodery z `preload="auto"`

**Plik:** `src/components/sections/hero/Hero.astro:730–752`.
**Nie ruszać w etapach 1–6.**

`setupVideo` ustawia `preload="auto"` + `load()` dla obu MP4 (~1,5 MB
łącznie) od razu przy hydracji gałęzi mobile; `initMobilePhase3` gra oba
równolegle. Na SE 2020 / słabym Androidzie dwa dekodery H.264 to realny
koszt pamięci/termiki — ale to konsekwencja designu (oba urządzenia
widoczne naraz), a zmiana na `preload="metadata"` grozi pustą klatką.
Kandydat do Etapu 7 wyłącznie z testem na fizycznych urządzeniach.

### 2.6 [INFO] Pozostałe ustalenia wydajnościowe (bez akcji)

- `LaptopSite`/`PhoneSite` (ciężkie poddrzewa, `box-shadow`,
  `drop-shadow`) są na mobile **usuwane z DOM** (`Hero.astro:709–710`) —
  poprawnie, nie obciążają słabych urządzeń.
- `device-scene.ts` używa `getBoundingClientRect` tylko w `relayout`
  (resize), nie w pętli scrolla — OK.
- Self-heal wideo jest event-driven (zdarzenie `pause`), bez timerów
  w pętli — zgodne z regułami, OK.
- Karuzela nagłówków (`caption-carousel.ts:139–159`) pisze
  `fontSize`/`fontWeight` per-frame przy scrubie — inherentne dla efektu
  morphu, desktop-only, ze strażnikami `lastFont`/`lastWeight`. Bez akcji.
- Fala liter akcentu (`Hero.astro:197–213`): `will-change` + nieskończona
  animacja na każdej literze; pauza (`is-wave-paused`) obejmuje tylko
  wariant `--live`. Wyłączenie zmienia piksele → ewentualnie Etap 7.
- `functions/api/kontakt.ts:108–114`: dzienny licznik KV `get`→`put` bez
  atomowości (przy równoległych żądaniach możliwe drobne przekroczenie
  limitu 80) i brak per-IP rate-limitu. Turnstile to mityguje; poprawka
  opcjonalna, poza zakresem tego refactoru.
- Bundle/fonty/assety: bez cięć — wszystko używane, budżety pilnuje LHCI.

### 2.7 Kandydaci NIE-baseline-neutralni (tylko do Etapu 7, osobna decyzja)

1. **Romb paska postępu animowany przez `top`** —
   `Hero.astro:450–460` (`top: calc(var(--p) * 100%)`): własność
   niekompozytowalna, layout per-frame na mobile. Poprawka =
   `transform: translateY(...)`; możliwe subpikselowe różnice pixel-diff.
   Wymaga `/verify-mobile` + oceny diffu.
2. **`preload="metadata"` dla wideo hero mobile** (§2.5) — wymaga testu
   na fizycznym iPhone/Androidzie (ryzyko pustej klatki na starcie).
3. **Fala liter akcentu**: pauza także dla `--ghost` po ustaniu ruchu
   i/lub zdjęcie `will-change` — wizualnie „powinno" być identyczne
   w stanach spoczynku, ale animacja jest nieskończona, więc każda zmiana
   wymaga diffu i decyzji.

---

## 3. Analiza utrzymania kodu

### 3.1 Wniosek nadrzędny: NIE budować jednego „section runnera"

Sekcje dzielą się na trzy realnie różne rodziny:
**pinned+scrub+snap+timeline** (about, audience), **flow+scrub bez pinu**
(services), **once→toggleClass + ghost parallax** (faq, contact).
Wspólna mega-abstrakcja byłaby sztuczna. Zasadne są natomiast małe,
ortogonalne helpery (≥3 wystąpienia tego samego kształtu):

### 3.2 [WYSOKI] Helper `revealOnce()` — 7+ wystąpień

Kształt `ScrollTrigger.create({ trigger, start, once:true,
toggleClass:{targets, className:"on"} })`:
`faq-scroll.ts:87–108` (3 bloki), `contact-scroll.ts:37–67` (4 bloki),
pokrewnie `services-scroll.ts:117–139`. `contact-scroll.ts` jest w ~85%
kongruentny z `faq-scroll.ts` — w praktyce ten sam plik. Najlepszy
stosunek zysku do ryzyka w całej duplikacji. Baseline-neutralne: TAK.

### 3.3 [ŚREDNI] Wspólny `scrollToAnchor()` — 5–6 wystąpień

Ten sam handler kotwic CTA (preventDefault → `__lenis.scrollTo` /
fallback `scrollIntoView` → `history.replaceState`) skopiowany w:
`About.astro:170–180`, `Audience.astro:178–188`, `Faq.astro:129–140`,
`Services.astro:251–263`, `contact-ui.ts:343–354`, a `Navbar.astro:701–721`
ma już gotowy `scrollToTarget(target)`. Wyeksportować jeden helper
(np. z `src/scripts/smooth-scroll.ts` lub nowego `src/scripts/anchors.ts`)
i użyć wszędzie. Baseline-neutralne: TAK.

### 3.4 [ŚREDNI] Pozostałe helpery scrolla sekcji

- **`motionMedia()`** (bramka `gsap.matchMedia` isDesktop+motionOK,
  ~25 linii × 5): `about-scroll.ts:256–278`, `audience-scroll.ts:363–385`,
  `services-scroll.ts:254–279`, `faq-scroll.ts:112–139`,
  `contact-scroll.ts:70–97`.
- **`ghostParallax()`** (fromTo y, scrub): `faq-scroll.ts:124–137`,
  `contact-scroll.ts:82–95`, wariant `services-scroll.ts:191–204`.
- **`makeProgress()`** (ticki+pcount; przy okazji ujednolicić nazwę
  `setStage` vs `setStep`): `about-scroll.ts:66–73`,
  `audience-scroll.ts:72–81`, `services-scroll.ts:178–184`.
- **`q`/`qa` scope helpers** (3× identyczne): `about-scroll.ts:30–32`,
  `audience-scroll.ts:32–34`, `services-scroll.ts:76–78`.
- `createPinnedScrub()` (blok pin+scrub+snap+`?nosnap`, bajt-identyczny
  w `about-scroll.ts:164–187` ↔ `audience-scroll.ts:285–308`) — tylko
  2 wystąpienia; robić dopiero, gdy dojdzie trzecia sekcja pinned.

Wszystko baseline-neutralne (czysty refactor, zero zmian w wartościach
tweenów). Sugerowana lokalizacja: `src/scripts/section-helpers.ts`
(albo `src/lib/`).

### 3.5 [ŚREDNI, OSTROŻNIE] Wspólne komponenty Astro `SectionTag` / `SectionProgress`

> ⚠️ **Korekta z wdrożenia (2026-07-15, Etap 4b):** premisa „bajt-identyczne
> poza z-index i liczbą ticków" NIE potwierdziła się w kodzie: `.of-tag` ma
> w bazie własne `position/left/top`, `.of-progress` jest `fixed`
> z transition i regułą `.of.of-prog-on`, a `.ch-para` About↔Audience różni
> się CELOWO kolorem (komentarz w Audience.astro). Realna identyczność
> tag/progres/`.ch-*` to 2 wystąpienia (About↔Audience), poniżej progu ≥3
> — decyzją Mateusza (wariant A) wdrożono z tej sekcji wyłącznie `CloseIcon`
> (`src/components/ui/CloseIcon.astro`); resztę odłożono do czasu trzeciej
> identycznej sekcji (wzorzec `createPinnedScrub`, §3.4).

Markup + CSS bajt-identyczne (poza `z-index` i liczbą ticków) w trzech
sekcjach: tag `About.astro:103–106`+CSS`263–281` ↔
`Audience.astro:111–114`+`234–252` ↔ `Services.astro:99–102`+`291–310`;
progres `About.astro:152–155`+`291–317` ↔ `Audience.astro:161–164`+
`262–288` ↔ `Services.astro:231–235`+`553–585`. Analogicznie `.ch-*`
(About↔Audience) i ikona „X" w `Modal.astro:33–45` ↔
`BottomSheet.astro:32–44`.

To zmiana DOM-u (scoped style Astro nadaje inne hashe klas), więc choć
piksele powinny być identyczne, ryzyko subtelnych różnic specyficzności
jest wyższe niż przy helperach JS. Robić jako osobny krok z pełnym
`pnpm test:visual` i wycofać się, jeśli pojawi się jakikolwiek diff.

### 3.6 [ŚREDNI] DRY w testach (bez zmiany pokrycia i progów)

- **D1 (najwyższy zysk):** blok `beforeAll` z `assertPreview` identyczny
  w 12 plikach (`tests/e2e/{about,services,hero-functional,faq,navigation,contact}.spec.ts`,
  `tests/visual/{sections,hero,about,audience,faq,services}.spec.ts`) →
  helper w `tests/helpers/guards.ts`.
- **D2/D3/D4:** stała `FREEZE` (6×), blok „prepare" sweepa (5×), lista
  profili sweepa `["chromium-1920","webkit-iphone-14","chromium-pixel-5"]`
  (5×) → wspólny `tests/helpers/visual.ts`.
- **D5:** `tests/visual/about.spec.ts:39–83` ↔
  `tests/visual/audience.spec.ts:41–87` to near-duplikat — helper
  `snappedSectionSweep(page, {...})` zachowujący 1:1 te same zrzuty.
- **C2/R2:** `tests/e2e/contact.spec.ts:480` hardkoduje `width < 861`
  zamiast importu `CONTACT_DESKTOP_MIN_PX` z
  `src/components/sections/contact/contact-config.ts:6` (specy wizualne
  robią to poprawnie przez import stałych ABOUT/AUDIENCE).
- Drobne: D6 (`abs()`/kotwice w `services`↔`faq` visual), D7 (skip po
  nazwie projektu w `seo`/`policy`), R1 (nazwać stałą `400` po freeze).

### 3.7 [INFO] Listenery i wyciekanie pamięci — stan dobry

Projekt nie używa View Transitions/ClientRouter (grep: brak), skrypty
wykonują się raz na życie strony → listenery bez cleanup nie są realnymi
wyciekami. Miejsca z cyklem życia (overlay drag, bg-crossfade,
contact-ui, self-heal wideo) sprzątają po sobie poprawnie. Jedyna uwaga
defensywna: `WorkCarousel.astro:355–377` dodaje anonimowe globalne
listenery (`pointerup`/`pointercancel`/`resize`) — nazwać handlery, by
były zdejmowalne, gdyby kiedyś doszły View Transitions. Priorytet niski.

### 3.8 [INFO] Stała `*_DESKTOP_MIN_PX = 861` zduplikowana 5×

W pięciu configach sekcji + zaszyta w `@media` każdego `.astro`
(kontrakt utrzymywany komentarzem). Scalenie do jednej stałej TS jest
możliwe, ale `@media` w CSS i tak jej nie zaimportuje — zysk ograniczony.
Priorytet niski; ewentualnie przy okazji Etapu 4.

---

## 4. Analiza czytelności

1. **Nazewnictwo progresu:** ten sam koncept to `setStage`/`stageIdx`
   (about, audience) i `setStep`/`stepIdx` (services) — ujednolicić przy
   ekstrakcji `makeProgress()` (§3.4). Priorytet niski.
2. **Nazwy ghostów:** `.om-ghost`, `.of-ghost`, `.fq-ghost`, `.kt-ghost`,
   ale `.dk-ghostintro` (audience) odstaje od schematu. Kosmetyka —
   zmiana nazwy klasy dotyka CSS+JS; robić tylko przy okazji pracy w tym
   pliku.
3. **Cudzysłowy w `selectors.ts:38–39`:** `"[data-gsap='laptop']"` vs
   `'[data-gsap="camera"]'` — ujednolicić (trywialne).
4. **Magiczne `861` w teście:** patrz §3.6 C2.
5. **Pozytywy (nie ruszać):** spójne prefiksy sekcji (`om/dk/of/fq/kt`),
   konwencja `init<Section>Scroll`, wzorzec bramki dynamicznego importu
   w `<script>` sekcji, opisane magiczne liczby w testach (progi flaky,
   SETTLE_MS), gęste ale merytoryczne komentarze hero.

---

## 5. Analiza komentarzy

1. **[PEWNE] Nieaktualny komentarz-archeologia:**
   `audience-scroll.ts:84–86` — „nie ma już kanwy `.mk-fit` …
   (`fitMocks` usunięty…)". `mk-fit`/`fitMocks` nie istnieją nigdzie
   w `src/` — komentarz opisuje nieistniejący stan. Usunąć.
2. **[PEWNE] Mylący komentarz przy martwych tokenach:**
   `src/styles/global.css:49–51` twierdzi, że tokeny `--sec-*` konsumują
   komponenty `{Section}Background.astro` — takie komponenty **nie
   istnieją** (jest tylko `AmbientBackground.astro`). Usunąć razem
   z blokiem tokenów (§6.2).
3. **[BRAKUJĄCY] Wyjątek od reguły bez adnotacji:**
   `caption-carousel.ts:186` robi globalny `ScrollTrigger.refresh()` po
   `fonts.ready`, co jest sprzeczne z zasadą z `timeline-base.ts:76–80`
   (i reguł hero). Tu jest to zamierzone (desktop-only, jednorazowe,
   geometria karuzeli realnie się zmienia) — dopisać jedno zdanie,
   dlaczego wyjątek jest OK.
4. **[NISKI] Boilerplate powielony w nagłówkach:** identyczny akapit
   „Moduł ładowany DYNAMICZNIE tylko przy prefers-reduced-motion…"
   w 5 nagłówkach `*-scroll.ts` oraz analogiczna proza w nagłówkach
   configów; identyczny komentarz o no-JS/reduce w `Services.astro:912`,
   `Faq.astro:437`, `Contact.astro:1044`. Skrócić do jednego zdania
   z odesłaniem — opcjonalne, przy okazji Etapu 4.
5. **Werdykt ogólny:** poza powyższym komentarze są zgodne z kodem —
   w szczególności cała warstwa hero (platform, scene-vars, hero-config,
   DeviceScene) i LowPowerNotice zweryfikowane pozytywnie. Zero odwołań
   do usuniętych mechanizmów w `src/` i `tests/`.

---

## 6. Nieużywany kod

### 6.1 [PEWNE] `src/config/site.ts` — cały plik martwy

`export const siteConfig = {} as const;` — pusty placeholder, zero
importerów w całym repo (grep `config/site|siteConfig|@/config`).
Usunąć plik.

### 6.2 [PEWNE] `global.css:52–78` — blok tokenów `--sec-*`

10 tokenów (`--sec-services-1/2`, `--sec-work-1/2`, `--sec-about-1/2`,
`--sec-faq-1/2`, `--sec-contact-1/2`) + fallbacki `@supports` — zero
użyć `var(--sec-…)` w `src/` (jedyne trafienie to komentarz
w `toast.css:12`, który przy okazji zaktualizować). Pozostałość po
usuniętej architekturze teł sekcyjnych. Usunąć blok wraz z komentarzem
(§5.2).

### 6.3 [PEWNE] Hero: `screen__glass` + atrybuty `data-gsap` ekranów

- `DeviceScene.astro:31,59` — dwa `<div class="screen__glass">` i reguła
  CSS `:220–224`: element nic nie maluje (brak tła/cienia), pozostałość
  po dawnym refleksie szkła. Usunąć markup + regułę (grep potwierdza
  brak odwołań w JS).
- `DeviceScene.astro:18,46` — `data-gsap="screen-laptop"` /
  `"screen-phone"`: zero konsumentów w TS/`selectors.ts`; mylnie sugerują
  animację GSAP. Usunąć atrybuty (klasy `.screen--laptop/--phone`
  ZOSTAJĄ — używane w CSS i `SEL.laptopSiteRoot`).
- `services-config.ts:11` — `export interface ScrubRange` używany tylko
  wewnątrz pliku → zdjąć `export`.

### 6.4 [PRAWDOPODOBNE] `scripts/` — narzędzia jednorazowe

- `scripts/optimize-drewelomet-phone.mjs` — poza `package.json`, źródła
  PNG już nie istnieją (wszystko `.webp`), wynik (`public/drewelomet/phone/`)
  wygenerowany i w repo. Usunąć.
- `scripts/optimize-drewelomet.mjs` — idempotentny no-op (brak PNG);
  wpięty w `package.json` jako `optimize:drewelomet`. Decyzja: usunąć
  skrypt + wpis w `package.json` + wzmianka w CLAUDE.md/skillu
  `new-realizacja` (który odwołuje się do `scripts/optimize-*.mjs`) —
  albo zostawić jako wzorzec do przyszłych optymalizacji. Rekomendacja:
  usunąć oba, wzorzec żyje w historii gita.
- `scripts/lhci-median.mjs` — używany tylko ręcznie (w CI występuje
  wyłącznie w komentarzu `ci.yml:84–86`). ZOSTAWIĆ (narzędzie do
  ratchetowania budżetów), ewentualnie dopisać nagłówek „narzędzie
  manualne".
- Żywe (nie ruszać): `capture-device-videos.mjs`, `capture-harness.astro`,
  `capture-ambient-bg.mjs`, `verify-mobile-videos.mjs`,
  `capture-audience-screens.mjs`, `prepare-about-photo.mjs`.

### 6.5 Zweryfikowane jako ŻYWE (nie ciąć — lista anty-wpadkowa)

- Wszystkie 25 komponentów `.astro`; wszystkie eksporty `src/lib/`,
  `src/i18n/`, hero (w tym `TL_LENGTH`, `DOG_SITE_PROGRESS` itd. —
  konsumowane przez `tests/unit/hero-config.test.ts`).
- Wszystkie assety `public/` (w tym `icon-192/512.png` — referencje
  w `site.webmanifest`; `lpm-probe.mp4` — sonda LPM;
  `drewelomet/products/lamp1.webp` — tylko wariant laptopowy, celowo)
  i `src/assets/`.
- Wszystkie zależności `package.json` (m.in. `zod` — bezpośredni import
  w `content.schema.ts`; `sharp` — 5 skryptów; `@astrojs/check` +
  `typescript` — `astro check`).
- Wszystkie subsety fontów (`instrument-serif` italic używany w 9
  sekcjach; `saira-condensed`/`space-mono` — ekrany drewelomet).
- Flagi query: `?nosnap` (używana przez testy!), `?lpm=show|debug`
  (diagnostyka on-device). `?flat` już nie istnieje.
- `content.schema.ts` + `content.config.ts` — jedno źródło prawdy,
  bez duplikacji.
- Cały kod testów i helperów (`scrollPageToSmooth` jest prywatny, żywy).

### 6.6 Media w R2 — instrukcja weryfikacji dla Mateusza (poza repo)

Sveltia nie kasuje plików z R2 przy usuwaniu/podmianie wpisu, a wpisy
Realizacji są na razie testowe. Po zakończeniu refactoru (dowolny
moment, niezależne od etapów):

1. Zbierz listę używanych mediów: URL-e `https://media.hadrianm.pl/...`
   z `src/content/realizacje/*.json` (NIE edytować plików — tylko
   odczyt).
2. W dashboardzie Cloudflare (R2 → bucket mediów) porównaj zawartość
   z listą; pliki bez referencji = sieroty po testach → usuń ręcznie.
3. Jeśli usuniesz coś, co jednak było używane, wpis naprawisz wrzucając
   zdjęcie ponownie przez pole Image w panelu `/admin` (upload tylko tą
   drogą — pola Assets nie zapisują do R2).
4. Opcjonalny test po sprzątaniu: `CHECK_REMOTE_MEDIA=1 pnpm test:unit`
   (test mediów R2; tylko lokalnie, poza ścieżką PR).

---

## 7. Pliki ekosystemu Claude

1. **[WYSOKI] CLAUDE.md „Mapa projektu" nie wymienia 5 z 7 sekcji.**
   Opisane są tylko `hero/` i `work/`; brakuje `audience`, `services`,
   `about`, `faq`, `contact` (wszystkie żywe w `Home.astro:4–11`,
   z testami). Dopisać po 1–2 linie na sekcję z odesłaniem do
   właściwych `docs/analiza-sekcja-*.md`.
2. **[ŚREDNI] Brak reguł path-triggered dla gotchas sekcji.**
   `.claude/rules/` pokrywa hero, cms, lenis, capture, testing — a znane
   gotchas services/audience/faq/contact/about żyją tylko w docs
   i pamięci Claude. Dodać jedną zbiorczą regułę
   (np. `.claude/rules/sections.md` z frontmatter `paths:
   src/components/sections/{about,audience,services,faq,contact}/**`)
   z esencją gotchas: `:global` dla runtime-spanów `.of-w`,
   `of-prog-on` na sekcji nie na body, klasa `.js`/akordeon przy reduce
   (faq), JSON-LD FAQPage, animacja mobile L/R/L bez `filter` (audience),
   `data-lenis-prevent-horizontal` w karuzeli work.
3. **[ŚREDNI] Zły plik schemy wskazany w dwóch miejscach.**
   `CLAUDE.md:61` („schema Zod w `src/content.config.ts`")
   i `.claude/rules/cms-realizacje.md:20,22–24` — faktyczne źródło prawdy
   to `src/content.schema.ts` (config tylko importuje). Skorygować oba.
4. **[NISKI] CLAUDE.md „Komendy":** dopisać `optimize:drewelomet` (o ile
   zostaje — patrz §6.4) i `capture:ambient-bg`.
5. **[BEZ AKCJI — zweryfikowane pozytywnie:** skille (komendy/ścieżki
   zgodne z package.json), `docs/README.md` (komplet 31 plików
   w indeksie, statusy wiarygodne), glob blokady baseline'ów
   w settings.json, workflowy CI i nazwy jobów, hooki — wszystkie
   istnieją.]
6. **Po wdrożeniu:** dodać ten dokument do `docs/README.md` (sekcja
   aktualnych analiz), a po zakończeniu wszystkich etapów przenieść do
   historycznych. Zaktualizować pamięć Claude o guard pinch (nowa zasada
   w scroll-lenis).

---

## 8. Priorytetyzacja zmian — plan etapów (PR-ów)

Każdy etap = osobna gałąź `general-refactor-partN` → PR → zielone
`quality`/`e2e`/`lighthouse` → merge. Etapy są niezależne (można
zmieniać kolejność), ale sugerowana kolejność odzwierciedla priorytet.
**Etapy 1–6 są w całości baseline-neutralne: test wizualny ma wyjść 0 diff.**

### Etap 1 — guard pinch-zoom w Lenis [WYSOKI, złożoność niska]

- `src/scripts/smooth-scroll.ts`: guard `multiTouch`/`isZoomed` + opcja
  `prevent` (szkic w §2.1; NIE używać `lenis.stop()`).
- `.claude/rules/scroll-lenis.md`: dopisać zasadę o guardzie.
- Weryfikacja: `pnpm test:e2e` + `pnpm build && pnpm test:visual`
  (0 diff) + **fizyczny telefon wg checklisty §2.1** (iPhone i Android).
- Proponowany commit: `fix(scroll): ignore pinch/zoom gestures in Lenis
  touch handling`.

### Etap 2 — hot path hero + ambient [WYSOKI, złożoność niska]

- `mobile-phases.ts:227–248`: batch read→write + dedupe w `placeDividers`
  (§2.2).
- `android-mobile.ts:151–153`: strażnik ostatniej wartości `--p` (§2.3).
- `AmbientBackground.astro`: `will-change: auto` dla potomków warstw
  `is-inactive` (§2.4).
- Martwy kod hero przy okazji: `screen__glass` (markup+CSS), atrybuty
  `data-gsap="screen-*"` (§6.3); komentarz-wyjątek w
  `caption-carousel.ts:186` (§5.3); cudzysłowy `selectors.ts:38–39`.
- Weryfikacja: `pnpm test:unit` + `pnpm build && pnpm test:visual`
  (0 diff) + `/verify-mobile` + `pnpm test:e2e`; na fizycznym Androidzie
  płynność pierwszej fazy hero.
- Commit: `perf(hero): batch divider layout reads, dedupe progress var;
  drop dead screen-glass layer`.

### Etap 3 — martwy kod poza hero [ŚREDNI, złożoność trywialna]

- Usunąć `src/config/site.ts` (§6.1), blok `--sec-*` z `global.css`
  + komentarz w `toast.css:12` (§6.2), komentarz `mk-fit`
  w `audience-scroll.ts:84–86` (§5.1), `export` z `ScrubRange` (§6.3).
- `scripts/`: usunąć `optimize-drewelomet-phone.mjs`
  i `optimize-drewelomet.mjs` + wpis `optimize:drewelomet`
  w `package.json` + wzmianki (CLAUDE.md, skill `new-realizacja`) —
  o ile Mateusz potwierdzi rekomendację §6.4.
- Weryfikacja: pełne `quality` lokalnie (`pnpm format:check && pnpm lint
  && pnpm typecheck && pnpm test:unit && pnpm build`) +
  `pnpm test:visual` (0 diff).
- Commit: `chore: remove dead siteConfig, sec-* tokens and one-shot
  image scripts`.

### Etap 4 — helpery sekcji (DRY runtime) [ŚREDNI, złożoność średnia]

- 4a (bezpieczne, czysty JS): `revealOnce()` (§3.2), `scrollToAnchor()`
  (§3.3), `motionMedia()`, `ghostParallax()`, `makeProgress()`
  + ujednolicenie `setStage`/`setStep`, `q`/`qa` (§3.4). Przy okazji
  skrócić powielone nagłówki-boilerplate (§5.4).
- 4b (OSTROŻNIE, zmienia DOM): komponenty `SectionTag`/`SectionProgress`,
  wspólne `.ch-*`, `CloseIcon` dla Modal/BottomSheet (§3.5) — osobny
  commit, wycofać przy jakimkolwiek diffie wizualnym.
- Weryfikacja: `pnpm build && pnpm test:visual` (0 diff, wszystkie
  6 profili) + `pnpm test:e2e`.
- Commity: `refactor(sections): extract shared scroll helpers` /
  `refactor(sections): shared SectionTag/SectionProgress components`.

### Etap 5 — DRY w testach [ŚREDNI, złożoność niska]

- D1 (blok `assertPreview` ×12), D2–D4 (FREEZE, prepare, profile sweepa),
  D5 (`snappedSectionSweep` dla about/audience), C2 (import
  `CONTACT_DESKTOP_MIN_PX` zamiast `861`), R1 (nazwana stała 400);
  opcjonalnie D6/D7 (§3.6).
- Zero zmian progów, allowlisty a11y, zestawu projektów i nazw zrzutów
  (nazwy snapshotów NIE mogą się zmienić — inaczej Playwright uzna
  baseline'y za nowe).
- Weryfikacja: pełne `pnpm test` (unit+e2e+visual — 0 diff).
- Commit: `refactor(test): extract shared preview guard and visual sweep
  helpers`.

### Etap 6 — ekosystem Claude i dokumentacja [ŚREDNI, złożoność niska]

- CLAUDE.md: mapa projektu +5 sekcji, korekta ścieżki schemy, komendy
  (§7.1, §7.3, §7.4).
- `.claude/rules/cms-realizacje.md`: `content.config.ts` →
  `content.schema.ts` (§7.3).
- Nowa reguła `.claude/rules/sections.md` z gotchas sekcji (§7.2).
- `docs/README.md`: wpis dla tego dokumentu.
- Weryfikacja: brak wpływu na kod; `pnpm format:check` (markdown poza
  docs/ nie jest ignorowany dla .claude — sprawdzić prettierignore).
- Commit: `docs(claude): sync project map, section rules and schema
  paths with codebase`.

### Etap 7 — kandydaci wymagający OSOBNEJ DECYZJI (nie wdrażać domyślnie)

| Kandydat | Zysk | Ryzyko | Wymagana weryfikacja |
|---|---|---|---|
| Romb postępu `top`→`transform` (§2.7.1) | layout/frame na mobile | subpikselowy pixel-diff | `/verify-mobile` + ocena diffu przez Mateusza |
| `preload="metadata"` wideo hero mobile (§2.7.2) | −1,5 MB eager + 2 dekodery później | pusta klatka na starcie | fizyczny iPhone SE + Android, zimny cache |
| Pauza fali akcentu także dla `--ghost` (§2.7.3) | idle GPU na mobile | zmiana zachowania animacji | diff wizualny + decyzja |
| Per-IP rate-limit w `functions/api/kontakt.ts` (§2.6) | odporność na abuse | złożoność KV | testy kontraktowe formularza |

### Poza etapami (zadanie ręczne Mateusza)

- Sprzątanie sierot w R2 wg instrukcji §6.6.
- Testy na fizycznych urządzeniach po Etapach 1 i 2 (checklisty przy
  etapach).

---

## 9. Szacowany wpływ

| Obszar | Zmiana | Oczekiwany efekt |
|---|---|---|
| UX mobile | Etap 1 (guard pinch) | eliminacja zgłoszonego buga „wystrzału" scrolla po zoomie — największy pojedynczy zysk jakościowy |
| Płynność scrolla (Android/starsze iPhone'y) | Etap 2 | mniej wymuszonych reflow i pracy stylów per-frame w hero; mniej warstw GPU na desktopie (ambient); efekt odczuwalny głównie na najsłabszych urządzeniach — dokładnie tam, gdzie boli |
| Waga strony | brak zmian | sieć nie jest wąskim gardłem; budżety LHCI bez zmian (Etap 3 minimalnie odchudza CSS) |
| Utrzymanie | Etapy 3–5 | ~kilkaset linii mniej duplikacji; nowa sekcja/test zaczyna od helperów zamiast kopiowania; mniejsze ryzyko rozjazdu (np. breakpoint 861 w teście) |
| Bezpieczeństwo pracy z AI | Etap 6 | reguły ładują właściwą wiedzę przy pracy w sekcjach; mapa projektu kompletna; mniejsze ryzyko, że przyszła sesja „odkryje" gotchas metodą regresji |
| Ryzyko całości | — | niskie: etapy 1–6 baseline-neutralne (kontrola: 0 diff w `test:visual`), każdy etap osobno mergowalny i odwracalny |

Kolejność ma znaczenie o tyle, że Etapy 1–2 adresują realny ból
użytkownika — rekomendowane wdrożenie w pierwszej kolejności; Etapy 3–6
można wykonywać w dowolnej kolejności i łączyć po dwa, jeśli PR-y okażą
się bardzo małe.
