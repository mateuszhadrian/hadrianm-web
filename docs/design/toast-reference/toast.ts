/* ============================================================================
   toast.ts — Logika systemu powiadomień „Wash"
   Referencja pod hadrianm.pl · Astro 6 + TypeScript
   ----------------------------------------------------------------------------
   Zero zależności. Tworzy region toastów przy pierwszym wywołaniu,
   renderuje toasty, obsługuje auto-znikanie (pasek CSS → animationend),
   pauzę na hover, zamknięcie ×, stackowanie z limitem.

   Użycie:
     import { toast } from "./toast";
     toast.success("Wiadomość wysłana");
     toast.error("Nie udało się wysłać", { title: "Błąd" });
     toast({ type: "info", title: "…", message: "…", duration: 8000 });
   ============================================================================ */

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastOptions {
  /** Nagłówek. Domyślnie ustawiany wg typu. */
  title?: string;
  /** Treść. Wymagana przy wołaniu skrótów (toast.success(message)). */
  message?: string;
  /** Czas życia w ms. 0 = bez auto-znikania (tylko ×). Domyślnie 5000. */
  duration?: number;
}

interface ToastConfig extends ToastOptions {
  type: ToastType;
}

/* ── Stałe prezentacji ──────────────────────────────────────────────────── */
const GLYPH: Record<ToastType, string> = {
  success: "✓",
  error: "✕",
  warning: "!",
  info: "i",
};

const DEFAULT_TITLE: Record<ToastType, string> = {
  success: "Gotowe",
  error: "Coś poszło nie tak",
  warning: "Uwaga",
  info: "Informacja",
};

const DEFAULT_DURATION = 5000;
const MAX_VISIBLE = 4; // starsze ponad limit usuwane natychmiast

/* ── Region (kontener) — tworzony leniwie ───────────────────────────────── */
let region: HTMLElement | null = null;

function ensureRegion(): HTMLElement {
  if (region && document.body.contains(region)) return region;
  region = document.createElement("div");
  region.className = "toast-region";
  region.setAttribute("role", "region");
  region.setAttribute("aria-label", "Powiadomienia");
  region.setAttribute("aria-live", "polite");
  region.setAttribute("aria-atomic", "false");
  document.body.appendChild(region);
  return region;
}

/* ── Usuwanie z animacją wyjścia ────────────────────────────────────────── */
function dismiss(el: HTMLElement): void {
  if (el.dataset.gone) return;
  el.dataset.gone = "1";
  el.dataset.state = "leaving";
  const remove = () => el.remove();
  el.addEventListener("transitionend", remove, { once: true });
  // fallback, gdyby transitionend nie odpalił (np. reduced-motion)
  window.setTimeout(remove, 700);
}

/* ── Rdzeń: renderuje pojedynczy toast ──────────────────────────────────── */
function show(config: ToastConfig): HTMLElement {
  const { type } = config;
  const title = config.title ?? DEFAULT_TITLE[type];
  const message = config.message ?? "";
  const duration = config.duration ?? DEFAULT_DURATION;

  const host = ensureRegion();

  const el = document.createElement("div");
  el.className = "toast";
  el.dataset.type = type;
  el.setAttribute("role", type === "error" ? "alert" : "status");

  el.innerHTML = `
    <div class="toast__icon" aria-hidden="true">${GLYPH[type]}</div>
    <div class="toast__body">
      <div class="toast__title">${escapeHtml(title)}</div>
      ${message ? `<div class="toast__msg">${escapeHtml(message)}</div>` : ""}
    </div>
    <button class="toast__close" type="button" aria-label="Zamknij powiadomienie">×</button>
    ${duration > 0 ? `<div class="toast__progress" aria-hidden="true"></div>` : ""}
  `;

  if (duration > 0) {
    el.style.setProperty("--toast-duration", `${duration}ms`);
  }

  host.appendChild(el);

  // Limit widocznych — najstarsze usuwamy natychmiast (synchronicznie)
  while (host.children.length > MAX_VISIBLE) {
    host.firstElementChild?.remove();
  }

  // Wejście — dwie klatki, żeby transition złapał zmianę stanu
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      el.dataset.state = "visible";
    }),
  );

  // Auto-znikanie sterowane końcem animacji paska postępu
  if (duration > 0) {
    const progress = el.querySelector(".toast__progress");
    progress?.addEventListener("animationend", () => dismiss(el));
  }

  el.querySelector(".toast__close")?.addEventListener("click", () => dismiss(el));

  return el;
}

/* ── Zabezpieczenie treści (na wypadek danych od użytkownika) ────────────── */
function escapeHtml(str: string): string {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/* ── Publiczne API ──────────────────────────────────────────────────────── */
type ToastFn = {
  (config: ToastConfig): HTMLElement;
  success(message: string, opts?: ToastOptions): HTMLElement;
  error(message: string, opts?: ToastOptions): HTMLElement;
  warning(message: string, opts?: ToastOptions): HTMLElement;
  info(message: string, opts?: ToastOptions): HTMLElement;
  dismissAll(): void;
};

const base = (config: ToastConfig) => show(config);

function make(type: ToastType) {
  return (message: string, opts: ToastOptions = {}) =>
    show({ type, message, ...opts });
}

export const toast: ToastFn = Object.assign(base, {
  success: make("success"),
  error: make("error"),
  warning: make("warning"),
  info: make("info"),
  dismissAll() {
    if (!region) return;
    Array.from(region.children).forEach((c) => dismiss(c as HTMLElement));
  },
});

export default toast;
