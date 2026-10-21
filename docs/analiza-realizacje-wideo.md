# Analiza — wideo w podglądzie realizacji (Modal / BottomSheet)

Data: 2026-10-20 · Branch: `docs/evolution-analysis-and-video-plan`
Kontekst nadrzędny: `docs/analiza-ewolucja-vs-nowsze-projekty.md` (backlog
powrotu do hadrianm-web; ten dokument to punkt **R1** tamtego backlogu).

> **Status: PLAN ZAAKCEPTOWANY co do założeń (sesja pytań 2026-10-20),
> wdrożenie w etapach — żaden etap jeszcze nie ruszył.** Decyzje D1–D13
> są zapadłe; „decyzje wykonawcze" §4 można korygować w trakcie, ale każdą
> korektę dopisz tu (jak w innych planach). Etapy wdrażane w osobnych
> sesjach, każdy = osobny PR (proces: §7 i `docs/daily-workflow.md`).

## 1. Cel

Dziś podgląd realizacji (`WorkDetail` w Modalu na desktopie i w BottomSheecie
na mobile) pokazuje na parze urządzeń (`WorkDeviceDuo`: laptop + telefon)
**statyczne zrzuty** każdego ekranu. Docelowo **pierwszy ekran** (ten na samej
górze, klucz `home`) ma na obu urządzeniach odtwarzać **wideo**:

1. 2–3 s nieruchomego widoku strony „po wejściu",
2. przewinięcie w dół do ustalonego punktu,
3. powrót na górę,
4. pętla bez widocznego szwu.

Pozostałe ekrany (galeria, rezerwacja itp.) zostają statyczne. Kafelki na
liście (strona główna, karuzela mobile, `/realizacje/`) zostają statyczne.
Przy `prefers-reduced-motion: reduce` wszędzie zostają statyczne zdjęcia
(decyzja Mateusza).

Drugi cel, realizowany TYM SAMYM mechanizmem: trzy placeholdery AI (aura, dab,
sielski) zastąpią trzy prawdziwe realizacje — **delung.pl**,
**pracownia-eha.pl**, **hetmannieruchomosci.com** (zgoda klientów: jest;
Hetman może być pokazany mimo pracy pod adresem podglądu). Treść wchodzi
przez panel Sveltia dopiero PO wdrożeniu schematu (żeby wpisywać raz).

## 2. Stan obecny (inwentaryzacja — na czym budujemy)

| Element | Gdzie | Co ważne dla wideo |
| --- | --- | --- |
| Schemat wpisu | `src/content.schema.ts` (Zod, źródło prawdy) → `src/content.config.ts` | `screens[]` = `{key, label{pl,en}, desktop, mobile}`; min. 1 ekran; zmiana schematu = **3 miejsca** (Zod, `public/admin/config.yml`, `src/components/sections/work/*`) — reguła `.claude/rules/cms-realizacje.md` |
| Panel CMS | `public/admin/config.yml` | zdjęcia przez pola `image` → R2 (`media.hadrianm.pl/realizacje/…`); Sveltia **nie wgrywa plików przez bibliotekę Assets**, nie kasuje z R2 |
| Para urządzeń | `src/components/sections/work/WorkDeviceDuo.astro` | `<picture>` z `imgAt()` (320/960 px); ekran laptopa = `(lap-w − 26px) × 0.625` (aspekt **1.6**), ekran telefonu = `(phone-w − 12px) × 2.0513` (aspekt **0.4875**); `object-fit: cover` |
| Szczegóły | `WorkDetail.astro` | renderowane w `<template data-work-detail=slug>` per projekt w `Work.astro` / `WorkIndexPage`; **klonowane do nakładki przy otwarciu**, host czyszczony po zamknięciu (`open-detail.ts`) — zawartość `<template>` jest inertna: nic się nie ładuje przed otwarciem |
| Nakładki | `src/scripts/overlay.ts` | `window.overlay.open(id, {onClose})` — mamy hak po zamknięciu; brak haka „po otwarciu", ale `openWorkDetail` sam klonuje treść, więc może zrobić `play()` tuż po |
| Wideo w hero | `DeviceScene.astro` + `android-mobile.ts` + `scripts/capture-device-videos.mjs` | gotowy wzorzec: `<video muted playsinline loop preload="none" poster data-src>`, src wpinany z JS, `play().catch(→ autoplayBlocked)`, nagranie klatka-po-klatce Playwrightem + ffmpeg dwuprzebiegowo pod twardy limit wagi, poster z klatki 0 przez `cwebp` |
| Testy | `tests/e2e/work.spec.ts`, `tests/visual/sections.spec.ts` (work-modal/work-sheet = zrzut viewportu), `tests/unit/cms-contract.test.ts`, `tests/unit/media-r2.test.ts` (łapie KAŻDY URL `media.hadrianm.pl`, także `.mp4`) | wideo na zrzutach zawsze przez `mask` (kontrakt testów); hero sprawdza odtwarzanie funkcjonalnie (`paused=false`, `currentTime` rośnie) — ten sam wzorzec tu |
| Narzędzia lokalne | `ffmpeg`, `cwebp` (brew), Playwright 1.61 (chromium + webkit) | jest wszystko; **brak `wrangler`** — upload do R2 przez dashboard Cloudflare lub skrypt S3 (precedens: hetman używa `@aws-sdk/client-s3`) |

## 3. Decyzje (ustalone z Mateuszem 2026-10-20)

| # | Temat | Decyzja |
| --- | --- | --- |
| D1 | Zakres wideo | **Tylko pierwszy ekran** w `WorkDetail` (`screens[0]`, w praktyce `home`), **oba urządzenia** (laptop i telefon — pokazują responsywność). Kafelki list: statyczne. Pozostałe ekrany: statyczne. |
| D2 | Model danych | Każdy ekran dostaje **opcjonalne** pole `video: { desktop: string, mobile: string }` (URL-e). Pola `desktop`/`mobile` (zdjęcia) **zostają wymagane** — są posterem, fallbackiem reduce-motion, obrazem kafelka. Schemat pozwala na wideo na dowolnym ekranie; UI renderuje je tam, gdzie jest (D1 to konwencja treści, nie twardy limit). |
| D3 | CMS | Pola wideo jako **`widget: file`** (upload MP4 z panelu prosto do R2), `required: false`. **Korekta względem sesji pytań** (tam: string + upload ręczny): raport z delung-web i pracownia-eha-web pokazał, że widget `file` z biblioteką `cloudflare_r2` **działa** (spike delung, range requests OK, produkcyjnie od 2026-08-05; reguła „tylko pola Image" w `cms-realizacje.md` jest nieaktualna — Assets-library nadal nie działa). Razem z tym: `media_libraries.all.slugify_filename: true` (plik z telefonu lądował w R2 jako `Img 9635.mp4` — incydent EHA). Plan B, gdyby binarium 0.170.0 hadrianm nie wgrywało: pole `string` z URL + upload przez dashboard R2 (§8). **Aktualizacja 2026-10-21:** M2 wdrożone — panel na 0.178.0, tej samej wersji, w której delung/eha wgrywają MP4 przez `widget: file` produkcyjnie; plan B zostaje tylko awaryjnie. |
| D4 | Hosting | R2, bucket `hadrianm-media`, prefix **`realizacje/video/`**, nazwy `<slug>-<key>-desktop.mp4` / `<slug>-<key>-mobile.mp4`, `Content-Type: video/mp4`. Bez Cloudflare Stream. Postery = zwykłe zdjęcia ekranu (pole Image), serwowane przez `imgAt()`. |
| D5 | Odtwarzanie | `<video muted playsinline loop preload="none">` **bez** atrybutu `autoplay` i **bez polegania na atrybucie `poster`** — pomiar z delung (produkcja, `analiza-poprawki-4.md`): Chromium przy `preload="none"` nie pobiera `poster` nigdy (0/7), WebKit rozciąga go; posterem jest istniejący `<picture>` pod spodem (§4). `src` wpinane z JS (`data-src`) dopiero po otwarciu nakładki, `play()` z `.catch` (brak zgody = widać zdjęcie). Przy zamknięciu: `pause()`, zdjęcie `src`, `load()` (zwolnienie dekodera) — host i tak jest czyszczony. |
| D6 | Reduced motion | Przy `prefers-reduced-motion: reduce` **wideo nie jest ani renderowane w DOM nakładki, ani ładowane** — zostaje `<picture>` jak dziś. Bramka w JS (`matchMedia`) + CSS obronnie. Poster = ten sam obraz, więc brak zgody na autoplay (iOS Low Power Mode) daje identyczny efekt jak reduce. |
| D7 | Choreografia (wypieczona w pliku) | hold **2.5 s** na górze → zjazd do punktu `D` przez **4 s** (smootherstep) → hold **0.8 s** → powrót na górę przez **3 s** → hold **0.7 s** → cięcie do klatki 0 (ta sama pozycja, zero szwu). Łącznie ~11 s, 30 fps. `D` = min(2.2 × wysokość viewportu, maks. scroll strony) na desktopie, min(2.5 × vh, maks.) na telefonie; parametry per strona do strojenia w skrypcie (CLI). |
| D8 | Nagranie | Nowy skrypt `scripts/capture-site-videos.mjs` (Playwright chromium, **strona publiczna klienta**), klatka-po-klatce: ustaw `scrollTo(y(t))`, posuń czas deterministycznie, zrzut viewportu; enkod jak w hero (libx264, 2-pass, limit wagi), poster WebP z klatki 0. Viewporty dobrane do aspektów `WorkDeviceDuo`: desktop **1440×900** (1.6), telefon **390×800** (0.4875), DPR 1; finalne szerokości 720 px / 432 px (jak hero). |
| D9 | Determinizm czasu | Animacje „na czas" (reveal, przejścia CSS) na stronach klientów nie mogą zależeć od tempa zrzutów. Pierwszy wybór: **CDP `Emulation.setVirtualTimePolicy`** (budżet 1000/30 ms na klatkę). Fallback (gdy strona się na tym wywraca): `recordVideo` kontekstu Playwrighta w czasie rzeczywistym + ffmpeg. Decyzja po spike'u (Etap 1). |
| D10 | Testy | e2e: po otwarciu nakładki wideo ma `src`, gra (`paused=false`, `currentTime` rośnie) na profilach chromium; na webkit tylko atrybuty + poster. Wizualne: `mask` na `.wd__video` w work-modal/work-sheet (+ `/realizacje/`); baseline'y tych klatek do regeneracji (darwin + workflow linux) PO akceptacji. Unit: kontrakt CMS (bez zmian), test schematu dla `video` opcjonalnego, `media-r2` bez zmian (regex łapie `.mp4`). |
| D11 | Budżety | Wideo nie dotyka strony głównej (treść w `<template>` jest inertna, `preload="none"`) → LHCI bez zmian. Koszt danych: ~1.3 MB na otwartą realizację na mobile — akceptowalny; `navigator.connection.saveData` → COULD (§9). |
| D12 | Self-heal iOS | **Nie** przenosimy mechanizmu self-heal z hero (`android-mobile.ts`). Nakładka żyje krótko; jedna próba `play()` przy otwarciu + ponowna przy `visibilitychange→visible`, nic więcej. |
| D13 | Dostępność | `<video>` dekoracyjne: `aria-hidden="true"`, bez `controls`, nie w kolejności fokusu; `<img>` z `alt` zostaje w DOM (poster semantyczny). Hero ma już `<video>` bez `<track>` i axe przechodzi — ten sam stan. |

### 3.1. Precedens w rodzinie projektów (delung-web, pracownia-eha-web)

Obie nowsze strony mają wideo w realizacjach, ale w INNYM modelu: klip
klienta (H.264, do 30 MB, HandBrake), galeria jako `discriminatedUnion`
zdjęcie/film, odtwarzanie **na tap** w lightboxie, miniatura przez Cloudflare
Media Transformations (`/cdn-cgi/media/mode=frame`). Z tego modelu bierzemy
tylko to, co pasuje do autoplay-pętli:

- upload MP4 przez `widget: file` → R2 (D3) + `slugify_filename`,
- `<img>` jako poster zamiast atrybutu `poster` (D5),
- `preload="none"`, `playsinline`, pauza i czyszczenie hosta przy zamknięciu,
- wideo i poster ZAWSZE pod maską w testach wizualnych, e2e `paused===false`,
- `media-r2.test.ts` robi HEAD także po `.mp4` (regex łapie wszystko).

NIE bierzemy: `videoFrameAt()` / `cdn-cgi/media` (poster to klatka 0
z naszego nagrania — identyczna z pierwszą klatką, bez ryzyka czarnej klatki
i 20-dniowego cache'u), lightboxu, pola `duration`, limitu 30 MB (nasze
pliki ≤ 800 KB), odtwarzania na tap.

## 4. Decyzje wykonawcze (porządkowe)

- **Warstwowanie w `WorkDeviceDuo`**: `<picture>` zostaje jak dziś (pierwsza
  w DOM, zawsze widoczna); `<video class="wd__video">` renderowane
  warunkowo (`video` w propsach), `position: absolute; inset: 0; object-fit:
  cover; opacity: 0`; klasa `is-playing` (dodawana po zdarzeniu `playing`)
  → `opacity: 1` z krótkim fade 0.25 s. Dzięki temu przy braku autoplay
  lub w trakcie buforowania użytkownik widzi poster z `imgAt()`, a nie czarny
  prostokąt.
- **Hook odtwarzania w `open-detail.ts`** (nie w `overlay.ts` — overlay jest
  generyczny): po `host.replaceChildren(clone)` → `armVideos(host)`; w
  `onClose` → `disarmVideos(host)` przed `replaceChildren()`. Moduł
  `work-video.ts` (sekcja work) trzyma: bramkę reduce (`matchMedia`), wpięcie
  `src` z `data-src`, `play().catch`, retry przy `visibilitychange`.
- **Jedno źródło prawdy o nazwach plików**: skrypt nagrywający wypisuje na
  końcu gotowe URL-e R2 do wklejenia w panel (`https://media.hadrianm.pl/
  realizacje/video/<slug>-home-desktop.mp4` …) — Mateusz kopiuje, nie
  składa ręcznie.
- **Poster = klatka 0 nagrania**: skrypt zapisuje też `<slug>-home-desktop.webp`
  / `-mobile.webp` (klatka 0, szerokości 1920/800 px zgodnie ze skillem
  `/new-realizacja`). Te pliki Mateusz wgrywa przez pola Image ekranu `home`
  w Sveltii. Efekt: pierwsza klatka wideo i poster są identyczne → zero skoku
  przy starcie i w pętli; kafelki list pokazują ten sam kadr.
- **Nakładki stron klientów** (cookie-bannery, toasty, chat): skrypt ma
  opcję `--hide "<selektor>,<selektor>"` wstrzykującą `display:none`
  przed pierwszą klatką; listę per strona ustalamy w Etapie 5 (dziś: żadna
  z trzech stron nie ma cookie-bannera — do potwierdzenia na żywo).
- **Lenis/GSAP na stronach klientów**: delung, EHA i Hetman nie używają
  Lenisa (natywny scroll) — `window.scrollTo` + `rAF` wystarcza; gdyby
  jakaś przyszła realizacja miała Lenisa, skrypt dostaje opcję
  `--lenis` (wywołanie `window.__lenis.scrollTo(y, {immediate:true})`,
  jak w `tests/helpers/scroll.ts`).
- **Typy**: `WorkScreen`/`LocalizedScreen` w `work-data.ts` dostają
  `video?: { desktop: string; mobile: string }`; `localizeProject`
  przepuszcza pole bez zmian (nie jest tłumaczone).
- **Nazwy klas**: `wd__video`, `wd__video--laptop`, `wd__video--phone`;
  maska w testach wizualnych celuje w `.wd__video` (analogicznie do
  `.screen__video` w hero).
- **Bez zmian w `imgAt()`** — wideo nie przechodzi przez
  `/cdn-cgi/image` (to nie obraz); URL mp4 używany 1:1.

## 5. Zmiany w plikach (mapa)

| Plik | Zmiana |
| --- | --- |
| `src/content.schema.ts` | `screens[].video: z.object({desktop: z.string().url(), mobile: z.string().url()}).optional()` |
| `public/admin/config.yml` | w liście „Ekrany": obiekt `video` (`required: false`) z dwoma polami `widget: file` (`accept: video/mp4` jeśli wersja Sveltii wspiera, inaczej hint) + `media_libraries.all.slugify_filename: true` + `hint` „tylko nagrania ze skryptu `capture:site`" |
| `src/components/sections/work/work-data.ts` | typy + przepuszczenie pola |
| `src/components/sections/work/WorkDeviceDuo.astro` | props `videoDesktop?`, `videoMobile?`; markup `<video>` + CSS warstwy |
| `src/components/sections/work/WorkDetail.astro` | przekazanie `s.video` do duetu (tylko gdy jest) |
| `src/components/sections/work/work-video.ts` (NOWY) | `armVideos(host)`, `disarmVideos(host)`, bramka reduce, retry visibility |
| `src/components/sections/work/open-detail.ts` | wywołania arm/disarm |
| `scripts/capture-site-videos.mjs` (NOWY) | nagranie + enkod + postery; CLI: `--url --slug --key home --hide … --depth-desktop 2.2 --depth-mobile 2.5 --hold 2.5` |
| `package.json` | `"capture:site": "node scripts/capture-site-videos.mjs"` |
| `tests/unit/cms-contract.test.ts` | + przypadek: wpis z `video` i bez `video` przechodzi, `video` bez `mobile` nie |
| `tests/e2e/work.spec.ts`, `tests/e2e/work-index.spec.ts` | asercje odtwarzania/atrybutów (D10) — warunkowo, gdy pierwszy wpis ma `video` |
| `tests/visual/sections.spec.ts`, `tests/visual/work-index.spec.ts` | `mask: [page.locator(".wd__video")]` |
| `.claude/rules/cms-realizacje.md`, `.claude/rules/capture-scripts.md`, `.claude/skills/new-realizacja/SKILL.md`, `CLAUDE.md` (komendy) | dokumentacja operacyjna nowego pola i skryptu |
| `docs/README.md` | wpis tego dokumentu + aktualizacja statusu po wdrożeniu |

## 6. Etapy

1. **Spike nagrania (bez zmian w `src/`)** — `scripts/capture-site-videos.mjs`
   v0 na `https://delung.pl`, tylko desktop, 90 klatek, dwa warianty czasu
   (virtual time vs `recordVideo`). Wynik: dwa MP4 w katalogu poza repo;
   Mateusz ogląda, wybiera wariant (D9), stroi głębokość/holdy (D7). Kryterium:
   brak „przyspieszonych" animacji wejścia, płynny scroll, waga ≤ 800 KB.
   Commit: `feat(scripts): add site video capture spike`.
2. **Schemat + CMS + typy** — Zod, `config.yml`, `work-data.ts`, unit testy.
   Istniejące JSON-y (bez `video`) przechodzą bez zmian. Commit:
   `feat(cms): optional per-screen video urls`.
3. **Komponenty + odtwarzanie** — `WorkDeviceDuo`, `WorkDetail`,
   `work-video.ts`, `open-detail.ts`, CSS, bramka reduce. Lokalna
   weryfikacja na tymczasowym wpisie? **Nie** — JSON-ów nie edytujemy
   ręcznie; do podglądu lokalnego użyj gałęzi testowej panelu? Też nie
   (panel pisze na main). Rozwiązanie: w Etapie 3 testujemy przez
   **fixture w teście e2e** (route-mock `page.route` podmieniający odpowiedź
   HTML? zbyt inwazyjne) → prościej: Etap 3 wdraża kod „ślepy" (brak wpisu
   z wideo = brak zmian w DOM, co widać w testach), a pierwszy realny wpis
   z wideo powstaje w Etapie 6 i tam wykonujemy pełną weryfikację wizualną.
   Commit: `feat(work): play per-screen videos in WorkDetail`.
4. **Testy** — e2e (warunkowe na obecności `video` w pierwszym wpisie),
   maski w visual. Bez regeneracji baseline'ów (maska bez wideo w DOM nic nie
   zmienia). Commit: `test(work): cover video playback and mask videos`.
   Etapy 2–4 mogą iść w JEDNYM PR (`feat/work-video`).
5. **Nagrania** — 3 strony × (desktop + mobile) + 6 posterów; `--hide` per
   strona; pliki czekają w katalogu poza repo (upload robi panel w Etapie 6
   przez pola `file`/`image`; `HEAD` na URL-ach: `CHECK_REMOTE_MEDIA=1` po
   wpisie). Nic do commitu poza ewentualnym strojeniem skryptu.
   **Warunek wstępny Etapu 6**: punkt **T1** backlogu ewolucji (zamrożony
   fixture treści dla `test:visual`) — inaczej każda zmiana wpisu w panelu
   rozjeżdża baseline'y siatki i kafelków (incydent szablonu 2026-08-05).
6. **Treść** — Mateusz w panelu: 3 nowe wpisy (delung, pracownia-eha,
   hetman) z posterami przez pola Image + URL-e wideo; usunięcie aura/dab/
   sielski; sprzątanie sierot w R2 (ręcznie). Potem lokalnie: `git pull`,
   `pnpm test:unit`, `pnpm build && pnpm test:visual` → diffy work-modal/
   work-sheet/work-index i kafelków → akceptacja → baseline'y darwin +
   workflow linux (kolejność z `daily-workflow.md`). Zależność: teksty wpisów
   (intro, wyniki, cytaty, zakres PL/EN) — patrz §9 „results/quote
   opcjonalne" w backlogu ewolucji (punkt **R2**), który powinien wejść
   PRZED tym etapem, żeby nie wymyślać metryk.
7. **Weryfikacja na urządzeniach** — iPhone (Safari, Low Power Mode: poster
   zamiast wideo, bez czarnego prostokąta), Android Chrome (pętla bez
   zacięcia, zamknięcie sheeta zwalnia wideo), desktop Safari/Chrome/Firefox;
   `/release-check`.

## 7. Proces

Jeden etap = jedna sesja Claude Code = jeden PR (albo Etapy 2–4 razem).
Każda sesja zaczyna od tego dokumentu (§3–§5) i kończy dopisaniem statusu
do odpowiedniego etapu (✅ / korekta decyzji). Baseline'y wizualne
regenerujemy RAZ, w Etapie 6, po pokazaniu diffów.

## 8. Plan B uploadu (gdy widget `file` zawiedzie)

Dashboard R2 (6 plików, ręcznie) albo `scripts/upload-r2.mjs` na
`@aws-sdk/client-s3` (precedens w hetmannieruchomosci-web), klucze w `.env`
(nieczytane przez Claude'a — reguła 4 z `CLAUDE.md`), `ContentType`
z rozszerzenia, `--dry-run`. Wtedy pola w panelu wracają do `string` (URL).

## 9. Czego ten plan NIE robi

- Nie zmienia sceny urządzeń w hero (drewelomet) — osobny punkt backlogu.
- Nie dodaje wideo na kafelkach (hover-play) — COULD po wdrożeniu.
- Nie wprowadza Cloudflare Stream ani adaptacyjnego bitrate'u.
- Nie tworzy podstron per realizacja (`/realizacje/<slug>/`).
- Nie zmienia pól treści (`results`, `quote` → opcjonalne) — to punkt **R2**
  backlogu ewolucji, wdrażany przed Etapem 6.

## 10. Ryzyka i gotchas (do sprawdzenia na etapach)

- **Autoplay w WebKit (emulacja)**: Playwright WebKit potrafi odrzucać
  `play()` nawet dla muted — stąd D10 (asercje odtwarzania tylko chromium).
  Nie obchodź przez `--autoplay-policy` w webkit; to nie jest Safari.
- **iOS Low Power Mode**: `play()` odrzucone → poster. Sprawdzić, że nie ma
  pętli retry (Etap 7). Mechanizm z hero celowo NIE kopiowany (D12).
- **Pętla a `loop`**: szew widoczny tylko wtedy, gdy klatka 0 ≠ ostatnia
  klatka — choreografia kończy na górze z holdem, więc szwu nie ma; nie
  próbować „crossfade'u" w runtime.
- **Zrzuty wizualne**: wideo pod maską, ale **poster pod maską też znika** —
  maska to czarny prostokąt; baseline'y work-modal/work-sheet zmienią się
  raz (Etap 6) i tyle.
- **`<template>`**: Astro renderuje zawartość `<template>` jako inertny
  DocumentFragment — `<video preload="none">` bez `src` nie pobiera nic;
  po sklonowaniu `data-src` → `src` dopiero w `armVideos`. Nie dodawać
  `autoplay` w markupie (w klonie mogłoby ruszyć przed bramką reduce).
- **Strony klientów zmieniają się**: nagranie to migawka; po redesignie
  klienta uruchamiamy skrypt ponownie (dlatego skrypt, nie ręczne nagranie).
- **Hetman pod `nowa.`**: nagrywamy z adresu podglądu (noindex nie
  przeszkadza), po przełączeniu domeny `liveUrl` w panelu do podmiany.
