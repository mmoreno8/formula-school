import type { Signature, Sheet } from "@/lib/schema";
import { cellsRead, evaluate, formatValue, readCell } from "@/lib/evaluator";
import { parseRef } from "@/lib/refs";

interface Props {
  formula: string;
  sheet: Sheet;
  signature?: Signature;
}

const TINT: Record<string, string> = {
  lookup: "bg-lookup-bg text-lookup-fg",
  search: "bg-search-bg text-search-fg",
  return: "bg-return-bg text-return-fg",
  test: "bg-test-bg text-test-fg",
  plain: "bg-plain-bg text-plain-fg",
};

/**
 * One complete, correct formula and what it gives back.
 *
 * Added because the lesson asked people to write a formula before they had
 * seen a finished one. The chips above name the parts in the abstract; this
 * shows the parts filled in and the answer that comes out, which is the thing
 * a learner is trying to picture.
 *
 * Everything here is derived from the lesson's own model answer and sheet, so
 * it cannot drift away from what the Build step actually accepts.
 */
export function WorkedExample({ formula, sheet, signature }: Props) {
  const result = evaluate(formula, sheet);

  // Naming the values only helps while there are one or two of them. A formula
  // over D2:D9 reads eight cells and listing them is noise.
  const cells = [...cellsRead(formula, sheet)].sort();
  const named =
    cells.length > 0 && cells.length <= 2
      ? cells.flatMap((ref) => {
          const addr = parseRef(ref);
          if (!addr) return [];
          const cell = readCell(sheet, addr.col, addr.row);
          // Written the way the grid writes it, so "1250" here and "1250"
          // two lines down are visibly the same number.
          return [{ ref, value: cell === null ? "blank" : String(cell) }];
        })
      : [];

  return (
    <div className="mt-4 rounded-[9px] border border-line bg-raise px-3.5 py-3">
      <p className="mb-2 text-[11.5px] tracking-wider text-ink-3 uppercase">
        A worked example
      </p>

      <pre className="overflow-x-auto font-mono text-[13.5px] leading-relaxed whitespace-pre">
        {formula}
      </pre>

      {signature && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {signature.args.map((arg) => (
            <span
              key={arg.name}
              className={`rounded px-1.5 py-0.5 font-mono text-[11.5px] ${TINT[arg.tint]}`}
            >
              {arg.label}
            </span>
          ))}
        </div>
      )}

      <p className="mt-2.5 text-[13.5px] leading-relaxed text-ink-2">
        {named.length > 0 && (
          <>
            {named.map((n, i) => (
              <span key={n.ref}>
                {i > 0 ? " and " : ""}
                <span className="font-mono text-[12.5px]">{n.ref}</span> is{" "}
                <span className="font-mono text-[12.5px]">{n.value}</span>
              </span>
            ))}
            {", so this "}
          </>
        )}
        {named.length === 0 && "This "}
        returns{" "}
        <span className="font-mono text-[12.5px] text-ink">
          {result.ok ? formatValue(result.value) : "nothing yet"}
        </span>
      </p>
    </div>
  );
}
