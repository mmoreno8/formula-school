"use client";

import { forwardRef, useEffect, useState } from "react";
import type { ClauseSpec, Tint } from "@/lib/schema";

const TINT: Record<Tint, string> = {
  lookup: "bg-lookup-bg text-lookup-fg",
  search: "bg-search-bg text-search-fg",
  return: "bg-return-bg text-return-fg",
  test: "bg-test-bg text-test-fg",
  plain: "bg-plain-bg text-plain-fg",
};

interface Props {
  value: string;
  onChange: (next: string) => void;
  /** The guidance line under the editor. Excel's ArgHint, for clauses. */
  clauses?: ClauseSpec[];
  /** Which clause to bold, worked out from where the caret is. */
  activeClause?: string | null;
  disabled?: boolean;
  label: string;
  id: string;
  onSubmit?: () => void;
}

/**
 * The guided query editor. BRIEF.md 5.2 and 6.2.
 *
 * A real textarea rather than a contenteditable or a canvas, so it is
 * keyboard operable, screen-reader operable and works with the browser's own
 * spellcheck and undo. Section 9's accessibility rules are not optional.
 */
export const QueryEditor = forwardRef<HTMLTextAreaElement, Props>(
  function QueryEditor(
    { value, onChange, clauses, activeClause, disabled, label, id, onSubmit },
    ref,
  ) {
    const lines = Math.max(4, value.split("\n").length + 1);

    // Rendered on the server as Ctrl, corrected on the client for a Mac. Doing
    // it in an effect rather than during render keeps hydration stable.
    const [mod, setMod] = useState("Ctrl");
    useEffect(() => {
      if (/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)) {
        setMod("\u2318");
      }
    }, []);

    return (
      <div className="overflow-hidden rounded-[9px] border border-line">
        <div className="flex items-center justify-between gap-3 border-b border-line bg-raise px-3 py-1.5">
          <span className="font-mono text-[11px] tracking-wide text-ink-3">
            SQLite SQL
          </span>
          {onSubmit && (
            <span className="font-mono text-[11px] text-ink-3">
              {mod} + Enter runs
            </span>
          )}
        </div>

        <label htmlFor={id} className="sr-only">
          {label}
        </label>
        <textarea
          ref={ref}
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (onSubmit && (e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              onSubmit();
            }
          }}
          disabled={disabled}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          rows={lines}
          className="block w-full resize-y bg-card px-3 py-2.5 font-mono text-[13.5px] leading-relaxed text-ink outline-none disabled:opacity-60"
        />

        {clauses && clauses.length > 0 && (
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-line bg-raise px-3 py-1.5 font-mono text-[11.5px] text-ink-3">
            {clauses.map((c) => {
              const active = activeClause === c.kw;
              return (
                <span key={c.kw} className="inline-flex items-center gap-1.5">
                  <span
                    className={active ? "font-semibold text-ink" : undefined}
                  >
                    {c.kw}
                  </span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[11px] ${TINT[c.tint]} ${
                      active ? "" : "opacity-70"
                    }`}
                  >
                    {c.label}
                  </span>
                </span>
              );
            })}
          </p>
        )}
      </div>
    );
  },
);
