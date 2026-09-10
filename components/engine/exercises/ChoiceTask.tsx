"use client";

import { useEffect, useState } from "react";
import type { ChoiceExercise, Sheet } from "@/lib/schema";
import { Feedback } from "@/components/engine/Feedback";
import { Grid } from "@/components/engine/Grid";
import { useAttempts } from "@/components/engine/useAttempts";
import { Button } from "@/components/ui/Button";

interface Props {
  exercise: ChoiceExercise;
  /** The sheet the prompt and the answers refer to. */
  sheet: Sheet;
  gridCaption: string;
  onSolved: () => void;
}

export function ChoiceTask({ exercise, sheet, gridCaption, onSolved }: Props) {
  const attempts = useAttempts();
  const [picked, setPicked] = useState<number | null>(null);
  const [wrongPicks, setWrongPicks] = useState<number[]>([]);

  useEffect(() => {
    if (attempts.stage === "correct") onSolved();
  }, [attempts.stage, onSolved]);

  const done = attempts.stage === "correct";

  function choose(i: number) {
    if (done) return;
    setPicked(i);
    if (i === exercise.correctIndex) {
      attempts.registerCorrect();
    } else {
      setWrongPicks((w) => (w.includes(i) ? w : [...w, i]));
      attempts.registerWrong();
    }
  }

  const tailored =
    picked !== null && picked !== exercise.correctIndex
      ? exercise.optionHints?.[picked]
      : undefined;

  return (
    <div>
      <fieldset>
        <legend className="mb-3 max-w-[62ch] text-[15px] leading-relaxed">
          {exercise.prompt}
        </legend>

        {/* Every option is a formula about specific cells, so the sheet stays
            visible while the learner compares them. */}
        <div className="mb-4">
          <Grid sheet={sheet} caption={gridCaption} />
        </div>
        <div className="flex flex-col gap-2">
          {exercise.options.map((option, i) => {
            const isCorrect = i === exercise.correctIndex;
            const revealed = attempts.stage === "revealed" || done;
            const wrong = wrongPicks.includes(i);

            let tone = "border-line bg-card hover:bg-line-2";
            if (revealed && isCorrect) tone = "border-green bg-mint text-green-2";
            else if (wrong) tone = "border-reveal-fg bg-reveal-bg text-reveal-fg";

            return (
              <button
                key={option}
                type="button"
                onClick={() => choose(i)}
                disabled={done}
                aria-pressed={picked === i}
                className={`w-full rounded-lg border px-3.5 py-2.5 text-left font-mono text-[13px] transition-colors disabled:cursor-default ${tone}`}
              >
                {option}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div aria-live="polite">
        {attempts.stage === "hint" && (
          <Feedback tone="hint" title="Not that one">
            <p>{tailored ?? exercise.hint}</p>
          </Feedback>
        )}
        {attempts.stage === "hint2" && (
          <Feedback tone="hint" title="Still not it">
            <p>{tailored ?? exercise.hint2}</p>
          </Feedback>
        )}
        {attempts.stage === "revealed" && (
          <Feedback tone="reveal" title="Here is the answer">
            <p className="font-mono text-[13.5px]">
              {exercise.options[exercise.correctIndex]}
            </p>
            <p className="mt-2">{exercise.explanation}</p>
          </Feedback>
        )}
        {attempts.stage === "correct" && (
          <Feedback tone="correct" title="Correct">
            <p>{exercise.explanation}</p>
          </Feedback>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {!done && attempts.stage !== "revealed" && (
          <Button variant="quiet" onClick={attempts.revealNow}>
            Show me the answer
          </Button>
        )}
        {/* Resets this exercise and nothing else. Stored progress is left
            alone, so having another go never costs you the exercises you have
            already earned. Redo this lesson is the one that clears them. */}
        {attempts.stage !== "idle" && (
          <Button
            onClick={() => {
              setPicked(null);
              setWrongPicks([]);
              attempts.reset();
            }}
          >
            Try again
          </Button>
        )}
      </div>
    </div>
  );
}
