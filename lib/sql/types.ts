/**
 * Shared SQL types. BRIEF.md section 8.
 *
 * Nothing in this file imports sql.js, so it is safe to import from anywhere,
 * including the Excel side. The engine itself lives behind lib/sql/client.ts
 * (browser) and lib/sql/node.ts (validator and tests).
 */

/** What a lesson table cell may hold. The schema allows nothing else. */
export type SqlValue = string | number | null;

export interface ResultSet {
  /** Output column labels, in the order the query produced them. */
  columns: string[];
  rows: SqlValue[][];
}

/** Why the engine refused to run something. Never a wrong attempt. */
export type RefusalCode =
  | "empty"
  | "not-read-only"
  | "multiple-statements"
  | "no-result-columns"
  | "timeout"
  | "engine";

export interface Refusal {
  ok: false;
  kind: "refused";
  code: RefusalCode;
  /** Shown to the learner as written. Plain words, no apology. */
  message: string;
}

export interface SqlError {
  ok: false;
  kind: "error";
  /** SQLite's own parse or runtime message, lightly tidied. */
  message: string;
}

export interface SqlOk {
  ok: true;
  result: ResultSet;
}

export type SqlOutcome = SqlOk | SqlError | Refusal;

export function isRefusal(o: SqlOutcome): o is Refusal {
  return o.ok === false && o.kind === "refused";
}

export function isSqlError(o: SqlOutcome): o is SqlError {
  return o.ok === false && o.kind === "error";
}

/* --------------------------- worker protocol ----------------------------- */

export interface RunRequest {
  id: number;
  type: "run";
  /** CREATE TABLE statements. Identifiers are validated before they get here. */
  schema: string[];
  /** Parameterised INSERTs plus the rows to bind. Values are never interpolated. */
  inserts: { sql: string; rows: SqlValue[][] }[];
  sql: string;
}

export type WorkerRequest = RunRequest | { id: number; type: "ping" };

export type WorkerResponse =
  | { id: number; type: "ready" }
  | { id: number; type: "result"; outcome: SqlOutcome };
