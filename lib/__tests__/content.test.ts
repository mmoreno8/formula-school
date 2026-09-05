import { describe, expect, it } from "vitest";
import { LESSONS, TOTAL_EXERCISES, getLesson, nextLesson } from "@/content";
import { checkFormula } from "@/lib/evaluator";
import { signatureFor } from "@/lib/signatures";

describe("curriculum", () => {
  it("has eighteen lessons and fifty-four exercises", () => {
    expect(LESSONS).toHaveLength(18);
    expect(TOTAL_EXERCISES).toBe(54);
  });

  it("orders the lessons 1 to 18 with unique ids", () => {
    expect(LESSONS.map((l) => l.order)).toEqual(Array.from({ length: 18 }, (_, i) => i + 1));
    expect(new Set(LESSONS.map((l) => l.id)).size).toBe(18);
  });

  it("keeps the original course first and places INDEX/MATCH last", () => {
    expect(LESSONS[0].id).toBe("sum");
    expect(LESSONS[9].id).toBe("xlookup");
    expect(nextLesson("vlookup")?.id).toBe("xlookup");
    expect(nextLesson("xlookup")?.id).toBe("min-max");
    expect(LESSONS[17].id).toBe("index-match");
    expect(nextLesson("index-match")).toBeUndefined();
    expect(getLesson("nope")).toBeUndefined();
  });

  it("gives every lesson exactly three exercises and three takeaways", () => {
    for (const lesson of LESSONS) {
      expect(lesson.exercises, lesson.id).toHaveLength(3);
      expect(lesson.takeaways, lesson.id).toHaveLength(3);
    }
  });

  it("only uses functions the evaluator and the cheat sheet both know", () => {
    for (const lesson of LESSONS) {
      for (const sig of lesson.signatures) {
        expect(signatureFor(sig.fn), `${lesson.id}/${sig.fn}`).toBeDefined();
      }
    }
  });
});

describe("every declared answer, checked against the evaluator", () => {
  it("accepts each canonical formula and refuses each reject", () => {
    for (const lesson of LESSONS) {
      const specs = [
        { where: `${lesson.id}/build`, spec: lesson.build, sheet: lesson.sheet },
        ...lesson.exercises
          .filter((e) => e.type === "formula")
          .map((e) => ({
            where: `${lesson.id}/${e.id}`,
            spec: e,
            sheet: e.sheet ?? lesson.sheet,
          })),
      ];

      for (const { where, spec, sheet } of specs) {
        expect(checkFormula(spec.canonical, sheet, spec), where).toEqual({
          status: "correct",
        });
        for (const bad of spec.rejects ?? []) {
          expect(
            checkFormula(bad, sheet, spec),
            `${where} must refuse ${bad}`,
          ).not.toEqual({ status: "correct" });
        }
      }
    }
  });
});
