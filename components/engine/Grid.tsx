"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { Sheet } from "@/lib/schema";
import { indexToCol, colToIndex, type CellAddr, type RangeAddr } from "@/lib/refs";
import { readCell } from "@/lib/evaluator";

interface Props {
  sheet: Sheet;
  /** Describes the table for screen readers. */
  caption: string;
  /** Cells inside this rectangle are highlighted. */
  highlight?: RangeAddr | null;
  onPickCell?: (addr: CellAddr, ref: string) => void;
  /** Given "A" and the data-rows range "A2:A9". */
  onPickColumn?: (col: string, range: string) => void;
}

function cellText(sheet: Sheet, col: number, row: number): string {
  const v = readCell(sheet, col, row);
  if (v === null) return "";
  if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
  if (typeof v === "object") return "";
  return String(v);
}

/**
 * A small spreadsheet grid, used only where selecting a cell or a range is
 * genuinely part of the exercise. BRIEF.md section 1.
 *
 * The whole grid is a single tab stop with arrow-key movement, the way a real
 * spreadsheet behaves, rather than fifty tab stops before the formula bar.
 */
export function Grid({ sheet, caption, highlight, onPickCell, onPickColumn }: Props) {
  const headerRow = sheet.headerRow ?? 1;
  const cols = useMemo(() => sheet.cols.filter(Boolean), [sheet.cols]);
  const interactive = Boolean(onPickCell || onPickColumn);

  // Row 0 is the strip of column letters; rows 1..n are the sheet's own rows.
  const [focus, setFocus] = useState<{ r: number; c: number }>({ r: 1, c: 0 });
  const buttons = useRef(new Map<string, HTMLButtonElement | null>());

  const key = (r: number, c: number) => `${r}:${c}`;

  const move = useCallback(
    (dr: number, dc: number) => {
      setFocus((f) => {
        const r = Math.min(sheet.rows, Math.max(0, f.r + dr));
        const c = Math.min(cols.length - 1, Math.max(0, f.c + dc));
        buttons.current.get(key(r, c))?.focus();
        return { r, c };
      });
    },
    [cols.length, sheet.rows],
  );

  function onKeyDown(e: React.KeyboardEvent<HTMLTableElement>) {
    switch (e.key) {
      case "ArrowUp":
        e.preventDefault();
        move(-1, 0);
        break;
      case "ArrowDown":
        e.preventDefault();
        move(1, 0);
        break;
      case "ArrowLeft":
        e.preventDefault();
        move(0, -1);
        break;
      case "ArrowRight":
        e.preventDefault();
        move(0, 1);
        break;
      case "Home":
        e.preventDefault();
        setFocus((f) => {
          buttons.current.get(key(f.r, 0))?.focus();
          return { ...f, c: 0 };
        });
        break;
      case "End":
        e.preventDefault();
        setFocus((f) => {
          buttons.current.get(key(f.r, cols.length - 1))?.focus();
          return { ...f, c: cols.length - 1 };
        });
        break;
    }
  }

  function inHighlight(colIndex: number, row: number): boolean {
    if (!highlight) return false;
    return (
      colIndex >= highlight.c1 &&
      colIndex <= highlight.c2 &&
      row >= highlight.r1 &&
      row <= highlight.r2
    );
  }

  const cellBase =
    "block h-full w-full truncate px-2.5 py-[7px] text-left font-mono text-[13px]";

  return (
    <div className="overflow-x-auto">
      <table
        onKeyDown={interactive ? onKeyDown : undefined}
        className="w-full min-w-[430px] table-fixed border-collapse"
      >
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            <th scope="col" className="w-7 border border-line bg-raise p-0">
              <span className="sr-only">Row number</span>
            </th>
            {cols.map((col, i) => {
              const focused = focus.r === 0 && focus.c === i;
              const range = `${col}${headerRow + 1}:${col}${sheet.rows}`;
              return (
                <th
                  key={col}
                  scope="col"
                  className="border border-line bg-raise p-0 text-[11px] font-normal text-ink-3"
                >
                  {onPickColumn ? (
                    <button
                      type="button"
                      ref={(el) => {
                        buttons.current.set(key(0, i), el);
                      }}
                      tabIndex={focused ? 0 : -1}
                      onFocus={() => setFocus({ r: 0, c: i })}
                      onClick={() => onPickColumn(col, range)}
                      className="w-full px-1 py-1 hover:bg-line-2"
                      aria-label={`Column ${col}. Insert the range ${range}`}
                    >
                      {col}
                    </button>
                  ) : (
                    <span className="block px-1 py-1">{col}</span>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: sheet.rows }, (_, i) => i + 1).map((row) => (
            <tr key={row}>
              <th
                scope="row"
                className="border border-line bg-raise px-1 py-[7px] text-center text-[11px] font-normal text-ink-3"
              >
                {row}
              </th>
              {cols.map((col, i) => {
                const colIndex = colToIndex(col);
                const text = cellText(sheet, colIndex, row);
                const ref = `${indexToCol(colIndex)}${row}`;
                const isHeader = row === headerRow;
                const lit = inHighlight(colIndex, row);
                const focused = focus.r === row && focus.c === i;

                const tone = isHeader
                  ? "font-medium text-ink-2"
                  : "text-ink";
                const litClass = lit
                  ? "bg-mint text-green-2 outline outline-1 -outline-offset-1 outline-green"
                  : "";

                return (
                  <td
                    key={col}
                    className={`border border-line p-0 ${litClass}`}
                  >
                    {onPickCell ? (
                      <button
                        type="button"
                        ref={(el) => {
                          buttons.current.set(key(row, i), el);
                        }}
                        tabIndex={focused ? 0 : -1}
                        onFocus={() => setFocus({ r: row, c: i })}
                        onClick={() => onPickCell({ col: colIndex, row }, ref)}
                        className={`${cellBase} ${tone} hover:bg-line-2`}
                        aria-label={
                          text
                            ? `${ref}, ${text}`
                            : `${ref}, empty`
                        }
                      >
                        {text || " "}
                      </button>
                    ) : (
                      <span className={`${cellBase} ${tone}`}>{text || " "}</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
