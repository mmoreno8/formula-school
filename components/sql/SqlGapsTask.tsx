"use client";

import { useMemo, useState } from "react";
import type { SqlGapsExercise, TableSet, Tint } from "@/lib/schema";
import { SqlRunner } from "@/components/sql/SqlRunner";

const TINT: Record<Tint, string> = {
  lookup: "bg-lookup-bg text-lookup-fg border-lookup-fg/30",
  search: "bg-search-bg text-search-fg border-search-fg/30",
  return: "bg-return-bg text-return-fg border-return-fg/30",
  test: "bg-test-bg text-test-fg border-test-fg/30",
  plain: "bg-plain-bg text-plain-fg border-plain-fg/30",
};

/** Splits "SELECT {0} FROM t {1} x" into literal and gap pieces, in order. */
export function splitTemplate(
  template: string,
): Array<{ kind: "text"; text: string } | { kind: "gap"; index: number }> {
  const out: Array<
    { kind: "text"; text: string } | { kind: "gap"; index: number }
  > = [];
  const re = /\{(\d+)\}/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(template)) !== null) {
    if (m.index > last)
      out.push({ kind: "text", text: template.slice(last, m.index) });
    out.push({ kind: "gap", index: Number(m[1]) });
    last = m.index + m[0].length;
  }
  if (last < template.length)
    out.push({ kind: "text", text: template.slice(last) });
  return out;
}

/** The template with each gap replaced by what the learner typed. */
export function assemble(template: string, values: string[]): string {
  return splitTemplate(template)
    .map((p) => (p.kind === "text" ? p.text : (values[p.index] ?? "")))
    .join("");
}

interface Props {
  exercise: SqlGapsExercise;
  db: TableSet;
  onSolved: () => void;
}

/**
 * Ramp step 1. BRIEF.md 5.13: the shape is given, the learner supplies the
 * parts that carry the idea.
 *
 * Grading still runs the assembled query and compares result sets, the same as
 * every other SQL exercise. The `accept` list only decides whether a gap looks
 * filled in, so a learner who writes a different but equivalent expression is
 * still graded on what it returns.
 */
export function SqlGapsTask({ exercise, db, onSolved }: Props) {
  const [values, setValues] = useState<string[]>(() =>
    exercise.gaps.map(() => ""),
  );

  const parts = useMemo(
    () => splitTemplate(exercise.template),
    [exercise.template],
  );
  const sql = useMemo(
    () => assemble(exercise.template, values),
    [exercise.template, values],
  );
  const filled = values.every((v) => v.trim().length > 0);

  return (
    <SqlRunner
      db={db}
      spec={exercise}
      sql={sql}
      canRun={filled}
      onSolved={onSolved}
      caption={`Result for ${exercise.id}`}
    >
      {() => (
        <>
          <div className="overflow-hidden rounded-[9px] border border-line">
            <div className="flex items-center border-b border-line bg-raise px-3 py-1.5">
              <span className="font-mono text-[11px] tracking-wide text-ink-3">
                SQLite SQL
              </span>
            </div>
            <div className="bg-card px-3 py-2.5 font-mono text-[13.5px] leading-loose whitespace-pre-wrap">
              {parts.map((p, i) => {
                if (p.kind === "text") return <span key={i}>{p.text}</span>;
                const gap = exercise.gaps[p.index];
                const size = Math.max(
                  gap.placeholder?.length ?? 8,
                  values[p.index].length + 1,
                );
                return (
                  <input
                    key={i}
                    type="text"
                    value={values[p.index]}
                    spellCheck={false}
                    autoCapitalize="off"
                    autoCorrect="off"
                    size={size}
                    aria-label={gap.placeholder ?? `Gap ${p.index + 1}`}
                    placeholder={gap.placeholder}
                    onChange={(e) => {
                      const next = [...values];
                      next[p.index] = e.target.value;
                      setValues(next);
                    }}
                    className={`mx-0.5 rounded-md border px-1.5 py-0.5 text-center font-mono text-[13px] outline-none placeholder:text-ink-3/70 focus:border-green ${TINT[gap.tint]}`}
                  />
                );
              })}
            </div>
          </div>
          {!filled && (
            <p className="text-[12.5px] text-ink-3">
              Fill both gaps to run or check the query.
            </p>
          )}
        </>
      )}
    </SqlRunner>
  );
}
