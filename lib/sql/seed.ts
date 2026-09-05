/**
 * Turns a lesson's TableSet into the statements that build its database.
 *
 * Values are never interpolated into SQL text. Every row is bound as
 * parameters, so a lesson dataset containing an apostrophe cannot break the
 * seed and there is no escaping to get wrong.
 *
 * Identifiers cannot be bound, so table and column names are validated
 * against a strict pattern instead. That is validator rule 9's last bullet:
 * seeding must never depend on quoting user-authored text.
 */

import type { SqlValue } from "./types";

export interface Table {
  name: string;
  cols: string[];
  rows: SqlValue[][];
}

export interface TableSet {
  tables: Table[];
}

/** Letters, digits and underscore, not starting with a digit. Nothing else. */
export const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;

/** SQLite keywords that would need quoting if used as a bare identifier. */
const RESERVED = new Set([
  "select", "from", "where", "group", "by", "order", "having", "join", "on",
  "inner", "left", "right", "outer", "cross", "union", "all", "distinct",
  "insert", "update", "delete", "create", "drop", "alter", "table", "index",
  "and", "or", "not", "null", "is", "in", "like", "between", "as", "case",
  "when", "then", "else", "end", "limit", "offset", "values", "with",
]);

export interface SeedPlan {
  /** CREATE TABLE statements, in order. */
  schema: string[];
  /** One entry per table, with rows to bind. */
  inserts: { sql: string; rows: SqlValue[][] }[];
}

export interface SeedProblem {
  table: string;
  message: string;
}

/**
 * Validator rule 9, in full. BRIEF.md section 8.
 *
 * Returns every problem rather than the first, so a content author fixes a
 * table in one pass.
 */
export function validateTableSet(db: TableSet): SeedProblem[] {
  const problems: SeedProblem[] = [];
  const seenTables = new Set<string>();

  if (db.tables.length === 0) {
    problems.push({ table: "(none)", message: "the lesson has no tables" });
  }

  for (const t of db.tables) {
    const key = t.name.toLowerCase();
    if (seenTables.has(key)) {
      problems.push({ table: t.name, message: "duplicate table name" });
    }
    seenTables.add(key);

    if (!IDENTIFIER.test(t.name) || RESERVED.has(key)) {
      problems.push({
        table: t.name,
        message: `table name "${t.name}" is not a safe bare identifier`,
      });
    }

    if (t.cols.length === 0) {
      problems.push({ table: t.name, message: "has no columns" });
    }

    const seenCols = new Set<string>();
    for (const c of t.cols) {
      const ck = c.toLowerCase();
      if (seenCols.has(ck)) {
        problems.push({ table: t.name, message: `duplicate column "${c}"` });
      }
      seenCols.add(ck);
      if (!IDENTIFIER.test(c) || RESERVED.has(ck)) {
        problems.push({
          table: t.name,
          message: `column name "${c}" is not a safe bare identifier`,
        });
      }
    }

    if (t.rows.length === 0) {
      problems.push({ table: t.name, message: "has no rows" });
    }

    t.rows.forEach((row, i) => {
      if (row.length !== t.cols.length) {
        problems.push({
          table: t.name,
          message: `row ${i + 1} has ${row.length} value${
            row.length === 1 ? "" : "s"
          }, the table declares ${t.cols.length} column${
            t.cols.length === 1 ? "" : "s"
          }`,
        });
      }
      row.forEach((v, j) => {
        const okType = v === null || typeof v === "string" || typeof v === "number";
        if (!okType) {
          problems.push({
            table: t.name,
            message: `row ${i + 1}, column ${j + 1} is ${typeof v}. Only string, number and null are allowed`,
          });
        }
        if (typeof v === "number" && !Number.isFinite(v)) {
          problems.push({
            table: t.name,
            message: `row ${i + 1}, column ${j + 1} is not a finite number`,
          });
        }
      });
    });
  }

  return problems;
}

/**
 * Builds the seed plan. Throws if the TableSet is invalid, because by the time
 * anything executes, the validator has already had its chance to report the
 * problem properly.
 */
export function buildSeed(db: TableSet): SeedPlan {
  const problems = validateTableSet(db);
  if (problems.length > 0) {
    throw new Error(
      `invalid lesson tables: ${problems
        .map((p) => `${p.table}: ${p.message}`)
        .join("; ")}`,
    );
  }

  const schema: string[] = [];
  const inserts: SeedPlan["inserts"] = [];

  for (const t of db.tables) {
    schema.push(`CREATE TABLE ${t.name} (${t.cols.join(", ")});`);
    const marks = t.cols.map(() => "?").join(", ");
    inserts.push({
      sql: `INSERT INTO ${t.name} (${t.cols.join(", ")}) VALUES (${marks});`,
      rows: t.rows,
    });
  }

  return { schema, inserts };
}
