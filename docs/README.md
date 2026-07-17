# Indeks dokumentacji — status plików

> Przegląd „czemu ufać" po audycie spójności z 2026-07-06. W trakcie prac wiele
> ustaleń się zmieniało — dokumenty w pełni nieaktualne mają banner
> **DOKUMENT HISTORYCZNY** na górze, dokumenty częściowo nieaktualne mają
> adnotacje `⚠️ NIEAKTUALNE` / `ℹ️ AKTUALIZACJA` przy konkretnych fragmentach.
>
> **Dodajesz nowy plik do `docs/`? Dopisz go tutaj.** Zmieniasz decyzję opisaną
> w którymś dokumencie? Zaktualizuj jego status/adnotacje i ten indeks.
>
> Indeks obejmuje tylko pliki `.md` bezpośrednio w `docs/` (podkatalogi
> `design/` i `testing-data/` — poza zakresem audytu).

## ✅ Aktualne — źródła prawdy

| Plik | Czego dotyczy |
| --- | --- |
| `daily-workflow.md` | **Codzienny proces pracy** (instrukcja operacyjna): feature branch → `/test` → PR → 3 checki → merge → auto-deploy + prod smoke; przypadki specjalne (baseline'y, czerwone checki, CMS, hotfix) |
| `analiza-refactor-hero-odkruszenie.md` | **Aktualny opis architektury hero** (moduły, stałe, refactor „odkruszający") |
| `hosting_first_analysis.md` | Obowiązujące decyzje strategiczne: **Astro** (nie Next), Cloudflare Pages, budżety (1 adnotacja: Cloudflare Registrar nie obsługuje `.pl`) |
| `hosting_second_analysis_sveltia.md` | **Wykonawczy** dokument CMS/hosting — wdrożony wariant; etapy 1–5 i 7 wykonane, pozostał opcjonalny Etap 6 (Stream) |
| `photos-management-for-cms-analysis.md` | Decyzja o zdjęciach **wdrożona**: R2 + transformacje w locie, `imgAt()` 320/960 px |
| `additional-architecture-adjustment-admin-client.md` | Architektura admin/klient na przyszłe projekty klienckie (Sveltia Model B vs Sanity) |
| `hosting_related_concepts.md` | Słowniczek pojęć hostingowych (1 adnotacja: przykład content collections na starym API) |
| `mailbox_setup.md` | Konfiguracja skrzynki `info@hadrianm.pl` (OVH Zimbra) + DNS — wykonana |
| `gmail_alias_setup.md` | Opcjonalna integracja skrzynki OVH z Gmailem — do wykonania w dowolnym momencie |
| `optional-todos.md` | Otwarte, opcjonalne TODO (Worker auth, subdomena `auth.`, robots/Pages) |
| `testing-tools-and-environemnts-setup-analysis.md` | **Plan wykonawczy** testów (lokalnie + CI/CD): optymalizacje safe-first, dobór środowisk (Playwright/Vitest/LHCI), wdrożenie w 7 etapach, integracja z ekosystemem Claude Code — **WDROŻONY w całości** (2026-07-07): etapy 1–7 + ratchet #1; baseline'y LHCI i korekty wykonawcze (odrzucone I.3, TBT-podłogi, fonty desktop=7) w §III.5 i adnotacjach |
| `analiza-sekcja-o-mnie.md` | **Plan wykonawczy** sekcji „O mnie" (design „Z mgły" z `docs/design/o mnie/`): architektura portu, pipeline portretu (sharp → `src/assets/about/`), reduced-motion czystym CSS, a11y (aria-hidden na chromie), plan testów wizualnych (sweep `about.spec.ts`) |
| `analiza-sekcja-dla-kogo.md` | **Plan wykonawczy** sekcji „Dla kogo" (design „Talia kart" z `docs/design/dla-kogo-referencja/`): decyzje portu (mocki statycznym markupem Astro, teksty mocków PL w obu językach, budżet mobile jak About), architektura `audience-*`, plan testów (sweep `audience.spec.ts`) |
| `analiza-podmiana-ekranow-lumea-dla-kogo.md` | **Plan wykonawczy** podmiany placeholderów sekcji „Dla kogo" na finalne jasne ekrany LUMÉA (`docs/design/lumea-ekrany-referencyjne/`): decyzje (obraz WebP na desktop+mobile, jasny chrome, tło `#f7f1e8` bez czerwonej poświaty, mapowanie home/cms/reservation → 01/02/03), nowa animacja mobile (wjazd L/R/L zamiast crossfade blur→sharp — zero `filter` w runtime), pipeline `scripts/capture-audience-screens.mjs` — **wdrażany** (2026-07-14; baseline'y wizualne czekają na akceptację diffu) |
| `analiza-sekcja-oferta.md` | **Plan wykonawczy** sekcji „Oferta" (design „Nić A + Pakiety P4" z `docs/design/oferta-referencja/`): decyzje portu (tokeny projektu zamiast `:root` referencji, `#packages`, bez haka `of-static`, ceny PLN w EN), architektura `services-*`, plan testów (sweep `services.spec.ts`) |
| `contact-me-form-analysis-implementation.md` | **Plan wykonawczy** formularza kontaktowego (sekcja `#kontakt`, design z `docs/design/kontakt-referencja/`): Pages Function + Resend + Turnstile, dwa maile (powiadomienie na `info@` z `Reply-To` nadawcy + auto-potwierdzenie PL/EN), warstwy antyspamowe, DNS Resend na subdomenie `send.` (poczta OVH nietknięta), etapy 0–5 z podziałem ról Mateusz/Claude — **WDROŻONY w całości** (2026-07-11): etapy 0–4 zmergowane (PR #21), Etap 5 (polityka prywatności `/polityka-prywatnosci/` + `/en/privacy-policy/`, treść zaakceptowana, globalny mechanizm „wstecz" `data-back`) na branchu `feat/privacy-policy`; korekty wykonawcze w statusach per etap |
| `analiza-sekcja-faq.md` | **Plan wykonawczy** sekcji „FAQ" (wariant A „Rejestr" z `docs/design/faq-referencja/`): decyzje portu (split akordeon/wejścia — akordeon działa też przy reduce, klasa `.js` na sekcji, bez `fq-static`, JSON-LD FAQPage, mono = token projektu), architektura `faq-*`, plan testów (`faq.spec.ts` e2e + visual) |
| `analiza-podstrona-realizacje.md` | **Plan wykonawczy** podstrony `/realizacje/` (EN: `/en/projects/`) z pełną galerią realizacji wg `docs/design/RealizacjeGaleria.astro`: decyzje (scroll natywny bez Lenisa — prop `smoothScroll` w BaseLayout, nakładki Modal/BottomSheet jak na stronie głównej, ambient blue bez crossfade, breakpointy siatki 761/1024, reużycie `WorkDeviceDuo`, BackButton w miejscu brandu, współdzielony `Footer.astro` wyodrębniony z sekcji kontakt) — **WDROŻONE w całości** (2026-07-16, wygląd zaakceptowany, spec wizualny + baseline'y darwin gotowe); §6: zaakceptowany trade-off skaczącego paska URL na mobile |
| `analiza-realizacje-karuzela-mobile.md` | **Plan wykonawczy** redesignu Realizacje (`#work`): desktop bez zmian + kafel „Więcej realizacji", mobile pozioma karuzela (snap+peek, tap→BottomSheet) wg `docs/design/Karuzela Mobile - referencja/`; decyzje portu (reużycie `overlay.ts`/`WorkDeviceDuo`/tokenów, globalny ambient), korekty po review (Lenis `data-lenis-prevent-horizontal`, `scroll-snap-stop`, centrowanie slajdu), plan testów — **WDROŻONE** (2026-07-14; baseline'y wizualne czekają na akceptację diffu) |
| `analiza-podstrona-dla-kogo.md` | **Plan wykonawczy** przeniesienia sekcji „Dla kogo" na podstronę `/dla-kogo/` (EN: `/en/who-its-for/`): strona główna zostaje ze statyczną zajawką (pierwsza klatka sceny bez licznika, przycisk `MoreLink` wg `docs/design/export-button-dla-kogo/`), podstrona = pełna animacja 1:1 w trybie `smoothScroll="desktop"` (Lenis na desktopie, mobile natywnie), BackButton + Footer wg wzorca `/realizacje`, CTA rozdziału 03 jako placeholder `#`, navbar „Dla kogo" → podstrona — **WDROŻONE NA PRODUKCJI** (2026-07-16, PR #39; korekty wykonawcze i gotchas w §VII) |
| `analiza-podstrony-oferta.md` | **Plan wykonawczy** podziału sekcji „Oferta" na podstrony `/proces-wspolpracy/` (EN: `/en/process/`) i `/pakiety/` (EN: `/en/packages/`): strona główna zostaje z intro czytanym scrollem + parą CTA wg `docs/design/export-buttony-oferta/`, jeden `Services.astro` z trzema wariantami (teaser/process/packages), chrome podstron wg wzorca `/dla-kogo/` (ambient red, `smoothScroll="desktop"`), nagłówek procesu wg wzorca `pk-head`, CTA pakietów jako placeholdery `#` — **WDROŻONE NA PRODUKCJI** (2026-07-16, PR #41; CI + prod smoke zielone; log w §VII) |
| `analiza-podstrona-o-mnie.md` | **Plan wykonawczy** przeniesienia sekcji „O mnie" na podstronę `/o-mnie/` (EN: `/en/about/`): strona główna zostaje ze statyczną zajawką (tag + ghost + rozdział 01 + ostry portret, `min-height: 100vh` mobile) z buttonem „Więcej o mnie" wg `docs/design/Button - Wiecej o mnie (D5 + MB) - Eksport.html` (nowy `SolidButton.astro`, przełączenie MB→D5 przy 861px), podstrona = pełna animacja 1:1 (`smoothScroll="desktop"`, chrome wg wzorca `/dla-kogo/`, ambient red), CTA finału jako placeholder `#` do migracji kontaktu, navbar „O mnie" → podstrona — **WDROŻONE lokalnie** (2026-07-17: e2e/unit/lint zielone, zajawka po 3 korektach Mateusza — portret w stanie finału + parametry strojenia `--om-teaser-photo-*`, baseline'y darwin zregenerowane po akceptacji; zostało: workflow linux + commit darwin na końcu; log w §VII) |
| `analiza-podstrona-faq.md` | **Plan wykonawczy** teasera FAQ + podstrony `/faq/` (EN: `/en/faq/`): strona główna zostaje z akordeonem 6 pytań + blokiem „Zobacz wszystkie pytania" wg `docs/design/faq-button-referencja/`, podstrona = pełny rejestr 30 pytań z wyszukiwarką 100% frontend wg `docs/design/faq-podstrona-referencja/`; jedno źródło pytań `src/i18n/faq.ts` (tablica `{pl,en}`), JSON-LD FAQPage tylko na podstronie, navbar „FAQ" → podstrona, chrome wg wzorca `/kontakt/` (ambient blue, `smoothScroll="desktop"`) — **W TRAKCIE WDROŻENIA** (2026-07-17) |
| `analiza-podstrona-kontakt.md` | **Plan wykonawczy** przeniesienia sekcji „Kontakt" na podstronę `/kontakt/` (EN: `/en/contact/`): sekcja z formularzem i wszystkimi warstwami antyspamowymi przenosi się w całości (kontrakt `functions/api/kontakt.ts` nietknięty), strona główna zostaje z bannerem CTA wg `docs/design/kontakt-baner.html` (nowy `KontaktBaner.astro`, `id="contact"` zostaje dla starych linków i crossfade'u), Footer wychodzi z sekcji do chrome'u stron, chrome podstrony wg wzorca `/o-mnie/` (ambient red, scroll natywny jak `/realizacje/`), 4 CTA-placeholdery `href="#"` → `/kontakt/`, navbar „Kontakt" → podstrona — **W TRAKCIE WDROŻENIA** (2026-07-17) |
| `first-bigger-improvement-refactor-analysis.md` | **Plan wykonawczy** pierwszego większego refactoru porządkującego (2026-07-15): guard pinch-zoom w Lenis, hot path hero + ambient, martwy kod, helpery sekcji, DRY w testach, sync ekosystemu Claude — **Etapy 1–5 wdrożone i zmergowane** (do 2026-07-16), Etap 6 (dokumentacyjny) w PR `general-refactor-part6`; pozostały: Etap 7 (kandydaci wymagający OSOBNEJ decyzji, §8) oraz ręczne sprzątanie sierot w R2 (§6.6) |
| `claude-code-ecosystem-initialization.md` | **Plan** ekosystemu Claude Code — Etapy 1–5 **wdrożone i przetestowane** (2026-07-06; korekty wdrożeniowe: guard CMS przez skrypt zamiast pola `if`, zawężony glob capture-scripts — patrz ⚠️ w Etapach 2/3); Etap 6 NIE będzie realizowany z tego planu (testy = osobne przedsięwzięcie, lokalnie + CI/CD); Etap 7 (white-label) czeka aż testy zadziałają; status w checkliście §10.3 |

## 🔧 Wdrożone plany/naprawy (czytaj z adnotacjami na górze pliku)

| Plik | Status |
| --- | --- |
| `naprawa-android-scena-urzadzen-mobile.md` | Wdrożone (`ANDROID_DESIGN_SCALE = 0.6`, `--k`) |
| `analiza-android-obudowy-3d-glodza-rasteryzacje.md` | Wdrożone — mobile jest płaskie (`perspective: none`, `transform-style: flat`, bez ekstruzji) |
| `on_mobile_devices_video_analysis.md` | Wdrożone 2026-06-23 + późniejsze zmiany (ciągłe odtwarzanie, spłaszczenie, `--k`) |
| `drewelomet-anim-analysis.md` | Plan wdrożony; nieaktualne: `normalizeScroll` (usunięty), sekcja `Problem` (nie powstała) |
| `analiza-tlo-hero-animowane-chmury.md` | Wdrożone jako `AmbientBackground.astro` (nie w `Hero.astro`); breakpoint tła 768 px ≠ próg sceny 760 px; od 2026-07-13 warianty red/blue (`ambient-palette.ts`) |
| `analiza-refactor-hero-podzial-i-design-system.md` | Plan wykonany i pogłębiony przez „odkruszenie"; inne finalne nazwy faz |

## 🗄️ Historyczne — nie opierać na nich ustaleń

| Plik | Dlaczego nieaktualny |
| --- | --- |
| `analiza-stack-struktura-hosting.md` | Next.js jako cel + stary model danych — unieważnione (Astro, schemat ze Sveltii) |
| `architektura-sekcje-tla-hero-i-kolejne.md` | Świat sprzed sceny urządzeń (Hero = samo tło, ScrollDemo, sekcje Services/Work) |
| `instrukcja-praca-gsap-podglad-tlo-hero.md` | Opisuje ScrollDemo i stary układ komponentów |
| `instrukcja-scaffold-astro-gsap.md` | Instrukcja wykonana; Inter/MDX/brak-Lenisa dawno zastąpione |
| `mobile-photos-system-analysis.md` | System plików `-m` zastąpiony przez R2 + transformacje |

## 🚫 Wariant odrzucony

| Plik | Uwaga |
| --- | --- |
| `hosting_second_analysis_sanity.md` | Wdrożono Sveltię; zachowany jako opcja dla przyszłych projektów klienckich |
