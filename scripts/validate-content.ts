/**
 * Content validator. BRIEF.md section 8.
 *
 * Proving the declared answer works does not prove the wrong answers fail, so
 * this runs both directions on both tracks: every canonical must be accepted,
 * and everything listed in `rejects` must not be.
 *
 * The SQL half runs the real sql.js, the same package the browser loads. A
 * validator that checks against a stand-in is not a gate.
 *
 *   npm run validate
 */

import { existsSync } from "node:fs";
import {
  EXCEL_LESSONS,
  SQL_LESSONS,
  RESERVED_LESSON_IDS,
  TRACK_TARGET,
} from "@/content";
import { checkFormula, evaluate, formatValue } from "@/lib/evaluator";
import { parseRange, parseRef, colToIndex, indexToCol } from "@/lib/refs";
import type {
  Exercise,
  ExcelLesson,
  Sheet,
  SqlExercise,
  SqlLesson,
} from "@/lib/schema";
import { gradeQueryNode, runQueryNode } from "@/lib/sql/node";
import { validateTableSet } from "@/lib/sql/seed";
import { checkReadOnly, usesClause } from "@/lib/sql/tokenize";
import { assemble } from "@/components/sql/SqlGapsTask";
import { assetStatus } from "./sync-sql-assets.mjs";

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

/* --------------------------- Excel exercises ------------------------------ */

function checkExercise(lesson: ExcelLesson, ex: Exercise, seen: Set<string>): void {
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

function checkExcelLesson(
  lesson: ExcelLesson,
  seenIds: Set<string>,
  seenOrder: Set<number>,
): void {
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

/* ------------------------------ SQL, rules 6-13 --------------------------- */

interface SqlSpec {
  canonical: string;
  mustUse?: string[];
  orderMatters: boolean;
  rejects?: string[];
}

/**
 * Rules 6, 11, 12 and 13 for one canonical/rejects pair.
 *
 * Rule 11 matters more here than rule 5 does in Excel: wrong SQL coincidentally
 * producing the right answer is far more common than wrong formulas doing it.
 */
async function checkSqlSpec(
  where: string,
  spec: SqlSpec,
  lesson: SqlLesson,
): Promise<void> {
  // Rule 12. TypeScript requires the field, so this catches content that
  // reached the array through a cast or a JSON import.
  ok();
  if (typeof spec.orderMatters !== "boolean") {
    fail(where, "orderMatters is missing. Every exercise must state it explicitly");
  }

  // Rule 13. The canonical is held to the same read-only rule as the learner.
  ok();
  const readOnly = checkReadOnly(spec.canonical);
  if (!readOnly.allowed) {
    fail(
      where,
      `canonical is not an accepted read-only single statement (${readOnly.code}${
        readOnly.offending ? `: ${readOnly.offending}` : ""
      })`,
    );
    return;
  }

  // Rule 6.
  ok();
  const run = await runQueryNode(lesson.db, spec.canonical);
  if (!run.ok) {
    fail(where, `canonical did not run: ${run.message}`);
    return;
  }
  if (run.result.rows.length === 0) {
    fail(where, "canonical returned zero rows. A lesson answer must show something");
  }
  if (run.result.columns.length === 0) {
    fail(where, "canonical returned no columns");
  }

  // mustUse has to be satisfied by the canonical itself, or the requirement is
  // one the model answer would fail.
  for (const clause of spec.mustUse ?? []) {
    ok();
    if (!usesClause(spec.canonical, clause)) {
      fail(where, `canonical does not use ${clause}, which mustUse requires`);
    }
  }

  // Rule 11.
  for (const bad of spec.rejects ?? []) {
    ok();
    const grade = await gradeQueryNode(lesson.db, bad, spec);
    if (grade.kind === "correct") {
      fail(
        where,
        `rejected query "${bad}" was accepted as correct. Either the dataset cannot tell them apart, or the reject is wrong`,
      );
    }
  }
}

const RAMP: SqlExercise["type"][] = ["sql-gaps", "sql-guided", "sql-free"];

async function checkSqlExercise(
  lesson: SqlLesson,
  ex: SqlExercise,
  index: number,
  seen: Set<string>,
): Promise<void> {
  const where = `${lesson.id}/${ex.id}`;
  ok();

  if (seen.has(ex.id)) fail(where, "duplicate exercise id");
  seen.add(ex.id);

  // Rule 8, the ramp order half. BRIEF.md 5.13.
  ok();
  if (ex.type !== RAMP[index]) {
    fail(
      where,
      `is ${ex.type} at position ${index + 1}. The ramp is ${RAMP.join(", ")}`,
    );
  }

  copyCheck(`${where}.prompt`, ex.prompt);
  copyCheck(`${where}.hint`, ex.hint);
  copyCheck(`${where}.hint2`, ex.hint2);
  copyCheck(`${where}.explanation`, ex.explanation);

  await checkSqlSpec(where, ex, lesson);

  // Rule 7. The gaps template filled with the first accepted answer must match
  // the canonical result, not merely parse.
  if (ex.type === "sql-gaps") {
    ok();
    if (ex.gaps.length === 0) fail(where, "has no gaps");
    ex.gaps.forEach((gap, i) => {
      ok();
      if (!ex.template.includes(`{${i}}`)) {
        fail(where, `template has no {${i}} placeholder for gap ${i}`);
      }
      if (gap.accept.length === 0) fail(where, `gap ${i} accepts nothing`);
      if (
        new Set(gap.accept.map((a) => a.toUpperCase())).size !== gap.accept.length
      ) {
        fail(where, `gap ${i} lists the same answer twice`);
      }
    });

    const filled = assemble(
      ex.template,
      ex.gaps.map((g) => g.accept[0]),
    );
    ok();
    const grade = await gradeQueryNode(lesson.db, filled, ex);
    if (grade.kind !== "correct") {
      fail(
        where,
        `filled template "${filled.replace(/\s+/g, " ")}" does not match the canonical result (${grade.kind})`,
      );
    }
  }

  if (ex.type === "sql-guided") {
    ok();
    if (ex.starter.trim() === "") {
      fail(where, "a guided exercise needs starter SQL. That is what makes it guided");
    }
  }
}

async function checkSqlLesson(
  lesson: SqlLesson,
  seenIds: Set<string>,
  seenOrder: Set<number>,
): Promise<void> {
  const where = lesson.id;
  ok();

  if (seenIds.has(lesson.id)) fail(where, "duplicate lesson id");
  seenIds.add(lesson.id);

  // Rule 10. /sql/cheat-sheet is a static segment beside /sql/[id].
  ok();
  if (RESERVED_LESSON_IDS.includes(lesson.id)) {
    fail(where, `"${lesson.id}" is a reserved id and its route would be unreachable`);
  }

  if (seenOrder.has(lesson.order)) fail(where, `duplicate order ${lesson.order}`);
  seenOrder.add(lesson.order);

  // Rule 8.
  ok();
  if (lesson.exercises.length !== 3) {
    fail(where, `has ${lesson.exercises.length} exercises, needs exactly 3`);
  }
  if (lesson.takeaways.length !== 3) {
    fail(where, `has ${lesson.takeaways.length} takeaways, needs exactly 3`);
  }
  if (lesson.clauses.length === 0) fail(where, "has no clauses");

  copyCheck(`${where}.blurb`, lesson.blurb);
  copyCheck(`${where}.understand.problem`, lesson.understand.problem);
  copyCheck(`${where}.build.target`, lesson.build.target);
  copyCheck(`${where}.build.hint`, lesson.build.hint);
  copyCheck(`${where}.build.hint2`, lesson.build.hint2);
  copyCheck(`${where}.build.explanation`, lesson.build.explanation);
  lesson.takeaways.forEach((t, i) => copyCheck(`${where}.takeaways[${i}]`, t));

  // Rule 9, in full.
  ok();
  for (const p of validateTableSet(lesson.db)) {
    fail(`${where}.db.${p.table}`, p.message);
  }

  await checkSqlSpec(`${where}.build`, lesson.build, lesson);

  const seenExercises = new Set<string>();
  for (let i = 0; i < lesson.exercises.length; i++) {
    await checkSqlExercise(lesson, lesson.exercises[i], i, seenExercises);
  }
}

/* ------------------------------ engine assets ---------------------------- */

function checkSqlAssets(): void {
  for (const a of assetStatus()) {
    ok();
    if (a.sourceMissing) {
      fail("sql-assets", `sql.js is not installed, so ${a.name} cannot be checked`);
    } else if (a.copiedMissing) {
      fail(
        "sql-assets",
        `public/sql/${a.name} is missing. Run npm run sql:assets`,
      );
    } else if (!a.inSync) {
      fail(
        "sql-assets",
        `public/sql/${a.name} differs from the installed sql.js. Run npm run sql:assets`,
      );
    }
  }
  ok();
  if (!existsSync("public/sql/worker.js")) {
    fail("sql-assets", "public/sql/worker.js is missing");
  }
}

/* --------------------------------- run ----------------------------------- */

async function main(): Promise<void> {
  const seenIds = new Set<string>();

  const excelOrder = new Set<number>();
  EXCEL_LESSONS.forEach((l) => checkExcelLesson(l, seenIds, excelOrder));

  // A learner who notices the answer is always in the same slot stops reading
  // the options. Spread them out.
  const choicePositions = EXCEL_LESSONS.flatMap((l) =>
    l.exercises.filter((e) => e.type === "choice").map((e) => e.correctIndex),
  );
  ok();
  if (choicePositions.length > 2 && new Set(choicePositions).size < 3) {
    fail(
      "curriculum",
      `multiple choice answers sit in only ${new Set(choicePositions).size} distinct position(s) across ${choicePositions.length} exercises. Spread them out`,
    );
  }

  const sqlOrder = new Set<number>();
  for (const lesson of SQL_LESSONS) {
    await checkSqlLesson(lesson, seenIds, sqlOrder);
  }

  checkSqlAssets();

  const excelExercises = EXCEL_LESSONS.reduce((n, l) => n + l.exercises.length, 0);
  const sqlExercises = SQL_LESSONS.reduce((n, l) => n + l.exercises.length, 0);

  console.log(
    `Excel: ${EXCEL_LESSONS.length} lessons, ${excelExercises} exercises.\n` +
      `SQL:   ${SQL_LESSONS.length} lessons, ${sqlExercises} exercises.\n` +
      `${checks} checks.`,
  );

  if (problems.length > 0) {
    console.error(`\n${problems.length} problem${problems.length === 1 ? "" : "s"}:\n`);
    problems.forEach((p) => console.error(`  ${p}`));
    process.exit(1);
  }

  const excelDone =
    EXCEL_LESSONS.length === TRACK_TARGET.excel && excelExercises === TRACK_TARGET.excel * 3;
  const sqlDone =
    SQL_LESSONS.length === TRACK_TARGET.sql && sqlExercises === TRACK_TARGET.sql * 3;

  console.log(
    excelDone
      ? "Excel track complete, all green."
      : `Excel track: the brief calls for ${TRACK_TARGET.excel} lessons.`,
  );
  console.log(
    sqlDone
      ? "SQL track complete, all green."
      : `SQL track: ${SQL_LESSONS.length} of ${TRACK_TARGET.sql} lessons built. Everything built is green.`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
