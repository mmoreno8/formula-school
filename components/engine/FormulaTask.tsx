"use client";

import { useEffect } from "react";
import type { Sheet } from "@/lib/schema";
import { checkFormula, formatValue } from "@/lib/evaluator";
import { Button } from "@/components/ui/Button";
import { Feedback } from "@/components/engine/Feedback";
import { FormulaBar } from "@/components/engine/FormulaBar";
import { Grid } from "@/components/engine/Grid";
import { useAttempts } from "@/components/engine/useAttempts";
import { useFormulaField } from "@/components/engine/useFormulaField";

export interface FormulaSpec {
  expected: string | number | boolean;
  mustUse: string[];
  canonical: string;
  hint: string;
  hint2: string;
  explanation: string;
}

interface Props {
  id: string;
  sheet: Sheet;
  prompt: string;
  spec: FormulaSpec;
  fallbackFn?: string;
  onSolved: () => void;
  gridCaption: string;
}

/** Shared by the Build step and the "enter the complete formula" exercise, so
 *  the two can never drift apart. */
export function FormulaTask({
  id,
  sheet,
  prompt,
  spec,
  fallbackFn,
  onSolved,
  gridCaption,
}: Props) {
  const field = useFormulaField("=");
  const attempts = useAttempts();

  useEffect(() => {
    if (attempts.stage === "correct") onSolved();
  }, [attempts.stage, onSolved]);

  function check() {
    const result = checkFormula(field.value, sheet, spec);
    if ("ok" in result) {
      attempts.showSyntax(result.message);
      return;
    }
    if (result.status === "correct") {
      attempts.registerCorrect();
    } else {
      attempts.registerWrong();
    }
  }

  // Persisted completion belongs to the progress badge, not the editor.
  // A learner returning to a completed step must still be able to practise it.
  const done = attempts.stage === "correct";

  return (
    <div>
      <p className="mb-4 max-w-[62ch] text-[15px] leading-relaxed">{prompt}</p>

      <div className="mb-4">
        <Grid
          sheet={sheet}
          caption={gridCaption}
          onPickCell={(_, ref) => field.insert(ref)}
          onPickColumn={(_, range) => field.insert(range)}
        />
      </div>

      <FormulaBar
        id={`${id}-bar`}
        label="Formula"
        value={field.value}
        caret={field.caret}
        sheet={sheet}
        inputRef={field.inputRef}
        onChange={(text, at) => {
          field.set(text, at);
          attempts.clearSyntax();
        }}
        onSubmit={check}
        fallbackFn={fallbackFn}
        disabled={done}
      />

      <div aria-live="polite">
        {attempts.syntax && (
          <Feedback tone="syntax" title="Not a formula yet">
            <p>{attempts.syntax} This does not count as an attempt.</p>
          </Feedback>
        )}

        {attempts.stage === "hint" && !attempts.syntax && (
          <Feedback tone="hint" title="Not yet">
            <p>{spec.hint}</p>
          </Feedback>
        )}

        {attempts.stage === "hint2" && !attempts.syntax && (
          <Feedback tone="hint" title="Still not right">
            <p>{spec.hint2}</p>
          </Feedback>
        )}

        {attempts.stage === "revealed" && (
          <Feedback tone="reveal" title="Here is the answer">
            <p className="font-mono text-[13.5px]">{spec.canonical}</p>
            <p className="mt-2">{spec.explanation}</p>
          </Feedback>
        )}

        {attempts.stage === "correct" && (
          <Feedback
            tone="correct"
            title={`Correct. ${formatValue(
              typeof spec.expected === "boolean"
                ? spec.expected
                : spec.expected,
            )}`}
          >
            <p>{spec.explanation}</p>
          </Feedback>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="primary" onClick={check} disabled={done}>
          Check answer
        </Button>
        <Button
          onClick={() => {
            field.reset();
            attempts.reset();
          }}
        >
          Reset
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
