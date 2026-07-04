import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { navItems } from "@/i18n/nav";

// Krzyżowe przenikanie warstw tła (bg-stage) sterowane scrollem.
// Jeden kontroler liczy opacity wszystkich warstw z pozycji sekcji — zamiast
// łańcucha osobnych timeline'ów (które biłyby się o opacity współdzielonych
// warstw). W każdej chwili realnie animowane/widoczne są maks. 2 warstwy.

// Kolejność warstw = hero + sekcje z navbara (Dla kogo → … → Kontakt).
const order = ["hero", ...navItems.map((n) => n.id)];
const n = order.length;

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

function setup(hard: boolean) {
  const layers = order.map((id) =>
    document.querySelector<HTMLElement>(`[data-bg="${id}"]`),
  );
  const sections = order.map((id) =>
    document.querySelector<HTMLElement>(`#${id}`),
  );

  const render = () => {
    const vh = window.innerHeight;

    // p[t] (t = 1..n-1): postęp wjazdu sekcji order[t] — od dołu okna (0)
    // do góry okna (1). pn[t] = wersja bez clampa (ujemna, gdy sekcja jest
    // jeszcze pod foldem) — potrzebna do pre-warmu warstw.
    const p = new Array(n).fill(0);
    const pn = new Array(n).fill(0);
    for (let t = 1; t < n; t++) {
      const sec = sections[t];
      if (!sec) continue;
      pn[t] = (vh - sec.getBoundingClientRect().top) / vh;
      p[t] = clamp(pn[t], 0, 1);
    }

    let opacity: number[];
    if (hard) {
      // reduced motion: twardy swap na środku ekranu, bez przenikania
      let active = 0;
      for (let t = 1; t < n; t++) if (p[t] >= 0.5) active = t;
      opacity = order.map((_, k) => (k === active ? 1 : 0));
    } else {
      // płynny cross-fade przez czerń: prev gaśnie [0→0.5], cur wchodzi [0.5→1]
      const curPart = (t: number) => clamp((p[t] - 0.5) / 0.5, 0, 1);
      const prevPart = (t: number) => 1 - clamp(p[t] / 0.5, 0, 1);
      opacity = order.map((_, k) => {
        if (k === 0) return prevPart(1); // hero: tylko gaśnie
        if (k === n - 1) return curPart(n - 1); // ostatnia: tylko wchodzi
        return Math.min(curPart(k), prevPart(k + 1)); // środek: cur i prev
      });
    }

    // Pre-warm: warstwę aktywujemy (promocja GPU + raster chmur) już M
    // viewportów przed krawędzią fade-in/out (p=0.5) — inaczej ten koszt
    // trafia dokładnie w klatkę startu crossfade'u (widoczna zacinka).
    const M = 1;
    for (let k = 0; k < n; k++) {
      const el = layers[k];
      if (!el) continue;
      el.style.opacity = String(opacity[k]);
      const nearIn = k === 0 || pn[k] > 0.5 - M;
      const nearOut = k === n - 1 || pn[k + 1] < 0.5 + M;
      el.classList.toggle(
        "is-inactive",
        opacity[k] < 0.01 && !(nearIn && nearOut),
      );
    }
  };

  const st = ScrollTrigger.create({
    trigger: document.documentElement,
    start: "top top",
    end: "bottom bottom",
    onUpdate: render,
    onRefresh: render,
  });
  render();

  return () => st.kill();
}

/** Uruchamia kontroler przenikania teł. Wywoływane raz z Home.astro. */
export function initBgCrossfade() {
  gsap.registerPlugin(ScrollTrigger);
  const mm = gsap.matchMedia();
  mm.add("(prefers-reduced-motion: no-preference)", () => setup(false));
  mm.add("(prefers-reduced-motion: reduce)", () => setup(true));
  return mm;
}
