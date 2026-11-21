// The ending added to the shared "Same planet, different worlds" clip: 15 s, vertical. Every frame is a pure function of t.
// It turns the clip's global message into an honest ask: hunger is here too, CouponDonation helps U.S. families, and
// the end card says plainly that the people in the clip are not CouponDonation recipients.
// Built from the "Same Country" composition (../../kitchens/composition): same plates, Coupon panel and fridge device.
import { couponTree, setCouponTree, WAVE, talk, blinkAt } from '/video-kit/mascot/coupon-tree.js';

const $ = (s, r = document) => r.querySelector(s);
const cl = (x) => Math.max(0, Math.min(1, x));
const lerp = (a, b, x) => a + (b - a) * x;
const E = {
  lin: (x) => x,
  outCubic: (x) => 1 - Math.pow(1 - x, 3),
  inCubic: (x) => x * x * x,
  inOutCubic: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  inOutQuart: (x) => (x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2),
  inOutSine: (x) => -(Math.cos(Math.PI * x) - 1) / 2,
  site: (x) => 1 - Math.pow(1 - x, 4.2),
  outBack: (x) => { const c1 = 1.7, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); },
};
const k = (t, a, b, e = E.outCubic) => e(cl((t - a) / (b - a)));
const vis = (el, on, d = 'block') => { const v = on ? d : 'none'; if (el.style.display !== v) el.style.display = v; };
const div = (cls, parent, html = '') => { const d = document.createElement('div'); if (cls) d.className = cls; if (html) d.innerHTML = html; if (parent) parent.appendChild(d); return d; };

const INK = 'var(--k-ink)', PAPER = 'var(--k-paper)', FOREST = 'var(--k-forest)';
const MOB = '../../work/captures/mobile/';
const DUR = 18.0;

// ------------------------------------------------------------------ script
// Coupon's lines: [t0, t1, text]; *word* = emphasis. Product wording is the site's own (Index.tsx, FAQ.tsx, Terms.tsx).
// The voiceover (voice.py, Kokoro "af_heart") drives the timing: every cut lands on a spoken beat.
// VO: [start, text] with the measured length of each read; Coupon speaks it, and lines 2-5 are its subtitles.
const VO = [
  [0.35, 1.79, "Hunger isn't only far away."],
  [2.75, 2.41, 'Eighteen million households... right here.'],
  [5.6, 3.38, 'Your gift becomes groceries. Medicine. A ride.'],
  [9.25, 1.36, 'You choose where it goes.'],
  [11.25, 1.97, 'And every dollar reaches a family.'],
  [13.75, 3.41, 'Help fill a kitchen. At Coupon Donation dot com.'],
];
// subtitle bubbles (line 1 is the plate's own headline and line 6 is the end card, so they get no bubble)
const LINES = [
  [2.75, 5.16, 'Eighteen million households… | *right here*.'],
  [5.6, 8.98, 'Your gift becomes *groceries*. | *Medicine*. *A ride*.'],
  [9.25, 10.61, 'You choose where it goes.'],
  [11.25, 13.22, 'And *every dollar* reaches a family.'],
];
// when Coupon's mouth moves: each read, split at its pauses
const SPEAK = [[0.35, 2.14], [2.75, 4.19], [4.47, 5.16], [5.6, 7.22], [7.56, 8.18], [8.3, 8.98], [9.25, 10.61], [11.25, 13.22], [13.75, 14.73], [15.15, 17.16]];
// USDA ERS, "Household Food Security in the United States in 2023" (ERR-337): 13.5 percent (18.0 million households)
// were food insecure at some time in 2023.
const PLATES = [
  { type: 'line', t0: 0.0, t1: 2.5 },
  { type: 'stat', t0: 2.5, t1: 6.0, o: { bg: FOREST, num: '18 million', size: 220, cap: 'U.S. households were food insecure in 2023', credit: 'USDA Economic Research Service · 2023 data', note: '13.5% of all U.S. households, at some time during the year' } },
  { type: 'needs', t0: 6.0, t1: 9.0, o: { rows: [6.5, 7.56, 8.3] } },
  { type: 'stores', t0: 9.0, t1: 11.0 },
  { type: 'stat', t0: 11.0, t1: 13.5, o: { bg: FOREST, num: '100%', size: 340, cap: 'of your gift goes to families as store coupons and gift cards', note: 'No platform fee. Optional tips keep us running.' } },
];
const PAY = { t0: 13.5 };
const END_T = 13.5;
const ENTER = 0.1;
// the panel's fridge fills as the voice names each need, as each store is picked, then the 100% burst
const POPS = [6.5, 7.56, 8.3, 9.45, 9.93, 11.9, 12.15, 12.4, 12.65, 12.9, 13.15];

const CUES = [];
const cue = (t, kind, extra = {}) => CUES.push({ t, kind, ...extra });
const allPlates = [...PLATES.map((p) => ({ type: p.type, t0: p.t0, t1: p.t1 })), { type: 'end', t0: END_T, t1: DUR }];
window.compT = { cut: 'main', dur: DUR, lines: LINES.map(([t0, t1, text]) => ({ who: 'coupon', t0, t1, text })), plates: allPlates, cues: CUES, beat: 0.5 };

const stage = $('#stage');

// ------------------------------------------------------------------ helpers
function words(el, text) {
  el.classList.add('words');
  el.innerHTML = text.split(' ').map((w) => `<span class="w"><span>${w}</span></span>`).join(' ');
  return [...el.querySelectorAll('.w > span')];
}
function rise(spans, t, t0, step = 0.06, dur = 0.6) {
  spans.forEach((s, i) => { const p = k(t, t0 + i * step, t0 + i * step + dur, E.site); s.style.transform = `translateY(${((1 - p) * 112).toFixed(1)}%)`; });
}
const fadeUp = (el, t, t0, dur = 0.5, dy = 24) => { const p = k(t, t0, t0 + dur, E.site); el.style.opacity = p.toFixed(3); el.style.transform = `translateY(${((1 - p) * dy).toFixed(1)}px)`; return p; };
function mkPlate(P, bg, dark = false) {
  const el = div('plate', stage); el.style.background = bg; el.style.zIndex = 10 + P.i;
  if (dark) el.classList.add('dark');
  const pin = div('pin', el);
  return { el, pin };
}
function numeral(parent, text, size, top) {
  const n = div('num', parent); n.style.cssText = `top:${top}px;font-size:${size}px;color:var(--k-paper)`;
  n.innerHTML = `<span class="o">${text}</span><span class="f">${text}</span>`;
  return { el: n, fill: n.querySelector('.f') };
}
const setFill = (n, p) => { n.fill.style.clipPath = `inset(${((1 - cl(p)) * 100).toFixed(2)}% 0 0 0)`; };

// ------------------------------------------------------------------ the kitchens (drawn in brand colours; no people)
const IK = 'var(--k-ink)', G1 = 'hsl(123 46% 40%)', G2 = 'hsl(123 46% 62%)', G3 = 'hsl(123 40% 86%)', BL = 'hsl(212 80% 42%)', BL2 = 'hsl(212 70% 82%)', WH = '#fff', FO = 'hsl(123 46% 22%)';
const SW = `stroke="${IK}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"`;
const ICON = {
  apple: `<path d="M50 34 C38 22 12 28 14 56 C16 82 34 98 50 90 C66 98 84 82 86 56 C88 28 62 22 50 34Z" fill="${G1}" ${SW}/><path d="M50 34 C50 24 53 16 58 10" fill="none" ${SW}/><path d="M55 22 C62 10 76 10 82 14 C76 24 64 26 55 22Z" fill="${G2}" ${SW}/>`,
  milk: `<path d="M28 36 L50 14 L72 36 V96 H28 Z" fill="${WH}"/><rect x="28" y="54" width="44" height="24" fill="${BL}"/><path d="M28 36 L50 14 L72 36 V96 H28 Z M28 36 H72 M44 8 H56 V16" fill="none" ${SW}/>`,
  loaf: `<path d="M8 96 V60 C8 38 28 28 50 28 C72 28 92 38 92 60 V96 Z" fill="${G3}" ${SW}/><path d="M30 46 L38 58 M50 42 L58 54 M70 46 L76 56" fill="none" ${SW}/>`,
  eggs: `<ellipse cx="28" cy="62" rx="13" ry="16" fill="${WH}" ${SW}/><ellipse cx="50" cy="60" rx="13" ry="16" fill="${WH}" ${SW}/><ellipse cx="72" cy="62" rx="13" ry="16" fill="${WH}" ${SW}/><path d="M8 70 H92 L86 96 H14 Z" fill="${BL2}" ${SW}/>`,
  juice: `<path d="M40 8 H60 V22 C60 28 74 32 74 46 V96 H26 V46 C26 32 40 28 40 22 Z" fill="${BL}" ${SW}/><rect x="26" y="54" width="48" height="26" fill="${WH}" ${SW}/>`,
  broccoli: `<path d="M42 96 L46 64 H54 L58 96 Z" fill="${G3}" ${SW}/><circle cx="34" cy="52" r="18" fill="${G1}" ${SW}/><circle cx="66" cy="52" r="18" fill="${G1}" ${SW}/><circle cx="50" cy="36" r="20" fill="${G1}" ${SW}/>`,
  can: `<rect x="24" y="24" width="52" height="72" rx="8" fill="${FO}" ${SW}/><rect x="24" y="44" width="52" height="30" fill="${WH}" ${SW}/>`,
  yogurt: `<path d="M22 40 H78 L70 96 H30 Z" fill="${WH}" ${SW}/><rect x="18" y="30" width="64" height="12" rx="4" fill="${BL}" ${SW}/><path d="M36 64 H64" fill="none" stroke="${BL}" stroke-width="6" stroke-linecap="round"/>`,
  greens: `<path d="M50 96 C20 96 10 70 18 50 C26 30 40 40 50 24 C60 40 74 30 82 50 C90 70 80 96 50 96 Z" fill="${G2}" ${SW}/><path d="M50 94 V44 M50 70 L36 56 M50 64 L64 52" fill="none" ${SW}/>`,
  banana: `<path d="M12 44 C16 82 52 100 90 78 C92 74 90 70 86 70 C60 82 34 70 26 42 C24 36 12 36 12 44 Z" fill="${G2}" ${SW}/>`,
  pepper: `<path d="M50 30 C30 24 16 40 20 64 C24 88 40 96 50 90 C60 96 76 88 80 64 C84 40 70 24 50 30 Z" fill="${G1}" ${SW}/><path d="M50 30 V18 C50 12 56 10 60 12" fill="none" ${SW}/>`,
  jar: `<rect x="26" y="34" width="48" height="62" rx="10" fill="${WH}" ${SW}/><rect x="31" y="74" width="38" height="18" rx="6" fill="${G2}"/><rect x="22" y="20" width="56" height="16" rx="4" fill="${BL}" ${SW}/>`,
};
const icon = (name, px) => `<svg viewBox="0 0 100 100" width="${px}" height="${px}">${ICON[name]}</svg>`;
// 12 shelf slots in fridge units (a 300 x 400 fridge): [x centre, the shelf the item stands on]
const SLOTS = [];
[128, 243, 376].forEach((y) => [64, 122, 180, 238].forEach((x) => SLOTS.push([x, y])));
const FULL = ['milk', 'apple', 'juice', 'eggs', 'loaf', 'broccoli', 'jar', 'yogurt', 'greens', 'banana', 'pepper', 'can'];
const ITEM = 66; // item size in fridge units
const WS = 1.1, FY = 526 - 400 * 1.1; // the split screen's fridges: scale, top (standing on the window's floor)

function mkFridge(parent, x, y, s, { open = 1, items = FULL, z = 1 } = {}) {
  const wrap = div('abs', parent); wrap.style.cssText = `left:${x}px;top:${y}px;width:${300 * s}px;height:${400 * s}px;z-index:${z}`;
  wrap.innerHTML = `<svg viewBox="0 0 300 400" width="${300 * s}" height="${400 * s}" style="position:absolute;left:0;top:0;overflow:visible">
    <rect x="0" y="0" width="300" height="400" rx="24" fill="${WH}" stroke="${IK}" stroke-width="8"/>
    <rect x="18" y="18" width="264" height="364" rx="12" fill="hsl(123 12% 22%)"/>
    <rect class="lit" x="18" y="18" width="264" height="364" rx="12" fill="hsl(123 38% 95%)"/>
    <ellipse class="glow" cx="150" cy="28" rx="92" ry="11" fill="#fff"/>
    <g stroke="${IK}" stroke-width="6" stroke-linecap="round"><line x1="18" y1="134" x2="282" y2="134"/><line x1="18" y1="249" x2="282" y2="249"/></g>
  </svg>`;
  const lit = $('.lit', wrap), glow = $('.glow', wrap);
  const box = div('abs', wrap); box.style.cssText = `left:0;top:0;width:${300 * s}px;height:${400 * s}px`;
  const slots = SLOTS.map(([sx, sy], i) => {
    const name = items[i];
    if (!name) return null;
    const el = div('item', box); el.innerHTML = icon(name, ITEM * s);
    el.style.left = ((sx - ITEM / 2) * s).toFixed(1) + 'px'; el.style.top = ((sy - ITEM - 2) * s).toFixed(1) + 'px';
    return { el, name, x: sx * s, y: (sy - ITEM / 2) * s };
  });
  const door = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  door.setAttribute('viewBox', '0 0 300 400'); door.setAttribute('width', 300 * s); door.setAttribute('height', 400 * s);
  door.style.cssText = 'position:absolute;left:0;top:0;overflow:visible';
  door.innerHTML = `<polygon class="d" fill="${WH}" stroke="${IK}" stroke-width="8" stroke-linejoin="round"/><line class="h" x1="268" y1="160" x2="268" y2="240" stroke="${IK}" stroke-width="10" stroke-linecap="round"/>`;
  wrap.appendChild(door);
  const poly = $('.d', door), handle = $('.h', door);
  const F = {
    wrap, slots,
    setDoor(p) { // 0 = closed, 1 = open (seen edge-on, swung to the right)
      const pts = [[lerp(0, 300, p), 0], [lerp(300, 376, p), lerp(0, 28, p)], [lerp(300, 376, p), lerp(400, 372, p)], [lerp(0, 300, p), 400]];
      poly.setAttribute('points', pts.map((q) => q.map((v) => v.toFixed(1)).join(',')).join(' '));
      handle.style.opacity = p < 0.4 ? 1 : 0;
      box.style.visibility = p > 0.5 ? 'visible' : 'hidden';
    },
    setLight(l) { lit.style.opacity = cl(l).toFixed(3); glow.style.opacity = (0.95 * cl(l)).toFixed(3); },
    setItem(i, sc, op = 1) { const sl = slots[i]; if (!sl) return; sl.el.style.transform = `scale(${Math.max(0.001, sc).toFixed(3)})`; sl.el.style.opacity = op; },
  };
  F.setDoor(open); F.setLight(1);
  return F;
}
function mkBin(parent, x, y, s, z = 3) {
  const el = div('abs', parent); el.style.cssText = `left:${x}px;top:${y}px;width:${220 * s}px;height:${240 * s}px;z-index:${z}`;
  el.innerHTML = `<svg viewBox="0 0 220 240" width="${220 * s}" height="${240 * s}" style="overflow:visible">
    <path d="M18 56 H202 L186 236 H34 Z" fill="${FO}" stroke="${IK}" stroke-width="7" stroke-linejoin="round"/>
    <path d="M72 84 L78 210 M110 84 V210 M148 84 L142 210" stroke="hsl(123 30% 38%)" stroke-width="7" stroke-linecap="round"/>
    <g class="lid"><rect x="8" y="34" width="204" height="22" rx="9" fill="${G1}" stroke="${IK}" stroke-width="7"/><rect x="88" y="20" width="44" height="16" rx="6" fill="${G1}" stroke="${IK}" stroke-width="6"/></g>
  </svg>`;
  const lid = $('.lid', el);
  return { el, mouth: { x: x + 110 * s, y: y + 46 * s }, bottom: y + 170 * s, setLid(a) { lid.setAttribute('transform', `rotate(${(-a).toFixed(1)} 14 52)`); } };
}
function mkWin(parent, top, label) {
  const w = div('win', parent); w.style.top = top + 'px';
  div('floor', w);
  const l = div('lbl', w); l.textContent = label;
  return w;
}

// the split screen: the hook (0-4 s) and its payoff (23-26.5 s)
const SPLITS = [];
function buildSplit(S) {
  const el = div('abs', stage); el.style.cssText = `left:0;top:0;width:1080px;height:1920px;background:var(--k-ink);z-index:${S.z};display:none;overflow:hidden`;
  const pin = div('abs', el); pin.style.cssText = 'left:0;top:0;width:1080px;height:1920px;transform-origin:540px 900px';
  const h1 = div('headline', pin); h1.style.top = '104px'; h1.style.color = 'var(--k-paper)'; words(h1, 'Same country.');
  const h2 = div('headline', pin); h2.style.top = '218px'; h2.style.color = 'var(--k-green-lt)';
  let sw = null;
  if (S.mode === 'hook') words(h2, 'Different kitchens.');
  else {
    h2.classList.add('words');
    h2.innerHTML = `<span class="slot" style="position:relative;display:inline-block;vertical-align:top;height:1em"><span class="w old" style="position:absolute;left:0;top:0"><span>Different</span></span><span class="w new" style="position:absolute;left:0;top:0;color:var(--k-paper)"><span>Full</span></span><i class="strk" style="position:absolute;left:-10px;top:52%;height:10px;border-radius:5px;background:var(--k-paper);width:0"></i></span> <span class="w"><span>kitchens.</span></span>`;
    sw = { slot: $('.slot', h2), old: $('.old', h2), oldIn: $('.old > span', h2), nw: $('.new', h2), nwIn: $('.new > span', h2), strk: $('.strk', h2) };
  }
  // one kitchen: a full fridge, and good food going into the bin
  const A = mkWin(pin, 336, 'One kitchen');
  const fa = mkFridge(A, 100, FY, WS, { open: 1 });
  const bin = mkBin(A, 640, 526 - 236 * 1.05, 1.05, 3);
  const TOSS = S.mode === 'hook' ? [[4, 0.75], [1, 1.25], [8, 1.75], [5, 2.25], [10, 2.75], [3, 3.25]] : [];
  const flyers = TOSS.map(([slot, land]) => {
    const f = div('item', A); f.style.zIndex = 2; f.innerHTML = icon(FULL[slot], ITEM * WS);
    const sl = fa.slots[slot];
    if (S.mode === 'hook') cue(land, 'toss');
    return { f, slot, land, x0: 100 + sl.x, y0: FY + sl.y };
  });
  // another kitchen: the same fridge, nearly empty, its light flickering
  const B = mkWin(pin, 956, 'Another kitchen');
  const fb = mkFridge(B, 300, FY, WS, { open: 1, items: S.mode === 'hook' ? [, , , , , , 'jar'] : FULL });
  const FLICK = [[1.05, 1.13], [1.21, 1.26], [2.42, 2.55], [3.36, 3.41]];
  if (S.mode === 'hook') FLICK.forEach(([a]) => cue(a, 'flicker'));
  // Coupon joins the payoff and cheers when the kitchens are full
  let m = null;
  if (S.mode === 'payoff') {
    const host = div('abs', el); host.style.cssText = 'left:0;top:0;width:0;height:0;z-index:5';
    m = couponTree(host);
    cue(S.strike, 'strike'); cue(S.full, 'know'); cue(S.t0 + 0.6, 'enter');
  }
  const U = (t) => {
    const on = t >= S.t0 - 0.2 && t < S.t1 + 0.45;
    vis(el, on);
    if (!on) return;
    if (S.mode === 'hook') {
      const w = k(t, S.t1 - 0.15, S.t1 + 0.15, E.inOutQuart);           // leaves with a wipe up, like the plates
      el.style.clipPath = w > 0 ? `inset(0 0 ${(w * 100).toFixed(2)}% 0)` : 'none';
    } else {
      const w = k(t, S.t0 - 0.15, S.t0 + 0.15, E.inOutQuart);
      el.style.clipPath = w < 1 ? `inset(${((1 - w) * 100).toFixed(2)}% 0 0 0)` : 'none';
    }
    pin.style.transform = `scale(${(1 + 0.025 * cl((t - S.t0) / (S.t1 - S.t0))).toFixed(4)})`;
    // the bin: the lid opens for each toss, the food arcs in and drops out of sight
    let lid = 0;
    flyers.forEach((o) => {
      const t0 = o.land - 0.5, p = cl((t - t0) / 0.5);
      fa.setItem(o.slot, 1, t >= t0 ? 0 : 1);
      const show = t >= t0 && t < o.land + 0.25;
      vis(o.f, show);
      if (show) {
        const e = E.inOutSine(p), sink = k(t, o.land, o.land + 0.2, E.inCubic);
        const x = lerp(o.x0, bin.mouth.x, e), y = lerp(o.y0, bin.mouth.y - 10, e) - 190 * Math.sin(Math.PI * p) + sink * 120;
        o.f.style.transform = `translate(${(x - ITEM * WS / 2).toFixed(1)}px,${(y - ITEM * WS / 2).toFixed(1)}px) rotate(${(300 * p).toFixed(1)}deg) scale(${lerp(1, 0.86, p).toFixed(3)})`;
        o.f.style.transformOrigin = '50% 50%';
      }
      lid = Math.max(lid, k(t, o.land - 0.32, o.land - 0.12, E.outCubic) * (1 - k(t, o.land + 0.12, o.land + 0.3, E.inOutCubic)));
    });
    bin.setLid(lid * 62);
    if (S.mode === 'hook') {
      // the near-empty fridge: a weak light that flickers
      let l = 0.5 + 0.06 * Math.sin(t * 7.3);
      FLICK.forEach(([a, b]) => { if (t >= a && t < b) l = 0.12; });
      fb.setLight(l);
    } else {
      // payoff: "Different" is struck out on the beat before "Full" lands; the full fridge bounces and brightens
      if (!sw.wo) { sw.wo = sw.old.offsetWidth; sw.wn = sw.nw.offsetWidth; }
      const sp = k(t, S.strike, S.strike + 0.25, E.inOutCubic);
      sw.strk.style.width = ((sw.wo + 20) * sp).toFixed(1) + 'px';
      sw.strk.style.opacity = (1 - k(t, S.full, S.full + 0.2)).toFixed(2);
      sw.oldIn.style.transform = `translateY(${(-112 * k(t, S.full, S.full + 0.3, E.inCubic)).toFixed(1)}%)`;
      sw.nwIn.style.transform = `translateY(${((1 - k(t, S.full + 0.05, S.full + 0.45, E.site)) * 112).toFixed(1)}%)`;
      sw.slot.style.width = lerp(sw.wo, sw.wn, k(t, S.full, S.full + 0.35, E.inOutCubic)).toFixed(1) + 'px';
      const glow = Math.exp(-Math.max(0, t - S.full) * 3) * (t >= S.full ? 1 : 0);
      fb.setLight(0.82 + 0.18 * glow);
      fb.slots.forEach((sl, i) => {
        const d = t - (S.full + i * 0.035);
        fb.setItem(i, 1 + (d > 0 && d < 0.6 ? 0.22 * Math.exp(-d * 7) * Math.sin(d * 22) : 0));
      });
      // Coupon: hops in at the bottom right, cheers on "Full"
      const pr = k(t, S.t0 + 0.3, S.t0 + 0.85, E.outBack);
      const cheer = k(t, S.full - 0.05, S.full + 0.2, E.outCubic);
      setCouponTree(m, { x: 892 + (1 - pr) * 280, y: 1500 - Math.sin(Math.PI * Math.min(1, pr)) * 70, scale: 0.7 * Math.max(0.001, pr),
        squash: Math.max(0, 1 - Math.abs(t - S.t0 - 0.85) / 0.12) * 0.35 + Math.max(0, 1 - Math.abs(t - S.full - 0.1) / 0.12) * 0.25,
        sway: Math.sin(t * 2.1) * 2.5, blink: blinkAt(t, 9), gaze: cheer > 0.5 ? [-0.3, -0.2] : [-0.9, -0.1], smile: 1, brows: 0.2 + 0.3 * cheer,
        armL: lerp(40, 150, cheer) + Math.sin(t * 11) * 8 * cheer, armR: lerp(40, 150, cheer) + Math.sin(t * 11 + 1) * 8 * cheer, mouth: 0.6 * cheer });
    }
  };
  SPLITS.push(U);
}

// ------------------------------------------------------------------ plates (the upper stage while Coupon talks below)
function bStat(P) {
  const o = P.o;
  const { pin } = mkPlate(P, o.bg, true);
  const y = 150;
  const num = numeral(pin, o.num, o.size, y);
  const cap = div('abs serif', pin);
  cap.style.cssText = `left:70px;top:${(y + o.size * 0.92 + 18).toFixed(0)}px;width:940px;font-size:${o.size > 320 ? 66 : 80}px;line-height:1.06;color:var(--k-paper)`;
  cap.innerHTML = o.cap;
  let cr = null, note = null;
  if (o.credit) { cr = div('credit', pin); cr.style.cssText = 'position:absolute;left:70px;top:796px;color:rgb(255 255 255 / .92)'; cr.textContent = o.credit; }
  if (o.note) { note = div('sans', pin); note.style.cssText = `position:absolute;left:70px;top:${o.credit ? 842 : 800}px;font-size:${o.credit ? 26 : 32}px;line-height:1.25;color:rgb(255 255 255 / .78);width:920px`; note.textContent = o.note; }
  cue(P.t0 + 0.3, 'fill');
  return (t) => {
    const tl = t - P.t0;
    const pop = k(tl, 0.05, 0.55, E.outBack);
    num.el.style.transform = `scale(${lerp(0.9, 1, pop).toFixed(4)})`; num.el.style.opacity = k(tl, 0.0, 0.2).toFixed(2);
    setFill(num, k(tl, 0.3, 1.1, E.inOutSine));
    fadeUp(cap, t, P.t0 + 0.55, 0.5, 18);
    if (cr) fadeUp(cr, t, P.t0 + 0.8, 0.45, 12);
    if (note) fadeUp(note, t, P.t0 + 1.0, 0.45, 10);
  };
}
// the bridge from the clip: "Hunger isn't only far away."
function bLine(P) {
  const { pin } = mkPlate(P, PAPER);
  const l1 = div('abs serif', pin); l1.style.cssText = 'left:70px;top:230px;width:940px;font-size:150px;line-height:1;color:var(--k-ink)';
  const w1 = words(l1, 'Hunger isn’t');
  const l2 = div('abs serif', pin); l2.style.cssText = 'left:70px;top:400px;width:940px;font-size:150px;line-height:1;color:var(--k-ink)';
  l2.classList.add('words');
  l2.innerHTML = `<span class="w"><span>only</span></span> <span style="position:relative;display:inline-block"><span class="w"><span>far</span></span> <span class="w"><span>away.</span></span><svg viewBox="0 0 600 30" preserveAspectRatio="none" style="position:absolute;left:0;bottom:-0.06em;width:100%;height:0.16em;overflow:visible"><path d="M4 20 C 150 6, 420 6, 596 18" fill="none" stroke="var(--k-green)" stroke-width="7" stroke-linecap="round" vector-effect="non-scaling-stroke" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/></svg></span>`;
  const w2 = [...l2.querySelectorAll('.w > span')], path = $('path', l2);
  return (t) => {
    rise(w1, t, P.t0 + 0.15, 0.1, 0.55);
    rise(w2, t, P.t0 + 0.45, 0.1, 0.55);
    path.setAttribute('stroke-dashoffset', (1 - k(t, P.t0 + 1.0, P.t0 + 1.5, E.inOutCubic)).toFixed(3));
  };
}
// the site's own words: "gift cards for the groceries, medicine and rides they asked for"
function bNeeds(P) {
  const { pin } = mkPlate(P, INK, true);
  const st = 'fill="none" stroke="hsl(123 46% 62%)" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"';
  const rows = [
    ['Groceries.', `<path d="M8 22 H22 L34 70 H80 L90 36 H28" ${st}/><circle cx="40" cy="84" r="7" ${st}/><circle cx="74" cy="84" r="7" ${st}/>`],
    ['Medicine.', `<rect x="28" y="32" width="44" height="58" rx="8" ${st}/><rect x="24" y="12" width="52" height="20" rx="5" ${st}/><path d="M40 61 H60 M50 51 V71" ${st}/>`],
    ['Rides.', `<path d="M10 68 V54 L22 30 H78 L90 54 V68 Z" ${st}/><circle cx="30" cy="72" r="9" ${st}/><circle cx="70" cy="72" r="9" ${st}/><path d="M24 50 H76" ${st}/>`],
  ].map(([word, svg], i) => {
    const r = div('abs', pin); r.style.cssText = `left:70px;top:${150 + i * 230}px;width:940px;height:190px;display:flex;align-items:center;gap:44px`;
    r.innerHTML = `<svg viewBox="0 0 100 100" width="170" height="170" style="flex:none">${svg}</svg>`;
    const w = div('serif', r); w.style.cssText = 'font-size:150px;line-height:1;color:var(--k-paper)';
    const sp = words(w, word);
    const at = P.o && P.o.rows ? P.o.rows[i] : P.t0 + 0.1 + i * 0.5;
    cue(at, 'step');
    return { r, sp, ic: r.querySelector('svg'), at };
  });
  return (t) => {
    rows.forEach((o) => {
      rise(o.sp, t, o.at, 0.1, 0.55);
      const p = k(t, o.at, o.at + 0.45, E.outBack);
      o.ic.style.transform = `scale(${lerp(0.4, 1, p).toFixed(3)})`; o.ic.style.opacity = k(t, o.at, o.at + 0.15).toFixed(2);
    });
  };
}

// real phone-width screens of the live donate flow (captured for "Hope vs. Know", ../../work/captures/mobile)
function img(parent, name, w) {
  const im = document.createElement('img'); im.src = `${MOB}${name}.png`; im.style.width = w + 'px'; im.style.opacity = 0; parent.appendChild(im);
  return im;
}
const SW_ = 788, S0 = SW_ / 358;
function bSite(P, def) {
  const { pin } = mkPlate(P, PAPER);
  const label = div('abs serif', pin); label.style.cssText = 'left:70px;top:146px;width:940px;font-size:92px;line-height:1;color:var(--k-ink)';
  const lab = words(label, def.label);
  const fr = div('screenf', pin); fr.style.top = '290px';
  const frames = {};
  def.states.forEach((s) => { if (!frames[s.img]) frames[s.img] = img(fr, s.img, SW_); });
  const dot = div('touch', fr), rip = div('ripple', fr);
  const marks = (def.marks || []).map((m) => ({ ...m, el: div('marker', fr) }));
  const D = P.t1 - P.t0;
  const camAt = (f) => {
    const c = def.cams; let a = c[0], b = c[0];
    for (let i = 0; i < c.length; i++) { if (f >= c[i].at) { a = c[i]; b = c[Math.min(i + 1, c.length - 1)]; } }
    const e = a === b ? 0 : E.inOutCubic(cl((f - a.at) / (b.at - a.at)));
    return { y: lerp(a.y, b.y, e), z: lerp(a.z || 1, b.z || 1, e), x: lerp(a.x || 0, b.x || 0, e) };
  };
  const toScreen = (cam, x, y) => ({ x: (x - cam.x) * S0 * cam.z, y: (y - cam.y) * S0 * cam.z });
  (def.taps || []).forEach((tp) => cue(P.t0 + tp.at * D, 'tap'));
  return (t) => {
    const f = (t - P.t0) / D;
    rise(lab, t, P.t0 + 0.05, 0.1, 0.55);
    const cam = camAt(f), s = S0 * cam.z;
    let cur = def.states[0];
    def.states.forEach((st) => { if (f >= st.at) cur = st; });
    Object.entries(frames).forEach(([name, im]) => {
      im.style.opacity = name === cur.img ? 1 : 0;
      im.style.transform = `translate(${(-cam.x * s).toFixed(1)}px,${(-cam.y * s).toFixed(1)}px) scale(${cam.z.toFixed(4)})`;
      im.style.transformOrigin = '0 0';
    });
    const taps = def.taps || [];
    let on = false, px = 0, py = 0, press = 1, rp = 1, rpos = null;
    for (let i = 0; i < taps.length; i++) {
      const tp = taps[i], pos = toScreen(camAt(tp.at), tp.x, tp.y);
      const prev = taps[i - 1];
      const from = prev ? toScreen(camAt(prev.at), prev.x, prev.y) : { x: pos.x + 120, y: pos.y + 220 };
      const t0 = prev ? prev.at + 0.05 : tp.at - 0.3;
      if (f >= t0 && f <= tp.at + 0.16) { const e = E.inOutCubic(cl((f - t0) / (tp.at - 0.02 - t0))); px = lerp(from.x, pos.x, e); py = lerp(from.y, pos.y, e); on = true; }
      const d = (f - tp.at) * D;
      if (d > -0.05 && d < 0.18) press = 0.84;
      if (d > 0 && d < 0.4) { rp = d / 0.4; rpos = pos; }
    }
    vis(dot, on); dot.style.transform = `translate(${px.toFixed(1)}px,${py.toFixed(1)}px) scale(${press})`;
    rip.style.opacity = rpos ? (1 - E.outCubic(rp)).toFixed(2) : 0;
    if (rpos) rip.style.transform = `translate(${rpos.x.toFixed(1)}px,${rpos.y.toFixed(1)}px) scale(${lerp(0.5, 1.9, E.outCubic(rp)).toFixed(2)})`;
    marks.forEach((m) => {
      const p = k(f, m.from, m.from + 0.12, E.outBack) * (1 - k(f, m.to, m.to + 0.1));
      vis(m.el, p > 0.01);
      if (p > 0.01) {
        const a = toScreen(cam, m.css[0] - 6, m.css[1] - 4), b = toScreen(cam, m.css[0] + m.css[2] + 6, m.css[1] + m.css[3] + 4);
        m.el.style.cssText += `;left:${a.x.toFixed(1)}px;top:${a.y.toFixed(1)}px;width:${(b.x - a.x).toFixed(1)}px;height:${(b.y - a.y).toFixed(1)}px;opacity:${p.toFixed(2)};transform:scale(${lerp(0.96, 1, p).toFixed(3)})`;
      }
    });
  };
}
const bStores = (P) => bSite(P, {
  label: 'Pick the stores.',
  states: [{ at: 0, img: 'donate-1-empty' }, { at: 0.22, img: 'donate-1-chosen-1' }, { at: 0.46, img: 'donate-1-chosen-2' }],
  cams: [{ at: 0, y: 140 }, { at: 0.55, y: 140 }, { at: 0.78, y: 523 }],
  taps: [{ at: 0.2, x: 262, y: 312 }, { at: 0.44, x: 98, y: 312 }, { at: 0.92, x: 250, y: 746 }],
});
const bAmount = (P) => bSite(P, {
  label: 'Choose an amount.',
  states: [{ at: 0, img: 'donate-2-amount' }, { at: 0.42, img: 'donate-2-fifty' }],
  cams: [{ at: 0, y: 185 }, { at: 0.42, y: 185 }, { at: 0.6, y: 455 }],
  taps: [{ at: 0.38, x: 290, y: 272 }],
});
const bReview = (P) => bSite(P, {
  label: 'Pay by card.',
  states: [{ at: 0, img: 'donate-3-review' }],
  cams: [{ at: 0, y: 360 }, { at: 0.4, y: 360 }, { at: 0.62, y: 1338 }],
  marks: [{ from: 0.16, to: 0.4, css: [50, 558, 288, 48] }, { from: 0.7, to: 0.86, css: [20, 1384, 318, 60] }, { from: 0.86, to: 1.2, css: [42, 1534, 296, 58] }],
  taps: [{ at: 0.78, x: 179, y: 1414 }],
});

// ------------------------------------------------------------------ end card: "Help fill a kitchen.", logo, the site, the footer's disclaimer
let END = null;
function buildEnd() {
  const el = div('abs', stage); el.style.cssText = 'left:0;top:0;width:1080px;height:1920px;background:var(--k-paper);z-index:300;display:none;overflow:hidden';
  const h = div('abs serif', el); h.style.cssText = 'left:40px;top:290px;width:1000px;font-size:164px;line-height:0.98;color:var(--k-ink);text-align:center';
  h.innerHTML = '<span class="w"><span>Help</span></span> <span class="w"><span>fill</span></span><br><span class="w"><span>a</span></span> <span class="w"><span>kitchen.</span></span>';
  // who the money helps, said plainly: the clip shows people elsewhere
  h.classList.add('words');
  const spans = [...h.querySelectorAll('.w > span')];
  const lock = div('lockup', el, `<img src="/brand/logo-256.webp" alt=""><div><div class="wm"><span class="c">Coupon</span><span class="d">Donation</span></div><div class="tag">Transforming Giving</div></div>`);
  lock.style.cssText += ';left:100px;top:730px';
  const tagl = div('abs sans', el); tagl.style.cssText = 'left:0;right:0;top:1015px;text-align:center;font-size:50px;font-weight:600;color:var(--k-ink)';
  tagl.innerHTML = 'Donate at <span style="color:var(--k-green)">coupondonation.com</span>';
  const us = div('abs sans', el); us.style.cssText = 'left:0;right:0;top:1092px;text-align:center;font-size:36px;font-weight:600;color:var(--k-ink)';
  us.textContent = 'Your gift helps families in the U.S.';
  const fine = div('fine', el); fine.style.cssText += ';position:absolute;left:70px;top:1185px;width:640px;font-size:24px';
  fine.innerHTML = 'The people in the clips above are not CouponDonation recipients, and gifts do not reach them. Store names and logos shown on CouponDonation are trademarks of their owners. Those stores are not affiliated with, and do not sponsor or endorse, CouponDonation. CouponDonation Inc. is not a registered charity, and gifts are not tax-deductible.';
  const host = div('abs', el); host.style.cssText = 'left:0;top:0;width:0;height:0';
  const m = couponTree(host); m.svg.style.zIndex = 5;
  END = { el, spans, lock, tagl, us, fine, m, t0: END_T };
  cue(END_T + 0.2, 'end');
}
function updateEnd(t) {
  const t0 = END.t0, tl = t - t0;
  const on = tl > -0.2;
  vis(END.el, on);
  if (!on) return;
  const w = k(t, t0 - 0.15, t0 + 0.2, E.inOutQuart);
  END.el.style.clipPath = w < 1 ? `inset(${((1 - w) * 100).toFixed(2)}% 0 0 0)` : 'none';
  rise(END.spans, t, t0 + 0.25, 0.1, 0.6);
  const lw = END.lock.offsetWidth || 780;
  END.lock.style.left = ((1080 - lw) / 2).toFixed(1) + 'px';
  fadeUp(END.lock, t, t0 + 0.75, 0.55, 30);
  fadeUp(END.tagl, t, t0 + 1.05, 0.5, 18);
  fadeUp(END.us, t, t0 + 1.2, 0.5, 14);
  fadeUp(END.fine, t, t0 + 1.4, 0.5, 10);
  const pr = k(t, t0 + 0.15, t0 + 0.65, E.outBack);
  setCouponTree(END.m, { x: 884 + (1 - pr) * 260, y: 1575 - Math.sin(Math.PI * Math.min(1, pr)) * 60, scale: 0.9 * Math.max(0.001, pr), squash: Math.max(0, 1 - Math.abs(tl - 0.65) / 0.12) * 0.4, sway: Math.sin(t * 2.1) * 2.5, blink: blinkAt(t, 5), ...WAVE(t), gaze: [-0.4, 0.1], mouth: SPEAK.filter(([a]) => a >= END_T - 0.3).reduce((m, [a, b]) => Math.max(m, t >= a && t < b + 0.05 ? talk(t, a, b, 7.5) : 0), 0) });
}

// ------------------------------------------------------------------ the panel: Coupon, its subtitle bubble, and the kitchen it is filling
const CHAT = {};
function buildChat() {
  CHAT.panel = div('', stage); CHAT.panel.id = 'panel';
  CHAT.fr = mkFridge(stage, 76, 1186, 0.78, { open: 1, items: FULL, z: 120 });
  CHAT.fr.wrap.style.zIndex = 120;
  const host = div('abs', stage); host.style.cssText = 'left:0;top:0;width:0;height:0;z-index:126';
  CHAT.m = couponTree(host);
  CHAT.bub = mkBubble();
  CHAT.lines = LINES.map(([t0, t1, text], i) => prepLine({ who: 'coupon', t0, t1, text, i }));
  VO.forEach(([t0, d, text], i) => cue(t0, 'vo', { i, d, text }));
  // the fill order: every slot but the jar that was already there
  CHAT.order = [0, 1, 2, 3, 4, 5, 7, 8, 9, 10, 11];
  POPS.forEach((p, i) => cue(p, 'pop', { i }));
}
function mkBubble() {
  const b = div('bubble coupon', stage);
  const tail = div('tail', b);
  b.style.transformOrigin = 'calc(100% - 150px) 100%';
  tail.style.right = '128px';
  return { el: b, tail, cur: -1 };
}
function parseWords(text) {
  const out = []; let em = false;
  text.split(' ').forEach((tok) => {
    if (tok === '|') { out.push({ br: true }); return; } // a chosen line break
    let w = '';
    for (const ch of tok) { if (ch === '*') { em = !em; } else w += ch; }
    if (w) out.push({ w, em: em || tok.includes('*') });
    if (tok.endsWith('*')) em = false;
  });
  return out;
}
function prepLine(L) {
  const all = parseWords(L.text), ws = all.filter((x) => !x.br);
  const wts = ws.map((x) => Math.max(2, x.w.length) + (/[,.?…]$/.test(x.w) ? 2.5 : 0));
  const sum = wts.reduce((a, b) => a + b, 0);
  let acc = 0; L.wt = wts.map((wgt) => { const a = L.t0 + (L.t1 - L.t0) * (acc / sum); acc += wgt; return a; });
  L.ws = ws;
  let wi = 0;
  L.html = all.map((x) => (x.br ? '<br>' : `<span class="wd${x.em ? ' em' : ''}" data-i="${wi++}">${x.w}</span>`)).join(' ');
  L.has_em = ws.some((x) => x.em);
  return L;
}
function measureLines() {
  const probe = mkBubble(); probe.el.style.visibility = 'hidden'; probe.el.style.display = 'block';
  CHAT.lines.forEach((L) => { probe.el.innerHTML = L.html; probe.el.appendChild(div('tail', probe.el)); L.w = probe.el.offsetWidth; L.h = probe.el.offsetHeight; });
  probe.el.remove();
}
const BUB_BOTTOM = 1166;
const lineEnd = (L) => { const next = CHAT.lines[L.i + 1]; return Math.min(L.t1 + 0.45, next ? next.t0 - 0.06 : PAY.t0); };
function updateBubbles(t) {
  const L = CHAT.lines.find((x) => t >= x.t0 - 0.02 && t < lineEnd(x));
  const B = CHAT.bub, el = B.el;
  if (!L) { vis(el, false); return; }
  if (B.cur !== L.i) { el.innerHTML = L.html; el.appendChild(B.tail); B.cur = L.i; B.wd = [...el.querySelectorAll('.wd')]; }
  vis(el, true);
  el.style.left = (960 - L.w) + 'px'; el.style.top = (BUB_BOTTOM - L.h) + 'px';
  const end = lineEnd(L);
  const pop = k(t, L.t0, L.t0 + 0.22, E.outBack), out = k(t, end - 0.1, end, E.inCubic);
  const prev = CHAT.lines[L.i - 1]; const swap = prev && L.t0 - prev.t1 < 0.6;
  const s = swap ? lerp(0.96, 1, k(t, L.t0, L.t0 + 0.12)) : lerp(0.6, 1, pop);
  el.style.transform = `scale(${(s * (1 - 0.12 * out)).toFixed(4)})`;
  el.style.opacity = (swap ? 1 : cl(pop * 1.6)) * (1 - out);
  B.wd.forEach((n, i) => n.classList.toggle('on', t >= L.wt[i]));
}
function updatePanel(t) {
  // the kitchen: nearly empty with a weak, flickering light; each step of the donation puts something on its shelves
  const F = CHAT.fr;
  let filled = 0;
  CHAT.order.forEach((slot, i) => {
    const d = t - POPS[i];
    if (d >= 0) filled++;
    const p = d < 0 ? 0 : E.outBack(cl(d / 0.3));
    F.setItem(slot, p, d < 0 ? 0 : 1);
  });
  F.setItem(6, 1);
  const frac = filled / POPS.length;
  let l = filled ? 0.62 + 0.38 * frac : 0.5 + 0.06 * Math.sin(t * 7.3);
  if (!filled && ((t > 1.6 && t < 1.66) || (t > 3.4 && t < 3.5))) l = 0.12;
  F.setLight(l);
  // Coupon: hops in on its first line, glances at the fridge when something lands in it, points when it names a number
  const pin = k(t, ENTER, ENTER + 0.55, E.outBack);
  const sp = SPEAK.find(([a, b]) => t >= a && t < b + 0.05);
  const bub = CHAT.lines.find((L) => t >= L.t0 && t < L.t1 + 0.3);
  const speak = sp ? { t0: sp[0], t1: sp[1], has_em: !!(bub && bub.has_em) } : null;
  const sx = 780 + (1 - pin) * 330, sy = 1526 - Math.sin(Math.PI * Math.min(1, pin)) * 80;
  const pose = { sway: Math.sin(t * 2.1) * 2.5, blink: blinkAt(t, 3), gaze: [-0.9, 0.45], smile: 1, armL: 40, armR: 40, brows: 0.15 };
  if (speak) {
    pose.mouth = talk(t, speak.t0 + 0.05, speak.t1 - 0.05, 7.5); pose.gaze = [-0.55, 0.1]; pose.brows = 0.45;
    const pt = speak.has_em ? k(t, speak.t0 + 0.25, speak.t0 + 0.7, E.inOutCubic) * (1 - k(t, speak.t1 - 0.25, speak.t1, E.inCubic)) : 0;
    pose.armL = lerp(40, 128, pt) + Math.sin(t * 9) * 3 * pt;
    pose.armR = 40 + 10 * Math.sin(t * 3.3);
  }
  const last = POPS.filter((p) => p <= t).pop();
  if (last !== undefined && t - last < 0.45) { pose.gaze = [-1, 0.35]; pose.brows = 0.5; pose.squash = 0.12 * Math.exp(-(t - last) * 8); }
  vis(CHAT.m.svg, pin > 0.001 && t < PAY.t0 + 0.5);
  setCouponTree(CHAT.m, { x: sx, y: sy, scale: 0.98 * Math.max(0.001, pin), ...pose, squash: (pose.squash || 0) + Math.max(0, 1 - Math.abs(t - ENTER - 0.55) / 0.12) * 0.35 });
}

// ------------------------------------------------------------------ build + frame
const BUILD = { stat: bStat, line: bLine, needs: bNeeds, stores: bStores, amount: bAmount, review: bReview };
const PL = [];
function renderFrame(t) {
  PL.forEach((P) => {
    const on = t >= P.t0 - 0.2 && t < P.t1 + 0.45;
    vis(P.el, on);
    if (!on) return;
    const w = P.i === 0 ? 1 : k(t, P.t0 - 0.15, P.t0 + 0.15, E.inOutQuart);
    P.el.style.clipPath = w < 1 ? `inset(${((1 - w) * 100).toFixed(2)}% 0 0 0)` : 'none';
    P.pin.style.transform = `scale(${(1 + 0.03 * cl((t - P.t0) / (P.t1 - P.t0))).toFixed(4)})`;
    P.update(t);
  });
  SPLITS.forEach((U) => U(t));
  updateBubbles(t);
  updatePanel(t);
  updateEnd(t);
}

async function init() {
  PLATES.forEach((p, i) => {
    const P = { ...p, i };
    const built = BUILD[p.type](P);
    const el = stage.querySelectorAll('.plate'); P.el = el[el.length - 1]; P.pin = P.el.querySelector('.pin');
    P.update = built;
    PL.push(P);
  });
  buildEnd();
  buildChat();
  await document.fonts.load('400 100px "Instrument Serif"');
  await document.fonts.load('600 40px "Instrument Sans"');
  await document.fonts.load('700 40px "Instrument Sans"');
  await document.fonts.ready;
  await Promise.all([...document.images].map((im) => (im.complete ? im.decode().catch(() => {}) : new Promise((r) => { im.onload = im.onerror = r; }))));
  measureLines();
  CHAT.lines.forEach((L) => { cue(L.t0, 'line', { who: 'coupon', n: L.ws.length, em: L.has_em }); });
  cue(ENTER, 'enter');
  CUES.sort((a, b) => a.t - b.t);
  renderFrame(0);
  window.compDuration = DUR;
  window.compReady = true;
}
window.renderFrame = async (t) => {
  renderFrame(t);
  await new Promise((r) => requestAnimationFrame(() => r()));
};
init().catch((e) => { window.compError = String((e && e.stack) || e); });
