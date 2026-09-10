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
 * `revealed` stays sticky on this path, because an answer that has been shown
 * cannot be un-shown, and re-laddering someone who has already seen it helps
 * nobody. Note that this is the WRONG path only. See stageAfterCorrect.
 */
export function stageAfterWrong(stage: Stage): Stage {
  if (stage === "revealed") return stage;
  // A wrong answer after a correct one is a fresh attempt at a changed query,
  // so the ladder starts again rather than jumping to the reveal.
  if (stage === "idle" || stage === "correct") return "hint";
  if (stage === "hint") return "hint2";
  return "revealed";
}

/**
 * Where a correct answer takes it. Always `correct`, including after a reveal.
 *
 * This used to return `revealed` unchanged, so seeing the answer meant the
 * exercise could never be earned again: the exercise types only call
 * `onSolved` on `correct`, so the tick became unreachable, the lesson could
 * never reach three of three, and the only way out was Redo this lesson, which
 * deletes the whole lesson including the exercises already earned.
 *
 * The rule it was defending was that revealing should not earn the tick. But
 * the tick counts exercises completed and nothing else. It is not a score, it
 * claims no accuracy, so there was nothing to protect and a learner who read
 * the answer, understood it and then wrote it out was being told no.
 *
 * It also never worked. `revealed` lives in component state and is never
 * persisted, so it survived neither a refresh nor a step change. It punished
 * only the learner who stayed on the page.
 *
 * It takes no argument on purpose: where the ladder had got to no longer
 * changes where a correct answer lands. It still works as a setState updater,
 * because a function of no arguments satisfies one that is handed a Stage.
 */
export function stageAfterCorrect(): Stage {
  return "correct";
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
