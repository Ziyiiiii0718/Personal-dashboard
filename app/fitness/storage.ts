import type { WorkoutCategory, WorkoutEntry } from "./types";
import { WORKOUT_CATEGORIES } from "./types";

const STORAGE_KEY = "pld_workout_entries_v1";

function isWorkoutCategory(x: string): x is WorkoutCategory {
  return (WORKOUT_CATEGORIES as readonly string[]).includes(x);
}

function isIntensity(x: string): x is "low" | "medium" | "high" {
  return x === "low" || x === "medium" || x === "high";
}

export function loadEntries(): WorkoutEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is WorkoutEntry =>
        x &&
        typeof x === "object" &&
        typeof x.id === "string" &&
        typeof x.dateISO === "string" &&
        isWorkoutCategory(x.category) &&
        typeof x.title === "string" &&
        typeof x.createdAt === "string" &&
        (x.durationMin === undefined || typeof x.durationMin === "number") &&
        (x.intensity === undefined || isIntensity(x.intensity)) &&
        (x.notes === undefined || typeof x.notes === "string")
    );
  } catch {
    return [];
  }
}

export function saveEntries(entries: WorkoutEntry[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}
