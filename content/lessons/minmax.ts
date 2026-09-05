import type { ExcelLesson, Sheet } from "@/lib/schema";
import { SIGNATURES } from "@/lib/signatures";

const sheet: Sheet = {
  cols: ["A", "B", "C", "D"],
  rows: 9,
  cells: {
    A1: "Invoice", B1: "Client", C1: "Region", D1: "Days to pay",
    A2: 501, B2: "Kea Ltd", C2: "Waikato", D2: 18,
    A3: 502, B3: "Rimu Co", C3: "Otago", D3: 42,
    A4: 503, B4: "Northwind", C4: "Auckland", D4: 11,
    A5: 504, B5: "Halcyon", C5: "Nelson", D5: 27,
    A6: 505, B6: "Tuatara", C6: "Waikato", D6: 64,
    A7: 506, B7: "Fernway", C7: "Otago", D7: 9,
    A8: 507, B8: "Pounamu", C8: "Auckland", D8: 35,
    A9: 508, B9: "Brightsmith", C9: "Nelson", D9: 23,
  },
};

export const minmax: ExcelLesson = {
  track: "excel",
  id: "min-max",
  name: "MIN and MAX",
  blurb: "Find the smallest and largest numbers in a range",
  group: "basics",
  order: 11,
  signatures: [SIGNATURES.MIN, SIGNATURES.MAX],
  sheet,
  understand: {
    problem:
      "Your finance manager wants the fastest and slowest payment times in the invoice list. MIN finds the low end of a numeric range. MAX finds the high end.",
  },
  build: {
    target: "Find the longest payment time in column D, excluding the heading.",
    expected: 64,
    mustUse: ["MAX"],
    canonical: "=MAX(D2:D9)",
    hint: "You want the highest number, so use the function that looks for the top of a range.",
    hint2: "MAX needs the payment-day values in D2:D9, without the heading in D1.",
    explanation:
      "MAX checks every numeric value in D2:D9 and returns 64, the longest payment time.",
    rejects: ["=64", "=MIN(D2:D9)", "=MAX(D2:D5)"],
  },
  exercises: [
    {
      id: "minmax-choice",
      type: "choice",
      prompt: "Which formula finds the shortest payment time in the list?",
      options: ["=MIN(D2:D9)", "=MAX(D2:D9)", "=MIN(A2:A9)", "=AVERAGE(D2:D9)"],
      correctIndex: 0,
      optionHints: {
        1: "MAX finds the longest time, not the shortest.",
        2: "Column A contains invoice numbers rather than payment times.",
        3: "AVERAGE describes the middle of the list rather than its lowest value.",
      },
      hint: "The question asks for the bottom of a numeric range.",
      hint2: "Use MIN on the values in column D, rows 2 to 9.",
      explanation: "MIN returns 9, the smallest number of days in the payment column.",
    },
    {
      id: "minmax-range",
      type: "range",
      prompt: "Select the range that contains all payment times and no headings.",
      correctRange: "D2:D9",
      nearMisses: {
        "D1:D9": "D1 is a heading, not a payment time.",
        "D2:D8": "That stops before the final invoice.",
        "A2:A9": "Those are invoice numbers rather than payment times.",
      },
      hint: "Start below the heading and include the final populated row.",
      hint2: "Payment times occupy D2 through D9.",
      explanation: "D2:D9 contains all eight payment times and nothing else.",
    },
    {
      id: "minmax-formula",
      type: "formula",
      prompt: "Write a formula that returns the shortest payment time.",
      expected: 9,
      mustUse: ["MIN"],
      canonical: "=MIN(D2:D9)",
      rejects: ["=9", "=MAX(D2:D9)", "=MIN(D2:D6)"],
      hint: "Use the function that returns the lowest number in a range.",
      hint2: "Apply MIN to D2:D9.",
      explanation: "MIN checks the complete payment range and returns 9.",
    },
  ],
  takeaways: [
    "MIN returns the smallest numeric value in a range.",
    "MAX returns the largest numeric value in a range.",
    "Choose the data range, not an identifier column or its heading.",
  ],
};
