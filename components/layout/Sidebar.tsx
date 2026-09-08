"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId, useState } from "react";
import { EXCEL_LESSONS, SQL_LESSONS, TRACK_TARGET } from "@/content";
import type { Lesson, Track } from "@/lib/schema";
import { lessonProgress, type ProgressMap } from "@/lib/progress";
import { useProgress } from "@/lib/useProgress";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { ProgressAccount } from "@/components/layout/ProgressAccount";
import { IconList, IconOverview, IconSheet } from "@/components/ui/icons";

/**
 * Overview on its own, then one labelled group per track. BRIEF.md section 7.
 *
 * Each track carries its own progress inside its own group rather than in a
 * shared block at the top, so an Excel count is never read as a site total.
 * Excel routes do not move: the group says Excel, the href still says
 * /formulas, and nothing bookmarked breaks.
 */
const GROUPS: {
  label: string | null;
  track: Track | null;
  items: {
    href: string;
    label: string;
    Icon: (props: { className?: string }) => React.ReactElement;
  }[];
}[] = [
  {
    label: null,
    track: null,
    items: [{ href: "/", label: "Overview", Icon: IconOverview }],
  },
  {
    label: "Excel",
    track: "excel",
    items: [
      { href: "/formulas", label: "Lessons", Icon: IconList },
      { href: "/cheat-sheet", label: "Cheat sheet", Icon: IconSheet },
    ],
  },
  {
    label: "SQL",
    track: "sql",
    items: [
      { href: "/sql", label: "Lessons", Icon: IconList },
      { href: "/sql/cheat-sheet", label: "Cheat sheet", Icon: IconSheet },
    ],
  },
];

function finishedIn(lessons: Lesson[], progress: ProgressMap): number {
  return lessons.filter((l) => lessonProgress(progress, l.id).finished).length;
}

export function Sidebar() {
  const pathname = usePathname();
  const progress = useProgress();
  const [open, setOpen] = useState(false);
  const navId = useId();

  const done: Record<Track, number> = {
    excel: finishedIn(EXCEL_LESSONS, progress),
    sql: finishedIn(SQL_LESSONS, progress),
  };

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
        <nav aria-label="Main" className="flex flex-col border-t border-line px-3 pt-2">
          {GROUPS.map((group, gi) => (
            <div key={group.label ?? `g${gi}`} className="flex flex-col gap-px">
              {group.label && group.track && (
                <div className="px-2.5 pt-4 pb-2">
                  <div className="mb-1.5 flex items-baseline justify-between">
                    <p className="text-[10.5px] font-medium tracking-wider text-ink-3 uppercase">
                      {group.label}
                    </p>
                    <span className="text-[11.5px] text-ink-3 tabular-nums">
                      {done[group.track]} / {TRACK_TARGET[group.track]}
                    </span>
                  </div>
                  <ProgressBar
                    value={done[group.track]}
                    max={TRACK_TARGET[group.track]}
                    label={`${group.label} lessons finished`}
                    className="h-[5px]"
                  />
                </div>
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
          <ProgressAccount />
        </div>
      </div>
    </div>
  );
}
