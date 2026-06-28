# Hosting, CI/CD i ścieżka do CMS — analiza decyzyjna

> Dokument decyzyjny. Cel: po przeczytaniu wiesz **gdzie hostować**, **jak ustawić CI/CD** i **jaką ścieżką iść do CMS-a** (dla siebie i dla klientów) — przy nadrzędnym kryterium **maksymalnej taniości**.
> Stan kodu w chwili analizy: Astro 6, `output: "static"`, PL/EN, React-islands + GSAP/Lenis/Tailwind 4, ~3,4 MB assetów lokalnie, **brak backendu/testów/CI**. Repo: `mateuszhadrian/hadrianm-web`. Domena docelowa: `hadrianm.pl`.
> Ceny: orientacyjne, stan **~połowa 2026**; traktuj jako rząd wielkości, nie ofertę — sprawdź u dostawcy przed zobowiązaniem.

---

## 0. Streszczenie wykonawcze (TL;DR)

**Faza 1 — wizytówka, TERAZ:**

- **Hosting: Cloudflare Pages.** Darmowy, komercyjny użytek dozwolony, nielimitowany transfer, brak karty. Dla statycznego Astro to wybór bez haczyka. Vercel **odpada w produkcji** (Hobby = niekomercyjny, a Twoja strona JEST komercyjna; Pro to 20 $/mies. bez realnej korzyści dla statyka).
- **Media (obrazy + krótkie klipy): zostają jako statyczne assety** serwowane z CDN Cloudflare. **Backend „na obrazki" teraz = zbędny koszt i komplikacja.** Próg przejścia na zewnętrzny storage opisany niżej.
- **CI/CD: deploy robi platforma** (integracja Git → push → build → deploy + preview na każdy PR). **GitHub Actions = tylko bramka jakości** (lint, typecheck, build, format). Testy świadomie później — gotowy „slot" w workflow czeka.
- **Koszt fazy 1: 0 zł/mies.** + domena (~50-70 zł/rok u rejestratora).

**Faza 2 — CMS (przyszłość):**

- **Twoja strona:** nie potrzebujesz „prawdziwego" CMS-a z logowaniem. Treści (Realizacje, O mnie, opinie) → **content collections** (pliki w repo, walidacja Zod). Edytujesz przez Git/edytor. Koszt **0 zł**. Opcjonalnie lekka nakładka **Sveltia/Decap CMS** (web-owy panel piszący commity), też **0 zł**.
- **Wideo:** krótkie klipy (≤15-30 s) → **Cloudflare R2** (10 GB free, **brak opłat za egress** — to klucz). Dłuższe filmy (do 2 min, opowieści klientów) → **Cloudflare Stream** albo **Bunny Stream** (grosze), ewentualnie **YouTube/Vimeo unlisted** za 0 zł na start.
- **Strony klientów:** model **agencyjny, per-klient na koncie klienta**. Domyślny przepis na „klient nie płaci nic miesięcznie": **Astro + Cloudflare Pages + Git-CMS (Sveltia/Decap) + R2 na media**. Recurring ≈ **0 zł** (klient płaci tylko za domenę u rejestratora; Tobie płaci raz za wykonanie).
- **Supabase** (Postgres + Auth + Storage + RLS) wchodzi dopiero, gdy klient potrzebuje **dynamiki/loginu/danych** (rezerwacje, konta, dużo często edytowanej treści). Uwaga: free tier **usypia projekt po tygodniu bezczynności** — zła cecha dla rzadko ruszanych stron-wizytówek; Pro to 25 $/mies. (ponad budżet klienta). Dlatego Supabase ≠ domyślny wybór dla prostej wizytówki klienta.
- **WordPress:** sensowny **wyłącznie** dla segmentu „bardzo prosta strona, szybko (1-2 tyg.), klient chce znajomy panel, zero wodotrysków". Dla stron klasy tej wizytówki (GSAP/3D/pinning) to regres.
- **Next.js: NIE przepisywać teraz.** Astro spina Supabase/CMS/Stripe bez problemu. Next dopiero, gdy klient potrzebuje realnej aplikacji (dashboard z ciężkim stanem). Trzymając wyspy w React+Tailwind, ewentualna migracja jest tania.

**Rekomendowana ścieżka:** wystaw obecne Astro na Cloudflare → dodaj Actions jako bramkę → (gdy pojawią się realizacje) content collections → (gdy wideo urośnie) R2/Stream → (gdy pierwszy klient) sklonuj przepis z Git-CMS → (dopiero przy realnej aplikacji) Next + Supabase.

---

## 1. Założenia wyprowadzone z Twoich odpowiedzi

| #   | Ustalenie                                                                                                                         | Konsekwencja dla architektury                                                            |
| --- | --------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 1   | „Strony klientów + CMS" to **kierunek długoterminowy**, nie najbliższy miesiąc                                                    | Nie przepisujemy wizytówki teraz; najpierw produkcja obecnego Astro                      |
| 2   | Treścią własnej strony zarządzasz **tylko Ty**                                                                                    | Dla siebie: content collections w Git, **bez** panelu z loginem                          |
| 3   | Wizytówka jest **komercyjna**                                                                                                     | **Twardy constraint: Vercel Hobby wykluczony w produkcji** → Cloudflare                  |
| 4   | Media: długo głównie zdjęcia + krótkie klipy; **w przyszłości** filmy do 2 min (opowieści klientów); klienci wrzucają klipy ~15 s | Static teraz; zewn. storage/streaming **przygotowany**, włączany progowo                 |
| 5   | Budżet: **Ty ≤ 15 $/mies. całość; klient ≤ 10 $/mies., docelowo 0 $ recurring**                                                   | Architektura ma dążyć do **0 $ recurring** dla klienta; płatne tiery tylko gdy konieczne |
| 6   | Formularz/booking: wg rekomendacji                                                                                                | Cal.com + mailto/Formspree/Pages Functions; **bez własnego serwera**                     |
| 7   | **„Astro tak długo, jak się da"** (klienci bez dashboardów)                                                                       | Astro = domyślny stack; Next tylko wyjątkowo                                             |
| 8   | WordPress rozważany **dla bardzo prostych stron klientów** (szybko, z panelem)                                                    | WP = osobny segment oferty, nie dla stron klasy wizytówki                                |
| 9   | Strony klientów: **osobny projekt per klient, na koncie klienta**                                                                 | Brak multi-tenant na start; klient = właściciel i płatnik                                |
| 10  | Auth/CMS „wszystko w jednym" = zaleta                                                                                             | Gdy potrzebny realny backend → **Supabase** (DB+Auth+Storage+RLS)                        |

---

# CZĘŚĆ I — Faza 1: wizytówka teraz (bez backendu)

## 2. Audyt stanu obecnego (punkt wyjścia)

- **Typ builda:** czysty SSG (`output: "static"`) → wynik to statyczne pliki HTML/CSS/JS + assety. **Nie potrzebuje żadnego runtime'u serwerowego.** To najtańszy możliwy profil hostingu (zwykły CDN).
- **Rozmiar:** `dist/` ≈ 4,4 MB, `public/` ≈ 3,4 MB. 40× WebP (największy 384 KB) + 3× MP4 (max ~800 KB). To **bardzo mało** — mieści się w każdym darmowym tierze z ogromnym zapasem.
- **i18n:** PL = root, EN = `/en/` (`prefixDefaultLocale: false`). Sitemap generowany (`@astrojs/sitemap`). Dobre pod SEO.
- **Jakość kodu:** husky + lint-staged + commitlint + ESLint + Prettier + `astro check` już są. **Brakuje tylko CI** (uruchamiania tych samych bramek na zdalnym repo) i **deployu**.
- **Czego nie ma:** backendu, formularzy podpiętych, content collections, testów, `.github/workflows`. To nie wada — to właściwy zakres na ten etap.

**Wniosek:** projekt jest „deploy-ready" jako statyk. Jedyne braki to: wybór CDN, podpięcie auto-deployu, bramka CI i domena.

## 3. Czy trzymać obrazy/wideo na backendzie? (frontend vs storage)

Krótko: **teraz — nie.** Backend „żeby trzymać media" ma sens dopiero, gdy spełniony jest **co najmniej jeden** warunek:

1. **Edytowalność bez deployu** — ktoś (Ty/klient) ma podmieniać media z panelu, bez `git push` i rebuildu. (Dotyczy fazy 2 / CMS.)
2. **Skala/waga** — media przestają sensownie mieścić się w repo i builderze (długie wideo, dziesiątki/setki MB, częste podmiany).
3. **Transformacje on-the-fly** — resize/format/wideo-transcode po stronie serwera.

Dziś **żaden** z tych warunków nie zachodzi: media są małe, statyczne, zmieniasz je Ty przez Git. Trzymanie ich jako static assety daje:

- **Najtaniej** (0 zł, w cenie CDN).
- **Najszybciej** (te same krawędzie CDN co HTML, cache, brak round-tripu do storage).
- **Najprościej** (zero integracji, zero sekretów, zero punktów awarii).

**Progi przejścia na zewnętrzny storage (na przyszłość):**

| Sytuacja                                                       | Gdzie                                             | Dlaczego                                      |
| -------------------------------------------------------------- | ------------------------------------------------- | --------------------------------------------- |
| Zdjęcia + klipy ≤ kilka-kilkanaście MB każdy, edycja przez Git | **static w repo**                                 | 0 zł, najszybciej                             |
| Media edytowane z panelu CMS (bez deployu)                     | **R2 / Storage CMS-a**                            | rozdzielenie treści od kodu                   |
| Wideo > ~10-20 MB / dłuższe niż ~30 s                          | **R2 (plik) lub Stream/Bunny (transcode+player)** | nie obciążać repo/builda; adaptacyjny bitrate |
| Repo zaczyna puchnąć od binariów                               | **R2 + (opcjonalnie) Git LFS off**                | utrzymać szybki klon/CI                       |

> **Reguła kciuka:** _kod i drobne, „brandowe" media_ (logo, ikony, tła hero) → repo/static. _Treść użytkowa, która się zmienia_ (zdjęcia realizacji, filmy klientów) → zewnętrzny storage od momentu wejścia CMS-a.

## 4. Hosting — porównanie

Profil potrzeby: **statyk + (wkrótce) opcjonalne mikro-funkcje** (formularz, OAuth-proxy dla Git-CMS). Komercyjny. Maksymalnie tanio.

| Dostawca                        | Cena (statyk)          | Transfer           | Komercyjnie?            | Mikro-funkcje                                   | Haczyk                                                              |
| ------------------------------- | ---------------------- | ------------------ | ----------------------- | ----------------------------------------------- | ------------------------------------------------------------------- |
| **Cloudflare Pages**            | **0 zł**               | **nielimitowany**  | **TAK**                 | Pages Functions / Workers (100k req/dzień free) | Build concurrency 1, 500 buildów/mies. (z zapasem)                  |
| **Vercel Hobby**                | 0 zł                   | 100 GB             | **NIE** (niekomercyjny) | Functions (limit)                               | **Regulamin: zakaz komercji** → wyklucza produkcję                  |
| **Vercel Pro**                  | 20 $/seat              | 1 TB w pakiecie    | TAK                     | Functions (hojnie)                              | Płacisz za to, czego dla statyka nie wykorzystasz; egress drożeje   |
| **Netlify Free**                | 0 zł                   | 100 GB/mies.       | TAK                     | Functions (125k/mies.)                          | 100 GB to mało przy wideo; build 300 min/mies.                      |
| **Cloudflare Workers + Assets** | 0 zł (free) / 5 $ Paid | nielimitowany      | TAK                     | natywnie (to są Workers)                        | Bardziej „kod-first" niż Pages; nadkomplikacja dla czystego statyka |
| **GitHub Pages**                | 0 zł                   | „fair use" ~100 GB | TAK (z zastrzeżeniami)  | **brak**                                        | Brak funkcji serwerowych, słabszy CDN, brak preview per-PR          |

### Werdykt hostingu: **Cloudflare Pages**

- Jedyny, który łączy **0 zł + komercję + nielimitowany transfer + mikro-funkcje**. Przy planowanym wideo „nielimitowany transfer" to realna oszczędność (Vercel/Netlify liczą egress).
- Naturalna para z Astro (Cloudflare przejął Astro — najlepsze wsparcie tandemu).
- Trzyma **cały model agencyjny**: te same darmowe zasady możesz powielić na kontach klientów.
- **Alternatywa awaryjna:** Netlify (gdy Pages kiedyś zacznie uwierać DX-owo) — ale przy wideo pilnuj limitu 100 GB. GitHub Pages tylko jako absolutne minimum (brak funkcji/preview = brak formularza i Git-CMS OAuth).

> **Vercel** zostaje w zanadrzu **wyłącznie** na ewentualny przyszły **Next.js dla aplikacji klienta** — tam Vercel ma przewagę (Functions/ISR/Server Actions out-of-the-box). Dla tej wizytówki Vercel = przepłacanie i ryzyko regulaminowe.

## 5. CI/CD — podział ról

**Zasada: platforma deployuje, GitHub Actions pilnuje jakości.** Nie buduj własnego deployu w Actions — to duplikat tego, co Cloudflare robi za darmo, plus utrzymanie sekretów.

### 5.1 Deploy (robi Cloudflare Pages)

- Podpinasz repo GitHub do projektu Pages. Od tego momentu: **push na `main` → build → deploy produkcyjny**; **push na inny branch / PR → build → unikalny preview URL**.
- **Preview deployments = killer feature dla agencji**: każdy PR/branch klienta dostaje własny link „na żywo" do akceptacji, bez ruszania produkcji.
- Build command: `pnpm build`; output dir: `dist`; Node 22 (masz `.nvmrc`); `corepack`/pnpm wykrywane z `packageManager` w `package.json`.

### 5.2 Bramka jakości (robi GitHub Actions)

Te same kontrole co lokalnie w husky, ale wymuszone zdalnie i widoczne w PR. Repo prywatne → 2000 min/mies. free (build jest sekundowy, zapas ogromny).

```yaml
# .github/workflows/ci.yml
name: CI
on:
  push:
    branches: [main]
  pull_request:

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4 # czyta wersję z package.json (packageManager)
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm format:check # prettier --check
      - run: pnpm lint # eslint
      - run: pnpm typecheck # astro check
      - run: pnpm build # build musi przejść = ochrona przed zepsutym deployem
      # --- SLOT NA TESTY (faza po deployu) ---
      # - run: pnpm test                      # Vitest (unit)
      # - run: pnpm test:e2e                  # Playwright (masz już zależność)
```

- **Branch protection na `main`:** wymagaj zielonego `quality` przed merge. Efekt: na produkcję trafia tylko kod, który przeszedł bramkę — mimo że deploy robi platforma.
- **Testy:** świadomie zakomentowany slot. Gdy ruszysz testy (po deployu) → odkomentowujesz, zero przebudowy pipeline'u. Masz już `playwright` w devDeps — naturalny start to 1-2 smoke testy E2E (czy hero się renderuje, czy nie ma błędów konsoli) + ewentualnie Vitest na logikę i18n.

### 5.3 Opcjonalnie później: Lighthouse CI (bramka wydajności)

Strona = animacyjny showcase → łatwo nieświadomie zabić Core Web Vitals. Dodatkowy job uruchamiający `@lhci/cli` na zbudowanym `dist/`, z budżetem (np. perf ≥ 0,9), komentujący w PR. Wprowadź **po** pierwszym deployu, gdy ustabilizujesz sekcje — przedwcześnie będzie tylko hałasować.

### 5.4 Wariant alternatywny (gdybyś chciał deploy z Actions)

Zamiast integracji Git Pages możesz deployować przez `cloudflare/wrangler-action` (potrzebny `CLOUDFLARE_API_TOKEN` w sekretach). Daje pełną kontrolę nad kolejnością „najpierw bramka, potem deploy w tym samym jobie", ale **tracisz darmowe auto-preview** i dokładasz utrzymanie sekretów. **Rekomendacja: zostań przy integracji Git** (prościej, taniej, preview gratis); `wrangler-action` tylko gdy realnie potrzebujesz custom kroków przed deployem.

## 6. Formularz / kontakt (faza 1, bez serwera)

Wg ustaleń — zero własnego backendu:

- **Booking:** osadzony **Cal.com** (self-host opcjonalny później; SaaS free na start) — przejmuje umawianie rozmów.
- **Formularz kontaktowy:** najtaniej **`mailto:`**; ciut lepszy UX → **Formspree/Web3Forms** (free tier) albo **Cloudflare Pages Function** (kilkanaście linii: odbiera POST, wysyła mail przez Resend/MailChannels). To pierwsza realna „mikro-funkcja serwerowa" — i właśnie dlatego Pages (a nie GitHub Pages) jest słusznym wyborem.

## 7. Domena i DNS (brak lock-inu)

- Trzymaj **DNS na Cloudflare** (nawet jeśli kiedyś hosting pójdzie gdzie indziej). Rejestrator dowolny tani; możesz przenieść domenę do Cloudflare Registrar (sprzedają po cenie kosztowej, bez marży).
- Przy podpięciu Pages: dodaj custom domain `hadrianm.pl` + `www`; certyfikat SSL automatyczny.
- **Pułapki przy ewentualnym przepięciu** (gdyby kiedyś na Vercel): wyłącz proxy lub ustaw SSL **Full (strict)** (inaczej „too many redirects"); dzień wcześniej obniż TTL do 5 min (zero downtime).

## 8. Plan wdrożenia fazy 1 (kolejność kroków)

1. `astro.config` — potwierdź `site: "https://hadrianm.pl"` (jest) i `output: "static"` (jest). ✔ nic do zmiany.
2. Dodaj `.github/workflows/ci.yml` (sekcja 5.2). Włącz branch protection na `main`.
3. Załóż projekt **Cloudflare Pages**, podepnij repo, ustaw build (`pnpm build` → `dist`, Node 22).
4. Pierwszy deploy → testuj na `*.pages.dev`.
5. Podepnij domenę `hadrianm.pl` + `www`, SSL.
6. Dodaj formularz (Formspree/Pages Function) + Cal.com.
7. **Koszt bieżący: 0 zł/mies.** (tylko domena rocznie).

---

# CZĘŚĆ II — Faza 2: CMS i strony klientów

## 9. Czego naprawdę potrzebujesz (i czego nie)

Rozdziel dwa zupełnie różne problemy — mylenie ich to główne źródło przepłacania:

- **(A) Twoja wizytówka.** Edytor = Ty (techniczny). Potrzeba: dodawać Realizacje, opinie (screeny), teksty, krótkie/dłuższe wideo. **Nie potrzeba logowania, kont, bazy danych.** Wystarczy ustrukturyzowana treść w repo + miejsce na cięższe media.
- **(B) Strony klientów.** Edytor = klient (nietechniczny). Potrzeba: **panel z loginem**, w którym wrzuca teksty/zdjęcia/krótkie klipy, a one **od razu pojawiają się na stronie**. Nadrzędne: **0 $ recurring dla klienta**, szybkie powielanie (model agencyjny), per-klient na jego koncie.

Te dwa przypadki mają **różne** optymalne rozwiązania. Poniżej osobno.

## 10. Wideo — osobny rozdział, bo to jedyny realny koszt

Wideo łamie ekonomię „wszystko za 0 zł", więc decyzja o nim jest kluczowa. Trzy wymiary: **storage**, **egress (transfer)**, **transcoding/player**.

| Opcja                      | Model kosztu                                  | Egress   | Kiedy używać                                                  | Uwaga                                                        |
| -------------------------- | --------------------------------------------- | -------- | ------------------------------------------------------------- | ------------------------------------------------------------ |
| **Static w repo**          | 0 zł                                          | 0 (CDN)  | klipy ≤ ~10 MB, rzadko zmieniane, edycja przez Git            | puchnie repo przy wielu plikach                              |
| **Cloudflare R2**          | $0,015/GB-mies., **egress 0 zł**, 10 GB free  | **0 zł** | pliki MP4 wrzucane z CMS, krótkie klipy klientów (15 s)       | brak adaptacyjnego bitrate/playera — to „dysk"               |
| **Cloudflare Stream**      | ~$5/1000 min storage + ~$1/1000 min odtworzeń | w cenie  | dłuższe filmy (2 min), adaptacyjny player, dużo widzów        | transcode + player gotowy; płacisz za minuty                 |
| **Bunny Stream**           | ~$0,005/GB storage + tani transfer wg regionu | tani     | budżetowa alternatywa Stream                                  | często najtańszy realnie                                     |
| **YouTube/Vimeo unlisted** | **0 zł**                                      | 0        | start, gdy nie przeszkadza branding YT / brak pełnej kontroli | zero kosztu, ale obcy player/branding, ryzyko „rekomendacji" |

**Rekomendacje wideo wg scenariusza:**

- **Klient wrzuca klip ~15 s** → **R2** (10 GB free ≈ setki takich klipów; egress 0 zł → nawet viral nie generuje rachunku). To trzyma „klient 0 $ recurring".
- **Ty publikujesz film 2 min (opowieść klienta) na własnej stronie** → start na **YouTube unlisted** (0 zł), a gdy chcesz pełną kontrolę/branding → **Cloudflare Stream** lub **Bunny Stream**. Przy Twoim wolumenie to dolary, nie dziesiątki dolarów — mieści się w 15 $/mies.
- **Nigdy** nie serwuj długiego wideo z Supabase Storage (egress $0,09/GB ponad 5 GB free → szybko boli) ani z Vercela (płatny transfer).

> **Złota zasada wideo:** _storage tani wszędzie; płaci się za **egress**._ Wybieraj dostawców z zerowym/groszowym egress (R2, Bunny) — i wtedy nawet wzrost oglądalności nie wywraca budżetu.

## 11. CMS — opcje i werdykty

### 11.1 Content collections (pliki w repo) — _fundament dla (A)_

Astro ma natywne **content collections**: definiujesz schemat (Zod), trzymasz wpisy jako MDX/JSON, layout mapuje po kolekcji. Już to przewiduje Twoja dokumentacja (`analiza-stack-struktura-hosting.md`, model `realization`).

- **Koszt: 0 zł.** Treść wersjonowana w Git (historia, rollback, PR-y).
- **Realizacje, opinie (screeny), FAQ, pakiety** → kolekcje. Dodanie wpisu = plik + `git push` → auto-deploy.
- **Dla Ciebie to wystarcza w 100%.** Nie potrzebujesz nic więcej dla własnej strony.

### 11.2 Git-based CMS (Sveltia / Decap / TinaCMS) — _panel webowy nad (A) i tani (B)_

Gdy chcesz **webowy panel** (dla siebie wygoda, dla klienta konieczność), ale **bez bazy i bez recurring**: Git-CMS daje GUI, które **zapisuje commity do repo** → trigger build → deploy. Treść nadal żyje w Git.

| Narzędzie                      | Koszt                  | Auth                                 | Uwaga                                                                     |
| ------------------------------ | ---------------------- | ------------------------------------ | ------------------------------------------------------------------------- |
| **Sveltia CMS**                | **0 zł** (open source) | GitHub/GitLab OAuth                  | nowoczesny następca Decap, szybki, dobry upload mediów; **rekomendowany** |
| **Decap CMS** (d. Netlify CMS) | 0 zł                   | OAuth (proxy)                        | dojrzały, ale starszy UX                                                  |
| **TinaCMS**                    | free tier / self-host  | Tina Cloud (free tier) lub self-host | edycja „wizualna" inline; przy self-host 0 zł                             |

- **OAuth-proxy** (żeby klient nie musiał znać GitHuba) postawisz na **Cloudflare Worker** za 0 zł (free tier). Klient loguje się do panelu, nie widzi Gita.
- **Media z panelu** → kierujesz upload do **R2** (krótkie klipy/zdjęcia) zamiast do repo.
- **To jest najtańszy przepis na „(B) klient z panelem, 0 $ recurring":** Astro + Cloudflare Pages + Sveltia + R2. Klient płaci tylko domenę; Tobie raz za wykonanie.

**Ograniczenie Git-CMS:** każda publikacja = rebuild (sekundy–minuty) i jest „atomowa przez Git". Dla wizytówek z okazjonalną edycją (realizacja raz na tydzień/miesiąc) — **idealne**. Dla treści zmienianej co minutę / z setkami wpisów / z relacjami danych — za słabe (wtedy → 11.4 Supabase).

### 11.3 Headless SaaS CMS (Sanity / Storyblok) — _gdy chcesz gotowy panel bez utrzymania_

- **Sanity:** hojny free tier, świetny edytor, treść przez API (rebuild lub ISR). Dobry, gdy nie chcesz dłubać w Git-CMS, a treści przybywa.
- **Koszt:** zwykle 0 zł na starcie; rośnie z API/bandwidth/seatami. Dla modelu „wielu klientów" trzeba pilnować, czy free tier per-projekt się skaluje (mnożenie darmowych projektów bywa OK, ale to lekki szary obszar — sprawdź regulamin).
- **Werdykt:** **opcja środka.** Wygodniejsze niż Git-CMS, droższe/bardziej „cudze" niż pliki w repo. Dla Ciebie raczej zbędne (Git-CMS wystarcza); dla klienta — możliwe, jeśli wolisz gotowy panel od utrzymania OAuth-proxy.

### 11.4 Supabase (Postgres + Auth + Storage + RLS) — _gdy potrzebny realny backend_

Wchodzi, gdy strona przestaje być „treścią do wyświetlenia", a staje się **aplikacją z danymi**: konta, rezerwacje, dużo często edytowanej treści z relacjami, wyszukiwanie, multi-tenant.

- **Plusy:** „wszystko w jednym" (DB+Auth+Storage+RLS) — Twoja preferencja z pyt. 10. **RLS** (Row Level Security) jest wręcz stworzony pod multi-tenant (jedna baza, izolacja per-klient regułami). Astro spina się z Supabase bez Next.
- **Minusy / pułapki kosztowe:**
  - Free tier **usypia projekt po ~7 dniach bezczynności** → dla rzadko ruszanej strony klienta to **zła cecha** (pierwsze wejście po przerwie = projekt wstaje).
  - **Pro = 25 $/mies./projekt** → **ponad** budżet klienta (10 $) i zżera Twój (15 $) przy jednym kliencie. Per-klient-osobny-projekt na Pro się nie spina kosztowo.
  - **Storage egress** drogi dla wideo (patrz §10) — media i tak kieruj do R2.
- **Werdykt:** **nie dla prostej wizytówki klienta.** Trzymaj Supabase na **(B-zaawansowane)**: gdy klient płaci za realną aplikację (rezerwacje/konta) i 25 $/mies. jest uzasadnione wartością. Dla multi-tenant: **jedna** instancja Supabase z RLS obsługująca wielu klientów (wtedy 25 $ rozkłada się na wielu) — ale to już model „platformy", nie „strony per klient".

### 11.5 WordPress — _segment „prosto, szybko, znajomy panel"_

- **Kiedy ma sens (Twój pyt. 8):** klient chce **bardzo prostą** stronę, szybko (1-2 tyg.), z panelem, który zna; bez ciężkich animacji. Ekosystem pluginów skraca czas realizacji do dni.
- **Kiedy NIE:** strony klasy tej wizytówki (GSAP/ScrollTrigger/CSS-3D/pinning). WP + page-buildery = gorsze Core Web Vitals, walka z motywem, trudniej o tę płynność, która jest Twoim USP. To regres dla „showcase".
- **Koszty:** WP wymaga hostingu z PHP+MySQL → **nie ma darmowego sensownego tieru** jak statyk. Tani managed WP / VPS to ~5-15 $/mies. — **klient płaci za swój hosting** (spójne z modelem agencyjnym), ale to **łamie „0 $ recurring"**.
- **Wariant hybrydowy (headless WP):** WP jako sam panel + Astro jako front (treść przez REST/GraphQL). Daje znajomy panel klientowi i Twój szybki front — ale komplikacja i koszt hostingu WP zostają. Sensowne tylko, gdy klient **bardzo** chce panel WP.
- **Werdykt:** **trzymaj WP jako osobną „tańszą/szybszą" pozycję w ofercie** dla mniej wymagających klientów — nie jako domyślny stack. Dwa segmenty: „premium animowane" (Astro) vs „proste i szybkie" (WP/Git-CMS).

## 12. Czy przepisywać na Next.js?

**Nie — nie teraz, prawdopodobnie długo nie.** Uzasadnienie wprost pod Twoje cele:

- Wszystkie potrzeby fazy 2 (content collections, Git-CMS, R2, Supabase, formularze, Stripe) **Astro obsługuje**. „Vercel/Next potrzebne do CMS" to mit — Supabase działa z Astro tak samo.
- Twój constraint „Astro tak długo, jak się da" + „klienci bez dashboardów" = **Next nie wnosi nic**, a dokłada koszt (Vercel) i złożoność (RSC, granice server/client) na stronie, która jest głównie contentem + animacją.
- **Kiedy Next faktycznie wejdzie:** dopiero gdy konkretny klient potrzebuje **realnej aplikacji** — dashboard z ciężkim stanem, panel z rolami, złożone formularze/transakcje, SSR-owy personalizowany content. Wtedy ten **jeden** projekt robisz w Next + Vercel (+ Supabase) i to się broni.
- **Tania ścieżka migracji (ubezpieczenie):** trzymaj wyspy interaktywne w **React + Tailwind** (już tak masz). Komponenty i logika GSAP przenoszą się do Next ~1:1. Czyli decyzję o Next możesz odłożyć **bez kosztu utopionego**.

**Wniosek:** Astro = stack domyślny i długoterminowy dla wizytówek. Next = narzędzie sytuacyjne na pojedyncze projekty-aplikacje. Nie przepisujesz tego, co masz.

## 13. Architektura docelowa (model agencyjny)

```
TWOJA WIZYTÓWKA (hadrianm.pl)
  Astro (static) ── Cloudflare Pages (0 zł, komercyjnie)
   ├─ treść: content collections (Git)         ← edytujesz Ty
   ├─ panel (opcjonalnie): Sveltia CMS → commit ← wygoda
   ├─ media lekkie: static w repo
   ├─ media cięższe / wideo: R2 (klipy) + Stream/YT (filmy 2 min)
   └─ formularz: Pages Function / Formspree; booking: Cal.com

STRONA KLIENTA — wariant DOMYŚLNY (prosta wizytówka, 0 $ recurring)
  Astro (static) ── Cloudflare Pages NA KONCIE KLIENTA
   ├─ panel: Sveltia/Decap + OAuth-proxy (Worker, 0 zł)
   ├─ media: R2 (klipy 15 s, free tier)
   └─ klient: właściciel konta, płaci tylko domenę; Tobie raz za wykonanie

STRONA KLIENTA — wariant SZYBKI/PROSTY
  WordPress (managed/VPS, ~5-15 $/mies. PŁACI KLIENT) + pluginy
   └─ gdy klient chce znajomy panel i zero animacji-premium

STRONA/APLIKACJA KLIENTA — wariant ZAAWANSOWANY (dynamika/konta)
  Next.js ── Vercel  +  Supabase (DB+Auth+Storage+RLS)
   └─ dopiero gdy potrzebny realny dashboard/rezerwacje; koszt uzasadniony wartością
```

## 14. Scenariusze kosztowe (miesięcznie)

| Scenariusz                               | Hosting                     | CMS               | Media/Wideo                           | Razem                                     |
| ---------------------------------------- | --------------------------- | ----------------- | ------------------------------------- | ----------------------------------------- |
| **Twoja wizytówka, faza 1**              | CF Pages 0                  | —                 | static 0                              | **0 zł** (+domena/rok)                    |
| **Twoja wizytówka + CMS + filmy 2 min**  | CF Pages 0                  | Git-CMS 0         | R2 ~0 + Stream/Bunny kilka $ lub YT 0 | **0–~5 $**                                |
| **Klient: prosta wizytówka + panel**     | CF Pages 0 (konto klienta)  | Sveltia 0         | R2 free                               | **~0 $ recurring** (klient: tylko domena) |
| **Klient: szybka strona WP**             | managed WP ~5-15 $ (klient) | WP wbud. 0        | wg hostingu                           | **5-15 $ (klient płaci)**                 |
| **Klient: aplikacja (rezerwacje/konta)** | Vercel/CF 0-20              | Supabase 25 (Pro) | R2 ~0                                 | **~25-45 $ (klient płaci, uzasadnione)**  |

Wszystkie warianty „wizytówkowe" mieszczą się w Twoim budżecie 15 $ i celu „klient 0 $ recurring". Supabase Pro pojawia się **tylko** przy realnej aplikacji, gdzie 25 $ płaci klient za wartość, nie za „stronę".

## 15. Rekomendowana ścieżka (roadmap)

1. **Teraz:** Cloudflare Pages + `ci.yml` (bramka) + domena + formularz/Cal.com. Koszt 0. → _wizytówka online._
2. **Gdy pojawią się realizacje:** content collections (schemat z `analiza-stack-struktura-hosting.md`) + opinie jako kolekcja screenów. Koszt 0.
3. **Gdy dochodzą cięższe media / filmy:** podłącz **R2** (klipy) i wybierz kanał dłuższego wideo (YT unlisted → potem Stream/Bunny). Koszt ~0–kilka $.
4. **Gdy chcesz panel webowy dla siebie:** **Sveltia CMS** nad istniejącymi kolekcjami. Koszt 0.
5. **Po deployu:** odkomentuj slot testów w CI (Playwright smoke + Vitest), ewentualnie Lighthouse CI.
6. **Pierwszy klient (prosty):** sklonuj przepis Astro+Pages+Sveltia+R2 na **jego** konto. Recurring ~0.
7. **Klient „szybko/prosto":** rozważ WP na jego hostingu (osobny segment oferty).
8. **Pierwszy klient-aplikacja:** dopiero wtedy **Next + Vercel + Supabase** (jeden projekt, koszt uzasadniony).

---

## Załącznik — decyzje w jednym zdaniu

- **Hostuj na Cloudflare Pages.** (Vercel tylko pod ewentualny przyszły Next-app klienta.)
- **Media trzymaj statycznie teraz; egress-friendly storage (R2/Bunny) gdy urosną.** Nigdy długie wideo z Supabase/Vercela.
- **CI = bramka jakości w Actions; deploy + preview robi platforma.** Testy w gotowym slocie, włączane po deployu.
- **CMS dla siebie = content collections (+ opcjonalnie Sveltia). Dla klienta = ten sam Git-CMS = 0 $ recurring.**
- **Supabase tylko dla realnych aplikacji; WordPress tylko dla „prosto i szybko".**
- **Nie przepisuj na Next.js** — Astro niesie wszystkie cele; wyspy w React = tania opcja migracji, gdyby kiedyś trzeba.
