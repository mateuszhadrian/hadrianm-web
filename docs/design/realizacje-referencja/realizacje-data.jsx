// realizacje-data.jsx — dane realizacji + treść modala + paleta "Czerwona Mgła"
// Export: REALIZACJE, RZ_THEME

const RZ_THEME = {
  bg: '#0A0709',
  ink: '#F5F0EC',
  muted: 'rgba(245,240,236,0.58)',
  faint: 'rgba(245,240,236,0.34)',
  line: 'rgba(245,240,236,0.14)',
  accent: '#FF5A47',
  glowRGB: '255,90,71',
  glow: 'rgba(255,90,71,0.20)',
  display: "'Archivo', sans-serif",
  body: "'Archivo', sans-serif",
  serif: "'Instrument Serif', Georgia, serif",
  mono: "ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
  blobs: [
    { x: 0.60, y: -0.10, r: 0.46, c: 'rgba(214,38,38,0.55)' },
    { x: 0.90, y: 0.30, r: 0.30, c: 'rgba(255,90,71,0.26)' },
    { x: 0.04, y: 0.78, r: 0.34, c: 'rgba(130,20,32,0.42)' },
  ],
};

const REALIZACJE = [
  {
    id: 'aura',
    name: 'Aura Aesthetics',
    category: 'Moda & Beauty',
    blurb: 'Gabinet medycyny estetycznej — delikatna, elegancka odsłona marki premium.',
    tags: ['Rezerwacja online', 'Nowoczesny UI', 'Wzrost zapytań'],
    desktop: 'realizacje/img/aura-home-d.jpg',
    mobile: 'realizacje/img/aura-home-m.jpg',
    year: '2025',
    // 3 ekrany do modala: Strona główna / Galeria / Rezerwacja
    screens: [
      { label: 'Strona główna', desktop: 'realizacje/img/aura-home-d.jpg', mobile: 'realizacje/img/aura-home-m.jpg' },
      { label: 'Galeria zabiegów', desktop: 'realizacje/img/aura-gallery-d.jpg', mobile: 'realizacje/img/aura-gallery-m.jpg' },
      { label: 'Rezerwacja online', desktop: 'realizacje/img/aura-order-d.jpg', mobile: 'realizacje/img/aura-order-m.jpg' },
    ],
    intro: 'Klientka prowadząca gabinet medycyny estetycznej potrzebowała strony, która odda premium charakter marki i pozwoli pacjentkom rezerwować wizyty online — bez telefonów i wiadomości.',
    results: [
      { metric: '98/100', label: 'Wynik w Google PageSpeed (mobile)' },
      { metric: '+42%', label: 'Więcej rezerwacji online w 3 miesiące' },
      { metric: '3 tyg.', label: 'Od projektu do publikacji' },
    ],
    quote: 'Strona wygląda dokładnie tak elegancko jak mój gabinet. Pacjentki same się zapisują, a ja mam więcej czasu dla nich.',
    author: 'Marta Kowalczyk',
    role: 'Właścicielka, Aura Aesthetics',
    scope: ['Projekt UI/UX', 'Wdrożenie frontendowe', 'System rezerwacji', 'Optymalizacja SEO'],
    liveUrl: '#',
  },
  {
    id: 'dab',
    name: 'Dąb & Forma',
    category: 'Wnętrza & Meble',
    blurb: 'Manufaktura mebli z litego drewna — surowy, architektoniczny minimalizm.',
    tags: ['Szybkość ładowania', 'Katalog produktów', 'Mocna typografia'],
    desktop: 'realizacje/img/dab-home-d.jpg',
    mobile: 'realizacje/img/dab-home-m.jpg',
    year: '2025',
    screens: [
      { label: 'Strona główna', desktop: 'realizacje/img/dab-home-d.jpg', mobile: 'realizacje/img/dab-home-m.jpg' },
      { label: 'Kolekcje', desktop: 'realizacje/img/dab-gallery-d.jpg', mobile: 'realizacje/img/dab-gallery-m.jpg' },
      { label: 'Formularz wyceny', desktop: 'realizacje/img/dab-order-d.jpg', mobile: 'realizacje/img/dab-order-m.jpg' },
    ],
    intro: 'Manufaktura mebli na zamówienie chciała witryny, która podkreśli rzemiosło i jakość materiałów oraz uprości zbieranie zapytań o wycenę projektów B2B i B2C.',
    results: [
      { metric: '0,9 s', label: 'Czas ładowania strony głównej' },
      { metric: '+30%', label: 'Więcej zapytań z formularza wyceny' },
      { metric: '4 tyg.', label: 'Pełna realizacja projektu' },
    ],
    quote: 'Wreszcie strona, która wygląda jak nasze meble — prosto, mocno i bez zbędnych ozdobników. Zapytania o wyceny ruszyły od pierwszego tygodnia.',
    author: 'Tomasz Wiśniewski',
    role: 'Założyciel, Dąb & Forma',
    scope: ['Projekt UI/UX', 'Wdrożenie frontendowe', 'Katalog produktów', 'Formularz wyceny'],
    liveUrl: '#',
  },
  {
    id: 'sielski',
    name: 'Sielski Zakątek',
    category: 'Turystyka & Wypoczynek',
    blurb: 'Agroturystyka w sercu gór — ciepły, rustykalny klimat i prosta rezerwacja.',
    tags: ['Kalendarz rezerwacji', 'Galeria zdjęć', 'Zwiększona konwersja'],
    desktop: 'realizacje/img/sielski-home-d.jpg',
    mobile: 'realizacje/img/sielski-home-m.jpg',
    year: '2024',
    screens: [
      { label: 'Strona główna', desktop: 'realizacje/img/sielski-home-d.jpg', mobile: 'realizacje/img/sielski-home-m.jpg' },
      { label: 'Atrakcje', desktop: 'realizacje/img/sielski-gallery-d.jpg', mobile: 'realizacje/img/sielski-gallery-m.jpg' },
      { label: 'Rezerwacja noclegu', desktop: 'realizacje/img/sielski-order-d.jpg', mobile: 'realizacje/img/sielski-order-m.jpg' },
    ],
    intro: 'Gospodarstwo agroturystyczne potrzebowało ciepłej, klimatycznej strony, która sprzeda spokój wsi i pozwoli gościom rezerwować pobyt bezpośrednio — z pominięciem prowizji portali.',
    results: [
      { metric: '+55%', label: 'Rezerwacji bezpośrednich (bez portali)' },
      { metric: '4,9/5', label: 'Średnia ocena gości po pobycie' },
      { metric: '3 tyg.', label: 'Od briefu do startu sezonu' },
    ],
    quote: 'Goście mówią, że zakochali się w nas już na stronie. Rezerwują wprost u nas, więc nie oddajemy prowizji portalom.',
    author: 'Anna i Piotr Górscy',
    role: 'Gospodarze, Sielski Zakątek',
    scope: ['Projekt UI/UX', 'Wdrożenie frontendowe', 'Kalendarz rezerwacji', 'Sesja & galeria zdjęć'],
    liveUrl: '#',
  },
];

Object.assign(window, { REALIZACJE, RZ_THEME });
