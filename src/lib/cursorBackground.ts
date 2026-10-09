export type CursorColour = 'white' | 'blue' | 'green';
export type CursorRGB = { r: number; g: number; b: number };
export const CURSOR_QUERY = '(hover: hover) and (pointer: fine)';
export const CURSOR_SAMPLE_INTERVAL = 1000 / 12;
export const TEXT_ENTRY_SELECTOR = 'input:not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="checkbox"]):not([type="radio"]),textarea,select,[contenteditable]:not([contenteditable="false"])';
export function cursorColour({ r, g, b }: CursorRGB, photo = false): CursorColour {
  const [R, G, B] = [r, g, b].map(v => v / 255);
  const linear = (v: number) => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4;
  if (.2126 * linear(R) + .7152 * linear(G) + .0722 * linear(B) < .20) return 'white';
  const max = Math.max(R, G, B), min = Math.min(R, G, B), delta = max - min;
  const saturation = delta ? delta / (1 - Math.abs(max + min - 1)) : 0;
  let hue = 0;
  if (delta) {
    hue = (max === R ? (G - B) / delta : max === G ? (B - R) / delta + 2 : (R - G) / delta + 4) * 60;
    if (hue < 0) hue += 360;
  }
  if (hue >= 75 && hue <= 165 && saturation > .2) return 'blue';
  if (hue >= 185 && hue <= 255 && saturation > .25) return 'green';
  return photo ? 'white' : 'blue';
}
export function coverSamplePoint(x: number, y: number, width: number, height: number, imageWidth: number, imageHeight: number) {
  const scale = Math.max(width / imageWidth, height / imageHeight);
  return { x: (x + (imageWidth * scale - width) / 2) / scale, y: (y + (imageHeight * scale - height) / 2) / scale };
}
let posterCache: { source: string; canvas: HTMLCanvasElement; context: CanvasRenderingContext2D } | undefined;
export function samplePoster(image: HTMLImageElement, x: number, y: number): CursorRGB | undefined {
  if (!image.complete || !image.naturalWidth) return;
  if (!posterCache || posterCache.source !== image.currentSrc) {
    const canvas = document.createElement('canvas');
    const scale = Math.min(1, 512 / image.naturalWidth);
    canvas.width = Math.round(image.naturalWidth * scale); canvas.height = Math.round(image.naturalHeight * scale);
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return;
    try { context.drawImage(image, 0, 0, canvas.width, canvas.height); } catch { return; }
    posterCache = { source: image.currentSrc, canvas, context };
  }
  const rect = image.getBoundingClientRect();
  const point = coverSamplePoint(x - rect.left, y - rect.top, rect.width, rect.height, posterCache.canvas.width, posterCache.canvas.height);
  try {
    const pixel = posterCache.context.getImageData(Math.max(0, Math.min(posterCache.canvas.width - 1, Math.floor(point.x))), Math.max(0, Math.min(posterCache.canvas.height - 1, Math.floor(point.y))), 1, 1).data;
    return { r: pixel[0], g: pixel[1], b: pixel[2] };
  } catch { return; }
}
export function elementBackground(target: Element): { rgb: CursorRGB; photo: boolean } {
  let photo = false;
  for (let node: Element | null = target; node; node = node.parentElement) {
    const style = getComputedStyle(node);
    photo ||= node.matches('img,picture,video') || style.backgroundImage !== 'none';
    const values = style.backgroundColor.match(/[\d.]+/g)?.map(Number);
    if (values && values.length >= 3 && (values.length < 4 || values[3] >= .99)) return { rgb: { r: values[0], g: values[1], b: values[2] }, photo };
  }
  return { rgb: { r: 255, g: 255, b: 255 }, photo };
}
