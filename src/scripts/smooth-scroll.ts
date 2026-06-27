import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

// Płynny scroll (Lenis) na desktopie: wygładza skokowy scroll kółka myszy, by
// animacje scroll-driven nie klatkowały. Ładowany tylko bez dotyku — bramka
// `navigator.maxTouchPoints === 0` jest w BaseLayout.astro.

gsap.registerPlugin(ScrollTrigger);

// Instancja Lenis wystawiona globalnie, by Navbar mógł użyć jej do płynnego
// scrollTo (kliknięcie pozycji menu / brandu). Gdy null — fallback na natywny
// scroll (mobile bez Lenis lub reduced-motion).
declare global {
  interface Window {
    __lenis?: Lenis | null;
  }
}

// Wygładzanie: 0.1 = klasyczny Lenis; wyżej (0.12–0.15) = bardziej responsywnie.
const LERP = 0.1;

const reduceMQ = window.matchMedia("(prefers-reduced-motion: reduce)");

let lenis: Lenis | null = null;

function start() {
  if (lenis) return;

  // Kółko obsługuje Lenis — zdejmij normalizację ScrollTriggera z Hero.
  ScrollTrigger.normalizeScroll(false);

  lenis = new Lenis({ lerp: LERP, smoothWheel: true, syncTouch: false });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);
  window.__lenis = lenis;
}

function tick(time: number) {
  lenis?.raf(time * 1000); // ticker: sekundy → Lenis: milisekundy
}

function stop() {
  if (!lenis) return;
  gsap.ticker.remove(tick);
  lenis.destroy();
  lenis = null;
  window.__lenis = null;
}

if (!reduceMQ.matches) start();
reduceMQ.addEventListener("change", (e) => (e.matches ? stop() : start()));
