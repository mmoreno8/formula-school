"use client";

/**
 * The browser side of the SQL engine.
 *
 * SQL-SPIKE-REPORT.md, required browser architecture: learner SQL runs in a
 * disposable Web Worker, and the application must be able to terminate and
 * recreate that worker after a fixed query timeout. That is what this file is
 * for. It is the only module on the main thread that knows the worker exists.
 *
 * Route isolation: nothing here is imported outside app/sql/*. The worker and
 * the wasm are fetched by URL, so a page that never mounts a SQL component
 * never requests either one. BRIEF.md section 7.
 */

import { missingClause, checkReadOnly } from "./tokenize";
import { buildSeed, type TableSet } from "./seed";
import type { Refusal, ResultSet, SqlError, SqlOutcome, WorkerResponse } from "./types";

/**
 * Long enough that nothing a lesson dataset can do will hit it, short enough
 * that a runaway cross join does not look like a hang. The tables are a
 * handful of rows.
 */
export const QUERY_TIMEOUT_MS = 5000;

const WORKER_URL = "/sql/worker.js";

let worker: Worker | null = null;
let nextId = 1;

function spawn(): Worker {
  const w = new Worker(WORKER_URL);
  worker = w;
  return w;
}

function currentWorker(): Worker {
  return worker ?? spawn();
}

/**
 * Throws the worker away. Called on timeout, because a worker stuck inside
 * SQLite cannot be asked politely to stop, and on unmount.
 */
export function disposeWorker(): void {
  if (worker) {
    worker.terminate();
    worker = null;
  }
}

/** Warms the engine so the first Run query is not also the first download. */
export function warmEngine(): void {
  try {
    const w = currentWorker();
    const id = nextId++;
    w.postMessage({ id, type: "ping" });
  } catch {
    // A browser without workers falls back to an error on first run, which is
    // reported properly there rather than swallowed here.
  }
}

function refusalFor(code: "empty" | "not-read-only" | "multiple-statements", word?: string): SqlOutcome {
  if (code === "empty") {
    return { ok: false, kind: "refused", code, message: "There is nothing to run yet." };
  }
  if (code === "multiple-statements") {
    return {
      ok: false,
      kind: "refused",
      code,
      message: "Run one statement at a time. These lessons read a single query.",
    };
  }
  return {
    ok: false,
    kind: "refused",
    code,
    message: word
      ? `These lessons only read data, so ${word.toUpperCase()} is not available here. Start with SELECT.`
      : "These lessons only read data. Start with SELECT.",
  };
}

/**
 * Runs one query against a fresh copy of the lesson database.
 *
 * Layer 1 of the read-only method runs here, before anything is sent. Layers
 * 2 to 5 run inside the worker. A refusal is never a wrong attempt: callers
 * must not advance the hint ladder on one.
 */
export function runQuery(db: TableSet, sql: string): Promise<SqlOutcome> {
  const verdict = checkReadOnly(sql);
  if (!verdict.allowed) {
    return Promise.resolve(refusalFor(verdict.code!, verdict.offending));
  }

  let seed;
  try {
    seed = buildSeed(db);
  } catch (e) {
    return Promise.resolve({
      ok: false,
      kind: "error",
      message: `This lesson's tables could not be built. ${String(e)}`,
    });
  }

  return new Promise((resolve) => {
    let w: Worker;
    try {
      w = currentWorker();
    } catch {
      resolve({
        ok: false,
        kind: "error",
        message: "This browser cannot run the SQL engine.",
      });
      return;
    }

    const id = nextId++;
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      // The worker is stuck inside SQLite. Terminating is the only way out,
      // and the next run spawns a fresh one.
      disposeWorker();
      resolve({
        ok: false,
        kind: "refused",
        code: "timeout",
        message: `That query took longer than ${QUERY_TIMEOUT_MS / 1000} seconds and was stopped. Check for a join with no condition.`,
      });
    }, QUERY_TIMEOUT_MS);

    function cleanup() {
      clearTimeout(timer);
      w.removeEventListener("message", onMessage);
      w.removeEventListener("error", onError);
    }

    function onMessage(event: MessageEvent<WorkerResponse>) {
      const data = event.data;
      if (!data || data.id !== id) return;
      if (data.type !== "result") return;
      if (settled) return;
      settled = true;
      cleanup();
      resolve(data.outcome);
    }

    function onError() {
      if (settled) return;
      settled = true;
      cleanup();
      disposeWorker();
      resolve({
        ok: false,
        kind: "error",
        message: "The SQL engine stopped unexpectedly. Try running the query again.",
      });
    }

    w.addEventListener("message", onMessage);
    w.addEventListener("error", onError);
    w.postMessage({ id, type: "run", schema: seed.schema, inserts: seed.inserts, sql });
  });
}

export interface GradeSpec {
  canonical: string;
  mustUse?: string[];
  orderMatters: boolean;
}

export type Grade =
  | { kind: "correct"; result: ResultSet }
  | { kind: "wrong"; result: ResultSet; detail?: string }
  | { kind: "missing-clause"; clause: string; result: ResultSet }
  | { kind: "refused"; outcome: Refusal }
  | { kind: "error"; outcome: SqlError };

/**
 * Check answer. BRIEF.md 5.14: the learner's query and the canonical query
 * both run, each against its own fresh copy of the same database, and the two
 * result sets are compared. No expected value is stored anywhere.
 */
export async function gradeQuery(
  db: TableSet,
  sql: string,
  spec: GradeSpec,
): Promise<Grade> {
  const mine = await runQuery(db, sql);

  if (mine.ok === false) {
    return mine.kind === "refused"
      ? { kind: "refused", outcome: mine }
      : { kind: "error", outcome: mine };
  }

  const clause = missingClause(sql, spec.mustUse);
  if (clause) {
    return { kind: "missing-clause", clause, result: mine.result };
  }

  const theirs = await runQuery(db, spec.canonical);
  if (theirs.ok === false) {
    return {
      kind: "error",
      outcome: {
        ok: false,
        kind: "error",
        message: "This lesson's model answer did not run. That is a bug in the lesson, not in your query.",
      },
    };
  }

  const { compareResults } = await import("./compare");
  const verdict = compareResults(mine.result, theirs.result, spec.orderMatters);

  return verdict.equal
    ? { kind: "correct", result: mine.result }
    : { kind: "wrong", result: mine.result, detail: verdict.detail };
}
