// Sekcja „Kontakt" — choreografia wejść (port kontakt.js z referencji;
// wzorzec FAQ/Oferta: zero pinów, zero scrubu na treści). Cztery
// ScrollTriggery `once: true` dodają klasy `.on` (toggleClass), całą
// animację robi CSS transition — stagger pól to transition-delay z --d.
// Desktop dodatkowo: leniwy parallax ghosta „KONTAKT" (sam transform).
//
// Moduł ładowany DYNAMICZNIE tylko przy prefers-reduced-motion:
// no-preference (bramka w Contact.astro); przy reduce pełną widoczność
// treści realizuje czysty CSS, a formularz i reveal działają dalej
// (contact-ui.ts ładowany zawsze).
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  CONTACT_DESKTOP_MIN_PX,
  CONTACT_FOOTER_START,
  CONTACT_FRAME_START,
  CONTACT_GHOST_PARALLAX,
  CONTACT_LEAD_START,
  CONTACT_SIDE_START,
} from "./contact-config";

gsap.registerPlugin(ScrollTrigger);

export function initContactScroll(): void {
  const section = document.querySelector<HTMLElement>("#contact");
  if (!section) return;

  const q = (s: string) => section.querySelector<HTMLElement>(s);
  const lead = q(".kt-lead");
  const ghost = q(".kt-ghost");
  const side = q(".kt-side");
  const frame = q(".kt-frame");
  const footer = q(".kt-footer");

  /* ── wejścia: 4 × once → klasa .on (animuje CSS transition) ── */
  if (lead && ghost) {
    ScrollTrigger.create({
      trigger: lead,
      start: CONTACT_LEAD_START,
      once: true,
      toggleClass: { targets: [lead, ghost], className: "on" },
    });
  }
  if (side) {
    ScrollTrigger.create({
      trigger: side,
      start: CONTACT_SIDE_START,
      once: true,
      toggleClass: { targets: side, className: "on" },
    });
  }
  if (frame) {
    ScrollTrigger.create({
      trigger: frame,
      start: CONTACT_FRAME_START,
      once: true,
      toggleClass: { targets: frame, className: "on" },
    });
  }
  if (footer) {
    ScrollTrigger.create({
      trigger: footer,
      start: CONTACT_FOOTER_START,
      once: true,
      toggleClass: { targets: footer, className: "on" },
    });
  }

  /* ── desktop: leniwy parallax ghosta (sam transform, scrub) ── */
  const mm = gsap.matchMedia();
  mm.add(
    {
      isDesktop: `(min-width: ${CONTACT_DESKTOP_MIN_PX}px)`,
      motionOK: "(prefers-reduced-motion: no-preference)",
    },
    (ctx) => {
      const { isDesktop, motionOK } = ctx.conditions as {
        isDesktop: boolean;
        motionOK: boolean;
      };
      if (!motionOK || !isDesktop || !ghost) return;
      gsap.fromTo(
        ghost,
        { y: CONTACT_GHOST_PARALLAX[0] },
        {
          y: CONTACT_GHOST_PARALLAX[1],
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        },
      );
    },
  );

  // Pozycje triggerów po zbudowaniu sekcji (wzorzec pozostałych sekcji).
  ScrollTrigger.refresh();
}
