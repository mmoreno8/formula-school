import type { SqlLesson, TableSet } from "@/lib/schema";

/**
 * The dataset is built to expose the mistakes, not hide them. BRIEF.md, the
 * SQL validator section.
 *
 * - Auckland and Nelson have exactly one order each, so a query that forgets
 *   GROUP BY still returns something that looks like a plausible answer
 * - the four regional totals are 5410, 2620, 560 and 1420, all distinct, so no
 *   wrong grouping can land on a right total by accident
 * - Otago appears four times and Waikato twice, so a query that groups by the
 *   wrong column returns a visibly different number of rows
 */
const db: TableSet = {
  tables: [
    {
      name: "orders",
      cols: ["id", "customer", "region", "amount"],
      rows: [
        [1042, "Northwind", "Otago", 1250],
        [1043, "Kea Ltd", "Waikato", 840],
        [1044, "Halcyon", "Otago", 2110],
        [1045, "Brightsmith", "Auckland", 560],
        [1046, "Tuatara", "Waikato", 1780],
        [1047, "Fernway", "Otago", 930],
        [1048, "Pounamu", "Nelson", 1420],
        [1049, "Rimu Co", "Otago", 1120],
      ],
    },
  ],
};

/**
 * Every computed column in this lesson is asked for by name in the prompt.
 *
 * BRIEF.md section 8: column names are compared, so where a lesson needs a
 * particular output name the prompt has to ask for it. Without that, a learner
 * who writes a perfectly good `AS total` fails against a canonical that did
 * not use one, which is the failure 5.1 exists to prevent.
 */
export const groupBy: SqlLesson = {
  track: "sql",
  id: "group-by",
  name: "GROUP BY",
  blurb: "One row per region instead of one per order",
  group: "grouping",
  order: 5,
  db,
  shape: "SELECT what_identifies_the_group, what_to_work_out\nFROM where_it_lives\nGROUP BY the_same_thing_again;",
  clauses: [
    { kw: "SELECT", label: "what identifies the group", tint: "return" },
    { kw: "FROM", label: "which table", tint: "search" },
    { kw: "GROUP BY", label: "the same thing again", tint: "test" },
  ],
  understand: {
    problem:
      "Your manager has a table with one row per order and wants one row per region. Not a filter, not a sort. Fewer rows come out than went in, with the amounts added up inside each one. That collapsing is what GROUP BY does, and it is the first thing in SQL with no spreadsheet equivalent you already know.",
  },
  build: {
    target:
      "Total sales for each region. Name the total column total.",
    starter: "SELECT region, SUM(amount) AS total\nFROM orders;",
    canonical:
      "SELECT region, SUM(amount) AS total FROM orders GROUP BY region;",
    mustUse: ["GROUP BY"],
    orderMatters: false,
    hint: "Run the starter query as it stands and look at what comes back. One row, when there are four regions in the table. SUM collapsed everything into a single total because nothing told it where one group ends and the next begins.",
    hint2: "The GROUP BY clause names the column that defines a group. Here that is region, the same column you are already selecting.",
    explanation:
      "GROUP BY region turned eight order rows into four region rows, and SUM ran once inside each one. The column you group by is almost always a column you also select, because otherwise you cannot tell which group a row belongs to.",
    rejects: [
      // The classic mistake: aggregate with no grouping. Returns one row.
      "SELECT region, SUM(amount) AS total FROM orders;",
      // Grouped by the wrong column. Returns eight rows.
      "SELECT region, SUM(amount) AS total FROM orders GROUP BY customer;",
      // No aggregation at all. Returns eight rows.
      "SELECT region, amount AS total FROM orders;",
      // Right shape, wrong column aggregated.
      "SELECT region, SUM(id) AS total FROM orders GROUP BY region;",
    ],
  },
  exercises: [
    {
      id: "group-by-gaps",
      type: "sql-gaps",
      prompt:
        "Fill the two gaps so this returns one row per region, with that region's orders added up.",
      template: "SELECT region, {0}(amount) AS total\nFROM orders\n{1} region;",
      gaps: [
        { accept: ["SUM"], tint: "return", placeholder: "add them up" },
        { accept: ["GROUP BY"], tint: "test", placeholder: "one row per what" },
      ],
      canonical:
        "SELECT region, SUM(amount) AS total FROM orders GROUP BY region;",
      mustUse: ["GROUP BY"],
      orderMatters: false,
      hint: "The first gap is the function that adds numbers together. The second is the clause that decides where one group stops and the next starts.",
      hint2: "The second gap is two words, and the column after it is region.",
      explanation:
        "SUM adds the amounts, and GROUP BY region decides which rows get added together. Take the GROUP BY away and SUM would add all eight orders into one number.",
      rejects: [
        "SELECT region, SUM(amount) AS total FROM orders;",
        "SELECT region, COUNT(amount) AS total FROM orders GROUP BY region;",
      ],
    },
    {
      id: "group-by-guided",
      type: "sql-guided",
      prompt:
        "Same idea, different question. How many orders did each region place? Name the count column orders_placed.",
      starter: "SELECT region,\nFROM orders;",
      showClauseHint: true,
      canonical:
        "SELECT region, COUNT(*) AS orders_placed FROM orders GROUP BY region;",
      mustUse: ["GROUP BY"],
      orderMatters: false,
      hint: "You are counting rows inside each group rather than adding a column up. The grouping part does not change at all.",
      hint2: "COUNT(*) counts the rows in the group. It goes in the SELECT list, and GROUP BY region goes after FROM orders.",
      explanation:
        "COUNT(*) counts rows rather than adding values, so it answers how many rather than how much. The GROUP BY is identical to the last one, which is the point: once the grouping is right, you can swap the function freely.",
      rejects: [
        "SELECT region, COUNT(*) AS orders_placed FROM orders;",
        "SELECT region, SUM(amount) AS orders_placed FROM orders GROUP BY region;",
      ],
    },
    {
      id: "group-by-free",
      type: "sql-free",
      prompt:
        "Someone in finance asks you: what is the biggest single order that came out of each region? Name that column biggest.",
      canonical:
        "SELECT region, MAX(amount) AS biggest FROM orders GROUP BY region;",
      mustUse: ["GROUP BY"],
      orderMatters: false,
      hint: "Biggest single order, not the total. There is a function for the largest value in a group, and it sits where SUM sat.",
      hint2: "MAX(amount) gives the largest amount inside each group. The rest of the query has the same shape as the two before it.",
      explanation:
        "MAX returns the largest value in each group rather than the total. Nelson's biggest order and Nelson's total are the same number, because Nelson only placed one order. That is worth noticing: a region with a single row makes the two questions look identical when they are not.",
      rejects: [
        "SELECT region, MAX(amount) AS biggest FROM orders;",
        "SELECT region, SUM(amount) AS biggest FROM orders GROUP BY region;",
        "SELECT region, amount AS biggest FROM orders;",
      ],
    },
  ],
  takeaways: [
    "Group rows into one row per value with GROUP BY, and read the result as a summary rather than a list",
    "Put an aggregate like SUM, COUNT or MAX in the SELECT list, and it runs once inside each group",
    "Notice when a group holds a single row, because that is where a wrong query looks right",
  ],
};
