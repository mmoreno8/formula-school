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

/**
 * Where a wrong answer takes the ladder.
 *
 * Pure and exported so the transitions can be tested without a DOM. The
 * `correct` case is the one that matters: it used to return `correct`
 * unchanged, so once a step had been solved the ladder froze and every later
 * wrong answer was still described as right. The SQL track keeps the editor
 * live after solving, which is exactly where that showed up.
 *
 * `revealed` stays sticky, because an answer that has been shown cannot be
 * un-shown, and re-laddering someone who has already seen it helps nobody.
 */
export function stageAfterWrong(stage: Stage): Stage {
  if (stage === "revealed") return stage;
  // A wrong answer after a correct one is a fresh attempt at a changed query,
  // so the ladder starts again rather than jumping to the reveal.
  if (stage === "idle" || stage === "correct") return "hint";
  if (stage === "hint") return "hint2";
  return "revealed";
}

/** Where a correct answer takes it. Revealing cannot be undone by solving. */
export function stageAfterCorrect(stage: Stage): Stage {
  return stage === "revealed" ? "revealed" : "correct";
}

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
    setStage(stageAfterWrong);
  }, []);

  const registerCorrect = useCallback(() => {
    setSyntax(null);
    setStage(stageAfterCorrect);
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
