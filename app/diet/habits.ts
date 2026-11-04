import type { CookingHabits } from "./types";

const STORAGE_KEY = "pld_cooking_habits_v1";

export function loadHabits(): CookingHabits {
  if (typeof window === "undefined") return { text: "", updatedAt: "" };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { text: "", updatedAt: "" };
    const parsed = JSON.parse(raw) as unknown;
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof (parsed as CookingHabits).text === "string"
    ) {
      return {
        text: (parsed as CookingHabits).text,
        updatedAt:
          typeof (parsed as CookingHabits).updatedAt === "string"
            ? (parsed as CookingHabits).updatedAt
            : "",
      };
    }
    return { text: "", updatedAt: "" };
  } catch {
    return { text: "", updatedAt: "" };
  }
}

export function saveHabits(habits: CookingHabits): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
}
