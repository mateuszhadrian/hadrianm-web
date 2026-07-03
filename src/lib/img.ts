// Jedyne miejsce, które wie „skąd brać obrazek w danym rozmiarze".
// Dziś: pliki w repo z sufiksem -m (desktop.webp → desktop-m.webp).
// Docelowo (Etap 5): transformacje Cloudflare przez URL — podmiana tylko tutaj,
// bez ruszania komponentów.
export function imgAt(src: string, width: "full" | "mobile"): string {
  return width === "mobile" ? src.replace(/\.webp$/, "-m.webp") : src;
}
