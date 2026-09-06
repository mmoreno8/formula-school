import { describe, expect, it } from "vitest";
import type { Sheet } from "@/lib/schema";
import {
  cellsRead,
  checkFormula,
  evaluate,
  formatValue,
  variantSheets,
} from "@/lib/evaluator";
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

/* ------------------ answers that only look right on one row ---------------- */

describe("behaving like the model answer, not just landing on it", () => {
  const sheet: Sheet = {
    cols: ["A", "B", "C", "D"],
    rows: 5,
    cells: {
      A1: "Order", B1: "Customer", C1: "Region", D1: "Amount",
      A2: 1042, B2: "Northwind", C2: "Otago", D2: 1250,
      A3: 1043, B3: "Kea Ltd", C3: "Waikato", D3: 840,
      A4: 1044, B4: "Halcyon", C4: "Otago", D4: 2110,
      A5: 1045, B5: "Brightsmith", C5: "Auckland", D5: 560,
    },
  };

  const spec = {
    expected: "Review",
    mustUse: ["IF"],
    canonical: '=IF(D2 > 1000, "Review", "Fine")',
  };

  const verdict = (formula: string) => {
    const r = checkFormula(formula, sheet, spec);
    return "status" in r ? r.status : "syntax";
  };

  it("takes the model answer", () => {
    expect(verdict('=IF(D2 > 1000, "Review", "Fine")')).toBe("correct");
  });

  it("takes an equivalent rule written differently", () => {
    expect(verdict('=IF(1000 < D2, "Review", "Fine")')).toBe("correct");
    expect(verdict('=IF(D2 >= 1001, "Review", "Fine")')).toBe("correct");
    expect(verdict('=IF($D$2 > 1000, "Review", "Fine")')).toBe("correct");
  });

  it("does not care about the capitals in the answer text", () => {
    expect(verdict('=IF(D2 > 1000, "review", "fine")')).toBe("correct");
  });

  /**
   * The reported bug. Every one of these returns "Review" for row 2, and none
   * of them is a rule about a thousand dollars. The old check compared the
   * value for that one row and let them all through.
   */
  it("refuses a test that never looks at the amount", () => {
    expect(verdict('=IF(A2, "Review", "Fine")')).toBe("wrong");
    expect(verdict('=IF(1, "Review", "Fine")')).toBe("wrong");
    expect(verdict('=IF(TRUE, "Review", "Fine")')).toBe("wrong");
  });

  it("refuses a test on the right cell that is still the wrong rule", () => {
    // 1250 is not zero, so this returns "Review" for every amount there is.
    expect(verdict('=IF(D2, "Review", "Fine")')).toBe("wrong");
  });

  it("refuses a rule that happens to agree on this row", () => {
    // Row 2 is in Otago and over a thousand, so this looks right once.
    expect(verdict('=IF(C2 = "Otago", "Review", "Fine")')).toBe("wrong");
  });

  it("still refuses the answers swapped round", () => {
    expect(verdict('=IF(D2 > 1000, "Fine", "Review")')).toBe("wrong");
  });
});

describe("reading which cells a formula depends on", () => {
  const sheet: Sheet = {
    cols: ["A", "B"],
    rows: 4,
    cells: { A1: "h", A2: 1, A3: 2, A4: 3, B2: 9 },
  };

  it("finds a plain reference", () => {
    expect([...cellsRead("=A2 + 1", sheet)]).toEqual(["A2"]);
  });

  it("expands a range", () => {
    expect([...cellsRead("=SUM(A2:A4)", sheet)].sort()).toEqual(["A2", "A3", "A4"]);
  });

  it("ignores the dollar signs", () => {
    expect([...cellsRead("=$A$2", sheet)]).toEqual(["A2"]);
  });

  it("finds nothing in a formula that reads nothing", () => {
    expect(cellsRead('=IF(1, "x", "y")', sheet).size).toBe(0);
  });

  it("builds a variant per other value in the column, never touching the header", () => {
    const variants = variantSheets(sheet, new Set(["A2"]));
    expect(variants.map((v) => v.cells.A2)).toEqual([2, 3]);
    expect(variants.every((v) => v.cells.A1 === "h")).toBe(true);
  });
});

/* ---------------- dropping cells out of a range and patching the total ------ */

/**
 * The second reported hole. `=SUM(D2:D8)+670` adds the first seven amounts and
 * types the eighth in by hand, so it is not a rule about the column at all: it
 * is the right total for this sheet and the wrong answer for every other one.
 *
 * It used to pass because variant generation spent a flat budget of twelve
 * starting at D2, so the run was over before D9 was ever changed and the
 * hardcoded 670 was never contradicted.
 */
describe("a range with cells dropped and the total patched by hand", () => {
  /** The SUM lesson's own sheet. D8 is 1420, D9 is 670, the total is 9560. */
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
      A7: 1047, B7: "Fernway", C7: "Otago", D7: 930,
      A8: 1048, B8: "Pounamu", C8: "Nelson", D8: 1420,
      A9: 1049, B9: "Rimu Co", C9: "Otago", D9: 670,
    },
  };

  const spec = { expected: 9560, mustUse: ["SUM"], canonical: "=SUM(D2:D9)" };
  const verdict = (formula: string) => {
    const r = checkFormula(formula, sheet, spec);
    return "status" in r ? r.status : "syntax";
  };

  it("refuses a range that stops early with the missing amount typed in", () => {
    expect(verdict("=SUM(D2:D8)+670")).toBe("wrong");
  });

  it("refuses it however many cells are left out", () => {
    expect(verdict("=SUM(D2:D7)+2090")).toBe("wrong");
    expect(verdict("=SUM(D3:D9)+1250")).toBe("wrong");
  });

  it("still takes the model answer and the ways of writing it", () => {
    expect(verdict("=SUM(D2:D9)")).toBe("correct");
    expect(verdict("=SUM(D:D)")).toBe("correct");
    expect(verdict("=SUM($D$2:$D$9)")).toBe("correct");
  });

  it("takes the same total written out with plus signs", () => {
    // The lesson itself requires SUM, so this one fails on mustUse there.
    // What matters here is that the behavioural check does not mistake it for
    // a different rule: it reads every cell and moves with all of them.
    const r = checkFormula("=D2+D3+D4+D5+D6+D7+D8+D9", sheet, {
      expected: 9560,
      mustUse: [],
      canonical: "=SUM(D2:D9)",
    });
    expect("status" in r ? r.status : "syntax").toBe("correct");
  });

  it("changes the last cell of the range, not only the first few", () => {
    const cells = cellsRead("=SUM(D2:D9)", sheet);
    const variants = variantSheets(sheet, cells);
    const moved = (ref: string) =>
      variants.some((v) => v.cells[ref] !== sheet.cells[ref]);

    expect(moved("D9")).toBe(true);
    expect(moved("D8")).toBe(true);
    for (const ref of cells) expect(moved(ref)).toBe(true);
  });
});

describe("ranges longer than the variant budget", () => {
  /** Forty data rows, every amount distinct, so no cell runs out of swaps. */
  const sheet: Sheet = {
    cols: ["A"],
    rows: 41,
    cells: (() => {
      const cells: Record<string, string | number> = { A1: "Amount" };
      for (let row = 2; row <= 41; row++) cells[`A${row}`] = row * 10;
      return cells;
    })(),
  };

  /** 20 + 30 + ... + 410. */
  const total = (41 * 42) / 2 * 10 - 10;

  const spec = { expected: total, mustUse: ["SUM"], canonical: "=SUM(A2:A41)" };
  const verdict = (formula: string) => {
    const r = checkFormula(formula, sheet, spec);
    return "status" in r ? r.status : "syntax";
  };

  it("gives every cell in the range a variant, however long the range is", () => {
    const cells = cellsRead("=SUM(A2:A41)", sheet);
    expect(cells.size).toBe(40);

    const variants = variantSheets(sheet, cells);
    for (const ref of cells) {
      expect(variants.some((v) => v.cells[ref] !== sheet.cells[ref])).toBe(true);
    }
  });

  it("stays linear in the size of the range, not a product of it", () => {
    const cells = cellsRead("=SUM(A2:A41)", sheet);
    // One per cell, plus the fixed depth allowance. Nothing combinatorial.
    expect(variantSheets(sheet, cells).length).toBe(cells.size + 12);
  });

  it("catches a cell dropped from the far end of a long range", () => {
    expect(verdict("=SUM(A2:A40)+410")).toBe("wrong");
    expect(verdict("=SUM(A2:A41)")).toBe("correct");
  });
});
