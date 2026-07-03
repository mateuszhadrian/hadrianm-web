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

> **Ważne — dlaczego NIE Cloudflare Registrar.** Cloudflare Registrar **nie
> sprzedaje domen z końcówką `.pl`** (obsługuje tylko wybrane rozszerzenia, a
> `.pl` należy do polskiego rejestru NASK, którego Cloudflare nie oferuje). Domenę
> `hadrianm.pl` **kupujesz więc u polskiego rejestratora** (np. `nazwa.pl` albo
> `home.pl` — u obu `.pl` bywa na pierwszy rok w promocji za grosze, rzędu 1–2 zł),
> a **DNS delegujesz do Cloudflare przez zmianę serwerów nazw (nameserwerów)**.
> Domena zostaje zarejestrowana u polskiego rejestratora; Cloudflare tylko
> zarządza DNS-em, hostingiem (Pages) i transformacjami — dokładnie to, czego
> potrzebujemy. To standardowy, w pełni wspierany scenariusz.

> **Uwaga o cenie odnowienia.** Promocja „1–2 zł" dotyczy zwykle **pierwszego
> roku**. Sprawdź **cenę odnowienia** (drugi rok potrafi kosztować ~60–100 zł
> brutto) — to ona jest realnym kosztem długoterminowym. Nie ma to wpływu na
> resztę architektury (hosting/CMS zostają za 0 zł).

Kolejność jest ważna, bo `.pl` ma jedną pułapkę (DNSSEC — patrz krok 3). Rób
**dokładnie w tej kolejności**, żeby strona/e-mail nie przestały działać.

#### Krok 1 — dodaj domenę do Cloudflare (jeszcze przed zmianą nameserwerów)

1. Kup `hadrianm.pl` u wybranego rejestratora (`nazwa.pl` lub `home.pl`).
2. W panelu Cloudflare kliknij **Add a site / Add a domain**, wpisz gołą domenę
   `hadrianm.pl`, wybierz plan **Free**.
3. Cloudflare **zeskanuje istniejące rekordy DNS** i pokaże je do zatwierdzenia.
   Dla świeżo kupionej domeny (bez poczty, bez starej strony) lista będzie
   praktycznie pusta — to normalne. Kliknij dalej.
   - _Gdybyś kiedyś przenosił domenę, która MA już pocztę_ — najpierw upewnij się,
     że rekordy **MX/TXT/A** są po stronie Cloudflare, zanim ruszysz nameserwery,
     inaczej poczta padnie. Tu (nowa domena) nie dotyczy.
4. Cloudflare przydzieli Ci **dokładnie 2 serwery nazw**, np.
   `xxx.ns.cloudflare.com` i `yyy.ns.cloudflare.com`. **Zapisz je** — wklejasz je
   u rejestratora w kroku 4.

#### Krok 2 — (opcjonalnie, na przyszłość) rekordy zostaw Cloudflare

Nie musisz nic dodawać ręcznie — po podpięciu domeny do Pages (krok 5) Cloudflare
sam utworzy potrzebne rekordy. Przejdź dalej.

#### Krok 3 — WYŁĄCZ DNSSEC u rejestratora (pułapka `.pl`)

**To najczęstsza przyczyna „domena nie działa po przeniesieniu".** Jeśli domena
ma włączony **DNSSEC** (podpisywanie DNS), w rejestrze NASK istnieje tzw. **rekord
DS**. Gdy zmienisz nameserwery na Cloudflare, a stary rekord DS zostanie,
resolvery nadal będą oczekiwać starego podpisu → domena zwróci **SERVFAIL** i
będzie niedostępna.

- **Świeżo kupiona domena** zwykle **nie ma** włączonego DNSSEC — wtedy ten krok
  po prostu potwierdzasz jako „nic do zrobienia".
- Jeśli DNSSEC jest włączony: **wyłącz go / usuń rekord DS u rejestratora**
  (`nazwa.pl` i `home.pl` mają opcję DNSSEC w panelu domeny) i **odczekaj**, aż
  zmiana się rozejdzie, zanim zmienisz nameserwery. Cloudflare nie nadpisze
  cudzego rekordu DS — musi zniknąć po stronie rejestratora.
- DNSSEC możesz **później włączyć ponownie już w Cloudflare** (Cloudflare wygeneruje
  nowy rekord DS, który wklejasz u rejestratora). To opcjonalne — na start
  spokojnie zostaw wyłączony.

> _Dokładnej ścieżki „gdzie kliknąć, by wyłączyć DNSSEC" nie podaję jako pewnej —
> zweryfikuj przełącznik na żywo w panelu domeny (szukaj hasła **DNSSEC**)._

#### Krok 4 — ustaw nameserwery Cloudflare u rejestratora

**Jeśli kupiłeś w `nazwa.pl`:**

1. Zaloguj się do **Panel Klienta** → menu **Usługi → Domeny**.
2. Znajdź `hadrianm.pl` na liście i kliknij **„konfiguruj"** (po prawej stronie
   nazwy).
3. Wejdź w sekcję/zakładkę **„Zewnętrzne serwery DNS"**.
4. Wpisz **oba** nameserwery Cloudflare z kroku 1.4 (minimum 2; dla `.pl` można
   podać do 9) i zatwierdź przyciskiem **„ZMIEŃ"**.
   - Wybór „zewnętrznych serwerów DNS" **zastępuje** domyślny DNS `nazwa.pl` —
     od tej chwili DNS domeny prowadzi Cloudflare.
5. Propagacja: `nazwa.pl` deklaruje **do 72 h** (zwykle znacznie szybciej).

**Jeśli kupiłeś w `home.pl`:**

1. Zaloguj się do **Panel Klienta** (panel.home.pl) → menu **Domeny** (po lewej).
2. Wybierz `hadrianm.pl` z listy (status w kolumnie „Status operacji" musi być
   **„Aktywna"**).
3. Kliknij **„Działania"** → **„Ustaw zewnętrzne serwery DNS"**.
4. Wpisz **oba** nameserwery Cloudflare z kroku 1.4 (minimum 2) i zatwierdź
   **„OK"**, by uruchomić delegację.
5. Delegacja trwa **do ~30 h**; w tym oknie strona/poczta pod domeną może chwilowo
   nie działać, dopóki rekordy nie ustawią się po stronie Cloudflare.

#### Krok 5 — poczekaj na „Active" i podłącz domenę do Pages

1. Wróć do Cloudflare (zakładka Twojej domeny) i kliknij **„Check nameservers"**.
   Cloudflare przyśle e-mail i pokaże status **„Active"**, gdy delegacja zadziała
   (zwykle w ciągu godziny–do 24 h, choć rejestrator dopuszcza dłużej — patrz
   wyżej).
2. Gdy domena jest **Active**: Pages → Twój projekt → **Custom domains → Set up a
   custom domain** → `hadrianm.pl`, powtórz dla `www.hadrianm.pl`. Cloudflare sam
   doda rekordy DNS i wystawi certyfikat **SSL/HTTPS** automatycznie.
3. Zaktualizuj w GitHubie **Homepage URL** aplikacji OAuth (Etap 3) na
   `https://hadrianm.pl` (nie jest krytyczne, ale porządkuje).

Po tym kroku masz **działającą stronę i panel pod `hadrianm.pl`** — treść możesz
edytować, zdjęcia na razie lądują w repo. Etap 5 przenosi je do R2 i włącza
skalowanie w locie.

---

### 7.4 „Czy brak `hadrianm.com` to problem? Stracę klientów zza granicy?"

**Krótka odpowiedź: nie, dla Twojego przypadku to bezpieczny wybór — a nie
pułapka.** Rozbicie na czynniki:

- **Dla polskich klientów `.pl` jest wręcz atutem.** Google traktuje końcówkę
  `.pl` jako **silny sygnał geolokalizacji na Polskę** — automatycznie, bez żadnych
  ustawień. Domena `.pl` buduje też zaufanie u polskiego odbiorcy („to lokalna
  firma"). Skoro Twoi klienci to głównie Polacy — `.pl` gra na Twoją korzyść.
- **Dla pojedynczych klientów zza granicy `.pl` NIE jest blokadą.** Owszem, `.com`
  brzmi bardziej „międzynarodowo/neutralnie", a `.pl` może się kojarzyć wyłącznie
  z jednym krajem — ale **rozszerzenie domeny to dziś drugorzędny czynnik**.
  O widoczności za granicą decyduje przede wszystkim **język i lokalizacja treści,
  struktura strony, jakość i linki (autorytet)** — a nie litery po kropce.
  Masz już stronę **dwujęzyczną (PL/EN)**, więc od strony treści jesteś na to
  gotowy bardziej niż większość konkurencji.
- **Realne ryzyko utraty klienta zza granicy z powodu samej końcówki `.pl`?**
  Znikome. Zagraniczny klient trafia do Ciebie zwykle z **polecenia, portfolio,
  LinkedIn albo bezpośredniego kontaktu**, a nie „wpisując .com w pasek". Na tym
  etapie (freelancer/mała pracownia) końcówka domeny nie jest wąskim gardłem
  pozyskiwania klientów — jest nim widoczność i portfolio.
- **Co możesz zrobić „na zapas" (opcjonalnie, tanio).** Jeśli chcesz się
  zabezpieczyć na przyszłą ekspansję i chronić markę: **dokup pasujący `.com`
  później, jeśli będzie wolny**, i ustaw z niego **przekierowanie na `hadrianm.pl`**
  (albo trzymaj w rezerwie). To decyzja **brandingowa, nie SEO-owa** — nie ma
  potrzeby robić `.com` domeną główną ani robić tego teraz. Architektura z tego
  dokumentu w niczym Ci tego nie blokuje: dodanie drugiej domeny to w Cloudflare
  kilka kliknięć.

**Wniosek:** zostań przy `hadrianm.pl` jako domenie głównej. Jeśli kiedyś realnie
zaczniesz obsługiwać rynek zagraniczny — dokupisz `.com` i przekierujesz go na
`.pl`. Dziś to nie jest problem, który kosztuje Cię klientów.

---

### 7.5 Poczta `info@hadrianm.pl` (+ aliasy) — czy od ręki, za darmo, jak?

> Adres główny to **`info@hadrianm.pl`**; `mateusz@`, `contact@` i `kontakt@` to
> aliasy do tej samej skrzynki (patrz „Jak nazwać adres" niżej). W przykładach
> poniżej `kontakt@` bywa użyte poglądowo — działa tak samo dla `info@`.

**Krótka odpowiedź:** **odbieranie** poczty na `info@hadrianm.pl` dostajesz
**za darmo i od ręki** (Cloudflare Email Routing — skoro DNS masz już w Cloudflare).
Ale samo Cloudflare **tylko przekierowuje pocztę, nie wysyła**. Żeby móc też
**wysyłać** jako `kontakt@hadrianm.pl`, dokładasz jeden darmowy element (przekaźnik
SMTP) albo wybierasz osobną skrzynkę. Nie jest to część zakupu domeny — to osobna
konfiguracja (poniżej).

> **Najważniejsza zasada — jeden zestaw MX.** Rekord **MX** („gdzie leci poczta
> dla domeny") jest **tylko jeden**. Dlatego opcje poczty poniżej **wykluczają
> się** — albo poczta idzie przez Cloudflare Email Routing, albo przez Zoho, albo
> przez Google — nie da się dwóch naraz na tej samej domenie. Wybierasz **jeden**
> wariant.

> **Ważne — czy poczta u rejestratora „w cenie domeny"?** Nie licz na to:
> u **nazwa.pl** sama domena daje tylko funkcje DNS (SPF/DKIM/DNSSEC), **realna
> skrzynka to osobny płatny produkt** (CloudMail). U **home.pl** jest odwrotnie —
> darmowa domena w 1. roku jest **dodatkiem do płatnego pakietu poczty**. Tak czy
> siak: **darmowej skrzynki „przy okazji domeny" nie ma**. Dlatego rekomendujemy
> pocztę spiąć z Cloudflare (gdzie i tak jest już DNS), a nie z rejestratorem.

#### Jak nazwać adres (i dlaczego można mieć kilka naraz)

Nie musisz wybierać „albo po polsku, albo po angielsku" — **jedna skrzynka może
mieć wiele adresów** (aliasów) albo **catch-all** (`*@hadrianm.pl` — łap-wszystko).
Cloudflare Email Routing i każda prawdziwa skrzynka to obsługują. Zasada: **ustaw
kilka aliasów wpadających do jednej skrzynki, ale na stronie pokazuj tylko jeden**
(spójność marki).

Najbardziej uniwersalne słówka:

- **`info@`** — dosłownie identyczne po polsku i angielsku, neutralne, globalnie
  rozpoznawalne.
- **`hello@`** — nowoczesne, „studyjne", zrozumiałe dla Polaka i obcokrajowca.
- **`contact@`** — uniwersalne; Polacy też rozumieją (bo „kontakt" to niemal to
  samo słowo).
- **imię**, np. `mateusz@` — najbardziej osobiste, bez bariery językowej, brzmi
  „butikowo" (piszesz do konkretnej osoby).

> **Decyzja dla `hadrianm.pl`:** ustawiamy **cztery adresy** wpadające do jednej
> skrzynki:
> `info@hadrianm.pl`, `mateusz@hadrianm.pl`, `contact@hadrianm.pl`,
> `kontakt@hadrianm.pl`.
> **Głównym (wyświetlanym na stronie, w stopce, w CTA) jest `info@hadrianm.pl`.**
> Pozostałe trzy działają „w tle" — jeśli ktoś napisze na `kontakt@`/`contact@`
> albo bezpośrednio `mateusz@`, poczta i tak trafi w to samo miejsce.
>
> W praktyce: w Cloudflare Email Routing utwórz **4 reguły** (albo włącz
> **catch-all**), wszystkie kierujące na ten sam cel (Twój Gmail / skrzynka). Jeśli
> pójdziesz w prawdziwą skrzynkę (Zoho/rejestrator), zrób `info@` kontem głównym,
> a resztę dodaj jako **aliasy** tego konta.

#### Trzy warianty — wybierz jeden

| Wariant                                         | Koszt        | Odbiór | Wysyłka jako `kontakt@` | Gdzie czytasz pocztę        |
| ----------------------------------------------- | ------------ | ------ | ----------------------- | --------------------------- |
| **(a) Cloudflare Routing + Brevo (SMTP w Gmailu)** | **0 zł**  | ✅ (przekierowanie do Twojego Gmaila) | ✅ (przez darmowy przekaźnik) | W Twoim zwykłym Gmailu |
| **(b) Zoho Mail Forever Free**                  | **0 zł**     | ✅ (własna skrzynka) | ✅ (z webmaila/apki Zoho) | W panelu/apce Zoho (osobno) |
| **(c) Google Workspace**                        | ~25–31 zł/mies. | ✅ | ✅ (natywnie) | Firmowy Gmail na własnej domenie |

**Rekomendacja:** dla Ciebie **wariant (a)** — najtaniej (0 zł) i najwygodniej,
bo całą pocztę firmową masz w **jednym, znajomym Gmailu**. Poniżej pełna
konfiguracja (a) oraz skrót (b) i (c).

#### Wariant (a) — 0 zł: odbiór przez Cloudflare + wysyłka przez Brevo

**Część 1: ODBIÓR — Cloudflare Email Routing (5 minut).**

1. Cloudflare → Twoja domena `hadrianm.pl` → **Email → Email Routing**.
2. Kliknij **Enable / Get started**. Cloudflare **sam doda rekordy DNS** potrzebne
   do odbioru: **3× MX** (`route1/2/3.mx.cloudflare.net`), **TXT (SPF)** i
   **TXT (DKIM)** (`cf2024-1._domainkey`). Nic nie wpisujesz ręcznie.
3. **Create address** → wpisz `kontakt` → jako cel podaj swój prywatny Gmail
   (np. `tenhadrian@gmail.com`). Możesz też włączyć **catch-all** (łap-wszystko),
   żeby dowolny adres `@hadrianm.pl` też trafiał do Ciebie.
4. Cloudflare wyśle na Twój Gmail **e-mail weryfikacyjny — kliknij link**, żeby
   potwierdzić adres docelowy. Od tej chwili poczta na `kontakt@hadrianm.pl`
   **przychodzi do Twojego Gmaila.**

> Limity: do 200 adresów docelowych i 200 reguł — dla Ciebie z zapasem. Odbiór
> jest kompletny i darmowy. Zostaje **wysyłka**.

**Część 2: WYSYŁKA — darmowy przekaźnik SMTP (Brevo) + Gmail „Wyślij jako".**

Cloudflare nie wysyła, więc do wysyłki potrzebny jest serwer SMTP. Użyjemy
darmowego **Brevo** (dawniej Sendinblue) — limit **300 maili/dzień** (do
korespondencji z zapasem).

1. Załóż darmowe konto na <https://www.brevo.com> i w panelu Brevo dodaj oraz
   **zweryfikuj domenę** `hadrianm.pl`. Brevo poda Ci rekordy do dodania **w DNS
   Cloudflare**:
   - **TXT (SPF)** z `include:spf.brevo.com`,
   - **2× CNAME (DKIM)**: `brevo1._domainkey`, `brevo2._domainkey`,
   - **TXT (DMARC)** (np. `v=DMARC1; p=none;`).
   > Te rekordy **nie kłócą się** z rekordami z Części 1 — bo tylko **MX** jest
   > „pojedynczy", a to są TXT/CNAME. Od 2024 Gmail wymaga DKIM+DMARC, więc ten
   > krok jest konieczny, żeby maile nie lądowały w spamie.
2. W Brevo wygeneruj dane **SMTP**: host `smtp-relay.brevo.com`, port `587`,
   login i hasło (klucz SMTP).
3. W Gmailu: **Ustawienia → Konta i import → „Wyślij e-mail jako" → Dodaj inny
   adres e-mail** → wpisz `kontakt@hadrianm.pl`, a jako serwer SMTP podaj dane
   z Brevo (host/port/login/hasło).
4. Gotowe: piszesz w Gmailu, wybierasz nadawcę `kontakt@hadrianm.pl`, a mail
   wychodzi przez Brevo, podpisany DKIM-em Twojej domeny.

> **Uwaga:** nie używaj sztuczki „wysyłaj przez `smtp.gmail.com`" — wtedy DKIM
> podpisuje się jako `gmail.com`, odbiorca widzi „via gmail.com" i częściej trafia
> to do spamu. Własny przekaźnik (Brevo) rozwiązuje ten problem.

#### Wariant (b) — 0 zł: Zoho Mail Forever Free (osobna, „prawdziwa" skrzynka)

Jeśli wolisz **jedną, klasyczną skrzynkę** (osobny login, bez przekaźników) zamiast
spinania z Gmailem:

1. Załóż **Zoho Mail** na planie **Forever Free** (do 5 skrzynek, 5 GB każda) i przy
   rejestracji **wybierz centrum danych „EU"** (dane w Unii). Dodaj domenę
   `hadrianm.pl`.
2. W DNS Cloudflare **wyłącz wcześniej Cloudflare Email Routing** (bo jego MX by
   kolidował) i wstaw rekordy Zoho z ich Admin Console: **MX** `mx.zoho.eu`,
   `mx2.zoho.eu`, `mx3.zoho.eu`, **TXT (SPF)** `include:zoho.eu`, **TXT (DKIM)**
   `zoho._domainkey` + rekord weryfikacyjny (CNAME/TXT).
3. Utwórz skrzynkę `kontakt@hadrianm.pl`. Czytasz i wysyłasz z **webmaila Zoho lub
   ich aplikacji mobilnej**.

> **Największe ograniczenie darmowego Zoho (stan 2026):** **brak IMAP/POP/SMTP** —
> **nie podłączysz** tej skrzynki pod Gmaila/Outlooka/Thunderbirda, korzystasz
> **tylko** przez interfejs Zoho. To dlatego wariant (a) jest wygodniejszy, jeśli
> lubisz mieć wszystko w Gmailu. _Zoho zmienia warunki darmowego planu — potwierdź
> aktualny cennik na żywo przed założeniem konta._

#### Wariant (c) — płatnie: Google Workspace (max wygoda i dostarczalność)

Jeśli zależy Ci na firmowym Gmailu na własnej domenie, bez kombinowania z
przekaźnikami i z najlepszą dostarczalnością:

- **Google Workspace Business Starter:** ~**25 zł/użytkownik/mies.** (zobowiązanie
  roczne) lub ~31,50 zł bez zobowiązania; 30 GB, natywna wysyłka/odbiór jako
  `kontakt@hadrianm.pl`. W Cloudflare wstawiasz wtedy **MX Google** i **wyłączasz
  Email Routing**.
- Alternatywa: **Microsoft 365 Business Basic** (~28 zł/użytk./mies., rocznie).

#### Chcesz OSOBNĄ skrzynkę — w Outlooku na Macu albo jako osobny Gmail?

To zmienia rekomendację, bo **Outlook (i każdy klient desktopowy) potrzebuje
IMAP + SMTP** — a tego **darmowy Zoho ani samo Cloudflare Routing NIE dają**
(Routing tylko przekierowuje, darmowy Zoho działa wyłącznie przez własny webmail).
Masz dwie realne drogi:

**Ścieżka 1 — dedykowany darmowy Gmail jako skrzynka (0 zł).**

Zakładasz **nowe, osobne konto Gmail** (np. `kontakt.hadrianm@gmail.com`), które
jest „pojemnikiem" na firmową pocztę, i podpinasz je pod Outlooka:

1. **Odbiór:** Cloudflare Email Routing przekierowuje `kontakt@hadrianm.pl` → ten
   nowy Gmail (jak w wariancie (a) wyżej).
2. **W Outlooku na Macu** dodajesz **to konto Gmail przez IMAP**
   (`imap.gmail.com:993`). Gmail osobisty wymaga **hasła aplikacji** (App Password)
   zamiast zwykłego hasła.
3. **Wysyłka — kluczowy szczegół:** ustaw **serwer wychodzący (SMTP) w Outlooku
   na Brevo** (`smtp-relay.brevo.com:587`, login/klucz z Brevo), a jako nadawcę
   (From) wpisz `kontakt@hadrianm.pl`. Dzięki temu alias jest **prawdziwym,
   uwierzytelnionym nadawcą** i — z rekordami SPF/DKIM/DMARC Brevo w DNS — poczta
   ma dobrą dostarczalność.
   > **Nie wysyłaj przez `smtp.gmail.com`.** Wtedy Google dokłada nagłówek
   > „`…@gmail.com` **w imieniu** `kontakt@hadrianm.pl`", psuje DMARC (podpis
   > gmail.com zamiast Twojej domeny) i częściej wpadasz w spam. Wychodzący SMTP =
   > Brevo, nie Gmail.
4. Efekt: w Outlooku masz osobną skrzynkę firmową — odbiór przez Gmail (IMAP),
   wysyłka jako `kontakt@hadrianm.pl` (przez Brevo). Wszystko za **0 zł**.

> **Minus tej ścieżki:** trzy sklejone usługi (Cloudflare forward + Gmail IMAP +
> Brevo SMTP) = trzy miejsca konfiguracji i trzy potencjalne punkty awarii. Działa,
> ale to „majstrowanie", żeby oszczędzić ~4 zł/mies.

**Ścieżka 2 — „prawdziwa" skrzynka na własnej domenie z IMAP/SMTP (~3–5 zł/mies.,
rekomendowana).**

Tu `kontakt@hadrianm.pl` jest **realnym kontem** (nie aliasem) — działa natywnie
w Outlooku, bez żadnych trików, z czystym DMARC. Konfiguracja: dodajesz **MX +
SPF/DKIM dostawcy w DNS Cloudflare jako „DNS only"** i **wyłączasz Cloudflare Email
Routing** (bo MX może być tylko jeden). Aktualne (2026) tanie opcje:

| Dostawca                     | Cena (orient.)              | IMAP/SMTP | Uwaga                                             |
| ---------------------------- | --------------------------- | --------- | ------------------------------------------------ |
| **Zoho Mail — Mail Lite**    | ~$1/mies. (~4 zł), rocznie  | ✅ (płatny plan przywraca IMAP/SMTP) | **Rekomendacja** — najtaniej za realne konto; wybierz DC „EU". Hosty: `imappro.zoho.eu:993` / `smtp.zoho.eu:465` |
| **Migadu (Micro)**           | ~$19/rok (~6 zł/mies.)      | ✅ | Płaska cena, wiele adresów; limit **20 wysłanych/dzień** (dla korespondencji OK). `imap.migadu.com` / `smtp.migadu.com` |
| **Purelymail**               | ~$10/rok (~3 zł/mies.)      | ✅ | Najtaniej, ale mały jednoosobowy dostawca i **sami zapowiadają podwyżkę** — traktuj cenę jako zmienną |
| **Poczta u rejestratora**    | home.pl ~9 zł netto/1. rok (odnowienie ~49 zł/rok); nazwa.pl CloudMail ~60 zł netto/rok | ✅ | Kupujesz sam produkt poczty, a **MX wpisujesz do DNS Cloudflare** (DNS-only); strona zostaje na Pages |
| **iCloud+ własna domena**    | od ~0,99 €/mies.            | ⚠️ | **Słabo współpracuje z Outlookiem na Macu** (nowy Outlook nie obsługuje własnych domen iCloud natywnie, From potrafi pokazywać `@icloud.com`) — odradzam do Outlooka |

> **Outlook na Macu — dobra wiadomość:** nowy Outlook **obsługuje dowolne konta
> IMAP** (w kreatorze jest opcja „inne/IMAP"), więc Zoho / Migadu / Purelymail /
> poczta rejestratora wchodzą natywnie. Wyjątki: konta osobiste (Gmail) wymagają
> **hasła aplikacji**, a własne domeny iCloud są problematyczne (patrz tabela).

**Co polecam:** zapłać **~4 zł/mies. za Zoho Mail Lite** (albo Migadu). Jedna
realna skrzynka, natywnie w Outlooku, najlepsza dostarczalność i zero grzebania
przy aliasach — te kilka złotych kupuje Ci spokój. Darmową ścieżkę 1 (dedykowany
Gmail + Brevo) wybierz tylko, jeśli zależy Ci wyłącznie na „0 zł".

#### Pułapki wspólne dla poczty (przeczytaj przy każdym wariancie)

- **Tylko jeden zestaw MX** — Cloudflare Routing, Zoho i Google **wykluczają się**.
  Zmiana poczty = wymiana rekordów MX na inne.
- **Rekordy poczty zawsze „DNS only" (szara chmurka), nigdy „Proxied"
  (pomarańczowa).** Proxy Cloudflare obsługuje tylko HTTP(S); przez pomarańczową
  chmurkę poczta (SMTP/IMAP) nie przejdzie.
- **Włączenie Email Routing nadpisuje istniejące MX** — jeśli kiedyś przejdziesz na
  Zoho/Google, najpierw wyłącz Email Routing.
- **Zawsze skonfiguruj SPF + DKIM + DMARC** dostawcy, który faktycznie wysyła —
  inaczej maile lądują w spamie.
- **DNSSEC** (włączony w Cloudflare) nie przeszkadza żadnemu wariantowi poczty.

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
| Domena `hadrianm.pl`        | 1. rok często ~1–2 zł (promo); odnowienie ~60–100 zł/rok (nazwa.pl/home.pl) |
| Poczta `info@hadrianm.pl` (+ aliasy) | **0 zł** (Routing + Brevo); osobna skrzynka IMAP (Outlook) ~4 zł/mies. (Zoho Mail Lite); ~25–31 zł/mies. (Google Workspace) |
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
