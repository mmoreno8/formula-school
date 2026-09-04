import type { Sheet } from "@/lib/schema";

export type ErrCode =
  | "#N/A"
  | "#VALUE!"
  | "#REF!"
  | "#DIV/0!"
  | "#NAME?"
  | "#NUM!";

export interface FormulaError {
  kind: "error";
  code: ErrCode;
}

/** An empty cell. Distinct from "" so COUNT and COUNTA can differ. */
export type Blank = null;

export type Scalar = number | string | boolean | FormulaError;
export type Cell = Scalar | Blank;

export interface Matrix {
  kind: "range";
  values: Cell[][];
  a1: string;
}

export type Value = Cell | Matrix;

export function err(code: ErrCode): FormulaError {
  return { kind: "error", code };
}

/** Deliberately takes `unknown`: helpers return `T | FormulaError` unions
 *  that are not assignable to `Value`, and they all need this guard. */
export function isError(v: unknown): v is FormulaError {
  return (
    typeof v === "object" &&
    v !== null &&
    !Array.isArray(v) &&
    (v as FormulaError).kind === "error"
  );
}

export function isMatrix(v: unknown): v is Matrix {
  return (
    typeof v === "object" &&
    v !== null &&
    !Array.isArray(v) &&
    (v as Matrix).kind === "range"
  );
}

export interface EvalContext {
  sheet: Sheet;
}
