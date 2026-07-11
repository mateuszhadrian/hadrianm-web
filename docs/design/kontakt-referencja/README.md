# Kontakt — pakiet referencyjny (wariant A "Split")

Sekcja „Kontakt" (nav: **06 / KONTAKT**) w wersji desktop i mobile — **czysta
referencja** do implementacji w projekcie Astro (`hadrianm-web`). Finał strony:
po panelu FAQ (#100B0D) wraca na czerń **#070507**, wchłania footer.
Wszystkie wartości dobrane w prototypie zapisane na sztywno.

Układ desktop: split — lead (nagłówek + intro) i dane kontaktowe po lewej,
ramka formularza po prawej. E-mail i telefon **nie istnieją w źródle w całości**
— JS składa je z fragmentów dopiero po kliknięciu [ POKAŻ ] (antyscraping).

## Pliki

- **`kontakt.html`** — działający podgląd (otwórz w przeglądarce; responsywny:
  desktop ≥861px, poniżej wersja mobile). Na górze **spacer podglądu** do testu
  wejść scrollowych — oznaczony komentarzem, **nie przenosić do Astro**.
- **`kontakt.css`** — style sekcji. Ustalone wartości w `:root` i komentarzu na górze.
- **`kontakt.js`** — reveal danych + formularz (walidacja, antyspam, wysyłka)
  + choreografia wejść. Konfiguracja w `KT_CFG` na górze — tam wstawiasz
  **URL endpointu** (`endpoint: ''` = tryb prototypu, symulacja sukcesu).

## Wartości ustalone (nie zmieniać bez powodu)

- breakpoint: **861px** (spójny z resztą sekcji)
- tło `#070507`, poświata finału od dołu `rgba(255,90,71,0.045)` → 0 przez 210px
- grid desktop: `minmax(420px,560px)` / `minmax(520px,1fr)`, column-gap **110px**
  (70px przy 861–1440px); 1161–1440px: `0.8fr / 1.2fr`; 861–1160px: jedna kolumna
- wejścia (`once: true`): lead `top 84%`, side `top 88%`, frame `top 82%`,
  footer `top 97%`; stagger pól formularza `--d` = **0.10 / 0.16 / 0.22 / 0.28s**
- parallax ghosta „KONTAKT": **−30 → +40px** scrub (tylko desktop)
- walidacja: imię niepuste, e-mail regex `/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/`,
  wiadomość **≥10 znaków**; antyspam: honeypot `firma` + min. czas **4s**
- mgła: 2 bloby (`38vw` dół-środek / `26vw` góra-prawa, blur 48px), statyczna

## Jak to działa

**Reveal danych (antyscraping):** fragmenty w `FR` w `kontakt.js`
(`mateusz` + `@` + `hadrianm` + `.pl`, `+48 783 983 600`) — pełny adres/numer
nigdzie nie występuje jako ciąg. Pierwsze kliknięcie składa wartość, pokazuje
i podlinkowuje (`mailto:` / `tel:` bez spacji); kolejne kopiują (Clipboard API,
feedback [ SKOPIOWANO ] 1.9s). Boty czytające HTML/JS regexem nie mają czego zebrać.

**Formularz:** walidacja po stronie klienta (klasy `.err` + `aria-invalid`,
komunikaty `aria-live="polite"`, fokus na pierwszym błędnym polu). Chipsy tematu
to zwykłe radio (klasa `.sel` z JS — niezależnie od `:has`). Honeypot lub submit
< 4s od loadu → **udawany sukces** bez wysyłki. Prawdziwa wysyłka: `sendForm(fd)`
→ `fetch(KT_CFG.endpoint, { method: 'POST', body: formData })`; w trakcie
przycisk disabled + „Wysyłam…" + `aria-busy`; sukces (2xx) → crossfade na
potwierdzenie (fokus na nagłówku `role="status"`); błąd → komunikat `.kt-srv`.
[ Wyślij kolejną ] resetuje formularz i zegar antyspamu.

**Kontrakt endpointu** (serwer MUSI powtórzyć antyspam i walidację):
POST `multipart/form-data` z polami: `name`, `email`, `temat` (może być puste),
`message`, `firma` (honeypot — niepuste = bot: odpowiedz 200 i cicho odrzuć),
`elapsed` (ms od załadowania — `< 4000` = bot, jw.). Odpowiedź 2xx = sukces.

**Wejścia (desktop i mobile identycznie — budżet CPU jak FAQ):** zero pinów,
zero scrubu na treści. Cztery ScrollTriggery `once: true` dodają klasy `.on`
(toggleClass), całą animację robi CSS transition — stagger pól to
`transition-delay` z `--d`. Desktop dodatkowo: leniwy parallax ghosta
(sam transform). Mobile: te same triggery, mniejsze przesunięcia, parallax
wyłączony przez `gsap.matchMedia`.

**Tryby statyczne** (wejścia od razu widoczne, bez animacji — ale reveal danych
i formularz **działają dalej**, to funkcja, nie dekoracja):
- brak JS (brak `body.js`) — treść widoczna; reveal i submit wymagają JS
  (patrz pkt 8 niżej),
- `prefers-reduced-motion: reduce`,
- **`body.kt-static`** — ustaw z zewnątrz PRZED initem `kontakt.js`
  (globalny mechanizm low-power; ten sam kontrakt co `fq-static` / `of-static`).

## Przeniesienie do Astro (skrót)

1. **Markup** → jeden komponent `src/components/Kontakt.astro` (sekcja
   samodzielna, bez elementów `fixed`). Usuń spacer podglądu z góry pliku.
2. **GSAP** (masz w deps): `import gsap from 'gsap'; import ScrollTrigger from
   'gsap/ScrollTrigger';` — usuń CDN-y. `kontakt.js` jako `<script>` komponentu
   (Astro zbunduje) albo `src/scripts/kontakt.ts`.
3. **Fonty** przez fontsource (masz w deps): `@fontsource-variable/archivo`,
   `@fontsource/instrument-serif` (400 italic), `@fontsource/space-mono` (400+700).
   ⚠️ Wariant variable rejestruje rodzinę **`'Archivo Variable'`** — alias
   `@font-face` masz już globalnie z poprzednich sekcji; nic nowego.
4. **Lenis** — spięcie ze ScrollTriggerem masz globalnie. „Do góry ↑" podmień
   na globalny handler `lenis.scrollTo(0)` (w podglądzie jest `window.scrollTo`
   — oznaczone komentarzem w `kontakt.js`). W CSS celowo **nie ma**
   `scroll-behavior: smooth`. Sekcja nie zmienia wysokości strony (crossfade
   potwierdzenia jest absolutny) — nie potrzebuje `ScrollTrigger.refresh()`.
5. **Tailwind 4** — style to czysty CSS na klasach `kt-*`, brak kolizji;
   wrzuć jako global CSS lub `<style is:global>`.
6. **`body.js`** — skrypt w `<head>` dodaje klasę `js` (fallback bez JS =
   wszystko widoczne). Masz to już w layoutcie — usuń inline'owy z `kontakt.html`.
7. **Wysyłka:** wstaw URL do `KT_CFG.endpoint` (Astro endpoint
   `src/pages/api/kontakt.ts` albo zewnętrzny serwis). Serwer powtarza
   walidację + antyspam (kontrakt wyżej). Zod masz w deps — użyj do walidacji.
8. **Linki:** `#polityka` → realna podstrona `/polityka-prywatnosci` (2 miejsca:
   nota RODO + footer); `#github` / `#linkedin` / `#instagram` → realne profile
   (+ `rel="noopener"` przy `target="_blank"`). Kotwica sekcji: `id="kontakt"`
   (CTA z FAQ celuje w `#kontakt`). Nagłówek to `<h2>`, potwierdzenie `<h3>` —
   zachowaj hierarchię względem sąsiednich sekcji.

## Checklista testów (Playwright visual / axe)

- [ ] desktop: wejście w połowie staggera (część pól poniżej progu) — snapshot
- [ ] desktop: reveal e-maila (klik [ POKAŻ ] → wartość + `mailto:`, akcja
  [ KOPIUJ ]; drugi klik → [ SKOPIOWANO ] i powrót po ~1.9s)
- [ ] telefon: `tel:+48783983600` (bez spacji), tekst ze spacjami
- [ ] walidacja: pusty submit → 3 błędy, fokus na polu „Imię", `aria-invalid`
- [ ] wpisanie w pole czyści jego błąd; zły e-mail (`abc@x`) → błąd e-maila
- [ ] chipsy: wybór tematu → `.sel` przenosi się, jedno naraz
- [ ] honeypot wypełniony LUB submit < 4s → potwierdzenie bez requestu
- [ ] mock endpointu: 200 → `.sent` + fokus na `h3`; 500 → `.kt-srv` widoczny,
  formularz aktywny; w trakcie: przycisk disabled + „Wysyłam…"
- [ ] [ Wyślij kolejną ] → formularz pusty, chipsy odznaczone, zegar zresetowany
- [ ] mobile (<861px): stos lead → formularz → dane → footer; meta ukryta;
  chipsy 2×2; footer w kolumnie
- [ ] `prefers-reduced-motion: reduce` → wszystko widoczne, reveal i formularz
  działają bez animacji
- [ ] `body.kt-static` → wejścia od razu `.on`, funkcje działają
- [ ] brak JS → pełna treść widoczna (dane zamaskowane — świadomy trade-off)
- [ ] axe: kontrasty mono-etykiet, `aria-hidden` na dekoracjach, focus-visible
  na chipach/przyciskach, `role="alert"` na `.kt-srv`, `role="status"` na `.kt-done`
- [ ] źródło strony i bundle JS **nie zawierają** pełnego e-maila ani numeru
  jako ciągu (grep `mateusz@`, `783983600`, `783 983 600`)

## Paleta i typografia

- Tło `#070507` (finał wraca z panelu FAQ `#100B0D`); tekst `#F5F0EC`,
  akcent `#FF5A47`, mgła `rgba(214,38,38,…)` / `rgba(130,20,32,…)`;
  linie `rgba(245,240,236,0.15)`, szew `rgba(245,240,236,0.14)`.
- **Archivo** 800 (nagłówek, ghost „KONTAKT"), 500–600 (pola, submit);
  **Instrument Serif** italic („do mnie" z gradientem `--serif-grad`);
  **Space Mono** (kickery, etykiety, chipsy, wartości danych, meta, footer).
