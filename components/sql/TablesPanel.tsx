"use client";

import type { TableSet } from "@/lib/schema";

interface Props {
  db: TableSet;
  /** Tap a column to drop it into the query, the way Excel taps a cell. */
  onInsert?: (text: string) => void;
  /** How many rows of each table to preview. */
  sampleRows?: number;
}

/**
 * The left half of the workspace: what you are allowed to query.
 *
 * BRIEF.md 6.3. This replaces the Excel Grid. Column names are buttons, so the
 * learner can build a query by tapping rather than typing, which is the same
 * affordance the Excel formula bar gives with cells and column letters.
 */
export function TablesPanel({ db, onInsert, sampleRows = 4 }: Props) {
  return (
    <div className="flex flex-col gap-4">
      {db.tables.map((t) => {
        const shown = t.rows.slice(0, sampleRows);
        const hidden = t.rows.length - shown.length;
        return (
          <div key={t.name} className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-2">
              <button
                type="button"
                onClick={onInsert ? () => onInsert(t.name) : undefined}
                disabled={!onInsert}
                className="rounded font-mono text-[13px] font-semibold enabled:hover:text-green-2 disabled:cursor-default"
              >
                {t.name}
              </button>
              <span className="font-mono text-[11.5px] text-ink-3 tabular-nums">
                {t.rows.length} row{t.rows.length === 1 ? "" : "s"}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {t.cols.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={onInsert ? () => onInsert(c) : undefined}
                  disabled={!onInsert}
                  aria-label={onInsert ? `Insert column ${c}` : undefined}
                  className="rounded-md border border-line bg-card px-2 py-0.5 font-mono text-[11.5px] text-ink-2 transition-colors enabled:hover:border-mint-2 enabled:hover:text-green-2 disabled:cursor-default"
                >
                  {c}
                </button>
              ))}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse font-mono text-[11.5px]">
                <caption className="sr-only">
                  First rows of the {t.name} table
                </caption>
                <thead>
                  <tr>
                    {t.cols.map((c) => (
                      <th
                        key={c}
                        scope="col"
                        className="border border-line bg-card px-2 py-1 text-left font-medium text-ink-3 whitespace-nowrap"
                      >
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {shown.map((row, i) => (
                    <tr key={i}>
                      {row.map((v, j) => (
                        <td
                          key={j}
                          className="border border-line px-2 py-1 tabular-nums whitespace-nowrap"
                        >
                          {v === null ? (
                            <span className="text-ink-3 italic">NULL</span>
                          ) : (
                            String(v)
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {hidden > 0 && (
              <p className="text-[11.5px] text-ink-3">
                {hidden} more row{hidden === 1 ? "" : "s"} in the table. Your query
                sees all {t.rows.length}.
              </p>
            )}
          </div>
        );
      })}
      {onInsert && (
        <p className="text-[11.5px] leading-relaxed text-ink-3">
          Tap a table or column name to drop it into your query.
        </p>
      )}
    </div>
  );
}
