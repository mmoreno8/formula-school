"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId, useState } from "react";
import { LESSONS } from "@/content";
import { lessonProgress } from "@/lib/progress";
import { useProgress } from "@/lib/useProgress";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import {
  IconList,
  IconOverview,
  IconSheet,
} from "@/components/ui/icons";

const NAV = [
  { href: "/", label: "Overview", Icon: IconOverview },
  { href: "/formulas", label: "Formulas", Icon: IconList },
  { href: "/cheat-sheet", label: "Cheat sheet", Icon: IconSheet },
];

export function Sidebar() {
  const pathname = usePathname();
  const progress = useProgress();
  const [open, setOpen] = useState(false);
  const navId = useId();

  const finished = LESSONS.filter(
    (l) => lessonProgress(progress, l.id).finished,
  ).length;

  function isActive(href: string): boolean {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <div className="border-b border-line bg-card lg:sticky lg:top-0 lg:h-dvh lg:w-[250px] lg:shrink-0 lg:overflow-y-auto lg:border-r lg:border-b-0">
      <div className="flex items-center gap-3 px-5 py-4 lg:pt-5 lg:pb-6">
        <Link href="/" className="flex items-center gap-3 rounded">
          {/* Green place 1 of 4: the logo mark. */}
          <span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-[9px] bg-green">
            <span className="font-mono text-sm font-semibold text-on-green">
              fx
            </span>
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
        <div className="px-5 pb-4">
          <ProgressBar
            value={finished}
            max={LESSONS.length}
            label="Lessons finished"
            className="h-[5px]"
          />
          <p className="mt-1.5 text-[12px] text-ink-2 tabular-nums">
            {finished} of {LESSONS.length} done
          </p>
        </div>

        <nav aria-label="Main" className="flex flex-col gap-px border-t border-line px-3 pt-2">
          {NAV.map(({ href, label, Icon }) => {
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
        </nav>

        <div className="mt-6 px-3 lg:mt-auto">
          <ThemeToggle />
          <p className="mx-2 mt-3 rounded-[9px] border border-line bg-raise px-3 py-2.5 text-[12.5px] leading-relaxed text-ink-3">
            Your progress is saved on this device. No account, nothing to sign
            up for.
          </p>
        </div>
      </div>
    </div>
  );
}
