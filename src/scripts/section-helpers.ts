// Małe, ortogonalne helpery scrolla sekcji (about/audience/services/faq/
// contact) — wspólne kształty o ≥3 wystąpieniach; hero świadomie poza
// tymi abstrakcjami (decyzje: docs/first-bigger-improvement-refactor-analysis.md
// §3). Konsumenci (moduły *-scroll.ts) są ładowani DYNAMICZNIE tylko przy
// prefers-reduced-motion: no-preference (bramka w <script> sekcji — wzorzec
// jak Lenis w BaseLayout); przy reduce i bez JS statyczny, w pełni widoczny
// układ realizuje czysty CSS.
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/** Selektory zawężone do sekcji — wspólny kształt `q`/`qa`. */
export function scopedQueries(root: HTMLElement): {
  q: (s: string) => HTMLElement | null;
  qa: (s: string) => HTMLElement[];
} {
  return {
    q: (s: string) => root.querySelector<HTMLElement>(s),
    qa: (s: string) => Array.from(root.querySelectorAll<HTMLElement>(s)),
  };
}

/** Jednorazowe wejście: po osiągnięciu progu klasa `.on` na targets
 *  (domyślnie na triggerze); całą animację robi CSS transition. */
export function revealOnce(
  trigger: HTMLElement,
  start: string,
  targets: HTMLElement | HTMLElement[] = trigger,
): void {
  ScrollTrigger.create({
    trigger,
    start,
    once: true,
    toggleClass: { targets, className: "on" },
  });
}

/** Bramka matchMedia desktop/mobile × motion. Warunek motionOK to pas
 *  bezpieczeństwa na zmianę preferencji w trakcie sesji (moduł jest już
 *  załadowany; gsap sam rewertuje tweeny, a zwrócony z onMatch cleanup
 *  sprząta stan poza kontrolą gsap — klasy, liczniki). */
export function motionMedia(
  desktopMinPx: number,
  onMatch: (isDesktop: boolean) => (() => void) | void,
): void {
  const mm = gsap.matchMedia();
  mm.add(
    {
      isDesktop: `(min-width: ${desktopMinPx}px)`,
      motionOK: "(prefers-reduced-motion: no-preference)",
    },
    (ctx) => {
      const { isDesktop, motionOK } = ctx.conditions as {
        isDesktop: boolean;
        motionOK: boolean;
      };
      if (!motionOK) return;
      return onMatch(isDesktop);
    },
  );
}

/** Leniwy parallax ghost-typografii: sam transform (y od→do) pod scrubem
 *  do wyjazdu triggera górą. Start domyślnie od wjazdu triggera dołem
 *  ("top bottom" — sekcje w głębi strony); trigger zaczynający u szczytu
 *  strony (hero podstrony /faq/) podaje "top top", inaczej jazda ruszałaby
 *  od połowy. */
export function ghostParallax(
  ghost: HTMLElement,
  trigger: HTMLElement,
  [from, to]: readonly [number, number],
  start = "top bottom",
): void {
  gsap.fromTo(
    ghost,
    { y: from },
    {
      y: to,
      ease: "none",
      scrollTrigger: {
        trigger,
        start,
        end: "bottom top",
        scrub: true,
      },
    },
  );
}

/** Fixed progres sekcji „01 / 0N": ticki + licznik pcount.
 *  cumulative: ticki do bieżącego włącznie (Oferta); domyślnie tylko
 *  bieżący (About/Audience). onChange — dodatkowe efekty sekcji przy
 *  zmianie stanu (CTA finału, podpis stosu); reset go NIE woła (cleanup
 *  sekcji sprząta swoje efekty sam). */
export function makeProgress(
  ticks: HTMLElement[],
  pcount: HTMLElement,
  total: number,
  opts: { cumulative?: boolean; onChange?: (i: number) => void } = {},
): { set: (i: number) => void; reset: () => void } {
  let idx = -1;
  const label = (i: number) =>
    `${String(i + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
  return {
    set(i: number): void {
      if (i === idx) return;
      idx = i;
      ticks.forEach((t, k) =>
        t.classList.toggle("on", opts.cumulative ? k <= i : k === i),
      );
      pcount.textContent = label(i);
      opts.onChange?.(i);
    },
    reset(): void {
      ticks.forEach((t, k) => t.classList.toggle("on", k === 0));
      pcount.textContent = label(0);
      idx = -1;
    },
  };
}
