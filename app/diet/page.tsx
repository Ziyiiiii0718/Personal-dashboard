"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Badge,
  Button,
  Card,
  Input,
  PageLayout,
  Select,
  Textarea,
} from "../components/ui";
import type { CookingHabits, DietEntry, FoodItem, MealType } from "./types";
import { MEAL_LABELS, MEAL_ORDER, MEAL_TYPES, mealTypeForTime } from "./types";
import { loadEntries, saveEntries } from "./storage";
import { loadFoodLibrary, saveFoodLibrary } from "./foodLibrary";
import { loadHabits, saveHabits } from "./habits";
import { AiMealLogger } from "./AiMealLogger";
import { FoodLibraryPanel } from "./FoodLibraryPanel";
import { CookingHabitsPanel } from "./CookingHabitsPanel";
import { todayISO } from "../lib/dates";

/** Rotates when its parent <details className="group"> opens. */
function Chevron() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0 text-muted transition-transform group-open:rotate-90"
    >
      <polyline points="9 6 15 12 9 18" />
    </svg>
  );
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

function macroLine(entry: DietEntry): string {
  return [
    entry.calories != null ? `${entry.calories} kcal` : null,
    entry.protein != null ? `${entry.protein}P` : null,
    entry.carbs != null ? `${entry.carbs}C` : null,
    entry.fat != null ? `${entry.fat}F` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

function groupByDateSorted(
  entries: DietEntry[]
): { date: string; entries: DietEntry[] }[] {
  const byDate = new Map<string, DietEntry[]>();
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
        (a, b) => MEAL_ORDER.indexOf(a.mealType) - MEAL_ORDER.indexOf(b.mealType)
      ),
    }));
}

export default function DietPage() {
  const [entries, setEntries] = useState<DietEntry[]>([]);
  const [foodLibrary, setFoodLibrary] = useState<FoodItem[]>([]);
  const [habits, setHabitsState] = useState<CookingHabits>({
    text: "",
    updatedAt: "",
  });
  const [mounted, setMounted] = useState(false);

  const [dateISO, setDateISO] = useState(todayISO());
  const [mealType, setMealType] = useState<MealType>(() => mealTypeForTime());
  const [itemsText, setItemsText] = useState("");
  const [calories, setCalories] = useState("");
  const [note, setNote] = useState("");
  const [filterMeal, setFilterMeal] = useState<MealType | "all">("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    setEntries(loadEntries());
    setFoodLibrary(loadFoodLibrary());
    setHabitsState(loadHabits());
    setMounted(true);
  }, []);

  const persist = useCallback((next: DietEntry[]) => {
    setEntries(next);
    saveEntries(next);
  }, []);

  const persistLibrary = useCallback((next: FoodItem[]) => {
    setFoodLibrary(next);
    saveFoodLibrary(next);
  }, []);

  const persistHabits = useCallback((text: string) => {
    const next: CookingHabits = { text, updatedAt: new Date().toISOString() };
    setHabitsState(next);
    saveHabits(next);
  }, []);

  const handleAiSaved = useCallback(
    (entry: DietEntry) => {
      setEntries((prev) => {
        const next = [...prev, entry];
        saveEntries(next);
        return next;
      });
    },
    []
  );

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

  const selectedDay = entries.filter((e) => e.dateISO === dateISO);
  const round1 = (n: number) => Math.round(n * 10) / 10;
  const selectedDayTotals = {
    count: selectedDay.length,
    calories: Math.round(selectedDay.reduce((s, e) => s + (e.calories ?? 0), 0)),
    protein: round1(selectedDay.reduce((s, e) => s + (e.protein ?? 0), 0)),
    carbs: round1(selectedDay.reduce((s, e) => s + (e.carbs ?? 0), 0)),
    fat: round1(selectedDay.reduce((s, e) => s + (e.fat ?? 0), 0)),
  };

  if (!mounted) {
    return <PageLayout title="Diet" loading />;
  }

  return (
    <PageLayout title="Diet">
      <div className="-mt-2 grid grid-cols-2 gap-4 sm:flex sm:flex-wrap sm:items-end">
        <label className="flex min-w-0 flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">Date</span>
          <Input
            type="date"
            value={dateISO}
            onChange={(e) => setDateISO(e.target.value)}
          />
        </label>
        <label className="flex min-w-0 flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">Meal</span>
          <Select
            value={mealType}
            onChange={(e) => setMealType(e.target.value as MealType)}
            className="w-full sm:w-40"
          >
            {MEAL_TYPES.map((t) => (
              <option key={t} value={t}>
                {MEAL_LABELS[t]}
              </option>
            ))}
          </Select>
        </label>
        {selectedDayTotals.count > 0 && (
          <p className="col-span-2 text-sm text-muted sm:ml-auto sm:pb-2">
            <span className="font-medium text-foreground">
              {selectedDayTotals.calories} kcal
            </span>{" "}
            · {selectedDayTotals.protein}P / {selectedDayTotals.carbs}C /{" "}
            {selectedDayTotals.fat}F · {selectedDayTotals.count}{" "}
            {selectedDayTotals.count === 1 ? "entry" : "entries"} logged
          </p>
        )}
      </div>

      <AiMealLogger
        dateISO={dateISO}
        mealType={mealType}
        foodLibrary={foodLibrary}
        habits={habits.text}
        onSaved={handleAiSaved}
      />

      <details className="group rounded-2xl border border-border bg-surface-card p-5 shadow-[var(--shadow-soft)]">
        <summary className="flex cursor-pointer list-none items-center gap-2 text-base font-semibold text-heading [&::-webkit-details-marker]:hidden">
          <Chevron />
          🍱 Food library &amp; cooking habits
          <span className="text-xs font-normal text-muted">
            {foodLibrary.length} saved {foodLibrary.length === 1 ? "food" : "foods"}
          </span>
        </summary>
        <div className="mt-4 space-y-6">
          <FoodLibraryPanel items={foodLibrary} onChange={persistLibrary} />
          <div className="border-t border-divide pt-4">
            <CookingHabitsPanel value={habits.text} onSave={persistHabits} />
          </div>
        </div>
      </details>

      <details className="group rounded-2xl border border-border bg-surface-card p-5 shadow-[var(--shadow-soft)]">
        <summary className="flex cursor-pointer list-none items-center gap-2 text-base font-semibold text-heading [&::-webkit-details-marker]:hidden">
          <Chevron />
          ✍️ Add entry manually
        </summary>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted">Items</span>
            <Textarea
              value={itemsText}
              onChange={(e) => setItemsText(e.target.value)}
              placeholder="What did you eat?"
              rows={2}
            />
          </label>
          <div className="flex flex-wrap gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted">
                Calories (optional)
              </span>
              <Input
                type="number"
                step={1}
                min={0}
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                placeholder="e.g. 450"
                className="w-28"
              />
            </label>
            <label className="flex flex-1 min-w-[200px] flex-col gap-1.5">
              <span className="text-xs font-medium text-muted">
                Note (optional)
              </span>
              <Input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Optional"
              />
            </label>
          </div>
          <Button type="submit">Add entry</Button>
        </form>
      </details>

      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted">Meal</span>
          <Select
            value={filterMeal}
            onChange={(e) => setFilterMeal(e.target.value as MealType | "all")}
            className="w-36"
          >
            <option value="all">All</option>
            {MEAL_TYPES.map((t) => (
              <option key={t} value={t}>
                {MEAL_LABELS[t]}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex flex-1 min-w-[180px] items-center gap-2">
          <span className="text-xs font-medium text-muted">Search items</span>
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by content…"
            className="flex-1"
          />
        </label>
      </div>

      <div>
        {grouped.length === 0 ? (
          <p className="rounded-2xl border border-border bg-surface-card p-6 text-center text-sm text-muted">
            {entries.length === 0
              ? "No entries yet. Use the AI logger or add one manually."
              : "No entries match the current filters."}
          </p>
        ) : (
          <ul className="space-y-6">
            {grouped.map(({ date, entries: dayEntries }) => (
              <li key={date}>
                <h2 className="mb-2 text-sm font-semibold text-foreground">
                  {formatDate(date)}
                </h2>
                <Card>
                  <ul className="divide-y divide-divide">
                    {dayEntries.map((entry) => {
                      const macros = macroLine(entry);
                      return (
                        <li
                          key={entry.id}
                          className="flex flex-wrap items-start justify-between gap-2 py-3 first:pt-0"
                        >
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-medium text-muted">
                              {MEAL_LABELS[entry.mealType]}
                            </span>
                            {entry.aiGenerated && (
                              <Badge className="ml-2">✨ AI</Badge>
                            )}
                            <p className="text-foreground">{entry.itemsText}</p>
                            {(macros || entry.note) && (
                              <p className="mt-0.5 text-sm text-muted">
                                {macros}
                                {macros && entry.note && " · "}
                                {entry.note}
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDelete(entry.id)}
                            className="text-sm text-danger hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                          >
                            Delete
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageLayout>
  );
}
