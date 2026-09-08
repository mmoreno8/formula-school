"use client";

import Link from "next/link";
import type { Lesson } from "@/lib/schema";
import { lessonHref } from "@/lib/schema";
import type { ProgressMap } from "@/lib/progress";
import { lessonProgress } from "@/lib/progress";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { IconCheck } from "@/components/ui/icons";

interface Props {
  lesson: Lesson;
  progress: ProgressMap;
}

/**
 * The card claims two things and only two: exercises completed, and whether
 * the lesson is finished. No percentage, no accuracy, no score. BRIEF.md 6.
 *
 * Track-aware since draft 5: the href comes from the lesson's own track, so
 * one card serves both grids. It no longer carries a track badge: every grid
 * holds one track only, so a badge could only ever repeat the page heading.
 */
export function LessonCard({ lesson, progress }: Props) {
  const state = lessonProgress(progress, lesson.id);
  const total = lesson.exercises.length;
  const done = lesson.exercises.filter((e) => state.done.includes(e.id)).length;
  const finished = state.finished;

  const status = finished
    ? "Finished"
    : done > 0 || state.built
      ? "In progress"
      : "Not started";

  return (
    <Link
      href={lessonHref(lesson)}
      className="flex flex-col gap-3 rounded-xl border border-line bg-card p-4 transition-colors hover:border-mint-2"
    >
      <div className="flex items-center gap-2">
        <span className="font-mono text-[15px] font-medium tracking-tight">
          {lesson.name}
        </span>
        {finished && <IconCheck className="ml-auto h-4 w-4 shrink-0 text-green" />}
      </div>
      <p className="text-[13.5px] leading-snug text-ink-3">{lesson.blurb}</p>
      <ProgressBar
        value={done}
        max={total}
        label={`${lesson.name} exercises completed`}
      />
      <div className="flex justify-between text-[12.5px] text-ink-3 tabular-nums">
        <span>{status}</span>
        <span>
          {done} / {total}
        </span>
      </div>
    </Link>
  );
}
