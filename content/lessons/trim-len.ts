import type { ExcelLesson, Sheet } from "@/lib/schema";
import { SIGNATURES } from "@/lib/signatures";

const sheet: Sheet = {
  cols: ["A", "B", "C"],
  rows: 7,
  cells: {
    A1: "Customer ID", B1: "Imported name", C1: "Status",
    A2: "CUS-1042", B2: "  Kea   Ltd  ", C2: "Active",
    A3: "CUS-2075", B3: " North   Wind ", C3: "Active",
    A4: "CUS-3184", B4: "Rimu Co ", C4: "Paused",
    A5: "CUS-4221", B5: "  Halcyon", C5: "Active",
    A6: "CUS-5360", B6: "Pounamu  Group", C6: "Paused",
    A7: "CUS-6408", B7: " Brightsmith ", C7: "Active",
  },
};

export const trimLen: ExcelLesson = {
  track: "excel",
  id: "trim-len",
  name: "TRIM and LEN",
  blurb: "Clean stray spaces and measure text length",
  group: "text",
  order: 16,
  signatures: [SIGNATURES.TRIM, SIGNATURES.LEN],
  sheet,
  understand: {
    problem:
      "A customer export contains leading spaces, trailing spaces and doubled spaces between words. TRIM cleans those gaps. LEN counts the characters that remain, including intentional spaces inside the text.",
  },
  worked: "=LEN(B2)",
  build: {
    target: "Clean the imported customer name in B2.",
    expected: "Kea Ltd",
    mustUse: ["TRIM"],
    canonical: "=TRIM(B2)",
    hint: "Use the cleaning function on the imported text cell.",
    hint2: "TRIM needs one argument: B2.",
    explanation: "TRIM removes the outside spaces and reduces the middle gap to one space.",
    rejects: ['="Kea Ltd"', "=TRIM(B3)", "=B2"],
  },
  exercises: [
    {
      id: "trimlen-choice",
      type: "choice",
      prompt: "Which formula counts the characters in customer ID A2?",
      options: ["=COUNT(A2)", "=LEN(A2)", "=TRIM(A2)", "=COUNTA(A2)"],
      correctIndex: 1,
      optionHints: {
        0: "COUNT looks for numeric values rather than characters.",
        2: "TRIM cleans spaces but does not count characters.",
        3: "COUNTA counts non-blank cells, so one cell produces one rather than the text length.",
      },
      hint: "You need a function that measures text rather than cells.",
      hint2: "Apply LEN to A2.",
      explanation: "CUS-1042 contains eight characters, including the hyphen.",
    },
    {
      id: "trimlen-gaps",
      type: "gaps",
      prompt: "Fill the gap to count the characters after cleaning the imported name in B3.",
      template: "=LEN(TRIM({0}))",
      gaps: [{ accept: ["B3"], tint: "lookup", placeholder: "name" }],
      hint: "The imported name is in column B on row 3.",
      hint2: "Put B3 inside TRIM, which already sits inside LEN.",
      explanation: "TRIM produces North Wind, and LEN counts its ten characters including the single space.",
    },
    {
      id: "trimlen-formula",
      type: "formula",
      prompt: "Write a formula that returns the length of the cleaned customer name in B7.",
      expected: 11,
      mustUse: ["LEN", "TRIM"],
      canonical: "=LEN(TRIM(B7))",
      rejects: ["=11", "=LEN(B7)", "=LEN(TRIM(B6))"],
      hint: "Clean the name before measuring it.",
      hint2: "Nest TRIM(B7) inside LEN.",
      explanation: "TRIM removes the outside spaces, then LEN counts the eleven letters in Brightsmith.",
    },
  ],
  takeaways: [
    "TRIM removes leading and trailing spaces and reduces repeated middle spaces.",
    "LEN counts letters, numbers, punctuation and spaces.",
    "Nest TRIM inside LEN when imported spacing would distort the count.",
  ],
};
