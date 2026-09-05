import type { Lesson, Sheet } from "@/lib/schema";
import { SIGNATURES } from "@/lib/signatures";

const sheet: Sheet = {
  cols: ["A", "B", "C", "D"],
  rows: 7,
  cells: {
    A1: "Candidate", B1: "Test score", C1: "Portfolio", D1: "Risk",
    A2: "Amelia", B2: 86, C2: "Yes", D2: "Low",
    A3: "Hemi", B3: 78, C3: "Yes", D3: "Medium",
    A4: "Priya", B4: 55, C4: "No", D4: "High",
    A5: "Leo", B5: 91, C5: "No", D5: "Low",
    A6: "Sofia", B6: 82, C6: "Yes", D6: "Medium",
    A7: "Noah", B7: 69, C7: "Yes", D7: "High",
  },
};

export const andOr: Lesson = {
  id: "and-or",
  name: "AND and OR",
  blurb: "Test whether every condition or any condition is true",
  group: "logic",
  order: 13,
  signatures: [SIGNATURES.AND, SIGNATURES.OR],
  sheet,
  understand: {
    problem:
      "A hiring manager approves candidates only when they clear the test and submit a portfolio. Other reviews begin when either the risk is high or the score is low. AND handles every condition; OR handles any condition.",
  },
  build: {
    target: 'For Amelia in row 2, return "Approve" when the score is at least 80 and the portfolio says "Yes". Return "Hold" otherwise.',
    expected: "Approve",
    mustUse: ["IF", "AND"],
    canonical: '=IF(AND(B2>=80, C2="Yes"), "Approve", "Hold")',
    hint: "Put both conditions inside a function that becomes true only when both pass.",
    hint2: 'AND needs B2>=80 and C2="Yes". Use that result as the test inside IF.',
    explanation: "Amelia meets both conditions, so AND is true and IF returns Approve.",
    rejects: ['=IF(B2>=80, "Approve", "Hold")', '=IF(OR(B2>=80, C2="Yes"), "Approve", "Hold")', '="Approve"'],
  },
  exercises: [
    {
      id: "andor-choice",
      type: "choice",
      prompt: "Which formula approves Leo only if he has both a score of at least 80 and a portfolio?",
      options: [
        '=IF(OR(B5>=80,C5="Yes"),"Approve","Hold")',
        '=IF(B5>=80,"Approve","Hold")',
        '=IF(AND(B5>=80,C5="Yes"),"Approve","Hold")',
        '=AND("Approve","Hold")',
      ],
      correctIndex: 2,
      optionHints: {
        0: "OR approves when either condition passes, so Leo would pass without a portfolio.",
        1: "This ignores the portfolio condition.",
        3: "AND combines conditions, not the two result labels.",
      },
      hint: "The word both points to one of the two logic functions.",
      hint2: "Put B5>=80 and C5=\"Yes\" inside AND, then use that inside IF.",
      explanation: "Leo has the score but not the portfolio, so AND is false and the formula returns Hold.",
    },
    {
      id: "andor-gaps",
      type: "gaps",
      prompt: "Fill the gaps to flag Priya when her risk is high or her score is below 60.",
      template: '=IF(OR({0}="High", {1}<60), "Escalate", "Standard")',
      gaps: [
        { accept: ["D4"], tint: "test", placeholder: "risk" },
        { accept: ["B4"], tint: "test", placeholder: "score" },
      ],
      hint: "Both checks use values from Priya's row.",
      hint2: "Risk is in D4 and score is in B4.",
      explanation: "Both conditions happen to be true, but OR would flag the row even if only one passed.",
    },
    {
      id: "andor-formula",
      type: "formula",
      prompt: 'Write a formula that returns "Escalate" for Noah when his risk is high or his score is below 60, and "Standard" otherwise.',
      expected: "Escalate",
      mustUse: ["IF", "OR"],
      canonical: '=IF(OR(D7="High", B7<60), "Escalate", "Standard")',
      rejects: ['="Escalate"', '=IF(AND(D7="High",B7<60),"Escalate","Standard")', '=IF(B7<60,"Escalate","Standard")'],
      hint: "Only one of the two conditions has to be true.",
      hint2: 'Put D7="High" and B7<60 inside OR, then use OR as the IF test.',
      explanation: "Noah's high risk is enough for OR to return true, even though his score is not below 60.",
    },
  ],
  takeaways: [
    "AND returns true only when every condition passes.",
    "OR returns true when at least one condition passes.",
    "Nest AND or OR inside IF when you need a readable outcome rather than TRUE or FALSE.",
  ],
};
