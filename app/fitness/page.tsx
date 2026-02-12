"use client";

import { useCallback, useEffect, useState } from "react";
import type { WorkoutEntry, WorkoutCategory, Intensity } from "./types";
import {
  CATEGORY_LABELS,
  INTENSITY_LABELS,
  WORKOUT_CATEGORIES,
} from "./types";
import { loadEntries, saveEntries } from "./storage";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(dateISO: string): string {
  const d = new Date(dateISO + "T00:00:00");
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function groupByDateSorted(entries: WorkoutEntry[]): {
  date: string;
  entries: WorkoutEntry[];
}[] {
  const byDate = new Map<string, WorkoutEntry[]>();
  for (const e of entries) {
    const list = byDate.get(e.dateISO) ?? [];
    list.push(e);
    byDate.set(e.dateISO, list);
  }
  return Array.from(byDate.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, list]) => ({
      date,
      entries: list.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    }));
}

export default function FitnessPage() {
  const [entries, setEntries] = useState<WorkoutEntry[]>([]);
  const [mounted, setMounted] = useState(false);
  const [dateISO, setDateISO] = useState(todayISO());
  const [category, setCategory] = useState<WorkoutCategory>("upper_body");
  const [title, setTitle] = useState("");
  const [durationMin, setDurationMin] = useState("");
  const [intensity, setIntensity] = useState<Intensity | "">("");
  const [notes, setNotes] = useState("");
  const [filterCategory, setFilterCategory] = useState<WorkoutCategory | "all">(
    "all"
  );
  const [search, setSearch] = useState("");

  useEffect(() => {
    setEntries(loadEntries());
    setMounted(true);
  }, []);

  const persist = useCallback((next: WorkoutEntry[]) => {
    setEntries(next);
    saveEntries(next);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    const dur = durationMin.trim() ? Number(durationMin) : undefined;
    persist([
      ...entries,
      {
        id: crypto.randomUUID(),
        dateISO,
        category,
        title: trimmed,
        durationMin:
          dur != null && Number.isFinite(dur) && dur >= 0 ? dur : undefined,
        intensity: intensity || undefined,
        notes: notes.trim() || undefined,
        createdAt: new Date().toISOString(),
      },
    ]);
    setTitle("");
    setDurationMin("");
    setIntensity("");
    setNotes("");
    setDateISO(todayISO());
  };

  const handleDelete = (id: string) => {
    persist(entries.filter((e) => e.id !== id));
  };

  const today = todayISO();
  const todayEntries = entries.filter((e) => e.dateISO === today);
  const todaySessions = todayEntries.length;
  const todayDuration = todayEntries.reduce(
    (sum, e) => sum + (e.durationMin ?? 0),
    0
  );

  const filtered = entries.filter((e) => {
    if (filterCategory !== "all" && e.category !== filterCategory) return false;
    const q = search.trim().toLowerCase();
    if (q) {
      const matchTitle = e.title.toLowerCase().includes(q);
      const matchNotes = (e.notes ?? "").toLowerCase().includes(q);
      if (!matchTitle && !matchNotes) return false;
    }
    return true;
  });
  const grouped = groupByDateSorted(filtered);

  if (!mounted) {
    return (
      <div>
        <h1 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Fitness
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400">Loading…</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Fitness
      </h1>

      {/* Today summary */}
      <div className="mb-6 flex flex-wrap gap-4 rounded-lg border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
        <div>
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Today&apos;s sessions
          </span>
          <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
            {todaySessions}
          </p>
        </div>
        <div>
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Total duration today
          </span>
          <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
            {todayDuration > 0 ? `${todayDuration} min` : "—"}
          </p>
        </div>
      </div>

      {/* Add form */}
      <form
        onSubmit={handleSubmit}
        className="mb-6 rounded-lg border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50"
      >
        <div className="mb-3 flex flex-wrap gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Date
            </span>
            <input
              type="date"
              value={dateISO}
              onChange={(e) => setDateISO(e.target.value)}
              className="rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Category
            </span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as WorkoutCategory)}
              className="rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            >
              {WORKOUT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mb-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Title
            </span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Morning run"
              className="w-full max-w-md rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              required
            />
          </label>
        </div>
        <div className="mb-3 flex flex-wrap gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Duration (min, optional)
            </span>
            <input
              type="number"
              step="1"
              min="0"
              value={durationMin}
              onChange={(e) => setDurationMin(e.target.value)}
              placeholder="e.g. 45"
              className="w-24 rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Intensity (optional)
            </span>
            <select
              value={intensity}
              onChange={(e) =>
                setIntensity(e.target.value as Intensity | "")
              }
              className="rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            >
              <option value="">—</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
        </div>
        <div className="mb-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Notes (optional)
            </span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes"
              rows={2}
              className="w-full max-w-md rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </label>
        </div>
        <button
          type="submit"
          className="rounded bg-zinc-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-200 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Add entry
        </button>
      </form>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Category
          </span>
          <select
            value={filterCategory}
            onChange={(e) =>
              setFilterCategory(e.target.value as WorkoutCategory | "all")
            }
            className="rounded border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          >
            <option value="all">All</option>
            {WORKOUT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-1 min-w-[180px] items-center gap-2">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Title or notes…"
            className="flex-1 rounded border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </label>
      </div>

      {/* Grouped list */}
      <div>
        {grouped.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {entries.length === 0
              ? "No workout entries yet. Add one above."
              : "No entries match the current filters."}
          </p>
        ) : (
          <ul className="space-y-6">
            {grouped.map(({ date, entries: dayEntries }) => (
              <li key={date}>
                <h2 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {formatDate(date)}
                </h2>
                <ul className="divide-y divide-zinc-200 dark:divide-zinc-700">
                  {dayEntries.map((entry) => (
                    <li
                      key={entry.id}
                      className="flex flex-wrap items-start justify-between gap-2 py-2 first:pt-0"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-zinc-900 dark:text-zinc-100">
                            {entry.title}
                          </span>
                          <span className="rounded bg-zinc-200 px-1.5 py-0.5 text-xs text-zinc-600 dark:bg-zinc-600 dark:text-zinc-300">
                            {CATEGORY_LABELS[entry.category]}
                          </span>
                          {entry.durationMin != null && (
                            <span className="text-sm text-zinc-500 dark:text-zinc-400">
                              {entry.durationMin} min
                            </span>
                          )}
                          {entry.intensity && (
                            <span className="text-sm text-zinc-500 dark:text-zinc-400">
                              {INTENSITY_LABELS[entry.intensity]}
                            </span>
                          )}
                        </div>
                        {entry.notes && (
                          <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                            {entry.notes}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDelete(entry.id)}
                        className="text-sm text-red-600 hover:underline dark:text-red-400"
                      >
                        Delete
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
