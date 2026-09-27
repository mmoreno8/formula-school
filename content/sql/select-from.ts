import type { SqlLesson, TableSet } from "@/lib/schema";

/**
 * Manuel's own MySQL practice database, the shop he was already working in.
 * Same tables, same rows, so a query he writes here behaves the same way in
 * MySQL Workbench. Every keyword this lesson teaches is written identically in
 * SQLite, MySQL and PostgreSQL, which BRIEF.md 3.2 already relies on.
 *
 * Two tables rather than one, on purpose. With a single table FROM is a word
 * you copy without thinking. With two, naming the wrong one gives you a real
 * result made of the wrong things, which is the mistake worth meeting early.
 *
 * The customers table carries six columns so that * is worth asking for, and
 * the two tables share no column names, so a wrong FROM fails loudly rather
 * than quietly returning something plausible.
 */
const db: TableSet = {
  tables: [
    {
      name: "customers",
      cols: [
        "customer_id",
        "first_name",
        "last_name",
        "city",
        "country",
        "joined_date",
      ],
      rows: [
        [1, "Sarah", "Smith", "Auckland", "New Zealand", "2025-01-15"],
        [2, "James", "Brown", "Wellington", "New Zealand", "2025-02-03"],
        [3, "Aroha", "Ngata", "Christchurch", "New Zealand", "2025-02-20"],
        [4, "Carlos", "Garcia", "Madrid", "Spain", "2025-03-11"],
        [5, "Emma", "Wilson", "Sydney", "Australia", "2025-03-28"],
        [6, "Liam", "Taylor", "Melbourne", "Australia", "2025-04-09"],
        [7, "Sofia", "Hernandez", "Mexico City", "Mexico", "2025-05-14"],
        [8, "Noah", "Walker", "Auckland", "New Zealand", "2025-06-01"],
        [9, "Mia", "Chen", "Queenstown", "New Zealand", "2025-06-22"],
        [10, "Lucas", "Martin", "Barcelona", "Spain", "2025-07-30"],
      ],
    },
    {
      name: "products",
      cols: ["product_id", "product_name", "category", "price", "stock"],
      rows: [
        [1, "Coffee Mug", "Kitchen", 15.0, 120],
        [2, "Water Bottle", "Outdoors", 25.0, 80],
        [3, "Hiking Backpack", "Outdoors", 120.0, 15],
        [4, "Notebook", "Stationery", 8.5, 200],
        [5, "Pen Set", "Stationery", 12.0, 150],
        [6, "Chef Knife", "Kitchen", 89.0, 25],
        [7, "Cutting Board", "Kitchen", 35.0, 40],
        [8, "Rain Jacket", "Outdoors", 150.0, 10],
        [9, "Desk Lamp", "Home", 45.0, 30],
        [10, "Scented Candle", "Home", 18.0, 0],
      ],
    },
  ],
};

export const selectFrom: SqlLesson = {
  track: "sql",
  id: "select-from",
  name: "SELECT & FROM",
  blurb: "Ask for columns from a table, and read the query back as a sentence",
  group: "reading",
  order: 1,
  db,
  shape: "SELECT which_columns_you_want\nFROM which_table;",
  clauses: [
    { kw: "SELECT", label: "which columns you want", tint: "return" },
    { kw: "FROM", label: "which table", tint: "search" },
  ],
  understand: {
    problem:
      "Someone asks you for a list of the customers. The table is sitting there and you could scroll it, but you would have to do it again tomorrow. A query asks for the same thing in one line, and it answers two questions in a fixed order: which columns do you want, and which table are they in. SELECT answers the first. FROM answers the second. A star means every column, so you do not have to name them one at a time. The semicolon on the end says the command has finished. Read it back as a sentence and it says what it does: show me these columns from this table.",
  },
  build: {
    target: "Every column of the customers table, not the one name it shows now.",
    starter: "SELECT first_name\nFROM customers;",
    canonical: "SELECT * FROM customers;",
    orderMatters: false,
    hint: "Run the starter as it stands. Ten rows come back, which is right, but each one is a single first name. The question asked for the whole record, and SELECT is the part of the query that decides how much of each row you get.",
    hint2: "You could name all six columns, and it would work. There is a shorter way to say every column, and it is one character long.",
    explanation:
      "SELECT * FROM customers reads as show me all the columns from the customers table. The star is the shorthand for every column, which saves you naming six of them and keeps working if a column is added later.",
    rejects: [
      "SELECT first_name FROM customers;",
      "SELECT first_name, last_name FROM customers;",
      "SELECT * FROM products;",
    ],
  },
  exercises: [
    {
      id: "select-from-gaps",
      type: "sql-gaps",
      prompt:
        "Write this sentence as a query: show me all the columns from the products table.",
      template: "SELECT {0} FROM {1};",
      gaps: [
        { accept: ["*"], tint: "return", placeholder: "columns" },
        { accept: ["products"], tint: "search", placeholder: "table" },
      ],
      canonical: "SELECT * FROM products;",
      orderMatters: false,
      hint: "Take the sentence a piece at a time. All the columns is the first gap, and the table name is the second.",
      hint2: "All the columns has a one character shorthand. The table is named in the sentence itself, and it is not customers.",
      explanation:
        "SELECT * FROM products. The sentence and the query hold the same two pieces in the same order, which is why reading a query out loud is usually enough to tell whether it says what you meant.",
      rejects: ["SELECT * FROM customers;"],
    },
    {
      id: "select-from-guided",
      type: "sql-guided",
      prompt:
        "That is more than anyone asked for. Somebody wants the first name and the city, and nothing else.",
      starter: "SELECT *\nFROM customers;",
      showClauseHint: true,
      canonical: "SELECT first_name, city FROM customers;",
      orderMatters: false,
      hint: "The star is doing the wrong job here. It says every column, and you have been asked for two of them.",
      hint2: "Replace the star with the two column names, in the order they were asked for, with a comma between them. The commas work like commas in a sentence, so there is none after the last one.",
      explanation:
        "SELECT first_name, city FROM customers brings back two columns instead of six. Naming columns is the normal way to write a query. The star is for when you genuinely want the lot, or when you are still looking around.",
      rejects: [
        "SELECT * FROM customers;",
        "SELECT first_name FROM customers;",
        "SELECT first_name, last_name FROM customers;",
      ],
    },
    {
      id: "select-from-free",
      type: "sql-free",
      prompt:
        "A colleague is putting together a price list and asks you for the name and the price of everything you sell.",
      canonical: "SELECT product_name, price FROM products;",
      orderMatters: false,
      hint: "Two questions, same as every query so far. Which columns, and which table. The word sell tells you the table.",
      hint2: "The columns are product_name and price. They live in products, not customers.",
      explanation:
        "SELECT product_name, price FROM products. No filtering and no sorting, because nothing was asked for. All ten products come back, including the candle that is out of stock, which is worth noticing before you hand the list over.",
      rejects: [
        "SELECT * FROM products;",
        "SELECT product_name FROM products;",
        "SELECT product_name, price FROM customers;",
      ],
    },
  ],
  takeaways: [
    "SELECT says which columns you want, and a star is the shorthand for all of them",
    "FROM says which table they come from, so naming the wrong one gives you the wrong things",
    "A query reads back as a sentence: show me these columns from this table",
  ],
};
