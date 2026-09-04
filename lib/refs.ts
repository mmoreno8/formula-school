/** Cell reference maths. Pure, no React, used by the evaluator and the grid. */

export interface CellAddr {
  col: number; // 1-based, A = 1
  row: number; // 1-based
}

export interface RangeAddr {
  c1: number;
  r1: number;
  c2: number;
  r2: number;
}

const REF_RE = /^\$?([A-Za-z]{1,3})\$?([0-9]{1,7})$/;
const COL_RE = /^\$?([A-Za-z]{1,3})$/;

export function colToIndex(letters: string): number {
  let n = 0;
  const up = letters.toUpperCase();
  for (let i = 0; i < up.length; i++) {
    n = n * 26 + (up.charCodeAt(i) - 64);
  }
  return n;
}

export function indexToCol(index: number): string {
  let n = index;
  let out = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    out = String.fromCharCode(65 + rem) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
}

export function parseRef(text: string): CellAddr | null {
  const m = REF_RE.exec(text.trim());
  if (!m) return null;
  const row = Number(m[2]);
  if (row < 1) return null;
  return { col: colToIndex(m[1]), row };
}

export function formatRef(addr: CellAddr): string {
  return indexToCol(addr.col) + addr.row;
}

/**
 * Parses "A2:A9" and whole-column "A:A". Whole-column refs need the sheet's
 * row count, which the caller supplies.
 */
export function parseRange(text: string, maxRow = 1000): RangeAddr | null {
  const raw = text.trim();
  const bits = raw.split(":");
  if (bits.length !== 2) return null;

  const a = parseRef(bits[0]);
  const b = parseRef(bits[1]);
  if (a && b) {
    return {
      c1: Math.min(a.col, b.col),
      r1: Math.min(a.row, b.row),
      c2: Math.max(a.col, b.col),
      r2: Math.max(a.row, b.row),
    };
  }

  const ca = COL_RE.exec(bits[0]);
  const cb = COL_RE.exec(bits[1]);
  if (ca && cb) {
    const x = colToIndex(ca[1]);
    const y = colToIndex(cb[1]);
    return { c1: Math.min(x, y), r1: 1, c2: Math.max(x, y), r2: maxRow };
  }

  return null;
}

export function formatRange(r: RangeAddr): string {
  return `${indexToCol(r.c1)}${r.r1}:${indexToCol(r.c2)}${r.r2}`;
}

/** "a2:a9" and "$A$2:$A$9" both normalise to "A2:A9". "a2" to "A2". */
export function normaliseRef(text: string): string {
  const raw = text.trim();
  const range = raw.split(":");
  if (range.length === 2) {
    const parsed = parseRange(raw);
    return parsed ? formatRange(parsed) : raw.toUpperCase().replace(/\$/g, "");
  }
  const cell = parseRef(raw);
  return cell ? formatRef(cell) : raw.toUpperCase().replace(/\$/g, "");
}

export function rangeContains(r: RangeAddr, addr: CellAddr): boolean {
  return (
    addr.col >= r.c1 && addr.col <= r.c2 && addr.row >= r.r1 && addr.row <= r.r2
  );
}

/** The rectangle covering two corner cells, in either order. */
export function rangeBetween(a: CellAddr, b: CellAddr): RangeAddr {
  return {
    c1: Math.min(a.col, b.col),
    r1: Math.min(a.row, b.row),
    c2: Math.max(a.col, b.col),
    r2: Math.max(a.row, b.row),
  };
}
