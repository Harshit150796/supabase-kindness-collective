/**
 * The star tree (founder-chosen, Oct 2026): after the hero's halves meet, a constellation tree lights up
 * from its root star, then "a tree for every $10" writes itself under it with "We plant one for every $10
 * you give." It plays once, then stays; gentle motion (Pause animations) shows the finished picture.
 * The firefly that used to fly a dotted trail in and write the line was removed (founder request, Nov 2026).
 *
 * Placement follows the live scene (heroCamera / canopyTopPx / orbScreen): beside the moon on wide
 * screens ("right"), left of the canopy when the moon side is too narrow ("left"), and in the strip of
 * sky above the headline on phones and portrait tablets ("band"). Pure geometry + SVG markup, no DOM.
 */
import { canopyTopPx, heroCamera, orbScreen, PHONE_BREAKPOINT, type HeroSky } from '@/lib/heroBackdrop';

export type StarTreeLayout = 'right' | 'left' | 'band' | 'ground';

/** The constellation, drawn at 1x around its root star (0,0). r is the star's radius. */
const BASE: Record<string, [number, number, number]> = {
  S1: [300, 334, 2.6], S2: [300, 292, 1.9], S3: [262, 286, 1.5], S4: [240, 256, 2.0], S5: [244, 222, 1.4],
  S6: [270, 198, 1.8], S7: [304, 190, 2.8], S8: [336, 202, 1.6], S9: [358, 230, 2.3], S10: [356, 264, 1.5],
  S11: [334, 288, 1.7], S12: [284, 244, 1.3], S13: [322, 236, 1.4],
};
const LINES: [string, string[]][] = [
  ['trunk', ['S1', 'S2']], ['b1', ['S2', 'S12']], ['b2', ['S2', 'S13']],
  ['left', ['S2', 'S3', 'S4', 'S5', 'S6', 'S7']], ['right', ['S2', 'S11', 'S10', 'S9', 'S8', 'S7']],
];
/** Seconds from the start: the stars light from the root upward, then the lines draw. */
const LIGHT: Record<string, number> = { S1: 0.2, S2: 0.35, S12: 0.5, S13: 0.5, S3: 0.65, S11: 0.65, S4: 0.8, S10: 0.8, S5: 0.95, S9: 0.95, S6: 1.1, S8: 1.1, S7: 1.25 };
const DRAW: Record<string, [number, number]> = { trunk: [1.3, 1.55], b1: [1.5, 1.8], b2: [1.5, 1.8], left: [1.75, 2.45], right: [1.75, 2.45] };
const WRITE: [number, number] = [2.5, 3.55];
const CAPTION_AT = 3.55;
/** Total length of the moment in seconds (the caption is in by then). */
export const STAR_TREE_SECONDS = 3.95;

/** Caveat Bold advance of "a tree for every $10", in em (public/fonts/caveat-700-tree.woff2). */
const LINE_EM = 6.845;
const LINE = 'a tree for every $10';
const CAPTION = 'We plant one for every $10 you give.';
/** The reference frame the moon-side layout was designed in: a 1440 x 666 laptop hero. */
const REF_PX_PER_UNIT = 60;

const PALETTE = {
  night: { star: '#eef2ff', line: 'rgba(232, 236, 214, 0.42)', ink: '#eef2ff', caption: 'rgba(238, 242, 255, 0.82)', glow: true },
  day: { star: '#1f5e24', line: 'rgba(31, 94, 36, 0.4)', ink: '#1f5e24', caption: '#14361d', glow: false },
} as const;

type Pt = [number, number];
interface Plan {
  layout: StarTreeLayout;
  stars: Record<string, [number, number, number]>;
  text: { x: number; y: number; anchor: 'middle' | 'start'; size: number; width: number; rot: Pt };
  caption: { x: number; y: number; anchor: 'middle' | 'start'; size: number } | null;
  glow: number;
  /** Drawn on the grass (short phones): deep green ink whatever the sky. */
  ground?: boolean;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Where the moment goes in a hero of this size, or null when there is no room for it. */
export function planStarTree(width: number, height: number, sky: HeroSky): Plan | null {
  if (!width || !height) return null;
  const phone = width < PHONE_BREAKPOINT;
  const canopy = canopyTopPx(width, height, phone);
  const { position: c, forward: f, tanHalf } = heroCamera(width, height, phone);
  // Pixels per world unit at the trunk, to scale the drawing with the scene.
  const depth = -(c[0] * f[0] + c[1] * f[1] + c[2] * f[2]);
  const ppu = height / 2 / tanHalf / depth;
  const k = clamp(ppu / REF_PX_PER_UNIT, 0.75, 1.5);
  const kt = clamp(k, 0.85, 1.3);
  const canopyHalf = 190 * (ppu / REF_PX_PER_UNIT);
  const size = 27 * kt;
  const lineW = LINE_EM * size;
  const labelHalf = lineW / 2 + 12;
  // The kicker's top: buttons end 28px (phones) / 36px above the canopy, then 36/38px buttons, 8px gap, ~18px kicker.
  const kickerTop = canopy - (phone ? 28 + 36 + 8 + 17 : 36 + 38 + 8 + 19);

  const side = (dir: 1 | -1, cx: number): Plan => {
    const s1y = canopy + 59 * k;
    const baseline = s1y + 44 * k;
    return {
      layout: dir === 1 ? 'right' : 'left',
      stars: placeStars(1.05 * k, cx, s1y, 1.05 * clamp(k, 0.9, 1.3)),
      text: { x: cx, y: baseline, anchor: 'middle', size, width: lineW, rot: [cx, baseline - 4] },
      caption: { x: cx, y: baseline + 24 * kt, anchor: 'middle', size: 13 * kt },
      glow: 2.2,
    };
  };

  if (!phone) {
    // Beside the moon (or sun), as designed.
    const orb = orbScreen(sky, width, height, phone);
    let cx = orb.x + 176 * k;
    cx = Math.min(cx, width - 16 - labelHalf);
    const fitsRight = cx - 63 * k >= orb.x + orb.r + 18 && cx + 63 * k <= width - 16;
    const fitsBelow = canopy + 59 * k + 74 * kt <= height - 72 && canopy + 59 * k - 151 * k >= 6;
    if (fitsRight && fitsBelow) return side(1, cx);
    // Left of the canopy, mirrored.
    const canopyLeft = width / 2 - canopyHalf;
    if (canopyLeft >= 2 * labelHalf + 28 && fitsBelow) return side(-1, Math.max(16 + labelHalf, canopyLeft / 2));
  }

  // The strip of sky above the headline.
  const bandTop = 4;
  const bandH = kickerTop - 6 - bandTop;
  // Small phones (about 30px of sky) get a compact one-line version: smaller tree, no caption.
  const s = clamp(bandH / 56, 0.6, 1.3);
  if (bandH < 24) return phone ? groundPlan(width, height, c, f, tanHalf) : null;
  const withCaption = bandH >= 44;
  const treeW = 42.5 * s;
  const gap = 12 * s;
  const tSize = 21 * s;
  const tW = LINE_EM * tSize;
  const total = treeW + gap + tW;
  if (total > width - 24) return null;
  const x0 = (width - total) / 2;
  const top = bandTop + Math.max(0, (bandH - 52 * s) / 2);
  const cx = x0 + treeW / 2;
  const s1y = top + 52 * s;
  const lx = x0 + treeW + gap;
  const baseline = withCaption ? top + 30 * s : top + 36 * s;
  return {
    layout: 'band',
    stars: placeStars(0.36 * s, cx, s1y, 0.62 * s),
    text: { x: lx, y: baseline, anchor: 'start', size: tSize, width: tW, rot: [lx, baseline - 4] },
    caption: withCaption ? { x: lx + 1, y: top + 48 * s, anchor: 'start', size: 10.5 * s } : null,
    glow: 1.6,
  };
}

/**
 * Short phones (no sky between the header and the headline): the star tree stands on the grass below
 * the trunk, left of the Ask Coupon button.
 */
function groundPlan(width: number, height: number, c: number[], f: number[], tanHalf: number): Plan | null {
  // The trunk's foot (world origin) on screen.
  const up = [0, -f[2], f[1]];
  const rel = [-c[0], -c[1], -c[2]];
  const z = rel[0] * f[0] + rel[1] * f[1] + rel[2] * f[2];
  const base = height / 2 - ((rel[0] * up[0] + rel[1] * up[1] + rel[2] * up[2]) / z) * (height / 2 / tanHalf);
  const s = 0.62;
  const treeW = 42.5 * s, gap = 10 * s, tSize = 21 * s, tW = LINE_EM * tSize;
  const total = treeW + gap + tW;
  // Between the Pause button (left) and Ask Coupon (right), above both.
  const x0 = 60 + Math.max(0, (width - 200 - total) / 2);
  if (x0 + total > width - 140) return null;
  const s1y = Math.min(base + 26, height - 62);
  const cx = x0 + treeW / 2;
  const lx = x0 + treeW + gap;
  return {
    layout: 'ground',
    stars: placeStars(0.36 * s, cx, s1y, 0.62 * s),
    text: { x: lx, y: s1y - 12 * s, anchor: 'start', size: tSize, width: tW, rot: [lx, s1y - 16 * s] },
    caption: null,
    glow: 1.4,
    ground: true,
  };
}

function placeStars(scale: number, cx: number, s1y: number, rs: number) {
  const out: Record<string, [number, number, number]> = {};
  for (const [key, [x, y, r]] of Object.entries(BASE)) out[key] = [cx + (x - 300) * scale, s1y + (y - 334) * scale, r * rs];
  return out;
}

// ---------- markup ----------
const n = (v: number) => (Math.round(v * 100) / 100).toString();
const times = (t: number[], total: number) => t.map((v) => (Math.round(Math.min(1, Math.max(0, v / total)) * 10000) / 10000).toString()).join(';');

/** values[i] is reached at at[i] seconds (0 < at[0], last < the total); held before and after. */
function anim(attr: string, values: (number | string)[], at: number[]) {
  const kt = [0, ...at, STAR_TREE_SECONDS];
  const vals = [values[0], ...values, values[values.length - 1]];
  return `<animate attributeName="${attr}" dur="${STAR_TREE_SECONDS}s" fill="freeze" values="${vals.map((v) => (typeof v === 'number' ? n(v) : v)).join(';')}" keyTimes="${times(kt, STAR_TREE_SECONDS)}"/>`;
}

/**
 * The SVG's inner markup. `animate` false gives the finished picture (gentle motion, or after it played).
 * All numbers come from planStarTree; there is no outside text in it.
 */
export function starTreeMarkup(plan: Plan, sky: HeroSky, animate: boolean): string {
  const p = plan.ground ? PALETTE.day : PALETTE[sky];
  const out: string[] = [];
  const glow = p.glow ? ' filter="url(#cd-st-glow)"' : '';

  out.push(`<defs>${p.glow ? `<filter id="cd-st-glow" x="-300%" y="-300%" width="700%" height="700%"><feGaussianBlur stdDeviation="${plan.glow}" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<filter id="cd-st-ink" x="-15%" y="-60%" width="130%" height="220%"><feGaussianBlur in="SourceGraphic" stdDeviation="2.6" result="b1"/><feGaussianBlur in="SourceGraphic" stdDeviation="7" result="b2"/><feColorMatrix in="b1" type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 0.8 0" result="g1"/><feColorMatrix in="b2" type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 0.45 0" result="g2"/><feMerge><feMergeNode in="g2"/><feMergeNode in="g1"/><feMergeNode in="SourceGraphic"/></feMerge></filter>` : ''}
<clipPath id="cd-st-write"><rect x="${n(plan.text.anchor === 'middle' ? plan.text.x - plan.text.width / 2 - 14 : plan.text.x - 6)}" y="${n(plan.text.y - plan.text.size * 1.15)}" width="${n(plan.text.width + 28)}" height="${n(plan.text.size * 1.6)}">${animate ? anim('width', [0, plan.text.width + 28], [WRITE[0], WRITE[1]]) : ''}</rect></clipPath></defs>`);

  // Lines between the stars.
  out.push(`<g fill="none" stroke="${p.line}" stroke-width="${plan.layout === 'band' || plan.layout === 'ground' ? 0.8 : 1}" stroke-linejoin="round">`);
  for (const [name, keys] of LINES) {
    const d = 'M ' + keys.map((key) => `${n(plan.stars[key][0])} ${n(plan.stars[key][1])}`).join(' L ');
    const [t0, t1] = DRAW[name];
    out.push(`<path d="${d}" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="0">${animate ? anim('stroke-dashoffset', [1, 0], [t0, t1]) : ''}</path>`);
  }
  out.push('</g>');

  // The stars, lighting from the root star upward.
  out.push(`<g${glow}>`);
  for (const [key, t] of Object.entries(LIGHT)) {
    const [x, y, r] = plan.stars[key];
    out.push(`<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" fill="${p.star}">${animate ? anim('opacity', [0, 1], [t, t + 0.15]) + anim('r', [0, 1.8 * r, r], [t, t + 0.12, t + 0.4]) : ''}</circle>`);
  }
  out.push('</g>');

  // The line, written from left to right, and the caption.
  const { x, y, anchor, size, width, rot } = plan.text;
  out.push(`<g transform="rotate(-3 ${n(rot[0])} ${n(rot[1])})"><g clip-path="url(#cd-st-write)"><text x="${n(x)}" y="${n(y)}" text-anchor="${anchor}" font-family="'Caveat Tree', 'Segoe Print', cursive" font-size="${n(size)}" font-weight="700" fill="${p.ink}"${p.glow ? ' filter="url(#cd-st-ink)"' : ''}${plan.ground ? ' stroke="rgba(236, 246, 226, 0.7)" stroke-width="3" stroke-linejoin="round" paint-order="stroke"' : ''}>${LINE.replace('$', '&#36;')}</text></g>`);
  out.push('</g>');
  if (plan.caption) {
    const cpt = plan.caption;
    out.push(`<text x="${n(cpt.x)}" y="${n(cpt.y)}" text-anchor="${cpt.anchor}" font-family="'Instrument Sans', 'Instrument Sans Fallback', system-ui, sans-serif" font-size="${n(cpt.size)}" font-weight="500" fill="${p.caption}">${CAPTION.replace('$', '&#36;')}${animate ? anim('opacity', [0, 1], [CAPTION_AT, STAR_TREE_SECONDS - 0.1]) : ''}</text>`);
  }
  return out.join('\n');
}
