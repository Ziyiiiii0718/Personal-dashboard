import type { DeadlineItem } from "../calendar/types";
import type { TodoItem } from "./types";

function todayISO(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Deadlines whose date (YYYY-MM-DD) is within the next 7 days, inclusive. */
function deadlinesInNext7Days(deadlines: DeadlineItem[]): DeadlineItem[] {
  const start = todayISO();
  const end = addDays(start, 6);
  return deadlines.filter(
    (d) => d.date >= start && d.date <= end
  );
}

/**
 * Syncs todos from deadlines: ensures one auto-todo per deadline in the next 7 days,
 * removes auto-todos whose deadline is gone or outside the window.
 */
export function syncTodosFromDeadlines(
  deadlines: DeadlineItem[],
  todos: TodoItem[]
): TodoItem[] {
  const inWindow = deadlinesInNext7Days(deadlines);
  const deadlineIdsInWindow = new Set(inWindow.map((d) => d.id));

  const autoTodosBySourceId = new Map<string, TodoItem>();
  const manualOrStale: TodoItem[] = [];
  for (const t of todos) {
    if (t.source === "deadline" && t.sourceId != null) {
      if (deadlineIdsInWindow.has(t.sourceId)) {
        autoTodosBySourceId.set(t.sourceId, t);
      }
      // else: stale, drop (don't add to manualOrStale)
    } else {
      manualOrStale.push(t);
    }
  }

  const synced: TodoItem[] = [...manualOrStale];
  const now = new Date().toISOString();

  for (const d of inWindow) {
    const existing = autoTodosBySourceId.get(d.id);
    if (existing) {
      synced.push(existing);
    } else {
      const prefix = d.type === "exam" ? "[Exam]" : "[DDL]";
      synced.push({
        id: crypto.randomUUID(),
        text: `${prefix} ${d.title}`,
        done: false,
        dueDateISO: d.date,
        source: "deadline",
        sourceId: d.id,
        createdAt: now,
      });
    }
  }

  return synced;
}
