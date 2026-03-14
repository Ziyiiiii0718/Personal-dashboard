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
          <h2 className="text-base font-semibold text-heading">
            {emoji} {title}
          </h2>
          <Link
            href={href}
            className="text-xs font-medium text-link hover:text-link-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:rounded focus-visible:outline-focus-ring"
          >
            View →
          </Link>
        </>
      }
    >
      <div className="text-sm text-muted">
        {children}
      </div>
      {emptyHref != null && (
        <Link
          href={emptyHref}
          className="mt-3 inline-block rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground hover:bg-sidebar-active focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
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
        <h1 className="mb-6 text-2xl font-semibold tracking-tight text-heading sm:text-3xl">
          Dashboard
        </h1>
        <p className="text-muted">Loading…</p>
      </div>
    );
  }

  const { todos, deadlines, weight, diet, fitness } = data;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <h1 className="mb-8 text-2xl font-semibold tracking-tight text-heading sm:text-3xl">
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
                <p className="text-muted">
                  Nothing on your list yet.
                </p>
              ) : (
                <>
                  <p className="mb-3">
                    <span className="font-medium text-foreground">
                      {todos.remaining}
                    </span>
                    <span className="text-muted">
                      {" "}
                      remaining / {todos.total} total
                    </span>
                  </p>
                  {todos.preview.length > 0 ? (
                    <ul className="space-y-1.5">
                      {todos.preview.map((t) => (
                        <li key={t.id} className="truncate text-foreground">
                          {t.text}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted">
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
                <p className="text-muted">
                  No deadlines in the next 7 days.
                </p>
              ) : (
                <ul className="space-y-2">
                  {deadlines.upcoming.map((d) => (
                    <li key={d.id} className="flex flex-wrap items-center gap-1.5">
                      <span className="text-foreground">
                        {d.title}
                      </span>
                      <span className="rounded-full bg-sidebar-active px-2 py-0.5 text-xs text-muted">
                        {d.type === "exam" ? "Exam" : "DDL"}
                      </span>
                      <span className="text-muted">
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
                <p className="text-muted">
                  Log your first weight to track progress.
                </p>
              ) : (
                <>
                  <p>
                    <span className="font-medium text-foreground">
                      {weight.latest} kg
                    </span>
                    <span className="text-muted">
                      {" "}
                      latest
                    </span>
                  </p>
                  {weight.goal != null && (
                    <p className="mt-1 text-muted">
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
                <span className="font-medium text-foreground">
                  {diet.mealsLogged}
                </span>
                <span className="text-muted">
                  {" "}
                  / 6 meals logged
                </span>
              </p>
              {diet.totalCal > 0 && (
                <p className="text-muted">
                  {diet.totalCal} cal total
                </p>
              )}
              {diet.missingMealTypes.length > 0 && diet.missingMealTypes.length < 6 && (
                <p className="mt-1.5 text-muted">
                  Missing: {formatMissingMeals(diet.missingMealTypes)}
                </p>
              )}
              {diet.mealsLogged === 0 && (
                <p className="text-muted">
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
                <p className="text-muted">
                  Log a workout to start the day.
                </p>
              ) : (
                <>
                  <p>
                    <span className="font-medium text-foreground">
                      {fitness.sessions}
                    </span>
                    <span className="text-muted">
                      {" "}
                      sessions
                    </span>
                    {fitness.durationMin > 0 && (
                      <span className="text-muted">
                        {" "}
                        · {fitness.durationMin} min total
                      </span>
                    )}
                  </p>
                  {fitness.categories.length > 0 && (
                    <p className="mt-1 text-muted">
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
