// Skan ZBUDOWANEJ strony (`dist/`) — ostatnia linia obrony przed wyciekiem
// środowiska dev i błędem SEO do produkcji (T7, analiza ewolucji §6).
// Biega w jobie `quality` PO `pnpm build` (dist z treścią produkcyjną)
// i lokalnie w `/release-check` zamiast ręcznego grepa; przechodzi też na
// dist z `pnpm build:visual` (fixture realizacji nie zmienia zestawu stron).
//
// Sprawdza:
//  (a) żaden HTML nie odwołuje się do `localhost` / `127.0.0.1` ani portów
//      dev `4321` (astro dev) i `4399` (preview pod testy Playwrighta);
//  (b) żaden HTML nie zawiera pełnego adresu e-mail. Kontakt pokazuje
//      `info@•••••••••.••` i składa adres z fragmentów dopiero po kliknięciu
//      „[ POKAŻ ]" (contact-ui.ts `buildEmail`), polityka prywatności robi
//      to samo skryptem inline (PolicyPage.astro `[data-pp-mail]`), a stopka
//      nie ma `mailto:` — więc BEZ wyjątków: goły adres albo `mailto:` z
//      adresem w HTML to regresja antyscrapingu, nie „nowy wyjątek".
//      Szablon `mailto:${a}` w skrypcie inline nie jest adresem i nie łapie
//      się. Bundle JS/CSS sprawdza osobno `tests/e2e/contact.spec.ts`
//      („antyscraping…" — konkretne ciągi we WSZYSTKICH plikach dist);
//  (c) `robots.txt` (Disallow `/admin` + `Sitemap:` na domenie produkcyjnej)
//      i `sitemap-index.xml` → sitemapy potomne: każdy `<loc>` na domenie
//      z `site` w astro.config.mjs, a zbiór adresów = zbiór zbudowanych
//      stron poza `404.html` i `/admin/` (panel Sveltii z `public/`,
//      wykluczony w robots). Nowa strona bez wpisu w sitemapie (albo wpis
//      bez strony) świeci na czerwono.
//
// Komunikaty po polsku, z plikiem, linią i fragmentem — człowiek ma
// wiedzieć, CO wyciekło, bez otwierania dist.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";

const DIST = "dist";
/** Domena produkcyjna — ta sama co `site` w astro.config.mjs. */
const SITE = "https://hadrianm.pl";
/** Pliki HTML, których w sitemapie celowo NIE ma. */
const NOT_IN_SITEMAP = new Set(["404.html", "admin/index.html"]);

const DEV_HOST_RE = /\b(?:localhost|127\.0\.0\.1|0\.0\.0\.0)\b|:(?:4321|4399)\b/g;
const EMAIL_RE =
  /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g;

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir).sort()) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else out.push(path);
  }
  return out;
}

/** `dist/en/about/index.html` → `en/about/index.html` (zawsze z `/`). */
const rel = (file: string): string => relative(DIST, file).split(sep).join("/");

const htmlFiles = existsSync(DIST)
  ? walk(DIST).filter((f) => f.endsWith(".html"))
  : [];

/** Każde dopasowanie wzorca jako `plik:linia → „trafienie" w: …kontekst…`. */
function findAll(file: string, re: RegExp): string[] {
  const text = readFileSync(file, "utf8");
  const hits: string[] = [];
  for (const m of text.matchAll(re)) {
    const at = m.index ?? 0;
    const line = text.slice(0, at).split("\n").length;
    const ctx = text
      .slice(Math.max(0, at - 40), at + m[0].length + 40)
      .replace(/\s+/g, " ");
    hits.push(`${rel(file)}:${line} → „${m[0]}" w: …${ctx}…`);
  }
  return hits;
}

const locs = (xml: string): string[] =>
  [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

describe("dist/", () => {
  it("istnieje (najpierw `pnpm build` albo `pnpm build:visual`)", () => {
    expect(
      existsSync(join(DIST, "index.html")),
      "Brak dist/index.html — test:dist skanuje ZBUDOWANĄ stronę; uruchom " +
        "najpierw `pnpm build` (treść produkcyjna) albo `pnpm build:visual`.",
    ).toBe(true);
    expect(htmlFiles.length).toBeGreaterThan(0);
  });
});

describe("dist/**/*.html — wycieki środowiska dev", () => {
  it.skipIf(htmlFiles.length === 0)(
    "żaden HTML nie odwołuje się do localhost / 127.0.0.1 / portów dev 4321 i 4399",
    () => {
      const hits = htmlFiles.flatMap((f) => findAll(f, DEV_HOST_RE));
      expect(
        hits,
        `Adres środowiska dev w zbudowanym HTML (${hits.length}):\n` +
          hits.join("\n"),
      ).toEqual([]);
    },
  );

  it.skipIf(htmlFiles.length === 0)(
    "żaden HTML nie zawiera pełnego adresu e-mail (mechanizm [ POKAŻ ] składa go po kliknięciu)",
    () => {
      const hits = htmlFiles.flatMap((f) => findAll(f, EMAIL_RE));
      expect(
        hits,
        `Pełny adres e-mail w zbudowanym HTML (${hits.length}) — ` +
          "antyscraping wymaga składania z fragmentów (contact-ui.ts, " +
          "PolicyPage.astro):\n" +
          hits.join("\n"),
      ).toEqual([]);
    },
  );
});

describe("dist — robots.txt i sitemapa", () => {
  const robotsPath = join(DIST, "robots.txt");
  const indexPath = join(DIST, "sitemap-index.xml");

  it("robots.txt blokuje /admin i wskazuje sitemap-index.xml na domenie produkcyjnej", () => {
    expect(
      existsSync(robotsPath),
      "Brak dist/robots.txt — plik żyje w public/robots.txt.",
    ).toBe(true);
    const robots = readFileSync(robotsPath, "utf8");
    expect(robots, "robots.txt: brak `Disallow: /admin`").toMatch(
      /^Disallow: \/admin\s*$/m,
    );
    expect(
      robots,
      `robots.txt: brak \`Sitemap: ${SITE}/sitemap-index.xml\` (domena produkcyjna)`,
    ).toMatch(new RegExp(`^Sitemap: ${SITE}/sitemap-index\\.xml\\s*$`, "m"));
  });

  it("sitemap-index.xml wskazuje istniejące sitemapy potomne na domenie produkcyjnej", () => {
    expect(
      existsSync(indexPath),
      "Brak dist/sitemap-index.xml — integracja @astrojs/sitemap w " +
        "astro.config.mjs (wymaga `site`).",
    ).toBe(true);
    const children = locs(readFileSync(indexPath, "utf8"));
    expect(children.length, "sitemap-index.xml bez żadnego <loc>").toBeGreaterThan(0);
    for (const loc of children) {
      expect(
        loc,
        `sitemap-index.xml: „${loc}" nie leży na ${SITE} — sprawdź \`site\` w astro.config.mjs`,
      ).toMatch(new RegExp(`^${SITE}/sitemap-\\d+\\.xml$`));
      expect(
        existsSync(join(DIST, loc.slice(SITE.length))),
        `sitemap-index.xml wskazuje „${loc}", ale tego pliku nie ma w dist`,
      ).toBe(true);
    }
  });

  it.skipIf(!existsSync(indexPath))(
    "adresy w sitemapie = zbudowane strony (bez 404 i /admin/), wszystkie na domenie produkcyjnej",
    () => {
      const children = locs(readFileSync(indexPath, "utf8"))
        .map((loc) => join(DIST, loc.slice(SITE.length)))
        .filter(existsSync);
      const urls = children.flatMap((f) => locs(readFileSync(f, "utf8")));
      const offSite = urls.filter((u) => !u.startsWith(`${SITE}/`));
      expect(
        offSite,
        `Adresy poza ${SITE} w sitemapie (localhost? inna domena?):\n` +
          offSite.join("\n"),
      ).toEqual([]);

      const inSitemap = new Set(urls.map((u) => u.slice(SITE.length)));
      const built = new Set(
        htmlFiles
          .map(rel)
          .filter((p) => !NOT_IN_SITEMAP.has(p))
          .map((p) => "/" + p.replace(/index\.html$/, "")),
      );
      const missing = [...built].filter((p) => !inSitemap.has(p)).sort();
      const orphans = [...inSitemap].filter((p) => !built.has(p)).sort();
      expect(
        missing,
        "Zbudowane strony BEZ wpisu w sitemapie (nowa trasa? filtr " +
          "integracji sitemap? jeśli celowo — dopisz do NOT_IN_SITEMAP):\n" +
          missing.join("\n"),
      ).toEqual([]);
      expect(
        orphans,
        "Wpisy sitemapy bez zbudowanej strony (usunięta trasa?):\n" +
          orphans.join("\n"),
      ).toEqual([]);
    },
  );
});
