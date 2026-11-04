export const MEAL_TYPES = [
  "breakfast",
  "morning_snack",
  "lunch",
  "afternoon_snack",
  "dinner",
  "late_snack",
] as const;

export type MealType = (typeof MEAL_TYPES)[number];

export const MEAL_LABELS: Record<MealType, string> = {
  breakfast: "Breakfast",
  morning_snack: "Morning Snack",
  lunch: "Lunch",
  afternoon_snack: "Afternoon Snack",
  dinner: "Dinner",
  late_snack: "Late Snack",
};

/** The meal most likely being logged at the given time of day. */
export function mealTypeForTime(date: Date = new Date()): MealType {
  const minutes = date.getHours() * 60 + date.getMinutes();
  if (minutes < 5 * 60) return "late_snack";
  if (minutes < 10 * 60) return "breakfast";
  if (minutes < 11 * 60 + 30) return "morning_snack";
  if (minutes < 14 * 60) return "lunch";
  if (minutes < 17 * 60) return "afternoon_snack";
  if (minutes < 21 * 60) return "dinner";
  return "late_snack";
}

/** Display order for sorting entries within a date. */
export const MEAL_ORDER: MealType[] = [...MEAL_TYPES];

export interface DietEntry {
  id: string;
  dateISO: string; // YYYY-MM-DD
  mealType: MealType;
  itemsText: string;
  calories?: number;
  /** Macronutrients in grams (optional). */
  protein?: number;
  carbs?: number;
  fat?: number;
  note?: string;
  /** True when this entry was created via the AI assistant. */
  aiGenerated?: boolean;
  createdAt: string; // ISO
}

/**
 * A remembered food with its nutrition facts — typically captured from a
 * nutrition label photo, then reused by the AI when estimating meals.
 * Values are stated for whatever `basis` describes (e.g. "per 100g").
 */
export interface FoodItem {
  id: string;
  name: string;
  /** What the nutrition numbers refer to, e.g. "per 100g", "per 1 cup (240ml)". */
  basis: string;
  calories?: number;
  protein?: number; // grams
  carbs?: number; // grams
  fat?: number; // grams
  note?: string;
  createdAt: string; // ISO
}

/** Calories implied by macros (4 kcal/g protein and carbs, 9 kcal/g fat). */
export function caloriesFromMacros(
  protein?: number,
  carbs?: number,
  fat?: number
): number | undefined {
  if (protein == null && carbs == null && fat == null) return undefined;
  return Math.round((protein ?? 0) * 4 + (carbs ?? 0) * 4 + (fat ?? 0) * 9);
}

/** Free-form notes about how the user cooks / their usual portions. */
export interface CookingHabits {
  text: string;
  updatedAt: string; // ISO
}

/** One food item as parsed/estimated by the AI from a meal description. */
export interface ParsedMealItem {
  name: string;
  /** Human-readable amount, e.g. "1 bowl", "200g", "2 eggs". */
  quantity?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  /** id of a FoodItem in the library this was matched against, if any. */
  matchedFoodId?: string;
  note?: string;
}

/** Shape returned by the /api/ai/parse-meal route. */
export interface ParsedMealResult {
  items: ParsedMealItem[];
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  summary?: string;
}
