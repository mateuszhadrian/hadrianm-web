import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Wariant FAZY 3 (mobile) dla Androida — wyodrębniony z Hero.astro.
 *
 * Dlaczego osobno: przypięta, kompozytowana scena GSAP na Androidzie nie
 * repaintuje niezawodnie zmian stanu wyzwalanych w trakcie scrolla, więc
 * mechanizm play/stop wideo (gating pozycją scrolla) potrafił się zacinać.
 * Na Androidzie ekrany grają więc w pętli CAŁY CZAS, a pasek postępu jest
 * cały w kolorze akcentu (czerwony) z kulką stale czerwoną. Skalowanie
 * urządzeń (rośnie → hold → maleje) pozostaje takie samo jak w domyślnym
 * (iOS) wariancie.
 */

/** Czy bieżące urządzenie to Android (smartfon/tablet z Androidem). */
export const IS_ANDROID =
  typeof navigator !== "undefined" && /android/i.test(navigator.userAgent);

export interface Zone {
  /** Start strefy w jednostkach wysokości viewportu od górnej krawędzi #hero. */
  start: number;
  /** Koniec strefy (jw.). */
  end: number;
}

export interface AndroidVideoSpec {
  video: HTMLVideoElement | null;
  /** Element urządzenia, na którym ustawiamy --vid-scale. */
  el: HTMLElement | null;
  zone: Zone;
}

export interface AndroidPhase3Params {
  hero: HTMLElement | null;
  /** Docelowe powiększenie w szczycie strefy (wspólne z wariantem iOS). */
  vidMax: number;
  /** Koniec powiększania / start przytrzymania (postęp strefy ∈ [0,1]). */
  growEnd: number;
  /** Koniec przytrzymania / start zmniejszania. */
  holdEnd: number;
  videos: AndroidVideoSpec[];
  /** Pasek postępu + kulka (mogą nie istnieć w DOM). */
  progressEl: HTMLElement | null;
  progressDot: HTMLElement | null;
  /** Pełny zakres paska postępu (vh od górnej krawędzi #hero). */
  barStartVh: number;
  barEndVh: number;
}

/**
 * Inicjuje androidowy wariant fazy 3. Zwraca funkcję sprzątającą.
 */
export function initAndroidPhase3(p: AndroidPhase3Params): () => void {
  const { hero, vidMax, growEnd, holdEnd, videos, progressEl, progressDot } = p;

  // Skala urządzenia dla postępu strefy: 1→MAX (grow) | MAX (hold) | MAX→1 (shrink).
  const scaleFor = (prog: number) => {
    if (prog <= growEnd) return 1 + (vidMax - 1) * (prog / growEnd);
    if (prog < holdEnd) return vidMax;
    return 1 + (vidMax - 1) * ((1 - prog) / (1 - holdEnd));
  };

  // Wideo gra w pętli od startu — atrybut `loop` w markupie domyka zapętlenie,
  // a brak gatingu play/stop oznacza, że obraz nigdy się nie zatrzymuje.
  const startLoop = (v: HTMLVideoElement | null) => {
    if (!v) return;
    v.play()?.catch(() => {
      /* autoplay zablokowany (np. tryb oszczędzania danych) → plakat */
    });
  };

  const triggers: ScrollTrigger[] = [];

  videos.forEach(({ video, el, zone }) => {
    startLoop(video);
    if (!hero || !el) return;
    // pomijaj redundantne zapisy (faza hold = stała skala przez ~2 ekrany)
    let lastScale = -1;
    const setScale = (s: number) => {
      if (s === lastScale) return;
      lastScale = s;
      el.style.setProperty("--vid-scale", s.toFixed(4));
    };
    triggers.push(
      ScrollTrigger.create({
        trigger: hero,
        start: () => "top+=" + zone.start * window.innerHeight + " top",
        end: () => "top+=" + zone.end * window.innerHeight + " top",
        scrub: true,
        onUpdate: (self) => setScale(scaleFor(self.progress)),
        onLeave: () => setScale(1),
        onLeaveBack: () => setScale(1),
      }),
    );
  });

  // Pasek postępu: cały czerwony (.is-android steruje CSS) + kulka stale
  // czerwona (.is-on-seg na stałe — bez przełączania na odcinkach).
  progressEl?.classList.add("is-android");
  progressDot?.classList.add("is-on-seg");

  const progressTrigger =
    hero && progressEl
      ? ScrollTrigger.create({
          trigger: hero,
          start: () => "top+=" + p.barStartVh * window.innerHeight + " top",
          end: () => "top+=" + p.barEndVh * window.innerHeight + " top",
          scrub: true,
          onUpdate: (self) =>
            progressEl.style.setProperty("--p", self.progress.toFixed(4)),
          onToggle: (self) =>
            progressEl.classList.toggle("is-active", self.isActive),
        })
      : null;

  return () => {
    triggers.forEach((t) => t.kill());
    progressTrigger?.kill();
    progressEl?.classList.remove("is-active", "is-android");
    progressEl?.style.removeProperty("--p");
    progressDot?.classList.remove("is-on-seg");
  };
}
