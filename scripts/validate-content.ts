/**
 * Content validator. BRIEF.md section 8.
 *
 * Proving the declared answer works does not prove the wrong answers fail, so
 * this runs both directions: every canonical formula must be accepted, and
 * every formula listed in `rejects` must not be.
 *
 *   npm run validate
 */

import { LESSONS } from "@/content";
import { checkFormula, evaluate, formatValue } from "@/lib/evaluator";
import { parseRange, parseRef, colToIndex, indexToCol } from "@/lib/refs";
import type { Exercise, Lesson, Sheet } from "@/lib/schema";

const problems: string[] = [];
let checks = 0;

function fail(where: string, message: string): void {
  problems.push(`${where}: ${message}`);
}

function ok(): void {
  checks++;
}

/* ------------------------------ copy rules ------------------------------- */

const BANNED = /\b(just|simply|easy|easily|obviously)\b/i;

function copyCheck(where: string, text: string): void {
  ok();
  if (text.includes("!")) {
    fail(where, `contains an exclamation mark: "${text.slice(0, 60)}"`);
  }
  const banned = BANNED.exec(text);
  if (banned) {
    fail(where, `uses the banned word "${banned[0]}" (copy rules, section 11)`);
  }
  if (text.trim() === "") fail(where, "is empty");
}

/* -------------------------------- sheets --------------------------------- */

function maxColOf(sheet: Sheet): number {
  return sheet.cols.reduce((m, c) => Math.max(m, c ? colToIndex(c) : 0), 0);
}

function checkSheet(where: string, sheet: Sheet): void {
  ok();
  if (sheet.rows < 1) fail(where, "has no rows");
  if (sheet.cols.length === 0) fail(where, "has no columns");

  const limit = maxColOf(sheet);
  for (const ref of Object.keys(sheet.cells)) {
    const addr = parseRef(ref);
    if (!addr) {
      fail(where, `cell key "${ref}" is not a reference`);
      continue;
    }
    if (addr.row > sheet.rows) {
      fail(where, `cell ${ref} is below the sheet's ${sheet.rows} rows`);
    }
    if (addr.col > limit) {
      fail(where, `cell ${ref} is past the last column (${indexToCol(limit)})`);
    }
  }
}

/* ------------------------------- formulas -------------------------------- */

interface Spec {
  expected: string | number | boolean;
  mustUse: string[];
  canonical: string;
  rejects?: string[];
}

function checkFormulaSpec(where: string, spec: Spec, sheet: Sheet): void {
  ok();
  const res = evaluate(spec.canonical, sheet);
  if (!res.ok) {
    fail(where, `canonical formula does not parse: ${res.message}`);
    return;
  }

  const verdict = checkFormula(spec.canonical, sheet, spec);
  if (!("status" in verdict) || verdict.status !== "correct") {
    fail(
      where,
      `canonical "${spec.canonical}" returns ${JSON.stringify(
        formatValue(res.value),
      )} but expected ${JSON.stringify(spec.expected)}`,
    );
  }

  for (const fn of spec.mustUse) {
    ok();
    if (!res.functions.has(fn.toUpperCase())) {
      fail(where, `canonical formula does not use ${fn}, which mustUse requires`);
    }
  }

  for (const bad of spec.rejects ?? []) {
    ok();
    const r = checkFormula(bad, sheet, spec);
    if ("status" in r && r.status === "correct") {
      fail(
        where,
        `rejected formula "${bad}" was accepted as correct. Either the dataset cannot tell them apart, or the reject is wrong`,
      );
    }
  }
}

/* ------------------------------- exercises ------------------------------- */

function checkExercise(lesson: Lesson, ex: Exercise, seen: Set<string>): void {
  const where = `${lesson.id}/${ex.id}`;
  ok();

  if (seen.has(ex.id)) fail(where, "duplicate exercise id");
  seen.add(ex.id);

  copyCheck(`${where}.prompt`, ex.prompt);
  copyCheck(`${where}.hint`, ex.hint);
  copyCheck(`${where}.hint2`, ex.hint2);
  copyCheck(`${where}.explanation`, ex.explanation);

  const sheet = ex.sheet ?? lesson.sheet;
  if (ex.sheet) checkSheet(`${where}.sheet`, ex.sheet);

  switch (ex.type) {
    case "choice": {
      ok();
      if (ex.options.length < 2) fail(where, "needs at least two options");
      if (ex.correctIndex < 0 || ex.correctIndex >= ex.options.length) {
        fail(where, `correctIndex ${ex.correctIndex} is outside the options`);
      }
      if (new Set(ex.options).size !== ex.options.length) {
        fail(where, "has duplicate options");
      }
      for (const key of Object.keys(ex.optionHints ?? {})) {
        const i = Number(key);
        if (Number.isNaN(i) || i < 0 || i >= ex.options.length) {
          fail(where, `optionHints key "${key}" is outside the options`);
        } else if (i === ex.correctIndex) {
          fail(where, "has an optionHint on the correct answer");
        } else {
          copyCheck(`${where}.optionHints[${i}]`, ex.optionHints![i]);
        }
      }
      break;
    }

    case "gaps": {
      ok();
      if (ex.gaps.length === 0) fail(where, "has no gaps");
      ex.gaps.forEach((gap, i) => {
        ok();
        if (!ex.template.includes(`{${i}}`)) {
          fail(where, `template has no {${i}} placeholder for gap ${i}`);
        }
        if (gap.accept.length === 0) {
          fail(where, `gap ${i} accepts nothing`);
        }
        if (new Set(gap.accept.map((a) => a.toUpperCase())).size !== gap.accept.length) {
          fail(where, `gap ${i} lists the same answer twice`);
        }
      });

      // The template filled with the first accepted answer must be a real formula.
      let assembled = ex.template;
      ex.gaps.forEach((gap, i) => {
        assembled = assembled.replace(`{${i}}`, gap.accept[0]);
      });
      ok();
      const res = evaluate(assembled, sheet);
      if (!res.ok) {
        fail(where, `filled template "${assembled}" does not parse: ${res.message}`);
      } else if (res.value === null) {
        fail(where, `filled template "${assembled}" returns nothing`);
      }
      break;
    }

    case "range": {
      ok();
      const parsed = parseRange(ex.correctRange, sheet.rows);
      if (!parsed) {
        fail(where, `correctRange "${ex.correctRange}" is not a range`);
      } else {
        if (parsed.r2 > sheet.rows) {
          fail(where, `correctRange "${ex.correctRange}" runs past the sheet`);
        }
        if (parsed.c2 > maxColOf(sheet)) {
          fail(where, `correctRange "${ex.correctRange}" is past the last column`);
        }
      }
      for (const [ref, why] of Object.entries(ex.nearMisses ?? {})) {
        ok();
        if (!parseRange(ref, sheet.rows)) {
          fail(where, `nearMiss key "${ref}" is not a range`);
        }
        if (ref.toUpperCase() === ex.correctRange.toUpperCase()) {
          fail(where, "lists the correct range as a near miss");
        }
        copyCheck(`${where}.nearMisses[${ref}]`, why);
      }
      break;
    }

    case "formula":
      checkFormulaSpec(where, ex, sheet);
      break;
  }
}

/* -------------------------------- lessons -------------------------------- */

function checkLesson(lesson: Lesson, seenIds: Set<string>, seenOrder: Set<number>): void {
  const where = lesson.id;
  ok();

  if (seenIds.has(lesson.id)) fail(where, "duplicate lesson id");
  seenIds.add(lesson.id);

  if (seenOrder.has(lesson.order)) fail(where, `duplicate order ${lesson.order}`);
  seenOrder.add(lesson.order);

  if (lesson.exercises.length !== 3) {
    fail(where, `has ${lesson.exercises.length} exercises, needs exactly 3`);
  }
  if (lesson.takeaways.length !== 3) {
    fail(where, `has ${lesson.takeaways.length} takeaways, needs exactly 3`);
  }
  if (lesson.signatures.length === 0) fail(where, "has no signatures");

  copyCheck(`${where}.blurb`, lesson.blurb);
  copyCheck(`${where}.understand.problem`, lesson.understand.problem);
  copyCheck(`${where}.build.target`, lesson.build.target);
  copyCheck(`${where}.build.hint`, lesson.build.hint);
  copyCheck(`${where}.build.hint2`, lesson.build.hint2);
  copyCheck(`${where}.build.explanation`, lesson.build.explanation);
  lesson.takeaways.forEach((t, i) => copyCheck(`${where}.takeaways[${i}]`, t));

  checkSheet(`${where}.sheet`, lesson.sheet);
  checkFormulaSpec(`${where}.build`, lesson.build, lesson.sheet);

  const seenExercises = new Set<string>();
  lesson.exercises.forEach((ex) => checkExercise(lesson, ex, seenExercises));
}

/* --------------------------------- run ----------------------------------- */

const seenIds = new Set<string>();
const seenOrder = new Set<number>();
LESSONS.forEach((l) => checkLesson(l, seenIds, seenOrder));

// A learner who notices the answer is always in the same slot stops reading
// the options. Spread them out.
const choicePositions = LESSONS.flatMap((l) =>
  l.exercises.filter((e) => e.type === "choice").map((e) => e.correctIndex),
);
ok();
if (choicePositions.length > 2 && new Set(choicePositions).size < 3) {
  fail(
    "curriculum",
    `multiple choice answers sit in only ${new Set(choicePositions).size} distinct position(s) across ${choicePositions.length} exercises. Spread them out`,
  );
}

const exerciseCount = LESSONS.reduce((n, l) => n + l.exercises.length, 0);

console.log(
  `Validated ${LESSONS.length} lesson${LESSONS.length === 1 ? "" : "s"}, ` +
    `${exerciseCount} exercise${exerciseCount === 1 ? "" : "s"}, ${checks} checks.`,
);

if (problems.length > 0) {
  console.error(`\n${problems.length} problem${problems.length === 1 ? "" : "s"}:\n`);
  problems.forEach((p) => console.error(`  ${p}`));
  process.exit(1);
}

if (LESSONS.length === 18 && exerciseCount === 54) {
  console.log("Eighteen lessons, fifty-four exercises, all green.");
} else {
  console.log(
    `Note: the brief calls for 18 lessons and 54 exercises. Currently ${LESSONS.length} and ${exerciseCount}.`,
  );
}
