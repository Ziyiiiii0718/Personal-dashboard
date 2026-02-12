"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge, Button, Card, Input, PageLayout } from "../components/ui";
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
    return <PageLayout title="Todo" loading />;
  }

  return (
    <PageLayout title="Todo">
      <Card>
        <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-4">
          <label className="flex flex-1 min-w-[200px] flex-col gap-1.5">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              New task
            </span>
            <Input
              type="text"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="Add a manual todo…"
            />
          </label>
          <Button type="submit">Add</Button>
        </form>
      </Card>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
          List
        </h2>
        {items.length === 0 ? (
          <p className="rounded-2xl border border-black/5 bg-white/80 p-6 text-center text-sm text-zinc-500 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400">
            No todos. Add one above or add deadlines on Calendar (they sync here within 7 days).
          </p>
        ) : (
          <Card>
            <ul className="divide-y divide-zinc-200 dark:divide-zinc-700">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start gap-3 py-3 first:pt-0"
                >
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() => toggleDone(item.id)}
                    className="mt-1 h-4 w-4 rounded border-zinc-300 dark:border-zinc-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
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
                    <span className="ml-2">
                      <Badge
                        className={
                          item.source === "deadline"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
                            : ""
                        }
                      >
                        {item.source === "deadline" ? "From Calendar" : "Manual"}
                      </Badge>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="text-sm text-red-600 hover:underline dark:text-red-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </PageLayout>
  );
}
