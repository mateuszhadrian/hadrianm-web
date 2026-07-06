// Fazy desktopowe scrubowanego timeline'u hero (krok 4 refactoru — kod 1:1
// z inline <script> Hero.astro; jedyna zmiana: `scene` jako jawny parametr
// phase2Desktop zamiast domknięcia). Stałe osi scrolla: hero-config.ts.

import { FRAME_C, type DeviceSceneApi } from "./device-scene";
import type { LaptopSiteApi } from "./laptop-site";
import type { PhoneSiteApi } from "./phone-site";
import type { Base, DeviceRefs } from "./timeline-base";
import {
  PH3_START,
  DREWELOMET_DUR,
  PHONE_START,
  PHONE_END,
} from "./hero-config";

export const phase1Desktop = (b: Base) => {
  const { tl, live, devices, startX, startY, endX, endY } = b;
  // Blur działa przed transformem: przy scale 5.2 → 8px ≈ ~40px na ekranie.
  // Wyższe wartości = droższa re-rasteryzacja w każdej klatce scrubu.
  tl.fromTo(
    live,
    { x: startX, y: startY, scale: 1, filter: "blur(0px)", autoAlpha: 1 },
    {
      x: endX,
      y: endY,
      scale: 5.2,
      filter: "blur(8px)",
      duration: 0.5,
      ease: "power1.in",
    },
    0.15,
  );
  tl.to(live, { autoAlpha: 0, duration: 0.13 }, 0.56);

  // opacity, NIE autoAlpha — visibility:hidden odkłada paint całej sceny do
  // klatki ujawnienia (jank). Bez filter: blur — pełnoekranowy pass GPU
  // po ciężkim poddrzewie w każdej klatce scrubu.
  tl.fromTo(
    devices,
    { opacity: 0, scale: 1.22 },
    {
      opacity: 1,
      scale: 1,
      duration: 0.38,
      ease: "power2.out",
    },
    0.5,
  );
};

export const phase2Desktop = (
  b: Base,
  refs: DeviceRefs,
  scene: DeviceSceneApi | null,
) => {
  const { tl, copy, devices } = b;
  const { laptop, phone, camera, base } = refs;
  const PH2 = 0.95; // start fazy 2 na osi timeline (po wejściu urządzeń)

  if (phone) {
    tl.to(
      phone,
      {
        "--ph-dx": FRAME_C.phDx + "px",
        "--ph-dy": FRAME_C.phDy + "px",
        "--ph-dz": FRAME_C.phDz + "px",
        duration: 0.5,
        ease: "power2.inOut",
      },
      PH2,
    );
  }
  if (base) {
    tl.to(
      base,
      { autoAlpha: 0, duration: 0.4, ease: "power2.inOut" },
      PH2 + 0.03,
    );
  }
  // (c) ruch kamery B→C + skręt (yaw) i odchylenie do tyłu (pitch) laptopa
  if (camera) {
    tl.to(
      camera,
      {
        "--cx": FRAME_C.camCx + "deg",
        "--cy": FRAME_C.camCy + "deg",
        duration: 0.5,
        ease: "power2.inOut",
      },
      PH2 + 0.45,
    );
  }
  if (laptop) {
    tl.to(
      laptop,
      {
        "--lap-yaw": FRAME_C.lapYaw + "deg",
        "--lap-pitch": FRAME_C.lapPitch + "deg",
        duration: 0.5,
        ease: "power2.inOut",
      },
      PH2 + 0.45,
    );
  }
  tl.to(
    devices,
    {
      x: () => scene?.getFrameC().x ?? 0,
      scale: () => scene?.getFrameC().scale ?? 1,
      transformOrigin: "50% 50%",
      duration: 1.0,
      ease: "power2.inOut",
    },
    PH2,
  );
  if (copy) {
    tl.fromTo(
      copy,
      { autoAlpha: 0, x: -48 },
      { autoAlpha: 1, x: 0, duration: 0.6, ease: "power2.out" },
      PH2 + 0.35,
    );
  }
};

export const phase3Desktop = (b: Base, site: LaptopSiteApi) => {
  const { tl } = b;
  const p = { v: 0 };
  tl.to(
    p,
    {
      v: 1,
      ease: "none",
      duration: DREWELOMET_DUR,
      onUpdate: () => site.master.progress(p.v),
      onStart: () => site.setActive(true),
      onComplete: () => site.setActive(false),
      onReverseComplete: () => site.setActive(false),
    },
    PH3_START,
  );
};

export const phase3PhoneDesktop = (b: Base, phone: PhoneSiteApi) => {
  const { tl } = b;
  const p = { v: 0 };
  tl.to(
    p,
    {
      v: 1,
      ease: "none",
      duration: PHONE_END - PHONE_START,
      onUpdate: () => phone.master.progress(p.v),
      onStart: () => phone.setActive(true),
      onComplete: () => phone.setActive(false),
      onReverseComplete: () => phone.setActive(false),
    },
    PHONE_START,
  );
};
