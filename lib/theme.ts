"use client";

export type Theme = "light" | "dark";

const KEY = "formula-school.theme";
export const THEME_EVENT = "formula-school:theme";

/** What the page is actually rendering right now: an explicit choice if one
 *  has been made, otherwise whatever the system is set to. */
export function resolvedTheme(): Theme {
  const stamped = document.documentElement.getAttribute("data-theme");
  if (stamped === "dark" || stamped === "light") return stamped;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function serverTheme(): Theme {
  return "light";
}

export function subscribeTheme(onChange: () => void): () => void {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  window.addEventListener(THEME_EVENT, onChange);
  media.addEventListener("change", onChange);
  return () => {
    window.removeEventListener(THEME_EVENT, onChange);
    media.removeEventListener("change", onChange);
  };
}

export function setTheme(theme: Theme): void {
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    // Blocked storage means the choice does not survive a reload. Not fatal.
  }
  window.dispatchEvent(new Event(THEME_EVENT));
}
