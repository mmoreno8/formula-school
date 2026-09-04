export type TokKind =
  | "num"
  | "str"
  | "ident"
  | "op"
  | "lparen"
  | "rparen"
  | "comma"
  | "colon";

export interface Token {
  kind: TokKind;
  text: string;
  /** Index in the source string where this token starts. */
  at: number;
}

export class FormulaSyntaxError extends Error {}

const OPS_2 = ["<>", "<=", ">="];
const OPS_1 = ["+", "-", "*", "/", "^", "&", "=", "<", ">", "%"];

export function tokenize(input: string): Token[] {
  const out: Token[] = [];
  let i = 0;

  while (i < input.length) {
    const ch = input[i];

    if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r") {
      i++;
      continue;
    }

    if (ch === "(") {
      out.push({ kind: "lparen", text: ch, at: i++ });
      continue;
    }
    if (ch === ")") {
      out.push({ kind: "rparen", text: ch, at: i++ });
      continue;
    }
    if (ch === "," || ch === ";") {
      out.push({ kind: "comma", text: ",", at: i++ });
      continue;
    }
    if (ch === ":") {
      out.push({ kind: "colon", text: ch, at: i++ });
      continue;
    }

    if (ch === '"') {
      let j = i + 1;
      let text = "";
      let closed = false;
      while (j < input.length) {
        if (input[j] === '"') {
          if (input[j + 1] === '"') {
            text += '"';
            j += 2;
            continue;
          }
          closed = true;
          j++;
          break;
        }
        text += input[j++];
      }
      if (!closed) throw new FormulaSyntaxError("A quote is left open.");
      out.push({ kind: "str", text, at: i });
      i = j;
      continue;
    }

    if (/[0-9]/.test(ch) || (ch === "." && /[0-9]/.test(input[i + 1] ?? ""))) {
      let j = i;
      while (j < input.length && /[0-9.]/.test(input[j])) j++;
      if (
        (input[j] === "e" || input[j] === "E") &&
        /[0-9+-]/.test(input[j + 1] ?? "")
      ) {
        j += 2;
        while (j < input.length && /[0-9]/.test(input[j])) j++;
      }
      const text = input.slice(i, j);
      if (Number.isNaN(Number(text))) {
        throw new FormulaSyntaxError(`"${text}" is not a number.`);
      }
      out.push({ kind: "num", text, at: i });
      i = j;
      continue;
    }

    const two = input.slice(i, i + 2);
    if (OPS_2.includes(two)) {
      out.push({ kind: "op", text: two, at: i });
      i += 2;
      continue;
    }
    if (OPS_1.includes(ch)) {
      out.push({ kind: "op", text: ch, at: i++ });
      continue;
    }

    if (/[A-Za-z_$]/.test(ch)) {
      let j = i;
      while (j < input.length && /[A-Za-z0-9_$.]/.test(input[j])) j++;
      out.push({ kind: "ident", text: input.slice(i, j), at: i });
      i = j;
      continue;
    }

    throw new FormulaSyntaxError(`Cannot read "${ch}" here.`);
  }

  return out;
}
