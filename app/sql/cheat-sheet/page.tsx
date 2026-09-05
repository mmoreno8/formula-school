import type { Metadata } from "next";
import Link from "next/link";
import { SQL_LESSONS } from "@/content";
import type { Tint } from "@/lib/schema";
import { PageHeader } from "@/components/layout/PageHeader";

export const metadata: Metadata = {
  title: "SQL cheat sheet",
  description:
    "Every SQL clause in the track on one page, with what each part is for.",
};

const TINT: Record<Tint, string> = {
  lookup: "bg-lookup-bg text-lookup-fg",
  search: "bg-search-bg text-search-fg",
  return: "bg-return-bg text-return-fg",
  test: "bg-test-bg text-test-fg",
  plain: "bg-plain-bg text-plain-fg",
};

/**
 * Generated from lesson data, so it cannot drift. BRIEF.md section 7: the two
 * cheat sheets stay separate, because one page mixing Excel signatures with
 * SQL clauses helps nobody.
 */
export default function SqlCheatSheetPage() {
  return (
    <>
      <PageHeader
        crumbs={[
          { label: "Home", href: "/" },
          { label: "SQL", href: "/sql" },
          { label: "Cheat sheet" },
        ]}
        title="SQL cheat sheet"
        description="Every query shape in the track on one page, with what each clause is actually for. Generated from the lessons, so it cannot drift out of date."
      />

      <div className="flex flex-col gap-3.5">
        {SQL_LESSONS.map((lesson) => (
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
                href={`/sql/${lesson.id}`}
                className="rounded text-[13px] text-ink-3 hover:text-ink-2"
              >
                Open the lesson
              </Link>
            </div>

            <div className="rounded-[9px] border border-line bg-raise px-3.5 py-3">
              <pre className="overflow-x-auto font-mono text-[13px] leading-relaxed whitespace-pre">
                {lesson.shape}
              </pre>
            </div>

            <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5">
              {lesson.clauses.map((c) => (
                <span
                  key={c.kw}
                  className="inline-flex items-center gap-1.5 font-mono text-[12px]"
                >
                  <span className="font-semibold">{c.kw}</span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[11.5px] ${TINT[c.tint]}`}
                  >
                    {c.label}
                  </span>
                </span>
              ))}
            </div>

            <p className="mt-3 max-w-[70ch] text-[13.5px] leading-relaxed text-ink-2">
              {lesson.blurb}. The worked answer is{" "}
              <code className="font-mono text-[12.5px]">{lesson.build.canonical}</code>
            </p>
          </section>
        ))}
      </div>

      <p className="mt-6 max-w-[66ch] text-[13.5px] leading-relaxed text-ink-3">
        These lessons use SQLite, because the database runs inside your browser.
        Everything on this page is written the same way in MySQL and PostgreSQL.
      </p>
    </>
  );
}
