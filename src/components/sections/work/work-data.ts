import type { Lang } from "@/i18n/utils";

type Localized = { pl: string; en: string };
type LocalizedList = { pl: string[]; en: string[] };

export interface WorkProject {
  slug: string;
  name: string;
  category: Localized;
  year: string;
  blurb: Localized;
  tags: LocalizedList;
  img: { desktop: string; mobile: string };
  href?: string;
}

export const workProjects: WorkProject[] = [
  {
    slug: "aura",
    name: "Aura Aesthetics",
    category: { pl: "Moda & Beauty", en: "Fashion & Beauty" },
    year: "2025",
    blurb: {
      pl: "Gabinet medycyny estetycznej — delikatna, elegancka odsłona marki premium.",
      en: "Aesthetic-medicine clinic — a delicate, elegant take on a premium brand.",
    },
    tags: {
      pl: ["Rezerwacja online", "Nowoczesny UI", "Wzrost zapytań"],
      en: ["Online booking", "Modern UI", "More enquiries"],
    },
    img: {
      desktop: "/realizacje/aura/desktop.webp",
      mobile: "/realizacje/aura/mobile.webp",
    },
  },
  {
    slug: "dab",
    name: "Dąb & Forma",
    category: { pl: "Wnętrza & Meble", en: "Interiors & Furniture" },
    year: "2025",
    blurb: {
      pl: "Manufaktura mebli z litego drewna — surowy, architektoniczny minimalizm.",
      en: "Solid-wood furniture studio — raw, architectural minimalism.",
    },
    tags: {
      pl: ["Szybkość ładowania", "Katalog produktów", "Mocna typografia"],
      en: ["Fast loading", "Product catalogue", "Bold typography"],
    },
    img: {
      desktop: "/realizacje/dab/desktop.webp",
      mobile: "/realizacje/dab/mobile.webp",
    },
  },
  {
    slug: "sielski",
    name: "Sielski Zakątek",
    category: { pl: "Turystyka & Wypoczynek", en: "Tourism & Leisure" },
    year: "2024",
    blurb: {
      pl: "Agroturystyka w sercu gór — ciepły, rustykalny klimat i prosta rezerwacja.",
      en: "Countryside stay in the heart of the mountains — a warm, rustic mood and simple booking.",
    },
    tags: {
      pl: ["Kalendarz rezerwacji", "Galeria zdjęć", "Zwiększona konwersja"],
      en: ["Booking calendar", "Photo gallery", "Higher conversion"],
    },
    img: {
      desktop: "/realizacje/sielski/desktop.webp",
      mobile: "/realizacje/sielski/mobile.webp",
    },
  },
];

export function localizeProject(p: WorkProject, lang: Lang) {
  return {
    slug: p.slug,
    name: p.name,
    year: p.year,
    category: p.category[lang] ?? p.category.pl,
    blurb: p.blurb[lang] ?? p.blurb.pl,
    tags: (p.tags[lang] ?? p.tags.pl).slice(0, 3),
    img: p.img,
    href: p.href,
  };
}
