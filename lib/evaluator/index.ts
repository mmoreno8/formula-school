import type { Sheet } from "@/lib/schema";
import { colToIndex, indexToCol, parseRange, parseRef } from "@/lib/refs";
import { FormulaSyntaxError } from "./lexer";
import { functionsUsed, parse, type Node } from "./parser";
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
export { parse, functionsUsed } from "./parser";

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

/**
 * The single place that decides whether a typed formula counts as correct.
 * Used by the Build step, the formula exercise, and the validator, so they
 * can never disagree.
 */
export function checkFormula(
  formula: string,
  sheet: Sheet,
  spec: { expected: string | number | boolean; mustUse: string[] },
): { status: "correct" } | { status: "wrong"; value: Cell } | EvalFail {
  const res = evaluate(formula, sheet);
  if (!res.ok) return res;
  if (!usesAllOf(res.functions, spec.mustUse)) {
    return { status: "wrong", value: res.value };
  }
  return valuesMatch(res.value, spec.expected)
    ? { status: "correct" }
    : { status: "wrong", value: res.value };
}
