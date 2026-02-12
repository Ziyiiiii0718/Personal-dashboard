import type { WeightEntry } from "./types";

const ENTRIES_KEY = "pld_weight_entries_v1";
const GOAL_KEY = "pld_goal_weight_kg_v1";

export function loadEntries(): WeightEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ENTRIES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is WeightEntry =>
        x &&
        typeof x === "object" &&
        typeof x.id === "string" &&
        typeof x.dateISO === "string" &&
        typeof x.weightKg === "number" &&
        typeof x.createdAt === "string"
    );
  } catch {
    return [];
  }
}

export function saveEntries(entries: WeightEntry[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
}

export function loadGoalKg(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(GOAL_KEY);
    if (raw == null) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export function saveGoalKg(kg: number | null): void {
  if (typeof window === "undefined") return;
  if (kg == null || !Number.isFinite(kg)) {
    window.localStorage.removeItem(GOAL_KEY);
  } else {
    window.localStorage.setItem(GOAL_KEY, String(kg));
  }
}
