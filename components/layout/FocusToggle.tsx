"use client";

import { useSyncExternalStore } from "react";
import { IconPanels } from "@/components/ui/icons";
import {
  currentFocus,
  serverFocus,
  setFocus,
  subscribeFocus,
} from "@/lib/focus";

/**
 * Hides the navigation sidebar and the lesson rail, so the task and the
 * workspace get the whole width.
 *
 * It sits in the page header rather than inside a lesson, because a control
 * that hides things has to stay reachable once they are hidden. Not green:
 * BRIEF.md section 9 rations green to four places and this is not one of them.
 */
export function FocusToggle() {
  const focus = useSyncExternalStore(subscribeFocus, currentFocus, serverFocus);
  const on = focus === "on";

  return (
    <button
      type="button"
      onClick={() => setFocus(on ? "off" : "on")}
      aria-pressed={on}
      title={on ? "Bring the side panels back" : "Hide the side panels"}
      className="flex shrink-0 items-center gap-2 rounded-lg border border-line bg-card px-3 py-1.5 text-[13px] text-ink-2 transition-colors hover:bg-line-2 hover:text-ink"
    >
      <IconPanels className="h-4 w-4 text-ink-3" />
      {on ? "Show panels" : "Hide panels"}
    </button>
  );
}
