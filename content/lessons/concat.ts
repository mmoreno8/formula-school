import type { ExcelLesson, Sheet } from "@/lib/schema";
import { SIGNATURES } from "@/lib/signatures";

const sheet: Sheet = {
  cols: ["A", "B", "C", "D"],
  rows: 7,
  cells: {
    A1: "Last name", B1: "First name", C1: "Team", D1: "Office",
    A2: "Singh", B2: "Priya", C2: "Finance", D2: "Wellington",
    A3: "Walker", B3: "Amelia", C3: "Sales", D3: "Auckland",
    A4: "Ropata", B4: "Hemi", C4: "Support", D4: "Hamilton",
    A5: "Chen", B5: "Leo", C5: "Operations", D5: "Christchurch",
    A6: "Martin", B6: "Sofia", C6: "Sales", D6: "Dunedin",
    A7: "Taylor", B7: "Noah", C7: "Support", D7: "Nelson",
  },
};

export const concat: ExcelLesson = {
  track: "excel",
  id: "concat",
  name: "CONCAT",
  blurb: "Join text and cell values into one result",
  group: "text",
  order: 17,
  signatures: [SIGNATURES.CONCAT],
  sheet,
  understand: {
    problem:
      "People data arrives with first and last names in separate columns. CONCAT joins those values with any punctuation or spaces the final label needs.",
  },
  build: {
    target: "Create Priya Singh's full name from B2 and A2, with one space between them.",
    expected: "Priya Singh",
    mustUse: ["CONCAT"],
    canonical: '=CONCAT(B2, " ", A2)',
    hint: "Join the first name, a quoted space, and the last name in that order.",
    hint2: 'CONCAT needs B2, then " ", then A2.',
    explanation: "CONCAT joins the two cell values and the space into Priya Singh.",
    rejects: ['="Priya Singh"', "=CONCAT(B2,A2)", '=CONCAT(A2," ",B2)'],
  },
  exercises: [
    {
      id: "concat-choice",
      type: "choice",
      prompt: "Which formula creates the label Amelia Walker — Sales for row 3?",
      options: [
        '=CONCAT(A3,B3,C3)',
        '=CONCAT(B3," ",A3," — ",C3)',
        '=CONCAT(B3,A3," — ",C3)',
        '=CONCAT(C3," — ",B3," ",A3)',
      ],
      correctIndex: 1,
      optionHints: {
        0: "This has no separators and starts with the last name.",
        2: "The first and last names run together without a space.",
        3: "This starts with the team rather than the person's name.",
      },
      hint: "The spaces and dash must be included as quoted text.",
      hint2: 'Join B3, " ", A3, " — " and C3 in that order.',
      explanation: "CONCAT preserves the supplied order and includes the quoted separators.",
    },
    {
      id: "concat-gaps",
      type: "gaps",
      prompt: "Fill the gaps to create the label Hemi Ropata, Hamilton for row 4.",
      template: '=CONCAT({0}, " ", {1}, ", ", {2})',
      gaps: [
        { accept: ["B4"], tint: "lookup", placeholder: "first" },
        { accept: ["A4"], tint: "lookup", placeholder: "last" },
        { accept: ["D4"], tint: "return", placeholder: "office" },
      ],
      hint: "Read the required label from left to right and match each part to its column.",
      hint2: "First name is B4, last name is A4 and office is D4.",
      explanation: "The fixed separators stay in the formula while the three cell values can change by row.",
    },
    {
      id: "concat-formula",
      type: "formula",
      prompt: "Write a formula that creates the email NTaylor@example.co.nz from Noah's row. Use the first letter of B7, then A7, then the domain.",
      expected: "NTaylor@example.co.nz",
      mustUse: ["CONCAT", "LEFT"],
      canonical: '=CONCAT(LEFT(B7,1), A7, "@example.co.nz")',
      rejects: ['="NTaylor@example.co.nz"', '=CONCAT(B7,A7,"@example.co.nz")', '=CONCAT(LEFT(A7,1),B7,"@example.co.nz")'],
      hint: "Use LEFT to take one character from the first name, then join the remaining parts.",
      hint2: 'Join LEFT(B7,1), A7 and "@example.co.nz".',
      explanation: "LEFT supplies N, and CONCAT joins it to Taylor and the domain.",
    },
  ],
  takeaways: [
    "CONCAT joins arguments in the order you provide them.",
    "Spaces and punctuation must be supplied as quoted text.",
    "Other functions can create one of the pieces before CONCAT joins them.",
  ],
};
