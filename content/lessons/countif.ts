import type { ExcelLesson, Sheet } from "@/lib/schema";
import { SIGNATURES } from "@/lib/signatures";

/** Otago appears four times and five amounts clear 1000, so the two natural
 *  questions in this lesson have different answers. */
const sheet: Sheet = {
  cols: ["A", "B", "C", "D"],
  rows: 9,
  cells: {
    A1: "Order",
    B1: "Customer",
    C1: "Region",
    D1: "Amount",
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

export const countif: ExcelLesson = {
  track: "excel",
  id: "countif",
  name: "COUNTIF",
  blurb: "Count only the rows that meet a condition",
  group: "conditional",
  order: 5,
  signatures: [SIGNATURES.COUNTIF],
  sheet,
  understand: {
    problem:
      "COUNT tells you how many orders there are. Nobody ever wants that on its own. They want how many came from Otago, or how many cleared a thousand dollars. COUNTIF is COUNT with the question attached.",
  },
  worked: "=COUNTIF(C2:C9, \"Waikato\")",
  build: {
    target: "Count how many orders came from Otago.",
    expected: 4,
    mustUse: ["COUNTIF"],
    canonical: '=COUNTIF(C2:C9, "Otago")',
    hint: "Two arguments: the range to look through, then what you are looking for in it.",
    hint2:
      'Regions are in C2:C9. The thing you are looking for is text, so it goes in quotes: "Otago".',
    explanation:
      "Four. The condition is a separate argument, so you can change the region without touching the range.",
    rejects: ["=4"],
  },
  exercises: [
    {
      id: "countif-1",
      type: "choice",
      prompt: "Which of these counts the orders from Waikato?",
      options: [
        '=COUNTIF("Waikato", C2:C9)',
        '=COUNT(C2:C9, "Waikato")',
        '=COUNTIF(B2:B9, "Waikato")',
        '=COUNTIF(C2:C9, "Waikato")',
      ],
      correctIndex: 3,
      optionHints: {
        0: "The range comes first and the condition second. Swapping them leaves the formula with nothing to search.",
        1: "COUNT only counts numbers and takes no condition. The extra argument does not do what it looks like it does.",
        2: "Column B holds customers, not regions.",
      },
      hint: "Range first, condition second, and check which column actually holds regions.",
      hint2:
        "Regions are in column C, rows 2 to 9. Waikato is text, so it needs quotes.",
      explanation:
        "Range first, then the test. That order is the same in COUNTIF, SUMIF and everything built on them.",
    },
    {
      id: "countif-2",
      type: "formula",
      prompt: "Count how many orders came to more than 1000.",
      expected: 5,
      mustUse: ["COUNTIF"],
      canonical: '=COUNTIF(D2:D9, ">1000")',
      rejects: ["=5", '=COUNTIF(C2:C9, "Otago")'],
      hint: "The condition does not have to be a value to match. It can be a comparison.",
      hint2:
        'A comparison goes inside the quotes with the operator: ">1000". The range is the amounts, D2 to D9.',
      explanation:
        "Five. The whole condition including the greater-than sign lives inside the quotes, which catches almost everybody once.",
    },
    {
      id: "countif-3",
      type: "range",
      prompt:
        "Tap the first and last cell of the range COUNTIF searches when you ask about regions.",
      correctRange: "C2:C9",
      nearMisses: {
        "C1:C9":
          "Row 1 is the heading. It would never match a region name, but leave it out anyway.",
        "D2:D9": "Those are amounts. Regions are one column to the left.",
        "B2:B9": "That is the customer column.",
      },
      hint: "You are asking a question about regions, so search where the regions are.",
      hint2: "Column C, rows 2 to 9.",
      explanation:
        "C2:C9. The range is where you look, and the condition is what you look for. Keep those two jobs separate in your head.",
    },
  ],
  takeaways: [
    "Range first, condition second. Every function in this family works that way.",
    'A comparison goes inside the quotes, operator and all: ">1000", not > "1000".',
    "COUNTIF matches text without caring about capital letters.",
  ],
};
