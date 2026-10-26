# Utrzymanie — zadania cykliczne i odłożone

> **Status: AKTUALNY** (przepisany 2026-10-25 w paczce P9, punkt D2
> `analiza-ewolucja-vs-nowsze-projekty.md` §6). Dwie tabele zamiast listy
> checkboxów: **cykliczne** (co / jak często / po co / jak) i **odłożone**
> (co / do kiedy–warunek). Zrobione lądują w „Zamknięte" z datą.
> Procedury wymagające więcej niż jednej linii stoją w §4 — tabela
> odsyła, nie dubluje.
>
> Konwencja: przy cyklicznych NIE odhaczamy — aktualizujemy kolumnę
> „ostatnio". Wartości sekretów nie trafiają do tego pliku ani do sesji
> Claude (`.env*` i tokeny: reguła 4 `CLAUDE.md`) — opisujemy procedurę,
> nie wartości. Przegląd tabeli cyklicznej = punkt 7 workflowu §8 analizy
> ewolucji (raz w miesiącu, na starcie sesji utrzymaniowej).

---

## 1. Cykliczne

| # | Co | Jak często | Po co | Jak (procedura / odsyłacz) | Ostatnio |
| --- | --- | --- | --- | --- | --- |
| C1 | Odświeżenie Workera `sveltia-cms-auth` | co 3–6 mies. lub gdy logowanie do `/admin` kaprysi | Worker wdrożony ręcznie (`wrangler deploy`) — nie dostaje poprawek z repo `sveltia/sveltia-cms-auth` | §4.1 | wdrożony 2026-07-03; odświeżenie — jeszcze nie |
| C2 | Przegląd dostępów i rotacja sekretów | co 6 mies. | GitHub + Cloudflare kontrolują kod, treść, panel, hosting i domenę | §4.2 (Client Secret OAuth, 2FA, `ALLOWED_DOMAINS`, tokeny R2/Resend/Turnstile) | — (jeszcze nie) |
| C3 | Przypięta wersja Sveltii (`public/admin/index.html`, dziś 0.178.0) | kwartalnie: zajrzyj do changelogu; bump TYLKO z potrzeby | Nowsze binarium = nowe pola/poprawki, ale też ryzyko regresji panelu | Procedura bumpu = backlog **M2** (sonda binarium, test w trybie lokalnego repo, wycofanie jedną linią); dalsze podbicie = punkt **M3**-sąsiad w §6 (osobny PR) | 0.170.0 → 0.178.0 2026-10-21 (PR #52) |
| C4 | Backup R2 (`rclone sync` bucketa `hadrianm-media`) | co miesiąc (po każdej nowej realizacji — od razu) | JSON-y wpisów są w gicie, ale **media żyją wyłącznie w R2**; Sveltia nie ma kosza | §4.3 (pierwsze uruchomienie = konfiguracja remote'a, token R2 tylko do odczytu) | — (remote jeszcze nieskonfigurowany) |
| C5 | `pnpm outdated` + aktualizacja zależności | kwartalnie; Astro/Tailwind/GSAP major = osobny PR z pełnym `pnpm test` | Dryf zależności kumuluje się; duże skoki są droższe niż małe | §4.4 — reguła „`playwright` i `@playwright/test` PARĄ" + kontrola baseline'ów linux + pułapka lockfile'a `@paulirish/trace_engine` | 2026-10-24 (dodano `subset-font`, F1) |
| C6 | Zużycie Cloudflare Image Transformations | co miesiąc (dashboard → Images → Transformations) | Darmowy limit ≈ 5 000 unikalnych transformacji/mies. (`photos-management-for-cms-analysis.md` §5); portfolio jest daleko poniżej, ale każda nowa realizacja dodaje warianty | Odczyt licznika w dashboardzie; jeśli > 50% limitu — przegląd rozmiarów w `src/lib/img.ts` (`imgAt()`) | — |
| C7 | Sieroty w R2 | po każdym usunięciu/podmianie wpisu lub zdjęcia; kontrola kwartalna | Sveltia NIE kasuje plików z R2 przy usuwaniu wpisu (`.claude/rules/cms-realizacje.md`) | §4.5 (lista obiektów w dashboardzie vs URL-e w `src/content/realizacje/*.json`); skrypt `r2-orphans.mjs` = backlog **M3** | 2026-10-21 (18 sierot usuniętych, P5) |
| C8 | Obraz runnera i obraz Dockera przy bumpie Playwrighta | przy KAŻDYM bumpie Playwrighta (nie kalendarzowo) | Wersja systemu runnera (`ubuntu-24.04`, przypięta — C3 backlogu) i tag `mcr.microsoft.com/playwright:v<wersja>-noble` wpływają na baseline'y linux | Bump = osobny PR: para wersji + tag Dockera w `.claude/rules/testing.md` + rerun `test:visual` na main przed i po | Playwright 1.61.1 (2026-07) |
| C9 | Przegląd budżetów LHCI po bloku zmian | po każdej paczce zmieniającej bajty strony głównej | Progi to ratchet: po poprawie perf zacieśniamy, żeby bramka łapała regresje | `lhci-measure.yml` na main → mediany → osobny PR wg reguły **L1** (`.claude/rules/testing.md` „LHCI"). Po F1 zrobione w dwóch krokach: `font:size` (#60) i LCP/perf (O4 → §3) | 2026-10-26 (LCP/perf po F1, PR `chore/lhci-ratchet-after-f1`) |
| C10 | Przegląd katalogu flake'ów CI | co miesiąc (razem z tą tabelą) | Flake wpisany bez daty wygaśnięcia zostaje „wiedzą" na zawsze; po naprawie przyczyny wpis ma zniknąć | Katalog: `.claude/rules/testing.md` (flaky klatki hero, LCP, Prod smoke MIME) + pamięć projektu; porównaj z `gh run list -L 20` | 2026-10-24 (T9 domknął klasę `webkit-1440` 05–09) |
| C11 | Search Console — indeksowanie i błędy | co miesiąc (po skonfigurowaniu — O2) | Jedyne zewnętrzne źródło o soft-404, błędach crawl, Core Web Vitals z pola | Raporty „Indeksowanie stron" i „Core Web Vitals"; sitemapa: `https://hadrianm.pl/sitemap-index.xml` (`@astrojs/sitemap`, wskazana w `public/robots.txt`) | — (własność niezweryfikowana) |
| C12 | Odnowienie domeny `hadrianm.pl` (OVH) i skrzynki `info@` | rocznie (przypomnienie OVH mailem) | Domena wygasa = strona, panel i poczta padają naraz | `hosting_first_analysis.md` (adnotacja: OVH, ~72,50 zł/rok, NS → Cloudflare), `mailbox_setup.md` | kupiona 2026-07-03 |

## 2. Odłożone

| # | Co | Do kiedy / warunek | Notatka |
| --- | --- | --- | --- |
| O1 | UptimeRobot — monitor HTTP(S) z **keyword** na `https://hadrianm.pl/` | najbliższa sesja operacyjna; brak dziś jakiegokolwiek monitoringu poza `prod-smoke` po deployu (kronika §E) | Keyword = fraza z hero (np. nazwa marki) — sam status 200 nie wykryje soft-404 ani pustej strony; drugi monitor na `/admin` zbędny (panel = Sveltia z CDN). Alert mailem; darmowy plan, interwał 5 min |
| O2 | Google Search Console — weryfikacja własności + zgłoszenie sitemapy | razem z O1 | Weryfikacja przez rekord DNS TXT w Cloudflare (bez zmian w repo); po weryfikacji → tabela cykliczna C11 |
| O3 | Własna subdomena Workera `auth.hadrianm.pl` zamiast `sveltia-cms-auth.tenhadrian.workers.dev` | warunek (domena w Cloudflare) spełniony od 2026-07-05; zrobić przy pierwszym pokazie panelu klientowi albo przy C1 | §4.6 — TRZY miejsca naraz (Cloudflare custom domain, callback OAuth GitHub, `base_url` w `public/admin/config.yml`), inaczej logowanie pada |
| O5 | `liveUrl` Hetmana po przełączeniu domeny | gdy HEAD na `nowa.hetmannieruchomosci.com` zacznie przekierowywać albo klient potwierdzi | Backlog **R5** — zmiana WYŁĄCZNIE w panelu (pole „Adres strony"); żaden test ani baseline nie zależy od tej wartości |
| O6 | Skrypty `scripts/upload-r2.mjs` + `scripts/r2-orphans.mjs` | gdy ręczne sprzątanie w dashboardzie (C7) zacznie boleć | Backlog **M3**; endpoint R2 w jurysdykcji EU: `{account}.eu.r2.cloudflarestorage.com` |
| O7 | Alias skrzynki OVH w Gmailu | kiedykolwiek, bez warunku | Instrukcja: `gmail_alias_setup.md` |
| O8 | Kandydaci refactoru „wymagający OSOBNEJ decyzji" | tylko z pomiarem i decyzją Mateusza | `first-bigger-improvement-refactor-analysis.md` §8 (Etap 7); część już pokryta backlogiem H3/H4 |
| O9 | White-label szablonu (Etap 7 ekosystemu Claude Code) | przy starcie kolejnego projektu z tego szablonu | `claude-code-ecosystem-initialization.md` §9; w praktyce rodzina delung/eha/hetman już z niego wyrosła — zweryfikować, co zostało do ekstrakcji |

## 3. Zamknięte

| Data | Co | Jak zamknięte |
| --- | --- | --- |
| 2026-07-05 | Weryfikacja `robots.txt` na produkcji | Strona na domenie; blokadę `/admin` i wskazanie sitemapy pilnuje `tests/e2e/seo.spec.ts` („robots.txt blokuje /admin i wskazuje sitemapę") |
| 2026-07-05 | `pages.dev` w `ALLOWED_DOMAINS` Workera | Bezprzedmiotowe po podpięciu domeny; jeśli wpis został dodany na czas testów — usunąć przy C2 (nigdy wildcard `*.pages.dev`) |
| 2026-10-21 | Ręczne sprzątanie sierot R2 z refactoru (`first-bigger-improvement-refactor-analysis.md` §6.6) | 18 sierot skasowanych w P5 (HEAD 404); dalej jako cykliczne C7 |
| 2026-10-20 | Cloudflare Stream (Etap 6 `hosting_second_analysis_sveltia.md`) | ODRZUCONY — wideo realizacji z R2 (`analiza-realizacje-wideo.md` §3.1, ewolucja §9) |
| 2026-10-24 | Zacieśnienie `font:size` po F1 | PR #60 (74 800 / 118 100 B, run 40124168778) |
| 2026-10-26 | O4 — ratchet LCP/perf po F1 | PR `chore/lhci-ratchet-after-f1` wg formuły L1 z runu 40124168778: LCP mobile 4851 → 4678, desktop 3210 → 3177, perf mobile 0,80 → 0,85 (desktop 0,85 bez zmian); numer O4 nie wraca do użycia |

---

## 4. Procedury

### 4.1. Odświeżenie Workera `sveltia-cms-auth` (C1)

Kreator „Deploy to Cloudflare Workers" nie działał, więc Worker stoi z
ręcznego `wrangler deploy` i nie aktualizuje się sam:

```bash
git clone --depth 1 https://github.com/sveltia/sveltia-cms-auth /tmp/sveltia-cms-auth
cd /tmp/sveltia-cms-auth
npx wrangler deploy   # wymaga zalogowania: npx wrangler login
```

Sekrety (`GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `ALLOWED_DOMAINS`) są
przypięte do Workera w Cloudflare i **przeżywają** redeploy. Po wdrożeniu:
logowanie na `/admin` (produkcja i localhost — ten drugi wymaga
`site_domain` w `config.yml`, jest).

### 4.2. Przegląd dostępów i rotacja sekretów (C2)

- Client Secret aplikacji OAuth „Sveltia CMS — hadrianm.pl": GitHub →
  Settings → Developer settings → OAuth Apps → **Generate a new client
  secret** → podmień `GITHUB_CLIENT_SECRET` w Cloudflare (Workers & Pages →
  `sveltia-cms-auth` → Settings → Variables and Secrets) → redeploy
  Workera (§4.1). Stary sekret unieważnić dopiero po udanym logowaniu.
- 2FA włączone na GitHubie i Cloudflare (oba konta = kod, treść, panel,
  hosting, domena DNS).
- `ALLOWED_DOMAINS` Workera: tylko `hadrianm.pl` (i `localhost`, jeśli
  używany) — wpisy `pages.dev` z czasu testów usunąć.
- Sekrety Pages Function formularza (Resend, Turnstile) i token R2 Sveltii
  (Access Key ID stoi jawnie w `public/admin/config.yml`, Secret Access Key
  tylko w pamięci przeglądarki — po rotacji panel poprosi o niego ponownie):
  sprawdzić, czy klucze z ostatniej rotacji są jedynymi aktywnymi
  w dashboardach dostawców (`contact-me-form-analysis-implementation.md`,
  `hosting_second_analysis_sveltia.md` §7–8).

### 4.3. Backup R2 (C4)

Pierwszy raz: w dashboardzie R2 utwórz **API token tylko do odczytu**
(Object Read) dla bucketa `hadrianm-media`; `rclone config` → remote typu
S3, provider Cloudflare, endpoint
`https://<account-id>.eu.r2.cloudflarestorage.com` (bucket w jurysdykcji
EU — bez `.eu.` listowanie pada), region `auto`. Potem cyklicznie:

```bash
rclone sync r2:hadrianm-media ~/hadrianm-r2-backup/hadrianm-media --progress
```

`sync` odzwierciedla usunięcia — to zamierzone (kopia 1:1 stanu bucketa);
jeśli ma być historia, dodaj `--backup-dir` z datą. Katalog backupu NIE jest
w repo. Tokenu nie wpisuj do żadnego pliku w projekcie.

### 4.4. `pnpm outdated` i bumpy (C5)

- `pnpm outdated` → lista; patche/minory razem w jednym PR `chore(deps)`,
  majory osobno.
- `playwright` i `@playwright/test` ZAWSZE parą (jeden zestaw binariów);
  bump = też tag Dockera w `.claude/rules/testing.md` i kontrola baseline'ów
  linux (`test:visual` na main przed/po) — patrz C8.
- Po `pnpm add` sprawdź diff lockfile'a: pływający zakres
  `@paulirish/trace_engine` (Lighthouse) podbija przy okazji
  `third-party-web`/`legacy-javascript` — cofnij (`.claude/rules/layout-seo.md`).
- Sveltia nie jest w `package.json` (CDN, przypięta wersja) — osobny
  rytm C3.

### 4.5. Sieroty R2 (C7)

1. Lista URL-i używanych w treści:
   `grep -rhoE 'https://media\.hadrianm\.pl/[^"]+' src/content/realizacje/ | sort -u`.
2. Lista obiektów bucketa: dashboard R2 → `hadrianm-media` → prefix
   `realizacje/` (albo `rclone ls r2:hadrianm-media`, gdy §4.3 jest
   skonfigurowane).
3. Różnica = sieroty; przed kasowaniem `curl -I` na URL publiczny (200 =
   plik istnieje). Kasowanie w dashboardzie; po nim
   `CHECK_REMOTE_MEDIA=1 pnpm exec vitest run tests/unit/media-r2.test.ts`
   (żaden użyty plik nie zniknął).

### 4.6. Subdomena `auth.hadrianm.pl` dla Workera (O3)

1. Cloudflare → Workers & Pages → `sveltia-cms-auth` → Settings → Domains &
   Routes → **Add custom domain** → `auth.hadrianm.pl`.
2. GitHub → OAuth App „Sveltia CMS — hadrianm.pl" → callback
   `https://auth.hadrianm.pl/callback`.
3. `public/admin/config.yml` → `base_url: https://auth.hadrianm.pl` → PR.
4. Test logowania na `/admin` (localhost i produkcja).

Trzy miejsca muszą zmienić się spójnie — inaczej logowanie przestaje
działać. Stary adres `workers.dev` można zostawić jako zapasowy.
