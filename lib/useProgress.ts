"use client";

import { useSyncExternalStore } from "react";
import {
  progressSnapshot,
  serverProgressSnapshot,
  subscribeProgress,
  type ProgressMap,
} from "@/lib/progress";

/**
 * localStorage is an external store, so it is read through the API React
 * provides for external stores rather than copied into state inside an effect.
 * During static generation the snapshot is the empty map, and the real value
 * appears as soon as the page hydrates.
 */
export function useProgress(): ProgressMap {
  return useSyncExternalStore(
    subscribeProgress,
    progressSnapshot,
    serverProgressSnapshot,
  );
}
