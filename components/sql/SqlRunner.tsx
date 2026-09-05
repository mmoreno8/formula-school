"use client";

import { type ReactNode, useCallback, useEffect, useState } from "react";
import type { TableSet } from "@/lib/schema";
import type { ResultSet } from "@/lib/sql/types";
import {
  disposeWorker,
  gradeQuery,
  runQuery,
  warmEngine,
} from "@/lib/sql/client";
import { useAttempts } from "@/components/engine/useAttempts";
import { Button } from "@/components/ui/Button";
import { Feedback } from "@/components/engine/Feedback";
import { ResultTable } from "@/components/sql/ResultTable";

export interface RunnerSpec {
  canonical: string;
  mustUse?: string[];
  orderMatters: boolean;
  hint: string;
  hint2: string;
  explanation: string;
}

/** What the editor slot is handed, so a keyboard shortcut can reach Run query. */
export interface RunnerApi {
  onRun: () => void;
  busy: boolean;
}

interface Props {
  db: TableSet;
  spec: RunnerSpec;
  sql: string;
  /**
   * The editor, supplied by the caller so gaps and free text can differ. A
   * render prop rather than a plain node, so the editor can bind Cmd/Ctrl+Enter
   * to the same Run query the button calls.
   */
  children: (api: RunnerApi) => ReactNode;
  /** False while a gaps exercise still has empty gaps. */
  canRun?: boolean;
  solved: boolean;
  onSolved: () => void;
  caption: string;
}

type Shown =
  | { kind: "none" }
  | { kind: "ran"; result: ResultSet }
  | { kind: "graded"; result: ResultSet };

/**
 * Run query and Check answer. BRIEF.md 5.12.
 *
 * Run query executes and shows what came back, judging nothing and counting
 * nothing. Check answer grades. Exploring a half-finished query is how people
 * learn SQL, so it must not cost a hint.
 *
 * What never advances the hint ladder:
 *   - a refusal, such as a write or two statements
 *   - a query that will not parse, which is a syntax nudge in both tracks
 *   - any Run query at all
 */
export function SqlRunner({
  db,
  spec,
  sql,
  children,
  canRun = true,
  solved,
  onSolved,
  caption,
}: Props) {
  const a = useAttempts();
  const [busy, setBusy] = useState<null | "run" | "check">(null);
  const [shown, setShown] = useState<Shown>({ kind: "none" });
  const [engineNote, setEngineNote] = useState<string | null>(null);

  // Fetch the worker and wasm while the learner is still reading, so the first
  // Run query is not also the first download.
  useEffect(() => {
    warmEngine();
    return () => disposeWorker();
  }, []);

  const onRun = useCallback(async () => {
    setBusy("run");
    setEngineNote(null);
    const out = await runQuery(db, sql);
    setBusy(null);
    if (out.ok) {
      a.clearSyntax();
      setShown({ kind: "ran", result: out.result });
      return;
    }
    setShown({ kind: "none" });
    setEngineNote(out.message);
  }, [db, sql, a]);

  const onCheck = useCallback(async () => {
    setBusy("check");
    setEngineNote(null);
    const grade = await gradeQuery(db, sql, spec);
    setBusy(null);

    switch (grade.kind) {
      case "correct":
        a.registerCorrect();
        setShown({ kind: "graded", result: grade.result });
        onSolved();
        return;
      case "wrong":
        a.registerWrong();
        setShown({ kind: "graded", result: grade.result });
        setEngineNote(grade.detail ?? null);
        return;
      case "missing-clause":
        a.registerWrong();
        setShown({ kind: "graded", result: grade.result });
        setEngineNote(
          `That runs, but it does not use ${grade.clause}, which this exercise is about.`,
        );
        return;
      case "refused":
      case "error":
        // Neither is a wrong attempt. The counter stays where it is.
        setShown({ kind: "none" });
        setEngineNote(grade.outcome.message);
        return;
    }
  }, [db, sql, spec, a, onSolved]);

  const disabled = busy !== null || !canRun;
  const revealed = a.stage === "revealed";
  const correct = solved || a.stage === "correct";

  return (
    <div className="flex flex-col gap-3">
      {children({ onRun, busy: busy !== null })}

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={onRun} disabled={disabled}>
          {busy === "run" ? "Running" : "Run query"}
        </Button>
        <Button variant="primary" onClick={onCheck} disabled={disabled}>
          {busy === "check" ? "Checking" : "Check answer"}
        </Button>
        <Button
          variant="quiet"
          onClick={a.revealNow}
          disabled={busy !== null || correct}
        >
          Show me the answer
        </Button>
      </div>

      {engineNote && (
        <div
          role="status"
          className="rounded-[9px] bg-hint-bg px-3.5 py-2.5 text-[13.5px] leading-relaxed text-hint-fg"
        >
          {engineNote}
        </div>
      )}

      {shown.kind !== "none" && (
        <div className="overflow-hidden rounded-[9px] border border-line">
          <div className="flex items-center justify-between gap-3 border-b border-line bg-raise px-3 py-1.5">
            <span className="text-[11px] tracking-wider text-ink-3 uppercase">
              Result
            </span>
            <span className="font-mono text-[11.5px] text-ink-3 tabular-nums">
              {shown.result.rows.length} row
              {shown.result.rows.length === 1 ? "" : "s"}
              {shown.kind === "ran" ? " · not graded" : ""}
            </span>
          </div>
          <ResultTable result={shown.result} caption={caption} />
        </div>
      )}

      <div aria-live="polite">
        {correct && (
          <Feedback tone="correct" title="That is it">
            {spec.explanation}
          </Feedback>
        )}
        {!correct && a.stage === "hint" && (
          <Feedback tone="hint" title="Not quite">
            {spec.hint}
          </Feedback>
        )}
        {!correct && a.stage === "hint2" && (
          <Feedback tone="hint" title="Closer look">
            {spec.hint2}
          </Feedback>
        )}
        {!correct && revealed && (
          <Feedback tone="reveal" title="The answer">
            <p className="mb-2 font-mono text-[13px] break-words">
              {spec.canonical}
            </p>
            <p>{spec.explanation}</p>
          </Feedback>
        )}
      </div>
    </div>
  );
}
