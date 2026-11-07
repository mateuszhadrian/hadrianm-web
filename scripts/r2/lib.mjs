// Czysta logika skryptów R2 (M3 backlogu ewolucji): mapowanie URL-i mediów
// z JSON-ów realizacji na klucze obiektów w buckecie, różnica „bucket vs
// treść" (sieroty / brakujące), typy MIME z rozszerzenia, endpoint S3 dla
// jurysdykcji EU, odczyt poświadczeń z env. ZERO sieci i ZERO fs — wszystko
// testowalne w tests/unit/r2-lib.test.ts bez bucketa. Sieć robią skrypty
// r2-orphans.mjs i upload-r2.mjs (klient S3 podawany jako parametr, jak
// w hetmannieruchomosci-web/scripts/sync/r2.ts).

/** Publiczna domena mediów (reguła cms-realizacje.md). */
export const MEDIA_HOST = "https://media.hadrianm.pl";
/** Prefix uploadu Sveltii — zdjęcia i MP4 płasko w jednym katalogu (P-65). */
export const DEFAULT_PREFIX = "realizacje/";
/** Bucket produkcyjny. */
export const BUCKET = "hadrianm-media";
/** Ten sam regex, co test mediów (tests/unit/media-r2.test.ts). */
export const MEDIA_URL_RE = /https:\/\/media\.hadrianm\.pl\/[^"\s]+/g;

/**
 * Wszystkie URL-e mediów z surowych tekstów JSON-ów wpisów (unikalne,
 * posortowane). Czyta TEKST, nie sparsowany obiekt — niezależne od schematu
 * (nowe pole z URL-em w przyszłości też się załapie).
 * @param {Iterable<string>} texts
 * @returns {string[]}
 */
export function collectMediaUrls(texts) {
  const urls = new Set();
  for (const raw of texts) {
    for (const m of raw.matchAll(MEDIA_URL_RE)) urls.add(m[0]);
  }
  return [...urls].sort();
}

/**
 * URL publiczny → klucz obiektu w buckecie (bez wiodącego `/`, zdekodowany
 * — Sveltia slugifikuje nazwy od M1, ale starsze pliki mogą mieć %XX).
 * @param {string} url
 * @returns {string}
 */
export function urlToKey(url) {
  const u = new URL(url);
  if (`${u.protocol}//${u.host}` !== MEDIA_HOST) {
    throw new Error(`Nie-mediowy URL: ${url}`);
  }
  return decodeURIComponent(u.pathname.replace(/^\/+/, ""));
}

/**
 * Klucz obiektu → URL publiczny (segmenty enkodowane jak robi to przeglądarka).
 * @param {string} key
 * @returns {string}
 */
export function keyToUrl(key) {
  return `${MEDIA_HOST}/${key.split("/").map(encodeURIComponent).join("/")}`;
}

/**
 * Różnica bucket ↔ treść.
 * - `orphans`: obiekty w buckecie, do których nie prowadzi żaden URL
 *   z JSON-ów (Sveltia nie kasuje plików przy usuwaniu wpisu — P-62).
 * - `missing`: URL-e z JSON-ów bez obiektu w buckecie (złamane media —
 *   to samo, co łapie `CHECK_REMOTE_MEDIA=1`, ale bez HEAD-ów).
 * @param {Iterable<string>} bucketKeys
 * @param {Iterable<string>} usedKeys
 * @returns {{ orphans: string[]; missing: string[] }}
 */
export function diffKeys(bucketKeys, usedKeys) {
  const bucket = new Set(bucketKeys);
  const used = new Set(usedKeys);
  return {
    orphans: [...bucket].filter((k) => !used.has(k)).sort(),
    missing: [...used].filter((k) => !bucket.has(k)).sort(),
  };
}

const MIME = {
  webp: "image/webp",
  avif: "image/avif",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  svg: "image/svg+xml",
  mp4: "video/mp4",
  webm: "video/webm",
};

/**
 * `ContentType` z rozszerzenia (R2 nie zgaduje — bez tego przeglądarka
 * dostaje `application/octet-stream` i `<video>` nie gra).
 * @param {string} filename
 * @returns {string}
 */
export function contentTypeFor(filename) {
  const ext = filename.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? "";
  return MIME[ext] ?? "application/octet-stream";
}

/**
 * Endpoint S3 bucketa R2. Bucket `hadrianm-media` jest w jurysdykcji EU —
 * domyślny endpoint (bez `.eu.`) odpowiada 403 niezależnie od tokenu (P-64).
 * @param {string} accountId
 * @param {"eu" | "default" | "fedramp"} [jurisdiction]
 * @returns {string}
 */
export function r2Endpoint(accountId, jurisdiction = "eu") {
  const seg = jurisdiction === "default" ? "" : `${jurisdiction}.`;
  return `https://${accountId}.${seg}r2.cloudflarestorage.com`;
}

/** Nazwy zmiennych środowiskowych (źródło prawdy dla docs/optional-todos.md). */
export const ENV = {
  account: "R2_ACCOUNT_ID",
  read: { id: "R2_ACCESS_KEY_ID", secret: "R2_SECRET_ACCESS_KEY" },
  write: { id: "R2_WRITE_ACCESS_KEY_ID", secret: "R2_WRITE_SECRET_ACCESS_KEY" },
};

/**
 * Poświadczenia z env. Dwa tokeny (decyzja Mateusza 2026-11-07, DEC-115):
 * tylko-do-odczytu do raportów i backupu, osobny z zapisem do uploadu
 * i kasowania — raport sierot fizycznie nie może nic skasować. Wartości
 * NIE są logowane; przy braku zmiennej błąd wymienia NAZWY do uzupełnienia.
 * @param {Record<string, string | undefined>} env
 * @param {{ write?: boolean }} [opts]
 * @returns {{ accountId: string; accessKeyId: string; secretAccessKey: string }}
 */
export function readCredentials(env, opts = {}) {
  const pair = opts.write ? ENV.write : ENV.read;
  const missing = [ENV.account, pair.id, pair.secret].filter((n) => !env[n]);
  if (missing.length) {
    throw new Error(
      `Brak zmiennych w .env: ${missing.join(", ")} ` +
        `(token ${opts.write ? "Object Read & Write" : "Object Read"} dla bucketa ${BUCKET}; ` +
        "procedura: docs/optional-todos.md §4.3).",
    );
  }
  return {
    accountId: /** @type {string} */ (env[ENV.account]),
    accessKeyId: /** @type {string} */ (env[pair.id]),
    secretAccessKey: /** @type {string} */ (env[pair.secret]),
  };
}

/**
 * Rozmiar czytelny dla człowieka (raport).
 * @param {number} n
 * @returns {string}
 */
export function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

/**
 * Plan uploadu: lokalna ścieżka → klucz pod prefixem (sama nazwa pliku,
 * płasko — jak Sveltia, P-65) + MIME. Duplikaty nazw to błąd (dwa pliki
 * trafiłyby pod jeden klucz).
 * @param {string[]} files ścieżki lokalne
 * @param {string} [prefix]
 * @returns {{ file: string; key: string; contentType: string; url: string }[]}
 */
export function planUpload(files, prefix = DEFAULT_PREFIX) {
  const pfx = prefix.replace(/^\/+/, "").replace(/\/*$/, "/");
  const seen = new Map();
  const plan = files.map((file) => {
    const name = file.split(/[\\/]/).pop() ?? file;
    const key = `${pfx}${name}`;
    if (seen.has(key)) {
      throw new Error(
        `Dwa pliki pod jednym kluczem ${key}: ${seen.get(key)} i ${file}`,
      );
    }
    seen.set(key, file);
    return { file, key, contentType: contentTypeFor(name), url: keyToUrl(key) };
  });
  return plan;
}
