import type { SqlLesson, TableSet } from "@/lib/schema";

/**
 * The dataset is built to expose the mistakes, not hide them. BRIEF.md, the
 * SQL validator section.
 *
 * - one order sits at exactly 1000 and another at exactly 800, which are the
 *   two thresholds the lesson uses. `>` and `>=` disagree at both, so a
 *   boundary mistake is a wrong label rather than an invisible one
 * - the bands split four and four at the Build threshold, so a query that
 *   inverts the labels returns the right shape and the wrong answer
 * - 2110 clears both the high and the mid test, so putting the branches in the
 *   wrong order mislabels it and nothing else. That is the mistake CASE is
 *   most known for
 * - Otago has four orders and the other three regions have between one and two,
 *   so the home and away split is uneven enough to read at a glance
 */
const db: TableSet = {
  tables: [
    {
      name: "orders",
      cols: ["id", "customer", "region", "amount"],
      rows: [
        [2101, "Northwind", "Otago", 1250],
        [2102, "Kea Ltd", "Waikato", 800],
        [2103, "Halcyon", "Otago", 2110],
        [2104, "Brightsmith", "Auckland", 500],
        [2105, "Tuatara", "Waikato", 1000],
        [2106, "Fernway", "Otago", 930],
        [2107, "Pounamu", "Nelson", 1420],
        [2108, "Rimu Co", "Otago", 200],
      ],
    },
  ],
};

/**
 * Every computed column in this lesson is asked for by name in the prompt.
 * BRIEF.md section 8: a required alias is never implied.
 */
export const caseWhen: SqlLesson = {
  track: "sql",
  id: "case-when",
  name: "CASE WHEN",
  blurb: "Turn a number into a word people can actually read",
  group: "reading",
  order: 7,
  db,
  shape:
    "SELECT a_column,\n       CASE WHEN a_test THEN a_label\n            ELSE another_label\n       END AS what_to_call_it\nFROM where_it_lives;",
  clauses: [
    { kw: "SELECT", label: "which columns you want", tint: "return" },
    { kw: "CASE WHEN", label: "the condition to test", tint: "test" },
    { kw: "THEN", label: "the label to give it", tint: "lookup" },
    { kw: "ELSE", label: "everything that did not match", tint: "plain" },
    { kw: "END", label: "close the case", tint: "plain" },
    { kw: "FROM", label: "which table", tint: "search" },
  ],
  understand: {
    problem:
      "Nobody outside finance wants to read a column of amounts. They want to know which orders are big ones. That means turning a number into a word, and doing it inside the query rather than in a spreadsheet afterwards, so the rule lives somewhere everyone can see it. CASE WHEN is how SQL writes if this then that.",
  },
  build: {
    target:
      "Each order labelled by size. Anything of 1000 or more is large and everything else is small. Show the customer and the label, and name the label column size.",
    starter: "SELECT customer, amount\nFROM orders;",
    canonical:
      "SELECT customer, CASE WHEN amount >= 1000 THEN 'large' ELSE 'small' END AS size FROM orders;",
    mustUse: ["CASE"],
    orderMatters: false,
    hint: "The starter gives you the raw amounts, which is what you were asked to replace. The label is worked out from the amount rather than stored anywhere, so it has to be built in the SELECT list.",
    hint2:
      "The shape is CASE WHEN a test THEN a value ELSE another value END, and the whole thing gets an alias the way any computed column does.",
    explanation:
      "Four orders are large and four are small. The 1000 order is the one to watch: the question said 1000 or more, so it needs >= rather than >, and getting that wrong changes exactly one label.",
    rejects: [
      // No labelling at all.
      "SELECT customer, amount AS size FROM orders;",
      // The boundary. The 1000 order is called small.
      "SELECT customer, CASE WHEN amount > 1000 THEN 'large' ELSE 'small' END AS size FROM orders;",
      // Labels the right way round, applied the wrong way round.
      "SELECT customer, CASE WHEN amount >= 1000 THEN 'small' ELSE 'large' END AS size FROM orders;",
    ],
  },
  exercises: [
    {
      id: "case-when-gaps",
      type: "sql-gaps",
      prompt:
        "Fill the two gaps so every order is labelled home when it came from Otago and away when it did not. The label column is already named side.",
      template:
        "SELECT customer,\n       CASE {0} region = 'Otago' THEN 'home'\n            {1} 'away'\n       END AS side\nFROM orders;",
      gaps: [
        { accept: ["WHEN"], tint: "test", placeholder: "the test" },
        { accept: ["ELSE"], tint: "plain", placeholder: "otherwise" },
      ],
      canonical:
        "SELECT customer, CASE WHEN region = 'Otago' THEN 'home' ELSE 'away' END AS side FROM orders;",
      mustUse: ["CASE"],
      orderMatters: false,
      hint: "The first gap introduces the condition being tested. The second introduces what to do with every row that failed it.",
      hint2:
        "The first gap is the word that always follows CASE. The second is the catch-all branch, and it takes a value directly rather than a test.",
      explanation:
        "Four Otago orders come back as home and the other four as away. Without the ELSE branch the rows that fail the test get no label at all rather than away, which is the quiet way this goes wrong.",
      rejects: [
        "SELECT customer, region AS side FROM orders;",
        "SELECT customer, CASE WHEN region = 'Otago' THEN 'away' ELSE 'home' END AS side FROM orders;",
      ],
    },
    {
      id: "case-when-guided",
      type: "sql-guided",
      prompt:
        "Your manager wants three bands rather than two: high for 1500 and over, mid for 800 up to but not including 1500, and low for anything under 800. Show the customer and the band, and name the band column band.",
      starter:
        "SELECT customer,\n       CASE WHEN amount >= 1500 THEN 'high'\n            ELSE 'low'\n       END AS band\nFROM orders;",
      showClauseHint: true,
      canonical:
        "SELECT customer, CASE WHEN amount >= 1500 THEN 'high' WHEN amount >= 800 THEN 'mid' ELSE 'low' END AS band FROM orders;",
      mustUse: ["CASE"],
      orderMatters: false,
      hint: "The starter has two branches and the question asks for three. A CASE takes as many WHEN branches as you need before the ELSE.",
      hint2:
        "Add a second WHEN between the existing one and the ELSE. It only ever sees the rows that failed the first test, so its condition is amount >= 800 rather than a range with two ends.",
      explanation:
        "Branches are read top to bottom and the first one that matches wins, so the second WHEN only ever sees amounts under 1500 and does not need an upper bound of its own. Put the 800 test first and the 2110 order would come back as mid.",
      rejects: [
        // The starter. The mid band falls through to low.
        "SELECT customer, CASE WHEN amount >= 1500 THEN 'high' ELSE 'low' END AS band FROM orders;",
        // Branches in the wrong order. The biggest order is labelled mid.
        "SELECT customer, CASE WHEN amount >= 800 THEN 'mid' WHEN amount >= 1500 THEN 'high' ELSE 'low' END AS band FROM orders;",
        // Both boundaries treated as exclusive.
        "SELECT customer, CASE WHEN amount > 1500 THEN 'high' WHEN amount > 800 THEN 'mid' ELSE 'low' END AS band FROM orders;",
      ],
    },
    {
      id: "case-when-free",
      type: "sql-free",
      prompt:
        "Someone in finance wants one row with two numbers: how many orders are 1000 or more, and how many are under 1000. Name the columns large and small.",
      canonical:
        "SELECT SUM(CASE WHEN amount >= 1000 THEN 1 ELSE 0 END) AS large, SUM(CASE WHEN amount < 1000 THEN 1 ELSE 0 END) AS small FROM orders;",
      mustUse: ["CASE"],
      orderMatters: false,
      hint: "A filter cannot do this, because a WHERE that keeps the large orders has already thrown away the small ones and you need both numbers side by side.",
      hint2:
        "Give each row a 1 when it belongs in a band and a 0 when it does not, then add that column up. The CASE goes inside SUM rather than beside it.",
      explanation:
        "Four and four. Counting with a CASE inside SUM is the standard way to put two answers about different rows in one result, and it is worth recognising because it turns up constantly once you start writing reports.",
      rejects: [
        // Counts every row twice.
        "SELECT COUNT(*) AS large, COUNT(*) AS small FROM orders;",
        // The boundary again. Three and four.
        "SELECT SUM(CASE WHEN amount > 1000 THEN 1 ELSE 0 END) AS large, SUM(CASE WHEN amount < 1000 THEN 1 ELSE 0 END) AS small FROM orders;",
        // Added the amounts rather than counting the rows.
        "SELECT SUM(CASE WHEN amount >= 1000 THEN amount ELSE 0 END) AS large, SUM(CASE WHEN amount < 1000 THEN amount ELSE 0 END) AS small FROM orders;",
      ],
    },
  ],
  takeaways: [
    "CASE WHEN turns a value into a label one branch at a time, and ELSE catches everything left over",
    "Branches are read top to bottom and the first match wins, so the narrowest test goes first",
    "Put a CASE inside SUM or COUNT and you can count the rows that meet a condition without filtering the others away",
  ],
};
