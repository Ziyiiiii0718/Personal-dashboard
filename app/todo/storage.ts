import type { TodoItem } from "./types";

const STORAGE_KEY = "pld_todos_v1";

export function loadTodos(): TodoItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is TodoItem =>
        x &&
        typeof x === "object" &&
        typeof x.id === "string" &&
        typeof x.text === "string" &&
        typeof x.done === "boolean" &&
        (x.source === "manual" || x.source === "deadline") &&
        typeof x.createdAt === "string"
    );
  } catch {
    return [];
  }
}

export function saveTodos(items: TodoItem[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}
