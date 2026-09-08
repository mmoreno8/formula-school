"use client";

import Link from "next/link";
import {
  EXCEL_LESSONS,
  SQL_LESSONS,
  TRACK_TARGET,
  exerciseCount,
} from "@/content";
import type { Lesson } from "@/lib/schema";
import { lessonHref } from "@/lib/schema";
import { lessonProgress, type ProgressMap } from "@/lib/progress";
import { useProgress } from "@/lib/useProgress";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/Button";

function stats(lessons: Lesson[], progress: ProgressMap) {
  const finished = lessons.filter((l) => lessonProgress(progress, l.id).finished);
  const hasStarted = (l: Lesson) => {
    const state = lessonProgress(progress, l.id);
    return state.built || state.done.length > 0 || state.finished;
  };
  const started = lessons.some(hasStarted);
  const exercisesDone = lessons.reduce((n, l) => {
    const state = lessonProgress(progress, l.id);
    return n + l.exercises.filter((e) => state.done.includes(e.id)).length;
  }, 0);
  const upNext =
    lessons.find(
      (l) => hasStarted(l) && !lessonProgress(progress, l.id).finished,
    ) ?? lessons.find((l) => !lessonProgress(progress, l.id).finished);
  return { finished: finished.length, exercisesDone, upNext, started };
}

/**
 * One card per track, and nothing else. BRIEF.md section 7.
 *
 * This page used to print both full lesson catalogues underneath these cards,
 * which put twenty-six lessons from two different subjects on one scroll. The
 * catalogues live at /formulas and /sql, one track each, and this page is the
 * door to them rather than a copy of them.
 */
function TrackCard({
  title,
  href,
  listLabel,
  lessons,
  target,
  progress,
  description,
}: {
  title: string;
  href: string;
  listLabel: string;
  lessons: Lesson[];
  target: number;
  progress: ProgressMap;
  description: string;
}) {
  const { finished, exercisesDone, upNext, started } = stats(lessons, progress);
  const total = lessons.reduce((n, l) => n + l.exercises.length, 0);

  return (
    <section
      className="rounded-xl border border-line bg-card p-5 sm:p-6"
      aria-labelledby={`track-${title}`}
    >
      <h2
        id={`track-${title}`}
        className="text-[11.5px] tracking-wider text-ink-3 uppercase"
      >
        {title}
      </h2>
      <p className="mt-1.5 max-w-[52ch] text-[14.5px] leading-relaxed text-ink-2">
        {description}
      </p>

      <div className="mt-5 grid gap-5 border-t border-line pt-5 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-[12.5px] text-ink-2 tabular-nums">
            {finished} of {target} lessons finished
          </p>
          <ProgressBar
            value={finished}
            max={target}
            label={`${title} lessons finished`}
          />
        </div>
        <div>
          <p className="mb-2 text-[12.5px] text-ink-2 tabular-nums">
            {exercisesDone} of {total} exercises done
          </p>
          <ProgressBar
            value={exercisesDone}
            max={Math.max(total, 1)}
            label={`${title} exercises completed`}
          />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        {upNext ? (
          <Link href={lessonHref(upNext)}>
            <Button variant="primary">
              {started ? `Continue ${title}` : `Start ${title}`}
            </Button>
          </Link>
        ) : (
          <Link href={href}>
            <Button variant="primary">{`Back to ${title} lessons`}</Button>
          </Link>
        )}
        {upNext && (
          <span className="font-mono text-[13.5px] text-ink-3">
            {upNext.name}
          </span>
        )}
        <Link
          href={href}
          className="ml-auto rounded text-[13.5px] text-ink-3 hover:text-ink-2"
        >
          {listLabel}
        </Link>
      </div>
    </section>
  );
}

export function Overview() {
  const progress = useProgress();

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Home" }]}
        title="Overview"
        description="Two tracks, taught the same way. Pick the one you are working on and carry on where you stopped. Your progress stays on this device unless you choose to save it with Google."
      />

      <div className="flex flex-col gap-3.5">
        <TrackCard
          title="Excel"
          href="/formulas"
          listLabel={`All ${EXCEL_LESSONS.length} Excel lessons`}
          lessons={EXCEL_LESSONS}
          target={TRACK_TARGET.excel}
          progress={progress}
          description="The formulas that turn up in analyst work, one per lesson. You read the problem, build the formula in a guided formula bar, then practise it three times."
        />
        <TrackCard
          title="SQL"
          href="/sql"
          listLabel={`All ${SQL_LESSONS.length} SQL lessons`}
          lessons={SQL_LESSONS}
          target={TRACK_TARGET.sql}
          progress={progress}
          description="Reading and summarising data with SQLite SQL. Real queries against real tables, running in your browser with nothing to install."
        />
      </div>

      <p className="mt-8 max-w-[66ch] text-[13.5px] leading-relaxed text-ink-3">
        Lessons run in your browser, including the SQL. An account is optional
        and is used only when you choose to save progress with Google.
      </p>
    </>
  );
}

export { exerciseCount };
