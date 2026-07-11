# Formularz kontaktowy (sekcja `#kontakt`) — analiza i plan wdrożenia

> **Plan wykonawczy** (2026-07-11). Decyzje uzgodnione z Mateuszem — patrz §3.
> Rozwija wątek „formularz bez własnego backendu" z
> [hosting_first_analysis.md §6](./hosting_first_analysis.md) i
> [hosting_related_concepts.md §D](./hosting_related_concepts.md).
> Wygląd i zachowanie frontendu: gotowy prototyp w
> [`docs/design/kontakt-referencja/`](./design/kontakt-referencja/README.md)
> (wariant A „Split") — ta analiza NIE powiela jego ustaleń, tylko dostarcza
> brakującą część: **mechanizm wysyłki** i kolejność wdrożenia.

## 1. Cel i wymagania

Sekcja „Kontakt" (nav 06, kotwica `#kontakt` — celuje w nią CTA z FAQ) z
działającym formularzem, **bez własnego serwera** (strona pozostaje statycznym
Astro na Cloudflare Pages). Wymagania funkcjonalne:

| #   | Wymaganie                                                                      |
| --- | ------------------------------------------------------------------------------ |
| W1  | Wiadomość z formularza przychodzi na **`info@hadrianm.pl`**                     |
| W2  | Odpowiedź jednym „Odpowiedz" w Outlooku — odpowiedź idzie **do nadawcy z formularza** (`Reply-To`) |
| W3  | Nadawca dostaje na swój e-mail **auto-potwierdzenie z treścią wiadomości**      |
| W4  | Pełna obsługa błędów: walidacja kliencka + serwerowa, komunikat przy błędzie wysyłki (scenariusz `.kt-srv` z referencji) |
| W5  | Antyspam wg standardów (honeypot, min. czas, captcha, rate limiting) — auto-potwierdzenie NIE może być przekaźnikiem spamu |
| W6  | Koszt bieżący: **0 zł/mies.**                                                   |
| W7  | Dwujęzyczność: sekcja PL + EN, auto-potwierdzenie w języku strony               |

## 2. Stan zastany (na czym budujemy)

- **Hosting:** Cloudflare Pages, deploy z `main` przez integrację Git.
  `hosting_first_analysis.md` §6 przewidział dokładnie ten ruch: „Cloudflare
  Pages Function (kilkanaście linii: odbiera POST, wysyła mail przez
  Resend/MailChannels)" — nazwał to „pierwszą realną mikro-funkcją serwerową"
  i powodem wyboru Pages. ℹ️ **Korekta 2026:** MailChannels zlikwidował
  darmową integrację z Workers (sierpień 2024) — z pary „Resend/MailChannels"
  zostaje **Resend**.
- **Skrzynka:** `info@hadrianm.pl` na OVH Zimbra (aliasy `mateusz@`,
  `contact@`, `kontakt@` wpadają do tej samej skrzynki), obsługa Outlookiem
  (Mac + telefon), korespondencja wychodzi z `info@` (komplet SPF+DKIM+DMARC)
  — [mailbox_setup.md](./mailbox_setup.md). **DNS pocztowy jest zajęty przez
  OVH**: MX `mx0–mx4.mail.ovh.net`, SPF `v=spf1 include:mx.ovh.com ~all`,
  DKIM OVH, DMARC `p=none`. **Email Routing Cloudflare celowo WYŁĄCZONY**
  (zasada „jeden zestaw MX") — to wyklucza wysyłkę przez binding
  `send_email` Workers (wymaga włączonego Email Routing) i wymusza rekordy
  Resend **na subdomenie** (§6).
- **Frontend:** prototyp w `docs/design/kontakt-referencja/` definiuje
  **kontrakt endpointu** (README „Kontrakt endpointu" + komentarz w
  `kontakt.js`): POST `multipart/form-data` z polami `name`, `email`,
  `temat` (może być puste), `message`, `firma` (honeypot), `elapsed`
  (ms od załadowania); odpowiedź 2xx = sukces, wszystko inne → komunikat
  `.kt-srv`. Serwer MUSI powtórzyć walidację i antyspam. Ta analiza
  **rozszerza** kontrakt o dwa pola (§4.2), poza tym trzyma się go 1:1.
- **Testy:** kontrakt w `.claude/rules/testing.md` — nowa sekcja = unit +
  e2e + visual (baseline'y darwin+linux, kolejność z CI) + axe. Checklista
  scenariuszy jest już w README referencji.

## 3. Decyzja: Pages Function + Resend + Turnstile

### 3.1 Porównanie wariantów

| Wariant | Koszt | W1–W3 | Kontrola | Ocena |
| --- | --- | --- | --- | --- |
| `mailto:` | 0 zł | ❌ (brak formularza, brak potwierdzenia) | — | tylko fallback awaryjny |
| **Formspree** free | 0 zł | ⚠️ 50 zgłoszeń/mies.; auto-odpowiedź płatna | niska | odpada (W3 płatne) |
| **Web3Forms** free | 0 zł | ⚠️ 250/mies.; auto-odpowiedź jest, ale szablon i nadawca ograniczone, brak własnej domeny nadawcy | niska | zapasowy plan B |
| **Brevo API** | 0 zł (300/dzień) | ✅ | średnia | działa, ale cięższy panel; Brevo trzymamy w zanadrzu do innej roli (§7.5 analizy Sveltii) |
| Email Routing `send_email` | 0 zł | ❌ | — | odpada: wymaga włączenia Email Routing (konflikt z MX OVH) |
| MailChannels (z docs) | — | — | — | odpada: darmowa integracja z Workers zakończona 2024 |
| **Pages Function + Resend** | **0 zł** (3000/mies., 100/dzień) | ✅✅✅ | pełna (własny kod, własna domena nadawcy, DKIM) | **WYBRANE** |

### 3.2 Decyzje szczegółowe (uzgodnione 2026-07-11)

| #   | Decyzja |
| --- | --- |
| D1  | Wysyłka: **Resend** (free tier), API wołane zwykłym `fetch` — zero zależności npm |
| D2  | Endpoint: **Pages Function w tym repo** — `functions/api/kontakt.ts` → produkcyjnie `https://hadrianm.pl/api/kontakt` (działa też na preview PR-ów) |
| D3  | Captcha: **Cloudflare Turnstile** (darmowa), widget managed z `appearance: 'interaction-only'` — niewidzialny, pokazuje się tylko gdy CF ma wątpliwości |
| D4  | Adres nadawcy maili systemowych: **`no-reply@hadrianm.pl`** (nie jest aliasem skrzynki — istnieje tylko jako nadawca w Resend) |
| D5  | Rate limiting: reguła WAF Cloudflare na `/api/kontakt` + dzienny bezpiecznik w funkcji (KV, opcjonalny — §5.4) |
| D6  | Reveal w sekcji pokazuje **`info@hadrianm.pl`** (nie `mateusz@` jak w prototypie) + telefon `+48 783 983 600` (potwierdzony) |
| D7  | Polityka prywatności: **osobny etap na samym końcu, osobny branch i commit** (Mateusz chce mieć swobodę cofnięcia/redesignu) |
| D8  | Chipsy tematu = nazwy pakietów z Oferty: PL `Start / Wizerunek / Biznes / Inny temat`, EN `Start / Image / Business / Other` (spójne z `services.pk*.name` w `src/i18n/ui.ts`) |
| D9  | Ślad zgłoszeń: wariant minimalny — rekord = mail w skrzynce `info@`; logi Resend tylko jako krótkoterminowy debug |
| D10 | Format maila do Mateusza: prosty i czytelny (od kogo, na jaki adres odpisać, treść) — „ładne" HTML tylko w potwierdzeniu dla klienta |
| D11 | Footer z socialami (GitHub/LinkedIn/Instagram) wchodzi w zakres sekcji — URL-e poda Mateusz przy wdrożeniu |

## 4. Architektura docelowa

### 4.1 Przepływ

```
przeglądarka (sekcja #kontakt)
  │  walidacja kliencka + honeypot + zegar 4s + token Turnstile
  ▼  POST /api/kontakt (multipart/form-data)
Pages Function (functions/api/kontakt.ts)
  ├─ 0. tylko POST (inne metody → 405)
  ├─ 1. honeypot `firma` niepusty LUB `elapsed` < 4000 → 200 „sukces" i CICHE odrzucenie (bot nie dostaje sygnału)
  ├─ 2. walidacja pól (powtórzona serwerowo + limity długości) → 400
  ├─ 3. weryfikacja Turnstile (siteverify) → 403
  ├─ 4. [opcjonalnie] dzienny bezpiecznik KV → 503
  ├─ 5. mail #1 → info@hadrianm.pl  (Resend; porażka → 502)
  ├─ 6. mail #2 → adres nadawcy     (Resend; porażka NIE psuje odpowiedzi — patrz §4.4)
  ▼
200 → frontend: crossfade na potwierdzenie (.sent)
4xx/5xx/wyjątek sieci → frontend: komunikat .kt-srv („napisz bezpośrednio na e-mail")
```

### 4.2 Kontrakt endpointu (rozszerzony)

Bazowy kontrakt z referencji + **dwa nowe pola** dodawane przez skrypt sekcji:

| Pole | Źródło | Serwer sprawdza |
| --- | --- | --- |
| `name` | input | niepuste, ≤ 100 znaków, bez `\n` |
| `email` | input | regex `/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/`, ≤ 254 znaki |
| `temat` | radio (może być puste) | jeśli podane — jedna z dozwolonych wartości (PL/EN), inaczej ignorowane |
| `message` | textarea | ≥ 10 i ≤ 5000 znaków |
| `firma` | honeypot | **niepuste = bot** → 200 i cisza |
| `elapsed` | JS (ms od loadu) | **< 4000 = bot** → 200 i cisza |
| `cf-turnstile-response` | **NOWE** — token Turnstile | siteverify z sekretem; niepoprawny → 403 |
| `lang` | **NOWE** — `pl` \| `en` (język strony) | wyznacza język maila #2; nieznane → `pl` |

Limity długości to też ochrona przed nadużyciem (ktoś wkleja megabajty →
ucinamy na 400, zanim cokolwiek poleci do Resend).

### 4.3 Dwa maile

**Mail #1 — powiadomienie do Mateusza** (W1+W2):

- `from`: `Formularz hadrianm.pl <no-reply@hadrianm.pl>`
- `to`: `info@hadrianm.pl`
- `reply_to`: **adres z formularza** → „Odpowiedz" w Outlooku pisze wprost do klienta
- `subject`: `[hadrianm.pl] {temat}: wiadomość od {imię}` (bez tematu: `[hadrianm.pl] wiadomość od {imię}`)
- treść (HTML + wersja tekstowa; format wg D10 — czytelnie, bez ozdób):
  imię, **e-mail nadawcy** (wyróżniony — „na ten adres odpisz"), temat,
  język strony, data, treść wiadomości. Cała treść użytkownika
  **HTML-escapowana** (§5.5).

**Mail #2 — auto-potwierdzenie do nadawcy** (W3):

- `from`: `Mateusz Hadrian <no-reply@hadrianm.pl>`
- `to`: adres z formularza
- `reply_to`: `info@hadrianm.pl` → jeśli klient odpisze na potwierdzenie, wiadomość i tak trafi do Ciebie
- `subject` **stały** (nie zawiera treści użytkownika — domyka wektor spamu):
  PL `Dziękuję za wiadomość — hadrianm.pl`, EN `Thanks for your message — hadrianm.pl`
- treść: podziękowanie + deklaracja z placeholdera formularza („odpowiadam
  najpóźniej w ciągu 24 godzin w dni robocze") + **kopia wiadomości**
  (escapowana, jako cytat) + stopka z linkiem do strony. Wersja PL/EN wg `lang`.

### 4.4 Odpowiedzi HTTP → zachowanie UI

| Status | Kiedy | Frontend (mechanika już w referencji) |
| --- | --- | --- |
| 200 | sukces LUB bot-trap (celowo nieodróżnialne) | crossfade na potwierdzenie |
| 400 | walidacja serwerowa nie przeszła (teoretycznie niemożliwe przy działającym JS) | `.kt-srv` |
| 403 | Turnstile odrzucił token (wygasł/nieważny) | `.kt-srv` — użytkownik klika ponownie, skrypt pobiera świeży token (§5.3) |
| 405 | metoda inna niż POST | — |
| 502 | Resend odrzucił mail #1 lub nie odpowiada | `.kt-srv` |
| 503 | dzienny bezpiecznik KV wyczerpany (§5.4) | `.kt-srv` |

**Zasada:** porażka maila #2 (potwierdzenia) przy udanym mailu #1 →
**mimo wszystko 200**. Wiadomość dotarła do Ciebie — to jest sedno usługi;
nie straszymy użytkownika błędem, którego skutkiem jest tylko brak kopii.
Incydent zostaje w logach Resend (`console.error` w funkcji też — widoczny
w Pages → Functions → Real-time logs).

Komunikat `.kt-srv` z referencji („Nie udało się wysłać — spróbuj ponownie
albo napisz bezpośrednio na e-mail") pokrywa wszystkie ścieżki błędów;
fallbackiem jest reveal `info@hadrianm.pl` obok formularza.

## 5. Antyspam / anty-abuse — warstwy

Auto-potwierdzenie (W3) czyni endpoint potencjalnym „przekaźnikiem": bot
wpisuje cudzy adres i wysyła obcej osobie mail z naszej domeny. Dlatego
warstw jest pięć i **każda działa niezależnie**:

### 5.1 Klient (już w referencji)

Honeypot `firma` (pole niewidoczne, `tabindex=-1`) + minimalny czas
wypełnienia 4 s. Trafiony bot dostaje **udawany sukces bez requestu**.

### 5.2 Serwer powtarza test klienta

Funkcja sprawdza `firma` i `elapsed` niezależnie (bot może POST-ować
bezpośrednio, z pominięciem JS) i odpowiada **200 bez wysyłki** — bot nie
wie, że został odsiany, więc nie iteruje.

### 5.3 Cloudflare Turnstile (kluczowa warstwa dla W3)

- Widget **managed** + `appearance: 'interaction-only'` — niewidoczny dla
  ~wszystkich ludzi; interaktywny challenge tylko przy podejrzanym ruchu.
- **Render jawny (explicit), egzekucja przy submit** — token Turnstile żyje
  300 s i jest jednorazowy; formularz kontaktowy bywa wypełniany dłużej.
  Sekwencja: submit → walidacja kliencka OK → `turnstile.execute()` →
  świeży token → POST. Po każdej próbie (sukces i błąd) `turnstile.reset()`.
- Serwer: POST `https://challenges.cloudflare.com/turnstile/v0/siteverify`
  (`secret`, `response`, `remoteip` z nagłówka `CF-Connecting-IP`).
- Klucz **site** (publiczny) może być w repo; klucz **secret** wyłącznie w
  sekretach Pages (§8, Etap 0).
- Testy automatyczne: **nie** dotykają prawdziwego Turnstile — Playwright
  stubuje skrypt widgetu (§8, Etap 3); do ręcznych testów lokalnych Turnstile
  ma oficjalne klucze testowe „always pass" (sitekey `1x00000000000000000000AA`,
  secret `1x0000000000000000000000000000000AA`).

### 5.4 Rate limiting

- **Reguła WAF** (plan Free ma 1 regułę rate limiting): ścieżka
  `/api/kontakt` + metoda POST, licznik per IP, blokada przy przekroczeniu.
  ⚠️ FLAGA: na planie Free okno zliczania to **10 s** (dłuższych okien nie
  ma) — reguła łapie więc **serie** (np. > 3 POST/10 s → block), nie limity
  godzinowe. Dokładne pola/wartości potwierdź w dashboardzie przy konfiguracji.
- **Dzienny bezpiecznik w funkcji (opcjonalny, zalecany):** licznik w
  Cloudflare KV (klucz `quota:RRRR-MM-DD`, TTL 48 h); powyżej ~80 wysyłek
  dziennie → 503. Chroni dzienny limit Resend (100/dzień) przed wolnym,
  rozproszonym atakiem, którego WAF nie złapie. KV free: 1000 zapisów/dzień —
  z zapasem. Funkcja **działa bez bindingu** (feature-detect `env.KONTAKT_KV`)
  — bezpiecznik można dodać po starcie, bez zmiany kodu ścieżki głównej.

### 5.5 Higiena treści

- Cała treść użytkownika w mailach **HTML-escapowana** (mini-helper, bez
  bibliotek) — nikt nie wstrzyknie znaczników/linków stylizowanych do maili.
- `name`/`temat` w `subject`: strip znaków nowej linii + limit długości
  (header injection jest niemożliwy przez JSON API Resend, ale porządek
  w temacie zostaje).
- Stały `subject` maila #2 (§4.3) — atakujący nie kontroluje tematu
  potwierdzenia; jego treść pojawia się wyłącznie jako oznaczony cytat
  „Twoja wiadomość".

## 6. Deliverability / DNS — bez dotykania poczty OVH

Zasada nadrzędna: **rekordy z `mailbox_setup.md` (MX, SPF `@`, DKIM OVH,
DMARC) pozostają nietknięte.** Resend weryfikuje domenę na **subdomenie**
wysyłkowej, więc nie ma kolizji:

| Rekord (typowo — dokładne wartości POKAŻE panel Resend) | Typ | Gdzie |
| --- | --- | --- |
| `send.hadrianm.pl` → `feedback-smtp.<region>.amazonses.com` (prio 10) | MX | Cloudflare DNS, **DNS only** |
| `send.hadrianm.pl` → `v=spf1 include:amazonses.com ~all` | TXT | jw. |
| `resend._domainkey.hadrianm.pl` → `p=…` (klucz DKIM) | TXT | jw. |

- MX na `send.` dotyczy **tylko** bounce'ów Resend — MX domeny głównej
  (poczta OVH) bez zmian. SPF `@` też bez zmian (envelope-from Resend to
  `send.hadrianm.pl`, nie `hadrianm.pl`).
- **Zgodność DMARC:** DKIM podpisuje `d=hadrianm.pl` → relaxed alignment
  PASS; SPF na subdomenie → też aligned. Obecny DMARC `p=none` z
  `rua=info@` obejmie te maile automatycznie — po kilku tygodniach raporty
  powiedzą, czy można zaostrzać (plan z `mailbox_setup.md` §2.4 bez zmian).
- Region Resend: przy dodawaniu domeny wybierz **EU (Irlandia)** — RODO
  i szybsze doręczanie w PL.
- `no-reply@hadrianm.pl` nie musi istnieć jako skrzynka/alias — to czysty
  nadawca. Jeśli ktoś mimo `Reply-To` odpisze na `no-reply@`, mail odbije
  się od OVH (adres nieznany) — akceptowalne i standardowe.

## 7. RODO / prywatność

- **Minimalizacja:** endpoint niczego nie zapisuje (poza opcjonalnym
  licznikiem KV bez danych osobowych); dane przechodzą tranzytem do skrzynki
  `info@`. Rekord zgłoszenia = mail (D9).
- Nota pod formularzem (już w referencji): „Wysyłając wiadomość akceptujesz
  politykę prywatności…" → link do `/polityka-prywatnosci`.
- **Polityka prywatności** (Etap 5, na końcu, osobny branch — D7) musi
  wymienić: administratora, cel (odpowiedź na wiadomość), podstawę
  (art. 6 ust. 1 lit. f / b RODO), odbiorców-procesorów (**Resend** — wysyłka
  e-mail, **Cloudflare** — hosting/WAF/Turnstile, **OVH** — skrzynka),
  transfer poza EOG (Resend/Cloudflare — standardowe klauzule umowne),
  okres przechowywania (korespondencja w skrzynce), prawa osoby.
- ⚠️ Do czasu Etapu 5 link będzie prowadził w próżnię (404 na produkcji po
  merge'u sekcji). Świadomy, krótki stan przejściowy — Etap 5 powinien wejść
  możliwie szybko po Etapie 4.

## 8. Plan wdrożenia — etapy

> Podział ról: **[M]** = Mateusz (poza kodem, krok po kroku), **[C]** =
> Claude (kod w working tree, commituje Mateusz). Kolejność celowa:
> najpierw mechanizm (Etapy 0–1), potem wygląd (Etap 2), potem testy (Etap 3).
> Całość na feature branchu (np. `feat/contact-section`), zgodnie z
> `daily-workflow.md`.

### Etap 0 — [M] Konta, DNS, sekrety (jednorazowo, ~30–45 min)

**0.1 Resend — konto i domena**

1. Załóż darmowe konto na <https://resend.com> (najprościej „Sign in with
   GitHub").
2. Panel → **Domains → Add Domain** → wpisz `hadrianm.pl`, region **EU
   (Ireland)**. Resend wyświetli ~3 rekordy DNS (jak w tabeli §6).
3. Cloudflare → domena `hadrianm.pl` → **DNS → Records** → dodaj rekordy
   **dokładnie z panelu Resend**, wszystkie **DNS only (szara chmurka)**.
   Niczego istniejącego nie usuwaj ani nie edytuj (to poczta OVH!).
4. W Resend kliknij **Verify** — status `Verified` zwykle w kilka–kilkanaście
   minut.
5. Panel → **API Keys → Create API Key**: nazwa `hadrianm-web-kontakt`,
   uprawnienie **Sending access** (wystarczy), domena `hadrianm.pl`.
   Skopiuj klucz (`re_…`) do menedżera haseł — pokaże się tylko raz.

**0.2 Turnstile — widget**

1. Dashboard Cloudflare → **Turnstile → Add widget**.
2. Nazwa: `hadrianm-kontakt`. Hostnames: `hadrianm.pl`, `www.hadrianm.pl`,
   `hadrianm-web.pages.dev` (⚠️ FLAGA: wpisz faktyczną domenę projektu Pages —
   subdomeny preview `*.hadrianm-web.pages.dev` są objęte automatycznie;
   potwierdź w opisie pola) oraz `localhost` (ręczne testy lokalne).
3. Widget mode: **Managed**. (Wygląd „interaction-only" ustawia kod widgetu,
   nie dashboard.)
4. Zapisz **Site Key** (publiczny — trafi do kodu) i **Secret Key**
   (do sekretów Pages, punkt 0.3).

> **Stan: ✅ wykonane (2026-07-11).** Etap 0 w całości (Resend zweryfikowany,
> widget Turnstile utworzony, sekrety w Pages dla Production+Preview, reguła
> WAF `kontakt-form-burst` wdrożona — na Free bez warunku Request Method,
> sam URI Path). Site Key widgetu: `0x4AAAAAADz4VmJXKzTYru3e`.
> KV (0.5) odłożone — funkcja działa bez bindingu.

**0.3 Sekrety w projekcie Pages**

1. Cloudflare → **Workers & Pages → hadrianm-web → Settings → Variables and
   Secrets** (środowisko **Production** ORAZ **Preview**).
2. Dodaj jako **Secret** (nie plaintext):
   - `RESEND_API_KEY` = klucz z 0.1,
   - `TURNSTILE_SECRET_KEY` = sekret z 0.2.
3. Sekrety zaczną obowiązywać od **następnego deployu** (wystarczy zwykły
   push na branch).

**0.4 Reguła WAF (rate limiting)**

1. Cloudflare → domena `hadrianm.pl` → **Security → WAF → Rate limiting
   rules → Create rule**.
2. Nazwa `kontakt-form-burst`; warunek: `URI Path equals /api/kontakt` AND
   `Method equals POST`; licznik per IP; próg np. **3 żądania / 10 s**;
   akcja **Block**. (⚠️ wartości okien/akcji wg dostępnych opcji planu Free —
   patrz §5.4.)

**0.5 (Opcjonalnie, można po starcie) KV dla dziennego bezpiecznika**

1. Cloudflare → **Storage & Databases → KV → Create namespace**:
   `kontakt-quota`.
2. Workers & Pages → hadrianm-web → **Settings → Bindings → Add → KV
   namespace**: nazwa zmiennej `KONTAKT_KV` → namespace `kontakt-quota`
   (Production + Preview).

### Etap 1 — [C] Endpoint: `functions/api/kontakt.ts`

> **Stan: ✅ wykonany (2026-07-11)** — endpoint + `src/lib/contact-form.ts`
> + 15 testów unit (`tests/unit/contact-form.test.ts`); korekty wykonawcze
> w pkt 2–3 niżej.

1. **Pages Function** w katalogu `functions/` (root repo — Pages wykrywa go
   automatycznie obok statycznego `dist`; Astro pozostaje w 100% statyczne,
   bez adaptera i bez SSR):
   - `functions/api/kontakt.ts` — `onRequestPost` z przepływem §4.1
     (parsowanie `await request.formData()` — natywne w Workers runtime),
   - wysyłka przez `fetch('https://api.resend.com/emails', …)` — dwa
     sekwencyjne wywołania (mail #1, potem #2), zero zależności npm,
   - `onRequest` dla pozostałych metod → 405.
2. **Współdzielona logika walidacji** wyniesiona do czystego modułu
   **`src/lib/contact-form.ts`** (ℹ️ korekta wykonawcza 2026-07-11: zamiast
   planowanego `functions/_lib/contact.ts` — moduł w `src/` obejmują bez
   dodatkowej konfiguracji `astro check`, ESLint i Vitest; funkcja importuje
   go ścieżką względną, bundler Pages dołącza importy spoza `functions/`):
   reguły pól, limity, escape HTML, budowa treści maili PL/EN, detekcja
   bot-trap. Czysty TS bez zależności od runtime'u → testowalny Vitestem.
3. **Typy i typecheck:** ℹ️ korekta wykonawcza — bez
   `@cloudflare/workers-types` i osobnego tsconfiga: funkcja używa wyłącznie
   standardowych API (Request/Response/FormData/fetch, lib DOM), a kontekst
   Pages i binding KV są otypowane lokalnie w pliku funkcji. Katalog
   `functions/` wchodzi w istniejący `astro check` (tsconfig `include: **/*`)
   — kontrakt CI nietknięty.
4. **Testy unit** (`tests/unit/contact-form.test.ts`): walidacja (happy
   path + każdy błąd), bot-trap (honeypot/elapsed), escape HTML, limity
   długości, szablony PL/EN (snapshot treści), stały subject maila #2.
5. **Weryfikacja lokalna full-stack (opcjonalna):** `pnpm build` →
   `npx wrangler pages dev dist` (serwuje statyki + funkcję; sekrety w
   nieśledzonym `.dev.vars`). Nie jest częścią kontraktu testowego — CI
   testuje funkcję unitami, a integrację weryfikuje Etap 4 na preview.

### Etap 2 — [C] Sekcja `#kontakt` — port referencji do Astro

Wg „Przeniesienie do Astro (skrót)" z README referencji, z decyzjami z §3:

> **Stan: ✅ wykonany (2026-07-11).** Korekty wykonawcze względem planu:
> (a) kotwica sekcji to **`#contact`** (nie `#kontakt` z referencji) — tak
> celuje istniejący navbar (`src/i18n/nav.ts`) i CTA z FAQ; endpoint bez
> zmian: `/api/kontakt`; (b) **bez `body.kt-static`** — FAQ też zrezygnował
> z tego haka; tryby statyczne = klasa `.js` na sekcji + czysty CSS przy
> reduce (wzorzec FAQ); (c) mono = token projektu `--font-mono`
> (ui-monospace), nie Space Mono — spójnie z decyzją z sekcji FAQ;
> (d) Turnstile ładowany leniwie (pierwszy focus w formularzu), render
> jawny, egzekucja przy submit, timeout 90 s → token "" → serwerowe 403.
> Zweryfikowane na preview (Playwright, PL+EN): walidacja, chipsy, pułapki
> (submit <4 s → udawany sukces bez requestu), reveal `info@`/telefonu,
> kopiowanie, ścieżka błędu (realny token Turnstile + 404 z preview →
> `.kt-srv`), grep dist bez pełnych ciągów e-maila/telefonu.

1. `src/components/sections/contact/Contact.astro` (+ skrypt TS wzorem
   pozostałych sekcji) — markup z `kontakt.html` bez spacera podglądu;
   kotwica `id="kontakt"`; hierarchia `<h2>`/`<h3>` zachowana.
2. GSAP/ScrollTrigger z importów, wejścia `once → .on`, parallax ghosta
   tylko desktop, tryby statyczne (`body.kt-static`, reduce, brak JS) —
   kontrakt jak `fq-static`/`of-static`.
3. „Do góry ↑" → globalny handler Lenis (`lenis.scrollTo(0)`).
4. **Reveal danych:** fragmenty `info` + `hadrianm` + `pl` (D6 — zamiast
   `mateusz`) i telefon `+48 783 983 600`; mechanika [ POKAŻ ]/[ KOPIUJ ]
   bez zmian; pełne wartości nie występują w źródle ani bundlu.
5. **Wysyłka:** `KT_CFG.endpoint = '/api/kontakt'`; skrypt dokłada pola
   `lang` (z `document.documentElement.lang`) i token Turnstile; integracja
   Turnstile wg §5.3 (explicit render, execute przy submit, reset po próbie).
6. **i18n:** teksty sekcji w `src/i18n/ui.ts` (PL + EN, EN zaproponuję do
   akceptacji); chipsy wg D8; sekcja na `/` i `/en/`.
7. **Footer** (finał strony) razem z sekcją; linki social — **[M] poda
   URL-e GitHub/LinkedIn/Instagram** (do czasu podania: linki ukryte, nie
   atrapy); `rel="noopener"` przy `target="_blank"`; `#polityka` →
   `/polityka-prywatnosci` (strona powstanie w Etapie 5).

### Etap 3 — [C]+[M] Testy i baseline'y

> **Stan: 🟡 w toku (2026-07-11).** Kod testów gotowy i zielony lokalnie:
> `tests/e2e/contact.spec.ts` (13 scenariuszy × 6 profili; Turnstile
> stubowany route'em, endpoint mockowany przez `page.route`), sonda
> `@prod-smoke` w `smoke.spec.ts` (skip bez `BASE_URL` — preview nie
> serwuje Pages Functions; tylko chromium-1920 — reguła WAF blokuje
> serie POST-ów), axe 0 naruszeń na doscrollowanej sekcji (bez zmian w
> allowliście). Korekta wykonawcza: w `seo.spec.ts` przejściowy wyjątek
> dla linków polityki prywatności (świadome okno 404 z §7/§10 — USUNĄĆ
> w Etapie 5). Wpis visual dla `#contact` istniał już w
> `sections.spec.ts`; do akceptacji Mateusza czeka aktualizacja
> baseline'ów: `section-contact` (6 profili — stary baseline to
> placeholder) + churny `section-work` i `faq-04-cta` (tylko
> chromium-pixel-5; skutek zmiany wysokości strony). Po zgodzie:
> workflow linux → darwin NA KOŃCU (pkt 3 niżej).

1. **e2e** (`tests/e2e/contact.spec.ts`) — scenariusze z checklisty README
   referencji: walidacja (pusty submit → 3 błędy + fokus; zły e-mail;
   czyszczenie błędu przy wpisywaniu), chipsy, honeypot/za-szybki-submit →
   potwierdzenie **bez** requestu, mock endpointu przez `page.route`
   (200 → `.sent` + fokus na `h3`; 500 → `.kt-srv`, formularz aktywny;
   w trakcie: disabled + „Wysyłam…"), [ Wyślij kolejną ], reveal e-mail/telefon
   (`mailto:info@…`, `tel:+48783983600`), grep źródła i bundli: brak
   `info@hadrianm.pl` / `783983600` jako ciągów. **Turnstile stubowany**
   (route na `challenges.cloudflare.com` → atrapa `window.turnstile`) —
   testy deterministyczne i offline.
2. **a11y (axe):** sekcja przechodzi bez nowych wpisów na allowliście
   (ratchet!) — kontrasty mono-etykiet, `aria-invalid`, `aria-live`,
   `role="alert"`/`role="status"`, focus-visible.
3. **visual:** wpisy w `tests/visual/sections.spec.ts` (6 profili).
   Baseline'y wg procedury z pamięci projektu: **kod → workflow
   `update-visual-baselines.yml` (linux, bot-commit) → `pnpm
   test:visual:update` (darwin) NA KOŃCU** — commit darwin nie wyzwala CI.
   Uwaga na znane zjawiska: „wszyty" navbar w element-screenshotach i
   subpikselowy ghosting sekcji poniżej (≠ regresja). Turnstile w trybie
   interaction-only jest niewidoczny — nie destabilizuje snapshotów.
4. **Smoke produkcyjny:** do `tests/e2e/` (tag `@prod-smoke`) test
   POST `/api/kontakt` z **wypełnionym honeypotem** → oczekiwane 200.
   Weryfikuje żywotność endpointu na produkcji **bez wysłania
   jakiegokolwiek maila** (ścieżka bot-trap kończy się przed Resend).

### Etap 4 — [M] Test end-to-end na preview i produkcji (~15 min)

Na deployu preview PR-a (funkcja i sekrety Preview już działają):

1. Wyślij z formularza prawdziwą wiadomość na własny adres testowy (np.
   prywatny Gmail jako „klient").
2. W Outlooku (`info@`): mail przyszedł; **„Odpowiedz" adresuje do adresu
   testowego** (W2); treść czytelna (od kogo, e-mail, temat, wiadomość).
3. Na adresie testowym: przyszło potwierdzenie z kopią treści (W3);
   **sprawdź folder Spam** — przy świeżej domenie wysyłkowej pierwszy mail
   potrafi tam wpaść; w Gmailu „Pokaż oryginał" → SPF PASS, DKIM PASS
   (`d=hadrianm.pl`), DMARC PASS.
4. Odpowiedz na potwierdzenie z adresu testowego → odpowiedź ma trafić do
   `info@` (Reply-To maila #2).
5. Test błędu: w DevTools zablokuj request do `/api/kontakt` (offline) →
   submit → komunikat `.kt-srv`, formularz dalej aktywny.
6. Po merge'u: powtórz pkt 1–3 raz na produkcji + sprawdź, że przechodzi
   `prod-smoke`.

### Etap 5 — [C]+[M] Polityka prywatności (NA KOŃCU, osobny branch)

Zgodnie z D7 — **osobny branch i osobny commit**, po zakończeniu sekcji:

1. [C] Podstrony `/polityka-prywatnosci` (PL) i `/en/privacy-policy` (EN)
   — treść wg zakresu z §7, prosty layout; projekt do akceptacji Mateusza
   (świadomie łatwy do cofnięcia/redesignu).
2. [C] Podmiana linków `#polityka` w sekcji/footerze na realne ścieżki
   (jeśli w Etapie 2 użyto placeholdera).
3. [M] Merytoryczna akceptacja treści (to dokument prawny — ostatnie słowo
   należy do Ciebie; w razie wątpliwości konsultacja prawna).

## 9. Koszty i limity

| Składnik | Plan | Limit | Realne zużycie wizytówki |
| --- | --- | --- | --- |
| Resend | Free | 3000 maili/mies., **100/dzień**, 1 domena | 2 maile na zgłoszenie → ~50 zgłoszeń/dzień max; dużo zapasu |
| Pages Functions | Free | 100 000 żądań/dzień | pomijalne |
| Turnstile | Free | bez opłat | — |
| WAF rate limiting | Free | 1 reguła | dokładnie 1 potrzebna |
| KV (opcjonalnie) | Free | 1000 zapisów/dzień | 1 zapis na zgłoszenie |
| **Razem** | | | **0 zł/mies.** (W6 ✅) |

⚠️ FLAGA: retencja logów/treści maili w panelu Resend na planie Free jest
krótka (rzędu dni — sprawdź aktualną wartość w panelu). Zgodnie z D9 to
tylko debug — trwały rekord zgłoszenia to mail w skrzynce `info@`.

## 10. Ryzyka i flagi

| Ryzyko | Mitygacja |
| --- | --- |
| Awaria Resend → zgłoszenia nie wychodzą | `.kt-srv` + jawny `info@` w reveal (fallback dla użytkownika); status.resend.com; plan B: Web3Forms/Brevo — wymiana dotyka tylko funkcji, kontrakt frontendu bez zmian |
| Potwierdzenia wpadają odbiorcom do spamu | poprawny SPF/DKIM/DMARC (§6), stały subject, mała skala wysyłki; świeża domena wysyłkowa „dojrzewa" w kilka tygodni |
| Turnstile fałszywie blokuje człowieka | tryb managed → eskalacja do interaktywnego challenge'u zamiast twardej blokady; ostatecznie `.kt-srv` + e-mail jawny |
| `astro preview`/CI nie serwuje Pages Functions | testy e2e/visual mockują endpoint (Etap 3); integrację weryfikuje preview PR-a (Etap 4) i `@prod-smoke` z honeypotem |
| Zmiany w dashboardach CF/Resend (nazwy pól, limity) | kroki Etapu 0 opisują intencję + wartości „typowe"; źródłem prawdy są panele — rozjazdy oznaczone ⚠️ FLAGA |
| Link do polityki 404 do czasu Etapu 5 | świadome, krótkie okno (§7); Etap 5 zaraz po Etapie 4 |

## 11. Checklista końcowa (definition of done)

- [ ] Resend: domena `Verified`, klucz w sekretach Pages (Prod + Preview)
- [ ] Turnstile: widget utworzony, secret w sekretach, sitekey w kodzie
- [ ] Reguła WAF na `/api/kontakt` aktywna
- [ ] `functions/api/kontakt.ts` + `src/lib/contact-form.ts` + testy unit zielone
- [ ] Sekcja `#kontakt` PL/EN, reveal `info@` + telefon, footer, tryby statyczne
- [ ] e2e + axe zielone; baseline'y visual darwin+linux zcommitowane (właściwa kolejność)
- [ ] Etap 4 przeszedł: W1 ✅ W2 ✅ (Reply-To) W3 ✅ (potwierdzenie z treścią) + ścieżka błędu ✅
- [ ] `@prod-smoke` obejmuje endpoint (honeypot-probe)
- [ ] Etap 5: polityka prywatności PL/EN na osobnym branchu, linki podmienione
- [ ] `docs/README.md` — wpis o tym dokumencie aktualny
