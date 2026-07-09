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
| `claude-code-ecosystem-initialization.md` | **Plan** ekosystemu Claude Code — Etapy 1–5 **wdrożone i przetestowane** (2026-07-06; korekty wdrożeniowe: guard CMS przez skrypt zamiast pola `if`, zawężony glob capture-scripts — patrz ⚠️ w Etapach 2/3); Etap 6 NIE będzie realizowany z tego planu (testy = osobne przedsięwzięcie, lokalnie + CI/CD); Etap 7 (white-label) czeka aż testy zadziałają; status w checkliście §10.3 |

## 🔧 Wdrożone plany/naprawy (czytaj z adnotacjami na górze pliku)

| Plik | Status |
| --- | --- |
| `naprawa-android-scena-urzadzen-mobile.md` | Wdrożone (`ANDROID_DESIGN_SCALE = 0.6`, `--k`) |
| `analiza-android-obudowy-3d-glodza-rasteryzacje.md` | Wdrożone — mobile jest płaskie (`perspective: none`, `transform-style: flat`, bez ekstruzji) |
| `on_mobile_devices_video_analysis.md` | Wdrożone 2026-06-23 + późniejsze zmiany (ciągłe odtwarzanie, spłaszczenie, `--k`) |
| `drewelomet-anim-analysis.md` | Plan wdrożony; nieaktualne: `normalizeScroll` (usunięty), sekcja `Problem` (nie powstała) |
| `analiza-tlo-hero-animowane-chmury.md` | Wdrożone jako `AmbientBackground.astro` (nie w `Hero.astro`); breakpoint tła 768 px ≠ próg sceny 760 px |
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
