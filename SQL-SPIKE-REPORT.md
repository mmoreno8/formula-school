# SQL track technical proof

**Result: pass. Step 3 is complete. Claude may begin step 4.**

Run by Codex on 6 September 2026 in an isolated temporary copy of the repository. No production
code was changed, no remote branch was pushed, and no Cloudflare deployment was created.

## Proven configuration

- Formula School at local commit `a803e25`
- Next.js `16.3.4`, React `19.2.8`, `output: "export"`
- `sql.js` `1.14.2`
- `@types/sql.js` `1.4.11`
- Wrangler `4.129.0` local Pages runtime

## Gate results

| Gate | Result | Evidence |
|---|---|---|
| Browser execution | Pass | A GROUP BY query ran in a Web Worker and returned North 25, South 8 |
| Static export | Pass | `next build` generated 25 static routes, including the spike route, with no server output |
| Node execution | Pass | The same `sql.js` package executed GROUP BY under `tsx` |
| Route isolation | Pass | Loading `/formulas/xlookup` requested neither the SQL worker nor the wasm asset |
| Cloudflare asset handling | Pass | Wrangler Pages returned `Content-Type: application/wasm`, `X-Content-Type-Options: nosniff`, and gzip encoding |
| Transfer size | Pass | Worker: 49,972 B raw / 17,586 B gzip. Wasm: 658,410 B raw / 322,620 B gzip |
| Read-only enforcement | Pass | SELECT and read-only WITH accepted; DML, DDL, PRAGMA, ATTACH and multiple statements refused |
| `mustUse` token detection | Pass | Real GROUP BY detected; the words inside a string or comment were ignored |

Total first-load SQL engine transfer in the tested worker design is approximately **340 KB gzip**.
The assets load only when SQL is opened. Browser caching avoids paying that transfer again during
the same visit and on normal repeat visits.

## Required browser architecture

Run learner SQL in a disposable **Web Worker**, not on the UI thread. The lesson databases are
small, but an accidental recursive CTE or explosive cross join can still monopolize the main
thread. The application must be able to terminate and recreate the worker after a fixed query
timeout.

The package includes a working worker build, but its stock message handler accepts unrestricted
`exec`. Production therefore needs a small Formula School worker wrapper that applies the rules
below inside the worker before stepping the learner's statement.

The worker and wasm files can ship as static assets and are fetched only by `/sql/*`. Keep every
SQL import below the SQL route boundary. Do not import the SQL wrapper from the root layout,
sidebar, combined content index, overview, Excel routes, or shared progress code.

## Smallest dependable read-only method

`sql.js` does not expose `sqlite3_stmt_readonly()` through its public JavaScript API. The proven
replacement is layered rather than a text-prefix check:

1. Tokenize outside whitespace, line comments, block comments, string literals and quoted
   identifiers. Require the first real token to be `SELECT` or `WITH`.
2. Use `Database.iterateStatements()` and require exactly one prepared statement. It correctly
   ignores semicolons inside strings and comments. An optional trailing semicolon remains valid.
3. Seed the database, then execute `PRAGMA query_only = ON` before learner SQL.
4. Prepare and step the one statement. `query_only` rejects writes, including a write hidden
   behind an initial `WITH`.
5. Require the statement to expose at least one result column.
6. Run all of this in a fresh worker/database and terminate the worker on timeout.

Refusal is an engine message, never a wrong attempt.

The proof covered ordinary SELECT, commented SELECT, a read-only WITH, two SELECT statements,
PRAGMA, DELETE, CREATE, ATTACH, and `WITH ... DELETE ... RETURNING`.

## `mustUse`

Reuse the same tokenizer. Match each required clause as a contiguous, ordered token sequence.
For example, `GROUP BY` is the token sequence `GROUP`, `BY`. Tokens inside strings, line comments,
block comments and quoted identifiers do not count.

This rejects both of these false positives:

```sql
SELECT 'GROUP BY';
SELECT region FROM orders; -- GROUP BY region
```

## Column-name finding

SQLite did **not** normalize internal whitespace in computed output labels:

- `SUM( amount )` returned the label `SUM( amount )`
- `SUM(amount)` returned the label `SUM(amount)`

Draft 5's internal-whitespace collapsing rule is therefore necessary and accepted. Apply it only
to output column-name comparison, along with trimming and case folding. Do not normalize learner
data values.

## Result comparison implementation notes

- Preserve column order.
- Compare normalized column names.
- Encode row values with type tags before comparison so numeric `1`, text `"1"`, and `NULL` stay
  distinct.
- When `orderMatters` is false, sort the encoded rows and compare them as multisets; never use a
  JavaScript `Set`, because duplicates matter.
- When `orderMatters` is true, compare the encoded rows in sequence.
- Reject BLOB output in MVP content validation. `sql.js` can return `Uint8Array`, but the agreed
  lesson schema supports only string, number and `null`.

## Cloudflare note

No preview deployment was spent on this proof. Cloudflare's local Pages runtime served the exact
static export with the correct wasm MIME type and compression behavior. This satisfies the
technical gate while preserving the brief's one-preview, one-production deployment budget.

## Handoff

Claude can begin step 4: make the shared shell track-aware, implement the worker-backed SQL
workspace, and build GROUP BY as the reference lesson. The worker timeout and layered read-only
method above are part of that implementation, not optional follow-up hardening.
