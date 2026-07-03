# Dostosowanie architektury pod klienta — admin (Ty) vs klient

> **Cel dokumentu.** Jak w przyszłości dostosować **oba** warianty
> ([Sveltia](./hosting_second_analysis_sveltia.md) i [Sanity](./hosting_second_analysis_sanity.md)),
> żeby przy stronach klienckich zachować dwie rzeczy naraz:
>
> 1. **Ty = admin z pełną władzą.** Trzymasz kod i możesz „wyłączyć" stronę, jeśli
>    klient nie zapłaci (albo żeby nie popsuł czegoś, czego nie powinien ruszać).
> 2. **Klient = wąski dostęp.** Może tylko dodawać/edytować/usuwać treść w
>    konkretnych sekcjach (dokładnie tak, jak dziś działa u Ciebie „Realizacje").
>
> Dokument odpowiada też wprost na Twoje dwa pytania:
> **(pyt. 8)** czy klient musi mieć osobny GitHub, czy repo zostaje tylko u Ciebie;
> **(pyt. 13)** jak to się ma do modelu agencyjnego i płatnych progów.

---

## 0. Zasada nadrzędna: własność = dźwignia

„Wyłączenie strony, gdy klient nie płaci" nie jest sztuczką techniczną — to
**kwestia tego, na czyim koncie leżą zasoby**. Kto jest właścicielem zasobu, ten
decyduje, czy zasób działa. Są **trzy niezależne dźwignie**:

| Dźwignia            | Co kontroluje                                  | Siła „wyłączenia"                     |
| ------------------- | ---------------------------------------------- | ------------------------------------- |
| **Domena / DNS**    | czy `klient.pl` w ogóle prowadzi do strony     | najmocniejsza (cała strona znika)     |
| **Hosting / deploy**| czy nowa wersja się publikuje i czy strona żyje| mocna, czysta, odwracalna             |
| **Kod / treść**     | czy klient może zabrać projekt gdzie indziej   | strategiczna (blokuje „ucieczkę")     |

Kill-switch = **wstrzymanie deployu i/lub odcięcie dostępu** po Twojej stronie —
bez kasowania treści klienta. To odwracalne: płaci → włączasz z powrotem.

> **Ważne (etyka/prawo).** To standardowa dźwignia we freelancingu: wstrzymanie
> **publikacji/utrzymania** do czasu zapłaty. Zapisz to w umowie (co i kiedy
> „gaśnie" przy braku płatności, jaki jest okres karencji, jak następuje przekazanie
> po pełnej zapłacie). Nie chodzi o niszczenie danych klienta, tylko o zawieszenie
> usługi. Trzymaj się tego — jest czyste i obronne.

---

## 1. Odpowiedź na pytanie 8 — czy klient musi mieć osobny GitHub?

**To zależy od wariantu i od tego, jak mocno chcesz rozdzielić „kod" od „treści".**

### Wariant Sveltia (Git-CMS) — tu jest niuans

Sveltia zapisuje treść jako **commit na GitHubie**, więc „kto edytuje treść" musi
mieć jakiś dostęp do repozytorium. GitHub nadaje uprawnienia **na poziomie całego
repo** (nie da się natywnie dać dostępu tylko do jednego folderu). Stąd trzy
modele:

- **Model A — repo tylko u Ciebie, klient BEZ GitHuba (rekomendowany dla prostoty).**
  Klient nie ma konta GitHub i nie loguje się do repo. Treść w jego imieniu
  commit-uje **dedykowane konto techniczne** (np. „bot" GitHub, którego posiadasz
  Ty), a klient używa wyłącznie panelu schowanego za logowaniem, które kontrolujesz.
  Zaleta: klient nie widzi kodu i nie może go zabrać. Wada: to Twoje konto
  techniczne stoi za zapisami — trzeba to poprawnie ustawić (patrz §2).
- **Model B — dwa repozytoria: kod u Ciebie, treść z dostępem klienta.**
  `klient-site` (kod, Astro, konfiguracja) — **Twoje konto, klient bez dostępu**.
  `klient-content` (same pliki JSON realizacji + ewentualnie referencje do R2) —
  **klient dostaje dostęp write tylko tu**. Build strony pobiera treść z repo
  treści. To najczystsze rozdzielenie „kod vs treść": klient realnie widzi tylko
  treść, a kill-switch na kod/deploy zostaje u Ciebie. Wada: dwa repo + krok
  „build ściąga treść".
- **Model C — jedno repo, klient jako współpracownik (najprostszy, najsłabsza izolacja).**
  Klient dostaje konto GitHub i rolę **write** do jednego repo. Widzi kod (choć
  go nie rusza — używa panelu). Chronisz `main` (branch protection) i/lub włączasz
  „editorial workflow" Sveltii (zmiany idą jako propozycje do Twojej akceptacji).
  Wada: klient technicznie widzi kod.

**Rekomendacja dla Sveltii:** docelowo **Model B** (dwa repo) — daje realną
izolację „klient = tylko treść" i najmocniejszy kill-switch. Jeśli chcesz mniej
pracy przy pierwszym kliencie — **Model A** (klient bez GitHuba).

### Wariant Sanity — tu klient NIGDY nie potrzebuje GitHuba

W Sanity **kod i treść są osobno z definicji**: kod jest w repo (Twoim), a treść w
chmurze Sanity. Klient dostaje konto **Sanity** (nie GitHub) i rolę **Editor** w
projekcie — edytuje treść, a kodu nie widzi w ogóle. To najczystszy podział z
pudełka. Odpowiedź wprost: **przy Sanity klient nie ma i nie potrzebuje GitHuba.**

> **Wniosek porównawczy:** jeśli priorytetem jest „klient nie dotyka kodu bez
> żadnej gimnastyki", **Sanity wygrywa wygodą izolacji**. Sveltia dogania to
> Modelem B (dwa repo), ale kosztem odrobiny konfiguracji.

---

## 2. Konfiguracja pod klienta — wariant Sveltia

### 2.1 Ograniczenie klienta do konkretnych sekcji

Klient widzi w panelu **tylko to, co jest w `config.yml`**. Jeśli wystawisz tylko
kolekcję „Realizacje", to tylko ją zobaczy — struktura strony, layout, sekcje
techniczne pozostają poza panelem. Dodatkowo per kolekcja sterujesz prawami:

```yaml
collections:
  - name: "realizacje"
    label: "Realizacje"
    create: true # może dodawać
    delete: true # może usuwać
    # (brak wystawienia innych sekcji = klient ich nie tknie)
```

Chcesz, by klient tylko **edytował** istniejące wpisy (bez dodawania/usuwania)?
Ustaw `create: false`, `delete: false`.

### 2.2 Rozdzielenie kodu i treści (Model B)

- Repo `klient-site` (Twoje): cały kod Astro; klient bez dostępu.
- Repo `klient-content` (klient ma write): `realizacje/*.json`.
- W `klient-site` build pobiera treść z `klient-content` (np. jako zależność w
  kroku builda albo git submodule). Sveltia `backend.repo` wskazuje `klient-content`.
- Kill-switch: wstrzymujesz deploy w Pages (Twoje konto) — treść klienta zostaje
  nietknięta, ale strona się nie aktualizuje/nie żyje.

### 2.3 Kill-switch — konkretne pokrętła (Sveltia)

- **Wstrzymaj publikację:** Cloudflare Pages (Twoje konto) → projekt → wstrzymaj/
  usuń ostatni deployment albo odłącz integrację Git. Strona przestaje się
  aktualizować; przy odłączeniu domeny — przestaje działać.
- **Odetnij logowanie do panelu:** w Workerze OAuth (Twoje konto) usuń klienta z
  `ALLOWED_DOMAINS` lub wyłącz Workera → klient nie wejdzie do panelu.
- **Odetnij DNS:** jeśli DNS jest u Ciebie (patrz §4) — najmocniejsze, cała strona
  znika.
- Wszystko **odwracalne**: przywracasz po zapłacie.

---

## 3. Konfiguracja pod klienta — wariant Sanity

### 3.1 Ograniczenie klienta do sekcji

- Klient = członek projektu z rolą **Editor** (nie Administrator). Edytuje treść,
  nie rusza schematu, ustawień, płatności ani członków.
- W projekcie masz tylko model „Realizacja", więc klient siłą rzeczy edytuje
  wyłącznie realizacje. Chcesz wiele sekcji, ale różne prawa? Na planach płatnych
  Sanity są **role niestandardowe** (uprawnienia per typ dokumentu). Na darmowym
  masz Administrator/Editor/Viewer — dla „jednej sekcji" Editor wystarcza.
- Twardsza izolacja bez płatnych ról: **osobny `dataset`** albo osobny projekt na
  część, której klient nie ma dotykać.

### 3.2 Kill-switch — konkretne pokrętła (Sanity)

- **Wstrzymaj publikację strony:** Cloudflare Pages (Twoje konto) — jak w Sveltii.
  Uwaga: w Sanity treść żyje w chmurze Sanity, więc „wyłączenie" to głównie
  zatrzymanie **deployu strony** i/lub DNS, nie samego Sanity.
- **Odetnij dostęp do panelu:** Sanity → Members → usuń/zawieś klienta.
- **Kontrola projektu Sanity:** jeśli projekt Sanity jest na **Twoim** koncie
  (klient tylko jako Editor), to Ty jesteś właścicielem treści i dostępu — mocna
  dźwignia. Jeśli projekt jest na koncie **klienta**, tę dźwignię tracisz (patrz §5).

---

## 4. Kto trzyma domenę (dotyczy obu wariantów)

- **Rekomendacja na czas współpracy / dla dźwigni:** DNS domeny klienta prowadzisz
  na **swoim** koncie Cloudflare (lub na koncie klienta, ale z Twoim dostępem
  administracyjnym). Wtedy „wyłączenie" jest natychmiastowe i kompletne.
- **Docelowo (po pełnej zapłacie):** przekazujesz domenę/klientowi pełną kontrolę.
  Zapisz moment przekazania w umowie.
- **Kompromis:** klient jest formalnym właścicielem domeny (jego marka), ale na
  czas trwania usługi to Ty administrujesz strefą DNS. Wtedy dźwignią pozostaje
  **deploy** (hosting), nawet jeśli DNS ostatecznie należy do klienta.

---

## 5. Odpowiedź na pytanie 13 — model agencyjny i płatne progi

Twoje pytanie: *„jak klient zacznie przekraczać płatne progi, to musi się odezwać
do mnie i ja mu wykupuję? Czy to jedyna opcja — czy wtedy nie działam już w
modelu agencyjnym?"*

Najpierw rozdzielmy dwie rzeczy, które łatwo pomylić:

- **Model agencyjny** = *Ty budujesz i (opcjonalnie) utrzymujesz stronę per
  klient, jako powtarzalny „przepis".* To model **operacyjny** — masz go w każdym
  z poniższych wariantów rozliczeń.
- **Kto płaci za zasoby** = *na czyim koncie i czyją kartą naliczają się koszty,
  gdy strona przekroczy darmowe progi.* To model **rozliczeniowy**.

Progi darmowe przekraczasz **rzadko** (Cloudflare Pages/R2/Sveltia praktycznie
zawsze 0 zł przy wizytówce; realnie „progi" to głównie **wideo** — Stream/Mux — i
przy Sanity ruch/API). Masz **trzy** modele rozliczeniowe:

### Model 1 — zasoby na koncie klienta, karta klienta (rekomendowany domyślnie)

- Konta (Cloudflare/Sanity) należą do klienta; Ty masz dostęp administracyjny.
- Gdy coś przekroczy darmowy próg — **karta klienta nalicza automatycznie**,
  klient **nie musi się do Ciebie odzywać**, a Ty niczego nie wykupujesz.
- **Model agencyjny działa w pełni** — to jest właśnie wzorzec „per klient na jego
  koncie" z [analizy hostingowej](./hosting_first_analysis.md).
- Dźwignia: trzymasz **deploy + repo/kod + (opcjonalnie) DNS**. Kill-switch nadal
  masz, mimo że rachunki idą na klienta.
- To jest odpowiedź „nie, nie musisz nic wykupywać i tak, dalej działasz agencyjnie".

### Model 2 — zasoby na Twoim koncie, Ty płacisz i refakturujesz (managed)

- Wszystko na **Twoim** koncie; klientowi wystawiasz **abonament** (koszt + Twoja
  marża). Gdy klient przekracza progi, **to Ty dokupujesz** i doliczasz do faktury.
- Najmocniejszy kill-switch i pełna kontrola, ale bierzesz na siebie ryzyko
  rozliczeń i obsługę per klient.
- **To wciąż model agencyjny** — tyle że w wersji „managed/utrzymaniowej"
  (recurring dla Ciebie i dla klienta). Sensowny, gdy klient chce „święty spokój".

### Model 3 — hybryda (praktyczny kompromis)

- Zasoby **darmowe-na-zawsze** (Pages, Sveltia, R2 w limicie) — mogą być na Twoim
  koncie (zero kosztu, maksymalna dźwignia).
- Zasoby **metrykowane, które mogą urosnąć** (wideo Stream/Mux, cięższe Sanity) —
  na koncie/karcie **klienta**, żeby przekroczenia nie obciążały Ciebie.
- Klient odzywa się do Ciebie tylko, gdy chce **nową funkcję** (np. „dodajmy
  wideo"), a nie przy każdym rachunku.

**Rekomendacja:** domyślnie **Model 1** (klient płaci za swoje, Ty trzymasz
dźwignie deploy/kod/DNS). Sveltia + Cloudflare sprawiają, że progi płatne prawie
nie występują, więc pytanie „kto dopłaca" najczęściej w ogóle nie zachodzi.
**Model 2** rezerwuj dla klientów, którzy świadomie kupują „utrzymanie pod klucz".

> **Sveltia vs Sanity a progi.** Sveltia + Cloudflare skaluje się na wielu klientów
> najłatwiej „na zero" (nie ma per-projektowego licznika treści). Sanity ma
> darmowy tier per projekt, ale przy wielu klientach pilnujesz limitów i regulaminu
> mnożenia darmowych projektów — to argument, by dla powielanego modelu agencyjnego
> preferować Sveltię, a Sanity brać, gdy pojedynczy klient chce wygodny panel SaaS.

---

## 6. Rekomendowany model docelowy (ściąga)

| Element                    | Twoja strona (`hadrianm.pl`) | Strona klienta (rekomendacja)                    |
| -------------------------- | ---------------------------- | ------------------------------------------------- |
| CMS                        | Sveltia (Twój panel)         | Sveltia (Model B: kod u Ciebie, treść klienta) lub Sanity (Editor) |
| Repo/kod                   | Twoje                        | **Twoje** (klient bez dostępu do kodu)            |
| Treść                      | Twoje repo                   | Sveltia: repo treści klienta / Sanity: chmura Sanity |
| Hosting/deploy             | Twoje konto CF Pages         | **Twoje konto** (dźwignia) lub konto klienta z Twoim dostępem |
| Domena/DNS                 | Twoje                        | DNS u Ciebie na czas usługi; własność → klient po zapłacie |
| Płatne progi (wideo itp.)  | Ty                           | **karta klienta** (Model 1) lub refaktura (Model 2) |
| Kill-switch                | n/d                          | wstrzymanie deployu / odcięcie panelu / DNS       |

---

## 7. Checklist wdrożenia pod klienta

**Wspólne:**
- [ ] Umowa: co „gaśnie" przy braku płatności, karencja, moment przekazania praw/domeny.
- [ ] Domena: ustalone, kto jest właścicielem i kto administruje DNS w trakcie usługi.
- [ ] Hosting: projekt Pages tam, gdzie chcesz mieć dźwignię (rekomendacja: Twoje konto).
- [ ] Wybrany model rozliczeniowy (1/2/3) i spisany w ofercie.

**Sveltia:**
- [ ] Model A (klient bez GitHuba) lub B (dwa repo) wybrany i skonfigurowany.
- [ ] `config.yml` wystawia klientowi **tylko** dozwolone sekcje; `create/delete` wg potrzeby.
- [ ] Worker OAuth + `ALLOWED_DOMAINS` pod kontrolą (element kill-switcha).
- [ ] (Model B) build `klient-site` pobiera treść z `klient-content`.

**Sanity:**
- [ ] Projekt Sanity na **Twoim** koncie; klient dodany jako **Editor**.
- [ ] CORS ustawiony; webhook → Deploy Hook Pages działa.
- [ ] (Opcjonalnie) osobny `dataset`/projekt dla części poza zasięgiem klienta.
- [ ] Wideo/cięższe zasoby rozliczane wg wybranego modelu (1/2/3).

---

## 8. Klonowanie „przepisu" na kolejnych klientów

Docel z Twojego briefu — „sklonować 1:1 architekturę": po ustabilizowaniu
`hadrianm.pl` traktuj go jako **szablon**. Dla nowego klienta:

1. Duplikujesz repo kodu (`hadrianm-web` → `klient-site`), zmieniasz treść/branding.
2. Sveltia: nowy Worker OAuth + `config.yml` z sekcjami klienta (lub reużywasz
   jednego Workera z wieloma `ALLOWED_DOMAINS`). Sanity: nowy projekt + zaproszenie
   klienta jako Editor.
3. Nowy projekt Pages + domena klienta + (jeśli Sveltia+R2) nowy bucket / (Sanity)
   nowy dataset.
4. Wybierasz model rozliczeniowy i podpisujesz umowę z klauzulą kill-switch.

Im bardziej `hadrianm.pl` przejdzie przez pełną ścieżkę z
[dokumentu Sveltia](./hosting_second_analysis_sveltia.md) /
[Sanity](./hosting_second_analysis_sanity.md), tym szybciej powielisz ją u klienta.

---

## Powiązane dokumenty

- [hosting_first_analysis.md](./hosting_first_analysis.md) — decyzje bazowe (hosting, model agencyjny, budżet).
- [hosting_second_analysis_sveltia.md](./hosting_second_analysis_sveltia.md) — wdrożenie wariantu Sveltia.
- [hosting_second_analysis_sanity.md](./hosting_second_analysis_sanity.md) — wdrożenie wariantu Sanity.
- [photos-management-for-cms-analysis.md](./photos-management-for-cms-analysis.md) — dlaczego znikają pliki `-m` i helper `imgAt()`.
