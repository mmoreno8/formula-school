import type { ExcelLesson, Sheet } from "@/lib/schema";
import { SIGNATURES } from "@/lib/signatures";

const sheet: Sheet = {
  cols: ["A", "B", "C", "D", "E", "F"],
  rows: 7,
  cells: {
    A1: "SKU", B1: "Product", C1: "Price", D1: "Stock", E1: "Find SKU", F1: "P-99",
    A2: "P-14", B2: "Monitor arm", C2: 63.5, D2: 12,
    A3: "P-21", B3: "Dock", C3: 184, D3: 8,
    A4: "P-35", B4: "Laptop", C4: 1289, D4: 3,
    A5: "P-42", B5: "Headset", C5: 92.5, D5: 17,
    A6: "P-58", B6: "Keyboard", C6: 118, D6: 9,
    A7: "P-73", B7: "Webcam", C7: 147, D7: 0,
    E2: "Find SKU", F2: "P-42",
  },
};

export const iferror: ExcelLesson = {
  track: "excel",
  id: "iferror",
  name: "IFERROR",
  blurb: "Replace formula errors with a useful result",
  group: "logic",
  order: 14,
  signatures: [SIGNATURES.IFERROR],
  sheet,
  understand: {
    problem:
      "A stock report is shared with people who do not need to decode #N/A. IFERROR tries the calculation and replaces an error with text they can act on.",
  },
  build: {
    target: 'Look up the missing SKU in F1 and return its price. Show "Not listed" if VLOOKUP cannot find it.',
    expected: "Not listed",
    mustUse: ["IFERROR", "VLOOKUP"],
    canonical: '=IFERROR(VLOOKUP(F1, A2:C7, 3, FALSE), "Not listed")',
    hint: "Put the lookup you want to try inside the first argument, then provide a readable fallback.",
    hint2: 'The lookup is VLOOKUP(F1,A2:C7,3,FALSE). The second IFERROR argument is "Not listed".',
    explanation: "VLOOKUP returns #N/A because P-99 is absent, so IFERROR returns Not listed instead.",
    rejects: ['="Not listed"', '=VLOOKUP(F1,A2:C7,3,FALSE)', '=IFERROR(VLOOKUP(F2,A2:C7,3,FALSE),"Not listed")'],
  },
  exercises: [
    {
      id: "iferror-choice",
      type: "choice",
      prompt: "Which formula looks up F2 and shows Missing if the lookup fails?",
      options: [
        '=VLOOKUP(F2,A2:C7,3,FALSE)',
        '=IFERROR("Missing",VLOOKUP(F2,A2:C7,3,FALSE))',
        '=IFERROR(VLOOKUP(F2,A2:C7,3,FALSE),"Missing")',
        '=IF(VLOOKUP(F2,A2:C7,3,FALSE),"Missing")',
      ],
      correctIndex: 2,
      optionHints: {
        0: "This lookup works for F2, but it has no fallback for a missing SKU.",
        1: "The formula to try belongs before the fallback.",
        3: "IF expects a logical test, not an error-handling rule.",
      },
      hint: "IFERROR reads as try this, otherwise show that.",
      hint2: "The VLOOKUP is the first argument and Missing is the second.",
      explanation: "IFERROR preserves the lookup result when it works and uses the fallback only when it fails.",
    },
    {
      id: "iferror-gaps",
      type: "gaps",
      prompt: "Fill the gaps so the lookup for F1 shows Check SKU when it fails.",
      template: '=IFERROR(VLOOKUP({0}, {1}, 2, FALSE), {2})',
      gaps: [
        { accept: ["F1"], tint: "lookup", placeholder: "SKU" },
        { accept: ["A2:B7"], tint: "search", placeholder: "table" },
        { accept: ['"Check SKU"'], tint: "return", placeholder: "fallback" },
      ],
      hint: "The lookup uses F1, a table whose first column contains SKUs, and quoted fallback text.",
      hint2: 'Use F1, A2:B7 and "Check SKU" in that order.',
      explanation: "The lookup fails for P-99, so the fallback text is shown.",
    },
    {
      id: "iferror-formula",
      type: "formula",
      prompt: "Write a formula that looks up the stock count for F2 and returns 0 if the SKU is missing.",
      expected: 17,
      mustUse: ["IFERROR", "VLOOKUP"],
      canonical: "=IFERROR(VLOOKUP(F2, A2:D7, 4, FALSE), 0)",
      rejects: ["=17", "=VLOOKUP(F2,A2:D7,4,FALSE)", "=IFERROR(VLOOKUP(F2,A2:C7,3,FALSE),0)"],
      hint: "The stock count is the fourth column of the table.",
      hint2: "Use VLOOKUP on A2:D7 with column index 4, then place that inside IFERROR with 0 as the fallback.",
      explanation: "F2 contains P-42, so the lookup succeeds and IFERROR leaves its stock count of 17 unchanged.",
    },
  ],
  takeaways: [
    "The first argument is the formula you expect might fail.",
    "The second argument is shown only when the first result is an error.",
    "Use a fallback that explains the situation instead of hiding a data problem.",
  ],
};
