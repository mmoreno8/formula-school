"use client";

/**
 * The lesson steps as one horizontal row, for focus mode.
 *
 * The rail carries this navigation normally. Hiding the rail without putting
 * the steps somewhere would leave a learner in Practise with no way back to
 * Understand, so focus mode swaps the column for this strip rather than
 * dropping the navigation. CSS decides which one is showing; both are always
 * rendered, so nothing depends on JavaScript to stay reachable.
 */
interface Props {
  steps: readonly string[];
  step: number;
  onStep: (i: number) => void;
  isDone: (i: number) => boolean;
  /** "3 of 8", so the position in the track survives with the rail hidden. */
  position: string;
  done: number;
  total: number;
}

export function StepStrip({
  steps,
  step,
  onStep,
  isDone,
  position,
  done,
  total,
}: Props) {
  return (
    <div
      data-chrome="steps-compact"
      className="mb-5 flex-wrap items-center gap-x-2 gap-y-2 rounded-xl border border-line bg-card px-3 py-2"
    >
      <nav aria-label="Lesson steps" className="flex flex-wrap items-center gap-0.5">
        {steps.map((label, i) => {
          const isNow = i === step;
          return (
            <button
              key={label}
              type="button"
              onClick={() => onStep(i)}
              aria-current={isNow ? "step" : undefined}
              className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors hover:bg-line-2 ${
                isNow ? "font-medium text-ink" : "text-ink-3"
              }`}
            >
              <span
                aria-hidden="true"
                className={`h-2.5 w-2.5 shrink-0 rounded-full border-2 ${
                  isDone(i)
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
      <p className="ml-auto pr-1 text-[12.5px] text-ink-3 tabular-nums">
        {done} of {total} done · Lesson {position}
      </p>
    </div>
  );
}
