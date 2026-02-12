"use client";

import { useCallback, useEffect, useState } from "react";
import type { DietEntry, MealType } from "./types";
import {
  MEAL_LABELS,
  MEAL_ORDER,
  MEAL_TYPES,
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

function groupByDateSorted(entries: DietEntry[]): { date: string; entries: DietEntry[] }[] {
  const byDate = new Map<string, DietEntry[]>();
  for (const e of entries) {
    const list = byDate.get(e.dateISO) ?? [];
    list.push(e);
    byDate.set(e.dateISO, list);
  }
  const order = MEAL_ORDER;
  const sorted = Array.from(byDate.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, list]) => ({
      date,
      entries: list.sort(
        (a, b) => order.indexOf(a.mealType) - order.indexOf(b.mealType)
      ),
    }));
  return sorted;
}

export default function DietPage() {
  const [entries, setEntries] = useState<DietEntry[]>([]);
  const [mounted, setMounted] = useState(false);
  const [dateISO, setDateISO] = useState(todayISO());
  const [mealType, setMealType] = useState<MealType>("breakfast");
  const [itemsText, setItemsText] = useState("");
  const [calories, setCalories] = useState("");
  const [note, setNote] = useState("");
  const [filterMeal, setFilterMeal] = useState<MealType | "all">("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    setEntries(loadEntries());
    setMounted(true);
  }, []);

  const persist = useCallback((next: DietEntry[]) => {
    setEntries(next);
    saveEntries(next);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = itemsText.trim();
    if (!trimmed) return;
    const cal = calories.trim() ? Number(calories.replace(",", ".")) : undefined;
    persist([
      ...entries,
      {
        id: crypto.randomUUID(),
        dateISO,
        mealType,
        itemsText: trimmed,
        calories: cal != null && Number.isFinite(cal) ? cal : undefined,
        note: note.trim() || undefined,
        createdAt: new Date().toISOString(),
      },
    ]);
    setItemsText("");
    setCalories("");
    setNote("");
    setDateISO(todayISO());
  };

  const handleDelete = (id: string) => {
    persist(entries.filter((e) => e.id !== id));
  };

  const filtered = entries.filter((e) => {
    if (filterMeal !== "all" && e.mealType !== filterMeal) return false;
    if (
      search.trim() &&
      !e.itemsText.toLowerCase().includes(search.trim().toLowerCase())
    )
      return false;
    return true;
  });
  const grouped = groupByDateSorted(filtered);

  if (!mounted) {
    return (
      <div>
        <h1 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Diet
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400">Loading…</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Diet
      </h1>

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
              Meal
            </span>
            <select
              value={mealType}
              onChange={(e) => setMealType(e.target.value as MealType)}
              className="rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            >
              {MEAL_TYPES.map((t) => (
                <option key={t} value={t}>
                  {MEAL_LABELS[t]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mb-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Items
            </span>
            <textarea
              value={itemsText}
              onChange={(e) => setItemsText(e.target.value)}
              placeholder="What did you eat?"
              rows={2}
              className="w-full max-w-md rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              required
            />
          </label>
        </div>
        <div className="mb-3 flex flex-wrap gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Calories (optional)
            </span>
            <input
              type="number"
              step="1"
              min="0"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              placeholder="e.g. 450"
              className="w-24 rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </label>
          <label className="flex flex-1 min-w-[200px] flex-col gap-1">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Note (optional)
            </span>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional"
              className="rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
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
            Meal
          </span>
          <select
            value={filterMeal}
            onChange={(e) =>
              setFilterMeal(e.target.value as MealType | "all")
            }
            className="rounded border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          >
            <option value="all">All</option>
            {MEAL_TYPES.map((t) => (
              <option key={t} value={t}>
                {MEAL_LABELS[t]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-1 min-w-[180px] items-center gap-2">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Search items
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by content…"
            className="flex-1 rounded border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </label>
      </div>

      {/* Grouped list */}
      <div>
        {grouped.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {entries.length === 0
              ? "No entries yet. Add one above."
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
                        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                          {MEAL_LABELS[entry.mealType]}
                        </span>
                        <p className="text-zinc-900 dark:text-zinc-100">
                          {entry.itemsText}
                        </p>
                        {(entry.calories != null || entry.note) && (
                          <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                            {entry.calories != null && (
                              <span>{entry.calories} cal</span>
                            )}
                            {entry.calories != null && entry.note && " · "}
                            {entry.note}
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
