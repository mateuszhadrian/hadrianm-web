# Podmiana ekranów LUMÉA w sekcji „Dla kogo" — plan wykonawczy

Status: **AKTUALNY** (wdrażany 2026-07-14). Kontekst wcześniejszy:
`analiza-sekcja-dla-kogo.md` (architektura `audience-*`, design „Talia kart").

## Cel

Podmiana **tymczasowych ciemnych placeholderów** (ręcznie kodowane mocki
`wow`/`cms`/`tools`, tło `#0b0709`, akcent czerwony `#FF5A47`) na **finalne
jasne ekrany LUMÉA** z `docs/design/lumea-ekrany-referencyjne/` — na desktop
i mobile — oraz zmiana zachowania animacji na mobile.

Referencje: trzy samodzielne ekrany HTML `880×574` (kremowe `#F7F1E9`,
atrament `#2C2620`, złoto `#A9855A`), **każdy osadza prawdziwe zdjęcie**
(`assets/lumea-recepcja.jpg` / `lumea-silk.jpg`) — dlatego nie są czystym CSS.

## Decyzje (zatwierdzone 2026-07-14)

1. **Renderowanie desktop + mobile = wypieczony obraz.** Referencje osadzają
   zdjęcia → renderujemy je raz do WebP i używamy `<Image>` na obu widokach.
   `AudienceMockWindow.astro` upraszcza się z ~620 linii inline-mocków do
   cienkiej ramki okna z obrazem. Konsekwencja: znikają żywe mikroanimacje
   mocków (marquee, migający kursor) — akceptowalne (referencje są statyczne).
2. **Ramka „przeglądarki" (chrome) zostaje**, ale w jasnym stylu LUMÉA
   (sygnał „to strona WWW"). Chrome to DOM-owy wrapper (wektor, ostry) — obraz
   to samo wnętrze okna (kadr `880×574`, bez chrome'u, jak w referencji).
3. **Otoczenie sceny desktop pozostaje ciemne** (widmowa typografia, „talia
   rewersów" `.dk-back`, ambient) — jasne ekrany wyskakują jako karty na
   ciemnej scenie.
4. **Tło karty/okna = `#f7f1e8`** (tło ekranu home). Czerwona poświata w cieniu
   (`rgba(255,90,71,0.16)`) **usunięta** → neutralny miękki cień.
5. **Mapowanie:** 01 „Efekt WOW" → **home**, 02 „Niezależność/CMS" → **cms**,
   03 „Automatyzacja/zysk" → **reservation**.
6. **Mobile — nowa animacja (bez blura).** Nie generujemy wariantów `-blur`;
   crossfade „wyostrzania z mgły" USUNIĘTY (zero `filter` w runtime, zgodnie
   z twardą zasadą „NIGDY nie animować filter na mobile"). Zamiast tego okno
   **wjeżdża do viewportu**: ekran 1 z lewej, 2 z prawej, 3 z lewej
   (`ch1 ujemny x, ch2 dodatni, ch3 ujemny`), z subtelnym fade, dystans
   ~40–56 px, `once: true`. Tekst rozdziału zostaje na obecnym fade-in-up.
7. **Generacja obrazów:** Playwright, kadr `880×574` @2× (`1760×1148`), WebP,
   **oryginalne fonty referencji** (Cormorant Garamond + Jost — wypieczone
   w obraz, więc nie trafiają do `package.json`). `reducedMotion: reduce`
   (kursor edycji zamrożony na widocznym). Skrypt **committowany**
   (`scripts/capture-audience-screens.mjs`) — odtwarzalne z HTML.

## Etapy

0. Ten plan (docs-first) + wpis w `docs/README.md`.
1. `scripts/capture-audience-screens.mjs` → `src/assets/audience/ekran-{home,
   cms,reservation}.webp`. Usunąć stare `ekran-{wow,cms,tools}{,-blur}.webp`.
2. `AudienceMockWindow.astro`: jasny chrome + `<Image>` w `.mk-body`; `props`
   = `{ screen, alt, label }`. Usunąć kind-canvasy, marquee, kursor, `fitMocks`.
3. `Audience.astro`: import nowych obrazów; mobile `.dkm-win` = jeden obraz
   (bez `.lay-blur`); tło `#f7f1e8`, neutralny cień; ciemne otoczenie bez zmian.
4. `audience-scroll.ts`: `buildMobile` — wjazd L/R/L zamiast crossfade;
   usunąć `fitMocks`/`ResizeObserver` (brak kanwy `880` do skalowania).
   Desktop timeline bez zmian (karty to teraz obrazy; blur na scenie desktop
   zostaje — to nie mobile).

## Testy / baseline'y

- `pnpm build && pnpm test:visual` → `audience.spec.ts` (sweep 3 profile) +
  `sections.spec.ts`. Zmiana WYGLĄDU = spodziewany czerwony sweep.
- **Baseline'y regenerujemy dopiero po pokazaniu diffu Mateuszowi i zgodzie**
  (twarda zasada): darwin lokalnie `pnpm test:visual:update`, linux przez
  workflow `update-visual-baselines.yml` — oba komplety w jednym PR.
- `pnpm test:e2e` (a11y/nawigacja sekcji) + `pnpm test:unit` (kontrakt
  `audience-config`).
