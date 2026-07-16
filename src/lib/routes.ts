import type { Lang } from "@/i18n/utils";

// Ścieżki stron w obu językach — jedno źródło prawdy dla Navbara, sekcji
// Work (przyciski „Więcej realizacji") i plików w src/pages. Slugi EN są
// tłumaczone (konwencja: polityka-prywatnosci ↔ privacy-policy).
export const HOME_PATH: Record<Lang, string> = {
  pl: "/",
  en: "/en/",
};

export const WORK_INDEX_PATH: Record<Lang, string> = {
  pl: "/realizacje/",
  en: "/en/projects/",
};

export const AUDIENCE_PATH: Record<Lang, string> = {
  pl: "/dla-kogo/",
  en: "/en/who-its-for/",
};
