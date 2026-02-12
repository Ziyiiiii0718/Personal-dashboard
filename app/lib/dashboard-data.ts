/**
 * Reusable helpers to read dashboard data from localStorage.
 * Uses the same keys as each module: pld_todos_v1, pld_deadlines_v1,
 * pld_weight_entries_v1, pld_goal_weight_kg_v1, pld_diet_entries_v1, pld_workout_entries_v1.
 */

import { loadDeadlines } from "../calendar/storage";
import { loadEntries as loadDietEntries } from "../diet/storage";
import { MEAL_LABELS } from "../diet/types";
import type { MealType } from "../diet/types";
import { loadEntries as loadFitnessEntries } from "../fitness/storage";
import { CATEGORY_LABELS } from "../fitness/types";
import type { WorkoutCategory } from "../fitness/types";
import { loadTodos } from "../todo/storage";
import { loadEntries as loadWeightEntries, loadGoalKg } from "../weight/storage";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function getDashboardData() {
  const todos = loadTodos();
  const deadlines = loadDeadlines();
  const weightEntries = loadWeightEntries();
  const goalKg = loadGoalKg();
  const dietEntries = loadDietEntries();
  const fitnessEntries = loadFitnessEntries();

  const unchecked = todos.filter((t) => !t.done);
  const todoRemaining = unchecked.length;
  const todoTotal = todos.length;
  const todoPreview = unchecked.slice(0, 5);

  const start = todayISO();
  const end = addDays(start, 6);
  const upcomingDeadlines = deadlines
    .filter((d) => d.date >= start && d.date <= end)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  const sortedWeight = [...weightEntries].sort((a, b) =>
    b.dateISO.localeCompare(a.dateISO)
  );
  const latestWeight = sortedWeight[0]?.weightKg ?? null;
  const weightDelta =
    latestWeight != null && goalKg != null ? goalKg - latestWeight : null;

  const today = todayISO();
  const dietToday = dietEntries.filter((e) => e.dateISO === today);
  const dietMealsLogged = new Set(dietToday.map((e) => e.mealType));
  const dietTotalCal = dietToday.reduce((s, e) => s + (e.calories ?? 0), 0);
  const missingMealTypes = (Object.keys(MEAL_LABELS) as MealType[]).filter(
    (m) => !dietMealsLogged.has(m)
  );

  const fitnessToday = fitnessEntries.filter((e) => e.dateISO === today);
  const fitnessSessions = fitnessToday.length;
  const fitnessDuration = fitnessToday.reduce(
    (s, e) => s + (e.durationMin ?? 0),
    0
  );
  const fitnessCategories = [
    ...new Set(fitnessToday.map((e) => e.category)),
  ] as WorkoutCategory[];

  return {
    todos: {
      remaining: todoRemaining,
      total: todoTotal,
      preview: todoPreview,
    },
    deadlines: {
      upcoming: upcomingDeadlines,
    },
    weight: {
      latest: latestWeight,
      goal: goalKg,
      delta: weightDelta,
    },
    diet: {
      mealsLogged: dietMealsLogged.size,
      totalCal: dietTotalCal,
      missingMealTypes: missingMealTypes.map((m) => MEAL_LABELS[m]),
    },
    fitness: {
      sessions: fitnessSessions,
      durationMin: fitnessDuration,
      categories: fitnessCategories.map((c) => CATEGORY_LABELS[c]),
    },
  };
}

export type DashboardData = ReturnType<typeof getDashboardData>;
