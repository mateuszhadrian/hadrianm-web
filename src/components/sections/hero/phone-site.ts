import { gsap } from "gsap";

export interface PhoneSiteApi {
  master: gsap.core.Timeline;
  relayout: () => void;
  setActive: (on: boolean) => void;
  destroy: () => void;
}

const clamp = (v: number, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
const smoother = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

const LITE = (() => {
  if (typeof navigator === "undefined") return false;
  const cores = navigator.hardwareConcurrency || 8;
  const mem = (navigator as { deviceMemory?: number }).deviceMemory || 8;
  return cores <= 4 || mem <= 4;
})();

export function initPhoneSite(root: HTMLElement): PhoneSiteApi | null {
  const qs = <T extends HTMLElement = HTMLElement>(s: string) =>
    root.querySelector<T>(s);

  const vh = () => root.clientHeight;

  const makeTypewriter = (el: HTMLElement) => {
    const full = (el.textContent || "").trim();
    el.setAttribute("aria-label", full);
    const csh = getComputedStyle(el);
    const lhpx = parseFloat(csh.lineHeight) || parseFloat(csh.fontSize) * 1.2;
    const lines = Math.max(1, Math.round(el.offsetHeight / lhpx));
    el.style.minHeight = lines + "lh";
    el.textContent = "";
    const textSpan = document.createElement("span");
    textSpan.setAttribute("aria-hidden", "true");
    const cursor = document.createElement("span");
    cursor.className = "dwm-tw-cursor";
    cursor.setAttribute("aria-hidden", "true");
    el.appendChild(textSpan);
    el.appendChild(cursor);

    const n = full.length;
    const thresh: number[] = [];
    const weights: number[] = [];
    for (let k = 0; k < n; k++) {
      let w = 1;
      if (full[k] === " ") w += 1.6;
      const j = Math.sin((k + 1) * 12.9898) * 43758.5453;
      w += (j - Math.floor(j)) * 0.9;
      weights.push(w);
    }
    const total = weights.reduce((a, b) => a + b, 0) || 1;
    let acc = 0;
    for (let k = 0; k < n; k++) {
      acc += weights[k];
      thresh.push(acc / total);
    }

    let shown = -1;
    let curOn: boolean | null = null;
    const render = (count: number, typing: boolean) => {
      if (count !== shown) {
        shown = count;
        textSpan.textContent = full.slice(0, count);
      }
      if (typing !== curOn) {
        curOn = typing;
        cursor.classList.toggle("dwm-tw-active", typing);
      }
    };
    return {
      setProgress(p: number) {
        if (p <= 0) return render(0, false);
        if (p >= 1) return render(n, false);
        let count = 0;
        while (count < n && thresh[count] <= p) count++;
        render(count, true);
      },
    };
  };

  const scrollEl = qs(".dwm-scroll");
  const heroBg = qs(".dwm-hero-bg");
  const heroTable = qs(".dwm-hero-table");
  const heroCopy = qs(".dwm-hero-copy");
  const heroHint = qs(".dwm-scroll-hint");
  const projectsEl = qs(".dwm-projects");
  const workshopEl = qs(".dwm-workshop");
  const galleryEl = qs(".dwm-gallery");
  const macro = qs(".dwm-macro");
  const projCard = qs(".dwm-proj-card");
  const proj1 = qs(".dwm-proj1");
  const proj2 = qs(".dwm-proj2");
  const proj3 = qs(".dwm-proj3");
  const projHeadingEl = qs(".dwm-projects .dwm-type");
  const shopHeadingEl = qs(".dwm-workshop .dwm-type");
  const galHeadingEl = qs(".dwm-gallery .dwm-type");
  const shopCard = qs(".dwm-shop-card");
  const SHOP_PARALLAX = [
    { el: qs(".dwm-shop-bg"), s: 1.15, x: -0.4, y: -0.5 },
    { el: qs(".dwm-shop-wood"), s: 1.3, x: -0.8, y: -1.0 },
    { el: qs(".dwm-shop-man"), s: 1.5, x: -1.3, y: -1.6 },
    { el: qs(".dwm-shop-table"), s: 1.8, x: -2.0, y: -2.4 },
  ].filter((l) => l.el);
  const projType = projHeadingEl ? makeTypewriter(projHeadingEl) : null;
  const shopType = shopHeadingEl ? makeTypewriter(shopHeadingEl) : null;
  const galType = galHeadingEl ? makeTypewriter(galHeadingEl) : null;
  const cardEls = Array.from(root.querySelectorAll<HTMLElement>(".dwm-card"));

  let maxScroll = 0;
  let projTop = 0;
  let projH = 0;
  let shopTop = 0;
  let shopCardTop = 0;
  let shopCardH = 0;
  let lastShopP = -1;
  let galTop = 0;
  let macroCover = 2.3;
  let cardFullH = 0;
  let cardFinalH = 0;
  type Card = {
    el: HTMLElement;
    top: number;
    h: number;
    ls: number;
    lo: number;
  };
  let cards: Card[] = [];

  const layout = () => {
    if (!scrollEl) return;

    if (projCard) {
      const cw = projCard.clientWidth;
      const im = macro as HTMLImageElement | null;
      const iw = (im && im.naturalWidth) || 1233;
      const ih = (im && im.naturalHeight) || 592;
      const imageH = (cw * ih) / iw;
      projCard.style.height = "";
      cardFullH = projCard.clientHeight;
      cardFinalH = imageH * 1.2;
      const containS = Math.min(cw / iw, cardFullH / ih);
      const coverS = Math.max(cw / iw, cardFullH / ih);
      if (containS > 0) macroCover = coverS / containS;
      projCard.style.height = cardFinalH + "px";
    }

    projTop = projectsEl ? projectsEl.offsetTop : 0;
    projH = projectsEl ? projectsEl.offsetHeight : vh();
    shopTop = workshopEl ? workshopEl.offsetTop : 0;
    shopCardTop = shopCard ? shopTop + shopCard.offsetTop : 0;
    shopCardH = shopCard ? shopCard.clientHeight : 0;
    galTop = galleryEl ? galleryEl.offsetTop : 0;
    cards = cardEls.map((el) => ({
      el,
      top: galTop + el.offsetTop,
      h: el.clientHeight,
      ls: -1,
      lo: -1,
    }));
    maxScroll = Math.max(0, scrollEl.offsetHeight - vh());
  };

  let heroOff = false;
  let lastCardH = -1;

  const FOCUS_MIN = 0.85;

  const pageRender = (y: number) => {
    const VH = vh();
    if (scrollEl) gsap.set(scrollEl, { y: -y });

    if (y < VH * 1.2) {
      heroOff = false;
      const hp = clamp(y / VH);
      if (!LITE) {
        if (heroBg)
          gsap.set(heroBg, { scale: 1 + 0.18 * hp, y: hp * VH * 0.12 });
        if (heroTable)
          gsap.set(heroTable, { scale: 1 + 0.3 * hp, y: hp * VH * 0.2 });
      }
      if (heroCopy)
        gsap.set(heroCopy, {
          y: LITE ? 0 : hp * VH * 0.22,
          opacity: 1 - clamp((y - VH * 0.12) / (VH * 0.5)),
        });
      if (heroHint) gsap.set(heroHint, { opacity: 1 - clamp(y / (VH * 0.25)) });
    } else if (!heroOff) {
      heroOff = true;
      if (heroCopy) gsap.set(heroCopy, { opacity: 0 });
      if (heroHint) gsap.set(heroHint, { opacity: 0 });
    }

    const typeWindow = (top: number) =>
      clamp((y - (top - VH * 0.55)) / (VH * 0.35));
    if (projType) projType.setProgress(typeWindow(projTop));
    if (shopType) shopType.setProgress(typeWindow(shopTop));
    if (galType) galType.setProgress(typeWindow(galTop));

    const pv = clamp((y - (projTop - VH * 0.45)) / (projH * 0.95));
    const reveal = LITE ? 1 : clamp(pv / 0.4);
    const mIn = clamp((pv - 0.4) / 0.1);
    const p12 = clamp((pv - 0.5) / 0.25);
    const p23 = clamp((pv - 0.75) / 0.25);
    if (projCard && cardFullH) {
      const h = LITE
        ? cardFinalH
        : cardFullH + (cardFinalH - cardFullH) * reveal;
      if (Math.abs(h - lastCardH) > 0.5) {
        lastCardH = h;
        projCard.style.height = h.toFixed(1) + "px";
      }
    }
    if (macro)
      gsap.set(macro, {
        scale: LITE ? 1 : macroCover + (1 - macroCover) * reveal,
        opacity: 1 - mIn,
      });
    if (proj1) gsap.set(proj1, { opacity: mIn * (1 - p12) });
    if (proj2) gsap.set(proj2, { opacity: p12 * (1 - p23) });
    if (proj3) gsap.set(proj3, { opacity: p23 });

    if (shopCardH && SHOP_PARALLAX.length) {
      const sp = LITE ? 0 : clamp((y - (shopCardTop - VH)) / (shopCardH + VH));
      if (Math.abs(sp - lastShopP) > 0.002) {
        lastShopP = sp;
        for (const l of SHOP_PARALLAX) {
          gsap.set(l.el, {
            scale: 1 + (l.s - 1) * sp,
            xPercent: l.x * sp,
            yPercent: l.y * sp,
          });
        }
      }
    }

    const range = VH * 0.55;
    for (const c of cards) {
      const enter = clamp((y - (c.top - VH)) / (VH * 0.6));
      const op = clamp(enter * 1.4);
      let sc = 1;
      if (!LITE) {
        const center = c.top - y + c.h / 2;
        sc =
          FOCUS_MIN +
          (1 - FOCUS_MIN) *
            smoother(1 - clamp(Math.abs(center - VH / 2) / range));
      }
      if (Math.abs(sc - c.ls) > 0.003 || Math.abs(op - c.lo) > 0.01) {
        c.ls = sc;
        c.lo = op;
        gsap.set(c.el, { scale: sc, opacity: op });
      }
    }
  };

  const intro = gsap.timeline({ defaults: { ease: "none" } });
  intro.fromTo(
    qs(".dwm-hero-logo"),
    { opacity: 0.32 },
    { opacity: 0, duration: 0.15, ease: "none" },
    0,
  );
  intro.fromTo(
    qs(".dwm-wood"),
    { opacity: 0, y: 28 },
    { opacity: 1, y: 0, duration: 0.15, ease: "power2.out" },
    0,
  );
  intro.fromTo(
    qs(".dwm-steel"),
    { opacity: 0, y: 28 },
    { opacity: 1, y: 0, duration: 0.15, ease: "power2.out" },
    0.05,
  );
  intro.fromTo(
    qs(".dwm-topbar"),
    { opacity: 0, y: -14 },
    { opacity: 1, y: 0, duration: 0.12, ease: "power2.out" },
    0,
  );

  const proxy = { y: 0 };
  const scrollTl = gsap.timeline({ defaults: { ease: "none" } });
  scrollTl.to(proxy, {
    y: () => maxScroll,
    duration: 1,
    onUpdate: () => pageRender(proxy.y),
  });

  for (const l of SHOP_PARALLAX) gsap.set(l.el, { transformOrigin: "50% 62%" });

  layout();
  pageRender(0);

  const master = gsap.timeline({ paused: true });
  master.add(intro).add(scrollTl, ">");
  master.progress(1).progress(0);

  const relayout = () => {
    layout();
    master.invalidate();
    master.progress(master.progress());
  };
  window.addEventListener("resize", relayout);

  const setActive = (on: boolean) => root.classList.toggle("is-active", on);

  return {
    master,
    relayout,
    setActive,
    destroy: () => {
      window.removeEventListener("resize", relayout);
      master.kill();
    },
  };
}
