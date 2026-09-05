/**
 * The Node side of the SQL engine, for the validator and the tests.
 *
 * BRIEF.md, validator rules: the SQL track is validated through the same
 * sql.js the browser uses. Validating against a stand-in is not a gate.
 *
 * Same layered read-only method as the browser, minus the worker: layer 1 is
 * lib/sql/tokenize.ts, shared with the browser, and layers 2 to 5 run inline
 * here because there is no UI thread to protect. The timeout has no equivalent
 * in Node; a runaway query in a lesson dataset would hang `npm run validate`,
 * which is a build-time failure the author sees immediately.
 *
 * Never imported by anything in app/ or components/.
 */

import initSqlJs, { type Database, type SqlJsStatic } from "sql.js";
import { checkReadOnly, missingClause } from "./tokenize";
import { buildSeed, type TableSet } from "./seed";
import { compareResults } from "./compare";
import type { ResultSet, SqlOutcome, SqlValue } from "./types";

let engine: SqlJsStatic | null = null;

export async function loadEngine(): Promise<SqlJsStatic> {
  if (!engine) engine = await initSqlJs();
  return engine;
}

function refuse(
  code: "empty" | "not-read-only" | "multiple-statements" | "no-result-columns",
  message: string,
): SqlOutcome {
  return { ok: false, kind: "refused", code, message };
}

function classify(e: unknown): SqlOutcome {
  const text = String((e as Error)?.message ?? e ?? "");
  if (/readonly database|not authorized|attempt to write/i.test(text)) {
    return refuse("not-read-only", "These lessons only read data. Try a SELECT.");
  }
  return { ok: false, kind: "error", message: text };
}

function normalise(v: unknown): SqlValue | { __blob: true } {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return v;
  if (typeof v === "bigint") return Number(v);
  if (typeof v === "string") return v;
  if (v instanceof Uint8Array) return { __blob: true };
  return String(v);
}

/** Seeds a fresh database, applies query_only, and runs one read-only statement. */
export async function runQueryNode(db: TableSet, sql: string): Promise<SqlOutcome> {
  const verdict = checkReadOnly(sql);
  if (!verdict.allowed) {
    if (verdict.code === "empty") return refuse("empty", "There is nothing to run yet.");
    if (verdict.code === "multiple-statements") {
      return refuse("multiple-statements", "Run one statement at a time.");
    }
    return refuse(
      "not-read-only",
      `These lessons only read data, so ${(verdict.offending ?? "").toUpperCase()} is not available here.`,
    );
  }

  const SQL = await loadEngine();
  const seed = buildSeed(db);
  const database: Database = new SQL.Database();

  try {
    for (const stmt of seed.schema) database.run(stmt);
    for (const ins of seed.inserts) {
      const prepared = database.prepare(ins.sql);
      try {
        for (const row of ins.rows) prepared.run(row as never);
      } finally {
        prepared.free();
      }
    }

    database.run("PRAGMA query_only = ON;");

    let count = 0;
    try {
      for (const _ of database.iterateStatements(sql)) {
        void _;
        count++;
        if (count > 1) break;
      }
    } catch (e) {
      return classify(e);
    }
    if (count === 0) return refuse("empty", "There is nothing to run yet.");
    if (count > 1) {
      return refuse("multiple-statements", "Run one statement at a time.");
    }

    let q;
    try {
      q = database.prepare(sql);
    } catch (e) {
      return classify(e);
    }

    try {
      const columns = q.getColumnNames();
      if (!columns || columns.length === 0) {
        return refuse("no-result-columns", "That statement does not return a table.");
      }
      const rows: SqlValue[][] = [];
      let sawBlob = false;
      while (q.step()) {
        const raw = q.get() as unknown[];
        const row: SqlValue[] = [];
        for (const cell of raw) {
          const v = normalise(cell);
          if (v && typeof v === "object" && "__blob" in v) {
            sawBlob = true;
            row.push(null);
          } else {
            row.push(v as SqlValue);
          }
        }
        rows.push(row);
      }
      if (sawBlob) {
        return {
          ok: false,
          kind: "error",
          message: "the query returned binary data, which the lesson schema does not support",
        };
      }
      return { ok: true, result: { columns, rows } };
    } catch (e) {
      return classify(e);
    } finally {
      q.free();
    }
  } catch (e) {
    return classify(e);
  } finally {
    database.close();
  }
}

export interface NodeGradeSpec {
  canonical: string;
  mustUse?: string[];
  orderMatters: boolean;
}

export type NodeGrade =
  | { kind: "correct"; result: ResultSet }
  | { kind: "wrong"; result: ResultSet; detail?: string }
  | { kind: "missing-clause"; clause: string }
  | { kind: "not-run"; outcome: SqlOutcome };

/** The same grading path the browser takes, for validator rule 11. */
export async function gradeQueryNode(
  db: TableSet,
  sql: string,
  spec: NodeGradeSpec,
): Promise<NodeGrade> {
  const mine = await runQueryNode(db, sql);
  if (mine.ok === false) return { kind: "not-run", outcome: mine };

  const clause = missingClause(sql, spec.mustUse);
  if (clause) return { kind: "missing-clause", clause };

  const theirs = await runQueryNode(db, spec.canonical);
  if (theirs.ok === false) return { kind: "not-run", outcome: theirs };

  const verdict = compareResults(mine.result, theirs.result, spec.orderMatters);
  return verdict.equal
    ? { kind: "correct", result: mine.result }
    : { kind: "wrong", result: mine.result, detail: verdict.detail };
}
