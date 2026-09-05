"use client";

import Link from "next/link";
import { LESSONS, TOTAL_EXERCISES } from "@/content";
import { lessonProgress } from "@/lib/progress";
import { useProgress } from "@/lib/useProgress";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/Button";
import { FormulaCard } from "@/components/layout/FormulaCard";

export function Overview() {
  const progress = useProgress();

  const finished = LESSONS.filter((l) => lessonProgress(progress, l.id).finished);
  const exercisesDone = LESSONS.reduce((n, l) => {
    const state = lessonProgress(progress, l.id);
    return n + l.exercises.filter((e) => state.done.includes(e.id)).length;
  }, 0);

  const upNext = LESSONS.find(
    (l) => !lessonProgress(progress, l.id).finished,
  );
  const started = exercisesDone > 0;

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Home" }]}
        title="Overview"
        description={`${LESSONS.length} Excel lessons that turn up in real analyst work, taught one at a time. Your progress stays on this device.`}
      />

      <section className="rounded-xl border border-line bg-card p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          {upNext ? (
            <>
              <div>
                <p className="text-[11.5px] tracking-wider text-ink-3 uppercase">
                  {started ? "Up next" : "Start here"}
                </p>
                <p className="mt-1.5 font-mono text-xl font-medium tracking-tight">
                  {upNext.name}
                </p>
                <p className="mt-1 max-w-[52ch] text-[14.5px] text-ink-2">
                  {upNext.blurb}
                </p>
              </div>
              <Link href={`/formulas/${upNext.id}`}>
                <Button variant="primary">
                  {started ? "Carry on" : "Start the first lesson"}
                </Button>
              </Link>
            </>
          ) : (
            <>
              <div>
                <p className="text-[11.5px] tracking-wider text-ink-3 uppercase">
                  All {LESSONS.length} finished
                </p>
                <p className="mt-1.5 text-xl font-medium tracking-tight">
                  You have been through the whole course
                </p>
                <p className="mt-1 max-w-[52ch] text-[14.5px] text-ink-2">
                  The cheat sheet has every signature on one page when you need
                  a reminder, and any lesson can be redone from scratch.
                </p>
              </div>
              <Link href="/cheat-sheet">
                <Button variant="primary">Open the cheat sheet</Button>
              </Link>
            </>
          )}
        </div>

        <div className="mt-6 grid gap-5 border-t border-line pt-5 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-[12.5px] text-ink-2 tabular-nums">
              {finished.length} of {LESSONS.length} lessons finished
            </p>
            <ProgressBar
              value={finished.length}
              max={LESSONS.length}
              label="Lessons finished"
            />
          </div>
          <div>
            <p className="mb-2 text-[12.5px] text-ink-2 tabular-nums">
              {exercisesDone} of {TOTAL_EXERCISES} exercises done
            </p>
            <ProgressBar
              value={exercisesDone}
              max={TOTAL_EXERCISES}
              label="Exercises completed"
            />
          </div>
        </div>
      </section>

      <h2 className="mt-9 mb-3.5 text-[12px] font-medium tracking-wider text-ink-3 uppercase">
        All formulas
      </h2>
      <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
        {LESSONS.map((lesson) => (
          <FormulaCard
            key={lesson.id}
            lesson={lesson}
            progress={progress}
          />
        ))}
      </div>
    </>
  );
}
