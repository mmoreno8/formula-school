import type { SqlLesson, TableSet } from "@/lib/schema";

/**
 * The dataset is built to expose the mistakes, not hide them. BRIEF.md, the
 * SQL validator section, which asks for ties in any column an ORDER BY lesson
 * sorts on.
 *
 * - revenue is distinct on every row, so the Build and the guided exercise
 *   have exactly one right order and a correct learner can never be failed by
 *   an ambiguous sort
 * - units ties at 120 between Kea mug and Weka cap, and the tie sits outside
 *   the window the gaps exercise returns. The free exercise is the one that
 *   meets it, and it asks for the second sort column that settles it
 * - the natural table order puts Kea mug before Weka cap, so a query that
 *   leaves the tie unresolved comes back in a visibly different order
 *
 * This is the one lesson in the track where `orderMatters` is true, so every
 * exercise here is also the test that ordering is graded at all.
 */
const db: TableSet = {
  tables: [
    {
      name: "products",
      cols: ["id", "name", "category", "units", "revenue"],
      rows: [
        [1, "Kea mug", "kitchen", 120, 1440],
        [2, "Tui bottle", "outdoor", 95, 2375],
        [3, "Rimu board", "kitchen", 60, 1800],
        [4, "Weka cap", "outdoor", 120, 960],
        [5, "Kowhai tee", "apparel", 45, 675],
        [6, "Pounamu pin", "apparel", 210, 840],
        [7, "Manuka soap", "kitchen", 75, 1125],
        [8, "Totara pack", "outdoor", 30, 1500],
      ],
    },
  ],
};

export const orderByLimit: SqlLesson = {
  track: "sql",
  id: "order-by-limit",
  name: "ORDER BY & LIMIT",
  blurb: "Put the rows in an order that means something, then take the top few",
  group: "reading",
  order: 2,
  db,
  shape:
    "SELECT which_columns_you_want\nFROM where_it_lives\nORDER BY what_to_sort_by\nLIMIT how_many_rows;",
  clauses: [
    { kw: "SELECT", label: "which columns you want", tint: "return" },
    { kw: "FROM", label: "which table", tint: "search" },
    { kw: "WHERE", label: "which rows to keep", tint: "test", optional: true },
    { kw: "ORDER BY", label: "what to sort by", tint: "lookup" },
    { kw: "LIMIT", label: "how many rows to keep", tint: "plain" },
  ],
  understand: {
    problem:
      "Rows come back in whatever order the database found them, which is no order at all. Every time someone asks for the best sellers, the slowest tickets or the ten biggest invoices, they are asking two questions at once: sort it by something, then cut the list short. ORDER BY does the sorting and LIMIT does the cutting, in that order.",
  },
  build: {
    target:
      "The three products that brought in the most revenue, biggest first. Show the name and the revenue.",
    starter:
      "SELECT name, revenue\nFROM products\nORDER BY revenue\nLIMIT 3;",
    canonical:
      "SELECT name, revenue FROM products ORDER BY revenue DESC LIMIT 3;",
    mustUse: ["ORDER BY", "LIMIT"],
    orderMatters: true,
    hint: "Run the starter and look at the three products it gives you. Those are the three worst sellers, not the three best. Sorting has a direction and the starter is going the wrong way.",
    hint2:
      "ORDER BY sorts smallest first unless you say otherwise. DESC after the column name turns it around.",
    explanation:
      "DESC sorts biggest first, and LIMIT 3 then cuts the sorted list to three rows. The order matters here: the database sorts everything first and takes the top of that, which is why LIMIT on its own would have handed you three arbitrary products.",
    rejects: [
      // The starter. Sorted the wrong way, so the worst three come back.
      "SELECT name, revenue FROM products ORDER BY revenue LIMIT 3;",
      // Sorted on the wrong column.
      "SELECT name, revenue FROM products ORDER BY units DESC LIMIT 3;",
      // Sorted correctly, never cut short.
      "SELECT name, revenue FROM products ORDER BY revenue DESC;",
      // Cut short without sorting, so the top three are whatever came first.
      "SELECT name, revenue FROM products LIMIT 3;",
    ],
  },
  exercises: [
    {
      id: "order-by-limit-gaps",
      type: "sql-gaps",
      prompt:
        "Fill the two gaps so this returns the four products that sold the fewest units, fewest first.",
      template: "SELECT name, units\nFROM products\n{0} units\nLIMIT {1};",
      gaps: [
        { accept: ["ORDER BY"], tint: "lookup", placeholder: "sort by what" },
        { accept: ["4"], tint: "plain", placeholder: "how many" },
      ],
      canonical: "SELECT name, units FROM products ORDER BY units LIMIT 4;",
      mustUse: ["ORDER BY", "LIMIT"],
      orderMatters: true,
      hint: "The first gap is the two-word clause that sorts. The second is a number, and the question tells you which one.",
      hint2:
        "Fewest first is the direction ORDER BY already uses, so no DESC is needed here. The second gap is 4.",
      explanation:
        "ORDER BY units sorts smallest first without being asked, and LIMIT 4 takes the top of that list. The two products tied on 120 units are nowhere near this window, which is why the answer is never in doubt.",
      rejects: [
        "SELECT name, units FROM products ORDER BY units DESC LIMIT 4;",
        "SELECT name, units FROM products LIMIT 4;",
        "SELECT name, units FROM products ORDER BY units;",
      ],
    },
    {
      id: "order-by-limit-guided",
      type: "sql-guided",
      prompt:
        "The kitchen buyer wants their own products ranked, biggest revenue first. No cut-off, they want all of them. Show the name and the revenue.",
      starter: "SELECT name, revenue\nFROM products\nWHERE category = 'kitchen';",
      showClauseHint: true,
      canonical:
        "SELECT name, revenue FROM products WHERE category = 'kitchen' ORDER BY revenue DESC;",
      mustUse: ["ORDER BY"],
      orderMatters: true,
      hint: "The starter already picks the right three products. Run it and read the revenue column downwards: 1440, then 1800, then 1125. That is not ranked.",
      hint2:
        "ORDER BY goes after WHERE, and DESC after the column puts the biggest at the top.",
      explanation:
        "The rows were right from the start and the order was not, which is the whole point of this one. A result with the correct rows in a meaningless order is still the wrong answer when somebody asked for a ranking.",
      rejects: [
        // Correct rows, unordered. This is the answer that proves ordering is graded.
        "SELECT name, revenue FROM products WHERE category = 'kitchen';",
        "SELECT name, revenue FROM products WHERE category = 'kitchen' ORDER BY revenue;",
        "SELECT name, revenue FROM products ORDER BY revenue DESC;",
      ],
    },
    {
      id: "order-by-limit-free",
      type: "sql-free",
      prompt:
        "Someone in the warehouse wants a picking list: every product, most units first, and where two products sold the same number of units they want the one later in the alphabet first. Show the name and the units.",
      canonical: "SELECT name, units FROM products ORDER BY units DESC, name DESC;",
      mustUse: ["ORDER BY"],
      orderMatters: true,
      hint: "Two products sold 120 units each. Sorting on units alone leaves the database to pick between them, and the warehouse has told you which one they want first.",
      hint2:
        "ORDER BY takes a list of columns separated by commas. The second column is only consulted when the first one ties, and each column carries its own direction.",
      explanation:
        "ORDER BY units DESC, name DESC sorts on units and falls back to the name when units tie, so Weka cap comes before Kea mug. Without that second column the order between the two is whatever the database happened to do, which is not something to build a picking list on.",
      rejects: [
        // The tie left unresolved. Kea mug comes back before Weka cap.
        "SELECT name, units FROM products ORDER BY units DESC;",
        // Tie broken the other way.
        "SELECT name, units FROM products ORDER BY units DESC, name;",
        "SELECT name, units FROM products ORDER BY units, name DESC;",
      ],
    },
  ],
  takeaways: [
    "Sort with ORDER BY, and add DESC when you want the biggest first, because the default is smallest first",
    "LIMIT cuts the list after the sort, so a top ten is ORDER BY first and LIMIT second",
    "Add a second sort column wherever values tie, or the order between tied rows is left to the database",
  ],
};
