# Toast „Wash" — referencja

System powiadomień (toastów) dla **hadrianm.pl**, wariant **D — Wash**: delikatny tint tła w kolorze typu + pełny blok glifu. Pod stack **Astro 6 + Tailwind 4 + TypeScript**.

- **Desktop** → prawy górny róg
- **Mobile** (≤ 640px) → góra, wyśrodkowane (z uwzględnieniem `safe-area-inset`)
- Typy: `success` · `error` · `warning` · `info`
- Auto-znikanie z paskiem postępu, **pauza na hover**, przycisk `×`, stackowanie z limitem
- A11y: `role="region"` + `aria-live`, `role="alert"` dla błędów, `prefers-reduced-motion`
- **Zero zależności** (czysty CSS + transitions)

---

## Pliki

| Plik | Rola |
|---|---|
| `toast.ts` | Logika i publiczne API. Źródło prawdy. |
| `toast.css` | Style w `@layer components` (tokeny w custom properties). |
| `Toast.astro` | Montaż — wstaw raz w layoucie. Ładuje CSS + publikuje `window.__toast`. |
| `preview.html` | Podgląd offline (inline-port logiki). **Nie część kodu produkcyjnego.** |

---

## Instalacja

1. Skopiuj `toast.ts`, `toast.css`, `Toast.astro` do np. `src/components/toast/`.
2. W głównym layoucie wstaw komponent raz, tuż przed `</body>`:

```astro
---
import Toast from "@/components/toast/Toast.astro";
---
<html>
  <body>
    <slot />
    <Toast />
  </body>
</html>
```

## Użycie

### Import ESM (zalecane)

```ts
import { toast } from "@/components/toast/toast";

toast.success("Wiadomość wysłana");
toast.error("Nie udało się wysłać");
toast.warning("Uzupełnij zaznaczone pola");
toast.info("Wersja robocza zapisana");
```

### Z opcjami

```ts
toast.success("Odezwę się w ciągu 24h.", { title: "Wiadomość wysłana" });

// pełny obiekt konfiguracyjny
toast({
  type: "info",
  title: "Zaplanowano",
  message: "Spotkanie potwierdzone na piątek.",
  duration: 8000, // 0 = bez auto-znikania (tylko ×)
});

toast.dismissAll(); // zamknij wszystkie
```

### Bez importów (inline / vanilla)

Komponent `Toast.astro` publikuje `window.__toast`:

```html
<script>window.__toast.error("Coś poszło nie tak");</script>
```

---

## API

```ts
toast(config: { type, title?, message?, duration? }): HTMLElement
toast.success(message, opts?): HTMLElement
toast.error(message, opts?): HTMLElement
toast.warning(message, opts?): HTMLElement
toast.info(message, opts?): HTMLElement
toast.dismissAll(): void
```

**ToastOptions**
- `title?: string` — domyślnie ustawiany wg typu.
- `message?: string` — treść.
- `duration?: number` — ms, domyślnie `5000`; `0` = bez auto-znikania.

---

## Dostosowanie

Wszystkie tokeny to custom properties w `:root` (w `toast.css`) — nadpisz w swoim globalnym CSS:

```css
:root {
  --toast-success: oklch(0.8 0.15 155);
  --toast-error:   oklch(0.68 0.2 27);
  --toast-warning: oklch(0.83 0.14 80);
  --toast-info:    oklch(0.75 0.12 232);

  --toast-width: 400px;
  --toast-gap-edge: 22px;   /* odstęp od krawędzi */
  --toast-stack-gap: 14px;  /* odstęp między toastami */
}
```

Punkt przełamania desktop → mobile to `max-width: 640px` (dopasuj do breakpointu Tailwinda w `toast.css`, jeśli używasz innego).

Style są w `@layer components`, więc utilities Tailwinda w markupie zawsze wygrywają — możesz dokładać klasy bez walki ze specyficznością.

---

## Uwagi

- Treści przechodzą przez escape HTML — bezpieczne dla danych od użytkownika.
- Limit widocznych toastów: `MAX_VISIBLE = 4` (w `toast.ts`) — najstarsze usuwane natychmiast.
- Fonty (`Archivo`, `Space Mono`) pochodzą z Twoich pakietów `@fontsource*` — nic dodatkowego nie trzeba ładować.
- Podgląd: otwórz `preview.html` w przeglądarce (używa realnego `toast.css`).
