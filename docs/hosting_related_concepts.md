# Podręcznik pojęć — hosting, CMS, deployment

> Towarzysz do `hosting_first_analysis.md`. Wyjaśnia **od zera** (z analogiami, ale bez infantylizmu) wszystkie pojęcia, które padły w analizie. Żadne hasło nie wymaga znajomości innego — a jeśli wymaga, znajdziesz je w **Słowniczku pojęć-zależnych** na końcu.
>
> **Jak czytać:** każde hasło ma ten sam szablon:
> **Co to jest → Analogia → Po co / przykład → Kiedy w TWOIM projekcie → Pułapki / koszt → Darmowy tier** (dla narzędzi).
>
> Ceny: orientacyjne, stan ~połowa 2026 — rząd wielkości, nie oferta.

## Spis treści

**A. Fundamenty: pieniądze i transfer**

- [Tier (i „free tier")](#tier)
- [Recurring](#recurring)
- [Egress](#egress)

**B. Storage i wideo**

- [Cloudflare R2](#r2)
- [Cloudflare Stream](#stream)
- [Bunny Stream](#bunny)

**C. Treść: CMS i pliki**

- [Content collections](#content-collections)
- [Git CMS](#git-cms)
- [Sveltia](#sveltia)
- [Decap CMS](#decap)
- [Sanity](#sanity)
- [Storyblok](#storyblok)
- [Git LFS (i „Git LFS off")](#git-lfs)

**D. Formularze i mikro-funkcje (bez serwera)**

- [mailto](#mailto)
- [Formspree](#formspree)
- [Cal.com](#calcom)
- [Pages Functions](#pages-functions)

**E. Alternatywne platformy**

- [WordPress (WP)](#wordpress)
- [VPS](#vps)

**F. Biznes i strategia**

- [Model agencyjny](#model-agencyjny)
- [USP](#usp)

[Słowniczek pojęć-zależnych](#slowniczek) · [Indeks alfabetyczny](#indeks)

---

# A. Fundamenty: pieniądze i transfer

<a id="tier"></a>

## Tier (i „free tier")

**Co to jest.** _Tier_ to po prostu **poziom / wariant planu cenowego** usługi. Dostawcy chmurowi (Cloudflare, Vercel, Supabase…) sprzedają tę samą usługę w kilku „piętrach": im wyżej, tym wyższe limity i cena. _Free tier_ = najniższe, **darmowe piętro** — działająca usługa za 0 zł, ale z limitami (np. „1 GB miejsca", „100 GB transferu/mies.").

**Analogia.** Karnet na siłownię: _Free_ (wejście tylko rano, jedna siłownia), _Standard_, _Premium_ (24/7, wszystkie kluby, basen). Ta sama siłownia — różne progi dostępu i ceny.

**Po co istnieje.** Free tier to narzędzie marketingowe: zaczynasz za darmo, a gdy projekt urośnie ponad limity — płacisz. Dla małych projektów (jak Twoja wizytówka) free tier często **wystarcza w całości i na zawsze**.

**Kiedy w TWOIM projekcie.** Cała faza 1 stoi na free tierach: Cloudflare Pages (hosting), GitHub Actions (CI), później R2 (10 GB free), Cal.com (free). Twoja strona jest tak lekka (~4 MB), że nie zbliżysz się do limitów.

**Pułapki / koszt.**

- **Limity bywają „miękkie" albo „twarde":** miękki = po przekroczeniu płacisz za nadwyżkę; twardy = usługa się zatrzymuje/zwalnia. Zawsze sprawdź który.
- **Free tier ≠ „za darmo na zawsze bez warunków":** np. Vercel Hobby jest darmowy, ale **tylko niekomercyjnie** (regulamin), a Supabase free **usypia projekt** po tygodniu bezczynności. „Haczyk" siedzi w warunkach, nie w cenie.
- Czytaj, **co dokładnie** jest limitowane (transfer? liczba buildów? liczba użytkowników?).

---

<a id="recurring"></a>

## Recurring

**Co to jest.** _Recurring_ (z ang. „powracający") to **koszt cykliczny — płatność, która wraca co miesiąc/rok**, dopóki korzystasz z usługi. Przeciwieństwo to _one-time_ (jednorazowy) — płacisz raz i koniec.

**Analogia.** Abonament Netflix (recurring, co miesiąc) vs kupno filmu na własność na płycie (one-time, raz).

**Po co to rozróżnienie.** W modelu agencyjnym to **kluczowa oś decyzji**: czy klient po oddaniu strony płaci Ci/dostawcom **co miesiąc**, czy **raz za wykonanie i ma spokój**. Recurring to dla klienta ciągły wydatek i ciągłe ryzyko („zapomnę zapłacić → strona padnie").

**Kiedy w TWOIM projekcie.** Twój cel z analizy: **„klient 0 $ recurring"** — klient płaci Ci **raz** za zrobienie strony, a miesięcznie nie płaci nic (albo tylko ~50 zł/rok za domenę u rejestratora). To osiągasz stackiem Astro + Cloudflare Pages + Git-CMS, gdzie wszystko mieści się w darmowych tierach. Recurring pojawia się dopiero przy Supabase Pro (25 $/mies.) czy hostingu WordPressa — i wtedy świadomie płaci go klient za realną wartość.

**Pułapki / koszt.**

- Recurring „po cichu" się sumuje: 5 $ tu, 10 $ tam, 25 $ tam → nagle 40 $/mies. Pilnuj **łącznej** sumy abonamentów.
- Recurring bywa uzasadniony (aplikacja z bazą musi gdzieś „żyć" 24/7) — chodzi o to, by go **nie płacić tam, gdzie statyk wystarcza**.

---

<a id="egress"></a>

## Egress

**Co to jest.** _Egress_ to **transfer danych „na zewnątrz"** — bajty wychodzące z serwera/storage do użytkownika (lub do innej usługi). Gdy ktoś otwiera Twoją stronę i pobiera obrazek czy wideo — te megabajty to egress. (Odwrotność to _ingress_ — dane wchodzące, np. upload; ingress jest zwykle darmowy.)

**Analogia.** Magazyn z towarem. _Składowanie_ (storage) — opłata za półkę, na której leży paczka. _Wysyłka_ (egress) — opłata za każdą paczkę wyniesioną z magazynu do klienta. Możesz mieć tani magazyn, ale jeśli każda wysyłka kosztuje, to przy 10 000 wysyłek dziennie rachunek robi wysyłka, nie półka.

**Po co to wiedzieć.** To **najczęściej niedoszacowany koszt w chmurze**. Storage (trzymanie pliku) jest tani prawie wszędzie. To **egress potrafi wygenerować rachunek** — zwłaszcza przy wideo, które waży dużo i jest oglądane wielokrotnie. Jeden film 10 MB obejrzany 100 000 razy = 1 000 GB egressu.

**Przykład na liczbach.**

- Film 2 min ≈ 30 MB. 50 000 odtworzeń = 50 000 × 30 MB ≈ **1 500 GB egressu**.
- Na Supabase Storage (egress ~$0,09/GB ponad darmowe 5 GB): ≈ **135 $**. Na Cloudflare R2 (egress **0 $**): **0 $** (płacisz tylko grosze za samo składowanie). Ta sama treść, różnica jak dzień i noc.

**Kiedy w TWOIM projekcie.** To **oś całej strategii wideo** z analizy. Dlatego klipy klientów lądują na **R2** (zero egress), a nie na Supabase czy Vercelu (płatny egress). „Złota zasada wideo": _storage tani wszędzie; płaci się za egress → wybieraj dostawców z zerowym egress_.

**Pułapki / koszt.**

- Darmowe tiery często mają hojny **storage**, ale skąpy **egress** (np. Supabase 5 GB egress/mies.) — i to egress pierwszy Cię „złapie".
- Cloudflare zbudował przewagę właśnie na **zerowym egress z R2** — to nie szczegół, to powód, dla którego R2 jest w analizie.

---

# B. Storage i wideo

<a id="r2"></a>

## Cloudflare R2

**Co to jest.** R2 to **object storage** Cloudflare — usługa do trzymania plików (obrazów, wideo, PDF-ów, backupów) „w chmurze", dostępnych przez URL. „Object storage" = wrzucasz plik (obiekt) pod kluczem (ścieżką), odbierasz go linkiem. To **dysk w chmurze dla aplikacji**, nie baza danych. R2 jest kompatybilny z API Amazon S3 (branżowy standard).

**Analogia.** Wielka, nieskończona szatnia z numerkami. Dajesz plik → dostajesz numerek (URL). Pokazujesz numerek → oddają plik. Nie obchodzi Cię, na którym wieszaku leży.

**Po co / przykład.** Trzymanie mediów **osobno od kodu**: zamiast pakować 200 MB wideo do repozytorium, wrzucasz je do R2 i w stronie wstawiasz `<video src="https://media.twojadomena.pl/realizacja-1.mp4">`. Plik można podmienić bez przebudowy strony.

**Kiedy w TWOIM projekcie.** Magazyn na media wrzucane z CMS-a: **krótkie klipy klientów (~15 s), zdjęcia realizacji, screeny opinii.** Kluczowy powód wyboru: **egress = 0 $** → nawet jeśli film klienta stanie się viralem, transfer nic nie kosztuje. To filar obietnicy „klient 0 $ recurring".

**Pułapki / koszt.**

- R2 to „**goły dysk**" — daje plik, ale **nie ma odtwarzacza wideo ani adaptacyjnej jakości** (sam dobór rozdzielczości do łącza). Do krótkich MP4 idealny; do dłuższych filmów z porządnym playerem → Stream/Bunny (niżej).
- Cennik: ~$0,015 za GB/mies. składowania + opłaty za operacje (zapis/odczyt), ale **egress 0**.
- Wymaga konfiguracji (bucket, klucze dostępu, podpięcie domeny) — to już „prawie backend", choć lekki.

**Darmowy tier.** 10 GB składowania + spory limit operacji miesięcznie, **bez opłat za egress**. Dla setek krótkich klipów — wystarczy z zapasem.

---

<a id="stream"></a>

## Cloudflare Stream

**Co to jest.** Wyspecjalizowana usługa Cloudflare **do wideo** — wrzucasz plik, a ona: **transkoduje** go (robi kilka wersji jakości), serwuje przez **adaptacyjny streaming** (dobiera jakość do łącza widza) i daje **gotowy odtwarzacz** do wstawienia na stronę.

**Analogia.** R2 to surowy magazyn taśm wideo. Stream to **cała stacja telewizyjna**: bierze Twoją taśmę, przygotowuje wersje (4K/HD/SD), nadaje płynnie i daje gotowy telewizor (player), który sam przełącza jakość, gdy widzowi słabnie internet.

**Po co / przykład.** Gdy wideo ma być **dłuższe i oglądane „jak na YouTube"** — płynnie, bez buforowania, w dobrej jakości na każdym łączu. Wrzucasz film, dostajesz kod `<iframe>` lub player, wklejasz na stronę. Stream sam ogarnia transcoding i bufor.

**Kiedy w TWOIM projekcie.** Twoje **dłuższe filmy (do 2 min)** — opowieści klientów oprowadzających po realizacjach. Gdy chcesz pełną kontrolę i własny branding (zamiast logo YouTube), a R2 to za mało (brak adaptacji jakości).

**Pułapki / koszt.**

- Płacisz **za minuty**: ~$5 za 1000 minut **przechowywanych** + ~$1 za 1000 minut **obejrzanych**. Przy Twoim wolumenie to dolary, nie dziesiątki — mieści się w budżecie 15 $.
- Model „za minuty" jest świetny dla małej biblioteki filmów, ale przy ogromnej oglądalności rośnie — wtedy porównaj z Bunny.

**Darmowy tier.** Brak realnie darmowego tieru (usługa płatna od pierwszej minuty), ale koszty startowe są niskie.

---

<a id="bunny"></a>

## Bunny Stream

**Co to jest.** Odpowiednik Cloudflare Stream od firmy **Bunny.net** — również transcoding + adaptacyjny streaming + player, ale rozliczany inaczej (głównie za **storage + transfer wg regionu**), zwykle **bardzo tanio**. Bunny to budżetowy, lubiany dostawca CDN i wideo.

**Analogia.** Ta sama „stacja telewizyjna" co Stream, ale tańsza sieciówka — często najniższy rachunek na rynku za to samo.

**Po co / przykład.** Identyczny przypadek użycia jak Stream (porządny player + adaptacja jakości), gdy chcesz **wycisnąć najniższy koszt** i nie przeszkadza Ci osobny dostawca poza Cloudflare.

**Kiedy w TWOIM projekcie.** Alternatywa dla Stream przy dłuższych filmach — gdy policzysz i Bunny wyjdzie taniej dla Twojego wolumenu. W analizie figuruje jako „budżetowa alternatywa Stream".

**Pułapki / koszt.**

- ~$0,005 za GB storage + tani transfer (stawka zależy od regionu świata). Trzeba policzyć pod swój ruch — bywa najtańszy, ale model „za GB" inaczej się skaluje niż „za minuty" u Stream.
- Kolejny osobny dostawca = kolejne konto i integracja (minus dla prostoty „wszystko w Cloudflare").

**Darmowy tier.** Zwykle niewielki trial/kredyt na start; usługa zasadniczo płatna, ale grosze przy małej skali.

---

# C. Treść: CMS i pliki

> **Najpierw fundament: co to CMS?** _CMS_ (Content Management System) = **system zarządzania treścią** — narzędzie, które pozwala dodawać/edytować treść strony (teksty, zdjęcia, wpisy) **bez dotykania kodu**, zwykle przez panel w przeglądarce. WordPress to najsłynniejszy CMS. Poniżej różne podejścia do tego samego problemu — od „pliki w repo" po „pełny panel z logowaniem".

<a id="content-collections"></a>

## Content collections

**Co to jest.** Wbudowany w **Astro** mechanizm trzymania treści jako **ustrukturyzowane pliki** (Markdown/MDX/JSON/YAML) w katalogu projektu, z **schematem** opisującym, jakie pola są dozwolone (walidacja przez bibliotekę **Zod**). To nie panel — to **uporządkowana treść w kodzie**, którą Astro rozumie i z której generuje strony.

**Analogia.** Segregator z formularzami o sztywnym układzie. Każda „realizacja" to jeden formularz z polami: _tytuł, klient, zdjęcia, opis_. Schemat to **wzór formularza** — pilnuje, byś nie zapomniał pola i nie wpisał daty w rubrykę ceny. Astro czyta segregator i z każdego formularza robi podstronę.

**Po co / przykład.** Zamiast kopiować HTML dla każdej realizacji (i ryzykować, że strona się „rozjedzie"), opisujesz dane raz, a layout renderuje je automatycznie dla N wpisów. Mini-schemat:

```ts
// src/content.config.ts (uproszczenie)
import { defineCollection, z } from "astro:content";

const realizacje = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    client: z.string(),
    cover: z.string(), // ścieżka do zdjęcia
    gallery: z.array(z.string()).optional(),
    featured: z.boolean().default(false),
  }),
});

export const collections = { realizacje };
```

Dodanie realizacji = nowy plik `.mdx` z tymi polami → `git push` → strona sama się przebudowuje i pokazuje nowy kafelek.

**Kiedy w TWOIM projekcie.** **Fundament treści Twojej wizytówki** (Realizacje, opinie, FAQ, pakiety). Skoro treść edytujesz **tylko Ty** i jesteś techniczny — to w 100 % wystarcza, **bez** żadnego panelu, bazy czy logowania. Koszt 0 zł, a treść wersjonowana w Git (pełna historia, łatwy „cofnij").

**Pułapki / koszt.**

- Edycja wymaga **edytora plików i `git push`** — dla Ciebie OK, dla nietechnicznego klienta za trudne (wtedy nakładasz na to Git-CMS, niżej).
- Każda zmiana = **rebuild** strony (sekundy). Przy treści zmienianej co minutę to słabe — ale realizacje dodajesz raz na jakiś czas, więc idealne.

**Darmowy tier.** Nie dotyczy — to funkcja Astro, część kodu. Zero kosztu.

---

<a id="git-cms"></a>

## Git CMS (CMS oparty o Git)

**Co to jest.** Kategoria CMS-ów, które **zamiast bazy danych zapisują treść jako pliki w repozytorium Git**. Dają **panel w przeglądarce** (jak WordPress), ale „pod spodem" każda zmiana to **commit** do repo, który uruchamia przebudowę i deploy strony. Sveltia, Decap i (częściowo) TinaCMS to Git-CMS-y.

**Analogia.** Ładny kokpit nad tym samym segregatorem z plików (content collections). Klient klika „Zapisz" w panelu → system **po cichu wkłada formularz do segregatora i wysyła go pocztą** (commit + deploy). Klient nie wie, że istnieje Git — widzi tylko panel.

**Po co / przykład.** Łączy **wygodę panelu** (dla nietechnicznego klienta) z **zerowym kosztem bazy** (treść żyje w Git, hosting statyczny zostaje darmowy). Klient loguje się na `twojastrona.pl/admin`, edytuje tekst, wgrywa zdjęcie, klika publikuj → po chwili widać to na żywo.

**Kiedy w TWOIM projekcie.** **Najtańszy przepis na „klient z panelem, 0 $ recurring"**: Astro + Cloudflare Pages + Git-CMS + R2 na media. To rdzeń modelu agencyjnego z analizy — ten sam zestaw klonujesz na konto każdego klienta.

**Pułapki / koszt.**

- Publikacja = **rebuild** (sekundy–minuty). Świetne dla wizytówek edytowanych okazjonalnie; słabe dla treści zmienianej non-stop lub z setkami powiązanych wpisów (wtedy → Supabase/baza).
- Wymaga **logowania (OAuth)** — zwykle przez konto GitHub. Żeby klient nie musiał mieć GitHuba, stawia się mały **OAuth-proxy** (np. darmowy Cloudflare Worker), który ukrywa Git za zwykłym loginem.

**Darmowy tier.** Same narzędzia (Sveltia/Decap) są open source = 0 zł; koszt to tylko (darmowy) hosting i ewentualny proxy.

---

<a id="sveltia"></a>

## Sveltia (Sveltia CMS)

**Co to jest.** Nowoczesny, darmowy (open source) **Git-CMS** — następca/odpowiednik Decap, napisany od nowa, szybszy i z lepszym uploadem mediów. Działa jako panel `/admin` nad treścią w repo (GitHub/GitLab).

**Analogia.** Świeższy, szybszy model tego samego „kokpitu nad segregatorem" — jak nowa wersja znanej aplikacji: te same założenia, lepszy UX.

**Po co / przykład.** Dajesz klientowi panel do edycji treści **bez bazy i bez abonamentu**. Konfiguracja to jeden plik opisujący pola (analogiczne do schematu kolekcji), a Sveltia renderuje z tego formularze w panelu.

**Kiedy w TWOIM projekcie.** **Rekomendowany Git-CMS** w analizie — i dla wygody na Twojej stronie (panel zamiast ręcznej edycji plików), i jako panel dla klientów. Modern UX + dobry upload mediów (kieruje pliki np. do R2).

**Pułapki / koszt.** Jak każdy Git-CMS (rebuild przy publikacji, potrzeba OAuth). Młodszy projekt niż Decap → mniejsza społeczność, ale aktywnie rozwijany.

**Darmowy tier.** W pełni darmowy (open source). Koszt = tylko hosting (i tak darmowy).

---

<a id="decap"></a>

## Decap CMS (dawniej Netlify CMS)

**Co to jest.** Dojrzały, popularny, darmowy **Git-CMS** (wcześniej znany jako _Netlify CMS_). Ten sam pomysł co Sveltia — panel zapisujący commity — ale starszy, z większą społecznością i… nieco starszym interfejsem.

**Analogia.** Sprawdzony, „kanciasty" kombi, który jeździ od lat — mniej elegancki niż Sveltia, ale przejechał miliony kilometrów i każdy go zna.

**Po co / przykład.** Ta sama rola co Sveltia: panel `/admin` nad treścią w Git. Wybierasz Decap, gdy cenisz **dojrzałość i mnogość tutoriali** ponad świeżość UX.

**Kiedy w TWOIM projekcie.** Alternatywa dla Sveltia, gdybyś wolał bardziej „ograny" projekt z większą bazą poradników. Funkcjonalnie wymienne.

**Pułapki / koszt.** Starszy UX, wolniejszy rozwój niż Sveltia. Reszta jak przy Git-CMS (rebuild, OAuth).

**Darmowy tier.** W pełni darmowy (open source).

---

<a id="sanity"></a>

## Sanity

**Co to jest.** **Headless CMS w modelu SaaS** — czyli „CMS jako usługa" (nie trzymasz go u siebie; logujesz się do panelu Sanity, a treść pobierasz przez **API**). „Headless" = sam panel + treść, **bez** narzuconego wyglądu strony (front budujesz osobno, np. w Astro). Treść leży w chmurze Sanity, nie w Twoim repo.

**Analogia.** Wynajęta, profesjonalna redakcja z gotowym systemem. Piszesz tam treści, a Twoja strona **dzwoni po nie przez API** („dajcie mi 5 najnowszych realizacji"). Redakcja jest cudza i płatna od pewnej skali, ale dopracowana i bezobsługowa.

**Po co / przykład.** Gdy chcesz **świetny, gotowy edytor** i nie chcesz dłubać przy Git-CMS/OAuth, a treści przybywa. Front (Astro) pobiera dane z API Sanity przy buildzie lub na żywo.

**Kiedy w TWOIM projekcie.** „Opcja środka" z analizy — wygodniejsza niż Git-CMS, ale treść jest **poza Twoim repo** (u dostawcy) i płatna od pewnej skali. Dla Ciebie raczej zbędna (content collections wystarczą); rozważ dla klienta, jeśli wolisz gotowy panel niż utrzymywanie OAuth-proxy.

**Pułapki / koszt.**

- Treść **u dostawcy**, nie w Git → inny model „własności" i backupu; zależność od działania Sanity.
- Free tier hojny, ale koszt rośnie z **API/transferem/liczbą użytkowników (seats)**. Przy modelu „wielu klientów" sprawdź, czy darmowe projekty się skalują (szary obszar regulaminowy).

**Darmowy tier.** Tak, dość hojny na start (limity na liczbę użytkowników, zapytania, transfer).

---

<a id="storyblok"></a>

## Storyblok

**Co to jest.** Inny **headless CMS w modelu SaaS** (konkurent Sanity), wyróżniający się **wizualnym edytorem** — klikasz w element na podglądzie strony i edytujesz go „na żywo" (tzw. visual editing). Treść również pobierasz przez API.

**Analogia.** Jak Sanity (wynajęta redakcja), ale z „edycją przez szybę" — widzisz stronę i klikasz wprost w nią, zamiast wypełniać oddzielny formularz.

**Po co / przykład.** Gdy klient ceni **edycję „co widzę, to edytuję"** (mniejszy próg dla nietechnicznych). Front (Astro) konsumuje treść z API Storybloka.

**Kiedy w TWOIM projekcie.** Wymieniony jako alternatywa headless obok Sanity. Ta sama półka („gotowy panel SaaS, treść poza repo, płatne od skali"). Wybór Sanity vs Storyblok to głównie preferencja edytora (klasyczny vs wizualny).

**Pułapki / koszt.** Jak Sanity: zależność od dostawcy, treść poza Git, koszt rośnie ze skalą/użytkownikami.

**Darmowy tier.** Tak, dostępny plan startowy (limity na użytkowników/funkcje).

---

<a id="git-lfs"></a>

## Git LFS (i co znaczy „Git LFS off")

**Co to jest.** _Git LFS_ (Large File Storage) to **rozszerzenie Git do dużych plików binarnych** (wideo, duże obrazy, pliki graficzne). Normalnie Git fatalnie radzi sobie z dużymi binariami — zapamiętuje **każdą wersję w całości**, więc repo puchnie i wolno się klonuje. LFS zamiast pliku trzyma w repo **mały wskaźnik (pointer)**, a sam plik ląduje w osobnym magazynie LFS. „**Git LFS off**" w analizie = **świadoma decyzja, by NIE używać LFS**, tylko trzymać duże media całkiem **poza Git** (w R2).

**Analogia.** Git to dziennik, w którym przepisujesz **całą** treść przy każdej poprawce. Wklejanie do niego filmu = przepisywanie filmu klatka po klatce za każdym razem. LFS mówi: „w dzienniku zostaw tylko _karteczkę: film leży w magazynie nr 7_". „LFS off" idzie dalej: „w ogóle nie wkładaj filmów do dziennika — trzymaj je w zewnętrznym magazynie (R2) i linkuj po URL".

**Po co / przykład.** Żeby repo zostało **lekkie i szybkie** (szybki klon, szybkie CI). Dwie drogi na duże media: (1) Git LFS — pliki wskaźnikowane w repo; (2) „LFS off" — pliki całkiem poza repo, w object storage (R2), strona linkuje je po URL.

**Kiedy w TWOIM projekcie.** Analiza rekomenduje wariant **„LFS off" → media do R2**. Powód: i tak budujesz integrację z R2 (egress 0), więc po co dokładać LFS (ma własne limity i koszty u dostawcy Git). Drobne, brandowe media (logo, tła hero) zostają w repo; ciężka treść użytkowa (wideo realizacji) idzie do R2.

**Pułapki / koszt.**

- Git LFS bywa **płatny/limitowany** u hostingów Git (GitHub liczy storage i transfer LFS) — kolejny powód, by wybrać R2.
- „LFS off" oznacza, że media **nie są wersjonowane razem z kodem** — podmiana pliku w R2 nie zostawia historii w Git. Dla mediów to akceptowalne (to nie kod).

**Darmowy tier.** Git LFS na GitHubie ma niewielki darmowy limit (rzędu 1 GB storage / 1 GB transfer-mies.), potem płatny — co właśnie skłania do „LFS off + R2".

---

# D. Formularze i mikro-funkcje (bez serwera)

<a id="mailto"></a>

## mailto

**Co to jest.** `mailto:` to **specjalny rodzaj linku**, który zamiast otwierać stronę — **otwiera program pocztowy** użytkownika z gotowym, wstępnie wypełnionym mailem do Ciebie. To czysty standard HTML, **zero kodu serwerowego**.

**Analogia.** Tabliczka „Napisz do nas" z gotową kopertą i wpisanym adresem — wręczasz ją gościowi, on tylko dopisuje treść i wrzuca do własnej skrzynki (swojej poczty).

**Po co / przykład.** Najprostszy możliwy „kontakt", gdy nie chcesz żadnego backendu:

```html
<a href="mailto:kontakt@hadrianm.pl?subject=Zapytanie ze strony">
  Napisz do mnie
</a>
```

Kliknięcie otwiera Gmaila/Outlooka/Mail z adresem i tematem już wpisanym.

**Kiedy w TWOIM projekcie.** Najtańsza opcja kontaktu w fazie 1 — zero serwera, zero kosztu, działa od ręki.

**Pułapki / koszt.**

- **Słaby UX:** wymaga, by użytkownik miał skonfigurowany klient pocztowy (na telefonie zwykle OK, na desktopie bywa różnie). Nie ma „wysłano!", nie zbierasz danych w jednym miejscu.
- Adres w `mailto:` jest **widoczny dla botów spamujących** (warto lekko go zaciemnić).
- To nie jest „formularz" — niczego nie zapisuje. Gdy chcesz prawdziwy formularz z polami i potwierdzeniem → Formspree / Pages Function.

**Darmowy tier.** Nie dotyczy — to element HTML, zawsze darmowy.

---

<a id="formspree"></a>

## Formspree

**Co to jest.** **Usługa (SaaS), która odbiera dane z formularza za Ciebie** — wstawiasz na stronę zwykły `<form>` kierujący do adresu Formspree, a oni odbierają wpis i **przesyłają Ci go mailem** (i/lub zapisują w panelu). Dzięki temu masz działający formularz **bez pisania backendu**.

**Analogia.** Wynajęta recepcjonistka. Twój formularz to kartka, którą gość wypełnia; kartka wędruje do recepcjonistki (Formspree), a ona dzwoni do Ciebie z treścią (mail). Ty nie musisz siedzieć przy okienku (stawiać serwera).

**Po co / przykład.** Prawdziwy formularz kontaktowy (imię, e-mail, wiadomość, „Wyślij", potwierdzenie) na **stronie statycznej**, która sama z siebie nie umie odbierać danych:

```html
<form action="https://formspree.io/f/TWOJ_ID" method="POST">
  <input name="email" type="email" />
  <textarea name="message"></textarea>
  <button>Wyślij</button>
</form>
```

**Kiedy w TWOIM projekcie.** Lepszy UX niż `mailto:` w fazie 1, wciąż bez własnego serwera. Alternatywa: Web3Forms (podobna usługa) albo własna Pages Function (niżej), jeśli wolisz nie zależeć od zewnętrznej usługi.

**Pułapki / koszt.**

- Zewnętrzna zależność (kolejne konto; przy ich awarii formularz nie działa).
- Free tier ma **limit zgłoszeń/mies.** — dla wizytówki zwykle wystarcza.
- Dane przechodzą przez cudzy serwer (warto wiedzieć ze względu na RODO/prywatność).

**Darmowy tier.** Tak — zwykle ~50 zgłoszeń/mies. za darmo, wyżej płatny plan.

---

<a id="calcom"></a>

## Cal.com

**Co to jest.** **Narzędzie do umawiania spotkań** (open source, dostępne też jako SaaS) — odpowiednik Calendly. Udostępniasz link/okno, w którym ktoś wybiera wolny termin z Twojego kalendarza i rezerwuje rozmowę; system pilnuje dostępności i wysyła potwierdzenia.

**Analogia.** Samoobsługowy terminarz u dentysty wywieszony online: pacjent widzi wolne sloty, klika jeden, dostaje potwierdzenie — bez telefonowania i ustalania „a może w czwartek?".

**Po co / przykład.** Sekcja „Umów rozmowę" na stronie: osadzasz okno Cal.com, klient sam wybiera termin 30-min konsultacji. Zero wymiany maili, automatyczne przypomnienia.

**Kiedy w TWOIM projekcie.** Rekomendowane CTA „umów rozmowę" w fazie 1 — załatwia booking **bez budowania własnego systemu rezerwacji** i bez backendu.

**Pułapki / koszt.**

- Wersja SaaS na darmowym planie wystarcza do podstawowego umawiania; zaawansowane funkcje (zespoły, routing, integracje) bywają płatne.
- Można **self-hostować** (open source) dla pełnej kontroli, ale to już koszt utrzymania — na start niepotrzebne.

**Darmowy tier.** Tak — darmowy plan indywidualny pokrywa podstawowe umawianie spotkań.

---

<a id="pages-functions"></a>

## Pages Functions

**Co to jest.** **Mała funkcja serwerowa** uruchamiana na infrastrukturze Cloudflare „przy okazji" hostowania strony na Pages. Pozwala dorzucić **odrobinę logiki serwerowej** (odebrać formularz, wysłać mail, obsłużyć logowanie) do **statycznej** strony — bez stawiania i utrzymywania osobnego serwera. To wariant Cloudflare Workers wbudowany w Pages.

**Analogia.** Strona statyczna to wystawa sklepowa — sama nic nie „robi", tylko pokazuje. Pages Function to **mały automat obok witryny**: wrzucasz kartkę (dane formularza), automat coś z nią robi (wysyła mail) i oddaje bilecik („dziękujemy"). Nie musisz w tym celu wynajmować całego biura (serwera).

**Po co / przykład.** Odebranie POST z formularza i wysłanie maila (przez np. Resend/MailChannels) — własna alternatywa dla Formspree, bez zewnętrznej zależności. Albo **OAuth-proxy** dla Git-CMS, żeby klient logował się do panelu bez konta GitHub. Plik `functions/kontakt.js` z funkcją obsługującą żądanie i już — Cloudflare sam ją uruchamia pod `/kontakt`.

**Kiedy w TWOIM projekcie.** Twoja **pierwsza realna „mikro-funkcja serwerowa"**: formularz kontaktowy we własnej obsłudze lub OAuth-proxy dla Sveltii. To **powód, dla którego Pages (a nie GitHub Pages) jest właściwym wyborem** — GitHub Pages takich funkcji nie ma.

**Pułapki / koszt.**

- To wciąż **kod serwerowy** — trzeba go napisać i utrzymać (logika, sekrety/klucze, obsługa błędów). Dla prostych potrzeb Formspree bywa szybszy.
- Działa w specyficznym środowisku (Workers runtime) — nie każda biblioteka Node.js zadziała tak samo.

**Darmowy tier.** Tak — Cloudflare daje hojny darmowy limit wywołań (rzędu 100 000 żądań/dzień), z zapasem dla wizytówki.

---

# E. Alternatywne platformy

<a id="wordpress"></a>

## WordPress (WP)

**Co to jest.** Najpopularniejszy na świecie **CMS** (napisany w PHP, z bazą MySQL), na którym stoi ogromna część internetu. „WP" = skrót od WordPress. Daje **gotowy panel administracyjny**, tysiące **motywów** (wyglądów) i **wtyczek** (pluginów) dodających funkcje (formularze, sklep, SEO) — często bez kodowania.

**Analogia.** Wielki market budowlany z gotowymi modułami: zamiast budować dom od zera (kod), składasz go z gotowych ścian i mebli (motyw + wtyczki). Szybko stawiasz „dom standardowy", ale niestandardowa, designerska willa (Twoje animacje GSAP) wymaga walki z gotowymi modułami.

**Po co / przykład.** Gdy klient chce **prostą stronę szybko (1–2 tyg.)** i znajomy panel do samodzielnej edycji, bez ambitnych animacji. Instalujesz motyw, kilka wtyczek, wypełniasz treścią — gotowe w kilka dni.

**Kiedy w TWOIM projekcie.** Wg analizy — **osobny, „tańszy/szybszy" segment oferty** dla mniej wymagających klientów. **Nie** dla stron klasy Twojej wizytówki: ciężkie animacje (GSAP/ScrollTrigger/3D/pinning) to na WP regres (gorsze Core Web Vitals, walka z motywem, trudniej o tę płynność, która jest Twoim USP). Ewentualnie _headless WP_ (WP jako sam panel + Astro jako front przez API) — ale to komplikacja i koszt hostingu WP zostają.

**Pułapki / koszt.**

- **Wymaga hostingu z PHP + MySQL** → **nie ma sensownego darmowego tieru** jak statyk. Tani managed WP / VPS to ~5–15 $/mies. → **łamie obietnicę „0 $ recurring"** (płaci to klient).
- Bezpieczeństwo i aktualizacje: WP i wtyczki trzeba **regularnie aktualizować** (popularny cel ataków).
- Wydajność „z pudełka" bywa słaba (ciężkie motywy, dużo wtyczek) — wymaga optymalizacji.

**Darmowy tier.** Samo oprogramowanie WordPress jest darmowe (open source), ale **musi gdzieś działać** — a hosting PHP/MySQL kosztuje (recurring). To kluczowa różnica wobec statyka na Cloudflare.

---

<a id="vps"></a>

## VPS

**Co to jest.** _VPS_ (Virtual Private Server) = **wirtualny prywatny serwer** — wydzielony „kawałek" fizycznego serwera, który wynajmujesz na własność (własny system, własne zasoby CPU/RAM/dysk). Masz pełną kontrolę: instalujesz, co chcesz (np. WordPress, bazę, własną aplikację), ale też **sam wszystkim zarządzasz** (konfiguracja, aktualizacje, bezpieczeństwo, kopie zapasowe).

**Analogia.** Wynajęte mieszkanie w bloku. Budynek (fizyczny serwer) jest współdzielony, ale Twoje mieszkanie (VPS) jest tylko Twoje — urządzasz je dowolnie. W zamian **sam sprzątasz, naprawiasz i pilnujesz zamków** (administracja). Przeciwieństwo to „hotel z obsługą" (usługi zarządzane jak Cloudflare Pages, gdzie nie dotykasz serwera).

**Po co / przykład.** Gdy potrzebujesz **pełnej swobody** i czegoś, czego usługi zarządzane nie dają: własny serwer WordPressa, własna baza, niestandardowa aplikacja, self-host Cal.com/Supabase. Wynajmujesz VPS (np. Hetzner, DigitalOcean), dostajesz „goły" Linux i budujesz na nim.

**Kiedy w TWOIM projekcie.** W analizie pojawia się głównie jako **jedna z dróg hostowania WordPressa** dla klienta (~5–15 $/mies.). **Dla Twojej wizytówki niepotrzebny** — statyk na Cloudflare jest tańszy (0 zł), szybszy i bezobsługowy. VPS to świadomy wybór „więcej kontroli kosztem własnej pracy administratora".

**Pułapki / koszt.**

- **Ty jesteś administratorem:** aktualizacje, bezpieczeństwo, backupy, monitoring — to realna, ciągła robota (albo ryzyko).
- Recurring **zawsze** (serwer działa 24/7, płacisz nawet przy zerowym ruchu) — inaczej niż statyk, który stoi za darmo.
- Skalowanie i niezawodność na Tobie (jeden VPS = jeden punkt awarii).

**Darmowy tier.** Zasadniczo brak — VPS to usługa płatna (najtaniej kilka $/mies.). Bywają drobne kredyty na start u dostawców.

---

# F. Biznes i strategia

<a id="model-agencyjny"></a>

## Model agencyjny

**Co to jest.** Sposób prowadzenia działalności, w którym **tworzysz strony/produkty dla wielu klientów**, a kluczowa zasada brzmi: **to klient jest właścicielem i płatnikiem** swoich zasobów (konta hostingu, domeny, ewentualnych abonamentów), a Ty wchodzisz jako **wykonawca/współpracownik** z dostępem. Każdy klient = osobny projekt na **jego** koncie.

**Analogia.** Architekt/wykonawca budujący domy na zlecenie. Dom (strona) stoi na **działce klienta** (jego konto), rachunki za prąd (hosting) płaci **klient**, a Ty bierzesz za **postawienie domu** (wykonanie) i ewentualnie za serwis. Nie budujesz wszystkich domów na swojej działce i nie płacisz cudzych rachunków.

**Po co / przykład.** Żeby działalność **skalowała się bez narastania Twoich kosztów i ryzyka**: 20 klientów = 20 ich kont/rachunków, nie 20 pozycji na Twojej karcie. Konkretnie: zakładasz projekt na koncie Cloudflare **klienta**, dodajesz siebie jako członka, oddajesz gotową stronę → klient płaci za swoje (domena/ewentualny abonament), Ty masz dostęp do edycji.

**Kiedy w TWOIM projekcie.** Fundament strategii „strony dla klientów" z analizy. Wybór Cloudflare (komercyjny użytek darmowy) i Git-CMS (0 $ recurring) jest podporządkowany właśnie temu modelowi — **Ty raz inkasujesz za wykonanie, klient nie ma comiesięcznych kosztów** (albo minimalne, które płaci sam).

**Pułapki / koszt.**

- Wymaga dyscypliny w **rozdzieleniu kont/własności** (kto jest właścicielem domeny i hostingu — to bywa źródłem konfliktów; ustal na starcie).
- Model „per-klient, osobny projekt" jest prosty na start, ale przy **wielu** klientach kuszące staje się _multi-tenant_ (jedna platforma dla wszystkich) — to inny, droższy/trudniejszy etap (patrz Supabase + RLS w analizie).

**Darmowy tier.** Nie dotyczy — to model biznesowy, nie usługa.

---

<a id="usp"></a>

## USP

**Co to jest.** _USP_ (Unique Selling Proposition) = **unikalna propozycja sprzedaży** — ta jedna rzecz, która **wyróżnia Cię na tle konkurencji** i jest powodem, dla którego klient wybiera właśnie Ciebie. Odpowiedź na pytanie „dlaczego Ty, a nie ktoś tańszy/większy?".

**Analogia.** W półce identycznych produktów USP to **wyróżniająca etykieta**: „jako jedyny robię X". Volvo = „bezpieczeństwo", Apple = „prostota i design". To nie lista cech — to **jedno mocne „za co Cię pamiętają"**.

**Po co / przykład.** USP organizuje całą ofertę i marketing: wiesz, co podkreślać i czego nie rozmywać. Przykład: „strony, które **realnie śmigają na telefonie** i wyglądają jak aplikacja premium" — i temu podporządkowujesz każdą decyzję.

**Kiedy w TWOIM projekcie.** Twoje USP w analizie to **płynność i jakość animacji** (sama strona = dowód jakości, „strona = portfolio"). To dlatego WordPress jest „regresem" — psułby właśnie ten wyróżnik. Każda decyzja techniczna (Astro, GSAP, Core Web Vitals) **broni USP**: jeśli coś obniża płynność, podkopuje powód, dla którego klient ma Cię wybrać.

**Pułapki / koszt.**

- USP musi być **prawdziwe i odczuwalne** dla klienta (płynność, którą _czuje_), nie techniczny żargon („używam GSAP" nic mu nie mówi — „działa jak natywna apka" już tak).
- Zbyt wiele „USP" naraz = brak USP. Jedno mocne wyróżnienie > pięć przeciętnych.

**Darmowy tier.** Nie dotyczy — to pojęcie marketingowe.

---

<a id="slowniczek"></a>

# Słowniczek pojęć-zależnych

Krótkie definicje terminów, które przewijają się przy powyższych hasłach (po 1–2 zdania):

- **Serwer vs klient** — _klient_ to przeglądarka użytkownika (jego urządzenie); _serwer_ to komputer w sieci, który dostarcza stronę/dane. „Bez backendu" = bez własnej logiki po stronie serwera.
- **Backend / frontend** — _frontend_ to to, co widzi i klika użytkownik (HTML/CSS/JS w przeglądarce); _backend_ to logika i dane po stronie serwera (bazy, autoryzacja, przetwarzanie).
- **CDN** (Content Delivery Network) — sieć serwerów rozsianych po świecie, trzymających **kopie** Twojej strony blisko użytkownika → szybsze ładowanie. Cloudflare to przede wszystkim wielki CDN.
- **Static / SSG** (Static Site Generation) — strona zbudowana **z góry** do gotowych plików HTML; serwer tylko je podaje, nic nie liczy „w locie". Najtańsze i najszybsze. To tryb Twojego Astro (`output: "static"`).
- **SSR** (Server-Side Rendering) — strona generowana **na żądanie** na serwerze (potrzebna, gdy treść jest dynamiczna/personalizowana). Wymaga działającego serwera (koszt).
- **Build** — proces przekształcenia kodu źródłowego w gotowe pliki strony (`pnpm build` → katalog `dist/`).
- **Deploy** — wystawienie zbudowanej strony „na świat" (na hosting), tak by była dostępna pod adresem.
- **Runtime** — środowisko, w którym **działa** kod (np. „Workers runtime" Cloudflare). „Bez runtime'u serwerowego" = nic nie musi działać 24/7, by podać stronę.
- **API** — umówiony sposób, w jaki programy rozmawiają ze sobą („daj mi 5 realizacji" → odpowiedź z danymi). Headless CMS-y oddają treść przez API.
- **Headless** — system treści **bez narzuconego wyglądu**: daje surowe dane (przez API), a wygląd budujesz osobno. „Headless CMS" = panel + treść, front po Twojej stronie.
- **OAuth** — standard **bezpiecznego logowania** cudzym kontem („zaloguj przez GitHub/Google") bez podawania hasła obcej stronie. Git-CMS używa go do wpuszczania edytorów.
- **OAuth-proxy** — mały pośrednik (np. Cloudflare Worker), który obsługuje logowanie OAuth, by np. ukryć GitHub za zwykłym panelem dla klienta.
- **Repozytorium (repo) / Git** — _Git_ to system wersjonowania kodu (zapamiętuje każdą zmianę, pozwala cofać); _repo_ to konkretny projekt w Git (tu: `mateuszhadrian/hadrianm-web`).
- **Commit** — pojedynczy, zapisany „punkt zmiany" w Git (z opisem, co i kiedy zmieniono).
- **Object storage** — magazyn plików-obiektów w chmurze, adresowanych po kluczu/URL (np. R2). To „dysk dla aplikacji", nie baza danych.
- **Transcoding** — przerobienie wideo na **kilka wersji jakości/formatów**, by dało się je płynnie streamować na różnych łączach. Robią to Stream/Bunny.
- **Adaptacyjny streaming** — odtwarzacz **sam dobiera jakość** wideo do prędkości łącza widza (spada internet → niższa rozdzielczość zamiast buforowania).
- **SaaS** (Software as a Service) — oprogramowanie **wynajmowane jako usługa** w chmurze (logujesz się i używasz; nie instalujesz u siebie). Sanity, Storyblok, Formspree, Cal.com (wersja hostowana) to SaaS.
- **Core Web Vitals** — zestaw mierzalnych wskaźników jakości strony Google'a (szybkość, stabilność, responsywność); wpływają na SEO i odczucie „płynności".
- **RLS** (Row Level Security) — mechanizm bazy (Postgres/Supabase) ograniczający **dostęp do konkretnych wierszy** wg reguł (np. „klient widzi tylko swoje dane") — kluczowy pod multi-tenant.
- **Multi-tenant** — jedna instancja systemu obsługująca **wielu klientów naraz**, z izolacją ich danych (przeciwieństwo: osobny projekt per klient).
- **DNS** — „książka telefoniczna internetu": tłumaczy domenę (`hadrianm.pl`) na adres serwera. Trzymanie DNS na Cloudflare daje elastyczność przepinania hostingu.

---

<a id="indeks"></a>

# Indeks alfabetyczny

- [Bunny Stream](#bunny) — tania alternatywa Cloudflare Stream (wideo)
- [Cal.com](#calcom) — umawianie spotkań (booking) bez backendu
- [Cloudflare R2](#r2) — magazyn plików z zerowym egress
- [Cloudflare Stream](#stream) — hosting wideo z transcodingiem i playerem
- [Content collections](#content-collections) — ustrukturyzowana treść w plikach (Astro)
- [Decap CMS](#decap) — dojrzały Git-CMS (d. Netlify CMS)
- [Egress](#egress) — transfer danych „na zewnątrz" = główny koszt
- [Formspree](#formspree) — odbieranie formularzy jako usługa
- [Free tier / Tier](#tier) — poziomy planu cenowego; darmowe piętro
- [Git CMS](#git-cms) — CMS zapisujący treść jako commity w repo
- [Git LFS (off)](#git-lfs) — duże pliki w Git; decyzja, by ich tam NIE trzymać
- [mailto](#mailto) — link otwierający program pocztowy
- [Model agencyjny](#model-agencyjny) — klient = właściciel i płatnik zasobów
- [Pages Functions](#pages-functions) — mikro-funkcje serwerowe na Cloudflare Pages
- [Recurring](#recurring) — koszt cykliczny (miesięczny/roczny)
- [Sanity](#sanity) — headless CMS (SaaS), treść przez API
- [Storyblok](#storyblok) — headless CMS (SaaS) z edytorem wizualnym
- [Sveltia](#sveltia) — nowoczesny, rekomendowany Git-CMS
- [USP](#usp) — unikalna propozycja sprzedaży (czym się wyróżniasz)
- [VPS](#vps) — wirtualny prywatny serwer (pełna kontrola, sam administrujesz)
- [WordPress (WP)](#wordpress) — najpopularniejszy CMS (PHP/MySQL)
