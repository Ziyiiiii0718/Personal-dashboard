"use client";

import "chart.js/auto";
import { useCallback, useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import type { WeightEntry } from "./types";
import {
  loadEntries,
  loadGoalKg,
  saveEntries,
  saveGoalKg,
} from "./storage";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(dateISO: string): string {
  const d = new Date(dateISO + "T00:00:00");
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function sortByDateDesc(entries: WeightEntry[]): WeightEntry[] {
  return [...entries].sort((a, b) => b.dateISO.localeCompare(a.dateISO));
}

export default function WeightPage() {
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [goalKg, setGoalKgState] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [dateISO, setDateISO] = useState(todayISO());
  const [weightKg, setWeightKg] = useState("");
  const [note, setNote] = useState("");
  const [goalInput, setGoalInput] = useState("");

  useEffect(() => {
    setEntries(loadEntries());
    const g = loadGoalKg();
    setGoalKgState(g);
    setGoalInput(g != null ? String(g) : "");
    setMounted(true);
  }, []);

  const persistEntries = useCallback((next: WeightEntry[]) => {
    setEntries(next);
    saveEntries(next);
  }, []);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const w = Number(weightKg.replace(",", "."));
    if (!dateISO || !Number.isFinite(w) || w <= 0) return;
    persistEntries([
      ...entries,
      {
        id: crypto.randomUUID(),
        dateISO,
        weightKg: w,
        note: note.trim() || undefined,
        createdAt: new Date().toISOString(),
      },
    ]);
    setWeightKg("");
    setNote("");
    setDateISO(todayISO());
  };

  const handleDelete = (id: string) => {
    persistEntries(entries.filter((e) => e.id !== id));
  };

  const handleGoalBlur = () => {
    const v = goalInput.trim() ? Number(goalInput.replace(",", ".")) : null;
    if (v != null && Number.isFinite(v) && v > 0) {
      setGoalKgState(v);
      saveGoalKg(v);
    } else if (goalInput.trim() === "") {
      setGoalKgState(null);
      saveGoalKg(null);
    }
  };

  const sorted = sortByDateDesc(entries);
  const latest = sorted[0];
  const currentKg = latest?.weightKg ?? null;
  const goalDelta =
    currentKg != null && goalKg != null ? goalKg - currentKg : null;

  const chartData = (() => {
    const byDate = sortByDateDesc(entries);
    const labels = byDate.map((e) => e.dateISO).reverse();
    const weights = byDate.map((e) => e.weightKg).reverse();
    const datasets: { label: string; data: number[]; borderColor: string; backgroundColor: string; tension: number; fill?: boolean }[] = [
      {
        label: "Weight (kg)",
        data: weights,
        borderColor: "rgb(99 102 241)",
        backgroundColor: "rgba(99, 102, 241, 0.1)",
        tension: 0.2,
        fill: true,
      },
    ];
    if (goalKg != null && labels.length > 0) {
      datasets.push({
        label: "Goal (kg)",
        data: labels.map(() => goalKg),
        borderColor: "rgb(34 197 94)",
        backgroundColor: "transparent",
        tension: 0,
        borderDash: [5, 5],
      });
    }
    return { labels, datasets };
  })();

  if (!mounted) {
    return (
      <div>
        <h1 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Weight
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400">Loading…</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Weight
      </h1>

      {/* Summary + goal */}
      <div className="mb-6 flex flex-wrap items-center gap-4 rounded-lg border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
        <div>
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Current weight
          </span>
          <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
            {currentKg != null ? `${currentKg} kg` : "—"}
          </p>
        </div>
        <div>
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Goal weight
          </span>
          <input
            type="number"
            step="0.1"
            min="0"
            value={goalInput}
            onChange={(e) => setGoalInput(e.target.value)}
            onBlur={handleGoalBlur}
            placeholder="Set goal (kg)"
            className="mt-0.5 w-24 rounded border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
        {goalDelta != null && (
          <div>
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Delta to goal
            </span>
            <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
              {goalDelta > 0
                ? `${goalDelta.toFixed(1)} kg to go`
                : goalDelta < 0
                  ? `${(-goalDelta).toFixed(1)} kg below goal`
                  : "At goal"}
            </p>
          </div>
        )}
      </div>

      {/* Add entry form */}
      <form
        onSubmit={handleAdd}
        className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50"
      >
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
            Weight (kg)
          </span>
          <input
            type="number"
            step="0.1"
            min="0"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            placeholder="e.g. 72.5"
            className="w-24 rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            required
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Note (optional)
          </span>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional"
            className="w-40 rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </label>
        <button
          type="submit"
          className="rounded bg-zinc-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-200 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Add entry
        </button>
      </form>

      {/* Chart */}
      {entries.length > 0 ? (
        <div className="mb-8 h-64 w-full max-w-2xl">
          <Line
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: "top" },
              },
              scales: {
                x: { title: { display: true, text: "Date" } },
                y: {
                  title: { display: true, text: "Weight (kg)" },
                  beginAtZero: false,
                },
              },
            }}
          />
        </div>
      ) : (
        <div className="mb-8 flex h-48 max-w-2xl items-center justify-center rounded-lg border border-dashed border-zinc-300 dark:border-zinc-600">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Add entries to see the trend chart.
          </p>
        </div>
      )}

      {/* List */}
      <div>
        <h2 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Entries
        </h2>
        {sorted.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No entries yet. Add one above.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-700">
            {sorted.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between gap-2 py-2 first:pt-0"
              >
                <div>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {entry.weightKg} kg
                  </span>
                  <span className="ml-2 text-sm text-zinc-500 dark:text-zinc-400">
                    {formatDate(entry.dateISO)}
                  </span>
                  {entry.note && (
                    <span className="ml-2 text-sm text-zinc-500 dark:text-zinc-400">
                      — {entry.note}
                    </span>
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
        )}
      </div>
    </div>
  );
}
