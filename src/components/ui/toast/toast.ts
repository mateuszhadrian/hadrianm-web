/* ============================================================================
   toast.ts — reużywalny system powiadomień „Wash"
   hadrianm.pl · Astro 6 + TypeScript (strict)
   ----------------------------------------------------------------------------
   Port referencji docs/design/toast-reference/ osadzony w projekcie:
   tokeny/fonty z global.css (toast.css), zero zależności. Region toastów
   tworzony leniwie przy pierwszym wywołaniu.

   Auto-znikanie: przy dozwolonym ruchu steruje nim koniec animacji paska
   postępu (`animationend`) — pauza na hover dostaje się „za darmo" z CSS
   (animation-play-state). Przy prefers-reduced-motion pasek nie animuje
   (CSS), więc auto-znikanie prowadzi pausowalny timer JS (referencja tu
   nie znikała wcale — świadoma naprawa).

   Użycie:
     import { toast } from "@/components/ui/toast/toast";
     toast.success("Wiadomość wysłana");
     toast.error("Nie udało się wysłać", { title: "Błąd" });
     toast.warning("Uzupełnij pola", { key: "form-validation" }); // dedup
     toast({ type: "info", title: "…", message: "…", duration: 8000 });
   ============================================================================ */

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastOptions {
  /** Nagłówek. Domyślnie ustawiany wg typu. */
  title?: string;
  /** Treść. Wymagana przy wołaniu skrótów (toast.success(message)). */
  message?: string;
  /** Czas życia w ms. 0 = bez auto-znikania (tylko ×). Domyślnie wg typu. */
  duration?: number;
  /**
   * Klucz deduplikacji. Toast z tym samym `key` zastępuje poprzedni (nie
   * stackuje się) — np. wielokrotny submit formularza pokazuje jeden toast
   * walidacji naraz.
   */
  key?: string;
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

/* Czas życia per typ — błąd wymaga reakcji, więc żyje dłużej. */
const DEFAULT_DURATION: Record<ToastType, number> = {
  success: 5000,
  info: 6000,
  warning: 6000,
  error: 8000,
};

const MAX_VISIBLE = 4; // starsze ponad limit usuwane natychmiast

const prefersReducedMotion = (): boolean =>
  typeof matchMedia === "function" &&
  matchMedia("(prefers-reduced-motion: reduce)").matches;

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
  // fallback, gdyby transitionend nie odpalił (np. brak zmiany opacity)
  window.setTimeout(remove, 700);
}

/* ── Pausowalny timer auto-znikania (ścieżka reduced-motion) ─────────────── */
function armTimer(el: HTMLElement, duration: number): void {
  let remaining = duration;
  let startedAt = performance.now();
  let handle = 0;
  const resume = () => {
    startedAt = performance.now();
    handle = window.setTimeout(() => dismiss(el), remaining);
  };
  const pause = () => {
    window.clearTimeout(handle);
    remaining -= performance.now() - startedAt;
  };
  el.addEventListener("mouseenter", pause);
  el.addEventListener("mouseleave", resume);
  el.addEventListener("focusin", pause);
  el.addEventListener("focusout", resume);
  resume();
}

/* ── Rdzeń: renderuje pojedynczy toast ──────────────────────────────────── */
function show(config: ToastConfig): HTMLElement {
  const { type } = config;
  const title = config.title ?? DEFAULT_TITLE[type];
  const message = config.message ?? "";
  const duration = config.duration ?? DEFAULT_DURATION[type];
  const reduce = prefersReducedMotion();

  const host = ensureRegion();

  // Dedup: klucz zastępuje poprzedni toast (usuwamy natychmiast, bez animacji
  // wyjścia — nowy wjeżdża od razu, użytkownik nie widzi dwóch naraz).
  if (config.key) {
    host
      .querySelectorAll<HTMLElement>(`[data-key="${CSS.escape(config.key)}"]`)
      .forEach((prev) => prev.remove());
  }

  const el = document.createElement("div");
  el.className = "toast";
  el.dataset.type = type;
  if (config.key) el.dataset.key = config.key;
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

  // Limit widocznych — najstarsze usuwamy natychmiast (synchronicznie).
  while (host.children.length > MAX_VISIBLE) {
    host.firstElementChild?.remove();
  }

  // Wejście — dwie klatki, żeby transition złapał zmianę stanu.
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      el.dataset.state = "visible";
    }),
  );

  // Auto-znikanie: animowany pasek (ruch dozwolony) albo timer JS (reduce).
  if (duration > 0) {
    if (reduce) {
      armTimer(el, duration);
    } else {
      const progress = el.querySelector(".toast__progress");
      progress?.addEventListener("animationend", () => dismiss(el));
    }
  }

  el.querySelector(".toast__close")?.addEventListener("click", () =>
    dismiss(el),
  );

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

declare global {
  interface Window {
    /** Globalny dostęp do API (publikowany przez Toast.astro). */
    __toast?: ToastFn;
  }
}

export default toast;
