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
import { groupBy } from "./sql/group-by";

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
 * GROUP BY is the reference implementation and sits at order 5, where it will
 * stay when the other seven arrive. The track is deliberately incomplete: the
 * validator reports the shortfall rather than pretending eight exist.
 */
export const SQL_LESSONS: SqlLesson[] = [groupBy].sort((a, b) => a.order - b.order);

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
