import type { ExcelLesson, Sheet } from "@/lib/schema";
import { SIGNATURES } from "@/lib/signatures";

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

export const sumif: ExcelLesson = {
  track: "excel",
  id: "sumif",
  name: "SUMIF",
  blurb: "Add up only the rows that meet a condition",
  group: "conditional",
  order: 6,
  signatures: [SIGNATURES.SUMIF],
  sheet,
  understand: {
    problem:
      "Counting Otago orders was useful. What the regional manager actually wants is how much money came from Otago. SUMIF checks one column and adds up a different one, which is the part people get tangled in.",
  },
  worked: "=SUMIF(C2:C9, \"Waikato\", D2:D9)",
  build: {
    target: "Total the amounts for orders from Otago.",
    expected: 5410,
    mustUse: ["SUMIF"],
    canonical: '=SUMIF(C2:C9, "Otago", D2:D9)',
    hint: "Three arguments here: the column you check, the condition, and then the column you add up.",
    hint2:
      "You check the regions in C2:C9, and the numbers you add live in D2:D9. Those two ranges have to be the same height.",
    explanation:
      "5,410. The column being tested and the column being added are different, which is the entire reason the third argument exists.",
    rejects: ["=5410", "=SUM(D2:D9)"],
  },
  exercises: [
    {
      id: "sumif-2",
      type: "choice",
      prompt: "Which of these totals every order over 1000?",
      options: [
        '=SUMIF(">1000", D2:D9)',
        '=SUMIF(D2:D9, ">1000")',
        '=SUMIF(D2:D9, ">1000", C2:C9)',
        '=COUNTIF(D2:D9, ">1000")',
      ],
      correctIndex: 1,
      optionHints: {
        0: "Range first, condition second. This has them the wrong way round.",
        2: "That tests the amounts and then tries to add up the regions, which are words.",
        3: "That counts how many, not how much.",
      },
      hint: "When the column you are testing is also the column you want to add, the third argument is not needed.",
      hint2:
        "Leave the third argument off and SUMIF adds up the same range it tested.",
      explanation:
        "7,680. Drop the third argument when the test column and the money column are the same one.",
    },
    {
      id: "sumif-1",
      type: "gaps",
      prompt: "Fill the two ranges so this totals the Waikato orders.",
      template: '=SUMIF({0}, "Waikato", {1})',
      gaps: [
        {
          accept: ["C2:C9", "$C$2:$C$9"],
          tint: "search",
          placeholder: "check",
        },
        {
          accept: ["D2:D9", "$D$2:$D$9"],
          tint: "return",
          placeholder: "add up",
        },
      ],
      hint: "The first range is where the condition is tested. The last range is where the money is.",
      hint2:
        "Regions are column C. Amounts are column D. Both run from row 2 to row 9.",
      explanation:
        "2,620 from Waikato. Test one column, add another, and keep both the same height.",
    },
    {
      id: "sumif-3",
      type: "formula",
      prompt: "Write the formula for the total value of Nelson orders.",
      expected: 1420,
      mustUse: ["SUMIF"],
      canonical: '=SUMIF(C2:C9, "Nelson", D2:D9)',
      rejects: ["=1420", "=D8"],
      hint: "Same shape as the Otago total, with one word changed.",
      hint2:
        'Test C2:C9 for "Nelson" and add up D2:D9. There happens to be one matching order, but the formula does not need to know that.',
      explanation:
        "1,420. Pointing at the one cell would give the same number today and the wrong number the moment a second Nelson order arrives.",
    },
  ],
  takeaways: [
    "The column you test and the column you add can be different. That is what the third argument is for.",
    "Leave the third argument off when you are adding up the same column you tested.",
    "The two ranges must be the same height, or the rows stop lining up.",
  ],
};
