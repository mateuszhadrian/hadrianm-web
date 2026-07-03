# Zarządzanie zdjęciami realizacji w erze CMS — gdzie generować warianty?

> Dokument decyzyjny. Odpowiada na pytanie: skoro zdjęcia realizacji będą wrzucane
> przez formularz **zewnętrznego CMS-a**, a docelowo lądować w **zewnętrznym
> storage (Cloudflare R2)** — czy warto rozwijać lokalny skrypt `sharp`
> generujący warianty `-m` (opisany w [mobile-photos-system-analysis.md](./mobile-photos-system-analysis.md)),
> czy powinien to przejąć proces po stronie uploadu/serwisu?
>
> Kontekst stacku i priorytetów: patrz [hosting_first_analysis.md](./hosting_first_analysis.md)
> — Cloudflare Pages, R2 na cięższe media, Git-CMS (Sveltia/Decap), model
> agencyjny, nadrzędne kryterium **maksymalnej taniości** i **0 $ recurring** dla
> klienta.

---

## 0. Odpowiedź wprost (TL;DR)

**Nie inwestuj w lokalny skrypt `sharp` jako docelowy mechanizm dla CMS-a.**
Skrypt `optimize-realizacje.mjs` + pliki `-m.webp` to **dobre rozwiązanie na
TERAZ** (media w repo, brak CMS-a), ale **złe na potem**. W momencie wejścia
CMS-a + R2 zmienia się warstwa, na której ten problem należy rozwiązać.

Rekomendacja docelowa: **przestań materializować warianty jako osobne pliki.
Przechowuj jeden oryginał na R2 i generuj rozmiary „w locie" przez transformacje
CDN (Cloudflare Image Transformations)** — czyli URL-em typu
`.../obraz.webp?width=300` zamiast osobnym plikiem `obraz-m.webp`. To **kasuje
cały problem** (skrypt, pliki `-m`, ryzyko 404, puchnięcie repo), zamiast
przenosić go w inne miejsce.

Kluczowe rozróżnienie, które determinuje całą decyzję:

- **Warstwa A — laptop vs telefon = dwa RÓŻNE zrzuty ekranu.** Tego **nie da się**
  zautomatyzować z jednego uploadu. Formularz CMS **musi** przyjąć dwa pliki na
  ekran (zrzut desktopowy + zrzut mobilny).
- **Warstwa B — warianty wagowe (`-m`, responsywne rozmiary) = downscale tego
  samego pliku.** To **w 100% automatyzowalne** i to **właśnie tego** nie warto
  robić lokalnym skryptem, gdy jest CMS + CDN.

> Zła odpowiedź: „zrób i lokalny skrypt, i proces w CMS". To **ta sama praca na
> dwóch warstwach** — wybierz warstwę, nie rób obu.

---

## 1. Na czym naprawdę polega decyzja

„Generowanie mniejszych zdjęć" to nie jedna decyzja, tylko trzy niezależne
pytania. Mylenie ich prowadzi do przerostu architektury.

1. **Kto podaje oryginały?** (autor przez formularz CMS — desktop + mobile screen)
2. **Gdzie leży oryginał?** (repo Git → docelowo R2)
3. **Kiedy/gdzie powstają rozmiary pochodne?** ← **to jest sedno sporu**
   - **build-time** (skrypt/`astro:assets` podczas `astro build`),
   - **on-upload** (proces przy wrzuceniu → zapisuje gotowe pliki do R2),
   - **on-the-fly** (CDN transformuje oryginał na żądanie, per URL).

Twój obecny system to model **build-time z ręcznym skryptem**. Pytanie brzmi: czy
przy CMS-ie zostać przy build-time, czy przejść na on-upload/on-the-fly.

---

## 2. Trzy modele generowania — porównanie

### Model 1 — Build-time (rozwój obecnego skryptu / `astro:assets`)

CMS commit-uje oryginał do repo → podczas builda na Cloudflare Pages `sharp`
(albo natywne `astro:assets`) generuje warianty → trafiają do `dist/`.

- ✅ Zero nowej infrastruktury; deterministyczne; wersjonowane; darmowe (minuty
  builda CF Pages).
- ✅ `astro:assets` robi responsywne warianty **natywnie** (`<Image>` / `getImage`
  z `widths`) — nie musisz pisać własnego `sharp`.
- ❌ **Binaria w repo puchną** (dziesiątki realizacji × ekrany × warianty).
- ❌ **Każda zmiana zdjęcia = rebuild + redeploy** całej strony.
- ❌ **Nie współgra z R2** — sensowny tylko dopóki media siedzą w repo. Wchodzi w
  konflikt z „złotą zasadą" z analizy hostingowej (zmienna treść → zewn. storage).
- ❌ Klient wrzucający zdjęcie musi wywołać build — łańcuch dłuższy, wolniejszy.

### Model 2 — On-upload (proces przy wrzuceniu → gotowe pliki do R2)

Upload w CMS odpala funkcję (Worker / serverless / hook), która **raz** robi
resize i **wgrywa komplet wariantów do R2**. Strona linkuje do stałych URL-i R2.

- ✅ Media poza repo (repo lekkie, szybkie CI); skaluje się; pasuje do R2.
- ✅ Robota liczona **raz** przy uploadzie, nie przy każdym żądaniu.
- ✅ Wynik to zwykłe pliki na R2 → **egress 0 zł**, cache CDN.
- ❌ Trzeba **postawić i utrzymać** ten proces (funkcja + sekrety + klucze R2).
- ❌ **`sharp` nie działa natywnie w Cloudflare Workers** (to natywny binarny
  moduł Node). Opcje: Worker z bindingiem **Cloudflare Images**, wasm-owy resizer,
  albo generacja poza Workerem (GitHub Action / mała funkcja Node gdzie indziej).
- ❌ Nadal **zarządzasz stałym zestawem rozmiarów** (jak dziś 960/300) — zmiana
  breakpointów = regeneracja wszystkiego.

### Model 3 — On-the-fly (transformacje CDN nad jednym oryginałem) ⭐

Trzymasz **jeden** oryginał (na R2 albo w repo), a rozmiary powstają **na żądanie**
przez transformacje Cloudflare: `.../cdn-cgi/image/width=300,format=auto/<oryginał>`
(lub produkt **Cloudflare Images**). W `<picture>` `srcset` wskazuje URL-e
transformacji z różnym `width`.

- ✅ **Kasuje cały problem generowania.** Brak skryptu, brak plików `-m`, brak
  klasy błędów „brakujący wariant → 404", brak puchnięcia repo/R2.
- ✅ **Cloudflare-natywne** — to już Twój CDN i host. Wynik cache'owany na
  krawędzi; kolejne odsłony za darmo.
- ✅ Zmiana breakpointu/rozmiaru = **zmiana liczby w URL-u**, nie regeneracja.
- ✅ `format=auto` daje AVIF/WebP zależnie od przeglądarki — gratis, bez pracy.
- ✅ **Trywialnie powielasz per klient** (model agencyjny): każda strefa
  Cloudflare klienta ma transformacje. Zero build-couplingu.
- ❌ Wymaga włączenia **Transformations** na strefie i (dla R2) podpięcia
  oryginałów pod domenę/Worker, z którego CDN je czyta.
- ❌ Model kosztowy per-transformacja (patrz §5) — ale dla portfolio praktycznie
  w darmowym limicie.

### Tabela decyzyjna

| Kryterium                        | Build-time (skrypt)   | On-upload → R2        | On-the-fly (CDN) ⭐   |
| -------------------------------- | --------------------- | --------------------- | --------------------- |
| Nowa infrastruktura              | brak                  | funkcja + klucze R2   | włączenie Transform.  |
| Pliki `-m` do zarządzania        | **tak**               | tak (na R2)           | **nie**               |
| Puchnięcie repo                  | **tak**               | nie                   | nie                   |
| Zmiana zdjęcia bez rebuildu      | **nie**               | tak                   | tak                   |
| Zmiana breakpointu               | regeneracja           | regeneracja           | **edycja URL**        |
| Pasuje do R2 / „zmienna treść"   | **nie**               | tak                   | tak                   |
| `sharp` w Workers problem        | n/d                   | **tak**               | n/d                   |
| Powielanie per klient            | średnie               | średnie               | **łatwe**             |
| Koszt przy wolumenie portfolio   | 0 zł                  | ~0 zł                 | ~0 zł (free tier)     |

---

## 3. Rekomendacja i uzasadnienie pod Twoje priorytety

**Docelowo: Model 3 (on-the-fly, Cloudflare Image Transformations) nad
oryginałami na R2.** Fallback, jeśli chcesz uniknąć nawet groszowego kosztu
per-transformację i mieć „czyste pliki": **Model 2 (on-upload → R2)**. **Model 1
(lokalny skrypt) to tylko etap przejściowy — nie buduj na nim CMS-a.**

Dlaczego Model 3 wygrywa dokładnie pod constrainty z analizy hostingowej:

- **Maksymalna taniość.** Wolumen portfolio (kilka–kilkanaście realizacji × 3
  ekrany × 2 orientacje × ~2 szerokości) to **dziesiątki unikalnych
  transformacji** — grubo w darmowym limicie Cloudflare (§5). Egress 0 zł.
- **Najmniej kodu do utrzymania.** Nie ma skryptu, nie ma `sharp`-a w Workerze,
  nie ma synchronizacji „czy każdy plik ma bliźniaka `-m`". Mniej rzeczy, które
  się psują = zgodne z duchem całej analizy.
- **Cloudflare-first.** Analiza hostingowa już wiąże Cię z Cloudflare (Pages, R2,
  Workers OAuth-proxy). Transformacje to ten sam ekosystem — żadnego nowego
  dostawcy.
- **Model agencyjny.** „Klient wrzuca zdjęcie w panelu i po chwili jest na
  stronie, 0 $ recurring" wychodzi naturalnie: upload → R2 (albo repo) → CDN
  serwuje rozmiary. Bez rebuildu, bez kolejki generowania.
- **Odporność na zmiany designu.** Gdy zmienisz breakpoint 760px albo rozmiary
  obudów laptopa/telefonu, poprawiasz `width=` w helperze — nie regenerujesz
  setek plików.

Kiedy **nie** Model 3, tylko Model 2: jeśli świadomie chcesz **zero zależności od
płatnego produktu CDN** i wolisz mieć materialne pliki na R2 (np. pełna
przenośność na innego dostawcę). Wtedy proces on-upload robi resize raz i zrzuca
pliki na R2 — ale bierzesz na siebie utrzymanie tej funkcji i obejście braku
`sharp` w Workers.

---

## 4. Jak to spiąć z konkretnym CMS-em

Wybór CMS-a (z analizy hostingowej) zmienia, **kto** trzyma oryginał i **jak**
uruchamia się transformacja.

### 4.1 Git-CMS (Sveltia / Decap) — ścieżka domyślna z analizy hostingowej

Panel zapisuje **commit do repo** (upload mediów też). Masz dwa warianty:

- **Media w repo + `astro:assets` (Model 1, interim).** Sveltia wrzuca oryginał do
  `src/`, `astro build` generuje warianty przez `<Image widths={[...]}>`. Proste,
  0 zł, ale każdy upload = rebuild i repo rośnie. **Dobre na krótką metę / mały
  wolumen.**
- **Media do R2 + transformacje (Model 3, docelowe).** Konfigurujesz media Sveltii
  na zewnętrzny storage (albo Worker pośredniczący, który wrzuca upload do R2),
  a w kodzie budujesz URL-e transformacji. Oryginał nigdy nie wchodzi do repo.
  **Docelowy przepis.**

> Uwaga: w Git-CMS „proces tworzenia zdjęć" naturalnie chce być **buildem/CI**
> (commit → GitHub Action `sharp` → commit wariantów albo upload do R2). To działa,
> ale to znów Model 1/2 z jego wadami (rebuild-coupling). Dlatego przy Git-CMS
> **wolę pchnąć oryginał do R2 i transformować w locie**, zostawiając build w
> spokoju.

### 4.2 Headless SaaS (Sanity / Storyblok) — jeśli pójdziesz w gotowy panel

Te CMS-y mają **własny image pipeline z transformacjami on-the-fly wbudowany**.
Np. Sanity serwuje `cdn.sanity.io/.../obraz.webp?w=300&auto=format` — czyli
**dostajesz Model 3 za darmo, bez R2 i bez Cloudflare Transformations**. Wtedy:

- oryginał trzyma CMS,
- `srcset` wskazuje URL-e transformacji CMS-a z różnym `w=`,
- Ty nie budujesz **niczego** wokół obrazów.

To realnie **najmniej pracy** wariant — kosztem „obcego" hostingu mediów i
pilnowania free-tier per projekt (istotne w modelu wielu klientów; patrz §11.3
analizy hostingowej).

### 4.3 Wspólny wniosek

Niezależnie od CMS-a: **generowanie wariantów nie powinno być Twoim kodem.**
Albo robi to CDN (Cloudflare), albo robi to CMS (Sanity). Lokalny `sharp` zostaje
tylko tam, gdzie nie ma jeszcze ani jednego, ani drugiego — czyli **dziś**.

---

## 5. Koszt (orientacyjnie, ~połowa 2026 — sprawdź u dostawcy)

| Pozycja                                   | Model kosztu                                   | Realny koszt dla portfolio           |
| ----------------------------------------- | ---------------------------------------------- | ------------------------------------- |
| **R2 storage**                            | ~$0,015/GB-mies., 10 GB free, **egress 0 zł**  | 0 zł (oryginały to MB, nie GB)        |
| **Cloudflare Image Transformations**      | ~5 000 unikalnych transformacji/mies. free, potem ~$0,50/1 000 | **0 zł** (wolumen portfolio << 5 000) |
| **Cloudflare Images (wariant produktowy)**| ~$5/mies. + za storage/dostarczenie            | tylko jeśli wybierzesz ten produkt    |
| **Sanity image CDN**                      | w ramach free tier CMS-a                       | 0 zł na starcie                       |
| **Lokalny skrypt / `astro:assets`**       | minuty builda CF Pages                         | 0 zł                                  |

Wniosek kosztowy: **wszystkie sensowne ścieżki są ~0 zł przy Twoim wolumenie.**
Decyzja jest więc o **złożoności i utrzymaniu**, nie o pieniądzach — a tam
on-the-fly wygrywa (najmniej ruchomych części).

---

## 6. Co zrobić TERAZ, żeby nie zablokować się na przyszłość

Nie musisz dziś stawiać R2 ani transformacji. Musisz tylko **nie zabetonować**
konwencji `-m` w wielu miejscach. Jedna zmiana odsłania całą przyszłą elastyczność:

**Wyabstrahuj budowanie URL-a obrazka do jednego helpera.** Dziś logika „jak
z pełnego pliku zrobić wariant mobilny" siedzi zaszyta w `WorkDeviceDuo.astro`:

```ts
// dziś — konwencja plikowa zaszyta w komponencie
const mobileSrc = (src: string) => src.replace(/\.webp$/, "-m.webp");
```

Zamień to na helper „daj mi URL tego obrazka w tej szerokości", którego
implementację podmienisz później **bez ruszania markupu**:

```ts
// src/lib/img.ts  (jedno miejsce prawdy o źródle obrazów)
// DZIŚ: pliki w repo z sufiksem -m
export function imgAt(src: string, width: "full" | "mobile"): string {
  return width === "mobile" ? src.replace(/\.webp$/, "-m.webp") : src;
}

// JUTRO (R2 + transformacje) — podmieniasz TYLKO tę funkcję:
// export function imgAt(src, width) {
//   const w = width === "mobile" ? 300 : 960;
//   return `/cdn-cgi/image/width=${w},format=auto/${src}`;
// }
```

`WorkDeviceDuo.astro` woła `imgAt(desktop, "mobile")` zamiast `mobileSrc(desktop)`
— i **nie wie**, czy pod spodem jest plik `-m`, R2, czy transformacja CDN. To
jedyna rzecz, którą warto zrobić proaktywnie; reszta może zostać jak jest.

### Kolejność kroków (roadmap dla mediów realizacji)

1. **Teraz (interim):** zostaw `optimize-realizacje.mjs`, ale **dołóż generowanie
   `-m`** (szkic w [mobile-photos-system-analysis.md](./mobile-photos-system-analysis.md) §5),
   żeby dziś nie było 404. Wprowadź helper `imgAt()` (§6). Koszt 0.
2. **Wejście CMS-a:** wybierz tor —
   - Git-CMS → media do **R2**, przełącz `imgAt()` na **transformacje Cloudflare**;
   - albo headless (Sanity) → `imgAt()` buduje URL transformacji **CMS-a**.
3. **Formularz CMS:** wymuś **dwa uploady na ekran** (desktop screen + mobile
   screen) — Warstwa A jest nieautomatyzowalna. Warianty wagowe znikają jako
   pojęcie (robi je CDN).
4. **Wyłącz stary skrypt** i **usuń pliki `-m`** z repo, gdy oryginały są już na
   R2/CMS, a `imgAt()` wskazuje na transformacje. Repo chudnie.
5. **Per klient:** powielasz `imgAt()` + strefę Cloudflare klienta. Zero
   build-couplingu, 0 $ recurring.

---

## 7. Pułapki i granice

- **Warstwa A jest nieusuwalna.** Żaden resize nie zrobi z desktopowego zrzutu
  layoutu mobilnego. Formularz CMS **musi** przyjąć dwa obrazy na ekran. Jeśli
  kiedyś zechcesz to uprościć, jedyna droga to zrzucać oba automatycznie z
  **prawdziwej strony klienta** (Playwright w 2 viewportach — patrz jak działa
  `capture-device-videos.mjs`), a nie „wygenerować" jeden z drugiego.
- **`sharp` nie wejdzie do Cloudflare Workers** natywnie. Jeśli uprzesz się przy
  Modelu 2, generuj albo bindingiem **Cloudflare Images**, albo poza Workerem
  (GitHub Action / funkcja Node), a do R2 wrzucaj gotowe pliki.
- **Transformacje wymagają, by CDN czytał oryginał.** Dla R2 znaczy to podpięcie
  bucketu pod domenę (R2 custom domain) lub Worker pośredniczący. Jednorazowa
  konfiguracja.
- **Nie utrzymuj dwóch mechanizmów naraz.** Lokalny skrypt **albo** proces CMS —
  nie oba. Po migracji do R2/transformacji skrypt i pliki `-m` mają zniknąć,
  inaczej masz dwa źródła prawdy i dryf.
- **`format=auto` zastępuje ręczne WebP.** Gdy wejdą transformacje, nie musisz już
  z góry decydować o formacie — CDN poda AVIF/WebP wg przeglądarki. Twoje
  `quality 72 / effort 6` z lokalnego skryptu staje się parametrem URL-a.

---

## 8. Decyzje w jednym zdaniu

- **Nie buduj lokalnego skryptu `-m` pod CMS** — to właściwa warstwa tylko dziś
  (media w repo, brak CMS).
- **Docelowo generuj rozmiary „w locie" transformacjami Cloudflare** nad jednym
  oryginałem na R2 — to kasuje problem, nie przenosi go.
- **Fallback bez płatnego CDN:** proces on-upload robi resize raz i wrzuca pliki
  na R2 (uwaga: `sharp` nie działa w Workers).
- **Jeśli headless SaaS (Sanity):** dostajesz transformacje on-the-fly gratis —
  nie budujesz wokół obrazów niczego.
- **Warstwa A (laptop vs telefon) = dwa osobne uploady** — nieautomatyzowalne;
  automatyzowalna jest wyłącznie waga (Warstwa B).
- **Zrób dziś jedną rzecz na przyszłość:** helper `imgAt()`, żeby zmiana źródła
  obrazów była podmianą jednej funkcji, nie przepisywaniem komponentów.
