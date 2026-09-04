"use client";

import { activeArgument } from "@/lib/formulaHint";
import { signatureFor } from "@/lib/signatures";

interface Props {
  /** The whole field value, including the leading "=". */
  value: string;
  caret: number;
  /** Shown before anything is typed, so the shape is visible from the start. */
  fallbackFn?: string;
}

/**
 * Excel's argument tooltip, kept permanently visible. The argument the caret
 * is inside is underlined; the rest sit back. This is the mechanic the whole
 * product is built around. BRIEF.md section 5.2.
 */
export function ArgHint({ value, caret, fallbackFn }: Props) {
  const source = value.startsWith("=") ? value.slice(1) : value;
  const active = activeArgument(source, Math.max(0, caret - 1));

  const fnName = active?.fn ?? fallbackFn;
  const signature = fnName ? signatureFor(fnName) : undefined;

  if (!signature) {
    return (
      <p className="mt-2 min-h-[19px] font-mono text-[12.5px] text-ink-3">
        {fnName && !signature ? `${fnName} is not a function this site knows.` : ""}
      </p>
    );
  }

  const activeIndex = active ? active.index : -1;

  return (
    <p className="mt-2 min-h-[19px] overflow-x-auto font-mono text-[12.5px] whitespace-nowrap text-ink-3">
      <span className="sr-only">
        {activeIndex >= 0 && signature.args[activeIndex]
          ? `Argument ${activeIndex + 1}, ${signature.args[activeIndex].name}: ${signature.args[activeIndex].label}.`
          : `${signature.fn} takes ${signature.args.length} arguments.`}
      </span>
      <span aria-hidden="true">
        {signature.fn}(
        {signature.args.map((arg, i) => (
          <span key={arg.name}>
            {i > 0 && ", "}
            <span
              className={
                i === activeIndex
                  ? "border-b-2 border-green pb-px text-green-2"
                  : "opacity-55"
              }
            >
              {arg.optional ? `[${arg.name}]` : arg.name}
            </span>
          </span>
        ))}
        )
      </span>
    </p>
  );
}
