import { describe, expect, it } from "vitest";
import { checkReadOnly, tokenize, usesClause } from "@/lib/sql/tokenize";
import {
  compareResults,
  encodeRow,
  encodeValue,
  normalizeColumnName,
} from "@/lib/sql/compare";
import { buildSeed, validateTableSet } from "@/lib/sql/seed";
import { activeClauseAt } from "@/lib/sql/activeClause";
import { runQueryNode, gradeQueryNode } from "@/lib/sql/node";
import { SQL_LESSONS } from "@/content";
import type { TableSet } from "@/lib/schema";
import type { ResultSet } from "@/lib/sql/types";

const db: TableSet = {
  tables: [
    {
      name: "orders",
      cols: ["id", "customer", "region", "amount"],
      rows: [
        [1, "Ana", "North", 10],
        [2, "Bo", "North", 15],
        [3, "Cy", "South", 8],
      ],
    },
  ],
};

/* -------------------------------- tokenizer ------------------------------- */

describe("tokenizer", () => {
  it("keeps string literals and comments out of the token stream", () => {
    const words = tokenize("SELECT 'GROUP BY' -- GROUP BY\n FROM orders")
      .filter((t) => t.kind === "word")
      .map((t) => t.upper);
    expect(words).toEqual(["SELECT", "FROM", "ORDERS"]);
  });

  it("handles doubled quotes inside a string", () => {
    const t = tokenize("SELECT 'it''s fine' FROM orders");
    expect(t.filter((x) => x.kind === "string")).toHaveLength(1);
  });

  it("treats quoted identifiers as opaque", () => {
    const words = tokenize('SELECT "group by" FROM orders')
      .filter((t) => t.kind === "word")
      .map((t) => t.upper);
    expect(words).toEqual(["SELECT", "FROM", "ORDERS"]);
  });
});

/* ---------------------- read-only, the spike's cases ---------------------- */

describe("read-only layer 1", () => {
  it("accepts an ordinary SELECT", () => {
    expect(checkReadOnly("SELECT * FROM orders").allowed).toBe(true);
  });

  it("accepts a commented SELECT", () => {
    expect(checkReadOnly("-- pull the orders\nSELECT * FROM orders;").allowed).toBe(true);
  });

  it("accepts a read-only WITH", () => {
    const sql = "WITH t AS (SELECT * FROM orders) SELECT * FROM t";
    expect(checkReadOnly(sql).allowed).toBe(true);
  });

  it("accepts a single trailing semicolon", () => {
    expect(checkReadOnly("SELECT 1;").allowed).toBe(true);
  });

  it("refuses two statements", () => {
    const v = checkReadOnly("SELECT 1; SELECT 2;");
    expect(v.allowed).toBe(false);
    expect(v.code).toBe("multiple-statements");
  });

  it("does not mistake a semicolon inside a string for a separator", () => {
    expect(checkReadOnly("SELECT 'a;b' FROM orders").allowed).toBe(true);
  });

  it.each([
    ["PRAGMA", "PRAGMA table_info(orders)"],
    ["DELETE", "DELETE FROM orders"],
    ["CREATE", "CREATE TABLE t (a)"],
    ["ATTACH", "ATTACH DATABASE 'x' AS y"],
    ["DETACH", "DETACH DATABASE y"],
    ["INSERT", "INSERT INTO orders VALUES (4,'D','East',1)"],
    ["UPDATE", "UPDATE orders SET amount = 0"],
    ["DROP", "DROP TABLE orders"],
    ["ALTER", "ALTER TABLE orders ADD COLUMN x"],
    // VALUES was wrongly accepted by the first implementation. The contract
    // permits exactly two openings, SELECT and a read-only WITH.
    ["VALUES", "VALUES (1), (2)"],
  ])("refuses %s", (_label, sql) => {
    const v = checkReadOnly(sql);
    expect(v.allowed).toBe(false);
    expect(v.code).toBe("not-read-only");
  });
});

describe("read-only, the layers that need a database", () => {
  it("refuses a write hidden behind an initial WITH", async () => {
    // Layer 1 admits this on purpose: the first token is WITH. PRAGMA
    // query_only in the engine is what catches it. SQL-SPIKE-REPORT.md.
    const sql =
      "WITH gone AS (DELETE FROM orders RETURNING *) SELECT * FROM gone";
    expect(checkReadOnly(sql).allowed).toBe(true);
    const out = await runQueryNode(db, sql);
    expect(out.ok).toBe(false);
  });

  it("refuses a statement that returns no columns", async () => {
    const out = await runQueryNode(db, "PRAGMA query_only");
    expect(out.ok).toBe(false);
  });

  it("runs a real query", async () => {
    const out = await runQueryNode(
      db,
      "SELECT region, SUM(amount) AS total FROM orders GROUP BY region",
    );
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(out.result.columns).toEqual(["region", "total"]);
      expect(out.result.rows).toHaveLength(2);
    }
  });
});

/* --------------------------------- mustUse -------------------------------- */

describe("mustUse detection", () => {
  it("finds a real GROUP BY", () => {
    expect(
      usesClause("SELECT region FROM orders GROUP BY region", "GROUP BY"),
    ).toBe(true);
  });

  it("ignores the words inside a string", () => {
    expect(usesClause("SELECT 'GROUP BY';", "GROUP BY")).toBe(false);
  });

  it("ignores the words inside a line comment", () => {
    expect(
      usesClause("SELECT region FROM orders; -- GROUP BY region", "GROUP BY"),
    ).toBe(false);
  });

  it("ignores the words inside a block comment", () => {
    expect(
      usesClause("SELECT region /* GROUP BY */ FROM orders", "GROUP BY"),
    ).toBe(false);
  });

  it("requires the words to be adjacent and in order", () => {
    expect(usesClause("SELECT region FROM orders ORDER BY region", "GROUP BY")).toBe(
      false,
    );
  });
});

/* ------------------------------- comparison ------------------------------- */

function rs(columns: string[], rows: ResultSet["rows"]): ResultSet {
  return { columns, rows };
}

describe("column-name normalization", () => {
  it("folds case, trims, and collapses internal whitespace", () => {
    // SQL-SPIKE-REPORT.md confirmed SQLite does not do this itself.
    expect(normalizeColumnName("SUM( amount )")).toBe(normalizeColumnName("sum(amount)"));
    expect(normalizeColumnName("  Total ")).toBe("total");
  });

  it("still treats different names as different", () => {
    expect(normalizeColumnName("total")).not.toBe(normalizeColumnName("amount"));
  });
});

describe("value encoding", () => {
  it("keeps a number, a string and null distinct", () => {
    expect(encodeValue(1)).not.toBe(encodeValue("1"));
    expect(encodeValue(null)).not.toBe(encodeValue("null"));
    expect(encodeValue(null)).not.toBe(encodeValue(0));
  });

  it("cannot be forged by a value containing the old separator", () => {
    // The first implementation encoded each value as NUL + "str:" + text and
    // joined the row with no delimiter, so these two rows both encoded to
    // NUL str:a NUL str:b NUL str:c and compared equal despite being different
    // data. Same column count, so the earlier column checks missed it too.
    const a = rs(["x", "y"], [["a", "b\u0000str:c"]]);
    const b = rs(["x", "y"], [["a\u0000str:b", "c"]]);
    expect(encodeRow(a.rows[0])).not.toBe(encodeRow(b.rows[0]));
    expect(compareResults(a, b, false).equal).toBe(false);
  });

  it("keeps rows distinct when a value contains JSON punctuation", () => {
    const a = rs(["a", "b"], [['", "', "x"]]);
    const b = rs(["a", "b"], [["", '", "x']]);
    expect(compareResults(a, b, false).equal).toBe(false);
  });

  it("treats NULL as equal only to NULL", () => {
    const a = rs(["x"], [[null]]);
    const b = rs(["x"], [[null]]);
    expect(compareResults(a, b, false).equal).toBe(true);
    expect(compareResults(a, rs(["x"], [[0]]), false).equal).toBe(false);
  });
});

describe("result comparison", () => {
  it("compares rows as a multiset when order does not matter", () => {
    const a = rs(["r"], [["N"], ["S"]]);
    const b = rs(["r"], [["S"], ["N"]]);
    expect(compareResults(a, b, false).equal).toBe(true);
  });

  it("does not collapse duplicates into a set", () => {
    // A Set would call these equal. Duplicates have to match in number.
    const a = rs(["r"], [["N"], ["N"]]);
    const b = rs(["r"], [["N"]]);
    expect(compareResults(a, b, false).equal).toBe(false);
  });

  it("keeps duplicate counts significant even when the bag matches otherwise", () => {
    const a = rs(["r"], [["N"], ["N"], ["S"]]);
    const b = rs(["r"], [["N"], ["S"], ["S"]]);
    expect(compareResults(a, b, false).equal).toBe(false);
  });

  it("enforces row order when orderMatters is true", () => {
    const a = rs(["r"], [["N"], ["S"]]);
    const b = rs(["r"], [["S"], ["N"]]);
    expect(compareResults(a, b, true).equal).toBe(false);
    expect(compareResults(a, b, true).reason).toBe("row-order");
  });

  it("always compares column order", () => {
    const a = rs(["region", "total"], [["N", 1]]);
    const b = rs(["total", "region"], [["N", 1]]);
    expect(compareResults(a, b, false).equal).toBe(false);
    expect(compareResults(a, b, false).reason).toBe("column-names");
  });

  it("accepts a differently spelled but equivalent column label", () => {
    const a = rs(["SUM( amount )"], [[10]]);
    const b = rs(["sum(amount)"], [[10]]);
    expect(compareResults(a, b, false).equal).toBe(true);
  });
});

/* --------------------------------- seeding -------------------------------- */

describe("table set validation, rule 9", () => {
  it("accepts a good table", () => {
    expect(validateTableSet(db)).toEqual([]);
  });

  it("rejects a row whose width does not match the columns", () => {
    const bad: TableSet = {
      tables: [{ name: "t", cols: ["a", "b"], rows: [[1]] }],
    };
    expect(validateTableSet(bad)[0].message).toMatch(/1 value/);
  });

  it("rejects duplicate table and column names", () => {
    const dupCols: TableSet = {
      tables: [{ name: "t", cols: ["a", "a"], rows: [[1, 2]] }],
    };
    expect(validateTableSet(dupCols).some((p) => /duplicate column/.test(p.message))).toBe(
      true,
    );
  });

  it("rejects an identifier that is not a safe bare word", () => {
    const bad: TableSet = {
      tables: [{ name: "my table", cols: ["a"], rows: [[1]] }],
    };
    expect(validateTableSet(bad).some((p) => /safe bare identifier/.test(p.message))).toBe(
      true,
    );
  });

  it("rejects a value that is not string, number or null", () => {
    const bad = {
      tables: [
        { name: "t", cols: ["a"], rows: [[true as unknown as string]] },
      ],
    } as TableSet;
    expect(validateTableSet(bad).some((p) => /Only string, number and null/.test(p.message))).toBe(
      true,
    );
  });

  it("binds values rather than interpolating them", () => {
    const tricky: TableSet = {
      tables: [{ name: "t", cols: ["a"], rows: [["it's; DROP TABLE t; --"]] }],
    };
    const plan = buildSeed(tricky);
    expect(plan.inserts[0].sql).toContain("?");
    expect(plan.inserts[0].sql).not.toContain("DROP");
  });
});

/* ------------------------------ clause hint ------------------------------- */

describe("active clause", () => {
  const clauses = [
    { kw: "SELECT", label: "what", tint: "return" as const },
    { kw: "FROM", label: "where", tint: "search" as const },
    { kw: "GROUP BY", label: "groups", tint: "test" as const },
  ];

  it("reports the clause the caret sits in", () => {
    const sql = "SELECT region\nFROM orders\nGROUP BY region";
    expect(activeClauseAt(sql, 3, clauses)).toBe("SELECT");
    expect(activeClauseAt(sql, sql.indexOf("orders") + 2, clauses)).toBe("FROM");
    expect(activeClauseAt(sql, sql.length, clauses)).toBe("GROUP BY");
  });

  it("does not match a clause inside a string", () => {
    const sql = "SELECT 'GROUP BY' FROM orders";
    expect(activeClauseAt(sql, sql.length, clauses)).toBe("FROM");
  });
});

/* --------------------------- end-to-end grading --------------------------- */

describe("grading through the real engine", () => {
  const spec = {
    canonical: "SELECT region, SUM(amount) AS total FROM orders GROUP BY region",
    mustUse: ["GROUP BY"],
    orderMatters: false,
  };

  it("accepts a differently written but equivalent query", async () => {
    const g = await gradeQueryNode(
      db,
      "SELECT region, sum( amount ) AS total FROM orders GROUP BY region ORDER BY region DESC",
      spec,
    );
    expect(g.kind).toBe("correct");
  });

  it("refuses an answer that skips the required clause", async () => {
    const g = await gradeQueryNode(
      db,
      "SELECT 'GROUP BY' AS region, SUM(amount) AS total FROM orders",
      spec,
    );
    expect(g.kind).not.toBe("correct");
  });

  it("marks the classic missing GROUP BY as wrong", async () => {
    const g = await gradeQueryNode(
      db,
      "SELECT region, SUM(amount) AS total FROM orders",
      spec,
    );
    expect(g.kind).toBe("missing-clause");
  });
});

/* ------------------- the lesson content, through the engine ---------------- */

/**
 * These run against the real lesson datasets rather than a fixture, so they
 * fail if the content moves underneath them. The validator already proves
 * every canonical runs and every reject is refused; what it does not prove is
 * the specific behaviours BRIEF.md section 13 asks to be verified by hand:
 * ordering both ways, INNER against LEFT, NULL aggregation, aliases, and a
 * subquery that a hardcoded number could have faked.
 */
describe("SQL lessons, the behaviours the brief asks to see verified", () => {
  const lesson = (id: string) => {
    const l = SQL_LESSONS.find((x) => x.id === id);
    if (!l) throw new Error(`no lesson ${id}`);
    return l;
  };

  describe("result ordering, proved in both directions", () => {
    it("fails a correct set of rows in the wrong order where ordering is taught", async () => {
      const l = lesson("order-by-limit");
      const ex = l.exercises[1];
      expect(ex.orderMatters).toBe(true);
      // Sorted the wrong way rather than not sorted, so mustUse is satisfied
      // and the ordering rule is the only thing left that can fail it.
      const sql =
        "SELECT name, revenue FROM products WHERE category = 'kitchen' ORDER BY revenue";
      const g = await gradeQueryNode(l.db, sql, ex);
      expect(g.kind).toBe("wrong");
      expect(g.kind === "wrong" && g.detail).toBeUndefined();

      // The same query against the same rows passes once ordering stops
      // counting, which isolates the order as the only difference.
      const loosened = await gradeQueryNode(l.db, sql, {
        ...ex,
        orderMatters: false,
      });
      expect(loosened.kind).toBe("correct");
    });

    it("passes the same rows in a different order where ordering is not taught", async () => {
      const l = lesson("group-by");
      const ex = l.exercises[2];
      expect(ex.orderMatters).toBe(false);
      const g = await gradeQueryNode(
        l.db,
        "SELECT region, MAX(amount) AS biggest FROM orders GROUP BY region ORDER BY region DESC",
        ex,
      );
      expect(g.kind).toBe("correct");
    });

    it("settles a tie with the second sort column rather than leaving it to the engine", async () => {
      const l = lesson("order-by-limit");
      const untied = await runQueryNode(
        l.db,
        "SELECT name, units FROM products ORDER BY units DESC",
      );
      const tied = await runQueryNode(
        l.db,
        "SELECT name, units FROM products ORDER BY units DESC, name DESC",
      );
      if (!untied.ok || !tied.ok) throw new Error("query failed");
      // Two products sit on 120 units, so the two orders genuinely differ.
      expect(untied.result.rows).not.toEqual(tied.result.rows);
    });
  });

  describe("INNER JOIN against LEFT JOIN", () => {
    const l = () => lesson("inner-join");

    it("drops the order whose customer does not exist", async () => {
      const inner = await runQueryNode(l().db, l().build.canonical);
      const left = await runQueryNode(
        l().db,
        "SELECT customers.name, orders.amount FROM orders LEFT JOIN customers ON orders.customer_id = customers.id",
      );
      if (!inner.ok || !left.ok) throw new Error("query failed");
      expect(inner.result.rows).toHaveLength(5);
      expect(left.result.rows).toHaveLength(6);
      expect(left.result.rows.some((r) => r[0] === null)).toBe(true);
    });

    it("drops the customer who has never ordered", async () => {
      const out = await runQueryNode(l().db, l().build.canonical);
      if (!out.ok) throw new Error("query failed");
      expect(out.result.rows.some((r) => r[0] === "Brightsmith")).toBe(false);
    });

    it("accepts the join written with table aliases and the tables the other way round", async () => {
      const g = await gradeQueryNode(
        l().db,
        "SELECT c.name, o.amount FROM customers c JOIN orders o ON o.customer_id = c.id",
        l().build,
      );
      expect(g.kind).toBe("correct");
    });
  });

  describe("aggregating a column that has NULLs in it", () => {
    const l = () => lesson("aggregates");

    it("counts rows and counted values as different numbers", async () => {
      const out = await runQueryNode(l().db, l().build.canonical);
      if (!out.ok) throw new Error("query failed");
      expect(out.result.rows).toEqual([[8, 5]]);
    });

    it("leaves NULLs out of AVG on both sides of the division", async () => {
      const out = await runQueryNode(
        l().db,
        "SELECT AVG(rating) AS a, SUM(rating) AS b, COUNT(rating) AS c FROM tickets",
      );
      if (!out.ok) throw new Error("query failed");
      // 18 / 5, not 18 / 8. The three unrated tickets are absent from both.
      expect(out.result.rows).toEqual([[3.6, 18, 5]]);
    });

    it("marks a hand-worked average wrong, because it divides by every row", async () => {
      const ex = l().exercises[1];
      const sql = "SELECT SUM(rating) / COUNT(*) AS average_rating FROM tickets";

      // mustUse is checked first, so this is what the learner is told.
      const g = await gradeQueryNode(l().db, sql, ex);
      expect(g.kind).toBe("missing-clause");

      // It is also a different number, so the dataset would have caught it on
      // its own. 18 / 8 in whole-number division is 2, and AVG gives 3.6.
      const bare = await gradeQueryNode(l().db, sql, { ...ex, mustUse: undefined });
      expect(bare.kind).toBe("wrong");
    });
  });

  describe("aliases on computed columns", () => {
    const l = () => lesson("aggregates");

    it("accepts an alias that differs only in case and spacing", async () => {
      const g = await gradeQueryNode(
        l().db,
        "SELECT count(*) AS TICKETS, count( rating ) AS Rated FROM tickets",
        l().build,
      );
      expect(g.kind).toBe("correct");
    });

    it("rejects the alias the prompt asked for being spelled differently", async () => {
      const g = await gradeQueryNode(
        l().db,
        "SELECT COUNT(*) AS total, COUNT(rating) AS rated FROM tickets",
        l().build,
      );
      expect(g.kind).toBe("wrong");
    });

    it("says which column came back wrong without giving the answer away", async () => {
      const g = await gradeQueryNode(
        l().db,
        "SELECT COUNT(*) AS total, COUNT(rating) AS rated FROM tickets",
        l().build,
      );
      expect(g.kind === "wrong" && g.detail).toContain("total");
      expect(g.kind === "wrong" && g.detail).not.toContain("tickets");
    });
  });

  describe("subqueries", () => {
    const l = () => lesson("subqueries");

    it("computes the threshold rather than trusting a typed-in number", async () => {
      const out = await runQueryNode(
        l().db,
        "SELECT AVG(amount) AS a FROM orders",
      );
      if (!out.ok) throw new Error("query failed");
      expect(out.result.rows).toEqual([[1010]]);
    });

    it("refuses a hardcoded threshold that returns exactly the right rows", async () => {
      const spec = l().build;
      const hardcoded = "SELECT customer, amount FROM orders WHERE amount > 1012";
      // It really does return the right rows. Only mustUse stands between it
      // and being accepted, which is the point of requiring AVG here.
      const bare = await gradeQueryNode(l().db, hardcoded, {
        ...spec,
        mustUse: undefined,
      });
      expect(bare.kind).toBe("correct");
      const graded = await gradeQueryNode(l().db, hardcoded, spec);
      expect(graded.kind).toBe("missing-clause");
    });

    it("does not count AVG inside a comment or a string as using it", async () => {
      const spec = l().build;
      const g = await gradeQueryNode(
        l().db,
        "SELECT customer, amount FROM orders WHERE amount > 1012 -- AVG(amount)",
        spec,
      );
      expect(g.kind).toBe("missing-clause");
    });

    it("keeps every order from a matched region, not only the big ones", async () => {
      const ex = l().exercises[1];
      const out = await runQueryNode(l().db, ex.canonical);
      if (!out.ok) throw new Error("query failed");
      expect(out.result.rows).toHaveLength(5);
    });
  });
});
