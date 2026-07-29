# Podręcznik testów na przykładzie hadrianm.pl — od zera, po ludzku

> **Po co ten dokument.** Masz w projekcie rozbudowany system testów (unit, e2e,
> wizualne, Lighthouse, prod-smoke, dwa komplety baseline'ów, ratchety, budżety,
> workflowy). Działa — ale żeby nim *świadomie sterować* trzeba rozumieć, co
> każdy kawałek robi i dlaczego. Ten dokument tłumaczy wszystko po kolei,
> przystępnie, z analogiami i przykładami z Twojego repo, tak żebyś po lekturze
> umiał: skonfigurować test, przeczytać czerwony wynik i wiedzieć „to realny błąd"
> vs „to szum — puszczam dalej", oraz nie marnować czasu na powtarzanie tego
> samego.
>
> **Założenie:** znasz git/PR/CI z grubsza i piszesz kod. Nie zakładam, że wiesz,
> czym jest baseline, ratchet, harness czy Playwright — to tłumaczę od podstaw.
>
> **Jak czytać.** Rozdziały 1–3 budują intuicję (przeczytaj po kolei). Rozdziały
> 4–8 to konkretne pojęcia, które Cię myliły (baseline, ratchet, budżet, flaki).
> Rozdział 9 to praktyka: „czerwony test — co robić" z drzewkami decyzji.
> Na końcu słowniczek i tabele-ściągawki, do których wracasz bez czytania całości.

---

## Spis treści

1. [Po co w ogóle testy (intuicja)](#1-po-co-w-ogóle-testy-intuicja)
2. [Cztery warstwy testów — piramida](#2-cztery-warstwy-testów--piramida)
3. [Gdzie testy biegają: Twój komputer vs CI](#3-gdzie-testy-biegają-twój-komputer-vs-ci)
4. [Baseline'y — serce testów wizualnych](#4-baseliney--serce-testów-wizualnych)
5. [Darwin vs Linux — dlaczego dwa komplety zdjęć](#5-darwin-vs-linux--dlaczego-dwa-komplety-zdjęć)
6. [Ratchet (zapadka) — jakość, która nie może się cofnąć](#6-ratchet-zapadka--jakość-która-nie-może-się-cofnąć)
7. [Budżety Lighthouse i „zapas"](#7-budżety-lighthouse-i-zapas)
8. [Harness testowy i strażnicy (guards)](#8-harness-testowy-i-strażnicy-guards)
9. [Flaki — testy, które migoczą](#9-flaki--testy-które-migoczą)
10. [Czerwony test — co robić (drzewka decyzji)](#10-czerwony-test--co-robić-drzewka-decyzji)
11. [Zwięzłe wskazówki: jak oszczędzać czas](#11-zwięzłe-wskazówki-jak-oszczędzać-czas)
12. [Słowniczek pojęć](#12-słowniczek-pojęć)
13. [Tabele-ściągawki](#13-tabele-ściągawki)

---

## 1. Po co w ogóle testy (intuicja)

Test automatyczny to **kawałek kodu, który sprawdza inny kawałek kodu** i mówi
„OK" (zielony) albo „coś nie gra" (czerwony). Zamiast samemu za każdym razem
klikać po całej stronie i patrzeć, czy nic się nie zepsuło, piszesz to raz, a
maszyna sprawdza za Ciebie — przy każdej zmianie, w kilka minut.

**Analogia.** Wyobraź sobie, że po każdym remoncie w mieszkaniu ktoś obchodzi
wszystkie pokoje z listą: „światło działa? kran cieknie? drzwi się domykają?".
Ty wymieniłeś tylko żarówkę w kuchni, ale ta osoba i tak sprawdza całość — bo
czasem jedna zmiana psuje coś pozornie niezwiązanego. Testy to ta osoba z listą.

Dlaczego to ważne **akurat u Ciebie**: `main` = produkcja (deploy leci
automatycznie z gałęzi `main` na Cloudflare Pages). Nie ma etapu „ktoś jeszcze
sprawdzi ręcznie przed publikacją". Dlatego `main` jest chroniony i **żeby
cokolwiek weszło na produkcję, muszą przejść testy** (tzw. *required checks*:
`quality`, `e2e`, `lighthouse`). Testy są Twoją siatką bezpieczeństwa między
„zmieniłem coś" a „to jest publicznie w internecie".

---

## 2. Cztery warstwy testów — piramida

Testy dzielą się na warstwy — od najszybszych i najwęższych (sprawdzają maleńki
kawałek) po najwolniejsze i najszersze (sprawdzają całą stronę jak użytkownik).
To się nazywa **piramida testów**: dużo tanich na dole, mało drogich na górze.

U Ciebie komenda `pnpm test` uruchamia je po kolei:
```
"test": "pnpm test:unit && pnpm test:e2e && pnpm test:visual"
```
`&&` znaczy „jak poprzednie przeszło, rób następne". Czyli najpierw najszybsze
(unit), a jak padną — nie ma sensu odpalać wolniejszych.

### 2.1. Unit (jednostkowe) — `pnpm test:unit`

**Co to:** najmniejsze testy. Biorą jedną funkcję albo jeden plik z logiką i
sprawdzają: „dla takiego wejścia dostaję taki wynik?". Nie otwierają przeglądarki,
nie renderują strony — czysta logika. Dlatego trwają **sekundy**.

**Narzędzie:** Vitest (`vitest.config.ts`, `pnpm test:unit` = `vitest run`).

**Co konkretnie sprawdzają u Ciebie** (`tests/unit/`):
- `hero-config.test.ts` — niezmienniki osi scrolla hero (że pochodne liczą się
  poprawnie, że stałe się nie „rozjechały"),
- `i18n.test.ts` — że teksty PL/EN są komplet i spójne,
- `img.test.ts` — że `imgAt()` generuje właściwe rozmiary obrazów,
- `platform.test.ts` — detekcja platformy (iOS/Android/desktop),
- `cms-contract.test.ts` — „kontrakt CMS": że wpisy Realizacji pasują do schematu
  Zod (`src/content.schema.ts`),
- `faq-config.ts`, `audience-config.ts`, `services-config.ts`, `contact-form.ts`,
  `media-r2.ts` — analogicznie dla poszczególnych sekcji.

**Analogia:** to jak sprawdzenie pojedynczej cegły przed murowaniem — czy ma
właściwy wymiar. Szybko, tanio, łapie błąd zanim się rozejdzie.

**Kiedy pada:** prawie zawsze to **realny błąd w logice** (albo świadoma zmiana
kontraktu, którą trzeba odzwierciedlić w teście). Unit rzadko „miga" (patrz
flaki, rozdz. 9) — jak jest czerwony, to naprawdę coś nie gra.

### 2.2. E2E (end-to-end, „od końca do końca") — `pnpm test:e2e`

**Co to:** testy, które **otwierają prawdziwą przeglądarkę**, wchodzą na stronę i
zachowują się jak użytkownik: klikają, scrollują, sprawdzają, czy nawigacja
działa, czy formularz się wysyła, czy modal się otwiera. Sprawdzają **zachowanie**,
nie wygląd co do piksela.

**Narzędzie:** Playwright (`playwright.config.ts`, `pnpm test:e2e` =
`playwright test tests/e2e`).

E2E u Ciebie łączy w sobie trzy rodzaje sprawdzeń (`tests/e2e/`):
- **Funkcjonalne:** `navigation.spec.ts`, `work.spec.ts`, `hero-functional.spec.ts`,
  `contact.spec.ts`, `services-subpages.spec.ts`, `i18n.spec.ts` itd. — „czy to
  w ogóle działa jak ma".
- **Dostępność (a11y):** `a11y.spec.ts` — automatyczny audyt narzędziem **axe**
  (kontrast kolorów, etykiety, struktura nagłówków). O jego „allowliście" w
  rozdz. 6.
- **SEO:** `seo.spec.ts` — czy strona ma tytuły, meta-opisy, dane strukturalne.
- **Prod-smoke:** `smoke.spec.ts` z etykietą `@prod-smoke` — lekki test, który da
  się puścić **przeciw żywej produkcji** (rozdz. 3.3).

**Analogia:** to jak przejście przez cały dom po remoncie i sprawdzenie, czy
wchodzisz drzwiami, zapalasz światło i spuszczasz wodę. Nie mierzysz milimetrów —
patrzysz, czy *działa*.

### 2.3. Wizualne (visual regression) — `pnpm test:visual`

**Co to:** testy, które robią **zrzut ekranu** strony i porównują go **piksel po
pikselu** z wcześniej zatwierdzonym wzorcowym zrzutem (to jest ten „baseline" —
cały rozdz. 4). Jeśli obrazy się różnią bardziej niż o ustalony próg — czerwony.
To jedyna warstwa, która łapie „wygląda inaczej niż powinno" (przesunięty
element, zmieniony kolor, zjechana czcionka).

**Narzędzie:** też Playwright, ale osobny katalog (`pnpm test:visual` =
`playwright test tests/visual`).

**Ważne u Ciebie:** wizualne biegają **tylko na zbudowanej stronie** (`pnpm build`
+ `pnpm preview`), **nigdy na dev serverze**. Czuwa nad tym strażnik (rozdz. 8).

**Analogia:** to jak zrobienie zdjęcia pokoju „jak ma wyglądać" i porównywanie
każdego kolejnego zdjęcia z tym wzorcem — „aha, obrazek na ścianie wisi 3 cm
niżej niż na wzorcu".

### 2.4. Lighthouse (wydajność) — LHCI

**Co to:** Lighthouse to narzędzie Google, które mierzy **jak szybko i sprawnie
ładuje się strona** — czas do pierwszej dużej treści, ile skryptów, czy elementy
nie „skaczą" podczas ładowania. Wystawia ocenę 0–1 (performance score) i
konkretne metryki. **LHCI** (Lighthouse CI) to wersja, która robi to automatycznie
i **sprawdza, czy metryki mieszczą się w ustalonych limitach** (budżetach — rozdz. 7).

**Konfiguracja u Ciebie:** dwa profile — `lighthouserc.cjs` (mobile) i
`lighthouserc.desktop.cjs` (desktop). Odpalane w CI (nie ma osobnej komendy
`pnpm`, robi to job `lighthouse` przez `lhci autorun`).

**Analogia:** to jak pomiar, ile sekund zajmuje wejście do domu i zapalenie
świateł — i umowa „nie może być wolniej niż X".

---

## 3. Gdzie testy biegają: Twój komputer vs CI

To rozróżnienie jest kluczowe dla zrozumienia baseline'ów (rozdz. 5), więc
poświęćmy mu chwilę.

### 3.1. Lokalnie (Twój Mac)

Odpalasz komendy ręcznie: `pnpm test:unit`, `pnpm test:e2e`, `pnpm test:visual`
(albo mądry skill `/test`, który patrzy, co zmieniłeś, i puszcza tylko potrzebne
warstwy). Testy wizualne wymagają wcześniejszego `pnpm build`. Twój Mac to system
**darwin** (to techniczna nazwa rdzenia macOS).

### 3.2. CI (GitHub Actions — chmura)

Przy każdym push i pull requeście GitHub uruchamia testy **na swoich serwerach**,
niezależnie od Twojego komputera. Te serwery to Linux (`ubuntu-latest`). Konfiguracja:
`.github/workflows/ci.yml`. Są **trzy joby** (zadania), i to one są „required
checks" chroniącymi `main`:

1. **`quality`** — szybka brama: `format:check` → `lint` → `typecheck` →
   `test:unit` → `build`. Na końcu zapisuje zbudowaną stronę (`dist/`) jako
   „artefakt", żeby kolejne joby jej użyły (nie budują drugi raz).
2. **`e2e`** (czeka na `quality`) — pobiera gotowy `dist/`, instaluje przeglądarki
   Playwrighta i odpala `test:e2e` **oraz** `test:visual`. Ma backstop
   `timeout-minutes: 25` (normalnie ~13 min; limit jest na wypadek, gdy
   infrastruktura GitHuba się zawiesi — zdarzyło się >1h).
3. **`lighthouse`** (czeka na `quality`) — pobiera `dist/` i mierzy wydajność w
   dwóch profilach (mobile + desktop).

**Dlaczego to ważne:** ten sam kod na Twoim Macu i na Linuksie GitHuba **renderuje
się odrobinę inaczej** (inne czcionki systemowe, inny silnik rasteryzacji). Stąd
biorą się dwa komplety baseline'ów (rozdz. 5) i część flaków (rozdz. 9).

### 3.3. Prod-smoke (po deployu)

Osobny workflow `prod-smoke.yml` odpala się **po** merge'u do `main` (czyli po
tym, jak Cloudflare wdroży zmianę). Sprytnie czeka, aż produkcja zacznie serwować
nowy build (rozpoznaje go po zahashowanej nazwie pliku), a potem odpala lekkie
testy `@prod-smoke` przeciw **żywemu** `https://hadrianm.pl`. Jak coś padnie —
dostajesz maila. To ostatnia linia obrony: „czy to, co realnie stoi na produkcji,
w ogóle się otwiera".

---

## 4. Baseline'y — serce testów wizualnych

To pojęcie myli najbardziej, więc rozbijmy je maksymalnie.

### 4.1. Co to jest baseline

**Baseline** (po polsku: wzorzec, punkt odniesienia) to **zatwierdzony zrzut
ekranu, który reprezentuje „jak strona ma wyglądać"**. Test wizualny działa tak:

1. Buduje stronę i robi świeży zrzut ekranu danego widoku.
2. Porównuje go z zapisanym baseline'em (piksel po pikselu).
3. Jeśli różnica jest mniejsza niż próg → zielony. Jeśli większa → czerwony +
   generuje obrazek „diff" pokazujący, co się różni.

Baseline'y to zwykłe pliki `.png` **zacommitowane w repo**, w
`tests/visual/__screenshots__/`. Są częścią kodu — wersjonowane razem z nim.

**Analogia:** baseline to „zdjęcie wzorcowe z metki". Kontroler jakości porównuje
każdy produkt ze zdjęciem wzorcowym. Jeśli świadomie zmieniasz produkt (nowy
kolor), musisz **zrobić nowe zdjęcie wzorcowe** — inaczej kontroler będzie
odrzucał wszystko jako „niezgodne z wzorcem".

### 4.2. Kluczowa zasada: baseline podąża za Twoją *świadomą* decyzją, nigdy sam

To jest sedno. Test wizualny sam z siebie **nie wie**, czy różnica to błąd, czy
zamierzona zmiana. Wie tylko „jest inaczej niż na wzorcu". Decyzja należy do
Ciebie:

- **Zmiana niezamierzona** (regresja — coś się zepsuło) → napraw kod, żeby zrzut
  znów pasował do baseline'u.
- **Zmiana zamierzona** (np. przeprojektowałeś sekcję) → **zaktualizuj baseline**
  komendą `pnpm test:visual:update`, żeby wzorzec = nowy wygląd.

**Największa pułapka (i twarda zasada projektu):** NIGDY nie aktualizuj
baseline'u tylko po to, żeby „naprawić" czerwony test, którego nie rozumiesz. To
jak przemalowanie zdjęcia wzorcowego, żeby wadliwy produkt „pasował" — od tej
chwili wada jest oficjalnym wzorcem i nikt jej już nie wyłapie. Dlatego u Ciebie
jest to **zablokowane** (`.claude/settings.json` blokuje Edit/Write na
baseline'ach; asystent nie zaktualizuje ich bez pokazania Ci diffu i Twojej
zgody). Aktualizacja = tylko po obejrzeniu diffu i świadomej akceptacji.

### 4.3. Jak wygląda „profil" i dlaczego jest ich sześć

Playwright robi zrzuty w kilku **profilach** (różne urządzenia/rozdzielczości),
bo strona ma wyglądać dobrze na każdym. Z `playwright.config.ts`:

```ts
projects: [
  { name: "chromium-1920", ... },   // duży desktop
  { name: "chromium-1366", ... },   // laptop
  { name: "firefox-desktop", ... }, // inny silnik przeglądarki
  { name: "webkit-iphone-se", ... },// mały iPhone (Safari)
  { name: "webkit-iphone-14", ... },// większy iPhone
  { name: "chromium-pixel-5", ... },// Android (Chrome)
]
```

Każdy profil = osobny komplet baseline'ów. Dlatego jedna sekcja generuje
kilkanaście plików `.png`.

### 4.4. Jak baseline'y powstają i gdzie leżą

Ścieżkę definiuje szablon w `playwright.config.ts`:
```ts
snapshotPathTemplate:
  "{testDir}/visual/__screenshots__/{projectName}/{arg}-{platform}{ext}"
```
Rozszyfrujmy: `__screenshots__/chromium-pixel-5/hero-05-linux.png` to zrzut
klatki 05 hero, profil Pixel 5, na Linuksie. Zwróć uwagę na `{platform}` na
końcu — to on tworzy dwa komplety (darwin/linux), o czym rozdz. 5.

### 4.5. Próg tolerancji — dlaczego nie „piksel w piksel na sztywno"

Dwa zrzuty tej samej strony prawie nigdy nie są **idealnie** identyczne (drobne
różnice antyaliasingu, zaokrągleń). Dlatego jest **próg**: „ile procent pikseli
może się różnić, zanim uznamy to za błąd". Globalny domyślny próg u Ciebie
(`playwright.config.ts`):
```ts
expect: { toHaveScreenshot: {
  maxDiffPixelRatio: 0.0005,   // 0,05% pikseli może się różnić
  animations: "disabled",      // wyłącz animacje na czas zrzutu
} }
```
0,05% to bardzo ciasno — czyli testy są czułe. Niektóre klatki mają **lokalnie
podniesiony próg**, bo są z natury „drgające" (rozdz. 9).

---

## 5. Darwin vs Linux — dlaczego dwa komplety zdjęć

To bezpośrednio wynika z rozdz. 3 (lokalnie = macOS/darwin, CI = Linux).

### 5.1. Problem

Ta sama strona, ten sam kod, ale **zrzut zrobiony na macOS wygląda odrobinę
inaczej niż na Linuksie** — inne systemowe renderowanie czcionek, inny
antyaliasing. Gdybyś miał jeden komplet baseline'ów zrobiony na Macu, to CI
(Linux) porównywałby swoje zrzuty z macOS-owym wzorcem i **zawsze** widziałby
różnice — testy byłyby wiecznie czerwone, choć nic nie jest zepsute.

### 5.2. Rozwiązanie: dwa komplety per plik

Dlatego każdy widok ma **dwa** baseline'y:
- `nazwa-darwin.png` — wzorzec dla Twojego Maca (i do Twoich lokalnych testów),
- `nazwa-linux.png` — wzorzec dla CI (GitHub Actions).

Playwright automatycznie wybiera właściwy po `{platform}`. Dzięki temu każde
środowisko porównuje się z wzorcem zrobionym **w tym samym środowisku** — i
różnice systemowe znikają jako źródło fałszywych alarmów.

**Twarda zasada:** nigdy nie „naprawiaj" rozjazdu darwin↔linux przez podniesienie
globalnego progu. Od tego jest właśnie osobny `{platform}` w ścieżce. Podniesienie
progu zamiotłoby pod dywan realne różnice.

### 5.3. Jak aktualizować oba komplety (procedura)

Tu jest subtelność, na której łatwo się potknąć. Ty masz Maca, więc:

- **Komplet darwin** robisz lokalnie: `pnpm test:visual:update` (po `pnpm build`).
  Generuje/nadpisuje pliki `*-darwin.png`. Oglądasz diff, akceptujesz, commitujesz.
- **Komplet linux** robi za Ciebie **workflow** `update-visual-baselines.yml` —
  bo nie masz pod ręką Linuksa identycznego z CI. Odpalasz go ręcznie
  (`workflow_dispatch`) z brancha swojego PR-a; bot buduje stronę na Linuksie,
  robi `test:visual:update` i **dopisuje commit** `chore(test): update linux
  visual baselines` do Twojego brancha. Potem robisz lokalnie `git pull`.

**Dlaczego workflow jest wyłącznie ręczny (`workflow_dispatch`):** gdyby
aktualizował się automatycznie, wzorzec **podążałby za regresją** — każda
przypadkowa zmiana wyglądu z miejsca stawałaby się nowym „wzorcem" i test nigdy
by nic nie złapał. Ręczny = Ty decydujesz.

### 5.4. Kolejność (to jest ta pułapka z notatek)

Ważny szczegół: **bot-commit z workflowu NIE wyzwala nowego przebiegu CI**
(GitHub nie odpala CI od commitów swojego bota, żeby uniknąć pętli). Dlatego
kolejność przy zamierzonej zmianie wyglądu jest taka:

1. **Kod** (zmiana wyglądu) → commit.
2. **Workflow linux** → bot dopisuje `*-linux.png` do brancha.
3. **`git pull`**, potem **komplet darwin** lokalnie → commit `*-darwin.png`
   **na samym końcu** (ten commit wyzwoli CI, które zobaczy już komplet linux).

Gdybyś zrobił darwin przed linuxem, CI odpaliłoby się bez linuksowych wzorców i
byłoby czerwone. Zasada: **zamierzona zmiana wyglądu = kod + OBA komplety
baseline'ów w jednym PR**, darwin commitowany na końcu.

> 💡 W praktyce widać to w Twojej historii jako pary commitów:
> `chore(test): update linux visual baselines` (bot) tuż przed
> `chore(test): update darwin visual baselines` (Ty).

---

## 6. Ratchet (zapadka) — jakość, która nie może się cofnąć

**Ratchet** to po angielsku mechanizm zapadkowy — jak w kluczu grzechotkowym albo
opasce zaciskowej: **da się zaciągnąć mocniej, ale nie da się poluzować**. W
testach oznacza to regułę jakości, która **może iść tylko w jedną stronę
(lepiej)** — nigdy się nie cofa bez świadomej decyzji.

U Ciebie ratchet jest w dwóch miejscach:

### 6.1. Ratchet dostępności (a11y allowlist)

Audyt axe (`tests/e2e/a11y.spec.ts`) potrafi znaleźć dużo naruszeń naraz. Gdyby
test padał na *każdym* — nie dałoby się nic wdrożyć, dopóki nie naprawisz
wszystkiego co do jednego. Rozwiązanie: **allowlist** (lista znanych, tolerowanych
na razie naruszeń):

```ts
const KNOWN_VIOLATIONS: Record<string, RegExp[]> = { ... };
// Ratchet: węzły z allowlisty odpadają; NOWE węzły bramkują.
```

Mechanizm ratchetu: **znane naruszenie z listy** nie wywala testu (jest
świadomie tolerowane), ale **każde nowe** — tak. I kluczowe: **wpis wolno tylko
USUNĄĆ** (po realnej naprawie), nowych **nie wolno dopisywać** bez Twojej
decyzji. Czyli lista może się tylko kurczyć — jakość może iść tylko w górę.

> Przykład z Twojego repo: `2026-07-13` podniosłeś token `--faint` z 0.34 do 0.5
> (kontrast 2,69:1 → ~4,8:1, czyli WCAG AA) — to była realna poprawa, więc
> odpowiedni wpis z allowlisty **wypadł**. Zapadka zacisnęła się o jedno oczko.

### 6.2. Ratchet wydajności (budżety Lighthouse)

To samo w wydajności: budżety (limity metryk) ustawia się tuż nad aktualnym
poziomem. Jak zoptymalizujesz — **zaciskasz** budżet do nowego, lepszego poziomu.
Jak dojdzie nowa sekcja i strona lekko urośnie — **świadomie** i osobnym commitem
poluzowujesz o tyle, ile trzeba (nigdy „na zapas w nieskończoność"). Szczegóły w
rozdz. 7.

**Analogia:** ratchet to jak rekord osobisty na siłowni. Podniosłeś 100 kg? Teraz
100 kg to nowa poprzeczka. Nie schodzisz z powrotem do 80 „bo tak" — chyba że
świadomie (kontuzja) i to odnotowujesz.

---

## 7. Budżety Lighthouse i „zapas"

Tu wyjaśnia się Twoje pytanie „o co chodzi z ustawianiem budżetu z zapasem".

### 7.1. Co to budżet

**Budżet** = górny (albo dolny) limit na metrykę. „LCP nie może być wolniejsze
niż X ms", „skrypty nie mogą ważyć więcej niż Y KB", „ocena wydajności nie może
spaść poniżej Z". Jak metryka przekroczy limit → job `lighthouse` czerwony → PR
nie wejdzie. To zmusza do trzymania wydajności w ryzach.

Najważniejsze metryki, które budżetujesz (`lighthouserc.cjs`):
- **LCP** (Largest Contentful Paint) — kiedy pojawia się największy element treści
  (czyli „kiedy użytkownik widzi, że strona się załadowała"). Im mniej ms, tym lepiej.
- **TBT** (Total Blocking Time) — jak długo strona jest „zablokowana" przez
  JavaScript i nie reaguje na kliknięcia. Mniej = lepiej.
- **CLS** (Cumulative Layout Shift) — jak bardzo elementy „skaczą" podczas
  ładowania (0 = nic nie skacze).
- **script:size / total:size** — waga skryptów / wszystkich zasobów.
- **font:count** — liczba wczytywanych fontów (u Ciebie tylko `warn`, nie błąd).

### 7.2. Skąd „zapas" — dlaczego nie ustawiasz budżetu równo na zmierzonej wartości

Bo **pomiary same się wahają**. Ten sam kod zmierzony dwa razy da odrobinę różne
LCP — serwery GitHuba raz są szybsze, raz wolniejsze (to się nazywa *dryf
runnerów*). Gdybyś ustawił budżet **równo** na zmierzonej wartości, połowa
przebiegów wypadłaby ciut powyżej i test byłby czerwony bez żadnej realnej
regresji — czysty szum.

Dlatego budżet = **zmierzony baseline + margines (zapas)**. U Ciebie reguła jest
spisana wprost w `lighthouserc.cjs`:

> Progi = RATCHET od baseline'u zmierzonego W CI: **metryki czasowe ×1,15, wagi
> zasobów +10%**.

Czyli:
- **metryki czasowe** (LCP, TBT) → baseline **×1,15** (15% zapasu na wahania),
- **wagi zasobów** (script, total) → baseline **+10%**.

Przykład realny z Twojego configu: zmierzone LCP mobile ≈ 3100 ms →
`3100 × 1,15 ≈ 3565` → i taki jest próg: `maxNumericValue: 3565`. Zapas 15%
wchłania szum, ale **realna regresja** (np. dorzuciłeś ciężki obrazek i LCP skoczyło
do 4500 ms) i tak przebije próg — bo prawdziwe zepsucie jest większe niż szum.

### 7.3. „Podłoga" (floor) — osobny trik dla malutkich wartości

Gdy baseline jest *malutki*, mnożenie ×1,15 daje bezsens. Przykład: TBT
desktop = 0 ms. `0 × 1,15 = 0` — próg „TBT nie może przekroczyć 0 ms" byłby
absurdalnie czuły, bo pojedyncze milisekundy to czysty szum runnera. Dlatego dla
takich metryk ustawiasz **podłogę** — sztywny, rozsądny minimalny próg:

```js
// TBT ×1,15 dałoby 29 ms — próg-podłoga 150 ms, bo pojedyncze ms to czysty
// szum runnera; realna regresja JS i tak go przebije.
"total-blocking-time": ["error", { maxNumericValue: 150 }],
```

Sens: nie chcesz alarmu o różnicy „5 ms vs 8 ms" (nic nie znaczy), ale chcesz
alarm, gdy TBT skoczy do 300 ms (realny problem z JS). Podłoga 150 ms trafia w to
okno.

### 7.4. Dryf runnerów — dlaczego LCP „samo" rośnie

W komentarzach configu masz udokumentowany prawdziwy przypadek: **ten sam SHA**
`main` zmierzył LCP 2745 ms o 14:01 i 3111 ms o 16:56 — kod bez zmian, ~13%
różnicy, czysty dryf infrastruktury GitHuba. To dlatego:
- do małych delt LCP **nie ufaj pojedynczemu pomiarowi** — bierzesz medianę z
  kilku (`numberOfRuns: 3`, a przy re-baseline nawet 5),
- kontrola przy podejrzeniu regresji: **rerun tego samego joba na `main`** — jak
  na czystym `main` też skacze, to dryf, nie Twoja zmiana.

### 7.5. Re-baseline — kiedy świadomie podnosisz budżet

Gdy **celowo** dodajesz coś, co legalnie zwiększa metrykę (nowa sekcja = więcej
JS), robisz **re-baseline**: mierzysz nowy poziom i podnosisz próg z zapasem,
osobnym commitem z uzasadnieniem. Twój config ma tego pełną kronikę, np.:

> Re-baseline 2026-07-14 po komponencie Toast (~1,1 KB gzip, montowany globalnie):
> zmierzone 86 941 B → próg `86 941 × 1,1 ≈ 95 700`. Po optymalizacji zacieśnić
> do nowego baseline'u.

Zwróć uwagę na ostatnie zdanie — to ratchet w akcji: podniosłeś, bo trzeba, ale
zobowiązujesz się **zacisnąć z powrotem**, gdy zoptymalizujesz.

> 💡 **Lokalny Lighthouse kłamie w drobnych rzeczach.** Budżety są mierzone i
> egzekwowane **w CI**, nie na Twoim Macu — bo bramkuje CI, i tylko tam pomiary
> są porównywalne. Lokalny LHCI potrafi liczyć LCP z rozrzutem ±300 ms. Do
> małych delt (np. „czy ten drobiazg pogorszył LCP o 50 ms?") mierz Playwrightem
> albo patrz na medianę z CI — nie na jeden lokalny strzał.

---

## 8. Harness testowy i strażnicy (guards)

### 8.1. Co znaczy „harness"

**Harness** (dosł. „uprząż") to **rusztowanie/obudowa, w której odpalają się
testy** — cała maszyneria, która przygotowuje warunki, uruchamia sprawdzenia i
zbiera wyniki. Kiedy w historii projektu pada „scroll-sweep visual regression
harness", chodzi o **zestaw testów + pomocników, który przescrollowuje hero po
kolejnych punktach i robi zrzuty do porównania**. Harness to nie jeden test —
to *aparatura* do testowania.

**Analogia:** harness to jak stanowisko kontroli jakości w fabryce — taśma,
oświetlenie, aparat, wzorce. Pojedynczy test to jedno sprawdzenie na tym
stanowisku.

W Twoim projekcie „harness" to `tests/visual/hero.spec.ts` (sweep scrolla ×
profile) plus wspólne **helpery** w `tests/helpers/`:
- `visual.ts` — wspólna logika robienia zrzutów sweepa,
- `scroll.ts` — scrollowanie przez Lenisa w kontrolowany sposób,
- `freeze.css` — CSS „zamrażający" animacje na czas zrzutu (żeby klatka była
  powtarzalna),
- `guards.ts` — strażnicy (niżej).

### 8.2. Strażnicy (guards) — czemu chronią

**Guard** to mały strażnik, który **przerywa test, jeśli warunki są złe** — zanim
w ogóle zacznie sprawdzać. Chroni Cię przed „testami, które przechodzą/padają z
głupiego powodu środowiskowego". Z `tests/helpers/guards.ts`:

- **`assertPreview`** — pilnuje, że testy wizualne biegają na **zbudowanej
  stronie** (`pnpm preview`, port 4399), a **nie** na dev serverze (port 4321).
  Wykrywa dev po tym, że Astro wstrzykuje `/@vite/client`, i przerywa z czytelnym
  komunikatem. Dlaczego to ważne: dev i preview renderują się inaczej i mają inny
  timing — zrzuty z deva dawałyby fałszywe różnice. **Nie obchodź tego strażnika.**
- **`useChromium1920Only`** — dla testów niezależnych od urządzenia (np. sprawdzenie
  meta-tagów, treści) puszcza je tylko w jednym profilu, zamiast 6× to samo.
  Oszczędność czasu.
- **`collectPageIssues`** — zbiera błędy konsoli, wyjątki JS i 404-ki podczas
  testu (z mądrym wyjątkiem: lokalne 404 obrazów Realizacji z `/cdn-cgi/image/`
  to znany artefakt preview, bo endpoint transformacji istnieje tylko na
  produkcji Cloudflare — więc go ignoruje).

> 💡 Strażnicy to powód, dla którego czasem test „nie odpala się" z komunikatem
> typu „pod baseURL działa DEV SERVER". To nie błąd testu — to strażnik mówi Ci
> „najpierw `pnpm build && pnpm preview`".

---

## 9. Flaki — testy, które migoczą

### 9.1. Co to flake

**Flaky test** (flaki, „migoczący") to test, który **raz przechodzi, raz pada bez
żadnej zmiany w kodzie**. To nie znaczy, że kod jest zepsuty — znaczy, że test
łapie coś *niedeterministycznego* (losowego): drobne wahanie czasu, renderowania,
sieci. Flaki to normalne zjawisko w testach e2e/wizualnych — sztuka polega na
**rozpoznaniu, że to flake, a nie regresja**, i niepanikowaniu.

**Analogia:** to jak czujnik dymu, który czasem piszczy od pary z prysznica.
Piszczy — ale nie ma pożaru. Trzeba umieć odróżnić „para" od „faktycznie się
pali", zamiast za każdym piknięciem wzywać straż.

### 9.2. Skąd się biorą flaki (u Ciebie konkretnie)

- **Loteria maszyn CI.** GitHub przydziela losowo różne fizyczne procesory. Różny
  CPU → inne zaokrąglenia antyaliasingu → mikroskopijna różnica w zrzucie. Np.
  serifowy akcent hero przy ułamkowym DPR 2.75 (Pixel 5) daje ~0,35% diffu
  *deterministycznie per maszyna* (na jednej zawsze tak, na innej zawsze 0%).
- **Ekran telefonu + ambient w hero** (desktop klatki 05–09) — nakładające się
  warstwy dają ~0,5–2% naturalnego drgania.
- **Jitter wideo/stitchowania** — klatka wideo w zrzucie to loteria, dlatego
  wideo **zawsze zasłania się maską** (czarny prostokąt), a odtwarzanie sprawdza
  się funkcjonalnie osobno.
- **Dryf runnerów** (rozdz. 7.4) — wahania czasu w Lighthouse.
- **Wyścig propagacji Cloudflare** — po zmianie hashu assetu produkcja przez
  chwilę serwuje starą wersję (`text/html` zamiast `.css`) → prod-smoke miga.

### 9.3. Jak radzisz sobie z flakami (dwie techniki)

**A) Podniesiony próg lokalnie — tylko na znanych drgających klatkach.** W
`hero.spec.ts` masz to dosłownie:
```ts
const FLAKY_DESKTOP_FRAMES = new Set([5, 6, 7, 8, 9]); // ekran tel. + ambient
const FLAKY_RATIO = 0.02;                               // 2% zamiast 0,05%
const FLAKY_PIXEL5_FRAMES = new Set([0, 1, 2, 3]);      // serif @ DPR 2.75
const FLAKY_PIXEL5_RATIO = 0.01;
```
Czyli **tylko te konkretne klatki** dostają luźniejszy próg; cała reszta trzyma
ostre 0,05%. To celowo chirurgiczne — nie luzujesz globalnie, tylko punktowo tam,
gdzie drganie jest udokumentowane.

**B) Retry w CI.** `playwright.config.ts`: `retries: process.env.CI ? 1 : 0`.
Znaczy: w CI padnięty test dostaje **jedną drugą szansę** (flake zwykle przechodzi
za drugim razem), lokalnie zero retry (chcesz widzieć prawdę od razu).

### 9.4. Kluczowa zasada: NIE „naprawiaj" flake'a regeneracją baseline'u

Największa pułapka: pixel-5 miga → kusi, żeby odpalić workflow linux i „przepiec"
baseline. **To nie zadziała** i jest odnotowane: workflow trafi na *inną* maszynę
z loterii i „nie zobaczy" objawu (bo on jest per-maszyna). Zregenerowany baseline
nic nie zmieni, a Ty stracisz czas. Właściwa kontrola: **rerun tego samego joba
na `main`** — jeśli na czystym `main` też miga, to flake, nie Twoja regresja.

> 💡 Cały katalog Twoich znanych flaków jest w notatkach projektu
> (`ci-flakes-catalog.md`, `verify-hero-desktop-flaky-frames.md`): zawieszony
> `playwright install` (>1h — stąd `timeout-minutes`), LCP o ułamek % nad
> budżetem, anchor-CTA chromium-1920 (desync Lenisa), prod-smoke MIME `text/html`
> na `.css` (propagacja Cloudflare), `#contact` pixel-5 stitch jitter. Reguła
> nadrzędna: **najpierw rerun tego samego SHA; regresję podejrzewaj dopiero przy
> 2× deterministycznym failu.**

---

## 10. Czerwony test — co robić (drzewka decyzji)

To rozdział, który realizuje Twoje główne życzenie: „chcę rozumieć, jak coś się
wywala, i wiedzieć, kiedy się tym nie przejmować". Ogólna zasada nadrzędna, zanim
wejdziesz w szczegóły:

> **Najpierw rerun tego samego commita. Regresję podejrzewaj dopiero, gdy pada
> deterministycznie (dwa razy pod rząd, ten sam objaw).** Rerun jest darmowy i w
> ~80% przypadków flake znika.

### 10.1. Padł test UNIT (`test:unit`)

```
Unit czerwony?
├─ Prawie zawsze REALNY błąd (unit nie miga).
├─ Czy to Twoja świadoma zmiana kontraktu? (zmieniłeś schemat CMS,
│  dodałeś klucz i18n, zmieniłeś oś hero)
│   ├─ TAK → zaktualizuj test tak, by odzwierciedlał nowy kontrakt.
│   └─ NIE → to regresja logiki. Napraw kod. NIE ruszaj testu.
```
Unit pada w sekundy i jest deterministyczny — jak jest czerwony, coś naprawdę nie
gra. Nie rób rerunu „w nadziei" — czytaj komunikat.

### 10.2. Padł test E2E funkcjonalny

```
E2E funkcjonalny czerwony?
├─ 1. Rerun (może flake: timing, desync Lenisa, wyścig sieci).
│   ├─ Zielony po rerunie → flake. Jedziesz dalej.
│   └─ Pada znów (ten sam test, ten sam objaw) → realny problem:
│       ├─ Otwórz raport Playwright (artefakt `playwright-report/`) —
│       │  jest zrzut + ślad kroków w momencie padu.
│       ├─ Zmieniłeś zachowanie świadomie (np. przeniosłeś sekcję na
│       │  podstronę → zmieniła się nawigacja)? → zaktualizuj test.
│       └─ Nie zmieniałeś tego celowo? → regresja. Napraw kod.
```

### 10.3. Padł test A11Y (axe)

```
A11y czerwony?
├─ Czy to NOWY węzeł, czy coś z allowlisty?
│   ├─ Z allowlisty → nie powinno padać (allowlist to przepuszcza);
│   │   jeśli pada, sprawdź czy nie zmienił się selektor/target.
│   └─ NOWE naruszenie → realny problem dostępności, który wprowadziłeś:
│       ├─ Napraw (kontrast, aria, nagłówek) — preferowane.
│       └─ NIE dopisuj do allowlisty bez świadomej decyzji (to psuje
│          ratchet). Allowlist tylko się kurczy.
```

### 10.4. Padł test WIZUALNY

```
Wizualny czerwony?
├─ 1. Obejrzyj DIFF (Playwright generuje obraz różnicy: expected/actual/diff).
│   To najważniejszy krok — oczy, nie zgadywanie.
├─ 2. Czy różnica jest ZAMIERZONA? (zmieniłeś wygląd tej sekcji)
│   ├─ TAK → zaktualizuj OBA baseline'y (rozdz. 5.3): workflow linux →
│   │        pull → `pnpm test:visual:update` darwin → commit darwin na końcu.
│   └─ NIE → 
│       ├─ Czy to znana drgająca klatka? (hero desktop 05–09, pixel-5 00–03)
│       │   → prawdopodobnie flake. Rerun na main jako kontrola.
│       ├─ Czy diff jest ~1px, subpikselowy, „ghosting" pod sekcją?
│       │   → to przesunięcie fazy subpikselowej (ułamkowa wysokość sekcji),
│       │     NIE regresja. (Znany efekt — patrz notatka audience.)
│       └─ Diff realny (przesunięty element, zły kolor, zjechany tekst)?
│           → REGRESJA. Napraw kod, aż zrzut wróci do baseline'u.
│             NIE regeneruj baseline'u, żeby „zazielenić".
```

### 10.5. Padł LIGHTHOUSE (LHCI)

```
Lighthouse czerwony?
├─ Która metryka? (raport pokazuje: LCP / TBT / CLS / script / total)
├─ Metryka CZASOWA (LCP/TBT) ledwo nad progiem (kilka %)?
│   ├─ Rerun / sprawdź medianę → prawdopodobnie DRYF runnerów.
│   └─ Kontrola: rerun joba na czystym `main`. Skacze tam też → dryf.
├─ Metryka ZASOBOWA (script/total) nad progiem?
│   → to jest deterministyczne (waga bundle'a się nie „waha”).
│   ├─ Dodałeś coś świadomie (nowa sekcja/komponent)? → RE-BASELINE:
│   │   zmierz nowy poziom, podnieś próg z zapasem, osobny commit z uzasadnieniem.
│   └─ Nie dodawałeś nic ciężkiego? → coś niechcący dociągnąłeś (import,
│       biblioteka). Znajdź i usuń, zamiast luzować budżet.
```

Uwaga na kolejność myślenia: **czasowe metryki = najpierw podejrzewaj dryf/szum;
zasobowe = podejrzewaj realną zmianę** (bo waga plików jest deterministyczna).

---

## 11. Zwięzłe wskazówki: jak oszczędzać czas

Krótkie reguły kciuka, żeby nie robić w kółko tego samego:

- **Puszczaj tylko warstwę, której dotyczy zmiana.** Skill `/test` robi to
  automatycznie (patrzy na zmienione pliki i mapuje na warstwy wg
  `.claude/rules/testing.md`). Ręcznie: zmieniłeś logikę i18n/img/platform →
  `pnpm test:unit` wystarczy. Zmieniłeś navbar/scroll/overlay → `pnpm test:e2e`.
  Zmieniłeś cokolwiek w wyglądzie → `pnpm build && pnpm test:visual`. Ruszałeś
  hero → unit + visual + e2e (hero dotyka wszystkiego).
- **Batchuj zmiany, potem testuj raz.** Jeśli wiesz, że robisz serię drobnych
  poprawek wizualnych, nie odpalaj pełnego `test:visual` po każdej. Zrób wszystkie,
  potem jeden przebieg + jedna regeneracja baseline'ów na końcu (tak robiłeś przy
  „visual corrections part 1": kolejność 1–5+7 → 6 → 8, baseline'y raz na końcu).
- **Rerun przed dochodzeniem.** Zanim zaczniesz debugować czerwony e2e/visual —
  rerun tego samego commita. Darmowe, zwykle to był flake.
- **Nie regeneruj baseline'ów „na flake".** To strata czasu (workflow trafi na
  inną maszynę). Najpierw rerun na `main` jako kontrola.
- **Testy wizualne ZAWSZE na `pnpm build` + `preview`, nie dev.** Odpalanie na
  dev = pewny czerwony ze strażnika, strata przebiegu.
- **Nie mierz drobnych delt wydajności lokalnie.** Lokalny LHCI szumi ±300 ms;
  albo Playwright, albo mediana z CI.
- **Unit puszczaj często (sekundy), pełne `pnpm test` rzadko** (przed PR / release,
  wtedy skill `/release-check`). Nie ma sensu czekać na e2e+visual przy każdym
  zapisie.
- **Jeden PR = kod + oba komplety baseline'ów, gdy zmieniasz wygląd.** Inaczej
  wrócisz do tego drugi raz.

---

## 12. Słowniczek pojęć

- **a11y** — accessibility (dostępność). Czy stronę da się obsłużyć z klawiatury,
  czytnikiem ekranu, przy słabym wzroku (kontrast). Audyt: axe w `a11y.spec.ts`.
- **allowlist** — lista znanych, świadomie tolerowanych naruszeń (a11y), które nie
  wywalają testu. Element ratchetu — może się tylko kurczyć.
- **artefakt (CI)** — plik zapisany przez job do pobrania: zbudowany `dist/`,
  raport Playwrighta, raport prod-smoke. Znajdziesz w zakładce Actions danego przebiegu.
- **axe** — silnik audytu dostępności użyty w e2e.
- **baseline** — zatwierdzony zrzut ekranu-wzorzec, z którym porównuje się świeże
  zrzuty. Pliki `.png` w `tests/visual/__screenshots__/`.
- **budżet (budget)** — limit na metrykę wydajności (LCP/TBT/script…). Przekroczenie
  = czerwony Lighthouse.
- **check (required check)** — sprawdzenie, które musi być zielone, żeby PR wszedł
  na `main`. U Ciebie: `quality`, `e2e`, `lighthouse`.
- **CI** — Continuous Integration; automatyczne testy w chmurze (GitHub Actions)
  przy każdym push/PR.
- **CLS** — Cumulative Layout Shift; miara „skakania" elementów podczas ładowania.
- **darwin** — techniczna nazwa rdzenia macOS (Twój komputer). Jeden z dwóch
  kompletów baseline'ów.
- **diff (wizualny)** — obraz różnicy między zrzutem a baseline'em; pokazuje, co
  dokładnie się zmieniło.
- **dryf runnerów** — wahania wyników pomiarów przez to, że CI dostaje raz szybszy,
  raz wolniejszy serwer. Dotyczy głównie metryk czasowych.
- **e2e** — end-to-end; testy w prawdziwej przeglądarce, sprawdzające zachowanie.
- **flake / flaky** — test migoczący (raz zielony, raz czerwony bez zmian w kodzie).
- **floor (podłoga)** — sztywny minimalny próg dla metryki, gdy baseline jest tak
  mały, że mnożenie ×1,15 dałoby bezsens (np. TBT).
- **guard (strażnik)** — mały kod przerywający test przy złych warunkach (np.
  `assertPreview` — „to dev, nie preview!").
- **harness** — cała aparatura/rusztowanie do testowania (zestaw testów + helperów),
  nie pojedynczy test.
- **LCP** — Largest Contentful Paint; kiedy pojawia się największy element treści
  (odczuwalne „załadowało się").
- **Lenis** — biblioteka smooth-scrolla u Ciebie; jej timing bywa źródłem flaków
  e2e (stąd helper `scroll.ts` synchronizujący scroll).
- **LHCI** — Lighthouse CI; automatyczny Lighthouse z budżetami w CI.
- **Lighthouse** — narzędzie Google mierzące wydajność/jakość strony (ocena 0–1 +
  metryki).
- **linux** — system serwerów CI (GitHub Actions). Drugi komplet baseline'ów.
- **maxDiffPixelRatio** — dopuszczalny odsetek różniących się pikseli w teście
  wizualnym (u Ciebie domyślnie 0,0005 = 0,05%).
- **preview** — zbudowana, produkcyjna wersja strony (`pnpm preview`), na której
  biegają testy wizualne. Przeciwieństwo deva.
- **prod-smoke** — lekki test przeciw żywej produkcji po deployu.
- **profil (project)** — konfiguracja urządzenia/rozdzielczości w Playwright
  (chromium-1920, webkit-iphone-se…). Każdy ma osobne baseline'y.
- **ratchet (zapadka)** — reguła jakości idąca tylko w jedną stronę (lepiej);
  luzowanie tylko świadomą decyzją.
- **re-baseline** — świadome podniesienie budżetu/wzorca do nowego, uzasadnionego
  poziomu (osobny commit).
- **regresja** — niezamierzone pogorszenie (coś działało/wyglądało dobrze, a
  przestało).
- **retry** — automatyczna druga szansa dla padniętego testu (u Ciebie: 1 w CI,
  0 lokalnie).
- **script:size / total:size** — waga skryptów / wszystkich zasobów strony.
- **smoke test** — bardzo lekkie sprawdzenie „czy w ogóle się otwiera/dymi" (od
  „czy urządzenie nie dymi po włączeniu").
- **snapshot** — inaczej zrzut/screenshot używany jako baseline.
- **TBT** — Total Blocking Time; jak długo strona jest zablokowana JavaScriptem.
- **unit** — najmniejszy test (jedna funkcja/plik), bez przeglądarki.
- **Vitest** — narzędzie do testów unit.
- **visual regression** — testowanie przez porównanie zrzutów z baseline'em.
- **webServer (Playwright)** — automatyczne wstanie preview na porcie 4399 przed
  testami wizualnymi (chyba że `BASE_URL` = produkcja).
- **workflow_dispatch** — ręczne odpalenie workflowu GitHub (przycisk), nie
  automatyczne. Tak działa aktualizacja baseline'ów linux.

---

## 13. Tabele-ściągawki

### 13.1. Komendy — co robią

| Komenda | Co robi | Kiedy |
| --- | --- | --- |
| `pnpm test:unit` | Testy jednostkowe (Vitest), sekundy | Zmiana logiki (i18n, img, platform, config sekcji, schemat CMS) |
| `pnpm test:e2e` | Testy w przeglądarce: funkcjonalne + a11y + SEO | Zmiana zachowania (navbar, scroll, nakładki, formularz, nawigacja) |
| `pnpm test:visual` | Zrzuty vs baseline (wymaga `pnpm build`) | Każda zmiana wyglądu |
| `pnpm test:visual:update` | Regeneruje baseline'y **darwin** | Tylko po obejrzeniu diffu i akceptacji zamierzonej zmiany |
| `pnpm test:smoke:prod` | Lekki test przeciw `https://hadrianm.pl` | Sprawdzenie żywej produkcji |
| `pnpm test` | Wszystko po kolei (unit → e2e → visual) | Przed PR / release (lub skill `/release-check`) |
| `pnpm build` | Buduje `dist/` (produkcyjną wersję) | Przed testami wizualnymi; przed preview |
| `pnpm preview --port 4399` | Serwuje zbudowaną stronę do testów | Automatycznie robi to webServer Playwrighta |

### 13.2. Warstwy — kiedy która i czy miga

| Warstwa | Sprawdza | Szybkość | Miga (flaky)? | Pada zwykle bo… |
| --- | --- | --- | --- | --- |
| Unit | logikę (funkcje) | sekundy | prawie nigdy | realny błąd logiki / zmiana kontraktu |
| E2E funkcjonalny | zachowanie w przeglądarce | wolniej | czasem (timing/Lenis) | regresja zachowania / zmieniona nawigacja |
| A11y (axe) | dostępność | wolniej | rzadko | nowe naruszenie dostępności |
| Wizualny | wygląd (piksele) | wolniej | tak, na znanych klatkach | zmiana wyglądu (zamierzona lub regresja) |
| Lighthouse | wydajność | wolno | metryki czasowe – tak | regresja perf / dryf runnera / re-baseline |
| Prod-smoke | żywa produkcja | wolno | tak (propagacja CDN) | zły deploy / wyścig Cloudflare |

### 13.3. Workflowy CI — rola

| Workflow | Kiedy się odpala | Co robi |
| --- | --- | --- |
| `ci.yml` | push + każdy PR | 3 joby: `quality` (format→lint→typecheck→unit→build), `e2e` (e2e + visual), `lighthouse` (mobile + desktop). To są required checks. |
| `update-visual-baselines.yml` | ręcznie (`workflow_dispatch`) | bot buduje na Linuksie, regeneruje `*-linux.png`, commituje do brancha PR-a |
| `prod-smoke.yml` | push na `main` | czeka na świeży deploy Cloudflare, potem `test:smoke:prod` przeciw produkcji |

### 13.4. Pliki konfiguracyjne — co gdzie ustawiasz

| Plik | Za co odpowiada |
| --- | --- |
| `playwright.config.ts` | profile urządzeń, próg `maxDiffPixelRatio`, ścieżka baseline'ów `{platform}`, webServer 4399, retry |
| `vitest.config.ts` | konfiguracja testów unit |
| `lighthouserc.cjs` | budżety wydajności — profil **mobile** |
| `lighthouserc.desktop.cjs` | budżety wydajności — profil **desktop** |
| `tests/helpers/guards.ts` | strażnicy (`assertPreview`, filtr błędów strony) |
| `tests/helpers/visual.ts`, `scroll.ts`, `freeze.css` | wspólny harness zrzutów, scroll, zamrażanie animacji |
| `.claude/rules/testing.md` | kontrakt „co zmieniasz → co uruchamiasz" + twarde zasady |
| `.claude/settings.json` | blokady maszynowe (edycja baseline'ów, commit/push) |

### 13.5. Reguły „nie panikuj / nie marnuj czasu" (jednym rzutem oka)

| Sytuacja | Odruch |
| --- | --- |
| Czerwony e2e/visual pierwszy raz | **Rerun** tego samego commita — zwykle flake |
| Miga znana klatka hero (05–09 / pixel-5 00–03) | Flake. Kontrola: rerun joba na `main` |
| Diff ~1px „ghosting" pod sekcją | Faza subpikselowa, **nie** regresja |
| LCP ledwo nad budżetem | Dryf runnera — mediana / rerun na `main` |
| script/total nad budżetem | Deterministyczne — realna zmiana wagi; re-baseline lub usuń import |
| Chce się zregenerować baseline „żeby zazielenić" | **Stop.** Tylko po diffie i akceptacji; nigdy na flake |
| Nowe naruszenie a11y | Napraw, **nie** dopisuj do allowlisty |
| Test „nie odpala się: DEV SERVER" | Strażnik. Zrób `pnpm build && pnpm preview` |

---

*Dokument oparty na realnym setupie testów hadrianm.pl (`playwright.config.ts`,
`lighthouserc*.cjs`, `.github/workflows/*`, `tests/`) oraz notatkach projektu.
Źródło decyzji i pełne procedury: `docs/testing-tools-and-environemnts-setup-analysis.md`
i `.claude/rules/testing.md`.*
