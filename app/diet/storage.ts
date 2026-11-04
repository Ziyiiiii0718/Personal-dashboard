import type { DietEntry, MealType } from "./types";
import { MEAL_TYPES } from "./types";

const STORAGE_KEY = "pld_diet_entries_v1";

function isMealType(x: string): x is MealType {
  return (MEAL_TYPES as readonly string[]).includes(x);
}

function isOptionalNumber(x: unknown): boolean {
  return x === undefined || typeof x === "number";
}

export function loadEntries(): DietEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is DietEntry =>
        x &&
        typeof x === "object" &&
        typeof x.id === "string" &&
        typeof x.dateISO === "string" &&
        isMealType(x.mealType) &&
        typeof x.itemsText === "string" &&
        typeof x.createdAt === "string" &&
        isOptionalNumber(x.calories) &&
        isOptionalNumber(x.protein) &&
        isOptionalNumber(x.carbs) &&
        isOptionalNumber(x.fat) &&
        (x.note === undefined || typeof x.note === "string") &&
        (x.aiGenerated === undefined || typeof x.aiGenerated === "boolean")
    );
  } catch {
    return [];
  }
}

export function saveEntries(entries: DietEntry[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}
