// Karuzela captionów lewej kolumny (desktop) — krok 4 refactoru, kod 1:1
// z inline <script> Hero.astro. Faza A (swap) → faza B (center-pinned
// scroll); CAP_START/CAP_END z hero-config.ts (CAP_END = pochodna
// doghouse.webp). render(u) to czysta arytmetyka na zmierzonych tablicach —
// kandydat na testy jednostkowe.

import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { Base } from "./timeline-base";
import { CAP_START, CAP_END } from "./hero-config";
import { SEL, devWarnMissing } from "./selectors";

export const initCaptionCarousel = (b: Base) => {
  const copy = b.copy;
  if (!copy) {
    devWarnMissing("copy");
    return () => {};
  }
  const rows = Array.from(copy.querySelectorAll<HTMLElement>(SEL.copyRow));
  const maybeTexts = rows.map((r) =>
    r.querySelector<HTMLElement>(SEL.copyText),
  );
  if (rows.length < 3 || maybeTexts.some((t) => !t)) {
    devWarnMissing(rows.length < 3 ? "copyRow" : "copyText");
    return () => {};
  }
  const texts = maybeTexts as HTMLElement[];

  copy.classList.add("is-carousel");

  const PHASE_A_FRAC = 0.14;
  const REST_BIG_SCALE = 0.53;
  const REST_SMALL_SCALE = 1;
  const MIN_GROW = 0.98;
  const LOW_OPACITY = 0.05;
  const MORPH_A0 = 1;
  const MORPH_A1 = 2;
  const CONTAINER_EXTRA = 110;
  const FIRST_GAP_EXTRA = 110;
  const LAST_BIG_SCALE = 1;

  const N = rows.length;
  let smallPx = 16;
  let bigPx = 40;
  let bigPxRest = 34;
  let GAP = 18;
  let Cy = 0;
  let big0H = 0;
  let p1MinH = 0;

  const bigOf = (i: number) =>
    i === 0 ? bigPx : i === N - 1 ? bigPx * LAST_BIG_SCALE : bigPxRest;
  const smallOf = (i: number) =>
    i === 0 ? smallPx : smallPx * REST_SMALL_SCALE;

  const smallH = new Array<number>(N).fill(0);
  const bigH = new Array<number>(N).fill(0);
  const g = new Array<number>(N).fill(0);
  const h = new Array<number>(N).fill(0);
  const center = new Array<number>(N).fill(0);
  const lastFont = new Array<string>(N).fill("");
  const lastWeight = new Array<string>(N).fill("");
  const lastOpacity = new Array<string>(N).fill("");
  const lastTransform = new Array<string>(N).fill("");

  const measure = () => {
    const t0 = texts[0];
    const t1 = texts[1];
    const p0 = t0.style.fontSize;
    const p1 = t1.style.fontSize;
    t0.style.fontSize = "";
    t1.style.fontSize = "";
    bigPx = parseFloat(getComputedStyle(t0).fontSize) || 40;
    bigPxRest = bigPx * REST_BIG_SCALE;
    smallPx = parseFloat(getComputedStyle(t1).fontSize) || 16;
    t0.style.fontSize = p0;
    t1.style.fontSize = p1;
    const rootPx =
      parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const rowSpace = Math.max(
      1.1 * rootPx,
      Math.min(0.02 * window.innerWidth, 1.65 * rootPx),
    );
    GAP = Math.round(2 * rowSpace);
    for (let i = 0; i < N; i++) {
      const tx = texts[i];
      const prev = tx.style.fontSize;
      tx.style.fontSize = smallOf(i) + "px";
      smallH[i] = rows[i].offsetHeight;
      tx.style.fontSize = bigOf(i) + "px";
      bigH[i] = rows[i].offsetHeight;
      tx.style.fontSize = prev;
      lastFont[i] = lastWeight[i] = lastOpacity[i] = lastTransform[i] = "";
    }
    big0H = bigH[0];
    p1MinH =
      smallH[0] +
      (bigH[0] - smallH[0]) * ((bigPxRest - smallPx) / (bigPx - smallPx));
    const H = bigH[0] + 2 * GAP + smallH[1] + smallH[2] + CONTAINER_EXTRA;
    Cy = H / 2;
    copy.style.height = H + "px";
  };

  const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
  const smoother = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

  const render = (u: number) => {
    let A =
      u <= PHASE_A_FRAC
        ? u / PHASE_A_FRAC
        : 1 + ((u - PHASE_A_FRAC) / (1 - PHASE_A_FRAC)) * (N - 2);
    if (A < 0) A = 0;
    else if (A > N - 1) A = N - 1;

    const m = smoother(clamp01((A - MORPH_A0) / (MORPH_A1 - MORPH_A0)));
    const grow = MIN_GROW * m;
    const lastFade = smoother(clamp01(A - (N - 2)));
    const minOp = (0.58 + (LOW_OPACITY - 0.58) * m) * (1 - lastFade);

    let top = 0;
    for (let i = 0; i < N; i++) {
      g[i] = smoother(clamp01(1 - Math.abs(i - A)));
      const sH = i === 0 ? p1MinH : smallH[i] + (bigH[i] - smallH[i]) * grow;
      h[i] = sH + (bigH[i] - sH) * g[i];
      center[i] = top + h[i] / 2;
      top += h[i] + GAP + (i === 0 ? FIRST_GAP_EXTRA : 0);
    }

    const lo = Math.floor(A);
    const hi = lo + 1 < N ? lo + 1 : N - 1;
    const anchorRaw = center[lo] + (center[hi] - center[lo]) * (A - lo);
    const anchorY = A <= 1 ? big0H / 2 + (Cy - big0H / 2) * A : Cy;
    const offset = anchorY - anchorRaw;

    for (let i = 0; i < N; i++) {
      const gi = g[i];
      const sPx =
        i === 0 ? bigPxRest : smallOf(i) + (bigOf(i) - smallOf(i)) * grow;

      const font = (sPx + (bigOf(i) - sPx) * gi).toFixed(2) + "px";
      if (font !== lastFont[i]) {
        texts[i].style.fontSize = font;
        lastFont[i] = font;
      }
      const weight = "" + Math.round(600 + 200 * gi);
      if (weight !== lastWeight[i]) {
        texts[i].style.fontWeight = weight;
        lastWeight[i] = weight;
      }
      const opacity = (minOp + (1 - minOp) * gi).toFixed(3);
      if (opacity !== lastOpacity[i]) {
        rows[i].style.opacity = opacity;
        lastOpacity[i] = opacity;
      }
      const transform =
        "translateY(" + (center[i] + offset - h[i] / 2).toFixed(2) + "px)";
      if (transform !== lastTransform[i]) {
        rows[i].style.transform = transform;
        lastTransform[i] = transform;
      }
    }
  };

  measure();
  render(0);

  const capProxy = { u: 0 };
  b.tl.to(
    capProxy,
    {
      u: 1,
      ease: "none",
      duration: CAP_END - CAP_START,
      onUpdate: () => render(capProxy.u),
    },
    CAP_START,
  );

  const onRefresh = () => {
    measure();
    render(capProxy.u);
  };
  ScrollTrigger.addEventListener("refresh", onRefresh);
  // Latch na wyścig fonts.ready vs teardown: gdy kontekst matchMedia zdąży
  // się cofnąć (resize/rotacja przez próg 760px) zanim fonty się doładują,
  // stale domknięcie nałożyłoby desktopowe style inline na mobilny layout.
  let dead = false;
  document.fonts?.ready.then(() => {
    if (dead) return;
    measure();
    render(capProxy.u);
    // Globalny refresh to zamierzony WYJĄTEK od zasady „bez ScrollTrigger.refresh()
    // po fonts.ready" (timeline-base.ts): desktop-only, jednorazowy, a geometria
    // karuzeli (wysokości/środki wierszy) realnie zmienia się po doładowaniu fontów.
    ScrollTrigger.refresh();
  });

  return () => {
    dead = true;
    ScrollTrigger.removeEventListener("refresh", onRefresh);
    copy.classList.remove("is-carousel");
    copy.style.removeProperty("height");
    rows.forEach((r, i) => {
      r.style.removeProperty("opacity");
      r.style.removeProperty("transform");
      texts[i].style.removeProperty("font-size");
      texts[i].style.removeProperty("font-weight");
    });
  };
};
