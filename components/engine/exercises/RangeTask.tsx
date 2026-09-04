"use client";

import { useEffect, useState } from "react";
import type { RangeExercise, Sheet } from "@/lib/schema";
import {
  formatRange,
  parseRange,
  rangeBetween,
  type CellAddr,
  type RangeAddr,
} from "@/lib/refs";
import { Feedback } from "@/components/engine/Feedback";
import { Grid } from "@/components/engine/Grid";
import { useAttempts } from "@/components/engine/useAttempts";
import { Button } from "@/components/ui/Button";

interface Props {
  exercise: RangeExercise;
  sheet: Sheet;
  solved: boolean;
  onSolved: () => void;
}

export function RangeTask({ exercise, sheet, solved, onSolved }: Props) {
  const attempts = useAttempts();
  const [anchor, setAnchor] = useState<CellAddr | null>(null);
  const [selection, setSelection] = useState<RangeAddr | null>(null);
  const [needsTwo, setNeedsTwo] = useState(false);

  useEffect(() => {
    if (attempts.stage === "correct") onSolved();
  }, [attempts.stage, onSolved]);

  const done = attempts.stage === "correct" || solved;
  const target = parseRange(exercise.correctRange, sheet.rows);
  const selectionText = selection ? formatRange(selection) : null;

  function pick(addr: CellAddr) {
    if (done) return;
    setNeedsTwo(false);
    if (!anchor || selection) {
      setAnchor(addr);
      setSelection(null);
    } else {
      setSelection(rangeBetween(anchor, addr));
    }
  }

  function check() {
    if (!selectionText) {
      setNeedsTwo(true);
      return;
    }
    if (selectionText.toUpperCase() === exercise.correctRange.toUpperCase()) {
      attempts.registerCorrect();
    } else {
      attempts.registerWrong();
    }
  }

  const tailored = selectionText
    ? exercise.nearMisses?.[selectionText.toUpperCase()]
    : undefined;

  const highlight: RangeAddr | null =
    selection ??
    (anchor
      ? { c1: anchor.col, r1: anchor.row, c2: anchor.col, r2: anchor.row }
      : attempts.stage === "revealed"
        ? target
        : null);

  return (
    <div>
      <p className="mb-4 max-w-[62ch] text-[15px] leading-relaxed">
        {exercise.prompt}
      </p>

      <Grid
        sheet={sheet}
        caption={`Select a range on this sheet. ${exercise.prompt}`}
        highlight={highlight}
        onPickCell={(addr) => pick(addr)}
      />

      <p className="mt-3 min-h-[20px] font-mono text-[13px] text-ink-2" aria-live="polite">
        {selectionText ?? (anchor ? `${formatRange({ c1: anchor.col, r1: anchor.row, c2: anchor.col, r2: anchor.row }).split(":")[0]} …` : "")}
        <span className="sr-only">
          {selectionText ? `Selected ${selectionText}` : "Nothing selected yet"}
        </span>
      </p>

      {needsTwo && (
        <p className="mt-1 text-[13.5px] text-reveal-fg">
          Pick the first cell and then the last cell.
        </p>
      )}

      <div aria-live="polite">
        {attempts.stage === "hint" && (
          <Feedback tone="hint" title="Not that range">
            <p>{tailored ?? exercise.hint}</p>
          </Feedback>
        )}
        {attempts.stage === "hint2" && (
          <Feedback tone="hint" title="Still not right">
            <p>{tailored ?? exercise.hint2}</p>
          </Feedback>
        )}
        {attempts.stage === "revealed" && (
          <Feedback tone="reveal" title="Here is the answer">
            <p className="font-mono text-[13.5px]">{exercise.correctRange}</p>
            <p className="mt-2">{exercise.explanation}</p>
          </Feedback>
        )}
        {attempts.stage === "correct" && (
          <Feedback tone="correct" title={`Correct. ${exercise.correctRange}`}>
            <p>{exercise.explanation}</p>
          </Feedback>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="primary" onClick={check} disabled={done}>
          Check
        </Button>
        <Button
          onClick={() => {
            setAnchor(null);
            setSelection(null);
            setNeedsTwo(false);
          }}
          disabled={done}
        >
          Clear
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
