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
import { LessonCard } from "@/components/layout/LessonCard";

function stats(lessons: Lesson[], progress: ProgressMap) {
  const finished = lessons.filter((l) => lessonProgress(progress, l.id).finished);
  const exercisesDone = lessons.reduce((n, l) => {
    const state = lessonProgress(progress, l.id);
    return n + l.exercises.filter((e) => state.done.includes(e.id)).length;
  }, 0);
  const upNext = lessons.find((l) => !lessonProgress(progress, l.id).finished);
  return { finished: finished.length, exercisesDone, upNext };
}

/** One panel per track, so neither is the afterthought. BRIEF.md section 7. */
function TrackPanel({
  title,
  href,
  lessons,
  target,
  progress,
  blurb,
}: {
  title: string;
  href: string;
  lessons: Lesson[];
  target: number;
  progress: ProgressMap;
  blurb: string;
}) {
  const { finished, exercisesDone, upNext } = stats(lessons, progress);
  const total = lessons.reduce((n, l) => n + l.exercises.length, 0);
  const started = exercisesDone > 0;

  return (
    <section className="rounded-xl border border-line bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11.5px] tracking-wider text-ink-3 uppercase">
            {title}
          </p>
          {upNext ? (
            <>
              <p className="mt-1.5 font-mono text-xl font-medium tracking-tight">
                {upNext.name}
              </p>
              <p className="mt-1 max-w-[52ch] text-[14.5px] text-ink-2">
                {upNext.blurb}
              </p>
            </>
          ) : (
            <>
              <p className="mt-1.5 text-xl font-medium tracking-tight">
                You have been through all of it
              </p>
              <p className="mt-1 max-w-[52ch] text-[14.5px] text-ink-2">{blurb}</p>
            </>
          )}
        </div>
        {upNext ? (
          <Link href={lessonHref(upNext)}>
            <Button variant="primary">
              {started ? "Carry on" : "Start the first lesson"}
            </Button>
          </Link>
        ) : (
          <Link href={href}>
            <Button>Back to the list</Button>
          </Link>
        )}
      </div>

      <div className="mt-5 grid gap-5 border-t border-line pt-5 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-[12.5px] text-ink-2 tabular-nums">
            {finished} of {target} lessons finished
          </p>
          <ProgressBar value={finished} max={target} label={`${title} lessons finished`} />
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
    </section>
  );
}

export function Overview() {
  const progress = useProgress();
  const sqlBuilt = SQL_LESSONS.length;

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Home" }]}
        title="Overview"
        description={`Two tracks: ${TRACK_TARGET.excel} Excel lessons and ${TRACK_TARGET.sql} SQL lessons, all of it the kind of work that turns up in a real analyst job. Your progress stays on this device.`}
      />

      <div className="flex flex-col gap-3.5">
        <TrackPanel
          title="Excel"
          href="/formulas"
          lessons={EXCEL_LESSONS}
          target={TRACK_TARGET.excel}
          progress={progress}
          blurb="The cheat sheet has every signature on one page when you need a reminder, and any lesson can be redone from scratch."
        />
        <TrackPanel
          title="SQL"
          href="/sql"
          lessons={SQL_LESSONS}
          target={TRACK_TARGET.sql}
          progress={progress}
          blurb="More SQL lessons are on the way. The ones here are finished rather than previews."
        />
      </div>

      <h2 className="mt-9 mb-3.5 text-[12px] font-medium tracking-wider text-ink-3 uppercase">
        All Excel lessons
      </h2>
      <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
        {EXCEL_LESSONS.map((lesson) => (
          <LessonCard key={lesson.id} lesson={lesson} progress={progress} />
        ))}
      </div>

      <h2 className="mt-9 mb-3.5 text-[12px] font-medium tracking-wider text-ink-3 uppercase">
        SQL lessons
      </h2>
      {sqlBuilt < TRACK_TARGET.sql && (
        <p className="mb-3.5 text-[13.5px] text-ink-3">
          {sqlBuilt} of {TRACK_TARGET.sql} built so far.
        </p>
      )}
      <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
        {SQL_LESSONS.map((lesson) => (
          <LessonCard key={lesson.id} lesson={lesson} progress={progress} />
        ))}
      </div>

      <p className="mt-8 max-w-[66ch] text-[13.5px] leading-relaxed text-ink-3">
        Everything here runs in your browser, including the SQL. Nothing is sent
        anywhere, and there is no account.
      </p>
    </>
  );
}

export { exerciseCount };
