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

/**
 * One application, two tracks, not a forked app. BRIEF.md section 8.
 *
 * Not one engine: Excel and SQL have genuinely separate evaluation engines,
 * the hand-written evaluator in lib/evaluator and sql.js behind lib/sql. What
 * they share is the shell around them.
 */
export type Track = "excel" | "sql";

export interface ExcelLesson {
  track: "excel";
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
  /**
   * One finished, correct formula shown in Understand, so nobody is asked to
   * write a formula before they have seen one.
   *
   * Deliberately a different question from `build.canonical`, and the
   * validator refuses a lesson where the two are the same: an example that
   * gives away the Build answer turns the Build step into copying.
   */
  worked: string;
  build: BuildStep;
  /** Exactly three. Enforced by the validator. */
  exercises: Exercise[];
  /** Exactly three. Enforced by the validator. */
  takeaways: string[];
}

/* ------------------------------- SQL track -------------------------------- */

/** What a lesson table cell may hold. Nothing else is allowed. */
export type SqlValue = string | number | null;

export interface Table {
  name: string;
  cols: string[];
  rows: SqlValue[][];
}

export interface TableSet {
  /** Seeded into a fresh in-memory SQLite database for every execution. */
  tables: Table[];
}

export interface ClauseSpec {
  /** "WHERE", shown in the guidance line under the editor. */
  kw: string;
  /** The plain-words version, shown as a chip: "which rows to keep". */
  label: string;
  tint: Tint;
  optional?: boolean;
}

interface SqlExerciseBase {
  id: string;
  prompt: string;
  hint: string;
  hint2: string;
  explanation: string;
  /** The model answer, and the source of truth. No expected value is stored. */
  canonical: string;
  /** Clauses the answer must use, detected as tokens. Never as substrings. */
  mustUse?: string[];
  /**
   * Required on every exercise and never defaulted. BRIEF.md section 8: a
   * field you can forget is a field that will be forgotten, and this is the
   * one where forgetting fails correct people. Validator rule 12.
   */
  orderMatters: boolean;
  /** Queries that must NOT be accepted. Validator rule 11. */
  rejects?: string[];
}

/** Ramp step 1: the shape is given, the learner supplies the idea. */
export interface SqlGapsExercise extends SqlExerciseBase {
  type: "sql-gaps";
  /** "SELECT region, {0}(amount) FROM orders {1} region" */
  template: string;
  gaps: { accept: string[]; tint: Tint; placeholder?: string }[];
}

/** Ramp step 2: starter SQL and the clause guidance line stay. */
export interface SqlGuidedExercise extends SqlExerciseBase {
  type: "sql-guided";
  starter: string;
  showClauseHint: true;
}

/** Ramp step 3: a sentence from a colleague and an empty editor. */
export interface SqlFreeExercise extends SqlExerciseBase {
  type: "sql-free";
}

export type SqlExercise =
  | SqlGapsExercise
  | SqlGuidedExercise
  | SqlFreeExercise;

export interface SqlBuildStep {
  target: string;
  /** SQL already in the editor when the Build step opens. */
  starter: string;
  canonical: string;
  mustUse?: string[];
  orderMatters: boolean;
  hint: string;
  hint2: string;
  explanation: string;
  rejects?: string[];
}

export interface SqlLesson {
  track: "sql";
  id: string;
  name: string;
  blurb: string;
  group: "reading" | "filtering" | "grouping" | "joining";
  order: number;
  db: TableSet;
  clauses: ClauseSpec[];
  /** The plain-language query shape shown in Understand. */
  shape: string;
  understand: { problem: string };
  build: SqlBuildStep;
  /** Exactly three, in ramp order. BRIEF.md 5.13. */
  exercises: [SqlGapsExercise, SqlGuidedExercise, SqlFreeExercise];
  /** Exactly three. Enforced by the validator. */
  takeaways: string[];
}

export type Lesson = ExcelLesson | SqlLesson;

export function isExcel(lesson: Lesson): lesson is ExcelLesson {
  return lesson.track === "excel";
}

export function isSql(lesson: Lesson): lesson is SqlLesson {
  return lesson.track === "sql";
}

/** Where a track's lessons live. Excel does not move. BRIEF.md section 7. */
export const TRACK_BASE: Record<Track, string> = {
  excel: "/formulas",
  sql: "/sql",
};

export function lessonHref(lesson: Lesson): string {
  return `${TRACK_BASE[lesson.track]}/${lesson.id}`;
}
