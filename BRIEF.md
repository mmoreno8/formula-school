# Formula School — build brief

Working document for three parties: Manuel (owner), Claude (implementation), Codex (review,
testing and deployment). This file is the single source of truth. If something is not in here,
it is not agreed. Anyone can propose a change, but change the file, do not change the code
and hope.

**Status: draft 4.** The first ten-lesson MVP is live. Manuel approved an eight-lesson Excel
expansion on 5 September 2026.

**Visual reference:** the clickable prototype is the design source of truth, not this document's
descriptions. When they disagree, the prototype wins.
https://claude.ai/code/artifact/3374507e-758a-47d7-a19e-cb0763e68bad

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

## 4. Non-goals

No user accounts. No database. No payments. No AI tutor. No Microsoft API. No spreadsheet clone.
No ribbon, no menus, no cell formatting, no multi-sheet workbooks. No downloadable workbooks.
No streaks, no badges, no confetti. No lesson gating: all ten are open from the first visit.

**No server-side anything.** No route handlers, no API routes, no server actions, no middleware,
no databases, no runtime server dependencies. The app is a pure static export and must stay one.
`next.config.ts` sets `output: "export"`, every lesson route is generated at build time through
`generateStaticParams`, and `npm run build` writes a self-contained `out/` directory. Break any of
this and the build stops producing something Cloudflare Pages can host.

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
Ten cards, each with the formula name, one line on what it does, a progress bar, and how many
exercises are done.

---

## 6. Lesson flow

Four steps, shown as a rail beside the lesson.

**Understand.** A short real problem in plain words, then the formula signature with each
argument as a coloured chip: `=XLOOKUP(who to find, where to look, what to bring back)`.
Chip colours are consistent across the whole site so the learner builds a visual habit.

**Build.** The guided formula bar described in 5.2, against the lesson's sheet. One target,
one correct result.

**Practise.** Exactly three exercises, drawn from four types: multiple choice, fill the gaps,
select a range on the grid, enter the complete formula.

**Done.** Three takeaway bullets, progress, back to the list, redo the lesson.

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
| Overview | `/` | Where you are up to, and the next thing to do |
| Formulas | `/formulas` | The ten-card grid |
| Cheat sheet | `/cheat-sheet` | Every signature on one page, generated from lesson data |

Lessons live at `/formulas/[id]`, for example `/formulas/xlookup`.

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

**Claude:** the first-MVP implementation.

**Codex:** independent review, testing and deployment of the first MVP, plus the Excel expansion
explicitly assigned by Manuel on 5 September 2026.

**Manuel:** decides scope, arbitrates disagreements, owns the product.

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

## 13. Definition of done

Claude does not report completion until all of these are true:

- All eighteen lessons load, each with exactly three real exercises. No placeholders anywhere
- All fifty-four exercises plus the eighteen Build targets pass the validator, including negative cases
- Type checking, linting and the production build all pass with no errors, and the build writes `out/`
- Progress survives a page refresh
- Light and dark both read correctly on every page
- Every page works at phone width
- Keyboard alone can complete a lesson
- The README explains setup, validation, testing and build

If a requirement cannot be met, it is stated plainly in the report. Scope is never quietly
reduced.
