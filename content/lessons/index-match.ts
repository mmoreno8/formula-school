import type { Lesson, Sheet } from "@/lib/schema";
import { SIGNATURES } from "@/lib/signatures";

const sheet: Sheet = {
  cols: ["A", "B", "C", "D", "E", "F"],
  rows: 7,
  cells: {
    A1: "SKU", B1: "Product", C1: "Margin", D1: "Stock", E1: "Find SKU", F1: "P-42",
    A2: "P-14", B2: "Monitor arm", C2: 31.2, D2: 12,
    A3: "P-21", B3: "Dock", C3: 45.8, D3: 8,
    A4: "P-35", B4: "Laptop", C4: 214.4, D4: 3,
    A5: "P-42", B5: "Headset", C5: 47.5, D5: 17,
    A6: "P-58", B6: "Keyboard", C6: 39.1, D6: 9,
    A7: "P-73", B7: "Webcam", C7: 52.6, D7: 0,
    E2: "Find SKU", F2: "P-58",
  },
};

export const indexMatch: Lesson = {
  id: "index-match",
  name: "INDEX and MATCH",
  blurb: "Find a position, then return the value at that position",
  group: "lookups",
  order: 18,
  signatures: [SIGNATURES.INDEX, SIGNATURES.MATCH],
  sheet,
  understand: {
    problem:
      "A legacy workbook needs a lookup that separates finding the row from returning the answer. MATCH finds a position. INDEX uses that position to return a value from another range.",
  },
  build: {
    target: "Use MATCH to find the SKU in F1, then INDEX to return its margin from column C.",
    expected: 47.5,
    mustUse: ["INDEX", "MATCH"],
    canonical: "=INDEX(C2:C7, MATCH(F1, A2:A7, 0))",
    hint: "Build from the inside: first find where F1 appears in the SKU range.",
    hint2: "MATCH uses F1, A2:A7 and 0. Give that position to INDEX over C2:C7.",
    explanation: "MATCH finds P-42 in position 4, and INDEX returns position 4 from the margin range.",
    rejects: ["=47.5", "=MATCH(F1,A2:A7,0)", "=INDEX(D2:D7,MATCH(F1,A2:A7,0))"],
  },
  exercises: [
    {
      id: "indexmatch-choice",
      type: "choice",
      prompt: "Which formula returns the product name for the SKU in F2?",
      options: [
        "=INDEX(A2:A7,MATCH(F2,B2:B7,0))",
        "=MATCH(F2,A2:A7,0)",
        "=INDEX(B2:B7,MATCH(F2,A2:A7,0))",
        "=INDEX(B2:B7,MATCH(F2,C2:C7,0))",
      ],
      correctIndex: 2,
      optionHints: {
        0: "This searches product names for a SKU and returns from the SKU column.",
        1: "MATCH returns the position, not the product name.",
        3: "The SKU must be searched for in the SKU column, not the margin column.",
      },
      hint: "MATCH searches the SKU column; INDEX returns from the product column.",
      hint2: "Use MATCH(F2,A2:A7,0) inside INDEX over B2:B7.",
      explanation: "MATCH finds position 5 and INDEX returns Keyboard from position 5 of B2:B7.",
    },
    {
      id: "indexmatch-range",
      type: "range",
      prompt: "Select the range MATCH should search when looking for a SKU.",
      correctRange: "A2:A7",
      nearMisses: {
        "A1:A7": "A1 is the heading rather than a SKU.",
        "B2:B7": "Those are product names, not SKUs.",
        "C2:C7": "Those are margins, which belong to the return range.",
      },
      hint: "MATCH searches the column that contains the value you already have.",
      hint2: "SKUs occupy A2 through A7.",
      explanation: "A2:A7 contains the six searchable SKUs without the heading.",
    },
    {
      id: "indexmatch-formula",
      type: "formula",
      prompt: "Write an INDEX and MATCH formula that returns the stock count for the SKU in F2.",
      expected: 9,
      mustUse: ["INDEX", "MATCH"],
      canonical: "=INDEX(D2:D7, MATCH(F2, A2:A7, 0))",
      rejects: ["=9", "=MATCH(F2,A2:A7,0)", "=INDEX(C2:C7,MATCH(F2,A2:A7,0))"],
      hint: "Use MATCH to find the SKU's position, then return from the stock range.",
      hint2: "INDEX uses D2:D7 and the position from MATCH(F2,A2:A7,0).",
      explanation: "MATCH finds P-58 in position 5, and INDEX returns 9 from position 5 of the stock range.",
    },
  ],
  takeaways: [
    "MATCH returns a position inside a one-row or one-column range.",
    "Zero asks MATCH for an exact result, which is the safe choice for IDs.",
    "INDEX returns the value at the position MATCH found in a separate range.",
  ],
};
