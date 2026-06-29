// realizacje-data.jsx — dane realizacji (testowe screenshoty) + paleta "Czerwona Mgła"
// Export: REALIZACJE, RZ_THEME

const RZ_THEME = {
  bg: "#0A0709",
  ink: "#F5F0EC",
  muted: "rgba(245,240,236,0.58)",
  faint: "rgba(245,240,236,0.34)",
  line: "rgba(245,240,236,0.14)",
  accent: "#FF5A47",
  glowRGB: "255,90,71",
  glow: "rgba(255,90,71,0.20)",
  display: "'Archivo', sans-serif",
  body: "'Archivo', sans-serif",
  serif: "'Instrument Serif', Georgia, serif",
  mono: "ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
  blobs: [
    { x: 0.6, y: -0.1, r: 0.46, c: "rgba(214,38,38,0.55)" },
    { x: 0.9, y: 0.3, r: 0.3, c: "rgba(255,90,71,0.26)" },
    { x: 0.04, y: 0.78, r: 0.34, c: "rgba(130,20,32,0.42)" },
  ],
};

const REALIZACJE = [
  {
    id: "aura",
    name: "Aura Aesthetics",
    category: "Moda & Beauty",
    blurb:
      "Gabinet medycyny estetycznej — delikatna, elegancka odsłona marki premium.",
    tags: ["Rezerwacja online", "Nowoczesny UI", "Wzrost zapytań"],
    desktop: "realizacje/img/aura-desktop.jpg",
    mobile: "realizacje/img/aura-mobile.jpg",
    year: "2025",
  },
  {
    id: "dab",
    name: "Dąb & Forma",
    category: "Wnętrza & Meble",
    blurb:
      "Manufaktura mebli z litego drewna — surowy, architektoniczny minimalizm.",
    tags: ["Szybkość ładowania", "Katalog produktów", "Mocna typografia"],
    desktop: "realizacje/img/dab-desktop.jpg",
    mobile: "realizacje/img/dab-mobile.jpg",
    year: "2025",
  },
  {
    id: "sielski",
    name: "Sielski Zakątek",
    category: "Turystyka & Wypoczynek",
    blurb:
      "Agroturystyka w sercu gór — ciepły, rustykalny klimat i prosta rezerwacja.",
    tags: ["Kalendarz rezerwacji", "Galeria zdjęć", "Zwiększona konwersja"],
    desktop: "realizacje/img/sielski-desktop.jpg",
    mobile: "realizacje/img/sielski-mobile.jpg",
    year: "2024",
  },
];

Object.assign(window, { REALIZACJE, RZ_THEME });
