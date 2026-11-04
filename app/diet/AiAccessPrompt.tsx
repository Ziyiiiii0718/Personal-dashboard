"use client";

import { useState } from "react";
import { Button, Input } from "../components/ui";
import { setAiPassword } from "../lib/aiClient";

interface Props {
  wrongPassword: boolean;
  /** Called once the password is saved, to retry the interrupted action. */
  onSubmit: () => void;
}

export function AiAccessPrompt({ wrongPassword, onSubmit }: Props) {
  const [password, setPassword] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!password) return;
        setAiPassword(password);
        onSubmit();
      }}
      className="space-y-2 rounded-xl border border-border bg-surface p-3"
    >
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted">
          Enter the AI access password (remembered on this device)
        </span>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          autoFocus
        />
      </label>
      {wrongPassword && (
        <p className="text-sm text-danger">
          That password wasn’t correct. Please try again.
        </p>
      )}
      <Button type="submit" disabled={!password}>
        Continue
      </Button>
    </form>
  );
}
