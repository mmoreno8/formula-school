/**
 * The contract. BRIEF.md section 8.
 *
 * Every lesson file is typed against this. The validator in
 * scripts/validate-content.ts enforces the parts the type system cannot.
 */

/** A single cell reference, e.g. "A2". */
export type Ref = string;
/** A rectangular range, e.g. "A2:A9". */
export type RangeRef = string;

/** What a cell can hold. `undefined`/missing means the cell is blank. */
export type CellInput = string | number | boolean;

export interface Sheet {
  /** Column letters in display order, e.g. ["A","B","C","D"]. */
  cols: string[];
  /** Number of rows, 1-indexed and inclusive. */
  rows: number;
  /** Which row holds the column headings. Defaults to 1. */
  headerRow?: number;
  cells: Record<Ref, CellInput>;
}

export type Tint = "lookup" | "search" | "return" | "test" | "plain";

export interface ArgSpec {
  /** Excel's own argument name, shown in the hint line: "lookup_array". */
  name: string;
  /** The plain-words version, shown as a chip: "where to look". */
  label: string;
  tint: Tint;
  optional?: boolean;
}

export interface Signature {
  fn: string;
  args: ArgSpec[];
}

interface ExerciseBase {
  id: string;
  prompt: string;
  /** First wrong attempt. Points at the reason. Never contains the answer. */
  hint: string;
  /** Second wrong attempt. Names the argument or range that is misunderstood. */
  hint2: string;
  /** Shown once solved, or once revealed. */
  explanation: string;
  /** Falls back to the lesson sheet when omitted. */
  sheet?: Sheet;
}

export interface ChoiceExercise extends ExerciseBase {
  type: "choice";
  options: string[];
  correctIndex: number;
  /** A tailored nudge for a specific wrong option. */
  optionHints?: Record<number, string>;
}

export interface GapsExercise extends ExerciseBase {
  type: "gaps";
  /** "=XLOOKUP(F1, {0}, {1})" — {n} marks gap n. */
  template: string;
  gaps: { accept: string[]; tint: Tint; placeholder?: string }[];
}

export interface RangeExercise extends ExerciseBase {
  type: "range";
  correctRange: RangeRef;
  /** Range the learner might pick -> why it is wrong. */
  nearMisses?: Record<RangeRef, string>;
}

export interface FormulaExercise extends ExerciseBase {
  type: "formula";
  /** What the evaluator must return for the answer to count. */
  expected: string | number | boolean;
  /** Function names the answer has to contain, e.g. ["XLOOKUP"]. */
  mustUse: string[];
  /** The model answer. Shown on reveal, and checked by the validator. */
  canonical: string;
  /**
   * Formulas that must NOT be accepted. The validator fails the build if any
   * of these pass. BRIEF.md section 8: proving the right answer works does
   * not prove the wrong ones fail.
   */
  rejects?: string[];
}

export type Exercise =
  | ChoiceExercise
  | GapsExercise
  | RangeExercise
  | FormulaExercise;

export interface BuildStep {
  target: string;
  expected: string | number | boolean;
  mustUse: string[];
  canonical: string;
  hint: string;
  hint2: string;
  explanation: string;
  rejects?: string[];
}

export interface Lesson {
  id: string;
  name: string;
  /** One line for the grid card. */
  blurb: string;
  group: "basics" | "logic" | "conditional" | "lookups" | "text";
  /** Drives sidebar and grid order. */
  order: number;
  /** Usually one. Lesson 3 carries COUNT and COUNTA. */
  signatures: Signature[];
  sheet: Sheet;
  understand: { problem: string };
  build: BuildStep;
  /** Exactly three. Enforced by the validator. */
  exercises: Exercise[];
  /** Exactly three. Enforced by the validator. */
  takeaways: string[];
}
