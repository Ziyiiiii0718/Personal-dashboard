"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Card, Input, Textarea } from "../components/ui";
import { AiAccessError, postAi } from "../lib/aiClient";
import { useSpeechRecognition } from "../lib/useSpeechRecognition";
import { AiAccessPrompt } from "./AiAccessPrompt";
import type {
  DietEntry,
  FoodItem,
  MealType,
  ParsedMealItem,
  ParsedMealResult,
} from "./types";

interface Props {
  dateISO: string;
  mealType: MealType;
  foodLibrary: FoodItem[];
  habits: string;
  onSaved: (entry: DietEntry) => void;
}

type EditableItem = ParsedMealItem;

function computeTotals(items: EditableItem[]) {
  const t = items.reduce(
    (acc, i) => ({
      calories: acc.calories + (i.calories ?? 0),
      protein: acc.protein + (i.protein ?? 0),
      carbs: acc.carbs + (i.carbs ?? 0),
      fat: acc.fat + (i.fat ?? 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
  return {
    calories: Math.round(t.calories),
    protein: Math.round(t.protein * 10) / 10,
    carbs: Math.round(t.carbs * 10) / 10,
    fat: Math.round(t.fat * 10) / 10,
  };
}

export function AiMealLogger({
  dateISO,
  mealType,
  foodLibrary,
  habits,
  onSaved,
}: Props) {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessPrompt, setAccessPrompt] = useState<{
    wrongPassword: boolean;
  } | null>(null);
  const [items, setItems] = useState<EditableItem[] | null>(null);
  const [summary, setSummary] = useState<string | undefined>(undefined);

  const speech = useSpeechRecognition();
  const prefixRef = useRef("");

  // While dictating, fold recognized speech into the description box.
  useEffect(() => {
    if (!speech.listening && !speech.transcript) return;
    const merged = `${prefixRef.current} ${speech.transcript}`.trim();
    setDescription(merged);
  }, [speech.transcript, speech.listening]);

  const handleMicToggle = () => {
    if (speech.listening) {
      speech.stop();
    } else {
      prefixRef.current = description;
      speech.reset();
      speech.start();
    }
  };

  const handleAnalyze = async () => {
    const text = description.trim();
    if (!text) return;
    if (speech.listening) speech.stop();
    setLoading(true);
    setError(null);
    setAccessPrompt(null);
    setItems(null);
    setSummary(undefined);
    try {
      const data = await postAi<ParsedMealResult>(
        "/api/ai/parse-meal",
        { description: text, mealType, foodLibrary, habits },
        "Analysis failed."
      );
      setItems(data.items);
      setSummary(data.summary);
      if (data.items.length === 0) {
        setError("The AI didn't find any food items. Try rephrasing.");
      }
    } catch (e) {
      if (e instanceof AiAccessError) {
        setAccessPrompt({ wrongPassword: e.wrongPassword });
      } else {
        setError(e instanceof Error ? e.message : "Analysis failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  const updateItem = (idx: number, patch: Partial<EditableItem>) => {
    setItems((prev) =>
      prev ? prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)) : prev
    );
  };

  const removeItem = (idx: number) => {
    setItems((prev) => (prev ? prev.filter((_, i) => i !== idx) : prev));
  };

  const handleSave = () => {
    if (!items || items.length === 0) return;
    const totals = computeTotals(items);
    const itemsText = items
      .map((i) => (i.quantity ? `${i.name} (${i.quantity})` : i.name))
      .join(", ");
    const entry: DietEntry = {
      id: crypto.randomUUID(),
      dateISO,
      mealType,
      itemsText,
      calories: totals.calories || undefined,
      protein: totals.protein || undefined,
      carbs: totals.carbs || undefined,
      fat: totals.fat || undefined,
      note: summary,
      aiGenerated: true,
      createdAt: new Date().toISOString(),
    };
    onSaved(entry);
    // Reset for the next meal.
    setItems(null);
    setSummary(undefined);
    setDescription("");
    speech.reset();
    prefixRef.current = "";
  };

  const totals = items ? computeTotals(items) : null;

  return (
    <Card
      header={
        <h2 className="text-base font-semibold text-heading">
          ✨ AI meal logger
        </h2>
      }
    >
      <div className="space-y-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">
            Describe your meal — type or use the mic
          </span>
          <Textarea
            value={description + (speech.interim ? ` ${speech.interim}` : "")}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. a bowl of rice, two fried eggs, and a cup of soy milk"
            rows={2}
          />
        </label>

        <div className="flex flex-wrap items-center gap-2">
          {speech.supported && (
            <Button
              type="button"
              variant={speech.listening ? "primary" : "secondary"}
              onClick={handleMicToggle}
            >
              {speech.listening ? "● Stop" : "🎤 Speak"}
            </Button>
          )}
          <Button
            type="button"
            onClick={handleAnalyze}
            disabled={loading || !description.trim()}
            title={!description.trim() ? "Describe your meal first" : undefined}
          >
            {loading ? "Analyzing…" : "Analyze with AI"}
          </Button>
          {speech.listening && (
            <span className="text-xs text-muted">Listening…</span>
          )}
        </div>

        {!speech.supported && (
          <p className="text-xs text-muted">
            Voice input isn’t supported in this browser — typing works fine.
          </p>
        )}

        {accessPrompt && (
          <AiAccessPrompt
            wrongPassword={accessPrompt.wrongPassword}
            onSubmit={handleAnalyze}
          />
        )}

        {error && (
          <p className="rounded-xl border border-border bg-surface px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}

        {items && items.length > 0 && totals && (
          <div className="space-y-3 rounded-xl border border-border bg-surface p-3">
            <p className="text-xs font-medium text-muted">
              Review & edit before saving
            </p>
            <ul className="space-y-3">
              {items.map((item, idx) => (
                <li
                  key={idx}
                  className="space-y-2 border-b border-divide pb-3 last:border-0 last:pb-0"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      value={item.name}
                      onChange={(e) => updateItem(idx, { name: e.target.value })}
                      className="min-w-[140px] flex-1"
                      aria-label="Food name"
                    />
                    <Input
                      value={item.quantity ?? ""}
                      onChange={(e) =>
                        updateItem(idx, { quantity: e.target.value })
                      }
                      placeholder="qty"
                      className="w-24"
                      aria-label="Quantity"
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="text-sm text-danger hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <MacroField
                      label="kcal"
                      value={item.calories}
                      onChange={(v) => updateItem(idx, { calories: v })}
                    />
                    <MacroField
                      label="Protein (g)"
                      value={item.protein}
                      onChange={(v) => updateItem(idx, { protein: v })}
                    />
                    <MacroField
                      label="Carbs (g)"
                      value={item.carbs}
                      onChange={(v) => updateItem(idx, { carbs: v })}
                    />
                    <MacroField
                      label="Fat (g)"
                      value={item.fat}
                      onChange={(v) => updateItem(idx, { fat: v })}
                    />
                  </div>
                  {item.note && (
                    <p className="text-xs text-muted">{item.note}</p>
                  )}
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <p className="text-sm text-foreground">
                Total:{" "}
                <span className="font-medium">{totals.calories} kcal</span>
                <span className="text-muted">
                  {" "}
                  · {totals.protein}P / {totals.carbs}C / {totals.fat}F
                </span>
              </p>
              <Button type="button" onClick={handleSave}>
                Save to diary
              </Button>
            </div>
            {summary && <p className="text-xs text-muted">{summary}</p>}
          </div>
        )}
      </div>
    </Card>
  );
}

function MacroField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-medium text-muted">{label}</span>
      <Input
        type="number"
        min={0}
        value={value ?? ""}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === "") return onChange(undefined);
          const n = Number(raw);
          onChange(Number.isFinite(n) ? n : undefined);
        }}
      />
    </label>
  );
}
