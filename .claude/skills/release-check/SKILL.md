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
`pnpm format:check` → `pnpm lint` → `pnpm typecheck` → `pnpm test:unit`
→ `pnpm build`.

## 3. Testy na preview (build z kroku 2)

- `pnpm test:e2e` — funkcjonalne + a11y + SEO/linki (webServer wstaje sam
  na 4399);
- `pnpm test:visual` — pełna siatka wizualna vs baseline (FAIL = diff do
  obejrzenia w `test-results/`; interpretacja: skill `/verify-mobile`);
- `CHECK_REMOTE_MEDIA=1 pnpm exec vitest run tests/unit/media-r2.test.ts`
  — dostępność mediów R2 (HEAD);
- brak odwołań do `localhost`/portów dev w dist (grep).

## 4. Checklista urządzeń fizycznych

Emulacja NIE wykrywa poniższych — jeśli zmiana dotyka obszaru, poproś
Mateusza o test na telefonie i wskaż, na co patrzeć:

| Obszar                                     | Kiedy test fizyczny                         |
| ------------------------------------------ | ------------------------------------------- |
| Limit warstwy GPU Androida                 | zmiany rozmiarów/transformów sceny urządzeń |
| iOS Low Power Mode                         | zmiany wideo/autoplay/LowPowerNotice        |
| Zwijany toolbar Safari (metryki viewportu) | zmiany hero-config/timeline/sticky          |
| Zimny cache + realne łącze komórkowe       | większe zmiany zasobów przed release        |
| Dotyk fizyczny (Lenis syncTouch feel)      | zmiany w smooth-scroll.ts                   |

## 5. Raport

Podsumuj: wyniki bramki, wyniki smoke, ryzyka. Na końcu zaproponuj treść
commita (conventional, ze scope). Przypomnij, że po push na main deploy
robi Cloudflare Pages automatycznie i warto klik-sprawdzić produkcję
(hadrianm.pl + /admin) po ~2 min.
