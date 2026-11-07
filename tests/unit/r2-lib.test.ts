// Czysta logika skryptów R2 (scripts/r2/lib.mjs, punkt M3): mapowanie URL-i
// z JSON-ów na klucze bucketa, różnica bucket↔treść, MIME, endpoint EU,
// poświadczenia z env. Bez sieci — przebieg „na sucho" przeciw prawdziwemu
// bucketowi robi Mateusz (docs/optional-todos.md §4.5).
import { describe, expect, it } from "vitest";
import {
  DEFAULT_PREFIX,
  ENV,
  collectMediaUrls,
  contentTypeFor,
  diffKeys,
  keyToUrl,
  planUpload,
  r2Endpoint,
  readCredentials,
  urlToKey,
} from "../../scripts/r2/lib.mjs";
import { readRealizacjaRaw, realizacjeFiles } from "../helpers/realizacje";

describe("collectMediaUrls + urlToKey", () => {
  it("wyciąga unikalne URL-e mediów z tekstu JSON-ów i mapuje na klucze", () => {
    const a = JSON.stringify({
      screens: [
        {
          desktop:
            "https://media.hadrianm.pl/realizacje/delung-home-desktop.webp",
          mobile:
            "https://media.hadrianm.pl/realizacje/delung-home-mobile.webp",
          video: {
            desktop:
              "https://media.hadrianm.pl/realizacje/delung-home-desktop.mp4",
            mobile:
              "https://media.hadrianm.pl/realizacje/delung-home-mobile.mp4",
          },
        },
      ],
      liveUrl: "https://delung.pl",
    });
    const b = JSON.stringify({
      // duplikat + inny wpis
      desktop: "https://media.hadrianm.pl/realizacje/delung-home-desktop.webp",
      mobile: "https://media.hadrianm.pl/realizacje/eha-home-mobile.webp",
    });
    const urls = collectMediaUrls([a, b]);
    expect(urls).toHaveLength(5);
    expect(urls.every((u) => u.startsWith("https://media.hadrianm.pl/"))).toBe(
      true,
    );
    expect(urls).not.toContain("https://delung.pl");
    expect(urls.map(urlToKey)).toEqual([
      "realizacje/delung-home-desktop.mp4",
      "realizacje/delung-home-desktop.webp",
      "realizacje/delung-home-mobile.mp4",
      "realizacje/delung-home-mobile.webp",
      "realizacje/eha-home-mobile.webp",
    ]);
  });

  it("dekoduje %XX w kluczu i odrzuca URL-e spoza domeny mediów", () => {
    expect(
      urlToKey("https://media.hadrianm.pl/realizacje/Zdj%C4%99cie%201.webp"),
    ).toBe("realizacje/Zdjęcie 1.webp");
    expect(() => urlToKey("https://hadrianm.pl/realizacje/x.webp")).toThrow(
      /Nie-mediowy/,
    );
  });

  it("keyToUrl jest odwrotnością urlToKey (także dla nazw ze spacją i polskimi znakami)", () => {
    for (const key of [
      "realizacje/a-b.webp",
      "realizacje/Zdjęcie 1.webp",
      "realizacje/x y.mp4",
    ]) {
      expect(urlToKey(keyToUrl(key))).toBe(key);
    }
  });

  it("URL-e z prawdziwych wpisów (jeśli są) mapują się na klucze pod prefixem uploadu", () => {
    // Pusta lista = brak wpisów (stan dopuszczalny, sygnał daje cms-contract).
    const texts = realizacjeFiles().map(readRealizacjaRaw);
    for (const key of collectMediaUrls(texts).map(urlToKey)) {
      expect(key.startsWith(DEFAULT_PREFIX)).toBe(true);
      expect(key).not.toMatch(/\/\//);
    }
  });
});

describe("diffKeys", () => {
  it("sieroty = w buckecie bez użycia; brakujące = użyte bez obiektu; posortowane", () => {
    const bucket = [
      "realizacje/z.webp",
      "realizacje/a.webp",
      "realizacje/b.mp4",
      "realizacje/old.webp",
    ];
    const used = [
      "realizacje/a.webp",
      "realizacje/b.mp4",
      "realizacje/gone.webp",
    ];
    expect(diffKeys(bucket, used)).toEqual({
      orphans: ["realizacje/old.webp", "realizacje/z.webp"],
      missing: ["realizacje/gone.webp"],
    });
  });

  it("pusta treść → wszystko w buckecie jest sierotą (raport, nie kasowanie — pilnuje skrypt)", () => {
    expect(diffKeys(["realizacje/a.webp"], [])).toEqual({
      orphans: ["realizacje/a.webp"],
      missing: [],
    });
  });
});

describe("contentTypeFor", () => {
  it.each([
    ["x.webp", "image/webp"],
    ["X.WEBP", "image/webp"],
    ["loop-desktop.mp4", "video/mp4"],
    ["a.jpg", "image/jpeg"],
    ["a.jpeg", "image/jpeg"],
    ["a.png", "image/png"],
    ["a.svg", "image/svg+xml"],
    ["a.webm", "video/webm"],
    ["a.avif", "image/avif"],
    ["a.bin", "application/octet-stream"],
    ["noext", "application/octet-stream"],
  ])("%s → %s", (name, mime) => {
    expect(contentTypeFor(name)).toBe(mime);
  });
});

describe("r2Endpoint", () => {
  it("domyślnie jurysdykcja EU (bucket hadrianm-media; bez .eu. R2 odpowiada 403 — P-64)", () => {
    expect(r2Endpoint("abc123")).toBe(
      "https://abc123.eu.r2.cloudflarestorage.com",
    );
    expect(r2Endpoint("abc123", "default")).toBe(
      "https://abc123.r2.cloudflarestorage.com",
    );
  });
});

describe("readCredentials — dwa tokeny (DEC-115)", () => {
  const env = {
    [ENV.account]: "acc",
    [ENV.read.id]: "rid",
    [ENV.read.secret]: "rsec",
    [ENV.write.id]: "wid",
    [ENV.write.secret]: "wsec",
  };

  it("domyślnie bierze token tylko-do-odczytu, z write: true token z zapisem", () => {
    expect(readCredentials(env)).toEqual({
      accountId: "acc",
      accessKeyId: "rid",
      secretAccessKey: "rsec",
    });
    expect(readCredentials(env, { write: true })).toEqual({
      accountId: "acc",
      accessKeyId: "wid",
      secretAccessKey: "wsec",
    });
  });

  it("brak zmiennej → błąd wymienia NAZWY brakujących zmiennych, nie wartości", () => {
    const partial = { [ENV.account]: "acc", [ENV.read.id]: "rid" };
    expect(() => readCredentials(partial)).toThrow(ENV.read.secret);
    expect(() => readCredentials(partial, { write: true })).toThrow(
      ENV.write.id,
    );
    expect(() => readCredentials(partial, { write: true })).toThrow(
      ENV.write.secret,
    );
    expect(() => readCredentials(partial)).not.toThrow(/rid|acc/);
  });
});

describe("planUpload", () => {
  it("klucz = prefix + nazwa pliku (płasko), MIME z rozszerzenia, URL publiczny", () => {
    const plan = planUpload([
      "/tmp/out/delung-home-desktop.mp4",
      "/tmp/out/screens/delung-home-desktop.webp",
    ]);
    expect(plan).toEqual([
      {
        file: "/tmp/out/delung-home-desktop.mp4",
        key: "realizacje/delung-home-desktop.mp4",
        contentType: "video/mp4",
        url: "https://media.hadrianm.pl/realizacje/delung-home-desktop.mp4",
      },
      {
        file: "/tmp/out/screens/delung-home-desktop.webp",
        key: "realizacje/delung-home-desktop.webp",
        contentType: "image/webp",
        url: "https://media.hadrianm.pl/realizacje/delung-home-desktop.webp",
      },
    ]);
  });

  it("normalizuje prefix (bez wiodącego /, z jednym / na końcu) i wykrywa kolizję nazw", () => {
    expect(planUpload(["a.webp"], "/foo")[0].key).toBe("foo/a.webp");
    expect(planUpload(["a.webp"], "foo//")[0].key).toBe("foo/a.webp");
    expect(() => planUpload(["x/a.webp", "y/a.webp"])).toThrow(
      /jednym kluczem/,
    );
  });
});
