import type { Lang } from "@/i18n/utils";

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
  name: string;
  category: Localized;
  year: string;
  blurb: Localized;
  tags: LocalizedList;
  img: { desktop: string; mobile: string };
  href?: string;

  // ── Treść modala / bottom sheeta (gotowa pod Git CMS) ──
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
    screens: [
      {
        key: "home",
        label: { pl: "Strona główna", en: "Home" },
        desktop: "/realizacje/aura/desktop.webp",
        mobile: "/realizacje/aura/mobile.webp",
      },
      {
        key: "gallery",
        label: { pl: "Galeria zabiegów", en: "Treatments gallery" },
        desktop: "/realizacje/aura/gallery-desktop.webp",
        mobile: "/realizacje/aura/gallery-mobile.webp",
      },
      {
        key: "order",
        label: { pl: "Rezerwacja online", en: "Online booking" },
        desktop: "/realizacje/aura/order-desktop.webp",
        mobile: "/realizacje/aura/order-mobile.webp",
      },
    ],
    intro: {
      pl: "Klientka prowadząca gabinet medycyny estetycznej potrzebowała strony, która odda premium charakter marki i pozwoli pacjentkom rezerwować wizyty online — bez telefonów i wiadomości.",
      en: "The owner of an aesthetic-medicine clinic needed a site that conveys the brand's premium character and lets patients book visits online — without phone calls or messages.",
    },
    results: [
      {
        metric: { pl: "98/100", en: "98/100" },
        label: {
          pl: "Wynik Google PageSpeed (mobile)",
          en: "Google PageSpeed score (mobile)",
        },
      },
      {
        metric: { pl: "+42%", en: "+42%" },
        label: {
          pl: "Więcej rezerwacji online w 3 miesiące",
          en: "More online bookings in 3 months",
        },
      },
      {
        metric: { pl: "3 tyg.", en: "3 wk" },
        label: { pl: "Od projektu do publikacji", en: "From design to launch" },
      },
    ],
    quote: {
      pl: "Strona wygląda dokładnie tak elegancko jak mój gabinet. Pacjentki same się zapisują, a ja mam więcej czasu dla nich.",
      en: "The site looks exactly as elegant as my clinic. Patients book themselves, and I have more time for them.",
    },
    author: "Marta Kowalczyk",
    role: {
      pl: "Właścicielka, Aura Aesthetics",
      en: "Owner, Aura Aesthetics",
    },
    scope: {
      pl: [
        "Projekt UI/UX",
        "Wdrożenie frontendowe",
        "System rezerwacji",
        "Optymalizacja SEO",
      ],
      en: [
        "UI/UX design",
        "Frontend build",
        "Booking system",
        "SEO optimisation",
      ],
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
    screens: [
      {
        key: "home",
        label: { pl: "Strona główna", en: "Home" },
        desktop: "/realizacje/dab/desktop.webp",
        mobile: "/realizacje/dab/mobile.webp",
      },
      {
        key: "gallery",
        label: { pl: "Kolekcje", en: "Collections" },
        desktop: "/realizacje/dab/gallery-desktop.webp",
        mobile: "/realizacje/dab/gallery-mobile.webp",
      },
      {
        key: "order",
        label: { pl: "Formularz wyceny", en: "Quote form" },
        desktop: "/realizacje/dab/order-desktop.webp",
        mobile: "/realizacje/dab/order-mobile.webp",
      },
    ],
    intro: {
      pl: "Manufaktura mebli na zamówienie chciała witryny, która podkreśli rzemiosło i jakość materiałów oraz uprości zbieranie zapytań o wycenę projektów B2B i B2C.",
      en: "A bespoke furniture workshop wanted a site that highlights craftsmanship and material quality, and simplifies collecting quote requests for B2B and B2C projects.",
    },
    results: [
      {
        metric: { pl: "0,9 s", en: "0.9 s" },
        label: {
          pl: "Czas ładowania strony głównej",
          en: "Home page load time",
        },
      },
      {
        metric: { pl: "+30%", en: "+30%" },
        label: {
          pl: "Więcej zapytań z formularza wyceny",
          en: "More quote-form enquiries",
        },
      },
      {
        metric: { pl: "4 tyg.", en: "4 wk" },
        label: { pl: "Pełna realizacja projektu", en: "Full project delivery" },
      },
    ],
    quote: {
      pl: "Wreszcie strona, która wygląda jak nasze meble — prosto, mocno i bez zbędnych ozdobników. Zapytania o wyceny ruszyły od pierwszego tygodnia.",
      en: "Finally a site that looks like our furniture — simple, strong, no needless ornament. Quote requests started coming in from the very first week.",
    },
    author: "Tomasz Wiśniewski",
    role: { pl: "Założyciel, Dąb & Forma", en: "Founder, Dąb & Forma" },
    scope: {
      pl: [
        "Projekt UI/UX",
        "Wdrożenie frontendowe",
        "Katalog produktów",
        "Formularz wyceny",
      ],
      en: ["UI/UX design", "Frontend build", "Product catalogue", "Quote form"],
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
    screens: [
      {
        key: "home",
        label: { pl: "Strona główna", en: "Home" },
        desktop: "/realizacje/sielski/desktop.webp",
        mobile: "/realizacje/sielski/mobile.webp",
      },
      {
        key: "gallery",
        label: { pl: "Atrakcje", en: "Attractions" },
        desktop: "/realizacje/sielski/gallery-desktop.webp",
        mobile: "/realizacje/sielski/gallery-mobile.webp",
      },
      {
        key: "order",
        label: { pl: "Rezerwacja noclegu", en: "Stay booking" },
        desktop: "/realizacje/sielski/order-desktop.webp",
        mobile: "/realizacje/sielski/order-mobile.webp",
      },
    ],
    intro: {
      pl: "Gospodarstwo agroturystyczne potrzebowało ciepłej, klimatycznej strony, która sprzeda spokój wsi i pozwoli gościom rezerwować pobyt bezpośrednio — z pominięciem prowizji portali.",
      en: "A countryside guesthouse needed a warm, atmospheric site that sells the calm of the countryside and lets guests book their stay directly — skipping portal commissions.",
    },
    results: [
      {
        metric: { pl: "+55%", en: "+55%" },
        label: {
          pl: "Rezerwacji bezpośrednich (bez portali)",
          en: "Direct bookings (no portals)",
        },
      },
      {
        metric: { pl: "4,9/5", en: "4.9/5" },
        label: {
          pl: "Średnia ocena gości po pobycie",
          en: "Average guest rating after stay",
        },
      },
      {
        metric: { pl: "3 tyg.", en: "3 wk" },
        label: {
          pl: "Od briefu do startu sezonu",
          en: "From brief to season launch",
        },
      },
    ],
    quote: {
      pl: "Goście mówią, że zakochali się w nas już na stronie. Rezerwują wprost u nas, więc nie oddajemy prowizji portalom.",
      en: "Guests say they fell in love with us on the website already. They book directly with us, so we don't hand commissions to portals.",
    },
    author: "Anna i Piotr Górscy",
    role: { pl: "Gospodarze, Sielski Zakątek", en: "Hosts, Sielski Zakątek" },
    scope: {
      pl: [
        "Projekt UI/UX",
        "Wdrożenie frontendowe",
        "Kalendarz rezerwacji",
        "Sesja & galeria zdjęć",
      ],
      en: [
        "UI/UX design",
        "Frontend build",
        "Booking calendar",
        "Photo shoot & gallery",
      ],
    },
  },
];

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
  img: { desktop: string; mobile: string };
  href?: string;
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
    img: p.img,
    href: p.href,
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
