// Generyczny kontroler nakładek (modal + bottom sheet). Obsługuje dowolny
// element `[data-overlay]` w DOM — niezależnie od treści. Zapewnia:
//  • otwieranie/zamykanie z animacją (klasy is-open / is-closing),
//  • blokadę scrolla strony (Lenis stop + body fixed, wzorzec jak w Navbarze),
//  • zamykanie przez Esc, klik w tło i przyciski [data-overlay-close],
//  • focus-trap + przywrócenie fokusu po zamknięciu,
//  • API: window.overlay.open(id, opts) / .close(id) / .isOpen().
//
// Reużywalny: Modal.astro i BottomSheet.astro importują ten moduł (bundlowany
// raz). Treść jest wstrzykiwana przez konsumenta (np. sekcja Work).

// `window.__lenis` jest deklarowany w scripts/smooth-scroll.ts (typ Lenis).
declare global {
  interface Window {
    overlay?: OverlayApi;
    // Normalizer ScrollTrigger z Hero (mobile). Wyłączany na czas otwarcia
    // nakładki, by globalne przechwytywanie touch nie blokowało scrolla treści.
    __normalizer?: { enable: () => unknown; disable: () => unknown } | null;
  }
}

interface OpenOpts {
  label?: string; // aria-label nadawany nakładce na czas otwarcia
  onClose?: () => void; // wywoływane po zakończeniu animacji zamknięcia
}

interface OverlayApi {
  open: (id: string, opts?: OpenOpts) => void;
  close: (id: string) => void;
  isOpen: () => boolean;
}

const CLOSE_FALLBACK_MS = 360; // bezpiecznik, gdyby transitionend nie zaszedł

let activeEl: HTMLElement | null = null;
let lastFocused: HTMLElement | null = null;
let savedScroll = 0;
let normalizerDisabled = false;
const onCloseMap = new WeakMap<HTMLElement, () => void>();

const reduceMQ = matchMedia("(prefers-reduced-motion: reduce)");

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])';

function panelOf(el: HTMLElement): HTMLElement {
  return el.querySelector<HTMLElement>("[data-overlay-panel]") ?? el;
}

function lockScroll() {
  savedScroll = window.scrollY;
  window.__lenis?.stop();
  // Mobile (brak Lenis): zdejmij globalne przechwytywanie touch z Hero
  // (ScrollTrigger.normalizeScroll), inaczej treść nakładki nie scrolluje palcem.
  if (!window.__lenis && window.__normalizer) {
    window.__normalizer.disable();
    normalizerDisabled = true;
  }
  const b = document.body.style;
  b.position = "fixed";
  b.top = `-${savedScroll}px`;
  b.left = "0";
  b.right = "0";
}

function unlockScroll() {
  const b = document.body.style;
  b.position = "";
  b.top = "";
  b.left = "";
  b.right = "";
  if (normalizerDisabled) {
    window.__normalizer?.enable();
    normalizerDisabled = false;
  }
  window.__lenis?.start();
  window.scrollTo(0, savedScroll);
}

function open(id: string, opts: OpenOpts = {}) {
  const el = document.getElementById(id);
  if (!el || el === activeEl) return;
  if (activeEl) close(activeEl.id); // tylko jedna nakładka naraz

  lastFocused = document.activeElement as HTMLElement | null;
  if (opts.label) el.setAttribute("aria-label", opts.label);
  if (opts.onClose) onCloseMap.set(el, opts.onClose);

  el.hidden = false;
  el.classList.remove("is-closing");
  // każde otwarcie zaczyna od samej góry — wyzeruj kontener scrolla
  // (root = scroller modala) oraz oznaczone obszary scrollowalne (sheet).
  el.scrollTop = 0;
  el.querySelectorAll<HTMLElement>("[data-overlay-scroll]").forEach((s) => {
    s.scrollTop = 0;
  });
  // wymuś reflow, by przejście in zaczęło się od stanu zamkniętego
  void el.offsetWidth;
  el.classList.add("is-open");
  activeEl = el;

  lockScroll();

  const focusTarget =
    el.querySelector<HTMLElement>("[data-overlay-autofocus]") ??
    el.querySelector<HTMLElement>("[data-overlay-close]") ??
    panelOf(el);
  focusTarget?.focus({ preventScroll: true });
}

function close(id: string) {
  const el = document.getElementById(id);
  if (!el || el.hidden) return;

  const finish = () => {
    el.hidden = true;
    el.classList.remove("is-closing");
    if (activeEl === el) {
      activeEl = null;
      unlockScroll();
    }
    el.removeAttribute("aria-label");
    const cb = onCloseMap.get(el);
    if (cb) {
      onCloseMap.delete(el);
      cb();
    }
    lastFocused?.focus({ preventScroll: true });
    lastFocused = null;
  };

  el.classList.remove("is-open");
  el.classList.add("is-closing");

  if (reduceMQ.matches) {
    finish();
    return;
  }

  const panel = panelOf(el);
  let done = false;
  const onEnd = (e: TransitionEvent) => {
    if (e.target !== panel) return;
    done = true;
    panel.removeEventListener("transitionend", onEnd);
    finish();
  };
  panel.addEventListener("transitionend", onEnd);
  window.setTimeout(() => {
    if (done) return;
    panel.removeEventListener("transitionend", onEnd);
    finish();
  }, CLOSE_FALLBACK_MS);
}

function isOpen() {
  return activeEl !== null;
}

// ── delegacja zdarzeń (działa też dla treści wstrzykniętej po fakcie) ──
document.addEventListener("click", (e) => {
  const target = e.target as HTMLElement;

  const closer = target.closest<HTMLElement>("[data-overlay-close]");
  if (closer) {
    const root = closer.closest<HTMLElement>("[data-overlay]");
    if (root) {
      close(root.id);
      return;
    }
  }

  // klik w tło: w obrębie nakładki, ale poza panelem
  const root = target.closest<HTMLElement>("[data-overlay]");
  if (root && !root.hidden && !target.closest("[data-overlay-panel]")) {
    close(root.id);
  }
});

document.addEventListener("keydown", (e) => {
  if (!activeEl) return;
  if (e.key === "Escape") {
    e.preventDefault();
    close(activeEl.id);
    return;
  }
  if (e.key !== "Tab") return;

  const focusables = [
    ...activeEl.querySelectorAll<HTMLElement>(FOCUSABLE),
  ].filter((n) => n.offsetParent !== null || n === document.activeElement);
  if (!focusables.length) {
    e.preventDefault();
    return;
  }
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  const act = document.activeElement as HTMLElement;
  if (e.shiftKey && (act === first || !activeEl.contains(act))) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && act === last) {
    e.preventDefault();
    first.focus();
  }
});

// Przenieś nakładki bezpośrednio do <body>, by nie były uwięzione w kontekście
// stackingu sekcji/.page (z-index:1) — inaczej navbar (z-index:50, rodzeństwo
// .page) przykrywałby nakładkę mimo jej wyższego z-index.
function portalize() {
  document.querySelectorAll<HTMLElement>("[data-overlay]").forEach((el) => {
    if (el.parentElement !== document.body) document.body.appendChild(el);
  });
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", portalize, { once: true });
} else {
  portalize();
}

const api: OverlayApi = { open, close, isOpen };
window.overlay = api;
export {};
