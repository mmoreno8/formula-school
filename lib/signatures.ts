import type { Signature } from "@/lib/schema";

/**
 * Argument names and plain-words labels for every function in the curriculum.
 *
 * One place, so the hint line, the chips in the Understand step and the cheat
 * sheet can never drift apart, and so the hint line still works when a learner
 * nests a function the lesson never mentioned.
 */
export const SIGNATURES: Record<string, Signature> = {
  SUM: {
    fn: "SUM",
    args: [{ name: "number1", label: "what to add up", tint: "search" }],
  },
  AVERAGE: {
    fn: "AVERAGE",
    args: [{ name: "number1", label: "what to average", tint: "search" }],
  },
  MIN: {
    fn: "MIN",
    args: [{ name: "number1", label: "where to find the smallest number", tint: "search" }],
  },
  MAX: {
    fn: "MAX",
    args: [{ name: "number1", label: "where to find the largest number", tint: "search" }],
  },
  ROUND: {
    fn: "ROUND",
    args: [
      { name: "number", label: "what to round", tint: "lookup" },
      { name: "num_digits", label: "decimal places to keep", tint: "plain" },
    ],
  },
  COUNT: {
    fn: "COUNT",
    args: [{ name: "value1", label: "where to count numbers", tint: "search" }],
  },
  COUNTA: {
    fn: "COUNTA",
    args: [{ name: "value1", label: "where to count anything", tint: "search" }],
  },
  IF: {
    fn: "IF",
    args: [
      { name: "logical_test", label: "what to check", tint: "test" },
      { name: "value_if_true", label: "if it is true", tint: "return" },
      { name: "value_if_false", label: "if it is false", tint: "plain", optional: true },
    ],
  },
  AND: {
    fn: "AND",
    args: [
      { name: "logical1", label: "first condition", tint: "test" },
      { name: "logical2", label: "next condition", tint: "test", optional: true },
    ],
  },
  OR: {
    fn: "OR",
    args: [
      { name: "logical1", label: "first condition", tint: "test" },
      { name: "logical2", label: "next condition", tint: "test", optional: true },
    ],
  },
  IFERROR: {
    fn: "IFERROR",
    args: [
      { name: "value", label: "formula to try", tint: "test" },
      { name: "value_if_error", label: "what to show if it fails", tint: "return" },
    ],
  },
  LEFT: {
    fn: "LEFT",
    args: [
      { name: "text", label: "text to cut", tint: "lookup" },
      { name: "num_chars", label: "characters from the left", tint: "plain", optional: true },
    ],
  },
  RIGHT: {
    fn: "RIGHT",
    args: [
      { name: "text", label: "text to cut", tint: "lookup" },
      { name: "num_chars", label: "characters from the right", tint: "plain", optional: true },
    ],
  },
  MID: {
    fn: "MID",
    args: [
      { name: "text", label: "text to cut", tint: "lookup" },
      { name: "start_num", label: "where to start", tint: "plain" },
      { name: "num_chars", label: "characters to take", tint: "plain" },
    ],
  },
  LEN: {
    fn: "LEN",
    args: [{ name: "text", label: "text to measure", tint: "lookup" }],
  },
  TRIM: {
    fn: "TRIM",
    args: [{ name: "text", label: "text to clean", tint: "lookup" }],
  },
  CONCAT: {
    fn: "CONCAT",
    args: [
      { name: "text1", label: "first text", tint: "lookup" },
      { name: "text2", label: "next text", tint: "return", optional: true },
    ],
  },
  COUNTIF: {
    fn: "COUNTIF",
    args: [
      { name: "range", label: "where to look", tint: "search" },
      { name: "criteria", label: "what counts", tint: "test" },
    ],
  },
  SUMIF: {
    fn: "SUMIF",
    args: [
      { name: "range", label: "where to check", tint: "search" },
      { name: "criteria", label: "what counts", tint: "test" },
      { name: "sum_range", label: "what to add up", tint: "return", optional: true },
    ],
  },
  COUNTIFS: {
    fn: "COUNTIFS",
    args: [
      { name: "criteria_range1", label: "first column to check", tint: "search" },
      { name: "criteria1", label: "first condition", tint: "test" },
      { name: "criteria_range2", label: "next column", tint: "search", optional: true },
      { name: "criteria2", label: "next condition", tint: "test", optional: true },
    ],
  },
  SUMIFS: {
    fn: "SUMIFS",
    args: [
      { name: "sum_range", label: "what to add up", tint: "return" },
      { name: "criteria_range1", label: "first column to check", tint: "search" },
      { name: "criteria1", label: "first condition", tint: "test" },
      { name: "criteria_range2", label: "next column", tint: "search", optional: true },
      { name: "criteria2", label: "next condition", tint: "test", optional: true },
    ],
  },
  VLOOKUP: {
    fn: "VLOOKUP",
    args: [
      { name: "lookup_value", label: "who to find", tint: "lookup" },
      { name: "table_array", label: "the whole table", tint: "search" },
      { name: "col_index_num", label: "which column, counting from the left", tint: "return" },
      { name: "range_lookup", label: "FALSE for an exact match", tint: "plain", optional: true },
    ],
  },
  XLOOKUP: {
    fn: "XLOOKUP",
    args: [
      { name: "lookup_value", label: "who to find", tint: "lookup" },
      { name: "lookup_array", label: "where to look", tint: "search" },
      { name: "return_array", label: "what to bring back", tint: "return" },
      { name: "if_not_found", label: "what to show instead", tint: "plain", optional: true },
    ],
  },
  INDEX: {
    fn: "INDEX",
    args: [
      { name: "array", label: "where the answer lives", tint: "return" },
      { name: "row_num", label: "which row in that range", tint: "lookup" },
      { name: "column_num", label: "which column in that range", tint: "plain", optional: true },
    ],
  },
  MATCH: {
    fn: "MATCH",
    args: [
      { name: "lookup_value", label: "what to find", tint: "lookup" },
      { name: "lookup_array", label: "where to look", tint: "search" },
      { name: "match_type", label: "0 for an exact match", tint: "plain", optional: true },
    ],
  },
};

export function signatureFor(fn: string): Signature | undefined {
  return SIGNATURES[fn.toUpperCase()];
}

/**
 * Screen-reader wording for the shape of a function, used when the caret is
 * not inside any argument. Optional arguments are named as optional, because
 * "XLOOKUP takes 4 arguments" reads as four things you have to supply and only
 * three of them are.
 */
export function describeArgumentCount(signature: Signature): string {
  const required = signature.args.filter((a) => !a.optional).length;
  const optional = signature.args.length - required;
  const plural = (n: number) => (n === 1 ? "argument" : "arguments");

  if (optional === 0) return `${required} ${plural(required)}`;
  if (required === 0) return `${optional} optional ${plural(optional)}`;
  return `${required} required ${plural(required)} and ${optional} optional ${plural(optional)}`;
}
