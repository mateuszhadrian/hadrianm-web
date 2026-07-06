// Rejestr CSS custom properties PROTOKOŁU SCENY urządzeń (krok 3 refactoru —
// docs/analiza-refactor-hero-odkruszenie.md, problem S4).
//
// Protokół: timeline (Hero.astro) i layout (device-scene.ts) animują/ustawiają
// te zmienne, a transformy w CSS/applyFrame czytają je przez var(…, fallback).
// Wartości spoczynkowe MUSZĄ być równe defaultom zadeklarowanym w CSS
// (DeviceScene.astro: bloki .laptop / .phone / .camera) — zmieniaj razem.
//
// Dodajesz nową zmienną? Dopisz ją TU (typ + rest) i do właściwego podzbioru
// w miejscu użycia — cleanupy/pomiar geometrii pokryją ją automatycznie.

/** Wszystkie zmienne protokołu (typ pilnuje literówek w miejscach użycia). */
export type SceneVarName =
  | "--sl-lap" // wjazd poziomy laptopa (mobile)
  | "--sz-lap" // głębia wjazdu laptopa (mobile)
  | "--apart-lap" // rozsunięcie pionowe laptopa (mobile)
  | "--lap-yaw" // skręt laptopa, klatka C (desktop)
  | "--lap-pitch" // odchylenie pokrywy, klatka C (desktop)
  | "--sl-ph" // wjazd poziomy telefonu (mobile)
  | "--sz-ph" // głębia wjazdu telefonu (mobile)
  | "--apart-ph" // rozsunięcie pionowe telefonu (mobile)
  | "--ph-dx" // przejazd telefonu, klatka C (desktop)
  | "--ph-dy"
  | "--ph-dz"
  | "--vid-scale" // powiększenie ekranu wideo (mobile, faza 3)
  | "--cx" // kąt kamery X — spoczynek zależny od układu: cameraCxRest()
  | "--cy" // kąt kamery Y
  | "--gx" // wyśrodkowanie grupy (pomiar w centerGroup)
  | "--gy";

/** Wartości spoczynkowe (= defaulty w CSS DeviceScene.astro).
 *  Bez --cx: jego spoczynek zależy od układu — patrz cameraCxRest(). */
export const SCENE_VAR_REST: Record<Exclude<SceneVarName, "--cx">, string> = {
  "--sl-lap": "0px",
  "--sz-lap": "0px",
  "--apart-lap": "0px",
  "--lap-yaw": "0deg",
  "--lap-pitch": "0deg",
  "--sl-ph": "0px",
  "--sz-ph": "0px",
  "--apart-ph": "0px",
  "--ph-dx": "0px",
  "--ph-dy": "0px",
  "--ph-dz": "0px",
  "--vid-scale": "1",
  "--cy": "0deg",
  "--gx": "0px",
  "--gy": "0px",
};

/** Spoczynkowy kąt kamery X: 4deg w układzie stacked (mobile), 0deg desktop
 *  (wartość 4deg musi być zgodna z CSS `.camera { --cx: 4deg }` w bloku
 *  mobile DeviceScene.astro oraz geometry() w device-scene.ts). */
export const cameraCxRest = (stacked: boolean): string =>
  stacked ? "4deg" : "0deg";

/** Ustaw podzbiór zmiennych na wartości spoczynkowe (setProperty). */
export const setRest = (
  el: HTMLElement | null,
  names: Exclude<SceneVarName, "--cx">[],
): void => {
  names.forEach((n) => el?.style.setProperty(n, SCENE_VAR_REST[n]));
};

/** Zdejmij podzbiór zmiennych z elementu (removeProperty → wracają defaulty
 *  zadeklarowane w CSS). Celowo INNY mechanizm niż setRest — zachowuje
 *  dotychczasową semantykę cleanupu bazowego timeline'u. */
export const removeVars = (
  el: HTMLElement | null,
  names: SceneVarName[],
): void => {
  names.forEach((n) => el?.style.removeProperty(n));
};
