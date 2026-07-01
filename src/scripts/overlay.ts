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
  // resize() przed scrollTo: odświeża limit Lenisa po zdjęciu body:fixed,
  // inaczej scrollTo przycięłoby savedScroll do 0 (skok na górę).
  if (window.__lenis) {
    window.__lenis.start();
    window.__lenis.resize();
    window.__lenis.scrollTo(savedScroll, { immediate: true, force: true });
  } else {
    window.scrollTo(0, savedScroll);
  }
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
    // wyczyść inline style pozostałe po geście przeciągnięcia (drag-to-dismiss),
    // inaczej translateY z gestu nadpisałby CSS i sheet nie pokazałby się po
    // ponownym otwarciu.
    const p = panelOf(el);
    p.style.transform = "";
    p.style.transition = "";
    el.style.opacity = "";
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

// ── gest przeciągnięcia w dół (drag-to-dismiss) — tylko bottom sheet mobile ──
// Chwyt za "kreseczkę"/nagłówek [data-overlay-drag] i pociągnięcie w dół
// zamyka sheet; puszczenie poniżej progu (dystans lub prędkość „flick”)
// przywraca go płynnie na miejsce. Desktopowy Modal nie ma tej strefy.
const DRAG_CLOSE_PX = 96; // minimalny dystans, by zamknąć
const DRAG_CLOSE_FRACTION = 0.28; // …lub ten ułamek wysokości panelu
const DRAG_FLICK_VY = 0.55; // …lub prędkość „flick” w px/ms

interface DragState {
  root: HTMLElement;
  panel: HTMLElement;
  startY: number;
  lastY: number;
  lastT: number;
  dy: number;
  vy: number;
  moved: boolean;
}
let drag: DragState | null = null;

function onDragMove(e: PointerEvent) {
  if (!drag) return;
  const dy = Math.max(0, e.clientY - drag.startY); // tylko w dół
  if (!drag.moved && dy > 0) {
    drag.moved = true;
    drag.panel.style.transition = "none"; // podążaj 1:1 za palcem
  }
  if (drag.moved) e.preventDefault();
  const dt = e.timeStamp - drag.lastT;
  if (dt > 0) drag.vy = (e.clientY - drag.lastY) / dt;
  drag.lastY = e.clientY;
  drag.lastT = e.timeStamp;
  drag.dy = dy;
  drag.panel.style.transform = `translateY(${dy}px)`;
  // przygaszaj tło proporcjonalnie do przeciągnięcia
  const h = drag.panel.offsetHeight || 1;
  drag.root.style.opacity = String(1 - Math.min(1, dy / h) * 0.85);
}

function endDrag(e: PointerEvent) {
  if (!drag) return;
  const { root, panel, dy, vy, moved } = drag;
  window.removeEventListener("pointermove", onDragMove);
  window.removeEventListener("pointerup", endDrag);
  window.removeEventListener("pointercancel", endDrag);
  drag = null;

  if (!moved) {
    // czysty tap — nic nie ruszaliśmy, wyczyść ewentualne inline style
    panel.style.transition = "";
    panel.style.transform = "";
    root.style.opacity = "";
    return;
  }

  const h = panel.offsetHeight || 1;
  const shouldClose =
    e.type !== "pointercancel" &&
    (dy > DRAG_CLOSE_PX || dy > h * DRAG_CLOSE_FRACTION || vy > DRAG_FLICK_VY);

  if (shouldClose) {
    // dokończ animację zejścia i uruchom pełne zamknięcie (unlock scroll, focus)
    panel.style.transition = "transform 0.26s cubic-bezier(0.3, 0, 0.4, 1)";
    panel.style.transform = "translateY(100%)";
    root.style.opacity = ""; // fade tła przejmie klasa is-closing
    close(root.id);
  } else {
    // za mało — wróć płynnie na miejsce
    panel.style.transition = "transform 0.26s cubic-bezier(0.2, 0.7, 0.2, 1)";
    panel.style.transform = "";
    root.style.opacity = "";
    const clear = () => {
      panel.style.transition = "";
      panel.removeEventListener("transitionend", clear);
    };
    panel.addEventListener("transitionend", clear);
  }
}

document.addEventListener("pointerdown", (e) => {
  if (drag) return;
  const target = e.target as HTMLElement;
  const handle = target.closest<HTMLElement>("[data-overlay-drag]");
  if (!handle) return;
  if (target.closest("[data-overlay-close]")) return; // nie startuj z przycisku X
  const root = handle.closest<HTMLElement>("[data-overlay]");
  if (
    !root ||
    root.hidden ||
    root.getAttribute("data-overlay-kind") !== "sheet" ||
    reduceMQ.matches
  )
    return;

  drag = {
    root,
    panel: panelOf(root),
    startY: e.clientY,
    lastY: e.clientY,
    lastT: e.timeStamp,
    dy: 0,
    vy: 0,
    moved: false,
  };
  window.addEventListener("pointermove", onDragMove, { passive: false });
  window.addEventListener("pointerup", endDrag);
  window.addEventListener("pointercancel", endDrag);
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
