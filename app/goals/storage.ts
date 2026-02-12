import type { Goal } from "./types";
import { GOAL_CATEGORIES } from "./types";

const GOALS_KEY = "pld_goals_v1";

const VALID_CATEGORIES = new Set<string>(GOAL_CATEGORIES);

function isValidGoal(x: unknown): x is Goal {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  if (typeof o.id !== "string" || !o.id) return false;
  if (typeof o.title !== "string" || !o.title.trim()) return false;
  if (typeof o.category !== "string" || !VALID_CATEGORIES.has(o.category))
    return false;
  if (typeof o.createdAt !== "number" || !Number.isFinite(o.createdAt))
    return false;
  if (o.target !== undefined && (typeof o.target !== "number" || !Number.isFinite(o.target)))
    return false;
  if (o.unit !== undefined && typeof o.unit !== "string") return false;
  if (o.deadlineISO !== undefined) {
    if (typeof o.deadlineISO !== "string") return false;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(o.deadlineISO)) return false;
  }
  if (o.note !== undefined && typeof o.note !== "string") return false;
  return true;
}

export function loadGoals(): Goal[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(GOALS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidGoal);
  } catch {
    return [];
  }
}

export function saveGoals(goals: Goal[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
}
