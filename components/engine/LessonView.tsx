"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import type { Exercise, ExcelLesson } from "@/lib/schema";
import { EXCEL_LESSONS, nextLesson } from "@/content";
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
import { FormulaTask } from "@/components/engine/FormulaTask";
import { Grid } from "@/components/engine/Grid";
import { SignatureChips } from "@/components/engine/SignatureChips";
import { ChoiceTask } from "@/components/engine/exercises/ChoiceTask";
import { GapsTask } from "@/components/engine/exercises/GapsTask";
import { RangeTask } from "@/components/engine/exercises/RangeTask";

const STEPS = ["Understand", "Build", "Practise", "Done"] as const;

export function LessonView({ lesson }: { lesson: ExcelLesson }) {
  const [step, setStep] = useState(0);
  const progress = useProgress();
  const state = lessonProgress(progress, lesson.id);

  const doneCount = lesson.exercises.filter((e) =>
    state.done.includes(e.id),
  ).length;
  const allDone = doneCount === lesson.exercises.length;

  const onBuilt = useCallback(() => markBuilt(lesson.id), [lesson.id]);

  const next = useMemo(() => nextLesson("excel", lesson.id), [lesson.id]);
  const exerciseIds = useMemo(
    () => lesson.exercises.map((e) => e.id),
    [lesson.exercises],
  );
  /** No-op until every exercise is done. The guard itself lives in progress.ts. */
  const finish = useCallback(
    () => markFinished(lesson.id, exerciseIds),
    [lesson.id, exerciseIds],
  );

  function renderExercise(exercise: Exercise, index: number) {
    const solved = state.done.includes(exercise.id);
    const onSolved = () => markExerciseDone(lesson.id, exercise.id);
    const sheet = exercise.sheet ?? lesson.sheet;

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

        {exercise.type === "choice" && (
          <ChoiceTask exercise={exercise} solved={solved} onSolved={onSolved} />
        )}
        {exercise.type === "gaps" && (
          <GapsTask exercise={exercise} solved={solved} onSolved={onSolved} />
        )}
        {exercise.type === "range" && (
          <RangeTask
            exercise={exercise}
            sheet={sheet}
            solved={solved}
            onSolved={onSolved}
          />
        )}
        {exercise.type === "formula" && (
          <FormulaTask
            id={exercise.id}
            sheet={sheet}
            prompt={exercise.prompt}
            spec={exercise}
            fallbackFn={exercise.mustUse[0]}
            solved={solved}
            onSolved={onSolved}
            gridCaption={`Sheet for ${lesson.name}, exercise ${index + 1}`}
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
          position={`${lesson.order} of ${EXCEL_LESSONS.length}`}
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
            {lesson.signatures.map((sig) => (
              <div key={sig.fn} className="mb-3">
                <SignatureChips signature={sig} />
              </div>
            ))}
            <div className="mt-5">
              <p className="mb-2 text-[11.5px] tracking-wider text-ink-3 uppercase">
                The sheet you are working with
              </p>
              <Grid sheet={lesson.sheet} caption={`Sheet for ${lesson.name}`} />
            </div>
            <div className="mt-5">
              <Button variant="primary" onClick={() => setStep(1)}>
                Start building
              </Button>
            </div>
          </section>
        )}

        {step === 1 && (
          <section className="rounded-xl border border-line bg-card p-5 sm:p-6">
            <div className="mb-3 flex items-center justify-between gap-3">
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
            <FormulaTask
              id={`${lesson.id}-build`}
              sheet={lesson.sheet}
              prompt={lesson.build.target}
              spec={lesson.build}
              fallbackFn={lesson.signatures[0]?.fn}
              solved={state.built}
              onSolved={onBuilt}
              gridCaption={`Sheet for ${lesson.name}`}
            />
            <div className="mt-6 border-t border-line pt-4">
              <Button variant="primary" onClick={() => setStep(2)}>
                Go to practise
              </Button>
            </div>
          </section>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            {lesson.exercises.map(renderExercise)}
            <div>
              <Button variant="primary" onClick={() => setStep(3)}>
                Finish lesson
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
                  <span aria-hidden="true" className="text-lg font-semibold text-ink-3">
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
                  <li key={t} className="flex gap-3 text-[14.5px] leading-relaxed">
                    <IconCheck className="mt-1 h-4 w-4 shrink-0 text-green" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-7 flex flex-wrap gap-2">
              {next ? (
                <Link href={`/formulas/${next.id}`}>
                  <Button variant="primary" onClick={finish}>
                    Next: {next.name}
                  </Button>
                </Link>
              ) : (
                <Link href="/formulas">
                  <Button variant="primary" onClick={finish}>
                    Back to all formulas
                  </Button>
                </Link>
              )}
              {allDone ? (
                <Button
                  onClick={() => {
                    finish();
                    setStep(0);
                  }}
                >
                  Mark as finished
                </Button>
              ) : (
                <Button onClick={() => setStep(2)}>
                  Finish the exercises
                </Button>
              )}
              <Button
                variant="quiet"
                onClick={() => {
                  resetLesson(lesson.id);
                  setStep(0);
                }}
              >
                <IconRedo className="h-4 w-4" />
                Redo this lesson
              </Button>
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
          Lesson {lesson.order} of {EXCEL_LESSONS.length}
        </p>
      </aside>
    </div>
  );
}
