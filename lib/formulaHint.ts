/**
 * Works out which function call the caret is sitting inside, and which of its
 * arguments. This is what lets the hint line bold the argument you are on,
 * the way Excel's own tooltip does. Pure so it can be tested directly.
 */

export interface ActiveArgument {
  /** Uppercased function name the caret is inside. */
  fn: string;
  /** 0-based argument index, counting top-level commas. */
  index: number;
}

interface Frame {
  fn: string;
  commas: number;
}

const IDENT_TAIL = /[A-Za-z0-9_.$]/;

/** `source` is the formula without its leading "=". */
export function activeArgument(source: string, caret: number): ActiveArgument | null {
  const stack: Frame[] = [];
  let inString = false;

  const upTo = Math.min(caret, source.length);

  for (let i = 0; i < upTo; i++) {
    const ch = source[i];

    if (inString) {
      if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === "(") {
      let end = i;
      while (end > 0 && IDENT_TAIL.test(source[end - 1])) end--;
      const name = source.slice(end, i);
      stack.push({ fn: name.toUpperCase(), commas: 0 });
      continue;
    }

    if (ch === ")") {
      stack.pop();
      continue;
    }

    if (ch === "," || ch === ";") {
      const top = stack[stack.length - 1];
      if (top) top.commas++;
    }
  }

  for (let i = stack.length - 1; i >= 0; i--) {
    if (stack[i].fn !== "") {
      return { fn: stack[i].fn, index: stack[i].commas };
    }
  }
  return null;
}

/**
 * The function name being typed at the caret, when it is not yet followed by
 * an opening bracket. Drives the autocomplete suggestion.
 */
export function typingFunctionName(source: string, caret: number): string | null {
  const upTo = Math.min(caret, source.length);
  let start = upTo;
  while (start > 0 && IDENT_TAIL.test(source[start - 1])) start--;
  const word = source.slice(start, upTo);
  if (word === "" || !/^[A-Za-z][A-Za-z0-9_.]*$/.test(word)) return null;
  if (source[upTo] === "(") return null;
  return word;
}

export function suggestFunctions(
  prefix: string,
  names: readonly string[],
  limit = 4,
): string[] {
  const up = prefix.toUpperCase();
  return names.filter((n) => n.startsWith(up) && n !== up).slice(0, limit);
}

/** Replaces the partially typed name at the caret with `fn(`. */
export function acceptSuggestion(
  source: string,
  caret: number,
  fn: string,
): { text: string; caret: number } {
  let start = Math.min(caret, source.length);
  while (start > 0 && IDENT_TAIL.test(source[start - 1])) start--;
  const head = source.slice(0, start) + fn + "(";
  return { text: head + source.slice(caret), caret: head.length };
}
