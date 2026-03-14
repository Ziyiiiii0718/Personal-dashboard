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
            <span className="text-xs font-medium text-muted">
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
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          List
        </h2>
        {items.length === 0 ? (
          <p className="rounded-2xl border border-border bg-surface-card p-6 text-center text-sm text-muted">
            No todos. Add one above or add deadlines on Calendar (they sync here within 7 days).
          </p>
        ) : (
          <Card>
            <ul className="divide-y divide-divide">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start gap-3 py-3 first:pt-0"
                >
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() => toggleDone(item.id)}
                    className="mt-1 h-4 w-4 rounded border-input-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                  />
                  <div className="min-w-0 flex-1">
                    <span
                      className={
                        item.done
                          ? "text-muted line-through"
                          : "text-foreground"
                      }
                    >
                      {item.text}
                    </span>
                    {item.dueDateISO && (
                      <span className="ml-2 text-sm text-muted">
                        {formatDue(item.dueDateISO)}
                      </span>
                    )}
                    <span className="ml-2">
                      <Badge
                        className={
                          item.source === "deadline"
                            ? "bg-sidebar-active text-foreground"
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
                    className="text-sm text-danger hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
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
