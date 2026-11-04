import { NextResponse } from "next/server";
import {
  AnthropicError,
  callClaude,
  parseJsonResponse,
} from "../../../lib/anthropic";
import { guardAiRequest } from "../../../lib/aiGuard";
import type { FoodItem, ParsedMealResult } from "../../../diet/types";

export const runtime = "nodejs";

interface RequestBody {
  description?: string;
  mealType?: string;
  foodLibrary?: FoodItem[];
  habits?: string;
}

const SYSTEM = `You are a nutrition assistant that converts a free-text meal description into structured items with estimated nutrition.

You are given:
- A meal description (may be in Chinese or English, possibly transcribed from speech).
- A "food library": foods the user previously logged with exact nutrition facts. PREFER these numbers when an item matches; set "matchedFoodId" to that food's id and scale to the eaten quantity.
- The user's cooking habits (typical portions, how much oil they use, etc.). Use them to adjust estimates.

Rules:
- Estimate calories (kcal) and macros (protein, carbs, fat) in grams for EACH item.
- Round numbers sensibly (calories to nearest 5, macros to nearest 0.5).
- If you must guess (no library match), still give a best estimate and note the assumption in "note".
- Keep item names short and in the same language as the description.

Respond with ONLY a JSON object, no markdown, no commentary, in exactly this shape:
{
  "items": [
    { "name": string, "quantity": string, "calories": number, "protein": number, "carbs": number, "fat": number, "matchedFoodId": string|null, "note": string|null }
  ],
  "summary": string
}`;

export async function POST(req: Request) {
  const denied = guardAiRequest(req);
  if (denied) return denied;

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const description = (body.description ?? "").trim();
  if (!description) {
    return NextResponse.json(
      { error: "description is required." },
      { status: 400 }
    );
  }

  const library = Array.isArray(body.foodLibrary) ? body.foodLibrary : [];
  const libraryText =
    library.length > 0
      ? library
          .map(
            (f) =>
              `- id=${f.id} | ${f.name} | ${f.basis} | ` +
              `cal=${f.calories ?? "?"} protein=${f.protein ?? "?"}g ` +
              `carbs=${f.carbs ?? "?"}g fat=${f.fat ?? "?"}g` +
              (f.note ? ` | note: ${f.note}` : "")
          )
          .join("\n")
      : "(empty)";

  const habits = (body.habits ?? "").trim() || "(none provided)";
  const mealType = (body.mealType ?? "").trim() || "(unspecified)";

  const userText = [
    `Meal type: ${mealType}`,
    `Meal description: ${description}`,
    "",
    "Food library:",
    libraryText,
    "",
    "Cooking habits:",
    habits,
  ].join("\n");

  try {
    const raw = await callClaude({
      system: SYSTEM,
      content: [{ type: "text", text: userText }],
      maxTokens: 1500,
    });

    const parsed = parseJsonResponse<{
      items?: Array<{
        name?: string;
        quantity?: string;
        calories?: number;
        protein?: number;
        carbs?: number;
        fat?: number;
        matchedFoodId?: string | null;
        note?: string | null;
      }>;
      summary?: string;
    }>(raw);

    const items = (parsed.items ?? [])
      .filter((i) => i && typeof i.name === "string" && i.name.trim())
      .map((i) => ({
        name: i.name!.trim(),
        quantity: i.quantity?.trim() || undefined,
        calories: num(i.calories),
        protein: num(i.protein),
        carbs: num(i.carbs),
        fat: num(i.fat),
        matchedFoodId: i.matchedFoodId || undefined,
        note: i.note?.trim() || undefined,
      }));

    const totals = items.reduce(
      (acc, i) => ({
        calories: acc.calories + (i.calories ?? 0),
        protein: acc.protein + (i.protein ?? 0),
        carbs: acc.carbs + (i.carbs ?? 0),
        fat: acc.fat + (i.fat ?? 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    const result: ParsedMealResult = {
      items,
      totals: {
        calories: Math.round(totals.calories),
        protein: round1(totals.protein),
        carbs: round1(totals.carbs),
        fat: round1(totals.fat),
      },
      summary: parsed.summary?.trim() || undefined,
    };

    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof AnthropicError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { error: "Could not understand the AI response. Please try again." },
      { status: 502 }
    );
  }
}

function num(x: unknown): number | undefined {
  return typeof x === "number" && Number.isFinite(x) ? x : undefined;
}
function round1(x: number): number {
  return Math.round(x * 10) / 10;
}
