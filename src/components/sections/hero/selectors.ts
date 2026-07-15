// KONTRAKT SELEKTORÓW sceny hero (krok 5 refactoru —
// docs/analiza-refactor-hero-odkruszenie.md, problem S6).
//
// Każdy selektor używany MIĘDZY plikami (markup w Hero.astro/DeviceScene.astro
// ↔ logika w modułach TS) żyje tutaj. Zmieniasz klasę/atrybut w markupie →
// zmieniasz JEDNĄ stałą. Selektory wewnętrzne komponentów (dw-*/dwm-*,
// .extrude, .screen__video) celowo NIE wchodzą do kontraktu.
//
// Brak węzła kontraktu NIE wysypuje produkcji (graceful degrade jak dotąd),
// ale w dev loguje ostrzeżenie — literówka w markupie przestaje być cicha.

export const SEL = {
  hero: "#hero",
  stage: ".hero__stage",
  head: ".hero__head",
  accentGhost: ".hero__accent--ghost",
  accentLive: ".hero__accent--live",
  devices: ".hero__devices",
  copy: ".hero__copy",
  scroll: ".hero__scroll",

  copyRow: ".hero__copy-row",
  copyText: ".hero__copy-text",
  copyRow2: ".hero__copy-row--2",
  copyRow3: ".hero__copy-row--3",
  copyRow1Text: ".hero__copy-row--1 .hero__copy-text",
  copyRow2Text: ".hero__copy-row--2 .hero__copy-text",
  copyRow3Text: ".hero__copy-row--3 .hero__copy-text",

  progress: ".hero__progress",

  // scena urządzeń (markup: DeviceScene.astro)
  deviceScene: ".device-scene",
  fit: ".hero__devices .fit",
  fitInScene: ".fit",
  camera: ".hero__devices .camera",
  gsapCamera: "[data-gsap='camera']",
  gsapLaptop: "[data-gsap='laptop']",
  gsapPhone: "[data-gsap='phone']",
  gsapLaptopBase: "[data-gsap='laptop-base']",
  videoLaptop: "[data-gsap='video-laptop']",
  videoPhone: "[data-gsap='video-phone']",

  // żywe podglądy stron na ekranach (desktop; mobile usuwa je z DOM)
  laptopSiteRoot: ".hero__devices .screen--laptop .dw-root",
  phoneSiteRoot: ".hero__devices .screen--phone .dwm-root",
} as const;

const warned = new Set<string>();

/** Dev-only: głośny sygnał zerwanego kontraktu (raz na nazwę na sesję).
 *  W buildzie produkcyjnym Vite usuwa tę gałąź (import.meta.env.DEV). */
export const devWarnMissing = (name: keyof typeof SEL): void => {
  if (import.meta.env.DEV && !warned.has(name)) {
    warned.add(name);
    console.warn(
      `[hero] Brak węzła kontraktu „${name}" (${SEL[name]}) — ten fragment ` +
        `animacji zdegraduje się po cichu. Kontrakt: selectors.ts; markup: ` +
        `Hero.astro / DeviceScene.astro.`,
    );
  }
};
