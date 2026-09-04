import { describe, expect, it } from "vitest";
import {
  acceptSuggestion,
  activeArgument,
  suggestFunctions,
  typingFunctionName,
} from "@/lib/formulaHint";
import { FUNCTION_NAMES } from "@/lib/evaluator";

const arg = (s: string) => {
  const caret = s.indexOf("|");
  return activeArgument(s.replace("|", ""), caret);
};

describe("activeArgument", () => {
  it("tracks which argument the caret is inside", () => {
    expect(arg("XLOOKUP(|")).toEqual({ fn: "XLOOKUP", index: 0 });
    expect(arg("XLOOKUP(F1,|")).toEqual({ fn: "XLOOKUP", index: 1 });
    expect(arg("XLOOKUP(F1, A2:A9, |")).toEqual({ fn: "XLOOKUP", index: 2 });
    expect(arg("XLOOKUP(F1, A2:A9, C2:C9)|")).toBeNull();
  });

  it("does not count commas from a nested call against the outer one", () => {
    expect(arg('SUMIF(A1:A9, ">2", B1:B9)|')).toBeNull();
    expect(arg("IF(SUM(A1,A2)>3, |")).toEqual({ fn: "IF", index: 1 });
    expect(arg("IF(SUM(A1,|")).toEqual({ fn: "SUM", index: 1 });
  });

  it("ignores commas inside a quoted string", () => {
    expect(arg('XLOOKUP(F1, A2:A9, C2:C9, "none, sorry"|')).toEqual({
      fn: "XLOOKUP",
      index: 3,
    });
  });

  it("returns null outside any call", () => {
    expect(arg("1+|2")).toBeNull();
    expect(arg("|")).toBeNull();
  });
});

describe("autocomplete", () => {
  it("offers matches for a partly typed name", () => {
    expect(typingFunctionName("XLOO", 4)).toBe("XLOO");
    expect(suggestFunctions("XLOO", FUNCTION_NAMES)).toEqual(["XLOOKUP"]);
    expect(suggestFunctions("COUNT", FUNCTION_NAMES)).toEqual([
      "COUNTA",
      "COUNTIF",
      "COUNTIFS",
    ]);
  });

  it("stops suggesting once the bracket is typed", () => {
    expect(typingFunctionName("XLOOKUP(", 7)).toBeNull();
  });

  it("does not suggest anything for a cell reference", () => {
    expect(suggestFunctions("A2", FUNCTION_NAMES)).toEqual([]);
  });

  it("accepting a suggestion inserts the open bracket and moves the caret", () => {
    expect(acceptSuggestion("XLOO", 4, "XLOOKUP")).toEqual({
      text: "XLOOKUP(",
      caret: 8,
    });
    expect(acceptSuggestion("SUM(A1)+XLOO", 12, "XLOOKUP")).toEqual({
      text: "SUM(A1)+XLOOKUP(",
      caret: 16,
    });
  });
});
