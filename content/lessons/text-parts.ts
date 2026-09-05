import type { ExcelLesson, Sheet } from "@/lib/schema";
import { SIGNATURES } from "@/lib/signatures";

const sheet: Sheet = {
  cols: ["A", "B", "C"],
  rows: 7,
  cells: {
    A1: "Case code", B1: "Owner", C1: "Team",
    A2: "NZ-AKL-1042", B2: "Amelia", C2: "Sales",
    A3: "AU-SYD-2075", B3: "Hemi", C3: "Support",
    A4: "NZ-WLG-3184", B4: "Priya", C4: "Finance",
    A5: "NZ-CHC-4221", B5: "Leo", C5: "Operations",
    A6: "AU-MEL-5360", B6: "Sofia", C6: "Sales",
    A7: "NZ-DUD-6408", B7: "Noah", C7: "Support",
  },
};

export const textParts: ExcelLesson = {
  track: "excel",
  id: "text-parts",
  name: "LEFT, RIGHT and MID",
  blurb: "Extract a useful part from a text code",
  group: "text",
  order: 15,
  signatures: [SIGNATURES.LEFT, SIGNATURES.RIGHT, SIGNATURES.MID],
  sheet,
  understand: {
    problem:
      "An operations report packs country, office and case number into one code. LEFT takes characters from the beginning, RIGHT takes them from the end, and MID takes a section from the middle.",
  },
  build: {
    target: "Extract the two-letter country code from A2.",
    expected: "NZ",
    mustUse: ["LEFT"],
    canonical: "=LEFT(A2, 2)",
    hint: "The country is at the beginning of the code.",
    hint2: "Take 2 characters from the left of A2.",
    explanation: "LEFT starts at the beginning of NZ-AKL-1042 and returns its first two characters.",
    rejects: ['="NZ"', "=RIGHT(A2,2)", "=LEFT(A2,3)"],
  },
  exercises: [
    {
      id: "textparts-choice",
      type: "choice",
      prompt: "Which formula extracts the four-digit case number from A3?",
      options: ["=LEFT(A3,4)", "=MID(A3,4,4)", "=RIGHT(A3,4)", "=RIGHT(A3,3)"],
      correctIndex: 2,
      optionHints: {
        0: "The case number sits at the end, not the beginning.",
        1: "Starting at character four lands in the office code.",
        3: "The case number contains four digits.",
      },
      hint: "The value you need is at the end of the code.",
      hint2: "Take 4 characters from the right of A3.",
      explanation: "RIGHT reads from the end and returns 2075.",
    },
    {
      id: "textparts-gaps",
      type: "gaps",
      prompt: "Fill the gaps to extract WLG from the middle of A4.",
      template: "=MID({0}, {1}, {2})",
      gaps: [
        { accept: ["A4"], tint: "lookup", placeholder: "code" },
        { accept: ["4"], tint: "plain", placeholder: "start" },
        { accept: ["3"], tint: "plain", placeholder: "length" },
      ],
      hint: "Count every character from the left, including the hyphen.",
      hint2: "W is character 4, and the office section is 3 characters long.",
      explanation: "MID begins at character 4 and takes WLG's three characters.",
    },
    {
      id: "textparts-formula",
      type: "formula",
      prompt: "Write a formula that extracts the office code CHC from A5.",
      expected: "CHC",
      mustUse: ["MID"],
      canonical: "=MID(A5, 4, 3)",
      rejects: ['="CHC"', "=LEFT(A5,3)", "=MID(A5,3,3)"],
      hint: "The office starts after the country and the first hyphen.",
      hint2: "Start at character 4 in A5 and take 3 characters.",
      explanation: "MID returns CHC without changing the original code.",
    },
  ],
  takeaways: [
    "LEFT counts characters from the beginning of text.",
    "RIGHT counts characters from the end of text.",
    "MID needs both a starting position and the number of characters to take.",
  ],
};
