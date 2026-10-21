// Wpisy kolekcji realizacji czytane wprost z plików JSON — tak samo, jak robi
// to build. Testy dzięki temu nie hardkodują treści CMS-a: liczą to, co realnie
// leży w repo.
//
// KATALOG MOŻE NIE ISTNIEĆ. Git nie przechowuje pustych katalogów, więc
// usunięcie w panelu ostatniej realizacji kasuje cały `src/content/realizacje`.
// Goły `readdirSync` przy ładowaniu modułu wywraca wtedy plik testowy PRZED
// uruchomieniem czegokolwiek (`ENOENT: scandir` w `quality` i `prod-smoke`
// zamiast informacji „nie ma treści" — incydent w delung-web, 2026-08-06).
// Build tego stanu nie ma za złe: strona buduje się i deployuje bez wpisów,
// tylko z pustą listą i pustą sekcją #work.
//
// To NIE jest fixture testów wizualnych (`tests/fixtures/realizacje`,
// `pnpm build:visual`) — tamten jest zamrożony i niezależny od treści
// produkcyjnej. Reguła: `.claude/rules/testing.md`.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export const REALIZACJE_DIR = fileURLToPath(
  new URL("../../src/content/realizacje", import.meta.url),
);

/** Nazwy plików wpisów (posortowane); pusta tablica, gdy katalogu nie ma. */
export function realizacjeFiles(): string[] {
  if (!existsSync(REALIZACJE_DIR)) return [];
  return readdirSync(REALIZACJE_DIR)
    .filter((name) => name.endsWith(".json"))
    .sort();
}

/** Surowa treść wpisu (tekst pliku, bez parsowania). */
export function readRealizacjaRaw(name: string): string {
  return readFileSync(join(REALIZACJE_DIR, name), "utf8");
}

/** Wpis sparsowany z JSON-a. */
export function readRealizacja<T>(name: string): T {
  return JSON.parse(readRealizacjaRaw(name)) as T;
}

/** Wpisy posortowane jak na stronie (rosnąco po `order`) — [0] to pierwsza
 *  karta galerii/karuzeli/siatki, w którą klikają testy nakładek. */
export function readRealizacje<T extends { order?: number }>(): T[] {
  return realizacjeFiles()
    .map((name) => readRealizacja<T>(name))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

/** Pętla wideo pierwszego ekranu pierwszego wpisu (albo undefined) — testy
 *  odtwarzania są warunkowe: dziś żaden wpis nie ma wideo, więc sprawdzają
 *  tylko, że kod „ślepy" nie dodaje <video> do nakładki. */
export function firstScreenVideo():
  | { desktop: string; mobile: string }
  | undefined {
  const first = readRealizacje<{
    order?: number;
    screens?: { video?: { desktop: string; mobile: string } }[];
  }>()[0];
  return first?.screens?.[0]?.video;
}

/** Ile realizacji pokazuje sekcja #work na stronie głównej (kap z Work.astro). */
export const HOME_MAX = 3;
