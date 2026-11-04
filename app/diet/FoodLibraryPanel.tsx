"use client";

import { useRef, useState } from "react";
import { Button, Input } from "../components/ui";
import { AiAccessError, postAi } from "../lib/aiClient";
import { compressImage } from "../lib/compressImage";
import { AiAccessPrompt } from "./AiAccessPrompt";
import { caloriesFromMacros, type FoodItem } from "./types";

interface Props {
  items: FoodItem[];
  onChange: (items: FoodItem[]) => void;
}

interface Draft {
  name: string;
  basis: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  note: string;
}

const EMPTY_DRAFT: Draft = {
  name: "",
  basis: "per 100g",
  calories: "",
  protein: "",
  carbs: "",
  fat: "",
  note: "",
};

function toNum(s: string): number | undefined {
  const t = s.trim();
  if (!t) return undefined;
  const n = Number(t.replace(",", "."));
  return Number.isFinite(n) ? n : undefined;
}

export function FoodLibraryPanel({ items, onChange }: Props) {
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Set when a scan is waiting on the access password, to retry afterwards. */
  const [accessPrompt, setAccessPrompt] = useState<{
    file: File;
    wrongPassword: boolean;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // With nothing saved yet, the form is the only thing to show.
  const [formOpen, setFormOpen] = useState(items.length === 0);
  const showForm = formOpen || items.length === 0;

  const macroCalories = caloriesFromMacros(
    toNum(draft.protein),
    toNum(draft.carbs),
    toNum(draft.fat)
  );

  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));

  const handleScan = async (file: File) => {
    setScanning(true);
    setError(null);
    setAccessPrompt(null);
    try {
      const { data, mediaType } = await compressImage(file);
      const result = await postAi<{
        name?: string;
        basis?: string;
        calories?: number;
        protein?: number;
        carbs?: number;
        fat?: number;
        note?: string;
      }>(
        "/api/ai/parse-label",
        { imageBase64: data, mediaType },
        "Scan failed."
      );
      set({
        name: result.name || draft.name,
        basis: result.basis || "per 100g",
        calories: result.calories != null ? String(result.calories) : "",
        protein: result.protein != null ? String(result.protein) : "",
        carbs: result.carbs != null ? String(result.carbs) : "",
        fat: result.fat != null ? String(result.fat) : "",
        note: result.note || "",
      });
    } catch (e) {
      if (e instanceof AiAccessError) {
        setAccessPrompt({ file, wrongPassword: e.wrongPassword });
      } else {
        setError(e instanceof Error ? e.message : "Scan failed.");
      }
    } finally {
      setScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAdd = () => {
    const name = draft.name.trim();
    if (!name) {
      setError("Give the food a name first.");
      return;
    }
    const item: FoodItem = {
      id: crypto.randomUUID(),
      name,
      basis: draft.basis.trim() || "per 100g",
      calories: toNum(draft.calories) ?? macroCalories,
      protein: toNum(draft.protein),
      carbs: toNum(draft.carbs),
      fat: toNum(draft.fat),
      note: draft.note.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
    onChange([item, ...items]);
    setDraft(EMPTY_DRAFT);
    setError(null);
    setFormOpen(false);
  };

  const handleDelete = (id: string) => {
    onChange(items.filter((f) => f.id !== id));
  };

  return (
    <div className="space-y-4">
      {items.length === 0 ? (
        <p className="text-sm text-muted">
          No saved foods yet. Scan a label or fill in the form — the AI will
          reuse these numbers when estimating your meals.
        </p>
      ) : (
        <ul className="divide-y divide-divide">
          {items.map((f) => (
            <li
              key={f.id}
              className="flex flex-wrap items-start justify-between gap-2 py-2.5 first:pt-0"
            >
              <div className="min-w-0 flex-1">
                <p className="text-foreground">
                  {f.name}{" "}
                  <span className="text-xs text-muted">({f.basis})</span>
                </p>
                <p className="text-sm text-muted">
                  {[
                    f.calories != null ? `${f.calories} kcal` : null,
                    f.protein != null ? `${f.protein}P` : null,
                    f.carbs != null ? `${f.carbs}C` : null,
                    f.fat != null ? `${f.fat}F` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                  {f.note ? ` — ${f.note}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(f.id)}
                className="text-sm text-danger hover:underline"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}

      {showForm ? (
        <div className="space-y-3 rounded-xl border border-border bg-surface p-3">
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.heic,.heif"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleScan(file);
              }}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={scanning}
            >
              {scanning ? "Reading label…" : "📷 Scan nutrition label"}
            </Button>
            <span className="text-xs text-muted">
              or fill in the fields below
            </span>
          </div>

          {accessPrompt && (
            <AiAccessPrompt
              wrongPassword={accessPrompt.wrongPassword}
              onSubmit={() => handleScan(accessPrompt.file)}
            />
          )}

          <div className="flex flex-wrap gap-2">
            <label className="flex min-w-[160px] flex-1 flex-col gap-1">
              <span className="text-[11px] font-medium text-muted">Name</span>
              <Input
                value={draft.name}
                onChange={(e) => set({ name: e.target.value })}
                placeholder="e.g. Greek yogurt"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-muted">Basis</span>
              <Input
                value={draft.basis}
                onChange={(e) => set({ basis: e.target.value })}
                placeholder="per 100g"
                className="w-32"
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <DraftNum
              label="kcal"
              value={draft.calories}
              onChange={(v) => set({ calories: v })}
              placeholder={macroCalories != null ? `≈ ${macroCalories}` : undefined}
            />
            <DraftNum label="Protein (g)" value={draft.protein} onChange={(v) => set({ protein: v })} />
            <DraftNum label="Carbs (g)" value={draft.carbs} onChange={(v) => set({ carbs: v })} />
            <DraftNum label="Fat (g)" value={draft.fat} onChange={(v) => set({ fat: v })} />
          </div>
          {!draft.calories.trim() && macroCalories != null && (
            <p className="-mt-1 text-xs text-muted">
              Leave kcal empty to use {macroCalories} kcal, calculated from the macros.
            </p>
          )}
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-medium text-muted">Note (optional)</span>
            <Input
              value={draft.note}
              onChange={(e) => set({ note: e.target.value })}
              placeholder="brand, flavor, etc."
            />
          </label>

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={handleAdd}>
              Add to library
            </Button>
            {items.length > 0 && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setFormOpen(false);
                  setDraft(EMPTY_DRAFT);
                  setError(null);
                }}
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      ) : (
        <Button type="button" variant="secondary" onClick={() => setFormOpen(true)}>
          + Add food
        </Button>
      )}
    </div>
  );
}

function DraftNum({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-medium text-muted">{label}</span>
      <Input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}
