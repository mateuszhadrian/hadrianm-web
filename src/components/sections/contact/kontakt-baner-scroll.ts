// Banner „Kontakt" na stronie głównej — desktopowe „odzoomowanie" CTA:
// scale KTB_ZOOM_FROM → 1 scrubem podczas wjazdu sekcji od dołu viewportu
// aż do dna strony (banner jest ostatnią sekcją, więc koniec = koniec
// scrolla). Ładowany DYNAMICZNIE z bramki motion w KontaktBaner.astro;
// gałąź mobile bez zooma (motionMedia), przy reduce moduł w ogóle nie
// startuje — banner stoi statycznie w skali 1.
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motionMedia } from "@/scripts/section-helpers";
import { CONTACT_DESKTOP_MIN_PX, KTB_ZOOM_FROM } from "./contact-config";

gsap.registerPlugin(ScrollTrigger);

export function initKontaktBaner(): void {
  const section = document.querySelector<HTMLElement>("#contact");
  const cta = section?.querySelector<HTMLElement>(".kt-cta");
  if (!section || !cta) return;

  motionMedia(CONTACT_DESKTOP_MIN_PX, (isDesktop) => {
    if (!isDesktop) return;
    // fromTo (nie to): start tweenu MUSI pokrywać się ze stanem startowym
    // CSS (.ktb.js .kt-cta) — gsap.matchMedia sam rewertuje inline transform
    // przy zmianie gałęzi media.
    gsap.fromTo(
      cta,
      { scale: KTB_ZOOM_FROM },
      {
        scale: 1,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top bottom",
          end: "bottom bottom",
          scrub: true,
        },
      },
    );
  });

  // Pozycje triggerów po zbudowaniu sekcji (wzorzec pozostałych sekcji).
  ScrollTrigger.refresh();
}
