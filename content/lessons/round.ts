import type { ExcelLesson, Sheet } from "@/lib/schema";
import { SIGNATURES } from "@/lib/signatures";

const sheet: Sheet = {
  cols: ["A", "B", "C", "D"],
  rows: 6,
  cells: {
    A1: "Item", B1: "Net price", C1: "Tax factor", D1: "Units",
    A2: "Monitor arm", B2: 63.633, C2: 1.2, D2: 4,
    A3: "Dock", B3: 184.275, C3: 1.2, D3: 3,
    A4: "Laptop", B4: 1288.74, C4: 1.2, D4: 2,
    A5: "Headset", B5: 92.496, C5: 1.2, D5: 7,
    A6: "Keyboard", B6: 117.555, C6: 1.2, D6: 5,
  },
};

export const roundLesson: ExcelLesson = {
  track: "excel",
  id: "round",
  name: "ROUND",
  blurb: "Control how many decimal places a result keeps",
  group: "basics",
  order: 12,
  signatures: [SIGNATURES.ROUND],
  sheet,
  understand: {
    problem:
      "A buyer needs tax-inclusive prices that stop at cents. The source prices carry extra decimals, so ROUND turns each calculation into a usable currency value.",
  },
  worked: "=ROUND(B3*C3, 2)",
  build: {
    target: "Multiply the net price in B2 by the tax factor in C2, then round the result to two decimal places.",
    expected: 76.36,
    mustUse: ["ROUND"],
    canonical: "=ROUND(B2*C2, 2)",
    hint: "Do the multiplication inside ROUND, then tell it how many decimal places to keep.",
    hint2: "The number argument is B2*C2. The num_digits argument is 2.",
    explanation: "The raw result is 76.3596. ROUND keeps two decimal places and returns 76.36.",
    rejects: ["=B2*C2", "=ROUND(B2*C2, 1)", "=76.36"],
  },
  exercises: [
    {
      id: "round-choice",
      type: "choice",
      prompt: "Which formula rounds the laptop price in B4 to the nearest whole dollar?",
      options: ["=ROUND(B4, 2)", "=ROUND(B4, 1)", "=ROUND(B4, 0)", "=ROUND(0, B4)"],
      correctIndex: 2,
      optionHints: {
        0: "Two keeps cents rather than producing a whole dollar.",
        1: "One keeps a single decimal place.",
        3: "The number to round belongs in the first argument.",
      },
      hint: "Whole numbers have no decimal places.",
      hint2: "Use B4 as the number and 0 as num_digits.",
      explanation: "ROUND with zero decimal places turns 1288.74 into 1289.",
    },
    {
      id: "round-gaps",
      type: "gaps",
      prompt: "Fill the gaps to round the tax-inclusive dock price to two decimal places.",
      template: "=ROUND({0}*{1}, {2})",
      gaps: [
        { accept: ["B3"], tint: "lookup", placeholder: "price" },
        { accept: ["C3"], tint: "lookup", placeholder: "tax" },
        { accept: ["2"], tint: "plain", placeholder: "places" },
      ],
      hint: "The calculation uses the price and tax factor from the same row.",
      hint2: "Use B3 multiplied by C3, and keep 2 decimal places.",
      explanation: "The calculation stays inside ROUND, and the final argument controls the displayed precision.",
    },
    {
      id: "round-formula",
      type: "formula",
      prompt: "Write a formula that rounds the headset price in B5 to one decimal place.",
      expected: 92.5,
      mustUse: ["ROUND"],
      canonical: "=ROUND(B5, 1)",
      rejects: ["=92.5", "=ROUND(B5, 0)", "=ROUND(B4, 1)"],
      hint: "ROUND needs the value first and the number of decimal places second.",
      hint2: "The value is B5 and you want 1 decimal place.",
      explanation: "ROUND changes 92.496 to 92.5 when you keep one decimal place.",
    },
  ],
  takeaways: [
    "The first argument is the number or calculation you want to round.",
    "Two decimal places suits currency, while zero produces whole numbers.",
    "Rounding the result is different from formatting how many decimals you can see.",
  ],
};
