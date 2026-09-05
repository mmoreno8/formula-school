"use client";

import type { ResultSet, SqlValue } from "@/lib/sql/types";

function cell(v: SqlValue) {
  if (v === null) {
    return <span className="text-ink-3 italic">NULL</span>;
  }
  return <>{String(v)}</>;
}

interface Props {
  result: ResultSet;
  caption: string;
  /** Rows past this are summarised rather than drawn. Lesson tables are small. */
  limit?: number;
}

export function ResultTable({ result, caption, limit = 50 }: Props) {
  const shown = result.rows.slice(0, limit);
  const hidden = result.rows.length - shown.length;

  if (result.columns.length === 0) {
    return <p className="px-3 py-2.5 text-[13px] text-ink-3">No columns came back.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse font-mono text-[12.5px]">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {result.columns.map((c, i) => (
              <th
                key={`${c}-${i}`}
                scope="col"
                className="border border-line bg-raise px-2.5 py-1.5 text-left font-medium text-ink-2 whitespace-nowrap"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {shown.length === 0 ? (
            <tr>
              <td
                colSpan={result.columns.length}
                className="border border-line px-2.5 py-2 text-ink-3"
              >
                No rows matched.
              </td>
            </tr>
          ) : (
            shown.map((row, r) => (
              <tr key={r}>
                {row.map((v, c) => (
                  <td
                    key={c}
                    className="border border-line px-2.5 py-1.5 tabular-nums whitespace-nowrap"
                  >
                    {cell(v)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
      {hidden > 0 && (
        <p className="px-2.5 py-1.5 text-[12px] text-ink-3">
          {hidden} more row{hidden === 1 ? "" : "s"} not shown.
        </p>
      )}
    </div>
  );
}
