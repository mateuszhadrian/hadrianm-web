# Rejestr decyzji — zapadłe, nie otwierać bez nowego pomiaru

> **Status: AKTUALNY — rejestr żywy** (założony 2026-10-25 w paczce P9,
> punkt D3 `analiza-ewolucja-vs-nowsze-projekty.md` §6). Jedna linia na
> decyzję + odsyłacz do miejsca, gdzie leży uzasadnienie (plik + sekcja).
> Uzasadnień tu NIE kopiujemy — rejestr ma odpowiadać na pytanie „czy to
> już było rozstrzygnięte i gdzie", nie zastępować analiz.
>
> Bramka startowa sesji (`sesja-utrzymaniowa-szablon.md` pkt 0.4) czyta
> ten plik zamiast pamięci rozproszonej. Nowa decyzja ze skutkami = nowy
> wiersz w tym samym PR. Zmiana decyzji = nowy wiersz z odsyłaczem do
> starego (stary dostaje status „zastąpiona przez DEC-nn"), nie edycja
> w miejscu. Sprzeczność między pamięcią sesji a kodem/docs → kod wygrywa,
> rozbieżność odnotowana w kolumnie „Status".
>
> Statusy: **obowiązuje** · **obowiązuje (naprawiony bug — nie cofać)** ·
> **odrzucone** (żeby nie wracało) · **zastąpiona przez …** ·
> **przeformułowana**. Numeracja `DEC-nn` jest niezależna od punktów
> backlogu (`D1–D5`, `H1`…) i decyzji planu wideo (`D1–D14`).

---

## A. Architektura, hosting, CMS

| # | Decyzja | Gdzie uzasadnienie | Status |
| --- | --- | --- | --- |
| DEC-01 | Astro **static** (bez SSR), nie Next.js; PL pod `/`, EN pod `/en/` (`prefixDefaultLocale: false`) | `hosting_first_analysis.md`; `analiza-stack-struktura-hosting.md` (HISTORYCZNY — stary wybór Next unieważniony) | obowiązuje |
| DEC-02 | Hosting Cloudflare Pages, deploy z `main`; **main = produkcja**, chroniony required checks `quality`/`e2e`/`lighthouse` | `hosting_first_analysis.md`; `testing-tools-and-environemnts-setup-analysis.md` Etap 6; `daily-workflow.md` | obowiązuje |
| DEC-03 | CMS = **Sveltia** (Git-based, pisze JSON przez GitHub API na main), nie Sanity; Sanity zachowane jako opcja dla projektów klienckich | `hosting_second_analysis_sveltia.md`; `hosting_second_analysis_sanity.md` (wariant odrzucony); `additional-architecture-adjustment-admin-client.md` | obowiązuje |
| DEC-04 | Panel pisze **bezpośrednio na main** (jedyny legalny wyjątek od PR-ów); po edycji treści `git pull` + `pnpm test:unit` | `daily-workflow.md` „Nowa realizacja (CMS)"; ewolucja §8 pkt 6 | obowiązuje |
| DEC-05 | Media realizacji w **R2** (`hadrianm-media`, `media.hadrianm.pl`), nigdy w repo; rozmiary wyłącznie przez `imgAt()` = Cloudflare Image Transformations | `photos-management-for-cms-analysis.md`; `.claude/rules/cms-realizacje.md` „Media" | obowiązuje |
| DEC-06 | Schemat treści zmienia się w **trzech miejscach naraz** (Zod `content.schema.ts` → `config.yml` → konsumenci `work/*`); Zod jest źródłem prawdy | `.claude/rules/cms-realizacje.md` „Schemat danych" | obowiązuje |
| DEC-07 | Sveltia przypięta do **wersji sprawdzonej produkcyjnie w rodzinie** (0.178.0), nie do najnowszej; bump wg procedury sondy binarium | ewolucja §6 **M2**, §10 sesja 1; `optional-todos.md` C3 | obowiązuje |
| DEC-08 | `config.yml`: `site_domain`, slugi ASCII z `clean_accents`, `slugify_filename` dla uploadów | ewolucja §4.5, §6 **M1** | obowiązuje |
| DEC-09 | Pola `results`, `quote`/`author`/`role` **opcjonalne** — nie wymyślamy metryk ani cytatów | ewolucja §6 **R2**; `cms-realizacje.md` pkt 4 | obowiązuje |
| DEC-10 | Upload do R2 przez pola `image` **i `file`** (MP4); biblioteka Assets poza polem NIE trafia do R2; Sveltia nie kasuje z R2 | `analiza-realizacje-wideo.md` §3 D3; `cms-realizacje.md` „Media" | obowiązuje — **uwaga:** pamięć `cms-hosting-implementation-plans` mówi „tylko Image" — nieaktualna, kod/panel potwierdzają `file` |
| DEC-11 | Domena `.pl` w **OVH** (Cloudflare Registrar nie obsługuje `.pl`), NS na Cloudflare; skrzynka `info@` w OVH, mail transakcyjny (Resend) na subdomenie `send.` — poczta nietknięta | `hosting_first_analysis.md` (adnotacja), `hosting_second_analysis_sveltia.md` §7; `mailbox_setup.md`; `contact-me-form-analysis-implementation.md` (DNS) | obowiązuje |
| DEC-12 | Cloudflare **Stream** — NIE; wideo realizacji jako MP4 w R2, `cdn-cgi/media` jako poster — NIE | `analiza-realizacje-wideo.md` §3.1; ewolucja §9 | odrzucone |
| DEC-13 | Worker `sveltia-cms-auth` wdrożony ręcznie; odświeżanie i rotacja sekretów cyklicznie | `optional-todos.md` C1, C2, §4.1–4.2 | obowiązuje |

## B. Wideo realizacji (R1) — decyzje planu, które nadal obowiązują

| # | Decyzja | Gdzie uzasadnienie | Status |
| --- | --- | --- | --- |
| DEC-14 | Wideo tylko na pierwszym ekranie `WorkDetail`, oba urządzenia; kafelki statyczne; `screens[].video` opcjonalne, zdjęcia ekranu zostają wymagane (poster, reduce, kafelek) | `analiza-realizacje-wideo.md` §3 D1–D2 | obowiązuje |
| DEC-15 | `<video muted playsinline loop preload="none">` bez `autoplay` i bez atrybutu `poster` (Chromium nie pobiera posteru przy `preload="none"`) — posterem jest `<picture>` pod spodem; `src` z `data-src` po otwarciu nakładki | `analiza-realizacje-wideo.md` §3 D5, §4 | obowiązuje |
| DEC-16 | Przy `prefers-reduced-motion: reduce` wideo ani w DOM, ani ładowane | `analiza-realizacje-wideo.md` §3 D6 | obowiązuje |
| DEC-17 | Nagranie publicznej strony klienta w trybie **`clock`** (`page.clock` + krokowanie WAAPI i `<video>`), nie CDP virtual time; szew pętli = wypieczony crossfade końcówki w klatkę 0; runtime nie robi crossfade'u | `analiza-realizacje-wideo.md` §3 D7–D9, D14, §10 | obowiązuje |
| DEC-18 | MP4 lądują **płasko w `realizacje/`** (jeden prefix uploadu Sveltii), nazwy `<slug>-<key>-desktop.mp4` / `-mobile.mp4` | `analiza-realizacje-wideo.md` §3 D4 (korekta P5) | obowiązuje |
| DEC-19 | Bez self-heal z hero w nakładce (jedna próba `play()` + retry na `visibilitychange`) | `analiza-realizacje-wideo.md` §3 D12 | obowiązuje |
| DEC-20 | Hover-play wideo na kafelkach desktop — tylko jako COULD z budżetem (`preload="none"`, start po `mouseenter`) | ewolucja §6 **R4** | odłożone (COULD) |

## C. Scroll (Lenis / GSAP)

| # | Decyzja | Gdzie uzasadnienie | Status |
| --- | --- | --- | --- |
| DEC-21 | Lenis + GSAP ScrollTrigger **zostają** (tożsamość wizytówki: scrub + snap w hero/about/audience); uproszczenie do natywnego scrolla jak delung/eha/hetman — NIE, wraca tylko z pomiarem konkretnej szkody | ewolucja §4.1, §9 | obowiązuje |
| DEC-22 | Stałe Lenisa desktop (`WHEEL_LERP = 0.05`) i touch (`syncTouch`, `SYNC_TOUCH_LERP`, `TOUCH_INERTIA_EXPONENT`) **rozdzielone** — scalenie = regresja `0640aa1` | `.claude/rules/scroll-lenis.md`; kronika §D | obowiązuje (naprawiony bug — nie cofać) |
| DEC-23 | Detekcja dotyku przez `navigator.maxTouchPoints > 0`, nie media queries `hover`/`pointer` | `.claude/rules/scroll-lenis.md` | obowiązuje |
| DEC-24 | Lenis tylko przy `prefers-reduced-motion: no-preference`; instancja jako `window.__lenis` (navbar, testy) | `.claude/rules/scroll-lenis.md`; `tests/helpers/scroll.ts` | obowiązuje |
| DEC-25 | Guard pinch/zoom w gałęzi touch (`multiTouch`/`isZoomed` + `prevent`), NIE `lenis.stop()` | `first-bigger-improvement-refactor-analysis.md` §2.1; `scroll-lenis.md` | obowiązuje (naprawiony bug — nie cofać) |
| DEC-26 | Handler `pageshow persisted` → `lenis.resize()` + `ScrollTrigger.refresh()` (bfcache z podstron przez `a[data-back]`) | `.claude/rules/scroll-lenis.md`; pamięć `kontakt-baner-se-geometry` | obowiązuje (naprawiony bug — nie cofać) |
| DEC-27 | Podstrony: `/realizacje/`, `/kontakt/`, `/oferta/` (hub) i 404 scroll **natywny** (`smoothScroll={false}` w BaseLayout); `/dla-kogo/`, `/o-mnie/`, `/proces-wspolpracy/`, `/pakiety/`, `/faq/`, polityka prywatności = `smoothScroll="desktop"` (Lenis na desktopie, mobile natywnie — bramka `maxTouchPoints`) | `analiza-podstrona-realizacje.md`; `analiza-podstrona-dla-kogo.md`; `analiza-podstrona-kontakt.md`; `analiza-podstrona-oferta-hub.md` | obowiązuje |
| DEC-28 | Track karuzeli Work: `data-lenis-prevent-horizontal` (NIE `-prevent` — zabija pionowy scroll na Androidzie) + `scroll-snap-stop: always` | `analiza-realizacje-karuzela-mobile.md`; `.claude/rules/sections.md` „Work" | obowiązuje (naprawiony bug — nie cofać) |
| DEC-29 | `ScrollTrigger.refresh()` z modułów `*-scroll.ts` **nie zbijać do jednej klatki (rAF/debounce)** — wywraca axe `.pp-sub` na `/oferta/` (pixel-5) | pamięć `scrolltrigger-refresh-nie-debounce` (2026-07-19); `first-bigger-improvement-refactor-analysis.md` §8 Etap 7 (kandydat „P2" błędnie oznaczony jako neutralny) | obowiązuje — uzasadnienie tylko w pamięci; kandydat do dopisania w `sections.md` przy pierwszej pracy w tym obszarze |
| DEC-30 | Navbar `measure()` — **nie optymalizować** (trzy warianty wywalały axe `.pp-sub` na `/oferta/` pod obciążeniem pełnego `test:e2e`) | pamięć `navbar-measure-nie-optymalizuj` (2026-07-20); kronika Faza 13 | obowiązuje — jak wyżej, uzasadnienie w pamięci |
| DEC-31 | Reguła rodziny: zanim dołożysz warstwę z maską/filtrem pod scrollem, zmierz na fizycznym Macu („Lenis nie jest za darmo przy drogich warstwach") | ewolucja §4.1, §8 pkt 8 | obowiązuje |

## D. Hero (scena urządzeń)

| # | Decyzja | Gdzie uzasadnienie | Status |
| --- | --- | --- | --- |
| DEC-32 | Oś scrolla w `hero-config.ts`; wartości POCHODNE (`CAP_END`, `*_MIN_HEIGHT_SVH`) liczy kod, nigdy ręcznie w CSS | `.claude/rules/hero-device-scene.md`; `analiza-refactor-hero-odkruszenie.md` | obowiązuje |
| DEC-33 | Sekcja hero i triggery dzielą **jedną metrykę** (`innerHeight` px w `refreshInit`), nigdy `svh` z JS; mechanizmy `--vh`/`use-dvh`/`normalizeScroll`/`is-lowpower`/`?flat` **nie istnieją** w kodzie | `hero-device-scene.md` „Metryki viewportu"; `analiza-refactor-hero-odkruszenie.md`; pamięć `hero-viewport-metric-invariant` | obowiązuje (naprawiony bug — nie cofać) |
| DEC-34 | Obudowy urządzeń na mobile **płaskie** (bez CSS-3D/ekstruzji/blur) — ciężka 3D głodziła rasteryzację GPU Androida | `analiza-android-obudowy-3d-glodza-rasteryzacje.md`; `hero-device-scene.md` | obowiązuje (naprawiony bug — nie cofać) |
| DEC-35 | `ANDROID_DESIGN_SCALE = 0.6` (`--k`) zostaje — limit rozmiaru warstwy GPU obcinał spód telefonu; `fit()` kompensuje | `naprawa-android-scena-urzadzen-mobile.md` | obowiązuje (naprawiony bug — nie cofać) |
| DEC-36 | Wideo ekranów na mobile gra **ciągle** (`initMobilePhase3` + self-heal pauz dekodera iOS); pasek postępu czysto wizualny; jedyne splity Android/iOS są render-only | `hero-device-scene.md` „Wideo ekranów"; `on_mobile_devices_video_analysis.md`; pamięć `ios-device-video-involuntary-pause` | obowiązuje |
| DEC-37 | iOS Low Power Mode ≠ reduced-motion; jedyna obsługa LPM = toast `LowPowerNotice` | `hero-device-scene.md`; pamięć `ios-low-power-mode-scroll` | obowiązuje |
| DEC-38 | Obrysy tekstu w LaptopSite/PhoneSite: **nigdy `paint-order: stroke fill`** (WebKit rysuje obrys nad fillem i wyłącza `text-shadow`); obrys = pseudoelement `::before` pod spodem | ewolucja §6 **H1**, **H2**; `hero-device-scene.md` „Obrysy i cienie" | obowiązuje (naprawiony bug — nie cofać) |
| DEC-39 | Ekrany urządzeń na mobile = prerenderowane MP4 (`pnpm capture:devices`), nie żywy DOM | `on_mobile_devices_video_analysis.md`; `.claude/rules/capture-scripts.md` | obowiązuje |
| DEC-40 | Karuzela captionów desktop: faza A swap → faza B center-pinned; koniec zsynchronizowany z `doghouse.webp` przez `DOG_SITE_PROGRESS` | `hero-device-scene.md` „Sekwencja captionów"; pamięć `hero-caption-carousel` | obowiązuje |
| DEC-41 | Audyt warstw kompozytora (`opacity:0` → `visibility`) i relayout `phone-site.ts` po fontach — **tylko z pomiarem** | ewolucja §6 **H3**, **H4** | odłożone (COULD) |

## E. Sekcje i podstrony

| # | Decyzja | Gdzie uzasadnienie | Status |
| --- | --- | --- | --- |
| DEC-42 | Sekcje treściowe na **podstronach**, strona główna = teasery: `/dla-kogo/`, `/o-mnie/`, `/oferta/` (hub) + `/proces-wspolpracy/` + `/pakiety/`, `/faq/`, `/kontakt/`, `/realizacje/` (EN odpowiedniki) | `analiza-podstrona-*.md`, `analiza-podstrony-oferta.md`, `analiza-podstrona-oferta-hub.md` | obowiązuje |
| DEC-43 | Navbar **bez kotwic** — każda pozycja prowadzi na podstronę (`SUBPAGE_PATHS`); „Oferta" → `/oferta/` | `analiza-podstrona-oferta-hub.md` D2 | obowiązuje — zastępuje wcześniejsze „Oferta zostaje kotwicą `#services`" (`analiza-podstrony-oferta.md`, pamięć `oferta-subpages`) |
| DEC-44 | Moduły `*-scroll.ts` ładowane dynamicznie tylko przy `no-preference`; bez JS/przy reduce pełna statyczna treść | `.claude/rules/sections.md` „Wspólne" | obowiązuje |
| DEC-45 | Breakpoint desktop sekcji 861 px = stała `*_DESKTOP_MIN_PX` + ten sam próg w `@media` (utrzymywać w parze); progi 760/761 (hero, work) i 768 (ambient) **nie ujednolicane** — tylko strażnik T4 | `sections.md`; ewolucja §6 **T4**, „Odrzucone z raportów" | obowiązuje |
| DEC-46 | Audience mobile: wjazd L/R/L, **nigdy `filter`** na mobile; ekrany-dowody = wypieczone WebP LUMÉA, teksty mocków PL w obu językach | `analiza-sekcja-dla-kogo.md`; `analiza-podmiana-ekranow-lumea-dla-kogo.md`; `sections.md` | obowiązuje |
| DEC-47 | Oferta: ceny w **PLN także w EN**; spany `.of-w`/`.acc` tworzone w runtime (`:global` w CSS); `of-prog-on` na sekcji, nie na body | `analiza-sekcja-oferta.md`; `sections.md` „Services" | obowiązuje |
| DEC-48 | Oferta: reveal per akapit z wcześniejszym startem lead2/close (pkt 5 poprawek), karuzela Work `--wk-scale: 1.2` (pkt 4) | `visual-corrections-part1.md` §4–5; PR #48; `poprawki-po-implementacji.md` PI-01/02 | obowiązuje — potwierdzone 2026-10-26 (PI-01/02 „zostaje") |
| DEC-49 | FAQ: jedno źródło pytań `src/i18n/faq.ts`; akordeon działa też przy reduce (zero gsap w grafie modułów „zawsze"); **JSON-LD FAQPage wyłącznie na podstronie** | `analiza-sekcja-faq.md`; `analiza-podstrona-faq.md` D3; `sections.md` „FAQ" | obowiązuje |
| DEC-50 | Kontakt: Pages Function + Resend + Turnstile (lazy, od pierwszego `focusin`); e-mail składany z fragmentów po `[ POKAŻ ]`; honeypot `readonly`; serwer dubluje pułapki klienckie | `contact-me-form-analysis-implementation.md`; `sections.md` „Contact" | obowiązuje |
| DEC-51 | Banner Kontakt na głównej: budżet od WIDOCZNEJ wysokości, wariant kompakt ≤ 700 px, flow < 360 px | pamięć `kontakt-baner-se-geometry`; `analiza-podstrona-kontakt.md` | obowiązuje |
| DEC-52 | Globalny mechanizm „wstecz": `a[data-back]` → `history.back()` gdy referrer same-origin (wymóg dla przyszłych podstron) | `contact-me-form-analysis-implementation.md` (Etap 5) | obowiązuje |
| DEC-53 | Nakładka „ładowania" (mobile) **tylko przy nawigacji między stronami** (próg 250 ms); entry-overlay na wejściu **zakazany** (LCP głównej, axe `.pp-sub` podstron) | kronika Faza 13; pamięć `loading-overlay-route-only` | obowiązuje |
| DEC-54 | Przejścia między stronami: preloady fontów + mikro-fade `nav-fade`/`fonts-in` bramkowany `sessionStorage` (tylko ponowne wejście), bez ClientRoutera/View Transitions | `visual-corrections-part1.md` §8; `BaseLayout.astro` (komentarz) | obowiązuje; wariant po `document.referrer` = **S5** (tylko jeśli polityka deklaruje brak zapisu w urządzeniu) |
| DEC-55 | `Modal`/`BottomSheet` generyczne, reużywane (3 miejsca) — inline-sheety hetmana NIE; gest swipe-down przez `touch*` non-passive + `overscroll-behavior: contain` | ewolucja §4.9, §6 **U1**, §9 | obowiązuje |
| DEC-56 | Strona główna kapuje realizacje do 3 + kafel „Więcej"; mobile = pozioma karuzela z BottomSheet | `analiza-realizacje-karuzela-mobile.md` | obowiązuje |
| DEC-57 | `MotionGate`/`html.js-motion` dla istniejących sekcji — NIE (ruszyłoby baseline'y bez zysku); dla NOWYCH sekcji dopuszczalne | ewolucja §6 „Odrzucone z raportów" | odrzucone (dla istniejących) |

## F. Chrome strony, SEO, fonty

| # | Decyzja | Gdzie uzasadnienie | Status |
| --- | --- | --- | --- |
| DEC-58 | Prawdziwa **404**: jeden plik `404.astro` → `dist/404.html`, język po ścieżce w przeglądarce, `noindex` bez canonicala/`og:url` | ewolucja §6 **S1**; `.claude/rules/layout-seo.md` | obowiązuje |
| DEC-59 | `og:image` 1200×630 (screenshot hero PL) + `summary_large_image`; kontrakt IHDR = meta, ≤ 300 KB | ewolucja §6 **S2**; `layout-seo.md` | obowiązuje |
| DEC-60 | `color-scheme: dark` (bez wariantu light), `text-size-adjust: none`, `theme-color` `#000000` = tło każdej trasy (trzy miejsca w parze z manifestem) | ewolucja §6 **S3**; `layout-seo.md` | obowiązuje |
| DEC-61 | Komentarze nigdy w blokach `is:inline` (wysyłane na każdej trasie) | `layout-seo.md` | obowiązuje |
| DEC-62 | Fonty: własne `@font-face`, `latin` z Fontsource, `latin-ext` = **polskie subsety** (16 glifów, `scripts/subset-fonts.mjs`, commitowane); `assetsInlineLimit` false dla `.woff2`; Instrument Serif **tylko italic** | ewolucja §6 **F1**; `layout-seo.md` „Fonty"; pamięć `visual-corrections-part1-branch` | obowiązuje |
| DEC-63 | Saira `latin-ext` w `fonts-hero.css` **bez `unicode-range`** (1:1 z dawnym `latin-ext-600.css`); wariant z zakresem cofnięty w diagnozie czerwonego sweepa (to był T9, nie zakres) | ewolucja §6 **F1**, §10 sesja 7 | obowiązuje |
| DEC-64 | Tło ambient jako `AmbientBackground.astro` (warianty red/blue), tekstura statyczna na mobile (`public/ambient-bg-mobile-*.webp`, `pnpm capture:ambient-bg`) | `analiza-tlo-hero-animowane-chmury.md`; `CLAUDE.md` komendy | obowiązuje |
| DEC-65 | `document.fonts.ready` to fałszywy sygnał przy preloadach — do bramek `fonts.load()`; dziś zdejmuje tylko mikro-fade z twardym timeoutem | ewolucja §4.6, §6 **F2** | obowiązuje jako wiedza; reguła = F2 (COULD) |
| DEC-66 | Generator ikon `make-icons.mjs` — tylko jako COULD (S4); dziś og ręcznie | ewolucja §6 **S4** | odłożone |

## G. Dostępność

| # | Decyzja | Gdzie uzasadnienie | Status |
| --- | --- | --- | --- |
| DEC-67 | Allowlista axe to **ratchet**: wpis wolno usunąć po realnej poprawie; nowych nie dopisywać bez decyzji Mateusza | `.claude/rules/testing.md` „a11y" | obowiązuje |
| DEC-68 | Wyjątek `.of-w`/`.acc` (intro Oferty) **zostaje** — axe łapie stan startowy animacji (krycie 0,14/0,24); stan końcowy spełnia AA (4,60–5,07:1, pomiar); allowlista świadomie NIE pusta | ewolucja §6 **A1**, §10 sesja 7 | przeformułowana (zamknięta) |
| DEC-69 | Link w nocie RODO odróżnialny podkreśleniem, kolor bez zmian (1,37:1 nie da się podnieść do 3:1 bez porzucenia akcentu) | ewolucja §6 **A2** | obowiązuje |
| DEC-70 | `.pp-sub` → `--faint` (kontrast podtytułów podstron) | pamięć `oferta-hub-subpage`; `analiza-podstrona-oferta-hub.md` | obowiązuje |
| DEC-71 | Naruszenie axe „losowe" diagnozować przez `incomplete` vs `passes` — czysty skan niczego nie dowodzi | `testing.md` „a11y"; ewolucja §10 sesja 7 (A2) | obowiązuje |

## H. Testy i baseline'y

| # | Decyzja | Gdzie uzasadnienie | Status |
| --- | --- | --- | --- |
| DEC-72 | Piramida: unit (Vitest) + e2e (Playwright: funkcjonalne/a11y/SEO) + visual (pixel-diff) + LHCI; wszystkie bramkują PR; **bez własnych harnessów** (`verify-hero.mjs` wycofany) | `testing-tools-and-environemnts-setup-analysis.md` §II.4, Etapy 1–7; `testing.md` | obowiązuje |
| DEC-73 | Testy wizualne **wyłącznie na preview** (port 4399, strażnik `assertPreview`), nigdy dev | `testing.md`; `testing-tools-…` Etap 4 | obowiązuje |
| DEC-74 | **Visual = zamrożony fixture** (`tests/fixtures/realizacje`, `pnpm build:visual`, strażnik `assertVisualFixture`); **e2e = treść produkcyjna** czytana dynamicznie; fixture niezależny od panelu | ewolucja §6 **T1**; `testing.md` | obowiązuje |
| DEC-75 | Testy odporne na pustą kolekcję (`realizacjeFiles()`, `test.skip` z powodem); jedyny sygnał braku treści = kontrakt w `cms-contract.test.ts` | ewolucja §6 **T2**; `testing.md` | obowiązuje |
| DEC-76 | Baseline'y **dwa komplety** per plik (darwin lokalnie, linux przez workflow); kolejność kod → workflow linux → commit darwin NA KOŃCU; nigdy globalny próg na rozjazd darwin↔linux | `testing.md`; `daily-workflow.md` „Celowa zmiana wyglądu"; pamięć `visual-baselines-ci-ordering` | obowiązuje |
| DEC-77 | **Zakaz** regeneracji baseline'u dla „naprawienia" czerwonego testu bez pokazania diffu i zgody; po `update` zawsze `git status` i cofnięcie plików spoza zestawu | `testing.md`; `CLAUDE.md` zasada 5; `.claude/settings.json` | obowiązuje |
| DEC-78 | „Zielony ≠ aktualny": pomiar progiem 0 bez ruszania baseline'u; świadome przepisanie = workflow z `spec` + `mode=all` | ewolucja §6 **T6**; `testing.md` | obowiązuje |
| DEC-79 | Flaky klatki hero desktop 05–09: próg 0,02 na `chromium-1920` **oraz `webkit-1440`** (T9); pixel-5 00–03 próg 0,01 — na te objawy baseline'u NIE regenerować, kontrola = rerun na main | ewolucja §6 **T9**, §10 sesja 7; `testing.md`; pamięć `verify-hero-desktop-flaky-frames` | obowiązuje |
| DEC-80 | Profil `webkit-1440` (WebKit desktop) tylko dla `hero.spec.ts` (DPR 1) | ewolucja §6 **T5** | obowiązuje |
| DEC-81 | NIE emulować `prefers-reduced-motion: reduce` globalnie w testach (bramka w BaseLayout = testy na martwej stronie); punktowe wyjątki FAQ/contact zostają | `testing.md`; `sections.md` | obowiązuje |
| DEC-82 | Wideo na zrzutach zawsze pod maską; odtwarzanie sprawdza e2e | `testing.md`; `analiza-realizacje-wideo.md` D10 | obowiązuje |
| DEC-83 | Gesty dotykowe testować przez CDP `Input.dispatchTouchEvent`, nie `page.mouse` | ewolucja §6 **U1**; `testing.md` | obowiązuje |
| DEC-84 | `settleImages()` przed zrzutem (eager + `decode()`) | ewolucja §6 **T3** | obowiązuje |
| DEC-85 | Snap About/Audience w testach przez `?nosnap` (programowy scroll przegrywa wyścig ze snapem na CI) | `sections.md`; pamięć `visual-baselines-ci-ordering` | obowiązuje |
| DEC-86 | Runnery przypięte `ubuntu-24.04`; bump obrazu = osobny PR z kontrolą baseline'ów linux; `playwright` + `@playwright/test` parą | ewolucja §6 **C3**; `testing.md` | obowiązuje |
| DEC-87 | Test mediów R2 (`CHECK_REMOTE_MEDIA=1`) tylko poza ścieżką PR | `testing.md` | obowiązuje |
| DEC-88 | Warstwa `test:dist` (skan `dist/**/*.html`) — COULD; reguły geometrii sub-pikselowej itd. z rodziny — COULD | ewolucja §6 **T7**, **T8** | zastąpiona przez DEC-106–110 (T7/T8 ✅ sesja 10, 2026-10-26) |

## I. Lighthouse (budżety)

| # | Decyzja | Gdzie uzasadnienie | Status |
| --- | --- | --- | --- |
| DEC-89 | Pomiar bazowy **wyłącznie** workflowem `lhci-measure.yml` (5 przebiegów, build `pnpm build` = ta sama treść co job `lighthouse`); lokalny `lhci collect` nie jest podstawą progów | ewolucja §6 **C4**; `testing.md` „LHCI" | obowiązuje |
| DEC-90 | Ratchet: zmiana progu = **osobny PR po pomiarze na main**; każda asercja z komentarzem „dlaczego ten próg" (data + run) | ewolucja §6 **L1**; `testing.md`; `daily-workflow.md` | obowiązuje |
| DEC-91 | LCP = `max(mediana × 1,15; mediana + 1300)`; TBT desktop = `max(×2; +300)` bez snapu do granic Google; `numberOfRuns: 5` | ewolucja §6 **L1** | obowiązuje |
| DEC-92 | `categories:performance` `minScore` = **mediana − 0,05 zaokrąglona w dół do 0,05** (stały 0,9 leżał na krawędzi) | ewolucja §6 **L1** (decyzje 2026-10-23) | obowiązuje |
| DEC-93 | Lista URL-i bez zmian — **`/en/` zostaje** w pomiarze i bramce; trasa-sensor `/polityka-prywatnosci/` = L2 osobno | ewolucja §6 **L1**, **L2** | obowiązuje |
| DEC-94 | `font:count` i `font:size` jako `error`; `font:size` = mediana + 10% (74 800 / 118 100 po F1) | ewolucja §6 **L1**, **F1**; PR #60 | obowiązuje |
| DEC-95 | Pojedynczy czerwony `lighthouse` nie dowodzi regresji — porównaj `resource-summary` obu runów (sygnał = bajty) | `testing.md` „LHCI"; ewolucja §4.4 | obowiązuje |

## J. Proces i dokumentacja

| # | Decyzja | Gdzie uzasadnienie | Status |
| --- | --- | --- | --- |
| DEC-96 | Claude **nigdy nie commituje ani nie pushuje** — proponuje treść (conventional, scope, małe litery po dwukropku, ≤ 100 znaków, bez trailera `Co-Authored-By`) | `CLAUDE.md` zasada 1; `.claude/settings.json`; pamięć `commit-trailer-no-coauthor` | obowiązuje |
| DEC-97 | `git add <jawne ścieżki>`, nigdy `.`/`-A` (NFD z panelu, pliki przypadkowe) | ewolucja §6 **D1**; `daily-workflow.md`; `cms-realizacje.md` | obowiązuje |
| DEC-98 | Decyzje ze skutkami (progi LHCI, baseline'y, schemat CMS) = **osobne commity/PR-y**, nigdy doklejane do feature'a | `daily-workflow.md`; ewolucja §8 pkt 5 | obowiązuje |
| DEC-99 | **Docs-first**: większe zmiany poprzedza analiza w `docs/` (po polsku, etapy numerowane); statusy plików w `docs/README.md` (bannery HISTORYCZNY / adnotacje) | `CLAUDE.md` „Konwencje"; `docs/README.md`; pamięć `docs-status-convention` | obowiązuje |
| DEC-100 | Jedna sesja = jedna paczka; start od `sesja-utrzymaniowa-szablon.md`; pierwsze zadanie = domknięcie poprzedniej; usterki z urządzeń → `poprawki-po-implementacji.md`, nie „przy okazji" | ewolucja §8; `sesja-utrzymaniowa-szablon.md` | obowiązuje |
| DEC-101 | Log stanu w `CLAUDE.md` (jak hetman/eha, 116–176 KB) — NIE; fakty do §6/§10 analizy i pamięci | ewolucja §9, §4.10 | odrzucone |
| DEC-102 | Preact, wycięcie Lenisa/GSAP, `site-config.ts`, ujednolicenie progów 760/768/861, Cloudflare Stream — nie wchodzą do backlogu | ewolucja §6 „Odrzucone z raportów", §9 | odrzucone |
| DEC-103 | Zmiany ekosystemu Claude (`.claude/settings.json`, reguły) osobnym PR-em między paczkami | ewolucja §10 sesja 6 (#58) | obowiązuje |
| DEC-104 | Reguła Lenisa (§4.1) i WebKit `paint-order` (H2) wchodzą do `.claude/rules/` przy pierwszej paczce, która ich dotyka — `paint-order` już w `hero-device-scene.md` | ewolucja §8 pkt 8 | obowiązuje (połowicznie wykonana) |
| DEC-105 | Instalacja Playwrighta w CI: zależności apt OSOBNYM krokiem z drugą próbą i krótkim limitem per próba (6 min), binaria osobno z cache; czerwony na tym kroku = rerun failed jobs, nie diagnoza kodu | `ci.yml` job `e2e` (komentarz); `pulapki.md` P-40; ewolucja §10 sesja 9 | obowiązuje, uzupełniona DEC-111 (próba 2 czeka na blokadę apt) |
| DEC-111 | Uzupełnienie DEC-105: próba 2 instalacji zależności apt nie powtarza ślepo polecenia (padała po 2 s na blokadzie dpkg trzymanej przez osierocony `apt-get` z próby 1 — P-72), tylko ustawia `DPkg::Lock::Timeout "420"` i ma limit 8 min: apt czeka, instalacja z próby 1 się dokańcza, powtórka jest no-opem; czerwone na próbie 2 nadal = rerun failed jobs. Mirror pozostaje loterią — zmiana mirrora dopiero po kolejnych 2 wystąpieniach | `ci.yml`, `prod-smoke.yml`, `update-visual-baselines.yml` (komentarze przy krokach); `pulapki.md` P-72; ewolucja §10 sesja 10 (domknięcie) | obowiązuje |
| DEC-106 | Warstwa `test:dist` (`tests/dist/dist.test.ts`, osobny `vitest.dist.config.ts`; job `quality` po `pnpm build`, w `pnpm test` między unit a e2e, `/release-check` zamiast ręcznego grepa): skan `dist/**/*.html` — `localhost`/`127.0.0.1`/porty 4321 i 4399; pełny adres e-mail BEZ wyjątków (Kontakt i polityka prywatności składają adres z fragmentów po stronie klienta, stopka bez `mailto:`); `robots.txt` (Disallow `/admin` + `Sitemap:` na domenie produkcyjnej); `sitemap-index.xml` → potomne na `site`; zbiór adresów sitemapy = zbudowane strony poza `404.html` i `/admin/`. Bundle JS/CSS zostaje w `contact.spec.ts` (konkretne ciągi) | ewolucja §6 **T7**; `tests/dist/dist.test.ts` (komentarz nagłówkowy); `testing.md` „Pomiar w testach" | obowiązuje |
| DEC-107 | Kontrakt geometryczny w asercji: `getBoundingClientRect()` + jawna tolerancja (`SUBPIXEL_TOL_PX = 0.5`), nigdy `offsetHeight`/`offsetTop` porównywane z drugą zaokrągloną liczbą; wyliczanie pozycji scrolla z `offsetHeight` w helperach to nie asercja | `testing.md` „Pomiar w testach"; `pulapki.md` P-03; ewolucja §6 **T8** | obowiązuje |
| DEC-108 | Czas w testach mierzony wewnątrz przeglądarki (`performance.now()` + `MutationObserver`/rAF w `page.evaluate`), nie timerami Node po stronie testu | `testing.md` „Pomiar w testach"; `pulapki.md` P-04 | obowiązuje |
| DEC-109 | Próg per-shot podnoszony wyłącznie po policzeniu sufitu klasy (udział elementów, które mogą się różnić, × czułość percepcyjna Playwrighta) z dowodem mechanizmu (pasma diffu = te elementy) i komentarzem z liczbą i datą; progi hero 0,02/0,01 (DEC-79) sprzed reguły — przeliczenie to osobny punkt **T10**, nie „przy okazji" | `testing.md` „Pomiar w testach"; `pulapki.md` P-13, P-15; `poprawki-po-implementacji.md` PI-04 | obowiązuje |
| DEC-110 | „Czerwone w izolacji = z definicji nie flake": flake wymaga zielonego przebiegu kontrolnego tego samego testu na tym samym buildzie; czerwone tylko pod obciążeniem pełnego `test:e2e` kontrolować na main w tych samych warunkach, dopiero potem rerun w CI | `testing.md` „Pomiar w testach"; `pulapki.md` P-31 | obowiązuje |
| DEC-112 | E2E na ścieżce PR NIE pobiera wideo nakładki z R2: `page.route` podmienia każde `.mp4` z `media.hadrianm.pl` na fixture `tests/fixtures/video/screen-loop.mp4` (asercja adresu `src` = R2 zostaje), a odtwarzanie sprawdza `expect.poll` na `currentTime > 0` (10 s) zamiast jednego odczytu po 600 ms; realne pliki w R2 pokrywa test mediów `CHECK_REMOTE_MEDIA=1` poza PR. Wyzwalacz: ten sam test czerwony w CI 2026-10-27 (PR #65) i 2026-10-28 (main) przy diffie bez bajtów strony | `tests/e2e/work.spec.ts`; `pulapki.md` P-73; `testing.md` „Zasady twarde"; ewolucja §6 T11 | obowiązuje |
