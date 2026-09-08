"use client";

import { SQL_LESSONS, TRACK_TARGET } from "@/content";
import { useProgress } from "@/lib/useProgress";
import { lessonProgress } from "@/lib/progress";
import { LessonCard } from "@/components/layout/LessonCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProgressBar } from "@/components/ui/ProgressBar";

/**
 * The SQL catalogue. SQL only, the mirror of the Excel one: no Excel lesson,
 * no Excel progress and no Excel language reaches this page. BRIEF.md 7.
 */
export function SqlIndex() {
  const progress = useProgress();
  const built = SQL_LESSONS.length;
  const target = TRACK_TARGET.sql;
  const finished = SQL_LESSONS.filter(
    (l) => lessonProgress(progress, l.id).finished,
  ).length;

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Home", href: "/" }, { label: "SQL" }]}
        title="SQL"
        description={`${target} SQL lessons that turn up in real analyst work, three exercises each. Everything runs in your browser, so nothing is sent anywhere and there is nothing to install.`}
      />

      <div className="mb-6 max-w-[320px]">
        <p className="mb-2 text-[12.5px] text-ink-2 tabular-nums">
          {finished} of {target} SQL lessons finished
        </p>
        <ProgressBar
          value={finished}
          max={target}
          label="SQL lessons finished"
        />
      </div>

      {built < target && (
        <p className="mb-5 rounded-xl border border-line bg-raise px-4 py-3 text-[13.5px] leading-relaxed text-ink-2">
          {built} of {target} lessons are built so far. The rest are on the way,
          and the ones here are finished rather than previews.
        </p>
      )}

      <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
        {SQL_LESSONS.map((lesson) => (
          <LessonCard key={lesson.id} lesson={lesson} progress={progress} />
        ))}
      </div>
    </>
  );
}
