import {
  err,
  isError,
  isMatrix,
  type Cell,
  type FormulaError,
  type Matrix,
  type Scalar,
  type Value,
} from "./types";

/* ------------------------------- coercion -------------------------------- */

export function toNumber(v: Value): number | FormulaError {
  if (isError(v)) return v;
  if (isMatrix(v)) {
    const flat = flatten(v);
    if (flat.length === 1) return toNumber(flat[0]);
    return err("#VALUE!");
  }
  if (v === null) return 0;
  if (typeof v === "number") return v;
  if (typeof v === "boolean") return v ? 1 : 0;
  const trimmed = v.trim();
  if (trimmed === "") return err("#VALUE!");
  const n = Number(trimmed);
  return Number.isNaN(n) ? err("#VALUE!") : n;
}

export function toText(v: Value): string | FormulaError {
  if (isError(v)) return v;
  if (isMatrix(v)) {
    const flat = flatten(v);
    if (flat.length === 1) return toText(flat[0]);
    return err("#VALUE!");
  }
  if (v === null) return "";
  if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
  return String(v);
}

export function toBoolean(v: Value): boolean | FormulaError {
  if (isError(v)) return v;
  if (isMatrix(v)) {
    const flat = flatten(v);
    if (flat.length === 1) return toBoolean(flat[0]);
    return err("#VALUE!");
  }
  if (v === null) return false;
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  const up = v.trim().toUpperCase();
  if (up === "TRUE") return true;
  if (up === "FALSE") return false;
  return err("#VALUE!");
}

/** A range used where a single value is wanted collapses only if 1x1. */
export function toScalar(v: Value): Cell {
  if (isMatrix(v)) {
    const flat = flatten(v);
    return flat.length === 1 ? flat[0] : err("#VALUE!");
  }
  return v;
}

export function flatten(m: Matrix): Cell[] {
  return m.values.flat();
}

/* ------------------------------ comparison ------------------------------- */

/** Excel orders numbers before text, and compares text case-insensitively. */
export function compare(a: Cell, b: Cell): number | FormulaError {
  if (isError(a)) return a;
  if (isError(b)) return b;

  const an = a === null ? 0 : a;
  const bn = b === null ? 0 : b;

  if (typeof an === "number" && typeof bn === "number") {
    return an === bn ? 0 : an < bn ? -1 : 1;
  }
  if (typeof an === "boolean" || typeof bn === "boolean") {
    const x = typeof an === "boolean" ? (an ? 1 : 0) : NaN;
    const y = typeof bn === "boolean" ? (bn ? 1 : 0) : NaN;
    if (!Number.isNaN(x) && !Number.isNaN(y)) return x === y ? 0 : x < y ? -1 : 1;
    return typeof an === "boolean" ? 1 : -1;
  }
  if (typeof an === "number") return -1;
  if (typeof bn === "number") return 1;

  const x = String(an).toUpperCase();
  const y = String(bn).toUpperCase();
  return x === y ? 0 : x < y ? -1 : 1;
}

export function looseEquals(a: Cell, b: Cell): boolean {
  const c = compare(a, b);
  return !isError(c) && c === 0;
}

/* ------------------------------- criteria -------------------------------- */

const CRIT_RE = /^(<>|>=|<=|=|>|<)([\s\S]*)$/;

function wildcardToRegExp(pattern: string): RegExp {
  let out = "";
  for (let i = 0; i < pattern.length; i++) {
    const ch = pattern[i];
    if (ch === "~" && (pattern[i + 1] === "*" || pattern[i + 1] === "?")) {
      out += pattern[++i].replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    } else if (ch === "*") out += ".*";
    else if (ch === "?") out += ".";
    else out += ch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp(`^${out}$`, "i");
}

/**
 * ">500", "<>Otago", "Waikato", 1042. Wildcards `*` and `?` are supported in
 * the equality forms, as in Excel.
 */
export function makeMatcher(criteria: Value): (cell: Cell) => boolean {
  const scalar = toScalar(criteria);
  if (isError(scalar)) return () => false;

  if (typeof scalar === "number" || typeof scalar === "boolean") {
    return (cell) => looseEquals(cell, scalar);
  }

  const text = scalar === null ? "" : String(scalar);
  const m = CRIT_RE.exec(text);

  if (!m) {
    if (/[*?]/.test(text)) {
      const re = wildcardToRegExp(text);
      return (cell) => typeof cell === "string" && re.test(cell);
    }
    return (cell) => looseEquals(cell, text);
  }

  const op = m[1];
  const rhsRaw = m[2].trim();
  const rhsNum = rhsRaw === "" ? NaN : Number(rhsRaw);
  const rhs: Cell = Number.isNaN(rhsNum) ? rhsRaw : rhsNum;

  if (op === "=" || op === "<>") {
    const wants = op === "=";
    if (typeof rhs === "string" && /[*?]/.test(rhs)) {
      const re = wildcardToRegExp(rhs);
      return (cell) =>
        (typeof cell === "string" && re.test(cell)) === wants;
    }
    if (rhsRaw === "") {
      return (cell) => (cell === null || cell === "") === wants;
    }
    return (cell) => looseEquals(cell, rhs) === wants;
  }

  return (cell) => {
    if (cell === null) return false;
    const c = compare(cell, rhs);
    if (isError(c)) return false;
    // Excel does not compare text against a numeric threshold.
    if (typeof rhs === "number" && typeof cell !== "number") return false;
    switch (op) {
      case ">":
        return c > 0;
      case ">=":
        return c >= 0;
      case "<":
        return c < 0;
      case "<=":
        return c <= 0;
      default:
        return false;
    }
  };
}

/* ------------------------------- functions ------------------------------- */

type Fn = (args: Value[]) => Value;

/** Numbers only, the way SUM and AVERAGE read a range. */
function numbersIn(args: Value[]): number[] | FormulaError {
  const out: number[] = [];
  for (const a of args) {
    if (isError(a)) return a;
    if (isMatrix(a)) {
      for (const cell of flatten(a)) {
        if (isError(cell)) return cell;
        if (typeof cell === "number") out.push(cell);
      }
    } else {
      const n = toNumber(a);
      if (isError(n)) return n;
      out.push(n);
    }
  }
  return out;
}

function asMatrix(v: Value): Matrix | FormulaError {
  if (isError(v)) return v;
  if (isMatrix(v)) return v;
  return err("#VALUE!");
}

function sameShape(a: Matrix, b: Matrix): boolean {
  return (
    a.values.length === b.values.length &&
    a.values.every((row, i) => row.length === b.values[i].length)
  );
}

/** A single row or single column, read left-to-right / top-to-bottom. */
function vector(m: Matrix): Cell[] | FormulaError {
  const rows = m.values.length;
  const cols = m.values[0]?.length ?? 0;
  if (rows !== 1 && cols !== 1) return err("#VALUE!");
  return flatten(m);
}

export const FUNCTIONS: Record<string, Fn> = {
  SUM(args) {
    const nums = numbersIn(args);
    if (isError(nums)) return nums;
    return nums.reduce((a, b) => a + b, 0);
  },

  AVERAGE(args) {
    const nums = numbersIn(args);
    if (isError(nums)) return nums;
    if (nums.length === 0) return err("#DIV/0!");
    return nums.reduce((a, b) => a + b, 0) / nums.length;
  },

  MIN(args) {
    const nums = numbersIn(args);
    if (isError(nums)) return nums;
    return nums.length === 0 ? 0 : Math.min(...nums);
  },

  MAX(args) {
    const nums = numbersIn(args);
    if (isError(nums)) return nums;
    return nums.length === 0 ? 0 : Math.max(...nums);
  },

  ROUND(args) {
    if (args.length !== 2) return err("#VALUE!");
    const number = toNumber(args[0]);
    if (isError(number)) return number;
    const digits = toNumber(args[1]);
    if (isError(digits)) return digits;
    const places = Math.trunc(digits);
    const factor = 10 ** places;
    if (!Number.isFinite(factor)) return err("#NUM!");
    const scaled = Math.abs(number) * factor;
    return Math.sign(number) * Math.floor(scaled + 0.5 + Number.EPSILON) / factor;
  },

  COUNT(args) {
    let n = 0;
    for (const a of args) {
      if (isError(a)) continue;
      if (isMatrix(a)) {
        for (const cell of flatten(a)) if (typeof cell === "number") n++;
      } else {
        const num = toNumber(a);
        if (!isError(num)) n++;
      }
    }
    return n;
  },

  COUNTA(args) {
    let n = 0;
    for (const a of args) {
      if (isMatrix(a)) {
        for (const cell of flatten(a)) if (cell !== null) n++;
      } else if (a !== null) {
        n++;
      }
    }
    return n;
  },

  IF(args) {
    if (args.length < 2) return err("#VALUE!");
    const test = toBoolean(args[0]);
    if (isError(test)) return test;
    if (test) return toScalar(args[1]);
    return args.length > 2 ? toScalar(args[2]) : false;
  },

  AND(args) {
    if (args.length === 0) return err("#VALUE!");
    for (const arg of args) {
      const values = isMatrix(arg) ? flatten(arg) : [arg];
      for (const value of values) {
        const result = toBoolean(value);
        if (isError(result)) return result;
        if (!result) return false;
      }
    }
    return true;
  },

  OR(args) {
    if (args.length === 0) return err("#VALUE!");
    for (const arg of args) {
      const values = isMatrix(arg) ? flatten(arg) : [arg];
      for (const value of values) {
        const result = toBoolean(value);
        if (isError(result)) return result;
        if (result) return true;
      }
    }
    return false;
  },

  IFERROR(args) {
    if (args.length !== 2) return err("#VALUE!");
    return isError(args[0]) ? toScalar(args[1]) : toScalar(args[0]);
  },

  LEFT(args) {
    if (args.length < 1 || args.length > 2) return err("#VALUE!");
    const text = toText(args[0]);
    if (isError(text)) return text;
    const count = args.length === 2 ? toNumber(args[1]) : 1;
    if (isError(count)) return count;
    if (count < 0) return err("#VALUE!");
    return text.slice(0, Math.trunc(count));
  },

  RIGHT(args) {
    if (args.length < 1 || args.length > 2) return err("#VALUE!");
    const text = toText(args[0]);
    if (isError(text)) return text;
    const count = args.length === 2 ? toNumber(args[1]) : 1;
    if (isError(count)) return count;
    if (count < 0) return err("#VALUE!");
    const n = Math.trunc(count);
    return n === 0 ? "" : text.slice(-n);
  },

  MID(args) {
    if (args.length !== 3) return err("#VALUE!");
    const text = toText(args[0]);
    if (isError(text)) return text;
    const start = toNumber(args[1]);
    if (isError(start)) return start;
    const count = toNumber(args[2]);
    if (isError(count)) return count;
    if (start < 1 || count < 0) return err("#VALUE!");
    return text.slice(Math.trunc(start) - 1, Math.trunc(start) - 1 + Math.trunc(count));
  },

  LEN(args) {
    if (args.length !== 1) return err("#VALUE!");
    const text = toText(args[0]);
    return isError(text) ? text : text.length;
  },

  TRIM(args) {
    if (args.length !== 1) return err("#VALUE!");
    const text = toText(args[0]);
    return isError(text) ? text : text.trim().replace(/\s+/g, " ");
  },

  CONCAT(args) {
    if (args.length === 0) return err("#VALUE!");
    let result = "";
    for (const arg of args) {
      const values = isMatrix(arg) ? flatten(arg) : [arg];
      for (const value of values) {
        const text = toText(value);
        if (isError(text)) return text;
        result += text;
      }
    }
    return result;
  },

  COUNTIF(args) {
    if (args.length !== 2) return err("#VALUE!");
    const range = asMatrix(args[0]);
    if (isError(range)) return range;
    const match = makeMatcher(args[1]);
    return flatten(range).filter(match).length;
  },

  SUMIF(args) {
    if (args.length < 2 || args.length > 3) return err("#VALUE!");
    const range = asMatrix(args[0]);
    if (isError(range)) return range;
    const match = makeMatcher(args[1]);

    let sumCells: Cell[];
    const testCells = flatten(range);
    if (args.length === 3) {
      const sumRange = asMatrix(args[2]);
      if (isError(sumRange)) return sumRange;
      if (!sameShape(range, sumRange)) return err("#VALUE!");
      sumCells = flatten(sumRange);
    } else {
      sumCells = testCells;
    }

    let total = 0;
    testCells.forEach((cell, i) => {
      if (!match(cell)) return;
      const v = sumCells[i];
      if (typeof v === "number") total += v;
    });
    return total;
  },

  COUNTIFS(args) {
    if (args.length < 2 || args.length % 2 !== 0) return err("#VALUE!");
    const pairs: { cells: Cell[]; match: (c: Cell) => boolean }[] = [];
    let length = -1;

    for (let i = 0; i < args.length; i += 2) {
      const range = asMatrix(args[i]);
      if (isError(range)) return range;
      const cells = flatten(range);
      if (length === -1) length = cells.length;
      else if (cells.length !== length) return err("#VALUE!");
      pairs.push({ cells, match: makeMatcher(args[i + 1]) });
    }

    let n = 0;
    for (let i = 0; i < length; i++) {
      if (pairs.every((p) => p.match(p.cells[i]))) n++;
    }
    return n;
  },

  SUMIFS(args) {
    if (args.length < 3 || args.length % 2 !== 1) return err("#VALUE!");
    const sumRange = asMatrix(args[0]);
    if (isError(sumRange)) return sumRange;
    const sumCells = flatten(sumRange);

    const pairs: { cells: Cell[]; match: (c: Cell) => boolean }[] = [];
    for (let i = 1; i < args.length; i += 2) {
      const range = asMatrix(args[i]);
      if (isError(range)) return range;
      const cells = flatten(range);
      if (cells.length !== sumCells.length) return err("#VALUE!");
      pairs.push({ cells, match: makeMatcher(args[i + 1]) });
    }

    let total = 0;
    for (let i = 0; i < sumCells.length; i++) {
      if (!pairs.every((p) => p.match(p.cells[i]))) continue;
      const v = sumCells[i];
      if (typeof v === "number") total += v;
    }
    return total;
  },

  VLOOKUP(args) {
    if (args.length < 3 || args.length > 4) return err("#VALUE!");
    const needle = toScalar(args[0]);
    if (isError(needle)) return needle;
    const table = asMatrix(args[1]);
    if (isError(table)) return table;
    const colIndex = toNumber(args[2]);
    if (isError(colIndex)) return colIndex;

    const width = table.values[0]?.length ?? 0;
    if (colIndex < 1) return err("#VALUE!");
    if (colIndex > width) return err("#REF!");

    const approximate =
      args.length < 4 ? true : (() => {
        const b = toBoolean(args[3]);
        return isError(b) ? true : b;
      })();

    if (!approximate) {
      for (const row of table.values) {
        if (looseEquals(row[0], needle)) return row[colIndex - 1] ?? null;
      }
      return err("#N/A");
    }

    let best: Cell[] | null = null;
    for (const row of table.values) {
      const c = compare(row[0], needle);
      if (isError(c)) continue;
      if (c <= 0) best = row;
      else break;
    }
    return best ? best[colIndex - 1] ?? null : err("#N/A");
  },

  XLOOKUP(args) {
    if (args.length < 3 || args.length > 6) return err("#VALUE!");
    const needle = toScalar(args[0]);
    if (isError(needle)) return needle;

    const lookupM = asMatrix(args[1]);
    if (isError(lookupM)) return lookupM;
    const returnM = asMatrix(args[2]);
    if (isError(returnM)) return returnM;

    const lookup = vector(lookupM);
    if (isError(lookup)) return lookup;
    const back = vector(returnM);
    if (isError(back)) return back;
    if (lookup.length !== back.length) return err("#VALUE!");

    const notFound: Value | undefined = args.length >= 4 ? args[3] : undefined;
    const modeRaw = args.length >= 5 ? toNumber(args[4]) : 0;
    const mode = isError(modeRaw) ? 0 : modeRaw;

    const miss = (): Value =>
      notFound === undefined ? err("#N/A") : toScalar(notFound);

    if (mode === 2) {
      const match = makeMatcher(needle);
      const i = lookup.findIndex((c) => match(c));
      return i === -1 ? miss() : back[i];
    }

    const exact = lookup.findIndex((c) => looseEquals(c, needle));
    if (exact !== -1) return back[exact];
    if (mode === 0) return miss();

    let chosen = -1;
    lookup.forEach((cell, i) => {
      const c = compare(cell, needle);
      if (isError(c)) return;
      if (mode === -1 && c < 0) {
        if (chosen === -1 || (compare(cell, lookup[chosen]) as number) > 0) chosen = i;
      }
      if (mode === 1 && c > 0) {
        if (chosen === -1 || (compare(cell, lookup[chosen]) as number) < 0) chosen = i;
      }
    });
    return chosen === -1 ? miss() : back[chosen];
  },

  INDEX(args) {
    if (args.length < 2 || args.length > 3) return err("#VALUE!");
    const matrix = asMatrix(args[0]);
    if (isError(matrix)) return matrix;
    const row = toNumber(args[1]);
    if (isError(row)) return row;
    const col = args.length === 3 ? toNumber(args[2]) : 1;
    if (isError(col)) return col;
    const r = Math.trunc(row);
    const c = Math.trunc(col);
    if (r < 1 || c < 1) return err("#VALUE!");
    if (r > matrix.values.length || c > (matrix.values[0]?.length ?? 0)) {
      return err("#REF!");
    }
    return matrix.values[r - 1]?.[c - 1] ?? null;
  },

  MATCH(args) {
    if (args.length < 2 || args.length > 3) return err("#VALUE!");
    const needle = toScalar(args[0]);
    if (isError(needle)) return needle;
    const matrix = asMatrix(args[1]);
    if (isError(matrix)) return matrix;
    const values = vector(matrix);
    if (isError(values)) return values;
    const modeRaw = args.length === 3 ? toNumber(args[2]) : 1;
    if (isError(modeRaw)) return modeRaw;
    const mode = Math.trunc(modeRaw);

    if (mode === 0) {
      const found = values.findIndex((value) => looseEquals(value, needle));
      return found === -1 ? err("#N/A") : found + 1;
    }

    let chosen = -1;
    values.forEach((value, index) => {
      const comparison = compare(value, needle);
      if (isError(comparison)) return;
      if (mode === 1 && comparison <= 0) chosen = index;
      if (mode === -1 && comparison >= 0 && chosen === -1) chosen = index;
    });
    return chosen === -1 ? err("#N/A") : chosen + 1;
  },
};

export function isKnownFunction(name: string): boolean {
  return Object.prototype.hasOwnProperty.call(FUNCTIONS, name.toUpperCase());
}

export const FUNCTION_NAMES = Object.keys(FUNCTIONS).sort();

export type { Scalar };
