export type CursorColour = 'white' | 'blue' | 'green';
export type CursorRGB = { r: number; g: number; b: number };
export const CURSOR_QUERY = '(hover: hover) and (pointer: fine)';
// The system pointer images that stand in for the lead dot over the live tree (index.css, CursorTrail).
export const NATIVE_DOT_IMAGES = ['/cursor/dot.png', '/cursor/dot@2x.png', '/cursor/press.png', '/cursor/press@2x.png'] as const;
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
// Preserve elapsed time through busy tree frames. A one-second interruption is a reset,
// not a slower animation: replaying stale positions after a tab/driver stall feels broken.
export const TRAIL_MAX_DT = 1000;
export const TRAIL_SETTLE_PX = 0.3;
// Time-based exponential smoothing factor, frame-rate independent.
export function trailFactor(dt: number, tau: number) {
  if (!Number.isFinite(dt) || dt <= 0) return 0;
  if (dt >= TRAIL_MAX_DT) return 1;
  return 1 - Math.exp(-dt / tau);
}
// rAF timestamps are steadier than callback time unless the two disagree by >6ms (overload).
export function frameDt(rafDelta: number, nowDelta: number) {
  const dt = Math.abs(rafDelta - nowDelta) > 6 ? nowDelta : rafDelta;
  if (!Number.isFinite(dt)) return 0;
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
