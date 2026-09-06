import type { SqlLesson, TableSet } from "@/lib/schema";

/**
 * The dataset is built to expose the mistakes, not hide them. BRIEF.md, the
 * SQL validator section.
 *
 * - four Auckland orders and four that are not, so `city != 'Auckland'` comes
 *   back with the same row count as the right answer and only the values give
 *   it away
 * - three orders sit at exactly 500, so `> 500` and `>= 500` are one row
 *   against four rather than a difference nobody notices
 * - two Auckland orders are pending, so the AND exercise has a real answer
 *   rather than a single row that could have come from either condition
 */
const db: TableSet = {
  tables: [
    {
      name: "orders",
      cols: ["id", "customer", "city", "status", "amount"],
      rows: [
        [1041, "Northwind", "Auckland", "paid", 420],
        [1042, "Kea Ltd", "Wellington", "paid", 180],
        [1043, "Halcyon", "Auckland", "pending", 950],
        [1044, "Brightsmith", "Christchurch", "paid", 500],
        [1045, "Tuatara", "Auckland", "paid", 500],
        [1046, "Fernway", "Wellington", "pending", 240],
        [1047, "Pounamu", "Auckland", "pending", 75],
        [1048, "Rimu Co", "Christchurch", "paid", 500],
      ],
    },
  ],
};

export const selectWhere: SqlLesson = {
  track: "sql",
  id: "select-where",
  name: "SELECT & WHERE",
  blurb: "Pick the columns you want and drop the rows you do not",
  group: "reading",
  order: 1,
  db,
  shape:
    "SELECT which_columns_you_want\nFROM where_it_lives\nWHERE which_rows_to_keep;",
  clauses: [
    { kw: "SELECT", label: "which columns you want", tint: "return" },
    { kw: "FROM", label: "which table", tint: "search" },
    { kw: "WHERE", label: "which rows to keep", tint: "test" },
  ],
  understand: {
    problem:
      "The sales table holds every order the company has taken, and someone has asked you for the Auckland ones. Scrolling through it and picking by eye is where mistakes come from. A query says three things instead: which columns you want, which table they live in, and which rows are worth keeping.",
  },
  build: {
    target: "The customer and the amount for every Auckland order.",
    starter: "SELECT customer, amount\nFROM orders;",
    canonical:
      "SELECT customer, amount FROM orders WHERE city = 'Auckland';",
    mustUse: ["WHERE"],
    orderMatters: false,
    hint: "Run the starter as it stands and count what comes back. Eight rows, when only some of those orders are from Auckland. Nothing in the query has told the database which rows to throw away.",
    hint2:
      "WHERE goes after FROM, and the condition compares the city column against the text Auckland. Text values need single quotes around them.",
    explanation:
      "WHERE runs before anything reaches you, so the four Auckland rows are the only ones that arrive. The comparison is exact, which is why 'auckland' in lower case would match nothing at all.",
    rejects: [
      // No filter. Eight rows instead of four.
      "SELECT customer, amount FROM orders;",
      // The same row count as the answer, and none of the same rows.
      "SELECT customer, amount FROM orders WHERE city != 'Auckland';",
      // Text comparison is case sensitive, so this returns nothing.
      "SELECT customer, amount FROM orders WHERE city = 'auckland';",
      // Right rows, wrong columns.
      "SELECT city, amount FROM orders WHERE city = 'Auckland';",
    ],
  },
  exercises: [
    {
      id: "select-where-gaps",
      type: "sql-gaps",
      prompt:
        "Fill the two gaps so this returns only the orders that are still pending.",
      template: "SELECT customer, status\nFROM orders\n{0} status = {1};",
      gaps: [
        { accept: ["WHERE"], tint: "test", placeholder: "which rows" },
        { accept: ["'pending'"], tint: "lookup", placeholder: "which status" },
      ],
      canonical:
        "SELECT customer, status FROM orders WHERE status = 'pending';",
      mustUse: ["WHERE"],
      orderMatters: false,
      hint: "The first gap is the clause that decides which rows survive. The second is the value the status column is being compared against.",
      hint2:
        "The second gap is a piece of text rather than a column, so it needs single quotes around it.",
      explanation:
        "WHERE status = 'pending' keeps the three pending rows and drops the other five. The quotes are what tell SQLite this is text rather than the name of a column.",
      rejects: [
        "SELECT customer, status FROM orders;",
        "SELECT customer, status FROM orders WHERE status = 'paid';",
      ],
    },
    {
      id: "select-where-guided",
      type: "sql-guided",
      prompt:
        "Same table, different question. Your manager wants every order worth 500 or more, with the customer and the amount.",
      starter: "SELECT customer, amount\nFROM orders\nWHERE amount > 500;",
      showClauseHint: true,
      canonical: "SELECT customer, amount FROM orders WHERE amount >= 500;",
      mustUse: ["WHERE"],
      orderMatters: false,
      hint: "Run the starter and count the rows. One comes back, when three orders sit at exactly 500. The comparison is throwing away everything equal to the number.",
      hint2:
        "Greater than is >. Greater than or equal to is >=, and that is the one that keeps the rows sitting exactly on 500.",
      explanation:
        "Changing > to >= brings in the three orders worth exactly 500, so four rows come back instead of one. Boundaries are where filters go wrong most often, so it is worth asking whether the number itself belongs in the answer.",
      rejects: [
        "SELECT customer, amount FROM orders WHERE amount > 500;",
        "SELECT customer, amount FROM orders WHERE amount = 500;",
        "SELECT customer, amount FROM orders;",
      ],
    },
    {
      id: "select-where-free",
      type: "sql-free",
      prompt:
        "Someone in the Auckland office asks which of their orders are still waiting to be paid. Show the customer and the amount.",
      canonical:
        "SELECT customer, amount FROM orders WHERE city = 'Auckland' AND status = 'pending';",
      mustUse: ["WHERE", "AND"],
      orderMatters: false,
      hint: "Two things have to be true about a row at the same time: which city it came from and what its status is. There is a keyword that joins two conditions.",
      hint2:
        "AND puts both conditions inside one WHERE. Each side is its own comparison, and both compare against text in single quotes.",
      explanation:
        "AND keeps only the rows where both comparisons hold, which is two orders. Swap it for OR and five rows come back, because a row then only has to satisfy one side.",
      rejects: [
        "SELECT customer, amount FROM orders WHERE city = 'Auckland';",
        "SELECT customer, amount FROM orders WHERE status = 'pending';",
        "SELECT customer, amount FROM orders WHERE city = 'Auckland' OR status = 'pending';",
      ],
    },
  ],
  takeaways: [
    "Name the columns you want after SELECT and the table they live in after FROM",
    "Narrow the rows with WHERE, and remember text comparisons are exact, so Auckland and auckland are different values",
    "Check the boundary, because > and >= disagree on every row sitting exactly on the number",
  ],
};
