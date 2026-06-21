import { gsap } from "gsap";

// ── Strona "drewelomet" jako spauzowany master-timeline napędzany scrollem Hero.
//    Przepisane z ref_sources/drewelomet-gsap-page/index.html: trzy osobne
//    ScrollTrigger'y → trzy paused-timeline'y złożone sekwencyjnie w `master`.
//    Wszystkie wymiary liczone z `root` (ekran laptopa), nie z okna; w galerii
//    używamy metryk layoutu (offset*/client*), bo getBoundingClientRect zwraca
//    rozmiar zniekształcony przez transform 3D laptopa. ──

export interface LaptopSiteApi {
  /** Spauzowany timeline całej animacji (progress 0→1). Scrubowany z Hero. */
  master: gsap.core.Timeline;
  /** Przelicz layout (galeria) + odśwież wartości funkcyjne po resize/refresh. */
  relayout: () => void;
  /** will-change tylko na czas fazy 3 (klasa .is-active na root). */
  setActive: (on: boolean) => void;
  /** Sprzątanie (HMR / teardown wariantu matchMedia). */
  destroy: () => void;
}

// Jednostka czasu osi ↔ vh oryginału (zachowuje względne tempa między fragmentami).
const VH_PER_UNIT = 326.53;

export function initLaptopSite(root: HTMLElement): LaptopSiteApi | null {
  const qs = <T extends HTMLElement = HTMLElement>(s: string) =>
    root.querySelector<T>(s);

  // Wymiary "viewportu" = ekran (layout, niezależny od transformu 3D laptopa).
  const vw = () => root.clientWidth;
  const vh = () => root.clientHeight;

  gsap.config({ force3D: true, units: { transformPerspective: "px" } });

  /* ── Miarka: pionowa linia + count+1 kresek (co 5. dłuższa, co 10. najdłuższa) ── */
  const buildRuler = (selector: string, count: number) => {
    const el = qs(selector);
    if (!el) return;
    const line = document.createElement("div");
    line.className = "dw-ruler-line";
    el.appendChild(line);
    for (let i = 0; i <= count; i++) {
      const tick = document.createElement("div");
      tick.className = "dw-ruler-tick";
      tick.style.top = (i / count) * 100 + "%";
      tick.style.width =
        i % 10 === 0
          ? "var(--tick-max)"
          : i % 5 === 0
            ? "var(--tick-mid)"
            : "var(--tick-min)";
      el.appendChild(tick);
    }
  };
  buildRuler(".dw-ruler-1", 36);
  buildRuler(".dw-ruler-2", 36);

  /* ── Odsłanianie miarki przez clip-path wpisywany inline (nie przez maskę na
     zmiennej --draw): zmiana clip-path per-frame gwarantuje repaint także w
     skompozytowanym poddrzewie 3D laptopa, gdzie maska na niezarejestrowanej
     zmiennej CSS zostawała „zamrożona" i miarka nie pojawiała się wcale.
     frac 0→1; fromBottom=true → rośnie od dołu (lewa miarka), false → od góry. ── */
  const setRulerClip = (
    el: HTMLElement | null,
    frac: number,
    fromBottom: boolean,
  ) => {
    if (!el) return;
    const hidden = (1 - frac) * 100;
    const clip = fromBottom
      ? `inset(${hidden}% 0 0 0)`
      : `inset(0 0 ${hidden}% 0)`;
    el.style.clipPath = clip;
    el.style.setProperty("-webkit-clip-path", clip);
  };

  const CROSSFADE_START = 0.82;
  const FADE_OUT_DUR = 0.14;
  const HIDE_TIME = CROSSFADE_START + FADE_OUT_DUR;

  /* ── Typewriter nagłówka sceny 1 (postęp pisania sterowany czasem osi) ── */
  const makeTypewriter = (el: HTMLElement) => {
    const full = (el.textContent || "").trim();
    el.setAttribute("aria-label", full);
    el.textContent = "";
    const textSpan = document.createElement("span");
    textSpan.setAttribute("aria-hidden", "true");
    const cursor = document.createElement("span");
    cursor.className = "dw-tw-cursor";
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
        cursor.classList.toggle("dw-tw-active", typing);
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

  const headingEl = qs(".dw-sec-text .dw-sec-heading");
  const typewriter = headingEl ? makeTypewriter(headingEl) : null;
  const TYPE_START = 1.74;
  const TYPE_END = 2.24;

  const cameraZoom = qs(".dw-camera-zoom");
  const camera = qs(".dw-camera");
  const nav = qs(".dw-nav");
  const brand = qs(".dw-brand");

  /* ═══════════════════════ SCENA 1 ═══════════════════════ */
  const buildScene1 = () => {
    // NIE pauzujemy pod-timeline'ów: spauzowany child zagnieżdżony w rodzicu nie
    // jest przez niego renderowany. Pauzuje tylko `master` (steruje całością).
    const tl = gsap.timeline({ defaults: { ease: "none" } });

    tl.eventCallback("onUpdate", () => {
      const t = tl.time();
      if (cameraZoom) {
        const hidden = t >= HIDE_TIME;
        if (hidden && cameraZoom.style.display !== "none") {
          cameraZoom.style.display = "none";
          cameraZoom.style.willChange = "auto";
        } else if (!hidden && cameraZoom.style.display === "none") {
          cameraZoom.style.display = "";
          cameraZoom.style.willChange = "transform";
        }
      }
      if (typewriter) {
        const tp = (t - TYPE_START) / (TYPE_END - TYPE_START);
        typewriter.setProgress(tp < 0 ? 0 : tp > 1 ? 1 : tp);
      }
    });

    tl.to(qs(".dw-layer-bg"), { scale: 2.0 }, 0);
    tl.to(
      qs(".dw-layer-shelf"),
      { xPercent: -33, yPercent: -2, scale: 2.2 },
      0,
    );
    tl.to(qs(".dw-layer-table"), { xPercent: -40, yPercent: 4, scale: 2.4 }, 0);
    tl.to(qs(".dw-layer-text"), { xPercent: -40, yPercent: 4, scale: 2.4 }, 0);
    tl.to(qs(".dw-layer-steel"), { xPercent: 1, scale: 2.2 }, 0);

    const PAN_START = 0.6;
    tl.to(
      camera,
      { xPercent: 60, yPercent: -21, ease: "sine.inOut", duration: 0.52 },
      PAN_START,
    );
    tl.to(
      cameraZoom,
      { scale: 4, ease: "sine.inOut", duration: 0.52 },
      PAN_START,
    );

    tl.to(
      cameraZoom,
      { opacity: 0, ease: "power1.inOut", duration: FADE_OUT_DUR },
      CROSSFADE_START,
    );

    // Logo (znak + logotyp) chowa się za lewą krawędzią ekranu niezależnie od
    // reszty paska i wcześniej — startuje, gdy zdjęcie loftu zaczyna znikać
    // i przeistaczać się w róg stołu (macro). Linki znikają dopiero w TYPE_END.
    if (brand)
      tl.to(
        brand,
        { xPercent: -160, ease: "power2.in", duration: 0.5 },
        CROSSFADE_START,
      );

    const macro = qs(".dw-macro");
    gsap.set(macro, { transformOrigin: "30% 68%" });
    tl.to(
      macro,
      { opacity: 1, ease: "power1.out", duration: 0.16 },
      CROSSFADE_START,
    );
    tl.fromTo(
      macro,
      { scale: 1.5, xPercent: -34, yPercent: 12 },
      {
        scale: 1.12,
        xPercent: 0,
        yPercent: 0,
        ease: "power2.out",
        duration: 0.44,
      },
      CROSSFADE_START,
    );

    const TRANSFORM_START = 1.36;
    const TRANSFORM_DUR = 1.09;
    // Kadr osiada na 58% szerokości ekranu z zachowaniem proporcji okna.
    // Aspect kadru sprzed zmiany ≈1.298 → przy 58% szer. wysokość = 71% (FRAME_H_VH
    // 64.2 po uwzględnieniu FRAME_STOP). Prawa krawędź zostaje ~96% (MARGIN_VW bez zmian).
    const FRAME_W_VW = 47.5;
    const FRAME_H_VH = 64.2;
    const MARGIN_VW = 5;
    const FRAME_STOP = 0.8;

    const frameWpxFull = () => (FRAME_W_VW / 100) * vw();
    const frameHpxFull = () => (FRAME_H_VH / 100) * vh();
    const frameLeftPxFull = () => vw() * (1 - MARGIN_VW / 100) - frameWpxFull();
    const frameTopPxFull = () => vh() / 2 - frameHpxFull() / 2;
    const frameWpx = () => vw() + FRAME_STOP * (frameWpxFull() - vw());
    const frameHpx = () => vh() + FRAME_STOP * (frameHpxFull() - vh());
    const frameLeftPx = () => FRAME_STOP * frameLeftPxFull();
    const frameTopPx = () => FRAME_STOP * frameTopPxFull();

    tl.to(
      qs(".dw-frame"),
      {
        left: frameLeftPx,
        top: frameTopPx,
        width: frameWpx,
        height: frameHpx,
        ease: "power2.inOut",
        duration: TRANSFORM_DUR,
      },
      TRANSFORM_START,
    );

    gsap.set(qs(".dw-object"), { xPercent: -50, yPercent: -50 });
    // 0.614 = 0.55 × (58/52): kadr rośnie tym samym współczynnikiem co okno ramki,
    // więc framing zostaje identyczny — tylko proporcjonalnie większy.
    tl.to(
      qs(".dw-object"),
      { scale: 0.614, ease: "power2.inOut", duration: TRANSFORM_DUR },
      TRANSFORM_START,
    );
    // Krawędzie ramki: macro ma twarde krawędzie (feather 0). Miękną dopiero
    // dokładnie w oknie crossfade macro→proj1 (start 1.51, dur 0.22), więc zmiana
    // ginie w przenikaniu. Maskę piszemy inline per-frame — pewny repaint maski
    // w skompozytowanym poddrzewie 3D laptopa (zmiana zmiennej CSS by nie wystarczyła).
    const frameEl = qs(".dw-frame");
    const frameFeather = { f: 0 };
    const setFrameFeather = () => {
      if (!frameEl) return;
      const f = frameFeather.f;
      const grad =
        `linear-gradient(to right, transparent 0, #000 ${f}%, #000 ${100 - f}%, transparent 100%),` +
        `linear-gradient(to bottom, transparent 0, #000 ${f}%, #000 ${100 - f}%, transparent 100%)`;
      frameEl.style.maskImage = grad;
      frameEl.style.setProperty("-webkit-mask-image", grad);
    };
    setFrameFeather();
    tl.to(
      frameFeather,
      { f: 6, ease: "sine.inOut", duration: 0.22, onUpdate: setFrameFeather },
      1.51,
    );

    tl.to(
      qs(".dw-proj1"),
      { opacity: 1, ease: "sine.inOut", duration: 0.22 },
      1.51,
    );
    tl.to(macro, { opacity: 0, ease: "sine.inOut", duration: 0.22 }, 1.51);
    tl.to(
      qs(".dw-proj2"),
      { opacity: 1, ease: "sine.inOut", duration: 0.22 },
      1.8,
    );
    tl.to(
      qs(".dw-proj1"),
      { opacity: 0, ease: "sine.inOut", duration: 0.22 },
      1.8,
    );
    tl.to(
      qs(".dw-proj3"),
      { opacity: 1, ease: "sine.inOut", duration: 0.25 },
      2.2,
    );
    tl.to(
      qs(".dw-proj2"),
      { opacity: 0, ease: "sine.inOut", duration: 0.25 },
      2.2,
    );

    // yPercent 0: kontener kotwiczony dołem przez CSS (bottom), nie wyśrodkowany —
    // dzięki temu rosnący/zawijający się nagłówek rozpycha się do góry, a okno
    // bulletów zostaje w tym samym miejscu.
    gsap.set(qs(".dw-sec-text"), { yPercent: 0 });
    tl.fromTo(
      qs(".dw-sec-text"),
      { opacity: 0, x: -40 },
      { opacity: 1, x: 0, ease: "power2.out", duration: 0.5 },
      1.74,
    );
    tl.fromTo(
      qs(".dw-bg-logo-left"),
      { opacity: 0 },
      { opacity: 1, ease: "power2.out", duration: 0.5 },
      1.74,
    );

    const BULLETS_N = 8;
    const BULLETS_VISIBLE = 3;
    const BULLETS_YPCT = -((BULLETS_N - BULLETS_VISIBLE) / BULLETS_N) * 100;
    const BULLETS_DUR = 120 / VH_PER_UNIT;
    const BULLETS_START = 2.1;
    tl.to(
      qs(".dw-sec-text .dw-bullets"),
      { yPercent: BULLETS_YPCT, duration: BULLETS_DUR },
      BULLETS_START,
    );

    // Navbar: chowa się do góry, gdy cały nagłówek „Od wizji do projektu" jest
    // już dopisany (TYPE_END) — w kolejnych sekcjach (warsztat, galeria) go nie ma.
    if (nav)
      tl.to(
        nav,
        { yPercent: -130, autoAlpha: 0, ease: "power2.in", duration: 0.32 },
        TYPE_END,
      );

    const REVERT_DUR = 40 / VH_PER_UNIT;
    const REVERT_START = BULLETS_START + BULLETS_DUR;
    const DETACH_DUR = 100 / VH_PER_UNIT;
    const DETACH_START = REVERT_START + REVERT_DUR;

    // Miarka lewa — rysuje się od dołu do góry (TYPE_START → DETACH_START).
    const ruler1 = qs(".dw-ruler-1");
    const ruler1p = { v: 0 };
    setRulerClip(ruler1, 0, true);
    tl.to(
      ruler1p,
      {
        v: 1,
        duration: DETACH_START - TYPE_START,
        onUpdate: () => setRulerClip(ruler1, ruler1p.v, true),
      },
      TYPE_START,
    );

    gsap.set(qs(".dw-section2"), { yPercent: 100 });
    tl.to(
      qs(".dw-stage"),
      { yPercent: -100, duration: DETACH_DUR },
      DETACH_START,
    );
    tl.fromTo(
      qs(".dw-section2"),
      { yPercent: 100 },
      { yPercent: 0, duration: DETACH_DUR },
      DETACH_START,
    );
    // końcowy hold sceny 1
    tl.to({}, { duration: 40 / VH_PER_UNIT }, DETACH_START + DETACH_DUR);
    return tl;
  };

  /* ═══════════════════════ SCENA 2 ═══════════════════════ */
  const buildScene2 = () => {
    // NIE pauzujemy pod-timeline'ów: spauzowany child zagnieżdżony w rodzicu nie
    // jest przez niego renderowany. Pauzuje tylko `master` (steruje całością).
    const tl = gsap.timeline({ defaults: { ease: "none" } });
    const S2_MAIN_DUR = 144 / VH_PER_UNIT;
    const S2_DETACH_DUR = 100 / VH_PER_UNIT;
    const S2_END_DUR = 30 / VH_PER_UNIT;

    gsap.set(qs(".dw-section3"), { yPercent: 100 });

    tl.to(qs(".dw-s2-frame"), { scale: 1.3, duration: S2_MAIN_DUR }, 0);
    tl.to(
      qs(".dw-s2-bg"),
      { scale: 1.15, xPercent: -0.4, yPercent: -0.5, duration: S2_MAIN_DUR },
      0,
    );
    tl.to(
      qs(".dw-s2-wood"),
      { scale: 1.3, xPercent: -0.8, yPercent: -1.0, duration: S2_MAIN_DUR },
      0,
    );
    tl.to(
      qs(".dw-s2-man"),
      { scale: 1.5, xPercent: -1.3, yPercent: -1.6, duration: S2_MAIN_DUR },
      0,
    );
    tl.to(
      qs(".dw-s2-table"),
      { scale: 1.8, xPercent: -2.0, yPercent: -2.4, duration: S2_MAIN_DUR },
      0,
    );

    const S2_BULLETS_N = 9;
    const S2_BULLETS_VISIBLE = 4;
    const S2_BULLETS_YPCT =
      -((S2_BULLETS_N - S2_BULLETS_VISIBLE) / S2_BULLETS_N) * 100;
    tl.to(
      qs(".dw-s2-bullets"),
      { yPercent: S2_BULLETS_YPCT, duration: S2_MAIN_DUR },
      0,
    );
    // Miarka prawa — rysuje się od góry do dołu przez całą fazę główną sekcji 2.
    const ruler2 = qs(".dw-ruler-2");
    const ruler2p = { v: 0 };
    setRulerClip(ruler2, 0, false);
    tl.to(
      ruler2p,
      {
        v: 1,
        duration: S2_MAIN_DUR,
        onUpdate: () => setRulerClip(ruler2, ruler2p.v, false),
      },
      0,
    );

    tl.to(
      qs(".dw-section3"),
      { yPercent: 0, duration: S2_DETACH_DUR },
      S2_MAIN_DUR,
    );
    tl.to({}, { duration: S2_END_DUR }, S2_MAIN_DUR + S2_DETACH_DUR);
    return tl;
  };

  /* ═══════════════════════ SEKCJA 3 — GALERIA ═══════════════════════ */
  const RATIO_L = 835 / 523;
  const RATIO_P = 523 / 835;

  const gTable = qs(".dw-g-table");
  const gRtv = qs(".dw-g-rtv");
  const gCoffee = qs(".dw-g-coffee");
  const gDoor = qs(".dw-g-door");
  const gHs = qs(".dw-g-hs");
  const gDog = qs(".dw-g-dog");
  const gLamp = qs(".dw-g-lamp");
  const gBook = qs(".dw-g-book");
  const gBench = qs(".dw-g-bench");

  const S_TABLE = 1.0;
  const S_RTV = 1.2;
  const S_COFFEE = 1.4;
  const HS_REVEAL_FRAC = 0.55;
  const S_DOG = 1.0;
  const S_LAMP = 1.2;
  const S_BOOK = 1.4;
  const S_BENCH = 1.6;
  const R2_FADE_Q1_LEN = 0.12;

  // Skrócona galeria (decyzja: kompresja końcówki). Skrócony rząd 2 + zjazd.
  const ROW1_VH = 300;
  const DROP_VH = 60;
  const ROW2_VH = 170;
  const GAL_VH = ROW1_VH + DROP_VH + ROW2_VH;
  const F1 = ROW1_VH / GAL_VH;
  const F2 = DROP_VH / GAL_VH;

  const galProxy = { p: 0 };
  type GLayout = {
    gh: number;
    wL: number;
    wH: number;
    tableL: number;
    rtvL: number;
    coffeeL: number;
    doorL: number;
    hsL: number;
    stopB: number;
    DE: number;
    PL: number;
    b1Max: number;
    dogL: number;
    lampL: number;
    bookL: number;
    benchL: number;
    b2Max: number;
    q1DoorIn: number;
  };
  let G = {} as GLayout;

  const galleryLayout = () => {
    // Galeria wypełnia całą widoczną wysokość strony. Navbar w fazie galerii już
    // nie istnieje (zjechał w scenie 1), więc nie rezerwujemy paska u góry —
    // kadr = ekran minus realny pasek chrome (.dw-chrome.offsetHeight, odporne na 3D).
    const chromeEl = qs(".dw-chrome");
    const chromeH = chromeEl ? chromeEl.offsetHeight : 0;
    const gh = vh() - chromeH;
    root.style.setProperty("--nav-h", "0px");
    root.style.setProperty("--gh", gh + "px");

    const wL = RATIO_L * gh;
    const wH = RATIO_P * gh;
    const iw = vw();

    // Pierwszy obraz (stół) przyklejony do lewej krawędzi ekranu — bez wyśrodkowania,
    // by przy wejściu w galerię nie było przerwy po lewej. Cały rząd (rtv/coffee/door/hs)
    // i miarki scrolla (b1Max, stopB…) są pochodnymi tableL, więc przesuwa się spójnie.
    const tableL = 0;
    const rtvL = tableL + wL;
    const coffeeL = rtvL + wL;
    const doorL = coffeeL + wL;
    const hsL = doorL - wH;

    const DE = 0.5 * wH;
    const PL = wH - DE;
    const stopB = doorL - wH / 2 - DE / 2 - iw * HS_REVEAL_FRAC;
    const b1Max = (doorL + wL + wH - iw) / S_COFFEE;

    const dogL = 0;
    const lampL = wL;
    const bookL = 2 * wL;
    const benchL = 3 * wL;
    const b2Max = (benchL + wL - iw) / S_BENCH;
    const q1DoorIn = (doorL - iw) / (doorL + wL + wH - iw);

    G = {
      gh,
      wL,
      wH,
      tableL,
      rtvL,
      coffeeL,
      doorL,
      hsL,
      stopB,
      DE,
      PL,
      b1Max,
      dogL,
      lampL,
      bookL,
      benchL,
      b2Max,
      q1DoorIn,
    };
    galleryRender(galProxy.p);
  };

  const doorBase = (b: number) => {
    const { stopB, DE, PL } = G;
    const bA = stopB;
    if (b <= bA) return b;
    if (b <= bA + DE) {
      const x = b - bA;
      return bA + 0.5 * (x + (DE / Math.PI) * Math.sin((Math.PI * x) / DE));
    }
    if (b <= bA + DE + PL) return bA + DE / 2;
    if (b <= bA + DE + PL + DE) {
      const x = b - (bA + DE + PL);
      return (
        bA + DE / 2 + 0.5 * (x - (DE / Math.PI) * Math.sin((Math.PI * x) / DE))
      );
    }
    return b - (DE + PL);
  };

  const smoother = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

  function galleryRender(p: number) {
    if (!G.gh) return;
    const gh = G.gh;
    let q1: number, q2: number, q3: number;
    if (p <= F1) {
      q1 = p / F1;
      q2 = 0;
      q3 = 0;
    } else if (p <= F1 + F2) {
      q1 = 1;
      q2 = (p - F1) / F2;
      q3 = 0;
    } else {
      q1 = 1;
      q2 = 1;
      q3 = (p - F1 - F2) / (1 - F1 - F2);
    }

    const e = smoother(q2);
    const dropY = e * gh;
    const row2Y = -gh + e * gh;

    const b = q1 * G.b1Max;
    const bc = b * S_COFFEE;
    const bd = doorBase(bc);
    gsap.set(gTable, { x: G.tableL - b * S_TABLE, y: dropY });
    gsap.set(gRtv, { x: G.rtvL - b * S_RTV, y: dropY });
    gsap.set(gCoffee, { x: G.coffeeL - bc, y: dropY });
    gsap.set(gDoor, { x: G.doorL - bd, y: dropY });
    gsap.set(gHs, { x: G.hsL - bd, y: dropY });

    let r2op = (q1 - G.q1DoorIn) / R2_FADE_Q1_LEN;
    r2op = r2op < 0 ? 0 : r2op > 1 ? 1 : r2op;
    const bc2 = q3 * G.b2Max;
    gsap.set(gDog, { x: G.dogL - bc2 * S_DOG, y: row2Y, opacity: r2op });
    gsap.set(gLamp, { x: G.lampL - bc2 * S_LAMP, y: row2Y, opacity: r2op });
    gsap.set(gBook, { x: G.bookL - bc2 * S_BOOK, y: row2Y, opacity: r2op });
    gsap.set(gBench, { x: G.benchL - bc2 * S_BENCH, y: row2Y, opacity: r2op });
  }

  const buildGallery = () => {
    // NIE pauzujemy pod-timeline'ów: spauzowany child zagnieżdżony w rodzicu nie
    // jest przez niego renderowany. Pauzuje tylko `master` (steruje całością).
    const tl = gsap.timeline({ defaults: { ease: "none" } });
    tl.to(galProxy, {
      p: 1,
      duration: 1,
      onUpdate: () => galleryRender(galProxy.p),
    });
    return tl;
  };

  /* ═══════════════════════ MASTER ═══════════════════════ */
  const scene1 = buildScene1();
  const scene2 = buildScene2();
  const gallery = buildGallery();

  galleryLayout();
  galleryRender(0);

  const master = gsap.timeline({ paused: true });
  master.add(scene1).add(scene2, ">").add(gallery, ">");
  // Wymuś render kadru 0 (utrwala wartości startowe .to() i czyści stan początkowy).
  master.progress(1).progress(0);

  const relayout = () => {
    galleryLayout();
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
