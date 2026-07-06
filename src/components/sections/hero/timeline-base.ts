// Baza scrubowanego timeline'u hero + wspólne refy sceny (krok 4 refactoru —
// docs/analiza-refactor-hero-odkruszenie.md, problem S5). Kod przeniesiony
// 1:1 z inline <script> Hero.astro; Hero pozostaje orkiestratorem.

import { gsap } from "gsap";
import { removeVars } from "./scene-vars";

export const q = <T extends HTMLElement = HTMLElement>(s: string) =>
  document.querySelector<T>(s);

export const buildBase = (screens: number) => {
  const hero = q("#hero");
  const stage = q(".hero__stage");
  const head = q(".hero__head");
  const ghost = q(".hero__accent--ghost");
  const live = q(".hero__accent--live");
  const devices = q(".hero__devices");
  const copy = q(".hero__copy");
  const scroll = q(".hero__scroll");
  if (!hero || !stage || !head || !ghost || !live || !devices) return null;

  const rect = () => {
    const g = ghost.getBoundingClientRect();
    const h = head.getBoundingClientRect();
    return {
      left: g.left - h.left,
      top: g.top - h.top,
      width: g.width,
      height: g.height,
    };
  };
  const startX = () => rect().left;
  const startY = () => rect().top;
  const endX = () => stage.clientWidth / 2 - rect().width / 2;
  const endY = () => stage.clientHeight / 2 - rect().height / 2;

  // ghost znika wizualnie, ale zostaje w drzewie dostępności (opacity, nie visibility)
  gsap.set(ghost, { opacity: 0 });

  const tl = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      trigger: hero,
      start: "top top",
      end: () => "+=" + window.innerHeight * screens,
      scrub: true,
      invalidateOnRefresh: true,
      onUpdate: (self) =>
        live.classList.toggle("is-wave-paused", self.progress > 0.3),
    },
  });

  tl.to(head, { yPercent: -110, duration: 0.6 }, 0);
  if (scroll) tl.to(scroll, { autoAlpha: 0, duration: 0.12 }, 0);

  // Fonty z zimnego cache doładowują się PO zbudowaniu timeline'u i
  // przesuwają layout headline'u, a pozycja startowa „za Ciebie" (from-values
  // scruba) była policzona na starym układzie → słowo lądowało PONIŻEJ
  // „mówi" (iPhone, świeże dane przeglądania). Po fontach dociągamy słowo
  // do aktualnego ghosta SAMYM gsap.set — celowo BEZ wymuszania globalnego
  // ScrollTrigger.refresh(): jest zbędny (stan statyczny naprawia set,
  // a from-values tweenów przeliczy invalidateOnRefresh przy naturalnym
  // refreshu — window.load/resize) i niepotrzebnie dotykałby wszystkich
  // triggerów, w tym proxy-tweenów fazy 3.
  let disposed = false;
  document.fonts?.ready.then(() => {
    if (disposed) return;
    gsap.set(live, { x: startX(), y: startY() });
  });

  return {
    tl,
    ghost,
    live,
    devices,
    copy,
    scroll,
    startX,
    startY,
    endX,
    endY,
    dispose: () => {
      disposed = true;
    },
  };
};

export type Base = NonNullable<ReturnType<typeof buildBase>>;

// Refy urządzeń sceny — wspólne dla obu wariantów (selektory = kontrakt z DeviceScene).
export type DeviceRefs = {
  laptop: HTMLElement | null;
  phone: HTMLElement | null;
  camera: HTMLElement | null;
  base: HTMLElement | null;
};
export const deviceRefs = (): DeviceRefs => ({
  laptop: q("[data-gsap='laptop']"),
  phone: q("[data-gsap='phone']"),
  camera: q(".hero__devices .camera"),
  base: q("[data-gsap='laptop-base']"),
});

export const cleanup = (b: Base) => () => {
  b.dispose();
  b.tl.scrollTrigger?.kill();
  b.tl.kill();
  gsap.set([b.ghost, b.live, b.devices, b.copy, b.scroll].filter(Boolean), {
    clearProps: "all",
  });
  const { laptop: lp, phone: ph, camera: cam, base: bs } = deviceRefs();
  removeVars(lp, ["--lap-yaw", "--lap-pitch", "--apart-lap"]);
  removeVars(ph, ["--ph-dx", "--ph-dy", "--ph-dz", "--apart-ph"]);
  removeVars(cam, ["--cx", "--cy"]);
  if (bs) gsap.set(bs, { clearProps: "opacity" });
};
