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

export const average: ExcelLesson = {
  track: "excel",
  id: "average",
  name: "AVERAGE",
  blurb: "Find the middle of a set of numbers",
  group: "basics",
  order: 2,
  signatures: [SIGNATURES.AVERAGE],
  sheet,
  understand: {
    problem:
      "The total tells you how much came in. It does not tell you what a normal order looks like. Someone asks what a typical order is worth, and AVERAGE answers that in one step instead of two.",
  },
  build: {
    target: "Work out the average amount across all eight orders.",
    expected: 1195,
    mustUse: ["AVERAGE"],
    canonical: "=AVERAGE(D2:D9)",
    hint: "AVERAGE takes the same kind of range SUM does. You are not dividing anything yourself.",
    hint2:
      "The amounts are D2 to D9. AVERAGE adds them and divides by how many numbers it found, in one go.",
    explanation:
      "AVERAGE counts the numbers for you. Dividing by a number you typed yourself goes wrong the moment a row is added.",
    rejects: ["=1195", "=SUM(D2:D9)/8"],
  },
  exercises: [
    {
      id: "average-1",
      type: "gaps",
      prompt: "Fill the range so this returns the average amount.",
      template: "=AVERAGE({0})",
      gaps: [
        {
          accept: ["D2:D9", "D:D", "$D$2:$D$9"],
          tint: "search",
          placeholder: "range",
        },
      ],
      hint: "Amounts, data rows only.",
      hint2: "Column D, from row 2 down to row 9.",
      explanation:
        "One range is all AVERAGE needs. It handles the counting and the dividing itself.",
    },
    {
      id: "average-2",
      type: "choice",
      prompt:
        "Which of these gives the average amount, and stays right if a row is added?",
      options: [
        "=SUM(D2:D9) / 9",
        "=AVERAGE(D2:D8)",
        "=AVERAGE(A2:A9)",
        "=AVERAGE(D2:D9)",
      ],
      correctIndex: 3,
      optionHints: {
        0: "There are eight amounts, not nine, and the 9 stops being right the moment the sheet grows.",
        1: "That leaves the last order out.",
        2: "Column A holds order numbers. Their average is a meaningless number.",
      },
      hint: "Two of these divide by a number somebody typed. Numbers people type go stale.",
      hint2:
        "Count the rows of data: there are eight. Then look at which option never has to know that.",
      explanation:
        "AVERAGE works out the count itself, so nothing needs updating when the sheet grows.",
    },
    {
      id: "average-3",
      type: "formula",
      prompt: "Write the formula for the average number of units per order.",
      expected: 10,
      mustUse: ["AVERAGE"],
      canonical: "=AVERAGE(E2:E9)",
      rejects: ["=10", "=AVERAGE(D2:D9)"],
      hint: "Same shape, different column.",
      hint2: "Units are in column E, rows 2 to 9.",
      explanation:
        "Ten units on a typical order. Same formula, pointed one column across.",
    },
  ],
  takeaways: [
    "AVERAGE counts the numbers itself, so you never divide by a figure you typed.",
    "It ignores text and blank cells rather than treating them as zero, which changes the answer.",
    "A total and an average answer different questions. Know which one was asked.",
  ],
};
