/**
 * The lesson registry, for both tracks.
 *
 * This file holds lesson DATA only. It never imports an evaluation engine, so
 * importing it from the sidebar or the overview does not drag sql.js or the
 * Excel evaluator into a page that does not need them. The SQL engine is
 * reached only through lib/sql/client.ts, which is imported only under
 * app/sql/*. BRIEF.md section 7, route-level asset isolation.
 */

import type { ExcelLesson, Lesson, SqlLesson, Track } from "@/lib/schema";
import { sum } from "./lessons/sum";
import { average } from "./lessons/average";
import { count } from "./lessons/count";
import { ifLesson } from "./lessons/if";
import { countif } from "./lessons/countif";
import { sumif } from "./lessons/sumif";
import { countifs } from "./lessons/countifs";
import { sumifs } from "./lessons/sumifs";
import { vlookup } from "./lessons/vlookup";
import { xlookup } from "./lessons/xlookup";
import { minmax } from "./lessons/minmax";
import { roundLesson } from "./lessons/round";
import { andOr } from "./lessons/and-or";
import { iferror } from "./lessons/iferror";
import { textParts } from "./lessons/text-parts";
import { trimLen } from "./lessons/trim-len";
import { concat } from "./lessons/concat";
import { indexMatch } from "./lessons/index-match";
import { selectWhere } from "./sql/select-where";
import { orderByLimit } from "./sql/order-by-limit";
import { distinct } from "./sql/distinct";
import { aggregates } from "./sql/aggregates";
import { groupBy } from "./sql/group-by";
import { innerJoin } from "./sql/inner-join";
import { caseWhen } from "./sql/case-when";
import { subqueries } from "./sql/subqueries";

/** The Excel track, in curriculum order. BRIEF.md section 3.1. */
export const EXCEL_LESSONS: ExcelLesson[] = [
  sum,
  average,
  count,
  ifLesson,
  countif,
  sumif,
  countifs,
  sumifs,
  vlookup,
  xlookup,
  minmax,
  roundLesson,
  andOr,
  iferror,
  textParts,
  trimLen,
  concat,
  indexMatch,
].sort((a, b) => a.order - b.order);

/**
 * The SQL track, in curriculum order. BRIEF.md section 3.2.
 *
 * GROUP BY was the reference implementation and stays at order 5, where the
 * other seven were built around it.
 *
 * The eight topics differ from the table in BRIEF.md 3.2, which paired SELECT
 * and WHERE as separate lessons and ended at HAVING and JOIN. Manuel revised
 * the set on 6 September 2026: SELECT and WHERE merged, HAVING deferred, and
 * CASE WHEN and subqueries promoted out of the deferred list. The count is
 * still eight and GROUP BY still sits fifth, so nothing else moved.
 */
export const SQL_LESSONS: SqlLesson[] = [
  selectWhere,
  orderByLimit,
  distinct,
  aggregates,
  groupBy,
  innerJoin,
  caseWhen,
  subqueries,
].sort((a, b) => a.order - b.order);

/** How many lessons each track will have when its MVP is complete. */
export const TRACK_TARGET: Record<Track, number> = { excel: 18, sql: 8 };

export const TRACK_LABEL: Record<Track, string> = { excel: "Excel", sql: "SQL" };

export function lessonsFor(track: Track): Lesson[] {
  return track === "excel" ? EXCEL_LESSONS : SQL_LESSONS;
}

export const ALL_LESSONS: Lesson[] = [...EXCEL_LESSONS, ...SQL_LESSONS];

export function getLesson(track: Track, id: string): Lesson | undefined {
  return lessonsFor(track).find((l) => l.id === id);
}

export function getExcelLesson(id: string): ExcelLesson | undefined {
  return EXCEL_LESSONS.find((l) => l.id === id);
}

export function getSqlLesson(id: string): SqlLesson | undefined {
  return SQL_LESSONS.find((l) => l.id === id);
}

/** The next lesson within the same track. Tracks never run into each other. */
export function nextLesson(track: Track, id: string): Lesson | undefined {
  const list = lessonsFor(track);
  const i = list.findIndex((l) => l.id === id);
  return i === -1 ? undefined : list[i + 1];
}

export function exerciseCount(track: Track): number {
  return lessonsFor(track).reduce((n, l) => n + l.exercises.length, 0);
}

export const TOTAL_EXERCISES = exerciseCount("excel") + exerciseCount("sql");

/**
 * Reserved because /sql/cheat-sheet is a static segment sitting beside the
 * dynamic /sql/[id]. The static route wins, so a lesson with this id would be
 * unreachable. Validator rule 10 refuses it rather than leaving the trap.
 */
export const RESERVED_LESSON_IDS = ["cheat-sheet"];
