// Sekcja „O mnie" — animacje scrolla (port o-mnie.js z referencji
// docs/design/o mnie/o-mnie-referencja/; decyzje: docs/analiza-sekcja-o-mnie.md).
//
// Desktop (≥ABOUT_DESKTOP_MIN_PX): sekcja ma wysokość --omlen, scena sticky;
// jedna oś czasu scrubowana przez 4 rozdziały + snap do punktów spoczynku.
// Mobile: zwykły flow; lekkie dwukierunkowe reveale (transform/opacity),
// blur wyłącznie w jednorazowym wyłonieniu portretu (bez scrubu).
//
// Ładowany DYNAMICZNIE z bramki motion w About.astro; pas bezpieczeństwa
// motionOK w runtime: motionMedia() w @/scripts/section-helpers.
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  makeProgress,
  motionMedia,
  scopedQueries,
} from "@/scripts/section-helpers";
import {
  ABOUT_CH_IN,
  ABOUT_CH_OUT,
  ABOUT_DESKTOP_MIN_PX,
  ABOUT_SCRUB,
  ABOUT_SNAP_POINTS,
  ABOUT_STAGE_THRESHOLDS,
} from "./about-config";

gsap.registerPlugin(ScrollTrigger);

export function initAboutScroll(): void {
  const section = document.querySelector<HTMLElement>("#about");
  if (!section) return;

  const { q, qa } = scopedQueries(section);

  const els = {
    stage: q(".om-stage"),
    ghost: q(".om-ghost"),
    tag: q(".om-tag"),
    photoW: q(".om-photo-wrap"),
    photo: q(".om-photo"),
    photoVeil: q(".om-photo-veil"),
    photoMeta: q(".om-photo-meta"),
    chapters: qa(".om-ch"),
    final: q(".om-final"),
    finalBg: q(".om-final-bg"),
    ticks: qa(".om-progress .ticks i"),
    pcount: q(".om-progress .pcount"),
  };
  if (
    !els.stage ||
    !els.ghost ||
    !els.tag ||
    !els.photoW ||
    !els.photo ||
    !els.photoVeil ||
    !els.photoMeta ||
    !els.final ||
    !els.pcount ||
    els.chapters.length !== 3
  ) {
    return;
  }
  const { stage, ghost, tag, photoW, photo, photoVeil, photoMeta, final } = els;
  const pcount = els.pcount;

  /* ── progres 01–04 (desktop) ── */
  const progress = makeProgress(els.ticks, pcount, 4, {
    // CTA klikalne dopiero w finale
    onChange: (i) => final.classList.toggle("on", i === 3),
  });

  /* ═══ DESKTOP: przypięta scena + scrub ═══ */
  function buildDesktop(): void {
    gsap.set(els.chapters, { yPercent: -50 }); /* pion: środek sceny */
    gsap.set(els.chapters[0], { autoAlpha: 1, y: 0 });
    gsap.set([els.chapters[1], els.chapters[2]], { autoAlpha: 0 });
    gsap.set(final, { autoAlpha: 0 });
    /* photoMeta na desktopie nie istnieje wizualnie (display: none w CSS —
       nachodził na om-meta) — żadnych tweenów. */
    gsap.set(photo, {
      opacity: 0.12,
      scale: 1.05,
      xPercent: 5,
      filter: "blur(16px)",
    });

    const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

    /* rozdziały 01–03: wjazd z dołu / zejście w górę */
    els.chapters.forEach((ch, i) => {
      if (i > 0) {
        tl.fromTo(
          ch,
          { autoAlpha: 0, y: 52 },
          { autoAlpha: 1, y: 0, duration: 0.055 },
          ABOUT_CH_IN[i],
        );
      }
      tl.to(
        ch,
        { autoAlpha: 0, y: -44, duration: 0.05, ease: "power2.in" },
        ABOUT_CH_OUT[i],
      );
    });

    /* portret: wyłonienie z mgły (rozdz. 02→03), potem wycofanie pod finał */
    tl.to(
      photo,
      {
        opacity: 1,
        scale: 1,
        xPercent: 0,
        filter: "blur(0px)",
        duration: 0.3,
        ease: "power1.inOut",
      },
      0.3,
    );
    tl.to(
      photo,
      {
        opacity: 0.22,
        scale: 1.16,
        filter: "blur(5px)",
        duration: 0.11,
        ease: "power1.inOut",
      },
      0.82,
    );

    /* ghost: dryf przez całość + przygaśnięcie w finale */
    tl.to(ghost, { xPercent: -11, duration: 1, ease: "none" }, 0);
    tl.to(ghost, { opacity: 0.45, duration: 0.14 }, 0.84);

    /* finał 04: nagłówek → CTA → podpis */
    tl.fromTo(
      final,
      { autoAlpha: 0, y: 46 },
      { autoAlpha: 1, y: 0, duration: 0.08 },
      0.87,
    );
    const cta = final.querySelector(".om-cta");
    const sign = final.querySelector(".om-sign");
    if (cta) {
      tl.fromTo(
        cta,
        { autoAlpha: 0, y: 20 },
        { autoAlpha: 1, y: 0, duration: 0.06 },
        0.91,
      );
    }
    if (sign)
      tl.fromTo(sign, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.06 }, 0.93);

    /* Testowy wyłącznik snapa (?nosnap — wzorzec jak ?lpm w LowPowerNotice).
       Programowy scroll w testach (sweep wizualny, e2e) przegrywa na wolnych
       runnerach CI wyścig ze snapem: snap decyduje na SCRUBOWANYM (opóźnionym
       ~1 s) postępie i przy zdławionych rAF potrafi uciec o cały segment osi.
       UX snapa nie jest przedmiotem tych testów; produkcyjne URL-e nie mają
       parametru, więc zachowanie strony się nie zmienia. */
    const noSnap = new URLSearchParams(location.search).has("nosnap");

    ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "bottom bottom",
      scrub: ABOUT_SCRUB,
      animation: tl,
      ...(noSnap
        ? {}
        : {
            snap: {
              snapTo: [...ABOUT_SNAP_POINTS],
              duration: { min: 0.2, max: 0.55 },
              delay: 0.08,
              ease: "power1.inOut",
            },
          }),
      onUpdate(self) {
        const p = self.progress;
        const [s1, s2, s3] = ABOUT_STAGE_THRESHOLDS;
        progress.set(p < s1 ? 0 : p < s2 ? 1 : p < s3 ? 2 : 3);
      },
    });
  }

  /* ═══ MOBILE: flow + minimalne reveale ═══
     Budżet: NAJWAŻNIEJSZA jest płynność syncTouch (iPhone SE 2020 / słabsze
     Androidy), świadomie kosztem bogactwa animacji:
     — ghost i żar są W PEŁNI statyczne (CSS) — zero warstw utrzymywanych
       przy życiu i zero pracy przy tickach scrolla,
     — reveal = JEDEN tween (autoAlpha+y) na cały blok, bez kaskady
       per-element (mniej równoległych warstw kompozycji),
     — emerge portretu = czysty opacity-crossfade (photo + wypieczona mgła
       .om-photo-veil), bez animacji scale i bez filter: blur (rasteryzacja
       rozmycia klatka po klatce zacinała główny wątek — „wystrzały" scrolla),
     — once: true — po pierwszym pokazaniu NIC już nie animuje. */
  function buildMobile(): void {
    /* tag sekcji: pojedynczy wjazd z lewej */
    gsap.fromTo(
      tag,
      { autoAlpha: 0, x: -26 },
      {
        autoAlpha: 1,
        x: 0,
        duration: 0.55,
        ease: "power3.out",
        scrollTrigger: { trigger: stage, start: "top 78%", once: true },
      },
    );

    /* rozdziały + finał: jeden tween na blok (tło finału jedzie razem
       z blokiem — bez osobnego tweenu) */
    for (const block of [...els.chapters, final]) {
      gsap.fromTo(
        block,
        { autoAlpha: 0, y: 28 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.6,
          ease: "power3.out",
          scrollTrigger: { trigger: block, start: "top 84%", once: true },
        },
      );
    }

    /* portret: jednorazowe wyłonienie z mgły — dwa tweeny opacity */
    const emerge = gsap.timeline({
      scrollTrigger: { trigger: photoW, start: "top 76%", once: true },
    });
    emerge.fromTo(
      photo,
      { opacity: 0.08 },
      { opacity: 1, duration: 1.1, ease: "power2.out" },
      0,
    );
    emerge.fromTo(
      photoVeil,
      { opacity: 0.55 },
      { opacity: 0, duration: 1, ease: "power2.out" },
      0.1,
    );
    emerge.fromTo(
      photoMeta,
      { autoAlpha: 0 },
      { autoAlpha: 1, duration: 0.5 },
      0.5,
    );
  }

  /* ═══ matchMedia: desktop / mobile (reduce → moduł w ogóle nieładowany) ═══ */
  motionMedia(ABOUT_DESKTOP_MIN_PX, (isDesktop) => {
    if (isDesktop) buildDesktop();
    else buildMobile();
    return () => {
      // Klasy stanu poza kontrolą gsap (progress) — sprzątamy sami.
      progress.reset();
      final.classList.remove("on");
    };
  });

  // Pozycje triggerów po zbudowaniu sekcji (notka PORT w referencji).
  ScrollTrigger.refresh();
}
