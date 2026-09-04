import type { Lesson, Sheet } from "@/lib/schema";
import { SIGNATURES } from "@/lib/signatures";

/** C6 is blank and C4 holds text, which is the whole point of this lesson:
 *  COUNT sees seven numbers, COUNTA sees eight filled cells. */
const sheet: Sheet = {
  cols: ["A", "B", "C", "D"],
  rows: 10,
  cells: {
    A1: "Order",
    B1: "Customer",
    C1: "Amount",
    D1: "Status",
    A2: 1042,
    B2: "Northwind",
    C2: 1250,
    D2: "Paid",
    A3: 1043,
    B3: "Kea Ltd",
    C3: 840,
    D3: "Paid",
    A4: 1044,
    B4: "Halcyon",
    C4: "pending",
    D4: "Sent",
    A5: 1045,
    B5: "Brightsmith",
    C5: 560,
    D5: "Paid",
    A6: 1046,
    B6: "Tuatara",
    D6: "Draft",
    A7: 1047,
    B7: "Fernway",
    C7: 1780,
    D7: "Sent",
    A8: 1048,
    B8: "Pounamu",
    C8: 930,
    D8: "Paid",
    A9: 1049,
    B9: "Rimu Co",
    C9: 1420,
    D9: "Sent",
    A10: 1050,
    B10: "Kahu Ltd",
    C10: 670,
    D10: "Paid",
  },
};

export const count: Lesson = {
  id: "count",
  name: "COUNT and COUNTA",
  blurb: "Count numbers, or count anything at all",
  group: "basics",
  order: 3,
  signatures: [SIGNATURES.COUNT, SIGNATURES.COUNTA],
  sheet,
  understand: {
    problem:
      'Someone asks how many orders have been priced. Real sheets are messy: one amount says "pending" and another was never filled in. COUNT and COUNTA give different answers here, and the difference is the answer to a different question.',
  },
  build: {
    target:
      "Count how many orders have an actual number in the amount column. Watch what COUNT does with the untidy rows.",
    expected: 7,
    mustUse: ["COUNT"],
    canonical: "=COUNT(C2:C10)",
    hint: "COUNT looks at a range and counts only the cells holding a number.",
    hint2: "The amounts run from C2 to C10. Nine cells, but not nine numbers.",
    explanation:
      'Seven. C4 holds the word "pending" and C6 is empty, so COUNT skips both. That is what makes it a count of priced orders rather than a count of rows.',
    rejects: ["=7", "=COUNTA(C2:C10)"],
  },
  exercises: [
    {
      id: "count-1",
      type: "formula",
      prompt:
        "Now count how many of those cells have anything in them at all, priced or not.",
      expected: 8,
      mustUse: ["COUNTA"],
      canonical: "=COUNTA(C2:C10)",
      rejects: ["=8", "=COUNT(C2:C10)"],
      hint: "There is a second function for this. The A on the end stands for all.",
      hint2:
        'COUNTA takes the same range, C2 to C10, and counts every cell that is not empty, including the one that says "pending".',
      explanation:
        "Eight. COUNTA counts the text cell because something is in it. Only the truly empty cell is skipped.",
    },
    {
      id: "count-2",
      type: "choice",
      prompt: "Over the same range, COUNT says 7 and COUNTA says 8. Why?",
      options: [
        'COUNTA also counts C4, because "pending" is text but the cell is not empty',
        "COUNTA counts the empty cell C6 as well",
        "COUNT skips the first row of data",
        "COUNTA includes the heading in row 1",
      ],
      correctIndex: 0,
      optionHints: {
        1: "Neither function counts a truly empty cell. Look for a cell that has something in it that is not a number.",
        2: "Both start at C2. Neither skips a row of data.",
        3: "The range starts at C2, so row 1 is not in it either way.",
      },
      hint: "One cell in that range has something in it that is not a number. Find it.",
      hint2:
        'C4 holds the word "pending" and C6 is empty. Work out which of those two functions would count which.',
      explanation:
        "COUNT means how many numbers. COUNTA means how many filled cells. The gap between them is usually the text somebody typed into a number column.",
    },
    {
      id: "count-3",
      type: "range",
      prompt:
        "Tap the first and last cell of the range COUNT should look at to count priced orders.",
      correctRange: "C2:C10",
      nearMisses: {
        "C1:C10":
          'Row 1 is the heading. COUNT would ignore the word "Amount" anyway, but leave it out so the formula says what it means.',
        "C2:C9": "That stops a row early and misses order 1050.",
        "D2:D10": "That is the status column, which holds no numbers at all.",
      },
      hint: "The amount column, data rows only. Look carefully at where the data stops.",
      hint2:
        "Column C, from row 2 to row 10. There are nine rows of orders, not eight.",
      explanation:
        "C2:C10. Nine cells, seven of them numbers, which is exactly the point of this lesson.",
    },
  ],
  takeaways: [
    "COUNT counts numbers. COUNTA counts anything that is not an empty cell.",
    "A gap between the two answers usually means text has been typed into a number column.",
    "Neither one counts an empty cell, so neither tells you how many rows there are.",
  ],
};
