export const RECEIPT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
export const RECEIPT_MAX_INPUT = 15 * 1024 * 1024;
export const RECEIPT_MAX_EDGE = 1600;

export type Box = { x: number; y: number; w: number; h: number }; // fractions of the image (0..1)

/** Decode a receipt photo. HEIC is tried natively; if the browser can't decode it, explain how to convert. */
export async function loadReceipt(file: File): Promise<ImageBitmap> {
  const isHeic = /heic|heif/i.test(file.type) || /\.(heic|heif)$/i.test(file.name);
  if (!RECEIPT_TYPES.includes(file.type) && !isHeic) throw new Error('Please choose a JPEG, PNG or WebP photo.');
  if (file.size > RECEIPT_MAX_INPUT) throw new Error('That photo is too large. Please choose one under 15 MB.');
  try {
    return await createImageBitmap(file);
  } catch {
    throw new Error(isHeic
      ? 'This photo is in HEIC format, which this browser can’t open. Please convert it to JPEG (on iPhone: Settings → Camera → Formats → Most Compatible, or share it as JPEG) and try again.'
      : 'We couldn’t open that image. Please try a different photo.');
  }
}

/**
 * Paint black boxes on the full image and re-encode as WebP. Drawing to a canvas and re-encoding
 * drops ALL EXIF/XMP metadata, including GPS location.
 */
export async function exportRedacted(bitmap: ImageBitmap, boxes: Box[]): Promise<{ base64: string; width: number; height: number; bytes: number }> {
  const ratio = Math.min(1, RECEIPT_MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * ratio));
  const height = Math.max(1, Math.round(bitmap.height * ratio));
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Your browser could not prepare this image.');
  ctx.drawImage(bitmap, 0, 0, width, height);
  ctx.fillStyle = '#000';
  for (const b of boxes) ctx.fillRect(b.x * width, b.y * height, b.w * width, b.h * height);
  let blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/webp', 0.82));
  if (!blob || blob.type !== 'image/webp') blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.85));
  if (!blob) throw new Error('Your browser could not prepare this image.');
  if (blob.size > 5 * 1024 * 1024) throw new Error('This image is still too large after compression.');
  const buf = new Uint8Array(await blob.arrayBuffer());
  let bin = '';
  for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  return { base64: btoa(bin), width, height, bytes: buf.length };
}
