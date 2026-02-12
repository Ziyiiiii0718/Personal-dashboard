"use client";

import { useCallback, useEffect, useState } from "react";
import type { TodoItem } from "./types";
import { loadTodos, saveTodos } from "./storage";
import { loadDeadlines } from "../calendar/storage";
import { syncTodosFromDeadlines } from "./sync";

function formatDue(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function TodoPage() {
  const [items, setItems] = useState<TodoItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const [newText, setNewText] = useState("");

  useEffect(() => {
    const deadlines = loadDeadlines();
    let todos = loadTodos();
    const synced = syncTodosFromDeadlines(deadlines, todos);
    if (synced.length !== todos.length || synced.some((t, i) => t.id !== todos[i]?.id)) {
      saveTodos(synced);
      todos = synced;
    }
    setItems(todos);
    setMounted(true);
  }, []);

  const persist = useCallback((next: TodoItem[]) => {
    setItems(next);
    saveTodos(next);
  }, []);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const text = newText.trim();
    if (!text) return;
    persist([
      ...items,
      {
        id: crypto.randomUUID(),
        text,
        done: false,
        source: "manual",
        createdAt: new Date().toISOString(),
      },
    ]);
    setNewText("");
  };

  const toggleDone = (id: string) => {
    persist(
      items.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const handleDelete = (id: string) => {
    persist(items.filter((t) => t.id !== id));
  };

  if (!mounted) {
    return (
      <div>
        <h1 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Todo
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400">Loading…</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Todo
      </h1>

      <form
        onSubmit={handleAdd}
        className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50"
      >
        <label className="flex flex-1 min-w-[200px] flex-col gap-1">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            New task
          </span>
          <input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Add a manual todo…"
            className="rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </label>
        <button
          type="submit"
          className="rounded bg-zinc-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-200 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Add
        </button>
      </form>

      <ul className="divide-y divide-zinc-200 dark:divide-zinc-700">
        {items.length === 0 ? (
          <li className="py-4 text-zinc-500 dark:text-zinc-400">
            No todos. Add one above or add deadlines on Calendar (they sync here within 7 days).
          </li>
        ) : (
          items.map((item) => (
            <li
              key={item.id}
              className="flex items-start gap-3 py-3 first:pt-0"
            >
              <input
                type="checkbox"
                checked={item.done}
                onChange={() => toggleDone(item.id)}
                className="mt-1 h-4 w-4 rounded border-zinc-300 dark:border-zinc-600"
              />
              <div className="min-w-0 flex-1">
                <span
                  className={
                    item.done
                      ? "text-zinc-500 line-through dark:text-zinc-400"
                      : "text-zinc-900 dark:text-zinc-100"
                  }
                >
                  {item.text}
                </span>
                {item.dueDateISO && (
                  <span className="ml-2 text-sm text-zinc-500 dark:text-zinc-400">
                    {formatDue(item.dueDateISO)}
                  </span>
                )}
                <span
                  className={
                    item.source === "deadline"
                      ? "ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
                      : "ml-2 rounded bg-zinc-200 px-1.5 py-0.5 text-xs text-zinc-600 dark:bg-zinc-600 dark:text-zinc-300"
                  }
                >
                  {item.source === "deadline" ? "From Calendar" : "Manual"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(item.id)}
                className="text-sm text-red-600 hover:underline dark:text-red-400"
              >
                Delete
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
