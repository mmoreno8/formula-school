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
    E1: "Month",
    A2: 1042,
    B2: "Northwind",
    C2: "Otago",
    D2: 1250,
    E2: "Jan",
    A3: 1043,
    B3: "Kea Ltd",
    C3: "Waikato",
    D3: 840,
    E3: "Jan",
    A4: 1044,
    B4: "Halcyon",
    C4: "Otago",
    D4: 2110,
    E4: "Feb",
    A5: 1045,
    B5: "Brightsmith",
    C5: "Auckland",
    D5: 560,
    E5: "Feb",
    A6: 1046,
    B6: "Tuatara",
    C6: "Waikato",
    D6: 1780,
    E6: "Jan",
    A7: 1047,
    B7: "Fernway",
    C7: "Otago",
    D7: 930,
    E7: "Mar",
    A8: 1048,
    B8: "Pounamu",
    C8: "Nelson",
    D8: 1420,
    E8: "Feb",
    A9: 1049,
    B9: "Rimu Co",
    C9: "Otago",
    D9: 1120,
    E9: "Jan",
  },
};

export const countifs: ExcelLesson = {
  track: "excel",
  id: "countifs",
  name: "COUNTIFS",
  blurb: "Count rows that meet several conditions at once",
  group: "conditional",
  order: 7,
  signatures: [SIGNATURES.COUNTIFS],
  sheet,
  understand: {
    problem:
      "One condition was enough until the question got sharper. Now it is how many Otago orders came in during January. COUNTIFS takes as many range and condition pairs as you need, and a row is only counted when every one of them holds.",
  },
  build: {
    target: "Count the orders that came from Otago in January.",
    expected: 2,
    mustUse: ["COUNTIFS"],
    canonical: '=COUNTIFS(C2:C9, "Otago", E2:E9, "Jan")',
    hint: "The arguments come in pairs: a range, then the condition for that range, then the next pair.",
    hint2:
      'Regions are C2:C9 and the condition is "Otago". Months are E2:E9 and the condition is "Jan".',
    explanation:
      "Two. Every pair has to hold for a row to count, which is why the answer is smaller than either condition on its own.",
    rejects: ["=2", '=COUNTIF(C2:C9, "Otago")'],
  },
  exercises: [
    {
      id: "countifs-1",
      type: "choice",
      prompt: "Which of these counts the Waikato orders worth more than 1000?",
      options: [
        '=COUNTIFS(C2:C9, "Waikato", D2:D9, ">1000")',
        '=COUNTIFS(C2:C9, D2:D9, "Waikato", ">1000")',
        '=COUNTIF(C2:C9, "Waikato", D2:D9, ">1000")',
        '=COUNTIFS(C2:C9, "Waikato", D2:D8, ">1000")',
      ],
      correctIndex: 0,
      optionHints: {
        1: "The two ranges are together and the two conditions are together. They have to alternate: range, condition, range, condition.",
        2: "COUNTIF takes one pair only. The extra arguments are not what they look like.",
        3: "The second range is one row shorter than the first. The rows stop lining up.",
      },
      hint: "Count the arguments and check they alternate between a range and a condition.",
      hint2:
        "Every range in a COUNTIFS has to be the same height, or Excel cannot line row 4 of one up with row 4 of the next.",
      explanation:
        "One Waikato order clears 1000. Pairs must alternate, and every range must be the same height.",
    },
    {
      id: "countifs-2",
      type: "formula",
      prompt: "Count the February orders that came to less than 1000.",
      expected: 1,
      mustUse: ["COUNTIFS"],
      canonical: '=COUNTIFS(E2:E9, "Feb", D2:D9, "<1000")',
      rejects: ["=1", '=COUNTIF(C2:C9, "Nelson")'],
      hint: "Two pairs again. One about the month, one about the amount.",
      hint2:
        'Months are in E2:E9. The amount condition is a comparison, so it goes in quotes as "<1000".',
      explanation:
        "One. The order of the pairs makes no difference, as long as each range sits directly before its own condition.",
    },
    {
      id: "countifs-3",
      type: "range",
      prompt: "Tap the first and last cell of the range that holds the months.",
      correctRange: "E2:E9",
      nearMisses: {
        "E1:E9": 'Row 1 holds the word "Month", not a month.',
        "D2:D9": "Those are amounts.",
        "C2:C9": "That is the region column.",
      },
      hint: "Look at the column headings and find the one holding Jan, Feb and Mar.",
      hint2:
        "Column E, rows 2 to 9, matching the height of every other range in the formula.",
      explanation:
        "E2:E9. Every range in a COUNTIFS has to cover the same rows as the others.",
    },
  ],
  takeaways: [
    "Arguments alternate: range, condition, range, condition, for as many pairs as you need.",
    "A row is counted only when every condition holds, so the answer shrinks as you add pairs.",
    "Every range must be the same height, or the rows stop lining up.",
  ],
};
