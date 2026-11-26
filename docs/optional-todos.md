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
| C1 | Odświeżenie Workera `sveltia-cms-auth` | co 3–6 mies. lub gdy logowanie do `/admin` kaprysi | Worker wdrożony ręcznie (`wrangler deploy`) — nie dostaje poprawek z repo `sveltia/sveltia-cms-auth` | §4.1 | 2026-11-23 — redeploy z upstreamu `e62e76a` (kod = `26b168a`; poprzednio ≈ `13a24b0` z 2026-06-28, wdrożony 2026-07-03), wersja Workera `052c136c` (rollback: `b1332bce` z 2026-07-03); nadal OAuth App (upstream od 2026-11-11 dokumentuje GitHub App — O10); sondy `/auth`: `hadrianm.pl`/`localhost` → 302 do GitHuba, obca domena → `UNSUPPORTED_DOMAIN`; logowanie produkcja + localhost OK (Mateusz). Przy okazji poprawiona §4.1 (zmienne Text vs sekrety, P-79) |
| C2 | Przegląd dostępów i rotacja sekretów | co 6 mies. | GitHub + Cloudflare kontrolują kod, treść, panel, hosting i domenę | §4.2 (Client Secret OAuth, 2FA, `ALLOWED_DOMAINS`, tokeny R2/Resend/Turnstile) | — (jeszcze nie) |
| C3 | Przypięta wersja Sveltii (`public/admin/index.html`, dziś 0.178.0) | kwartalnie: zajrzyj do changelogu; bump TYLKO z potrzeby | Nowsze binarium = nowe pola/poprawki, ale też ryzyko regresji panelu | Procedura bumpu = backlog **M2** (sonda binarium, test w trybie lokalnego repo, wycofanie jedną linią); dalsze podbicie = punkt **M3**-sąsiad w §6 (osobny PR) | 0.170.0 → 0.178.0 2026-10-21 (PR #52) |
| C4 | Backup R2 (`rclone sync` bucketa `hadrianm-media`) | co miesiąc (po każdej nowej realizacji — od razu) | JSON-y wpisów są w gicie, ale **media żyją wyłącznie w R2**; Sveltia nie ma kosza | §4.3 (pierwsze uruchomienie = konfiguracja remote'a; ten sam token tylko-do-odczytu, co `pnpm r2:orphans` — zmienne `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` w `.env`) | 2026-11-22 — pierwszy `rclone sync` do `~/hadrianm-r2-backup/hadrianm-media`: 24 obiekty, 5,748 MiB; `rclone check --one-way` 0 różnic, 24 pliki lokalnie (= 24 media z `pnpm r2:orphans`, znacznik `realizacje/` jako katalog); remote `hadrianm` bez kluczy w `rclone.conf`, token odczytu z `.env` (§4.3; kontrola `rclone size hadrianm:hadrianm-media` 24 / 5,748 MiB); remote `r2` = eha, nie ruszać (P-77) |
| C5 | `pnpm outdated` + aktualizacja zależności | kwartalnie; Astro/Tailwind/GSAP major = osobny PR z pełnym `pnpm test` | Dryf zależności kumuluje się; duże skoki są droższe niż małe | §4.4 — reguła „`playwright` i `@playwright/test` PARĄ" + kontrola baseline'ów linux + pułapka lockfile'a `@paulirish/trace_engine` | 2026-10-24 (dodano `subset-font`, F1) |
| C6 | Zużycie Cloudflare Image Transformations | co miesiąc (dashboard → Images → Transformations) | Darmowy limit ≈ 5 000 unikalnych transformacji/mies. (`photos-management-for-cms-analysis.md` §5); portfolio jest daleko poniżej, ale każda nowa realizacja dodaje warianty | Odczyt licznika w dashboardzie; jeśli > 50% limitu — przegląd rozmiarów w `src/lib/img.ts` (`imgAt()`) | 2026-11-22 — 254 / 5 000 (5,1 %; 3 realizacje), daleko pod progiem 50 % → `imgAt()` bez zmian |
| C7 | Sieroty w R2 | po każdym usunięciu/podmianie wpisu lub zdjęcia; kontrola kwartalna | Sveltia NIE kasuje plików z R2 przy usuwaniu wpisu (`.claude/rules/cms-realizacje.md`) | §4.5 — `pnpm r2:orphans` (raport: sieroty + brakujące media; kasowanie `--delete` za tokenem zapisu i po potwierdzeniu); skrypt z **M3** (2026-11-07) | 2026-11-21 — pierwszy przebieg skryptem: 24 URL-e w treści = 24 obiekty, 0 sierot, 0 brakujących (25. obiekt = znacznik katalogu `realizacje/`, P-75); wcześniej 2026-10-21 (18 sierot usuniętych ręcznie, P5) |
| C8 | Obraz runnera i obraz Dockera przy bumpie Playwrighta | przy KAŻDYM bumpie Playwrighta (nie kalendarzowo) | Wersja systemu runnera (`ubuntu-24.04`, przypięta — C3 backlogu) i tag `mcr.microsoft.com/playwright:v<wersja>-noble` wpływają na baseline'y linux | Bump = osobny PR: para wersji + tag Dockera w `.claude/rules/testing.md` + rerun `test:visual` na main przed i po | Playwright 1.61.1 (2026-07) |
| C9 | Przegląd budżetów LHCI po bloku zmian | po każdej paczce zmieniającej bajty strony głównej | Progi to ratchet: po poprawie perf zacieśniamy, żeby bramka łapała regresje | `lhci-measure.yml` na main → mediany → osobny PR wg reguły **L1** (`.claude/rules/testing.md` „LHCI"). Po F1 zrobione w dwóch krokach: `font:size` (#60) i LCP/perf (O4 → §3) | 2026-10-26 (LCP/perf po F1, PR `chore/lhci-ratchet-after-f1`) |
| C10 | Przegląd katalogu flake'ów CI | co miesiąc (razem z tą tabelą) | Flake wpisany bez daty wygaśnięcia zostaje „wiedzą" na zawsze; po naprawie przyczyny wpis ma zniknąć | §4.8 — `gh run list` to za mało: pokazuje wynik OSTATNIEJ próby, a CI ma `retries: 1`, więc flake'i widać tylko w rerunach (`run_attempt > 1`) i w logu e2e (`N flaky`), P-76. Katalog: `.claude/rules/testing.md` (flaky klatki hero, LCP, flaki z retry) + pamięć projektu | 2026-11-22 — okno od 2026-10-24: 65 biegów, czerwone wyłącznie znane (T9 `webkit-1440` przed progiem, apt 2026-10-26/27 przed DEC-111, wideo nakładki przed T11, CLS polityki = realny bug PI-05); po merge'u P8 (35 biegów CI) 6 zielonych z `flaky` — nowe sygnatury: axe `color-contrast` pixel-5 na elementach reveal (`/oferta/`, `/en/services/`, `/dla-kogo/`), wideo hero `currentTime` webkit-iphone-14, zamknięcie sheeta webkit-iphone-14, `socket hang up` preview firefox → PI-06; wcześniej 2026-10-24 (T9) |
| C11 | Search Console — indeksowanie i błędy | co miesiąc (po skonfigurowaniu — O2) | Jedyne zewnętrzne źródło o soft-404, błędach crawl, Core Web Vitals z pola | Raporty „Indeksowanie stron" i „Core Web Vitals"; sitemapa: `https://hadrianm.pl/sitemap-index.xml` (`@astrojs/sitemap`, wskazana w `public/robots.txt`) | 2026-11-23 — skonfigurowane (O2 → §3): własność `hadrianm.pl` zweryfikowana, sitemapa zgłoszona; pierwszy realny odczyt raportów (indeksowanie, CWV z pola) przy przeglądzie grudniowym ~2026-12-20/22 — wtedy też potwierdź stan mapy witryny „Powodzenie” i 20 wykrytych stron |
| C12 | Odnowienie domeny `hadrianm.pl` (OVH) i skrzynki `info@` | rocznie (przypomnienie OVH mailem) | Domena wygasa = strona, panel i poczta padają naraz | `hosting_first_analysis.md` (adnotacja: OVH, ~72,50 zł/rok, NS → Cloudflare), `mailbox_setup.md` | kupiona 2026-07-03 |

## 2. Odłożone

| # | Co | Do kiedy / warunek | Notatka |
| --- | --- | --- | --- |
| O3 | Własna subdomena Workera `auth.hadrianm.pl` zamiast `sveltia-cms-auth.tenhadrian.workers.dev` | warunek (domena w Cloudflare) spełniony od 2026-07-05; przy pierwszym pokazie panelu klientowi albo razem z O10 (przy C1 2026-11-23: nie — decyzja Mateusza) | §4.6 — TRZY miejsca naraz (Cloudflare custom domain, callback OAuth GitHub, `base_url` w `public/admin/config.yml`), inaczej logowanie pada |
| O5 | `liveUrl` Hetmana po przełączeniu domeny | gdy HEAD na `nowa.hetmannieruchomosci.com` zacznie przekierowywać albo klient potwierdzi | Backlog **R5** — zmiana WYŁĄCZNIE w panelu (pole „Adres strony"); żaden test ani baseline nie zależy od tej wartości |
| O7 | Alias skrzynki OVH w Gmailu | kiedykolwiek, bez warunku | Instrukcja: `gmail_alias_setup.md` |
| O8 | Kandydaci refactoru „wymagający OSOBNEJ decyzji" | tylko z pomiarem i decyzją Mateusza | `first-bigger-improvement-refactor-analysis.md` §8 (Etap 7); część już pokryta backlogiem H3/H4 |
| O9 | White-label szablonu (Etap 7 ekosystemu Claude Code) | przy starcie kolejnego projektu z tego szablonu | `claude-code-ecosystem-initialization.md` §9; w praktyce rodzina delung/eha/hetman już z niego wyrosła — zweryfikować, co zostało do ekstrakcji |
| O10 | Logowanie do panelu: OAuth App → **GitHub App** (albo Sveltia CMS Additions) | decyzja Mateusza; naturalny moment = C2 (rotacja sekretów, styczeń 2027) albo pokaz panelu klientowi (razem z O3) | Upstream `sveltia-cms-auth` od 2026-11-11 (`8cc825c`) dokumentuje tylko GitHub App: dostęp wyłącznie do repo, na którym aplikacja jest zainstalowana, zamiast scope `repo` OAuth App = WSZYSTKIE repo konta (także prywatne/klienckie). OAuth App nadal działa (C1 2026-11-23: kod przeczytany + logowanie OK). Migracja wg README upstreamu („How do I migrate to a GitHub App?”): ten sam callback `…/callback`, podmiana `GITHUB_CLIENT_ID`/`GITHUB_CLIENT_SECRET` w Workerze, `config.yml` bez zmian; tokeny z wygasaniem (8 h) wymagają odświeżania w Sveltii — sprawdzić wsparcie w przypiętej wersji (C3, dziś 0.178.0) albo wyłączyć wygasanie. Additions (od `e62e76a`, 2026-11-22 rekomendowane przez upstream): Sveltia ≥ 0.271.0 + `auth_type: additions` + nowy `base_url` = kod → osobny PR |

## 3. Zamknięte

| Data | Co | Jak zamknięte |
| --- | --- | --- |
| 2026-07-05 | Weryfikacja `robots.txt` na produkcji | Strona na domenie; blokadę `/admin` i wskazanie sitemapy pilnuje `tests/e2e/seo.spec.ts` („robots.txt blokuje /admin i wskazuje sitemapę") |
| 2026-07-05 | `pages.dev` w `ALLOWED_DOMAINS` Workera | Bezprzedmiotowe po podpięciu domeny; jeśli wpis został dodany na czas testów — usunąć przy C2 (nigdy wildcard `*.pages.dev`). **Potwierdzone przy C1 2026-11-23**: lista = `hadrianm.pl,localhost,hadrianm-web.pages.dev` — wpis `hadrianm-web.pages.dev` jest; redeploy celowo przeniósł listę bez zmian, usunięcie przy C2 (dashboard albo `[vars]` w `wrangler.toml` klonu, §4.1) |
| 2026-10-21 | Ręczne sprzątanie sierot R2 z refactoru (`first-bigger-improvement-refactor-analysis.md` §6.6) | 18 sierot skasowanych w P5 (HEAD 404); dalej jako cykliczne C7 |
| 2026-10-20 | Cloudflare Stream (Etap 6 `hosting_second_analysis_sveltia.md`) | ODRZUCONY — wideo realizacji z R2 (`analiza-realizacje-wideo.md` §3.1, ewolucja §9) |
| 2026-10-24 | Zacieśnienie `font:size` po F1 | PR #60 (74 800 / 118 100 B, run 40124168778) |
| 2026-11-07 | O6 — skrypty `scripts/upload-r2.mjs` + `scripts/r2-orphans.mjs` | Backlog **M3** (branch `feat/r2-scripts`): `pnpm r2:orphans` / `pnpm r2:upload`, logika w `scripts/r2/lib.mjs` + 22 testy; dwa tokeny R2 (DEC-115); procedury §4.3, §4.5, §4.7; numer O6 nie wraca do użycia |
| 2026-11-23 | O1 — UptimeRobot (monitoring dostępności) | Dwa monitory **Keyword** (plan Free, interwał 5 min, lokalizacja domyślna, alert mailem na adres konta): `https://hadrianm.pl` — keyword `PRACOWNIA STRON I APLIKACJI`; `https://hadrianm.pl/en/` — keyword `APP STUDIO` (NIE `WEB & APP STUDIO`: w surowym HTML jest `&amp;`, keyword nigdy by się nie znalazł). Warunek **„Start incident when keyword doesn't exist”** — domyślne „exists” = alarm przy działającej stronie. Keywordy = `hero.eyebrow` z `src/i18n/ui.ts` (plus `<title>`/og:title bez rozróżniania wielkości liter), nieobecne w 404 PL i EN (`curl` 2026-11-23) → monitor wykrywa też soft-404 i pustą stronę. Zmiana `hero.eyebrow` = zmiana keywordu w UptimeRobot w tym samym dniu; fałszywy alarm przy działającej stronie = zmiana keywordu, nie wyłączenie monitora. Oba Up po utworzeniu. Numer O1 nie wraca do użycia |
| 2026-11-23 | O2 — Google Search Console | Usługa typu **Domena** `hadrianm.pl`, weryfikacja **ręcznym** rekordem TXT `@` w Cloudflare DNS („Dowolny dostawca DNS” — NIE automat Cloudflare/Domain Connect, który loguje Google do konta Cloudflare). `dig` (1.1.1.1, 8.8.8.8, NS autorytatywny `*.ns.cloudflare.com`): rekord `google-site-verification` obecny obok SPF OVH; weryfikacja przeszła za 1. razem. Rekord ZOSTAJE na stałe (usunięcie = utrata weryfikacji). Sitemapa `https://hadrianm.pl/sitemap-index.xml` zgłoszona; stan tuż po zgłoszeniu „Nie udało się pobrać” przy poprawnej stronie serwera (200, `application/xml`, bez `X-Robots-Tag`, XML poprawny, 20 URL-i = 10 PL + 10 EN, `robots.txt` wskazuje mapę) — stan przejściowy świeżej usługi, kontrola w C11. **Potwierdzone 2026-11-23/26**: „Testuj opublikowany URL” na mapie (Mateusz, 2026-11-23) → „Pobieranie strony: Udane”; panel Mapy witryn 2026-11-26 (odczyt Claude przez Chrome): `sitemap-index.xml` — Indeks mapy witryny, przesłano 23 lis, ostatni odczyt 25 lis 2026, stan **Sukces**, **20** wykrytych stron (= oczekiwane 10 PL + 10 EN), 0 filmów. Dalej cyklicznie **C11**. Numer O2 nie wraca do użycia |
| 2026-10-26 | O4 — ratchet LCP/perf po F1 | PR `chore/lhci-ratchet-after-f1` wg formuły L1 z runu 40124168778: LCP mobile 4851 → 4678, desktop 3210 → 3177, perf mobile 0,80 → 0,85 (desktop 0,85 bez zmian); numer O4 nie wraca do użycia |

---

## 4. Procedury

### 4.1. Odświeżenie Workera `sveltia-cms-auth` (C1)

Kreator „Deploy to Cloudflare Workers" nie działał, więc Worker stoi z
ręcznego `wrangler deploy` i nie aktualizuje się sam. Przepisane po
pierwszym odświeżeniu (2026-11-23, sesja 15) — poprzednia wersja tej
sekcji twierdziła, że wszystkie zmienne przeżywają redeploy; to nieprawda
(P-79).

**1. Klon i odczyt** (zwykły terminal; katalog poza repo, nie `/tmp`):

```bash
mkdir -p ~/tmp
git clone --depth 1 https://github.com/sveltia/sveltia-cms-auth ~/tmp/sveltia-cms-auth
cd ~/tmp/sveltia-cms-auth
git log -1 --format='%h %cs %s'      # wersja do kolumny „Ostatnio” C1
cat wrangler.toml                     # name MUSI być "sveltia-cms-auth" (inaczej drugi Worker bez zmiennych)
npx wrangler@4.164.0 whoami           # wersja = devDependency z package.json klonu
npx wrangler@4.164.0 deployments list # aktywna wersja = cel rollbacku
```

`wrangler login` tylko, gdy `whoami` nie widzi konta: config wranglera
(`~/Library/Preferences/.wrangler/`) jest jeden na komputer i używają go
projekty rodziny (P-77; 2026-11-23 jedno konto, login z 2026-10-17).
Przed deployem przejrzyj zmiany upstreamu od ostatniego „Ostatnio”
(`gh api repos/sveltia/sveltia-cms-auth/commits`) — od 2026-11-11 README
opisuje tylko GitHub App (OAuth App działa dalej, O10).

**2. Zmienne Text vs sekrety.** `wrangler deploy` nadpisuje konfigurację
z dashboardu konfiguracją z `wrangler.toml`: sekret
(`GITHUB_CLIENT_SECRET`) przeżywa, zmienne typu Text (`GITHUB_CLIENT_ID`,
`ALLOWED_DOMAINS`) znikają. Wrangler 4 pokazuje przed wysłaniem diff
„local configuration … differs from the remote configuration” i pyta
`(Y/n)` — sekcja `vars` z minusami = zmienne zostałyby skasowane. Samo
`keep_vars = true` (wzorzec eha) tego diffu NIE uciszyło, więc
deterministycznie: w `wrangler.toml` KLONU (nie w repo) dopisz
`keep_vars = true` i sekcję `[vars]` z wartościami przepisanymi
z ostrzeżenia (obie jawne — Client ID leci w URL-u autoryzacji):

```toml
keep_vars = true

[vars]
ALLOWED_DOMAINS = "<lista z ostrzeżenia>"
GITHUB_CLIENT_ID = "<Client ID z ostrzeżenia>"
```

`npx wrangler@4.164.0 deploy --dry-run` wypisuje bindingi (obie zmienne),
a właściwy `deploy` ma w diffie pokazywać WYŁĄCZNIE `compatibility_date`
— dopiero wtedy `Y`. Wynik: `Current Version ID`.

**3. Kontrola z terminala** (bez logowania; `client_id` w odpowiedzi jest
jawny):

```bash
W=https://sveltia-cms-auth.tenhadrian.workers.dev
curl -sI "$W/auth?provider=github&site_id=hadrianm.pl" | grep -i '^location'   # → github.com/login/oauth/authorize
curl -s  "$W/auth?provider=github&site_id=example.com" | grep -o UNSUPPORTED_DOMAIN
```

`MISCONFIGURED_CLIENT` albo 302 dla obcej domeny = zmienne zniknęły →
rollback.

**4. Logowanie.** Produkcja: `https://hadrianm.pl/admin/` — NAJPIERW Sign
out (Sveltia trzyma token w przeglądarce; bez wylogowania test nie dotyka
Workera), potem „Sign in with GitHub”. Localhost: `pnpm dev` →
`http://localhost:4321/admin/index.html` (dev Astro nie podaje
`index.html` dla `/admin/` → 404; Cloudflare Pages podaje). Od upstreamu
`95745c8` (2026-08-18) token trafia tylko do strony z hosta
w `ALLOWED_DOMAINS` (origin popupu), więc lokalne logowanie wymaga
`localhost` na liście (jest); `site_domain: hadrianm.pl` w `config.yml`
pokrywa tylko pierwszą kontrolę (`site_id`). W panelu nic nie edytuj —
pisze na `main`.

**Rollback**: `npx wrangler@4.164.0 rollback <version-id>` albo dashboard
→ Workers & Pages → `sveltia-cms-auth` → Deployments → Rollback (wersja
zawiera swoje zmienne). Version ID poprzedniej wersji zanotuj w kolumnie
„Ostatnio” C1.

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

Pierwszy raz: w dashboardzie R2 utwórz **dwa API tokeny** zawężone do bucketa
`hadrianm-media` (decyzja 2026-11-07, DEC-115): (a) **Object Read** — do
backupu `rclone` i raportu `pnpm r2:orphans`; (b) **Object Read & Write** —
tylko do `pnpm r2:upload` i kasowania sierot. Klucze wpisz do `.env`
w katalogu projektu (plik jest w `.gitignore`, Claude go nie czyta) pod
nazwami, których oczekują skrypty:

```
R2_ACCOUNT_ID=              # Account ID z dashboardu R2 (wspólne)
R2_ACCESS_KEY_ID=           # token (a) Object Read
R2_SECRET_ACCESS_KEY=
R2_WRITE_ACCESS_KEY_ID=     # token (b) Object Read & Write
R2_WRITE_SECRET_ACCESS_KEY=
```

**rclone bez dubla sekretów** (sprawdzone 2026-11-22, rclone 1.75.1).
`env_auth = true` NIE pomaga: czyta tylko nazwy AWS (`AWS_ACCESS_KEY_ID`,
`AWS_SECRET_ACCESS_KEY`, profil `~/.aws/credentials`), nie `R2_*`. Działa
nadpisanie per remote: `RCLONE_CONFIG_<REMOTE>_ACCESS_KEY_ID` /
`_SECRET_ACCESS_KEY` mają pierwszeństwo przed plikiem konfiguracji (rclone
docs „Precedence"; `-vv` wypisuje „Setting access_key_id=XXX for … from
environment variable").

**Remote `hadrianm`, NIE `r2`** (P-77): nazwa `r2` w
`~/.config/rclone/rclone.conf` należy do **eha** (`rclone sync r2:eha-media`
w docs eha/delung/hetman, klucze tokenu z 1Password zapisane w pliku) —
NIE czyść jej i nie zmieniaj jej endpointu. Nasz remote `hadrianm` trzyma
tylko część jawną i ZERO kluczy (utworzenie, raz):

```bash
rclone config create hadrianm s3 provider=Cloudflare \
  endpoint=https://<account-id>.eu.r2.cloudflarestorage.com \
  region=auto acl=private no_check_bucket=true >/dev/null
```

(bucket w jurysdykcji EU — bez `.eu.` listowanie pada; Account ID jest
jawny w `public/admin/config.yml`). Bez kluczy w env `hadrianm:` odpowiada
odmową — to celowe: backup idzie wyłącznie tokenem odczytu z `.env`.
Cyklicznie, z katalogu projektu:

```bash
( . ./.env && export RCLONE_CONFIG_HADRIANM_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID" \
    RCLONE_CONFIG_HADRIANM_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY" && \
  rclone sync hadrianm:hadrianm-media ~/hadrianm-r2-backup/hadrianm-media --progress )
```

Kontrola (ta sama podpowłoka, zamiast `sync`): `rclone size
hadrianm:hadrianm-media` (liczba obiektów = media z `pnpm r2:orphans`;
znacznik katalogu `realizacje/` rclone traktuje jak katalog, nie plik —
P-75) oraz `rclone check hadrianm:hadrianm-media
~/hadrianm-r2-backup/hadrianm-media --one-way` („0 differences found").
Podpowłoka `( … )` nie zostawia kluczy w środowisku terminala.
`rclone config update`/`create` wypisują config RAZEM z sekretami — zawsze
z `>/dev/null`.

`sync` odzwierciedla usunięcia — to zamierzone (kopia 1:1 stanu bucketa);
jeśli ma być historia, dodaj `--backup-dir` z datą. Katalog backupu NIE jest
w repo. Tokenu nie wpisuj do żadnego pliku w projekcie ani do
`rclone.conf`.

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

1. `git pull` (treść z panelu idzie na main) i `pnpm r2:orphans` — raport:
   sieroty (obiekty pod `realizacje/` bez URL-a w `src/content/realizacje/*.json`)
   i **brakujące** (URL w treści bez obiektu w buckecie = złamane media,
   do naprawy w panelu, NIE do kasowania). Używa tokenu tylko-do-odczytu
   (§4.3); `--json` daje wynik maszynowy.
2. Obejrzyj listę. Zero wpisów w treści = wszystko „sierotą" — wtedy nic
   nie kasuj (reguła `capture-scripts.md`). Pusty obiekt `realizacje/`
   (znacznik katalogu z dashboardu) raport pomija sam (P-75).
3. `pnpm r2:orphans --delete` — pyta o potwierdzenie („tak"), kasuje
   tokenem z zapisem. Po nim
   `CHECK_REMOTE_MEDIA=1 pnpm exec vitest run tests/unit/media-r2.test.ts`
   (żaden użyty plik nie zniknął) i wpis daty w kolumnie „ostatnio" C7.

Ręczna droga (dashboard R2 → `hadrianm-media` → prefix `realizacje/` vs
`grep -rhoE 'https://media\.hadrianm\.pl/[^"]+' src/content/realizacje/ | sort -u`)
zostaje awaryjnie, gdy `.env` nie jest skonfigurowany.

### 4.6. Subdomena `auth.hadrianm.pl` dla Workera (O3)

1. Cloudflare → Workers & Pages → `sveltia-cms-auth` → Settings → Domains &
   Routes → **Add custom domain** → `auth.hadrianm.pl`.
2. GitHub → OAuth App „Sveltia CMS — hadrianm.pl" → callback
   `https://auth.hadrianm.pl/callback`.
3. `public/admin/config.yml` → `base_url: https://auth.hadrianm.pl` → PR.
4. Test logowania na `/admin` (localhost i produkcja).

Trzy miejsca muszą zmienić się spójnie — inaczej logowanie przestaje
działać. Stary adres `workers.dev` można zostawić jako zapasowy.

### 4.7. Upload do R2 skryptem (plan B, M3)

Domyślnie media wgrywa panel Sveltia (pola `image`/`file`). Skrypt, gdy
panel zawiedzie albo trzeba wgrać komplet nagrań z `pnpm capture:site`:

```bash
pnpm r2:upload -- ~/hadrianm-site-videos/<slug>/ --dry-run   # plan: klucze, MIME, rozmiary
pnpm r2:upload -- ~/hadrianm-site-videos/<slug>/             # wgrywa, wypisuje URL-e
```

Klucz = `realizacje/<nazwa pliku>` (płasko, jak Sveltia — P-65), `ContentType`
z rozszerzenia, istniejący obiekt pomijany (nadpisanie: `--force`), inny
prefix: `--prefix`. Token z zapisem (§4.3 b). URL-e z wyjścia wklej w panelu
(pola „Zrzut"/„Wideo ekranu"), potem `CHECK_REMOTE_MEDIA=1 pnpm exec vitest
run tests/unit/media-r2.test.ts`.

### 4.8. Przegląd flake'ów CI (C10)

`gh run list` pokazuje tylko wynik OSTATNIEJ próby, a Playwright w CI ma
`retries: 1` — flake, który przeszedł w retry, daje zielony bieg (P-76).
Trzy odczyty dla okna od poprzedniego przeglądu (`OD=2026-11-22`):

```bash
# 1) czerwone (ostatnia próba)
gh run list --status failure -L 20
# 2) reruny: bieg zielony dopiero w 2. próbie
gh api -X GET 'repos/{owner}/{repo}/actions/runs' -f created=">=$OD" \
  -f per_page=100 --paginate --jq '.workflow_runs[] | select(.run_attempt > 1)
  | "\(.created_at[0:10]) \(.name) \(.head_branch) \(.id) a=\(.run_attempt)"'
# pierwsza próba rerunu: gh api repos/{owner}/{repo}/actions/runs/<id>/attempts/1/jobs
# 3) flaki z retry w logu joba e2e (każdy bieg CI z okna)
for id in $(gh run list -w CI -L 50 --created ">=$OD" --json databaseId -q '.[].databaseId'); do
  j=$(gh api "repos/{owner}/{repo}/actions/runs/$id/jobs" -q '.jobs[]|select(.name=="e2e")|.id')
  gh api "repos/{owner}/{repo}/actions/jobs/$j/logs" | grep -A3 -E 'Z +[0-9]+ flaky$' \
    | sed "s/^/$id /"
done
```

Każde trafienie porównaj z katalogiem (`.claude/rules/testing.md`, pamięć
`ci-flakes-catalog`); nowe → wpis z numerem runu, wpis bez wystąpienia od
≥ 30 dni → data ostatniego wystąpienia (usunięcie tylko decyzją Mateusza).
Ten sam test z retry 2× na main w 30 dniach = kandydat na punkt T (wzorzec
T11), nie „luźniejszy próg".
