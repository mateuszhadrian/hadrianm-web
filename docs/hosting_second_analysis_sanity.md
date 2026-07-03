# Wdrożenie CMS + hosting + CI/CD — wariant Sanity (headless SaaS) — instrukcja krok po kroku

> **Dokument wykonawczy.** Zakładam, że robisz to **pierwszy raz w życiu** — każdy
> krok jest rozpisany, skróty rozwijam w nawiasie. Cel identyczny jak w wariancie
> Sveltia: kupujesz `hadrianm.pl`, strona żyje na Cloudflare, logujesz się do
> panelu CMS, wchodzisz w „Realizacje", wypełniasz formularz odwzorowany 1:1 z
> `src/components/sections/work/work-data.ts`, wgrywasz zdjęcia aura/dąb/sielski
> z panelu — i widzisz na `hadrianm.pl` to samo, co dziś lokalnie.
>
> To jest **alternatywa** dla [hosting_second_analysis_sveltia.md](./hosting_second_analysis_sveltia.md).
> Różnica w skrócie: tu treść mieszka w chmurze Sanity (nie w repo Git), a
> skalowanie zdjęć robi **pipeline obrazów Sanity** (a nie transformacje
> Cloudflare). Kontekst decyzyjny: [hosting_first_analysis.md](./hosting_first_analysis.md),
> [photos-management-for-cms-analysis.md](./photos-management-for-cms-analysis.md).
> Dostosowanie pod klienta: [additional-architecture-adjustment-admin-client.md](./additional-architecture-adjustment-admin-client.md).
>
> Ceny orientacyjne, stan ~połowa 2026 — sprawdź u dostawcy.

---

## 0. Słownik pojęć (uzupełnienie)

Skróty wspólne (CMS, CDN, SSG, CI/CD, DNS, Zod, Webhook, CORS) rozwinąłem w
[wariancie Sveltia §0](./hosting_second_analysis_sveltia.md#0-słownik-pojęć-przeczytaj-raz-wracaj-w-razie-potrzeby).
Tu tylko pojęcia specyficzne dla Sanity:

- **Headless CMS** — CMS bez własnej „głowy" (frontendu). Trzyma treść i wydaje
  ją przez API (interfejs programistyczny), a Twój frontend (Astro) sam decyduje,
  jak ją wyświetlić.
- **Sanity** — konkretny headless CMS jako usługa (SaaS, Software as a Service).
  Treść i zdjęcia leżą w chmurze Sanity, nie w repo Git.
- **Sanity Studio** — panel edycyjny Sanity (aplikacja w przeglądarce). Możesz go
  hostować u Sanity (`twojprojekt.sanity.studio`) albo osadzić w swojej stronie
  pod trasą, np. `/studio`.
- **Projekt / Dataset** — w Sanity treść żyje w „projekcie" (ma `projectId`), a w
  nim w „zbiorze danych" (`dataset`, zwykle `production`).
- **GROQ** (Graph-Relational Object Queries) — język zapytań Sanity; nim pobierasz
  treść (odpowiednik SQL dla Sanity).
- **`@sanity/astro`** — oficjalna wtyczka łącząca Astro z Sanity (daje gotowego
  klienta i może osadzić Studio pod wybraną trasą).
- **`@sanity/image-url`** — biblioteka budująca adresy URL zdjęć z parametrami
  (szerokość, format) — to ona zastępuje pliki `-m` i transformacje Cloudflare.
- **useCdn** — ustawienie klienta Sanity: `true` = czytaj z szybkiej sieci
  Sanity (dobre do builda produkcyjnego).
- **Deploy Hook** (hak wdrożenia) — specjalny adres URL w Cloudflare Pages; jego
  wywołanie uruchamia przebudowę strony. Sanity zawoła go po publikacji treści.
- **Mux** — usługa wideo integrowana z Sanity (odpowiednik Cloudflare Stream);
  opcjonalna, na przyszłość.

---

## 1. Czym ten wariant różni się od Sveltii (must-read)

| Aspekt              | Sveltia (Git-CMS)                          | **Sanity (headless SaaS)**                       |
| ------------------- | ------------------------------------------ | ------------------------------------------------- |
| Gdzie żyje treść    | pliki JSON w repo Git                      | **chmura Sanity** (poza repo)                     |
| Panel               | statyczny `/admin` w Twojej stronie        | **Sanity Studio** (hostowany u Sanity lub `/studio`) |
| Logowanie           | GitHub + Worker OAuth-proxy                | **wbudowane w Sanity** (Google/GitHub/e-mail), role członków |
| Zdjęcia             | R2 + transformacje Cloudflare              | **magazyn i pipeline obrazów Sanity** (`cdn.sanity.io`) |
| Publikacja → strona | commit → build Pages                       | publikacja → **webhook → Deploy Hook → build Pages** |
| Skalowanie obrazów  | `/cdn-cgi/image/...`                        | `...?w=300&auto=format`                            |
| Koszt bazowy        | 0 zł                                       | 0 zł na starcie (rośnie z ruchem/API/seatami)     |

**Co zostaje takie samo:** hosting na **Cloudflare Pages**, **GitHub Actions**
jako bramka jakości, model **statyczny (SSG)**, zniknięcie plików `-m`, wymóg
**dwóch zrzutów na ekran** (desktop + mobile — nieautomatyzowalne).

---

## 2. Architektura docelowa (mapa całości)

```
        ┌──────────────────────────────────────────────┐
        │  Ty (przeglądarka)                            │
        │  https://hadrianm.sanity.studio  ← panel      │
        └───────────────┬──────────────────────────────┘
                        │ 1. edycja + publikacja (treść + zdjęcia)
                        ▼
   ┌──────────────────────────────────────────────────────┐
   │  Chmura Sanity                                        │
   │   • treść realizacji (dokumenty)                      │
   │   • zdjęcia (asset store, cdn.sanity.io)              │
   └───────────────┬──────────────────────────────────────┘
                   │ 2. webhook po publikacji
                   ▼
   ┌──────────────────────────────────────────────────────┐
   │  Cloudflare Pages: Deploy Hook → przebudowa strony    │
   │  (build pobiera treść z Sanity przez GROQ)            │
   └───────────────┬──────────────────────────────────────┘
                   ▼
        https://hadrianm.pl  (strona statyczna)
        obrazy: https://cdn.sanity.io/...?w=...&auto=format

   Równolegle: push do GitHub → GitHub Actions (bramka: lint/typy/build)
```

Treść i zdjęcia są w Sanity; kod w GitHub; strona budowana i serwowana przez
Pages; publikacja w Sanity wyzwala przebudowę.

---

## 3. Etap 0 — konta i punkt wyjścia

1. **Konto Sanity** — załóż darmowe na <https://www.sanity.io> (możesz zalogować
   się GitHubem — wygodne).
2. **Konto Cloudflare** — jak w wariancie Sveltia (hosting + domena).
3. **GitHub** — masz; repo `hadrianm-web`.
4. **Node 22 / pnpm** — masz. Sprawdź `pnpm build && pnpm preview`.

---

## 4. Etap 1 — podłączenie Astro do Sanity + refaktor Realizacji

**Cel:** strona nadal wygląda tak samo, ale dane realizacji pobiera z Sanity (a
nie z tablicy `work-data.ts`), a adresy zdjęć buduje pipeline Sanity.

> Kroki „w kodzie" mogę wykonać za Ciebie w osobnej sesji.

### 4.1 Instalacja integracji

```bash
pnpm add @sanity/astro @sanity/client @sanity/image-url
```

W `astro.config.mjs` dodaj integrację Sanity (uzupełnisz `projectId` po Etapie 2):

```js
import sanity from "@sanity/astro";

export default defineConfig({
  // …dotychczasowa konfiguracja…
  integrations: [
    react(),
    mdx(),
    sitemap(),
    sanity({
      projectId: "TWOJ_PROJECT_ID", // z Etapu 2
      dataset: "production",
      useCdn: true, // szybkie czytanie przy buildzie produkcyjnym
      // studioBasePath: "/studio", // odkomentuj, jeśli chcesz Studio pod /studio
    }),
  ],
});
```

### 4.2 Helper `imgAt()` — teraz buduje adresy Sanity

Tworzymy `src/lib/img.ts`. W tym wariancie `imgAt` przyjmuje **obiekt obrazu
Sanity** (nie string) i zwraca URL o żądanej szerokości:

```ts
// src/lib/img.ts
import imageUrlBuilder from "@sanity/image-url";
import { sanityClient } from "sanity:client"; // wirtualny moduł z @sanity/astro

const builder = imageUrlBuilder(sanityClient);

// `source` = obiekt obrazu z Sanity (asset reference)
export function imgAt(source: unknown, width: "full" | "mobile"): string {
  const w = width === "mobile" ? 320 : 960;
  return builder.image(source).width(w).auto("format").url();
}
```

`auto("format")` sprawia, że Sanity wyda AVIF/WebP zależnie od przeglądarki —
bez ręcznego generowania wariantów.

### 4.3 Pobranie treści w `Work.astro` (GROQ zamiast tablicy)

```diff
- import { workProjects, localizeProject } from "./work-data";
+ import { sanityClient } from "sanity:client";
+ import { localizeProject } from "./work-data";
  …
- const projects = workProjects.map((p) => localizeProject(p, lang));
+ const query = `*[_type == "realizacja"] | order(order asc){
+   slug, order, name, year, category, blurb, tags, intro,
+   screens[]{ key, label, desktop, mobile },
+   results[]{ metric, label }, quote, author, role, scope, liveUrl
+ }`;
+ const entries = await sanityClient.fetch(query);
+ const projects = entries.map((p) => localizeProject(p, lang));
```

`localizeProject` (w `work-data.ts`) zostaje niemal bez zmian — nadal czyta
`p.category[lang]` itd., bo model pól `{pl,en}` zachowujemy (patrz Etap 2). Jedyna
różnica: pola obrazów (`screens[].desktop/mobile`) to teraz **obiekty Sanity**, a
nie stringi, więc przekazujemy je dalej i budujemy URL dopiero w `imgAt()`.

### 4.4 `WorkDeviceDuo.astro` — zawsze przez `imgAt()`

```diff
- const mobileSrc = (src: string) => src.replace(/\.webp$/, "-m.webp");
+ import { imgAt } from "@/lib/img";
  …
- <source media="(max-width: 760px)" srcset={mobileSrc(desktop)} />
- <img class="wd__img" src={desktop} … />
+ <source media="(max-width: 760px)" srcset={imgAt(desktop, "mobile")} />
+ <img class="wd__img" src={imgAt(desktop, "full")} … />
```

(analogicznie dla telefonu: `imgAt(mobile, "mobile")` i `imgAt(mobile, "full")`).

Typ propsów `desktop/mobile` zmienia się ze `string` na obiekt obrazu Sanity.

---

## 5. Etap 2 — projekt Sanity + schemat (model 1:1 z `work-data.ts`) + Studio

**Cel:** panel Sanity z zakładką „Realizacje" i formularzem mającym te same pola
co `work-data.ts`.

### 5.1 Utwórz projekt Sanity

W katalogu projektu:

```bash
npm create sanity@latest -- --template clean --create-project "hadrianm" --dataset production
```

Kreator zapyta o logowanie i utworzy projekt oraz `dataset` `production`. Zapisz
**Project ID** (wklejasz go do `astro.config.mjs` z Etapu 4.1). Pliki schematu
wylądują np. w `./sanity/` lub `./src/sanity/` (zależnie od układu — kreator
poprowadzi).

### 5.2 Typy pomocnicze — „pole tłumaczone" `{pl,en}`

Żeby zachować format `{pl,en}` (a więc niezmienioną `localizeProject`), definiujemy
dwa typy obiektowe. Utwórz `sanity/schemaTypes/localized.ts`:

```ts
import { defineType, defineField } from "sanity";

export const localizedString = defineType({
  name: "localizedString",
  title: "Tekst (PL/EN)",
  type: "object",
  fields: [
    defineField({ name: "pl", title: "Polski", type: "string" }),
    defineField({ name: "en", title: "English", type: "string" }),
  ],
});

export const localizedText = defineType({
  name: "localizedText",
  title: "Tekst długi (PL/EN)",
  type: "object",
  fields: [
    defineField({ name: "pl", title: "Polski", type: "text" }),
    defineField({ name: "en", title: "English", type: "text" }),
  ],
});

export const localizedStringList = defineType({
  name: "localizedStringList",
  title: "Lista (PL/EN)",
  type: "object",
  fields: [
    defineField({ name: "pl", title: "Polski", type: "array", of: [{ type: "string" }] }),
    defineField({ name: "en", title: "English", type: "array", of: [{ type: "string" }] }),
  ],
});
```

> **Alternatywa idiomatyczna:** wtyczka `@sanity/internationalized-array` daje
> ładniejszy przełącznik języków, ale zapisuje dane inaczej (tablica
> `{_key, value}`), co wymusiłoby przepisanie `localizeProject`. Dla migracji 1:1
> zostajemy przy `{pl,en}` — prościej i zgodnie z obecnym kodem.

### 5.3 Dokument „Realizacja" — `sanity/schemaTypes/realizacja.ts`

```ts
import { defineType, defineField } from "sanity";

export const realizacja = defineType({
  name: "realizacja",
  title: "Realizacja",
  type: "document",
  fields: [
    defineField({ name: "slug", title: "Slug (adres, np. aura)", type: "string", validation: (r) => r.required() }),
    defineField({ name: "order", title: "Kolejność (mniejsze = wyżej)", type: "number", initialValue: 10 }),
    defineField({ name: "name", title: "Nazwa", type: "string", validation: (r) => r.required() }),
    defineField({ name: "year", title: "Rok", type: "string" }),
    defineField({ name: "category", title: "Kategoria", type: "localizedString" }),
    defineField({ name: "blurb", title: "Krótki opis", type: "localizedText" }),
    defineField({ name: "tags", title: "Tagi", type: "localizedStringList" }),
    defineField({ name: "intro", title: "Wprowadzenie", type: "localizedText" }),

    defineField({
      name: "screens",
      title: "Ekrany (podgląd na urządzeniach)",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            { name: "key", title: "Klucz (home/gallery/order)", type: "string" },
            { name: "label", title: "Etykieta", type: "localizedString" },
            { name: "desktop", title: "Zrzut DESKTOP", type: "image", options: { hotspot: true } },
            { name: "mobile", title: "Zrzut MOBILE", type: "image", options: { hotspot: true } },
          ],
          preview: { select: { title: "label.pl" } },
        },
      ],
      validation: (r) => r.min(1),
    }),

    defineField({
      name: "results",
      title: "Wyniki (liczby)",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            { name: "metric", title: "Metryka", type: "localizedString" },
            { name: "label", title: "Opis", type: "localizedString" },
          ],
        },
      ],
    }),

    defineField({ name: "quote", title: "Cytat / opinia", type: "localizedText" }),
    defineField({ name: "author", title: "Autor opinii", type: "string" }),
    defineField({ name: "role", title: "Rola autora", type: "localizedString" }),
    defineField({ name: "scope", title: "Zakres prac", type: "localizedStringList" }),
    defineField({ name: "liveUrl", title: "Link do strony na żywo (opcjonalny)", type: "url" }),
  ],
  preview: { select: { title: "name", subtitle: "year" } },
});
```

Zarejestruj typy w `sanity/schemaTypes/index.ts`:

```ts
import { localizedString, localizedText, localizedStringList } from "./localized";
import { realizacja } from "./realizacja";
export const schemaTypes = [localizedString, localizedText, localizedStringList, realizacja];
```

### 5.4 Uruchom Studio i (rekomendacja) hostuj u Sanity

Lokalnie: `npx sanity dev` → panel na `http://localhost:3333`.

Hosting panelu (rekomendacja startowa — najmniej pracy):

```bash
npx sanity deploy
```

Wybierz subdomenę, np. `hadrianm` → panel dostępny pod
`https://hadrianm.sanity.studio`.

> **Opcja: Studio pod `/studio` na Twojej domenie.** Odkomentuj `studioBasePath:
> "/studio"` w `astro.config.mjs` (Etap 4.1) — wtedy panel budowany jest razem ze
> stroną i działa pod `https://hadrianm.pl/studio`. Wygodne przy modelu klienta
> (wszystko pod jedną domeną), ale zwiększa build. Na start prościej `sanity.studio`.

### 5.5 CORS — pozwól stronie czytać z Sanity

W panelu Sanity (<https://www.sanity.io/manage> → Twój projekt → **API → CORS
origins**) dodaj: `https://hadrianm.pl`, `http://localhost:4321` (oraz adres
Studio). Zaznacz „Allow credentials" dla Studio.

---

## 6. Etap 3 — logowanie i role (bez Workera OAuth)

W Sanity logowanie jest **wbudowane** — nie potrzebujesz Workera-pośrednika.

1. Wchodzisz do Studio i logujesz się (Google/GitHub/e-mail).
2. **Zapraszanie osób i role:** <https://www.sanity.io/manage> → projekt →
   **Members → Invite**. Role: **Administrator** (pełnia), **Editor** (edycja
   treści), **Viewer** (podgląd).
   - Dla **siebie** — Administrator.
   - Dla **klienta** (w przyszłości) — **Editor**: może dodawać/edytować/usuwać
     treść, ale nie rusza schematu, płatności ani ustawień projektu. Szczegóły i
     „kill-switch" w [additional-architecture-adjustment-admin-client.md](./additional-architecture-adjustment-admin-client.md).

> **Uwaga o planie:** bardziej granularne role (własne uprawnienia per typ
> dokumentu) są na planach płatnych. Na darmowym masz Administrator/Editor/Viewer
> — dla „klient edytuje tylko Realizacje" Editor zwykle wystarcza, bo w projekcie
> jest tylko ten model treści.

---

## 7. Etap 4 — hosting (Cloudflare Pages) + bramka + domena + rebuild po publikacji

### 7.1 Bramka jakości — GitHub Actions

Identyczna jak w [wariancie Sveltia §7.1](./hosting_second_analysis_sveltia.md#71-bramka-jakości--github-actions):
plik `.github/workflows/ci.yml` (lint/typecheck/build) + branch protection na `main`.

> **Ważne:** build strony pobiera treść z Sanity, więc bramka i produkcja
> potrzebują `projectId`/`dataset`. `projectId` nie jest sekretem (jest publiczny),
> możesz go trzymać wprost w `astro.config.mjs`. Jeśli wolisz przez zmienne
> środowiskowe — dodaj je w GitHub (**Settings → Secrets and variables →
> Actions**) i w Cloudflare Pages (**Settings → Environment variables**).

### 7.2 Cloudflare Pages + domena

Jak w [wariancie Sveltia §7.2–7.3](./hosting_second_analysis_sveltia.md#72-podpięcie-repo-do-cloudflare-pages):
podłącz repo (`pnpm build` → `dist`, Node 22), podepnij `hadrianm.pl` + `www`,
SSL automatyczny. Jeśli wybrałeś Studio pod `/studio`, po deployu sprawdź
`https://hadrianm.pl/studio`.

### 7.3 Przebudowa po publikacji (webhook Sanity → Deploy Hook Pages)

To krok, którego **nie ma** w wariancie Sveltia (tam commit sam wyzwala build).
Tu treść żyje poza repo, więc trzeba połączyć „publikacja w Sanity" z „przebudową
strony":

1. **Cloudflare Pages → projekt → Settings → Builds & deployments → Deploy
   hooks → Add deploy hook.** Nazwa: `sanity-publish`, branch: `main`. Skopiuj
   wygenerowany adres URL (to „przycisk przebudowy").
2. **Sanity → Manage → projekt → API → Webhooks → Create webhook:**
   - **URL:** wklej adres Deploy Hooka z kroku 1.
   - **Trigger on:** Create, Update, Delete.
   - **Filter (opcjonalnie):** `_type == "realizacja"` (przebudowa tylko przy
     zmianie realizacji).
   - **HTTP method:** POST.
3. Zapisz. Od teraz **Publish w Studio → webhook → Pages przebudowuje stronę**
   (kilkadziesiąt sekund–kilka minut).

> Zostajemy przy modelu statycznym (SSG): treść pobierana jest przy buildzie, więc
> zero kosztu runtime i pełna prędkość CDN. „Podgląd na żywo" (bez przebudowy) da
> się dodać później przez tryb wizualnej edycji Sanity — na start niepotrzebny.

---

## 8. Etap 5 — obrazy przez pipeline Sanity (usuwamy pliki `-m`)

W tym wariancie **nie ma R2 ani transformacji Cloudflare** — skalowanie robi
Sanity. Robota jest w większości już zrobiona w Etapie 1 (`imgAt()` buduje adresy
`cdn.sanity.io/...?w=...&auto=format`).

1. Zdjęcia wgrywasz w Studio (pola „Zrzut DESKTOP" / „Zrzut MOBILE") — trafiają do
   asset store Sanity.
2. `imgAt(source, "mobile")` → `...?w=320&auto=format`; `"full"` → `...?w=960`.
   Zmiana progu/rozmiaru = zmiana liczby w `imgAt()`, bez regeneracji plików.
3. **Sprzątanie** (po potwierdzeniu, że obrazy idą z Sanity):
   - usuń pliki `public/realizacje/*-m.webp` **oraz** `public/realizacje/*.webp`
     (w tym wariancie oryginały też są w Sanity, nie w repo),
   - usuń `scripts/optimize-realizacje.mjs` i wpis `optimize:realizacje` z
     `package.json`,
   - `docs/testing-data/` **zostaw** jako źródło zrzutów do wgrania.

> **Dodatkowa zaleta:** hotspot/crop w Sanity — możesz w panelu wskazać „środek"
> kadru, a `imgAt` z `.fit('crop')` uszanuje go przy kadrowaniu do obudowy
> laptopa/telefonu (opcjonalne rozszerzenie helpera).

---

## 9. Etap 6 — wideo (opcjonalne, na przyszłość)

Realizacje dziś nie mają wideo. Gdy zechcesz:

- **Sanity + Mux** (wtyczka `sanity-plugin-mux-input`) — wgrywasz wideo w Studio,
  Mux transkoduje i serwuje adaptacyjnie. Analog Cloudflare Stream, „w rodzinie"
  Sanity. Model kosztu per minuta kodowania/oglądania.
- Na absolutny start: **YouTube/Vimeo unlisted** (0 zł, obcy branding).

W schemacie dodałbyś pole `video` (typ z wtyczki Mux albo `url`), a w
`WorkDetail.astro` odtwarzacz renderowany, gdy pole niepuste.

---

## 10. Etap 7 — pierwsze wgranie realizacji + weryfikacja

1. Wejdź do Studio (`hadrianm.sanity.studio` lub `hadrianm.pl/studio`), zaloguj się.
2. **Realizacja → Create new.** Wypełnij pola PL i EN, `slug`, `order`.
3. Przy każdym ekranie wgraj **dwa** zrzuty (DESKTOP + MOBILE) z
   `docs/testing-data/test-projects/…`.
4. **Publish.** Webhook zawoła Deploy Hook, Pages przebuduje stronę.
5. Wejdź na `https://hadrianm.pl/#work` — realizacja jest na stronie, zdjęcia z
   `cdn.sanity.io`, skalowane parametrem URL.

Cel osiągnięty: realizacje dodajesz/edytujesz/usuwasz wyłącznie z panelu Sanity.

---

## 11. Checklist końcowy

- [ ] Etap 1: `@sanity/astro` + `imgAt()` (Sanity URL) + `Work.astro` czyta GROQ.
- [ ] Etap 2: projekt Sanity + typy `{pl,en}` + dokument `realizacja` + Studio (deploy).
- [ ] Etap 3: role członków (Ty Administrator; klient później Editor); CORS.
- [ ] Etap 4: `ci.yml` + Pages + domena + **webhook → Deploy Hook**.
- [ ] Etap 5: `imgAt()` na pipeline Sanity; pliki `-m`/oryginały i skrypt usunięte.
- [ ] Etap 6: (opcjonalnie) Mux przygotowany.
- [ ] Etap 7: realizacja wgrana z panelu widoczna na `hadrianm.pl`.

---

## 12. Koszty (orientacyjnie, miesięcznie)

| Pozycja                    | Koszt                                                         |
| -------------------------- | ------------------------------------------------------------- |
| Cloudflare Pages (hosting) | **0 zł**                                                      |
| GitHub Actions (bramka)    | **0 zł**                                                      |
| Sanity (Free tier)         | **0 zł** na starcie; limity na API/bandwidth/liczbę członków  |
| Obrazy (pipeline Sanity)   | w ramach limitów Free tier                                    |
| Mux (wideo)                | tylko jeśli włączysz                                          |
| Domena `hadrianm.pl`       | ~50–70 zł/rok                                                 |
| **Razem recurring**        | **~0 zł/mies.** na starcie + domena rocznie                  |

> **Różnica względem Sveltii:** koszt Sanity rośnie z ruchem/API/seatami, a przy
> **wielu klientach** trzeba pilnować limitów per projekt (i regulaminu mnożenia
> darmowych projektów). Sveltia + Cloudflare zostaje „0 zł" łatwiej się skalując
> na wiele stron. Konsekwencje dla modelu agencyjnego:
> [additional-architecture-adjustment-admin-client.md](./additional-architecture-adjustment-admin-client.md).

---

## 13. Najczęstsze problemy (troubleshooting)

- **Strona nie widzi treści / pusto.** Sprawdź `projectId`/`dataset` w
  `astro.config.mjs`, `useCdn: true`, i czy dokumenty są **opublikowane** (nie
  tylko draft).
- **Błąd CORS w Studio / na stronie.** Dodaj `hadrianm.pl` i `localhost:4321` w
  Sanity → API → CORS origins.
- **Zdjęcie się nie renderuje.** `imgAt` musi dostać **obiekt obrazu** z GROQ
  (pole `desktop`/`mobile`), a nie string; upewnij się, że zapytanie zwraca te pola.
- **Publikacja nie odświeża strony.** Sprawdź webhook w Sanity (URL = Deploy
  Hook) i zakładkę „Deployments" w Pages.
- **Klient widzi za dużo.** Na Free tier rola Editor jest dość szeroka — patrz
  dokument admin/klient po opcje ograniczenia (osobny dataset, plan płatny z
  rolami niestandardowymi).

---

## Źródła

- [Sanity — integracja z Astro](https://www.sanity.io/docs/astro/introduction)
- [Sanity — zapytania w Astro (GROQ)](https://www.sanity.io/docs/astro/query-content-astro)
- [`@sanity/image-url` — budowanie adresów obrazów](https://github.com/sanity-io/image-url)
- [Sanity — webhooki (GROQ-powered webhooks)](https://www.sanity.io/docs/webhooks)
- [Cloudflare Pages — Deploy Hooks](https://developers.cloudflare.com/pages/configuration/deploy-hooks/)
- [Sanity — role i członkowie projektu](https://www.sanity.io/docs/roles)
