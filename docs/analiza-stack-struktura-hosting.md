# Strona-wizytówka studia webdev — analiza stacku, struktury i hostingu

> Dokument-baza pod stworzenie scaffolda projektu. Zawiera decyzje i rekomendacje z fazy analizy.
> Zakres: **stack technologiczny, struktura strony, hosting + CI/CD**. (Poza zakresem: design hero, animacje, narzędzia projektowe.)

## Kontekst projektu

- **Cel główny:** strona-wizytówka twórcy nowoczesnych, animowanych stron WWW dla firm usługowych (beauty, gastronomia, usługi lokalne). Strona ma sama być dowodem jakości („strona = portfolio").
- **Cele długoterminowe:** sprzedaż tego typu stron klientom; w przyszłości natywne apki (Android/iOS); później backend (sklep / system rezerwacji).
- **Animacje:** ciężkie scroll-based (pinning, scrub, parallax, ruch „kamery" w CSS 3D) — standard realizacji to **GSAP + ScrollTrigger** (framework-agnostyczne, identyczne w Astro i Next).
- **Języki:** PL/EN od startu, struktura i18n-ready (treści odseparowane od komponentów); później kolejne języki.
- **SEO:** lokalne SEO traktowane jako first-class (SSG/SSR + structured data schema.org `LocalBusiness`). Czysty client-side SPA bez SSR = błąd.
- **Realizacje:** na start brak; struktura musi przyjmować 0→N realizacji bez przebudowy (dodawanie/edycja/usuwanie nie może „rozjechać" strony).

---

## 1. Stack technologiczny — Astro vs Next.js

### Różnica fundamentalna

- **Astro (v6.x):** Islands Architecture + zero JS by default. Domyślnie statyczny HTML; interaktywność (React/Svelte/vanilla) wstrzykiwana jako „wyspy". Reszta bez runtime'u w przeglądarce.
- **Next.js (v16.x):** pełny framework React (RSC + hydratacja). Interaktywność jest regułą. Pełny stack full-stack (API routes, middleware, server actions, edge).

### Astro — za / przeciw

**Za:** topowe Core Web Vitals i SEO (Lighthouse 95–100) dla contentu; niższy próg na stronie contentowej; multi-framework islands (wyspy w React = nauka Reacta nie idzie do kosza); zero vendor lock-in (adaptery na Cloudflare/Node/AWS); tańszy hosting; **świeża synergia: Cloudflare przejął Astro w styczniu 2026** (para Astro + Cloudflare Pages najlepiej wspierana).
**Przeciw (istotne dla tego projektu):** zaleta „zero JS" w dużej części paruje, bo strona JEST animacyjnym showcase'em (hero/GSAP to i tak client-side JS); mniej dojrzały ekosystem niż React/Next; słabszy do „aplikacji" (panel/dashboard z dużym stanem); mniej gotowców do scroll-animacji w Astro.

### Next.js — za / przeciw

**Za:** jeden stack od frontu przez backend; **najlepsza ścieżka do natywnych apek (React → Expo / React Native, realne współdzielenie kodu)**; największy ekosystem (każde SDK ma przykład pod Next); dojrzałe SSR/ISR/PPR; Turbopack domyślnie (v16) — DX dogonił Astro.
**Przeciw:** wyższy próg dla zwykłej wizytówki; domyślnie cięższy (React runtime nawet dla prostych stron); hosting ciągnie w stronę Vercela i drożeje; więcej foot-gunów (RSC, granice server/client, cache).

### Przeskok między frameworkami

- **Astro → Next: łatwy**, jeśli wyspy w Astro pisane są w **React + Tailwind** (komponenty przenoszą się ~1:1; animacje GSAP bez zmian).
- **Next → Astro: trudniejszy** (wyrywanie Reacta z miejsc, gdzie był „wszędzie").

### Werdykt / decyzja

- Stack **docelowy = Next.js** (zgodny z celem: apki + sprzedaż stron + jeden stack na całe życie projektu). „Niższy próg Astro" jest realny tylko dla contentu; trudna część projektu (choreografia GSAP) jest identyczna w obu.
- **Plan na fazę nauki/MVP:** zbudować to samo równolegle — **Astro + Cloudflare** (live, darmowo) oraz **Next lokalnie** (`next dev`) — i wybrać świadomie. Jeśli wyspy w Astro robione w React + Tailwind, nic się nie marnuje.
- Pełne efekty/galerię polerować na jednym (tym, który „leży"); w obu zrobić tylko shell + jedną sekcję, by poczuć różnice.

### Pułapki specyficzne

**W Astro (a w Next nie):**

- Współdzielenie stanu między wyspami — wyspy izolowane, potrzebny most (`nanostores`). Pojawi się przy koszyku/rezerwacjach/globalnym stanie UI.
- Nawigacja „jak w aplikacji" z zachowaniem stanu — Astro to MPA (pełne przeładowanie); View Transitions to maskuje, ale persistent state/audio przez nawigację wymaga `transition:persist`.
- Glue code przy integracjach (Supabase/Stripe) — 90% tutoriali pod Next; w Astro więcej opakowywania ręcznie.
- Mutacje/formularze server-side — Next ma Server Actions first-class; Astro przez Astro Actions / API endpoints (mniej materiałów).

**W Next (a w Astro nie):**

- Przypadkowy bloat — `'use client'` rozlewa się i hydratuje pół drzewa; na stronie animacyjnej trzeba świadomie pilnować granic server/client.
- RSC foot-guns (gdzie `useState`/`useEffect`, fetch, cache/rewalidacja) — przerost formy nad treścią dla wizytówki.
- **Next na Cloudflare jest upierdliwy** (image optimization/ISR/middleware pisane pod Vercela; na CF potrzebny adapter `@opennextjs/cloudflare`, część rzeczy działa inaczej). Na etapie nauki Next wystawiać na **Vercel Hobby**, nie na siłę na Cloudflare.

---

## 2. Struktura strony

### Kluczowy insight

> Gdy brak realizacji, **sama strona jest portfolio**. Klient ma poczuć jakość, doświadczając płynności i animacji. To zdejmuje presję braku referencji.

### Proponowane sekcje (pionowy kręgosłup scrolla)

1. **Hero** — animowany; value proposition jako korzyść klienta (nie „jestem developerem"); CTA scroll + „umów rozmowę".
2. **Problem / dla kogo** — do kogo mówisz i jaki ból rozwiązujesz.
3. **„Ta strona to demo"** — meta-sekcja nazywająca to, co user czuje (płynność, szybkość na telefonie); opcjonalny interaktywny akcent.
4. **Usługi / co oferuję** — język korzyści, nie technologii.
5. **Proces współpracy** — buduje zaufanie bez realizacji (krok po kroku: rozmowa → projekt → realizacja → wsparcie).
6. **Realizacje** — sekcja pinned-horizontal / carousel; na start placeholdery / „case study w przygotowaniu"; struktura gotowa na dane.
7. **Wyróżniki / dlaczego ja** — przewaga jako client-benefit (6+ lat doświadczenia, tło enterprise, wydajność, mobile-first, SEO).
8. **Social proof** — miejsce na opinie (placeholder lub 1–2 referencje).
9. **Pakiety / „od czego zacząć"** — choćby orientacyjnie, by zdjąć barierę pierwszego kroku.
10. **O mnie** — krótko, ludzko, wiarygodnie.
11. **FAQ** — rozbraja obiekcje (czas, koszt, samodzielna edycja, czy zrobisz apkę).
12. **Kontakt / CTA** — formularz lub booking (Cal.com / Calendly); jedno jasne wezwanie.

### Model danych pod realizacje (kluczowe dla skalowalności)

- Realizacje jako **dane strukturalne, nie hardcoded HTML**. W Astro: **content collections** ze schematem (Zod). W Next: katalog MDX/JSON + walidacja.
- Schemat jednej realizacji:
  ```
  realization: {
    slug, title, client, category, tags[],
    cover, gallery[], excerpt, description (MDX),
    url, date, featured (bool), metrics?
  }
  ```
- Layout (grid/carousel) **mapuje po kolekcji** — nie zna konkretnych wpisów. Dodanie/edycja/usunięcie = zmiana jednego pliku → build → deploy. Strona nie „rozjeżdża się", bo komponent renderuje N elementów niezależnie od N.
- Później, gdy klient ma sam dodawać → podmiana źródła na headless CMS (Sanity / Payload / Supabase) **bez zmiany layoutu**.

### UX scrolla (rekomendacja)

- **Nie hijackować** globalnego kierunku scrolla (łamie gest mobilny, psuje accessibility).
- Realizacje: **desktop** = sekcja pinned, scroll pionowy tłumaczony na ruch poziomy (GSAP); **mobile** = natywny swipe carousel (`scroll-snap-type: x mandatory`). Oba skalują się do dowolnej liczby kafelków.
- Desktop/mobile: **jeden responsywny codebase z warunkową logiką animacji** (`gsap.matchMedia`), nie dwa osobne codebase'y. Uszanować `prefers-reduced-motion`.

### i18n

- Treści odseparowane od komponentów (pliki tłumaczeń / kolekcje per język) od startu. Dodanie języka później = tani dorzut.

---

## 3. Hosting + CI/CD

### Ceny i „haczyk" (stan: czerwiec 2026)

- **Vercel Hobby:** darmowy, ale **wyłącznie niekomercyjny** (regulamin; projekt zarabiający/serwujący klientów = ryzyko zawieszenia). Limity: 100 GB transferu, 1 mln function invocations, 100 build minut/mies. Pokazywanie prywatnie (bliscy, koledzy) = OK.
- **Vercel Pro:** 20 $/seat/mies., 1 TB transferu w pakiecie; nadwyżka 40 $/100 GB. Komercyjny użytek wymaga Pro.
- **Cloudflare Pages:** darmowy na zawsze, **nieograniczony transfer, użytek komercyjny dozwolony**, 500 buildów/mies., bez karty. Idealny pod statyk Astro i pod wiele małych stron klientów.
- **Gdzie realnie wchodzą koszty na Cloudflare:** dopiero przy backendzie (Workers ~100k req/dzień free, potem Workers Paid ~5 $/mies.; D1/R2 własne limity). Sam frontend wizytówki = 0 zł.
- **Drugi haczyk:** Next na Cloudflare wymaga adaptera i obejść — funkcje Next działają out-of-the-box dopiero na Vercelu (to są te 20 $).

### Decyzje hostingowe

- **Astro → Cloudflare:** jedź śmiało, darmowo, bez haczyka (frontend).
- **Next (nauka) → Vercel Hobby** dopóki niekomercyjnie; potem Vercel Pro 20 $ albo świadomie OpenNext na Cloudflare.
- **Strony klientów:** deploy na **koncie klienta** (model agencyjny) — klient właścicielem i płatnikiem; Ty wchodzisz jako członek. Dla klientów rekomendowany **Cloudflare** (komercyjny użytek darmowy).

### Domena = brak lock-inu

- Domena niezależna od hostingu; przepięcie Cloudflare → Vercel to kilkanaście minut.
- Rozdziel: rejestrator / DNS / cel (rekordy). Przepięcie = zmiana celu (i ewentualnie DNS).
- **Zalecane:** zostaw DNS na Cloudflare, podmień tylko rekordy na te z Vercela (A apex + CNAME www).
- **Pułapki:** wyłącz proxy (orange → grey / DNS-only) lub ustaw SSL **Full (strict)** — inaczej „too many redirects"; usuń starą custom domain z projektu Pages; dzień wcześniej obniż TTL (np. 5 min) dla zero downtime.

### CI/CD

- **Nie budować custom deploy w GitHub Actions.** Vercel i Cloudflare Pages mają wbudowaną integrację z Gitem: push → build → deploy + **preview deployments** na każdy PR/branch (świetne do pokazywania klientowi).
- **GitHub Actions** zostawić na **quality gates:** lint, typecheck, testy (Vitest), opcjonalnie **Lighthouse CI** (bramka wydajności pilnująca, by animacje nie zabiły Core Web Vitals).
- Model: **platforma robi deploy, Actions pilnuje jakości** — sweet spot dla wizytówek.

---

## TL;DR pod scaffold

- **Stack docelowy:** Next.js (v16) + React + Tailwind + GSAP/ScrollTrigger; i18n PL/EN; SSG/SSR + schema.org `LocalBusiness`.
- **Faza nauki/MVP:** równolegle Astro (live na Cloudflare) i Next (lokalnie / Vercel Hobby); wyspy Astro w React+Tailwind dla przenośności.
- **Realizacje:** dane strukturalne (content collections / MDX + schema), layout mapuje po kolekcji, gotowe na 0→N i na późniejszy CMS.
- **Animacje:** jeden responsywny codebase, `gsap.matchMedia`, reduced-motion fallback; realizacje = pinned-horizontal (desktop) / swipe carousel (mobile).
- **Hosting:** Astro→Cloudflare (darmowo, komercyjnie); Next→Vercel; strony klientów na ich kontach (Cloudflare).
- **CI/CD:** deploy + preview z platformy; GitHub Actions na lint/typecheck/Vitest/Lighthouse CI.
- **Domena:** brak lock-inu, przepięcie w kilkanaście minut.
