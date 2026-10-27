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
| PI-04 | 2026-10-26 (sesja 10, T8 — z lektury kodu, nie z urządzenia) | Progi flaky klatek hero (`FLAKY_DESKTOP_FRAMES` 0,02 na chromium-1920/webkit-1440, pixel-5 00–03 0,01; DEC-79) ustalone z obserwowanych diffów, nie z policzonego sufitu klasy wg nowej reguły `testing.md` „Pomiar w testach" (DEC-109) | zmiana zakresu | punkt backlogu **T10** (§6 analizy ewolucji): przeliczyć sufit przy następnym dotknięciu `hero.spec.ts`, nie „przy okazji" | otwarte | sweep hero `tests/visual/hero.spec.ts` — po przeliczeniu komentarz z sufitem przy progu |

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
| PI-01 | Karuzela Realizacje mobile: skala kafelków `--wk-scale` (pkt 4 `visual-corrections-part1.md`; plan przewidywał pętlę strojenia na telefonie) | decyzja wyglądu | **Zostaje 1.2** — na main od PR #48 (2026-07-20); treść karuzeli oglądana na iPhone/Android w P5–P8 bez uwag; Mateusz przyjął rekomendację 2026-10-26 (sesja 9). Cofnięcie = nowy wiersz tu + `style(work): …` + baseline'y `section-work`/`work-sheet` mobile. DEC-48 |
| PI-02 | Oferta na głównej: starty rozjaśniania akapitów 2 i 3 (`paraStarts`, pkt 5 `visual-corrections-part1.md`) | decyzja wyglądu | **Zostaje** — na main od PR #48; testy telefoniczne P5–P8 bez uwag do czytelności intro; przyjęte razem z PI-01 2026-10-26. Cofnięcie = `fix(services): tune paragraph reveal starts` + baseline'y `services.spec.ts`. DEC-48 |
| PI-03 | Przejścia między stronami: przeskoki liter (FOUC) — pkt 8 `visual-corrections-part1.md`; plan wymagał testu fizycznego (zimny cache + realne łącze) | błąd | Preloady + mikro-fade na main od PR #48 (`815191e`, 2026-07-20); od P8 (F1, 2026-10-24) fonty to polskie subsety — test Mateusza na telefonie „fonty bez regresji FOUT" pokrywa scenariusz pkt 8. Test: brak automatycznego (Playwright startuje bez flagi `sessionStorage` — fade nie występuje w zrzutach; kontrakt subsetów `fonts-subset.test.ts`) |
| — | **H1** (Safari: obrys „z drewna"/„i stali" nad wypełnieniem) — w opisie D4 §6 wskazany do zasiewu „do czasu wdrożenia" | błąd | **Nie zasiany**: wdrożony na main 2026-10-21 (PR #51), potwierdzony przez Mateusza na Safari macOS; test = sweep hero `webkit-1440` (T5). Opis D4 w §6 skorygowany przy punkcie |

## 5. Zgłoszenia z sesji P9 spoza zakresu (docs)

Zauważone przy lekturze indeksu, nie naprawiane w P9 (paczka docs
o innym zakresie — reguła 1): statusy kilku dokumentów w `docs/README.md`
są nieaktualne („W TRAKCIE WDROŻENIA" / „WDROŻONE lokalnie" dla podstron,
które od lipca są na produkcji). Zapisane jako nowy punkt backlogu **D6**
(§6 analizy ewolucji), klasa „zmiana zakresu" (porządek dokumentacji).
