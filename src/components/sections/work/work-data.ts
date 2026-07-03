import type { Lang } from "@/i18n/utils";

// Dane realizacji żyją w plikach JSON kolekcji `realizacje`
// (src/content/realizacje/*.json, schemat w src/content.config.ts).
// Tu zostają wyłącznie typy i lokalizacja pól {pl,en} → jeden język.

type Localized = { pl: string; en: string };
type LocalizedList = { pl: string[]; en: string[] };

// Pojedynczy ekran realizacji (laptop + telefon) prezentowany w modalu/sheecie.
export interface WorkScreen {
  key: string;
  label: Localized;
  desktop: string;
  mobile: string;
}

// Liczba/wynik w sekcji „Liczby i wyniki". `metric` lokalizowane, bo formaty
// bywają językowe (np. „0,9 s" vs „0.9 s", „3 tyg." vs „3 wk").
export interface WorkResult {
  metric: Localized;
  label: Localized;
}

export interface WorkProject {
  slug: string;
  order: number;
  name: string;
  category: Localized;
  year: string;
  blurb: Localized;
  tags: LocalizedList;

  // ── Treść modala / bottom sheeta ──
  screens: WorkScreen[];
  intro: Localized;
  results: WorkResult[];
  quote: Localized;
  author: string;
  role: Localized;
  scope: LocalizedList;
  // Link do strony na żywo. Pominięty (lub „#") → CTA się nie renderuje.
  liveUrl?: string;
}

export type LocalizedScreen = {
  key: string;
  label: string;
  desktop: string;
  mobile: string;
};
export type LocalizedResult = { metric: string; label: string };

export type LocalizedProject = {
  slug: string;
  name: string;
  year: string;
  category: string;
  blurb: string;
  tags: string[];
  screens: LocalizedScreen[];
  intro: string;
  results: LocalizedResult[];
  quote: string;
  author: string;
  role: string;
  scope: string[];
  liveUrl?: string;
};

export function localizeProject(p: WorkProject, lang: Lang): LocalizedProject {
  const live = p.liveUrl && p.liveUrl !== "#" ? p.liveUrl : undefined;
  return {
    slug: p.slug,
    name: p.name,
    year: p.year,
    category: p.category[lang] ?? p.category.pl,
    blurb: p.blurb[lang] ?? p.blurb.pl,
    tags: (p.tags[lang] ?? p.tags.pl).slice(0, 3),
    screens: p.screens.map((s) => ({
      key: s.key,
      label: s.label[lang] ?? s.label.pl,
      desktop: s.desktop,
      mobile: s.mobile,
    })),
    intro: p.intro[lang] ?? p.intro.pl,
    results: p.results.map((r) => ({
      metric: r.metric[lang] ?? r.metric.pl,
      label: r.label[lang] ?? r.label.pl,
    })),
    quote: p.quote[lang] ?? p.quote.pl,
    author: p.author,
    role: p.role[lang] ?? p.role.pl,
    scope: p.scope[lang] ?? p.scope.pl,
    liveUrl: live,
  };
}
