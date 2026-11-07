// Upload plików do R2 (plan B z docs/analiza-realizacje-wideo.md §8, punkt M3
// backlogu): gdy pole `file`/`image` w panelu Sveltii zawiedzie albo trzeba
// wgrać komplet nagrań z ~/hadrianm-site-videos/<slug>/ jednym poleceniem.
// Klucz = <prefix><nazwa pliku> (płasko, jak Sveltia — P-65), `ContentType`
// z rozszerzenia (bez tego `<video>` z R2 nie gra). Istniejący obiekt NIE jest
// nadpisywany bez `--force`. `--dry-run` pokazuje plan i nic nie wysyła.
//
// Użycie: pnpm r2:upload -- <plik|katalog>... [--prefix realizacje/] [--dry-run] [--force]
// Env (.env): R2_ACCOUNT_ID, R2_WRITE_ACCESS_KEY_ID, R2_WRITE_SECRET_ACCESS_KEY
// (token Object Read & Write — osobny od tokenu raportów, DEC-115).
// Po uploadzie skrypt wypisuje gotowe URL-e do wklejenia w panelu
// (pola „Zrzut"/„Wideo ekranu" przyjmują URL).
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import {
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import {
  BUCKET,
  DEFAULT_PREFIX,
  formatBytes,
  planUpload,
  r2Endpoint,
  readCredentials,
} from "./r2/lib.mjs";

const argv = process.argv.slice(2);
const flag = (name) => argv.includes(`--${name}`);
const opt = (name, def) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1] : def;
};
const PREFIX = opt("prefix", DEFAULT_PREFIX);
const DRY = flag("dry-run");
const FORCE = flag("force");

// Argumenty pozycyjne = pliki/katalogi (bez wartości opcji).
const OPTS_WITH_VALUE = new Set(["--prefix"]);
const inputs = [];
for (let i = 0; i < argv.length; i++) {
  if (argv[i].startsWith("--")) {
    if (OPTS_WITH_VALUE.has(argv[i])) i++;
    continue;
  }
  inputs.push(argv[i]);
}
if (!inputs.length) {
  console.error(
    "Użycie: pnpm r2:upload -- <plik|katalog>... [--prefix realizacje/] [--dry-run] [--force]",
  );
  process.exit(2);
}

/** Pliki z argumentów: katalog → jego pliki (płytko, bez podkatalogów). */
function expand(paths) {
  const files = [];
  for (const p of paths) {
    const st = statSync(p);
    if (st.isDirectory()) {
      for (const n of readdirSync(p).sort()) {
        const f = path.join(p, n);
        if (statSync(f).isFile() && !n.startsWith(".")) files.push(f);
      }
    } else {
      files.push(p);
    }
  }
  return files;
}

async function exists(client, key) {
  try {
    await client.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch (err) {
    if (err?.$metadata?.httpStatusCode === 404 || err?.name === "NotFound")
      return false;
    throw err;
  }
}

async function main() {
  const plan = planUpload(expand(inputs), PREFIX);
  const total = plan.reduce((s, p) => s + statSync(p.file).size, 0);
  console.log(
    `${DRY ? "[dry-run] " : ""}${plan.length} plików · ${formatBytes(total)} → ${BUCKET}/${PREFIX}`,
  );
  for (const p of plan) {
    console.log(
      `  ${formatBytes(statSync(p.file).size).padStart(10)}  ${p.contentType.padEnd(12)}  ${p.key}`,
    );
  }
  if (DRY) return;

  const c = readCredentials(process.env, { write: true });
  const client = new S3Client({
    region: "auto",
    endpoint: r2Endpoint(c.accountId, "eu"),
    credentials: {
      accessKeyId: c.accessKeyId,
      secretAccessKey: c.secretAccessKey,
    },
  });

  const done = [];
  const skipped = [];
  for (const p of plan) {
    if (!FORCE && (await exists(client, p.key))) {
      skipped.push(p);
      continue;
    }
    await client.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: p.key,
        Body: readFileSync(p.file),
        ContentType: p.contentType,
      }),
    );
    done.push(p);
  }
  client.destroy();

  if (skipped.length) {
    console.log(
      `\nPominięte (obiekt już istnieje; nadpisanie: --force): ${skipped.length}`,
    );
    for (const p of skipped) console.log(`  ${p.url}`);
  }
  console.log(`\nWgrane: ${done.length}`);
  for (const p of done) console.log(`  ${p.url}`);
  if (done.length) {
    console.log(
      "\nSprawdź w przeglądarce (HEAD 200, Content-Type), potem wklej URL-e w panelu. " +
        "Kontrola całości: CHECK_REMOTE_MEDIA=1 pnpm exec vitest run tests/unit/media-r2.test.ts",
    );
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
