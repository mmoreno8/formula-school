import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // The sql.js runtime, copied verbatim from node_modules by
    // scripts/sync-sql-assets.mjs. Third-party build output, not ours to lint.
    // public/sql/worker.js is ours and is deliberately not ignored.
    "public/sql/sql-wasm.js",
  ]),
]);

export default eslintConfig;
