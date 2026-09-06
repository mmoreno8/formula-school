"use client";

/**
 * Focus mode: hide the two side columns so a lesson can use the full width.
 *
 * Built the same way as lib/theme.ts, and for the same reason. The state is a
 * data attribute on <html>, stamped before first paint, so the layout never
 * appears wide and then snaps narrow. Everything that reacts to it does so in
 * CSS rather than in React, which keeps the lesson views from re-rendering a
 * whole workspace to hide a sidebar.
 *
 * This is a view preference, not progress. It sits beside the theme in
 * localStorage rather than in the progress map, so nothing about a learner's
 * work is touched by it.
 */

export type Focus = "on" | "off";

const KEY = "formula-school.focus";
export const FOCUS_EVENT = "formula-school:focus";

export function currentFocus(): Focus {
  return document.documentElement.getAttribute("data-focus") === "on"
    ? "on"
    : "off";
}

/** The panels are visible on the server, which is the state without JS. */
export function serverFocus(): Focus {
  return "off";
}

export function subscribeFocus(onChange: () => void): () => void {
  window.addEventListener(FOCUS_EVENT, onChange);
  return () => window.removeEventListener(FOCUS_EVENT, onChange);
}

export function setFocus(focus: Focus): void {
  const root = document.documentElement;
  if (focus === "on") root.setAttribute("data-focus", "on");
  else root.removeAttribute("data-focus");
  try {
    localStorage.setItem(KEY, focus);
  } catch {
    // Blocked storage means the choice does not survive a reload. Not fatal.
  }
  window.dispatchEvent(new Event(FOCUS_EVENT));
}
