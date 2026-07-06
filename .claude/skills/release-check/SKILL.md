---
name: release-check
description: Audyt przedwdrożeniowy — pełna bramka jakości + smoke na preview, zanim Mateusz wypchnie na main (main = produkcja na Cloudflare Pages). Użyj przed każdym push do main.
---

Przeprowadź audyt przedwdrożeniowy. NIE commituj i NIE pushuj — raport
kończy się propozycją treści commita dla Mateusza.

## 1. Stan repo

```!
git status --short
git log --oneline -5
```

## 2. Bramka jakości (identyczna z CI — kolejność jak w .github/workflows/ci.yml)

Uruchom po kolei; każdy błąd napraw albo zgłoś:
`pnpm format:check` → `pnpm lint` → `pnpm typecheck` → `pnpm build`.

## 3. Smoke na preview

Uruchom `pnpm preview` i sprawdź:

- `/` i `/en/` odpowiadają 200 i renderują hero (curl + screenshot);
- `robots.txt` blokuje `/admin`; `sitemap-index.xml` istnieje w dist;
- meta OG (`og-image.png`, tytuły PL/EN) obecne w HTML;
- brak odwołań do `localhost`/portów dev w dist (grep);
- jeśli zmieniano hero: `/verify-mobile` (harness `scripts/verify-hero.mjs`
  vs baseline) — obowiązkowo.

## 4. Raport

Podsumuj: wyniki bramki, wyniki smoke, ryzyka. Na końcu zaproponuj treść
commita (conventional, ze scope). Przypomnij, że po push na main deploy
robi Cloudflare Pages automatycznie i warto klik-sprawdzić produkcję
(hadrianm.pl + /admin) po ~2 min.
