// Jedyne miejsce, które wie „skąd brać obrazek w danym rozmiarze".
// Etap 5: skalowanie w locie przez Cloudflare Image Transformations —
// jeden oryginał w R2, każdy rozmiar powstaje z adresu URL.
export function imgAt(src: string, width: "full" | "mobile"): string {
  // Lokalnie (dev/preview) endpoint /cdn-cgi/image nie istnieje — pokaż oryginał.
  if (import.meta.env.DEV) return src;
  const w = width === "mobile" ? 320 : 960; // szerokości pod telefon / desktop
  // format=auto → przeglądarka dostaje AVIF/WebP automatycznie.
  // replace: źródło bez wiodącego "/" (stare ścieżki z repo typu /realizacje/…);
  // pełne URL-e https://media.hadrianm.pl/… przechodzą bez zmian.
  return `/cdn-cgi/image/width=${w},format=auto/${src.replace(/^\//, "")}`;
}
