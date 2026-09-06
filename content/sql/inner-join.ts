import type { SqlLesson, TableSet } from "@/lib/schema";

/**
 * The dataset is built to expose the mistakes, not hide them. BRIEF.md, the
 * SQL validator section, which asks for at least one row on each side of a
 * join with no match so INNER and LEFT genuinely differ.
 *
 * - Brightsmith has never ordered, so a customer disappears from every inner
 *   join in this lesson
 * - order 105 belongs to customer 9, who does not exist, so an order
 *   disappears too. LEFT JOIN keeps it with an empty name, which is the
 *   difference the rejects rely on
 * - Northwind and Halcyon have two orders each, so the join returns more rows
 *   than the customers table has, and a learner who expects one row per
 *   customer notices
 * - both tables have a column called id, so joining on the wrong one is a
 *   query that runs and returns nothing rather than an error
 */
const db: TableSet = {
  tables: [
    {
      name: "customers",
      cols: ["id", "name", "city"],
      rows: [
        [1, "Northwind", "Auckland"],
        [2, "Kea Ltd", "Wellington"],
        [3, "Halcyon", "Auckland"],
        [4, "Brightsmith", "Dunedin"],
        [5, "Tuatara", "Wellington"],
      ],
    },
    {
      name: "orders",
      cols: ["id", "customer_id", "item", "amount"],
      rows: [
        [101, 1, "desk lamp", 120],
        [102, 3, "chair", 340],
        [103, 1, "monitor arm", 210],
        [104, 5, "filing box", 65],
        [105, 9, "cable tray", 40],
        [106, 3, "keyboard", 95],
      ],
    },
  ],
};

export const innerJoin: SqlLesson = {
  track: "sql",
  id: "inner-join",
  name: "INNER JOIN",
  blurb: "Two tables, one result, matched on the column they have in common",
  group: "joining",
  order: 6,
  db,
  shape:
    "SELECT columns_from_either_table\nFROM the_first_table\nINNER JOIN the_second_table\nON what_makes_a_row_match;",
  clauses: [
    { kw: "SELECT", label: "which columns you want", tint: "return" },
    { kw: "FROM", label: "the first table", tint: "search" },
    { kw: "INNER JOIN", label: "the table to bring in", tint: "lookup" },
    { kw: "ON", label: "what makes a row match", tint: "test" },
    { kw: "WHERE", label: "which rows to keep", tint: "plain", optional: true },
  ],
  understand: {
    problem:
      "The orders table records who placed each order as a number, because storing the customer name on every order would mean fixing it in six places when somebody changes their name. Useful for the database, useless for the person who asked you what Halcyon has been buying. A join puts the two tables back together for the length of one query, matching each order to the customer whose id it carries.",
  },
  build: {
    target:
      "Every order with the name of the customer who placed it, and the amount.",
    starter: "SELECT customer_id, amount\nFROM orders;",
    canonical:
      "SELECT customers.name, orders.amount FROM orders INNER JOIN customers ON orders.customer_id = customers.id;",
    mustUse: ["JOIN", "ON"],
    orderMatters: false,
    hint: "Run the starter. It gives you a column of numbers, and nobody asked for numbers. The names live in the other table, so the query has to reach into it.",
    hint2:
      "INNER JOIN names the second table and ON says which columns have to match: the customer_id on an order and the id on a customer. Write columns as table.column so it is clear which id you mean.",
    explanation:
      "Five rows come back from six orders, because order 105 carries a customer id that no customer has and an inner join keeps only rows that matched on both sides. Northwind and Halcyon each appear twice, which is what a join does when one customer has several orders.",
    rejects: [
      // The starter. Ids rather than names, and no join at all.
      "SELECT customer_id, amount FROM orders;",
      // Joined on the wrong pair of columns. Runs, matches nothing.
      "SELECT customers.name, orders.amount FROM orders INNER JOIN customers ON orders.id = customers.id;",
      // Keeps the unmatched order with an empty name. Six rows.
      "SELECT customers.name, orders.amount FROM orders LEFT JOIN customers ON orders.customer_id = customers.id;",
    ],
  },
  exercises: [
    {
      id: "inner-join-gaps",
      type: "sql-gaps",
      prompt:
        "Fill the two gaps so each order shows the name of the customer who placed it, along with the item.",
      template:
        "SELECT customers.name, orders.item\nFROM orders\nINNER {0} customers\n  {1} orders.customer_id = customers.id;",
      gaps: [
        { accept: ["JOIN"], tint: "lookup", placeholder: "bring in" },
        { accept: ["ON"], tint: "test", placeholder: "matched how" },
      ],
      canonical:
        "SELECT customers.name, orders.item FROM orders INNER JOIN customers ON orders.customer_id = customers.id;",
      mustUse: ["JOIN", "ON"],
      orderMatters: false,
      hint: "The first gap is the word that follows INNER and names the table being brought in. The second introduces the condition that decides which rows belong together.",
      hint2:
        "The second gap is two letters. It is not WHERE: WHERE decides which rows to keep, and this is deciding which rows pair up.",
      explanation:
        "INNER JOIN says which table to bring in and ON says what makes a pair. Five rows come back rather than six, because the order with the unknown customer id has nothing to pair with.",
      rejects: [
        "SELECT customers.name, orders.item FROM orders LEFT JOIN customers ON orders.customer_id = customers.id;",
        "SELECT customer_id, item FROM orders;",
      ],
    },
    {
      id: "inner-join-guided",
      type: "sql-guided",
      prompt:
        "Your manager wants the orders placed by Auckland customers. Show the customer name, the item and the amount.",
      starter:
        "SELECT customers.name, orders.item, orders.amount\nFROM orders\nINNER JOIN customers ON orders.customer_id = customers.id;",
      showClauseHint: true,
      canonical:
        "SELECT customers.name, orders.item, orders.amount FROM orders INNER JOIN customers ON orders.customer_id = customers.id WHERE customers.city = 'Auckland';",
      mustUse: ["JOIN", "WHERE"],
      orderMatters: false,
      hint: "The join is already written and correct. Five orders come back and one of them belongs to a Wellington customer, so a filter is missing rather than a join.",
      hint2:
        "WHERE goes after the ON condition, and the city it needs to test lives on the customers table rather than on the orders table.",
      explanation:
        "Four rows come back. The city is a customers column and the query still filters on it, because once the tables are joined every column of both is available to WHERE. ON decides which rows pair up and WHERE decides which of those pairs you keep, which is why they are two different clauses.",
      rejects: [
        // The starter. No filter.
        "SELECT customers.name, orders.item, orders.amount FROM orders INNER JOIN customers ON orders.customer_id = customers.id;",
        // The other city.
        "SELECT customers.name, orders.item, orders.amount FROM orders INNER JOIN customers ON orders.customer_id = customers.id WHERE customers.city = 'Wellington';",
        // Filtered before joining anything.
        "SELECT customer_id, item, amount FROM orders WHERE customer_id = 1;",
      ],
    },
    {
      id: "inner-join-free",
      type: "sql-free",
      prompt:
        "Finance asks how much each customer has spent with us. Show the customer name and their total, and name the total column total. Customers who have never ordered do not need to appear.",
      canonical:
        "SELECT customers.name, SUM(orders.amount) AS total FROM orders INNER JOIN customers ON orders.customer_id = customers.id GROUP BY customers.name;",
      mustUse: ["JOIN", "GROUP BY"],
      orderMatters: false,
      hint: "This is the grouping you already know, done on top of a join. Join the two tables first, then treat the result as though it were one table and group it.",
      hint2:
        "GROUP BY goes at the end, after the ON condition, and the column it groups on is the customer name from the customers table.",
      explanation:
        "Three customers come back from five, because Brightsmith has never ordered and an inner join drops them. The last line of the question is doing real work: it is what makes an inner join the right choice here rather than something that would have shown Brightsmith with an empty total.",
      rejects: [
        // No grouping. One row, everything added together.
        "SELECT customers.name, SUM(orders.amount) AS total FROM orders INNER JOIN customers ON orders.customer_id = customers.id;",
        // No aggregate. One row per order.
        "SELECT customers.name, orders.amount AS total FROM orders INNER JOIN customers ON orders.customer_id = customers.id;",
        // LEFT JOIN keeps the orphan order as a group with no name.
        "SELECT customers.name, SUM(orders.amount) AS total FROM orders LEFT JOIN customers ON orders.customer_id = customers.id GROUP BY customers.name;",
      ],
    },
  ],
  takeaways: [
    "A join needs two things: which table to bring in, and the ON condition that says which rows belong together",
    "INNER JOIN keeps only the rows that matched on both sides, so anything unmatched leaves without saying so",
    "Count the rows before and after a join, because one that quietly drops or doubles rows still looks like a sensible answer",
  ],
};
