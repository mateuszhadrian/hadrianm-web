# Analiza: przeniesienie sekcji „Kontakt" na podstronę `/kontakt`

Data: 2026-07-17 · Status: **PLAN WYKONAWCZY** (decyzje domknięte
z Mateuszem 2026-07-17; log wykonawczy będzie w §VII).

## I. Cel

Sekcja `#contact` (formularz + antyspam + reveal danych —
`docs/contact-me-form-analysis-implementation.md`) przenosi się **w całości**
na dedykowaną podstronę, analogicznie do `/dla-kogo`
(`docs/analiza-podstrona-dla-kogo.md`), podziału Oferty
(`docs/analiza-podstrony-oferta.md`) i `/o-mnie`
(`docs/analiza-podstrona-o-mnie.md` — najnowszy wzorzec, lustrzany).
Strona główna zostawia w tym miejscu **banner CTA** — DOKŁADNIE wg
referencji `docs/design/kontakt-baner.html` (zakres eksportu oznaczony
markerami; `.preview-stage` to rusztowanie podglądu, tło/atmosfera są już
w aplikacji) — z buttonem „Skontaktuj się ze mną" prowadzącym na podstronę.

Ostatni krok migracji navbara na podstrony (po Realizacjach, Dla kogo,
Ofercie i O mnie) — po nim na głównej z kotwic pozycji menu zostają tylko
`#services` i `#faq`.

## II. Decyzje (ustalone z Mateuszem, 2026-07-17)

| #   | Decyzja                                                                                                                                                                                                                            |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Trasy: PL `/kontakt/`, EN `/en/contact/` (slug idiomatyczny, wzorzec `o-mnie ↔ about`). Stała `CONTACT_PATH` w `src/lib/routes.ts`.                                                                                                |
| D2  | Sekcja Contact przenosi się W CAŁOŚCI: formularz z walidacją i chipsami, readonly-honeypot, zegar 4 s, lazy Turnstile (pierwszy `focusin`), reveal `[ POKAŻ ]` z fragmentów. Kontrakt `functions/api/kontakt.ts` **NIETKNIĘTY**.     |
| D3  | Banner na głównej = NOWY komponent `KontaktBaner.astro`, port zakresu eksportu referencji 1:1; **zachowuje `id="contact"`** — stare linki `/#contact` lądują na bannerze, warstwa crossfade `[data-bg="contact"]` działa bez zmian. |
| D4  | Footer wychodzi z wnętrza `Contact.astro` do chrome'u stron: strona główna renderuje współdzielony `Footer.astro` sama (po sekcji bannera), podstrona — w kontenerze à la `.abp-foot` (pełne lustro AboutPage).                      |
| D5  | Dane kontaktowe (e-mail/telefon z antyscrapingiem) **tylko na podstronie** — banner to czysty port referencji (status + nagłówek + intro + button), bez duplikacji mechaniki reveal.                                                 |
| D6  | i18n bannera: status reużywa `contact.stOn` („Przyjmuję nowe zlecenia"), nagłówek reużywa `contact.kick` („Kontakt"/„Contact"); intro PL 1:1 z referencji + EN wg propozycji (zaakceptowane); button = nowy klucz.                   |
| D7  | Banner mobile: `min-height: 100vh` (rytm zajawek — jedna zajawka ≈ jeden ekran), treść wyśrodkowana; button pełna szerokość < 861 px, desktop auto (breakpoint 861 px jak cały projekt).                                             |
| D8  | Animacje bannera (ringi/sheen/puls) CSS-only, WYŁĄCZNIE `≥861px` + `prefers-reduced-motion: no-preference` — dokładnie jak w referencji, spójnie z bramkami motion projektu.                                                        |
| D9  | Tokeny bannera: `--kt-ink #F5F0EC → var(--ink)`, `--kt-accent #FF5A47 → var(--accent)` (`--kt-glow → var(--glow)`); `#180A08` (tekst na jasnym buttonie) bez odpowiednika globalnego → wartość lokalna (wzorzec SolidButton D10).    |
| D10 | Chrome podstrony jak `/o-mnie` (AboutPage.astro): Navbar bez brandu + `langHrefs`, fixed BackButton (`a[data-back]`) w slocie brandu, współdzielony Footer, JEDNA statyczna warstwa `AmbientBackground variant="red"` (tło #contact na głównej — potwierdzone w `Home.astro:45`). |
| D11 | Scroll podstrony: **natywny** (`smoothScroll={false}`, jak `/realizacje/`) — brak pinowanych scen, tylko reveale wejść (ScrollTrigger działa niezależnie od Lenisa); strona formularzowa = natywny fokus pól i autoscroll błędów.    |
| D12 | Navbar: pozycja „Kontakt" prowadzi wprost na podstronę — `SUBPAGE_PATHS` w `Navbar.astro` += `contact: CONTACT_PATH`.                                                                                                                |
| D13 | Placeholdery `href="#"` — WSZYSTKIE 4 → `CONTACT_PATH[lang]`: `om-cta` (finał About na `/o-mnie/`), `dk-cta` (Audience), `pk-cta` i `dlink` (pakiety w Services); listenery `preventDefault` i wyjątki eslint wypadają.              |
| D14 | Meta (zaakceptowane): PL `Kontakt — hadrianm.pl` + description „Skontaktuj się ze mną — formularz kontaktowy, e-mail i telefon. Napisz, czego potrzebujesz: nowa strona, wsparcie aplikacji czy pytania o proces współpracy. Odpowiadam do 24 h w dni robocze."; EN `Contact — hadrianm.pl` + „Get in touch — contact form, e-mail and phone. Tell me what you need: a new website, app support or questions about the process. I reply within 24 h on business days." |
| D15 | `@prod-smoke`: sonda POST `/api/kontakt` z honeypotem BEZ ZMIAN (endpoint niezależny od strony hostującej) + nowy lekki smoke GET `/kontakt/` i `/en/contact/` (200 + obecność `.kt-form`).                                          |
| D16 | Testy: pełen komplet (e2e lustro `about-index.spec.ts`, `contact.spec.ts` przechodzi na podstronę, banner w `sections.spec.ts`, a11y +2 ścieżki); baseline'y darwin DOPIERO po akceptacji diffów → workflow linux → commit darwin na końcu. |

## III. Architektura

### III.1. `KontaktBaner.astro` — banner na głównej

`src/components/sections/contact/KontaktBaner.astro` (żyje obok sekcji —
to jej „zajawka"). Markup i CSS = zakres eksportu referencji (klasy
`kt-cta__*` bez zmian), opakowany w sekcję:

- `<section id="contact" class="ktb">` (D3) — `aria-label` z nav jak
  w dzisiejszej sekcji; `id` utrzymuje crossfade RED i stare linki
  `/#contact`;
- sekcja: `min-height: 100vh`, grid `place-items: center`, treść
  `.kt-cta` 1:1 z referencji (status z diamentem+ringami → nagłówek `h2`
  „Kontakt" → intro → button);
- teksty: `contact.stOn` + `contact.kick` (reuse), `contact.bannerIntro`
  (nowy, PL 1:1 z referencji) i `contact.bannerCta`
  („Skontaktuj się ze mną" / EN — §III.4) — D6;
- button: `href={CONTACT_PATH[lang]}` (trailing slash — format
  canonicalowy, Pages robi 308 na wariancie bez slasha);
- fonty: `'Archivo'` z referencji → `var(--font-display)` (nagłówek) /
  `var(--font-body)` (reszta), `'Space Mono'` → `var(--font-mono)`
  (wzorzec portów sekcji — mono z tokenów, nie Space Mono);
- tokeny wg D9; `--kt-cz` zostaje lokalne (ta sama krzywa co w sekcji);
- animacje: blok `@media (min-width:861px) and (prefers-reduced-motion:
  no-preference)` + keyframes 1:1 z referencji (D8); poniżej 861 px
  i przy reduce — statyczny diament bez ringów, button bez sheen/pulsu
  (`display:none` ringów/sheen jak w referencji);
- zero JS — banner jest w pełni statyczny (nawigacja zwykłym linkiem).

### III.2. Zmiany w `Contact.astro` + chrome stron (D4)

- `Contact.astro`: wypada import i render `<Footer>` (linia 235), CSS
  osadzenia `.kt :global(.ft)` (desktop + mobile) oraz animacja wejścia
  footera (`.kt.js :global(.ft)`); w `contact-scroll.ts` wypada trigger
  footera (i `CONTACT_FOOTER_START` z configu, jeśli nigdzie indziej nie
  używany). Footer na wszystkich stronach jest teraz częścią chrome'u —
  statyczny (jak na `/o-mnie/`, `/realizacje/`).
- Sekcja poza tym przenosi się 1:1 (markup, style, `contact-ui.ts`,
  `contact-scroll.ts`, kotwica `id="contact"` — selektory modułów
  i testów działają bez zmian).
- `Home.astro`: `<Contact>` → `<KontaktBaner>`; po `</main>` (przed
  `<LowPowerNotice>`) wchodzi kontener stopki `.hm-foot` z współdzielonym
  `<Footer lang={lang} />` — te same wymiary co `.abp-foot`
  (`max-width: 1320px; margin: 0 auto; padding: 0 5vw 42px`).

### III.3. Nowe pliki

| Plik                                                    | Rola                                                                                                                                                     |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/sections/contact/KontaktBaner.astro`    | Banner CTA na głównej (§III.1).                                                                                                                            |
| `src/components/ContactPage.astro`                      | Layout podstrony (lustro `AboutPage.astro`): ambient **red** statyczny, Navbar bez brandu, fixed BackButton, Footer, **`smoothScroll={false}`** (D11), `alternates={CONTACT_PATH}`; klasy `ktp-bg` / `ktp-back` / `ktp-foot` wg wzorca `abp-*`. |
| `src/pages/kontakt.astro`                               | `<ContactPage lang="pl" />`                                                                                                                                |
| `src/pages/en/contact.astro`                            | `<ContactPage lang="en" />`                                                                                                                                |

`ContactPage.astro` vs `AboutPage.astro` — różnice wyłącznie: treść
(`<Contact>`), `smoothScroll={false}` zamiast `"desktop"` i klucze meta.

### III.4. Zmiany w istniejących plikach

- `src/lib/routes.ts` — `CONTACT_PATH = { pl: "/kontakt/", en: "/en/contact/" }`.
- `src/i18n/ui.ts` — nowe klucze PL/EN: `contact.bannerIntro` (PL 1:1
  z referencji; EN: „Want to commission a new website, need support with
  your app, or simply have questions about the collaboration process?
  Head over to the contact page — send a message or give me a call, and
  tell me exactly what you need."), `contact.bannerCta`
  („Skontaktuj się ze mną" / „Get in touch with me"), `contactPage.title`,
  `contactPage.description` (brzmienia D14), `contactPage.back`
  („Wróć" / „Back").
- `src/components/navbar/Navbar.astro` — `SUBPAGE_PATHS` += `contact` (D12).
- `src/components/sections/faq/Faq.astro` — CTA „Napisz do mnie":
  `href="#contact"` → `CONTACT_PATH[lang]`; pętla `handleAnchorClick`
  po `#faq a[href^="#"]` zostaje bez celu → wypada razem z importem
  (link nawiguje natywnie).
- `src/components/PolicyPage.astro` — `contactHref`: `/#contact` →
  `/kontakt/`, `/en/#contact` → `/en/contact/` (×2 pola + ×2 linki
  inline w treści); `mailFallback` przestaje mówić o „sekcji kontakt
  strony głównej" → „na stronie kontaktu" (dokument prawny — brzmienie
  do potwierdzenia przy review diffów).
- Placeholdery (D13): `About.astro` (`om-cta`), `Audience.astro`
  (`dk-cta`), `Services.astro` (`pk-cta`, `dlink`) — `href="#"` →
  `CONTACT_PATH[lang]`; wypadają listenery `preventDefault`, komentarze
  „TYMCZASOWY wyjątek a11y" i `eslint-disable-next-line
  astro/jsx-a11y/anchor-is-valid`.

## IV. Testy (kontrakt `.claude/rules/testing.md`)

1. **Unit** — parytet kluczy i18n PL/EN łapie `i18n.test.ts`;
   `contact-form.test.ts` (kontrakt endpointu) nieruszany.
2. **E2E**:
   - `contact.spec.ts` — cała suita przechodzi na podstronę: `gotoContact`
     dostaje `CONTACT_PATH.pl` (EN: `CONTACT_PATH.en`), describe'y
     reduce/no-JS nawigują na `/kontakt/`; asercja stopki
     `#contact .ft` → footer w chrome strony (`.ktp-foot .ft`); grep
     antyscrapingowy dist bez zmian (obejmuje nowe strony automatycznie).
   - nowy `contact-index.spec.ts` (lustro `about-index.spec.ts`):
     meta/canonical/hreflang obu wersji, sekcja z formularzem na
     podstronie, scroll natywny (`data-smooth-scroll="off"`, brak
     `window.__lenis`), navbar (aria-current, kotwice → główna,
     przełącznik języka → odpowiedniki), BackButton (history.back),
     zero błędów konsoli/404; **banner na głównej**: `id="contact"`,
     status `contact.stOn`, button → `CONTACT_PATH`, BRAK `.kt-form`
     na głównej.
   - `navigation.spec.ts` — mobilny klik `.m-link[href="#contact"]`
     przesiada się na pozostałą kotwicę (`#faq`); dochodzi mobilny test
     „pozycja Kontakt nawiguje na podstronę" (wzorzec Realizacji).
   - `faq.spec.ts` — test CTA: zamiast hash+pozycja → nawigacja na
     `CONTACT_PATH` i widoczny `.kt-form`.
   - `policy.spec.ts` — asercja `${p.backHref}#contact` → `CONTACT_PATH`.
   - przegląd asercji placeholderów `href="#"` w specach
     about/audience/services → asercje `href=CONTACT_PATH`.
   - `smoke.spec.ts` (@prod-smoke) — POST honeypot bez zmian + GET obu
     ścieżek podstrony (200, `.kt-form` w DOM) — D15.
   - `seo.spec.ts` — crawl łapie nowe strony sam; przegląd założeń.
3. **Visual** — `sections.spec.ts`: wpis `contact` ZOSTAJE (ten sam
   `id`/nazwa snapshotu `section-contact.png`) — baseline zmieni się
   z formularza na banner (diff do akceptacji); przegląd progu pixel-5
   0.02 (sekcja niższa — być może zbędny). Nowy
   `tests/visual/contact-index.spec.ts` (wzorzec `work-index.spec.ts`)
   ze zrzutem podstrony ×6 profili. GOTCHA: pierwszy przebieg AUTO-ZAPISZE
   brakujące snapshoty podstrony — usunąć, wygenerować dopiero
   zatwierdzonym `pnpm test:visual:update`.
4. **a11y** — `a11y.spec.ts`: ścieżki += `/kontakt/`, `/en/contact/`;
   ratchet bez nowych wpisów (sekcja już przechodziła axe na głównej).
5. **Baseline'y** — zmienią się: `section-contact` ×6 (banner zamiast
   formularza), nowe zrzuty podstrony ×6, możliwy churn sweepu FAQ /
   element-screenshotów (zmiana wysokości głównej — sekcja ~jednoekranowa
   zamiast wysokiego formularza; „wszyty" navbar). Procedura: kod →
   diffy do akceptacji Mateusza → `pnpm test:visual:update` (darwin) →
   workflow `update-visual-baselines.yml` (linux) → commit darwin NA
   KOŃCU (reguła `visual-baselines-ci-ordering`).
6. **Lighthouse** — główna lżejsza (bez formularza i lazy-chunków
   Turnstile/contact-ui); budżety ratchet nie powinny ucierpieć.

## V. Etapy

1. **Fundament**: `routes.ts` (`CONTACT_PATH`), klucze i18n
   (`contact.banner*`, `contactPage.*`).
2. **Banner + główna**: `KontaktBaner.astro`, `Home.astro`
   (banner zamiast sekcji, `.hm-foot` z Footerem).
3. **Podstrona**: `Contact.astro` bez inline Footera (+ korekta
   `contact-scroll.ts`), `ContactPage.astro`, `pages/kontakt.astro`,
   `pages/en/contact.astro`.
4. **Nawigacja i linki**: `Navbar.astro` (`SUBPAGE_PATHS`), `Faq.astro`,
   `PolicyPage.astro`, placeholdery ×4 (About/Audience/Services).
5. **Testy**: aktualizacje §IV + nowe specy.
6. **Weryfikacja + baseline'y**: `pnpm typecheck && pnpm test:unit`,
   `pnpm build && pnpm test:e2e && pnpm test:visual` → diffy → akceptacja
   Mateusza → regeneracja darwin → workflow linux → commit darwin na
   końcu (D16). Po wdrożeniu na produkcję: ręczny test wysyłki na
   `/kontakt/` (W1–W3 — jak Etap 4 planu formularza).

## VI. Ryzyka / gotchas

- **Kontrakt endpointu**: `/api/kontakt`, sekrety, WAF i hostnames
  Turnstile są niezależne od ścieżki strony (hostname się nie zmienia) —
  zero zmian w dashboardach. Sonda `@prod-smoke` pilnuje żywotności.
- **Dwa `id="contact"` w projekcie** (banner na głównej, sekcja na
  podstronie) — różne strony, brak konfliktu; `contact-ui.ts` /
  `contact-scroll.ts` odpytują `#contact` w kontekście strony, na której
  żyją (na głównej moduły nie są ładowane — nie ma sekcji, skrypt
  `Contact.astro` nie istnieje w bundlu głównej).
- **Footer bez animacji wejścia** na głównej (dziś wjeżdżał z sekcją
  kontakt) — świadoma zmiana na spójność z podstronami; ocena przy
  review diffów.
- **Padding sekcji na podstronie** (`216px` top — projektowany pod finał
  one-pagera): na podstronie sekcja zaczyna pod navbarem; ocena kadru
  przy review diffów (ewentualna korekta w scoped CSS ContactPage, nie
  w sekcji).
- **`.m-link[href="#contact"]`** i inne twarde selektory testów — pełna
  lista zależności zmapowana (nav mobile, FAQ, polityka, sections.spec);
  poprawki w §IV.
- **PolicyPage = dokument prawny** — podmiana linków i `mailFallback`
  do potwierdzenia przez Mateusza przy review.
- **Auto-zapis snapshotów Playwrighta** przy nowym specu visual — usunąć
  pierwszy przebieg, generacja tylko zatwierdzonym updatem.
- **Skok paska URL na mobile** — zaakceptowany na poprzednich
  podstronach, tu identycznie.
- **Czego emulacja nie wykryje**: realny Turnstile (stubowany w testach)
  — po wdrożeniu ręczny test wysyłki na produkcyjnym `/kontakt/`
  (pkt V.6); zachowanie klawiatury ekranowej przy fokusie pól na
  fizycznym telefonie (natywny scroll powinien pomóc, nie zaszkodzić).

## VII. Log wykonawczy (2026-07-17)

Etapy 1–5 wdrożone zgodnie z planem. Korekty wykonawcze:

- **`--kt-muted` zostaje lokalne** (`--ktb-muted: rgba(245,240,236,0.62)`
  w `KontaktBaner.astro`): wartość referencji (0.62) ≠ globalne `--muted`
  (0.58) — D9 mapuje tylko tokeny o zgodnych wartościach.
- **Pętla kotwic w `Faq.astro` usunięta w całości** (nie tylko
  przepięta): po zamianie CTA na pełną ścieżkę w sekcji nie ma już
  żadnego `a[href^="#"]` — `handleAnchorClick` wypadł z importów.
- **`/kontakt/` na 1920×1080 mieści się w ~jednym viewporcie**
  (sekcja 989 px + stopka ≈ 1073 px < 1080): sekwencja „pasek chowa się
  przy scrollu w dół" z lustra about-index jest tam niewywoływalna —
  test back buttona na podstronie sprawdza inwariant przycisku (fixed
  u góry po zjeździe na dół strony), chowanie paska weryfikują długie
  podstrony.
- **`policy.spec.ts` — test linków polityki na głównej** zakładał notę
  RODO (`.kt-note`) na stronie głównej; po migracji nota żyje przy
  formularzu — test rozdzielony: stopka na głównej + nota i stopka na
  `/kontakt/`.
- **`navigation.spec.ts` mobile** przesiadł się z kotwicy `#contact` na
  `#faq` (ostatnia pozycja-kotwica obok `#services`); doszedł test
  „pozycja Kontakt nawiguje na podstronę" (wzorzec Realizacji).

Wyniki weryfikacji (Etap 6, przed baseline'ami):

- typecheck / lint / unit: zielone (70 testów); build: 16 stron
  (doszły `/kontakt/` i `/en/contact/`).
- e2e: pełna suita zielona po korektach wyżej — **524 pass, 0 fail**
  (pierwszy przebieg: 521 pass / 3 fail — wszystkie trzy opisane wyżej).
- visual: **26 failów — W CAŁOŚCI oczekiwane kategorie**:
  1. `contact-index-{top,form,footer}` ×6 profili — NOWE zrzuty podstrony
     (auto-zapis Playwrighta usunięty, powstaną przy zatwierdzonym
     `pnpm test:visual:update`);
  2. `section-contact` ×6 — banner CTA zamiast formularza (zamierzona
     zmiana wyglądu);
  3. pixel-5: `section-work` (1645 px, ratio 0.01) i `faq-04-cta`
     (311 px, ratio 0.01) — subpikselowy ghosting po zmianie wysokości
     strony głównej (znane zjawisko, memory `audience-section`).
- Diffy zebrane do przeglądu Mateusza (galeria HTML w scratchpadzie
  sesji); baseline'y darwin DOPIERO po akceptacji → workflow linux →
  commit darwin NA KOŃCU (reguła `visual-baselines-ci-ordering`).

**Korekta Mateusza po pierwszym przeglądzie (2026-07-17, potwierdzona):**

1. **Footer wraca DO sekcji bannera na głównej** (uchyla home'ową część
   D4; podstrona bez zmian): `.hm-foot` usunięty z `Home.astro`,
   `.ktb-foot` w sekcji (wymiary jak `.abp-foot`). **Korekta 2 rundy**
   (stopka w flow „przepychała" CTA do góry o połowę swojej wysokości):
   sekcja = **grid-stack** `min-height: 100vh` — `.ktb-stage` i
   `.ktb-foot` w TEJ SAMEJ komórce (`grid-area: 1/1`), CTA centruje się
   względem pełnych 100vh, stopka `align-self: end` nakłada się na dole
   ramy. Zmierzone: CTA idealnie w pionowym środku na 375×667 / 390×844 /
   1920×1080 (luz do stopki odpowiednio 13/101/256 px). Niskie viewporty
   (`max-height: 640px`, landscape telefonu — centrowane CTA weszłoby pod
   stopkę) mają fallback do flow. **Korekta 3 rundy** (iPhone 12 mini /
   SE 2020: CTA za wysoko — iOS Safari przy dnie scrolla trzyma
   zminimalizowany pasek, więc rama `100vh` była wyższa niż widoczny
   viewport i środek uciekał w górę; Android chowa pasek do zera, stąd
   tam było dobrze): rama = **`100dvh`** (fallback `100vh` dla iOS
   <15.4) — odstęp góra viewportu ↔ status równy co do piksela
   odstępowi button ↔ dół viewportu na każdym urządzeniu (sonda:
   159/159, 232/231, 247/248, 340/340 px), kosztem wysokości ostatniej
   sekcji żyjącej ze stanem paska (zaakceptowane); zwijania paska iOS
   emulacja nie odda — finalna weryfikacja na fizycznym iPhonie
   Mateusza.
2. **Desktopowe „odzoomowanie" CTA** (`kontakt-baner-scroll.ts`,
   dynamiczny import za bramką motion — wzorzec sekcji): scale
   `KTB_ZOOM_FROM = 1.4` → 1 scrubem od „top bottom" do „bottom bottom"
   (banner = ostatnia sekcja, koniec scruba = dno strony); gałąź
   desktop/mobile przez `motionMedia` (mobile bez zooma); stan startowy
   w CSS za klasą `.js` (para literał ↔ stała jak wszędzie); no-JS
   i reduce = statyczna skala 1; `overflow: hidden` na sekcji (zzoomowane
   CTA nie rozpycha strony).
3. Testy: `contact-index.spec.ts` — footer w `#contact .ktb-foot` +
   nowy test skali (start > 1.2, dno strony ≈ 1); element-screenshot
   `section-contact` obejmuje teraz stopkę (sekcja z footerem).
