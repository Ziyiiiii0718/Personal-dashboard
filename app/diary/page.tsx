"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Button,
  Card,
  Input,
  PageLayout,
  Textarea,
} from "../components/ui";
import type { DiaryEntry } from "./types";
import {
  exportBackup,
  hasVault,
  importBackup,
  loadEntries,
  saveEntries,
  setLockState,
  setPassword as setPasswordStorage,
} from "./storage";

const INACTIVITY_MS = 10 * 60 * 1000; // 10 minutes

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

export default function DiaryPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [password, setPasswordInput] = useState("");
  const [unlockError, setUnlockError] = useState("");
  const [showSetPassword, setShowSetPassword] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [setPwdNew, setSetPwdNew] = useState("");
  const [setPwdConfirm, setSetPwdConfirm] = useState("");
  const [setPwdCurrent, setSetPwdCurrent] = useState("");
  const [setPwdError, setSetPwdError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formDate, setFormDate] = useState(todayISO());
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [importConfirm, setImportConfirm] = useState(false);
  const [importError, setImportError] = useState("");
  const passwordRef = useRef<string | null>(null);
  const inactivityRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetInactivityTimer = useCallback(() => {
    if (!unlocked) return;
    if (inactivityRef.current) clearTimeout(inactivityRef.current);
    inactivityRef.current = setTimeout(() => {
      passwordRef.current = null;
      setLockState(true);
      setUnlocked(false);
      setEntries([]);
    }, INACTIVITY_MS);
  }, [unlocked]);

  useEffect(() => {
    setLockState(true);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!unlocked) return;
    resetInactivityTimer();
    const onActivity = () => resetInactivityTimer();
    window.addEventListener("mousedown", onActivity);
    window.addEventListener("keydown", onActivity);
    return () => {
      window.removeEventListener("mousedown", onActivity);
      window.removeEventListener("keydown", onActivity);
      if (inactivityRef.current) clearTimeout(inactivityRef.current);
    };
  }, [unlocked, resetInactivityTimer]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setUnlockError("");
    const pwd = password.trim();
    if (!pwd) return;
    setLoading(true);
    try {
      const list = await loadEntries(pwd);
      setEntries(list);
      passwordRef.current = pwd;
      setLockState(false);
      setUnlocked(true);
      setPasswordInput("");
    } catch {
      setUnlockError("Wrong password or invalid data.");
    } finally {
      setLoading(false);
    }
  };

  const handleLock = () => {
    passwordRef.current = null;
    setLockState(true);
    setUnlocked(false);
    setEntries([]);
    setEditingId(null);
  };

  const persistEntries = useCallback(
    async (next: DiaryEntry[]) => {
      const pwd = passwordRef.current;
      if (!pwd) return;
      try {
        await saveEntries(pwd, next);
        setEntries(next);
      } catch {
        // e.g. quota; could show toast
      }
    },
    []
  );

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSetPwdError("");
    if (setPwdNew !== setPwdConfirm) {
      setSetPwdError("New passwords do not match.");
      return;
    }
    if (setPwdNew.length < 6) {
      setSetPwdError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      const result = await setPasswordStorage(
        setPwdNew,
        hasVault() ? setPwdCurrent || undefined : undefined
      );
      if (result.success) {
        setShowSetPassword(false);
        setShowChangePassword(false);
        setSetPwdNew("");
        setSetPwdConfirm("");
        setSetPwdCurrent("");
        const list = await loadEntries(setPwdNew);
        setEntries(list);
        passwordRef.current = setPwdNew;
        setLockState(false);
        setUnlocked(true);
      } else {
        setSetPwdError(result.error ?? "Failed to set password.");
      }
    } catch {
      setSetPwdError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const content = formContent.trim();
    if (!content) return;
    const now = new Date().toISOString();
    const newEntry: DiaryEntry = {
      id: crypto.randomUUID(),
      dateISO: formDate,
      title: formTitle.trim() || undefined,
      content,
      updatedAt: now,
      createdAt: now,
    };
    persistEntries([newEntry, ...entries]);
    setFormDate(todayISO());
    setFormTitle("");
    setFormContent("");
  };

  const handleUpdateEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    const content = formContent.trim();
    if (!content) return;
    const now = new Date().toISOString();
    persistEntries(
      entries.map((e) =>
        e.id === editingId
          ? {
              ...e,
              dateISO: formDate,
              title: formTitle.trim() || undefined,
              content,
              updatedAt: now,
            }
          : e
      )
    );
    setEditingId(null);
    setFormDate(todayISO());
    setFormTitle("");
    setFormContent("");
  };

  const handleEdit = (entry: DiaryEntry) => {
    setEditingId(entry.id);
    setFormDate(entry.dateISO);
    setFormTitle(entry.title ?? "");
    setFormContent(entry.content);
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this entry?")) {
      persistEntries(entries.filter((e) => e.id !== id));
      if (editingId === id) {
        setEditingId(null);
        setFormDate(todayISO());
        setFormTitle("");
        setFormContent("");
      }
    }
  };

  const handleExport = () => {
    const json = exportBackup();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `diary-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError("");
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = reader.result as string;
        const result = importBackup(text);
        if (result.success) {
          setImportConfirm(false);
          handleLock();
        } else {
          setImportError(result.error ?? "Import failed.");
        }
      } catch {
        setImportError("Invalid file.");
      }
      e.target.value = "";
    };
    reader.readAsText(file);
  };

  const vaultExists = hasVault();
  const isLocked = !unlocked;

  if (loading && !unlocked && !showSetPassword && !showChangePassword) {
    return (
      <PageLayout title="Diary">
        <Card>
          <p className="text-zinc-500 dark:text-zinc-400">Loading…</p>
        </Card>
      </PageLayout>
    );
  }

  if (showSetPassword || showChangePassword) {
    return (
      <PageLayout title="Diary">
        <Card>
          <h2 className="mb-3 text-base font-semibold text-zinc-800 dark:text-zinc-200">
            {vaultExists ? "Change password" : "Set password"}
          </h2>
          <form onSubmit={handleSetPassword} className="space-y-4">
            {vaultExists && (
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Current password
                </span>
                <Input
                  type="password"
                  value={setPwdCurrent}
                  onChange={(e) => setSetPwdCurrent(e.target.value)}
                  placeholder="Current password"
                  autoComplete="current-password"
                />
              </label>
            )}
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                {vaultExists ? "New password" : "Password"}
              </span>
              <Input
                type="password"
                value={setPwdNew}
                onChange={(e) => setSetPwdNew(e.target.value)}
                placeholder="Min 6 characters"
                autoComplete="new-password"
                minLength={6}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Confirm password
              </span>
              <Input
                type="password"
                value={setPwdConfirm}
                onChange={(e) => setSetPwdConfirm(e.target.value)}
                placeholder="Confirm"
                autoComplete="new-password"
              />
            </label>
            {setPwdError && (
              <p className="text-sm text-red-600 dark:text-red-400">{setPwdError}</p>
            )}
            <div className="flex gap-2">
              <Button type="submit">
                {vaultExists ? "Change password" : "Set password"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowSetPassword(false);
                  setShowChangePassword(false);
                  setSetPwdError("");
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </PageLayout>
    );
  }

  if (isLocked) {
    return (
      <PageLayout title="Diary">
        <Card>
          <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
            Your diary is encrypted. Enter your password to unlock.
          </p>
          <form onSubmit={handleUnlock} className="space-y-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Password
              </span>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Diary password"
                autoComplete="current-password"
              />
            </label>
            {unlockError && (
              <p className="text-sm text-red-600 dark:text-red-400">{unlockError}</p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button type="submit">Unlock</Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowSetPassword(!vaultExists);
                  setShowChangePassword(vaultExists);
                  setUnlockError("");
                }}
              >
                {vaultExists ? "Change password" : "Set password"}
              </Button>
            </div>
          </form>
        </Card>
      </PageLayout>
    );
  }

  const sortedEntries = [...entries].sort(
    (a, b) => b.dateISO.localeCompare(a.dateISO) || b.createdAt.localeCompare(a.createdAt)
  );

  return (
    <PageLayout title="Diary">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Unlocked · Auto-lock after 10 min inactivity
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={handleLock}>
              Lock
            </Button>
            <Button variant="secondary" onClick={handleExport}>
              Export backup
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setImportConfirm(true);
                setImportError("");
              }}
            >
              Import backup
            </Button>
          </div>
        </div>
      </Card>

      {importConfirm && (
        <Card>
          <h2 className="mb-2 text-base font-semibold text-zinc-800 dark:text-zinc-200">
            Import backup
          </h2>
          <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
            This will replace all current diary data. Unlock with your existing diary
            password after import.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={handleImportFile}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => fileInputRef.current?.click()}
            >
              Choose file
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setImportConfirm(false);
                setImportError("");
              }}
            >
              Cancel
            </Button>
          </div>
          {importError && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{importError}</p>
          )}
        </Card>
      )}

      <Card>
        <h2 className="mb-3 text-base font-semibold text-zinc-800 dark:text-zinc-200">
          {editingId ? "Edit entry" : "New entry"}
        </h2>
        <form
          onSubmit={editingId ? handleUpdateEntry : handleAddEntry}
          className="space-y-4"
        >
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Date
            </span>
            <Input
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Title (optional)
            </span>
            <Input
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="Entry title"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Content
            </span>
            <Textarea
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              placeholder="What's on your mind?"
              rows={4}
              required
            />
          </label>
          <div className="flex gap-2">
            <Button type="submit">
              {editingId ? "Update" : "Add entry"}
            </Button>
            {editingId && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setEditingId(null);
                  setFormDate(todayISO());
                  setFormTitle("");
                  setFormContent("");
                }}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Card>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
          Entries
        </h2>
        {sortedEntries.length === 0 ? (
          <p className="rounded-2xl border border-black/5 bg-white/80 p-6 text-center text-sm text-zinc-500 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400">
            No entries yet. Add one above.
          </p>
        ) : (
          <ul className="space-y-4">
            {sortedEntries.map((entry) => (
              <li key={entry.id}>
                <Card>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {entry.title || "Untitled"}
                        </span>
                        <span className="text-sm text-zinc-500 dark:text-zinc-400">
                          {formatDate(entry.dateISO)}
                        </span>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-400">
                        {entry.content}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => handleEdit(entry)}
                      >
                        Edit
                      </Button>
                      <button
                        type="button"
                        onClick={() => handleDelete(entry.id)}
                        className="text-sm text-red-600 hover:underline dark:text-red-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageLayout>
  );
}
