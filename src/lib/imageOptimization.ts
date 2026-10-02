const MAX_EDGE = 1600;
const WEBP_QUALITY = 0.82;

/** Converts browser-readable images to one bounded WebP before upload. */
export async function optimizeFundraiserImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif' || file.type === 'image/svg+xml') return file;
  const bitmap = await createImageBitmap(file);
  const ratio = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * ratio));
  const height = Math.max(1, Math.round(bitmap.height * ratio));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) { bitmap.close(); return file; }
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', WEBP_QUALITY));
  if (!blob) return file;
  const name = file.name.replace(/\.[^.]+$/, '') || 'fundraiser-photo';
  return new File([blob], `${name}.webp`, { type: 'image/webp', lastModified: Date.now() });
}