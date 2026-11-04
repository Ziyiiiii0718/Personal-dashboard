/**
 * Browser helper for calling the protected /api/ai/* routes.
 * The access password is kept in localStorage so it is only entered once per
 * device. It is URI-encoded because header values must be ASCII, and the
 * password may contain Chinese characters.
 */

export const AI_PASSWORD_HEADER = "x-ai-access-password";
/**
 * Marks a rejection from our own password check. The status alone can't, since
 * the routes also pass through a 401 from the Anthropic API (e.g. a bad key).
 */
export const AI_ACCESS_DENIED_CODE = "AI_ACCESS_DENIED";

const STORAGE_KEY = "ai-access-password";

export function getAiPassword(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setAiPassword(password: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, password);
  } catch {
    // Storage is unavailable; the password just won't be remembered.
  }
}

function clearAiPassword(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clear.
  }
}

/** The request needs a password: none is saved, or the saved one was wrong. */
export class AiAccessError extends Error {
  wrongPassword: boolean;
  constructor(wrongPassword: boolean) {
    super("AI access password required.");
    this.wrongPassword = wrongPassword;
  }
}

export async function postAi<T>(
  path: string,
  body: unknown,
  fallbackError: string
): Promise<T> {
  const password = getAiPassword();
  if (!password) throw new AiAccessError(false);

  const res = await fetch(path, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      [AI_PASSWORD_HEADER]: encodeURIComponent(password),
    },
    body: JSON.stringify(body),
  });
  // Platform errors (such as an oversized request) may not be JSON.
  const data = (await res.json().catch(() => null)) as
    | (T & { error?: string; code?: string })
    | null;

  if (data?.code === AI_ACCESS_DENIED_CODE) {
    clearAiPassword();
    throw new AiAccessError(true);
  }
  if (!res.ok || !data) {
    throw new Error(data?.error || fallbackError);
  }
  return data;
}
