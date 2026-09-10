"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import type { SqlExercise, SqlLesson, Tint } from "@/lib/schema";
import { SQL_LESSONS, TRACK_TARGET, nextLesson } from "@/content";
import {
  lessonProgress,
  markBuilt,
  markExerciseDone,
  markFinished,
  resetLesson,
} from "@/lib/progress";
import { useProgress } from "@/lib/useProgress";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StepStrip } from "@/components/layout/StepStrip";
import { IconCheck, IconRedo } from "@/components/ui/icons";
import { TablesPanel } from "@/components/sql/TablesPanel";
import { SqlWorkspace } from "@/components/sql/SqlWorkspace";
import { SqlGapsTask } from "@/components/sql/SqlGapsTask";

const STEPS = ["Understand", "Build", "Exercises", "Done"] as const;

const TINT: Record<Tint, string> = {
  lookup: "bg-lookup-bg text-lookup-fg",
  search: "bg-search-bg text-search-fg",
  return: "bg-return-bg text-return-fg",
  test: "bg-test-bg text-test-fg",
  plain: "bg-plain-bg text-plain-fg",
};

/**
 * The SQL lesson. Same four steps and same rail as Excel, with the SQL
 * workspace underneath. BRIEF.md 6.2 and 6.3.
 *
 * Understand and Done are single column and match the Excel track exactly.
 * Build and Exercises get the two-column surface, because results are tables.
 */
export function SqlLessonView({ lesson }: { lesson: SqlLesson }) {
  const [step, setStep] = useState(0);
  const [confirmReset, setConfirmReset] = useState(false);
  const progress = useProgress();
  const state = lessonProgress(progress, lesson.id);

  const doneCount = lesson.exercises.filter((e) =>
    state.done.includes(e.id),
  ).length;
  const allDone = doneCount === lesson.exercises.length;

  const onBuilt = useCallback(() => markBuilt(lesson.id), [lesson.id]);
  const next = useMemo(() => nextLesson("sql", lesson.id), [lesson.id]);
  const exerciseIds = useMemo(
    () => lesson.exercises.map((e) => e.id),
    [lesson.exercises],
  );
  const finish = useCallback(
    () => markFinished(lesson.id, exerciseIds),
    [lesson.id, exerciseIds],
  );

  function renderExercise(exercise: SqlExercise, index: number) {
    const solved = state.done.includes(exercise.id);
    const onSolved = () => markExerciseDone(lesson.id, exercise.id);

    return (
      <section
        key={exercise.id}
        className="rounded-xl border border-line bg-card p-5 sm:p-6"
        aria-labelledby={`${exercise.id}-label`}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <p
            id={`${exercise.id}-label`}
            className="text-[11.5px] tracking-wider text-ink-3 uppercase"
          >
            Exercise {index + 1} of {lesson.exercises.length}
          </p>
          {solved && (
            <span className="flex items-center gap-1.5 rounded-md bg-mint px-2 py-1 text-[11.5px] font-medium text-green-2">
              <IconCheck className="h-3.5 w-3.5" />
              Done
            </span>
          )}
        </div>

        {/* The workspace shows the prompt in its own "The problem" panel, so
            only the gaps exercise, which has no such panel, prints it here. */}
        {exercise.type === "sql-gaps" && (
          <p className="mb-4 max-w-[62ch] text-[14.5px] leading-relaxed">
            {exercise.prompt}
          </p>
        )}

        {exercise.type === "sql-gaps" ? (
          <SqlGapsTask
            exercise={exercise}
            db={lesson.db}
            onSolved={onSolved}
          />
        ) : (
          <SqlWorkspace
            db={lesson.db}
            spec={exercise}
            clauses={
              exercise.type === "sql-guided" ? lesson.clauses : undefined
            }
            starter={exercise.type === "sql-guided" ? exercise.starter : ""}
            prompt={exercise.prompt}
            onSolved={onSolved}
            editorId={`${exercise.id}-editor`}
            caption={`Result for ${exercise.id}`}
          />
        )}
      </section>
    );
  }

  return (
    <div
      data-chrome="lesson-grid"
      className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_260px]"
    >
      <div className="min-w-0">
        <StepStrip
          steps={STEPS}
          step={step}
          onStep={setStep}
          isDone={(i) =>
            (i === 1 && state.built) ||
            (i === 2 && allDone) ||
            (i === 3 && state.finished) ||
            i < step
          }
          position={`${lesson.order} of ${TRACK_TARGET.sql}`}
          done={doneCount}
          total={lesson.exercises.length}
        />
        {step === 0 && (
          <section className="rounded-xl border border-line bg-card p-5 sm:p-6">
            <p className="mb-2 text-[11.5px] tracking-wider text-ink-3 uppercase">
              Understand
            </p>
            <p className="mb-4 max-w-[62ch] text-[15px] leading-relaxed">
              {lesson.understand.problem}
            </p>

            <div className="rounded-[9px] border border-line bg-raise px-3.5 py-3">
              <pre className="overflow-x-auto font-mono text-[13px] leading-relaxed whitespace-pre">
                {lesson.shape}
              </pre>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {lesson.clauses.map((c) => (
                <span
                  key={c.kw}
                  className="inline-flex items-center gap-1.5 font-mono text-[12px]"
                >
                  <span className="font-semibold">{c.kw}</span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[11.5px] ${TINT[c.tint]}`}
                  >
                    {c.label}
                  </span>
                </span>
              ))}
            </div>

            <div className="mt-5">
              <p className="mb-2.5 text-[11.5px] tracking-wider text-ink-3 uppercase">
                The tables you are working with
              </p>
              <TablesPanel db={lesson.db} />
            </div>

            <div className="mt-5">
              <Button variant="primary" onClick={() => setStep(1)}>
                Try it yourself
              </Button>
            </div>
          </section>
        )}

        {step === 1 && (
          <section className="rounded-xl border border-line bg-card p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-[11.5px] tracking-wider text-ink-3 uppercase">
                Build
              </p>
              {state.built && (
                <span className="flex items-center gap-1.5 rounded-md bg-mint px-2 py-1 text-[11.5px] font-medium text-green-2">
                  <IconCheck className="h-3.5 w-3.5" />
                  Done
                </span>
              )}
            </div>

            <SqlWorkspace
              db={lesson.db}
              spec={lesson.build}
              clauses={lesson.clauses}
              starter={lesson.build.starter}
              prompt={lesson.build.target}
              onSolved={onBuilt}
              editorId={`${lesson.id}-build-editor`}
              caption={`Result for ${lesson.name}`}
            />

            <div className="mt-6 border-t border-line pt-4">
              <Button variant="primary" onClick={() => setStep(2)}>
                Continue to exercises
              </Button>
            </div>
          </section>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            {lesson.exercises.map(renderExercise)}
            <div>
              <Button variant="primary" onClick={() => setStep(3)}>
                Review lesson
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <section className="rounded-xl border border-line bg-card p-6 sm:p-8">
            <div className="mx-auto max-w-[46ch] text-center">
              <span
                className={`mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full ${
                  allDone ? "bg-mint" : "bg-line-2"
                }`}
              >
                {allDone ? (
                  <IconCheck className="h-6 w-6 text-green" />
                ) : (
                  <span
                    aria-hidden="true"
                    className="text-lg font-semibold text-ink-3"
                  >
                    {doneCount}/{lesson.exercises.length}
                  </span>
                )}
              </span>
              <h2 className="text-xl font-semibold">
                {allDone ? "Lesson complete" : "Not finished yet"}
              </h2>
              <p className="mt-2 text-[15px] text-ink-2">
                {doneCount} of {lesson.exercises.length} exercises done.{" "}
                {allDone
                  ? "That is the whole set."
                  : "A lesson counts as finished once all three are done. You can come back for the rest whenever."}
              </p>
            </div>

            <div className="mt-7">
              <p className="mb-3 text-[11.5px] tracking-wider text-ink-3 uppercase">
                What you can now do
              </p>
              <ul className="flex flex-col gap-2.5">
                {lesson.takeaways.map((t) => (
                  <li
                    key={t}
                    className="flex gap-3 text-[14.5px] leading-relaxed"
                  >
                    <IconCheck className="mt-1 h-4 w-4 shrink-0 text-green" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Same rule as the Excel track: with exercises outstanding the
                useful thing is to go back and do them, so that is the primary
                and moving on is the quieter option. */}
            <div className="mt-7 flex flex-wrap items-center gap-2">
              {allDone ? (
                <>
                  {next ? (
                    <Link href={`/sql/${next.id}`}>
                      <Button variant="primary" onClick={finish}>
                        Next SQL lesson
                      </Button>
                    </Link>
                  ) : (
                    <Link href="/sql">
                      <Button variant="primary" onClick={finish}>
                        Back to SQL lessons
                      </Button>
                    </Link>
                  )}
                  <Button
                    onClick={() => {
                      finish();
                      setStep(0);
                    }}
                  >
                    Mark as finished
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="primary" onClick={() => setStep(2)}>
                    Continue exercises
                  </Button>
                  {next ? (
                    <Link href={`/sql/${next.id}`}>
                      <Button>Next SQL lesson</Button>
                    </Link>
                  ) : (
                    <Link href="/sql">
                      <Button>Back to SQL lessons</Button>
                    </Link>
                  )}
                </>
              )}
              {/* Two steps, because this deletes the Build step and every
                  exercise already earned, and it used to do that on one click
                  from a learner who only wanted another go at one of them.
                  Try again inside an exercise is the non-destructive route. */}
              {confirmReset ? (
                <span className="flex flex-wrap items-center gap-2 text-[13.5px] text-ink-2">
                  Clear the Build step and all {lesson.exercises.length}{" "}
                  exercises?
                  <Button
                    onClick={() => {
                      resetLesson(lesson.id);
                      setConfirmReset(false);
                      setStep(0);
                    }}
                  >
                    Yes, clear it
                  </Button>
                  <Button variant="quiet" onClick={() => setConfirmReset(false)}>
                    Keep my progress
                  </Button>
                </span>
              ) : (
                <Button variant="quiet" onClick={() => setConfirmReset(true)}>
                  <IconRedo className="h-4 w-4" />
                  Redo this lesson
                </Button>
              )}
              {next && (
                <span className="ml-auto font-mono text-[13px] text-ink-3">
                  {next.name}
                </span>
              )}
            </div>
          </section>
        )}
      </div>

      <aside
        data-chrome="rail"
        className="rounded-xl border border-line bg-card p-5 lg:sticky lg:top-6"
      >
        <h2 className="mb-3 text-[12px] font-medium tracking-wider text-ink-3 uppercase">
          This lesson
        </h2>
        <nav aria-label="Lesson steps" className="flex flex-col gap-0.5">
          {STEPS.map((label, i) => {
            const isNow = i === step;
            const isDone =
              (i === 1 && state.built) ||
              (i === 2 && allDone) ||
              (i === 3 && state.finished) ||
              i < step;
            return (
              <button
                key={label}
                type="button"
                onClick={() => setStep(i)}
                aria-current={isNow ? "step" : undefined}
                className={`flex items-center gap-2.5 rounded-md px-1 py-1.5 text-left text-sm transition-colors hover:bg-line-2 ${
                  isNow ? "font-medium text-ink" : "text-ink-3"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`h-2.5 w-2.5 shrink-0 rounded-full border-2 ${
                    isDone
                      ? "border-green bg-green"
                      : isNow
                        ? "border-green"
                        : "border-track"
                  }`}
                />
                {label}
              </button>
            );
          })}
        </nav>

        <div className="mt-5">
          <ProgressBar
            value={doneCount}
            max={lesson.exercises.length}
            label="Exercises completed in this lesson"
          />
          <p className="mt-2 text-[12.5px] text-ink-3 tabular-nums">
            {doneCount} of {lesson.exercises.length} exercises done
          </p>
        </div>

        <p className="mt-5 border-t border-line pt-4 text-[12.5px] text-ink-3">
          Lesson {lesson.order} of {TRACK_TARGET.sql}
          {SQL_LESSONS.length < TRACK_TARGET.sql && (
            <span className="mt-1 block">
              {SQL_LESSONS.length} of {TRACK_TARGET.sql} built so far.
            </span>
          )}
        </p>
      </aside>
    </div>
  );
}
