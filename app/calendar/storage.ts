import type { DeadlineItem } from "./types";

const STORAGE_KEY = "pld_deadlines_v1";

export function loadDeadlines(): DeadlineItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is DeadlineItem =>
        x &&
        typeof x === "object" &&
        typeof x.id === "string" &&
        typeof x.title === "string" &&
        (x.type === "ddl" || x.type === "exam") &&
        typeof x.date === "string"
    );
  } catch {
    return [];
  }
}

export function saveDeadlines(items: DeadlineItem[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}
