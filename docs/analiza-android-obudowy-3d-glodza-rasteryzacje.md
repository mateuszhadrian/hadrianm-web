# Hero mobile: płaskie ekrany urządzeń zamiast obudów 3D

## Cel

W wariantach **mobilnych** hero (`max-width: 760px`, Android **i** iOS) podmienić obudowy
3D laptopa i smartfona na **płaskie ekrany** — zaokrąglony prostokąt z samym wideo.
Desktop (`min-width: 761px`) z pełnym morphem 3D i żywym podglądem strony **zostaje bez
zmian**.

## Ograniczenie (dlaczego musi być naprawdę płasko)

Ciężki CSS 3D obudów (`perspective`, `transform-style: preserve-3d`, warstwy ekstruzji,
`filter: blur`, wielokrotne `box-shadow`, przeliczane co klatkę) na Androidzie zarzyna
kompozytor i **głodzi rasteryzację reszty UI w tej sekcji** — napisy (`.hero__copy`) i
pasek postępu (`.hero__progress`) wtedy mrugają/znikają. Dlatego na mobile scena musi być
**bez perspektywy, bez `preserve-3d`, bez ekstruzji, bez `blur`** — inaczej problem wraca.

## Zakres zmian

Pliki:

- `src/components/sections/hero/DeviceScene.astro` — markup + CSS sceny (główna robota).
- `src/components/sections/hero/device-scene.ts` — budowa ekstruzji/geometrii/fit; na
  mobile **nie budować warstw ekstruzji** (`.extrude__layer`).
- `src/components/sections/hero/Hero.astro` — timeline mobilny (fazy 1–3); po spłaszczeniu
  sprawdzić, że wjazd/rozsunięcie/skala nadal wyglądają OK.

Na mobile (`@media (max-width: 760px)`) zdjąć ze sceny:

- `perspective` na `.device-scene` → `none`;
- `transform-style: preserve-3d` → `flat` (`.camera`, `.device`, `.extrude`);
- warstwy ekstruzji `.extrude__layer` — nie renderować (najlepiej nie budować w
  `device-scene.ts`);
- poświaty z `filter: blur` (`.device-glow`, `.device-glow--lap`, `.device-glow--ph`) —
  usunąć lub zastąpić tanim, statycznym cieniem/gradientem bez `filter`;
- `box-shadow` z `.face` / `.laptop-base` ograniczyć do minimum (lub usunąć);
- `will-change: transform` na `.camera` / `.phone` — zbędne po spłaszczeniu.

Zachować:

- płaski, zaokrąglony ekran z wideo (`.screen` + `.screen__video`, `object-fit: cover`),
  proporcje = proporcje nagrania;
- skalowanie ekranu w fazie 3 (`--vid-scale`, dół przyklejony) — to czysty `transform:
scale`, jest tani i ma zostać;
- pozycjonowanie/wjazd laptopa i telefonu (`--sl-*`, `--apart-*`) o ile dalej działa po
  spłaszczeniu; ewentualnie dostroić, by układ (laptop wyżej, telefon niżej) został.

Opcjonalnie subtelny detal (jeśli pasuje wizualnie i jest tani): jeden miękki cień lub
delikatna ramka/bezel — bez 3D i bez `blur`.

## Kryteria akceptacji

- Android (realne urządzenie): w sekcji z wideo **napisy i pasek pojawiają się i są
  stabilne** (nie mrugają, nie znikają); ekrany grają płynnie.
- iOS: bez regresji; ekrany płaskie, wideo gra.
- Desktop: **bez zmian** (morph 3D + podgląd strony na laptopie działa jak dotąd).
- `pnpm astro check` i `pnpm build` przechodzą.

Uwaga: problem reprodukuje się **tylko na realnym Androidzie** (nie w desktop Chromium z
Android UA) — finalna weryfikacja na urządzeniu.
