"use client";

import { useCallback, useRef, useState } from "react";

/** Owns the text and the caret for a formula input, so the grid can insert
 *  references at the cursor without the input losing focus. */
export function useFormulaField(initial = "=") {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [value, setValue] = useState(initial);
  const [caret, setCaret] = useState(initial.length);

  const set = useCallback((text: string, at: number) => {
    setValue(text);
    setCaret(at);
  }, []);

  const focusAt = useCallback((at: number) => {
    const el = inputRef.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(at, at);
  }, []);

  const insert = useCallback(
    (snippet: string) => {
      const at = Math.min(caret, value.length);
      const text = value.slice(0, at) + snippet + value.slice(at);
      const next = at + snippet.length;
      set(text, next);
      // The DOM value updates on the next paint, so move the caret after it.
      requestAnimationFrame(() => focusAt(next));
    },
    [caret, focusAt, set, value],
  );

  const reset = useCallback(() => {
    set(initial, initial.length);
  }, [initial, set]);

  return { inputRef, value, caret, set, insert, reset, focusAt };
}
