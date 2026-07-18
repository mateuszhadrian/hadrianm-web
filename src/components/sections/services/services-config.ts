// Oś scrolla sekcji „Oferta" — stałe współdzielone przez moduł animacji,
// style i sweep wizualny; decyzje portu: docs/analiza-sekcja-oferta.md.

/** Próg desktop/mobile w px — MUSI być równy @media (min-width) w Services.astro. */
export const SERVICES_DESKTOP_MIN_PX = 861;

/** Trigger ScrollTriggera (start/end względem viewportu) + scrub. */
interface ScrubRange {
  start: string;
  end: string;
  scrub: number;
}

/** Intro „czytanie scrollem": osobny tween + trigger PER AKAPIT `.of-lit`
 * (docs/visual-corrections-part1.md §5 — akapity 2 i 3 startują wcześniej).
 * Strojenie startów: `paraStarts[i]` = "top X%" — rozjaśnianie akapitu
 * rusza, gdy jego GÓRA wjedzie na X% wysokości viewportu (większy % =
 * wcześniej w scrollu). TEMPO jest od startów NIEZALEŻNE: end liczy kod
 * z osi referencyjnej `refStartVh`/`refEndVh` (geometria dawnego wspólnego
 * triggera na całym `.of-intro`) przy stałej gęstości staggera — dystans
 * scrolla akapitu jest proporcjonalny do długości jego tweenu. */
interface ServicesReadConfig {
  scrub: number;
  /** czas rozjaśniania pojedynczego spanu (sekundy osi tweenu) */
  duration: number;
  /** łączny rozrzut staggera WSZYSTKICH spanów intro (sekundy osi tweenu) */
  span: number;
  /** oś referencyjna tempa: dawny start "top X" → `refStartVh` */
  refStartVh: number;
  /** oś referencyjna tempa: dawny end "bottom Y" → `refEndVh` */
  refEndVh: number;
  /** starty per akapit: [0] = lead1, [1] = lead2, [2] = close */
  paraStarts: readonly [string, string, string];
}

/** Desktop = słowa (~80 spanów). */
export const SERVICES_READ: ServicesReadConfig = {
  scrub: 0.45,
  duration: 1.6,
  span: 8, // łączny rozrzut staggera (s osi tweena) dzielony przez liczbę spanów
  refStartVh: 0.58, // dawny wspólny trigger: start "top 58%"…
  refEndVh: 0.44, // …end "bottom 44%"
  // lead1 "top 80%" ≈ timing sprzed podziału (dawny start "top 58%" na intro
  // + 235px padding-top ⇒ góra akapitu ~80% vh); lead2/close wyraźnie
  // wcześniej — czytelne, zanim znajdą się przy górze ekranu.
  paraStarts: ["top 80%", "top 72%", "top 72%"],
};

/** Mobile = zdania (kilka spanów zamiast ~80). */
export const SERVICES_READ_MOBILE: ServicesReadConfig = {
  scrub: 0.4,
  duration: 1.4,
  span: 6,
  refStartVh: 0.7, // dawny wspólny trigger: start "top 70%"…
  refEndVh: 0.52, // …end "bottom 52%"
  // lead1 "top 90%" ≈ timing sprzed podziału (dawny start "top 70%" na intro
  // + 150px padding-top ⇒ góra akapitu ~90% vh); lead2/close wcześniej.
  paraStarts: ["top 90%", "top 84%", "top 84%"],
};

/** Nić procesu: scaleY na .of-fill pod scrubem. */
export const SERVICES_THREAD: ScrubRange = {
  start: "top 52%",
  end: "bottom 82%",
  scrub: 0.5,
};
export const SERVICES_THREAD_MOBILE: ScrubRange = {
  start: "top 60%",
  end: "bottom 88%",
  scrub: 0.4,
};

/** Progi kroków procesu: reveal treści (`on`) / zapłon węzła (`lit`). */
export const SERVICES_STEP_ON = "top 76%";
export const SERVICES_STEP_LIT = "top 56%";
export const SERVICES_STEP_ON_MOBILE = "top 84%";
export const SERVICES_STEP_LIT_MOBILE = "top 66%";

/** Jazda parallaxu cyfr-ghost przy krokach (± px, tylko desktop). */
export const SERVICES_GHOST_PARALLAX = 70;

/** Liczba kroków procesu (kontrakt markup ↔ moduł ↔ progres 01–05). */
export const SERVICES_STEP_COUNT = 5;
