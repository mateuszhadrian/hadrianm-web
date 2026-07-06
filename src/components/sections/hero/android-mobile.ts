import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * FAZA 3 (mobile) — wspólna dla iOS i Androida: ekrany urządzeń grają w pętli
 * CAŁY CZAS, gdy #hero jest na ekranie i karta aktywna. Gating wg postępu
 * scrolla celowo usunięty — na Androidzie zacinał się (repaint przypiętej
 * sceny GSAP), na iOS zamarzał po mimowolnej pauzie dekodera Safari.
 * IntersectionObserver + visibilitychange działają poza ścieżką repaintu,
 * więc są niezawodne na obu.
 */

export interface Span {
  /** Start okna w jednostkach wysokości viewportu od górnej krawędzi #hero. */
  start: number;
  /** Koniec okna (jw.). */
  end: number;
}

export interface MobileVideoSpec {
  video: HTMLVideoElement | null;
  /** Element urządzenia, na którym ustawiamy --vid-scale. */
  el: HTMLElement | null;
  span: Span;
}

export interface MobilePhase3Params {
  hero: HTMLElement | null;
  /** Docelowe powiększenie w szczycie okna. */
  vidMax: number;
  /** Koniec powiększania / start przytrzymania (postęp okna ∈ [0,1]). */
  growEnd: number;
  /** Koniec przytrzymania / start zmniejszania. */
  holdEnd: number;
  videos: MobileVideoSpec[];
  /** Pasek postępu (może nie istnieć w DOM); kulkę pozycjonuje CSS przez --p. */
  progressEl: HTMLElement | null;
  /** Pełny zakres paska postępu (vh od górnej krawędzi #hero). */
  barStartVh: number;
  barEndVh: number;
}

/**
 * Inicjuje mobilny wariant fazy 3 (iOS + Android). Zwraca funkcję sprzątającą.
 */
export function initMobilePhase3(p: MobilePhase3Params): () => void {
  const { hero, vidMax, growEnd, holdEnd, videos, progressEl } = p;

  // Skala urządzenia dla postępu okna: 1→MAX (grow) | MAX (hold) | MAX→1 (shrink).
  const scaleFor = (prog: number) => {
    if (prog <= growEnd) return 1 + (vidMax - 1) * (prog / growEnd);
    if (prog < holdEnd) return vidMax;
    return 1 + (vidMax - 1) * ((1 - prog) / (1 - holdEnd));
  };

  // Wideo gra w pętli (atrybut `loop`) tylko gdy #hero na ekranie i karta
  // aktywna — poza tym pauzujemy dekodowanie (CPU/GPU), wznowienie od
  // bieżącej klatki → brak skoku.
  const vids = videos
    .map((v) => v.video)
    .filter((v): v is HTMLVideoElement => v != null);

  let heroOnScreen = true;
  let docVisible = typeof document === "undefined" || !document.hidden;
  // autoplay twardo zablokowany (np. iOS Low Power Mode) → plakat, bez ponawiania
  let autoplayBlocked = false;

  const shouldPlay = () => heroOnScreen && docVisible && !autoplayBlocked;

  const syncPlayback = () => {
    vids.forEach((v) => {
      if (shouldPlay()) {
        if (v.paused) {
          v.play()?.catch(() => {
            autoplayBlocked = true;
          });
        }
      } else if (!v.paused) {
        v.pause();
      }
    });
  };

  // Samonaprawa iOS: Safari mimowolnie wstrzymuje dekoder pod obciążeniem
  // (pamięć/termika/Low Power). `pause`, gdy powinno grać ⇒ wznów od bieżącej
  // klatki. Celowa pauza nie wznawia — shouldPlay() jest wtedy false.
  const pauseCleanups = vids.map((v) => {
    const onPause = () => {
      if (!shouldPlay() || !v.paused) return;
      v.play()?.catch(() => {
        /* przejściowo zablokowane — IO/visibility ponowi */
      });
    };
    v.addEventListener("pause", onPause);
    return () => v.removeEventListener("pause", onPause);
  });

  let observer: IntersectionObserver | null = null;
  if (hero && typeof IntersectionObserver !== "undefined") {
    observer = new IntersectionObserver(
      (entries) => {
        heroOnScreen = entries[0]?.isIntersecting ?? true;
        syncPlayback();
      },
      { threshold: 0 },
    );
    observer.observe(hero);
  }

  const onVisibility = () => {
    docVisible = !document.hidden;
    syncPlayback();
  };
  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", onVisibility);
  }

  // Pierwszy strzał — IntersectionObserver skoryguje stan asynchronicznie.
  syncPlayback();

  const triggers: ScrollTrigger[] = [];

  videos.forEach(({ el, span }) => {
    if (!hero || !el) return;
    // pomijaj redundantne zapisy (faza hold = stała skala przez długi odcinek)
    let lastScale = -1;
    const setScale = (s: number) => {
      if (s === lastScale) return;
      lastScale = s;
      el.style.setProperty("--vid-scale", s.toFixed(4));
    };
    triggers.push(
      ScrollTrigger.create({
        trigger: hero,
        start: () => "top+=" + span.start * window.innerHeight + " top",
        end: () => "top+=" + span.end * window.innerHeight + " top",
        scrub: true,
        onUpdate: (self) => setScale(scaleFor(self.progress)),
        onLeave: () => setScale(1),
        onLeaveBack: () => setScale(1),
      }),
    );
  });

  const progressTrigger =
    hero && progressEl
      ? ScrollTrigger.create({
          trigger: hero,
          start: () => "top+=" + p.barStartVh * window.innerHeight + " top",
          end: () => "top+=" + p.barEndVh * window.innerHeight + " top",
          scrub: true,
          onUpdate: (self) => {
            progressEl.style.setProperty("--p", self.progress.toFixed(4));
          },
          onToggle: (self) =>
            progressEl.classList.toggle("is-active", self.isActive),
        })
      : null;

  return () => {
    observer?.disconnect();
    if (typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", onVisibility);
    }
    pauseCleanups.forEach((fn) => fn());
    triggers.forEach((t) => t.kill());
    progressTrigger?.kill();
    progressEl?.classList.remove("is-active");
    progressEl?.style.removeProperty("--p");
  };
}
