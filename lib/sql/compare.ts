/**
 * Result-set comparison. BRIEF.md section 8, "How result sets are compared".
 *
 * Two rules that the brief is emphatic about, because getting either wrong
 * tells a correct learner they are wrong:
 *
 *   - column names are normalized before comparison, but column ORDER counts
 *   - rows are a multiset when orderMatters is false, never a Set
 *
 * SQL-SPIKE-REPORT.md adds that values must be type-tagged before comparison,
 * so numeric 1, text "1" and NULL stay distinct.
 */

import type { ResultSet, SqlValue } from "./types";

/**
 * Case-folded, trimmed, and with internal whitespace normalized.
 *
 * The internal-whitespace rule was flagged in draft 5 as an addition beyond
 * the reviewed list. SQL-SPIKE-REPORT.md confirmed it is necessary: SQLite
 * returned the labels `SUM( amount )` and `SUM(amount)` unchanged, so without
 * this a learner who spaces out their arguments fails on spelling alone.
 *
 * Applies to output column names only. Never to learner data values.
 */
export function normalizeColumnName(name: string): string {
  return (
    name
      .trim()
      // Runs of whitespace become one space.
      .replace(/\s+/g, " ")
      // Whitespace touching punctuation disappears, so "SUM( amount )" and
      // "SUM(amount)" agree. Collapsing runs alone does not achieve that,
      // which the tests pin down. Space between two word characters is kept,
      // so "order date" stays different from "orderdate".
      .replace(/\s*([^A-Za-z0-9_\s])\s*/g, "$1")
      .toLowerCase()
  );
}

/**
 * Type-tagged encoding of one value, so that 1 and "1" never collide.
 * SQL-SPIKE-REPORT.md, result comparison notes.
 *
 * JSON, not a delimiter. The first implementation tagged each value and joined
 * with a NUL separator, which a learner's own data could forge: SQLite text
 * can contain any character, NUL included, so two different rows could encode
 * to the same key and compare equal. JSON escaping makes the boundary between
 * values unforgeable, because a separator cannot appear unescaped inside a
 * value.
 */
export function encodeValue(v: SqlValue): string {
  if (v === null) return '["n"]';
  if (typeof v === "number") {
    // -0 and 0 are the same number to a learner.
    return JSON.stringify(["d", Object.is(v, -0) ? 0 : v]);
  }
  return JSON.stringify(["s", v]);
}

/** One row encoded as a single comparable key. Nested JSON, for the same reason. */
export function encodeRow(row: SqlValue[]): string {
  return JSON.stringify(row.map(encodeValue));
}

export type MismatchReason =
  "column-count" | "column-names" | "row-count" | "row-values" | "row-order";

export interface ComparisonResult {
  equal: boolean;
  reason?: MismatchReason;
  /** Filled in for column mismatches, to explain without giving the answer. */
  detail?: string;
}

/**
 * Compares a learner result against the canonical result.
 *
 * `orderMatters` is passed explicitly on every call. The brief removed its
 * default deliberately: a field you can forget is a field that will be
 * forgotten, and this is the field where forgetting fails correct people.
 */
export function compareResults(
  actual: ResultSet,
  expected: ResultSet,
  orderMatters: boolean,
): ComparisonResult {
  if (actual.columns.length !== expected.columns.length) {
    return {
      equal: false,
      reason: "column-count",
      detail: `your query returned ${actual.columns.length} column${
        actual.columns.length === 1 ? "" : "s"
      }, the answer has ${expected.columns.length}`,
    };
  }

  // Column order counts: the learner chooses it in the SELECT list.
  for (let i = 0; i < expected.columns.length; i++) {
    const a = normalizeColumnName(actual.columns[i]);
    const e = normalizeColumnName(expected.columns[i]);
    if (a !== e) {
      return {
        equal: false,
        reason: "column-names",
        detail: `column ${i + 1} came back as "${actual.columns[i]}"`,
      };
    }
  }

  if (actual.rows.length !== expected.rows.length) {
    return {
      equal: false,
      reason: "row-count",
      detail: `your query returned ${actual.rows.length} row${
        actual.rows.length === 1 ? "" : "s"
      }, the answer has ${expected.rows.length}`,
    };
  }

  const a = actual.rows.map(encodeRow);
  const e = expected.rows.map(encodeRow);

  if (orderMatters) {
    for (let i = 0; i < e.length; i++) {
      if (a[i] !== e[i]) {
        // Same bag, different sequence, is specifically an ordering problem.
        const sameBag =
          JSON.stringify([...a].sort()) === JSON.stringify([...e].sort());
        return { equal: false, reason: sameBag ? "row-order" : "row-values" };
      }
    }
    return { equal: true };
  }

  // Multiset, not a Set. Duplicates have to match in number, so a query that
  // drops or invents a duplicate row fails here rather than passing.
  const as = [...a].sort();
  const es = [...e].sort();
  for (let i = 0; i < es.length; i++) {
    if (as[i] !== es[i]) return { equal: false, reason: "row-values" };
  }
  return { equal: true };
}
