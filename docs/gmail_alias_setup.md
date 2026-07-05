# Gmail jako dodatkowy dostęp do `info@hadrianm.pl` + wysyłka z aliasów

> Wydzielony, **odłożony na później** Krok 5 z
> [mailbox_setup.md](./mailbox_setup.md). Cel: obsługa skrzynki
> `info@hadrianm.pl` z prywatnego Gmaila (`tenhadrian` / konto
> `mateuszhadrian.mh@gmail.com`) na dowolnym urządzeniu + możliwość wysyłki
> z aliasów (`mateusz@`, `contact@`, `kontakt@`). Instrukcja jest
> samodzielna — można ją wykonać w dowolnym momencie, niczego wcześniej nie
> psując.

## Stan wyjściowy (co już działa — 2026-07-04)

- Skrzynka **OVH Zimbra Starter 15 GiB**: konto `info@hadrianm.pl` +
  aliasy `mateusz@`, `contact@`, `kontakt@` (wszystko wpada do jednej
  skrzynki). DNS (MX/SPF/DKIM/DMARC) skonfigurowany i przetestowany —
  SPF+DKIM+DMARC PASS przy wysyłce z `info@`.
- **Outlook (Mac + telefon)** podpięty przez IMAP
  (`imap.mail.ovh.net:993` / `smtp.mail.ovh.net:465`, SSL, login
  `info@hadrianm.pl`) — odbiór i wysyłka z `info@` działają.
- **Decyzja robocza:** korespondencja wychodzi z `info@`; jeśli ktoś napisze
  na alias, odpowiedź z `info@` jest w porządku. Aliasy = odbiorcze.
- Webmail: <https://webmail.mail.ovh.net/> (login `info@hadrianm.pl`).

## Ważne zastrzeżenia (zanim zaczniesz)

1. **Google wycofał POP i Gmailify (2026).** Dawna funkcja „Sprawdzaj
   pocztę z innych kont" nie jest dostępna dla nowych konfiguracji (od
   końca I kw. 2026; istniejące działają do stycznia 2027) — oficjalny
   komunikat:
   [Learn about upcoming changes to Gmailify & POP in Gmail](https://support.google.com/mail/answer/16604719).
   Dlatego odbiór robimy **przekazywaniem po stronie Zimbry** (część A) —
   to zresztą rozwiązanie oficjalnie zalecane przez Google i szybsze
   (sekundy zamiast ~godzinnego cyklu POP). **„Wyślij jako" (część B) NIE
   jest objęte wycofaniem.**
2. **Wysyłka z aliasu = bez DKIM.** Przetestowane (2026-07-04): SMTP OVH
   akceptuje alias w polu From (SPF + DMARC PASS, adres nieprzepisany),
   ale podpis DKIM dokłada tylko przy From = `info@`. Skutek: maile z
   aliasów mają odrobinę słabsze uwierzytelnienie — do zwykłej
   korespondencji preferuj `info@`, aliasów używaj świadomie (np.
   odpowiedź z tego adresu, na który ktoś napisał).
3. **Dwie niezależne kopie.** Kopia przekazana do Gmaila i oryginał w
   skrzynce OVH nie synchronizują statusu przeczytania/folderów. Pełna
   synchronizacja = Outlook (IMAP); Gmail = podgląd zewsząd + nadajnik.
   Wysłane z Gmaila zostają w „Wysłanych" Gmaila (nie trafiają do folderu
   Sent na OVH) — analogicznie Outlook trzyma swoje.

## Część A — odbiór: przekazywanie kopii z Zimbry do Gmaila

1. Zaloguj się do webmaila (<https://webmail.mail.ovh.net/>) jako
   `info@hadrianm.pl`.
2. Wejdź w **Ustawienia/Preferencje → Poczta → sekcja odbierania
   wiadomości** (w klasycznym widoku Zimbry: _Preferences → Mail →
   Receiving Messages_).
3. W polu **„Przekaż kopię do" / „Forward a copy to"** wpisz
   `mateuszhadrian.mh@gmail.com` i upewnij się, że usuwanie lokalnej kopii
   jest **WYŁĄCZONE** (_„Don't keep a local copy" odznaczone_) — inaczej
   poczta przestanie zostawać w skrzynce OVH i Outlook nic nie zobaczy.
   Zapisz.
   - Alternatywnie to samo przez filtr: _Filtry → nowa reguła → akcje
     „Przekaż do" + „Zachowaj w skrzynce odbiorczej"_.
4. **Test:** wyślij mail z zewnątrz na dowolny z 4 adresów — ma pojawić
   się i w skrzynce OVH (webmail/Outlook), i w Gmailu, w kilka–kilkanaście
   sekund.
5. **Filtr antyspamowy w Gmailu** (ważne przy forwardingu — SPF liczy się
   wtedy od forwardera i Gmail bywa podejrzliwy): ⚙ → **Zobacz wszystkie
   ustawienia → Filtry i zablokowane adresy → Utwórz nowy filtr** → pole
   **Do:**
   `info@hadrianm.pl OR mateusz@hadrianm.pl OR contact@hadrianm.pl OR kontakt@hadrianm.pl`
   → **Utwórz filtr** → zaznacz **„Nigdy nie wysyłaj do spamu"** +
   **„Zastosuj etykietę"** (utwórz np. `hadrianm.pl`).

## Część B — wysyłka: „Wyślij jako" (4 adresy)

Oficjalny opis Google:
[Send emails from a different address or alias](https://support.google.com/mail/answer/22370)
(limit: do 99 adresów). Dla **każdego** z adresów `info@`, `mateusz@`,
`contact@`, `kontakt@` powtórz:

1. Gmail (komputer) → ⚙ → **Zobacz wszystkie ustawienia → Konta i
   importowanie → sekcja „Wyślij jako" → Dodaj inny adres e-mail**.
2. Nazwa: `Mateusz Hadrian`, adres: np. `kontakt@hadrianm.pl`. Zostaw
   zaznaczone **„Traktuj jako alias"** (to Twój adres wpadający do tej
   samej skrzynki — scenariusz, dla którego Google każe zostawić ptaszek;
   [wyjaśnienie](https://knowledge.workspace.google.com/admin/users/should-i-uncheck-treat-as-an-alias-in-gmail)).
3. Serwer SMTP: `smtp.mail.ovh.net` (lub `ssl0.ovh.net`), port **465
   (SSL)** — dopuszczalny też 587 (TLS). **Login zawsze
   `info@hadrianm.pl`** (konto główne, nie alias!), hasło skrzynki OVH.
4. Gmail wyśle **link weryfikacyjny na dodawany adres** — aliasy wpadają
   do skrzynki `info@`, więc link znajdziesz w webmailu/Outlooku, a po
   włączeniu części A — także w samym Gmailu. Kliknij go.
5. Po dodaniu wszystkich czterech, w sekcji „Wyślij jako":
   - przy `info@hadrianm.pl` kliknij **„Ustaw jako domyślny"**,
   - poniżej listy zaznacz **„Odpowiedz z adresu, na który wysłano
     wiadomość"** — odpowiedź pójdzie automatycznie z aliasu, na który
     ktoś napisał.

## Część C — aplikacja mobilna Gmail

Adresy „Wyślij jako" konfiguruje się tylko na komputerze, ale po
skonfigurowaniu aplikacja Gmail (Android/iOS) podpowiada je sama: w nowej
wiadomości stuknij pole **Od** i wybierz adres. (Zachowanie powszechnie
potwierdzone, choć nieopisane w oficjalnym artykule Google.)

## Checklista końcowa

| #   | Test                                             | Oczekiwany wynik                                              |
| --- | ------------------------------------------------ | ------------------------------------------------------------- |
| 1   | Mail z zewnątrz na dowolny z 4 adresów           | widoczny w OVH (Outlook/webmail) **i** w Gmailu w sekundach   |
| 2   | Przekazany mail w Gmailu                         | etykieta `hadrianm.pl`, nie w spamie                          |
| 3   | Wysyłka z Gmaila jako `info@` → test na inną skrzynkę | „Pokaż oryginał": SPF PASS + DKIM PASS + DMARC PASS      |
| 4   | Wysyłka z Gmaila jako alias                      | nadawca niezmieniony, SPF + DMARC PASS (DKIM braknie — OK)    |
| 5   | Odpowiedź w Gmailu na mail przysłany na alias    | „Od" automatycznie = ten alias                                |
| 6   | Outlook po wszystkim                             | nadal widzi całą pocztę (Zimbra zachowuje lokalną kopię)      |

## Źródła (oficjalne)

- [Google — wycofanie Gmailify i POP](https://support.google.com/mail/answer/16604719)
- [Google — „Wyślij jako"](https://support.google.com/mail/answer/22370)
- [Google — „Traktuj jako alias"](https://knowledge.workspace.google.com/admin/users/should-i-uncheck-treat-as-an-alias-in-gmail)
- [Google — wytyczne nadawców (SPF/DKIM/DMARC)](https://support.google.com/mail/answer/81126)
- [OVH — przewodnik Gmail (uwaga: opisuje wycofany POP)](https://docs.ovhcloud.com/pl/guides/web-cloud/email-and-collaborative-solutions/mx-plan/how-to-configure-gmail)
- [OVH — aliasy/przekierowania](https://docs.ovhcloud.com/pl/guides/web-cloud/email-and-collaborative-solutions/common-email-features/feature-redirections)