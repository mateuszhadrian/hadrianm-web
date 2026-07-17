// Sekcja „Kontakt" — choreografia wejść (port kontakt.js z referencji;
// wzorzec FAQ/Oferta: zero pinów, zero scrubu na treści). Trzy
// ScrollTriggery `once: true` dodają klasy `.on` (toggleClass), całą
// animację robi CSS transition — stagger pól to transition-delay z --d.
// Desktop dodatkowo: leniwy parallax ghosta „KONTAKT" (sam transform).
//
// Ładowany DYNAMICZNIE z bramki motion w Contact.astro (formularz i reveal
// działają też przy reduce — contact-ui.ts ładowany zawsze); pas
// bezpieczeństwa motionOK w runtime: motionMedia() w @/scripts/section-helpers.
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ghostParallax,
  motionMedia,
  revealOnce,
  scopedQueries,
} from "@/scripts/section-helpers";
import {
  CONTACT_DESKTOP_MIN_PX,
  CONTACT_FRAME_START,
  CONTACT_GHOST_PARALLAX,
  CONTACT_LEAD_START,
  CONTACT_SIDE_START,
} from "./contact-config";

gsap.registerPlugin(ScrollTrigger);

export function initContactScroll(): void {
  const section = document.querySelector<HTMLElement>("#contact");
  if (!section) return;

  const { q } = scopedQueries(section);
  const lead = q(".kt-lead");
  const ghost = q(".kt-ghost");
  const side = q(".kt-side");
  const frame = q(".kt-frame");

  /* ── wejścia: 3 × once → klasa .on (animuje CSS transition) ── */
  if (lead && ghost) revealOnce(lead, CONTACT_LEAD_START, [lead, ghost]);
  if (side) revealOnce(side, CONTACT_SIDE_START);
  if (frame) revealOnce(frame, CONTACT_FRAME_START);

  /* ── desktop: leniwy parallax ghosta (sam transform, scrub) ── */
  motionMedia(CONTACT_DESKTOP_MIN_PX, (isDesktop) => {
    if (!isDesktop || !ghost) return;
    ghostParallax(ghost, section, CONTACT_GHOST_PARALLAX);
  });

  // Pozycje triggerów po zbudowaniu sekcji (wzorzec pozostałych sekcji).
  ScrollTrigger.refresh();
}
