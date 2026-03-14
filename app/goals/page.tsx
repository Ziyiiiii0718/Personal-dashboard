"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Card, Input, PageLayout, Select, Textarea } from "../components/ui";
import type { Goal, GoalCategory } from "./types";
import { GOAL_CATEGORIES } from "./types";
import { loadGoals, saveGoals } from "./storage";

function formatDeadline(deadlineISO: string): string {
  const d = new Date(deadlineISO + "T00:00:00");
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function categoryLabel(cat: GoalCategory): string {
  return cat.charAt(0).toUpperCase() + cat.slice(1);
}

const emptyForm = {
  title: "",
  category: "other" as GoalCategory,
  target: "",
  unit: "",
  deadline: "",
  note: "",
};

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);

  useEffect(() => {
    setGoals(loadGoals());
    setMounted(true);
  }, []);

  const persist = useCallback((next: Goal[]) => {
    setGoals(next);
    saveGoals(next);
  }, []);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const title = form.title.trim();
    if (!title) return;
    const targetNum = form.target.trim() ? Number(form.target.replace(",", ".")) : undefined;
    const goal: Goal = {
      id: crypto.randomUUID(),
      title,
      category: form.category,
      target: targetNum != null && Number.isFinite(targetNum) ? targetNum : undefined,
      unit: form.unit.trim() || undefined,
      deadlineISO: form.deadline ? form.deadline : undefined,
      note: form.note.trim() || undefined,
      createdAt: Date.now(),
    };
    persist([goal, ...goals]);
    setForm(emptyForm);
  };

  const handleDelete = (id: string) => {
    persist(goals.filter((g) => g.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setEditForm(emptyForm);
    }
  };

  const startEdit = (g: Goal) => {
    setEditingId(g.id);
    setEditForm({
      title: g.title,
      category: g.category,
      target: g.target != null ? String(g.target) : "",
      unit: g.unit ?? "",
      deadline: g.deadlineISO ?? "",
      note: g.note ?? "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(emptyForm);
  };

  const saveEdit = (id: string) => {
    const title = editForm.title.trim();
    if (!title) return;
    const targetNum = editForm.target.trim()
      ? Number(editForm.target.replace(",", "."))
      : undefined;
    const next = goals.map((g) =>
      g.id === id
        ? {
            ...g,
            title,
            category: editForm.category,
            target:
              targetNum != null && Number.isFinite(targetNum) ? targetNum : undefined,
            unit: editForm.unit.trim() || undefined,
            deadlineISO: editForm.deadline ? editForm.deadline : undefined,
            note: editForm.note.trim() || undefined,
          }
        : g
    );
    persist(next);
    setEditingId(null);
    setEditForm(emptyForm);
  };

  const sorted = [...goals].sort((a, b) => b.createdAt - a.createdAt);

  if (!mounted) {
    return <PageLayout title="Goals" loading />;
  }

  return (
    <PageLayout title="Goals">
      <Card>
        <h2 className="mb-4 text-sm font-semibold text-foreground">
          Add Goal
        </h2>
        <form onSubmit={handleAdd} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted">
              Title
            </span>
            <Input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Run 5k"
              required
            />
          </label>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted">
                Category
              </span>
              <Select
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    category: e.target.value as GoalCategory,
                  }))
                }
              >
                {GOAL_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {categoryLabel(c)}
                  </option>
                ))}
              </Select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted">
                Target (optional)
              </span>
              <Input
                type="number"
                step="any"
                value={form.target}
                onChange={(e) => setForm((f) => ({ ...f, target: e.target.value }))}
                placeholder="e.g. 5"
                className="w-full"
              />
            </label>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted">
                Unit (optional)
              </span>
              <Input
                value={form.unit}
                onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                placeholder="e.g. km, kg"
                className="w-full"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted">
                Deadline (optional)
              </span>
              <Input
                type="date"
                value={form.deadline}
                onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
                className="w-full"
              />
            </label>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted">
              Note (optional)
            </span>
            <Textarea
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              placeholder="Optional notes"
              rows={2}
            />
          </label>
          <Button type="submit">Add Goal</Button>
        </form>
      </Card>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          Your goals
        </h2>
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface-card py-12">
            <p className="text-sm text-muted">
              No goals yet. Add one above to get started.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {sorted.map((goal) => (
              <li key={goal.id}>
                <Card>
                  {editingId === goal.id ? (
                    <div className="flex flex-col gap-3">
                      <label className="flex flex-col gap-1.5">
                        <span className="text-xs font-medium text-muted">
                          Title
                        </span>
                        <Input
                          value={editForm.title}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, title: e.target.value }))
                          }
                          required
                        />
                      </label>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <label className="flex flex-col gap-1.5">
                          <span className="text-xs font-medium text-muted">
                            Category
                          </span>
                          <Select
                            value={editForm.category}
                            onChange={(e) =>
                              setEditForm((f) => ({
                                ...f,
                                category: e.target.value as GoalCategory,
                              }))
                            }
                          >
                            {GOAL_CATEGORIES.map((c) => (
                              <option key={c} value={c}>
                                {categoryLabel(c)}
                              </option>
                            ))}
                          </Select>
                        </label>
                        <label className="flex flex-col gap-1.5">
                          <span className="text-xs font-medium text-muted">
                            Target
                          </span>
                          <Input
                            type="number"
                            step="any"
                            value={editForm.target}
                            onChange={(e) =>
                              setEditForm((f) => ({ ...f, target: e.target.value }))
                            }
                            placeholder="Optional"
                            className="w-full"
                          />
                        </label>
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <label className="flex flex-col gap-1.5">
                          <span className="text-xs font-medium text-muted">
                            Unit
                          </span>
                          <Input
                            value={editForm.unit}
                            onChange={(e) =>
                              setEditForm((f) => ({ ...f, unit: e.target.value }))
                            }
                            placeholder="Optional"
                            className="w-full"
                          />
                        </label>
                        <label className="flex flex-col gap-1.5">
                          <span className="text-xs font-medium text-muted">
                            Deadline
                          </span>
                          <Input
                            type="date"
                            value={editForm.deadline}
                            onChange={(e) =>
                              setEditForm((f) => ({ ...f, deadline: e.target.value }))
                            }
                            className="w-full"
                          />
                        </label>
                      </div>
                      <label className="flex flex-col gap-1.5">
                        <span className="text-xs font-medium text-muted">
                          Note
                        </span>
                        <Textarea
                          value={editForm.note}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, note: e.target.value }))
                          }
                          rows={2}
                          className="w-full"
                        />
                      </label>
                      <div className="flex gap-2">
                        <Button type="button" onClick={() => saveEdit(goal.id)}>
                          Save
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={cancelEdit}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground">
                          {goal.title}
                        </p>
                        <p className="mt-0.5 text-xs text-muted">
                          {categoryLabel(goal.category)}
                          {goal.target != null && (
                            <>
                              {" · "}
                              {goal.unit
                                ? `${goal.target} ${goal.unit}`
                                : String(goal.target)}
                            </>
                          )}
                          {goal.deadlineISO && (
                            <>
                              {" · "}
                              {formatDeadline(goal.deadlineISO)}
                            </>
                          )}
                        </p>
                        {goal.note && (
                          <p className="mt-1 text-sm text-muted">
                            {goal.note}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => startEdit(goal)}
                        >
                          Edit
                        </Button>
                        <button
                          type="button"
                          onClick={() => handleDelete(goal.id)}
                          className="text-sm text-danger hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageLayout>
  );
}
