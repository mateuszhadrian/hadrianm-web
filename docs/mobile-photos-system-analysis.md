# System lżejszych zdjęć na mobile w sekcji „Realizacje" — analiza

> ⚠️ **DOKUMENT HISTORYCZNY** (oznaczono 2026-07-06)
>
> Opisany tu system plików `-m` w repo został w całości zastąpiony przez **Cloudflare R2 + Image Transformations** (patrz `hosting_second_analysis_sveltia.md` §8 i `photos-management-for-cms-analysis.md`): `public/realizacje/` i skrypt `optimize-realizacje.mjs` zostały usunięte, rozmiary generowane są w locie. Nieaktualne m.in.:
>
> - Rekomendacja §5 (rozbudowa skryptu sharp o generowanie `-m`) — porzucona.
> - Szerokość wariantu mobile **300 px** → wdrożony helper `imgAt()` (`src/lib/img.ts`) używa **320 px**.
>
> Nadal prawdziwy jest sam mechanizm wyboru wariantu przez `<picture media="(max-width: 760px)">`.
> Zachowany wyłącznie jako kontekst historyczny.

Dokument opisuje **jak działa obecny mechanizm** serwowania lżejszych
grafik na urządzeniach mobilnych w sekcji Realizacje oraz **co trzeba zrobić**,
żeby zbudować system „wrzucasz tylko wersję desktop → mniejszy wariant na mobile
generuje się automatycznie".

> TL;DR — wykrywanie mobile **nie** dzieje się w JavaScripcie ani przez
> User-Agent. Robi to sama przeglądarka przez element `<picture>` z
> `<source media="(max-width: 760px)">`. Lżejsze pliki mają sufiks `-m`
> (np. `desktop.webp` → `desktop-m.webp`). Obecnie te pliki `-m` **nie są
> generowane przez żaden zacommitowany skrypt** — powstały jednorazowo, „z ręki".
> To jest dziura, którą trzeba domknąć.

---

## 1. Dwie różne warstwy „mobile" — nie mylić ich ze sobą

W tej sekcji słowo „mobile" znaczy **dwie zupełnie różne rzeczy**. To
najczęstsze źródło nieporozumień, więc rozbijmy to na start.

### Warstwa A — „które zdjęcie" (desktop vs mobile = dwa różne zrzuty ekranu)

Każda realizacja ma dwa **osobne zrzuty ekranu prawdziwej strony klienta**:

- `desktop.webp` — zrzut **layoutu desktopowego** strony (szeroki), wyświetlany
  na obudowie **laptopa**.
- `mobile.webp` — zrzut **layoutu mobilnego** strony (wąski, pionowy),
  wyświetlany na obudowie **telefonu**.

Obie te grafiki są ładowane **zawsze**, niezależnie od tego, na jakim urządzeniu
jest odwiedzający. To komponent `WorkDeviceDuo.astro`, który rysuje laptopa i
telefon obok siebie (CSS-owe obudowy) i wkłada w ekrany te dwa zrzuty.

To **nie** ma nic wspólnego z wykrywaniem urządzenia użytkownika — to po prostu
„makieta produktowa": pokazujemy jak strona klienta wygląda na dużym i małym
ekranie.

### Warstwa B — „jak ciężkie zdjęcie" (wariant `-m` = lżejsza wersja tego samego zrzutu)

Dla **każdego** z powyższych plików istnieje dodatkowo lżejszy wariant z sufiksem
`-m` (mniejsza rozdzielczość, mniej kilobajtów):

- `desktop.webp` (pełny) ↔ `desktop-m.webp` (lekki)
- `mobile.webp` (pełny) ↔ `mobile-m.webp` (lekki)

**To jest właśnie to, o co pytasz.** Wariant `-m` jest serwowany, gdy
odwiedzający ma **mały ekran (≤760px)** — żeby nie ładować mu ciężkich grafik.
Na dużym ekranie ładuje się plik pełny.

> Podsumowując: laptop vs telefon (Warstwa A) to „co pokazujemy",
> a `-m` vs pełny (Warstwa B) to „w jakiej wadze to pokazujemy w zależności od
> ekranu widza".

---

## 2. Jak kod rozpoznaje, że użytkownik jest na mobile

Odpowiedź: **nie rozpoznaje tego w kodzie aplikacji**. Robi to przeglądarka,
natywnie, przez responsywny obrazek `<picture>`.

Plik: `src/components/sections/work/WorkDeviceDuo.astro`

```astro
---
interface Props {
  desktop: string;   // np. "/realizacje/aura/desktop.webp"
  mobile: string;    // np. "/realizacje/aura/mobile.webp"
  altDesktop: string;
  altMobile: string;
  showPhone?: boolean;
}
const { desktop, mobile, altDesktop, altMobile, showPhone = true } = Astro.props;

// Wariant mobile (≤760px): lżejsza grafika obok tej samej ścieżki, z sufiksem
// `-m` (np. desktop.webp → desktop-m.webp). Desktop dostaje oryginał.
const mobileSrc = (src: string) => src.replace(/\.webp$/, "-m.webp");
---

<!-- ekran laptopa -->
<picture class="wd__pic">
  <source media="(max-width: 760px)" srcset={mobileSrc(desktop)} />
  <img class="wd__img" src={desktop} alt={altDesktop} loading="lazy" decoding="async" />
</picture>

<!-- ekran telefonu -->
<picture class="wd__pic">
  <source media="(max-width: 760px)" srcset={mobileSrc(mobile)} />
  <img class="wd__img" src={mobile} alt={altMobile} loading="lazy" decoding="async" />
</picture>
```

### Co się tu naprawdę dzieje (mechanika `<picture>`)

1. Przeglądarka czyta `<picture>` **z góry na dół** i bierze **pierwszy**
   `<source>`, którego atrybut `media` pasuje do aktualnego viewportu.
2. `media="(max-width: 760px)"` → jeśli szerokość okna ≤ 760px, przeglądarka
   pobiera plik z `srcset`, czyli **wariant `-m`** (lekki).
3. Jeśli żaden `<source>` nie pasuje (ekran > 760px), przeglądarka spada do
   `<img src>` — czyli do **pełnego** pliku.
4. Funkcja `mobileSrc()` to zwykłe podmienienie końcówki:
   `"…/desktop.webp"` → `"…/desktop-m.webp"`. Nie ma tu żadnej detekcji
   urządzenia — tylko przepisanie ścieżki na wariant `-m`.

### Konsekwencje tego podejścia (ważne)

- ✅ **Zero JS.** Działa nawet przy wyłączonym JavaScript; decyzję podejmuje
  silnik renderujący przeglądarki jeszcze przed pobraniem obrazka. Nie ma
  „migotania" ani double-fetch.
- ✅ Decyduje **szerokość viewportu**, a nie typ urządzenia. Wąskie okno na
  desktopie też dostanie lekki wariant — i to jest OK (chcemy oszczędzać
  transfer na małych powierzchniach).
- ⚠️ **Wariant `-m` musi istnieć na dysku.** Jeśli dla danego pliku nie ma
  `…-m.webp`, przeglądarka na mobile dostanie **404** dla tego `<source>`.
  Dlatego generowanie `-m` jest krytyczne (patrz §5).
- ⚠️ Sufiks jest wnioskowany z nazwy przez `.replace(/\.webp$/, "-m.webp")` —
  **wszystko musi być `.webp`** i trzymać konwencję nazw.

---

## 3. Skąd bierze się próg 760px

`760px` to **globalny breakpoint mobile** całego layoutu tej sekcji, nie
przypadkowa liczba. Ta sama granica decyduje o:

- podmianie obrazka na `-m` (`WorkDeviceDuo.astro`),
- układzie kafelka realizacji: 2 kolumny na desktopie vs 1 kolumna na mobile
  (`WorkCard.astro`, `@media (max-width: 760px)` / `@media (min-width: 761px)`),
- tym, czy szczegóły realizacji otwierają się jako **modal** (desktop) czy
  **bottom sheet** (mobile) — patrz komentarz w `WorkDetail.astro`.

Jeśli kiedyś zmienisz ten próg, trzymaj go **spójnie** we wszystkich tych
miejscach.

---

## 4. Konwencja nazw plików (obecny stan na dysku)

Katalog: `public/realizacje/<slug>/` (sluggi: `aura`, `dab`, `sielski`).

Na każdą realizację przypadają **3 ekrany** (`home`, `gallery`, `order`), każdy w
wersji desktop-role i mobile-role, każdy w wariancie pełnym i `-m`:

| Ekran   | Desktop-role (laptop)      | Mobile-role (telefon)     |
| ------- | -------------------------- | ------------------------- |
| home    | `desktop.webp`             | `mobile.webp`             |
| gallery | `gallery-desktop.webp`     | `gallery-mobile.webp`     |
| order   | `order-desktop.webp`       | `order-mobile.webp`       |

…i do **każdego** z tych 6 plików dochodzi bliźniak z sufiksem `-m`:
`desktop-m.webp`, `mobile-m.webp`, `gallery-desktop-m.webp`, itd. Razem **12
plików** na realizację.

> Historyczny wyjątek: ekran `home` zachowuje „gołe" nazwy `desktop.webp` /
> `mobile.webp` (bez prefiksu `home-`), bo używają ich też kafelki galerii.
> Pozostałe ekrany mają prefiks `gallery-` / `order-`.

### Zaobserwowane wymiary wariantów `-m` (to jest przepis!)

Sprawdziłem realne pliki `sharp`-em — wymiary są **idealnie spójne** we
wszystkich realizacjach:

| Rola          | Plik pełny (przykł.)     | Wymiar pełny | Plik `-m`             | Wymiar `-m` |
| ------------- | ------------------------ | ------------ | --------------------- | ----------- |
| desktop-role  | `*-desktop.webp` (landsc.) | 1600×873   | `*-desktop-m.webp`    | **960×524** |
| mobile-role   | `*-mobile.webp` (portret)  | 1000×1792  | `*-mobile-m.webp`     | **300×538** |

Czyli reguła generowania jest prosta i deterministyczna:

- **grafika desktop-role (pozioma)** → skaluj do **szerokości 960px**,
- **grafika mobile-role (telefon, pionowa)** → skaluj do **szerokości 300px**.

Efekt (z commita `4ba87ab`): łączna waga sekcji na mobile spadła
**1290 KB → 502 KB (-61%)**.

---

## 5. NAJWAŻNIEJSZE: gdzie jest luka i jak zbudować auto-generację

### Stan obecny — pełne pliki są generowane skryptem, ale `-m` NIE

Skrypt `scripts/optimize-realizacje.mjs` (uruchamiany przez
`pnpm optimize:realizacje`) bierze źródłowe PNG-i z
`docs/testing-data/test-projects/` i produkuje **pełne** `.webp`:

```js
const DESKTOP = { width: 1600, quality: 72 };
const MOBILE  = { width: 1000, quality: 72 };
// …resize({ width, withoutEnlargement: true }).webp({ quality, effort: 6 })
```

**Ale ten skrypt nie tworzy w ogóle wariantów `-m`.** Pliki `-m.webp`, które są
teraz w repo, zostały dodane commitem `4ba87ab` jako **gotowe binaria** — czyli
wygenerowane jednorazowo, ad hoc, poleceniem którego nie ma w repozytorium.

**To jest właśnie dziura w obecnym „systemie":** jeśli dodasz nową realizację
przez sam skrypt `optimize:realizacje`, dostaniesz pełne pliki, ale **`-m` nie
powstaną** → na mobile posypią się 404 na `<source>`. Trzeba to zamknąć.

### Rozwiązanie: dołożyć generowanie `-m` do skryptu

Najprościej rozszerzyć `optimize-realizacje.mjs` tak, żeby **od razu po**
zapisaniu każdego pełnego pliku wypluwał też wariant `-m` według reguły z §4.
Kluczowa rzecz: szerokość `-m` zależy od **roli** grafiki (desktop-role 960,
mobile-role 300), więc trzeba ją przekazać przy każdej konwersji.

```js
// scripts/optimize-realizacje.mjs  (szkic rozszerzenia)

const DESKTOP = { width: 1600, quality: 72, mWidth: 960 }; // rola pozioma
const MOBILE  = { width: 1000, quality: 72, mWidth: 300 }; // rola telefon

async function convert(src, outPath, { width, quality, mWidth }) {
  await mkdir(dirname(outPath), { recursive: true });

  // 1) pełny wariant (jak dotąd)
  const info = await sharp(src)
    .resize({ width, withoutEnlargement: true })
    .webp({ quality, effort: 6 })
    .toFile(outPath);

  // 2) lekki wariant „-m" — z tego samego źródła, węższy
  const mOut = outPath.replace(/\.webp$/, "-m.webp");
  await sharp(src)
    .resize({ width: mWidth, withoutEnlargement: true })
    .webp({ quality, effort: 6 })
    .toFile(mOut);

  return info;
}
```

Wtedy jedno `pnpm optimize:realizacje` generuje **komplet 12 plików** na
realizację (6 pełnych + 6 `-m`), a `WorkDeviceDuo.astro` nie wymaga żadnych
zmian — bo już teraz szuka plików po sufiksie `-m`.

### Wariant docelowy: „wrzucam tylko desktop, reszta sama"

Twój cel to: *użytkownik wrzuca jedną grafikę, system sam robi resztę.* Żeby to
osiągnąć, warto rozdzielić dwie sprawy:

1. **Rola grafiki** (desktop-role vs mobile-role) — to musi być **zadeklarowane**
   (nazwą pliku, folderem albo polem w danych), bo to **dwa różne zrzuty ekranu**,
   a nie ten sam obrazek. Systemu nie da się zmusić, żeby z desktopowego zrzutu
   „zgadł" jak wygląda mobilny layout strony klienta.
2. **Waga (`-m`)** — to **da się** zrobić w 100% automatycznie, bo `-m` to tylko
   downscale tego samego pliku (reguła 960 / 300 z §4).

Zalecana architektura docelowa:

- **Źródło prawdy = pełne pliki** (albo źródłowe PNG). Autor wrzuca `desktop` i
  `mobile` (dwa zrzuty) do ustalonego katalogu / z ustaloną nazwą.
- **Krok build/pre-commit** przelatuje po katalogu `public/realizacje/`, i dla
  **każdego** `*.webp` bez sufiksu `-m` sprawdza, czy istnieje bliźniak `-m`;
  jeśli nie — generuje go (szerokość 960 dla poziomych / 300 dla pionowych;
  rolę można wykryć z nazwy `-mobile`/`-desktop` **albo** z proporcji obrazu:
  `height > width` → telefon → 300). Dzięki temu jest **idempotentnie**: wrzucasz
  nowy plik, odpalasz skrypt, brakujące `-m` się dolewają.
- Opcjonalnie spiąć to z gitem (husky `pre-commit`) albo z krokiem `astro build`,
  żeby nikt nie zapomniał odpalić ręcznie.

Alternatywa „zero build-stepu": użyć wbudowanego w Astro pipeline'u obrazów
(`astro:assets` / `<Image>` / `getImage`) i generować warianty w locie z
`import`owanych assetów zamiast trzymać ręcznie pliki `-m` w `public/`. To
eliminuje problem „brakującego `-m`", ale wymaga przeniesienia grafik z
`public/` do `src/` i przepisania `WorkDeviceDuo` na `astro:assets`. Większa
zmiana — warta rozważenia, jeśli realizacji będzie przybywać.

---

## 6. Ściąga / pułapki na przyszłość

- **Wykrywanie mobile = CSS `<picture media="(max-width:760px)">`, nie JS.**
  Widz na wąskim ekranie dostaje `-m`; na szerokim — plik pełny.
- **Sufiks `-m` jest wnioskowany z nazwy** (`.replace(/\.webp$/, "-m.webp")`).
  Wszystko musi być `.webp` i trzymać konwencję; inaczej `mobileSrc()` wskaże w
  próżnię.
- **Każdy pełny plik MUSI mieć bliźniaka `-m`**, inaczej 404 na mobile. Dziś nie
  pilnuje tego żaden skrypt — to trzeba dodać (§5).
- **Reguła wymiarów `-m`:** desktop-role → 960px szerokości, mobile-role → 300px
  (quality 72, effort 6). Wagowo daje to ~-60% na sekcji.
- **760px trzymaj spójnie** — ten sam próg rządzi też layoutem kafelka i
  wyborem modal vs bottom sheet.
- **Laptop vs telefon (Warstwa A) to dwa osobne zrzuty** — tego etapu nie da się
  zautomatyzować z jednego wgranego obrazka; automatyzowalna jest tylko waga
  (`-m`, Warstwa B).

## Pliki, których dotyczy temat

- `src/components/sections/work/WorkDeviceDuo.astro` — logika `<picture>` + `mobileSrc()`.
- `src/components/sections/work/WorkCard.astro` — kafelek, breakpoint 760px.
- `src/components/sections/work/WorkDetail.astro` — modal/sheet, te same ekrany.
- `src/components/sections/work/work-data.ts` — ścieżki do grafik per realizacja.
- `scripts/optimize-realizacje.mjs` — generacja pełnych `.webp` (tu dołożyć `-m`).
- `public/realizacje/<slug>/…` — pliki wynikowe (pełne + `-m`).
- commit `4ba87ab` — jednorazowe wrzucenie wariantów `-m` (1290KB→502KB).
