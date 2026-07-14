# LUMÉA — ekrany referencyjne

Referencje 3 ekranów (sama zawartość okna przeglądarki — bez chrome'u/paska URL i bez mechaniki
sekcji „Dla kogo"). Do podmiany / przepisania w prawdziwym projekcie.

## Pliki

| Plik | Widok | URL docelowy |
|------|-------|--------------|
| `lumea-home.html` / `.png` | Home / hero | `https://lumea.pl` |
| `lumea-cms.html` / `.png` | Panel edycji treści (CMS) | `https://lumea.pl/edytuj-strone` |
| `lumea-reservation.html` / `.png` | Rezerwacje + konfigurator + voucher | `https://lumea.pl/rezerwuj-wizyte` |
| `assets/lumea-recepcja.jpg` | tło ekranu **home** (zdjęcie w ramce) | — |
| `assets/lumea-silk.jpg` | tło ekranów **cms** i **reservation** (jedwab „delikatny welon") | — |

Token w nazwie (`home` / `cms` / `reservation`) = szybkie rozróżnienie widoków.

## Kadr

- Natywny rozmiar ekranu: **880 × 574 px** (tyle zajmuje wnętrze okna w prototypie „Talia kart").
- **HTML** to źródło wektorowe — ostre i edytowalne w dowolnej skali.
- **PNG** to podgląd w rozmiarze kadru (pomocniczy). Do renderu w wyższej rozdzielczości użyj HTML.

## Fonty

- Nagłówki: **Cormorant Garamond** · UI/etykiety: **Jost** — ładowane z Google Fonts w `<head>`.
- Tych fontów nie ma jeszcze w `package.json`. Dodaj je (np. `@fontsource/...`) albo podmień na fonty
  projektu (Archivo / Instrument Serif / Saira Condensed / Space Mono).

## Uwagi techniczne

- Ścieżki do assetów są względne (`assets/...`) — folder działa samodzielnie.
- CSS w plikach jest czysty (bez Tailwind) — celowo, jako czytelna referencja do przepisania na
  Tailwind v4 w Astro.
- CMS ma delikatnie migający kursor edycji (CSS `@keyframes`, wyłączany przy `prefers-reduced-motion`).
- Kolory bazowe: krem `#F7F1E9` / atrament `#2C2620` / złoto `#A9855A`.
