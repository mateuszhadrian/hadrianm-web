# Poprawki wizualne — część 1 (strona główna, polityka prywatności, przejścia między stronami)

> **Status: ZAAKCEPTOWANY (2026-07-18) — rozumienie poprawek potwierdzone
> przez Mateusza, każdy punkt zawiera samowystarczalną instrukcję wdrożeniową
> (prompt do osobnej sesji Claude Code).** Punkt 7: decyzja „tylko navbar +
> footer" (bez ambientu).
>
> Zakres: punkty 1–6 dotyczą WYŁĄCZNIE strony głównej (sekcje-teasery, nie
> odpowiadające im podstrony), punkt 7 — podstrony polityki prywatności
> (PL + EN), punkt 8 — przejść między wszystkimi route'ami.

## Ustalenia globalne (z sesji pytań 2026-07-17/18)

- **Jedna gałąź, osobne commity** — ten dokument commitowany jako pierwszy.
- **Kolejność wdrażania**: najpierw poprawki punktowe (1–5, 7), potem
  **6 (odstępy — przesuwa wszystkie sekcje w pionie)**, na końcu **8**
  (przejścia — niezależne od geometrii). Punkty 4 i 5 mają pętlę strojenia
  z Mateuszem (telefon) przed uznaniem za skończone.
- **Baseline'y wizualne: regeneracja RAZ, na końcu brancha** (darwin +
  workflow linux), po pokazaniu diffów i zgodzie Mateusza. Pośrednie commity
  będą czerwone na `test:visual` — to oczekiwane na tym branchu.
- Wszystkie zmiany tekstów robimy równolegle w PL i EN (`src/i18n/ui.ts`).

---

## 1. Sekcja „Dla kogo": button „Zobacz więcej" w stylu „Więcej o mnie"

**Jak to rozumiem.** Teaser Audience na stronie głównej używa dziś komponentu
`MoreLink.astro` (pomarańczowy fill `--accent`, auto-szerokość na desktop
i mobile). Teaser About używa `SolidButton.astro` (kremowy fill `--ink`,
strzałka w akcencie; na mobile **pełna szerokość**, na desktop ≥861px
auto-szerokość). Podmieniamy użycie w `Audience.astro` na **`SolidButton`
1:1** — łącznie z pełną szerokością na mobile (decyzja z pytań). Etykieta
bez zmian (`audience.more`: „Zobacz więcej" / „See more"). Komponent
`MoreLink.astro` po podmianie nie ma już żadnych użyć — **usuwamy go z repo**.

**Propozycja commita:** `refactor(audience): unify teaser CTA with SolidButton, drop MoreLink`

**Instrukcja wdrożeniowa (prompt do osobnej sesji):**

```text
Wdróż poprawkę 1 z docs/visual-corrections-part1.md. Pracuj na bieżącym
feature branchu; niczego nie commituj (commituje Mateusz).

CEL: teaser sekcji „Dla kogo" na stronie głównej ma używać komponentu
SolidButton (identycznego jak „Więcej o mnie" w teaserze O mnie) zamiast
MoreLink — 1:1, łącznie z pełną szerokością na mobile. Etykieta bez zmian
(klucz i18n audience.more: „Zobacz więcej" / „See more").

KROKI:
1. W src/components/sections/audience/Audience.astro (blok teasera, użycie
   <MoreLink href={AUDIENCE_PATH[lang]} label={t("audience.more")} /> we
   wrapperze .dk-morewrap, ok. linii 180–189) zamień import i użycie
   MoreLink na SolidButton (src/components/ui/SolidButton.astro) — te same
   propsy href/label.
2. Zweryfikuj wygląd wrappera .dk-morewrap (dziś margin-top: 6px) po
   podmianie: SolidButton na mobile ma width:100% (button rozciąga się na
   szerokość kolumny w paddingu bocznym teasera — tak jak w O mnie), na
   desktopie ≥861px width:auto. Skoryguj wyłącznie drobny odstęp wrappera,
   jeśli wizualnie trzeba; nie zmieniaj nic innego w układzie.
3. Grep repo na "MoreLink" — po podmianie nie powinno być żadnych użyć;
   usuń plik src/components/ui/MoreLink.astro.

KONTRAKTY (nie naruszać):
- Geometria teasera mobile (.dk-stage min-height: 100vh, treść u góry) to
  strojony handoff wejścia tagu „02/OFERTA" — nie zmieniaj wysokości ani
  paddingów sceny.
- Pełny wariant Audience (podstrona /dla-kogo/) — nietknięty.

WERYFIKACJA: pnpm typecheck; pnpm test:e2e; pnpm build && pnpm test:visual —
baseline #audience (i ewent. subpikselowe przesunięcia sekcji niżej) BĘDZIE
czerwony: OCZEKIWANE na tym branchu, NIE regeneruj baseline'ów (regeneracja
raz, na końcu brancha, za zgodą Mateusza — ustalenie globalne dokumentu).
Obejrzyj sekcję na preview (port 4399) w emulacji desktop + mobile.

PROPOZYCJA COMMITA: refactor(audience): unify teaser CTA with SolidButton, drop MoreLink
```

## 2. Sekcja „Oferta": „Przeglądaj pakiety" w stylu banera „Skontaktuj się ze mną"

**Jak to rozumiem.** „Skontaktuj się ze mną" (`KontaktBaner.astro`,
`.kt-cta__btn`) to kremowy button (wzorzec SolidButton zduplikowany inline),
który na desktopie ma zapętlony pakiet animacji 3,6 s: przesuwający się błysk
(sheen), delikatny puls skali i rozchodzący się pomarańczowy ring; na mobile
jest statyczny, pełnej szerokości. „Przeglądaj pakiety" (`OfertaButtons.astro`,
`.pp-btn--solid`) jest dziś pomarańczowy i statyczny.

Decyzje z pytań:

- Przenosimy **PEŁNY pakiet**: kremowy fill + sheen + puls + ring na desktop;
  na mobile statyczny kremowy button (jak baner Kontakt na mobile).
- **Długość/szerokość bez zmian**: para buttonów zostaje w obecnym układzie
  (oba `flex: 1`, container query 640px), zmienia się tylko skórka primary.
- Drugi button „Proces współpracy" (`.pp-btn--split`) — **bez zmian**.
- Implementacja przez **wspólny wzorzec** (komponent/moduł CSS użyty przez
  baner Kontakt i OfertaButtons — jedno źródło prawdy zamiast trzeciej kopii).
  Uwaga wykonawcza: baner ma scrubowany zoom wejścia (literał CSS `scale(1.4)`
  = `KTB_ZOOM_FROM` w `contact-config.ts`) — refaktor nie może zerwać tego
  kontraktu; entrance `.of-ctas.on` w Ofercie zostaje bez zmian.

**Propozycja commita:** `feat(services): contact-style animated packages CTA via shared button pattern`

**Instrukcja wdrożeniowa (prompt do osobnej sesji):**

```text
Wdróż poprawkę 2 z docs/visual-corrections-part1.md. Pracuj na bieżącym
feature branchu; niczego nie commituj (commituje Mateusz).

CEL: primary CTA „Przeglądaj pakiety" w teaserze Oferty na stronie głównej
ma wyglądać jak „Skontaktuj się ze mną" z banera Kontakt: kremowy fill
(wzorzec SolidButton), na desktopie ZAPĘTLONY pakiet animacji (przesuwający
się błysk/sheen, delikatny puls skali, rozchodzący się pomarańczowy ring —
cykl 3,6 s), na mobile statyczny kremowy. Szerokości/układ pary buttonów bez
zmian; drugi button „Proces współpracy" bez zmian. Implementacja przez
WSPÓLNY wzorzec — bez trzeciej kopii stylów.

STAN OBECNY:
- Baner: src/components/sections/contact/KontaktBaner.astro — markup
  .kt-cta__btn (span.kt-cta__clip > span.kt-cta__sheen + label + arrow,
  ok. linii 49–55), style bazowe/mobile ok. 222–272 (width:100%, fill
  #f5f0ec, ink #180a08), desktop ≥861px ok. 306–346 (width:auto, sheen
  widoczny), animacje w @media (min-width: 861px) and
  (prefers-reduced-motion: no-preference) ok. 350–428 (keyframes kt-sweep,
  kt-btnPulse, kt-ctaRing; easing --kt-cz: cubic-bezier(0.22,1,0.36,1)).
- Oferta: src/components/ui/OfertaButtons.astro — primary .pp-btn--solid
  (pomarańczowy, statyczny); para w .pp-cta: oba buttony flex:1, container
  query (max-width: 640px) → kolumna, pełna szerokość.

KROKI:
1. Wydziel wspólny wzorzec — rekomendacja: komponent
   src/components/ui/AnimatedCta.astro (props: href, label, opcjonalnie
   className) z markupem clip/sheen + label + arrow + ring (::after)
   i stylami przeniesionymi z KontaktBaner. Użyj go w OBU miejscach:
   KontaktBaner (zamiast inline .kt-cta__btn) i OfertaButtons (zamiast
   .pp-btn--solid).
2. KONTRAKT ZOOMU BANERA: scrubowane wejście to reguła
   `.ktb.js .kt-cta { transform: scale(1.4) }` na WRAPPERZE .kt-cta (nie na
   buttonie); literał 1.4 musi pozostać równy KTB_ZOOM_FROM z
   contact-config.ts. Zostaw tę regułę w KontaktBaner — nie przenoś jej do
   komponentu.
3. Szerokości w Ofercie: selektor `.pp-cta > .pp-btn { flex: 1 }` przestanie
   łapać roota nowego komponentu — dostosuj (np. `.pp-cta > * { flex: 1 }`
   lub klasa przekazana do komponentu; pamiętaj, że scoped CSS Astro nie
   łapie wnętrza komponentu potomnego — użyj :global() albo stylów w samym
   komponencie). Container query 640px i button „Proces współpracy"
   (.pp-btn--split) bez zmian.
4. Animacje wyłącznie desktop ≥861px + prefers-reduced-motion:
   no-preference (identyczna bramka jak w banerze). Entrance `.of-ctas.on`
   w Services.astro — bez zmian.
5. Po stronie banera Kontakt to czysty refactor: wygląd i zachowanie NIE
   mogą się zmienić.

WERYFIKACJA: pnpm typecheck; pnpm test:e2e; pnpm build && pnpm test:visual —
#services BĘDZIE czerwony (oczekiwane, NIE regeneruj baseline'ów),
#contact MUSI zostać zielony (uwaga: znany jitter pixel-5 dla #contact,
próg 0.02 — przy failu porównaj z przebiegiem kontrolnym zanim uznasz
regresję). Preview (4399): obejrzyj pętlę animacji na obu buttonach
(desktop) i statyczny kremowy button na mobile.

PROPOZYCJA COMMITA: feat(services): contact-style animated packages CTA via shared button pattern
```

## 3. Sekcja „Realizacje": zmiana nagłówka i usunięcie intro

**Jak to rozumiem.** Na stronie głównej (tylko tam — podstrona /realizacje/
ma własne klucze `workPage.*` i pozostaje nietknięta):

- Nagłówek PL: „zobacz przykładowe realizacje" → **„zobacz moje realizacje"**
  (`work.headlineLead`: „zobacz przykładowe" → „zobacz moje"; akcent
  `work.headlineAccent` „realizacje" bez zmian).
- Nagłówek EN: „see sample work" → **„explore my work"** (decyzja z pytań;
  lead „explore my", akcent „work").
- Akapit intro (`work.intro`, PL „Wybrane projekty z ostatnich miesięcy.
  Każdy w wersji desktop i mobilnej — kliknij, by zobaczyć szczegóły." + EN)
  — **usuwamy całkowicie**: element `<p class="work__intro">` z `Work.astro`,
  klucze z `ui.ts` (PL i EN) oraz osierocone style `.work__intro`.
- Eyebrow „ZREALIZOWANE ZLECENIA" zostaje (asercja w `tests/e2e/i18n.spec.ts`
  na `work.eyebrow` — nie ruszamy).

**Propozycja commita:** `feat(work): retitle home section heading and drop intro paragraph`

**Instrukcja wdrożeniowa (prompt do osobnej sesji):**

```text
Wdróż poprawkę 3 z docs/visual-corrections-part1.md. Pracuj na bieżącym
feature branchu; niczego nie commituj (commituje Mateusz).

CEL: w sekcji Realizacje na STRONIE GŁÓWNEJ (tylko tam): nagłówek PL
„zobacz przykładowe realizacje" → „zobacz moje realizacje", EN „see sample
work" → „explore my work"; akapit intro pod nagłówkiem usunąć całkowicie
(PL i EN).

KROKI:
1. src/i18n/ui.ts:
   - PL: "work.headlineLead": "zobacz przykładowe" → "zobacz moje"
     (ok. linii 26); "work.headlineAccent": "realizacje" bez zmian.
   - EN: "work.headlineLead": "see sample" → "explore my" (ok. linii 316);
     "work.headlineAccent": "work" bez zmian.
   - Usuń klucz "work.intro" z OBU języków (PL ok. 28–29: „Wybrane projekty
     z ostatnich miesięcy…", EN ok. 318–319) — parytet kluczy PL/EN musi
     zostać zachowany (pilnuje tego test unit i18n).
2. src/components/sections/work/Work.astro: usuń element
   <p class="work__intro">{t("work.intro")}</p> (ok. linii 43) oraz
   osierocone style .work__intro (desktop ok. 173–181 i mobile override
   ok. 240–244).

KONTRAKTY (nie naruszać):
- Eyebrow „ZREALIZOWANE ZLECENIA" (work.eyebrow) ZOSTAJE — asercja
  language-leak w tests/e2e/i18n.spec.ts:63,67.
- Podstrona /realizacje/ ma własne klucze workPage.* i własny nagłówek
  (WorkIndexPage.astro) — nietknięta.

WERYFIKACJA: pnpm typecheck (wyłapie osierocone użycia klucza);
pnpm test:unit (parytet i18n); pnpm test:e2e; pnpm build &&
pnpm test:visual — #work i sekcje poniżej BĘDĄ czerwone (usunięcie akapitu
skraca sekcję): OCZEKIWANE, NIE regeneruj baseline'ów.

PROPOZYCJA COMMITA: feat(work): retitle home section heading and drop intro paragraph
```

## 4. Sekcja „Realizacje": parametr skali kafelków mobile

**Jak to rozumiem.** Kafelki karuzeli mobile mają szerokość pochodną:
`100% − (--wk-pad + --wk-gap + --wk-peek)` przy capie `.wk-car { max-width:
460px }`, a wielkość mockupu urządzeń wewnątrz kafelka steruje osobna zmienna
`--lap-w` (`WorkCarouselCard.astro`). Decyzja z pytań: **jeden mnożnik** —
dodaję zmienną `--wk-scale: 1` w jednym, skomentowanym miejscu
`WorkCarousel.astro`, która spójnie skaluje szerokość kafelka (peek + cap)
i mockup urządzeń (`--lap-w`). Mateusz stroi jedną liczbą (np. `1.15` =
+15%), ogląda na telefonie i daje znać, kiedy wartość jest ustawiona —
dopiero wtedy punkt jest zamknięty. Nie ruszamy kontraktów karuzeli:
`data-lenis-prevent-horizontal` na tracku i `scroll-snap-stop: always`.

**Propozycja commita:** `feat(work): tunable mobile carousel tile scale (--wk-scale)`
(+ ewentualny follow-up po strojeniu: `style(work): set mobile tile scale to <wartość>`)

**Instrukcja wdrożeniowa (prompt do osobnej sesji):**

```text
Wdróż poprawkę 4 z docs/visual-corrections-part1.md. Pracuj na bieżącym
feature branchu; niczego nie commituj (commituje Mateusz).

CEL: jeden parametr --wk-scale do strojenia wielkości kafelków karuzeli
Realizacje na mobile. Mateusz będzie kręcił wartością (np. 1.15 = +15%)
i oglądał na telefonie; domyślnie 1 = ZERO zmiany wyglądu.

STAN OBECNY:
- src/components/sections/work/WorkCarousel.astro — .wk-car ma zmienne
  --wk-peek: 50px, --wk-gap: 16px, --wk-pad: 22px i cap max-width: 460px
  (ok. linii 112–118); szerokość kafelka to pochodna:
  .wk-car__track > * { flex: 0 0 calc(100% - var(--wk-pad) - var(--wk-gap)
  - var(--wk-peek)) } (ok. 148–154).
- Wielkość mockupu urządzeń w kafelku:
  src/components/sections/work/WorkCarouselCard.astro ok. 91–95:
  .wk-car-card__media :global(.wd) { --lap-w: clamp(180px, 62vw, 246px) }
  (--lap-w to JEDYNY driver całego mockupu laptop+telefon).

KROKI:
1. W WorkCarousel.astro dodaj na .wk-car zmienną `--wk-scale: 1;` z polskim
   komentarzem: „PARAMETR STROJENIA: skala kafelków karuzeli mobile;
   1 = obecny wygląd, 1.15 = +15% itd. Konsumenci: flex-basis kafelka,
   max-width kontenera (tu) oraz --lap-w mockupu (WorkCarouselCard)."
2. Podepnij parametr:
   - flex-basis kafelka: flex: 0 0 calc((100% - var(--wk-pad) -
     var(--wk-gap) - var(--wk-peek)) * var(--wk-scale)); — powiększenie
     kafelka naturalnie zmniejsza widoczny peek następnej karty.
   - cap kontenera: max-width: calc(460px * var(--wk-scale));
   - mockup w WorkCarouselCard.astro: --lap-w: clamp(calc(180px *
     var(--wk-scale, 1)), calc(62vw * var(--wk-scale, 1)), calc(246px *
     var(--wk-scale, 1))); (zmienna dziedziczy z .wk-car).
3. Sanity check przy --wk-scale: 1 — wyrenderowane wartości identyczne jak
   przed zmianą.

KONTRAKTY (nie naruszać): data-lenis-prevent-horizontal na tracku
(NIE -prevent — zabija pionowy scroll na Androidzie), scroll-snap-stop:
always, centrowanie slajdów; karuzela jest home-only (podstrona
/realizacje/ używa siatki WorkIndexCard — nietknięta).

WERYFIKACJA: pnpm build && pnpm test:visual — przy --wk-scale: 1 baseline'y
#work na profilach mobilnych MUSZĄ być zielone (to dowód, że parametr przy
1 niczego nie zmienia; jeśli wcześniejsze poprawki tego brancha już
zmieniły #work, porównaj z przebiegiem kontrolnym sprzed tej zmiany);
pnpm test:e2e (karuzela/BottomSheet). Potem przekaż Mateuszowi: gdzie
kręcić (WorkCarousel.astro, --wk-scale), jak oglądać (pnpm dev + telefon)
— punkt jest zamknięty dopiero, gdy Mateusz potwierdzi ustawioną wartość.

PROPOZYCJA COMMITA: feat(work): tunable mobile carousel tile scale (--wk-scale)
(po strojeniu follow-up: style(work): set mobile tile scale to <wartość>)
```

## 5. Sekcja „Oferta": wcześniejszy start rozjaśniania zdań 2 i 3

**Jak to rozumiem.** Rozjaśnianie intro Oferty to dziś JEDEN tween GSAP na
wszystkich spanach `.of-w` trzech akapitów, z jednym ScrollTriggerem na całym
`.of-intro` (`services-scroll.ts` + `services-config.ts`). Akapit 2
(`services.lead2` — „Większość Twoich klientów…") i akapit 3
(`services.close` — „Wybierz pakiet…") rozjaśniają się późno wyłącznie
dlatego, że ich spany są ostatnie w kolejności staggera — użytkownik musi
doscrollować tekst pod samą górę ekranu, żeby go odczytać.

Naprawa: **rozbicie na osobny tween + trigger per akapit** z własnym startem
(desktop i mobile osobno, stałe w `services-config.ts`), przy zachowaniu
dotychczasowego TEMPA rozjaśniania względem scrolla (stała gęstość staggera
i proporcja długości tweenu do dystansu scrolla). Decyzja z pytań: proponuję
konkretne wartości startów (wyraźnie wcześniej niż dziś), Mateusz weryfikuje
na telefonie, ewentualnie doprecyzowujemy. Wersje PL/EN łapią się
automatycznie (wspólny mechanizm splitowania). Pamiętać o `:global()` dla
runtime'owych spanów `.of-w` i o `ScrollTrigger.refresh()` po init.

**Propozycja commita:** `fix(services): per-paragraph reveal triggers, earlier start for lead2/close`

**Instrukcja wdrożeniowa (prompt do osobnej sesji):**

```text
Wdróż poprawkę 5 z docs/visual-corrections-part1.md. Pracuj na bieżącym
feature branchu; niczego nie commituj (commituje Mateusz).

CEL: w sekcji Oferta na stronie głównej akapit 2 (services.lead2 —
„Większość Twoich klientów…") i akapit 3 (services.close — „Wybierz
pakiet…") mają zaczynać rozjaśnianie WYRAŹNIE wcześniej w scrollu, przy
NIEZMIENIONYM tempie rozjaśniania względem scrolla. Desktop i mobile;
PL i EN łapią się automatycznie (wspólny mechanizm splitowania).

STAN OBECNY:
- src/components/sections/services/services-scroll.ts — splitLit (ok.
  47–77) dzieli 3 akapity .of-lit na spany .of-w (słowa na desktopie,
  zdania na mobile); readTween (ok. 95–112) robi JEDEN gsap.to na
  WSZYSTKICH spanach wszystkich akapitów z JEDNYM ScrollTriggerem na całym
  .of-intro i staggerem `each: cfg.span / N`. Akapity 2 i 3 rozjaśniają
  się późno wyłącznie dlatego, że ich spany są ostatnie w kolejności.
- src/components/sections/services/services-config.ts — SERVICES_READ
  (desktop: start "top 58%", end "bottom 44%", scrub 0.45, duration 1.6,
  span 8) i SERVICES_READ_MOBILE (start "top 70%", end "bottom 52%",
  scrub 0.4, duration 1.4, span 6).
- Stan bazowy przyciemnienia w CSS: Services.astro ok. 995–1001
  (.of.js .of-lit :global(.of-w) { opacity: 0.14 } / .acc 0.24).

KROKI:
1. Rozbij readTween na osobny tween per akapit .of-lit, każdy z własnym
   scrollTrigger: { trigger: <ten akapit>, start, end } i staggerem tylko
   po spanach tego akapitu.
2. ZACHOWAJ TEMPO: tempo = długość wirtualnej osi tweenu (span_i +
   duration) podzielona przez dystans scrolla start→end. Utrzymaj stałą
   gęstość staggera (sekundy-na-span jak dziś: span/N_total) — span_i
   akapitu proporcjonalny do liczby jego spanów — oraz dystans scrolla
   proporcjonalny do długości tweenu danego akapitu. Wtedy zmiana startu
   nie zmienia szybkości rozjaśniania.
3. Nowe stałe per akapit umieść w services-config.ts (czytelna struktura,
   np. tablica trzech configów desktop + trzech mobile, z komentarzem jak
   stroić). PROPOZYCJA STARTÓW (do weryfikacji przez Mateusza na
   telefonie): akapit 1 — timing wizualnie jak dziś; akapit 2 i 3 —
   wyraźnie wcześniej, np. desktop start "top 72%", mobile "top 84%"
   (zdanie ma być czytelne, zanim znajdzie się przy górze ekranu).
4. Zachowaj: bramkę motionMedia (prefers-reduced-motion), wywołanie
   ScrollTrigger.refresh() po init, reguły :global() dla runtime'owych
   spanów .of-w w scoped CSS.

UWAGA: services-config.ts jest też konsumowany przez sweep
tests/visual/services.spec.ts — jeśli zmieniasz kształt eksportów,
zaktualizuj spec spójnie (bez zmiany zakresu sweepa).

WERYFIKACJA: pnpm typecheck; pnpm test:unit; pnpm build &&
pnpm test:visual — sweep services BĘDZIE czerwony na klatkach z nowym
timingiem (oczekiwane, NIE regeneruj baseline'ów); pnpm test:e2e.
Preview (4399): przescrolluj sekcję desktop + emulacja mobile, PL i EN —
oba zdania mają być czytelne dużo wcześniej. Na końcu poproś Mateusza
o weryfikację na telefonie; punkt zamknięty po jego potwierdzeniu.

PROPOZYCJA COMMITA: fix(services): per-paragraph reveal triggers, earlier start for lead2/close
```

## 6. Odstępy między sekcjami strony głównej

**Jak to rozumiem.** Sekcje w `Home.astro` stykają się bezpośrednio (zero
marginesów między nimi) — postrzegane „pustki" to sumy sąsiadujących
paddingów wewnętrznych sekcji płynących (np. na desktop: Oferta dół 170px +
nagłówek Realizacji ~90px; FAQ góra aż 216px). Reguła docelowa: pierwszy
element sekcji możliwie blisko ostatniego elementu sekcji poprzedniej,
z minimalnym estetycznym odstępem; sekcje o wysokości ekranu (ramki 100vh)
z definicji spełniają regułę.

Decyzje z pytań:

- **Zakres: tylko paddingi sekcji płynących** (Oferta, Realizacje, FAQ,
  granice z teaserami). Ramki 100vh zostają nietknięte: teaser „Dla kogo"
  na mobile (strojona geometria wejścia tagu „02/OFERTA") i baner Kontakt
  (centrowanie w pełnym ekranie) — zgodnie z regułą i bez ryzyka rozstrojenia
  handoffu oraz punktów crossfade'u tła (`bg-crossfade.ts` liczy fady z
  pozycji sekcji).
- **Wspólny token odstępu** w `global.css` (rząd wielkości: clamp ~64–100px
  desktop, ~48–64px mobile — do finalnej kalibracji przy wdrożeniu) i
  wyrównanie do niego sąsiadujących paddingów, tak by SUMA na każdej granicy
  była równa tokenowi. Jedno miejsce do przyszłych korekt.
- Nie ruszamy wysokości hero (JS-derived z `hero-config.ts`).
- Skutek uboczny: pion całej strony się przesuwa → churn WSZYSTKICH
  baseline'ów sekcji jest tu oczekiwany (regeneracja raz, na końcu brancha).

**Propozycja commita:** `style(home): tighten inter-section spacing via shared gap token`

**Instrukcja wdrożeniowa (prompt do osobnej sesji):**

```text
Wdróż poprawkę 6 z docs/visual-corrections-part1.md — UWAGA: dopiero PO
wdrożeniu poprawek 1–5 i 7 tego dokumentu (ta zmiana przesuwa pion całej
strony). Pracuj na bieżącym feature branchu; niczego nie commituj.

CEL: zlikwidować nadmierne pustki między sekcjami strony głównej. Reguła:
pierwszy element sekcji możliwie blisko ostatniego elementu poprzedniej,
z minimalnym estetycznym odstępem zdefiniowanym JEDNYM wspólnym tokenem.
Zakres: TYLKO paddingi sekcji płynących. Ramki 100vh (teaser Dla kogo,
teaser O mnie desktop, baner Kontakt) — NIETKNIĘTE.

STAN OBECNY (sekcje stykają się bezpośrednio w Home.astro — pustki to sumy
sąsiadujących paddingów wewnętrznych):
- Services: .of-intro padding: 235px 150px 170px desktop (Services.astro
  ok. 414; wąski desktop 861–1280px side padding 70px), mobile 150px 26px
  48px (ok. 1052); .of-ctas margin-top 96px/110px.
- Work: .work padding-bottom clamp(72px,9vw,120px) (Work.astro ok. 128);
  .work__head padding clamp(48px,7vw,90px) 5vw 8px (ok. 134; mobile 48px
  24px 6px ok. 209); kafel „Więcej" margin-top clamp(64px,8vw,110px).
- FAQ: .fq padding: 216px 150px 130px desktop (Faq.astro ok. 144), mobile
  140px 26px 90px (ok. 589–591).

KROKI:
1. Zdefiniuj token w src/styles/global.css (:root), np.
   --section-gap: clamp(56px, 7vw, 96px); z komentarzem: „docelowa SUMA
   odstępu wizualnego na granicy dwóch sekcji strony głównej".
2. Wyrównaj granice tak, by suma (padding-bottom sekcji górnej +
   padding-top sekcji dolnej) ≈ var(--section-gap):
   - Audience(ramka) → Services: .of-intro padding-top = token (ramka
     dokłada 0).
   - Services → Work: rozdziel token między .of-intro padding-bottom
     a .work__head padding-top (np. po połowie przez calc), pamiętając że
     ostatnim elementem Services są CTA (ich margin-top zostaje).
   - Work → About(ramka): .work padding-bottom = token.
   - About(ramka) → FAQ: .fq padding-top = token.
   - FAQ → Contact(ramka): .fq padding-bottom = token.
3. Paddingi BOCZNE i wewnętrzne rytmy sekcji — bez zmian. Desktop i mobile
   obsłuż jednym clampem tokenu (jeśli proporcje wymagają, dopuszczalny
   drugi token mobile — ale zacznij od jednego).

KONTRAKTY (nie naruszać):
- Wysokość hero jest JS-derived (hero-config.ts + heroHeightSync) — nie
  dotykaj.
- Ramki 100vh: teaser Dla kogo mobile (strojony handoff tagu „02/OFERTA"),
  teaser O mnie, baner Kontakt — zero zmian.
- bg-crossfade.ts liczy crossfade'y tła z pozycji sekcji — po zmianie
  obejrzyj na preview płynność przejść tła (red/blue) przy scrollu przez
  CAŁĄ stronę, desktop + mobile.
- Triggery wejść FAQ/Contact są element-relative — przesuną się razem
  z sekcjami (OK), ale sprawdź, że nic nie odpala się „za późno".

WERYFIKACJA: pnpm build && pnpm test:visual — churn WSZYSTKICH baseline'ów
sekcji jest tu OCZEKIWANY (NIE regeneruj; regeneracja raz na końcu
brancha); pnpm test:e2e (nawigacja kotwicowa do #sections; znany flake
anchor-CTA chromium-1920 — rerun zanim uznasz regresję). Przygotuj dla
Mateusza krótkie porównanie przed/po (screenshoty granic sekcji) do
akceptacji estetycznej.

PROPOZYCJA COMMITA: style(home): tighten inter-section spacing via shared gap token
```

## 7. Polityka prywatności: chrome spójny z podstronami

**Jak to rozumiem.** `/polityka-prywatnosci/` + `/en/privacy-policy/`
(wspólny `PolicyPage.astro`) mają dziś własny minimalny chrome (decyzja D7):
tekstowy link „← hadrianm.pl", własny przełącznik `pp-lang`, własną stopkę
`pp-foot`, płaskie tło `#070507`, brak Navbara/BackButtona/Footera.

Decyzja z pytań — **zakres: tylko navbar + footer** (strona pozostaje
„lekka", bez warstwy AmbientBackground):

- **Navbar bez brandu + BackButton** wg wzorca podstron (`showBrand={false}`,
  `langHrefs`, okrągły `BackButton` w fixed wrapperze — gotcha: pozycjonowanie
  przez wrapper div, scoped CSS nie łapie komponentu potomnego; `z-index: 60`).
  Przełącznik języka przejmuje Navbar; obecny `pp-top`/`pp-lang` znika.
- **Wspólny `Footer.astro`** w kontenerze szerokości wg wzorca podstron;
  obecny `pp-foot` znika.
- Zachowujemy: jednoplikową strukturę PL+EN, treść prawną, mechanizm
  `data-back` (przechodzi do BackButtona), **skrypt antyscrapingowy e-maila**
  (kontrakt w `tests/e2e/contact.spec.ts` — pełny adres nigdy w `dist`).

**Rozstrzygnięcia (2026-07-18):**

1. Ambient: **NIE dodajemy** — zostaje płaskie tło `#070507` („tylko navbar
   + footer").
2. Przy okazji, jako elementy spójności z resztą podstron (łatwe do wycięcia,
   gdyby Mateusz zmienił zdanie): `smoothScroll="desktop"` w BaseLayout
   (dziś polityka jako JEDYNA podstrona ładuje Lenisa na wszystkich
   urządzeniach — default `true`) oraz `description` + `alternates`
   (hreflang PL↔EN; wymaga dodania `POLICY_PATH` do `src/lib/routes.ts`).

**Propozycja commita:** `feat(policy): align privacy page chrome with subpage pattern (navbar, footer)`

**Instrukcja wdrożeniowa (prompt do osobnej sesji):**

```text
Wdróż poprawkę 7 z docs/visual-corrections-part1.md. Pracuj na bieżącym
feature branchu; niczego nie commituj (commituje Mateusz).

CEL: podstrony /polityka-prywatnosci/ + /en/privacy-policy/ (wspólny
src/components/PolicyPage.astro) mają dostać navbar z BackButtonem
i wspólny Footer wg wzorca pozostałych podstron. BEZ AmbientBackground —
tło zostaje płaskie #070507 (decyzja 2026-07-18).

WZORZEC: src/components/FaqPage.astro (chrome podstrony) — ale bez warstwy
ambientu.

KROKI:
1. src/lib/routes.ts: dodaj POLICY_PATH = { pl: "/polityka-prywatnosci/",
   en: "/en/privacy-policy/" } (wzorzec istniejących *_PATH).
2. PolicyPage.astro — wywołanie BaseLayout: dodaj description (krótki opis
   PL/EN z obiektu treści c), alternates={POLICY_PATH} oraz
   smoothScroll="desktop" (dziś default true = Lenis na wszystkich
   urządzeniach — jedyna taka podstrona; "desktop" ujednolica z resztą).
3. Dodaj <Navbar lang={lang} langHrefs={POLICY_PATH} showBrand={false} />
   — przełącznik języka przejmuje Navbar; usuń obecny nagłówek .pp-top
   (link .pp-back i przełącznik .pp-lang) wraz z jego CSS.
4. Dodaj BackButton (src/components/ui/BackButton.astro) w miejscu brandu
   — GOTCHA: pozycjonowanie przez WRAPPER div (scoped CSS Astro nie łapie
   elementów komponentu potomnego); wzorzec z FaqPage: wrapper
   position: fixed; z-index: 60 (ponad nav-root 50, widoczny gdy navbar
   chowa się przy scrollu); left: clamp(1.25rem, 4vw, 2.75rem);
   top: calc(clamp(1.25rem, 3.2vh, 1.9rem) - 12px); fallback
   href={HOME_PATH[lang]}; mechanizm data-back działa globalnie
   (initBackLinks w BaseLayout).
5. Usuń własną stopkę .pp-foot (markup + CSS) i dodaj wspólny
   <Footer lang={lang} /> w kontenerze szerokości wg wzorca podstron
   (max-width: 1320px; margin: 0 auto; padding: 0 5vw 42px).
6. Sprawdź padding-top treści .pp — navbar jest teraz nad stroną; treść
   nie może wjeżdżać pod niego przy starcie.

KONTRAKTY (nie naruszać):
- Skrypt antyscrapingowy e-maila (składanie adresu z fragmentów, ok. linii
  274–286) MUSI zostać — kontrakt w tests/e2e/contact.spec.ts (pełny adres
  nigdy w dist).
- Jednoplikowa struktura PL+EN w PolicyPage.astro i treść prawna — bez
  zmian merytorycznych.
- BEZ AmbientBackground i bez zmian palety tła.

WERYFIKACJA: pnpm typecheck; pnpm test:e2e (contact.spec — antyscraping,
a11y, seo — nowe alternates/description); sprawdź w tests/visual/, czy
istnieje spec obejmujący politykę (prawdopodobnie nie — wtedy bez warstwy
visual); ręcznie na preview (4399): back-button wraca do poprzedniej
strony (data-back → history.back), przełącznik języka PL↔EN działa w obie
strony, footer spójny z /faq/, mobile scroll natywny (bez Lenisa).

PROPOZYCJA COMMITA: feat(policy): align privacy page chrome with subpage pattern (navbar, footer)
```

## 8. Przejścia między stronami: usunięcie przeskoków (FOUC)

**Jak to rozumiem.** Strona jest czystą MPA (brak View Transitions /
ClientRouter) — każda nawigacja to pełne przeładowanie dokumentu. Widoczne
przeskoki liter to okno `font-display: swap` (default Fontsource): tekst
renderuje się fallbackiem systemowym i przeskakuje po dociągnięciu woff2.
Preloadowany jest dziś tylko JEDEN plik (Archivo latin), a nie są:
**subset latin-ext** (polskie znaki ą/ę/ł/ż — wykrywany dopiero po parsowaniu
CSS przez unicode-range!) oraz **Instrument Serif** normal+italic (kursywa
akcentowa w praktycznie każdym nagłówku). „Ustawianie się obrazków" to
wpadanie lazy-loadowanych treści w ramki o stałych wymiarach CSS (nie layout
shift) — po naprawie fontów powinno przestać razić.

Decyzja z pytań — **preloady + mikro-fade** (bez ClientRoutera — duży
refactor, wysokie ryzyko regresji przy per-load init Lenis/GSAP):

- Preload w `<head>` BaseLayout (wzorzec `?url` jak istniejący): Archivo
  latin-ext wght, Instrument Serif latin 400 normal + italic (+ latin-ext
  serif, jeśli audyt wykaże użycie polskich znaków w serifach — na stronie
  głównej akcenty serif bywają po polsku, więc niemal na pewno tak).
- **Mikro-fade wejścia strony**: bardzo krótki fade-in treści bramkowany
  `document.fonts.ready` z twardym timeoutem (fallback — strona NIGDY nie
  zostaje ukryta na wolnym łączu/bez JS; wariant no-JS pokazuje treść od
  razu). Realizacja i czas trwania do doprecyzowania w instrukcji (rząd
  ~150–250 ms).
- Uwaga na metryki Lighthouse (budżety ratchet w CI): preloady poprawiają
  stabilność, ale fade nie może pogorszyć LCP — do weryfikacji w `lighthouse`
  jobie przed uznaniem punktu za zamknięty.

**Propozycja commita:** `fix(fonts): preload critical subsets and gate first paint to remove nav FOUC`

**Instrukcja wdrożeniowa (prompt do osobnej sesji):**

```text
Wdróż poprawkę 8 z docs/visual-corrections-part1.md — jako OSTATNIĄ
poprawkę brancha. Pracuj na bieżącym feature branchu; niczego nie commituj
(commituje Mateusz).

CEL: usunąć widoczne przeskoki elementów (głównie zmianę czcionek liter)
przy przechodzeniu między route'ami. Metoda: (a) preload brakujących
plików fontów, (b) bardzo krótki fade-in treści bramkowany załadowaniem
fontów — TYLKO przy nawigacji wewnętrznej, nie na pierwszej wizycie.

STAN OBECNY (src/layouts/BaseLayout.astro):
- Fonty przez Fontsource (importy CSS, linie ok. 2–11), wszystkie
  z font-display: swap. Preloadowany jest tylko JEDEN plik: Archivo
  latin wght (import ?url ok. 17–20, <link rel="preload"> ok. 68–74).
- NIE są preloadowane, a są above-the-fold na każdej stronie:
  Archivo latin-ext (polskie znaki ą/ę/ł/ż — subset wykrywany przez
  unicode-range dopiero po parsowaniu CSS!) oraz Instrument Serif 400
  normal + italic (kursywa akcentowa w nagłówkach).
- Brak View Transitions/ClientRouter (czysta MPA) — NIE wprowadzamy go
  (decyzja: zbyt duży refactor przy per-load init Lenis/GSAP).

KROKI:
1. Preloady w <head> BaseLayout wzorcem istniejącego importu ?url:
   - @fontsource-variable/archivo/files/archivo-latin-ext-wght-normal.woff2
   - @fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff2
   - @fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff2
   Audyt: sprawdź, czy serifowe akcenty zawierają polskie diakrytyki
   (grep tekstów akcentowych w src/i18n/ui.ts) — jeśli tak, dodaj też
   latin-ext serif (normal/italic wg użycia). Preloaduj TYLKO to, co
   realnie above-the-fold na każdej stronie.
2. UWAGA BUDŻETY: lighthouserc* ma ratchetowane budżety zasobów (w tym
   liczbę fontów). Sprawdź lighthouserc przed i po; jeśli licznik fontów
   przekracza budżet, skoryguj budżet świadomie w tym samym commicie
   z komentarzem (to ratchet — zmiana wymaga uzasadnienia w PR).
3. Mikro-fade przy nawigacji wewnętrznej:
   - Inline skrypt WCZEŚNIE w <head> (synchroniczny, przed first paint):
     jeśli sessionStorage ma flagę „już byłem na tej witrynie" (ustawianą
     przy każdym wejściu), dodaj klasę np. html.nav-fade.
   - CSS: html.nav-fade body { opacity: 0 }; html.nav-fade.fonts-in body
     { opacity: 1; transition: opacity ~0.18s ease }.
   - Zdjęcie bramki: document.fonts.ready.then(...) ORAZ twardy timeout
     ~300 ms (Promise.race) → dodaj klasę fonts-in. Strona NIGDY nie może
     zostać ukryta na stałe (błąd JS = brak klasy nav-fade od początku;
     bez JS nic się nie dzieje — bezpieczny default widoczny).
   - Pierwsza wizyta (zimne wejście z zewnątrz): BEZ fade — zero wpływu
     na LCP w Lighthouse (LHCI wchodzi na zimno, bez flagi sessionStorage).
   - prefers-reduced-motion: fade może zostać (to nie ruch), ale skróć
     lub pomiń transition przy reduce, jeśli to trywialne.
4. Sprawdź, że testy wizualne nie łapią stanu opacity:0: Playwright
   startuje świeży kontekst (brak flagi sessionStorage → brak fade) —
   zweryfikuj to założenie na jednym specu zanim uznasz za pewnik.

WERYFIKACJA: pnpm build && pnpm test:visual (musi być w stanie z reszty
brancha — ta poprawka NIE może dodać nowych diffów); pnpm test:e2e;
budżety: lokalny przebieg LHCI lub uważna kontrola joba lighthouse w CI
(LCP bywa o ułamek % nad budżetem — rerun zanim uznasz regresję).
Test ręczny na preview (4399): nawiguj główna → /faq/ → /o-mnie/ →
polityka i z powrotem; litery nie mogą już „przeskakiwać" czcionką;
pierwsza wizyta (okno incognito) bez fade. Poproś Mateusza o finalny test
na telefonie (zimny cache + realne łącze — emulacja tego nie wykrywa).

PROPOZYCJA COMMITA: fix(fonts): preload critical subsets and gate first paint to remove nav FOUC
```

---

## Proces wdrażania

Każdy punkt = osobna sesja Claude Code z promptem z tego dokumentu
(instrukcje są samowystarczalne). Kolejność: 1–5 i 7 (dowolnie), potem 6,
na końcu 8. Po całości: regeneracja baseline'ów (darwin lokalnie + workflow
linux) za zgodą Mateusza po obejrzeniu diffów, commit
`chore(test): update visual baselines for part-1 corrections`, pełne
`pnpm test` i PR.
