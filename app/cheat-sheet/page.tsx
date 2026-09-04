import type { Metadata } from "next";
import Link from "next/link";
import { LESSONS } from "@/content";
import { PageHeader } from "@/components/layout/PageHeader";
import { SignatureChips } from "@/components/engine/SignatureChips";

export const metadata: Metadata = {
  title: "Cheat sheet",
  description:
    "Every formula in the course on one page, with what each argument is for.",
};

export default function CheatSheetPage() {
  return (
    <>
      <PageHeader
        crumbs={[{ label: "Home", href: "/" }, { label: "Cheat sheet" }]}
        title="Cheat sheet"
        description="Every formula on one page, with what each argument is actually for. Generated from the lessons, so it cannot drift out of date."
      />

      <div className="flex flex-col gap-3.5">
        {LESSONS.map((lesson) => (
          <section
            key={lesson.id}
            className="rounded-xl border border-line bg-card p-5"
            aria-labelledby={`cheat-${lesson.id}`}
          >
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h2
                id={`cheat-${lesson.id}`}
                className="font-mono text-[15px] font-medium tracking-tight"
              >
                {lesson.name}
              </h2>
              <Link
                href={`/formulas/${lesson.id}`}
                className="rounded text-[13px] text-ink-3 hover:text-ink-2"
              >
                Open the lesson
              </Link>
            </div>
            <p className="mb-3 text-[14px] text-ink-2">{lesson.blurb}</p>
            <div className="flex flex-col gap-2">
              {lesson.signatures.map((sig) => (
                <SignatureChips key={sig.fn} signature={sig} />
              ))}
            </div>
            <ul className="mt-3 flex flex-col gap-1.5">
              {lesson.signatures.flatMap((sig) =>
                sig.args.map((arg) => (
                  <li
                    key={`${sig.fn}-${arg.name}`}
                    className="flex flex-wrap gap-x-2 text-[13.5px] text-ink-2"
                  >
                    <span className="font-mono text-ink-3">
                      {arg.optional ? `[${arg.name}]` : arg.name}
                    </span>
                    <span>{arg.label}</span>
                  </li>
                )),
              )}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
