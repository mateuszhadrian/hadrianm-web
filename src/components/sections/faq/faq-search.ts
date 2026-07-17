// Wyszukiwarka podstrony /faq/ — 100% frontend (port faq.js z referencji
// docs/design/faq-podstrona-referencja/; decyzje: docs/analiza-podstrona-faq.md
// D7). Ładowana ZAWSZE (interakcja jak akordeon — działa też przy
// prefers-reduced-motion: reduce), BEZ zależności od GSAP; refresh
// ScrollTriggera po filtrze wpina moduł motion przez callback onFilter —
// wołany TYLKO gdy filtr realnie zmienił widoczność wierszy (wysokość
// strony), nie przy każdym znaku. Bez JS wyszukiwarka jest nieaktywna —
// pełna treść 30 pytań zostaje w HTML (fallback SEO).
//
// Filtr live po pytaniu + odpowiedzi, odporny na polskie znaki: norm()
// sprowadza diakrytyki do ASCII po obu stronach zapytania. Zamiana jest
// 1:1 znak-w-znak, więc indeksy trafień pasują do oryginalnego tekstu
// i podświetlanie (<mark class="fq-hl">) zachowuje diakrytyki. Wynik
// XSS-safe: treść wstrzykiwana przez escapeHtml (współdzielony
// @/lib/contact-form), <mark> dokładany wyłącznie wokół dopasowanego
// fragmentu; przepisanie innerHTML tylko gdy fraza dla wiersza się
// zmieniła (cache lastNq — bez 30 przebudów DOM na każdy znak).
// Szablony licznika przychodzą z i18n przez data-* na markupie
// (FaqFull.astro) — moduł nie zna języka; cudzysłowy frazy „bez wyników"
// są częścią tekstów i18n (typografia per język).
import { escapeHtml } from "@/lib/contact-form";

interface SearchRecord {
  item: HTMLElement;
  qtEl: HTMLElement;
  qText: string;
  hay: string;
  /** Ostatnia znormalizowana fraza wpisana w innerHTML pytania. */
  lastNq: string;
}

const PL: Record<string, string> = {
  ą: "a",
  ć: "c",
  ę: "e",
  ł: "l",
  ń: "n",
  ó: "o",
  ś: "s",
  ż: "z",
  ź: "z",
};

function norm(s: string): string {
  return s.toLowerCase().replace(/[ąćęłńóśżź]/g, (c) => PL[c]);
}

function highlight(text: string, nq: string): string {
  if (!nq) return escapeHtml(text);
  const nText = norm(text);
  let out = "";
  let idx = 0;
  let pos = nText.indexOf(nq);
  while (pos !== -1) {
    out += `${escapeHtml(text.slice(idx, pos))}<mark class="fq-hl">${escapeHtml(
      text.slice(pos, pos + nq.length),
    )}</mark>`;
    idx = pos + nq.length;
    pos = nText.indexOf(nq, idx);
  }
  return out + escapeHtml(text.slice(idx));
}

export function initFaqSearch(root: HTMLElement, onFilter?: () => void): void {
  const input = root.querySelector<HTMLInputElement>("#fq-search-input");
  const clearBtn = root.querySelector<HTMLButtonElement>(".fq-clear");
  const countEl = root.querySelector<HTMLElement>("#fq-search-count");
  const noRes = root.querySelector<HTMLElement>("#fq-noresults");
  const endline = root.querySelector<HTMLElement>("#fq-endline");
  if (!input || !clearBtn || !countEl || !noRes) return;

  const records: SearchRecord[] = Array.from(
    root.querySelectorAll<HTMLElement>(".fq-item"),
  ).flatMap((item) => {
    const qtEl = item.querySelector<HTMLElement>(".qt");
    if (!qtEl) return [];
    const qText = qtEl.textContent ?? "";
    const aEl = item.querySelector<HTMLElement>(".fq-a p");
    return [
      {
        item,
        qtEl,
        qText,
        hay: norm(`${qText} ${aEl?.textContent ?? ""}`),
        lastNq: "",
      },
    ];
  });

  // Szablony licznika z data-* (i18n zostaje w Astro): "{total} pytań"
  // oraz "{n} z {total} pytań".
  const tplAll = countEl.dataset.tplAll ?? "{total}";
  const tplFiltered = countEl.dataset.tplFiltered ?? "{n} / {total}";
  const total = String(records.length);

  function applyFilter(): void {
    const raw = input!.value.trim();
    const nq = norm(raw);
    let shown = 0;
    let visibilityChanged = false;
    for (const r of records) {
      const match = !nq || r.hay.includes(nq);
      // wasHidden === match ⇔ wiersz zmienia stan (ukryty→widoczny lub
      // odwrotnie) — tylko wtedy zmienia się wysokość strony.
      if (r.item.classList.contains("fq-hidden") === match) {
        visibilityChanged = true;
      }
      r.item.classList.toggle("fq-hidden", !match);
      if (match) {
        shown++;
        // Wiersz przywrócony AKTYWNYM filtrem mógł jeszcze nie dostać .on
        // od batcha wejść (motion) — bez tej klasy byłby niewidoczny pod
        // progiem. Pusta fraza NIE dotyka .on: wiersze wracają pod
        // choreografię batcha (stagger przy scrollu zostaje).
        if (nq) r.item.classList.add("on");
        if (r.lastNq !== nq) {
          r.qtEl.innerHTML = highlight(r.qText, nq);
          r.lastNq = nq;
        }
      }
    }
    clearBtn!.hidden = !raw;
    countEl!.textContent = raw
      ? tplFiltered.replace("{n}", String(shown)).replace("{total}", total)
      : tplAll.replace("{total}", total);
    countEl!.classList.toggle("is-filtered", !!raw);
    noRes!.hidden = shown !== 0;
    const phrase = noRes!.querySelector<HTMLElement>(".q");
    if (phrase) phrase.textContent = raw;
    if (endline) endline.style.display = shown === 0 ? "none" : "";
    // ScrollTrigger.refresh (drogi — pełny pomiar strony) tylko gdy układ
    // realnie się zmienił; samo podświetlenie nie rusza wysokości.
    if (visibilityChanged) onFilter?.();
  }

  input.addEventListener("input", applyFilter);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      input.value = "";
      applyFilter();
    }
  });
  clearBtn.addEventListener("click", () => {
    input.value = "";
    applyFilter();
    input.focus();
  });
}
