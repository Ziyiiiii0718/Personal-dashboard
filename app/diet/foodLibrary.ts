import type { FoodItem } from "./types";

const STORAGE_KEY = "pld_food_library_v1";

function isOptionalNumber(x: unknown): boolean {
  return x === undefined || typeof x === "number";
}

export function loadFoodLibrary(): FoodItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is FoodItem =>
        x &&
        typeof x === "object" &&
        typeof x.id === "string" &&
        typeof x.name === "string" &&
        typeof x.basis === "string" &&
        typeof x.createdAt === "string" &&
        isOptionalNumber(x.calories) &&
        isOptionalNumber(x.protein) &&
        isOptionalNumber(x.carbs) &&
        isOptionalNumber(x.fat) &&
        (x.note === undefined || typeof x.note === "string")
    );
  } catch {
    return [];
  }
}

export function saveFoodLibrary(items: FoodItem[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}
