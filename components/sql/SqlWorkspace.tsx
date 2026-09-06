"use client";

import { useCallback, useRef, useState } from "react";
import type { ClauseSpec, TableSet } from "@/lib/schema";
import { TablesPanel } from "@/components/sql/TablesPanel";
import { QueryEditor } from "@/components/sql/QueryEditor";
import { SqlRunner, type RunnerSpec } from "@/components/sql/SqlRunner";
import { activeClauseAt } from "@/lib/sql/activeClause";

interface Props {
  db: TableSet;
  spec: RunnerSpec;
  clauses?: ClauseSpec[];
  starter: string;
  prompt: string;
  onSolved: () => void;
  editorId: string;
  caption: string;
}

/**
 * The two-column working surface. BRIEF.md 6.3.
 *
 * Problem and tables on the left, editor and results on the right. On a phone
 * it stacks in reading order: problem, tables, editor, buttons, results, which
 * is the order in the brief rather than whatever the grid happens to produce.
 */
export function SqlWorkspace({
  db,
  spec,
  clauses,
  starter,
  prompt,
  onSolved,
  editorId,
  caption,
}: Props) {
  const [sql, setSql] = useState(starter);
  const [caret, setCaret] = useState(starter.length);
  const ref = useRef<HTMLTextAreaElement>(null);

  const active = clauses ? activeClauseAt(sql, caret, clauses) : null;

  /** Tapping a column inserts it at the caret, the way Excel taps a cell. */
  const insert = useCallback(
    (text: string) => {
      const el = ref.current;
      const at = el ? (el.selectionStart ?? sql.length) : sql.length;
      const before = sql.slice(0, at);
      const after = sql.slice(at);
      const pad = before.length > 0 && !/[\s(,.]$/.test(before) ? " " : "";
      const next = `${before}${pad}${text}${after}`;
      setSql(next);
      const pos = before.length + pad.length + text.length;
      setCaret(pos);
      requestAnimationFrame(() => {
        el?.focus();
        el?.setSelectionRange(pos, pos);
      });
    },
    [sql],
  );

  const onChange = useCallback((next: string) => {
    setSql(next);
    requestAnimationFrame(() => {
      const el = ref.current;
      if (el) setCaret(el.selectionStart ?? next.length);
    });
  }, []);

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)]">
      <div className="flex min-w-0 flex-col gap-4 lg:border-r lg:border-line lg:pr-5">
        <div>
          <p className="mb-2 text-[11.5px] tracking-wider text-ink-3 uppercase">
            The problem
          </p>
          <p className="text-[14px] leading-relaxed">{prompt}</p>
        </div>
        <div>
          <p className="mb-2.5 text-[11.5px] tracking-wider text-ink-3 uppercase">
            Tables
          </p>
          <TablesPanel db={db} onInsert={insert} />
        </div>
      </div>

      <div className="min-w-0">
        <SqlRunner
          db={db}
          spec={spec}
          sql={sql}
          onSolved={onSolved}
          caption={caption}
        >
          {({ onRun, busy }) => (
            <QueryEditor
              ref={ref}
              id={editorId}
              label={`SQL for ${caption}`}
              value={sql}
              onChange={onChange}
              clauses={clauses}
              activeClause={active}
              disabled={busy}
              onSubmit={onRun}
            />
          )}
        </SqlRunner>
      </div>
    </div>
  );
}
