import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

// Płynny scroll (Lenis) — desktop: kółko; mobile: dotyk z długim wybiegiem.
// Ładowany przy no-preference (bramka w BaseLayout). Navbar używa go do scrollTo.

gsap.registerPlugin(ScrollTrigger);

declare global {
  interface Window {
    __lenis?: Lenis | null;
  }
}

const LERP = 1;
const TOUCH_MULTIPLIER = 1; // <1 = wolniej (Hero kompensuje przez SCROLL_SCALE)
const SYNC_TOUCH_LERP = 0.06; // wybieg po machnięciu; niżej = dłuższy
const TOUCH_INERTIA_EXPONENT = 1.95; // zasięg machnięcia; wyżej = dalej

const isTouch = navigator.maxTouchPoints > 0;

const reduceMQ = window.matchMedia("(prefers-reduced-motion: reduce)");

let lenis: Lenis | null = null;

function start() {
  if (lenis) return;

  lenis = new Lenis(
    isTouch
      ? {
          lerp: LERP,
          syncTouch: true,
          touchMultiplier: TOUCH_MULTIPLIER,
          syncTouchLerp: SYNC_TOUCH_LERP,
          touchInertiaExponent: TOUCH_INERTIA_EXPONENT,
        }
      : { lerp: LERP, smoothWheel: true, syncTouch: false },
  );
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
