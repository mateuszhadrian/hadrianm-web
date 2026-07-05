# Poczta `@hadrianm.pl` — wariant (a2): skrzynka OVH (Zimbra Starter) + Outlook + Gmail

> Instrukcja krok po kroku dla wariantu **(a2)** z
> [hosting_second_analysis_sveltia.md §7.5](./hosting_second_analysis_sveltia.md):
> jedna prawdziwa skrzynka **`info@hadrianm.pl`** (darmowa, w cenie domeny OVH)
> z aliasami **`mateusz@`**, **`contact@`**, **`kontakt@`** — odbiór i wysyłka
> z **Outlooka**, a na końcu podpięcie tego samego konta pod **Gmaila**
> (odbiór + „Wyślij jako"), żeby dało się obsługiwać pocztę z dowolnego
> urządzenia.
>
> Wszystkie wartości (nazwy serwerów, porty, rekordy DNS, ścieżki w panelach)
> zweryfikowane 2026-07-04 w **oficjalnych** dokumentacjach OVHcloud, Microsoft
> i Google — linki przy każdej sekcji. Rzeczy, których oficjalne dokumentacje
> **nie** potwierdzają, są oznaczone „⚠️ FLAGA".

## Stan wyjściowy (kontekst)

- Domena `hadrianm.pl` kupiona w OVH (sama domena, bez hostingu). W cenie
  domeny OVH dodaje **darmową skrzynkę „Zimbra Starter" 15 GB** — 1 konto,
  webmail Zimbra, IMAP/POP3/SMTP, antyspam, backupy.
  Źródła: [strona domen OVH (PL)](https://www.ovhcloud.com/pl/domains/),
  [oferta e-mail OVH](https://www.ovhcloud.com/pl/emails/).
  - ⚠️ FLAGA: starsza podstrona OVH „free-email" wciąż mówi o koncie 5 GB —
    to opis starego bundla MX Plan. Nowsze źródła (strona domen, roadmap OVH)
    wskazują Zimbra Starter 15 GB; faktyczny pakiet zobaczysz w panelu.
- **DNS domeny jest na Cloudflare** (nie w OVH) — dlatego rekordów pocztowych
  nie skonfiguruje za nas kreator OVH; wpisujemy je ręcznie w Cloudflare
  (Krok 2).
- W strefie Cloudflare siedzą **stare rekordy MX/SPF** zachowane przy migracji
  ze skanu OVH (`mx1/mx2/mx3.mail.ovh.net` z priorytetami 1/5/100 oraz SPF
  `-all`). Oficjalny, aktualny zestaw OVH jest inny — **poprawimy to w
  Kroku 2**.
- Cloudflare **Email Routing ma pozostać WYŁĄCZONY** (zasada „jeden zestaw
  MX" — patrz §7.5 analizy).

## Plan (kolejność ma znaczenie)

1. **Krok 1** — utwórz skrzynkę `info@` + 3 aliasy w panelu OVH.
2. **Krok 2** — popraw DNS w Cloudflare (MX, SPF, DKIM, DMARC).
3. **Krok 3** — test w webmailu OVH (zanim dotkniesz Outlooka).
4. **Krok 4** — Outlook: dodanie konta IMAP + wysyłka ze wszystkich 4 adresów.
5. **Krok 5** — Gmail: odbiór + „Wyślij jako" dla 4 adresów
   (**odłożone** — wydzielone do [gmail_alias_setup.md](./gmail_alias_setup.md)).
6. **Krok 6** — checklista końcowa.

---

## Krok 1 — utwórz skrzynkę i aliasy w panelu OVH

Oficjalny przewodnik: [„Rozpoczęcie pracy z usługą Zimbra"](https://docs.ovhcloud.com/pl/guides/web-cloud/email-and-collaborative-solutions/zimbra/getting-started-zimbra).

1. Zaloguj się do [panelu klienta OVH](https://www.ovh.com/manager/) →
   **Web Cloud → Zimbra Mail** (jeśli nie widzisz pozycji, poszukaj w sekcji
   E-maile — darmowa skrzynka do domeny to produkt „Zimbra Starter").
2. Zakładka **Organizacja → Dodaj organizację** — Zimbra wymaga „organizacji"
   zanim dodasz domenę. Podaj nazwę (np. `hadrianm`) i krótki znacznik.
3. Zakładka **Domena → Dodaj domenę**:
   - wybierz utworzoną organizację,
   - wybierz **„Wybierz domenę z listy"** — `hadrianm.pl` jest w Twoim koncie
     OVH, więc pojawi się na liście (mimo że DNS jest na Cloudflare),
   - przy pytaniu o konfigurację strefy DNS wybierz **„Konfiguracja
     niestandardowa"** — automatyczna i tak nie zadziała, bo strefa jest u
     Cloudflare; rekordy wpiszesz ręcznie w Kroku 2,
   - pojawią się 4 checkboxy (domyślnie zaznaczone): automatyczna
     konfiguracja rekordów **SRV / MX / SPF / DKIM** — **odznacz wszystkie
     cztery**. Zapisałyby rekordy tylko w martwej strefie DNS po stronie OVH
     (nameserwery wskazują Cloudflare), tworząc mylący stan „skonfigurowane".
     Po tym kroku Raport diagnostyczny będzie alarmował o brakujących
     rekordach — to oczekiwane, znikną po Kroku 2,
   - **weryfikacja domeny (przy DNS poza OVH):** domena pojawi się na liście
     ze statusem **„CNAME"** — OVH żąda dowodu kontroli nad domeną. Kliknij
     status, przepisz wskazany rekord i dodaj go **w Cloudflare** (DNS →
     Records → Add record): Type `CNAME`, Name `ovh-zimbra-XXXXXXXX` (token
     per próba), Target `ovh.com`, **Proxy status: DNS only (szara
     chmurka!)** — z proxy weryfikacja nie przejdzie. Detekcja trwa kilka
     minut (limit 48 h); po zweryfikowaniu rekord można usunąć. Dopóki
     domena nie jest zweryfikowana, nie wybierzesz jej przy tworzeniu konta
     e-mail („no results found").
4. Zakładka **Konta e-mail → Utwórz konto**:
   - nazwa konta: `info` (dozwolone 2–32 znaki; tylko `.`, `+`, `-`, `_`),
   - domena: `hadrianm.pl`,
   - imię / nazwisko / nazwa wyświetlana: np. „Mateusz Hadrian” / „hadrianm”,
   - hasło: **min. 10 znaków, wielka litera, znak specjalny**. Zapisz je w
     menedżerze haseł — będzie loginem w Outlooku, Gmailu i webmailu.
5. **Aliasy** (`mateusz@`, `contact@`, `kontakt@`): przy koncie `info@` kliknij
   **⁝ → Zmień → zakładka „Alias" → Utwórz alias** — dodaj kolejno `mateusz`,
   `contact`, `kontakt` (każdy z domeną `hadrianm.pl`).
   Źródło: [aliasy i przekierowania OVH](https://docs.ovhcloud.com/pl/guides/web-cloud/email-and-collaborative-solutions/common-email-features/feature-redirections)
   („Jeden adres e-mail może mieć kilka aliasów").
   - ⚠️ FLAGA: dokumentacja nie podaje liczbowego limitu aliasów („kilka") —
     4 adresy na jedno konto to typowy scenariusz, powinno przejść bez problemu.
6. Zostaw otwartą zakładkę **Domena → ⁝ → Raporty diagnostyczne** — pokazuje
   ona **dokładne rekordy MX / SPF / DKIM / SRV**, których usługa oczekuje,
   i świeci alertami, dopóki DNS nie jest poprawny. To Twoje „źródło prawdy"
   dla Kroku 2.

---

## Krok 2 — rekordy DNS w Cloudflare

Panel Cloudflare → domena `hadrianm.pl` → **DNS → Records**. Wszystkie rekordy
pocztowe mają być **DNS only** (szara chmurka; MX i TXT nie mają opcji proxy,
ale CNAME od DKIM już tak — upewnij się, że są szare).

**Nie włączaj Email Routing** (Email → Email Routing ma pozostać wyłączone).

### 2.1 MX — wymień stary zestaw na oficjalny

Oficjalne wartości (wspólne dla MX Plan / Zimbra):
[docs OVH — rekord MX](https://docs.ovhcloud.com/pl/guides/web-cloud/domains/dns-zone-mx).

1. **Usuń** obecne 3 rekordy MX (`mx1` prio 1, `mx2` prio 5, `mx3` prio 100 —
   stary zestaw ze skanu przy migracji domeny).
2. **Dodaj** 5 rekordów MX (Name: `@`, TTL: Auto):

   | Priorytet | Serwer            |
   | --------- | ----------------- |
   | 1         | `mx0.mail.ovh.net` |
   | 5         | `mx1.mail.ovh.net` |
   | 50        | `mx2.mail.ovh.net` |
   | 100       | `mx3.mail.ovh.net` |
   | 200       | `mx4.mail.ovh.net` |

3. Porównaj z zakładką **MX** w Raportach diagnostycznych OVH (Krok 1 pkt 6) —
   ma przestać alertować (propagacja do ~1 h).

### 2.2 SPF — dostosuj do oficjalnej wartości

Oficjalna wartość: [docs OVH — rekord SPF](https://docs.ovhcloud.com/pl/guides/web-cloud/domains/dns-zone-spf).

Obecny rekord TXT to `v=spf1 include:mx.ovh.com -all`. **Zmień na dokładnie:**

```
v=spf1 include:mx.ovh.com ~all
```

(`~all` zamiast `-all` — tak podaje dokumentacja OVH i tego oczekuje raport
diagnostyczny; `~all` to „softfail", bezpieczniejszy przy przekierowaniach.)

### 2.3 DKIM — włącz w panelu OVH, wpisz 2 CNAME w Cloudflare

Oficjalny przewodnik: [docs OVH — rekord DKIM](https://docs.ovhcloud.com/pl/guides/web-cloud/domains/dns-zone-dkim).

1. Panel OVH → **Zimbra Mail → Domena → ⁝ → Raporty diagnostyczne → zakładka
   DKIM** → włącz DKIM. Ponieważ DNS jest poza OVH, panel wyświetli **dwa
   rekordy CNAME** do samodzielnego wpisania, w formacie:
   - `ovhmoXXXXXXX-selector1._domainkey` → `ovhmoXXXXXXX-selector1._domainkey.NNNNNN.aj.dkim.mail.ovh.net.`
   - `ovhmoXXXXXXX-selector2._domainkey` → (analogicznie `selector2`)

   (Dokładne wartości są generowane per usługa — **przepisz je z panelu**,
   nie z tej instrukcji.)
2. W Cloudflare dodaj oba jako **CNAME, DNS only (szara chmurka!)** —
   pomarańczowa chmurka (proxy) zepsuje weryfikację DKIM.
3. Aktywacja trwa od 30 min do 24 h — zakładka DKIM w panelu pokaże status.

### 2.4 DMARC

Oficjalna rekomendacja OVH (start od `p=none`, obserwacja raportów):
[docs OVH — rekord DMARC](https://docs.ovhcloud.com/pl/guides/web-cloud/domains/dns-zone-dmarc).

Dodaj rekord TXT:

- **Name:** `_dmarc`
- **Content:** `v=DMARC1; p=none; rua=mailto:info@hadrianm.pl`

Po kilku tygodniach, gdy raporty nie pokazują problemów, można zaostrzyć do
`p=quarantine` (opcjonalnie stopniowo przez `pct=`). SPF + DKIM + DMARC to
też komplet wymagany przez
[wytyczne nadawców Google (2024+)](https://support.google.com/mail/answer/81126) —
bez tego maile do odbiorców na Gmailu lubią lądować w spamie.

### 2.5 (Opcjonalnie) SRV — autokonfiguracja klientów pocztowych

Raport diagnostyczny OVH ma też zakładkę **SRV** — rekord autodiscover
podpowiadający klientom (Outlook/Apple Mail/Thunderbird) ustawienia
serwerów. Nie jest wymagany (w Kroku 4 i tak podajemy serwery ręcznie),
ale warto dodać. Wartości z panelu (2026-07-04):

- **Type:** `SRV`, **Name:** `_autodiscover._tcp`
- **Priority:** `0`, **Weight:** `0`, **Port:** `443`
- **Target:** `zimbra1.mail.ovh.net`

Po dodaniu zakładka SRV w diagnostyce przechodzi z „Configuration error"
na OK (propagacja: minuty).

---

## Krok 3 — test w webmailu (zanim skonfigurujesz klienty)

1. Wejdź na **<https://www.ovhcloud.com/pl/mail/>** → zaloguj się
   `info@hadrianm.pl` + hasło z Kroku 1 (nastąpi przekierowanie do webmaila
   Zimbra).
2. **Odbiór:** wyślij ze swojego Gmaila testowe maile na **wszystkie cztery**
   adresy (`info@`, `mateusz@`, `contact@`, `kontakt@hadrianm.pl`) — wszystkie
   powinny wpaść do tej samej skrzynki. Jeśli nie dochodzą — poczekaj na
   propagację MX (do ~1 h) i sprawdź Raport diagnostyczny.
3. **Wysyłka:** wyślij z webmaila mail na swój Gmail. W Gmailu otwórz
   **⋮ → Pokaż oryginał** i sprawdź, że jest `SPF: PASS` i `DKIM: PASS`
   (DKIM dopiero po aktywacji z 2.3).

Dane serwerów dla klientów pocztowych — oficjalna tabela OVH
([docs — konfiguracja programów pocztowych Zimbra](https://docs.ovhcloud.com/pl/guides/web-cloud/email-and-collaborative-solutions/zimbra/mail-apps)):

| Protokół | Serwer              | Port | Szyfrowanie | Login                 |
| -------- | ------------------- | ---- | ----------- | --------------------- |
| IMAP     | `imap.mail.ovh.net` | 993  | SSL/TLS     | `info@hadrianm.pl`    |
| POP3     | `pop.mail.ovh.net`  | 995  | SSL/TLS     | `info@hadrianm.pl`    |
| SMTP     | `smtp.mail.ovh.net` | 465  | SSL/TLS     | `info@hadrianm.pl`    |

> Alternatywnie wszędzie działa historyczny host `ssl0.ovh.net` (te same
> porty) — OVH oficjalnie wymienia go jako równoważny również dla Zimbry.
> Hasło = hasło konta z Kroku 1 (żadnych „haseł aplikacji" nie ma).

---

## Krok 4 — Outlook: odbiór i wysyłka ze wszystkich 4 adresów

### 4.1 Dodanie konta (IMAP)

**Nowy Outlook (Windows)** — [docs Microsoft — dodawanie konta](https://support.microsoft.com/en-us/office/add-an-email-account-to-outlook-for-windows-6e27792a-9267-4aa4-8bb6-c84ef146101b):

1. **Ustawienia (⚙) → Konta → Dodaj konto** (albo „Dodaj konto" na dole listy
   folderów) → wpisz `info@hadrianm.pl` → **Kontynuuj**.
2. Jeśli Outlook nie wykryje ustawień sam: rozwiń opcje zaawansowane /
   **IMAP** i wpisz ręcznie serwery z tabeli w Kroku 3 (IMAP 993 SSL,
   SMTP 465 SSL, login = pełny adres).
   ⚠️ FLAGA: Microsoft nie opisuje ekranu ręcznej konfiguracji IMAP nowego
   Outlooka w oficjalnym artykule — ekran istnieje, ale jego dokładny wygląd
   znamy tylko z odpowiedzi na Microsoft Q&A.
3. Uwaga na prywatność: nowy Outlook (a także Outlook na Macu i mobilny)
   synchronizuje konta IMAP przez **Microsoft Cloud** (kopia poczty trafia na
   serwery Microsoftu) —
   [docs Microsoft — synchronizacja z Microsoft Cloud](https://support.microsoft.com/en-us/office/sync-your-account-in-outlook-to-the-microsoft-cloud-985f9e19-d308-4e85-9d1d-0c6f32f8e981).
   Dla poczty firmowej portfolio to zwykle akceptowalne; jeśli nie —
   użyj klasycznego Outlooka (łączy się bezpośrednio).

**Klasyczny Outlook (Windows):** **Plik → Dodaj konto** → wpisz adres →
**Opcje zaawansowane → Pozwól mi ręcznie skonfigurować konto** → **IMAP** →
serwery z tabeli → hasło → **Połącz**. Oficjalny przewodnik OVH dla Outlooka:
[docs OVH — Outlook](https://docs.ovhcloud.com/pl/guides/web-cloud/email-and-collaborative-solutions/mx-plan/how-to-configure-outlook-2016).

**Outlook (Mac):** menu **Outlook → Ustawienia → Konta → ➕ Dodaj konto** →
adres → dalej; ręczne pola (serwer przychodzący/wychodzący, port, SSL) —
[docs Microsoft — konto w Outlook dla Mac](https://support.microsoft.com/en-us/office/add-an-email-account-to-outlook-for-mac-6aeec61b-86af-40af-8ffe-985d0fc82ddb).

**Outlook mobilny (iOS/Android):** awatar → ⚙ → **Dodaj konto e-mail** →
adres → jeśli źle wykryje, wybierz ręcznie **IMAP**; niestandardowy port
podaje się po dwukropku (np. `imap.mail.ovh.net:993`) —
[docs Microsoft — IMAP w Outlook mobile](https://support.microsoft.com/en-us/office/how-do-i-set-up-an-imap-account-7af3289c-3a33-46ab-bf51-93f2d095455f).

### 4.2 Odbiór na 4 adresy

Nic do konfigurowania — `mateusz@`, `contact@` i `kontakt@` to aliasy tej
samej skrzynki, więc wszystko wpada do skrzynki odbiorczej konta
`info@hadrianm.pl` w Outlooku.

### 4.3 Wysyłka jako `mateusz@` / `contact@` / `kontakt@`

W nowej wiadomości pokaż pole **Od**: (nowy Outlook: karta **Opcje → Pokaż
pole Od**) → kliknij **Od → Inny adres e-mail** i wpisz np.
`kontakt@hadrianm.pl`. W klasycznym Outlooku analogicznie: **Opcje → Od →
Inny adres e-mail**. Raz użyty adres zostaje na liście do wyboru.
Źródło: [docs Microsoft — pole Od / inny adres](https://support.microsoft.com/en-us/office/open-and-use-a-shared-mailbox-in-outlook-d94a8e9e-21f1-4240-808b-de9c9c088afd).

> **⚠️ FLAGA — najważniejsze zastrzeżenie całej instrukcji.** To, czy serwer
> SMTP OVH **przyjmie** wysyłkę z aliasem w polu „Od" (zalogowany jesteś jako
> `info@`), nie jest potwierdzone ani przez Microsoft (zachowanie „Other email
> address" dla kont IMAP nieudokumentowane), ani przez OVH (webmail Zimbra
> pozwala zmienić „Od" tylko przy delegacji między **realnymi kontami** —
> [FAQ Zimbra OVH](https://docs.ovhcloud.com/pl/guides/web-cloud/email-and-collaborative-solutions/mx-plan/faq-zimbra)).
> Ponieważ aliasy formalnie należą do Twojego konta, jest spora szansa, że
> SMTP je zaakceptuje — **ale musisz to przetestować** (test niżej).
>
> **Test:** wyślij z Outlooka mail na swój Gmail z „Od: kontakt@hadrianm.pl".
> W Gmailu sprawdź: (1) czy nadawca to `kontakt@` (a nie przepisany
> `info@` / dopisek „w imieniu"), (2) w „Pokaż oryginał" — `SPF: PASS`,
> `DKIM: PASS`. Powtórz dla `mateusz@` i `contact@`.
>
> **Plan B, jeśli SMTP odrzuci/przepisze alias:** wysyłaj wszystko jako
> `info@` (to i tak adres główny — patrz decyzja w §7.5; odpowiedź z `info@`
> na mail przysłany na `kontakt@` jest w praktyce normalna), a aliasy
> traktuj jako adresy „tylko-odbiorcze". Gdyby wysyłka z aliasów okazała się
> jednak konieczna, rozwiązaniem jest osobny przekaźnik SMTP (wariant (a) z
> §7.5 — Brevo) skonfigurowany w Outlooku/Gmailu tylko do wysyłki.
>
> **✅ WYNIK TESTU (2026-07-04):** SMTP OVH **akceptuje** alias w polu From
> (koperta/Return-Path też przepisana na alias; SPF PASS, DMARC PASS przez
> zgodność SPF) — wysyłka z aliasów działa. **Ale maile z aliasem w From
> nie są podpisywane DKIM-em** (OVH podpisuje tylko przy From = adres
> zalogowanego konta) → słabsze uwierzytelnienie i większa szansa na spam,
> zwłaszcza póki domena jest świeża. Rekomendacja: korespondencję wychodzącą
> prowadź z `info@` (komplet SPF+DKIM+DMARC); aliasów do wysyłki używaj
> świadomie, np. przy odpowiedziach.
>
> **Uwaga — Outlook na Macu** nie pozwala wpisać dowolnego adresu w polu
> „From" (tylko wybór spośród skonfigurowanych kont; wolne pole „Other
> email address" ma klasyczny Outlook na Windows). Obejście: dodaj alias
> jako „osobne konto" IMAP — adres `kontakt@hadrianm.pl`, ale **Username =
> `info@hadrianm.pl`** (te same serwery/hasło); w polu Full name wpisz
> imię i nazwisko, nie adres. Minus: ta sama skrzynka widnieje wtedy w
> Outlooku podwójnie.

---

## Krok 5 — Gmail: obsługa skrzynki z dowolnego urządzenia

> **Status: ODŁOŻONE (2026-07-04).** Na razie skrzynka jest obsługiwana w
> całości Outlookiem (Mac + telefon) z adresu `info@`; odpowiedź z `info@`
> na mail przysłany na alias jest OK. Kompletna, samodzielna instrukcja
> tego kroku (odbiór przez przekazywanie z Zimbry — POP w Gmailu został
> wycofany — oraz „Wyślij jako" dla 4 adresów) została wydzielona do
> **[gmail_alias_setup.md](./gmail_alias_setup.md)** — do wykonania w
> wolnej chwili, niczego wcześniej nie psuje.

---

## Krok 6 — checklista końcowa

| #   | Test                                                      | Oczekiwany wynik                                                                     |
| --- | --------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| 1   | Mail z zewnątrz na każdy z 4 adresów                      | wszystkie wpadają do skrzynki `info@` (webmail/Outlook)                              |
| 2   | `dig MX hadrianm.pl`                                      | 5 rekordów `mx0`–`mx4.mail.ovh.net`                                                  |
| 3   | Raport diagnostyczny OVH (MX/SPF/DKIM)                    | wszystko na zielono                                                                  |
| 4   | Wysyłka z Outlooka jako `info@` na Gmail                  | dochodzi, „Pokaż oryginał": SPF PASS + DKIM PASS                                     |
| 5   | Wysyłka z Outlooka jako `kontakt@`/`mateusz@`/`contact@`  | nadawca niezmieniony, SPF + DMARC PASS (DKIM **braknie** — patrz wynik testu w 4.3)  |
| 6   | _(po kroku 5)_ Gmail: nowa poczta z OVH widoczna z etykietą | tak, w kilka sekund (przekazywanie z Zimbry)                                       |
| 7   | _(po kroku 5)_ Gmail: wysyłka jako każdy z 4 adresów      | jak w teście 5 (aliasy bez DKIM; `info@` z pełnym kompletem)                         |
| 8   | _(po kroku 5)_ Outlook nadal widzi przekazane maile       | tak (Zimbra zachowuje lokalną kopię przy przekazywaniu)                              |

Po przejściu checklisty zaktualizuj status 7.5 w
[hosting_second_analysis_sveltia.md](./hosting_second_analysis_sveltia.md).

---

## Ściąga — wszystkie dane w jednym miejscu

- **Webmail:** <https://www.ovhcloud.com/pl/mail/> (login: `info@hadrianm.pl`)
- **IMAP:** `imap.mail.ovh.net:993` SSL · **POP3:** `pop.mail.ovh.net:995` SSL
  · **SMTP:** `smtp.mail.ovh.net:465` SSL (alias wszystkich trzech:
  `ssl0.ovh.net`) · login zawsze pełny adres `info@hadrianm.pl`
- **DNS (Cloudflare, wszystko DNS only):**
  - MX `@`: `1 mx0.mail.ovh.net`, `5 mx1…`, `50 mx2…`, `100 mx3…`, `200 mx4…`
  - TXT `@`: `v=spf1 include:mx.ovh.com ~all`
  - 2× CNAME `…_domainkey` — wartości z panelu OVH (zakładka DKIM)
  - TXT `_dmarc`: `v=DMARC1; p=none; rua=mailto:info@hadrianm.pl`
- **Limity:** skrzynka 15 GB; wysyłka — brak liczby w docs (⚠️ na forum OVH
  wspominany limit ~200 maili/h; przy nietypowej masowej wysyłce OVH
  potrafi zablokować konto antyspamowo)

## Źródła (oficjalne)

**OVHcloud:**
[strona domen (skrzynka w cenie)](https://www.ovhcloud.com/pl/domains/) ·
[getting started Zimbra](https://docs.ovhcloud.com/pl/guides/web-cloud/email-and-collaborative-solutions/zimbra/getting-started-zimbra) ·
[aliasy/przekierowania](https://docs.ovhcloud.com/pl/guides/web-cloud/email-and-collaborative-solutions/common-email-features/feature-redirections) ·
[serwery IMAP/POP/SMTP (Zimbra)](https://docs.ovhcloud.com/pl/guides/web-cloud/email-and-collaborative-solutions/zimbra/mail-apps) ·
[rekord MX](https://docs.ovhcloud.com/pl/guides/web-cloud/domains/dns-zone-mx) ·
[rekord SPF](https://docs.ovhcloud.com/pl/guides/web-cloud/domains/dns-zone-spf) ·
[rekord DKIM](https://docs.ovhcloud.com/pl/guides/web-cloud/domains/dns-zone-dkim) ·
[rekord DMARC](https://docs.ovhcloud.com/pl/guides/web-cloud/domains/dns-zone-dmarc) ·
[FAQ Zimbra](https://docs.ovhcloud.com/pl/guides/web-cloud/email-and-collaborative-solutions/mx-plan/faq-zimbra) ·
[przewodnik Outlook](https://docs.ovhcloud.com/pl/guides/web-cloud/email-and-collaborative-solutions/mx-plan/how-to-configure-outlook-2016) ·
[przewodnik Gmail](https://docs.ovhcloud.com/pl/guides/web-cloud/email-and-collaborative-solutions/mx-plan/how-to-configure-gmail)

**Microsoft:**
[konto w nowym Outlooku/Windows](https://support.microsoft.com/en-us/office/add-an-email-account-to-outlook-for-windows-6e27792a-9267-4aa4-8bb6-c84ef146101b) ·
[konto w Outlook dla Mac](https://support.microsoft.com/en-us/office/add-an-email-account-to-outlook-for-mac-6aeec61b-86af-40af-8ffe-985d0fc82ddb) ·
[IMAP w Outlook mobile](https://support.microsoft.com/en-us/office/how-do-i-set-up-an-imap-account-7af3289c-3a33-46ab-bf51-93f2d095455f) ·
[pole „Od" / inny adres](https://support.microsoft.com/en-us/office/open-and-use-a-shared-mailbox-in-outlook-d94a8e9e-21f1-4240-808b-de9c9c088afd) ·
[synchronizacja przez Microsoft Cloud](https://support.microsoft.com/en-us/office/sync-your-account-in-outlook-to-the-microsoft-cloud-985f9e19-d308-4e85-9d1d-0c6f32f8e981)

**Google:**
[poczta z innych kont (POP)](https://support.google.com/mail/answer/21289) ·
[wyślij jako](https://support.google.com/mail/answer/22370) ·
[„Traktuj jako alias"](https://knowledge.workspace.google.com/admin/users/should-i-uncheck-treat-as-an-alias-in-gmail) ·
[Gmailify — wspierani dostawcy](https://support.google.com/mail/answer/6304825) ·
[wytyczne nadawców (SPF/DKIM/DMARC)](https://support.google.com/mail/answer/81126)
