"use client";

import { useCallback, useEffect, useState } from "react";
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
    return (
      <div>
        <h1 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Calendar
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400">Loading…</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Calendar
      </h1>

      <form
        onSubmit={handleSubmit}
        className="mb-8 flex flex-wrap items-end gap-3 rounded-lg border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50"
      >
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Title
          </span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Essay due"
            className="w-48 rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            required
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Type
          </span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as DeadlineType)}
            className="rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          >
            <option value="ddl">Deadline</option>
            <option value="exam">Exam</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Date
          </span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            required
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Notes (optional)
          </span>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional"
            className="w-40 rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </label>
        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded bg-zinc-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-200 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            {editingId ? "Update" : "Add"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-600 dark:text-zinc-300"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="space-y-1">
        {sorted.length === 0 ? (
          <p className="text-zinc-500 dark:text-zinc-400">
            No deadlines yet. Add one above.
          </p>
        ) : (
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
                  <span className="ml-2 rounded bg-zinc-200 px-1.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-600 dark:text-zinc-300">
                    {item.type === "exam" ? "Exam" : "DDL"}
                  </span>
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
                    className="text-sm text-zinc-600 hover:underline dark:text-zinc-400"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="text-sm text-red-600 hover:underline dark:text-red-400"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
