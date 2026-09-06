import type { ExcelLesson, Sheet } from "@/lib/schema";
import { SIGNATURES } from "@/lib/signatures";

/** Duplicate customers and a repeated region, so a lookup that matches the
 *  wrong row gives a visibly different answer. F2 holds an order that is not
 *  in the list, which is what the fourth argument is for. */
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
    B7: "Northwind",
    C7: "Otago",
    D7: 930,
    A8: 1048,
    B8: "Pounamu",
    C8: "Nelson",
    D8: 1420,
    A9: 1049,
    B9: "Rimu Co",
    C9: "Waikato",
    D9: 670,
    E2: "Also find",
    F2: 1051,
  },
};

export const xlookup: ExcelLesson = {
  track: "excel",
  id: "xlookup",
  name: "XLOOKUP",
  blurb: "Find a row by one value, bring back another",
  group: "lookups",
  order: 10,
  signatures: [SIGNATURES.XLOOKUP],
  sheet,
  understand: {
    problem:
      "Someone drops an order number on your desk and asks which region it came from. The sheet has 8,000 rows and you are not scrolling through them. XLOOKUP finds the row for you and brings back the value you asked for.",
  },
  worked: "=XLOOKUP(F1, A2:A9, B2:B9)",
  build: {
    target:
      "The order number you are chasing sits in F1. Write the formula that brings back its region. Click a cell or a column letter instead of typing the reference.",
    expected: "Otago",
    mustUse: ["XLOOKUP"],
    canonical: "=XLOOKUP(F1, A2:A9, C2:C9)",
    hint: "Three questions, in order: who are you looking for, which column do you hunt through, and which column holds the answer you want.",
    hint2:
      "The second argument is the column you search. You are searching for an order number, so that is column A, rows 2 to 9. The third argument is the column you want back.",
    explanation:
      "You pointed at F1 for the order number, searched A2:A9, and brought back the matching row of C2:C9. Same three questions every time: who, where, what.",
    rejects: ['="Otago"', "=VLOOKUP(F1, A2:D9, 3, FALSE)"],
  },
  exercises: [
    {
      id: "xlookup-choice",
      type: "choice",
      prompt:
        "Order numbers sit in column A and regions sit in column C. Which formula brings back the region for the order typed in F1?",
      options: [
        "=XLOOKUP(A2:A9, F1, C2:C9)",
        "=VLOOKUP(F1, A2:C9, 1, FALSE)",
        "=XLOOKUP(F1, A2:A9, C2:C9)",
        "=XLOOKUP(F1, C2:C9, A2:A9)",
      ],
      correctIndex: 2,
      optionHints: {
        0: "The first argument is the single value you are looking for, not a whole column.",
        1: "Column 1 of that table is the order number, so this brings back the number you already had.",
        3: "The ranges are the right way round in the wrong order. You search where the order numbers are, not where the regions are.",
      },
      hint: "Read it as a sentence: find this, in here, bring back from there.",
      hint2:
        "Look at the second argument in each option. It has to be the column that holds order numbers, because that is what you are searching for.",
      explanation:
        "Search where the order numbers live, return from where the regions live. Search first, return second, always.",
    },
    {
      id: "xlookup-range",
      type: "range",
      prompt:
        "Tap the first cell and then the last cell of the range XLOOKUP should search through to find an order number.",
      correctRange: "A2:A9",
      nearMisses: {
        "A1:A9":
          'Row 1 is the heading, the word "Order" rather than an order number. Start at row 2.',
        "C2:C9":
          "That is where the regions are. You search the column that holds what you are looking for.",
        "D2:D9": "Those are amounts. You are searching for an order number.",
        "A2:D9":
          "XLOOKUP searches a single column, not a block. VLOOKUP is the one that takes a whole table.",
      },
      hint: "You are looking for an order number, so search the column that holds order numbers, and only the rows with data in them.",
      hint2:
        "Column A, and not row 1. Row 1 holds the heading, which is text, not an order number.",
      explanation:
        "Column A, rows 2 to 9. Leaving the header out is right. XLOOKUP wants data, not labels.",
    },
    {
      id: "xlookup-notfound",
      type: "formula",
      prompt:
        'F2 holds order 1051, which is not on this sheet. Write a formula that looks that order up and shows "No match" rather than an error. Whichever column you bring back is fine here, because there is nothing on this sheet to bring back.',
      expected: "No match",
      mustUse: ["XLOOKUP"],
      canonical: '=XLOOKUP(F2, A2:A9, D2:D9, "No match")',
      rejects: ['="No match"', "=XLOOKUP(F2, A2:A9, D2:D9)"],
      hint: "XLOOKUP takes a fourth argument for exactly this. It is what you get instead of an error when nothing matches.",
      hint2:
        'The fourth argument goes after the return range, and it is text, so it needs quotes: "No match".',
      explanation:
        'Without the fourth argument this returns #N/A, which means nothing to whoever reads the sheet. With it, the sheet says "No match" and everyone understands.',
    },
  ],
  takeaways: [
    "Search the column that holds what you are looking for, and bring back from the column you actually want. Search first, return second.",
    "The search range and the return range have to be the same height, or the rows stop lining up.",
    "A fourth argument replaces #N/A with something a person can read.",
  ],
};
