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

  it("keeps the answer shown once it has been shown", () => {
    expect(stageAfterWrong("revealed")).toBe("revealed");
    expect(stageAfterCorrect("revealed")).toBe("revealed");
  });

  it("reaches correct from anywhere except a reveal", () => {
    expect(stageAfterCorrect("idle")).toBe("correct");
    expect(stageAfterCorrect("hint")).toBe("correct");
    expect(stageAfterCorrect("hint2")).toBe("correct");
  });

  /**
   * The regression. The SQL track leaves the editor live after a step is
   * solved, so a learner can solve it, change the query to something wrong and
   * check again. This transition used to return "correct" unchanged, which
   * left the success banner up over a wrong result.
   */
  it("leaves the correct stage when a later answer is wrong", () => {
    expect(stageAfterWrong("correct")).toBe("hint");
  });

  it("does not skip to the reveal on that first wrong answer after solving", () => {
    // Solve, then get one wrong. That is one wrong answer, so it earns the
    // first hint rather than the answer.
    const afterSolving = stageAfterCorrect("idle");
    expect(stageAfterWrong(afterSolving)).toBe("hint");
  });

  it("can be solved again after being got wrong", () => {
    const s = stageAfterWrong(stageAfterCorrect("idle"));
    expect(stageAfterCorrect(s)).toBe("correct");
  });
});
