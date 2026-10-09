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
export const TRAIL_TAU = [170, 340] as const;
export const TRAIL_MAX_DT = 64;
export const TRAIL_SETTLE_PX = 0.3;
// Time-based exponential smoothing factor, frame-rate independent.
export function trailFactor(dt: number, tau: number) {
  return 1 - Math.exp(-Math.min(Math.max(dt, 0), TRAIL_MAX_DT) / tau);
}
export function luminance({ r, g, b }: CursorRGB) {
  const linear = (v: number) => (v /= 255) <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4;
  return .2126 * linear(r) + .7152 * linear(g) + .0722 * linear(b);
}
export type ColourHysteresis = { current?: CursorColour; pending?: CursorColour; luminance?: number };
// Textured sources (tree, poster) switch only on two consecutive matching samples or a >0.15 luminance jump.
export function stableColour(state: ColourHysteresis, rgb: CursorRGB, photo = false): CursorColour {
  const next = cursorColour(rgb, photo), L = luminance(rgb);
  const jump = state.luminance !== undefined && Math.abs(L - state.luminance) > .15;
  state.luminance = L;
  if (!state.current || next === state.current || jump || state.pending === next) { state.current = next; state.pending = undefined; }
  else state.pending = next;
  return state.current;
}
// Flat DOM colours apply immediately and reset the textured history.
export function immediateColour(state: ColourHysteresis, rgb: CursorRGB, photo = false): CursorColour {
  state.current = cursorColour(rgb, photo); state.pending = undefined; state.luminance = luminance(rgb);
  return state.current;
}
export function averagePixels(pixels: Uint8Array): CursorRGB | undefined {
  let r = 0, g = 0, b = 0, n = 0;
  for (let i = 0; i < pixels.length; i += 4) if (pixels[i + 3]) { r += pixels[i]; g += pixels[i + 1]; b += pixels[i + 2]; n++; }
  return n ? { r: r / n, g: g / n, b: b / n } : undefined;
}
