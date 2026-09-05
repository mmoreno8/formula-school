/** Dumps the correct answer for every exercise, so an end-to-end walk of the
 *  running app can drive each one. Not part of the app; a testing aid. */
import { EXCEL_LESSONS } from "@/content";

const key = EXCEL_LESSONS.map((l) => ({
  id: l.id,
  name: l.name,
  build: l.build.canonical,
  exercises: l.exercises.map((e) => {
    switch (e.type) {
      case "choice":
        return { id: e.id, type: e.type, answer: e.correctIndex };
      case "gaps":
        return { id: e.id, type: e.type, answer: e.gaps.map((g) => g.accept[0]) };
      case "range":
        return { id: e.id, type: e.type, answer: e.correctRange };
      case "formula":
        return { id: e.id, type: e.type, answer: e.canonical };
    }
  }),
}));

console.log(JSON.stringify(key));
