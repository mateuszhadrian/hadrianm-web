// Pętle wideo ekranów w WorkDetail (plan: docs/analiza-realizacje-wideo.md,
// D5/D6/D12). Treść nakładki jest klonowana z <template> — <video> w klonie
// ma tylko data-src (bez src, bez autoplay, bez poster), więc nic nie ładuje
// się przed otwarciem. armVideos() wpina src i startuje odtwarzanie dopiero
// po wstawieniu klonu do hosta; disarmVideos() zwalnia dekoder przy zamknięciu.
//
// Celowo BEZ self-heal z hero (D12): nakładka żyje krótko — jedna próba play()
// przy otwarciu + ponowna przy powrocie karty do widoku (visibilitychange).
// Brak zgody na autoplay (iOS Low Power Mode) = widać poster z <picture>.

const REDUCE_MQ = "(prefers-reduced-motion: reduce)";

/** Wpina src i startuje wszystkie pętle wideo w hoście; zwraca funkcję
 *  sprzątającą. Przy reduce-motion nie robi nic (zdjęcia zostają). */
export function armVideos(host: HTMLElement): () => void {
  if (matchMedia(REDUCE_MQ).matches) return () => {};
  const videos = [
    ...host.querySelectorAll<HTMLVideoElement>("video.wd__video[data-src]"),
  ];
  if (videos.length === 0) return () => {};

  const tryPlay = (v: HTMLVideoElement) => {
    if (!v.paused) return;
    v.play()?.catch(() => {
      /* brak zgody na autoplay — poster zostaje, bez pętli prób */
    });
  };
  const onPlaying = (e: Event) =>
    (e.currentTarget as HTMLVideoElement).classList.add("is-playing");
  const onVisibility = () => {
    if (document.visibilityState === "visible") videos.forEach(tryPlay);
  };

  for (const v of videos) {
    v.muted = true; // atrybut `muted` w klonie bywa ignorowany przez property
    v.addEventListener("playing", onPlaying);
    v.src = v.dataset.src ?? "";
    tryPlay(v);
  }
  document.addEventListener("visibilitychange", onVisibility);

  return () => {
    document.removeEventListener("visibilitychange", onVisibility);
    for (const v of videos) {
      v.removeEventListener("playing", onPlaying);
      v.pause();
      v.classList.remove("is-playing");
      v.removeAttribute("src");
      v.load(); // zwolnienie dekodera — host i tak zostanie wyczyszczony
    }
  };
}
