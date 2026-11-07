/* Illustrated characters and props, drawn in SVG by code. No photos, no real people.
   Clothing stays in the brand's cool palette (greens, blues, slate); skin and hair use natural tones. */
(function () {
  'use strict';
  const CD = window.CD;
  const { el } = CD;
  const PI = Math.PI;

  const shade = (CD.shade = (hex, k) => {
    const n = parseInt(hex.slice(1), 16);
    const r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const f = (c) => Math.round(k < 0 ? c * (1 + k) : c + (255 - c) * k);
    return '#' + [f(r), f(g), f(b)].map((v) => v.toString(16).padStart(2, '0')).join('');
  });

  CD.SKIN = { deep: '#5b3726', brown: '#7e4e33', tan: '#a6704a', medium: '#c48a60', light: '#e2b593', fair: '#f0cfb2' };
  CD.HAIR = { black: '#1b1512', dark: '#2c201a', brown: '#563a29', auburn: '#4a3024', gray: '#9da3a8', silver: '#c3c8cc' };
  CD.CLOTH = {
    green: '#2e7d32', forest: '#1f5130', moss: '#4f7f52', mint: '#a9d4ad', blue: '#1565c0', sky: '#7fb0e3', navy: '#1e3350',
    slate: '#4a5b6c', steel: '#7b8b99', fog: '#d6dde3', white: '#f3f5f4', ink: '#1d2723', denim: '#33507a', teal: '#1d6b6b',
  };

  /** Facial expressions; any pose can override single values. */
  CD.EXPR = {
    neutral: { brow: 0, browY: 0, smile: 0.12, open: 0, squint: 0, eye: 1 },
    calm: { brow: 3, browY: 0, smile: 0.25, open: 0, squint: 0.1, eye: 0.95 },
    worried: { brow: 13, browY: 2, smile: -0.3, open: 0, squint: 0, eye: 1 },
    sad: { brow: 17, browY: 1, smile: -0.55, open: 0, squint: 0, eye: 0.72 },
    hurt: { brow: 21, browY: 3, smile: -0.42, open: 0.12, squint: 0, eye: 0.55 },
    shock: { brow: 9, browY: 5, smile: -0.15, open: 0.45, squint: 0, eye: 1.18 },
    focused: { brow: -5, browY: -1, smile: 0.05, open: 0, squint: 0.05, eye: 0.88 },
    hopeful: { brow: 9, browY: 3, smile: 0.35, open: 0, squint: 0.15, eye: 1.02 },
    brave: { brow: 11, browY: 2, smile: 0.22, open: 0, squint: 0.05, eye: 0.95 },
    relief: { brow: 7, browY: 1, smile: 0.6, open: 0.05, squint: 0.85, eye: 1 },
    smile: { brow: 0, browY: 1, smile: 0.75, open: 0.05, squint: 0.35, eye: 1 },
    happy: { brow: -2, browY: 3, smile: 0.95, open: 0.45, squint: 0.85, eye: 1 },
    closed: { brow: 16, browY: 2, smile: -0.25, open: 0, squint: 0, eye: 0.05 },
  };
  const BASE = { lean: 0, bob: 0, tilt: 0, nod: 0, hx: 0, turn: 0, gx: 0, gy: 0, liftL: 0, liftR: 0, lrot: 0, rrot: 0, tear: 0, shrug: 0 };

  function ik(S, T, L1, L2, side) {
    let dx = T[0] - S[0], dy = T[1] - S[1];
    let d = Math.hypot(dx, dy) || 0.001;
    const maxd = L1 + L2 - 0.6, mind = Math.abs(L1 - L2) + 2;
    if (d > maxd) { dx *= maxd / d; dy *= maxd / d; d = maxd; }
    if (d < mind) { dx *= mind / d; dy *= mind / d; d = mind; }
    const base = Math.atan2(dy, dx);
    const a = Math.acos(CD.clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
    // two possible elbows: prefer the lower one, nudged outward (side 1 = viewer's left arm)
    let best = null, bestScore = -Infinity;
    for (const ang of [base + a, base - a]) {
      const E = [S[0] + L1 * Math.cos(ang), S[1] + L1 * Math.sin(ang)];
      const out = side === 1 ? S[0] - E[0] : E[0] - S[0];
      const score = E[1] + 0.5 * out;
      if (score > bestScore) { bestScore = score; best = E; }
    }
    return { E: best, H: [S[0] + dx, S[1] + dy] };
  }

  /** Hair shapes around a head centred at 0,0 with radii rx, ry. Returns {back, behind, front} path specs. */
  function hairSpec(style, rx, ry) {
    const cap = (vol, hl, part = 0.15, low = 0.08) =>
      `M ${-rx - 1.6} ${ry * low} A ${rx + 1.6} ${ry + vol} 0 0 1 ${rx + 1.6} ${ry * low} Q ${rx * 0.95} ${-ry * 0.4} ${rx * part} ${hl} Q ${-rx * 0.72} ${hl + 2} ${-rx - 1.6} ${ry * low} Z`;
    const back = [], behind = [], front = [];
    switch (style) {
      case 'puff': { // natural hair pulled up into a puff
        const cy = -ry - 15;
        behind.push({ circle: [0, cy, 21] });
        for (let i = 0; i < 11; i++) { const a = (i / 11) * PI * 2; behind.push({ circle: [Math.cos(a) * 17, cy + Math.sin(a) * 15, 9.5] }); }
        front.push({ d: cap(5, -ry * 0.6, 0.05) });
        front.push({ band: [-13, -ry - 2, 26, 6] });
        break;
      }
      case 'short':
        front.push({ d: cap(4.5, -ry * 0.66, 0.35, 0.02) });
        front.push({ d: `M ${-rx * 0.55} ${-ry * 0.88} Q ${rx * 0.1} ${-ry * 1.22} ${rx * 0.75} ${-ry * 0.8} Q ${rx * 0.2} ${-ry * 0.98} ${-rx * 0.55} ${-ry * 0.88} Z` });
        break;
      case 'curly': // short curls (kid)
        front.push({ d: cap(5, -ry * 0.55, 0.1, 0.1) });
        for (let i = 0; i < 9; i++) { const a = PI + (i / 8) * PI; front.push({ circle: [Math.cos(a) * (rx + 1), Math.sin(a) * (ry + 2) - 1, 8.2] }); }
        break;
      case 'long':
        back.push({ d: `M ${-rx - 5} ${-ry * 0.3} Q ${-rx - 13} ${ry * 1.1} ${-rx - 3} ${ry * 2.0} L ${rx + 3} ${ry * 2.0} Q ${rx + 13} ${ry * 1.1} ${rx + 5} ${-ry * 0.3} Z` });
        front.push({ d: cap(5, -ry * 0.62, -0.25, 0.1) });
        front.push({ d: `M ${-rx - 1.6} ${ry * 0.05} Q ${-rx - 4} ${ry * 0.75} ${-rx + 1} ${ry * 1.25} L ${-rx + 9} ${ry * 1.15} Q ${-rx + 3} ${ry * 0.5} ${-rx + 7} ${-ry * 0.35} Z` });
        front.push({ d: `M ${rx + 1.6} ${ry * 0.05} Q ${rx + 4} ${ry * 0.75} ${rx - 1} ${ry * 1.25} L ${rx - 9} ${ry * 1.15} Q ${rx - 3} ${ry * 0.5} ${rx - 7} ${-ry * 0.35} Z` });
        break;
      case 'bob':
        behind.push({ d: `M ${-rx - 7} ${-ry * 0.2} L ${-rx - 8} ${ry * 0.78} Q ${-rx} ${ry * 0.86} ${-rx + 6} ${ry * 0.8} L ${rx - 6} ${ry * 0.8} Q ${rx} ${ry * 0.86} ${rx + 8} ${ry * 0.78} L ${rx + 7} ${-ry * 0.2} Z` });
        front.push({ d: `M ${-rx - 1.6} ${ry * 0.1} A ${rx + 1.6} ${ry + 6} 0 0 1 ${rx + 1.6} ${ry * 0.1} L ${rx + 1} ${-ry * 0.12} Q ${rx * 0.4} ${-ry * 0.42} ${-rx * 0.2} ${-ry * 0.36} Q ${-rx * 0.75} ${-ry * 0.3} ${-rx - 1} ${-ry * 0.1} Z` });
        front.push({ d: `M ${-rx - 1.6} 0 L ${-rx - 4} ${ry * 0.74} L ${-rx + 7} ${ry * 0.72} L ${-rx + 5} ${-ry * 0.1} Z` });
        front.push({ d: `M ${rx + 1.6} 0 L ${rx + 4} ${ry * 0.74} L ${rx - 7} ${ry * 0.72} L ${rx - 5} ${-ry * 0.1} Z` });
        break;
      case 'ponytail':
        behind.push({ ellipse: [rx + 3, -ry * 0.05, 11, 26, 16] });
        behind.push({ band: [rx - 6, -ry * 0.5, 10, 7] });
        front.push({ d: cap(5, -ry * 0.6, 0.45, 0.1) });
        break;
      case 'pigtails':
        behind.push({ circle: [-rx - 9, -ry * 0.12, 12.5] }, { circle: [rx + 9, -ry * 0.12, 12.5] });
        behind.push({ band: [-rx - 2, -ry * 0.32, 6, 9] }, { band: [rx - 4, -ry * 0.32, 6, 9] });
        front.push({ d: cap(4, -ry * 0.5, 0.0, 0.12) });
        break;
      case 'braids':
        front.push({ d: cap(4, -ry * 0.52, 0.0, 0.12) });
        for (const s of [-1, 1]) {
          for (let i = 0; i < 7; i++) front.push({ ellipse: [s * (rx - 1 + (i % 2) * 2.5), ry * 0.35 + i * 11.5, 6.6, 8, s * 12] });
          front.push({ band: [s * (rx + 1) - 4, ry * 0.35 + 7 * 11.5 - 3, 8, 6] });
        }
        break;
      case 'bun':
        behind.push({ circle: [0, -ry - 7, 14] });
        front.push({ d: cap(4, -ry * 0.6, 0.0, 0.12) });
        break;
      case 'buzz':
        front.push({ d: cap(2.2, -ry * 0.7, 0.3, 0.0), op: 0.92 });
        break;
      default:
        break;
    }
    return { back, behind, front };
  }

  function drawHair(specs, parent, color, accent) {
    for (const s of specs) {
      if (s.d) el('path', { d: s.d, fill: color, opacity: s.op ?? 1 }, parent);
      else if (s.circle) el('circle', { cx: s.circle[0], cy: s.circle[1], r: s.circle[2], fill: color }, parent);
      else if (s.ellipse) el('ellipse', { cx: 0, cy: 0, rx: s.ellipse[2], ry: s.ellipse[3], fill: color, transform: `translate(${s.ellipse[0]} ${s.ellipse[1]}) rotate(${s.ellipse[4] || 0})` }, parent);
      else if (s.band) el('rect', { x: s.band[0], y: s.band[1], width: s.band[2], height: s.band[3], rx: 2.5, fill: accent }, parent);
    }
  }

  let seedN = 0;
  /**
   * A person. Options: kid, skin, hair, hairStyle, top, style (hoodie|coat|cardigan|tee|shirt|pajama|sweater),
   * pants, shoe, scarf, under, glasses, accent (hair ties).
   * Origin is between the feet; up is negative y. Call place(x, y, s) once and set(pose, t) every frame.
   */
  CD.person = function (o) {
    const kid = !!o.kid;
    const D = kid
      ? { hip: -112, shY: -192, shX: 36, topW: 76, waistW: 62, headY: -236, rx: 29, ry: 33, L1: 47, L2: 45, aw: 16, lw: 22, lx: 12, hr: 9.2, neckW: 13, eyeR: 4.2, eyeY: 0.14, browY: -0.2 }
      : { hip: -200, shY: -336, shX: 54, topW: 116, waistW: 94, headY: -397, rx: 34, ry: 40, L1: 80, L2: 76, aw: 24, lw: 33, lx: 19, hr: 12.5, neckW: 22, eyeR: 3.9, eyeY: 0.05, browY: -0.27 };
    const seed = (o.seed ?? seedN++) * 1.618;
    const skin = o.skin || CD.SKIN.medium, skinS = shade(skin, -0.16), skinL = shade(skin, 0.07);
    const hair = o.hair || CD.HAIR.dark;
    const top = o.top || CD.CLOTH.green, topS = shade(top, -0.2), topL = shade(top, 0.1);
    const pants = o.pants || '#2a3540', shoe = o.shoe || '#1a1f1d';
    const style = o.style || 'sweater';
    const longSleeve = style !== 'tee';
    const accent = o.accent || CD.CLOTH.blue;
    const coatLen = style === 'coat' ? (kid ? 30 : 64) : 6;

    const g = el('g');
    el('ellipse', { cx: 0, cy: 0, rx: kid ? 44 : 66, ry: kid ? 7 : 10, fill: 'rgba(12,22,16,.16)' }, g);
    const legL = el('polyline', { fill: 'none', stroke: pants, 'stroke-width': D.lw, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
    const legR = el('polyline', { fill: 'none', stroke: pants, 'stroke-width': D.lw, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
    const shoeL = el('ellipse', { rx: D.lw * 0.78, ry: kid ? 6.5 : 8.5, fill: shoe }, g);
    const shoeR = el('ellipse', { rx: D.lw * 0.78, ry: kid ? 6.5 : 8.5, fill: shoe }, g);

    const upper = el('g', {}, g);
    const backHair = el('g', {}, upper);
    const tw = D.topW / 2, ww = D.waistW / 2, sy = D.shY, hy = D.hip;
    if (o.pack) { // a full school backpack worn on the back: body peeks out at the sides, supplies above the shoulder
      const pk = el('g', {}, upper), pc = o.pack;
      el('rect', { x: tw - 26, y: sy - 46, width: 10, height: 44, rx: 3, fill: '#1e6fd0', transform: `rotate(12 ${tw - 21} ${sy - 24})` }, pk);
      el('rect', { x: tw - 46, y: sy - 38, width: 18, height: 36, rx: 2, fill: '#ffffff', transform: `rotate(-8 ${tw - 37} ${sy - 20})` }, pk);
      el('rect', { x: -tw + 14, y: sy - 34, width: 8, height: 34, rx: 3, fill: '#2e7d32', transform: `rotate(-14 ${-tw + 18} ${sy - 17})` }, pk);
      el('path', { d: `M ${-tw - 6} ${sy + 4} Q ${-tw - 10} ${sy - 18} ${-tw + 10} ${sy - 20} L ${tw - 10} ${sy - 20} Q ${tw + 10} ${sy - 18} ${tw + 6} ${sy + 4} L ${tw + 8} ${hy - 6} Q 0 ${hy + 4} ${-tw - 8} ${hy - 6} Z`, fill: pc }, pk);
    }
    const torso = el('g', {}, upper);
    // neck
    el('rect', { x: -D.neckW / 2, y: D.headY + D.ry * 0.5, width: D.neckW, height: sy + 10 - (D.headY + D.ry * 0.5), rx: 4, fill: skinS }, torso);
    const flare = style === 'coat' ? 7 : 0;
    const body = `M ${-ww - flare} ${hy + coatLen} L ${-tw + 3} ${sy + 24} Q ${-tw} ${sy} ${-tw + 22} ${sy - 5} L ${tw - 22} ${sy - 5} Q ${tw} ${sy} ${tw - 3} ${sy + 24} L ${ww + flare} ${hy + coatLen} Q 0 ${hy + coatLen + 6} ${-ww - flare} ${hy + coatLen} Z`;
    el('path', { d: body, fill: CD.vgrad(topL, topS) }, torso);
    el('ellipse', { cx: 0, cy: D.headY + D.ry - 1, rx: D.neckW * 0.62, ry: kid ? 4 : 6, fill: shade(skin, -0.3), opacity: 0.45 }, torso);
    // neck shadow
    el('ellipse', { cx: 0, cy: sy + 1, rx: D.neckW * 0.75, ry: kid ? 4 : 6, fill: topS, opacity: 0.55 }, torso);
    const det = el('g', {}, torso);
    if (style === 'hoodie') {
      el('path', { d: `M ${-D.neckW - 6} ${sy - 4} Q 0 ${sy + (kid ? 20 : 32)} ${D.neckW + 6} ${sy - 4}`, fill: 'none', stroke: topS, 'stroke-width': kid ? 7 : 10, 'stroke-linecap': 'round' }, det);
      el('line', { x1: -7, y1: sy + 10, x2: -9, y2: sy + (kid ? 34 : 54), stroke: '#eef2f0', 'stroke-width': kid ? 2.4 : 3.2, 'stroke-linecap': 'round' }, det);
      el('line', { x1: 7, y1: sy + 10, x2: 9, y2: sy + (kid ? 34 : 54), stroke: '#eef2f0', 'stroke-width': kid ? 2.4 : 3.2, 'stroke-linecap': 'round' }, det);
      el('path', { d: `M ${-ww * 0.72} ${hy - (kid ? 30 : 52)} L ${ww * 0.72} ${hy - (kid ? 30 : 52)} L ${ww * 0.84} ${hy - 8} L ${-ww * 0.84} ${hy - 8} Z`, fill: topS, opacity: 0.55 }, det);
    } else if (style === 'coat') {
      el('path', { d: `M -12 ${sy - 3} L -2 ${sy + 76} L -32 ${sy + 6} Z`, fill: topS }, det);
      el('path', { d: `M 12 ${sy - 3} L 2 ${sy + 76} L 32 ${sy + 6} Z`, fill: topS }, det);
      el('line', { x1: 0, y1: sy + 72, x2: 0, y2: hy + coatLen, stroke: topS, 'stroke-width': 3 }, det);
      for (let i = 0; i < 3; i++) el('circle', { cx: -9, cy: sy + 100 + i * 42, r: 3.6, fill: topS }, det);
    } else if (style === 'cardigan') {
      el('path', { d: `M -21 ${sy - 4} L 0 ${sy + 62} L 21 ${sy - 4} Z`, fill: o.under || CD.CLOTH.white }, det);
      el('path', { d: `M -21 ${sy - 4} L -3 ${sy + 66} L -3 ${hy + coatLen}`, fill: 'none', stroke: topS, 'stroke-width': 4 }, det);
      el('path', { d: `M 21 ${sy - 4} L 3 ${sy + 66} L 3 ${hy + coatLen}`, fill: 'none', stroke: topS, 'stroke-width': 4 }, det);
      for (let i = 0; i < 3; i++) el('circle', { cx: -9, cy: sy + 84 + i * 30, r: 3, fill: topS }, det);
    } else if (style === 'tee') {
      el('path', { d: `M ${-D.neckW * 0.85} ${sy - 4} Q 0 ${sy + (kid ? 13 : 18)} ${D.neckW * 0.85} ${sy - 4} Z`, fill: skinS }, det);
      if (o.print) el('circle', { cx: 0, cy: sy + (kid ? 36 : 60), r: kid ? 10 : 16, fill: 'none', stroke: o.print, 'stroke-width': kid ? 4 : 5 }, det);
    } else if (style === 'shirt' || style === 'pajama') {
      el('path', { d: `M -12 ${sy - 4} L 0 ${sy + 16} L 12 ${sy - 4} Z`, fill: skinS }, det);
      el('path', { d: `M -16 ${sy - 7} L -1 ${sy + 15} L -24 ${sy + 12} Z`, fill: topL }, det);
      el('path', { d: `M 16 ${sy - 7} L 1 ${sy + 15} L 24 ${sy + 12} Z`, fill: topL }, det);
      el('line', { x1: 0, y1: sy + 16, x2: 0, y2: hy, stroke: topS, 'stroke-width': 2 }, det);
      if (style === 'pajama') {
        const r = CD.rand(7);
        for (let i = 0; i < (kid ? 9 : 14); i++) el('circle', { cx: (r() - 0.5) * (ww * 1.6), cy: sy + 22 + r() * (hy - sy - 30), r: kid ? 2.4 : 3.2, fill: '#ffffff', opacity: 0.7 }, det);
      }
    } else {
      el('path', { d: `M ${-D.neckW * 0.9} ${sy - 4} Q 0 ${sy + (kid ? 12 : 17)} ${D.neckW * 0.9} ${sy - 4}`, fill: 'none', stroke: topS, 'stroke-width': kid ? 5 : 7 }, det);
    }
    if (o.pack) {
      el('path', { d: `M ${-tw + 10} ${sy - 3} Q ${-tw + 4} ${sy + 40} ${-tw + 12} ${hy - 20}`, fill: 'none', stroke: shade(o.pack, -0.3), 'stroke-width': kid ? 7 : 10, 'stroke-linecap': 'round' }, torso);
      el('path', { d: `M ${tw - 10} ${sy - 3} Q ${tw - 4} ${sy + 40} ${tw - 12} ${hy - 20}`, fill: 'none', stroke: shade(o.pack, -0.3), 'stroke-width': kid ? 7 : 10, 'stroke-linecap': 'round' }, torso);
    }
    if (o.scarf) {
      el('ellipse', { cx: 0, cy: sy + 3, rx: kid ? 20 : 30, ry: kid ? 9 : 13, fill: o.scarf }, torso);
      el('rect', { x: 6, y: sy + 8, width: kid ? 12 : 19, height: kid ? 36 : 62, rx: 6, fill: shade(o.scarf, -0.12), transform: `rotate(-7 ${6} ${sy + 8})` }, torso);
    }

    const heldBack = el('g', {}, upper);
    const head = el('g', {}, upper);
    const hs = hairSpec(o.hairStyle || 'short', D.rx, D.ry);
    drawHair(hs.back, backHair, hair, accent);
    const behind = el('g', {}, head);
    drawHair(hs.behind, behind, hair, accent);
    const earL = el('ellipse', { rx: kid ? 5.5 : 6, ry: kid ? 7.5 : 9, fill: skinS }, head);
    const earR = el('ellipse', { rx: kid ? 5.5 : 6, ry: kid ? 7.5 : 9, fill: skinS }, head);
    el('ellipse', { cx: 0, cy: 0, rx: D.rx, ry: D.ry, fill: skin }, head);
    const feat = el('g', {}, head);
    const browC = shade(hair === CD.HAIR.silver || hair === CD.HAIR.gray ? '#6d6f72' : hair, -0.15);
    const eyeC = '#1d1917';
    const eL = el('ellipse', { rx: D.eyeR, ry: D.eyeR * 1.25, fill: eyeC }, feat);
    const eR = el('ellipse', { rx: D.eyeR, ry: D.eyeR * 1.25, fill: eyeC }, feat);
    const gL = el('circle', { r: kid ? 1.5 : 1.25, fill: '#fff' }, feat);
    const gR = el('circle', { r: kid ? 1.5 : 1.25, fill: '#fff' }, feat);
    const aL = el('path', { fill: 'none', stroke: eyeC, 'stroke-width': kid ? 2.8 : 2.6, 'stroke-linecap': 'round' }, feat);
    const aR = el('path', { fill: 'none', stroke: eyeC, 'stroke-width': kid ? 2.8 : 2.6, 'stroke-linecap': 'round' }, feat);
    const bL = el('line', { x1: -6.5, y1: 0, x2: 6.5, y2: 0, stroke: browC, 'stroke-width': kid ? 3.2 : 4, 'stroke-linecap': 'round' }, feat);
    const bR = el('line', { x1: -6.5, y1: 0, x2: 6.5, y2: 0, stroke: browC, 'stroke-width': kid ? 3.2 : 4, 'stroke-linecap': 'round' }, feat);
    const nose = el('path', { fill: 'none', stroke: skinS, 'stroke-width': kid ? 2.2 : 2.6, 'stroke-linecap': 'round' }, feat);
    const mouthO = el('path', { fill: '#3b1d1b' }, feat);
    const mouth = el('path', { fill: 'none', stroke: '#4e2724', 'stroke-width': kid ? 2.8 : 3.1, 'stroke-linecap': 'round' }, feat);
    const tear = el('ellipse', { rx: 2.4, ry: 3.4, fill: '#e3f1fb', opacity: 0 }, feat);
    const front = el('g', {}, head);
    drawHair(hs.front, front, hair, accent);
    let glasses = null;
    if (o.glasses) {
      glasses = el('g', { fill: 'none', stroke: '#26323a', 'stroke-width': 2.4 }, head);
      el('rect', { x: -21, y: -7, width: 16, height: 13, rx: 4.5 }, glasses);
      el('rect', { x: 5, y: -7, width: 16, height: 13, rx: 4.5 }, glasses);
      el('line', { x1: -5, y1: -2, x2: 5, y2: -2 }, glasses);
    }

    const heldFront = el('g', {}, upper);
    const arms = el('g', {}, upper);
    const mkArm = () => ({
      up: el('line', { stroke: top, 'stroke-width': D.aw, 'stroke-linecap': 'round' }, arms),
      sl: longSleeve ? null : el('line', { stroke: top, 'stroke-width': D.aw + 3, 'stroke-linecap': 'round' }, arms),
      fo: el('line', { stroke: longSleeve ? top : skin, 'stroke-width': longSleeve ? D.aw * 0.94 : D.aw * 0.8, 'stroke-linecap': 'round' }, arms),
      hand: el('ellipse', { rx: D.hr, ry: D.hr * 1.1, fill: skin }, arms),
    });
    const armL = mkArm(), armR = mkArm();
    if (!longSleeve) { armL.up.setAttribute('stroke', skin); armR.up.setAttribute('stroke', skin); armL.up.setAttribute('stroke-width', D.aw * 0.84); armR.up.setAttribute('stroke-width', D.aw * 0.84); }

    const SL = [-D.shX, D.shY + 12], SR = [D.shX, D.shY + 12];
    const restL = [-D.shX - 7, D.shY + 12 + D.L1 + D.L2 - 9], restR = [D.shX + 7, D.shY + 12 + D.L1 + D.L2 - 9];
    let px = 0, py = 0, ps = 1, lastTy = 0, lastLean = 0, lastHead = [0, D.headY];
    const held = { l: null, r: null };
    const handPos = { l: restL.slice(), r: restR.slice() };

    const api = {
      g, D, kid, skin, top,
      place(x, y, s = 1) { px = x; py = y; ps = s; g.setAttribute('transform', `translate(${x} ${y}) scale(${s})`); return api; },
      /** Convert a world point into this person's local space (for hand targets). */
      local(wx, wy) { return [(wx - px) / ps, (wy - py) / ps]; },
      world(lx, ly) { return [px + lx * ps, py + ly * ps]; },
      P(o) {
        const p = Object.assign({}, BASE, CD.EXPR[o.ex || 'neutral'], { lh: restL.slice(), rh: restR.slice() });
        for (const k in o) if (o[k] !== undefined) p[k] = o[k];
        return p;
      },
      restL, restR,
      /** Hold a prop in a hand: prop = svg group; dx/dy offset from the hand; behind = drawn behind the body. */
      hold(side, prop, dx = 0, dy = 0, behind = false) {
        if (held[side]) held[side].g.remove();
        if (prop) { (behind ? heldBack : heldFront).appendChild(prop); held[side] = { g: prop, dx, dy }; } else held[side] = null;
      },
      hand(side) { return handPos[side]; },
      /** World position of a hand after the last set() (includes lean, bob and placement). */
      handWorld(side) {
        const [hx, hy0] = handPos[side];
        const y = hy0 + lastTy, a = (lastLean * PI) / 180;
        const dx = hx, dy = y - hy;
        const rx = dx * Math.cos(a) - dy * Math.sin(a), ry = dx * Math.sin(a) + dy * Math.cos(a) + hy;
        return [px + rx * ps, py + ry * ps];
      },
      /** World position of a point on the head (local to the head centre), e.g. [0, 0] for the face. */
      headWorld() { return [px + (lastHead[0]) * ps, py + lastHead[1] * ps]; },
      set(p, t) {
        const breath = Math.sin((t + seed) * 2 * PI / 3.9);
        lastTy = p.bob + breath * 0.9 - p.shrug * 6; lastLean = p.lean;
        upper.setAttribute('transform', `rotate(${p.lean} 0 ${hy}) translate(0 ${lastTy.toFixed(2)})`);
        // legs: lift raises the foot and pushes the knee out a little
        const leg = (pl, side, lift) => {
          const x = side * D.lx, ay = -12 - lift, ky = (hy + 8 + ay) / 2;
          pl.setAttribute('points', `${x},${hy + 8} ${x + side * lift * 0.28},${ky} ${x},${ay}`);
          return ay;
        };
        const ayL = leg(legL, -1, p.liftL), ayR = leg(legR, 1, p.liftR);
        shoeL.setAttribute('cx', -D.lx - 4); shoeL.setAttribute('cy', ayL + 6);
        shoeR.setAttribute('cx', D.lx + 4); shoeR.setAttribute('cy', ayR + 6);

        const tk = o.who && CD.talk ? CD.talk(o.who, t) : 0;
        const hyy = D.headY + p.nod + breath * 0.5 + p.shrug * 4 + tk * 1.6;
        lastHead = [p.hx, hyy + lastTy];
        const htf = `translate(${p.hx.toFixed(2)} ${hyy.toFixed(2)}) rotate(${p.tilt.toFixed(2)} 0 ${(D.ry * 0.9).toFixed(1)})`;
        head.setAttribute('transform', htf);
        backHair.setAttribute('transform', htf);

        // face
        const turn = p.turn, fx = turn * D.rx * 0.27;
        const ex = D.rx * 0.36, ey = D.ry * D.eyeY;
        const gx = p.gx * 2.1, gy = p.gy * 2.0;
        const cyc = (t + seed * 1.7) % 4.3;
        const blink = p.noBlink ? 0 : cyc < 0.14 ? Math.sin((cyc / 0.14) * PI) : 0;
        const open = CD.clamp(p.eye * (1 - blink * 0.94), 0.04, 1.3) * (1 - 0.22 * Math.max(0, p.gy));
        const sq = CD.clamp(p.squint * (1 - blink));
        const eyes = [[eL, gL, aL, -1], [eR, gR, aR, 1]];
        for (const [e, gl, a, s] of eyes) {
          const cx = fx + s * ex + gx + s * turn * 0.8, cy = ey + gy;
          e.setAttribute('cx', cx.toFixed(2)); e.setAttribute('cy', cy.toFixed(2));
          e.setAttribute('ry', (D.eyeR * 1.25 * open).toFixed(2));
          e.setAttribute('opacity', (1 - CD.clamp(sq * 1.6)).toFixed(3));
          gl.setAttribute('cx', (cx + 1.3).toFixed(2)); gl.setAttribute('cy', (cy - D.eyeR * 0.45 * open).toFixed(2));
          gl.setAttribute('opacity', (open > 0.45 ? 1 - sq : 0).toFixed(3));
          a.setAttribute('d', `M ${cx - 4.6} ${cy + 1.2} Q ${cx} ${cy - 4.2} ${cx + 4.6} ${cy + 1.2}`);
          a.setAttribute('opacity', sq.toFixed(3));
        }
        const by = D.ry * D.browY - p.browY - tk * 1.4 + (p.eye < 0.3 ? 1.5 : 0);
        bL.setAttribute('transform', `translate(${(fx - ex + gx * 0.3).toFixed(2)} ${by.toFixed(2)}) rotate(${(-p.brow).toFixed(2)})`);
        bR.setAttribute('transform', `translate(${(fx + ex + gx * 0.3).toFixed(2)} ${by.toFixed(2)}) rotate(${p.brow.toFixed(2)})`);
        nose.setAttribute('d', `M ${(fx + 1.2 + turn * 2).toFixed(2)} ${(D.ry * 0.13).toFixed(2)} q ${(2.6 + turn * 2.5).toFixed(2)} 5.6 ${(-2.2 + turn).toFixed(2)} 6.6`);
        const my = D.ry * (kid ? 0.47 : 0.5), mw = D.rx * (kid ? 0.22 : 0.26) * (1 + 0.18 * Math.max(0, p.smile)) * (1 - 0.12 * tk);
        const mx = fx * 1.05;
        mouth.setAttribute('d', `M ${(mx - mw).toFixed(2)} ${my.toFixed(2)} Q ${mx.toFixed(2)} ${(my + p.smile * 7.5).toFixed(2)} ${(mx + mw).toFixed(2)} ${my.toFixed(2)}`);
        const mo = CD.clamp(Math.max(p.open, tk * 0.95));
        mouthO.setAttribute('d', mo > 0.02 ? `M ${(mx - mw * 0.82).toFixed(2)} ${(my + 0.5).toFixed(2)} Q ${mx.toFixed(2)} ${(my + 2 + p.smile * 6 + mo * 9).toFixed(2)} ${(mx + mw * 0.82).toFixed(2)} ${(my + 0.5).toFixed(2)} Z` : 'M 0 0');
        const tp = p.tear;
        tear.setAttribute('opacity', (tp > 0 && tp < 1 ? CD.win(tp, 0, 1, 0.25) * 0.95 : 0).toFixed(3));
        tear.setAttribute('cx', (fx - ex - 1.5).toFixed(2));
        tear.setAttribute('cy', (ey + 6 + tp * 20).toFixed(2));
        earL.setAttribute('cx', (-D.rx + 1 - turn * 4).toFixed(2)); earL.setAttribute('cy', (D.ry * 0.08).toFixed(2));
        earR.setAttribute('cx', (D.rx - 1 - turn * 4).toFixed(2)); earR.setAttribute('cy', (D.ry * 0.08).toFixed(2));
        earL.setAttribute('opacity', turn > 0.6 ? 0 : 1); earR.setAttribute('opacity', turn < -0.6 ? 0 : 1);
        front.setAttribute('transform', `translate(${(turn * 3).toFixed(2)} 0)`);
        behind.setAttribute('transform', `translate(${(-turn * 3).toFixed(2)} 0)`);
        if (glasses) glasses.setAttribute('transform', `translate(${(fx + gx * 0.2).toFixed(2)} ${(ey + 0.5).toFixed(2)})`);

        // arms by inverse kinematics; elbows bend outward
        const doArm = (A, S, T, side, key, rot) => {
          const { E, H } = ik(S, T, D.L1, D.L2, side);
          A.up.setAttribute('x1', S[0]); A.up.setAttribute('y1', S[1]);
          A.up.setAttribute('x2', E[0].toFixed(2)); A.up.setAttribute('y2', E[1].toFixed(2));
          if (A.sl) {
            A.sl.setAttribute('x1', S[0]); A.sl.setAttribute('y1', S[1]);
            A.sl.setAttribute('x2', (S[0] + (E[0] - S[0]) * 0.55).toFixed(2)); A.sl.setAttribute('y2', (S[1] + (E[1] - S[1]) * 0.55).toFixed(2));
          }
          A.fo.setAttribute('x1', E[0].toFixed(2)); A.fo.setAttribute('y1', E[1].toFixed(2));
          A.fo.setAttribute('x2', H[0].toFixed(2)); A.fo.setAttribute('y2', H[1].toFixed(2));
          const ang = Math.atan2(H[1] - E[1], H[0] - E[0]) * 180 / PI - 90;
          A.hand.setAttribute('transform', `translate(${H[0].toFixed(2)} ${H[1].toFixed(2)}) rotate(${ang.toFixed(1)})`);
          handPos[key] = H;
          const h = held[key];
          if (h) h.g.setAttribute('transform', `translate(${(H[0] + h.dx).toFixed(2)} ${(H[1] + h.dy).toFixed(2)}) rotate(${rot.toFixed(2)})`);
        };
        doArm(armL, SL, p.lh, 1, 'l', p.lrot);
        doArm(armR, SR, p.rh, -1, 'r', p.rrot);
      },
    };
    return api;
  };

  /** Run a person through pose keyframes [[t, poseSpec], ...] (specs are filled with P()). */
  CD.animate = (person, keys) => {
    const full = keys.map(([t, o]) => [t, person.P(o)]);
    return (lt, t) => person.set(CD.track(full, lt), t);
  };

  // ---------------- props (origin at bottom centre unless noted) ----------------
  CD.prop = function (kind, o = {}) {
    const g = el('g');
    const r = (x, y, w, h, fill, rx = 0, extra = {}) => el('rect', { x, y, width: w, height: h, rx, fill, ...extra }, g);
    switch (kind) {
      case 'milk':
        el('path', { d: 'M -20 0 L -20 -40 Q -20 -49 -12 -51 L -8 -58 L 8 -58 L 10 -52 Q 20 -49 20 -40 L 20 0 Q 0 3 -20 0 Z', fill: '#f2f5f7' }, g);
        r(-6, -65, 12, 8, '#1565c0', 2);
        r(-20, -33, 40, 17, '#5b9be0');
        el('path', { d: 'M 7 -50 Q 17 -46 15 -37', fill: 'none', stroke: '#d4dce1', 'stroke-width': 3 }, g);
        el('rect', { x: 10, y: -44, width: 6, height: 40, fill: '#000', opacity: 0.05 }, g);
        break;
      case 'cereal':
        r(-22, -64, 44, 64, '#1565c0', 3);
        r(-22, -64, 44, 12, '#0f4c97', 3);
        el('path', { d: 'M -13 -24 Q 0 -6 13 -24 Z', fill: '#fff' }, g);
        for (const [x, y] of [[-6, -28], [0, -31], [6, -28], [-2, -26], [4, -25]]) el('circle', { cx: x, cy: y, r: 2.6, fill: '#a9d4ad' }, g);
        r(-16, -46, 32, 6, '#ffffff', 3, { opacity: 0.85 });
        el('rect', { x: 14, y: -64, width: 8, height: 64, fill: '#000', opacity: 0.08 }, g);
        break;
      case 'eggs':
        r(-28, -19, 56, 19, '#dde3e7', 4);
        for (let i = 0; i < 4; i++) el('ellipse', { cx: -21 + i * 14, cy: -19, rx: 6.5, ry: 4, fill: '#cfd6db' }, g);
        r(-28, -10, 56, 2.5, '#c3cbd1');
        break;
      case 'diapers':
        r(-25, -52, 50, 52, '#a9cdf0', 8);
        r(-25, -35, 50, 13, '#ffffff', 0, { opacity: 0.92 });
        el('path', { d: 'M 0 -10 C -9 -17 -11 -6 0 -2 C 11 -6 9 -17 0 -10 Z', fill: '#ffffff' }, g);
        el('rect', { x: 15, y: -52, width: 10, height: 52, rx: 6, fill: '#000', opacity: 0.06 }, g);
        break;
      case 'formula':
        r(-16, -44, 32, 44, '#f4f6f5', 4);
        r(-17, -50, 34, 9, '#2e7d32', 3);
        r(-16, -30, 32, 14, '#a9d4ad');
        el('rect', { x: 9, y: -44, width: 7, height: 44, fill: '#000', opacity: 0.06 }, g);
        break;
      case 'apples':
        for (const [x, y] of [[-12, -11], [11, -11], [0, -27]]) {
          el('circle', { cx: x, cy: y, r: 12, fill: '#5d9f55' }, g);
          el('circle', { cx: x - 4, cy: y - 4, r: 3.4, fill: '#ffffff', opacity: 0.35 }, g);
          el('path', { d: `M ${x} ${y - 11} q 1 -5 3 -6`, stroke: '#2b3a2b', 'stroke-width': 2, fill: 'none' }, g);
        }
        el('path', { d: 'M -24 -6 Q 0 6 24 -6 L 22 0 Q 0 6 -22 0 Z', fill: '#ffffff', opacity: 0.35 }, g);
        break;
      case 'apple':
        el('circle', { cx: 0, cy: -12, r: 12, fill: '#5d9f55' }, g);
        el('circle', { cx: -4, cy: -16, r: 3.4, fill: '#fff', opacity: 0.35 }, g);
        el('path', { d: 'M 0 -23 q 1 -5 3 -6', stroke: '#2b3a2b', 'stroke-width': 2, fill: 'none' }, g);
        el('path', { d: 'M 2 -26 q 7 -5 10 0 q -6 3 -10 0 Z', fill: '#2e7d32' }, g);
        break;
      case 'card': // centred
        r(-17, -11, 34, 22, '#1e3350', 3);
        r(-12, -5, 8, 6, '#c9d1d6', 1.5);
        r(-12, 4, 22, 2.5, '#7b8b99', 1);
        break;
      case 'phone': { // centred, screen faces camera
        r(-12, -24, 24, 48, '#141b17', 5);
        const scr = r(-10, -21, 20, 42, o.screen || '#eaf3eb', 3);
        if (o.barcode) for (let i = 0; i < 9; i++) r(-7 + i * 1.6, -6, i % 3 === 0 ? 1.2 : 0.7, 12, '#1d2723');
        g.screen = scr;
        break;
      }
      case 'pencil': // centred, horizontal
        r(-38, -3.5, 66, 7, '#1e6fd0', 1.5);
        r(-38, -3.5, 66, 2.5, '#4f8fe0', 1);
        el('path', { d: 'M 28 -3.5 L 40 0 L 28 3.5 Z', fill: '#e8d9bf' }, g);
        el('path', { d: 'M 36 -1.1 L 40 0 L 36 1.1 Z', fill: '#2a2a2a' }, g);
        r(-46, -3.5, 9, 7, '#cfd8dc', 2);
        break;
      case 'tote': // reusable grocery bag with groceries peeking out
        el('path', { d: 'M -40 -52 L 40 -52 L 36 0 L -36 0 Z', fill: '#2e7d32' }, g);
        el('path', { d: 'M -24 -52 Q -24 -86 0 -86 Q 24 -86 24 -52', fill: 'none', stroke: '#1f5130', 'stroke-width': 5 }, g);
        r(-14, -86 + 22, 14, 18, '#1565c0', 2);
        el('circle', { cx: 10, cy: -60, r: 10, fill: '#5d9f55' }, g);
        el('circle', { cx: -26, cy: -58, r: 7, fill: '#5d9f55' }, g);
        el('path', { d: 'M -16 -30 Q 0 -22 16 -30', fill: 'none', stroke: '#ffffff', 'stroke-width': 3, opacity: 0.7 }, g);
        break;
      case 'mug':
        r(-11, -24, 22, 24, o.color || '#1565c0', 3);
        el('path', { d: 'M 11 -18 q 9 0 9 7 q 0 7 -9 7', fill: 'none', stroke: o.color || '#1565c0', 'stroke-width': 3.5 }, g);
        break;
      case 'backpack': { // bottom centre; o.full adds supplies peeking out
        if (o.full) {
          r(-26, -98, 7, 34, '#1e6fd0', 2, { transform: 'rotate(-10 -22 -90)' });
          r(-12, -104, 26, 34, '#ffffff', 2, { transform: 'rotate(6 0 -96)' });
          r(16, -96, 6, 30, '#2e7d32', 2, { transform: 'rotate(14 18 -90)' });
        }
        el('path', { d: 'M -38 0 L -40 -62 Q -40 -84 0 -84 Q 40 -84 40 -62 L 38 0 Q 0 6 -38 0 Z', fill: o.color || '#2e7d32' }, g);
        el('path', { d: 'M -26 -10 L -27 -36 Q -27 -44 0 -44 Q 27 -44 27 -36 L 26 -10 Z', fill: shade(o.color || '#2e7d32', -0.18) }, g);
        el('path', { d: 'M -20 -84 Q 0 -100 20 -84', fill: 'none', stroke: shade(o.color || '#2e7d32', -0.3), 'stroke-width': 5 }, g);
        r(-3, -44, 6, 8, '#cfd8dc', 2);
        if (o.open) el('ellipse', { cx: 0, cy: -80, rx: 30, ry: 7, fill: shade(o.color || '#2e7d32', -0.45) }, g);
        break;
      }
      case 'lamp': // desk lamp, base at origin, light cone drawn separately
        el('ellipse', { cx: 0, cy: -3, rx: 22, ry: 5, fill: '#26323a' }, g);
        el('path', { d: 'M 0 -4 L -8 -70 L 34 -96', fill: 'none', stroke: '#26323a', 'stroke-width': 4.5, 'stroke-linecap': 'round' }, g);
        el('path', { d: 'M 22 -112 L 54 -92 L 40 -76 Z', fill: '#2e7d32' }, g);
        break;
      default:
        break;
    }
    return g;
  };
})();
