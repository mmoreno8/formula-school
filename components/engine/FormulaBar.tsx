"use client";

import { useMemo, type RefObject } from "react";
import type { Sheet } from "@/lib/schema";
import { evaluate, formatValue, FUNCTION_NAMES } from "@/lib/evaluator";
import { isError } from "@/lib/evaluator/types";
import {
  acceptSuggestion,
  suggestFunctions,
  typingFunctionName,
} from "@/lib/formulaHint";
import { ArgHint } from "@/components/engine/ArgHint";

interface Props {
  id: string;
  label: string;
  value: string;
  caret: number;
  sheet: Sheet;
  inputRef: RefObject<HTMLInputElement | null>;
  onChange: (text: string, caret: number) => void;
  onSubmit?: () => void;
  fallbackFn?: string;
  disabled?: boolean;
}

/**
 * The guided formula bar. Autocomplete on Tab, a permanent argument hint line,
 * and a live result the moment the formula becomes valid.
 */
export function FormulaBar({
  id,
  label,
  value,
  caret,
  sheet,
  inputRef,
  onChange,
  onSubmit,
  fallbackFn,
  disabled,
}: Props) {
  const source = value.startsWith("=") ? value.slice(1) : value;
  const sourceCaret = Math.max(0, caret - 1);

  const suggestions = useMemo(() => {
    const prefix = typingFunctionName(source, sourceCaret);
    return prefix ? suggestFunctions(prefix, FUNCTION_NAMES) : [];
  }, [source, sourceCaret]);

  const live = useMemo(() => {
    const res = evaluate(value, sheet);
    if (!res.ok) return null;
    if (res.value === null) return null;
    if (isError(res.value)) return { text: res.value.code, error: true };
    return { text: formatValue(res.value), error: false };
  }, [value, sheet]);

  function accept(fn: string) {
    const next = acceptSuggestion(source, sourceCaret, fn);
    onChange(`=${next.text}`, next.caret + 1);
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (el) {
        el.focus();
        el.setSelectionRange(next.caret + 1, next.caret + 1);
      }
    });
  }

  function syncCaret(el: HTMLInputElement) {
    onChange(el.value, el.selectionStart ?? el.value.length);
  }

  return (
    <div>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div className="flex overflow-hidden rounded-[9px] border border-line bg-card focus-within:border-green">
        <span
          aria-hidden="true"
          className="grid place-items-center border-r border-line bg-raise px-3 text-sm italic text-ink-3"
        >
          fx
        </span>
        <input
          id={id}
          ref={inputRef}
          type="text"
          value={value}
          disabled={disabled}
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          inputMode="text"
          aria-describedby={`${id}-hint`}
          onChange={(e) => syncCaret(e.currentTarget)}
          onClick={(e) => syncCaret(e.currentTarget)}
          onKeyUp={(e) => syncCaret(e.currentTarget)}
          onKeyDown={(e) => {
            if (e.key === "Tab" && !e.shiftKey && suggestions.length > 0) {
              e.preventDefault();
              accept(suggestions[0]);
              return;
            }
            if (e.key === "Enter" && onSubmit) {
              e.preventDefault();
              onSubmit();
            }
          }}
          className="min-w-0 flex-1 bg-transparent px-3 py-2.5 font-mono text-sm text-ink outline-none disabled:opacity-60"
        />
      </div>

      {suggestions.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {suggestions.map((fn, i) => (
            <button
              key={fn}
              type="button"
              onClick={() => accept(fn)}
              className="rounded-md border border-line bg-card px-2.5 py-1 font-mono text-[12.5px] text-ink hover:bg-line-2"
            >
              {fn}
              {i === 0 && (
                <span className="ml-2 font-sans text-[11px] text-ink-3">tab</span>
              )}
            </button>
          ))}
        </div>
      )}

      <div id={`${id}-hint`}>
        <ArgHint value={value} caret={caret} fallbackFn={fallbackFn} />
      </div>

      <p className="mt-1 min-h-[20px] text-[13.5px] text-ink-2" aria-live="polite">
        {live && (
          <>
            returns{" "}
            <span className={`font-mono ${live.error ? "text-ink-3" : "text-ink"}`}>
              {live.text}
            </span>
          </>
        )}
      </p>
    </div>
  );
}
