import type { SqlLesson, TableSet } from "@/lib/schema";

/**
 * The dataset is built to expose the mistakes, not hide them. BRIEF.md, the
 * SQL validator section, which asks for duplicate values in the column a
 * DISTINCT lesson targets.
 *
 * - every column repeats: four search signups, five from Auckland, five on the
 *   free plan, so leaving DISTINCT out is always visible
 * - email has sent exactly one signup, and it is not from Auckland, so the
 *   Auckland channels are three where all channels are four. Without that one
 *   row the gaps exercise would accept a query with no WHERE in it
 * - city and plan repeat in different patterns, so DISTINCT over two columns
 *   returns six rows where either column alone returns three
 */
const db: TableSet = {
  tables: [
    {
      name: "signups",
      cols: ["id", "person", "channel", "city", "plan"],
      rows: [
        [1, "Ana", "search", "Auckland", "free"],
        [2, "Bo", "search", "Wellington", "pro"],
        [3, "Cy", "referral", "Auckland", "free"],
        [4, "Dev", "social", "Dunedin", "pro"],
        [5, "Eli", "search", "Auckland", "free"],
        [6, "Fay", "referral", "Wellington", "team"],
        [7, "Gus", "social", "Auckland", "free"],
        [8, "Hana", "search", "Dunedin", "pro"],
        [9, "Ira", "email", "Wellington", "free"],
        [10, "Jo", "referral", "Auckland", "team"],
      ],
    },
  ],
};

export const distinct: SqlLesson = {
  track: "sql",
  id: "distinct",
  name: "DISTINCT",
  blurb: "Ask what values exist without being handed the same one ten times",
  group: "filtering",
  order: 3,
  db,
  shape:
    "SELECT DISTINCT which_columns_you_want\nFROM where_it_lives\nWHERE which_rows_to_keep;",
  clauses: [
    { kw: "SELECT", label: "which columns you want", tint: "return" },
    { kw: "DISTINCT", label: "drop the repeats", tint: "lookup" },
    { kw: "FROM", label: "which table", tint: "search" },
    { kw: "WHERE", label: "which rows to keep", tint: "test", optional: true },
  ],
  understand: {
    problem:
      "Somebody in marketing asks which channels are sending you signups. There are ten signups and four channels, so selecting the channel column hands them ten rows, most of which say the same thing. The question was about the values, not the rows. DISTINCT throws away the repeats and leaves one of each.",
  },
  build: {
    target: "Every channel that has sent a signup, listed once each.",
    starter: "SELECT channel\nFROM signups;",
    canonical: "SELECT DISTINCT channel FROM signups;",
    mustUse: ["DISTINCT"],
    orderMatters: false,
    hint: "Run the starter and read the column. The word search comes back four times and referral three. There are only four channels in the whole table, so most of what came back is repetition.",
    hint2:
      "DISTINCT goes directly after SELECT, before the column name, and applies to the result rather than to the table.",
    explanation:
      "DISTINCT collapses the ten rows into the four values that actually appear. It runs on the result of the query, so it removes repeated result rows rather than changing anything about the table itself.",
    rejects: [
      // No DISTINCT. Ten rows with the repeats still in.
      "SELECT channel FROM signups;",
      // Right idea, wrong column.
      "SELECT DISTINCT city FROM signups;",
      // Two columns, so more combinations are different and more rows survive.
      "SELECT DISTINCT channel, city FROM signups;",
      // Returns the same four values, and this lesson is about DISTINCT.
      "SELECT channel FROM signups GROUP BY channel;",
    ],
  },
  exercises: [
    {
      id: "distinct-gaps",
      type: "sql-gaps",
      prompt:
        "Fill the two gaps so this lists each channel that has sent an Auckland signup, once each.",
      template: "SELECT {0} channel\nFROM signups\n{1} city = 'Auckland';",
      gaps: [
        { accept: ["DISTINCT"], tint: "lookup", placeholder: "no repeats" },
        { accept: ["WHERE"], tint: "test", placeholder: "which rows" },
      ],
      canonical: "SELECT DISTINCT channel FROM signups WHERE city = 'Auckland';",
      mustUse: ["DISTINCT"],
      orderMatters: false,
      hint: "The first gap removes repeated rows from the result. The second is the clause that narrows the table down to Auckland before any of that happens.",
      hint2:
        "The first gap sits between SELECT and the column name. The second is the one word that starts a filter.",
      explanation:
        "Three channels come back rather than four, because email has only ever sent a Wellington signup. WHERE runs first and DISTINCT runs on what survives, which is why filtering can change the list of values you get.",
      rejects: [
        "SELECT channel FROM signups WHERE city = 'Auckland';",
        "SELECT DISTINCT channel FROM signups;",
        "SELECT DISTINCT city FROM signups WHERE city = 'Auckland';",
      ],
    },
    {
      id: "distinct-guided",
      type: "sql-guided",
      prompt:
        "Your manager wants to know which plans each city has actually bought. One row for each city and plan pairing, no repeats, with the city first and the plan second.",
      starter: "SELECT DISTINCT city,\nFROM signups;",
      showClauseHint: true,
      canonical: "SELECT DISTINCT city, plan FROM signups;",
      mustUse: ["DISTINCT"],
      orderMatters: false,
      hint: "The starter is missing the second column. DISTINCT does not need repeating for it: one DISTINCT covers the whole SELECT list.",
      hint2:
        "Add plan after the comma. DISTINCT then compares whole rows, so a city and plan pairing survives once however many people signed up on it.",
      explanation:
        "Six pairings come back from ten signups. DISTINCT looks at the entire row rather than the first column, which is why adding a column to a DISTINCT query usually gives you more rows rather than fewer.",
      rejects: [
        // One column only. Three rows.
        "SELECT DISTINCT city FROM signups;",
        // Right columns, no DISTINCT. Ten rows.
        "SELECT city, plan FROM signups;",
        // Same pairings, columns the other way round.
        "SELECT DISTINCT plan, city FROM signups;",
      ],
    },
    {
      id: "distinct-free",
      type: "sql-free",
      prompt:
        "Someone writing the monthly note asks which channels have brought in anyone on the pro plan. List each channel once.",
      canonical: "SELECT DISTINCT channel FROM signups WHERE plan = 'pro';",
      mustUse: ["DISTINCT"],
      orderMatters: false,
      hint: "Three people are on the pro plan, and two of them arrived the same way. The question asks for channels rather than people, so the repeat has to go.",
      hint2:
        "Filter on the plan column with WHERE, and put DISTINCT in front of channel so the two search signups collapse into one row.",
      explanation:
        "Three pro signups become two channels. This is the shape most of these questions take in real work: filter to the rows you care about, then ask what values are left.",
      rejects: [
        "SELECT channel FROM signups WHERE plan = 'pro';",
        "SELECT DISTINCT channel FROM signups;",
        "SELECT DISTINCT plan FROM signups WHERE plan = 'pro';",
      ],
    },
  ],
  takeaways: [
    "DISTINCT removes repeated rows from the result, and it compares the whole row rather than the first column",
    "Adding a column to a DISTINCT list usually returns more rows, because there are more combinations to differ on",
    "WHERE runs before DISTINCT, so filtering first changes which values are left to list",
  ],
};
