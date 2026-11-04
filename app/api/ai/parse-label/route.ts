import { NextResponse } from "next/server";
import {
  AnthropicError,
  callClaude,
  parseJsonResponse,
  type ImageBlock,
} from "../../../lib/anthropic";
import { guardAiRequest } from "../../../lib/aiGuard";

export const runtime = "nodejs";

/** Base64 characters; the browser compresses photos well below this. */
const MAX_IMAGE_BASE64_LENGTH = 4_000_000;

interface RequestBody {
  imageBase64?: string;
  mediaType?: string;
}

const ALLOWED_MEDIA = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

const SYSTEM = `You read a photo of a food nutrition label (营养成分表) and extract its facts.

Rules:
- Identify the product name if visible (otherwise leave it empty).
- Read the basis the numbers are stated per (e.g. "per 100g", "每100克", "per serving (30g)") and put it in "basis".
- Extract calories in kcal and macros (protein, carbs, fat) in grams for that basis.
- If the label uses kilojoules (kJ), convert to kcal (divide by 4.184).
- If a value is not on the label, use null.

Respond with ONLY a JSON object, no markdown:
{ "name": string, "basis": string, "calories": number|null, "protein": number|null, "carbs": number|null, "fat": number|null, "note": string|null }`;

export async function POST(req: Request) {
  const denied = guardAiRequest(req);
  if (denied) return denied;

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const data = (body.imageBase64 ?? "").trim();
  const mediaType = (body.mediaType ?? "").trim();
  if (!data) {
    return NextResponse.json(
      { error: "imageBase64 is required." },
      { status: 400 }
    );
  }
  if (data.length > MAX_IMAGE_BASE64_LENGTH) {
    return NextResponse.json(
      { error: "Image is too large. Please try a smaller photo." },
      { status: 413 }
    );
  }
  if (!ALLOWED_MEDIA.includes(mediaType)) {
    return NextResponse.json(
      { error: "Unsupported image type. Use JPEG, PNG, WebP, or GIF." },
      { status: 400 }
    );
  }

  const image: ImageBlock = {
    type: "image",
    source: { type: "base64", media_type: mediaType, data },
  };

  try {
    const raw = await callClaude({
      system: SYSTEM,
      content: [
        image,
        { type: "text", text: "Extract the nutrition facts from this label." },
      ],
      maxTokens: 600,
    });

    const parsed = parseJsonResponse<{
      name?: string;
      basis?: string;
      calories?: number | null;
      protein?: number | null;
      carbs?: number | null;
      fat?: number | null;
      note?: string | null;
    }>(raw);

    return NextResponse.json({
      name: parsed.name?.trim() || "",
      basis: parsed.basis?.trim() || "per 100g",
      calories: num(parsed.calories),
      protein: num(parsed.protein),
      carbs: num(parsed.carbs),
      fat: num(parsed.fat),
      note: parsed.note?.trim() || undefined,
    });
  } catch (err) {
    if (err instanceof AnthropicError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { error: "Could not read the label. Please try a clearer photo." },
      { status: 502 }
    );
  }
}

function num(x: unknown): number | undefined {
  return typeof x === "number" && Number.isFinite(x) ? x : undefined;
}
