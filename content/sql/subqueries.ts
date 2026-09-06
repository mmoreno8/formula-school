import type { SqlLesson, TableSet } from "@/lib/schema";

/**
 * The dataset is built to expose the mistakes, not hide them. BRIEF.md, the
 * SQL validator section.
 *
 * - the eight amounts total 8080, so the average is 1010 and lands between two
 *   real orders. The 1000 order sits just under it, which is what makes the
 *   average worth computing rather than eyeballing
 * - Nelson's order is exactly 1400, the threshold the guided exercise uses, so
 *   `> 1400` and `>= 1400` bring back different regions
 * - Waikato's largest order is exactly 1000, so a learner who hardcodes 1000
 *   in the free exercise gets the right rows and is still told to use MAX
 * - MAX and MIN are both unique, so the gaps exercise has exactly one answer
 */
const db: TableSet = {
  tables: [
    {
      name: "orders",
      cols: ["id", "customer", "region", "amount"],
      rows: [
        [3101, "Northwind", "Otago", 1250],
        [3102, "Kea Ltd", "Waikato", 620],
        [3103, "Halcyon", "Otago", 2110],
        [3104, "Brightsmith", "Auckland", 480],
        [3105, "Tuatara", "Waikato", 1000],
        [3106, "Fernway", "Otago", 930],
        [3107, "Pounamu", "Nelson", 1400],
        [3108, "Rimu Co", "Otago", 290],
      ],
    },
  ],
};

export const subqueries: SqlLesson = {
  track: "sql",
  id: "subqueries",
  name: "Subqueries",
  blurb: "Let one query work out the number the other one needs",
  group: "filtering",
  order: 8,
  db,
  shape:
    "SELECT which_columns_you_want\nFROM where_it_lives\nWHERE a_column > (SELECT one_value FROM where_it_lives);",
  clauses: [
    { kw: "SELECT", label: "which columns you want", tint: "return" },
    { kw: "FROM", label: "which table", tint: "search" },
    { kw: "WHERE", label: "which rows to keep", tint: "test" },
    { kw: "IN", label: "match against a list", tint: "lookup", optional: true },
  ],
  understand: {
    problem:
      "Somebody asks which orders are bigger than average. You know how to get the average and you know how to filter, and the problem is that you need the first answer before you can write the second. Working it out, reading the number and typing it into the next query gives you an answer that is right this morning and wrong by Friday. A subquery is that first query in brackets, run for you every time.",
  },
  build: {
    target:
      "The orders worth more than the average order. Show the customer and the amount.",
    starter: "SELECT customer, amount\nFROM orders\nWHERE amount > AVG(amount);",
    canonical:
      "SELECT customer, amount FROM orders WHERE amount > (SELECT AVG(amount) FROM orders);",
    mustUse: ["AVG"],
    orderMatters: false,
    hint: "Run the starter. SQLite refuses it, because WHERE decides about one row at a time and an average is a fact about all of them. The average has to be worked out separately, before the filtering starts.",
    hint2:
      "Put a whole SELECT in brackets on the right of the comparison. It has its own FROM and returns a single value, which is then what every row gets compared against.",
    explanation:
      "The bracketed query runs first, returns 1010, and the outer query compares each amount against it. Three orders clear it. The 1000 order missing out by ten is the reason this is worth doing properly rather than guessing a round number.",
    rejects: [
      // The average worked out by hand. Right rows today, wrong tomorrow.
      "SELECT customer, amount FROM orders WHERE amount > 1012;",
      // Compared the wrong way round.
      "SELECT customer, amount FROM orders WHERE amount < (SELECT AVG(amount) FROM orders);",
      // Averaged the wrong rows.
      "SELECT customer, amount FROM orders WHERE amount > (SELECT AVG(amount) FROM orders WHERE region = 'Waikato');",
      // No filter at all.
      "SELECT customer, amount FROM orders;",
    ],
  },
  exercises: [
    {
      id: "subqueries-gaps",
      type: "sql-gaps",
      prompt:
        "Fill the two gaps so this returns the single biggest order in the table. Show the customer and the amount.",
      template:
        "SELECT customer, amount\nFROM orders\nWHERE amount = ({0} {1}(amount) FROM orders);",
      gaps: [
        { accept: ["SELECT"], tint: "return", placeholder: "start a query" },
        { accept: ["MAX"], tint: "lookup", placeholder: "the biggest" },
      ],
      canonical:
        "SELECT customer, amount FROM orders WHERE amount = (SELECT MAX(amount) FROM orders);",
      mustUse: ["MAX"],
      orderMatters: false,
      hint: "What is in the brackets is a complete query of its own, so it starts with the same word every query starts with. The second gap is the function for the largest value in a column.",
      hint2:
        "The first gap is SELECT and the second is MAX. Together they work out one number, and the outer WHERE then looks for the row holding it.",
      explanation:
        "The subquery returns 2110 and the outer query finds the order with that amount. Notice this returns the whole row rather than only the number, which is what MAX on its own could never have given you.",
      rejects: [
        // The number read off the table by hand.
        "SELECT customer, amount FROM orders WHERE amount = 2110;",
        // A different route to the same row, and not the one this lesson teaches.
        "SELECT customer, amount FROM orders ORDER BY amount DESC LIMIT 1;",
        // The smallest instead of the largest.
        "SELECT customer, amount FROM orders WHERE amount = (SELECT MIN(amount) FROM orders);",
      ],
    },
    {
      id: "subqueries-guided",
      type: "sql-guided",
      prompt:
        "Your manager wants every order from the regions that have placed at least one order of 1400 or more. Show the customer, the region and the amount.",
      starter: "SELECT customer, region, amount\nFROM orders\nWHERE amount >= 1400;",
      showClauseHint: true,
      canonical:
        "SELECT customer, region, amount FROM orders WHERE region IN (SELECT region FROM orders WHERE amount >= 1400);",
      mustUse: ["IN"],
      orderMatters: false,
      hint: "The starter returns the two big orders themselves. The question asks for every order from those regions, including the small ones, so the big orders are how you find the regions rather than the answer.",
      hint2:
        "The subquery returns a list of regions rather than a single value, so the comparison is IN rather than =.",
      explanation:
        "The subquery returns Otago and Nelson, and the outer query then keeps every order from either, which is five rows. IN is what lets a subquery return more than one value. The 1400 order is exactly on the threshold, so >= is what keeps Nelson in the list at all.",
      rejects: [
        // The starter. The two big orders and nothing else.
        "SELECT customer, region, amount FROM orders WHERE amount >= 1400;",
        // The boundary. Nelson drops out and only Otago is left.
        "SELECT customer, region, amount FROM orders WHERE region IN (SELECT region FROM orders WHERE amount > 1400);",
        // Matched on the amount rather than the region.
        "SELECT customer, region, amount FROM orders WHERE amount IN (SELECT amount FROM orders WHERE amount >= 1400);",
        // No filter at all.
        "SELECT customer, region, amount FROM orders;",
      ],
    },
    {
      id: "subqueries-free",
      type: "sql-free",
      prompt:
        "Someone in finance asks which orders are bigger than every order Waikato has placed. Show the customer and the amount.",
      canonical:
        "SELECT customer, amount FROM orders WHERE amount > (SELECT MAX(amount) FROM orders WHERE region = 'Waikato');",
      mustUse: ["MAX"],
      orderMatters: false,
      hint: "Bigger than every one of them is the same as bigger than the biggest of them, and that turns a list into a single number the outer query can compare against.",
      hint2:
        "The subquery needs its own WHERE to narrow itself to Waikato before it takes the largest amount. Two WHERE clauses in one query, one inside the brackets and one outside.",
      explanation:
        "Waikato's largest order is 1000, so three orders clear it. Writing 1000 into the query yourself would give the same three rows today and quietly wrong ones the moment Waikato places a bigger order, which is the whole argument for subqueries in one sentence.",
      rejects: [
        // The right rows from a number typed in by hand.
        "SELECT customer, amount FROM orders WHERE amount > 1000;",
        // Smallest rather than largest.
        "SELECT customer, amount FROM orders WHERE amount > (SELECT MIN(amount) FROM orders WHERE region = 'Waikato');",
        // Forgot to narrow the subquery to Waikato. Nothing clears it.
        "SELECT customer, amount FROM orders WHERE amount > (SELECT MAX(amount) FROM orders);",
        // Returned Waikato's own orders instead.
        "SELECT customer, amount FROM orders WHERE region = 'Waikato';",
      ],
    },
  ],
  takeaways: [
    "A subquery is a query in brackets that runs first and hands its answer to the one around it",
    "Use = when the subquery returns one value and IN when it returns a list",
    "An aggregate cannot go in WHERE on its own, which is why the average or the maximum has to arrive as a subquery",
  ],
};
