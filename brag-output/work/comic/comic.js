// Comic toolkit for the CouponDonation donor-onboarding films.
// Brand-safe comic language: ink outlines, halftone in logo green/blue, speech bubbles,
// SFX lettering with hard offset ink shadows (no glow), starbursts, speed lines,
// and "Coupon", a coupon-ticket mascot. Every setter is a pure function of its inputs.

export const INK = 'hsl(123 20% 7%)';
export const PAPER = 'hsl(120 8% 98.5%)';
export const GREEN = 'hsl(123 46% 34%)';
export const GREEN_45 = 'hsl(123 46% 45%)';
export const GREEN_85 = 'hsl(123 46% 85%)';
export const GREEN_93 = 'hsl(123 46% 93%)';
export const FOREST = 'hsl(123 46% 20%)';
export const BLUE = 'hsl(212 80% 42%)';
export const BLUE_LIGHT = 'hsl(212 80% 58%)';
export const BLUE_93 = 'hsl(212 80% 93%)';

export const cl = (x) => Math.max(0, Math.min(1, x));
export const lerp = (a, b, x) => a + (b - a) * x;
export const E = {
  lin: (x) => x,
  outExpo: (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x)),
  outQuart: (x) => 1 - Math.pow(1 - x, 4),
  outCubic: (x) => 1 - Math.pow(1 - x, 3),
  inCubic: (x) => x * x * x,
  inOutCubic: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  inOutQuart: (x) => (x < 0.5 ? 8 * x ** 4 : 1 - Math.pow(-2 * x + 2, 4) / 2),
  inOutSine: (x) => -(Math.cos(Math.PI * x) - 1) / 2,
  outBack: (x) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); },
  outBackBig: (x) => { const c1 = 3.0, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); },
  outElastic: (x) => (x <= 0 ? 0 : x >= 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1),
};
export const k = (t, a, b, e = E.outExpo) => e(cl((t - a) / (b - a)));
// 0 -> 1 -> 0 envelope: in over [a,b], hold, out over [c,d]
export const win = (t, a, b, c, d, ein = E.outCubic, eout = E.inCubic) => Math.min(k(t, a, b, ein), 1 - k(t, c, d, eout));
export function hash(n) { let x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
export const vis = (el, on, d = 'block') => { const v = on ? d : 'none'; if (el.style.display !== v) el.style.display = v; };
const NS = 'http://www.w3.org/2000/svg';
export function svgEl(tag, attrs = {}, parent) { const e = document.createElementNS(NS, tag); for (const [a, v] of Object.entries(attrs)) e.setAttribute(a, v); if (parent) parent.appendChild(e); return e; }
export function div(cls, parent, html = '') { const d = document.createElement('div'); if (cls) d.className = cls; if (html) d.innerHTML = html; if (parent) parent.appendChild(d); return d; }
// "comic boil": tiny per-2-frame jitter so ink feels hand-drawn
export const boil = (t, seed, amp = 1) => { const f = Math.floor(t * 12); return (hash(f * 13.7 + seed) - 0.5) * 2 * amp; };

// ------------------------------------------------------------------ speech bubble
// Bubble with a tail pointing at (tx, ty) relative to the bubble box. Stroke-then-fill so the seam vanishes.
export function bubble(parent, { text, w, h, tail = { x: 0.2, y: 1.35 }, cls = '', fs = 40, kind = 'speech' }) {
  const root = div(`bubble ${cls}`, parent);
  root.style.width = w + 'px'; root.style.height = h + 'px';
  const pad = 40;
  const svg = svgEl('svg', { width: w + pad * 2, height: h + pad * 2, viewBox: `${-pad} ${-pad} ${w + pad * 2} ${h + pad * 2}`, class: 'bubble-svg' }, root);
  const r = Math.min(h / 2, 46);
  const tx = tail.x * w, ty = tail.y * h;
  let tailD;
  if (tail.x < 0 || tail.x > 1) {
    // side tail: base on the left/right edge
    const by = Math.max(r, Math.min(h - r, ty)), baseX = tail.x > 1 ? w - 2 : 2;
    tailD = `M ${baseX} ${by - 24} L ${tx} ${ty} L ${baseX} ${by + 24} Z`;
  } else {
    const bx = Math.max(r, Math.min(w - r, tx));
    const baseY = ty > h / 2 ? h - 2 : 2;
    tailD = `M ${bx - 26} ${baseY} L ${tx} ${ty} L ${bx + 26} ${baseY} Z`;
  }
  const box = kind === 'thought' ? null : { x: 0, y: 0, width: w, height: h, rx: r };
  for (const pass of ['stroke', 'fill']) {
    const attrs = pass === 'stroke' ? { fill: INK, stroke: INK, 'stroke-width': 14, 'stroke-linejoin': 'round' } : { fill: '#fff' };
    svgEl('rect', { ...box, ...attrs }, svg);
    svgEl('path', { d: tailD, ...attrs }, svg);
  }
  const tx_ = div('bubble-text', root, `<span>${text}</span>`);
  tx_.style.fontSize = fs + 'px';
  root._tail = { x: tx, y: ty };
  return root;
}
export function setBubble(el, t, t0, t1 = 1e9, { dx = 0, dy = 0 } = {}) {
  const pin = k(t, t0, t0 + 0.42, E.outBack);
  const pout = k(t, t1, t1 + 0.22, E.inCubic);
  vis(el, t >= t0 && t < t1 + 0.22);
  const s = pin * (1 - pout);
  el.style.transformOrigin = `${el._tail.x}px ${el._tail.y}px`;
  el.style.transform = `translate(${dx}px, ${dy}px) scale(${s.toFixed(4)})`;
}

// ------------------------------------------------------------------ SFX lettering
export function sfx(parent, text, { size = 140, fill = BLUE, cls = '', rot = -6 } = {}) {
  const root = div(`sfx ${cls}`, parent);
  root.style.fontSize = size + 'px';
  root.innerHTML = `<span class="sh">${text}</span><span class="st">${text}</span><span class="fi" style="color:${fill}">${text}</span>`;
  root._rot = rot;
  return root;
}
export function setSfx(el, t, t0, dur = 0.9, { x = 0, y = 0, scale = 1 } = {}) {
  const on = t >= t0 && t < t0 + dur;
  vis(el, on);
  if (!on) return;
  const p = k(t, t0, t0 + 0.28, E.outBackBig);
  const o = k(t, t0 + dur - 0.18, t0 + dur, E.inCubic);
  const wob = Math.sin((t - t0) * 22) * 3 * (1 - cl((t - t0) / 0.5));
  el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) rotate(${el._rot + wob}deg) skewX(-8deg) scale(${(scale * p * (1 + o * 0.25)).toFixed(4)})`;
  el.style.opacity = 1 - o;
}

// ------------------------------------------------------------------ starburst + speed lines
export function burst(parent, { r = 200, spikes = 14, fill = BLUE_93, stroke = INK, sw = 8, seed = 1, cls = '' } = {}) {
  const pad = sw + 4, S = (r + pad) * 2;
  const svg = svgEl('svg', { width: S, height: S, viewBox: `${-r - pad} ${-r - pad} ${S} ${S}`, class: `burst ${cls}` }, parent);
  const pts = [];
  for (let i = 0; i < spikes * 2; i++) {
    const a = (i / (spikes * 2)) * Math.PI * 2;
    const rr = i % 2 === 0 ? r * (0.86 + 0.14 * hash(seed * 31 + i)) : r * (0.56 + 0.1 * hash(seed * 17 + i));
    pts.push(`${(Math.cos(a) * rr).toFixed(1)},${(Math.sin(a) * rr).toFixed(1)}`);
  }
  svgEl('polygon', { points: pts.join(' '), fill, stroke, 'stroke-width': sw, 'stroke-linejoin': 'round' }, svg);
  return svg;
}
export function speedLines(parent, { w, h, n = 64, color = INK, cls = '' } = {}) {
  const svg = svgEl('svg', { width: w, height: h, viewBox: `0 0 ${w} ${h}`, class: `speed ${cls}` }, parent);
  svg._g = svgEl('g', {}, svg); svg._w = w; svg._h = h; svg._n = n; svg._color = color;
  return svg;
}
export function setSpeedLines(svg, t, { cx, cy, inner = 260, opacity = 1, seed = 1 }) {
  const f = Math.floor(t * 12);
  const R = Math.hypot(svg._w, svg._h);
  let d = '';
  for (let i = 0; i < svg._n; i++) {
    const a = (i / svg._n) * Math.PI * 2 + (hash(i * 7 + seed) - 0.5) * 0.08;
    const w = 0.006 + 0.016 * hash(i * 3 + f * 11 + seed);
    const r0 = inner * (0.85 + 0.5 * hash(i * 5 + f * 3 + seed));
    const x0 = cx + Math.cos(a) * r0, y0 = cy + Math.sin(a) * r0;
    const x1 = cx + Math.cos(a - w) * R, y1 = cy + Math.sin(a - w) * R;
    const x2 = cx + Math.cos(a + w) * R, y2 = cy + Math.sin(a + w) * R;
    d += `M${x0.toFixed(1)} ${y0.toFixed(1)}L${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}Z`;
  }
  if (!svg._p) svg._p = svgEl('path', { fill: svg._color }, svg._g);
  svg._p.setAttribute('d', d);
  svg.style.opacity = opacity;
}

// ------------------------------------------------------------------ Coupon, the mascot
// A coupon ticket with a face. Pure function of a state object.
export function mascot(parent, cls = '') {
  const svg = svgEl('svg', { viewBox: '0 0 300 330', class: `mascot ${cls}` }, parent);
  const g = svgEl('g', {}, svg);
  const m = { svg, g };
  m.shadow = svgEl('ellipse', { cx: 150, cy: 312, rx: 80, ry: 11, fill: INK, opacity: 0.16 }, g);
  m.legs = svgEl('g', {}, g);
  m.legL = svgEl('path', { stroke: INK, 'stroke-width': 9, 'stroke-linecap': 'round', fill: 'none' }, m.legs);
  m.legR = svgEl('path', { stroke: INK, 'stroke-width': 9, 'stroke-linecap': 'round', fill: 'none' }, m.legs);
  m.footL = svgEl('ellipse', { rx: 22, ry: 11, fill: INK, stroke: INK, 'stroke-width': 6 }, m.legs);
  m.footR = svgEl('ellipse', { rx: 22, ry: 11, fill: INK, stroke: INK, 'stroke-width': 6 }, m.legs);
  m.armL = svgEl('path', { stroke: INK, 'stroke-width': 9, 'stroke-linecap': 'round', fill: 'none' }, g);
  m.armR = svgEl('path', { stroke: INK, 'stroke-width': 9, 'stroke-linecap': 'round', fill: 'none' }, g);
  m.body = svgEl('g', {}, g);
  const ticket = 'M 84 96 H 216 Q 244 96 244 124 V 140 A 18 18 0 0 0 244 176 V 192 Q 244 220 216 220 H 84 Q 56 220 56 192 V 176 A 18 18 0 0 0 56 140 V 124 Q 56 96 84 96 Z';
  const clipId = 'tk' + Math.floor(Math.random() * 1e9);
  const defs = svgEl('defs', {}, svg);
  const cp = svgEl('clipPath', { id: clipId }, defs); svgEl('path', { d: ticket }, cp);
  svgEl('path', { d: ticket, fill: '#fff' }, m.body);
  const stub = svgEl('g', { 'clip-path': `url(#${clipId})` }, m.body);
  svgEl('rect', { x: 200, y: 90, width: 60, height: 140, fill: GREEN_85 }, stub);
  svgEl('line', { x1: 200, y1: 104, x2: 200, y2: 214, stroke: GREEN, 'stroke-width': 4.5, 'stroke-dasharray': '9 8' }, m.body);
  const dollar = svgEl('text', { x: 221, y: 171, 'text-anchor': 'middle', 'font-family': 'Instrument Serif', 'font-size': 40, fill: GREEN }, m.body);
  dollar.textContent = '$';
  svgEl('path', { d: ticket, fill: 'none', stroke: INK, 'stroke-width': 8, 'stroke-linejoin': 'round' }, m.body);
  m.face = svgEl('g', {}, m.body);
  m.cheekL = svgEl('ellipse', { cx: 94, cy: 176, rx: 13, ry: 8, fill: GREEN_45, opacity: 0.35 }, m.face);
  m.cheekR = svgEl('ellipse', { cx: 172, cy: 176, rx: 13, ry: 8, fill: GREEN_45, opacity: 0.35 }, m.face);
  m.eyes = [0, 1].map((i) => {
    const eg = svgEl('g', {}, m.face);
    const cx = i ? 156 : 110, cy = 148;
    const white = svgEl('ellipse', { cx, cy, rx: 17, ry: 21, fill: '#fff', stroke: INK, 'stroke-width': 6 }, eg);
    const pupil = svgEl('circle', { cx, cy, r: 8.5, fill: INK }, eg);
    const glint = svgEl('circle', { cx: cx + 3, cy: cy - 3, r: 2.6, fill: '#fff' }, eg);
    const lid = svgEl('path', { fill: '#fff', stroke: INK, 'stroke-width': 6, 'stroke-linejoin': 'round' }, eg);
    const brow = svgEl('path', { stroke: INK, 'stroke-width': 6.5, 'stroke-linecap': 'round', fill: 'none' }, eg);
    return { eg, cx, cy, white, pupil, glint, lid, brow };
  });
  m.mouth = svgEl('path', { stroke: INK, 'stroke-width': 6.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', fill: INK }, m.face);
  m.handL = svgEl('circle', { r: 14, fill: '#fff', stroke: INK, 'stroke-width': 6 }, g);
  m.handR = svgEl('circle', { r: 14, fill: '#fff', stroke: INK, 'stroke-width': 6 }, g);
  return m;
}
// state: {x,y,scale,rot,squash, gaze:[dx,dy], blink:0..1, mouth:0..1, smile:-1..1, brows:-1..1,
//         armL:deg, armR:deg, legPhase, flip}
export function setMascot(m, s) {
  const sq = s.squash || 0; // + = squashed (wide, short)
  const sx = (s.scale || 1) * (1 + sq * 0.18) * (s.flip ? -1 : 1), sy = (s.scale || 1) * (1 - sq * 0.18);
  m.svg.style.transform = `translate(${s.x}px, ${s.y}px) translate(-50%, -100%) rotate(${s.rot || 0}deg) scale(${sx.toFixed(4)}, ${sy.toFixed(4)})`;
  m.svg.style.transformOrigin = '50% 100%';
  const [gx, gy] = s.gaze || [0, 0];
  const blink = s.blink || 0;
  m.eyes.forEach((e, i) => {
    e.pupil.setAttribute('cx', e.cx + gx * 6); e.pupil.setAttribute('cy', e.cy + gy * 7);
    e.glint.setAttribute('cx', e.cx + gx * 6 + 3); e.glint.setAttribute('cy', e.cy + gy * 7 - 3);
    const top = e.cy - 21, lidY = lerp(top, e.cy + 21, blink);
    e.lid.setAttribute('d', blink > 0.02 ? `M ${e.cx - 17} ${e.cy} A 17 21 0 0 1 ${e.cx + 17} ${e.cy} L ${e.cx + 17} ${Math.max(e.cy, lidY)} Q ${e.cx} ${lidY + 6} ${e.cx - 17} ${Math.max(e.cy, lidY)} Z` : 'M0 0');
    const b = s.brows || 0, side = i ? 1 : -1;
    e.brow.setAttribute('d', `M ${e.cx - 15} ${e.cy - 31 - b * 6 + side * b * 3} Q ${e.cx} ${e.cy - 39 - b * 8} ${e.cx + 15} ${e.cy - 31 - b * 6 - side * b * 3}`);
  });
  const mo = s.mouth || 0, sm = s.smile === undefined ? 1 : s.smile;
  const mx0 = 116, mx1 = 150, my = 182;
  if (mo < 0.05) {
    m.mouth.setAttribute('d', `M ${mx0} ${my} Q ${(mx0 + mx1) / 2} ${my + 14 * sm} ${mx1} ${my}`);
    m.mouth.setAttribute('fill', 'none');
  } else {
    const open = 6 + 22 * mo;
    m.mouth.setAttribute('d', `M ${mx0 - 2} ${my - 2} Q ${(mx0 + mx1) / 2} ${my + open * 1.25 + 6 * sm} ${mx1 + 2} ${my - 2} Q ${(mx0 + mx1) / 2} ${my + 4 * sm} ${mx0 - 2} ${my - 2} Z`);
    m.mouth.setAttribute('fill', INK);
  }
  // arms: shoulder at body sides, angle in degrees (0 = straight down, +90 = out, 160 = up)
  const arm = (sxp, side, deg, path, hand) => {
    const a = (deg * Math.PI) / 180, L = 62;
    const ex = sxp + side * Math.sin(a) * L, ey = 166 + Math.cos(a) * L;
    const mxp = (sxp + ex) / 2 + side * 8, myp = (166 + ey) / 2 + 6;
    path.setAttribute('d', `M ${sxp} 166 Q ${mxp} ${myp} ${ex} ${ey}`);
    hand.setAttribute('cx', ex); hand.setAttribute('cy', ey);
  };
  arm(58, -1, s.armL ?? 25, m.armL, m.handL);
  arm(242, 1, s.armR ?? 25, m.armR, m.handR);
  const lp = s.legPhase || 0, lift = s.legLift ?? 0;
  const ly = (ph) => 222 + 0;
  const legY = 296;
  const footL = { x: 116 + Math.sin(lp) * 10, y: legY - Math.max(0, Math.sin(lp)) * 18 - lift };
  const footR = { x: 184 - Math.sin(lp) * 10, y: legY - Math.max(0, -Math.sin(lp)) * 18 - lift };
  m.legL.setAttribute('d', `M 120 ${ly()} L ${footL.x} ${footL.y}`);
  m.legR.setAttribute('d', `M 180 ${ly()} L ${footR.x} ${footR.y}`);
  m.footL.setAttribute('cx', footL.x - 8); m.footL.setAttribute('cy', footL.y + 4);
  m.footR.setAttribute('cx', footR.x + 8); m.footR.setAttribute('cy', footR.y + 4);
  m.shadow.setAttribute('rx', 80 * (1 - 0.25 * cl((s.air || 0) / 120)));
  m.shadow.setAttribute('cy', 312 + (s.air || 0));
}
// talking mouth driven by syllable timing (deterministic)
export const talk = (t, t0, t1, rate = 9) => (t < t0 || t > t1 ? 0 : Math.abs(Math.sin((t - t0) * rate * Math.PI)) * (0.55 + 0.45 * hash(Math.floor((t - t0) * rate))));
export const blinkAt = (t, seed = 0) => { const period = 2.6 + hash(seed) * 1.4; const ph = (t + hash(seed + 9) * period) % period; return ph < 0.14 ? Math.sin((ph / 0.14) * Math.PI) : 0; };

// ------------------------------------------------------------------ tap prompt (game-tutorial style)
export function tapPrompt(parent) {
  const root = div('tap-prompt', parent);
  root.innerHTML = `<div class="tap-ring r1"></div><div class="tap-ring r2"></div>
  <svg class="hand" viewBox="0 0 64 80"><path d="M24 6c4 0 7 3 7 7v23l3-1c3-1 7 1 8 4l1 2 2-1c3-1 7 1 8 4l1 3c3-1 6 1 7 4v14c0 9-7 17-17 17H36c-6 0-11-3-14-8L9 52c-2-3-1-7 2-9 3-2 7-1 9 2l-3-4V13c0-4 3-7 7-7z" fill="#fff" stroke="${INK}" stroke-width="4.5" stroke-linejoin="round"/></svg>`;
  return root;
}
// Show the tap hint, then the "press" at tPress.
export function setTap(el, t, t0, tPress, t1, { x, y, scale = 1 }) {
  const on = t >= t0 && t < t1;
  vis(el, on);
  if (!on) return;
  const appear = k(t, t0, t0 + 0.3, E.outBack);
  const fade = 1 - k(t, t1 - 0.2, t1, E.inCubic);
  const pressK = Math.max(0, 1 - Math.abs(t - tPress) / 0.12);
  const bob = t < tPress ? Math.sin((t - t0) * 9) * 10 : 0;
  el.style.transform = `translate(${x}px, ${y}px) scale(${scale * appear})`;
  el.style.opacity = fade;
  const hand = el.querySelector('.hand');
  hand.style.transform = `translate(${-6 + bob * 0.3}px, ${bob - pressK * 10}px) scale(${1 - pressK * 0.12})`;
  [...el.querySelectorAll('.tap-ring')].forEach((r, i) => {
    const ph = ((t - t0) * 1.6 + i * 0.5) % 1;
    const after = t > tPress ? k(t, tPress, tPress + 0.4, E.outCubic) : 0;
    const s = t > tPress ? lerp(0.4, 2.2, after) : lerp(0.35, 1.25, ph);
    r.style.transform = `translate(-50%, -50%) scale(${s})`;
    r.style.opacity = t > tPress ? (1 - after) * (i ? 0 : 0.9) : (1 - ph) * 0.8;
  });
}

// ------------------------------------------------------------------ HUD goal meter
export function hud(parent, steps) {
  const root = div('hud', parent);
  root.innerHTML = `<div class="hud-label"><span class="hud-title">Your first donation</span><span class="hud-pct">0%</span></div>
  <div class="hud-bar"><div class="hud-fill"></div>${steps.map((s, i) => `<div class="hud-node" style="left:${((i + 1) / steps.length) * 100}%"></div><span class="hud-lbl" style="left:${((i + 1) / steps.length) * 100}%">${s}</span>`).join('')}</div>`;
  root._steps = steps;
  return root;
}
export function setHud(el, t, done, { fillFrom = 0, fillTo = 0, t0 = 0, t1 = 0 } = {}) {
  const p = lerp(fillFrom, fillTo, k(t, t0, t1, E.outCubic));
  el.querySelector('.hud-fill').style.width = (p * 100).toFixed(2) + '%';
  el.querySelector('.hud-pct').textContent = Math.round(p * 100) + '%';
  const lbls = [...el.querySelectorAll('.hud-lbl')];
  [...el.querySelectorAll('.hud-node')].forEach((n, i) => { const on = p >= (i + 1) / el._steps.length - 0.001; n.classList.toggle('on', on); lbls[i].classList.toggle('on', on); });
}

// ------------------------------------------------------------------ Coupon, the AI tree (the site's own guide persona)
// Lives in the shared video kit so every film draws the same character.
export { couponTree as treeGuide, setCouponTree as setTreeGuide } from '../../../video-kit/mascot/coupon-tree.js';
