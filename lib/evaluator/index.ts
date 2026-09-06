import type { CellInput, Sheet } from "@/lib/schema";
import {
  colToIndex,
  formatRef,
  indexToCol,
  parseRange,
  parseRef,
} from "@/lib/refs";
import { FormulaSyntaxError } from "./lexer";
import { functionsUsed, parse, refsUsed, type Node } from "./parser";
import {
  compare,
  FUNCTIONS,
  toNumber,
  toScalar,
  toText,
} from "./functions";
import {
  err,
  isError,
  isMatrix,
  type Cell,
  type Matrix,
  type Value,
} from "./types";

export * from "./types";
export { FUNCTION_NAMES, isKnownFunction } from "./functions";
export { FormulaSyntaxError } from "./lexer";
export { parse, functionsUsed, refsUsed } from "./parser";

/* --------------------------------- sheet --------------------------------- */

function maxCol(sheet: Sheet): number {
  return sheet.cols.reduce((m, c) => {
    const i = c ? colToIndex(c) : 0;
    return i > m ? i : m;
  }, 0);
}

export function readCell(sheet: Sheet, col: number, row: number): Cell {
  if (col < 1 || row < 1 || row > sheet.rows || col > maxCol(sheet)) {
    return null;
  }
  const v = sheet.cells[indexToCol(col) + row];
  return v === undefined ? null : v;
}

function readRange(sheet: Sheet, a1: string): Matrix | Value {
  const parsed = parseRange(a1, sheet.rows);
  if (!parsed) return err("#REF!");

  const r1 = Math.max(1, parsed.r1);
  const r2 = Math.min(sheet.rows, parsed.r2);
  const c1 = Math.max(1, parsed.c1);
  const c2 = Math.min(maxCol(sheet), parsed.c2);
  if (r2 < r1 || c2 < c1) return err("#REF!");

  const values: Cell[][] = [];
  for (let r = r1; r <= r2; r++) {
    const row: Cell[] = [];
    for (let c = c1; c <= c2; c++) row.push(readCell(sheet, c, r));
    values.push(row);
  }
  return { kind: "range", values, a1: a1.toUpperCase().replace(/\$/g, "") };
}

/* ------------------------------- evaluation ------------------------------ */

function binary(op: string, l: Value, r: Value): Value {
  if (isError(l)) return l;
  if (isError(r)) return r;

  if (op === "&") {
    const a = toText(l);
    if (isError(a)) return a;
    const b = toText(r);
    if (isError(b)) return b;
    return a + b;
  }

  if (["=", "<>", "<", "<=", ">", ">="].includes(op)) {
    const c = compare(toScalar(l), toScalar(r));
    if (isError(c)) return c;
    switch (op) {
      case "=":
        return c === 0;
      case "<>":
        return c !== 0;
      case "<":
        return c < 0;
      case "<=":
        return c <= 0;
      case ">":
        return c > 0;
      default:
        return c >= 0;
    }
  }

  const a = toNumber(l);
  if (isError(a)) return a;
  const b = toNumber(r);
  if (isError(b)) return b;

  switch (op) {
    case "+":
      return a + b;
    case "-":
      return a - b;
    case "*":
      return a * b;
    case "/":
      return b === 0 ? err("#DIV/0!") : a / b;
    case "^": {
      const p = Math.pow(a, b);
      return Number.isFinite(p) ? p : err("#NUM!");
    }
    default:
      return err("#VALUE!");
  }
}

function evalNode(node: Node, sheet: Sheet): Value {
  switch (node.t) {
    case "num":
      return node.v;
    case "str":
      return node.v;
    case "bool":
      return node.v;

    case "ref": {
      const addr = parseRef(node.a1);
      if (!addr) return err("#NAME?");
      return readCell(sheet, addr.col, addr.row);
    }

    case "range":
      return readRange(sheet, node.a1);

    case "call": {
      const fn = FUNCTIONS[node.fn];
      if (!fn) return err("#NAME?");
      const args = node.args.map((a) => evalNode(a, sheet));
      const firstError = args.find(isError);
      // IF has to see its own errors so it can still branch; everything else
      // propagates the first error it is handed.
      if (firstError && node.fn !== "IFERROR") return fn(args);
      return fn(args);
    }

    case "un": {
      const v = evalNode(node.e, sheet);
      if (isError(v)) return v;
      const n = toNumber(v);
      if (isError(n)) return n;
      return node.op === "-" ? -n : n;
    }

    case "bin":
      return binary(node.op, evalNode(node.l, sheet), evalNode(node.r, sheet));
  }
}

/* --------------------------------- public -------------------------------- */

export interface EvalOk {
  ok: true;
  value: Cell;
  /** Uppercased function names used anywhere in the formula. */
  functions: Set<string>;
}

export interface EvalFail {
  ok: false;
  reason: "empty" | "syntax";
  message: string;
}

export type EvalResult = EvalOk | EvalFail;

export function evaluate(formula: string, sheet: Sheet): EvalResult {
  const raw = formula.trim();
  if (raw === "" || raw === "=") {
    return { ok: false, reason: "empty", message: "Write a formula first." };
  }
  if (!raw.startsWith("=")) {
    return {
      ok: false,
      reason: "syntax",
      message: "A formula starts with =",
    };
  }

  let tree: Node;
  try {
    tree = parse(raw.slice(1));
  } catch (e) {
    return {
      ok: false,
      reason: "syntax",
      message:
        e instanceof FormulaSyntaxError ? e.message : "That is not a formula yet.",
    };
  }

  const value = evalNode(tree, sheet);
  return {
    ok: true,
    value: isMatrix(value) ? toScalar(value) : value,
    functions: functionsUsed(tree),
  };
}

/** Display only. Comparison always uses the raw value. */
export function formatValue(v: Cell): string {
  if (v === null) return "";
  if (isError(v)) return v.code;
  if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
  if (typeof v === "number") {
    if (!Number.isFinite(v)) return "#NUM!";
    const rounded = Math.round(v * 100) / 100;
    return rounded.toLocaleString("en-NZ", { maximumFractionDigits: 2 });
  }
  return v;
}

const TOLERANCE = 1e-6;

export function valuesMatch(
  actual: Cell,
  expected: string | number | boolean,
): boolean {
  if (actual === null || isError(actual)) return false;
  if (typeof expected === "number") {
    if (typeof actual !== "number") return false;
    return Math.abs(actual - expected) <= TOLERANCE * Math.max(1, Math.abs(expected));
  }
  if (typeof expected === "boolean") return actual === expected;
  if (typeof actual === "number") return String(actual) === expected.trim();
  if (typeof actual === "boolean") {
    return (actual ? "TRUE" : "FALSE") === expected.trim().toUpperCase();
  }
  return actual.trim().toLowerCase() === expected.trim().toLowerCase();
}

export function usesAllOf(used: Set<string>, required: string[]): boolean {
  return required.every((fn) => used.has(fn.toUpperCase()));
}

/* ------------------------- does the answer read the data? ----------------- */

/** Every cell a formula reads, with ranges expanded, as "D2" addresses. */
export function cellsRead(formula: string, sheet: Sheet): Set<string> {
  const out = new Set<string>();
  const raw = formula.trim();
  let tree: Node;
  try {
    // parse() takes the expression, not the leading "=", the same way
    // evaluate() feeds it.
    tree = parse(raw.startsWith("=") ? raw.slice(1) : raw);
  } catch {
    return out;
  }
  for (const a1 of refsUsed(tree)) {
    const single = parseRef(a1);
    if (single) {
      out.add(formatRef(single));
      continue;
    }
    const r = parseRange(a1, sheet.rows);
    if (!r) continue;
    for (let row = r.r1; row <= r.r2; row++) {
      for (let col = r.c1; col <= r.c2; col++) {
        out.add(`${indexToCol(col)}${row}`);
      }
    }
  }
  return out;
}

/**
 * Depth beyond the first pass, not coverage. Every cell the model answer reads
 * gets a variant before any of this is spent, so a long range can never run
 * out of budget before its last cells are tried.
 */
const EXTRA_VARIANTS = 12;

/**
 * Other values from a cell's own column, in row order, without repeats.
 *
 * Substituting real values from the same column keeps every variant a sheet
 * the lesson author could have written, so no invented number can land on a
 * threshold they never intended. Row 1 is the header and is left alone.
 */
function swapsFor(sheet: Sheet, ref: string, header: number): CellInput[] {
  const addr = parseRef(ref);
  if (!addr || addr.row === header) return [];
  const current = sheet.cells[ref];
  if (current === undefined) return [];

  const column = indexToCol(addr.col);
  const seen = new Set<string>([String(current)]);
  const out: CellInput[] = [];
  for (let row = header + 1; row <= sheet.rows; row++) {
    if (row === addr.row) continue;
    const swap = sheet.cells[`${column}${row}`];
    if (swap === undefined || typeof swap !== typeof current) continue;
    const key = String(swap);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(swap);
  }
  return out;
}

/**
 * Copies of the sheet with one of the canonical's cells swapped for another
 * value from its own column.
 *
 * Coverage comes first: the opening pass gives every cell the model answer
 * reads exactly one variant, so a formula that quietly drops the tail of a
 * range is caught the same way one that drops the head is. An earlier version
 * spent a flat budget of twelve cell by cell, which meant D2 and D3 used it up
 * and `=SUM(D2:D8)+670` sailed through: D9 was never once changed, so the
 * hardcoded 670 was never wrong.
 *
 * Later passes add depth, one more value per cell per pass, handed out in turn
 * so no single cell hoards them, and stop after EXTRA_VARIANTS. Total work is
 * linear in the number of cells read, never a product of them.
 */
export function variantSheets(sheet: Sheet, cells: Set<string>): Sheet[] {
  const header = sheet.headerRow ?? 1;

  const candidates: { ref: string; swaps: CellInput[] }[] = [];
  for (const ref of cells) {
    const swaps = swapsFor(sheet, ref, header);
    if (swaps.length > 0) candidates.push({ ref, swaps });
  }

  const variant = (ref: string, value: CellInput): Sheet => ({
    ...sheet,
    cells: { ...sheet.cells, [ref]: value },
  });

  // Pass one: every cell, no budget. This is the guarantee.
  const out: Sheet[] = candidates.map((c) => variant(c.ref, c.swaps[0]));

  // The rest is depth, round robin, and it is allowed to run out.
  let budget = EXTRA_VARIANTS;
  for (let round = 1; budget > 0; round++) {
    let placed = false;
    for (const c of candidates) {
      if (round >= c.swaps.length) continue;
      out.push(variant(c.ref, c.swaps[round]));
      placed = true;
      if (--budget === 0) break;
    }
    if (!placed) break;
  }

  return out;
}

/**
 * The single place that decides whether a typed formula counts as correct.
 * Used by the Build step, the formula exercise, and the validator, so they
 * can never disagree.
 */
export function checkFormula(
  formula: string,
  sheet: Sheet,
  spec: {
    expected: string | number | boolean;
    mustUse: string[];
    /** When given, the answer must behave like this one, not merely land on
     *  the same value. See agreesWithCanonical below. */
    canonical?: string;
  },
): { status: "correct" } | { status: "wrong"; value: Cell } | EvalFail {
  const res = evaluate(formula, sheet);
  if (!res.ok) return res;
  if (!usesAllOf(res.functions, spec.mustUse)) {
    return { status: "wrong", value: res.value };
  }
  if (!valuesMatch(res.value, spec.expected)) {
    return { status: "wrong", value: res.value };
  }
  if (spec.canonical && !agreesWithCanonical(formula, spec.canonical, sheet)) {
    return { status: "wrong", value: res.value };
  }
  return { status: "correct" };
}

/**
 * Does this formula behave like the model answer, or does it only happen to
 * land on the same value for this one row?
 *
 * A single cell cannot tell those apart. `=IF(D2 > 1000, "Review", "Fine")`
 * and `=IF(D2, "Review", "Fine")` both return "Review" for an amount of 1250,
 * and the second one is not a rule about a thousand dollars at all: it returns
 * "Review" for every amount that is not zero. Comparing the two against
 * changed data is what separates them, so both are run over sheets where one
 * of the cells the model answer reads has been swapped for another value from
 * its own column. Disagree on any of them and the answer is wrong.
 *
 * Variants where the model answer itself cannot be evaluated are skipped, so a
 * learner is never failed by a sheet the lesson could not handle either.
 */
/**
 * Same leniency the expected-value check uses, so the two never disagree.
 * Text compares case-insensitively and numbers within tolerance, because a
 * learner who types "review" has not made a mistake about IF.
 */
function sameValue(a: Cell, b: Cell): boolean {
  if (typeof a === "number" && typeof b === "number") {
    return Math.abs(a - b) <= TOLERANCE * Math.max(1, Math.abs(b));
  }
  return (
    formatValue(a).trim().toLowerCase() === formatValue(b).trim().toLowerCase()
  );
}

export function agreesWithCanonical(
  formula: string,
  canonical: string,
  sheet: Sheet,
): boolean {
  const cells = cellsRead(canonical, sheet);
  if (cells.size === 0) return true;

  for (const variant of variantSheets(sheet, cells)) {
    const theirs = evaluate(canonical, variant);
    if (!theirs.ok) continue;
    const mine = evaluate(formula, variant);
    if (!mine.ok) return false;
    if (!sameValue(mine.value, theirs.value)) return false;
  }
  return true;
}
