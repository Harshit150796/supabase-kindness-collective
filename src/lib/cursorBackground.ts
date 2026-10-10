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
/** Hero backdrop colour (mid sky) for this load's sky, shown before the live tree draws or without WebGL. */
export function skyBackdropColour(sky: string | undefined): CursorRGB {
  return sky === 'day' ? { r: 158, g: 201, b: 233 } : { r: 31, g: 44, b: 92 };
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
export const TRAIL_TAU = [20, 170, 340] as const;
export const TRAIL_MAX_DT = 64;
export const TRAIL_SETTLE_PX = 0.3;
// Time-based exponential smoothing factor, frame-rate independent.
export function trailFactor(dt: number, tau: number) {
  return 1 - Math.exp(-Math.min(Math.max(dt, 0), TRAIL_MAX_DT) / tau);
}
// rAF timestamps are steadier than callback time unless the two disagree by >6ms (overload).
export function frameDt(rafDelta: number, nowDelta: number) {
  const dt = Math.abs(rafDelta - nowDelta) > 6 ? nowDelta : rafDelta;
  return Math.min(Math.max(dt, 0), TRAIL_MAX_DT);
}
export function opaqueBackground(node: Element) {
  const v = getComputedStyle(node).backgroundColor.match(/[\d.]+/g)?.map(Number);
  return !!v && v.length >= 3 && (v.length < 4 || v[3] >= .99);
}
export function luminance({ r, g, b }: CursorRGB) {
  const linear = (v: number) => (v /= 255) <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4;
  return .2126 * linear(r) + .7152 * linear(g) + .0722 * linear(b);
}
export const COLOUR_HOLD_MS = 160;
export type ColourHysteresis = { current?: CursorColour; pending?: CursorColour; pendingSince?: number };
// Textured sources (the live tree) switch only after a new colour is seen continuously for 160ms.
export function stableColour(state: ColourHysteresis, rgb: CursorRGB, now: number, photo = false): CursorColour {
  const next = cursorColour(rgb, photo);
  if (!state.current) { state.current = next; state.pending = undefined; return next; }
  if (next === state.current) { state.pending = undefined; return state.current; }
  if (state.pending !== next) { state.pending = next; state.pendingSince = now; return state.current; }
  if (now - (state.pendingSince ?? now) >= COLOUR_HOLD_MS) { state.current = next; state.pending = undefined; }
  return state.current;
}
// Flat DOM colours apply immediately and reset the textured history.
export function immediateColour(state: ColourHysteresis, rgb: CursorRGB, photo = false): CursorColour {
  state.current = cursorColour(rgb, photo); state.pending = undefined;
  return state.current;
}
export function averagePixels(pixels: Uint8Array): CursorRGB | undefined {
  let r = 0, g = 0, b = 0, n = 0;
  for (let i = 0; i < pixels.length; i += 4) if (pixels[i + 3]) { r += pixels[i]; g += pixels[i + 1]; b += pixels[i + 2]; n++; }
  return n ? { r: r / n, g: g / n, b: b / n } : undefined;
}
