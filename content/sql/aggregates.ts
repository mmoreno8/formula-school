import type { SqlLesson, TableSet } from "@/lib/schema";

/**
 * The dataset is built to expose the mistakes, not hide them. BRIEF.md, the
 * SQL validator section, which asks for a NULL in an aggregated column so
 * COUNT(col) and COUNT(*) differ.
 *
 * - three of the eight tickets have no rating, so COUNT(*) is 8 and
 *   COUNT(rating) is 5. Any query that reaches for the wrong one is off by
 *   three rather than off by nothing
 * - AVG(rating) is 3.6 and SUM(rating) / COUNT(*) is 2, so working the average
 *   out by hand gives a visibly different number. SQLite's integer division
 *   makes SUM(rating) / COUNT(rating) land on 3 rather than 3.6 as well
 * - one ticket took exactly 20 minutes, so `> 20` and `>= 20` disagree about
 *   both the count and the total
 * - minutes repeats at 8, so a duplicate exists for anyone comparing counts
 */
const db: TableSet = {
  tables: [
    {
      name: "tickets",
      cols: ["id", "customer", "agent", "minutes", "rating"],
      rows: [
        [1, "Northwind", "Ana", 12, 5],
        [2, "Kea Ltd", "Bo", 45, 3],
        [3, "Halcyon", "Ana", 30, null],
        [4, "Brightsmith", "Cy", 8, 4],
        [5, "Tuatara", "Bo", 20, null],
        [6, "Fernway", "Ana", 60, 2],
        [7, "Pounamu", "Cy", 15, 4],
        [8, "Rimu Co", "Bo", 8, null],
      ],
    },
  ],
};

/**
 * Every computed column in this lesson is asked for by name in the prompt.
 * BRIEF.md section 8: a required alias is never implied.
 */
export const aggregates: SqlLesson = {
  track: "sql",
  id: "aggregates",
  name: "COUNT, SUM & AVG",
  blurb: "Turn a column of numbers into one number that answers the question",
  group: "grouping",
  order: 4,
  db,
  shape:
    "SELECT COUNT(*), SUM(which_column), AVG(which_column)\nFROM where_it_lives\nWHERE which_rows_to_include;",
  clauses: [
    { kw: "SELECT", label: "what to work out", tint: "return" },
    { kw: "FROM", label: "which table", tint: "search" },
    { kw: "WHERE", label: "which rows to include", tint: "test", optional: true },
  ],
  understand: {
    problem:
      "The support table has one row per ticket, and nobody wants to read eight rows. They want a number: how many tickets, how long they took, how happy people were. COUNT, SUM and AVG each collapse a column into a single answer. The catch is what they do with the rows where the value is missing, and that is where most wrong answers in this lesson come from.",
  },
  build: {
    target:
      "How many tickets there are, and how many of them have a rating. Name the columns tickets and rated.",
    starter: "SELECT COUNT(*) AS tickets, COUNT(*) AS rated\nFROM tickets;",
    canonical:
      "SELECT COUNT(*) AS tickets, COUNT(rating) AS rated FROM tickets;",
    mustUse: ["COUNT"],
    orderMatters: false,
    hint: "Run the starter and look at the two numbers. They are the same, and the tables panel shows three tickets with no rating at all. Both halves of the query are currently asking the same question.",
    hint2:
      "COUNT(*) counts rows. COUNT of a named column counts the rows where that column has a value, which is the second number you need.",
    explanation:
      "COUNT(*) counts every row and gives 8. COUNT(rating) skips the three tickets where the rating is missing and gives 5. The difference between them is the number of customers who never answered, which is often the more interesting figure.",
    rejects: [
      // The starter. Both columns count rows.
      "SELECT COUNT(*) AS tickets, COUNT(*) AS rated FROM tickets;",
      // Both columns skip the missing ratings.
      "SELECT COUNT(rating) AS tickets, COUNT(rating) AS rated FROM tickets;",
      // id is never missing, so counting it counts every row again.
      "SELECT COUNT(*) AS tickets, COUNT(id) AS rated FROM tickets;",
    ],
  },
  exercises: [
    {
      id: "aggregates-gaps",
      type: "sql-gaps",
      prompt:
        "Fill the two gaps so this returns the total time spent on tickets and the average time per ticket. The columns are already named total_minutes and average_minutes.",
      template:
        "SELECT {0}(minutes) AS total_minutes,\n       {1}(minutes) AS average_minutes\nFROM tickets;",
      gaps: [
        { accept: ["SUM"], tint: "return", placeholder: "add them up" },
        { accept: ["AVG"], tint: "lookup", placeholder: "the average" },
      ],
      canonical:
        "SELECT SUM(minutes) AS total_minutes, AVG(minutes) AS average_minutes FROM tickets;",
      mustUse: ["SUM", "AVG"],
      orderMatters: false,
      hint: "One gap adds every value in the column together. The other divides that total by how many values there were. The column names tell you which is which.",
      hint2:
        "The first is SUM and the second is AVG. Both take the column name in brackets.",
      explanation:
        "SUM adds the eight durations to 198 minutes and AVG divides by eight to give 24.75. AVG is not a rounded number here, and rounding it is a separate decision rather than something the function does for you.",
      rejects: [
        // Swapped.
        "SELECT AVG(minutes) AS total_minutes, SUM(minutes) AS average_minutes FROM tickets;",
        // The same function twice.
        "SELECT SUM(minutes) AS total_minutes, SUM(minutes) AS average_minutes FROM tickets;",
        // Counted the rows instead of adding the values.
        "SELECT COUNT(minutes) AS total_minutes, AVG(minutes) AS average_minutes FROM tickets;",
      ],
    },
    {
      id: "aggregates-guided",
      type: "sql-guided",
      prompt:
        "Your manager asks for the average rating customers actually gave. Name the column average_rating.",
      starter: "SELECT SUM(rating) / COUNT(*) AS average_rating\nFROM tickets;",
      showClauseHint: true,
      canonical: "SELECT AVG(rating) AS average_rating FROM tickets;",
      mustUse: ["AVG"],
      orderMatters: false,
      hint: "Run the starter. It returns 2, and the ratings in the table are 5, 3, 4, 2 and 4. No arrangement of those numbers averages 2. The bottom of that division is counting people who never rated anything.",
      hint2:
        "There is a function that does this in one step, and it leaves the missing ratings out of both the total and the count.",
      explanation:
        "AVG(rating) gives 3.6 because it ignores the three tickets with no rating on both sides of the division. The starter divided by eight instead of five, and SQLite's whole-number division then flattened the result to 2. Working an average out by hand is where this goes wrong.",
      rejects: [
        // The starter. Divided by every ticket.
        "SELECT SUM(rating) / COUNT(*) AS average_rating FROM tickets;",
        // Right rows on both sides, but whole-number division loses the 0.6.
        "SELECT SUM(rating) / COUNT(rating) AS average_rating FROM tickets;",
        // Averaged the wrong column.
        "SELECT AVG(minutes) AS average_rating FROM tickets;",
      ],
    },
    {
      id: "aggregates-free",
      type: "sql-free",
      prompt:
        "Someone reviewing the queue asks how many tickets took longer than 20 minutes, and how long those ones took in total. Name the columns slow_tickets and slow_minutes.",
      canonical:
        "SELECT COUNT(*) AS slow_tickets, SUM(minutes) AS slow_minutes FROM tickets WHERE minutes > 20;",
      mustUse: ["COUNT", "SUM", "WHERE"],
      orderMatters: false,
      hint: "Two numbers about the same set of rows, so the filter is written once and both functions work on what survives it.",
      hint2:
        "WHERE narrows the rows before COUNT and SUM run. Longer than 20 is > 20, and the ticket that took exactly 20 minutes is not longer than 20.",
      explanation:
        "Three tickets took longer than 20 minutes, adding up to 135. The 20 minute ticket sits exactly on the boundary, so >= would have given you four tickets and 155 minutes instead. WHERE runs first, which is what makes both numbers agree about which rows they are describing.",
      rejects: [
        // No filter at all.
        "SELECT COUNT(*) AS slow_tickets, SUM(minutes) AS slow_minutes FROM tickets;",
        // The boundary ticket pulled in.
        "SELECT COUNT(*) AS slow_tickets, SUM(minutes) AS slow_minutes FROM tickets WHERE minutes >= 20;",
        // Counted and added the wrong things.
        "SELECT SUM(minutes) AS slow_tickets, COUNT(*) AS slow_minutes FROM tickets WHERE minutes > 20;",
      ],
    },
  ],
  takeaways: [
    "COUNT(*) counts rows and COUNT(column) counts the rows where that column has a value, so a missing value makes them different numbers",
    "SUM and AVG skip missing values too, which is why AVG is not the same as your own total divided by the row count",
    "Put WHERE before the aggregate and it decides which rows are counted or added in the first place",
  ],
};
