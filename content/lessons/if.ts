import type { Lesson, Sheet } from "@/lib/schema";
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
    D9: 670,
  },
};

export const ifLesson: Lesson = {
  id: "if",
  name: "IF",
  blurb: "Do one thing when true, another when false",
  group: "logic",
  order: 4,
  signatures: [SIGNATURES.IF],
  sheet,
  understand: {
    problem:
      "Finance wants anything over a thousand dollars flagged for a second look. You could read down the column and type the flags yourself. IF writes the rule down once, and the rule keeps applying after you have gone home.",
  },
  build: {
    target:
      'Look at order 1042 in row 2. Return "Review" when its amount is over 1000, and "Fine" when it is not.',
    expected: "Review",
    mustUse: ["IF"],
    canonical: '=IF(D2 > 1000, "Review", "Fine")',
    hint: "IF takes three things: something to check, what to return when it is true, and what to return when it is false.",
    hint2:
      'The check is D2 > 1000. Both answers are text, so both need quotes: "Review" and "Fine".',
    explanation:
      "1250 is over 1000, so the test is true and you get the first of the two answers. Swap the two answers around and the rule reverses.",
    rejects: ['="Review"'],
  },
  exercises: [
    {
      id: "if-1",
      type: "gaps",
      prompt:
        "Fill the gaps so this checks order 1045 in row 5 against the same thousand dollar rule.",
      template: '=IF({0} > {1}, "Review", "Fine")',
      gaps: [
        { accept: ["D5", "$D$5"], tint: "test", placeholder: "cell" },
        { accept: ["1000"], tint: "test", placeholder: "limit" },
      ],
      hint: "The first gap is the cell you are checking. The second is the number you are checking it against.",
      hint2:
        "Order 1045 sits in row 5, and its amount is in column D. The limit is a thousand.",
      explanation:
        'That order is 560, so the test is false and the formula returns "Fine". Same rule, different row.',
    },
    {
      id: "if-2",
      type: "choice",
      prompt:
        'Order 1045 is 560. Which formula correctly returns "Fine" for it, for the right reason?',
      options: [
        '=IF(D5 < 1000, "Review", "Fine")',
        '=IF("D5" > 1000, "Review", "Fine")',
        '=IF(D5 > 1000, "Review", "Fine")',
        '=IF(D5 > 1000, "Fine", "Review")',
      ],
      correctIndex: 2,
      optionHints: {
        0: "This flips the rule. It would flag the small orders and let the big ones through.",
        1: "Quotes around D5 turn the reference into the literal text D5, so the comparison stops looking at the sheet.",
        3: 'This returns "Fine" here, but only because the answers are the wrong way round. Try it on an order over 1000 and it flags the wrong ones.',
      },
      hint: 'Three of these return "Fine" for this row. Only one does it because the rule is right.',
      hint2:
        "Read each one as a sentence: if the amount is over a thousand, then flag it, otherwise leave it. Which one actually says that?",
      explanation:
        "Getting the right answer on one row is not the same as having the right rule. Check the rule against a row where the answer should flip.",
    },
    {
      id: "if-3",
      type: "formula",
      prompt:
        "Order 1046 in row 6 qualifies for a discount: 10 percent off anything over 1500, and nothing otherwise. Write the formula that works out the discount for that row.",
      expected: 178,
      mustUse: ["IF"],
      canonical: "=IF(D6 > 1500, D6 * 0.1, 0)",
      rejects: ["=178", "=D6 * 0.1"],
      hint: "The two answers do not have to be text. They can be numbers, or sums of their own.",
      hint2:
        "The check is D6 > 1500. When it is true you want ten percent of D6, and when it is false you want 0.",
      explanation:
        "1780 is over the line, so you get 178. Working it out without the IF gives the same number today and the wrong number on every row under 1500.",
    },
  ],
  takeaways: [
    "IF reads as a sentence: check this, do that when true, do the other thing when false.",
    "Text answers need quotes. Numbers and references do not.",
    "The answers can be calculations, not only labels, so one formula can price a whole column.",
  ],
};
