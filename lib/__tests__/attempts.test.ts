import { describe, expect, it } from "vitest";
import {
  stageAfterCorrect,
  stageAfterWrong,
  type Stage,
} from "@/components/engine/useAttempts";

/**
 * The feedback ladder. BRIEF.md section 6.
 *
 * These transitions decide what a learner is told about the answer they just
 * submitted, so the interesting cases are the ones where an earlier result
 * could speak for a later one.
 */
describe("the feedback ladder", () => {
  it("climbs one rung per wrong answer", () => {
    let s: Stage = "idle";
    s = stageAfterWrong(s);
    expect(s).toBe("hint");
    s = stageAfterWrong(s);
    expect(s).toBe("hint2");
    s = stageAfterWrong(s);
    expect(s).toBe("revealed");
  });

  it("keeps the answer shown once a wrong answer follows the reveal", () => {
    expect(stageAfterWrong("revealed")).toBe("revealed");
  });

  it("reaches correct from anywhere at all", () => {
    expect(stageAfterCorrect()).toBe("correct");
  });

  /**
   * The regression this file exists for, reported on the ROUND lesson.
   *
   * Revealing an answer used to pin the stage to "revealed" for good. The
   * exercise types call onSolved only on "correct", so the exercise could
   * never be earned, the lesson could never reach three of three, and the only
   * way out was Redo this lesson, which deletes every exercise already earned.
   */
  it("lets an exercise be earned after its answer was revealed", () => {
    const shown = stageAfterWrong(stageAfterWrong(stageAfterWrong("idle")));
    expect(shown).toBe("revealed");
    expect(stageAfterCorrect()).toBe("correct");
  });

  /**
   * The SQL track leaves the editor live after a step is solved, so a learner
   * can solve it, change the query to something wrong and check again. This
   * transition used to return "correct" unchanged, which left the success
   * banner up over a wrong result.
   */
  it("leaves the correct stage when a later answer is wrong", () => {
    expect(stageAfterWrong("correct")).toBe("hint");
  });

  it("does not skip to the reveal on that first wrong answer after solving", () => {
    // Solve, then get one wrong. That is one wrong answer, so it earns the
    // first hint rather than the answer.
    expect(stageAfterWrong(stageAfterCorrect())).toBe("hint");
  });

  it("can be solved again after being got wrong", () => {
    expect(stageAfterCorrect()).toBe("correct");
  });
});
