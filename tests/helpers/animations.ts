// Oczekiwanie na ustanie animacji wejścia — PRZED pomiarem zależnym od
// wyglądu w danej chwili (skan axe color-contrast liczy krycie przodków,
// więc klatka pośrednia reveal = fałszywe naruszenie). T12 / PI-06
// (docs/analiza-ewolucja-vs-nowsze-projekty.md §6), DEC-117.
//
// Dwa źródła animacji na stronie, oba sprawdzane w przeglądarce (DEC-108 —
// czas z performance.now(), klatki z requestAnimationFrame):
// (a) przejścia/animacje CSS i WAAPI — document.getAnimations(); liczą się
//     tylko SKOŃCZONE (tło ambient i podobne mają endTime = Infinity
//     i nigdy nie ustają) w stanie running/pending, także w fazie
//     transition-delay (stagger kart huba /oferta/);
// (b) GSAP — pisze style inline i NIE występuje w getAnimations() (rozdziały
//     /dla-kogo/ na mobile: tween autoAlpha). Sygnałem jest zmiana wartości
//     opacity/visibility/color w atrybucie style (MutationObserver ze starą
//     wartością); same transformy (parallax, scrub hero) nie zmieniają
//     kontrastu i są pomijane.
// Warunek: obie ciche nieprzerwanie przez QUIET_MS i co najmniej
// QUIET_FRAMES klatek (przy wolnym CPU klatki są rzadkie — sam czas
// mógłby minąć w jednej). Brak ciszy w timeoutMs = błąd z listą sprawców,
// nie cichy skan „na pół kryciu".
import { type Page } from "@playwright/test";

export interface SettleOptions {
  /** Nieprzerwana cisza (ms) wymagana do uznania strony za ustaloną. */
  quietMs?: number;
  /** Minimalna liczba klatek ciszy (niezależnie od czasu). */
  quietFrames?: number;
  /** Limit oczekiwania (ms) — po nim błąd z listą trwających animacji. */
  timeoutMs?: number;
}

interface SettleResult {
  ok: boolean;
  waitedMs: number;
  pending: string[];
}

export async function waitForEntranceAnimations(
  page: Page,
  { quietMs = 400, quietFrames = 10, timeoutMs = 10_000 }: SettleOptions = {},
): Promise<number> {
  const res = await page.evaluate(
    ({ quietMs, quietFrames, timeoutMs }) =>
      new Promise<SettleResult>((resolve) => {
        const desc = (n: Element | null | undefined): string =>
          !n
            ? "?"
            : n.tagName.toLowerCase() +
              (n.id ? `#${n.id}` : "") +
              (n.classList.length ? `.${[...n.classList].join(".")}` : "");
        // Wartości z atrybutu style istotne dla kontrastu.
        const visual = (style: string | null): string =>
          (style ?? "")
            .split(";")
            .map((d) => d.trim())
            .filter((d) => /^(opacity|visibility|color)\s*:/.test(d))
            .join(";");

        const t0 = performance.now();
        let quietSince = t0;
        let quietFor = 0;
        let lastStyleCulprit = "";
        const mo = new MutationObserver((records) => {
          for (const r of records) {
            const el = r.target as Element;
            if (visual(r.oldValue) !== visual(el.getAttribute("style"))) {
              quietSince = performance.now();
              quietFor = 0;
              lastStyleCulprit = `style ${desc(el)} {${visual(el.getAttribute("style"))}}`;
            }
          }
        });
        mo.observe(document.documentElement, {
          subtree: true,
          attributes: true,
          attributeFilter: ["style"],
          attributeOldValue: true,
        });

        const running = (): string[] =>
          document
            .getAnimations()
            .filter(
              (a) =>
                (a.playState === "running" || a.pending) &&
                a.effect?.getComputedTiming().endTime !== Infinity,
            )
            .map((a) => {
              const what =
                a instanceof CSSTransition
                  ? `transition ${a.transitionProperty}`
                  : a instanceof CSSAnimation
                    ? `animation ${a.animationName}`
                    : "animation";
              const target = (a.effect as KeyframeEffect | null)?.target;
              return `${what} ${desc(target)} ${Math.round(Number(a.currentTime ?? 0))}/${Math.round(Number(a.effect?.getComputedTiming().endTime ?? 0))} ms`;
            });

        const tick = (): void => {
          const now = performance.now();
          const anims = running();
          if (anims.length) {
            quietSince = now;
            quietFor = 0;
          } else {
            quietFor++;
          }
          if (quietFor >= quietFrames && now - quietSince >= quietMs) {
            mo.disconnect();
            resolve({ ok: true, waitedMs: Math.round(now - t0), pending: [] });
            return;
          }
          if (now - t0 >= timeoutMs) {
            mo.disconnect();
            resolve({
              ok: false,
              waitedMs: Math.round(now - t0),
              pending: anims.length
                ? anims
                : [lastStyleCulprit || "(brak — za mało klatek ciszy)"],
            });
            return;
          }
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }),
    { quietMs, quietFrames, timeoutMs },
  );
  if (!res.ok) {
    throw new Error(
      `Animacje wejścia nie ustały w ${res.waitedMs} ms: ${res.pending.join("; ")}`,
    );
  }
  return res.waitedMs;
}
