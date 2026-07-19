# Analiza — podstrona `/oferta/` (hub oferty)

> Status: **WDRAŻANE** (2026-07-19). Referencja wizualna:
> `docs/design/export-oferta-hub/` (wariant B: wstęp + karty Pakiety /
> Proces). Referencja pokazuje TYLKO wygląd i zachowanie sedna podstrony —
> nic z niej nie jest osadzane 1:1; port na tokeny i komponenty projektu.

## I. Kontekst i cel

Po podziale sekcji „Oferta" (`docs/analiza-podstrony-oferta.md`, PR #41)
strona główna miała zajawkę z parą CTA, a pozycja navbara „Oferta" była
OSTATNIĄ kotwicą `#services` w menu. Cel: pełnoprawna podstrona-hub
`/oferta/` (EN: `/en/services/`) jako cel wszystkich odwołań do oferty;
sekcja na stronie głównej zostaje treścią dostępną wyłącznie scrollem.

## II. Decyzje (potwierdzone z Mateuszem 2026-07-19)

| #   | Decyzja                                                                                                                                                     |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Slug EN: **`/en/services/`** (spójny z etykietą navbara „Services" i konwencją tłumaczonych slugów); stała `SERVICES_PATH` w `src/lib/routes.ts`            |
| D2  | Navbar: „Oferta" w `SUBPAGE_PATHS` — prowadzi na `/oferta/` z KAŻDEJ strony (także z głównej); w menu nie ma już żadnej pozycji-kotwicy                      |
| D3  | Para CTA zajawki na stronie głównej BEZ ZMIAN (`/pakiety/` + `/proces-wspolpracy/`) — hub nie jest obowiązkowym krokiem pośrednim                            |
| D4  | Buttony na hubie = w stopkach kart (jak referencja): primary `AnimatedCta` w karcie Pakiety, split w karcie Proces; skórka splita wydzielona do `SplitCta.astro`, `OfertaButtons` zostaje wrapperem pary dla zajawki — JEDNO źródło stylów |
| D5  | Zakres treści: **hub 1-ekranowy** (wstęp + 2 karty, wycentrowane na `min-height: 100svh`) + współdzielony Footer                                             |
| D6  | Scroll: w pełni **natywny** (`smoothScroll={false}`, wzorzec `/realizacje/`) — strona krótka, bez scen scrubowanych                                          |
| D7  | Wejście: delikatny reveal wstęp → karta 1 → karta 2 (klasa `on` z `revealOnce`, stagger przez `transition-delay`); tylko przy no-preference, bez JS wszystko widoczne |
| D8  | Poza navbarem na `/oferta/` wskazuje też CTA rozdziału 03 „Poznaj ofertę" na `/dla-kogo/` (`dk-cta`, dotąd tymczasowo `/kontakt/`)                           |

Dodatkowe ustalenia portu:

- Tło: ambient **red** statyczny (jak `/pakiety/` i `/proces-wspolpracy/`),
  chrome strony wg wzorca `ServicesSubpage` (BackButton w miejscu brandu,
  współdzielony Footer, navbar bez brandu).
- Architektura: **czwarty wariant `hub`** w `Services.astro` (reużycie
  chrome'u sekcji: tag, meta, tokeny, breakpoint 861px) + gałąź `initHub`
  w `services-scroll.ts` (tylko `revealOnce`).
- Tag chrome'u: **`02 / Oferta`** — numeracja sekcji jak na stronie głównej
  i jak `05 / FAQ` na `/faq/` (korekta Mateusza 2026-07-19; wcześniejsze
  `Oferta / Przegląd` odrzucone, klucz `services.tagHub` usunięty).
- Nagłówek mobile jak na siostrzanych podstronach (korekty Mateusza
  2026-07-19): tag wysoko jak na `/kontakt/` (56px), pod nim ghost
  „oferta" W CAŁOŚCI nad kickerem (wzorzec `kt-ghost`: od prawej,
  `right: 14px / top: 66px`), niżej czerwony mono-kicker w wersji
  SKRÓCONEJ — „Dopasowane rozwiązania" (osobny klucz
  `services.hub.kicker`; pełne `services.meta` zostaje na desktopie
  w prawym górnym rogu); mobile startuje od góry (bez centrowania).
  Desktop bez zmian — meta w prawym górnym rogu, bez ghosta.
- Serif we wstępie: token `--accent-gradient` (identyczny z `--serif-grad`
  referencji) + `--font-serif` italic.
- Teksty: nowe klucze `services.hub.*` + `servicesPage.*` w `src/i18n/ui.ts`
  (PL wg referencji, EN tłumaczone); nazwy kart reużywają
  `services.tagPackages` / `services.tagProcess`, etykiety buttonów —
  istniejące `services.ctaPackages` / `services.ctaProcess(+Sub)`.
- Świadomy trade-off (jak w referencji): po revealu transition karty
  zostaje 0.8s, więc hover-lift płynie wolniej niż bazowe 0.35s — cena za
  brak dodatkowego wrappera animacyjnego.

## III. Etapy wdrożenia

1. **Fundamenty**: `SERVICES_PATH` w `routes.ts`; klucze i18n PL/EN.
2. **Buttony**: wydzielenie `SplitCta.astro` z `OfertaButtons.astro`
   (klasy `pp-*` zostają — kontrakt DOM testów e2e); `OfertaButtons` =
   wrapper pary (`AnimatedCta` + `SplitCta`).
3. **Hub**: wariant `hub` w `Services.astro` (markup `.ofh*` + CSS desktop/
   mobile/wąski-desktop + stany startowe revealu) + `initHub`
   w `services-scroll.ts`; bramka inline script rozszerzona o `hub`.
4. **Strony**: `kind="hub"` w `ServicesSubpage.astro`
   (`smoothScroll={false}`), `src/pages/oferta.astro`,
   `src/pages/en/services.astro`.
5. **Nawigacja**: `services: SERVICES_PATH` w `SUBPAGE_PATHS` navbara;
   `dk-cta` w `Audience.astro` → `SERVICES_PATH`.
6. **Testy**: `navigation.spec` (koniec ery kotwic w menu),
   `services-subpages.spec` (wpisy huba: meta, treść, scroll natywny,
   przepływy kart + back, fallback no-JS), asercje navbara w 5 specach
   `*-index`, `audience-index` (dk-cta), `a11y.spec` (+2 ścieżki),
   `tests/visual/services.spec.ts` (sweep huba, 3 klatki).
7. **Weryfikacja**: format → lint → typecheck → unit → build → e2e →
   visual (nowe baseline'y darwin po akceptacji; komplet linux przez
   workflow `update-visual-baselines.yml`).

## IV. Log wykonania

- 2026-07-19: Etapy 1–7 wykonane w jednej sesji (branch
  `fix/design-corrections-plan1`). Weryfikacja: lint 0/0, `astro check`
  0 błędów, unit 75 ✓, e2e 628 ✓ (pełny przebieg), visual 12 ✓ po
  wygenerowaniu baseline'ów darwin `services-hub-0{1,2,3}` (3 profile;
  hover tylko chromium-1920). Komplet linux — workflow
  `update-visual-baselines.yml` w PR.
- Korekta wykonawcza: `.pp-sub` (podpis mono splita) z referencyjnego
  `.38` na token `--faint` (0.5) — ratchet axe zgłosił color-contrast na
  hubie (na stronie głównej para CTA jest `opacity: 0` w chwili skanu,
  więc axe jej nie łapał); allowlisty nie wolno rozszerzać, poprawka
  zgodna z precedensem 2026-07-13 (cały drobny druk → 0.5). Wizualnie:
  minimalnie jaśniejszy podpis „Jak wygląda praca ze mną" także na
  głównej (poniżej progów diffu istniejących baseline'ów).
