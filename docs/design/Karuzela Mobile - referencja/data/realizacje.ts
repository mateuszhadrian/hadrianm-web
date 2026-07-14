// realizacje.ts — dane realizacji (źródło prawdy dla karuzeli i modala).
// Ścieżki obrazów to same nazwy plików; bazę katalogu podaje komponent (prop `imgBase`).

export interface Screen {
  label: string;
  desktop: string;
  mobile: string;
}

export interface Result {
  metric: string;
  label: string;
}

export interface Realizacja {
  id: string;
  name: string;
  category: string;
  year: string;
  blurb: string;
  home: { desktop: string; mobile: string };
  screens: Screen[];
  intro: string;
  results: Result[];
  quote: string;
  author: string;
  role: string;
  scope: string[];
  liveUrl: string;
}

export const REALIZACJE: Realizacja[] = [
  {
    id: 'aura',
    name: 'Aura Aesthetics',
    category: 'Moda & Beauty',
    year: '2025',
    blurb: 'Gabinet medycyny estetycznej — delikatna, elegancka odsłona marki premium.',
    home: { desktop: 'aura-home-d.jpg', mobile: 'aura-home-m.jpg' },
    screens: [
      { label: 'Strona główna', desktop: 'aura-home-d.jpg', mobile: 'aura-home-m.jpg' },
      { label: 'Galeria zabiegów', desktop: 'aura-gallery-d.jpg', mobile: 'aura-gallery-m.jpg' },
      { label: 'Rezerwacja online', desktop: 'aura-order-d.jpg', mobile: 'aura-order-m.jpg' },
    ],
    intro:
      'Klientka prowadząca gabinet medycyny estetycznej potrzebowała strony, która odda premium charakter marki i pozwoli pacjentkom rezerwować wizyty online — bez telefonów i wiadomości.',
    results: [
      { metric: '98/100', label: 'Wynik w Google PageSpeed (mobile)' },
      { metric: '+42%', label: 'Więcej rezerwacji online w 3 miesiące' },
      { metric: '3 tyg.', label: 'Od projektu do publikacji' },
    ],
    quote:
      'Strona wygląda dokładnie tak elegancko jak mój gabinet. Pacjentki same się zapisują, a ja mam więcej czasu dla nich.',
    author: 'Marta Kowalczyk',
    role: 'Właścicielka, Aura Aesthetics',
    scope: ['Projekt UI/UX', 'Wdrożenie frontendowe', 'System rezerwacji', 'Optymalizacja SEO'],
    liveUrl: '#',
  },
  {
    id: 'dab',
    name: 'Dąb & Forma',
    category: 'Wnętrza & Meble',
    year: '2025',
    blurb: 'Manufaktura mebli z litego drewna — surowy, architektoniczny minimalizm.',
    home: { desktop: 'dab-home-d.jpg', mobile: 'dab-home-m.jpg' },
    screens: [
      { label: 'Strona główna', desktop: 'dab-home-d.jpg', mobile: 'dab-home-m.jpg' },
      { label: 'Kolekcje', desktop: 'dab-gallery-d.jpg', mobile: 'dab-gallery-m.jpg' },
      { label: 'Formularz wyceny', desktop: 'dab-order-d.jpg', mobile: 'dab-order-m.jpg' },
    ],
    intro:
      'Manufaktura mebli na zamówienie chciała witryny, która podkreśli rzemiosło i jakość materiałów oraz uprości zbieranie zapytań o wycenę projektów B2B i B2C.',
    results: [
      { metric: '0,9 s', label: 'Czas ładowania strony głównej' },
      { metric: '+30%', label: 'Więcej zapytań z formularza wyceny' },
      { metric: '4 tyg.', label: 'Pełna realizacja projektu' },
    ],
    quote:
      'Wreszcie strona, która wygląda jak nasze meble — prosto, mocno i bez zbędnych ozdobników. Zapytania o wyceny ruszyły od pierwszego tygodnia.',
    author: 'Tomasz Wiśniewski',
    role: 'Założyciel, Dąb & Forma',
    scope: ['Projekt UI/UX', 'Wdrożenie frontendowe', 'Katalog produktów', 'Formularz wyceny'],
    liveUrl: '#',
  },
  {
    id: 'sielski',
    name: 'Sielski Zakątek',
    category: 'Turystyka & Wypoczynek',
    year: '2024',
    blurb: 'Agroturystyka w sercu gór — ciepły, rustykalny klimat i prosta rezerwacja.',
    home: { desktop: 'sielski-home-d.jpg', mobile: 'sielski-home-m.jpg' },
    screens: [
      { label: 'Strona główna', desktop: 'sielski-home-d.jpg', mobile: 'sielski-home-m.jpg' },
      { label: 'Atrakcje', desktop: 'sielski-gallery-d.jpg', mobile: 'sielski-gallery-m.jpg' },
      { label: 'Rezerwacja noclegu', desktop: 'sielski-order-d.jpg', mobile: 'sielski-order-m.jpg' },
    ],
    intro:
      'Gospodarstwo agroturystyczne potrzebowało ciepłej, klimatycznej strony, która sprzeda spokój wsi i pozwoli gościom rezerwować pobyt bezpośrednio — z pominięciem prowizji portali.',
    results: [
      { metric: '+55%', label: 'Rezerwacji bezpośrednich (bez portali)' },
      { metric: '4,9/5', label: 'Średnia ocena gości po pobycie' },
      { metric: '3 tyg.', label: 'Od briefu do startu sezonu' },
    ],
    quote:
      'Goście mówią, że zakochali się w nas już na stronie. Rezerwują wprost u nas, więc nie oddajemy prowizji portalom.',
    author: 'Anna i Piotr Górscy',
    role: 'Gospodarze, Sielski Zakątek',
    scope: ['Projekt UI/UX', 'Wdrożenie frontendowe', 'Kalendarz rezerwacji', 'Sesja & galeria zdjęć'],
    liveUrl: '#',
  },
];
