"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card } from "./components/ui";
import {
  getDashboardData,
  type DashboardData,
} from "./lib/dashboard-data";

function formatDeadlineDate(dateISO: string): string {
  const d = new Date(dateISO + "T00:00:00");
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatMissingMeals(missing: string[]): string {
  if (missing.length === 0) return "";
  if (missing.length <= 2) return missing.join(", ");
  return `${missing.slice(0, 2).join(", ")} +${missing.length - 2} more`;
}

function DashboardCard({
  title,
  emoji,
  children,
  href,
  emptyHref,
}: {
  title: string;
  emoji: string;
  children: React.ReactNode;
  href: string;
  emptyHref?: string;
}) {
  return (
    <Card
      header={
        <>
          <h2 className="text-base font-semibold text-zinc-800 dark:text-zinc-200">
            {emoji} {title}
          </h2>
          <Link
            href={href}
            className="text-xs font-medium text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:rounded"
          >
            View →
          </Link>
        </>
      }
    >
      <div className="text-sm text-zinc-600 dark:text-zinc-400">
        {children}
      </div>
      {emptyHref != null && (
        <Link
          href={emptyHref}
          className="mt-3 inline-block rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Add
        </Link>
      )}
    </Card>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    setData(getDashboardData());
  }, []);

  if (data == null) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
          Dashboard
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400">Loading…</p>
      </div>
    );
  }

  const { todos, deadlines, weight, diet, fitness } = data;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <h1 className="mb-8 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
          Dashboard
        </h1>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          {/* Left: Todo + Upcoming */}
          <div className="flex flex-col gap-6">
            <DashboardCard
              title="Todo"
              emoji="✅"
              href="/todo"
              emptyHref={todos.total === 0 ? "/todo" : undefined}
            >
              {todos.total === 0 ? (
                <p className="text-zinc-500 dark:text-zinc-400">
                  Nothing on your list yet.
                </p>
              ) : (
                <>
                  <p className="mb-3">
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {todos.remaining}
                    </span>
                    <span className="text-zinc-500 dark:text-zinc-400">
                      {" "}
                      remaining / {todos.total} total
                    </span>
                  </p>
                  {todos.preview.length > 0 ? (
                    <ul className="space-y-1.5">
                      {todos.preview.map((t) => (
                        <li key={t.id} className="truncate text-zinc-700 dark:text-zinc-300">
                          {t.text}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-zinc-500 dark:text-zinc-400">
                      All done for now.
                    </p>
                  )}
                </>
              )}
            </DashboardCard>

            <DashboardCard
              title="Upcoming"
              emoji="📅"
              href="/calendar"
              emptyHref={deadlines.upcoming.length === 0 ? "/calendar" : undefined}
            >
              {deadlines.upcoming.length === 0 ? (
                <p className="text-zinc-500 dark:text-zinc-400">
                  No deadlines in the next 7 days.
                </p>
              ) : (
                <ul className="space-y-2">
                  {deadlines.upcoming.map((d) => (
                    <li key={d.id} className="flex flex-wrap items-center gap-1.5">
                      <span className="text-zinc-900 dark:text-zinc-100">
                        {d.title}
                      </span>
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400">
                        {d.type === "exam" ? "Exam" : "DDL"}
                      </span>
                      <span className="text-zinc-500 dark:text-zinc-400">
                        {formatDeadlineDate(d.date)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </DashboardCard>
          </div>

          {/* Right: Weight, Diet, Fitness */}
          <div className="flex flex-col gap-6">
            <DashboardCard
              title="Weight"
              emoji="⚖️"
              href="/weight"
              emptyHref={weight.latest == null ? "/weight" : undefined}
            >
              {weight.latest == null ? (
                <p className="text-zinc-500 dark:text-zinc-400">
                  Log your first weight to track progress.
                </p>
              ) : (
                <>
                  <p>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {weight.latest} kg
                    </span>
                    <span className="text-zinc-500 dark:text-zinc-400">
                      {" "}
                      latest
                    </span>
                  </p>
                  {weight.goal != null && (
                    <p className="mt-1 text-zinc-500 dark:text-zinc-400">
                      Goal {weight.goal} kg
                      {weight.delta != null && (
                        <>
                          {" "}
                          · {weight.delta > 0 ? `${weight.delta.toFixed(1)} to go` : weight.delta < 0 ? `${(-weight.delta).toFixed(1)} below` : "at goal"}
                        </>
                      )}
                    </p>
                  )}
                </>
              )}
            </DashboardCard>

            <DashboardCard
              title="Diet Today"
              emoji="🍽️"
              href="/diet"
              emptyHref={diet.mealsLogged === 0 ? "/diet" : undefined}
            >
              <p className="mb-1">
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {diet.mealsLogged}
                </span>
                <span className="text-zinc-500 dark:text-zinc-400">
                  {" "}
                  / 6 meals logged
                </span>
              </p>
              {diet.totalCal > 0 && (
                <p className="text-zinc-500 dark:text-zinc-400">
                  {diet.totalCal} cal total
                </p>
              )}
              {diet.missingMealTypes.length > 0 && diet.missingMealTypes.length < 6 && (
                <p className="mt-1.5 text-zinc-500 dark:text-zinc-400">
                  Missing: {formatMissingMeals(diet.missingMealTypes)}
                </p>
              )}
              {diet.mealsLogged === 0 && (
                <p className="text-zinc-500 dark:text-zinc-400">
                  Log your first meal of the day.
                </p>
              )}
            </DashboardCard>

            <DashboardCard
              title="Fitness Today"
              emoji="🏋️"
              href="/fitness"
              emptyHref={fitness.sessions === 0 ? "/fitness" : undefined}
            >
              {fitness.sessions === 0 ? (
                <p className="text-zinc-500 dark:text-zinc-400">
                  Log a workout to start the day.
                </p>
              ) : (
                <>
                  <p>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {fitness.sessions}
                    </span>
                    <span className="text-zinc-500 dark:text-zinc-400">
                      {" "}
                      sessions
                    </span>
                    {fitness.durationMin > 0 && (
                      <span className="text-zinc-500 dark:text-zinc-400">
                        {" "}
                        · {fitness.durationMin} min total
                      </span>
                    )}
                  </p>
                  {fitness.categories.length > 0 && (
                    <p className="mt-1 text-zinc-500 dark:text-zinc-400">
                      {fitness.categories.join(", ")}
                    </p>
                  )}
                </>
              )}
            </DashboardCard>
          </div>
        </div>
    </div>
  );
}
