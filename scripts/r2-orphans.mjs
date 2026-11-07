// Sieroty w R2 (C7 w docs/optional-todos.md, punkt M3 backlogu ewolucji):
// lista obiektów bucketa `hadrianm-media` pod prefixem `realizacje/` vs URL-e
// mediów w src/content/realizacje/*.json. Domyślnie TYLKO RAPORT (token
// tylko-do-odczytu). Kasowanie wyłącznie z `--delete` (token z zapisem)
// i po potwierdzeniu w terminalu („tak"); `--yes` pomija pytanie — tylko
// dla świadomego uruchomienia po obejrzeniu raportu.
//
// Użycie: pnpm r2:orphans [--prefix realizacje/] [--delete [--yes]] [--json]
// Env (.env, nieczytany przez Claude'a): R2_ACCOUNT_ID, R2_ACCESS_KEY_ID,
// R2_SECRET_ACCESS_KEY (odczyt); do --delete dodatkowo R2_WRITE_ACCESS_KEY_ID,
// R2_WRITE_SECRET_ACCESS_KEY. Ładowane przez `node --env-file-if-exists=.env`
// w package.json — bez pakietu dotenv.
//
// Raport pokazuje też `missing`: URL-e z JSON-ów bez obiektu w buckecie
// (złamane media) — to sygnał do naprawy w panelu, nie do kasowania.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";
import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  S3Client,
} from "@aws-sdk/client-s3";
import {
  BUCKET,
  DEFAULT_PREFIX,
  collectMediaUrls,
  diffKeys,
  formatBytes,
  keyToUrl,
  r2Endpoint,
  readCredentials,
  urlToKey,
} from "./r2/lib.mjs";

const argv = process.argv.slice(2);
const flag = (name) => argv.includes(`--${name}`);
const opt = (name, def) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1] : def;
};

const PREFIX = opt("prefix", DEFAULT_PREFIX);
const DELETE = flag("delete");
const YES = flag("yes");
const JSON_OUT = flag("json");

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const CONTENT_DIR = path.join(ROOT, "src", "content", "realizacje");

/** Teksty JSON-ów wpisów; katalog może nie istnieć (P-59) — wtedy pusta lista. */
function readEntryTexts() {
  if (!existsSync(CONTENT_DIR)) return [];
  return readdirSync(CONTENT_DIR)
    .filter((n) => n.endsWith(".json"))
    .sort()
    .map((n) => readFileSync(path.join(CONTENT_DIR, n), "utf8"));
}

/** Wszystkie obiekty pod prefixem (stronicowanie). */
async function listBucket(client, prefix) {
  const out = [];
  let token;
  do {
    const res = await client.send(
      new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: prefix,
        ContinuationToken: token,
      }),
    );
    for (const o of res.Contents ?? []) {
      if (o.Key) out.push({ key: o.Key, size: o.Size ?? 0 });
    }
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);
  return out;
}

function makeClient(write) {
  const c = readCredentials(process.env, { write });
  return new S3Client({
    region: "auto",
    endpoint: r2Endpoint(c.accountId, "eu"),
    credentials: {
      accessKeyId: c.accessKeyId,
      secretAccessKey: c.secretAccessKey,
    },
  });
}

async function main() {
  const texts = readEntryTexts();
  const usedKeys = collectMediaUrls(texts).map(urlToKey);

  const reader = makeClient(false);
  const objects = await listBucket(reader, PREFIX);
  reader.destroy();

  const sizes = new Map(objects.map((o) => [o.key, o.size]));
  const { orphans, missing } = diffKeys(
    objects.map((o) => o.key),
    usedKeys,
  );
  const orphanBytes = orphans.reduce((s, k) => s + (sizes.get(k) ?? 0), 0);

  if (JSON_OUT) {
    console.log(
      JSON.stringify(
        {
          prefix: PREFIX,
          entries: texts.length,
          used: usedKeys.length,
          objects: objects.length,
          orphans,
          missing,
        },
        null,
        2,
      ),
    );
  } else {
    console.log(
      `Wpisy: ${texts.length} · URL-e mediów w treści: ${usedKeys.length} · ` +
        `obiekty w ${BUCKET}/${PREFIX}: ${objects.length}`,
    );
    console.log(
      `\nSieroty (w buckecie, bez użycia w treści): ${orphans.length} · ${formatBytes(orphanBytes)}`,
    );
    for (const k of orphans)
      console.log(
        `  ${formatBytes(sizes.get(k) ?? 0).padStart(10)}  ${keyToUrl(k)}`,
      );
    console.log(
      `\nBrakujące (w treści, bez obiektu w buckecie): ${missing.length}`,
    );
    for (const k of missing) console.log(`  ${keyToUrl(k)}`);
  }

  if (missing.length) {
    console.error(
      "\nUWAGA: treść wskazuje media, których nie ma w buckecie — napraw w panelu " +
        "(ponowny upload) zanim cokolwiek kasujesz.",
    );
  }

  if (!DELETE) {
    if (orphans.length && !JSON_OUT) {
      console.log(
        "\nTryb raportu. Kasowanie: pnpm r2:orphans --delete (token z zapisem, pytanie o potwierdzenie).",
      );
    }
    return;
  }
  if (!orphans.length) {
    console.log("\nNic do skasowania.");
    return;
  }

  if (!YES) {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    const answer = await rl.question(
      `\nSkasować ${orphans.length} obiektów (${formatBytes(orphanBytes)}) z ${BUCKET}? Wpisz „tak": `,
    );
    rl.close();
    if (answer.trim().toLowerCase() !== "tak") {
      console.log("Przerwano, nic nie skasowano.");
      return;
    }
  }

  const writer = makeClient(true);
  let deleted = 0;
  for (let i = 0; i < orphans.length; i += 1000) {
    const batch = orphans.slice(i, i + 1000);
    const res = await writer.send(
      new DeleteObjectsCommand({
        Bucket: BUCKET,
        Delete: { Objects: batch.map((Key) => ({ Key })), Quiet: true },
      }),
    );
    deleted += batch.length - (res.Errors?.length ?? 0);
    for (const e of res.Errors ?? [])
      console.error(`  BŁĄD ${e.Key}: ${e.Code} ${e.Message}`);
  }
  writer.destroy();
  console.log(
    `\nSkasowano ${deleted}/${orphans.length}. Kontrola: CHECK_REMOTE_MEDIA=1 pnpm exec vitest run tests/unit/media-r2.test.ts`,
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
