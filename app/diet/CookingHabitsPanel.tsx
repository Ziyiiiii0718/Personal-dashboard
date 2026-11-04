"use client";

import { useState } from "react";
import { Button, Textarea } from "../components/ui";

interface Props {
  value: string;
  onSave: (text: string) => void;
}

export function CookingHabitsPanel({ value, onSave }: Props) {
  const [text, setText] = useState(value);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const dirty = text !== value;

  const handleSave = () => {
    onSave(text.trim());
    setSavedAt(Date.now());
  };

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted">
        Tell the AI how you usually cook and portion food. It uses this to make
        better calorie and protein estimates.
      </p>
      <Textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setSavedAt(null);
        }}
        rows={4}
        placeholder={
          "e.g. I cook with a generous amount of olive oil. A bowl of rice is about 200g cooked. I prefer chicken breast over thigh."
        }
      />
      <div className="flex items-center gap-3">
        <Button type="button" onClick={handleSave} disabled={!dirty}>
          Save habits
        </Button>
        {savedAt && !dirty && (
          <span className="text-xs text-muted">Saved ✓</span>
        )}
      </div>
    </div>
  );
}
