/**
 * A small SQL tokenizer, and the two checks built on it.
 *
 * SQL-SPIKE-REPORT.md: a text-prefix check is not sufficient, because a string
 * literal or a comment can contain any keyword. Both the read-only check and
 * `mustUse` detection have to look at real tokens.
 *
 * This is layer 1 of the layered read-only method. Layers 2 to 5 live in the
 * worker (public/sql/worker.js), because they need a live database:
 * `iterateStatements`, `PRAGMA query_only = ON`, and the result-column
 * requirement. Each layer stands on its own. See lib/sql/client.ts.
 *
 * Nothing here imports sql.js, so the validator, the tests and the browser all
 * share one implementation and it cannot drift between them.
 */

export type TokenKind = "word" | "punct" | "string" | "number";

export interface Token {
  kind: TokenKind;
  /** Source text. For words this is the original casing. */
  text: string;
  /** Upper-cased text, for keyword comparison. Words only. */
  upper: string;
  start: number;
  end: number;
}

const WORD_START = /[A-Za-z_]/;
const WORD_REST = /[A-Za-z0-9_$]/;
const DIGIT = /[0-9]/;

/**
 * Splits SQL into tokens, dropping whitespace, line comments and block
 * comments. Quoted identifiers ("x", [x], `x`) and string literals ('x') are
 * returned as single tokens so their contents can never be mistaken for
 * keywords.
 */
export function tokenize(sql: string): Token[] {
  const out: Token[] = [];
  let i = 0;
  const n = sql.length;

  while (i < n) {
    const c = sql[i];

    // whitespace
    if (c === " " || c === "\t" || c === "\n" || c === "\r" || c === "\f") {
      i++;
      continue;
    }

    // -- line comment
    if (c === "-" && sql[i + 1] === "-") {
      i += 2;
      while (i < n && sql[i] !== "\n") i++;
      continue;
    }

    // /* block comment */  (SQLite does not nest these)
    if (c === "/" && sql[i + 1] === "*") {
      i += 2;
      while (i < n && !(sql[i] === "*" && sql[i + 1] === "/")) i++;
      i = i < n ? i + 2 : n;
      continue;
    }

    // 'string literal', with '' as an escaped quote
    if (c === "'") {
      const start = i;
      i++;
      while (i < n) {
        if (sql[i] === "'") {
          if (sql[i + 1] === "'") {
            i += 2;
            continue;
          }
          i++;
          break;
        }
        i++;
      }
      out.push({ kind: "string", text: sql.slice(start, i), upper: "", start, end: i });
      continue;
    }

    // "quoted identifier", [bracketed], `backticked`
    if (c === '"' || c === "[" || c === "`") {
      const close = c === "[" ? "]" : c;
      const start = i;
      i++;
      while (i < n) {
        if (sql[i] === close) {
          if (close !== "]" && sql[i + 1] === close) {
            i += 2;
            continue;
          }
          i++;
          break;
        }
        i++;
      }
      out.push({ kind: "string", text: sql.slice(start, i), upper: "", start, end: i });
      continue;
    }

    // number
    if (DIGIT.test(c) || (c === "." && DIGIT.test(sql[i + 1] ?? ""))) {
      const start = i;
      while (i < n && /[0-9.eE]/.test(sql[i])) {
        // exponent sign
        if ((sql[i] === "e" || sql[i] === "E") && /[+-]/.test(sql[i + 1] ?? "")) i++;
        i++;
      }
      out.push({ kind: "number", text: sql.slice(start, i), upper: "", start, end: i });
      continue;
    }

    // bare word or keyword
    if (WORD_START.test(c)) {
      const start = i;
      while (i < n && WORD_REST.test(sql[i])) i++;
      const text = sql.slice(start, i);
      out.push({ kind: "word", text, upper: text.toUpperCase(), start, end: i });
      continue;
    }

    // anything else is punctuation, one character at a time
    out.push({ kind: "punct", text: c, upper: c, start: i, end: i + 1 });
    i++;
  }

  return out;
}

/* --------------------------- read-only, layer 1 --------------------------- */

export interface ReadOnlyVerdict {
  allowed: boolean;
  code?: "empty" | "not-read-only" | "multiple-statements";
  /** The keyword that caused a refusal, for the message. */
  offending?: string;
}

/**
 * Statement separators outside strings and comments. A trailing semicolon with
 * nothing after it is allowed, so `SELECT 1;` is one statement.
 *
 * This is a pre-check. The worker's `iterateStatements` is the authority on
 * statement count; this catches the common case before anything is sent.
 */
function countStatements(tokens: Token[]): number {
  let statements = 0;
  let sawContent = false;

  for (const t of tokens) {
    if (t.kind === "punct" && t.text === ";") {
      if (sawContent) statements++;
      sawContent = false;
      continue;
    }
    sawContent = true;
  }
  if (sawContent) statements++;
  return statements;
}

/**
 * Layer 1: the first real token has to be SELECT or WITH, and there has to be
 * exactly one statement.
 *
 * A read-only `WITH` is accepted here and then held to `PRAGMA query_only` in
 * the worker, which is what catches `WITH ... DELETE ... RETURNING`.
 */
export function checkReadOnly(sql: string): ReadOnlyVerdict {
  const tokens = tokenize(sql);
  if (tokens.length === 0) return { allowed: false, code: "empty" };

  if (countStatements(tokens) > 1) {
    return { allowed: false, code: "multiple-statements" };
  }

  // Leading parenthesis is legal: ( SELECT ... )
  let k = 0;
  while (k < tokens.length && tokens[k].kind === "punct" && tokens[k].text === "(") k++;

  const first = tokens[k];
  if (!first || first.kind !== "word") {
    return { allowed: false, code: "not-read-only", offending: first?.text ?? "" };
  }
  // SELECT or a read-only WITH, and nothing else. VALUES was accepted here in
  // the first implementation, which the contract does not permit: BRIEF.md
  // section 8 lists exactly two accepted openings.
  if (first.upper === "SELECT" || first.upper === "WITH") {
    return { allowed: true };
  }
  return { allowed: false, code: "not-read-only", offending: first.text };
}

/* ------------------------------- mustUse --------------------------------- */

/**
 * True when every keyword in `phrase` appears as a contiguous run of word
 * tokens. "GROUP BY" is the sequence GROUP, BY.
 *
 * SQL-SPIKE-REPORT.md: this must reject both
 *   SELECT 'GROUP BY';
 *   SELECT region FROM orders; -- GROUP BY region
 * which it does, because strings and comments never become word tokens.
 */
export function usesClause(sql: string, phrase: string): boolean {
  const want = phrase
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.toUpperCase());
  if (want.length === 0) return true;

  const words = tokenize(sql).filter((t) => t.kind === "word");

  for (let i = 0; i + want.length <= words.length; i++) {
    let hit = true;
    for (let j = 0; j < want.length; j++) {
      if (words[i + j].upper !== want[j]) {
        hit = false;
        break;
      }
    }
    if (hit) return true;
  }
  return false;
}

/** Every clause in `mustUse`, or the first one that is missing. */
export function missingClause(sql: string, mustUse: string[] | undefined): string | null {
  for (const phrase of mustUse ?? []) {
    if (!usesClause(sql, phrase)) return phrase;
  }
  return null;
}
