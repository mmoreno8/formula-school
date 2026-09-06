import type { ExcelLesson, Sheet } from "@/lib/schema";
import { SIGNATURES } from "@/lib/signatures";

const sheet: Sheet = {
  cols: ["A", "B", "C", "D", "E"],
  rows: 9,
  cells: {
    A1: "Order",
    B1: "Customer",
    C1: "Region",
    D1: "Amount",
    E1: "Units",
    A2: 1042,
    B2: "Northwind",
    C2: "Otago",
    D2: 1250,
    E2: 12,
    A3: 1043,
    B3: "Kea Ltd",
    C3: "Waikato",
    D3: 840,
    E3: 5,
    A4: 1044,
    B4: "Halcyon",
    C4: "Otago",
    D4: 2110,
    E4: 20,
    A5: 1045,
    B5: "Brightsmith",
    C5: "Auckland",
    D5: 560,
    E5: 3,
    A6: 1046,
    B6: "Tuatara",
    C6: "Waikato",
    D6: 1780,
    E6: 15,
    A7: 1047,
    B7: "Fernway",
    C7: "Otago",
    D7: 930,
    E7: 8,
    A8: 1048,
    B8: "Pounamu",
    C8: "Nelson",
    D8: 1420,
    E8: 11,
    A9: 1049,
    B9: "Rimu Co",
    C9: "Otago",
    D9: 670,
    E9: 6,
  },
};

export const sum: ExcelLesson = {
  track: "excel",
  id: "sum",
  name: "SUM",
  blurb: "Add up a column of numbers",
  group: "basics",
  order: 1,
  signatures: [SIGNATURES.SUM],
  sheet,
  understand: {
    problem:
      "Your manager wants one number: what did all these orders come to. You could add the cells one at a time with plus signs, and you would get there. SUM does the same job in a way that still works when the sheet grows to 800 rows.",
  },
  worked: "=SUM(E2:E9)",
  build: {
    target:
      "Add up every amount in column D. Click a column letter to drop the whole range in, rather than typing it.",
    expected: 9560,
    mustUse: ["SUM"],
    canonical: "=SUM(D2:D9)",
    hint: "SUM takes a range: the first cell of the run, a colon, then the last cell.",
    hint2:
      "The amounts start at D2 and finish at D9. Row 1 is the heading, so it stays out of the range.",
    explanation:
      "One range, one total. When someone adds row 10 tomorrow you widen the range instead of rewriting the formula.",
    rejects: ["=9560", "=SUM(D2:D8)"],
  },
  exercises: [
    {
      id: "sum-1",
      type: "choice",
      prompt:
        "Which of these adds up every amount, and keeps working if a row is added?",
      options: [
        "=SUM(A2:A9)",
        "=SUM(D2:D9) / 8",
        "=SUM(D2:D9)",
        "=SUM(D2, D9)",
      ],
      correctIndex: 2,
      optionHints: {
        0: "Column A holds order numbers. Adding those together gives a number that means nothing.",
        1: "Dividing by 8 gives you the average, not the total.",
        3: "A comma means two separate cells. That adds the first amount to the last and ignores everything between them.",
      },
      hint: "Look for the one that describes a run of cells rather than two of them.",
      hint2:
        "A colon means everything from here to there. A comma means only these two.",
      explanation:
        "A colon covers the whole run, so the formula still reads correctly when the sheet grows.",
    },
    {
      id: "sum-2",
      type: "range",
      prompt:
        "Tap the first cell and then the last cell of the range that holds the amounts.",
      correctRange: "D2:D9",
      nearMisses: {
        "D1:D9":
          'Row 1 is the heading, the word "Amount". SUM would skip it, but a reader would wonder why it is in there.',
        "E2:E9": "Those are units, not amounts.",
        "D2:D8":
          "That stops one row early and leaves the last order out of the total.",
      },
      hint: "Amounts only, and only the rows that hold data.",
      hint2:
        "Column D, starting at row 2 because row 1 is the heading, ending at row 9.",
      explanation:
        "D2:D9. Headings stay out of ranges, so the formula says what it means.",
    },
    {
      id: "sum-3",
      type: "formula",
      prompt: "Now total the units instead. Write the whole formula.",
      expected: 80,
      mustUse: ["SUM"],
      canonical: "=SUM(E2:E9)",
      rejects: ["=80", "=SUM(D2:D9)"],
      hint: "Same shape as before, pointed at a different column.",
      hint2: "Units live in column E, rows 2 to 9.",
      explanation:
        "Once you know the shape, changing the column is the only work. That is the whole point of a formula.",
    },
  ],
  takeaways: [
    "A colon means a run of cells. A comma means only the cells you name.",
    "Leave the heading row out of the range, so the formula reads the way it behaves.",
    "SUM ignores text and empty cells inside a range instead of breaking on them.",
  ],
};
