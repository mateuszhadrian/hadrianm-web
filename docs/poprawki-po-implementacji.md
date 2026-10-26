# Poprawki po implementacji — usterki i decyzje wyglądu z urządzeń

> **Status: AKTUALNY — lista żywa** (założona 2026-10-25 w paczce P9,
> punkt D4 `analiza-ewolucja-vs-nowsze-projekty.md` §6; wzorzec z
> projektów klienckich rodziny, §4.10 tamtej analizy). Jedno miejsce na
> wszystko, co wychodzi z testów Mateusza na fizycznych urządzeniach po
> merge'u (lista „na telefon" z Definition of Done) i z oglądania
> produkcji. Prompt korekty, który konsumuje tę tabelę:
> `sesja-utrzymaniowa-szablon.md` → „Prompt korekty".

## 1. Reguły

1. **Zbieramy, nie naprawiamy „przy okazji".** Usterka zauważona w trakcie
   paczki o innym zakresie trafia TU jako wiersz i czeka na własną sesję
   (albo własny punkt backlogu). Wyjątek: paczka, której zakres to właśnie
   naprawa pozycji z tej listy.
2. **Każda pozycja to rozwiązanie, które DZIAŁA.** Pytanie brzmi „czy tak
   ma zostać", nie „czy to błąd" — stąd obowiązkowa klasyfikacja:
   - **błąd** — zachowanie sprzeczne z zamiarem (coś nie działa, znika,
     przeskakuje). Naprawa + **test, który by go wykrył** (warstwa wg
     `.claude/rules/testing.md`); bez testu pozycja nie jest zamknięta.
     Jeśli klasa jest niewykrywalna emulacją (limit GPU, Low Power Mode,
     toolbar Safari, zimny cache), test = powtórzony scenariusz na
     urządzeniu, wpisany w kolumnie „Test".
   - **decyzja wyglądu** — działa zgodnie z zamiarem, ale może wyglądać
     inaczej. Zmiana TYLKO po potwierdzeniu Mateusza; zmiana wyglądu =
     baseline'y (oba komplety) w tym samym PR.
   - **zmiana zakresu** — nowa funkcja/zachowanie, nie korekta. Nie
     naprawiamy: nowy punkt w §6 backlogu, tu zostaje odsyłacz.
3. **PR per widok/obszar**, nie „zbiorczy PR poprawek" — łatwiej cofnąć,
   czytelniej w historii; progi LHCI i baseline'y wg `daily-workflow.md`.
4. **Zamknięcie** = status w tabeli (PR, data) + jeśli naprawa zmieniła
   zasadę pracy → wiersz w `decyzje.md` lub reguła w `.claude/rules/`.
5. Brak usterek po teście też się zapisuje (§3) — żeby za pół roku było
   wiadomo, że dana paczka BYŁA sprawdzona na urządzeniach.

Kolumny: **Objaw** (gdzie, urządzenie/przeglądarka, jak odtworzyć),
**Klasa** (błąd / decyzja wyglądu / zmiana zakresu), **Decyzja** (napraw w
sesji X / zostaw / punkt backlogu), **Status** (otwarte / do potwierdzenia /
zamknięte + PR + data), **Test** (który test by to wykrył lub „urządzenie:
scenariusz").

## 2. Otwarte i do potwierdzenia

| # | Zgłoszono | Objaw (gdzie, urządzenie) | Klasa | Decyzja | Status | Test |
| --- | --- | --- | --- | --- | --- | --- |
| PI-01 | 2026-07-18 (`visual-corrections-part1.md` §4) | Karuzela Realizacje na mobile: skala kafelków `--wk-scale` — plan przewidywał pętlę strojenia z Mateuszem na telefonie przed zamknięciem punktu | decyzja wyglądu | Wartość **1.2** jest na main od PR #48 (2026-07-20, `b9cd7a2`) i nie była zmieniana; treść karuzeli (3 realne wpisy z P5) oglądana na iPhone/Android 2026-10-22 bez uwag → traktować jako zaakceptowane, chyba że Mateusz powie inaczej | **do potwierdzenia** (jedno słowo Mateusza zamyka; przy „zmień" → `style(work): set mobile tile scale to <wartość>` + baseline'y `section-work`/`work-sheet` mobile) | wizualne `sections.spec.ts` (#work, profile mobile) — każda zmiana wartości = czerwony diff do akceptacji |
| PI-02 | 2026-07-18 (`visual-corrections-part1.md` §5) | Oferta na głównej: starty rozjaśniania akapitów 2 i 3 (`paraStarts` w `services-config.ts`) — plan przewidywał weryfikację na telefonie | decyzja wyglądu | Na main od PR #48 (`bd69cec`); testy telefoniczne P5–P8 (2026-10-22/24) nie zgłosiły uwag do czytelności intro Oferty → jak PI-01 | **do potwierdzenia** (przy „zmień" → `fix(services): tune paragraph reveal starts` + baseline'y `services.spec.ts`) | sweep `services.spec.ts` (klatki z nowym timingiem = diff) |

## 3. Rejestr testów na urządzeniach bez usterek

Zapis „sprawdzone, nic nie wyszło" — źródło: §10 analizy ewolucji.

| Data | Paczka / PR | Zakres testu | Urządzenia | Wynik |
| --- | --- | --- | --- | --- |
| 2026-10-22 | P5 (#54) — wideo realizacji, Etap 7 planu | nakładki modal/sheet z wideo, pętla bez szwu, reduce, Low Power Mode | iPhone Safari (+ LPM), Android Chrome, desktop Safari/Chrome/Firefox | bez usterek → R1 ✅ |
| 2026-10-22 | P6 (#55) — chrome i SEO | 404 PL/EN + burger, Safari w poziomie bez powiększenia tekstu, pasek `theme-color`, karta og (LinkedIn/Facebook/iMessage) | iPhone, Android, komunikatory | bez usterek |
| 2026-10-24 | P8 (#59) — jakość | U1: swipe-down sheeta bez pull-to-refresh, sheet przewinięty przewija treść; F1: fonty bez regresji FOUT przy nawigacji | Android Chrome, iPhone Safari | bez usterek (F1 zamyka też test fizyczny pkt 8 `visual-corrections-part1.md` — zimny cache + realne łącze, patrz §4) |

## 4. Zamknięte

| # | Objaw | Klasa | Jak zamknięte |
| --- | --- | --- | --- |
| PI-03 | Przejścia między stronami: przeskoki liter (FOUC) — pkt 8 `visual-corrections-part1.md`; plan wymagał testu fizycznego (zimny cache + realne łącze) | błąd | Preloady + mikro-fade na main od PR #48 (`815191e`, 2026-07-20); od P8 (F1, 2026-10-24) fonty to polskie subsety — test Mateusza na telefonie „fonty bez regresji FOUT" pokrywa scenariusz pkt 8. Test: brak automatycznego (Playwright startuje bez flagi `sessionStorage` — fade nie występuje w zrzutach; kontrakt subsetów `fonts-subset.test.ts`) |
| — | **H1** (Safari: obrys „z drewna"/„i stali" nad wypełnieniem) — w opisie D4 §6 wskazany do zasiewu „do czasu wdrożenia" | błąd | **Nie zasiany**: wdrożony na main 2026-10-21 (PR #51), potwierdzony przez Mateusza na Safari macOS; test = sweep hero `webkit-1440` (T5). Opis D4 w §6 skorygowany przy punkcie |

## 5. Zgłoszenia z sesji P9 spoza zakresu (docs)

Zauważone przy lekturze indeksu, nie naprawiane w P9 (paczka docs
o innym zakresie — reguła 1): statusy kilku dokumentów w `docs/README.md`
są nieaktualne („W TRAKCIE WDROŻENIA" / „WDROŻONE lokalnie" dla podstron,
które od lipca są na produkcji). Zapisane jako nowy punkt backlogu **D6**
(§6 analizy ewolucji), klasa „zmiana zakresu" (porządek dokumentacji).
