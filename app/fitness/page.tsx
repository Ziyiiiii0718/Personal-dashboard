"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge, Button, Card, Input, PageLayout, Select, Textarea } from "../components/ui";
import type { WorkoutEntry, WorkoutCategory, Intensity } from "./types";
import { CATEGORY_LABELS, INTENSITY_LABELS, WORKOUT_CATEGORIES } from "./types";
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
  const [filterCategory, setFilterCategory] = useState<WorkoutCategory | "all">("all");
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
        durationMin: dur != null && Number.isFinite(dur) && dur >= 0 ? dur : undefined,
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
  const todayDuration = todayEntries.reduce((sum, e) => sum + (e.durationMin ?? 0), 0);

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
    return <PageLayout title="Fitness" loading />;
  }

  return (
    <PageLayout title="Fitness">
      <Card>
        <div className="flex flex-wrap gap-6">
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
      </Card>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Date</span>
              <Input type="date" value={dateISO} onChange={(e) => setDateISO(e.target.value)} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Category</span>
              <Select value={category} onChange={(e) => setCategory(e.target.value as WorkoutCategory)} className="w-40">
                {WORKOUT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                ))}
              </Select>
            </label>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Title</span>
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Morning run"
              required
            />
          </label>
          <div className="flex flex-wrap gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Duration (min, optional)</span>
              <Input
                type="number"
                step={1}
                min={0}
                value={durationMin}
                onChange={(e) => setDurationMin(e.target.value)}
                placeholder="e.g. 45"
                className="w-28"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Intensity (optional)</span>
              <Select value={intensity} onChange={(e) => setIntensity(e.target.value as Intensity | "")} className="w-32">
                <option value="">—</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </Select>
            </label>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Notes (optional)</span>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" rows={2} />
          </label>
          <Button type="submit">Add entry</Button>
        </form>
      </Card>

      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Category</span>
          <Select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as WorkoutCategory | "all")}
            className="w-36"
          >
            <option value="all">All</option>
            {WORKOUT_CATEGORIES.map((c) => (
              <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
            ))}
          </Select>
        </label>
        <label className="flex flex-1 min-w-[180px] items-center gap-2">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Search</span>
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Title or notes…"
            className="flex-1"
          />
        </label>
      </div>

      <div>
        {grouped.length === 0 ? (
          <p className="rounded-2xl border border-black/5 bg-white/80 p-6 text-center text-sm text-zinc-500 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400">
            {entries.length === 0
              ? "No workout entries yet. Add one above."
              : "No entries match the current filters."}
          </p>
        ) : (
          <ul className="space-y-6">
            {grouped.map(({ date, entries: dayEntries }) => (
              <li key={date}>
                <h2 className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  {formatDate(date)}
                </h2>
                <Card>
                  <ul className="divide-y divide-zinc-200 dark:divide-zinc-700">
                    {dayEntries.map((entry) => (
                      <li
                        key={entry.id}
                        className="flex flex-wrap items-start justify-between gap-2 py-3 first:pt-0"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium text-zinc-900 dark:text-zinc-100">
                              {entry.title}
                            </span>
                            <Badge>{CATEGORY_LABELS[entry.category]}</Badge>
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
                          className="text-sm text-red-600 hover:underline dark:text-red-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                        >
                          Delete
                        </button>
                      </li>
                    ))}
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
