// Skoki do kotwic (#sekcja) — wspólny wzorzec navbara i CTA sekcji.
// Klik = skok natychmiastowy na każdym urządzeniu (desktop też): Lenis
// nadal obsługuje płynny scroll kółkiem, ale skok robimy bez animacji
// (immediate), żeby nie przewijać przez całą sekcję. Fallback natywny,
// gdy Lenisa nie ma (reduce / awaria JS nie dotyczy — wtedy działa goła
// kotwica). Świadomie BEZ importu Lenisa: ten moduł jest bundlowany
// eager w skryptach sekcji, a instancję wystawia dynamicznie ładowany
// smooth-scroll jako window.__lenis.

/** Natychmiastowy skok do elementu lub pozycji (0 = góra strony). */
export function scrollToAnchor(target: HTMLElement | number): void {
  const lenis = window.__lenis;
  if (lenis) {
    lenis.scrollTo(target, { offset: 0, immediate: true });
    return;
  }
  if (typeof target === "number") {
    window.scrollTo({ top: target, behavior: "auto" });
  } else {
    target.scrollIntoView({ behavior: "auto", block: "start" });
  }
}

/** Przechwytuje klik w kotwicę (#sekcja) i przewija do niej zamiast
 *  natywnego skoku; URL odświeża replaceState (bez dodatkowego skoku).
 *  UWAGA: podawaj `a.getAttribute("href")`, NIE `a.href` — property zwraca
 *  URL absolutny, który cicho ominie strażnik `startsWith("#")`. */
export function handleAnchorClick(e: MouseEvent, href: string | null): void {
  if (!href || !href.startsWith("#")) return;
  const el = document.getElementById(href.slice(1));
  if (!el) return;
  e.preventDefault();
  scrollToAnchor(el);
  history.replaceState(null, "", href);
}
