// Coupon, the AI tree: CouponDonation's mascot for every video.
// The site names its assistant "Coupon, the AI tree" (src/components/landing/hero/AITreeLauncher.tsx);
// this is that character drawn for film. See ./README.md for the rules.
//
// Canopy face, bark-green trunk (no warm browns), leaf hands, root feet, one blue "$" coin fruit.
// Build once with couponTree(parent), then pose every frame with setCouponTree(m, state):
// every pose is a pure function of its inputs, so renders are deterministic.

export const INK = 'hsl(123 20% 7%)';
export const BLUE = 'hsl(212 80% 42%)';
export const BLUE_93 = 'hsl(212 80% 93%)';
export const BARK = 'hsl(123 22% 26%)';
export const LEAF = 'hsl(123 46% 45%)';
export const LEAF_D = 'hsl(123 46% 34%)';

// art box: the character stands on (160, 366) inside a 320 x 380 viewBox
export const ART = { w: 320, h: 380, footX: 160, footY: 366 };

const cl = (x) => Math.max(0, Math.min(1, x));
const lerp = (a, b, x) => a + (b - a) * x;
export function hash(n) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
const NS = 'http://www.w3.org/2000/svg';
function svgEl(tag, attrs = {}, parent) { const e = document.createElementNS(NS, tag); for (const [a, v] of Object.entries(attrs)) e.setAttribute(a, v); if (parent) parent.appendChild(e); return e; }

// mouth flap while talking between t0 and t1 (0 = closed, 1 = wide)
export const talk = (t, t0, t1, rate = 9) => (t < t0 || t > t1 ? 0 : Math.abs(Math.sin((t - t0) * rate * Math.PI)) * (0.55 + 0.45 * hash(Math.floor((t - t0) * rate))));
// a natural blink every few seconds (0 = open, 1 = shut)
export const blinkAt = (t, seed = 0) => { const period = 2.6 + hash(seed) * 1.4; const ph = (t + hash(seed + 9) * period) % period; return ph < 0.14 ? Math.sin((ph / 0.14) * Math.PI) : 0; };

export function couponTree(parent, cls = '') {
  const svg = svgEl('svg', { viewBox: `0 0 ${ART.w} ${ART.h}`, class: `mascot tree-guide ${cls}` }, parent);
  svg.style.position = 'absolute'; svg.style.left = '0'; svg.style.top = '0'; svg.style.overflow = 'visible';
  svg.style.width = ART.w + 'px'; svg.style.height = ART.h + 'px';
  const g = svgEl('g', {}, svg);
  const m = { svg, g };
  m.shadow = svgEl('ellipse', { cx: 160, cy: 366, rx: 92, ry: 12, fill: INK, opacity: 0.16 }, g);
  m.roots = svgEl('g', {}, g);
  m.rootL = svgEl('path', { fill: BARK, stroke: INK, 'stroke-width': 7, 'stroke-linejoin': 'round' }, m.roots);
  m.rootR = svgEl('path', { fill: BARK, stroke: INK, 'stroke-width': 7, 'stroke-linejoin': 'round' }, m.roots);
  m.trunk = svgEl('path', { d: 'M 132 360 C 136 300 134 262 128 226 L 192 226 C 186 262 184 300 188 360 Z', fill: BARK, stroke: INK, 'stroke-width': 8, 'stroke-linejoin': 'round' }, g);
  svgEl('path', { d: 'M 150 340 C 152 310 150 290 146 262 M 172 330 C 170 300 172 284 176 258', stroke: INK, 'stroke-width': 4, fill: 'none', 'stroke-linecap': 'round', opacity: 0.45 }, g);
  m.armL = svgEl('path', { stroke: BARK, 'stroke-width': 16, 'stroke-linecap': 'round', fill: 'none' }, g);
  m.armLo = svgEl('path', { stroke: INK, 'stroke-width': 26, 'stroke-linecap': 'round', fill: 'none' }, g);
  m.armR = svgEl('path', { stroke: BARK, 'stroke-width': 16, 'stroke-linecap': 'round', fill: 'none' }, g);
  m.armRo = svgEl('path', { stroke: INK, 'stroke-width': 26, 'stroke-linecap': 'round', fill: 'none' }, g);
  // outline strokes under fills
  g.insertBefore(m.armLo, m.armL); g.insertBefore(m.armRo, m.armR);
  const leafD = 'M 0 0 C 10 -16 30 -18 40 -4 C 30 10 10 12 0 0 Z';
  m.handL = svgEl('path', { d: leafD, fill: LEAF, stroke: INK, 'stroke-width': 5, 'stroke-linejoin': 'round' }, g);
  m.handR = svgEl('path', { d: leafD, fill: LEAF, stroke: INK, 'stroke-width': 5, 'stroke-linejoin': 'round' }, g);
  m.canopy = svgEl('g', {}, g);
  const blobs = [[160, 120, 92], [92, 138, 58], [228, 138, 58], [118, 74, 56], [204, 74, 56], [160, 46, 52], [110, 190, 50], [210, 190, 50], [160, 200, 56]];
  for (const pass of ['stroke', 'fill']) for (const [x, y, r] of blobs) svgEl('circle', { cx: x, cy: y, r, ...(pass === 'stroke' ? { fill: INK, stroke: INK, 'stroke-width': 16 } : { fill: LEAF }) }, m.canopy);
  // leaf shading strokes
  for (const [x, y, a] of [[88, 112, -20], [232, 120, 30], [130, 58, -40], [196, 52, 20], [100, 186, 10], [222, 192, -15]]) svgEl('path', { d: 'M -14 0 Q 0 -10 14 0', transform: `translate(${x} ${y}) rotate(${a})`, stroke: LEAF_D, 'stroke-width': 6, fill: 'none', 'stroke-linecap': 'round' }, m.canopy);
  // coin fruit (site illustration style: blue outline, '$')
  m.fruit = svgEl('g', { transform: 'translate(236 196)' }, m.canopy);
  svgEl('line', { x1: 0, y1: -22, x2: 0, y2: -6, stroke: INK, 'stroke-width': 4 }, m.fruit);
  svgEl('circle', { cx: 0, cy: 12, r: 18, fill: BLUE_93, stroke: BLUE, 'stroke-width': 5 }, m.fruit);
  const ft = svgEl('text', { x: 0, y: 21, 'text-anchor': 'middle', 'font-family': 'Instrument Sans, sans-serif', 'font-weight': 700, 'font-size': 24, fill: BLUE }, m.fruit); ft.textContent = '$';
  m.face = svgEl('g', {}, m.canopy);
  m.eyes = [0, 1].map((i) => {
    const eg = svgEl('g', {}, m.face);
    const cx = i ? 186 : 134, cy = 128;
    const white = svgEl('ellipse', { cx, cy, rx: 19, ry: 23, fill: '#fff', stroke: INK, 'stroke-width': 6 }, eg);
    const pupil = svgEl('circle', { cx, cy, r: 9.5, fill: INK }, eg);
    const glint = svgEl('circle', { cx: cx + 3, cy: cy - 3, r: 3, fill: '#fff' }, eg);
    const lid = svgEl('path', { fill: LEAF, stroke: INK, 'stroke-width': 6, 'stroke-linejoin': 'round' }, eg);
    const brow = svgEl('path', { stroke: INK, 'stroke-width': 7, 'stroke-linecap': 'round', fill: 'none' }, eg);
    return { eg, cx, cy, white, pupil, glint, lid, brow, rx: 19, ry: 23 };
  });
  m.mouth = svgEl('path', { stroke: INK, 'stroke-width': 7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', fill: INK }, m.face);
  for (const el of [m.armLo, m.armL, m.armRo, m.armR, m.handL, m.handR]) g.appendChild(el);
  return m;
}

// Pose state (all optional except x, y):
//   x, y      stage position of the feet (the art's bottom centre)
//   scale     1 = 320 x 380 px; flip mirrors it; rot tilts it (degrees); squash -1..1 for landings and jumps
//   sway      canopy sway (degrees); gaze [-1..1, -1..1]; blink 0..1; brows 0..1 (raised)
//   mouth     0..1 open (use talk()); smile 0..1
//   armL/armR arm angle in degrees: 40 resting, 120 pointing out, 150 raised (wave = 150 +/- 18)
//   legPhase  walk cycle; air  height off the ground (shrinks the shadow)
export function setCouponTree(m, s) {
  const sq = s.squash || 0;
  const sx = (s.scale || 1) * (1 + sq * 0.14) * (s.flip ? -1 : 1), sy = (s.scale || 1) * (1 - sq * 0.14);
  m.svg.style.transformOrigin = '50% 100%';
  m.svg.style.transform = `translate(${s.x}px, ${s.y}px) translate(-50%, -100%) rotate(${s.rot || 0}deg) scale(${sx.toFixed(4)}, ${sy.toFixed(4)})`;
  m.canopy.setAttribute('transform', `rotate(${(s.sway || 0).toFixed(2)} 160 226)`);
  const [gx, gy] = s.gaze || [0, 0];
  const blink = s.blink || 0;
  m.eyes.forEach((e, i) => {
    e.pupil.setAttribute('cx', e.cx + gx * 7); e.pupil.setAttribute('cy', e.cy + gy * 8);
    e.glint.setAttribute('cx', e.cx + gx * 7 + 3); e.glint.setAttribute('cy', e.cy + gy * 8 - 3);
    const top = e.cy - e.ry, lidY = lerp(top, e.cy + e.ry, blink);
    e.lid.setAttribute('d', blink > 0.02 ? `M ${e.cx - e.rx} ${e.cy} A ${e.rx} ${e.ry} 0 0 1 ${e.cx + e.rx} ${e.cy} L ${e.cx + e.rx} ${Math.max(e.cy, lidY)} Q ${e.cx} ${lidY + 6} ${e.cx - e.rx} ${Math.max(e.cy, lidY)} Z` : 'M0 0');
    const b = s.brows || 0, side = i ? 1 : -1;
    e.brow.setAttribute('d', `M ${e.cx - 16} ${e.cy - 34 - b * 6 + side * b * 3} Q ${e.cx} ${e.cy - 42 - b * 8} ${e.cx + 16} ${e.cy - 34 - b * 6 - side * b * 3}`);
  });
  const mo = s.mouth || 0, sm = s.smile === undefined ? 1 : s.smile;
  const mx0 = 140, mx1 = 180, my = 166;
  if (mo < 0.05) { m.mouth.setAttribute('d', `M ${mx0} ${my} Q 160 ${my + 16 * sm} ${mx1} ${my}`); m.mouth.setAttribute('fill', 'none'); }
  else { const open = 7 + 24 * mo; m.mouth.setAttribute('d', `M ${mx0 - 2} ${my - 2} Q 160 ${my + open * 1.25 + 6 * sm} ${mx1 + 2} ${my - 2} Q 160 ${my + 4 * sm} ${mx0 - 2} ${my - 2} Z`); m.mouth.setAttribute('fill', INK); }
  const arm = (side, deg, path, out, hand) => {
    const a = (deg * Math.PI) / 180, L = 92, sx0 = side < 0 ? 136 : 184, sy0 = 248;
    const ex = sx0 + side * Math.sin(a) * L, ey = sy0 + Math.cos(a) * L;
    const d = `M ${sx0} ${sy0} Q ${(sx0 + ex) / 2 + side * 10} ${(sy0 + ey) / 2 + 8} ${ex} ${ey}`;
    path.setAttribute('d', d); out.setAttribute('d', d);
    const ang = Math.atan2(ey - sy0, ex - sx0) * 180 / Math.PI;
    hand.setAttribute('transform', `translate(${ex} ${ey}) rotate(${ang})`);
  };
  arm(-1, s.armL ?? 40, m.armL, m.armLo, m.handL);
  arm(1, s.armR ?? 40, m.armR, m.armRo, m.handR);
  const lp = s.legPhase || 0;
  const lift = (ph) => Math.max(0, Math.sin(ph)) * 16;
  m.rootL.setAttribute('d', `M 134 ${340 - lift(lp)} Q 110 ${352 - lift(lp)} 96 ${362 - lift(lp)} L 140 ${364 - lift(lp)} Z`);
  m.rootR.setAttribute('d', `M 186 ${340 - lift(-lp)} Q 210 ${352 - lift(-lp)} 224 ${362 - lift(-lp)} L 180 ${364 - lift(-lp)} Z`);
  m.shadow.setAttribute('rx', 92 * (1 - 0.25 * cl((s.air || 0) / 120)));
}

// the signature pose: friendly wave with the right hand, kept beside the canopy (never over the face)
export const WAVE = (t = 0) => ({ armL: 40, armR: 138 + Math.sin(t * 9) * 12, sway: Math.sin(t * 2.1) * 2.5, gaze: [0, 0.1], smile: 1 });
// the master art (coupon-tree.svg / .png): the wave at rest, hand up by the coin
export const MASTER = { armL: 40, armR: 132, sway: 0, gaze: [0, 0.1], smile: 1 };
