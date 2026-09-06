"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId, useState } from "react";
import { EXCEL_LESSONS, SQL_LESSONS, TRACK_TARGET } from "@/content";
import type { Lesson } from "@/lib/schema";
import { lessonProgress, type ProgressMap } from "@/lib/progress";
import { useProgress } from "@/lib/useProgress";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { IconList, IconOverview, IconSheet } from "@/components/ui/icons";

/**
 * Two tracks, each in its own labelled group, each with its own progress bar.
 * BRIEF.md section 7. Excel routes do not move.
 */
const GROUPS = [
  {
    label: null,
    items: [{ href: "/", label: "Overview", Icon: IconOverview }],
  },
  {
    label: "Excel",
    items: [
      { href: "/formulas", label: "Formulas", Icon: IconList },
      { href: "/cheat-sheet", label: "Cheat sheet", Icon: IconSheet },
    ],
  },
  {
    label: "SQL",
    items: [
      { href: "/sql", label: "Lessons", Icon: IconList },
      { href: "/sql/cheat-sheet", label: "Cheat sheet", Icon: IconSheet },
    ],
  },
] as const;

function finishedIn(lessons: Lesson[], progress: ProgressMap): number {
  return lessons.filter((l) => lessonProgress(progress, l.id).finished).length;
}

export function Sidebar() {
  const pathname = usePathname();
  const progress = useProgress();
  const [open, setOpen] = useState(false);
  const navId = useId();

  const excelDone = finishedIn(EXCEL_LESSONS, progress);
  const sqlDone = finishedIn(SQL_LESSONS, progress);

  function isActive(href: string): boolean {
    if (href === "/") return pathname === "/";
    // /sql must not light up for /sql/cheat-sheet, which has its own entry.
    if (href === "/sql") {
      return pathname === "/sql" || /^\/sql\/(?!cheat-sheet$)/.test(pathname);
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <div
      data-chrome="sidebar"
      className="border-b border-line bg-card lg:sticky lg:top-0 lg:h-dvh lg:w-[250px] lg:shrink-0 lg:overflow-y-auto lg:border-r lg:border-b-0"
    >
      <div className="flex items-center gap-3 px-5 py-4 lg:pt-5 lg:pb-6">
        <Link href="/" className="flex items-center gap-3 rounded">
          {/* Green place 1 of 4: the logo mark. */}
          <span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-[9px] bg-green">
            <span className="font-mono text-sm font-semibold text-on-green">fx</span>
          </span>
          <span className="text-base font-semibold tracking-tight">
            Formula School
          </span>
        </Link>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={navId}
          className="ml-auto rounded-lg border border-line px-3 py-1.5 text-sm text-ink-2 lg:hidden"
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      <div
        id={navId}
        className={`${open ? "block" : "hidden"} pb-4 lg:block lg:flex lg:h-[calc(100dvh-86px)] lg:flex-col lg:pb-4`}
      >
        <div className="flex flex-col gap-3 px-5 pb-4">
          <div>
            <div className="mb-1 flex items-baseline justify-between text-[12px] text-ink-2">
              <span>Excel</span>
              <span className="tabular-nums">
                {excelDone} / {TRACK_TARGET.excel}
              </span>
            </div>
            <ProgressBar
              value={excelDone}
              max={TRACK_TARGET.excel}
              label="Excel lessons finished"
              className="h-[5px]"
            />
          </div>
          <div>
            <div className="mb-1 flex items-baseline justify-between text-[12px] text-ink-2">
              <span>SQL</span>
              <span className="tabular-nums">
                {sqlDone} / {TRACK_TARGET.sql}
              </span>
            </div>
            <ProgressBar
              value={sqlDone}
              max={TRACK_TARGET.sql}
              label="SQL lessons finished"
              className="h-[5px]"
            />
          </div>
        </div>

        <nav aria-label="Main" className="flex flex-col border-t border-line px-3 pt-2">
          {GROUPS.map((group, gi) => (
            <div key={group.label ?? `g${gi}`} className="flex flex-col gap-px">
              {group.label && (
                <p className="px-2.5 pt-3 pb-1 text-[10.5px] font-medium tracking-wider text-ink-3 uppercase">
                  {group.label}
                </p>
              )}
              {group.items.map(({ href, label, Icon }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-colors ${
                      active
                        ? // Green place 2 of 4: the active nav item.
                          "bg-mint font-medium text-green-2"
                        : "text-ink-2 hover:bg-line-2 hover:text-ink"
                    }`}
                  >
                    <Icon
                      className={`h-[17px] w-[17px] ${active ? "text-green" : "text-ink-3"}`}
                    />
                    {label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="mt-6 px-3 lg:mt-auto">
          <ThemeToggle />
          <p className="mx-2 mt-3 rounded-[9px] border border-line bg-raise px-3 py-2.5 text-[12.5px] leading-relaxed text-ink-3">
            Your progress is saved on this device. No account, nothing to sign up
            for.
          </p>
        </div>
      </div>
    </div>
  );
}
