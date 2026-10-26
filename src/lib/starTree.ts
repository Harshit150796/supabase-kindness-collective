/**
 * "One firefly plants a star tree" (founder-chosen, Oct 2026): after the hero's halves meet, a firefly
 * leaves the canopy, flies a dotted trail through the sky, and where it lands a constellation tree lights
 * up from the root, then "a tree for every $10" writes itself under it with "We plant one for every $10
 * you give." It plays once, then stays; gentle motion (Pause animations) shows the finished picture.
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
const LIGHT: Record<string, number> = { S2: 4.1, S12: 4.38, S13: 4.38, S3: 4.66, S11: 4.66, S4: 4.94, S10: 4.94, S5: 5.22, S9: 5.22, S6: 5.5, S8: 5.5, S7: 5.78 };
const DRAW: Record<string, [number, number]> = { trunk: [5.9, 6.4], b1: [6.3, 6.9], b2: [6.3, 6.9], left: [6.8, 8.2], right: [6.8, 8.2] };
const LEAD: [number, number] = [0.3, 4.0];
const WRITE: [number, number] = [8.3, 10.6];
const CAPTION_AT = 10.6;
/** Total length of the moment in seconds (the caption is in by then). */
export const STAR_TREE_SECONDS = 11.4;

/** Caveat Bold advance of "a tree for every $10", in em (public/fonts/caveat-700-tree.woff2). */
const LINE_EM = 6.845;
const LINE = 'a tree for every $10';
const CAPTION = 'We plant one for every $10 you give.';
/** The reference frame the moon-side layout was designed in: a 1440 x 666 laptop hero. */
const REF_PX_PER_UNIT = 60;

const PALETTE = {
  night: { fly: '#f6eda8', star: '#eef2ff', line: 'rgba(232, 236, 214, 0.42)', ink: '#f6eda8', caption: '#c9d1bd', glow: true },
  day: { fly: '#2e7d32', star: '#1f5e24', line: 'rgba(31, 94, 36, 0.4)', ink: '#1f5e24', caption: '#14361d', glow: false },
} as const;

type Pt = [number, number];
interface Plan {
  layout: StarTreeLayout;
  stars: Record<string, [number, number, number]>;
  trail: { start: Pt; c1: Pt; c2: Pt; mid: Pt; q2: Pt; end: Pt };
  text: { x: number; y: number; anchor: 'middle' | 'start'; size: number; width: number; rot: Pt };
  caption: { x: number; y: number; anchor: 'middle' | 'start'; size: number } | null;
  dot: number;
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
  const size = 38 * kt;
  const lineW = LINE_EM * size;
  const labelHalf = lineW / 2 + 12;
  // The kicker's top: buttons end 28px (phones) / 36px above the canopy, then 36/38px buttons, 8px gap, ~18px kicker.
  const kickerTop = canopy - (phone ? 28 + 36 + 8 + 17 : 36 + 38 + 8 + 19);

  const side = (dir: 1 | -1, cx: number): Plan => {
    const s1y = canopy + 59 * k;
    const sx = width / 2 + dir * 132 * k;
    const sy = canopy - 3 * k;
    // The reference trail (1440 x 666), mapped onto this start and root star.
    const fx = (x: number) => sx + dir * ((x - 852) * Math.abs(cx - sx)) / 333;
    const fy = (y: number) => sy + ((y - 166) * (s1y - sy)) / 62;
    const baseline = s1y + 44 * k;
    return {
      layout: dir === 1 ? 'right' : 'left',
      stars: placeStars(1.05 * k, cx, s1y, 1.05 * clamp(k, 0.9, 1.3)),
      trail: { start: [sx, sy], c1: [fx(930), fy(128)], c2: [fx(1010), fy(143)], mid: [fx(1060), fy(173)], q2: [fx(1140), fy(228)], end: [cx, s1y] },
      text: { x: cx, y: baseline, anchor: 'middle', size, width: lineW, rot: [cx, baseline - 4] },
      caption: { x: cx, y: baseline + 30 * kt, anchor: 'middle', size: 13 * kt },
      dot: 15 * k,
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
  if (bandH < 24) return phone ? groundPlan(width, height, canopyHalf, c, f, tanHalf) : null;
  const withCaption = bandH >= 44;
  const treeW = 42.5 * s;
  const gap = 12 * s;
  const tSize = 30 * s;
  const tW = LINE_EM * tSize;
  const total = treeW + gap + tW;
  if (total > width - 24) return null;
  const x0 = (width - total) / 2;
  const top = bandTop + Math.max(0, (bandH - 52 * s) / 2);
  const cx = x0 + treeW / 2;
  const s1y = top + 52 * s;
  const lx = x0 + treeW + gap;
  const baseline = withCaption ? top + 30 * s : top + 36 * s;
  const start: Pt = [width / 2 - 0.8 * canopyHalf, canopy + 0.25 * canopyHalf];
  const edge = Math.max(10, Math.min(18, x0 - 26));
  return {
    layout: 'band',
    stars: placeStars(0.36 * s, cx, s1y, 0.62 * s),
    trail: { start, c1: [edge, start[1] - 40], c2: [edge, s1y + 70], mid: [edge + 4, s1y + 46], q2: [cx - 22, s1y + 2], end: [cx, s1y] },
    text: { x: lx, y: baseline, anchor: 'start', size: tSize, width: tW, rot: [lx, baseline - 4] },
    caption: withCaption ? { x: lx + 1, y: top + 48 * s, anchor: 'start', size: 10.5 * s } : null,
    dot: 11 * s,
    glow: 1.6,
  };
}

/**
 * Short phones (no sky between the header and the headline): the firefly drops from the canopy and
 * plants the star tree on the grass below the trunk, left of the Ask Coupon button.
 */
function groundPlan(width: number, height: number, canopyHalf: number, c: number[], f: number[], tanHalf: number): Plan | null {
  // The trunk's foot (world origin) on screen.
  const up = [0, -f[2], f[1]];
  const rel = [-c[0], -c[1], -c[2]];
  const z = rel[0] * f[0] + rel[1] * f[1] + rel[2] * f[2];
  const base = height / 2 - ((rel[0] * up[0] + rel[1] * up[1] + rel[2] * up[2]) / z) * (height / 2 / tanHalf);
  const s = 0.62;
  const treeW = 42.5 * s, gap = 10 * s, tSize = 30 * s, tW = LINE_EM * tSize;
  const total = treeW + gap + tW;
  // Between the Pause button (left) and Ask Coupon (right), above both.
  const x0 = 60 + Math.max(0, (width - 200 - total) / 2);
  if (x0 + total > width - 140) return null;
  const s1y = Math.min(base + 26, height - 62);
  const cx = x0 + treeW / 2;
  const lx = x0 + treeW + gap;
  const start: Pt = [width / 2 - 0.7 * canopyHalf, base - 0.45 * canopyHalf];
  return {
    layout: 'ground',
    stars: placeStars(0.36 * s, cx, s1y, 0.62 * s),
    trail: { start, c1: [start[0] - 24, start[1] + 18], c2: [cx - 34, s1y - 40], mid: [cx - 22, s1y - 16], q2: [cx - 8, s1y], end: [cx, s1y] },
    text: { x: lx, y: s1y - 12 * s, anchor: 'start', size: tSize, width: tW, rot: [lx, s1y - 16 * s] },
    caption: null,
    dot: 9,
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

function cubic(p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): Pt {
  const m = 1 - t;
  return [m ** 3 * p0[0] + 3 * m * m * t * p1[0] + 3 * m * t * t * p2[0] + t ** 3 * p3[0], m ** 3 * p0[1] + 3 * m * m * t * p1[1] + 3 * m * t * t * p2[1] + t ** 3 * p3[1]];
}

/**
 * The SVG's inner markup. `animate` false gives the finished picture (gentle motion, or after it played).
 * All numbers come from planStarTree; there is no outside text in it.
 */
export function starTreeMarkup(plan: Plan, sky: HeroSky, animate: boolean): string {
  const p = plan.ground ? PALETTE.day : PALETTE[sky];
  const { start, c1, c2, mid, q2, end } = plan.trail;
  const q1: Pt = [2 * mid[0] - c2[0], 2 * mid[1] - c2[1]];
  const pts: Pt[] = [];
  for (let i = 0; i <= 400; i++) pts.push(cubic(start, c1, c2, mid, i / 400));
  for (let i = 1; i <= 400; i++) pts.push(cubic(mid, q1, q2, end, i / 400));
  const lens = [0];
  for (let i = 1; i < pts.length; i++) lens.push(lens[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const total = lens[lens.length - 1];
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

  // The trail: older dots dimmer, newest at the root star.
  out.push(`<g fill="${p.fly}"${glow}>`);
  for (let s = 8; s < total - 14; s += plan.dot) {
    let j = 0;
    while (lens[j] < s) j++;
    const frac = s / total;
    const op = (sky === 'day' ? 0.2 : 0.25) + 0.6 * frac;
    const t = LEAD[0] + frac * (LEAD[1] - LEAD[0]);
    out.push(`<circle cx="${n(pts[j][0])}" cy="${n(pts[j][1])}" r="${n((1 + 0.9 * frac) * (plan.layout === 'band' || plan.layout === 'ground' ? 0.8 : 1))}" opacity="${n(op)}">${animate ? anim('opacity', [0, op], [t, t + 0.12]) : ''}</circle>`);
  }
  out.push('</g>');

  // The firefly that becomes the root star, then the rest of the stars.
  out.push(`<g${glow}>`);
  const [rx, ry, rr] = plan.stars.S1;
  const rel = (q: Pt) => `${n(q[0] - rx)} ${n(q[1] - ry)}`;
  const leadPath = `M ${rel(start)} C ${rel(c1)}, ${rel(c2)}, ${rel(mid)} S ${rel(q2)}, 0 0`;
  out.push(`<circle cx="${n(rx)}" cy="${n(ry)}" r="${n(rr)}" fill="${p.star}">${animate
    ? `<animateMotion dur="${STAR_TREE_SECONDS}s" fill="freeze" path="${leadPath}" keyPoints="0;0;1;1" keyTimes="${times([0, LEAD[0], LEAD[1], STAR_TREE_SECONDS], STAR_TREE_SECONDS)}" calcMode="linear"/>`
      + anim('opacity', [0, 1, 0.6, 1, 0.7, 1], [0.05, LEAD[0], 0.9, 1.5, 2.3, 3.0])
      + anim('fill', [p.fly, p.star], [LEAD[1], LEAD[1] + 1])
      + anim('r', [2.5, rr], [LEAD[1], LEAD[1] + 0.5])
    : ''}</circle>`);
  for (const [key, t] of Object.entries(LIGHT)) {
    const [x, y, r] = plan.stars[key];
    out.push(`<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" fill="${p.star}">${animate ? anim('opacity', [0, 1], [t, t + 0.15]) + anim('r', [0, 1.8 * r, r], [t, t + 0.12, t + 0.4]) : ''}</circle>`);
  }
  out.push('</g>');

  // The line, written by a firefly, and the caption.
  const { x, y, anchor, size, width, rot } = plan.text;
  out.push(`<g transform="rotate(-3 ${n(rot[0])} ${n(rot[1])})"><g clip-path="url(#cd-st-write)"><text x="${n(x)}" y="${n(y)}" text-anchor="${anchor}" font-family="'Caveat Tree', 'Segoe Print', cursive" font-size="${n(size)}" font-weight="700" fill="${p.ink}"${p.glow ? ' filter="url(#cd-st-ink)"' : ''}${plan.ground ? ' stroke="rgba(236, 246, 226, 0.7)" stroke-width="3" stroke-linejoin="round" paint-order="stroke"' : ''}>${LINE.replace('$', '&#36;')}</text></g>`);
  if (animate) {
    const lx = anchor === 'middle' ? x - width / 2 : x;
    const py = y - size * 0.26;
    const a = size * 0.21;
    const step = width / 4;
    const pen = `M ${n(lx)} ${n(py)} C ${n(lx + step * 0.4)} ${n(py - a)}, ${n(lx + step * 0.6)} ${n(py + a)}, ${n(lx + step)} ${n(py)} S ${n(lx + step * 1.6)} ${n(py - a)}, ${n(lx + step * 2)} ${n(py)} S ${n(lx + step * 2.6)} ${n(py + a)}, ${n(lx + step * 3)} ${n(py)} S ${n(lx + step * 3.6)} ${n(py - a)}, ${n(lx + width)} ${n(py - a * 0.6)}`;
    out.push(`<circle r="${plan.layout === 'band' || plan.layout === 'ground' ? 2 : 2.6}" fill="${p.fly}" opacity="0"${glow}><animateMotion dur="${STAR_TREE_SECONDS}s" fill="freeze" path="${pen}" keyPoints="0;0;1;1" keyTimes="${times([0, WRITE[0], WRITE[1], STAR_TREE_SECONDS], STAR_TREE_SECONDS)}" calcMode="linear"/>${anim('opacity', [0, 1, 1, 0], [WRITE[0] - 0.15, WRITE[0], WRITE[1], WRITE[1] + 0.35])}</circle>`);
  }
  out.push('</g>');
  if (plan.caption) {
    const cpt = plan.caption;
    out.push(`<text x="${n(cpt.x)}" y="${n(cpt.y)}" text-anchor="${cpt.anchor}" font-family="'Instrument Sans', 'Instrument Sans Fallback', system-ui, sans-serif" font-size="${n(cpt.size)}" font-weight="500" fill="${p.caption}">${CAPTION.replace('$', '&#36;')}${animate ? anim('opacity', [0, 1], [CAPTION_AT, STAR_TREE_SECONDS - 0.1]) : ''}</text>`);
  }
  return out.join('\n');
}
