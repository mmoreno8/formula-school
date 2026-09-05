/* eslint-disable */
/**
 * Formula School SQL worker.
 *
 * SQL-SPIKE-REPORT.md: learner SQL runs in a disposable Web Worker, never on
 * the UI thread, because a recursive CTE or an explosive cross join can
 * monopolise whatever thread it runs on. The main thread terminates and
 * recreates this worker on timeout, so nothing here needs to be interruptible.
 *
 * The report also notes that sql.js ships a worker whose stock message handler
 * accepts unrestricted `exec`. This is the replacement: it accepts one message
 * shape, seeds a fresh database, and applies the read-only layers below before
 * stepping anything the learner wrote.
 *
 * Layered read-only method, from the spike report. Layer 1 (tokenise, require
 * the first real token to be SELECT or WITH) runs on the main thread in
 * lib/sql/tokenize.ts, which is also what the validator and the tests use, so
 * there is one tokenizer and it cannot drift. Layers 2 to 5 need a live
 * database and therefore live here:
 *
 *   2. iterateStatements must yield exactly one statement
 *   3. PRAGMA query_only = ON, set after seeding and before learner SQL
 *   4. prepare and step the one statement
 *   5. the statement must expose at least one result column
 *
 * Each layer stands on its own. query_only is what catches a write hidden
 * behind an initial WITH, which layer 1 deliberately admits.
 *
 * This file is plain JavaScript in public/ on purpose. It is fetched by URL,
 * never imported, so no bundle outside /sql/* can pull the engine in by
 * accident. BRIEF.md section 7, route-level asset isolation.
 */

importScripts("/sql/sql-wasm.js");

var SQL = null;
var ready = null;

function init() {
  if (!ready) {
    ready = initSqlJs({ locateFile: function () { return "/sql/sql-wasm.wasm"; } })
      .then(function (mod) {
        SQL = mod;
        return mod;
      });
  }
  return ready;
}

function refuse(code, message) {
  return { ok: false, kind: "refused", code: code, message: message };
}

function fail(message) {
  return { ok: false, kind: "error", message: String(message || "").trim() };
}

/** sql.js hands back numbers, strings, null, Uint8Array for BLOB, and BigInt. */
function normaliseValue(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return v;
  if (typeof v === "bigint") return Number(v);
  if (typeof v === "string") return v;
  if (v instanceof Uint8Array) return { __blob: true };
  return String(v);
}

function run(msg) {
  var db = new SQL.Database();
  try {
    // Seed. Identifiers were validated on the main thread; values are bound,
    // never interpolated, so lesson data cannot break the seed.
    for (var i = 0; i < msg.schema.length; i++) {
      db.run(msg.schema[i]);
    }
    for (var j = 0; j < msg.inserts.length; j++) {
      var ins = msg.inserts[j];
      var stmt = db.prepare(ins.sql);
      try {
        for (var r = 0; r < ins.rows.length; r++) {
          stmt.run(ins.rows[r]);
        }
      } finally {
        stmt.free();
      }
    }

    // Layer 3. Everything after this point is refused by SQLite if it writes.
    db.run("PRAGMA query_only = ON;");

    // Layer 2. Preparing does not execute, so this counts without running.
    var count = 0;
    try {
      var it = db.iterateStatements(msg.sql);
      for (var s of it) {
        count++;
        if (count > 1) break;
      }
    } catch (e) {
      // A parse error, or query_only rejecting a write, surfaces here first.
      return classify(e);
    }

    if (count === 0) {
      return refuse("empty", "There is nothing to run yet.");
    }
    if (count > 1) {
      return refuse(
        "multiple-statements",
        "Run one statement at a time. These lessons read a single query.",
      );
    }

    // Layer 4.
    var q = null;
    try {
      q = db.prepare(msg.sql);
    } catch (e) {
      return classify(e);
    }

    try {
      var columns = q.getColumnNames();
      // Layer 5.
      if (!columns || columns.length === 0) {
        return refuse(
          "no-result-columns",
          "That statement does not return a table. These lessons only read data.",
        );
      }

      var rows = [];
      var sawBlob = false;
      while (q.step()) {
        var raw = q.get();
        var row = [];
        for (var c = 0; c < raw.length; c++) {
          var v = normaliseValue(raw[c]);
          if (v && v.__blob) {
            sawBlob = true;
            v = null;
          }
          row.push(v);
        }
        rows.push(row);
        // A runaway query is handled by the main thread's timeout, which
        // terminates this worker outright. No row cap is imposed here.
      }

      if (sawBlob) {
        return fail(
          "That query returned binary data, which these lessons do not use.",
        );
      }

      return { ok: true, result: { columns: columns, rows: rows } };
    } catch (e) {
      return classify(e);
    } finally {
      q.free();
    }
  } catch (e) {
    return classify(e);
  } finally {
    db.close();
  }
}

/**
 * query_only produces "attempt to write a readonly database". That is a
 * refusal, not a wrong answer, so the learner is told the rule rather than
 * shown a database error.
 */
function classify(e) {
  var text = String((e && e.message) || e || "");
  if (/readonly database|not authorized|attempt to write/i.test(text)) {
    return refuse(
      "not-read-only",
      "These lessons only read data. Try a SELECT.",
    );
  }
  return fail(text);
}

self.onmessage = function (event) {
  var msg = event.data;
  if (!msg || typeof msg.id !== "number") return;

  init()
    .then(function () {
      if (msg.type === "ping") {
        self.postMessage({ id: msg.id, type: "ready" });
        return;
      }
      if (msg.type === "run") {
        self.postMessage({ id: msg.id, type: "result", outcome: run(msg) });
        return;
      }
    })
    .catch(function (e) {
      self.postMessage({
        id: msg.id,
        type: "result",
        outcome: fail("The SQL engine could not start. " + String(e)),
      });
    });
};
