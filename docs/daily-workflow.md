# Daily workflow — codzienny proces pracy nad hadrianm-web

> **Status:** AKTUALNY — instrukcja operacyjna (2026-07-09).
> Main jest chroniony (required checks: `quality`, `e2e`, `lighthouse`);
> main = produkcja (Cloudflare Pages deployuje każdy merge automatycznie).
> Tło i szczegóły systemu testów: `testing-tools-and-environemnts-setup-analysis.md`
> + reguła `.claude/rules/testing.md`.

## ⚡ Ściąga (to wystarczy w 90% przypadków)

```bash
# START — zawsze ze świeżego maina
git checkout main && git pull
git checkout -b fix/krotki-opis        # typ: fix/ feat/ chore/ perf/ docs/

# … praca (sam lub z Claude'em) …

# SPRAWDŹ LOKALNIE (w Claude Code):
#   /test          ← dobiera i odpala tylko potrzebne warstwy testów

# WYŚLIJ
git add -A
git commit -m "fix(hero): opis zmiany"  # conventional commit ze scope
git push -u origin fix/krotki-opis

# GITHUB
#   Compare & pull request → Create pull request
#   poczekaj na 3 zielone checki → Merge pull request → Delete branch

# SPRZĄTANIE
git checkout main && git pull
git branch -d fix/krotki-opis

# KONIEC — deploy i weryfikacja produkcji dzieją się SAME.
#   (zerknij tylko, czy nie przyszedł mail o czerwonym „Prod smoke")
```

---

## Krok po kroku — co się dzieje i dlaczego

### 1. Feature branch (nigdy praca wprost na main)

Bezpośredni push na main zostanie odrzucony przez branch protection.
Gałąź nazywaj `typ/krotki-opis` (np. `fix/hero-progress-bar`,
`feat/nowa-sekcja`, `chore/deps-bump`) — ten sam typ trafi potem do
commitów.

W trakcie pracy z Claude'em działają automaty:

- hook `remind-tests.sh` podpowiada, jaką warstwą testów zweryfikować
  edytowany plik,
- hook Stop sam odpala `typecheck` + `test:unit` po każdej turze ze
  zmianami w `.ts`/`.astro` — czerwone blokuje zakończenie tury.

### 2. `/test` — weryfikacja lokalna przed pushem

Skill czyta `git diff`, mapuje zmienione ścieżki na warstwy
(`.claude/rules/testing.md`) i odpala tylko to, co trzeba:

| Zmieniłeś…                              | Poleci…                            |
| --------------------------------------- | ---------------------------------- |
| hero (`src/components/sections/hero/`)  | unit + visual (skill `/verify-mobile`) |
| i18n, `img.ts`, schema CMS              | unit                               |
| navbar, overlaye, Work, `src/scripts/`  | e2e                                |
| layout, style globalne                  | visual                             |
| coś przekrojowego / nie wiadomo         | pełne `pnpm test`                  |

Krok opcjonalny (CI i tak wszystko sprawdzi), ale lokalnie masz wynik
w 1–3 min zamiast czekać na runner. Przed release'em na koniec dnia:
`/release-check` (pełna bramka + checklista urządzeń fizycznych).

### 3. Commit + push + PR

Commit po angielsku, conventional ze scope: `fix(hero): …`,
`feat(work): …`, `docs(testing): …`. Po pushu GitHub pokaże banner
**Compare & pull request** — klik, **Create pull request**.

### 4. Trzy checki bramkują merge

Odpalają się same przy otwarciu PR-a i po każdym kolejnym pushu:

| Check        | Czas    | Co łapie                                                        |
| ------------ | ------- | --------------------------------------------------------------- |
| `quality`    | ~1 min  | format, lint, typy, testy jednostkowe, build                     |
| `e2e`        | ~4 min  | 102 testy funkcjonalne (nawigacja/modale/i18n/a11y/SEO) + pixel-diff vs baseline'y |
| `lighthouse` | ~3 min  | budżety wydajności (LCP/TBT/CLS/wagi) — progi ratchet            |

Przycisk **Merge** odblokowuje się dopiero przy 3 zielonych.
Czerwony check → poprawka → `git push` → checki liczą się od nowa.

### 5. Merge = deploy (automatycznie)

Po merge'u NIE robisz nic:

- **Cloudflare Pages** buduje i publikuje `https://hadrianm.pl` (~1–2 min),
- **CI** przebiega kontrolnie jeszcze raz na main,
- **Prod smoke** czeka, aż produkcja zacznie serwować świeży build
  (porównuje hash assetu), i odpala testy `@prod-smoke` przeciwko żywej
  stronie na 6 profilach.

Czerwony `Prod smoke` = mail z GitHuba w kilka minut po zepsutym
deployu. Zielony = zmiana jest na produkcji i zweryfikowana.

---

## Przypadki specjalne

### Celowa zmiana wyglądu (czerwone testy wizualne)

1. Obejrzyj diffy (`test-results/**/…-diff.png` albo
   `pnpm exec playwright show-report`) — upewnij się, że różnice to
   dokładnie to, co zamierzałeś.
2. Lokalnie: `pnpm test:visual:update` → nowe baseline'y `*-darwin.png`
   (commit na gałąź PR-a).
3. Linux: Actions → **Update linux visual baselines** → Run workflow
   → **wybierz gałąź PR-a** (nigdy main!) → bot dopisze commit
   `chore(test): update linux visual baselines` → `git pull` na gałęzi.
4. Oba komplety + kod jadą w JEDNYM PR; diffy obrazków widać w
   zakładce Files changed.

⚠️ Nigdy nie aktualizuj baseline'ów po to, żeby „naprawić" czerwony
test bez obejrzenia diffu — od łapania regresji one tu są.

### Czerwony check — szybka diagnoza

- `e2e`/wizualne: artefakt `playwright-report` w przebiegu → raport HTML
  z diffami. Klatki hero desktop 05–09 bywają flaky (znany szum) —
  porównaj z przebiegiem kontrolnym zanim uznasz regresję.
- `lighthouse`: log joba pokazuje, która metryka przebiła próg; progi to
  ratchet — podnosimy je tylko świadomą decyzją, osobnym commitem.
- Wszystko padło na `apt-get`/instalacji przeglądarek: infra GitHuba,
  nie Twój kod → **Re-run failed jobs**.

### Nowa realizacja (CMS)

Wpis robi się w panelu `/admin` (Sveltia commituje na main przez
GitHub API — z pominięciem PR; to jedyny legalny wyjątek). Potem:
`git pull` + `pnpm test:unit` (kontrakt CMS). Pełen pipeline: skill
`/new-realizacja`.

### Hotfix produkcji

Ten sam proces — tylko szybciej: mała gałąź, mały diff, `/test`, PR,
merge. Ochrona maina działa zawsze; przy realnym pożarze admin może
zmergować mimo czerwonych checków (przycisk „Merge without waiting…"),
ale to świadoma decyzja — domyślnie NIE.
