import type { Lang } from "./utils";

export interface NavItem {
  id: string;
  pl: string;
  en: string;
}

export const navItems: NavItem[] = [
  { id: "audience", pl: "Dla kogo", en: "Who it's for" },
  { id: "services", pl: "Oferta", en: "Services" },
  { id: "work", pl: "Realizacje", en: "Work" },
  { id: "about", pl: "O mnie", en: "About" },
  { id: "faq", pl: "FAQ", en: "FAQ" },
  { id: "contact", pl: "Kontakt", en: "Contact" },
];

export function navLabel(item: NavItem, lang: Lang): string {
  return lang === "en" ? item.en : item.pl;
}
