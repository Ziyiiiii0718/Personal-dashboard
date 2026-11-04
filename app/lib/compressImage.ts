/**
 * Shrinks a photo in the browser before upload. Phone photos can exceed the
 * hosting platform's ~4.5MB request limit, and the AI gains nothing from more
 * than about 1568px on the long edge. HEIC photos are converted to JPEG first,
 * since most browsers outside Safari can't decode them.
 */

const MAX_LONG_EDGE = 1568;
const JPEG_QUALITIES = [0.85, 0.7, 0.5];
/** Becomes about 3.3MB once base64-encoded, under the route's 4MB cap. */
const MAX_BYTES = 2.5 * 1024 * 1024;
const HEIC_JPEG_QUALITY = 0.92;

/** Checks the name too: some browsers report an empty type for HEIC files. */
function isHeicFile(file: File): boolean {
  return /^image\/hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name);
}

async function heicToJpeg(file: File): Promise<Blob> {
  try {
    // Loaded on demand: the decoder is about 0.8MB and most uploads don't need it.
    const { heicTo } = await import("heic-to/next");
    return await heicTo({
      blob: file,
      type: "image/jpeg",
      quality: HEIC_JPEG_QUALITY,
    });
  } catch {
    throw new Error(
      "Could not convert that HEIC photo. Please try exporting it as a JPEG."
    );
  }
}

function toJpegBlob(
  canvas: HTMLCanvasElement,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1] ?? "");
    reader.onerror = () => reject(new Error("Could not read the image."));
    reader.readAsDataURL(blob);
  });
}

export async function compressImage(
  file: File
): Promise<{ data: string; mediaType: string }> {
  const source = isHeicFile(file) ? await heicToJpeg(file) : file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(source);
  } catch {
    throw new Error(
      "This browser can't open that image. Please use a JPEG, PNG, or WebP."
    );
  }

  const scale = Math.min(
    1,
    MAX_LONG_EDGE / Math.max(bitmap.width, bitmap.height)
  );
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("Could not process the image.");
  }
  // JPEG has no transparency; without this, clear PNG areas turn black.
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  for (const quality of JPEG_QUALITIES) {
    const blob = await toJpegBlob(canvas, quality);
    if (blob && blob.size <= MAX_BYTES) {
      return { data: await blobToBase64(blob), mediaType: "image/jpeg" };
    }
  }
  throw new Error("That image is too large. Please try a smaller photo.");
}
