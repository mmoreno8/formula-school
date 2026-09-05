import { describe, expect, it } from "vitest";
import type { Sheet } from "@/lib/schema";
import { evaluate, checkFormula, formatValue } from "@/lib/evaluator";
import { isError } from "@/lib/evaluator/types";

/** Orders sheet with the traps the content relies on:
 *  duplicate regions, a repeated customer, a blank amount and a text amount. */
const sheet: Sheet = {
  cols: ["A", "B", "C", "D"],
  rows: 9,
  cells: {
    A1: "Order", B1: "Customer", C1: "Region", D1: "Amount",
    A2: 1042, B2: "Northwind", C2: "Otago", D2: 1250,
    A3: 1043, B3: "Kea Ltd", C3: "Waikato", D3: 840,
    A4: 1044, B4: "Halcyon", C4: "Otago", D4: 2110,
    A5: 1045, B5: "Brightsmith", C5: "Auckland", D5: 560,
    A6: 1046, B6: "Tuatara", C6: "Waikato", D6: 1780,
    A7: 1047, B7: "Northwind", C7: "Otago", D7: 930,
    A8: 1048, B8: "Pounamu", C8: "Nelson", D8: "pending",
    A9: 1049, B9: "Rimu Co", C9: "Waikato",
  },
};

function value(formula: string) {
  const r = evaluate(formula, sheet);
  if (!r.ok) throw new Error(`${formula} -> ${r.message}`);
  return r.value;
}

describe("parsing", () => {
  it("requires a leading equals sign", () => {
    const r = evaluate("SUM(D2:D9)", sheet);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("syntax");
  });

  it("reports an unclosed bracket as syntax, not as a wrong answer", () => {
    const r = evaluate("=SUM(D2:D9", sheet);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("syntax");
  });

  it("is case insensitive and ignores whitespace and dollar signs", () => {
    expect(value("=sum( $D$2 : $D$9 )")).toBe(value("=SUM(D2:D9)"));
  });

  it("handles nested calls and arithmetic precedence", () => {
    expect(value("=1+2*3")).toBe(7);
    expect(value("=(1+2)*3")).toBe(9);
    expect(value("=SUM(D2:D4)/COUNT(D2:D4)")).toBe(value("=AVERAGE(D2:D4)"));
  });
});

describe("blank and text cells", () => {
  it("SUM ignores text and blanks inside a range", () => {
    expect(value("=SUM(D2:D9)")).toBe(1250 + 840 + 2110 + 560 + 1780 + 930);
  });

  it("COUNT counts numbers, COUNTA counts anything present", () => {
    expect(value("=COUNT(D2:D9)")).toBe(6);
    expect(value("=COUNTA(D2:D9)")).toBe(7); // "pending" counts, D9 is blank
  });

  it("AVERAGE divides by the numeric count only", () => {
    expect(value("=AVERAGE(D2:D9)")).toBeCloseTo(7470 / 6, 9);
  });

  it("returns #DIV/0! when averaging nothing numeric", () => {
    const v = value("=AVERAGE(B2:B3)");
    expect(isError(v) && v.code).toBe("#DIV/0!");
  });
});

describe("expanded numeric functions", () => {
  it("finds the minimum and maximum numeric values", () => {
    expect(value("=MIN(D2:D9)")).toBe(560);
    expect(value("=MAX(D2:D9)")).toBe(2110);
  });

  it("rounds to decimal and whole-number positions", () => {
    expect(value("=ROUND(76.3596,2)")).toBe(76.36);
    expect(value("=ROUND(1288.74,0)")).toBe(1289);
    expect(value("=ROUND(-1.5,0)")).toBe(-2);
  });
});

describe("logic and error handling", () => {
  it("combines conditions with AND and OR", () => {
    expect(value("=AND(D2>1000,D3<1000)")).toBe(true);
    expect(value("=AND(D2>1000,D3>1000)")).toBe(false);
    expect(value("=OR(D2<1000,D3<1000)")).toBe(true);
  });

  it("uses IFERROR only when the first value is an error", () => {
    expect(value('=IFERROR(XLOOKUP(9999,A2:A9,C2:C9),"Missing")')).toBe("Missing");
    expect(value('=IFERROR(XLOOKUP(1047,A2:A9,C2:C9),"Missing")')).toBe("Otago");
  });
});

describe("text functions", () => {
  it("extracts text from the left, right and middle", () => {
    expect(value('=LEFT("NZ-AKL-1042",2)')).toBe("NZ");
    expect(value('=RIGHT("NZ-AKL-1042",4)')).toBe("1042");
    expect(value('=MID("NZ-AKL-1042",4,3)')).toBe("AKL");
  });

  it("cleans, measures and joins text", () => {
    expect(value('=TRIM("  North   Wind ")')).toBe("North Wind");
    expect(value('=LEN(TRIM("  North   Wind "))')).toBe(10);
    expect(value('=CONCAT("North"," ","Wind")')).toBe("North Wind");
  });
});

describe("conditional functions", () => {
  it("COUNTIF matches text case insensitively", () => {
    expect(value('=COUNTIF(C2:C9,"Otago")')).toBe(3);
    expect(value('=COUNTIF(C2:C9,"otago")')).toBe(3);
  });

  it("SUMIF supports a separate sum range", () => {
    expect(value('=SUMIF(C2:C9,"Otago",D2:D9)')).toBe(1250 + 2110 + 930);
  });

  it("SUMIF applies numeric comparison operators", () => {
    expect(value('=SUMIF(D2:D9,">1000")')).toBe(1250 + 2110 + 1780);
  });

  it("does not compare text against a numeric threshold", () => {
    expect(value('=COUNTIF(D2:D9,">0")')).toBe(6);
  });

  it("COUNTIFS and SUMIFS apply every condition", () => {
    expect(value('=COUNTIFS(C2:C9,"Otago",D2:D9,">1000")')).toBe(2);
    expect(value('=SUMIFS(D2:D9,C2:C9,"Otago",D2:D9,">1000")')).toBe(1250 + 2110);
  });

  it("rejects ranges of different heights", () => {
    const v = value('=SUMIFS(D2:D9,C2:C5,"Otago")');
    expect(isError(v) && v.code).toBe("#VALUE!");
  });
});

describe("lookups", () => {
  it("XLOOKUP returns the matching row", () => {
    expect(value("=XLOOKUP(1047,A2:A9,C2:C9)")).toBe("Otago");
  });

  it("XLOOKUP finds the first match when values repeat", () => {
    expect(value('=XLOOKUP("Northwind",B2:B9,D2:D9)')).toBe(1250);
  });

  it("XLOOKUP gives #N/A when nothing matches, or the fallback", () => {
    const v = value("=XLOOKUP(9999,A2:A9,C2:C9)");
    expect(isError(v) && v.code).toBe("#N/A");
    expect(value('=XLOOKUP(9999,A2:A9,C2:C9,"not found")')).toBe("not found");
  });

  it("XLOOKUP refuses mismatched search and return ranges", () => {
    const v = value("=XLOOKUP(1047,A2:A9,C2:C5)");
    expect(isError(v) && v.code).toBe("#VALUE!");
  });

  it("including the header row shifts the answer", () => {
    expect(value("=XLOOKUP(1047,A1:A9,C1:C9)")).toBe("Otago");
    expect(value("=XLOOKUP(1047,A1:A8,C2:C9)")).toBe("Nelson");
  });

  it("VLOOKUP counts columns from the left of its table", () => {
    expect(value("=VLOOKUP(1047,A2:D9,3,FALSE)")).toBe("Otago");
    expect(value("=VLOOKUP(1047,A2:D9,4,FALSE)")).toBe(930);
  });

  it("VLOOKUP cannot look to its left", () => {
    const v = value("=VLOOKUP(1047,A2:D9,5,FALSE)");
    expect(isError(v) && v.code).toBe("#REF!");
  });

  it("combines exact MATCH positions with INDEX results", () => {
    expect(value("=MATCH(1047,A2:A9,0)")).toBe(6);
    expect(value("=INDEX(C2:C9,MATCH(1047,A2:A9,0))")).toBe("Otago");
  });
});

describe("checkFormula", () => {
  const spec = { expected: "Otago", mustUse: ["XLOOKUP"] };

  it("accepts any spelling that returns the right value", () => {
    for (const f of [
      "=XLOOKUP(1047,A2:A9,C2:C9)",
      "=xlookup( 1047 , $A$2:$A$9 , $C$2:$C$9 )",
      "=XLOOKUP(1047,A:A,C:C)",
    ]) {
      expect(checkFormula(f, sheet, spec)).toEqual({ status: "correct" });
    }
  });

  it("rejects the right answer reached with the wrong function", () => {
    const r = checkFormula("=VLOOKUP(1047,A2:D9,3,FALSE)", sheet, spec);
    expect(r).toMatchObject({ status: "wrong" });
  });

  it("rejects a hardcoded answer", () => {
    const r = checkFormula('="Otago"', sheet, spec);
    expect(r).toMatchObject({ status: "wrong" });
  });

  it("passes syntax failures through rather than calling them wrong", () => {
    const r = checkFormula("=XLOOKUP(1047,A2:A9", sheet, spec);
    expect(r).toMatchObject({ ok: false, reason: "syntax" });
  });
});

describe("formatValue", () => {
  it("groups thousands and caps decimals at two", () => {
    expect(formatValue(7470)).toBe("7,470");
    expect(formatValue(1245.006)).toBe("1,245.01");
    expect(formatValue("Otago")).toBe("Otago");
    expect(formatValue(null)).toBe("");
  });
});
