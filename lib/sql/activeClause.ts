/**
 * Which clause the caret is currently inside.
 *
 * BRIEF.md 5.2 and 5.12: Excel's formula bar bolds the argument your cursor is
 * in, and the SQL guidance line does the same job for clauses. This is that
 * lookup, kept out of the component so it can be unit tested.
 *
 * Uses the shared tokenizer, so a clause keyword inside a string or a comment
 * never counts as the clause starting.
 */

import type { ClauseSpec } from "@/lib/schema";
import { tokenize } from "./tokenize";

/**
 * Returns the `kw` of the clause the caret sits in, or null.
 *
 * Multi-word clauses ("GROUP BY") are matched as a token run, so a caret after
 * "GROUP BY region" reports GROUP BY rather than nothing.
 */
export function activeClauseAt(
  sql: string,
  caret: number,
  clauses: ClauseSpec[],
): string | null {
  const words = tokenize(sql).filter((t) => t.kind === "word");
  if (words.length === 0) return null;

  const phrases = clauses.map((c) => ({
    kw: c.kw,
    parts: c.kw.trim().split(/\s+/).map((w) => w.toUpperCase()),
  }));

  let current: string | null = null;

  for (let i = 0; i < words.length; i++) {
    const match = phrases.find((p) =>
      p.parts.every((part, j) => words[i + j]?.upper === part),
    );
    if (!match) continue;

    // The clause owns everything from its first keyword onwards, until the
    // next clause keyword takes over.
    if (words[i].start <= caret) {
      current = match.kw;
    } else {
      break;
    }
    i += match.parts.length - 1;
  }

  return current;
}
