"use client";

import { useEffect, useMemo, useState } from "react";
import type { GapsExercise, Sheet } from "@/lib/schema";
import { Feedback } from "@/components/engine/Feedback";
import { Grid } from "@/components/engine/Grid";
import { useAttempts } from "@/components/engine/useAttempts";
import { Button } from "@/components/ui/Button";

interface Props {
  exercise: GapsExercise;
  /** The sheet the prompt and the answers refer to. */
  sheet: Sheet;
  gridCaption: string;
  solved: boolean;
  onSolved: () => void;
}

/** Whitespace, case and dollar signs never decide whether an answer is right. */
function normalise(text: string): string {
  return text.trim().replace(/\s+/g, "").replace(/\$/g, "").toUpperCase();
}

/** Splits "=SUM({0})" into the literal pieces around each {n}. */
function splitTemplate(template: string, count: number): string[] {
  let rest = template;
  const parts: string[] = [];
  for (let i = 0; i < count; i++) {
    const marker = `{${i}}`;
    const at = rest.indexOf(marker);
    if (at === -1) {
      parts.push(rest);
      rest = "";
      continue;
    }
    parts.push(rest.slice(0, at));
    rest = rest.slice(at + marker.length);
  }
  parts.push(rest);
  return parts;
}

export function GapsTask({ exercise, sheet, gridCaption, solved, onSolved }: Props) {
  const attempts = useAttempts();
  const [answers, setAnswers] = useState<string[]>(() =>
    exercise.gaps.map(() => ""),
  );
  const [blankWarning, setBlankWarning] = useState(false);

  useEffect(() => {
    if (attempts.stage === "correct") onSolved();
  }, [attempts.stage, onSolved]);

  const parts = useMemo(
    () => splitTemplate(exercise.template, exercise.gaps.length),
    [exercise.template, exercise.gaps.length],
  );

  const done = attempts.stage === "correct" || solved;

  function check() {
    if (answers.some((a) => a.trim() === "")) {
      setBlankWarning(true);
      return;
    }
    setBlankWarning(false);
    const allRight = exercise.gaps.every((gap, i) =>
      gap.accept.some((a) => normalise(a) === normalise(answers[i])),
    );
    if (allRight) attempts.registerCorrect();
    else attempts.registerWrong();
  }

  const filled = parts.reduce(
    (acc, part, i) =>
      acc + part + (i < exercise.gaps.length ? exercise.gaps[i].accept[0] : ""),
    "",
  );

  return (
    <div>
      <p className="mb-4 max-w-[62ch] text-[15px] leading-relaxed">
        {exercise.prompt}
      </p>

      {/* The task names cells, so the cells have to be on screen. Without this
          a prompt about D5 asks the learner to take 560 on trust. */}
      <div className="mb-4">
        <Grid sheet={sheet} caption={gridCaption} />
      </div>

      <div className="flex flex-wrap items-center gap-y-2 font-mono text-sm leading-loose">
        {parts.map((part, i) => (
          <span key={`part-${i}`} className="contents">
            <span className="whitespace-pre">{part}</span>
            {i < exercise.gaps.length && (
              <span>
                <label htmlFor={`${exercise.id}-gap-${i}`} className="sr-only">
                  Gap {i + 1} of {exercise.gaps.length}
                </label>
                <input
                  id={`${exercise.id}-gap-${i}`}
                  type="text"
                  value={answers[i]}
                  disabled={done}
                  spellCheck={false}
                  autoComplete="off"
                  autoCapitalize="off"
                  placeholder={exercise.gaps[i].placeholder ?? "?"}
                  data-tint={exercise.gaps[i].tint}
                  onChange={(e) => {
                    const next = [...answers];
                    next[i] = e.target.value;
                    setAnswers(next);
                    setBlankWarning(false);
                    attempts.clearSyntax();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      check();
                    }
                  }}
                  className="mx-0.5 w-[104px] rounded-md border border-line px-2 py-1 text-center font-mono text-[13px] outline-none focus:border-green disabled:opacity-70"
                />
              </span>
            )}
          </span>
        ))}
      </div>

      {blankWarning && (
        <p className="mt-2 text-[13.5px] text-reveal-fg">
          Fill every gap before checking.
        </p>
      )}

      <div aria-live="polite">
        {attempts.stage === "hint" && (
          <Feedback tone="hint" title="Not yet">
            <p>{exercise.hint}</p>
          </Feedback>
        )}
        {attempts.stage === "hint2" && (
          <Feedback tone="hint" title="Still not right">
            <p>{exercise.hint2}</p>
          </Feedback>
        )}
        {attempts.stage === "revealed" && (
          <Feedback tone="reveal" title="Here is the answer">
            <p className="font-mono text-[13.5px]">{filled}</p>
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
        <Button variant="primary" onClick={check} disabled={done}>
          Check
        </Button>
        {!done && attempts.stage !== "revealed" && (
          <Button variant="quiet" onClick={attempts.revealNow}>
            Show me the answer
          </Button>
        )}
      </div>
    </div>
  );
}
