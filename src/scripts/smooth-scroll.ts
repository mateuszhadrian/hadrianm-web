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

// Wygładzanie kółka na desktopie: 0.1 = klasyczny Lenis; niżej = dłuższy
// wybieg (macOS-owe szybowanie); 1 = brak wygładzania (wraca skokowy scroll
// na rolkach z zapadkami). Nie współdzielić z touch.
const WHEEL_LERP = 0.05;
const TOUCH_LERP = 1; // syncTouch prowadzi palec 1:1; wybiegiem steruje SYNC_TOUCH_LERP
const TOUCH_MULTIPLIER = 1; // <1 = wolniej (Hero kompensuje przez SCROLL_SCALE)
const SYNC_TOUCH_LERP = 0.06; // wybieg po machnięciu; niżej = dłuższy
const TOUCH_INERTIA_EXPONENT = 1.95; // zasięg machnięcia; wyżej = dalej

const isTouch = navigator.maxTouchPoints > 0;

// Guard pinch/zoom: Lenis 1.3.x nie rozpoznaje wielodotyku (VirtualScroll
// czyta tylko targetTouches[0]) i przechwytuje panowanie po powiększeniu
// strony. Opcja `prevent` -> Lenis ignoruje zdarzenie BEZ preventDefault,
// więc natywny pan/zoom działa (lenis.stop() by tu NIE zadziałał: w stanie
// stopped Lenis nadal preventuje i zablokowałby natywne panowanie).
let multiTouch = false;
const vv = window.visualViewport;
const isZoomed = () => (vv?.scale ?? 1) > 1.01;

if (isTouch) {
  const opts = { capture: true, passive: true } as const;
  window.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length > 1) multiTouch = true;
    },
    opts,
  );
  window.addEventListener(
    "touchend",
    (e) => {
      if (e.touches.length === 0) multiTouch = false;
    },
    opts,
  );
  window.addEventListener(
    "touchcancel",
    (e) => {
      if (e.touches.length === 0) multiTouch = false;
    },
    opts,
  );
}

const reduceMQ = window.matchMedia("(prefers-reduced-motion: reduce)");

let lenis: Lenis | null = null;

function start() {
  if (lenis) return;

  lenis = new Lenis(
    isTouch
      ? {
          lerp: TOUCH_LERP,
          syncTouch: true,
          touchMultiplier: TOUCH_MULTIPLIER,
          syncTouchLerp: SYNC_TOUCH_LERP,
          touchInertiaExponent: TOUCH_INERTIA_EXPONENT,
          prevent: () => multiTouch || isZoomed(),
        }
      : { lerp: WHEEL_LERP, smoothWheel: true, syncTouch: false },
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

// Powrót przez bfcache (history.back z podstron): resize'y omijają
// zamrożoną stronę, a pasek Safari zmienia w międzyczasie wysokość
// viewportu — bez przeliczenia limit Lenisa i pozycje ScrollTriggerów
// zostają w STAREJ geometrii (iOS: dno strony „przesunięte o pasek").
window.addEventListener("pageshow", (e) => {
  if (!e.persisted) return;
  lenis?.resize();
  ScrollTrigger.refresh();
});
