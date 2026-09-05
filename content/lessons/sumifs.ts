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

export const sumifs: ExcelLesson = {
  track: "excel",
  id: "sumifs",
  name: "SUMIFS",
  blurb: "Add up rows that meet several conditions at once",
  group: "conditional",
  order: 8,
  signatures: [SIGNATURES.SUMIFS],
  sheet,
  understand: {
    problem:
      "This is the one that ends up in every monthly report: how much did Otago bring in during January. SUMIFS looks like SUMIF with more pairs, except for one thing that trips up everybody who learned SUMIF first.",
  },
  build: {
    target: "Total the amounts for Otago orders placed in January.",
    expected: 2370,
    mustUse: ["SUMIFS"],
    canonical: '=SUMIFS(D2:D9, C2:C9, "Otago", E2:E9, "Jan")',
    hint: "The column you are adding up comes first here, before any of the conditions. That is the opposite of SUMIF.",
    hint2:
      'Amounts go first, as D2:D9. Then the pairs: C2:C9 with "Otago", then E2:E9 with "Jan".',
    explanation:
      "2,370. In SUMIF the numbers come last, in SUMIFS they come first. Nothing warns you when you get it the wrong way round.",
    rejects: ["=2370", '=SUMIF(C2:C9, "Otago", D2:D9)'],
  },
  exercises: [
    {
      id: "sumifs-1",
      type: "gaps",
      prompt: "Fill the two ranges so this totals the Waikato orders.",
      template: '=SUMIFS({0}, {1}, "Waikato")',
      gaps: [
        {
          accept: ["D2:D9", "$D$2:$D$9"],
          tint: "return",
          placeholder: "add up",
        },
        {
          accept: ["C2:C9", "$C$2:$C$9"],
          tint: "search",
          placeholder: "check",
        },
      ],
      hint: "First gap is what gets added. Second gap is what gets tested.",
      hint2:
        "Amounts are column D and regions are column C, which is the reverse of the order SUMIF wanted them in.",
      explanation:
        "2,620. Sum range first, then the pairs. Say it out loud a few times and it sticks.",
    },
    {
      id: "sumifs-2",
      type: "choice",
      prompt: "Which of these totals the February orders worth more than 1000?",
      options: [
        '=SUMIF(D2:D9, E2:E9, "Feb", ">1000")',
        '=SUMIFS(D2:D9, E2:E9, "Feb", ">1000")',
        '=SUMIFS(D2:D9, E2:E9, "Feb", D2:D9, ">1000")',
        '=SUMIFS(E2:E9, "Feb", D2:D9, ">1000")',
      ],
      correctIndex: 2,
      optionHints: {
        0: "SUMIF takes one condition only, and its arguments are in a different order.",
        1: "The last condition has no range in front of it. Every condition needs its own range.",
        3: "The first argument has to be the column being added. This starts with the months.",
      },
      hint: "Check the first argument of each option. Only one of them starts with the money.",
      hint2:
        "A column can appear twice: once as the thing being added, and again as a column being tested.",
      explanation:
        "3,530. The amounts appear twice here, as the sum range and as a condition range, which is allowed and often needed.",
    },
    {
      id: "sumifs-3",
      type: "formula",
      prompt: "Total the Otago orders that came to more than 1000.",
      expected: 4480,
      mustUse: ["SUMIFS"],
      canonical: '=SUMIFS(D2:D9, C2:C9, "Otago", D2:D9, ">1000")',
      rejects: ["=4480", '=SUMIF(C2:C9, "Otago", D2:D9)'],
      hint: "Two conditions, and one of them is about the same column you are adding up.",
      hint2:
        'Start with D2:D9. Then C2:C9 with "Otago". Then D2:D9 again with ">1000".',
      explanation:
        "4,480. Three of the four Otago orders clear a thousand. Using the same range twice is normal, not a mistake.",
    },
  ],
  takeaways: [
    "SUMIFS puts the column being added first. SUMIF puts it last. This is the one to remember.",
    "After the sum range, the arguments alternate: range, condition, range, condition.",
    "The same column can be both the sum range and a condition range.",
  ],
};
