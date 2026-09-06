"use client";

/**
 * Progress lives in localStorage and nowhere else. BRIEF.md section 6.
 *
 * Three things are stored per lesson and only these three: which exercises are
 * done, whether the lesson is finished, and whether the Build step has been
 * solved. No accuracy, no attempts, no hints-used tally, no score. If it is not
 * here, the UI does not claim it.
 */

const KEY = "formula-school.progress.v1";

export interface LessonProgress {
  /** Exercise ids that have been completed. */
  done: string[];
  /** True once every exercise in the lesson is done. See markFinished. */
  finished: boolean;
  /** True once the Build step has been solved. */
  built: boolean;
}

export type ProgressMap = Record<string, LessonProgress>;

export const EMPTY_LESSON: LessonProgress = {
  done: [],
  finished: false,
  built: false,
};

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function readProgress(): ProgressMap {
  if (!isBrowser()) return {};
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return {};

    const out: ProgressMap = {};
    for (const [id, value] of Object.entries(parsed as Record<string, unknown>)) {
      const v = value as Partial<LessonProgress>;
      out[id] = {
        done: Array.isArray(v.done) ? v.done.filter((d) => typeof d === "string") : [],
        finished: v.finished === true,
        built: v.built === true,
      };
    }
    return out;
  } catch {
    // Private mode, cleared storage, corrupted JSON. Start clean rather than throw.
    return {};
  }
}

export function writeProgress(map: ProgressMap): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
    window.dispatchEvent(new Event(PROGRESS_EVENT));
  } catch {
    // Storage full or blocked. Progress is a convenience, never a blocker.
  }
}

/** Keep every completed piece from both the device and the cloud. */
export function mergeProgress(a: ProgressMap, b: ProgressMap): ProgressMap {
  const merged: ProgressMap = {};
  for (const id of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const left = lessonProgress(a, id);
    const right = lessonProgress(b, id);
    merged[id] = {
      done: [...new Set([...left.done, ...right.done])],
      built: left.built || right.built,
      finished: left.finished || right.finished,
    };
  }
  return merged;
}

export const PROGRESS_EVENT = "formula-school:progress";

/**
 * useSyncExternalStore needs a snapshot that is referentially stable between
 * renders, so the parsed map is cached and only rebuilt when the raw string
 * actually changes.
 */
let cachedRaw: string | null = null;
let cachedMap: ProgressMap = {};

export function progressSnapshot(): ProgressMap {
  if (!isBrowser()) return EMPTY_MAP;
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return EMPTY_MAP;
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedMap = readProgress();
  }
  return cachedMap;
}

/** Stable empty map, so the server snapshot never changes identity. */
export const EMPTY_MAP: ProgressMap = {};

export function serverProgressSnapshot(): ProgressMap {
  return EMPTY_MAP;
}

export function subscribeProgress(onChange: () => void): () => void {
  window.addEventListener(PROGRESS_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(PROGRESS_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function lessonProgress(map: ProgressMap, lessonId: string): LessonProgress {
  return map[lessonId] ?? EMPTY_LESSON;
}

export function markExerciseDone(lessonId: string, exerciseId: string): void {
  const map = readProgress();
  const current = lessonProgress(map, lessonId);
  if (current.done.includes(exerciseId)) return;
  map[lessonId] = { ...current, done: [...current.done, exerciseId] };
  writeProgress(map);
}

export function markBuilt(lessonId: string): void {
  const map = readProgress();
  const current = lessonProgress(map, lessonId);
  if (current.built) return;
  map[lessonId] = { ...current, built: true };
  writeProgress(map);
}

/**
 * Finished means the three exercises are done, not that the learner reached
 * the last screen. The rail lets you jump anywhere, so the guard lives here
 * rather than in the view: no caller can mark a lesson finished early.
 */
export function markFinished(lessonId: string, requiredExerciseIds: string[]): void {
  const map = readProgress();
  const current = lessonProgress(map, lessonId);
  if (current.finished) return;
  if (!requiredExerciseIds.every((id) => current.done.includes(id))) return;
  map[lessonId] = { ...current, finished: true };
  writeProgress(map);
}

export function resetLesson(lessonId: string): void {
  const map = readProgress();
  delete map[lessonId];
  writeProgress(map);
}

export function resetEverything(): void {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(KEY);
    window.dispatchEvent(new Event(PROGRESS_EVENT));
  } catch {
    // ignore
  }
}
