/**
 * Copies the sql.js runtime into public/sql/ so the SQL worker can load it by
 * URL. BRIEF.md section 4: the app is a static export, so the engine ships as
 * a plain static asset rather than through the bundler.
 *
 * Runs from `npm run sql:assets`, and from `postinstall` so a clean checkout
 * plus `npm ci` produces a working tree without a manual step.
 *
 * The copied files are committed, so the build never depends on this having
 * run. `npm run validate` fails if they drift from the installed package.
 */

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

const SRC = join(root, "node_modules", "sql.js", "dist");
const DEST = join(root, "public", "sql");

/** The browser build and its wasm. Nothing else from the package ships. */
export const SQL_ASSETS = ["sql-wasm.js", "sql-wasm.wasm"];

export function digest(bytes) {
  return createHash("sha256").update(bytes).digest("hex").slice(0, 16);
}

export function assetStatus() {
  return SQL_ASSETS.map((name) => {
    const from = join(SRC, name);
    const to = join(DEST, name);
    const source = existsSync(from) ? readFileSync(from) : null;
    const copied = existsSync(to) ? readFileSync(to) : null;
    return {
      name,
      from,
      to,
      sourceMissing: source === null,
      copiedMissing: copied === null,
      inSync:
        source !== null && copied !== null && digest(source) === digest(copied),
      bytes: source?.length ?? 0,
    };
  });
}

function main() {
  if (!existsSync(SRC)) {
    console.error("sql.js is not installed. Run npm install first.");
    process.exit(1);
  }
  mkdirSync(DEST, { recursive: true });

  for (const name of SQL_ASSETS) {
    const bytes = readFileSync(join(SRC, name));
    writeFileSync(join(DEST, name), bytes);
    console.log(`  public/sql/${name}  ${bytes.length.toLocaleString()} B`);
  }
  console.log("sql.js runtime copied into public/sql/.");
}

if (process.argv[1] && process.argv[1].endsWith("sync-sql-assets.mjs")) {
  main();
}
