"use client";

import { useCallback, useState } from "react";

/**
 * The feedback ladder from BRIEF.md section 6, in one place so the Build step
 * and all four exercise types behave identically.
 *
 *   1st wrong  -> hint
 *   2nd wrong  -> stronger hint
 *   3rd wrong  -> reveal
 *
 * A formula that will not parse is not a wrong attempt. It shows a syntax
 * nudge and leaves the counter alone, because burning a hint on a missing
 * bracket teaches nothing.
 */
export type Stage = "idle" | "hint" | "hint2" | "revealed" | "correct";

export interface Attempts {
  stage: Stage;
  syntax: string | null;
  /** Wrong answers so far. Syntax errors are not counted. */
  wrongCount: number;
  registerWrong: () => void;
  registerCorrect: () => void;
  showSyntax: (message: string) => void;
  clearSyntax: () => void;
  revealNow: () => void;
  reset: () => void;
}

export function useAttempts(): Attempts {
  const [stage, setStage] = useState<Stage>("idle");
  const [syntax, setSyntax] = useState<string | null>(null);
  const [wrongCount, setWrongCount] = useState(0);

  const registerWrong = useCallback(() => {
    setSyntax(null);
    setWrongCount((n) => n + 1);
    setStage((s) => {
      if (s === "correct" || s === "revealed") return s;
      if (s === "idle") return "hint";
      if (s === "hint") return "hint2";
      return "revealed";
    });
  }, []);

  const registerCorrect = useCallback(() => {
    setSyntax(null);
    setStage((s) => (s === "revealed" ? "revealed" : "correct"));
  }, []);

  const showSyntax = useCallback((message: string) => setSyntax(message), []);
  const clearSyntax = useCallback(() => setSyntax(null), []);
  const revealNow = useCallback(() => {
    setSyntax(null);
    setStage("revealed");
  }, []);

  const reset = useCallback(() => {
    setStage("idle");
    setSyntax(null);
    setWrongCount(0);
  }, []);

  return {
    stage,
    syntax,
    wrongCount,
    registerWrong,
    registerCorrect,
    showSyntax,
    clearSyntax,
    revealNow,
    reset,
  };
}
