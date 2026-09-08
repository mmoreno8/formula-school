"use client";

import { EXCEL_LESSONS, TRACK_TARGET } from "@/content";
import { useProgress } from "@/lib/useProgress";
import { lessonProgress } from "@/lib/progress";
import { LessonCard } from "@/components/layout/LessonCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProgressBar } from "@/components/ui/ProgressBar";

/**
 * The Excel catalogue. Excel only: no SQL lesson, no SQL progress and no SQL
 * language reaches this page. BRIEF.md section 7.
 *
 * The route stays /formulas so nothing bookmarked breaks, but everything the
 * learner reads says Excel.
 */
export function FormulasIndex() {
  const progress = useProgress();
  const finished = EXCEL_LESSONS.filter(
    (l) => lessonProgress(progress, l.id).finished,
  ).length;

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Home", href: "/" }, { label: "Excel" }]}
        title="Excel"
        description={`${EXCEL_LESSONS.length} Excel lessons, three exercises each. Start anywhere. Nothing is locked, and you keep what you finish.`}
      />

      <div className="mb-6 max-w-[320px]">
        <p className="mb-2 text-[12.5px] text-ink-2 tabular-nums">
          {finished} of {TRACK_TARGET.excel} Excel lessons finished
        </p>
        <ProgressBar
          value={finished}
          max={TRACK_TARGET.excel}
          label="Excel lessons finished"
        />
      </div>

      <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
        {EXCEL_LESSONS.map((lesson) => (
          <LessonCard key={lesson.id} lesson={lesson} progress={progress} />
        ))}
      </div>
    </>
  );
}
