/**
 * Server-only access control for the /api/ai/* routes: every request must carry
 * the shared password from the AI_ACCESS_PASSWORD env var, and is rate limited
 * per IP so the Anthropic key can't be drained or the password brute-forced.
 *
 * Limits are held in memory, so on serverless hosting each running instance
 * counts separately and restarts reset them. The password is the real barrier;
 * the limits slow down abuse.
 */

import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { AI_ACCESS_DENIED_CODE, AI_PASSWORD_HEADER } from "./aiClient";

const REQUEST_LIMIT = { max: 20, windowMs: 60 * 1000 };
const FAILED_PASSWORD_LIMIT = { max: 10, windowMs: 15 * 60 * 1000 };
const MAX_TRACKED_WINDOWS = 5000;

interface Limit {
  max: number;
  windowMs: number;
}
interface Window {
  count: number;
  resetAt: number;
}

const requestWindows = new Map<string, Window>();
const failedPasswordWindows = new Map<string, Window>();

function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function secondsLeft(windows: Map<string, Window>, ip: string, limit: Limit) {
  const window = windows.get(ip);
  if (!window || window.resetAt <= Date.now() || window.count < limit.max) {
    return 0;
  }
  return Math.ceil((window.resetAt - Date.now()) / 1000);
}

function record(windows: Map<string, Window>, ip: string, limit: Limit) {
  const now = Date.now();
  if (windows.size >= MAX_TRACKED_WINDOWS) {
    for (const [key, window] of windows) {
      if (window.resetAt <= now) windows.delete(key);
    }
    // Still full of live windows: drop them rather than grow without bound.
    if (windows.size >= MAX_TRACKED_WINDOWS) windows.clear();
  }
  const window = windows.get(ip);
  if (window && window.resetAt > now) {
    window.count += 1;
  } else {
    windows.set(ip, { count: 1, resetAt: now + limit.windowMs });
  }
}

function tooManyRequests(retryAfterSeconds: number) {
  return NextResponse.json(
    { error: "Too many requests. Please wait a moment and try again." },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
  );
}

function sha256(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

/** Returns the error response to send, or null if the request may proceed. */
export function guardAiRequest(req: Request): NextResponse | null {
  const password = process.env.AI_ACCESS_PASSWORD;
  if (!password) {
    // Fail closed: a missing password must not leave the routes open.
    return NextResponse.json(
      {
        error:
          "Missing AI_ACCESS_PASSWORD. Add it to .env.local (and your Vercel project env).",
      },
      { status: 503 }
    );
  }

  const ip = clientIp(req);

  const failedWait = secondsLeft(failedPasswordWindows, ip, FAILED_PASSWORD_LIMIT);
  if (failedWait > 0) return tooManyRequests(failedWait);

  const supplied = req.headers.get(AI_PASSWORD_HEADER) ?? "";
  const matches = timingSafeEqual(
    sha256(supplied),
    sha256(encodeURIComponent(password))
  );
  if (!matches) {
    record(failedPasswordWindows, ip, FAILED_PASSWORD_LIMIT);
    return NextResponse.json(
      { error: "Incorrect access password.", code: AI_ACCESS_DENIED_CODE },
      { status: 401 }
    );
  }

  const requestWait = secondsLeft(requestWindows, ip, REQUEST_LIMIT);
  if (requestWait > 0) return tooManyRequests(requestWait);
  record(requestWindows, ip, REQUEST_LIMIT);

  return null;
}
