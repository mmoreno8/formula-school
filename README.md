# Formula School

Ten practical Excel formulas, taught through short interactive exercises.
Think W3Schools for Excel. It is not a spreadsheet clone.

The product contract lives in [BRIEF.md](./BRIEF.md). If this README and the
brief disagree, the brief wins.

---

## Running it

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Everything at once

```bash
npm run check
```

That runs, in order: type checking, linting, the content validator, the unit
tests, and the production build. It is the single command to run before
accepting a change.

## The individual commands

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run validate` | Content validator, see below |
| `npm test` | Unit tests, once |
| `npm run test:watch` | Unit tests, watching |
| `npm run build` | Production build, writes `out/` |

## The content validator

`npm run validate` is the important one. Every exercise declares the answer it
expects, and the validator runs that answer through the same formula evaluator
the app uses, against that exercise's own sheet data.

It checks both directions:

- every canonical formula is **accepted**, and returns the declared value
- every formula listed in an exercise's `rejects` is **refused**

That second rule is the point. Proving the right answer passes does not prove
the wrong ones fail. On a nine-row sheet, two different formulas can land on
the same value by luck, so exercises carry negative cases and the datasets are
built to expose the common mistakes rather than hide them: duplicate values,
text and blanks in numeric columns, and header rows that change the answer if
you include them.

It also enforces the parts of the contract that types cannot: exactly three
exercises and three takeaways per lesson, unique ids, ranges that exist on
their sheet, no exclamation marks, none of the banned words from the copy
rules, and multiple-choice answers spread across positions rather than always
sitting in the same slot.

## Deploying

The app is a **pure static export**. `npm run build` writes a self-contained
`out/` directory and that is the entire site.

**Cloudflare Pages settings**

| Setting | Value |
|---|---|
| Build command | `npm run build` |
| Output directory | `out` |
| Node version | 20 or newer |
| Environment variables | none |
| Functions | none |

There is deliberately no server-side anything: no API routes, no route
handlers, no server actions, no middleware, no database, no runtime server
dependencies. All ten lesson routes are generated at build time through
`generateStaticParams` with `dynamicParams = false`. Keep it that way and the
site will host anywhere.

---

## How it is put together

```
app/                      routes: Overview, Formulas, lesson pages, Cheat sheet
content/lessons/*.ts      the ten lessons, typed against lib/schema.ts
lib/schema.ts             the contract every lesson is written against
lib/evaluator/            tokenizer, parser and the Excel function table
lib/formulaHint.ts        which argument the caret is inside
lib/signatures.ts         argument names and labels for every function
lib/progress.ts           localStorage, read through useSyncExternalStore
components/engine/        grid, formula bar, argument hint, the four exercise types
components/layout/        sidebar, breadcrumbs, formula cards
scripts/validate-content  the build gate described above
```

### The formula evaluator

Typed formulas are graded by running them, not by matching strings. Matching
strings breaks on spacing, quotes, `$A$1` versus `A1` and `B2:B9` versus `B:B`,
and tells correct people they are wrong, which is the worst possible failure
for a teaching site.

`lib/evaluator/` is a real tokenizer and recursive descent parser with Excel's
operator precedence, plus a function table covering everything in the
curriculum: `SUM`, `AVERAGE`, `COUNT`, `COUNTA`, `IF`, `COUNTIF`, `SUMIF`,
`COUNTIFS`, `SUMIFS`, `VLOOKUP` and `XLOOKUP`. It models the things that matter
for teaching: blank cells are distinct from empty text so `COUNT` and `COUNTA`
genuinely differ, text is compared without case sensitivity, and errors
(`#N/A`, `#VALUE!`, `#REF!`, `#DIV/0!`) propagate the way Excel's do.

`checkFormula()` is the single place that decides whether a typed answer counts.
The Build step, the formula exercises and the validator all call it, so they
cannot disagree.

### Adding a lesson

1. Write `content/lessons/<id>.ts`, typed as `Lesson`
2. Add it to the array in `content/index.ts`
3. Run `npm run validate`

No page needs creating. The route, the card, the sidebar count and the cheat
sheet entry all come from the data.

### Colour

`app/globals.css` is the only file in the codebase allowed to contain a hex
colour. Everything else uses the tokens. Light lives on the bare `:root` so the
default system setting resolves correctly; dark is redefined under both
`prefers-color-scheme` and an explicit `[data-theme="dark"]`, so the toggle
wins in both directions.

Green appears in exactly four places and nowhere else: the logo mark, the
active sidebar item, the progress bar fill, and the primary button.

### Progress

Two things are stored per lesson and only these two: which exercises are done,
and whether the lesson is finished. No accuracy, no attempts counter, no hints
tally, no score. The formula cards show exercises completed out of three,
because that is what is actually stored.

There is no account and no database. Clearing site data clears progress, which
is why nothing important lives there.
