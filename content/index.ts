import type { Lesson } from "@/lib/schema";
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

/** Every lesson, sorted by the order they appear in the sidebar and grid. */
export const LESSONS: Lesson[] = [
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

export function getLesson(id: string): Lesson | undefined {
  return LESSONS.find((l) => l.id === id);
}

export function lessonIndex(id: string): number {
  return LESSONS.findIndex((l) => l.id === id);
}

export function nextLesson(id: string): Lesson | undefined {
  const i = lessonIndex(id);
  return i === -1 ? undefined : LESSONS[i + 1];
}

export const TOTAL_EXERCISES = LESSONS.reduce(
  (n, l) => n + l.exercises.length,
  0,
);
