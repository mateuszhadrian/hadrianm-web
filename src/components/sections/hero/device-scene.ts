import { gsap } from "gsap";

// ── Docelowa poza urządzeń w klatce C (desktop) — jedno źródło prawdy:
//    używane i przy pomiarze adaptacyjnym (computeFrameC), i w timeline (Hero). ──
export const FRAME_C = {
  camCx: 11, // obrót kamery (oś X)
  camCy: -27, // obrót kamery (oś Y)
  lapYaw: -13, // skręt laptopa (oś Y)
  lapPitch: 8, // odchylenie pokrywy do tyłu (oś X) — „bardziej otwarty"
  phDx: -780, // telefon dalej w lewo (większe rozsunięcie od laptopa)
  phDy: 70, // telefon niżej
  phDz: 210, // telefon bardziej do przodu
};

export interface DeviceSceneApi {
  /** Adaptacyjne dopasowanie grupy do prawej strefy (klatka C). Czytane przez timeline. */
  getFrameC: () => { x: number; scale: number };
  /** Przelicz layout (po zmianie rozmiaru / przy odświeżeniu ScrollTriggera). */
  relayout: () => void;
  /** Zdejmij listener resize (np. przy HMR / teardown). */
  destroy: () => void;
}

/**
 * Inicjalizuje scenę urządzeń 3D: buduje warstwy ekstruzji, ustawia pierwszą
 * klatkę (B), skaluje grupę do viewportu, centruje ją pomiarem realnego bbox
 * oraz liczy adaptacyjną klatkę C. Timeline scrolla (w Hero.astro) tylko
 * animuje zmienne CSS i czyta `getFrameC()` — nie dotyka geometrii sceny.
 *
 * @param devicesEl wrapper `.hero__devices` (pełen viewport, animowany przez timeline)
 */
export function initDeviceScene(devicesEl: HTMLElement): DeviceSceneApi | null {
  // Tokeny wymiarów/chassis żyją na `.device-scene` (komponent), więc CSS-owe
  // zmienne czytamy z tego elementu, a nie z wrappera.
  const scene = devicesEl.querySelector<HTMLElement>(".device-scene");
  if (!scene) return null;

  // Adaptacyjne dopasowanie grupy do prawej strefy — liczone w layout (resize),
  // czytane przez timeline. scale >1 = powiększenie, <1 = pomniejszenie.
  let frameC = { x: 0, scale: 1 };

  const dvar = (n: string) =>
    parseFloat(getComputedStyle(scene).getPropertyValue(n));

  const hexToRgb = (h: string): [number, number, number] => {
    const s = h.trim().replace("#", "");
    return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16)) as [
      number,
      number,
      number,
    ];
  };
  const c1 = hexToRgb(getComputedStyle(scene).getPropertyValue("--chassis-1"));
  const c2 = hexToRgb(getComputedStyle(scene).getPropertyValue("--chassis-2"));
  const c3 = hexToRgb(getComputedStyle(scene).getPropertyValue("--chassis-3"));
  const dim = (c: [number, number, number], f: number) =>
    `rgb(${Math.round(c[0] * f)},${Math.round(c[1] * f)},${Math.round(c[2] * f)})`;

  const buildExtrude = (el: HTMLElement, depth: number) => {
    const layers = Math.max(6, Math.round(depth / 2));
    const step = depth / layers;
    const frag = document.createDocumentFragment();
    for (let i = layers; i >= 1; i--) {
      const d = i / layers;
      const f = 1 - d * 0.45; // ciemniej ku tyłowi (wpieczone w kolory)
      const lay = document.createElement("div");
      lay.className = "extrude__layer";
      lay.style.background = `linear-gradient(90deg, ${dim(c3, f)} 0%, ${dim(c2, f)} 46%, ${dim(c1, f)} 100%)`;
      lay.style.transform = `translateZ(${(-i * step).toFixed(2)}px)`;
      frag.appendChild(lay);
    }
    el.insertBefore(frag, el.firstChild);
  };

  // Na mobile scena jest PŁASKA (bez perspektywy / preserve-3d) — warstwy
  // ekstruzji byłyby i tak niewidoczne, a ich rasteryzacja głodzi GPU i powoduje
  // mruganie napisów + paska na Androidzie. Dlatego budujemy ekstruzję wyłącznie
  // poza wariantem mobilnym (patrz docs/analiza-android-obudowy-3d-...md).
  if (!window.matchMedia("(max-width: 760px)").matches) {
    scene
      .querySelectorAll<HTMLElement>(".lid[data-extrude]")
      .forEach((el) => buildExtrude(el, dvar("--lap-depth")));
    scene
      .querySelectorAll<HTMLElement>(".body[data-extrude]")
      .forEach((el) => buildExtrude(el, dvar("--ph-depth")));
  }

  /* ── 2) Pierwsza klatka sceny + skalowanie do viewportu ── */
  const camera = scene.querySelector<HTMLElement>('[data-gsap="camera"]');
  const laptop = scene.querySelector<HTMLElement>('[data-gsap="laptop"]');
  const phone = scene.querySelector<HTMLElement>('[data-gsap="phone"]');
  const base = scene.querySelector<HTMLElement>('[data-gsap="laptop-base"]');
  const fitEl = scene.querySelector<HTMLElement>(".fit");

  const isStacked = () => window.matchMedia("(max-width: 760px)").matches;

  const GROUP_SCALE = 0.72; // ogólne zmniejszenie całej grupy urządzeń

  // Połówkowe wymiary brył (px, układ projektowy) — do policzenia bbox grupy.
  const LAP_HW = 441; // pokrywa + szerszy pasek bazy (1.05×)
  const LAP_TOP = -267; // górna krawędź pokrywy względem środka laptopa
  const LAP_BOT = 285; // dolna krawędź (pokrywa + pasek bazy)
  const PH_TOP_MOBILE = 144; // górna krawędź telefonu na mobile — zachowywana niezależnie od rozmiaru

  // Geometria klatki B + bounding box CAŁEJ grupy (laptop+telefon).
  const geometry = () => {
    const stacked = isStacked();
    // realne połowy wymiarów telefonu z CSS (na mobile --ph-w/--ph-h są nadpisane większe;
    // BEZ scale — treść na ekranie zostaje ostra i w docelowych pikselach pod przyszłą animację)
    const phHW = dvar("--ph-w") / 2;
    const phHH = dvar("--ph-h") / 2;
    // desktop/tablet: laptop centralnie, telefon po prawej (klatka B z pliku)
    // mobile: laptop u góry, telefon niżej — środek dobrany tak, by górna krawędź
    // została na PH_TOP_MOBILE (rośnie w dół → odstęp na tekst zachowany)
    const lap = stacked ? { x: 0, y: -250 } : { x: 0, y: 0 };
    const ph = stacked
      ? { x: 0, y: PH_TOP_MOBILE + phHH, z: 60 }
      : { x: 470, y: 130, z: 40 };
    const cam = stacked ? { cx: 4, cy: 0 } : { cx: 0, cy: 0 };
    const left = Math.min(lap.x - LAP_HW, ph.x - phHW);
    const right = Math.max(lap.x + LAP_HW, ph.x + phHW);
    const top = Math.min(lap.y + LAP_TOP, ph.y - phHH);
    const bottom = Math.max(lap.y + LAP_BOT, ph.y + phHH);
    return {
      stacked,
      lap,
      ph,
      cam,
      gw: right - left, // szerokość grupy (do skalowania w fit)
      gh: bottom - top, // wysokość grupy
    };
  };

  const applyFrame = () => {
    if (!camera || !laptop || !phone || !base) return;
    const { lap, ph } = geometry();
    laptop.style.transform =
      `translate(-50%, -50%) translate3d(` +
      `calc(${lap.x}px + var(--sl-lap, 0px)), ` +
      `calc(${lap.y}px + var(--apart-lap, 0px)), ` +
      `var(--sz-lap, 0px)) rotateY(var(--lap-yaw, 0deg)) rotateX(var(--lap-pitch, 0deg))` +
      ` translateY(calc((1 - var(--vid-scale, 1)) * (var(--lap-h) / 2))) scale(var(--vid-scale, 1))`;
    phone.style.transform =
      `translate(-50%, -50%) translate3d(` +
      `calc(${ph.x}px + var(--sl-ph, 0px) + var(--ph-dx, 0px)), ` +
      `calc(${ph.y}px + var(--apart-ph, 0px) + var(--ph-dy, 0px)), ` +
      `calc(${ph.z}px + var(--sz-ph, 0px) + var(--ph-dz, 0px)))` +
      ` translateY(calc((1 - var(--vid-scale, 1)) * (var(--ph-h) / 2))) scale(var(--vid-scale, 1))`;
  };

  const fit = () => {
    if (!fitEl) return;
    const { gw, gh, stacked } = geometry();
    const mx = stacked ? 20 : 56;
    const my = stacked ? 40 : 64;
    const vw = devicesEl.clientWidth;
    const vh = devicesEl.clientHeight;
    const s =
      Math.min((vw - mx * 2) / gw, (vh - my * 2) / gh, 1.15) * GROUP_SCALE;
    fitEl.style.setProperty("--fit", Math.max(0.2, s).toString());
  };

  // Wyśrodkowanie grupy POMIAREM realnego bbox brył (uwzględnia perspektywę,
  // pasek bazy, perspective-origin itd. — analityka tu nie wystarcza).
  const centerGroup = () => {
    if (!camera || !laptop || !phone || !fitEl) return;
    // 1) wyzeruj offsety (centrujący + wjazd + morph) i ustaw bazowy kąt kamery,
    //    aby zmierzyć naturalny środek grupy w klatce B (spoczynek)
    camera.style.setProperty("--gx", "0px");
    camera.style.setProperty("--gy", "0px");
    camera.style.setProperty("--cx", (isStacked() ? 4 : 0) + "deg");
    camera.style.setProperty("--cy", "0deg");
    laptop.style.setProperty("--sl-lap", "0px");
    phone.style.setProperty("--sl-ph", "0px");
    laptop.style.setProperty("--sz-lap", "0px");
    phone.style.setProperty("--sz-ph", "0px");
    laptop.style.setProperty("--apart-lap", "0px");
    phone.style.setProperty("--apart-ph", "0px");
    laptop.style.setProperty("--lap-yaw", "0deg");
    phone.style.setProperty("--ph-dx", "0px");
    phone.style.setProperty("--ph-dy", "0px");
    phone.style.setProperty("--ph-dz", "0px");
    const lr = laptop.getBoundingClientRect();
    const pr = phone.getBoundingClientRect();
    const fr = fitEl.getBoundingClientRect(); // środek = origin kamery
    const groupCx =
      (Math.min(lr.left, pr.left) + Math.max(lr.right, pr.right)) / 2;
    const groupCy =
      (Math.min(lr.top, pr.top) + Math.max(lr.bottom, pr.bottom)) / 2;
    const camCx = fr.left + fr.width / 2;
    const camCy = fr.top + fr.height / 2;
    // 2) delta px = designDelta × (skala .fit × skala wrappera) → cofamy obie skale
    const S = parseFloat(fitEl.style.getPropertyValue("--fit")) || 1;
    const W = (gsap.getProperty(devicesEl, "scaleX") as number) || 1;
    const k = S * W || 1;
    camera.style.setProperty(
      "--gx",
      (-(groupCx - camCx) / k).toFixed(2) + "px",
    );
    camera.style.setProperty(
      "--gy",
      (-(groupCy - camCy) / k).toFixed(2) + "px",
    );
  };

  // Zmierz bbox grupy w klatce C (przy neutralnym wrapperze .hero__devices),
  // żeby policzyć adaptacyjne dopasowanie do prawej strefy. Stan po pomiarze
  // wraca do spoczynku (klatka B).
  const measureCBbox = () => {
    const sx = (gsap.getProperty(devicesEl, "x") as number) || 0;
    const ssc = (gsap.getProperty(devicesEl, "scaleX") as number) || 1;
    gsap.set(devicesEl, { x: 0, scale: 1 });
    camera!.style.setProperty("--cx", FRAME_C.camCx + "deg");
    camera!.style.setProperty("--cy", FRAME_C.camCy + "deg");
    laptop!.style.setProperty("--lap-yaw", FRAME_C.lapYaw + "deg");
    laptop!.style.setProperty("--lap-pitch", FRAME_C.lapPitch + "deg");
    phone!.style.setProperty("--ph-dx", FRAME_C.phDx + "px");
    phone!.style.setProperty("--ph-dy", FRAME_C.phDy + "px");
    phone!.style.setProperty("--ph-dz", FRAME_C.phDz + "px");
    const lr = laptop!.getBoundingClientRect();
    const pr = phone!.getBoundingClientRect();
    const left = Math.min(lr.left, pr.left);
    const right = Math.max(lr.right, pr.right);
    const top = Math.min(lr.top, pr.top);
    const bottom = Math.max(lr.bottom, pr.bottom);
    // przywróć spoczynek (klatka B) + wrapper
    camera!.style.setProperty("--cx", (isStacked() ? 4 : 0) + "deg");
    camera!.style.setProperty("--cy", "0deg");
    laptop!.style.setProperty("--lap-yaw", "0deg");
    laptop!.style.setProperty("--lap-pitch", "0deg");
    phone!.style.setProperty("--ph-dx", "0px");
    phone!.style.setProperty("--ph-dy", "0px");
    phone!.style.setProperty("--ph-dz", "0px");
    gsap.set(devicesEl, { x: sx, scale: ssc });
    return { cx: (left + right) / 2, w: right - left, h: bottom - top };
  };

  // Klatka C (desktop): dopasuj grupę do PRAWEJ strefy (viewport minus kolumna
  // tekstu z lewej + min. odstęp). Marginesy asymetryczne: tekst↔lewa krawędź >
  // urządzenia↔prawa krawędź. Grupa może się powiększać LUB zmniejszać.
  const computeFrameC = () => {
    if (!camera || !laptop || !phone) return;
    if (
      isStacked() ||
      !window.matchMedia("(prefers-reduced-motion: no-preference)").matches
    ) {
      frameC = { x: 0, scale: 1 };
      return;
    }
    const vw = devicesEl.clientWidth;
    const vh = devicesEl.clientHeight;
    const copyEl = document.querySelector<HTMLElement>(".hero__copy");
    const gap = Math.max(vw * 0.04, 40); // min. odstęp tekst↔urządzenia
    const rightMargin = Math.max(vw * 0.022, 18); // mały margines z prawej
    const vMargin = Math.max(vh * 0.06, 24);
    // prawa krawędź kolumny tekstu (offset* ignoruje transform GSAP-a)
    const textRight = copyEl
      ? copyEl.offsetLeft + copyEl.offsetWidth
      : vw * 0.4;
    const zoneL = textRight + gap;
    const zoneR = vw - rightMargin;
    const zoneW = Math.max(80, zoneR - zoneL);
    const zoneH = Math.max(80, vh - vMargin * 2);
    const cb = measureCBbox();
    const scale = Math.max(0.4, Math.min(zoneW / cb.w, zoneH / cb.h, 1.8));
    const targetCx = zoneL + zoneW / 2;
    // środek grupy po skali K wokół środka stage'u: vw/2 + K·(cb.cx − vw/2) + x
    const x = targetCx - vw / 2 - scale * (cb.cx - vw / 2);
    frameC = { x, scale };
  };

  const relayout = () => {
    applyFrame();
    fit();
    centerGroup();
    computeFrameC();
  };

  relayout();
  window.addEventListener("resize", relayout);

  return {
    getFrameC: () => frameC,
    relayout,
    destroy: () => window.removeEventListener("resize", relayout),
  };
}
