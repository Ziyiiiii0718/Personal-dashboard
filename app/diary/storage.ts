import type { DiaryEntry, DiaryMeta } from "./types";
import {
  base64ToSalt,
  decrypt,
  encrypt,
  generateSalt,
  saltToBase64,
} from "./crypto";

const SALT_KEY = "pld_diary_salt_v1";
const CIPHER_KEY = "pld_diary_cipher_v1";
const META_KEY = "pld_diary_meta_v1";
const LOCK_KEY = "pld_diary_lock_v1";

function getItem(key: string): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(key);
}

function setItem(key: string, value: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, value);
}

function removeItem(key: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(key);
}

/** Returns stored salt as base64, or null if none. */
export function getStoredSalt(): string | null {
  return getItem(SALT_KEY);
}

/** Store salt (base64). Used when setting password or from import. */
export function setStoredSalt(base64: string): void {
  setItem(SALT_KEY, base64);
}

/** Returns stored cipher (base64), or null. */
export function getStoredCipher(): string | null {
  return getItem(CIPHER_KEY);
}

/** Store encrypted payload (base64). */
export function setStoredCipher(base64: string): void {
  setItem(CIPHER_KEY, base64);
}

export function getMeta(): DiaryMeta {
  const raw = getItem(META_KEY);
  if (!raw) return {};
  try {
    const o = JSON.parse(raw) as Record<string, unknown>;
    return typeof o?.lastUpdated === "string" ? { lastUpdated: o.lastUpdated } : {};
  } catch {
    return {};
  }
}

export function setMeta(meta: DiaryMeta): void {
  setItem(META_KEY, JSON.stringify(meta));
}

/** True if diary is considered locked (no key in memory / reload). */
export function getLockState(): boolean {
  const raw = getItem(LOCK_KEY);
  return raw === "1";
}

export function setLockState(locked: boolean): void {
  if (locked) setItem(LOCK_KEY, "1");
  else removeItem(LOCK_KEY);
}

function parseEntriesJson(json: string): DiaryEntry[] {
  const parsed = JSON.parse(json) as unknown;
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(
    (x): x is DiaryEntry =>
      x &&
      typeof x === "object" &&
      typeof x.id === "string" &&
      typeof x.dateISO === "string" &&
      typeof x.content === "string" &&
      typeof x.updatedAt === "string" &&
      typeof x.createdAt === "string"
  );
}

/**
 * Load and decrypt diary entries. Throws on wrong password or corrupt data.
 */
export async function loadEntries(password: string): Promise<DiaryEntry[]> {
  const saltB64 = getStoredSalt();
  const cipherB64 = getStoredCipher();
  if (!saltB64 || !cipherB64) return [];
  const salt = base64ToSalt(saltB64);
  const plaintext = await decrypt(cipherB64, password, salt);
  return parseEntriesJson(plaintext);
}

/**
 * Encrypt and save diary entries. If no salt exists, generates one (first-time set password).
 */
export async function saveEntries(
  password: string,
  entries: DiaryEntry[]
): Promise<void> {
  let saltB64 = getStoredSalt();
  if (!saltB64) {
    const salt = generateSalt();
    saltB64 = saltToBase64(salt);
    setStoredSalt(saltB64);
  }
  const salt = base64ToSalt(saltB64);
  const plaintext = JSON.stringify(entries);
  const cipherB64 = await encrypt(plaintext, password, salt);
  setStoredCipher(cipherB64);
  setMeta({ lastUpdated: new Date().toISOString() });
}

/** Check if a vault exists (salt or cipher present). */
export function hasVault(): boolean {
  return !!(getStoredSalt() || getStoredCipher());
}

/**
 * Set or change password: re-encrypt current data with new password.
 * If no current data, just store new salt and empty cipher.
 */
export async function setPassword(
  newPassword: string,
  currentPassword?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    let entries: DiaryEntry[] = [];
    if (currentPassword && hasVault()) {
      entries = await loadEntries(currentPassword);
    }
    const salt = generateSalt();
    setStoredSalt(saltToBase64(salt));
    const plaintext = JSON.stringify(entries);
    const cipherB64 = await encrypt(plaintext, newPassword, salt);
    setStoredCipher(cipherB64);
    setMeta({ lastUpdated: new Date().toISOString() });
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}

/** Export backup: { salt, cipher } as JSON (base64 strings). */
export function exportBackup(): string {
  const salt = getStoredSalt();
  const cipher = getStoredCipher();
  return JSON.stringify({ salt: salt ?? "", cipher: cipher ?? "" });
}

/**
 * Import backup: replace salt and cipher with uploaded data.
 * Caller should confirm before calling.
 */
export function importBackup(json: string): { success: boolean; error?: string } {
  try {
    const o = JSON.parse(json) as { salt?: string; cipher?: string };
    if (typeof o?.salt === "string" && typeof o?.cipher === "string") {
      setStoredSalt(o.salt);
      setStoredCipher(o.cipher);
      setMeta({ lastUpdated: new Date().toISOString() });
      return { success: true };
    }
    return { success: false, error: "Invalid backup format" };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}
