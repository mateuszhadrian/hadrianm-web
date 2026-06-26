# Naprawa sceny urządzeń (mobile) — Android: telefon „za wysoko" + ucinanie dołu

> Spec implementacyjny. Dotyczy sekcji Hero, wariant **mobile** (`max-width: 760px`):
> `src/components/sections/hero/Hero.astro`, `DeviceScene.astro`, `device-scene.ts`.
> Oba problemy **zaobserwowane na Androidzie** (iPhone renderował poprawnie). Różnią
> się jednak REPRODUKCJĄ: Problem 1 jest geometryczny (zależny od proporcji ekranu) i
> odtwarza się też w emulacji, gdy ustawi się odpowiednio wysoki viewport — na
> Androidzie wyszedł, bo telefon ma inne proporcje niż testowy iPhone. Problem 2 to
> faktyczny błąd kompozytora Androida (Chrome/Blink) — NIE odtwarza się w Chromium na
> desktopie / emulacji DevTools ani na iOS (WebKit), więc jego weryfikacja końcowa MUSI
> być na fizycznym Androidzie.

Kontekst: w fazie 3 (mobile) urządzenia są przypięte (sticky stage); każde po kolei
„rośnie" (`--vid-scale` 1→1.5, **dół przyklejony** — rośnie w GÓRĘ), a pod nimi są
dividery tekstowe „02" (między laptopem a telefonem) i „03" (pod telefonem).

---

## Problem 1 — na Androidzie dolna krawędź telefonu jest za daleko od dividera 03

**Objaw:** na iPhone odstęp dół-telefonu → divider 03 jest mały i dobry; na Androidzie
telefon stoi wyraźnie wyżej (duży odstęp).

**Przyczyna:** dividery są pozycjonowane w CSS na `top: 45svh` / `82svh` — skalują się
z **wysokością** viewportu. Dolna krawędź urządzeń wynika z `fit()` w `device-scene.ts`,
który na mobile jest **ograniczony szerokością** (width-constrained). Czyli oba końce
kotwiczą do różnych odniesień. Zależność (sprawdzona co do piksela):

```
GAP(telefon.bottom → div03.top) = 0.32 · svh − 648 · fit
```

Im wyższy ekran (więcej `svh`), tym większy GAP. Pomiary: iPhone svh=619, fit=0.2735 →
GAP=21px; Android svh=810, fit=0.3029 → GAP=63px. To różnica proporcji ekranu, nie osobna
ścieżka kodu (dlatego zmiana `svh`→`dvh` NIC nie dawała — na tej pozycji pasek adresu jest
już schowany i wszystkie jednostki = 810).

**Naprawa:** zakotwiczyć dolne dividery do **zmierzonych dolnych krawędzi urządzeń** ze
stałym, małym odstępem (jak na iOS), zamiast `svh`. W gałęzi mobile (`Hero.astro`):

- `GAP_LAP_DIV ≈ 23px` (laptop.bottom → div02), `GAP_PH_DIV ≈ 21px` (phone.bottom → div03)
  — wartości dopasowane do tego, co iOS pokazuje.
- `placeDividers()`: zmierz `laptop`/`phone` `getBoundingClientRect().bottom` względem
  góry `.hero__stage` i ustaw `div02.style.top = lapBottom + GAP_LAP_DIV` (px), analogicznie
  div03. Urządzenia w fazie 3 rosną z **dołem przyklejonym**, więc ich dolne krawędzie są
  stałe → wartość jest stabilna przez całą fazę 3.
- Kiedy wołać: na `ScrollTrigger` obejmującym dojazd urządzeń (faza 1–2, `start:"top top"`
  do `LAP_ZONE.start`) w `onUpdate` (dividery płynnie podążają, gdy urządzenia dojeżdżają)
  - `onLeave`/`onLeaveBack`; dodatkowo `ScrollTrigger.addEventListener("refresh", …)` na
    resize. Po wejściu w fazę 3 nie trzeba mierzyć co klatkę (pozycja stała) — to unika
    per-klatkowego reflow na wrażliwym Androidzie.
- W cleanup gałęzi: `div.style.removeProperty("top")` + zdejmij trigger/listener.

Efekt: GAP identyczny na każdym ekranie (iPhone bez zmian, Android schodzi z 63 do ~21).
Zaobserwowane na Androidzie, ale przyczyna jest geometryczna (proporcje ekranu, nie silnik),
więc weryfikacja w emulacji wystarcza — wystarczy odtworzyć wysoki viewport Androida.

---

## Problem 2 — dół telefonu (i poświata pod nim) ucinają się, gdy laptop rośnie

**Objaw:** podczas skalowania laptopa w górę dolna część smartfona ZNIKA czystą,
poziomą linią; poświata pod telefonem też. **Wielkość ucięcia == przyrost górnej
krawędzi laptopa** (rośnie/maleje w pełnej synchronizacji ze wzrostem laptopa).

**Co to NIE jest** (wykluczone na urządzeniu — nie marnować na to czasu): `overflow`
przodka (żaden box nie ucina na tej wysokości; laptop wystaje ~150px ponad `.fit` i NIE
jest ucinany; w Chromium telefon renderuje się w pełni nawet w szczycie skali); warstwa
wideo (`?novideo` z ukrytym `<video>` też ucina); jednostki viewportu (`svh`/`dvh`);
`will-change`/promocja warstw telefonu/laptopa; `rotateX` kamery; `overflow: clip` vs
`hidden` na stage; „stały bufor" kotwiczony do treści (dodanie spacera POGORSZYŁO).

**Przyczyna (potwierdzona):** scena jest autorowana w **dużych pikselach projektowych**
(laptop `840×534`, telefon mobile `286×584`, bbox grupy ~`882×1245`) i skalowana **w dół**
przez `.fit` (~0.30) + wrapper `.hero__devices` (0.82). Android rasteryzuje
**kompozytowaną warstwę grupy urządzeń w rozmiarze PROJEKTOWYM** (× DPR; przy DPR≈2.625 to
~3270px wysokości w spoczynku) — blisko **limitu rozmiaru warstwy/tekstury GPU**. Gdy laptop
rośnie w górę, wysokość rasteryzowanej warstwy przekracza sufit i dół (telefon + poświata)
wypada poza rasteryzowany obszar = „ucięcie". Dowód: większy element testowy w warstwie →
mocniejsze ucinanie; zmniejszenie rozmiaru projektowego → ucinanie znika.

**Naprawa:** zmniejszyć **rozmiar projektowy** całej sceny o współczynnik `K` (sprawdzone
`K = 0.6`). `fit()` liczy skalę z bbox grupy, więc automatycznie urośnie ×1/K — **wygląd
pozostaje pikselowo identyczny**, a rasteryzowana warstwa jest ~K× mniejsza, z dużym
zapasem pod sufitem GPU (nawet ze wzrostem laptopa).

Zakres: stosować `K` **tylko na mobile** (`max-width: 760px`) — to tam jest problem, a
desktop ma inny layout (klatka C / `FRAME_C`), którego ta zmiana nie powinna ruszać.

Co przemnożyć przez `K` (wszystko, co jest w **px PRZESTRZENI PROJEKTOWEJ**):

- `DeviceScene.astro` (CSS, przez token `--k` i `calc(<orig>px * var(--k))`): wymiary
  `--lap-w/--lap-h/--ph-w/--ph-h`, bezele/promienie/głębie (`--*-bezel/--*-radius/--*-depth`),
  `perspective`, `.fit { width/height }`, poświaty (`.device-glow*` rozmiary + `translate3d`
  - `blur`), `.face`/`.laptop-base` `box-shadow` (offsety/blur/spread), `.screen` `+2px`,
    `.laptop-base` (height, `top` offset, border-radius), `.lap-notch` (height, radius),
    `.punch` (top/width/height, inset shadow). Nadpisania mobilne `--ph-*` też przez `calc`.
- `device-scene.ts` (stałe px projektowe): `LAP_HW=441`, `LAP_TOP=-267`, `LAP_BOT=285`,
  `PH_TOP_MOBILE=144`, pozycje w `geometry()` (`lap.y=-250`, `ph.z=60` na mobile).
- `Hero.astro`, `phase2Mobile`: `APART_LAP=-150`, `APART_PH=170`.

Czego **NIE** skalować (px viewportu/wizualne, kąty, mnożniki bezwymiarowe): marginesy
`fit()` (`mx/my`), `Z_PX` (głębia wjazdu — wartość wizualna), `slide()` (z szerokości
viewportu), `GAP_LAP_DIV/GAP_PH_DIV` z Problemu 1 (px viewportu), `GROUP_SCALE`,
`MOB_END_SCALE`, `--vid-scale`, `VID_MAX`, wszystkie stopnie (`deg`). `--gx/--gy` z
`centerGroup()` liczą się z pomiaru i kompensują automatycznie.

### ⚠️ KRYTYCZNA pułapka (inaczej fix psuje geometrię)

`device-scene.ts` czyta `--ph-w`, `--ph-h`, `--lap-depth`, `--ph-depth` przez
`getComputedStyle(scene).getPropertyValue(name)` + `parseFloat` (funkcja `dvar`). Jeśli te
tokeny staną się `calc(... * var(--k))`, to **niezarejestrowana custom property zwraca
NIEROZWIĄZANY string** (np. `"calc(286px * var(--k))"`) → `parseFloat = NaN` → rozwala
geometrię telefonu i `fit`. Trzeba je **zarejestrować przez `@property`**, żeby
`getComputedStyle` zwracał obliczoną długość:

```css
@property --ph-w {
  syntax: "<length>";
  inherits: true;
  initial-value: 0px;
}
@property --ph-h {
  syntax: "<length>";
  inherits: true;
  initial-value: 0px;
}
@property --lap-depth {
  syntax: "<length>";
  inherits: true;
  initial-value: 0px;
}
@property --ph-depth {
  syntax: "<length>";
  inherits: true;
  initial-value: 0px;
}
```

(`@property` to at-rule globalna — w Astro dać ją w `<style is:global>`.)

### Weryfikacja

- **Wizualna identyczność:** w emulacji (np. Playwright/Pixel) zrzut przed (K=1) i po
  (K=0.6) na tej samej pozycji scrolla — pozycje/rozmiary urządzeń muszą się zgadzać
  (`phone.getBoundingClientRect()` bottom/width identyczne, `--fit` = stare/K). PSNR będzie
  wysokie, ale nie nieskończone — to tylko sub-piksel/AA od renderu w innej skali, OK.
- **Sam fix ucinania:** TYLKO na fizycznym Androidzie (nie odtwarza się w Chromium/iOS).
- Jeśli przy `K=0.6` na jakimś urządzeniu nadal ucina — zejść niżej (`0.5`/`0.45`); jest
  duży zapas, bo `fit` ma limit `1.15` (przy K=0.6 fit ~0.50, daleko od sufitu).

---

## Uwaga ogólna

Oba problemy zaobserwowano na Androidzie (iPhone OK). Problem 1 ma przyczynę geometryczną
(proporcje ekranu), więc da się go odtworzyć i zweryfikować w emulacji (wysoki viewport);
Problem 2 to błąd kompozytora Androida i nie odtwarza się w emulacji/iOS — weryfikacja
wyłącznie na realnym urządzeniu.
Powiązane: `docs/analiza-android-obudowy-3d-glodza-rasteryzacje.md` (inny androidowy
problem rasteryzacji tej samej sceny), `docs/on_mobile_devices_video_analysis.md`.
