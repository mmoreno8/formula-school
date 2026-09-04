"use client";

import { useSyncExternalStore } from "react";
import { IconMoon } from "@/components/ui/icons";
import { resolvedTheme, serverTheme, setTheme, subscribeTheme } from "@/lib/theme";

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribeTheme, resolvedTheme, serverTheme);
  const dark = theme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-pressed={dark}
      className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm text-ink-2 transition-colors hover:bg-line-2"
    >
      <IconMoon className="h-[17px] w-[17px] text-ink-3" />
      Dark mode
      <span
        aria-hidden="true"
        className={`ml-auto h-5 w-9 rounded-full p-[3px] transition-colors ${
          dark ? "bg-green" : "bg-track"
        }`}
      >
        <span
          className={`block h-3.5 w-3.5 rounded-full border border-line bg-card transition-transform ${
            dark ? "translate-x-3.5" : ""
          }`}
        />
      </span>
    </button>
  );
}
