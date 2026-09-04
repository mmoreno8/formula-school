import { beforeEach, describe, expect, it, vi } from "vitest";

// progress.ts talks to localStorage and window directly, which is the point of
// it. Stub both before importing so the real module runs unchanged.
const store = new Map<string, string>();

vi.stubGlobal("localStorage", {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
});
vi.stubGlobal("window", {
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => true,
  localStorage: { getItem: () => null },
});

const {
  lessonProgress,
  markBuilt,
  markExerciseDone,
  markFinished,
  readProgress,
  resetLesson,
} = await import("@/lib/progress");

const IDS = ["a", "b", "c"];
const read = () => lessonProgress(readProgress(), "xlookup");

describe("markFinished", () => {
  beforeEach(() => store.clear());

  it("refuses to finish a lesson with no exercises done", () => {
    // The review finding: the rail lets you jump straight to Done.
    markFinished("xlookup", IDS);
    expect(read().finished).toBe(false);
  });

  it("refuses to finish a lesson that is part way through", () => {
    markExerciseDone("xlookup", "a");
    markExerciseDone("xlookup", "b");
    markFinished("xlookup", IDS);
    expect(read().finished).toBe(false);
    expect(read().done).toEqual(["a", "b"]);
  });

  it("finishes once every exercise is done", () => {
    for (const id of IDS) markExerciseDone("xlookup", id);
    markFinished("xlookup", IDS);
    expect(read().finished).toBe(true);
  });

  it("is not fooled by solving the same exercise repeatedly", () => {
    markExerciseDone("xlookup", "a");
    markExerciseDone("xlookup", "a");
    markExerciseDone("xlookup", "a");
    markFinished("xlookup", IDS);
    expect(read().finished).toBe(false);
  });

  it("does not treat a solved Build step as progress through the exercises", () => {
    markBuilt("xlookup");
    markFinished("xlookup", IDS);
    expect(read().built).toBe(true);
    expect(read().finished).toBe(false);
  });

  it("clears finished when the lesson is redone", () => {
    for (const id of IDS) markExerciseDone("xlookup", id);
    markFinished("xlookup", IDS);
    resetLesson("xlookup");
    expect(read().finished).toBe(false);
    expect(read().done).toEqual([]);
  });

  it("keeps lessons independent", () => {
    for (const id of IDS) markExerciseDone("sum", id);
    markFinished("sum", IDS);
    markFinished("xlookup", IDS);
    expect(lessonProgress(readProgress(), "sum").finished).toBe(true);
    expect(read().finished).toBe(false);
  });
});
