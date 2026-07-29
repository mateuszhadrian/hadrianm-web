# Historia projektu hadrianm.pl — od pierwszego commita, krok po kroku

> **Po co ten dokument.** To rekonstrukcja całej pracy nad stroną-wizytówką
> `hadrianm.pl` odtworzona z historii git (267 commitów, 12.06–20.07.2026),
> uzupełniona o „dlaczego" z `docs/` i notatek projektu. Cel: mieć jeden
> przystępny zapis procesu, do którego zawsze można wrócić — i który z czasem
> przekształci się w **szablon procesu tworzenia kolejnych stron**.
>
> **Jak czytać.** Punkty ułożone są chronologicznie i pogrupowane w nazwane
> fazy. Każdy krok ma krótkie odniesienie do commita (`hash · data`), żeby
> dało się wrócić do źródła.
>
> **Legenda znaczników:**
> - 🔧 **[PROJEKT]** — rzecz ściśle związana z tym konkretnym projektem
>   (konkretne sekcje, paleta, teksty, Sveltia). Przy budowie szablonu
>   procesu te punkty się wycina albo uogólnia.
> - 💡 **Lekcja** — wniosek, pułapka (gotcha), falstart albo rzecz przerabiana
>   po kilka razy. Najcenniejsze dla następnych projektów.
> - ⤴️ **Uniwersalny krok** — element powtarzalny w każdym projekcie.
>
> Dokument jest celowo gęsty i „z nadmiarem" — jest wersją roboczą do
> redakcji (usuwania/łączenia punktów).

---

## Spis faz

- [Faza 0 — Setup i fundament](#faza-0--setup-i-fundament-1214-czerwca)
- [Faza 1 — Hero: scena urządzeń sterowana scrollem](#faza-1--hero-scena-urządzeń-sterowana-scrollem-1427-czerwca)
- [Faza 2 — Szkielet sekcji i nawigacja](#faza-2--szkielet-sekcji-i-nawigacja-2730-czerwca)
- [Faza 3 — Unifikacja scrolla i pierwsza optymalizacja](#faza-3--unifikacja-scrolla-i-pierwsza-optymalizacja-14-lipca)
- [Faza 4 — CMS, hosting, domena, produkcja](#faza-4--cms-hosting-domena-produkcja-35-lipca)
- [Faza 5 — Refactor „odkruszający" hero](#faza-5--refactor-odkruszający-hero-67-lipca)
- [Faza 6 — Ekosystem Claude Code](#faza-6--ekosystem-claude-code-6-lipca)
- [Faza 7 — Testy: pełny pipeline + CI](#faza-7--testy-pełny-pipeline--ci-7-lipca)
- [Faza 8 — Sekcje treściowe](#faza-8--sekcje-treściowe-911-lipca)
- [Faza 9 — Formularz kontaktowy i polityka prywatności](#faza-9--formularz-kontaktowy-i-polityka-prywatności-1112-lipca)
- [Faza 10 — Dopieszczanie: tło, toast, karuzela, finalne ekrany](#faza-10--dopieszczanie-tło-toast-karuzela-finalne-ekrany-1315-lipca)
- [Faza 11 — Wielki refactor porządkujący](#faza-11--wielki-refactor-porządkujący-1516-lipca)
- [Faza 12 — Migracja sekcji na podstrony](#faza-12--migracja-sekcji-na-podstrony-1619-lipca)
- [Faza 13 — Poprawki wizualne i finalne szlify](#faza-13--poprawki-wizualne-i-finalne-szlify-1820-lipca)
- [Wątki przekrojowe (przez cały projekt)](#wątki-przekrojowe-przez-cały-projekt)
- [Rekomendacje: kolejność i optymalizacja pracy przy następnych projektach](#rekomendacje-kolejność-i-optymalizacja-pracy-przy-następnych-projektach)

---

## Faza 0 — Setup i fundament (12–14 czerwca)

⤴️ Bootstrap projektu i decyzje techniczne, które ustawiły całą resztę.

- **Start z szablonu Astro.** Projekt wystartował z czystego szablonu Astro
  (`5ac1b8b · 12.06`, „Initial commit from Astro").
- **Scaffold z GSAP.** Od razu dołożony GSAP do animacji i podstawowy setup
  narzędziowy (`78c4805 · 12.06`). Wybór stacku: **Astro 6 static (bez SSR)** +
  **GSAP** do scroll-driven animacji. 💡 **Lekcja:** decyzja Astro-vs-Next
  zapadła świadomie i wcześnie (analizy `hosting_first_analysis.md`,
  `analiza-stack-struktura-hosting.md` — ta druga rekomendowała Next i została
  potem unieważniona). Statyczna strona-wizytówka nie potrzebuje SSR — Astro
  static + hosting na krawędzi (edge) to prostsze i tańsze rozwiązanie.
- **Dwujęzyczność (i18n) od pierwszego dnia treści.** Pierwsza realna strona
  była od razu **dwujęzyczna PL/EN** z hero, wersją demo GSAP i systemem i18n
  (`d12c552 · 14.06`). 💡 **Lekcja:** i18n wprowadzone na starcie, nie
  doklejane później — to najtańszy moment. Konwencja: PL pod `/`, EN pod `/en/`
  (`prefixDefaultLocale: false`).
- **Restrukturyzacja na sekcje.** Zaraz potem monolit rozbity na sekcje +
  pierwsza sekcja „Problem" z crossfade tła między sekcjami sterowanym
  scrollem (`bb78d9d · 14.06`). 💡 **Lekcja:** architektura „strona = ciąg
  sekcji" i mechanizm crossfade tła powstały bardzo wcześnie i przetrwały cały
  projekt (choć sama sekcja „Problem" później zniknęła — patrz
  `drewelomet-anim-analysis.md`).

---

## Faza 1 — Hero: scena urządzeń sterowana scrollem (14–27 czerwca)

🔧 **[PROJEKT]** To najbardziej autorska i najbardziej pracochłonna część
całego projektu — scroll-driven „scena urządzeń" (słowo-akcent → morfujące
urządzenia 3D → ekrany z realizacją). Uniwersalny jest tu *wzorzec pracy*
(iteracyjne budowanie złożonej animacji + walka z platformami mobilnymi), nie
konkretna scena.

- **Frame A hero + własne fonty.** Pierwsza „klatka" hero (nagłówek + akcent)
  z self-hostowanymi fontami brandowymi (`da921b4 · 14.06`). 💡 **Lekcja:**
  fonty self-hosted (nie z CDN) od początku — kluczowe dla wydajności (LCP) i
  braku FOUC później.
- **Animacja akcentu.** Per-literowa animacja fali na akcencie nagłówka
  (`e1be550 · 14.06`).
- **Navbar.** Responsywny navbar z chowaniem na scrollu i hover-swapem liter
  (`a95eed6 · 14.06`). 💡 **Lekcja:** navbar to element, który wróci wielokrotnie
  (reveal na kursor, logo zamiast back-buttona, koniec ery kotwic po migracji
  na podstrony) — patrz notatka `navbar-measure-nie-optymalizuj.md`: **nie
  optymalizuj `measure()` navbara** — kuszące ~49 ms wymuszonego layoutu, ale
  trzy warianty optymalizacji wywaliły testy axe.
- **Ukrywanie elementów na niskich viewportach** (`09a80b0 · 15.06`) — eyebrow
  i label scrolla znikają na krótkich ekranach.
- **Rdzeń sceny: akcent → urządzenia 3D.** Scroll-driven przejście
  słowa-akcentu w urządzenia 3D, ze ścieżką zoptymalizowaną pod mobile
  (`ce036e6 · 15.06`), a potem faza 2 z morfem urządzeń 3D i odsłonięciem
  tekstu (`a8f0daf · 15.06`).
- **Pierwszy refactor hero + design tokens.** Wydzielenie „device scene" i
  przeniesienie tokenów brandowych do `:root` (`d51ea1d · 15.06`, PR #1). 💡
  **Lekcja:** design tokeny (kolory, fonty) w `:root` w `global.css` — jedno
  źródło prawdy dla całej strony.
- **Faza 3 sceny: realizacja na ekranie laptopa** 🔧 (`deac92e · 21.06`, PR #2)
  — na ekranie laptopa pojawia się strona demo („drewelomet"). Potem dużo
  iteracji na jej wyglądzie: polish/optymalizacja (`2416aaf`), kadrowanie i
  lewe wyrównanie galerii (`6afca3e`), wersja mobilna na ekranie telefonu
  (`f6e4fad · 22.06`), zmiany fontów i logo (`e8e184e`, `3de133a`, `68cd1d4`),
  paralaksa zamiast statyki (`14078c4 · 23.06`).
- **Nagrane wideo ekranów urządzeń.** Zamiast renderować żywe strony w scenie —
  odtwarzanie **nagranych wcześniej MP4** ekranów urządzeń na mobile, ze
  scroll-driven zoomem (`55bc831 · 23.06`). 💡 **Lekcja (ważna):** żywe
  iframe'y/strony w scenie mobilnej są zabójcze dla wydajności — wypieczone
  wideo to świadomy trade-off (pipeline `pnpm capture:devices`, skill
  `/capture-devices`). Notatka: `mobile-device-video-pipeline.md`.
- **Lenis (smooth scroll) na desktop.** Dodany Lenis, żeby naprawić szarpanie
  kółka z zapadką (notched-wheel judder) (`9297f2a · 24.06`). 💡 **Lekcja:**
  stałe desktop i touch są **celowo rozdzielone** — ich scalenie było regresją
  (`0640aa1`), notatka `lenis-smooth-scroll.md`. Bramka przez `maxTouchPoints`,
  nie media query hover/pointer.
- **Seria napraw platformowych (iOS/Android)** — tu zaczyna się największy koszt
  ukryty projektu:
  - sRGB fallback dla gradientów oklch na starym iOS Safari (`f151e7f · 24.06`),
  - przerwanie retry zablokowanego `video.play()` co klatkę scrolla → judder w
    iOS Low Power Mode (`fb7be64 · 24.06`),
  - pasek postępu wideo na mobile (`d391a36`), potem uproszczenie markerów i
    ciągła pętla wideo (`6107639`, `f8a8fe6 · 25.06`),
  - **spłaszczenie sceny 3D na mobile** — porzucenie perspektywy/blur/ekstruzji,
    płaskie ekrany wideo (`7a2da48 · 25.06`). 💡 **Lekcja (root cause):** ciężka
    obudowa CSS-3D urządzeń **głodziła rasteryzację GPU** na Androidzie
    (znikające napisy/pasek), potwierdzone przez `?flat`. Fix = spłaszczenie.
    Notatki: `android-normalizescroll-thrashing.md`,
    `analiza-android-obudowy-3d-glodza-rasteryzacje.md`.
  - **Android GPU clip:** kotwiczenie dividerów do spodu urządzeń + skala
    projektowa `K=0.6` przeciw limitowi warstwy GPU (`3cc5663 · 26.06`),
    bramkowane tylko do Androida (`fd2ff17`), urządzenia nad warstwą tekstu
    (`b04c0bd`). 💡 **Lekcja:** scena była zaprojektowana w ogromnych „design
    px", które przekraczały **maksymalny rozmiar warstwy GPU** Androida — fix to
    skalowanie design px w dół przez `K`. Notatki:
    `android-phone-bottom-clip-during-laptop-grow.md`,
    `naprawa-android-scena-urzadzen-mobile.md`.
- **Karuzela podpisów (captions).** Scroll-driven karuzela lewej kolumny tekstu
  na desktopie (`d8ea103 · 26.06`), spotlight finalnego podpisu + fix przycinania
  kursywy akcentu (`044bf58`), wzrost podpisów mobile zsynchronizowany z
  „czerwonymi segmentami" wideo (`1960e7f`), szybsze/bezszczelinowe wejście
  urządzeń (`05c21ba`), odpięcie sceny dokładnie gdy finalny podpis siada
  (`e32e42c · 27.06`). Notatka: `hero-caption-carousel.md`.
- **Notice Low Power Mode.** Zamykalny komunikat o trybie oszczędzania energii
  dla iPhone (PL/EN) (`5d5054c · 27.06`). 💡 **Lekcja:** iOS Low Power Mode ≠
  `prefers-reduced-motion` — blokuje autoplay i throttluje CPU; nie da się go
  wykryć emulacją. Notatka `ios-low-power-mode-scroll.md`.
- **Poprawki treści hero** — przepisanie nagłówka i copy, fix odstępów akcentu
  (`5ca4ef2 · 24.06`).

---

## Faza 2 — Szkielet sekcji i nawigacja (27–30 czerwca)

⤴️ Zbudowanie „rusztowania" całej strony: nawigacja + placeholdery wszystkich
sekcji + pierwsza pełna sekcja treściowa (Realizacje).

- **Nawigacja click-to-scroll.** Sekcja „Dla kogo" (audience) + nawigacja
  klik→scroll (desktop płynnie, mobile natychmiast) (`2bac9f6 · 27.06`).
- **Placeholdery wszystkich sekcji.** Placeholder-sekcje dla wszystkich celów
  nawigacji + crossfade tła między sekcjami + docs hostingu (`962ee9b · 28.06`).
  💡 **Lekcja:** postawienie *pustych* sekcji-celów wcześnie pozwoliło mieć
  działającą nawigację i szkielet strony, zanim treść była gotowa.
- **Gating wideo do widoczności hero** (perf, Android) (`34ac0f3 · 28.06`).
- **Rozbicie placeholderów na osobne komponenty** (`0b3d735 · 29.06`) — każda
  sekcja jako dedykowany komponent.
- **Navbar reveal na kursor** przy górnej krawędzi (desktop) (`938ab8f`) +
  natychmiastowy skok do sekcji po kliknięciu (`d8d7a6a · 29.06`).
- **Sekcja Realizacje (Work) — pierwsza wersja.** 🔧 Galeria projektów z
  płaskimi mockupami urządzeń (`522ded3 · 29.06`), fix przycinania descenderów
  w nagłówku (`4474dd4`), większe odstępy kafelków (`7099b9d`), a potem modal
  szczegółów + mobilny bottom sheet (`5677535 · 30.06`). 💡 **Lekcja:** wzorzec
  „galeria + Modal (desktop) / BottomSheet (mobile)" zbudowany tu został potem
  reużyty (wspólny `overlay.ts`, `CloseIcon`).

---

## Faza 3 — Unifikacja scrolla i pierwsza optymalizacja (1–4 lipca)

⤴️ Konsolidacja mechaniki scrolla i pierwsza fala optymalizacji wydajności —
zanim doszła treść i CMS.

- **Lenis wszędzie.** Ujednolicenie smooth-scrolla na Lenis (mobile + desktop)
  i fix przywracania scroll-locka (`9ec4851 · 01.07`). 💡 **Lekcja:** mimo
  ujednolicenia — stałe desktop/touch pozostają rozdzielone (patrz Faza 1).
- **Spłaszczenie tła ambient na mobile** do statycznego obrazka + porzucenie
  nieużywanych teł sekcji (`4540fac · 01.07`). 💡 **Lekcja:** animowane tło
  (chmury) na mobile → statyczny WebP; regeneracja przez
  `pnpm capture:ambient-bg`.
- **Downscale obrazów Realizacji** (1290 KB → 502 KB) (`4ba87ab · 01.07`).
- **Poprawki nakładek/scrolla:** statyczne tło modala podczas rubber-band scroll
  macOS (`acd620b`), rezerwacja `scrollbar-gutter` przeciw skokowi strony przy
  otwarciu modala (`fffb59a`), gest swipe-down do zamknięcia bottom sheeta
  (`260d4dc · 01.07`), brak focus-ringa gdy sheet otwarty dotykiem (`cb774b5`).
- **Self-heal wideo iOS.** Samonaprawa mimowolnej pauzy dekodera wideo na iOS,
  żeby ekrany urządzeń nie zamarzały w połowie klipu (`50b12b6 · 01.07`). 💡
  **Lekcja:** dekoder iOS potrafi pauzować wideo bez powodu — trzeba to
  aktywnie wykrywać i wznawiać. Notatka `ios-device-video-involuntary-pause.md`.
- **Retuning tłumienia scrolla + `SCROLL_SCALE` hero** (`0640aa1 · 01.07`),
  potem przywrócenie desktop wheel smoothing utraconego w retuningu
  (`99ef97a · 03.07`). 💡 **Lekcja:** to jest ta regresja ze scalenia stałych —
  ostrzeżenie w notatce Lenis.
- **Usunięcie per-frame GPU blur** powodującego jank scrolla na desktop
  (`f2aee71 · 04.07`).
- **Ostateczne ujednolicenie hero mobile** iOS+Android — ciągła pętla wideo,
  czerwone segmenty czysto wizualne (`7d834a5 · 04.07`). 💡 **Lekcja:** jedyne
  pozostałe splity iOS/Android to render-only (`--k:0.6`, dividery) i **muszą
  zostać**.

---

## Faza 4 — CMS, hosting, domena, produkcja (3–5 lipca)

⤴️ Przejście od „projekt na dysku" do **żywej strony na produkcji z panelem
CMS**. To kluczowy kamień milowy — od tego momentu strona jest online.

- **Analizy CMS + hosting (docs-first).** Plany wdrożenia CMS/hosting
  (`6028a1f · 03.07`), dodanie domeny `.pl` i firmowego maila do planu
  (`3ee32ab`), potem zmiana rejestratora na OVH (ceny, DNSSEC, darmowa skrzynka)
  (`ad7c6d9`). 💡 **Lekcja:** większe decyzje poprzedzane analizą w `docs/`
  (konwencja „docs-first"). Wybrano **Sveltia CMS** (nie Sanity — ten zachowany
  jako opcja dla przyszłych projektów klienckich w `hosting_second_analysis_sanity.md`).
- **CMS Etap 1 — Content Collections.** Przeniesienie Realizacji do Astro
  Content Collections + helper `imgAt()` (`4f08373 · 03.07`). 💡 **Lekcja:**
  `imgAt()` (`src/lib/img.ts`) to **jedyne miejsce wiedzy o rozmiarach obrazów**
  — źródło prawdy dla transformacji Cloudflare.
- **CMS Etap 2 — panel Sveltia.** Panel admin Sveltia + robots.txt
  (`938b2b9 · 03.07`).
- **CMS Etap 3 — auth Worker.** Panel wskazany na Worker `sveltia-cms-auth`
  (`4abf248 · 03.07`).
- **Lista opcjonalnych TODO** (utrzymanie: Worker auth, sekrety)
  (`0f5975b · 03.07`, `optional-todos.md`).
- **CI Etap 4 — brama jakości.** Pierwszy GitHub Actions quality gate
  (`032f678 · 03.07`), bump wersji akcji (`e7145fd`), wyłączenie CMS-owych JSON
  z Prettiera (`5187cfb`). 💡 **Lekcja:** pliki `src/content/realizacje/*.json`
  pisze Sveltia własnym formaterem — **nie edytuje się ich ręcznie** i wyłącza z
  Prettiera.
- **Produkcja LIVE.** Etap 4 zamknięty — `hadrianm.pl` żywy na **Cloudflare
  Pages** (`81d4596 · 03.07`). 💡 **Lekcja:** deploy automatyczny z gałęzi
  `main` → **main = produkcja**. Main chroniony (required checks). Zmiany idą
  przez feature branch → PR → zielone checki → merge.
- **Pierwsze realizacje przez panel** 🔧 (`ef54dcb`, `c8debc4`, `ec51f92`,
  `b04c... aura/dab/sielski`) — testowe wpisy tworzone/edytowane przez Sveltię
  (commity typu „Update Realizacja «aura»" to commity bota GitHub API).
- **Ikony i podglądy linków.** Favicon „hm", pełny zestaw ikon i OG/link
  previews (`f61b18b · 03.07`). ⤴️ **Uniwersalny krok:** favicon + zestaw ikon +
  Open Graph (podglądy przy udostępnianiu) to standardowy „brand polish".
- **Skrzynka pocztowa** (OVH Zimbra `info@hadrianm.pl`) — docs
  (`1af9178 · 05.07`, `mailbox_setup.md`), Gmail alias odłożony.
- **CMS Etap 5 — media w R2.** Przełączenie storage mediów na **Cloudflare R2**
  (`80270b6 · 05.07`), serwowanie obrazów Realizacji z R2 przez transformacje
  Cloudflare (`ee19384`), usunięcie lokalnych obrazów po migracji
  (`7d2bb22 · 05.07`). 💡 **Lekcja:** media realizacji żyją w R2
  (`media.hadrianm.pl`), **nie w repo**. Upload wyłącznie przez pola Image w
  panelu. GOTCHA: Sveltia wgrywa do R2 tylko przez pola Image (nie Assets) i
  **nie kasuje** plików z R2 przy usuwaniu wpisu (osierocone pliki sprząta się
  ręcznie). Notatka `cms-hosting-implementation-plans.md`.

---

## Faza 5 — Refactor „odkruszający" hero (6–7 lipca)

⤴️ Zanim doszły kolejne sekcje i testy — świadome „odkruszenie" (usztywnienie)
najbardziej kruchego kawałka kodu (hero), żeby dało się go bezpiecznie
testować i zmieniać. Wzorzec: **najpierw harness testowy, potem refactor.**

- **Krok 0 — harness wizualny.** Dodanie scroll-sweep visual regression harness
  dla hero *przed* refactorem (`1edc6b1 · 06.07`). 💡 **Lekcja:** siatka
  bezpieczeństwa (pixel-diff vs baseline) powstała *zanim* ruszono kod — dzięki
  temu refactor był weryfikowalny.
- **Krok 1 — `hero-config`.** Wyciągnięcie stałych osi scrolla do `hero-config`
  z pochodnym `min-height` (`99aa4ae · 06.07`). 💡 **Lekcja:** oś scrolla to
  źródło prawdy — **pochodne liczy kod**, nie wpisuje się ich ręcznie.
- **Krok 2 — detekcja platformy.** Jedno źródło detekcji platformy i skali
  Androida (`542b13e · 06.07`, `platform.ts`).
- **Krok 3 — `scene-vars`.** Centralny protokół zmiennych CSS sceny w rejestrze
  (`0fb8e2e · 06.07`).
- **Naprawa zimnego startu (najważniejsza).** Eliminacja wyścigów cold-load:
  unifikacja metryki viewportu, guardy stanu wejściowego, re-glue fontów na iOS
  (`6ea9836 · 06.07`). 💡 **Lekcja (krytyczna):** sekcja hero i triggery
  ScrollTriggera **muszą dzielić jedną metrykę** (`innerHeight` px na
  `refreshInit`, nie `svh`) — inaczej późny refresh po zimnym cache (zwijany
  toolbar iOS) odpina sticky za wcześnie. Notatka
  `hero-viewport-metric-invariant.md`.
- **Krok 4 — moduły faz.** Rozbicie monolitycznego skryptu scrolla na moduły faz
  (`bab04bf · 06.07`, `timeline-base`/`desktop-phases`/`mobile-phases`/...).
- **Krok 5 — kontrakt selektorów.** Centralizacja cross-file kontraktu
  selektorów z ostrzeżeniami dev-time (`c20ba20 · 06.07`, `selectors.ts`).
- **Krok 6 — sync docs** (`bf73f54`) + audyt spójności docs (bannery HISTORIC,
  indeks statusów) (`962a8b9 · 06.07`). 💡 **Lekcja:** `docs/README.md` = indeks
  statusów; dokumenty historyczne dostają banner „DOKUMENT HISTORYCZNY".
- **Poprawki wejścia urządzeń mobile** — wjazd urządzeń gdy nagłówek jeszcze
  wychodzi (`9d38fa7`), strefy startujące gdy urządzenia siadają (`3086264`),
  pasek postępu na całą scenę (`dbbc8d6 · 07.07`). Dokument-źródło:
  `analiza-refactor-hero-odkruszenie.md` (najważniejszy dla pracy w hero).

---

## Faza 6 — Ekosystem Claude Code (6 lipca)

⤴️ Zbudowanie „środowiska pracy z asystentem" — reguły, skille, hooki, guardraile.
To meta-warstwa, która przyspiesza całą dalszą pracę.

- **Plan ekosystemu** (`909f0f0 · 06.07`,
  `claude-code-ecosystem-initialization.md`).
- **Bootstrap ekosystemu.** `CLAUDE.md`, `settings.json` + hooki, reguły, skille,
  MCP (`3a31c05 · 06.07`). 💡 **Lekcja:** guardraile w `settings.json` (blokada
  `git commit/push`, blokada edycji baseline'ów wizualnych i CMS-owych JSON)
  egzekwują twarde zasady projektu maszynowo, nie tylko „na słowo".
- **Decyzja: testy osobno.** Zapis, że testy to osobne przedsięwzięcie, a
  white-label (Etap 7) czeka aż testy zadziałają (`f92e919 · 06.07`).

---

## Faza 7 — Testy: pełny pipeline + CI (7 lipca)

⤴️ Jeden intensywny dzień: od zera do pełnej piramidy testów (unit → e2e →
visual → Lighthouse) bramkującej każdy PR. To fundament pewności na resztę
projektu.

- **Plan testów (docs-first)** (`48821ad · 07.07`,
  `testing-tools-and-environemnts-setup-analysis.md`) + decyzja: linux baseline
  przez ręcznie wyzwalany bot-commit (`0007bbc`, `ec3d945`).
- **Etap 1 — fundament.** Playwright, Vitest, axe, LHCI (`1e444b3 · 07.07`).
- **Etap 2 — unit.** Inwarianty `hero-config`, i18n, `img`, `platform`, kontrakt
  CMS (`532110a · 07.07`). 💡 **Lekcja:** testy unit pilnują *kontraktów*
  (niezmienników osi scrolla, kontraktu CMS) — sekundy, a łapią klasę regresji.
- **Etap 3 — E2E.** Nawigacja, nakładki Work, i18n, hero funkcjonalnie, a11y,
  SEO, prod smoke (`256e726 · 07.07`).
- **Etap 4 — visual grid.** Siatka regresji wizualnej, migracja `verify-hero` do
  Playwrighta (`be043f5 · 07.07`) + baseline'y linux (PR #3). 💡 **Lekcja:**
  baseline'y są **per-platforma** — dwa komplety per plik: `*-darwin.png`
  (lokalnie) i `*-linux.png` (workflow). Nigdy nie „naprawiaj" rozjazdu
  darwin↔linux globalnym progiem. Notatki: `testing-contract.md`,
  `visual-baselines-ci-ordering.md`.
- **Etap 5 — Lighthouse.** Konfiguracje LHCI + pomiar bazowy (`4abca06`), potem
  budżety ratchet z CI + autorun (`bcb1ec1 · 07.07`, PR #4). 💡 **Lekcja:**
  budżety wydajności działają jako **ratchet** (zapadka) — nie mogą się cofnąć;
  po realnej zmianie re-baseline w górę tylko świadomie. Lokalny LHCI liczy
  szumnie (±300 ms LCP) — do małych delt mierz Playwrightem.
- **Etap 6 — pełny pipeline CI.** Joby e2e+visual i lighthouse, prod smoke po
  deployu (`54279f6 · 07.07`, PR #5). Required checks: `quality`, `e2e`,
  `lighthouse`.
- **Etap 7 — optymalizacje.** Usunięcie nieużywanego React i MDX (`28097e0`,
  PR #6), rekompresja og-image (649→98 KB) i icon-512 (173→27 KB) (`e14d725`),
  preload Archivo woff2 (`5c8a6c1`), usunięcie ScrollDemo playground (`37a379f`,
  PR #7), zacieśnienie budżetów LHCI (`5602448`, PR #8). 💡 **Lekcja:**
  usunięcie nieużywanych integracji (React/MDX) to darmowy zysk wydajności —
  warto zrobić wcześnie.
- **Sync ekosystemu z testami** — skill `/test`, stop-hook uruchamiający unit
  (`83473dd`, PR #9), fix apt feeds przed instalacją Playwrighta w CI
  (`617ab52 · 07.07`).

---

## Faza 8 — Sekcje treściowe (9–11 lipca)

⤴️ Z gotowym szkieletem, CMS i testami — budowa właściwych sekcji treściowych.
Każda sekcja szła według tego samego wzorca: **analiza w `docs/` → implementacja
scroll-driven → testy unit/e2e/visual → baseline'y darwin+linux → PR**.

- **Dokument codziennego procesu** (`532ca5a · 09.07`, `daily-workflow.md`,
  PR #10). 💡 **Lekcja:** od tego momentu istnieje spisany „operacyjny" proces:
  feature branch → `/test` → PR → 3 checki → merge → auto-deploy + prod smoke.
- **Sekcja „O mnie" (About).** 🔧 Scroll-driven, PL/EN, design „Z mgły"
  (`77afe08 · 09.07`, PR #11). Wzorzec: pinned + scrub + snap. Test-fix: snap
  wyłączany przez `?nosnap` w testach osiowych (`4b9f08a`, PR #13). 💡 **Lekcja:**
  scroll snap psuje testy osiowe — bramka `?nosnap`.
- **Restyle Realizacji** 🔧 (`66e3c86 · 09.07`, PR #12).
- **Dokumentacja kolejności baseline'ów** (`fd00dab · 10.07`, PR #14). 💡
  **Lekcja (ważna):** bot-push workflow update-baselines **nie wyzwala CI** —
  kolejność: kod → workflow linux → commit darwin **na końcu**. Notatka
  `visual-baselines-ci-ordering.md`.
- **Sekcja „Dla kogo" (Audience).** 🔧 Scroll-driven „talia kart" (card-deck),
  pinned+scrub+snap (`4f4096f · 10.07`, PR #15). 💡 **Lekcja:** runtime spany
  wymagają `:global` w scoped CSS; ułamkowa wysokość sekcji mobile przesuwa fazę
  subpikselową baseline'ów wszystkich sekcji poniżej (ghosting ~1px = **nie
  regresja**). Notatka `audience-section-talia-kart.md`.
- **Sekcja „Oferta" (Services).** 🔧 Scroll-driven „Nić A + Pakiety" (scrub bez
  pinu) (`b83afc1 · 10.07`, PR #16), re-baseline budżetu LHCI po sekcji
  (`beddec3`, PR #17). 💡 **Lekcja:** `of-prog-on` na sekcji, nie na body.
  Notatka `services-section-oferta.md`.
- **Sekcja „FAQ" (Rejestr).** 🔧 Akordeon PL/EN, JSON-LD FAQPage
  (`e8e9ac7 · 11.07`, PR #18) + baseline'y. 💡 **Lekcja:** split akordeon/wejścia
  — akordeon działa też przy `reduce`; element-screenshoty mają „wszyty" navbar
  zależny od wysokości strony (churn ≠ regresja). Notatka `faq-section-rejestr.md`.
- **Fix flaky baseline'ów hero pixel-5** (`d6a58ca · 11.07`, PR #19). 💡
  **Lekcja:** klatki pixel-5 00–03 to „loteria maszyn runnerów GH" (różne CPU →
  inne zaokrąglenia AA serifowego akcentu przy DPR 2.75) — **nie regeneruj
  baseline'u na ten objaw**. Notatka `verify-hero-desktop-flaky-frames.md`.

---

## Faza 9 — Formularz kontaktowy i polityka prywatności (11–12 lipca)

⤴️ Jedyny „backendowy" kawałek statycznej strony — formularz przez serverless
function. Wzorzec przydatny w każdym projekcie z kontaktem.

- **Analiza formularza (docs-first)** (`132c450 · 11.07`, PR #20,
  `contact-me-form-analysis-implementation.md`).
- **Endpoint.** Pages Function + **Resend** (mail) + **Turnstile** (anty-bot)
  (`30faa33 · 11.07`, `functions/api/kontakt.ts`).
- **Sekcja z formularzem** 🔧 — formularz, reveal, Turnstile, PL/EN
  (`394b20f · 11.07`) + testy e2e/prod-smoke/visual (`66dd5af`) + baseline'y.
- **Utwardzenie testów antyspamu** — deterministyczny zegar antyspamu w e2e
  (CI flake) (`31e0f23`), honeypot readonly do fokusu (fałszywy pozytyw
  autofill Chrome) (`fc2107a · 11.07`, PR #21). 💡 **Lekcja:** warstwy
  antyspamowe (stub Turnstile w testach, readonly-honeypot, e-mail sklejany z
  fragmentów przeciw scraperom) wymagają deterministycznego sterowania czasem w
  testach. Notatka `contact-form-section.md`.
- **Polityka prywatności + „wstecz".** Strony PL/EN polityki prywatności +
  globalny mechanizm history-back dla podstron (`9d80c12 · 12.07`, PR #23). 💡
  **Lekcja (ważna na przyszłość):** globalny mechanizm „wstecz"
  (`a[data-back] → history.back`) — **wymóg dla wszystkich przyszłych
  podstron**. To był pierwszy krok w stronę architektury podstron (patrz Faza 12).
- **Tolerancja flake CI** — pixel-5 hero 00–03 (`1cbf6a4 · 12.07`).

---

## Faza 10 — Dopieszczanie: tło, toast, karuzela, finalne ekrany (13–15 lipca)

⤴️ Warstwa „polish" — dopieszczanie tego, co już działa: system tła, powiadomienia,
finalne materiały wizualne, dostępność.

- **Pasek postępu hero = nić procesu** 🔧 — diamentowy marker + accent fill
  (`1f07203 · 13.07`, PR #24).
- **Backstopy timeoutów CI** (`ca14461 · 13.07`, PR #25). 💡 **Lekcja:**
  Playwright install potrafi zawisnąć >1h — backstop `timeout-minutes` w CI.
  Notatka `ci-flakes-catalog.md`.
- **System tła ambient red/blue.** Podział ambientu na warianty czerwony/niebieski,
  niebieski dla sekcji Work (`96cedf5 · 13.07`, PR #26), naprzemienny per-sekcja
  ambient (`2531160 · 13.07`), wypełnienie paneli treści nad ambientem
  (`c2aef38`). 💡 **Lekcja:** deferrowanie tekstury nieaktywnej warstwy tła do
  pre-warm crossfade'u (`24191a1`) — perf mobile.
- **A11y do WCAG AA.** Podniesienie `--faint` do WCAG AA + allowlista słów
  scroll-reveal Oferty (`de41d91 · 13.07`, PR #27). 💡 **Lekcja:** allowlista
  axe to **ratchet** — wpis wolno usunąć po realnej poprawie, nowych nie
  dopisywać bez decyzji.
- **Utwardzenie asercji anchor-jump** przeciw nieprecyzji Lenisa
  (`382cb42 · 13.07`).
- **System toastów „Wash".** Reużywalny system toastów, wpięty w formularz
  kontaktowy (`b13ab97 · 14.07`, PR #28) + re-baseline LHCI (`48ac7a4`). 💡
  **Lekcja:** tolerancja stitch-jitter pixel-5 na `#contact` (`06b4921`).
- **Redesign Realizacji: karuzela mobile.** 🔧 Desktop bez zmian + kafel
  „Więcej realizacji", mobile pozioma karuzela (snap+peek, tap→BottomSheet)
  (`c668ae4 · 14.07`, PR #29). 💡 **Lekcja (gotcha):** Lenis
  `data-lenis-prevent-horizontal` (**nie** `-prevent` — to zabija pionowy scroll
  na Androidzie!), `scroll-snap-stop:always`. Notatka
  `work-realizacje-carousel-mobile.md`.
- **Finalne ekrany LUMÉA** 🔧 — podmiana placeholderów sekcji „Dla kogo" na
  wypieczone jasne WebP (`9a66dac · 14.07`, PR #30). 💡 **Lekcja:** nowa
  animacja mobile (wjazd L/R/L zamiast crossfade blur→sharp) = **zero `filter`
  w runtime** (wydajność). Pipeline `scripts/capture-audience-screens.mjs`.

---

## Faza 11 — Wielki refactor porządkujący (15–16 lipca)

⤴️ Po zbudowaniu wszystkich sekcji — świadomy refactor „długu": martwy kod,
duplikacja, hot-path perf, DRY w testach. Rozbity na małe, osobne PR-y (part1–6).

- **Analiza optymalizacyjna (docs-first)** (`471678e · 15.07`, PR #31,
  `first-bigger-improvement-refactor-analysis.md`).
- **Guard pinch/zoom w Lenis** — ignorowanie gestów pinch/zoom (`e2cfe51`,
  PR #32).
- **Hot-path hero + ambient** — batch layout reads dividerów, dedup progress var,
  usunięcie martwej warstwy screen-glass (`340ffbe · 15.07`, PR #33).
- **Martwy kod** — usunięcie `siteConfig`, tokenów `sec-*`, jednorazowych
  skryptów obrazów (`5d07069`, PR #34).
- **Wspólne helpery** — ekstrakcja współdzielonych helperów scrolla sekcji
  (`864165e`), wspólny `CloseIcon` dla Modal/BottomSheet (`42e482b`, PR #35),
  wspólny preview guard + visual sweep helpers w testach (`44de856 · 16.07`,
  PR #36). 💡 **Lekcja:** DRY najlepiej robić *po* zbudowaniu kilku podobnych
  rzeczy — widać wtedy realny wspólny mianownik, nie zgadywany.
- **Sync docs z kodem** (`07c8e4d · 16.07`, PR #37).

---

## Faza 12 — Migracja sekcji na podstrony (16–19 lipca)

⤴️ Duża zmiana architektury informacji: sekcje ze strony głównej stają się
**osobnymi podstronami**, a na głównej zostają statyczne zajawki (teasery) z CTA.
Powtarzalny wzorzec migracji — bardzo wartościowy jako element szablonu.

- **Wzorzec migracji (powtórzony dla każdej sekcji):** pełna animacja przenosi
  się 1:1 na podstronę (`smoothScroll="desktop"` — Lenis na desktopie, mobile
  natywnie), na głównej zostaje statyczna zajawka z buttonem, navbar przestaje
  być kotwicą a staje się linkiem do podstrony, BackButton + współdzielony
  `Footer.astro`, CTA finału jako placeholder `#` do późniejszej migracji.
- **`/realizacje/`** 🔧 — pełna galeria, scroll natywny (prop `smoothScroll` w
  BaseLayout), BackButton zamiast brandu, wspólny Footer (`9074736 · 16.07`,
  PR #38). 💡 **Lekcja:** BackButton pozycjonowany przez wrapper (scoped CSS nie
  łapie komponentu potomnego); zaakceptowany skok paska URL na mobile. Notatka
  `realizacje-subpage.md`.
- **`/dla-kogo/`** 🔧 — Audience na podstronie, teaser 100vh na głównej
  (`661ad64 · 16.07`, PR #39). 💡 **Lekcja:** WebKit-emulacja nie raportuje
  `maxTouchPoints`; Playwright auto-zapisuje brakujące baseline'y; inline script
  nie może być warunkowy w JSX. Notatka `dla-kogo-subpage.md`.
- **`/proces-wspolpracy/` + `/pakiety/`** 🔧 — podział Oferty na dwie podstrony,
  teaser (intro + para CTA) na głównej, jeden `Services.astro` z wariantami
  (`77a4509 · 16.07`, PR #41). Notatka `oferta-subpages.md`.
- **`/o-mnie/`** 🔧 — About na podstronie, zajawka z portretem w stanie finału +
  parametry strojenia `--om-teaser-photo-*` (`3e9662f · 17.07`, PR #42). 💡
  **Lekcja:** wartości tweenu zajawki (desktop 0.82 z `about-scroll.ts`) trzeba
  utrzymywać w parze z podstroną. Notatka `o-mnie-subpage.md`.
- **`/kontakt/`** 🔧 — formularz na podstronie, banner CTA na głównej
  (`83d9ffd · 17.07`, PR #43) + fix bfcache: recalc Lenis i ScrollTrigger po
  restore (`5c88695`). 💡 **Lekcja:** po restore z bfcache trzeba `lenis.resize()`
  + `ScrollTrigger.refresh()` (`pageshow` persisted); banner liczy budżet od
  **widocznej** wysokości (iPhone SE gotchas). Notatka `kontakt-baner-se-geometry.md`.
- **`/faq/`** 🔧 — pełny rejestr 30 pytań z wyszukiwarką 100% frontend, teaser
  6 pytań na głównej (`121b4d8 · 17.07`, PR #44). 💡 **Lekcja:** jedno źródło
  pytań `src/i18n/faq.ts`, JSON-LD FAQPage tylko na podstronie.
- **`/oferta/` hub** 🔧 — czwarty wariant `hub` w `Services.astro`, navbar
  „Oferta" → podstrona (**koniec ery kotwic w menu**), scroll w pełni natywny
  (`c24d253 · 19.07`, PR #46). 💡 **Lekcja:** `SplitCta.astro` wydzielony z
  `OfertaButtons`; `dk-cta` → `/oferta/`. Notatka `oferta-hub-subpage.md`.

---

## Faza 13 — Poprawki wizualne i finalne szlify (18–20 lipca)

⤴️ Ostatnia (na teraz) faza: ujednolicanie detali, dopracowanie fontów przeciw
FOUC, kolejna fala perf-refactoru, mikro-feature'y UI.

- **Plan poprawek wizualnych cz. 1 (docs-first)** (`5b4a8ab · 18.07`,
  `visual-corrections-part1.md`) — 8 punktów z samowystarczalnymi promptami per
  punkt.
- **Unifikacja CTA.** Zajawka „Dla kogo" → wspólny `SolidButton` (`e24d7f5`),
  Oferta → animowany wzorzec CTA banera Kontakt (`1faff18 · 18.07`). 💡
  **Lekcja:** ujednolicenie przycisków w całym serwisie do jednego wzorca —
  robione *po* tym jak istniało kilka wariantów.
- **Poprawki treści/parametrów** 🔧 — nagłówek sekcji Work bez intro (`8a1ac1d`),
  tunable skala kafelków karuzeli `--wk-scale=1.2` (`b9cd7a2`), per-paragraph
  reveal Oferty (`bd69cec`), chrome polityki prywatności wg wzorca podstron
  (`a767395`), wspólny token odstępów sekcji (`3af2279 · 18.07`).
- **Fonty przeciw FOUC.** Preload krytycznych subsetów + bramka pierwszego paintu
  (`815191e · 18.07`, PR #45). 💡 **Lekcja:** FOUC navbara rozwiązany przez
  preload krytycznych subsetów + mikro-fade pierwszego paintu.
- **Perf/refactor optymalizacyjny.** Usunięcie nieużywanej prostej odmiany serif,
  zawężenie fontów drewelomet do hero (`e9b54a0 · 20.07`), zwolnienie
  `will-change` chmur pod reduced-motion (`6bc7155`), usunięcie kluczy `demo.*`
  (`af0bc47`), cache przeglądarek Playwright + pin wersji w CI (`7a84e04`, PR #47).
  💡 **Lekcja:** serif tylko italic (bez preloadu prostej odmiany) — notatka
  `visual-corrections-part1-branch.md`.
- **Mikro-feature'y UI.** Frosted glass na BackButton (`22cae75 · 20.07`), logo
  domowe zamiast back-buttona przy otwartym menu mobile (`1b71248`), nakładka
  „ładowania" przy przejściach route na mobile (`d243c09`), wyczyszczenie burgera
  gdy dokuje przyklejone pole wyszukiwarki FAQ + fix placeholdera (`7009cb7 · 20.07`).
  💡 **Lekcja (ważna):** nakładka „ładowania" **tylko przy nawigacji między
  stronami** (próg 250 ms) — entry-overlay na wejściu jest **zakazany**: łamie
  LCP głównej i a11y `.pp-sub` podstron. Notatka `loading-overlay-route-only.md`.
- **Ostatni commit (na dziś):** baseline'y darwin dla BackButton glass + FAQ
  placeholder (`972097f · 20.07`).

---

## Wątki przekrojowe (przez cały projekt)

Rzeczy, które nie są jedną fazą, tylko przewijają się przez całość — warto je
znać, wchodząc w kolejny projekt:

- **Docs-first.** Każda większa sekcja/decyzja/refactor poprzedzone analizą
  `analiza-*.md` w `docs/` (po polsku, numerowane etapy). Statusy pilnowane w
  `docs/README.md` (bannery HISTORIC dla nieaktualnych). To dało spójność i
  „pamięć decyzji".
- **Testy jako bramka, nie dodatek.** Od Fazy 7 każdy PR bramkowany przez unit +
  e2e + visual + Lighthouse. Baseline'y wizualne **per-platforma** (darwin +
  linux), zamierzona zmiana wyglądu = kod + oba komplety w jednym PR.
- **Walka z platformami mobilnymi.** Największy ukryty koszt: Android (limit
  warstwy GPU, spłaszczanie 3D), iOS (Low Power Mode, mimowolna pauza wideo,
  zwijany toolbar/metryki viewportu, zimny cache). Emulacja **nie wykrywa** tych
  rzeczy — potrzebny test na fizycznym urządzeniu.
- **Wydajność jako ratchet.** Budżety LHCI i allowlista axe działają jak zapadki
  — nie mogą się cofnąć bez świadomej decyzji.
- **Ewolucja architektury informacji.** Strona przeszła drogę: monolit → sekcje
  na jednej stronie (one-pager) → **podstrony z zajawkami** na głównej. Nawigacja
  ewoluowała z kotwic (`#anchor`) do linków do podstron.
- **Świadome trade-offy.** Wypieczone wideo zamiast żywych stron, statyczne tło
  mobile zamiast animowanego, spłaszczona scena 3D na mobile, zaakceptowany skok
  paska URL na mobile — wszystko udokumentowane jako świadome decyzje, nie
  przypadek.

---

## Rekomendacje: kolejność i optymalizacja pracy przy następnych projektach

Poniżej wnioski „gdybym robił to jeszcze raz" — proponowana kolejność, rzeczy do
zrobienia wcześniej, pułapki i rzeczy potencjalnie zrobione przedwcześnie/zbędnie.
To jest część, którą warto z czasem najbardziej doszlifować w szablon.

### A. Proponowana optymalna kolejność (szkielet następnego projektu)

1. **Fundament (dzień 1):** Astro static + i18n + design tokeny w `:root` +
   self-hosted fonty + architektura „strona = sekcje". *Tak było — zostaw.*
2. **Ekosystem asystenta + guardraile (dzień 1–2, WCZEŚNIEJ niż tym razem):**
   `CLAUDE.md`, `settings.json` z blokadami (commit/push, baseline'y), reguły,
   skille. Tym razem powstało dopiero 6 lipca (Faza 6) — a przyspiesza *całą*
   resztę. **Rekomendacja: rób to zaraz po scaffoldzie.**
3. **Hosting + domena + CMS + deploy „pusty" (WCZEŚNIEJ):** postaw pustą stronę
   na produkcji (Cloudflare Pages), podłącz domenę, CMS (Sveltia) i R2 **zanim**
   zbudujesz sekcje. Tym razem produkcja ruszyła 3 lipca, po ~3 tygodniach pracy
   nad hero. **Rekomendacja: „deploy w dniu 1" — im wcześniej jest żywy pipeline,
   tym wcześniej łapiesz problemy produkcyjne (fonty, transformacje obrazów,
   nagłówki).**
4. **Testy jako szkielet (WCZEŚNIEJ, choć nie w dniu 1):** minimalny harness
   wizualny + CI **zanim** zbudujesz kruche animacje. Tym razem harness hero
   powstał (Faza 5) tuż przed pełnymi testami (Faza 7) — czyli *po* całej walce
   z hero. Gdyby był wcześniej, wiele iteracji hero (Faza 1) byłoby tańszych.
   **Rekomendacja: postaw visual-regression + prod-smoke wcześnie, rozbudowuj
   stopniowo.**
5. **Rusztowanie sekcji (placeholdery) + nawigacja:** *tak było (Faza 2) — dobra
   kolejność.*
6. **Sekcje treściowe po jednej, każda: analiza → implementacja → testy →
   baseline'y → PR:** *tak było (Faza 8) — wzorowa, powtarzalna pętla. Zostaw.*
7. **Formularz/backend, polityka prywatności:** *dobrze umiejscowione (Faza 9).*
8. **Refactor porządkujący + polish:** *dobrze na końcu (Fazy 10–13), po tym jak
   widać realny wspólny mianownik.*

### B. Co przenieść „w lewo" (zacząć wcześniej)

- **Decyzja o architekturze podstron vs one-pager — na starcie.** Największy
  przerób projektu to migracja sekcji z jednej strony na podstrony (Faza 12,
  16–19 lipca) — praktycznie przepisanie chrome'u każdej sekcji + globalny
  mechanizm „wstecz" doklejany później (`data-back`, dopiero 12 lipca). Gdyby
  decyzja „to będą podstrony" zapadła na początku, uniknąłbyś budowania sekcji
  jako one-pager i przerabiania ich później. **To prawdopodobnie największa
  oszczędność czasu na następny raz.**
- **Globalny mechanizm nawigacji (BackButton, Footer, `smoothScroll` prop,
  history-back) jako element chrome'u od początku**, nie doklejany przy pierwszej
  podstronie.
- **Wzorzec przycisków/CTA (`SolidButton`, animowane CTA) ustalony wcześniej** —
  unifikacja CTA (Faza 13) sprzątała po kilku wariantach. Jeden komponent
  przycisku od startu = mniej sprzątania.
- **Preload fontów + gate pierwszego paintu przeciw FOUC** — rozwiązane dopiero
  18 lipca (`815191e`). Prosty, znany problem — warto mieć w boilerplate od razu.

### C. Pułapki, o których łatwo zapomnieć (checklist na przyszłość)

- **Baseline'y wizualne per-platforma i ich kolejność** (kod → linux workflow →
  darwin na końcu; bot-push nie wyzwala CI). Bardzo łatwo się na tym potknąć.
- **Test na fizycznym urządzeniu** dla: limitu warstwy GPU Androida, iOS Low
  Power Mode, zwijanego toolbara Safari, zimnego cache. Emulacja tego nie łapie.
- **Osierocone pliki w R2** — Sveltia nie kasuje mediów przy usuwaniu wpisu.
  Zaplanuj okresowe sprzątanie.
- **Nagłówek/metryka viewportu współdzielona przez sekcję i ScrollTrigger** —
  inaczej zimny start iOS odpina sticky za wcześnie.
- **A11y (axe) i budżety LHCI jako ratchet** — pilnuj kierunku (tylko w górę
  jakościowo), nie „naprawiaj" czerwonego przez rozluźnienie progu.
- **Favicon + zestaw ikon + OG previews** — łatwe do przeoczenia, a robi różnicę
  przy udostępnianiu.
- **Skrzynka pocztowa + DNS (Resend na subdomenie, poczta nietknięta)** —
  rozdzielenie DNS maila transakcyjnego od skrzynki firmowej.

### D. Co być może zrobione zbyt wcześnie / zbyt drogo

- **Ogromny nakład na hero przed testami i przed produkcją.** Faza 1 (14 dni
  iteracji hero) poprzedziła i testy, i deploy. Część kosztu (powtarzane
  poprawki wideo/3D/Android) byłaby tańsza z harnessem wizualnym w ręku.
  **Rekomendacja: najbardziej kruchy/autorski element rób z siatką bezpieczeństwa
  od początku, albo zbuduj go jako drugi (po prostszych sekcjach), gdy masz już
  testy.**
- **Retuning stałych scrolla „na oko" wielokrotnie** (`0640aa1` → `99ef97a`,
  regresja ze scalenia stałych desktop/touch). Rozdzielenie stałych i ich
  udokumentowanie wcześniej zaoszczędziłoby rundę regresji.
- **Wielokrotne re-baseline'y LHCI** przy każdej nowej sekcji — to normalne, ale
  warto od razu ustawić budżety z zapasem na spodziewany wzrost (albo mierzyć
  per-route), żeby nie robić osobnego PR-a „re-baseline" za każdym razem.

### E. Czego (potencjalnie) brakuje / warto rozważyć

- **Analytics / privacy-friendly pomiar ruchu** (jeśli jeszcze nie ma) — brak w
  historii.
- **Monitoring uptime / alerty produkcyjne** poza prod-smoke po deployu.
- **Sitemap.xml + weryfikacja w Search Console** (jest robots.txt i SEO w e2e,
  ale sitemap nie widać w historii — warto sprawdzić).
- **Backup/eksport treści CMS** (JSON-y są w repo, ale media tylko w R2 — rozważ
  politykę backupu R2).
- **Szablon/boilerplate** wyekstrahowany z tego projektu: chrome podstron,
  BackButton/Footer, `SolidButton`, system toastów, tło ambient, harness testów,
  `CLAUDE.md` + skille. To naturalny „produkt uboczny", który przyspieszy każdy
  kolejny projekt — i po to m.in. powstaje ten dokument.

---

*Dokument wygenerowany z analizy pełnej historii git (267 commitów,
12.06–20.07.2026) oraz `docs/` i notatek projektu. Do dalszej redakcji: usuwaj/
łącz punkty oznaczone 🔧 przy budowie uniwersalnego szablonu, zachowuj 💡 i ⤴️.*
