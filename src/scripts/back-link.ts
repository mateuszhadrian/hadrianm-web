// Linki „wstecz" na podstronach: każdy <a data-back> cofa się w historii
// przeglądarki (history.back()) zamiast otwierać href jako NOWĄ nawigację —
// tylko cofnięcie w historii przywraca pozycję scrolla strony, z której
// nastąpiło przejście (natywne scroll restoration; nic w projekcie nie
// przestawia history.scrollRestoration z domyślnego "auto").
//
// href zostaje fallbackiem: przy wejściu z zewnątrz / z nowej karty
// (brak same-origin referrera lub brak wcześniejszego wpisu historii)
// link nawiguje normalnie. Bez JS — zwykły link.
//
// Podpięte globalnie w BaseLayout (delegacja) — przyszłe podstrony
// dostają to zachowanie samym atrybutem data-back.
export function initBackLinks(): void {
  document.addEventListener("click", (ev) => {
    const target = ev.target as Element | null;
    const link = target?.closest?.("a[data-back]");
    if (!link || ev.defaultPrevented) return;
    // modyfikatory (nowa karta itp.) — nie przejmujemy nawigacji
    if (
      ev.metaKey ||
      ev.ctrlKey ||
      ev.shiftKey ||
      ev.altKey ||
      (ev as MouseEvent).button !== 0
    )
      return;
    const cameFromSite = document.referrer.startsWith(location.origin);
    if (!cameFromSite || history.length <= 1) return;
    ev.preventDefault();
    history.back();
  });
}
