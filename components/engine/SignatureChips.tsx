import type { Signature } from "@/lib/schema";

/** The signature with each argument as a coloured chip. The same tint always
 *  means the same kind of argument, in every lesson. BRIEF.md section 9. */
export function SignatureChips({ signature }: { signature: Signature }) {
  return (
    <div className="overflow-x-auto rounded-[9px] border border-line bg-raise px-4 py-3 font-mono text-[13px] leading-loose text-ink-2">
      <span className="whitespace-nowrap">
        ={signature.fn}(
        {signature.args.map((arg, i) => (
          <span key={arg.name}>
            {i > 0 && ", "}
            <span
              data-tint={arg.tint}
              className="rounded-[5px] px-2 py-[3px]"
              title={arg.name}
            >
              {arg.optional ? `${arg.label}, optional` : arg.label}
            </span>
          </span>
        ))}
        )
      </span>
    </div>
  );
}
