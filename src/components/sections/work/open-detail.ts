// Otwarcie szczegółów realizacji (WorkDetail) — współdzielone przez galerię
// desktopową (Work.astro → Modal) i karuzelę mobilną (WorkCarousel → BottomSheet).
// Treść jest klonowana z <template data-work-detail="slug"> do hosta właściwej
// nakładki tuż przed otwarciem i czyszczona po zamknięciu (zwalnia obrazy/DOM).
// Wybór modal↔sheet wynika z tego samego progu 760 px, który steruje layoutem.

import { armVideos } from "./work-video";

// `window.overlay` typowane w scripts/overlay.ts (declare global).
export const sheetMQ = matchMedia("(max-width: 760px)");

// Sprzątanie pętli wideo per host (otwarcie kolejnej realizacji bez
// zamknięcia poprzedniej też musi zwolnić stare <video>).
const disarmMap = new WeakMap<HTMLElement, () => void>();

function hostOf(id: string) {
  return document
    .getElementById(id)
    ?.querySelector<HTMLElement>("[data-work-host]");
}

export function openWorkDetail(slug: string, name: string) {
  const tpl = document.querySelector<HTMLTemplateElement>(
    `template[data-work-detail="${slug}"]`,
  );
  if (!tpl || !window.overlay) return;

  const id = sheetMQ.matches ? "work-sheet" : "work-modal";
  const host = hostOf(id);
  if (!host) return;

  disarmMap.get(host)?.();
  host.replaceChildren(tpl.content.cloneNode(true));
  // Wideo ekranów: src + play() dopiero po wstawieniu klonu (work-video.ts).
  disarmMap.set(host, armVideos(host));
  window.overlay.open(id, {
    label: name,
    onClose: () => {
      disarmMap.get(host)?.();
      disarmMap.delete(host);
      host.replaceChildren();
    },
  });
}
