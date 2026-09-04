import { FormulaSyntaxError, tokenize, type Token } from "./lexer";

export type Node =
  | { t: "num"; v: number }
  | { t: "str"; v: string }
  | { t: "bool"; v: boolean }
  | { t: "ref"; a1: string }
  | { t: "range"; a1: string }
  | { t: "call"; fn: string; args: Node[] }
  | { t: "bin"; op: string; l: Node; r: Node }
  | { t: "un"; op: string; e: Node };

const REF_LIKE = /^\$?[A-Za-z]{1,3}\$?[0-9]{1,7}$/;
const COL_LIKE = /^\$?[A-Za-z]{1,3}$/;

/**
 * Recursive descent, Excel's precedence:
 *   comparison < concat < add < multiply < unary < power < primary
 */
class Parser {
  private i = 0;
  constructor(private toks: Token[]) {}

  private peek(): Token | undefined {
    return this.toks[this.i];
  }
  private next(): Token | undefined {
    return this.toks[this.i++];
  }
  private eat(kind: Token["kind"], text?: string): boolean {
    const t = this.peek();
    if (!t || t.kind !== kind) return false;
    if (text !== undefined && t.text !== text) return false;
    this.i++;
    return true;
  }

  parse(): Node {
    const node = this.comparison();
    const rest = this.peek();
    if (rest) {
      throw new FormulaSyntaxError(
        rest.kind === "rparen"
          ? "There is a closing bracket with nothing to close."
          : `Unexpected "${rest.text}".`,
      );
    }
    return node;
  }

  private comparison(): Node {
    let l = this.concat();
    for (;;) {
      const t = this.peek();
      if (
        t?.kind === "op" &&
        ["=", "<>", "<", "<=", ">", ">="].includes(t.text)
      ) {
        this.i++;
        l = { t: "bin", op: t.text, l, r: this.concat() };
      } else return l;
    }
  }

  private concat(): Node {
    let l = this.additive();
    while (this.peek()?.kind === "op" && this.peek()!.text === "&") {
      this.i++;
      l = { t: "bin", op: "&", l, r: this.additive() };
    }
    return l;
  }

  private additive(): Node {
    let l = this.multiplicative();
    for (;;) {
      const t = this.peek();
      if (t?.kind === "op" && (t.text === "+" || t.text === "-")) {
        this.i++;
        l = { t: "bin", op: t.text, l, r: this.multiplicative() };
      } else return l;
    }
  }

  private multiplicative(): Node {
    let l = this.unary();
    for (;;) {
      const t = this.peek();
      if (t?.kind === "op" && (t.text === "*" || t.text === "/")) {
        this.i++;
        l = { t: "bin", op: t.text, l, r: this.unary() };
      } else return l;
    }
  }

  private unary(): Node {
    const t = this.peek();
    if (t?.kind === "op" && (t.text === "-" || t.text === "+")) {
      this.i++;
      return { t: "un", op: t.text, e: this.unary() };
    }
    return this.power();
  }

  private power(): Node {
    const base = this.primary();
    if (this.peek()?.kind === "op" && this.peek()!.text === "^") {
      this.i++;
      return { t: "bin", op: "^", l: base, r: this.unary() };
    }
    return base;
  }

  private primary(): Node {
    const t = this.next();
    if (!t) throw new FormulaSyntaxError("The formula stops early.");

    if (t.kind === "num") return { t: "num", v: Number(t.text) };
    if (t.kind === "str") return { t: "str", v: t.text };

    if (t.kind === "lparen") {
      const inner = this.comparison();
      if (!this.eat("rparen")) {
        throw new FormulaSyntaxError("A bracket is left open.");
      }
      return inner;
    }

    if (t.kind === "ident") {
      // Function call
      if (this.peek()?.kind === "lparen") {
        this.i++;
        const args: Node[] = [];
        if (!this.eat("rparen")) {
          for (;;) {
            args.push(this.comparison());
            if (this.eat("comma")) continue;
            if (this.eat("rparen")) break;
            throw new FormulaSyntaxError(
              `"${t.text}" is missing a closing bracket.`,
            );
          }
        }
        return { t: "call", fn: t.text.toUpperCase(), args };
      }

      // Range
      if (this.peek()?.kind === "colon") {
        this.i++;
        const right = this.next();
        if (!right || right.kind !== "ident") {
          throw new FormulaSyntaxError("A range needs a cell on both sides of the colon.");
        }
        const a1 = `${t.text}:${right.text}`;
        const okCells = REF_LIKE.test(t.text) && REF_LIKE.test(right.text);
        const okCols = COL_LIKE.test(t.text) && COL_LIKE.test(right.text);
        if (!okCells && !okCols) {
          throw new FormulaSyntaxError(`"${a1}" is not a range.`);
        }
        return { t: "range", a1 };
      }

      const upper = t.text.toUpperCase();
      if (upper === "TRUE") return { t: "bool", v: true };
      if (upper === "FALSE") return { t: "bool", v: false };
      if (REF_LIKE.test(t.text)) return { t: "ref", a1: t.text };

      throw new FormulaSyntaxError(
        `"${t.text}" is not a cell reference or a function.`,
      );
    }

    throw new FormulaSyntaxError(`Unexpected "${t.text}".`);
  }
}

export function parse(source: string): Node {
  return new Parser(tokenize(source)).parse();
}

/** Every function name used anywhere in the tree, uppercased. */
export function functionsUsed(node: Node, into: Set<string> = new Set()): Set<string> {
  switch (node.t) {
    case "call":
      into.add(node.fn);
      node.args.forEach((a) => functionsUsed(a, into));
      break;
    case "bin":
      functionsUsed(node.l, into);
      functionsUsed(node.r, into);
      break;
    case "un":
      functionsUsed(node.e, into);
      break;
  }
  return into;
}
