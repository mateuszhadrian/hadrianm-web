---
name: new-realizacja
description: Pipeline dodania nowej realizacji do portfolio — przygotowanie zdjęć pod R2, wpis w panelu Sveltia, walidacja i weryfikacja na stronie. Użyj gdy Mateusz chce dodać/zmienić projekt w sekcji Realizacje.
argument-hint: "[nazwa-projektu]"
---

Prowadzisz proces dodania realizacji „$ARGUMENTS" (jeśli brak nazwy — zapytaj).

## 1. Zbierz materiały

Potrzebne per ekran (min. 1 ekran, typowo: home/gallery/order):
zrzut desktop + zrzut mobile. Plus: nazwa, rok, kategoria PL/EN, blurb
PL/EN, intro PL/EN, max 3 tagi na język, wyniki (metric+label), cytat
klienta (autor, rola PL/EN), zakres prac PL/EN, opcjonalnie liveUrl.

## 2. Przygotuj zdjęcia (lokalnie, PRZED uploadem)

- Ujednolić format do WebP/wysokiej jakości JPEG; sensowne wymiary źródła:
  desktop ~1920 px szer., mobile ~800 px szer. (serving robi Cloudflare
  Image Transformations przez `imgAt()` — do R2 idzie JEDEN oryginał).
- Do konwersji użyj `sharp` przez node (wzorce w `scripts/optimize-*.mjs`).
- Pliki wynikowe zostaw w katalogu wskazanym przez Mateusza (NIE w repo).

## 3. Wpis w panelu — robi Mateusz, Ty pilnujesz zasad

Przypomnij checklistę (sam NIE edytuj JSON-ów — pisze je Sveltia):

- panel: https://hadrianm.pl/admin (login przez GitHub);
- zdjęcia wgrywać WYŁĄCZNIE przez pola Image (upload przez bibliotekę
  Assets NIE trafia do R2!);
- slug małymi literami, bez spacji (idzie do URL i nazwy pliku);
- „Kolejność": mniejsze = wyżej na liście.

## 4. Po zapisaniu wpisu (Sveltia commituje na main)

```!
git log --oneline -3
```

- `git pull`, potem `pnpm test:unit` — kontrakt CMS zwaliduje nowy JSON
  schemą Zod w ~2 s (czytelny raport błędów); potem `pnpm build`.
  Błędy schematu wyjaśnij i wskaż pole do poprawy W PANELU.
- Media w R2 sprawdzi
  `CHECK_REMOTE_MEDIA=1 pnpm exec vitest run tests/unit/media-r2.test.ts`.
- Sprawdź na dev/preview: kafelek na liście, modal desktop, bottom sheet
  mobile (PL i EN).
- Przy USUWANIU realizacji przypomnij: Sveltia nie kasuje plików z R2 —
  osierocone obrazy sprząta się ręcznie w dashboardzie R2.
