# Formula School — build brief

Working document for three parties: Manuel (owner), Claude (implementation), Codex (review,
testing and deployment). This file is the single source of truth. If something is not in here,
it is not agreed. Anyone can propose a change, but change the file, do not change the code
and hope.

**Status: draft 5.** Manuel approved an eight-lesson SQL track on 6 September 2026. Nothing in the
SQL track is built yet.

**Deployment status, corrected in review.** These are three different things and the brief has
conflated them before:

| | State |
|---|---|
| Live in production | The ten-lesson MVP, from `0f87a6f` and `7154d60` |
| Pushed to `origin/main` | Up to `1d6b6ba`, the manual deployment workflow |
| Local only | `a151838`, the eighteen-lesson Excel expansion. Committed, complete, validator green, **not pushed and therefore not deployed** |

Production deploys are `workflow_dispatch` only and build from `main` on the remote, so nothing
reaches production until it is pushed and the workflow is run by hand. "Complete and green" is a
statement about the working tree. It is not a statement about what a learner can visit.

Draft history: draft 4 was the eight-lesson Excel expansion approved on 5 September 2026. Draft 5
adds the SQL track and is the first time the product has had two tracks.

**Visual reference:** the clickable prototype is the design source of truth, not this document's
descriptions. When they disagree, the prototype wins.

- Excel: https://claude.ai/code/artifact/3374507e-758a-47d7-a19e-cb0763e68bad
- SQL: https://claude.ai/code/artifact/96853852-2350-4eaa-bd1d-8a2bb42ce636

---

## 0. Decisions (previously open questions)

| Question | Decision |
|---|---|
| Where the project lives | `~/Documents/formula-school` |
| Product name | "Formula School" is the working name and stays |
| Working arrangement | Claude works directly in the directory. No branches or worktrees needed |
| Unbuilt nav pages | Hidden until the features exist. See section 7 |
| Hosting | Cloudflare Pages. Codex connects the GitHub repo after review |
| Domain | Deferred. Not `jobtap.nz` |
| Second track | SQL, approved 6 September 2026. Eight lessons for the MVP |
| SQL engine | `sql.js`. SQLite compiled to WebAssembly, running in the browser |
| SQL dialect | SQLite. The interface says "SQLite SQL" and states that the concepts transfer |
| SQL route | `/sql`, with the cheat sheet nested at `/sql/cheat-sheet` |
| Deployment economy | One preview deployment near the end, one production release after approval |

### Ownership model (changed in draft 3)

Draft 2 split implementation between Claude and Codex. That is cancelled.

- **Claude owned the complete first-MVP implementation.** Every file. Engine, chrome, content,
  all of it.
- **Codex independently reviewed, tested and deployed** the first MVP.
- Implementation work is not split. There is no parallel editing and no shared-file protocol.
- Claude does not deploy. Codex owns verification and deployment.

For the Excel expansion approved on 5 September 2026, Manuel directly assigned implementation
to Codex. Codex owns the eight new lessons, their evaluator support and their verification. This
is a recorded exception rather than a silent change to the original arrangement.

---

## 1. What we are building

A small website that teaches practical Excel formulas through short interactive exercises.
Think W3Schools for Excel. It is not a spreadsheet clone and never will be.

Each lesson takes one formula, frames it as a real workplace problem, and walks the learner
through understanding it, building it, and practising it.

## 2. Who it is for

People moving into data analytics from somewhere else. Manuel is the first user. The tone
assumes an adult who is capable and slightly behind, not a beginner who needs cheering up.

## 3. Curriculum

Two tracks. Eighteen Excel lessons, complete and validator green. Eight SQL lessons, approved and
unbuilt.

### 3.1 Excel track

Eighteen lessons, in this order:

| # | Lesson | Functions taught |
|---|---|---|
| 1 | SUM | `SUM` |
| 2 | AVERAGE | `AVERAGE` |
| 3 | COUNT and COUNTA | `COUNT` (main), `COUNTA` (by comparison) |
| 4 | IF | `IF` |
| 5 | COUNTIF | `COUNTIF` |
| 6 | SUMIF | `SUMIF` |
| 7 | COUNTIFS | `COUNTIFS` |
| 8 | SUMIFS | `SUMIFS` |
| 9 | VLOOKUP | `VLOOKUP` |
| 10 | XLOOKUP | `XLOOKUP` |
| 11 | MIN and MAX | `MIN`, `MAX` |
| 12 | ROUND | `ROUND` |
| 13 | AND and OR | `AND`, `OR` (with `IF`) |
| 14 | IFERROR | `IFERROR` (with `VLOOKUP`) |
| 15 | LEFT, RIGHT and MID | `LEFT`, `RIGHT`, `MID` |
| 16 | TRIM and LEN | `TRIM`, `LEN` |
| 17 | CONCAT | `CONCAT` (with `LEFT`) |
| 18 | INDEX and MATCH | `INDEX`, `MATCH` |

XLOOKUP was built and tested first as the reference implementation, because it exercises every
part of the system. It remains tenth so the original course order does not move under returning
learners.

**Lesson 3 carries two functions on purpose.** `COUNT` is the primary signature. `COUNTA` is
introduced by comparison, because the difference between them is the thing that actually trips
people up, and at least one exercise must turn on that difference. The schema supports this
through `signatures: Signature[]` rather than a single signature.

### 3.2 SQL track

Eight lessons for the MVP, in this order:

| # | Lesson | Teaches |
|---|---|---|
| 1 | SELECT | `SELECT`, `FROM` |
| 2 | WHERE | `WHERE` |
| 3 | ORDER BY and LIMIT | `ORDER BY`, `LIMIT` |
| 4 | Aggregates | `COUNT`, `SUM`, `AVG`, `MIN`, `MAX` |
| 5 | GROUP BY | `GROUP BY` |
| 6 | HAVING | `HAVING` |
| 7 | DISTINCT | `DISTINCT` |
| 8 | JOIN | `INNER JOIN`, `ON` |

Eight ends at JOIN because that is the first coherent stopping point. Stopping earlier would
teach grouping and never join anything.

**GROUP BY is built and tested first as the reference implementation**, the role XLOOKUP played
for Excel. It exercises aggregation, the clause guidance line, and multi-row result comparison at
once. It remains fifth so the course order does not move.

**Deferred to a later phase, not cut:** LEFT JOIN, CASE WHEN, subqueries, and date handling.
LEFT JOIN is the most likely first addition, because finding what is missing is where interviews
are actually lost.

**The dialect is SQLite**, because the engine runs in the browser. Of the concepts above, all
eight are written identically in SQLite, MySQL and PostgreSQL at this level. Dialect divergence
starts at date handling, which is one reason it sits in the deferred set rather than the MVP.
The interface says "SQLite SQL" and states plainly that the concepts transfer.

## 4. Non-goals

No user accounts. **No server-side database.** No payments. No AI tutor. No Microsoft API. No
spreadsheet clone. No ribbon, no menus, no cell formatting, no multi-sheet workbooks. No
downloadable workbooks. No streaks, no badges, no confetti. No lesson gating: every lesson in
both tracks is open from the first visit.

**Amended in draft 5.** This line previously read "No database" with no qualifier. That was
always about not storing user data on a server, but the text did not say so, and as written it
ruled out the SQL track's teaching engine. The rule is now explicit: no server-side database, and
no persistence of any kind beyond `localStorage`. SQLite compiled to WebAssembly, running inside
the learner's browser and holding nothing between page loads, is the SQL track's teaching engine
and is not a database in the sense this non-goal means.

**No server-side anything.** No route handlers, no API routes, no server actions, no middleware,
no backend query execution, no runtime server dependencies. The app is a pure static export and
must stay one. `next.config.ts` sets `output: "export"`, every lesson route in both tracks is
generated at build time through `generateStaticParams`, and `npm run build` writes a
self-contained `out/` directory. Break any of this and the build stops producing something
Cloudflare Pages can host.

This rule is why the SQL track runs SQLite in the browser rather than sending queries to a server.
Client-side execution avoids requiring Formula School to introduce backend query infrastructure,
accounts or server-side persistence. It is what lets the product stay free, keep working with no
sign-up, and remain a folder of static files.

**Explicitly out of scope for the SQL MVP**, on top of the above: no MySQL or PostgreSQL dialect
selector, no Python or R, no saved query history, no interview-question library, and no backend
execution service.

---

## 5. Changes from the original brief

Deliberate departures from Manuel's first spec, with the reason for each.

**5.1 Typed formulas are graded by a real evaluator, not by string matching.**
Comparing the learner's text to a stored answer breaks on spacing, quotes, `$A$1` versus `A1`,
and `B2:B9` versus `B:B`, and it tells correct people they are wrong. Instead we run their formula
against the sheet data and compare the result, plus a check that they used the required function.

**5.2 The Build step is a guided formula bar, not a drag-and-drop fill-in.**
The biggest change, and it came from Manuel directly: he does not want memorisation. Excel guides
you, so the site guides you the same way. The formula bar has:

- autocomplete when you type `=X`, tab to accept
- an argument hint line underneath that bolds the argument your cursor is currently inside,
  exactly like Excel's tooltip, visible the whole time
- click a cell or a column letter to insert the reference instead of typing it
- a live result the moment the formula becomes valid

This mechanic is the product. Everything else is packaging.

**5.3 Drag and drop is dropped entirely.**
Dragging is miserable on a phone. Every interaction is tap to pick, tap to place. Same on both.

**5.4 The Apply step is cut from the MVP.**
Generating ten xlsx workbooks is real work and almost nobody does the homework.

**5.5 Sample data is generic business data.**
Orders, customers, regions, amounts, headcount, invoices. The kind of data that shows up in
analytics interviews. Explicitly not hospitality data.

**5.6 The evaluator covers every function in the curriculum from day one.**

**5.7 A validator script gates the build.** See section 8.

**5.8 Feedback is adult in tone.** See section 11.

**5.9 Dark mode is in scope from day one.**
Every colour is a token, declared in the bare `:root` for light and redefined in a dark block.
Nobody writes a hex outside `globals.css`. Retrofitting dark mode after fifty components exist
is painful, which is why it is decided now.

**5.10 The home page is a card grid, not a list.**
One card per lesson, each with the name, one line on what it does, a progress bar, and how many
exercises are done.

### Added in draft 5, for the SQL track

**5.11 SQL runs in the browser, not on a server.**
`sql.js`, SQLite compiled to WebAssembly, loaded as a static asset. Lesson databases are tiny and
temporary, seeded at page load and thrown away. This is the decision the whole track rests on, so
Codex proves it in isolation before any lesson work starts. See section 10.

**5.12 The SQL Build step has two buttons where Excel has none.**
Excel shows a live result as you type and grades implicitly. SQL splits it. **Run query** executes
and shows the result without judging it. **Check answer** grades. This is a deliberate divergence
and not an inconsistency: a spreadsheet formula returns one value that can update on every
keystroke, whereas a query returns a table and is often deliberately run half-finished to see what
came back. Exploring without being marked is how people actually learn SQL. Syntax errors still do
not count as attempts, in both tracks.

**5.13 SQL exercises are a difficulty ramp, not a menu of types.**
Excel draws its three exercises from four interchangeable types. SQL's three are ordered and
always the same shape: fill the missing pieces, then write a guided query, then answer a short
business request with no scaffold. The learner writes SQL in all three, with the support removed a
step at a time. `choice` is not used in the SQL track.

**5.14 Grading executes the canonical solution rather than trusting a stored value.**
Excel exercises declare an `expected` value that the validator checks against the canonical
formula. SQL does not store an expected result set at all. On **Check answer** the learner's query
and the canonical query both execute against fresh copies of the same lesson database, and the two
result sets are compared. The canonical query is the single source of truth and cannot drift away
from a hand-written expected value. The validator's job shifts accordingly: it asserts that the
canonical query runs, returns rows, and rejects every query in `rejects`.

---

## 6. Lesson flow

Four steps, shown as a rail beside the lesson. **Both tracks use the same four steps and the same
rail.** What changes is the surface underneath them.

### 6.1 Excel

**Understand.** A short real problem in plain words, then the formula signature with each
argument as a coloured chip: `=XLOOKUP(who to find, where to look, what to bring back)`.
Chip colours are consistent across the whole site so the learner builds a visual habit.

**Build.** The guided formula bar described in 5.2, against the lesson's sheet. One target,
one correct result.

**Practise.** Exactly three exercises, drawn from four types: multiple choice, fill the gaps,
select a range on the grid, enter the complete formula.

**Done.** Three takeaway bullets, progress, back to the list, redo the lesson.

### 6.2 SQL

**Understand.** A short workplace problem in plain words, a preview of the lesson's tables, and
the query shape in plain language. No video, no lecture, no theory section.

```
SELECT what_you_need
FROM where_it_lives
WHERE which_rows_to_keep;
```

**Build.** The guided query editor. Tables and columns visible, starter SQL already in the
editor, clause guidance underneath it, and the two buttons from 5.12. Run query shows the result.
Check answer grades it.

**Practise.** Exactly three exercises, always in this order and always this shape:

1. Fill the missing pieces of a query
2. Write a guided query
3. Answer a short independent business request

**Done.** Identical to Excel. Three takeaways, lesson marked finished, progress saved locally,
link to the next SQL lesson.

### 6.3 The SQL workspace

SQL results are tables, so the Build and Practise steps get a wider two-column working surface
than Excel needs. Understand and Done stay single column and match the Excel track exactly.

Desktop:

```
┌─────────────────────────────────────────────────────────┐
│ SQL · WHERE                              Lesson 2 of 8  │
├──────────────────────┬──────────────────────────────────┤
│ The problem          │ SQLite SQL                       │
│                      │                                  │
│ Keep only orders     │ SELECT customer, amount          │
│ from Auckland.       │ FROM orders                      │
│                      │ WHERE ...                        │
│ Tables               │                                  │
│ orders               │ [Run query]  [Check answer]      │
│                      ├──────────────────────────────────┤
│ Sample rows          │ Results                          │
│ customer | city      │ customer | amount                │
│ Ana      | Auckland  │ Ana      | 420                   │
└──────────────────────┴──────────────────────────────────┘
```

Mobile stacks in reading order: problem, then tables and sample rows, then the editor, then the
buttons, then results.

**The visual system does not change.** Warm neutrals, hairline borders, no shadows, monospace for
anything that is SQL. Green stays rationed to the four roles in section 9. This is Formula School
with a wider working area, not a coding platform with a different skin, and no part of it turns
neon because it now contains an editor.

### Feedback progression

Deterministic. The same everywhere, in the Build step and in every exercise type.

| Attempt | Response |
|---|---|
| 1st wrong | Contextual hint. Points at the reason. Never contains the answer |
| 2nd wrong | Stronger hint naming the argument or range that is misunderstood |
| 3rd wrong | Reveal the answer with a short explanation of why it works |

Two additions to that ladder:

- **A formula that will not parse is not a wrong attempt.** A missing bracket or a stray quote
  shows a syntax nudge and does not advance the counter. Burning a learner's hint on a typo
  teaches nothing.
- **A "show me the answer" control is always available**, at every attempt. Nobody is held
  hostage by the ladder. Using it marks the exercise as revealed rather than solved.

### Progress and what the numbers mean

Progress lives in `localStorage`. Nothing else is persisted. There is no account and no database.

Three things are stored per lesson, and only these three:

- which exercises have been completed
- whether the lesson has been finished
- whether the Build step has been solved

The third was added during review. It carries no score, it is what lets the lesson rail show a
solved Build step when the learner comes back to the page, and without it the rail would forget
work the learner had already done. Everything the original two bullets forbade still stands.

**Finished has one meaning.** A lesson is finished when all three of its exercises are
completed, and at no other time. The rail lets the learner jump straight to the Done step, so
this is enforced in `markFinished` rather than in the view: reaching the last screen is not
completing the lesson, and the Done screen says so when exercises are outstanding.

The formula card shows **exercises completed out of three**, as `2 / 3`, and a completion state.
There is no percentage, no accuracy figure, no attempts counter, no hints-used tally and no
quality score of any kind on the card. If it is not in the three bullets above, the card does not
claim it.

---

## 7. Pages and navigation

**Launch navigation, in this order:**

| Page | Route | What it is |
|---|---|---|
| Overview | `/` | Both tracks. Where you are up to, and the next thing to do |
| Formulas | `/formulas` | The Excel card grid |
| Excel lesson | `/formulas/[id]` | For example `/formulas/xlookup` |
| Cheat sheet | `/cheat-sheet` | Every Excel signature, generated from lesson data |
| SQL | `/sql` | The SQL card grid |
| SQL lesson | `/sql/[id]` | For example `/sql/group-by` |
| SQL cheat sheet | `/sql/cheat-sheet` | Every SQL clause, generated from lesson data |

Excel routes do not move. Nothing already deployed or bookmarked breaks.

The sidebar groups the two tracks under labels and shows a progress bar for each. The Overview
speaks for both and does not favour one.

**The cheat sheets stay separate.** One page mixing Excel signatures with SQL clauses helps
nobody, and both are generated from lesson data, so two pages is barely more work than one.

**Route note for implementation.** `/sql/cheat-sheet` is a static segment sitting beside the
dynamic `/sql/[id]`. The static route wins, and no lesson may take the id `cheat-sheet`. The
validator should reject that id rather than leave it as a trap.

**Hidden until the feature genuinely exists.** Not stubs, not empty states, not in the nav at
all: Practice, Mistakes, Your results, What's new, Contact. Four of six doors being empty makes
a finished thing feel unfinished, however honest the copy is. They come back when they work.

Every page has a breadcrumb, an H1, and one line of description underneath. No exceptions.

Bottom of the sidebar: the dark mode toggle, and a short note saying progress is saved on this
device with no account needed. That note is where a gated site would put its sign-up button, and
it answers the "do I need an account" question before it gets asked.

### Deployment shape

**Cloudflare Pages**, connected and deployed by Codex after review. Claude does not deploy.

Every route is statically generated at build time; the ten lesson routes use
`generateStaticParams` with `dynamicParams = false`. `npm run build` produces `out/`, which is the
entire site. Cloudflare Pages settings: build command `npm run build`, output directory `out`, no
environment variables, no functions.

Because the output is plain static files, the app can move to any host without a rewrite.

---

## 8. The contract: `lib/schema.ts`

```ts
export type Ref = string          // "A2"
export type RangeRef = string     // "A2:A9"

export interface Sheet {
  cols: string[]                  // ["A","B","C","D"]
  rows: number
  headerRow?: number              // default 1
  cells: Record<Ref, string | number>
}

export interface ArgSpec {
  name: string                    // "lookup_array", shown in the hint line
  label: string                   // "where to look", shown as a chip
  tint: 'lookup' | 'search' | 'return' | 'test' | 'plain'
  optional?: boolean
}

export interface Signature {
  fn: string                      // "XLOOKUP"
  args: ArgSpec[]
}

interface ExerciseBase {
  id: string
  prompt: string
  hint: string                    // 1st wrong attempt. Never contains the answer
  hint2: string                   // 2nd wrong attempt. Names the argument or range
  explanation: string             // shown once solved, or once revealed
  sheet?: Sheet                   // defaults to the lesson sheet
}

export interface ChoiceExercise extends ExerciseBase {
  type: 'choice'
  options: string[]
  correctIndex: number
  optionHints?: Record<number, string>
}

export interface GapsExercise extends ExerciseBase {
  type: 'gaps'
  template: string                // "=XLOOKUP(F1, {0}, {1})"
  gaps: { accept: string[]; tint: ArgSpec['tint']; placeholder?: string }[]
}

export interface RangeExercise extends ExerciseBase {
  type: 'range'
  correctRange: RangeRef
  nearMisses?: Record<RangeRef, string>  // "A1:A9" -> "you included the header"
}

export interface FormulaExercise extends ExerciseBase {
  type: 'formula'
  expected: string | number | boolean   // the evaluator must return this
  mustUse: string[]                     // ["XLOOKUP"]
  canonical: string                     // the model answer, shown on reveal
  rejects?: string[]                    // MUST NOT pass. Checked by the validator
}

export type Exercise =
  | ChoiceExercise | GapsExercise | RangeExercise | FormulaExercise

export interface Lesson {
  id: string                      // "xlookup"
  name: string                    // "XLOOKUP"
  blurb: string                   // one line for the grid card
  group: 'basics' | 'logic' | 'conditional' | 'lookups' | 'text'
  order: number                   // curriculum order
  signatures: Signature[]         // usually one. Lesson 3 has COUNT and COUNTA
  sheet: Sheet
  understand: { problem: string }
  build: {
    target: string
    expected: string | number | boolean
    mustUse: string[]
    canonical: string
    hint: string
    hint2: string
    explanation: string
    rejects?: string[]
  }
  exercises: Exercise[]           // exactly 3
  takeaways: string[]             // exactly 3
}
```

### The SQL half of the contract

The split is a discriminated union on `track`. **One application, two tracks, not a forked app.**
Not one engine: Excel and SQL have genuinely separate evaluation engines, the hand-written
evaluator and `sql.js`. What they share is the shell around them, listed in section 7.
`ExerciseBase` is untouched: `id`, `prompt`, `hint`, `hint2`, `explanation`. The hint ladder does
not change.

```ts
export type Track = 'excel' | 'sql'

export interface Table {
  name: string                    // "orders"
  cols: string[]                  // ["id","customer","city","amount"]
  rows: (string | number | null)[][]
}

export interface TableSet {
  tables: Table[]                 // seeded into a fresh SQLite db per lesson
}

export interface ClauseSpec {
  kw: string                      // "WHERE", shown in the guidance line
  label: string                   // "which rows to keep", shown as a chip
  tint: 'lookup' | 'search' | 'return' | 'test' | 'plain'
  optional?: boolean
}

export interface SqlLesson {
  track: 'sql'
  id: string                      // "group-by"
  name: string                    // "GROUP BY"
  blurb: string
  order: number
  group: 'reading' | 'filtering' | 'grouping' | 'joining'
  db: TableSet
  clauses: ClauseSpec[]
  shape: string                   // the plain-language query shape for Understand
  understand: { problem: string }
  build: {
    target: string                // what the learner is asked to produce
    starter: string               // SQL already in the editor
    canonical: string             // the model answer. The source of truth
    mustUse?: string[]            // ["GROUP BY"]. Detected as tokens, not substrings
    orderMatters: boolean         // required, never defaulted. See the validator, rule 12
    hint: string
    hint2: string
    explanation: string
    rejects?: string[]            // MUST NOT pass. Checked by the validator
  }
  exercises: [SqlGapsExercise, SqlGuidedExercise, SqlFreeExercise]  // exactly 3, in order
  takeaways: string[]             // exactly 3
}
```

The three SQL exercise types carry the ramp described in 5.13. Added here because draft 5
referenced them without defining them, which left a hole in the contract:

```ts
interface SqlExerciseBase extends ExerciseBase {
  canonical: string               // the model answer, and the source of truth
  mustUse?: string[]
  orderMatters: boolean           // required on every exercise, never defaulted
  rejects?: string[]
}

export interface SqlGapsExercise extends SqlExerciseBase {
  type: 'sql-gaps'
  template: string                // "SELECT region, {0}(amount) FROM orders {1} region"
  gaps: { accept: string[]; tint: ClauseSpec['tint']; placeholder?: string }[]
}

export interface SqlGuidedExercise extends SqlExerciseBase {
  type: 'sql-guided'
  starter: string                 // SQL already in the editor
  showClauseHint: true            // the guidance line stays visible
}

export interface SqlFreeExercise extends SqlExerciseBase {
  type: 'sql-free'
  // no starter, no clause hint. A sentence from a colleague and an empty editor
}
```

### Answer checking, SQL

**Run query** executes the learner's SQL against a fresh copy of the lesson database and shows
whatever came back. Nothing is graded and no attempt is counted.

**Check answer** executes two queries, the learner's and the lesson's `canonical`, each against
its own fresh copy of the same database, and compares the two result sets.

#### What the engine will accept, corrected in review

Draft 5 originally leaned on fresh database copies to make a stray `DROP TABLE` harmless. That is
not sufficient as a contract. `sql.js` will happily run anything, and a learner who runs
`DELETE FROM orders` and then a `SELECT` gets a confusing wrong answer instead of an error. Two
hard rules, enforced before execution in both Run query and Check answer:

**Accepted:** exactly one statement, which must be a `SELECT` or a read-only `WITH`. An optional
trailing semicolon is fine.

**Refused:** `INSERT`, `UPDATE`, `DELETE`, `CREATE`, `ALTER`, `DROP`, `ATTACH`, `DETACH`,
`PRAGMA`, anything else that writes or changes structure, and any input containing more than one
statement.

Refusal is not a wrong attempt. The learner sees a plain message saying these lessons only read
data, and the hint ladder does not move.

Rejecting multiple statements is not only a safety rule. Comparing result sets is meaningless
when there is more than one result to choose from.

**The detection method is an open question for the technical proof.** A text-prefix check is not
sufficient, because a string literal or a comment can contain any keyword. Step 3 has to determine
how `sql.js` reliably identifies a read-only single statement, and report the smallest dependable
method it finds. This brief states the required behaviour, not the implementation.

**A fresh database per execution** still holds, as defence in depth rather than as the only
defence. Every run and every check seeds a new in-memory database from the lesson's `TableSet`.

#### How result sets are compared, corrected in review

**Column names are normalized before comparison.** SQLite may preserve the literal text that
produced a computed column as its output label, so a canonical `SUM(amount)` and a learner's
`sum(amount)` can come back as different column names despite identical results. Comparing raw
names fails correct learners on spelling alone. Normalization is:

- compared case-insensitively
- leading and trailing whitespace ignored
- **column order still matters**, because the learner chooses it in the `SELECT` list

Where a lesson requires a particular output name, the prompt must explicitly ask for that alias.
A required alias is never implied.

**One addition beyond the reviewed list, flagged for Codex to accept or reject.** Internal
whitespace is also collapsed, so `SUM( amount )` normalizes to the same name as `SUM(amount)`.
Leading and trailing trimming alone does not catch that case, and a learner who spaces out their
arguments is not wrong. If the proof shows SQLite already normalizes this, the rule is redundant
and should be dropped rather than left in as noise.

**Rows are compared as a multiset, not as a list.** This replaces the two separate rules in the
first draft of this section, which tried to check duplicates and order independently and left it
ambiguous how. The rule is one rule with two modes:

| `orderMatters` | Comparison |
|---|---|
| `false` | The two result sets must be equal as **multisets**. Same rows, each appearing the same number of times, in any order |
| `true` | The two result sets must be equal as **ordered sequences**. Same rows, same multiplicities, same order |

Multiset equality is not set equality. Rows cannot be collapsed into a set, because that silently
loses duplicates and a query that drops or invents a duplicate row would pass. Duplicates must
match in number in both modes. Implementation: canonicalize each row to a comparable key, sort
both bags by that key, compare element-wise.

**`orderMatters` has no default. Every exercise and every Build target states it explicitly**, and
the validator fails a lesson that omits it. Ordering is one of the two most likely grading
mistakes in the track, and a field you can forget to write is a field that will be forgotten. The
schema keeps it required rather than optional for this reason.

In this MVP `true` appears on lesson 3 alone. A correct `GROUP BY` answer must never fail because
its rows came back in a different order. Getting this wrong tells correct people they are wrong,
which is the exact failure 5.1 exists to prevent.

**`NULL` equals `NULL` here**, and equals nothing else. This is deliberately not SQL's own
three-valued logic. We are comparing two result sets for sameness, not evaluating a predicate.

**SQL text is never compared.** Any query producing the correct result set passes, unless the
lesson sets `mustUse` and the query does not use it. Two different correct queries are both
correct.

#### How `mustUse` is checked

A substring search over the query text is wrong, and would accept this:

```sql
SELECT 'GROUP BY';
```

**Required clauses are detected as SQL tokens, outside comments and outside quoted strings.** A
keyword inside a string literal or a comment does not count as using it. As with the read-only
check, this brief states the required behaviour and the technical proof determines the smallest
dependable implementation.

### The validator

`npm run validate` runs every exercise and every Build target through the evaluator against its
own sheet, and fails on any of these:

1. The declared `expected` value is not what the canonical formula actually returns
2. A `gaps` exercise does not assemble into a formula that returns the expected value
3. A `range` exercise names a range outside its sheet
4. A lesson does not have exactly three exercises or exactly three takeaways
5. **A formula listed in `rejects` is accepted as correct**

Rule 5 is the important one. Checking that the right answer passes does not prove that wrong
answers fail. On a nine-row sheet two different formulas can land on the same value by accident.
So exercises carry negative cases, and the datasets are built to expose the common mistakes
rather than hide them:

- duplicate values, so a lookup that matches the wrong row gives a different answer
- text and blank cells in numeric columns, so `COUNT` and `COUNTA` genuinely differ
- header rows that produce a visibly wrong result if included in a range
- at least one row that makes an off-by-one range give the wrong total

Where a negative case is impractical for an exercise, `rejects` may be omitted. It is required
wherever a plausible wrong formula would otherwise coincidentally pass.

### The validator, SQL

`npm run validate` runs the SQL track through the same `sql.js` engine the browser uses, under
`tsx` in Node. If it validates against anything other than the real engine it is not a gate. It
fails on any of these:

6. A `canonical` query throws, or returns zero rows
7. A `gaps` exercise does not assemble into a query matching its canonical result
8. A lesson does not have exactly three exercises, in the order set by 5.13, or exactly three takeaways
9. A `TableSet` is not safely seedable. See the five checks below
10. A lesson takes the reserved id `cheat-sheet`
11. **A query listed in `rejects` is accepted as correct**
12. An exercise or Build target omits `orderMatters`
13. A `canonical` query is not an accepted read-only single statement, by the same rule the learner's query is held to

**Rule 9 in full.** The first draft of this rule said "declares a column the seeded table does not
have", which is not meaningful: a `Table` declares its columns and rows together, so there is no
second source to disagree with. What the rule actually has to guarantee is that the `TableSet` can
be turned into a SQLite database safely and unambiguously:

- table names are unique within the lesson
- column names are unique within each table
- every row has exactly as many values as the table declares columns
- every value is a `string`, a `number`, or `null`, and nothing else
- table and column names are valid identifiers for seeding, so that seeding never depends on
  quoting or escaping user-authored text

**Rule 11 matters more in SQL than rule 5 does in Excel.** Wrong SQL coincidentally producing the
right answer is far more common than wrong formulas doing it. A missing `GROUP BY` still returns
one plausible row. An `INNER JOIN` where a `LEFT JOIN` was needed still returns a sensible-looking
table, just a shorter one. Two rows swapped is invisible unless `orderMatters` is set correctly.

So the lesson datasets are built to expose those mistakes rather than hide them, the same way the
Excel sheets were built with duplicates and header traps:

- a region with exactly one order, so a bad `GROUP BY` still looks reasonable but totals wrong
- at least one row on each side of a join with no match, so `INNER` and `LEFT` genuinely differ
- duplicate values in a column that `DISTINCT` lessons target
- a `NULL` in an aggregated column, so `COUNT(col)` and `COUNT(*)` differ
- ties in any column an `ORDER BY` lesson sorts on, so row order is actually load bearing

`rejects` is required on every exercise where a plausible wrong query would otherwise pass. For
the SQL track that is most of them.

---

## 9. Visual direction

The reference Manuel chose is kiwitest.nz. What we take from it:

**Green is rationed.** Green appears in exactly four places and nowhere else: the logo mark, the
active sidebar item, the progress bar fill, and the primary button. If you are about to tint
something green, don't. This single rule is most of what makes the reference read as clean.

**Warm neutrals, never cool grey.** The page is a warm off-white. Borders are one hairline weight
at one pixel, used everywhere.

**No shadows, anywhere.** A card is a border and a radius. The only `box-shadow` in the codebase
is the focus ring.

**Monospace is load-bearing.** Any formula, cell reference, range or function name is monospace,
in headings and body alike. Prose is sans. That contrast is how the learner's eye learns to spot
a reference.

### Tokens

Defined once in `globals.css`. No hardcoded hex anywhere else in the codebase.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--page` | `#F7F7F4` | `#121412` | Page background |
| `--card` | `#FFFFFF` | `#1A1D1A` | Cards, sidebar, grid |
| `--raise` | `#FBFBF9` | `#1F231F` | Grid headers, signature block, fx label |
| `--ink` | `#1A1D1B` | `#ECEEEB` | Body text |
| `--ink-2` | `#5B605C` | `#A4AAA5` | Secondary text |
| `--ink-3` | `#8E938F` | `#767C77` | Labels, captions, placeholders |
| `--line` | `#E9E9E4` | `#2A2E2A` | Hairline borders, 1px |
| `--line-2` | `#F1F1EC` | `#232723` | Hover fills, softest dividers |
| `--green` | `#0F6E56` | `#5FC9A4` | The four green roles, nothing else |
| `--green-2` | `#0B5442` | `#8FDCC0` | Text on mint, button hover |
| `--mint` | `#E6F3EE` | `#16332A` | Active nav pill, correct feedback |
| `--mint-2` | `#C9E7DB` | `#1F4A3C` | Card hover border |
| `--track` | `#EDEDE8` | `#282C28` | Progress track, toggle track |

Argument chip tints. The same tint always means the same kind of argument, in every lesson.

| Tint | Light fill / text | Dark fill / text | Means |
|---|---|---|---|
| `lookup` | `#EEEDFE` / `#3B349B` | `#26244F` / `#BDB8F2` | The value you are looking for |
| `search` | `#FBEEDB` / `#7A4A0C` | `#3A2B10` / `#E8C286` | The range you search through |
| `return` | `#E6F3EE` / `#0B5442` | `#16332A` / `#8FDCC0` | The range you get back |
| `test`   | `#FBEAF0` / `#8C2F55` | `#3A1F2B` / `#F0AFC8` | A condition or criteria |

Feedback states. Correct reuses `--mint` and `--green-2`, deliberately: the same green that means
"you are here" also means "you got it".

| State | Light fill / text | Dark fill / text |
|---|---|---|
| Correct | `--mint` / `--green-2` | same tokens |
| Hint | `#FBEEDB` / `#6B4109` | `#3A2B10` / `#E8C286` |
| Reveal | `#FCECEC` / `#8C2E2E` | `#3A2020` / `#F0A6A6` |

Radius 8px on controls, 9px on inner blocks, 12px on cards. Borders 1px. Sans for prose,
`IBM Plex Mono` for every formula and reference.

### Accessibility

Not optional, and not a later pass.

- Every interactive control is a real `button`, `a`, or labelled input. No clickable `div`s
- Visible focus ring on everything focusable, using the token colours
- The grid is keyboard operable: cells and column headers are buttons with meaningful labels
- Feedback is announced with a live region, not colour alone
- Correct and wrong are distinguished by text and icon, never by colour by itself
- `prefers-reduced-motion` is respected

---

## 10. Ownership

**Claude:** the first-MVP implementation, and the SQL track implementation.

**Codex:** independent review, testing and deployment of the first MVP, the Excel expansion
explicitly assigned by Manuel on 5 September 2026, and the SQL engine proof and grading review
below.

**Manuel:** decides scope, arbitrates disagreements, owns the product.

### SQL track build sequence, agreed 6 September 2026

| # | Step | Owner |
|---|---|---|
| 1 | Approve the direction | Manuel. Done, 6 September |
| 2 | Update the mockup and BRIEF.md to draft 5 | Claude. Done, 6 September, including the review corrections |
| 3 | Isolated `sql.js` technical proof | Codex. Next |
| 4 | Shared SQL workspace and the GROUP BY reference lesson | Claude |
| 5 | The other seven lessons | Claude |
| 6 | Independent review of every grading edge case | Codex |
| 7 | One preview deployment | Codex |
| 8 | One production deployment, after Manuel approves | Codex |

**Step 3 gates step 4.** No lesson work starts until the engine is proven in isolation. What the
proof has to establish, at minimum:

- `sql.js` loads and runs under `output: "export"` on Next 16.3.4, with no server
- `AGENTS.md` applies here: read the guides in `node_modules/next/dist/docs/` rather than assuming
  behaviour from earlier Next versions
- The wasm loads only on `/sql/*` and never on `/formulas/*` or `/`
- The same engine runs under `tsx` in Node so the validator is real
- Cloudflare Pages serves the `.wasm` with a correct content type
- The real transfer size, measured rather than estimated

Two questions the brief deliberately leaves to the proof, because they are implementation
findings rather than contract decisions:

- **How to reliably identify a read-only single statement.** A text-prefix check is not
  sufficient. Report the smallest dependable method
- **How to detect `mustUse` clauses as SQL tokens** outside comments and quoted strings
- Whether SQLite already normalizes internal whitespace in computed column names, which would
  make that part of the normalization rule redundant

If any of those fail, the track stops and comes back to Manuel before anyone writes a lesson.

**Two deployments total.** One preview near the end, one production release after approval.

## 11. Copy rules

Applies to every word on the site.

- Sentence case. Never Title Case, never all caps.
- No exclamation marks. Ever.
- Cut "just", "simply", "easy", "obviously". They condescend.
- Second person. "You are searching for an order number."
- Plain words over correct-sounding words. Say "bring back", not "return the corresponding value".
- The first hint never gives the answer. It points at the reason.
- The second hint names the argument or range that is misunderstood, still without the answer.
- Explanations say why it worked in one or two sentences, not a lecture.
- Problems are real situations with a person in them. Someone asks you for something.
  Not "consider the following dataset".
- No apologising, no "coming soon", no cheering.

## 12. Estimates

Revised after Codex pointed out the first set were optimistic. The original numbers costed a
working XLOOKUP lesson. They should have costed the reference implementation, which every other
lesson gets copied from, so it has to be the good version: mobile, dark mode, error states,
keyboard access.

| Milestone | Estimate |
|---|---|
| XLOOKUP as a tested reference implementation | Half a day to a day |
| The remaining nine lessons, following that pattern | Several focused days |
| A dependable MVP, validator green, all routes built | Several focused days, not hours |
| Content that is genuinely good | Longer, and never really finished |

### SQL track

| Milestone | Estimate |
|---|---|
| Codex's isolated `sql.js` proof | Half a day. Gates everything after it |
| Shared lesson-shell refactor and SQL workspace | **Two to three focused days** |
| GROUP BY as the tested reference lesson | Half a day |
| The other seven lessons | Several focused days |
| Content that is genuinely good | Longer, same honest answer as Excel |

**Revised in review, and this is the second time this mistake has been caught.** The earlier
figure of one day costed only the new SQL parts: engine wrapper, editor, tables panel, result
comparison, validator extension. It ignored that `LessonView`, the sidebar, progress totals, the
lesson cards, next-lesson logic and the cheat sheet all currently assume Excel. Those have to be
made track-aware before a single SQL lesson can render. That refactor is the larger half of the
work and it was missing from the estimate entirely.

The workspace plus GROUP BY plays the role XLOOKUP played for Excel. It is the version everything
else is copied from, so it has to be the good one: mobile, dark mode, error states, keyboard
access.

## 13. Definition of done

Claude does not report completion until all of these are true:

**Excel track. Met as of the eighteen-lesson expansion.**

- All eighteen lessons load, each with exactly three real exercises. No placeholders anywhere
- All fifty-four exercises plus the eighteen Build targets pass the validator, including negative cases
- Type checking, linting and the production build all pass with no errors, and the build writes `out/`
- Progress survives a page refresh
- Light and dark both read correctly on every page
- Every page works at phone width
- Keyboard alone can complete a lesson
- The README explains setup, validation, testing and build

**SQL track. Not met. Nothing built.**

- All eight lessons load, each with exactly three real exercises in the 5.13 order. No placeholders
- All twenty-four exercises plus the eight Build targets pass the validator, including every `rejects` case
- The validator runs the real `sql.js` engine, not a stand-in
- Run query and Check answer behave as 5.12 describes, and a syntax error never counts as an attempt
- `orderMatters` is correct on every exercise, verified both ways: a reordered correct answer
  passes where ordering is not taught, and fails where it is
- The wasm loads only on `/sql/*`. `/` and `/formulas/*` do not fetch it, verified in the network panel
- The production build still writes a self-contained `out/` with no server dependency
- Both cheat sheets generate from lesson data
- Everything in the Excel list above still holds, on both tracks

If a requirement cannot be met, it is stated plainly in the report. Scope is never quietly
reduced.
