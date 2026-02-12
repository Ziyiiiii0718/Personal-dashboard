"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge, Button, Card, Input, PageLayout, Select } from "../components/ui";
import type { DeadlineItem, DeadlineType } from "./types";
import { loadDeadlines, saveDeadlines } from "./storage";
import { loadTodos, saveTodos } from "../todo/storage";
import { syncTodosFromDeadlines } from "../todo/sync";

function sortByDate(items: DeadlineItem[]): DeadlineItem[] {
  return [...items].sort((a, b) => a.date.localeCompare(b.date));
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function CalendarPage() {
  const [items, setItems] = useState<DeadlineItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<DeadlineType>("ddl");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    setItems(loadDeadlines());
    setMounted(true);
  }, []);

  const persist = useCallback((next: DeadlineItem[]) => {
    setItems(next);
    saveDeadlines(next);
    const todos = loadTodos();
    saveTodos(syncTodosFromDeadlines(next, todos));
  }, []);

  const resetForm = useCallback(() => {
    setEditingId(null);
    setTitle("");
    setType("ddl");
    setDate("");
    setNotes("");
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle || !date) return;

    if (editingId) {
      persist(
        items.map((it) =>
          it.id === editingId
            ? { ...it, title: trimmedTitle, type, date, notes: notes.trim() || undefined }
            : it
        )
      );
      resetForm();
      return;
    }

    const newItem: DeadlineItem = {
      id: crypto.randomUUID(),
      title: trimmedTitle,
      type,
      date,
      notes: notes.trim() || undefined,
    };
    persist(sortByDate([...items, newItem]));
    resetForm();
  };

  const handleEdit = (item: DeadlineItem) => {
    setEditingId(item.id);
    setTitle(item.title);
    setType(item.type);
    setDate(item.date);
    setNotes(item.notes ?? "");
  };

  const handleDelete = (id: string) => {
    persist(items.filter((it) => it.id !== id));
    if (editingId === id) resetForm();
  };

  const sorted = sortByDate(items);

  if (!mounted) {
    return <PageLayout title="Calendar" loading />;
  }

  return (
    <PageLayout title="Calendar">
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Title
              </span>
              <Input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Essay due"
                className="w-48"
                required
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Type
              </span>
              <Select
                value={type}
                onChange={(e) => setType(e.target.value as DeadlineType)}
                className="w-36"
              >
                <option value="ddl">Deadline</option>
                <option value="exam">Exam</option>
              </Select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Date
              </span>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Notes (optional)
              </span>
              <Input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional"
                className="w-40"
              />
            </label>
          </div>
          <div className="flex gap-2">
            <Button type="submit">{editingId ? "Update" : "Add"}</Button>
            {editingId && (
              <Button type="button" variant="secondary" onClick={resetForm}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Card>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
          Deadlines
        </h2>
        {sorted.length === 0 ? (
          <p className="rounded-2xl border border-black/5 bg-white/80 p-6 text-center text-sm text-zinc-500 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400">
            No deadlines yet. Add one above.
          </p>
        ) : (
          <Card>
            <ul className="divide-y divide-zinc-200 dark:divide-zinc-700">
              {sorted.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0"
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {item.title}
                    </span>
                    <Badge className="ml-2">
                      {item.type === "exam" ? "Exam" : "DDL"}
                    </Badge>
                    <span className="ml-2 text-sm text-zinc-500 dark:text-zinc-400">
                      {formatDate(item.date)}
                    </span>
                    {item.notes && (
                      <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                        {item.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(item)}
                      className="text-sm text-zinc-600 hover:underline dark:text-zinc-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="text-sm text-red-600 hover:underline dark:text-red-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </PageLayout>
  );
}
