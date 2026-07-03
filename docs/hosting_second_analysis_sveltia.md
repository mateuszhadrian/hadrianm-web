# Wdrożenie CMS + hosting + CI/CD — wariant Sveltia (Git-CMS) — instrukcja krok po kroku

> **Dokument wykonawczy.** Zakładam, że robisz to **pierwszy raz w życiu**, więc
> każdy krok jest rozpisany, a skróty rozwijam w nawiasie przy pierwszym użyciu.
> Cel po przejściu całości: kupujesz `hadrianm.pl`, strona żyje na Cloudflare,
> logujesz się do panelu CMS, wchodzisz w zakładkę „Realizacje", wypełniasz
> formularz odwzorowany 1:1 z `src/components/sections/work/work-data.ts`,
> wgrywasz zdjęcia aura/dąb/sielski **z panelu** — i widzisz na `hadrianm.pl`
> dokładnie to, co dziś widzisz lokalnie w przeglądarce.
>
> Decyzje architektoniczne pochodzą z [hosting_first_analysis.md](./hosting_first_analysis.md)
> oraz [photos-management-for-cms-analysis.md](./photos-management-for-cms-analysis.md).
> Wariant alternatywny (Sanity) opisuje [hosting_second_analysis_sanity.md](./hosting_second_analysis_sanity.md).
> Dostosowanie pod klienta: [additional-architecture-adjustment-admin-client.md](./additional-architecture-adjustment-admin-client.md).
>
> Ceny: orientacyjne, stan ~połowa 2026 — sprawdź u dostawcy przed zobowiązaniem.

---

## 0. Słownik pojęć (przeczytaj raz, wracaj w razie potrzeby)

Zanim zaczniesz — kilka skrótów, które będą się powtarzać. Rozwijam je tu raz, w
tekście używam już samych nazw.

- **CMS** (Content Management System, system zarządzania treścią) — panel w
  przeglądarce, w którym dodajesz/edytujesz/usuwasz treść bez dotykania kodu.
- **Git-CMS** — odmiana CMS-a, która **zapisuje treść jako pliki w repozytorium
  Git** (u nas: GitHub). Nie ma osobnej bazy danych — „bazą" jest repozytorium.
- **Sveltia CMS** — konkretny, darmowy Git-CMS (następca Decap/Netlify CMS),
  który tu wdrażamy. To zestaw statycznych plików, które dokładasz do strony.
- **Repozytorium (repo)** — folder Twojego projektu wersjonowany w Git; na
  GitHubie to `mateuszhadrian/hadrianm-web`.
- **Commit** — zapisana „migawka" zmian w repo. Git-CMS przy każdym zapisie
  treści robi commit.
- **SSG** (Static Site Generation, generowanie statycznej strony) — Astro
  buduje gotowe pliki HTML **raz, podczas builda**. Strona nie potrzebuje
  serwera aplikacyjnego, tylko zwykłego hostingu plików (CDN).
- **CDN** (Content Delivery Network, sieć dostarczania treści) — globalna sieć
  serwerów Cloudflare, która trzyma kopie Twoich plików blisko użytkownika.
- **Cloudflare Pages** — usługa Cloudflare do hostowania stron statycznych
  (darmowa, komercyjna, nielimitowany transfer). Tu hostujemy `hadrianm.pl`.
- **Cloudflare Worker** — mały programik uruchamiany na krawędzi CDN Cloudflare.
  Użyjemy jednego Workera jako „pośrednika logowania" (OAuth-proxy).
- **OAuth** (Open Authorization) — standard logowania „przez cudze konto" (tu:
  przez GitHub). **OAuth-proxy** to nasz Worker, który pośredniczy w tym
  logowaniu, żeby panel mógł bezpiecznie gadać z GitHubem.
- **R2** — magazyn plików (obiektowy storage) od Cloudflare, tani, **bez opłat za
  transfer wychodzący (egress)**. Tu trzymamy zdjęcia realizacji.
- **Cloudflare Stream** — usługa Cloudflare do hostowania i odtwarzania wideo
  (opcjonalne, na przyszłość — dziś Realizacje nie mają wideo).
- **Image Transformations** (transformacje obrazów) — funkcja Cloudflare, która
  **zmienia rozmiar/format obrazu w locie** przez specjalny adres URL, bez
  tworzenia osobnych plików. Dzięki niej znikają pliki `-m.webp`.
- **CI/CD** (Continuous Integration / Continuous Delivery, ciągła integracja /
  ciągłe dostarczanie) — automaty, które przy każdym `push` do repo sprawdzają
  kod (CI) i publikują stronę (CD).
- **GitHub Actions** — mechanizm CI/CD wbudowany w GitHub; u nas pełni rolę
  **bramki jakości** (lint, typy, build).
- **DNS** (Domain Name System, system nazw domen) — „książka telefoniczna"
  internetu; łączy `hadrianm.pl` z serwerami Cloudflare.
- **Content Collections** (kolekcje treści) — wbudowany w Astro mechanizm
  trzymania treści jako plików (JSON/Markdown) z walidacją schematu. To on
  zastąpi „sztywną" tablicę w `work-data.ts`.
- **Zod** — biblioteka do opisywania i walidacji „kształtu" danych (jest już w
  projekcie). Użyjemy jej jako schematu kolekcji.
- **Webhook** — automatyczne powiadomienie HTTP: „stało się X, zrób Y".
- **CORS** (Cross-Origin Resource Sharing) — reguły przeglądarki, które pozwalają
  jednej domenie (panel CMS) wysyłać pliki do innej (magazyn R2).

---

## 1. Co dokładnie osiągniemy (i w jakiej kolejności)

Całość dzielę na **8 etapów**. Rekomendowana kolejność (każdy etap działa i
można się zatrzymać po każdym):

1. **Etap 0 — konta i narzędzia.** GitHub, Cloudflare, `wrangler` (narzędzie CLI
   Cloudflare), lokalny build.
2. **Etap 1 — refaktor kodu (bez CMS-a).** Przenosimy Realizacje z `work-data.ts`
   do **Content Collections** (pliki JSON) i wprowadzamy helper `imgAt()`.
   Strona wygląda **identycznie**, ale dane są już „gotowe pod CMS".
3. **Etap 2 — Sveltia CMS.** Dokładamy panel (`/admin`) i konfigurację odwzorowaną
   1:1 z `work-data.ts` (dwujęzyczność PL/EN, ekrany, wyniki, opinia, zakres).
4. **Etap 3 — logowanie (OAuth-proxy na Workerze).** Żebyś mógł się zalogować do
   panelu przez GitHub.
5. **Etap 4 — hosting + CI/CD + domena.** Cloudflare Pages, GitHub Actions jako
   bramka, podpięcie `hadrianm.pl`.
6. **Etap 5 — zdjęcia w R2 + transformacje w locie.** Upload z panelu prosto do
   R2, obrazy skalowane przez URL, **usuwamy pliki `-m`**.
7. **Etap 6 — Cloudflare Stream (opcjonalne, przyszłość).**
8. **Etap 7 — pierwsze wgranie realizacji** aura/dąb/sielski z panelu +
   sprzątanie.

> **Uwaga o współpracy ze mną.** Wszystkie kroki „w kodzie" (Etap 1, częściowo 2
> i 5) mogę wykonać za Ciebie w osobnej sesji Claude Code. Kroki „w chmurze"
> (klikanie w panelu Cloudflare/GitHub) musisz zrobić Ty — dlatego są rozpisane
> maksymalnie dokładnie, klik po kliku.

---

## 2. Architektura docelowa (mapa całości)

```
                    ┌───────────────────────────────────────────┐
                    │  Ty (przeglądarka)                         │
                    │  https://hadrianm.pl/admin  ← panel CMS    │
                    └───────────────┬───────────────────────────┘
                                    │ 1. logowanie przez GitHub
                                    ▼
                    ┌───────────────────────────────────────────┐
                    │  Cloudflare Worker (OAuth-proxy)           │
                    │  sveltia-cms-auth  ← pośrednik logowania   │
                    └───────────────┬───────────────────────────┘
                                    │ 2. zapis treści = commit
                                    ▼
   ┌────────────────────────────────────────────────────────────┐
   │  GitHub: mateuszhadrian/hadrianm-web                        │
   │   src/content/realizacje/*.json   ← treść realizacji        │
   └───────────────┬────────────────────────────────────────────┘
        push │                                   │ upload zdjęć (bezpośrednio)
             ▼                                   ▼
   ┌──────────────────────┐          ┌──────────────────────────┐
   │ GitHub Actions       │          │ Cloudflare R2 (zdjęcia)   │
   │ (bramka: lint/typy/  │          │ media.hadrianm.pl         │
   │  build) — musi przejść│         └───────────┬──────────────┘
   └──────────┬───────────┘                      │ /cdn-cgi/image/...
              ▼                                   ▼  (skalowanie w locie)
   ┌────────────────────────────────────────────────────────────┐
   │  Cloudflare Pages  →  https://hadrianm.pl (strona statyczna)│
   └────────────────────────────────────────────────────────────┘
```

Krótko: **treść** (teksty) żyje w repo jako JSON; **zdjęcia** żyją w R2;
**panel** zapisuje jedno i drugie; **Pages** buduje i serwuje stronę;
**Actions** pilnuje, żeby nie wdrożyć zepsutego kodu.

---

## 3. Etap 0 — konta, narzędzia, punkt wyjścia

**Cel:** mieć wszystkie konta i lokalnie działający build.

1. **Konto GitHub** — masz (`mateuszhadrian`), repo `hadrianm-web` istnieje.
2. **Konto Cloudflare** — załóż darmowe na <https://dash.cloudflare.com/sign-up>.
   Nie podawaj karty — plan darmowy jej nie wymaga.
3. **Node.js 22** — masz (`.nvmrc` = 22). Sprawdź: `node -v`.
4. **pnpm** — masz (`packageManager` w `package.json`). Sprawdź: `pnpm -v`.
5. **wrangler** (CLI, Command Line Interface — narzędzie tekstowe Cloudflare) —
   zainstalujemy dopiero w Etapie 3/5; na razie nic nie rób.
6. **Lokalny build działa** — w katalogu projektu uruchom:

   ```bash
   pnpm install
   pnpm build
   pnpm preview   # otwórz http://localhost:4321 i sprawdź, że Realizacje działają
   ```

Jeśli `pnpm preview` pokazuje Realizacje tak jak dotąd — punkt wyjścia OK.

---

## 4. Etap 1 — refaktor kodu: Realizacje z Content Collections + helper `imgAt()`

**Cel:** strona wygląda tak samo, ale treść realizacji jest już w plikach JSON
(a nie w tablicy w `work-data.ts`), a wybór wariantu obrazka przechodzi przez
jeden helper. To fundament, na którym CMS „usiądzie".

> Ten etap mogę wykonać za Ciebie w całości. Poniżej opis **co i dlaczego**, żebyś
> rozumiał zmianę.

### 4.1 Nowy schemat kolekcji (Zod) — `src/content.config.ts`

Astro 6 czyta definicję kolekcji z pliku `src/content.config.ts`. Definiujemy
kolekcję `realizacje`, ładowaną z plików JSON, ze schematem odwzorowującym
dzisiejszy interfejs `WorkProject`. **Dwujęzyczność zostaje w formacie „pole ma
`{pl, en}`"** — dokładnie jak dziś — dzięki czemu funkcja `localizeProject`
zostaje bez zmian.

```ts
// src/content.config.ts
import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

// „Pole tłumaczone": jedno pole, dwie wersje językowe — jak dziś w work-data.ts.
const localized = z.object({ pl: z.string(), en: z.string() });
const localizedList = z.object({
  pl: z.array(z.string()),
  en: z.array(z.string()),
});

const realizacje = defineCollection({
  // Każda realizacja = jeden plik JSON w src/content/realizacje/
  loader: glob({ pattern: "**/*.json", base: "./src/content/realizacje" }),
  schema: z.object({
    slug: z.string(), // np. "aura" — używane w URL/anchorach
    order: z.number().default(0), // kolejność na liście (mniejsze = wyżej)
    name: z.string(), // np. "Aura Aesthetics"
    year: z.string(), // np. "2025"
    category: localized,
    blurb: localized,
    tags: localizedList,
    intro: localized,
    screens: z
      .array(
        z.object({
          key: z.string(), // "home" | "gallery" | "order" (dowolne)
          label: localized,
          desktop: z.string(), // ścieżka/URL zrzutu desktop
          mobile: z.string(), // ścieżka/URL zrzutu mobile
        }),
      )
      .min(1),
    results: z.array(z.object({ metric: localized, label: localized })),
    quote: localized,
    author: z.string(),
    role: localized,
    scope: localizedList,
    liveUrl: z.string().optional(),
  }),
});

export const collections = { realizacje };
```

### 4.2 Pliki treści — `src/content/realizacje/*.json`

Zamiast trzech obiektów w tablicy `workProjects` powstają trzy pliki:
`src/content/realizacje/aura.json`, `dab.json`, `sielski.json`. Przykład (skrót —
pełne dane przeniesiemy 1:1 z `work-data.ts`):

```json
{
  "slug": "aura",
  "order": 1,
  "name": "Aura Aesthetics",
  "year": "2025",
  "category": { "pl": "Moda & Beauty", "en": "Fashion & Beauty" },
  "blurb": {
    "pl": "Gabinet medycyny estetycznej — delikatna, elegancka odsłona marki premium.",
    "en": "Aesthetic-medicine clinic — a delicate, elegant take on a premium brand."
  },
  "tags": {
    "pl": ["Rezerwacja online", "Nowoczesny UI", "Wzrost zapytań"],
    "en": ["Online booking", "Modern UI", "More enquiries"]
  },
  "intro": { "pl": "…", "en": "…" },
  "screens": [
    {
      "key": "home",
      "label": { "pl": "Strona główna", "en": "Home" },
      "desktop": "/realizacje/aura/desktop.webp",
      "mobile": "/realizacje/aura/mobile.webp"
    }
  ],
  "results": [
    {
      "metric": { "pl": "98/100", "en": "98/100" },
      "label": {
        "pl": "Wynik Google PageSpeed (mobile)",
        "en": "Google PageSpeed score (mobile)"
      }
    }
  ],
  "quote": { "pl": "…", "en": "…" },
  "author": "Marta Kowalczyk",
  "role": { "pl": "Właścicielka, Aura Aesthetics", "en": "Owner, Aura Aesthetics" },
  "scope": {
    "pl": ["Projekt UI/UX", "Wdrożenie frontendowe"],
    "en": ["UI/UX design", "Frontend build"]
  }
}
```

### 4.3 Zmiana w `work-data.ts` — zostaje tylko typ i `localizeProject`

Usuwamy tablicę `workProjects` (dane idą do JSON-ów). Zostawiamy **typy** i
funkcję `localizeProject` (dopasowujemy typ wejściowy do danych z kolekcji).
`localizeProject` w środku nie zmienia logiki — nadal czyta `p.category[lang]`
itd. To celowe: dzięki formatowi „pole `{pl,en}`" nic w tej funkcji nie pęka.

### 4.4 Zmiana w `Work.astro` — czytamy kolekcję zamiast tablicy

```diff
- import { workProjects, localizeProject } from "./work-data";
+ import { getCollection } from "astro:content";
+ import { localizeProject } from "./work-data";
  …
- const projects = workProjects.map((p) => localizeProject(p, lang));
+ const entries = await getCollection("realizacje");
+ const projects = entries
+   .map((e) => e.data)
+   .sort((a, b) => a.order - b.order)
+   .map((p) => localizeProject(p, lang));
```

### 4.5 Helper `imgAt()` — jedno miejsce prawdy o źródle obrazów

Zgodnie z [photos-management-for-cms-analysis.md](./photos-management-for-cms-analysis.md) §6
tworzymy `src/lib/img.ts`. **Dziś** zwraca plik `-m` (nic się wizualnie nie
zmienia). **W Etapie 5** podmienimy tylko wnętrze tej funkcji na transformacje
Cloudflare — bez ruszania komponentów.

```ts
// src/lib/img.ts — jedyne miejsce, które wie „skąd brać obrazek w danym rozmiarze"
export function imgAt(src: string, width: "full" | "mobile"): string {
  // FAZA DZISIEJSZA: pliki w repo z sufiksem -m (desktop.webp → desktop-m.webp)
  return width === "mobile" ? src.replace(/\.webp$/, "-m.webp") : src;
}
```

I podmieniamy zaszytą konwencję w `WorkDeviceDuo.astro`:

```diff
- const mobileSrc = (src: string) => src.replace(/\.webp$/, "-m.webp");
+ import { imgAt } from "@/lib/img";
  …
- <source media="(max-width: 760px)" srcset={mobileSrc(desktop)} />
+ <source media="(max-width: 760px)" srcset={imgAt(desktop, "mobile")} />
  …
- <source media="(max-width: 760px)" srcset={mobileSrc(mobile)} />
+ <source media="(max-width: 760px)" srcset={imgAt(mobile, "mobile")} />
```

### 4.6 Dodatkowe uproszczenie — kafelek bierze obraz z ekranu „home"

Dziś `WorkProject.img` duplikuje ekran `home`. Żeby w panelu **nie wgrywać tego
samego zrzutu dwa razy**, kafelek galerii będzie brał obraz z ekranu o `key:
"home"` (a jeśli go nie ma — z pierwszego ekranu). Usuwamy pole `img` ze
schematu i z `localizeProject`, a `WorkCard` dostaje `img` wyliczony z `screens`.
To drobna zmiana, która realnie skraca formularz w CMS.

### 4.7 Weryfikacja Etapu 1

```bash
pnpm typecheck   # astro check — schemat Zod musi się zgadzać z JSON-ami
pnpm build
pnpm preview     # Realizacje muszą wyglądać 1:1 jak przed refaktorem
```

Jeśli wygląda identycznie — **treść jest już „w plikach", gotowa dla CMS-a.**

---

## 5. Etap 2 — Sveltia CMS: panel odwzorowany 1:1 z `work-data.ts`

**Cel:** pod adresem `/admin` pojawia się panel z zakładką „Realizacje" i
formularzem mającym te same pola co `work-data.ts`.

Sveltia to **dwa statyczne pliki** wrzucone do `public/admin/` (Astro kopiuje
`public/` do gotowej strony 1:1, więc trafią pod `/admin`).

### 5.1 `public/admin/index.html`

```html
<!doctype html>
<html lang="pl">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="noindex" />
    <title>Panel treści — hadrianm.pl</title>
  </head>
  <body>
    <!-- Sveltia CMS ładuje się z sieci CDN jako moduł JavaScript -->
    <script src="https://unpkg.com/@sveltia/cms/dist/sveltia-cms.js"></script>
  </body>
</html>
```

### 5.2 `public/admin/config.yml` — serce konfiguracji

To tu opisujemy **backend** (gdzie zapisywać treść) i **kolekcje** (jakie pola
ma formularz). Wersja startowa (media jeszcze w repo — R2 dokładamy w Etapie 5):

```yaml
# ── Gdzie zapisywana jest treść ──────────────────────────────────────────
backend:
  name: github
  repo: mateuszhadrian/hadrianm-web # właściciel/nazwa repo
  branch: main
  # base_url wskaże nasz Worker-logowania (uzupełnimy w Etapie 3):
  # base_url: https://sveltia-cms-auth.<twój-subdomena>.workers.dev

# ── Gdzie trafiają zdjęcia (na teraz: do repo; w Etapie 5 → R2) ───────────
media_folder: "public/realizacje" # fizyczna ścieżka w repo
public_folder: "/realizacje" # ścieżka w adresie URL na stronie

# ── Dwujęzyczność panelu jest zrobiona przez pola {pl,en} (patrz niżej) ───

collections:
  - name: "realizacje"
    label: "Realizacje"
    label_singular: "Realizacja"
    folder: "src/content/realizacje" # tu leżą pliki JSON z Etapu 1
    extension: "json"
    format: "json"
    create: true # pozwól DODAWAĆ nowe realizacje
    delete: true # pozwól USUWAĆ realizacje
    identifier_field: "name" # co pokazać na liście wpisów
    slug: "{{fields.slug}}" # nazwa pliku = wartość pola slug
    summary: "{{fields.name}} ({{fields.year}})"
    fields:
      - { label: "Slug (adres, np. aura)", name: "slug", widget: "string" }
      - {
          label: "Kolejność (mniejsze = wyżej)",
          name: "order",
          widget: "number",
          value_type: "int",
          default: 10,
        }
      - { label: "Nazwa", name: "name", widget: "string" }
      - { label: "Rok", name: "year", widget: "string" }

      # ── Pola tłumaczone: object z podpolami pl/en ──
      - label: "Kategoria"
        name: "category"
        widget: "object"
        fields:
          - { label: "Polski", name: "pl", widget: "string" }
          - { label: "English", name: "en", widget: "string" }

      - label: "Krótki opis (blurb)"
        name: "blurb"
        widget: "object"
        fields:
          - { label: "Polski", name: "pl", widget: "text" }
          - { label: "English", name: "en", widget: "text" }

      - label: "Tagi"
        name: "tags"
        widget: "object"
        fields:
          - { label: "Polski", name: "pl", widget: "list", field: { label: "Tag", name: "tag", widget: "string" } }
          - { label: "English", name: "en", widget: "list", field: { label: "Tag", name: "tag", widget: "string" } }

      - label: "Wprowadzenie (intro)"
        name: "intro"
        widget: "object"
        fields:
          - { label: "Polski", name: "pl", widget: "text" }
          - { label: "English", name: "en", widget: "text" }

      # ── Ekrany: lista, każdy ma DWA zrzuty (desktop + mobile) ──
      - label: "Ekrany (podgląd na urządzeniach)"
        name: "screens"
        widget: "list"
        label_singular: "Ekran"
        summary: "{{fields.label.pl}}"
        fields:
          - { label: "Klucz (home/gallery/order)", name: "key", widget: "string" }
          - label: "Etykieta"
            name: "label"
            widget: "object"
            fields:
              - { label: "Polski", name: "pl", widget: "string" }
              - { label: "English", name: "en", widget: "string" }
          - { label: "Zrzut DESKTOP", name: "desktop", widget: "image" }
          - { label: "Zrzut MOBILE", name: "mobile", widget: "image" }

      # ── Liczby i wyniki ──
      - label: "Wyniki (liczby)"
        name: "results"
        widget: "list"
        label_singular: "Wynik"
        fields:
          - label: "Metryka"
            name: "metric"
            widget: "object"
            fields:
              - { label: "Polski", name: "pl", widget: "string" }
              - { label: "English", name: "en", widget: "string" }
          - label: "Opis"
            name: "label"
            widget: "object"
            fields:
              - { label: "Polski", name: "pl", widget: "string" }
              - { label: "English", name: "en", widget: "string" }

      # ── Opinia ──
      - label: "Cytat / opinia"
        name: "quote"
        widget: "object"
        fields:
          - { label: "Polski", name: "pl", widget: "text" }
          - { label: "English", name: "en", widget: "text" }
      - { label: "Autor opinii", name: "author", widget: "string" }
      - label: "Rola autora"
        name: "role"
        widget: "object"
        fields:
          - { label: "Polski", name: "pl", widget: "string" }
          - { label: "English", name: "en", widget: "string" }

      # ── Zakres prac ──
      - label: "Zakres prac (scope)"
        name: "scope"
        widget: "object"
        fields:
          - { label: "Polski", name: "pl", widget: "list", field: { label: "Punkt", name: "item", widget: "string" } }
          - { label: "English", name: "en", widget: "list", field: { label: "Item", name: "item", widget: "string" } }

      - { label: "Link do strony na żywo (opcjonalny)", name: "liveUrl", widget: "string", required: false }
```

> **Dlaczego pola `{pl,en}` zamiast „wbudowanej i18n" Sveltii?** Bo dzięki temu
> **plik JSON ma dokładnie ten sam kształt co dzisiejszy `work-data.ts`**, a
> `localizeProject` i cała reszta kodu działają bez zmian. Wbudowana i18n Sveltii
> zapisałaby dane inaczej (osobno per język), co wymusiłoby przepisanie logiki.
> Ten wariant jest prostszy i w 100% zgodny z tym, co masz.

### 5.3 Weryfikacja Etapu 2 (lokalnie, jeszcze bez logowania)

Panel wymaga logowania (Etap 3), więc pełny test zrobisz po Etapie 3–4. Na razie
sprawdź, że pliki są na miejscu i build przechodzi:

```bash
pnpm build && pnpm preview   # wejdź na http://localhost:4321/admin — zobaczysz ekran logowania
```

---

## 6. Etap 3 — logowanie do panelu (OAuth-proxy na Cloudflare Worker)

**Cel:** móc kliknąć „Login with GitHub" w panelu i wejść do środka.

Panel Sveltii zapisuje treść na GitHubie w Twoim imieniu — musi więc bezpiecznie
zalogować Cię przez GitHub. Robi to mały Worker `sveltia-cms-auth` (pośrednik).

### 6.1 Wdrożenie Workera `sveltia-cms-auth`

1. Wejdź na <https://github.com/sveltia/sveltia-cms-auth> i użyj przycisku
   **„Deploy to Cloudflare Workers"** (albo sklonuj repo i uruchom `wrangler deploy`).
2. Po wdrożeniu zapisz adres Workera, np.
   `https://sveltia-cms-auth.twoj-login.workers.dev`.

### 6.2 Rejestracja aplikacji OAuth w GitHub

1. Wejdź na <https://github.com/settings/applications/new>.
2. Wypełnij:
   - **Application name:** `Sveltia CMS — hadrianm.pl`
   - **Homepage URL:** `https://hadrianm.pl` (na razie może być `http://localhost:4321`)
   - **Authorization callback URL:** `https://sveltia-cms-auth.twoj-login.workers.dev/callback`
     (adres Workera z 6.1 + `/callback`).
3. Kliknij **Register application**, potem **Generate a new client secret**.
4. Zapisz **Client ID** i **Client Secret** (sekret zobaczysz raz).

### 6.3 Wpięcie sekretów do Workera

W panelu Cloudflare: **Workers & Pages → sveltia-cms-auth → Settings →
Variables and Secrets** dodaj:

- `GITHUB_CLIENT_ID` = Client ID z GitHuba
- `GITHUB_CLIENT_SECRET` = Client Secret (zaznacz **Encrypt** / „Secret")
- `ALLOWED_DOMAINS` = `hadrianm.pl,localhost` (kto może korzystać z logowania)

Zapisz i **Deploy** (wdróż ponownie, żeby zmienne weszły w życie).

### 6.4 Wskazanie Workera w `config.yml`

Odkomentuj/uzupełnij `base_url` w `public/admin/config.yml`:

```yaml
backend:
  name: github
  repo: mateuszhadrian/hadrianm-web
  branch: main
  base_url: https://sveltia-cms-auth.twoj-login.workers.dev
```

Zrób `git push`. Od teraz `/admin` pozwala się zalogować przez GitHub.

> **Odpowiedź na Twoje pytanie (pkt 8): czy klient musi mieć osobny GitHub?**
> Dla **Twojej** strony — nie, logujesz się swoim GitHubem, bo jesteś właścicielem
> repo. Dla **klienta** są dwie drogi: (a) repo zostaje u Ciebie, a klient nie
> dotyka GitHuba wcale (dostaje panel schowany za OAuth-proxy z ograniczeniem);
> (b) klient ma własne konto GitHub z rolą wyłącznie do repo treści. Pełne
> rozstrzygnięcie i konsekwencje opisuje
> [additional-architecture-adjustment-admin-client.md](./additional-architecture-adjustment-admin-client.md).

---

## 7. Etap 4 — hosting (Cloudflare Pages) + CI/CD + domena

**Cel:** strona i panel żyją pod `hadrianm.pl`, a każdy `push` przechodzi bramkę
jakości przed publikacją.

### 7.1 Bramka jakości — GitHub Actions

Dodaj plik `.github/workflows/ci.yml` (dokładnie jak w
[hosting_first_analysis.md](./hosting_first_analysis.md) §5.2):

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm format:check
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm build
```

W GitHub: **Settings → Branches → Add branch protection rule** na `main`,
zaznacz „Require status checks to pass" → wybierz `quality`. Efekt: na produkcję
nie trafi kod, który nie przeszedł bramki.

### 7.2 Podpięcie repo do Cloudflare Pages

1. Cloudflare: **Workers & Pages → Create → Pages → Connect to Git**.
2. Wybierz repo `hadrianm-web`, branch produkcyjny `main`.
3. Ustawienia builda:
   - **Framework preset:** Astro
   - **Build command:** `pnpm build`
   - **Build output directory:** `dist`
   - **Environment variable** `NODE_VERSION` = `22`
4. **Save and Deploy.** Po chwili dostaniesz adres `https://hadrianm-web.pages.dev`.
5. Wejdź na `…pages.dev` (strona) i `…pages.dev/admin` (panel) — zaloguj się i
   sprawdź, że widzisz zakładkę „Realizacje".

> **Podział ról:** deploy robi Cloudflare Pages (push na `main` → build → publikacja;
> push na inny branch/PR → osobny „preview" URL do podglądu). GitHub Actions
> **nie** publikuje — tylko sprawdza jakość. Tak jest taniej i prościej.

### 7.3 Domena `hadrianm.pl`

1. **Kup domenę.** Rekomendacja: **Cloudflare Registrar** (sprzedaje po cenie
   kosztowej). W panelu Cloudflare: **Domain Registration → Register Domains** →
   wpisz `hadrianm.pl`. (Jeśli `.pl` nie jest tam dostępne, kup u taniego
   rejestratora i przenieś DNS na Cloudflare — patrz krok 2.)
2. **DNS na Cloudflare.** Jeśli kupiłeś gdzie indziej: w Cloudflare **Add a site
   → hadrianm.pl**, a u rejestratora ustaw serwery nazw (nameservery) podane
   przez Cloudflare.
3. **Podłącz domenę do Pages.** Pages → Twój projekt → **Custom domains → Set up
   a custom domain** → `hadrianm.pl`, powtórz dla `www.hadrianm.pl`. SSL
   (certyfikat HTTPS) załatwi się automatycznie.
4. Zaktualizuj w GitHubie **Homepage URL** aplikacji OAuth na `https://hadrianm.pl`
   (nie jest krytyczne, ale porządkuje).

Po tym kroku masz **działającą stronę i panel pod `hadrianm.pl`** — treść możesz
edytować, zdjęcia na razie lądują w repo. Etap 5 przenosi je do R2 i włącza
skalowanie w locie.

---

## 8. Etap 5 — zdjęcia w R2 + transformacje w locie (usuwamy pliki `-m`)

**Cel:** upload z panelu trafia prosto do R2, obrazy skalują się przez URL, a
pliki `-m.webp` i skrypt `optimize-realizacje.mjs` znikają.

### 8.1 Utwórz magazyn R2

1. Cloudflare: **R2 → Create bucket** → nazwa np. `hadrianm-media`.
   - **Location / jurisdiction:** wybierz **EU** (dane w Unii — spójne z RODO).
2. **Podłącz własną domenę do bucketa** (żeby transformacje działały na Twojej
   strefie): R2 → `hadrianm-media` → **Settings → Public access → Custom Domains
   → Connect Domain** → `media.hadrianm.pl`. Cloudflare doda rekord DNS.
   - Efekt: pliki będą pod `https://media.hadrianm.pl/<nazwa-pliku>`.

### 8.2 Klucze dostępu do R2 (dla uploadu z panelu)

1. R2 → **Manage R2 API Tokens → Create API token**.
2. Uprawnienia: **Object Read & Write**, ograniczone do bucketa `hadrianm-media`.
3. Zapisz **Access Key ID** i **Secret Access Key** oraz **Account ID** (widoczne
   w panelu R2). Sekretu użyjesz w panelu przy pierwszym uploadzie — **nie**
   wpisujemy go do pliku konfiguracyjnego.

### 8.3 Reguła CORS na buckecie (żeby panel mógł wysyłać pliki)

R2 → `hadrianm-media` → **Settings → CORS Policy → Add**:

```json
[
  {
    "AllowedOrigins": ["https://hadrianm.pl", "http://localhost:4321"],
    "AllowedMethods": ["GET", "PUT"],
    "AllowedHeaders": ["*"]
  }
]
```

### 8.4 Wskaż R2 jako magazyn mediów w `config.yml`

Zamień w `public/admin/config.yml` blok `media_folder/public_folder` na:

```yaml
media_libraries:
  cloudflare_r2:
    account_id: "TWOJE_ACCOUNT_ID"
    access_key_id: "TWOJE_ACCESS_KEY_ID"
    bucket: "hadrianm-media"
    public_url: "https://media.hadrianm.pl" # własna domena z 8.1
    prefix: "realizacje/" # pliki wewnątrz bucketa w podfolderze
    jurisdiction: "eu"
```

> **Secret Access Key NIE trafia do pliku.** Sveltia poprosi o niego w panelu przy
> pierwszym wgraniu zdjęcia i przechowa go bezpiecznie w pamięci przeglądarki.
> Upload idzie **bezpośrednio z przeglądarki do R2** (podpisany AWS Signature
> V4 — standard uwierzytelniania żądań do magazynów typu S3).

Od teraz obraz wgrany w panelu zapisuje się w R2, a w JSON-ie realizacji ląduje
adres typu `https://media.hadrianm.pl/realizacje/aura-home.webp`.

### 8.5 Włącz transformacje obrazów na strefie

1. Cloudflare → Twoja domena `hadrianm.pl` → **Images → Transformations**.
2. Włącz **Enable transformations** dla strefy.
3. W **Sources / Origins** upewnij się, że dozwolone jest czytanie obrazów z
   `media.hadrianm.pl` (ta sama strefa Cloudflare, więc domyślnie OK).

### 8.6 Podmień wnętrze helpera `imgAt()` na transformacje

To jedyna zmiana w kodzie w tym etapie — reszta (markup) zostaje:

```ts
// src/lib/img.ts — FAZA DOCELOWA: skalowanie w locie przez Cloudflare
export function imgAt(src: string, width: "full" | "mobile"): string {
  const w = width === "mobile" ? 320 : 960; // szerokości pod telefon / desktop
  // format=auto → przeglądarka dostaje AVIF/WebP automatycznie
  return `/cdn-cgi/image/width=${w},format=auto/${src}`;
}
```

Uwaga: transformacje działają też na `<img src={desktop}>` — możesz owinąć w
`imgAt(desktop, "full")`, żeby i wersja desktopowa była skalowana/serwowana jako
AVIF/WebP. To drobne rozszerzenie diffa w `WorkDeviceDuo.astro`.

### 8.7 Weryfikacja + sprzątanie

1. `pnpm build && pnpm preview` — Realizacje wyglądają jak dotąd, ale w
   `Network` (narzędzia deweloperskie przeglądarki) adresy obrazów zawierają
   `/cdn-cgi/image/…`.
2. Gdy potwierdzisz, że zdjęcia idą z R2/transformacji:
   - **usuń** pliki `public/realizacje/*-m.webp`,
   - **usuń** skrypt `scripts/optimize-realizacje.mjs` i wpis `optimize:realizacje`
     z `package.json`,
   - `docs/testing-data/` **zostaw** (lokalne źródło zrzutów do ponownego wgrania).

> **Dlaczego to kasuje problem, a nie przenosi:** trzymasz **jeden** oryginał na
> R2, a każdy rozmiar powstaje z adresu URL. Zmiana progu 760px czy szerokości =
> zmiana liczby w `imgAt()`, nie regeneracja plików. Znika cała klasa błędów
> „brak wariantu -m → 404".

---

## 9. Etap 6 — Cloudflare Stream (opcjonalne, na przyszłość)

Realizacje **dziś nie mają wideo**, więc to sekcja „gotowe do włączenia".

Gdy zechcesz dodać film do realizacji (np. 15–30 s klip):

1. Cloudflare → **Stream → Upload video**; dostaniesz identyfikator wideo i
   gotowy odtwarzacz (`<iframe>` / `<stream>`).
2. W schemacie kolekcji (Etap 1) dodaj pole `video` (opcjonalne, string = id lub
   URL), a w `config.yml` — pole `video` (widget `string` lub `file`).
3. W `WorkDetail.astro` wyrenderuj odtwarzacz Stream, gdy pole niepuste.

**Model kosztu Stream:** ~5 USD (dolarów amerykańskich) / 1000 minut
przechowywania + ~1 USD / 1000 minut odtworzeń. Dla portfolio to grosze; egress
(transfer) w cenie. Alternatywa budżetowa: **Bunny Stream**; na absolutny start:
**YouTube/Vimeo unlisted** (0 zł, ale obcy branding).

---

## 10. Etap 7 — pierwsze wgranie realizacji z panelu + weryfikacja końcowa

**Cel:** przejść pełną ścieżkę „jak klient", żeby ją oswoić.

1. Wejdź na `https://hadrianm.pl/admin`, zaloguj się przez GitHub.
2. Zakładka **Realizacje → New Realizacja** (lub edycja istniejącej `aura`).
3. Wypełnij pola PL i EN, ustaw `slug` i `order`.
4. Przy każdym ekranie wgraj **dwa** zrzuty: DESKTOP i MOBILE (z
   `docs/testing-data/test-projects/…`). Pierwszy upload poprosi o Secret Access
   Key do R2 — wklej go raz.
5. **Publish** (Save). Sveltia zrobi commit do repo + wgra zdjęcia do R2.
6. Poczekaj, aż GitHub Actions przejdzie (bramka) i Cloudflare Pages przebuduje
   stronę (kilkadziesiąt sekund–kilka minut).
7. Wejdź na `https://hadrianm.pl/#work` — realizacja jest na stronie, zdjęcia z
   R2, skalowane w locie.

Jeśli to działa — **cel dokumentu osiągnięty**: dodajesz/edytujesz/usuwasz
realizacje wyłącznie z panelu, a strona się aktualizuje.

---

## 11. Checklist końcowy

- [ ] Etap 1: kolekcja `realizacje` + JSON-y + `imgAt()`; build 1:1 jak wcześniej.
- [ ] Etap 2: `public/admin/index.html` + `config.yml` z pełnym modelem realizacji.
- [ ] Etap 3: Worker `sveltia-cms-auth` + aplikacja OAuth GitHub + `base_url`.
- [ ] Etap 4: `ci.yml` + branch protection; Pages podpięte; domena `hadrianm.pl`.
- [ ] Etap 5: bucket R2 + domena `media.hadrianm.pl` + CORS + `media_libraries`
      + transformacje włączone + `imgAt()` przełączony; pliki `-m` i skrypt usunięte.
- [ ] Etap 6: (opcjonalnie) Stream przygotowany.
- [ ] Etap 7: realizacja wgrana z panelu widoczna na `hadrianm.pl`.

---

## 12. Koszty (orientacyjnie, miesięcznie)

| Pozycja                     | Koszt                                                    |
| --------------------------- | -------------------------------------------------------- |
| Cloudflare Pages (hosting)  | **0 zł** (komercyjnie, nielimitowany transfer)           |
| Cloudflare Worker (logowanie) | **0 zł** (plan darmowy: 100 000 żądań/dzień)           |
| Cloudflare R2 (zdjęcia)     | **0 zł** przy portfolio (10 GB gratis, egress 0 zł)      |
| Image Transformations       | **0 zł** przy portfolio (do ~5 000 transformacji/mies.)  |
| GitHub Actions (bramka)     | **0 zł** (repo prywatne: 2000 min/mies.)                 |
| Sveltia CMS                 | **0 zł** (open source)                                   |
| Cloudflare Stream (wideo)   | ~0–kilka USD, tylko jeśli włączysz                       |
| Domena `hadrianm.pl`        | ~50–70 zł/rok (u rejestratora)                           |
| **Razem recurring**         | **~0 zł/mies.** + domena rocznie                         |

---

## 13. Najczęstsze problemy (troubleshooting)

- **„Login with GitHub" nie działa / błąd redirect.** Sprawdź, czy
  `Authorization callback URL` w aplikacji OAuth to dokładnie `…workers.dev/callback`,
  a `base_url` w `config.yml` = adres Workera bez `/callback`.
- **Panel nie widzi repo / „Not Found".** `repo:` musi być `właściciel/nazwa`
  (`mateuszhadrian/hadrianm-web`), branch `main` istnieje, a Twój GitHub ma dostęp.
- **Upload zdjęcia się nie udaje.** Sprawdź CORS na buckecie (8.3), poprawność
  `account_id`/`access_key_id` i czy wkleiłeś Secret Access Key przy pierwszym uploadzie.
- **Obraz nie skaluje się (`/cdn-cgi/image` daje błąd).** Włącz Transformations
  na strefie (8.5) i upewnij się, że `media.hadrianm.pl` jest na tej samej
  strefie Cloudflare co strona.
- **`astro check` zgłasza błąd schematu.** JSON realizacji musi zgadzać się ze
  schematem Zod z `src/content.config.ts` (np. brakujące `en` w którymś polu).
- **Zmiana treści nie pojawia się na stronie.** To Git-CMS — po zapisie musi
  przejść bramka Actions i przebudowa Pages. Zajrzyj do zakładki „Deployments"
  w Pages.

---

## Źródła

- [Sveltia CMS — dokumentacja](https://sveltiacms.app/en/docs)
- [Sveltia CMS Auth (OAuth-proxy na Workers)](https://github.com/sveltia/sveltia-cms-auth)
- [Sveltia CMS — integracja z Cloudflare R2](https://sveltiacms.app/en/docs/media/cloudflare-r2)
- [Cloudflare — transformacje obrazów przez URL](https://developers.cloudflare.com/images/transform-images/transform-via-url/)
- [Cloudflare — podłączenie R2 pod własną domenę](https://developers.cloudflare.com/rules/origin-rules/tutorials/point-to-r2-bucket-with-custom-domain/)
- [Decap CMS — konfiguracja i i18n (zgodne z Sveltią)](https://decapcms.org/docs/configuration-options/)
- [Astro — Content Collections](https://docs.astro.build/en/guides/content-collections/)
