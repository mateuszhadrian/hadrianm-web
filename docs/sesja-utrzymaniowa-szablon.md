# Szablon promptu sesji utrzymaniowej (hadrianm-web)

> Kopiuj całość jako pierwszą wiadomość nowej sesji Claude Code, wypełnij
> nawiasy `[...]`. Źródło punktów: `docs/analiza-ewolucja-vs-nowsze-projekty.md`
> §6 (backlog) i §7 (paczki). Wzorzec przeniesiony z projektów klienckich
> (prompty per sesja), odchudzony do trybu utrzymaniowego.

---

## Sesja: paczka [P1 „CI i panel"] — punkty [C1, C2, C3, M1, D1]

### 0. Bramka startowa (wykonaj, zanim cokolwiek zmienisz)

1. `git checkout main && git pull` — oczekiwany SHA `origin/main`:
   `[np. 3960e93]`. Inny SHA = zatrzymaj się i powiedz, co doszło.
2. `git status` ma być czysty. Jeśli nie — pokaż listę i zapytaj.
3. `gh run list -L 6` — ostatnie biegi na main zielone? Czerwone = NAJPIERW
   diagnoza osobnym małym PR-em, nie w tej paczce. Wyjątek: czerwone, które
   ta paczka ma naprawić: `[np. prod-smoke flake MIME]`.
4. Przeczytaj: `docs/README.md` (indeks statusów), §6 backlogu dla punktów
   tej sesji (w całości — instrukcje są samowystarczalne), reguły z
   `.claude/rules/`, które załadują się do edytowanych ścieżek,
   `docs/decyzje.md` (jeśli istnieje).
5. Utwórz branch `[typ/krotki-opis]` (typ = `fix/feat/chore/ci/test/docs/perf`).

### 1. Pierwsze zadanie: domknij poprzednią sesję

Poprzednia sesja: `[paczka / punkty]`, PR `[#nn]`, stan: `[zmergowany /
otwarty / porzucony]`. Fakty do wpisania: w §6 backlogu status punktów
(☐ → ✅ data, PR, ewentualna korekta pod punktem), w `docs/README.md`
status dokumentów, w `docs/poprawki-po-implementacji.md` nowe usterki
z testów Mateusza: `[lista albo „brak"]`.

### 2. Zakres tej sesji

- Punkty: `[C1 …, C2 …]` — dokładnie wg instrukcji w §6; nic „przy
  okazji". Usterkę zauważoną poza zakresem dopisz do
  `docs/poprawki-po-implementacji.md` i jedź dalej.
- Pliki, których NIE dotykasz: `src/content/realizacje/*.json`,
  `tests/visual/__screenshots__/` (bez pokazania diffu i zgody),
  `dist/`, `.astro/`, `.env*`.
- Pytania do Mateusza (odpowie w trakcie — nie czekaj z lekturą i pracą
  na części niezależnej): `[…]`.

### 3. Definition of Done

- [ ] `/test` zielone lokalnie na warstwach wynikających z diffu
      (`.claude/rules/testing.md`); jeśli zmiana wyglądu —
      `pnpm build && pnpm test:visual` i diffy POKAZANE przed regeneracją.
- [ ] Baseline'y (jeśli ruszone): kolejność kod → workflow linux →
      commit darwin NA KOŃCU (`docs/daily-workflow.md`).
- [ ] Progi LHCI nietknięte (zmiana progów = osobny PR po pomiarze na main,
      punkt L1).
- [ ] Nowa wiedza → reguła w `.claude/rules/*` lub wpis w `docs/decyzje.md`.
- [ ] Status punktów w §6 backlogu + `docs/README.md` zaktualizowane.
- [ ] Lista „na telefon / fizyczny Mac" dla Mateusza (gdy emulacja nie
      wykrywa: Low Power Mode, limit warstw GPU, zwijany toolbar Safari,
      zimny cache, dotyk): `[…]` albo „nie dotyczy".
- [ ] Propozycja treści commitów (conventional, scope, małe litery po
      dwukropku; commituje Mateusz) i tytułu PR-a.

### 4. Po merge'u (robi Mateusz, Claude przypomina)

- Prod smoke zielony? (mail z GitHuba).
- Test na urządzeniach z listy DoD; usterki → `poprawki-po-implementacji.md`,
  NIE do bieżącej gałęzi.
- Jeśli paczka zmieniła bajty strony głównej: `lhci-measure.yml` na main
  → kandydat na L1 (osobny PR).

---

## Prompt korekty (po testach Mateusza)

Lista z `docs/poprawki-po-implementacji.md`, każda pozycja sklasyfikowana:

| # | Objaw (gdzie, urządzenie) | Klasa | Decyzja |
| --- | --- | --- | --- |
| 1 | `[…]` | błąd / decyzja wyglądu / zmiana zakresu | napraw w tej sesji / zostaw / osobny punkt backlogu |

Reguły: „błąd" = naprawa + test, który by go wykrył; „decyzja wyglądu" =
tylko po potwierdzeniu Mateusza; „zmiana zakresu" = nowy punkt w §6, nie
w tej sesji.
