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

/** Display order for sorting entries within a date. */
export const MEAL_ORDER: MealType[] = [...MEAL_TYPES];

export interface DietEntry {
  id: string;
  dateISO: string; // YYYY-MM-DD
  mealType: MealType;
  itemsText: string;
  calories?: number;
  note?: string;
  createdAt: string; // ISO
}
