import type { ExcelLesson, Sheet } from "@/lib/schema";
import { SIGNATURES } from "@/lib/signatures";

const sheet: Sheet = {
  cols: ["A", "B", "C", "D", "E", "F"],
  rows: 9,
  cells: {
    A1: "Order",
    B1: "Customer",
    C1: "Region",
    D1: "Amount",
    E1: "Find order",
    F1: 1047,
    A2: 1042,
    B2: "Northwind",
    C2: "Otago",
    D2: 1250,
    A3: 1043,
    B3: "Kea Ltd",
    C3: "Waikato",
    D3: 840,
    A4: 1044,
    B4: "Halcyon",
    C4: "Otago",
    D4: 2110,
    A5: 1045,
    B5: "Brightsmith",
    C5: "Auckland",
    D5: 560,
    A6: 1046,
    B6: "Tuatara",
    C6: "Waikato",
    D6: 1780,
    A7: 1047,
    B7: "Fernway",
    C7: "Otago",
    D7: 930,
    A8: 1048,
    B8: "Pounamu",
    C8: "Nelson",
    D8: 1420,
    A9: 1049,
    B9: "Rimu Co",
    C9: "Otago",
    D9: 1120,
  },
};

export const vlookup: ExcelLesson = {
  track: "excel",
  id: "vlookup",
  name: "VLOOKUP",
  blurb: "The older lookup you will still meet in real files",
  group: "lookups",
  order: 9,
  signatures: [SIGNATURES.VLOOKUP],
  sheet,
  understand: {
    problem:
      "VLOOKUP has been in every workplace spreadsheet for twenty years, so you will inherit files full of it whether you like it or not. It takes a whole table and a column number, counted from the left edge of that table, which is where most of its problems come from.",
  },
  build: {
    target:
      "The order number you want sits in F1. Use VLOOKUP to bring back its region.",
    expected: "Otago",
    mustUse: ["VLOOKUP"],
    canonical: "=VLOOKUP(F1, A2:D9, 3, FALSE)",
    hint: "Four arguments: what to find, the whole table to search, which column of that table to return, and FALSE for an exact match.",
    hint2:
      "The table is A2:D9. Counting from column A as 1, the regions are the third column. End with FALSE.",
    explanation:
      "Otago. The 3 counts from the left edge of the table you handed it, not from column A of the sheet. Move the table and the number changes.",
    rejects: ['="Otago"', "=XLOOKUP(F1, A2:A9, C2:C9)"],
  },
  exercises: [
    {
      id: "vlookup-1",
      type: "choice",
      prompt:
        "Which of these brings back the customer name for the order in F1?",
      options: [
        "=VLOOKUP(F1, A2:D9, 2, FALSE)",
        "=VLOOKUP(F1, A2:D9, 1, FALSE)",
        "=VLOOKUP(F1, A2:D9, 3, FALSE)",
        "=VLOOKUP(F1, B2:D9, 2, FALSE)",
      ],
      correctIndex: 0,
      optionHints: {
        1: "Column 1 of that table is the order number, so this hands back the number you already had.",
        2: "Column 3 is the region.",
        3: "That table starts at column B, so VLOOKUP looks for the order number among the customer names and finds nothing.",
      },
      hint: "Count the columns from the left edge of the table in the formula, not from column A of the sheet.",
      hint2:
        "The table starts at A, so A is 1, B is 2, C is 3, D is 4. Customers are in B.",
      explanation:
        "The column number is counted inside the table you gave it. The first column of that table is always the one being searched.",
    },
    {
      id: "vlookup-2",
      type: "gaps",
      prompt:
        "Fill the table and the column number so this brings back the amount.",
      template: "=VLOOKUP(F1, {0}, {1}, FALSE)",
      gaps: [
        {
          accept: ["A2:D9", "$A$2:$D$9"],
          tint: "search",
          placeholder: "table",
        },
        { accept: ["4"], tint: "return", placeholder: "column" },
      ],
      hint: "The table has to start at the column holding order numbers, and stretch far enough right to reach the amounts.",
      hint2:
        "A2:D9 covers all four columns. Counting from A as 1, amounts are the fourth.",
      explanation:
        "930. The table must begin at the column you are searching, which is what stops VLOOKUP looking to its left.",
    },
    {
      id: "vlookup-3",
      type: "formula",
      prompt:
        "Write the whole formula that brings back the amount for the order in F1, with an exact match.",
      expected: 930,
      mustUse: ["VLOOKUP"],
      canonical: "=VLOOKUP(F1, A2:D9, 4, FALSE)",
      rejects: ["=930", "=D7"],
      hint: "Same table, a different column number, and do not leave the last argument off.",
      hint2:
        "Amounts are the fourth column of A2:D9. FALSE at the end means exact match, and you almost always want it.",
      explanation:
        "930. Leaving FALSE off asks for an approximate match, which quietly returns the wrong row when the data is not sorted.",
    },
  ],
  takeaways: [
    "The column number counts from the left edge of the table you gave it, not from column A.",
    "VLOOKUP cannot look to the left, so the column you search has to be the first one in the table.",
    "End with FALSE unless you genuinely want an approximate match on sorted data.",
  ],
};
