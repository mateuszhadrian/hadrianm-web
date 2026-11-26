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
| PI-06 | 2026-11-22 (sesja 13, przegląd C10 — z logów CI, nie z urządzenia) | Flaki maskowane retry Playwrighta (CI `retries: 1`, job zielony, P-76), po merge'u P8: **(a)** axe `color-contrast` na chromium-pixel-5 dla elementów w trakcie reveal — `.pp-sub` `/oferta/` + `/en/services/` (2026-10-24 run 40127470101), `.pp-sub` + `.ofh-desc` `/en/services/` (2026-10-27 main 40585447363), `.ch-tag` + `.ch-para` rozdziału 01 `/dla-kogo/` (2026-11-07 main 42365253325) — 3×, w tym 2× na main; stan końcowy ma kontrast AA (jak A1), skan łapie klatkę pośrednią przejścia; **(b)** `hero-functional.spec.ts:18` webkit-iphone-14 — `currentTime` bez zmian po jednym odczycie po 600 ms (0,0044 = 0,0044; 2026-11-07 42366488925 `feat/r2-scripts` dispatch); **drugie wystąpienie** 2026-11-23 PR #77 run 45248511020, NOWY profil webkit-iphone-se (0,00813778 = 0,00813778) — oba poza main, ten sam wzorzec co P-73 przed T11, ale wideo lokalne; **(c)** `work.spec.ts:82` webkit-iphone-14 — przycisk zamknięcia sheeta nie „stabilny" przez 30 s (2026-10-29 main 40845053137); **(d)** firefox-desktop `socket hang up` na `GET /` preview w `assertPreview` (2026-11-07 42344521350) | zmiana zakresu | (a) spełnia regułę „2× na main w 30 dniach" → propozycja punktu **T12** (skan axe po zakończeniu przejść reveal, bez wpisu do allowlisty — ratchet); (b) kandydat na `expect.poll` jak T11 (DEC-112); (c), (d) obserwacja do następnego C10. **Decyzja Mateusza 2026-11-22: (a) → punkt T12** (§6 analizy ewolucji) | **(a) zamknięte** 2026-11-22 — T12 (sesja 14, branch `test/a11y-after-animations`; mechanizm: skan w połowie reveal + zegar animacji stojący w trakcie analizy, P-78; skan po `waitForEntranceAnimations`, DEC-117); **(b) zamknięte** 2026-11-26 — sesja 16, branch `test/hero-video-poll-and-back-scroll` (mechanizm = P-73 także dla wideo LOKALNEGO: `paused` = false od razu, `currentTime` rusza ze startem dekodera, pod obciążeniem webkit-iphone-* później niż 600 ms; jeden odczyt → `expect.poll` per wideo `!paused && t > pierwszy odczyt`, 10 s, DEC-112 zasięg; izolacja `--repeat-each 10` × webkit-iphone-se/-14/chromium-pixel-5 = 30/30; test negatywny z zapauzowanym wideo czerwony po 10 s z komunikatem per wideo); (c), (d) otwarte — obserwacja do C10 | (a) `a11y.spec.ts` pod obciążeniem pełnego `test:e2e`; (b) `hero-functional.spec.ts`; dowód naprawy = zero `flaky` tej sygnatury w kolejnym przeglądzie C10 (§4.8 `optional-todos.md`) |
| PI-08 | 2026-11-26 (sesja 16, diagnoza PI-07 — z lektury testów, nie z urządzenia) | Testy „back button wraca …” w `about-index`, `faq-index`, `audience-index`, `work-index`, `contact-index` (`.spec.ts`) i `services-subpages.spec.ts` klikają `a[data-back]` zaraz po `expect.poll` na `pathname` (bez czekania na DCL — ten sam wyścig co PI-07, P-80) i sprawdzają TYLKO adres powrotu. Fallback `href` strzałki prowadzi zwykle na ten sam adres, więc test jest zielony także wtedy, gdy `history.back()` w ogóle nie zadziałał (fałszywa zieleń, nie flake); w wariancie huba `/oferta/` fallback może prowadzić gdzie indziej niż oczekiwany hub → potencjalny czerwony pod obciążeniem | błąd (testu) | nie naprawiane w sesji 16 (zasada „nic przy okazji”); kandydat na punkt T: wspólny helper „klik wstecz” w `tests/helpers/` (`waitForLoadState("domcontentloaded")` + asercja `back_forward`), użyty w 7 miejscach | otwarte | specy jak w objawie; dowód = asercja `back_forward` w każdym teście „wstecz” |

## 3. Rejestr testów na urządzeniach bez usterek

Zapis „sprawdzone, nic nie wyszło" — źródło: §10 analizy ewolucji.

| Data | Paczka / PR | Zakres testu | Urządzenia | Wynik |
| --- | --- | --- | --- | --- |
| 2026-10-22 | P5 (#54) — wideo realizacji, Etap 7 planu | nakładki modal/sheet z wideo, pętla bez szwu, reduce, Low Power Mode | iPhone Safari (+ LPM), Android Chrome, desktop Safari/Chrome/Firefox | bez usterek → R1 ✅ |
| 2026-10-22 | P6 (#55) — chrome i SEO | 404 PL/EN + burger, Safari w poziomie bez powiększenia tekstu, pasek `theme-color`, karta og (LinkedIn/Facebook/iMessage) | iPhone, Android, komunikatory | bez usterek |
| 2026-10-24 | P8 (#59) — jakość | U1: swipe-down sheeta bez pull-to-refresh, sheet przewinięty przewija treść; F1: fonty bez regresji FOUT przy nawigacji | Android Chrome, iPhone Safari | bez usterek (F1 zamyka też test fizyczny pkt 8 `visual-corrections-part1.md` — zimny cache + realne łącze, patrz §4) |
| 2026-11-22 | S4 (#75) — ikony z `pnpm make:icons` | ikona po „Dodaj do ekranu głównego" iOS/Android + ikona karty przeglądarki | iPhone, Android | bez usterek (Mateusz potwierdził 2026-11-22) |

## 4. Zamknięte

| # | Objaw | Klasa | Jak zamknięte |
| --- | --- | --- | --- |
| PI-01 | Karuzela Realizacje mobile: skala kafelków `--wk-scale` (pkt 4 `visual-corrections-part1.md`; plan przewidywał pętlę strojenia na telefonie) | decyzja wyglądu | **Zostaje 1.2** — na main od PR #48 (2026-07-20); treść karuzeli oglądana na iPhone/Android w P5–P8 bez uwag; Mateusz przyjął rekomendację 2026-10-26 (sesja 9). Cofnięcie = nowy wiersz tu + `style(work): …` + baseline'y `section-work`/`work-sheet` mobile. DEC-48 |
| PI-02 | Oferta na głównej: starty rozjaśniania akapitów 2 i 3 (`paraStarts`, pkt 5 `visual-corrections-part1.md`) | decyzja wyglądu | **Zostaje** — na main od PR #48; testy telefoniczne P5–P8 bez uwag do czytelności intro; przyjęte razem z PI-01 2026-10-26. Cofnięcie = `fix(services): tune paragraph reveal starts` + baseline'y `services.spec.ts`. DEC-48 |
| PI-03 | Przejścia między stronami: przeskoki liter (FOUC) — pkt 8 `visual-corrections-part1.md`; plan wymagał testu fizycznego (zimny cache + realne łącze) | błąd | Preloady + mikro-fade na main od PR #48 (`815191e`, 2026-07-20); od P8 (F1, 2026-10-24) fonty to polskie subsety — test Mateusza na telefonie „fonty bez regresji FOUT" pokrywa scenariusz pkt 8. Test: brak automatycznego (Playwright startuje bez flagi `sessionStorage` — fade nie występuje w zrzutach; kontrakt subsetów `fonts-subset.test.ts`) |
| PI-05 | Polityka prywatności (`/polityka-prywatnosci/`, `/en/privacy-policy/`), mobile: adres e-mail administratora wstawiany skryptem po pierwszym malowaniu zawijał akapit sekcji 01 o jedną linię (+26,34 px) i przesuwał 8 sekcji niżej — CLS 0,027 (próg 0,005); wykryte NIE na urządzeniu, lecz przez trasę-sensor LHCI (L2, PR #70, run 42344521350, 2026-11-07); lokalnie `lhci` raz 0, raz 0,0270 (timing skryptu vs pierwsze malowanie) | błąd | **Naprawione** 2026-11-07 (branch `fix/privacy-mail-cls`): hoistowany `<script>` → `<script is:inline>` tuż za treścią (wykonuje się synchronicznie w parserze, przed pierwszym malowaniem); kontrola: `lhci collect --settings.throttling.cpuSlowdownMultiplier=4` → CLS 0,0000 na obu trasach, `policy.spec` i `test:dist` zielone. Test, który by to wykrył: sensor L2 (`cumulative-layout-shift` ≤ 0,005 na `/polityka-prywatnosci/` w job `lighthouse`) — mechanizm w P-74, reguła DEC-114 (`layout-seo.md`) |
| PI-07 | `tests/e2e/policy.spec.ts` chromium-1920 („strzałka wstecz wraca na stronę główną w zapamiętane miejsce”): po kliku strzałki z polityki `window.scrollY` = 0 przez cały poll 5 s (sesja 14: pełne e2e 1/2, izolacja 3/20; sesja 16: pełne e2e 1/1 czerwone, izolacja 20/20 zielone, pod obciążeniem `--workers 14` 1/26 czerwone w sondzie); w CI nie wystąpił. Test ręczny Mateusza 2026-11-26 na produkcji (desktop, 3× Chrome, 3× Safari, raz przyciskiem przeglądarki): za każdym razem powrót na dół strony głównej | błąd (testu — wyścig, nie przywracanie scrolla) | **Naprawione** 2026-11-26 (sesja 16, branch `test/hero-video-poll-and-back-scroll`, commit `test(e2e)`; `src/` nietknięte). Mechanizm (sonda w przeglądarce, DEC-108): `toHaveURL` = commit nawigacji; pod obciążeniem test klikał strzałkę, zanim moduł BaseLayoutu podpiął `initBackLinks` (do DCL strzałka to zwykły link `href="/"` — zamierzony fallback) → nowa nawigacja `navigate` na górę zamiast `history.back()`. Wykluczone hipotezy: (a) przycięcie natywnego przywracania przez niepełną wysokość — przywrócenie zdąża przed DCL przy pełnej `scrollHeight` 20704; (b) `ScrollTrigger.refresh()`/start Lenisa zerujący pozycję — refresh robi `scrollTo(0,0)` → pomiar → `scrollTo(0, zapisana)` i wraca do 19624; (c) bfcache + handler `pageshow persisted` — Chromium Playwrighta nie używa tu bfcache (`persisted` false). Desync Lenisa po natywnym scrollu Playwrighta (Lenis `scroll` 0 przy `scrollY` 19624 tuż przed klikiem) jest prawdziwy, ale bez wpływu (pełne przeładowanie). Poprawka: `waitForLoadState("domcontentloaded")` przed klikiem (stan, w którym klika użytkownik) + asercja `back_forward` po powrocie (fallback nazwany wprost zamiast `scrollY` 0). Reprodukcja deterministyczna: `page.route` opóźniający `/_astro/*.js` polityki o 1,5 s → bez czekania 5/5 `navigate`/0, z czekaniem 5/5 `back_forward`/19624. Weryfikacja: `policy.spec.ts` ×10 = 80/80, pełne `test:e2e` 683 passed / 0 failed (6,2 min; przed poprawką ten sam bieg: 682 + ten test czerwony). P-80; reguła w `testing.md` „Zasady twarde”. Siostrzane testy „wstecz” → PI-08 |
| — | **H1** (Safari: obrys „z drewna"/„i stali" nad wypełnieniem) — w opisie D4 §6 wskazany do zasiewu „do czasu wdrożenia" | błąd | **Nie zasiany**: wdrożony na main 2026-10-21 (PR #51), potwierdzony przez Mateusza na Safari macOS; test = sweep hero `webkit-1440` (T5). Opis D4 w §6 skorygowany przy punkcie |

## 5. Zgłoszenia z sesji P9 spoza zakresu (docs)

Zauważone przy lekturze indeksu, nie naprawiane w P9 (paczka docs
o innym zakresie — reguła 1): statusy kilku dokumentów w `docs/README.md`
są nieaktualne („W TRAKCIE WDROŻENIA" / „WDROŻONE lokalnie" dla podstron,
które od lipca są na produkcji). Zapisane jako nowy punkt backlogu **D6**
(§6 analizy ewolucji), klasa „zmiana zakresu" (porządek dokumentacji).
