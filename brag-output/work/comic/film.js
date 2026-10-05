// "Level 1: your first donation": comic donor-onboarding film for CouponDonation (v2).
// One timeline, two formats: ?f=h (1920x1080) and ?f=v (1080x1920, social-safe layout).
// Real assets: compiled /src/index.css tokens + fonts, the app's own donate/success/security
// markup (../markup/*.frag), local brand SVGs and the logo. Copy lives in TXT; every cue is
// relative to its scene start (SC), exported as window.compT for the score.
import * as C from './comic.js';
const { k, E, cl, lerp, vis, div, hash } = C;

const FMT = new URLSearchParams(location.search).get('f') === 'v' ? 'v' : 'h';
const V = FMT === 'v';
const W = V ? 1080 : 1920, H = V ? 1920 : 1080;
const L = (h, v) => (V ? v : h);
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

// ------------------------------------------------------------------ copy (verified against the repo)
const TXT = {
  title: 'Where does your <i>$50</i> go?',
  hi: "I'm <em>Coupon</em>.<br>Tap along!",
  find: 'Tap <em>Donate now</em>,<br>or <em>Start Donating</em>.',
  findNote: 'Both doors, same 3 steps.',
  stores: 'Choose where your<br>help can be used.',
  storesNote: 'Up to 5 stores, $5 minimum each.',
  quizQ: 'Quiz! 3 stores, $50.<br>How many coupons?',
  coupons: 'Coupons,<br><em>not cash.</em>',
  pay: 'Pay on a secure<br>checkout page.',
  coinsQ: '$50 = how many<br><b>Gold Coins</b>?',
  coinsNote: '10 Gold Coins per $1 donated.',
  track: 'Follow<br>the record.',
  trackNote: 'Emails come when the organizer receives it, and if they mark it used.',
  goal: 'One goal per fundraiser.<br><em>Fill it together.</em>',
  goalNote: 'Only completed donations count.',
  levelDone: 'Level 1 complete!',
  cta: 'Your turn.',
  ctaBtn: 'Find someone to help',
  ctaNote: 'Any amount from $5.',
};
const HUD_STEPS = ['Find', 'Stores', 'Amount', 'Coupons', 'Pay', 'Coins', 'Track', 'Goal'];

// ------------------------------------------------------------------ timeline (scene-relative cues)
const DURS = { hook: 3.5, find: 4.5, stores: 4.5, amount: 6.0, coupons: 3.5, pay: 5.0, coins: 6.0, track: 5.0, goal: 4.5, cta: 4.5 };
const SC = {}; let acc = 0;
for (const [n, d] of Object.entries(DURS)) { SC[n] = [acc, acc + d]; acc += d; }
const DUR = acc; // 47 s
const at = (scene, dt) => SC[scene][0] + dt;
const T = {
  trunk: at('hook', 1.0), ticketDrop: at('hook', 1.1), ticketLand: at('hook', 1.55), hookBubble: at('hook', 1.2),
  hudIn: at('find', -0.05),
  findBubble: at('find', 0.25), door: at('find', 1.6), findSteps: at('find', 1.9),
  storesBubble: at('stores', 0.2), walmart: at('stores', 0.6), target: at('stores', 1.05), amazon: at('stores', 1.5), storesNote: at('stores', 1.7),
  preset: at('amount', 0.55), sticker: at('amount', 0.8), quizQ: at('amount', 0.85), quizOpts: at('amount', 1.1), wrong: at('amount', 2.8), right: at('amount', 4.1),
  deal: at('coupons', 0.25), couponsBubble: at('coupons', 0.6), deckLbl: at('coupons', 0.95), stamp: at('coupons', 1.35),
  lock: at('pay', 0.2), payBubble: at('pay', 0.25), pay: at('pay', 2.0), wipe: at('pay', 2.45),
  bonus: at('coins', -0.3), coinsQ: at('coins', 0.45), coinOpts: at('coins', 0.75), coinWrong: at('coins', 2.2), coin: at('coins', 2.85),
  mail: at('track', 0.15), trackBubble: at('track', 0.3), hops: [0.9, 1.4, 1.9, 2.4].map((d) => at('track', d)), trackNote: at('track', 1.0),
  goalBubble: at('goal', 0.2), g1: at('goal', 0.9), g2: at('goal', 1.5), g3: at('goal', 2.0), funded: at('goal', 2.5), levelDone: at('goal', 2.9),
  ctaHead: at('cta', 0.2), ctaBtn: at('cta', 0.75), ctaNote: at('cta', 1.1), plate: at('cta', 1.4), url: at('cta', 1.6),
};
const CHECK = [at('find', 2.0), at('stores', 1.9), T.right + 0.3, T.stamp + 0.1, T.wipe + 0.05, T.coin + 0.25, T.hops[3] + 0.1, T.funded];
const TAPS = { trunk: T.trunk, door: T.door, walmart: T.walmart, target: T.target, amazon: T.amazon, preset: T.preset, right: T.right, pay: T.pay, coin: T.coin, g1: T.g1 };
window.compT = { SC, T, CHECK, TAPS, DUR };

// ------------------------------------------------------------------ helpers
const stage = $('#stage');
stage.style.width = W + 'px'; stage.style.height = H + 'px';
const box = (el, x, y, w, h) => { el.style.left = x + 'px'; el.style.top = y + 'px'; if (w != null) el.style.width = w + 'px'; if (h != null) el.style.height = h + 'px'; return el; };
const layer = (cls = '') => div(`layer ${cls}`, stage);
async function fetchText(u) { const r = await fetch(u); if (!r.ok) throw new Error(u); return r.text(); }
function frag(html) { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstElementChild; }
function strip(root) { [root, ...$$('*', root)].forEach((n) => { if (n.classList) [...n.classList].filter((c) => /^animate-|^stagger/.test(c)).forEach((c) => n.classList.remove(c)); if (n.getAttribute && /opacity:\s*0(?![.\d])/.test(n.getAttribute('style') || '')) n.removeAttribute('style'); }); return root; }
const press = (t, tt, amt = 0.08) => { const d = t - tt; return d > -0.06 && d < 0.2 ? 1 - amt * Math.sin(Math.PI * cl((d + 0.06) / 0.26)) : 1; };
const ICON = {
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
  heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>',
  share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></svg>',
  coins: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/></svg>',
  mail: '<svg viewBox="0 0 64 44"><rect x="3" y="3" width="58" height="38" rx="4" fill="#fff" stroke="hsl(123 20% 7%)" stroke-width="5"/><path d="M5 6 32 26 59 6" fill="none" stroke="hsl(123 20% 7%)" stroke-width="5" stroke-linejoin="round"/></svg>',
};

// ------------------------------------------------------------------ geometry
// V keeps all text inside the social-safe area (y 220-1600, x <= 940); panels sit between the HUD and Coupon.
const PANEL = L({ x: 60, y: 150, w: 1800, h: 890 }, { x: 40, y: 400, w: 1000, h: 1020 });
const BUB = L(null, { x: 330, y: 1425, w: 610, tail: { x: -0.13, y: 0.5 } }); // V: every Coupon bubble sits right of Coupon
const GUIDE = V
  ? { hook: [380, 1480, 1.2], find: [175, 1700, 0.85], stores: [175, 1700, 0.85], amount: [175, 1700, 0.85], coupons: [175, 1700, 0.85], pay: [175, 1700, 0.85], coins: [175, 1700, 0.85], track: [175, 1700, 0.85], goal: [175, 1700, 0.85], cta: [540, 1720, 0.8] }
  : { hook: [770, 1040, 1.2], find: [1740, 1075, 0.92], stores: [330, 1070, 1.05], amount: [1790, 1075, 0.62], coupons: [1700, 1070, 1.0], pay: [1720, 1070, 1.0], coins: [300, 1070, 1.0], track: [1720, 1070, 1.0], goal: [1720, 1075, 0.95], cta: [300, 1075, 1.0] };
const TALK = { hook: [T.hookBubble + 0.2, T.hookBubble + 1.1], find: [T.findBubble, T.findBubble + 1.1], stores: [T.storesBubble, T.storesBubble + 1.0], coupons: [T.couponsBubble, T.couponsBubble + 0.8], pay: [T.payBubble, T.payBubble + 1.0], coins: [T.coinsQ, T.coinsQ + 1.0], track: [T.trackBubble, T.trackBubble + 0.7], goal: [T.goalBubble, T.goalBubble + 1.2] };
function speech(parent, text, h, opts = {}) {
  // H: per-scene placement passed in; V: shared slot next to Coupon
  const o = V ? { w: BUB.w, h: opts.vh || 170, tail: BUB.tail, x: BUB.x, y: opts.vy || BUB.y } : opts;
  const b = C.bubble(parent, { text, w: o.w, h: o.h || 170, tail: o.tail, fs: L(40, 42) });
  box(b, o.x, o.y);
  return b;
}
function panel(scene, cls = '', bg) { const p = div(`panel ${cls}`, scene); box(p, PANEL.x, PANEL.y, PANEL.w, PANEL.h); if (bg) p.style.background = bg; return p; }

// ------------------------------------------------------------------ persistent layers
const bg = layer(); vis(bg, true);
div('paper', bg);
const dots = div('halftone fade-b', bg); dots.style.setProperty('--dot', 'hsl(123 46% 34% / 0.13)'); dots.style.setProperty('--ds', '26px');
const scenes = {};
for (const name of Object.keys(DURS)) scenes[name] = layer(`scene-${name}`);
const fx = layer(); fx.style.zIndex = 40; vis(fx, true);
const hudLayer = layer(); hudLayer.style.zIndex = 30; vis(hudLayer, true);
const hud = C.hud(hudLayer, HUD_STEPS);
box(hud, L(300, 70), L(30, 236), L(1320, 870));
hud.style.fontSize = L('26px', '26px');
$('.hud-title', hud).textContent = 'Level 1 · Your first donation';
if (V) $$('.hud-lbl', hud).forEach((n, i) => n.classList.toggle('alt', i % 2 === 1));
const guide = C.treeGuide(fx);
const cursor = C.tapPrompt(fx); cursor.style.zIndex = 60;
const B = {};

// ------------------------------------------------------------------ builders
function buildHook() {
  const s = scenes.hook;
  B.hookBurst = C.burst(s, { r: L(330, 300), spikes: 18, fill: 'hsl(123 46% 85%)', seed: 4 });
  const t = div('big-serif serif', s, TXT.title);
  box(t, L(0, 100), L(150, 300), L(W, 840)); t.style.textAlign = 'center'; t.style.fontSize = L('160px', '136px'); t.style.zIndex = 2;
  B.hookTitle = t;
  B.hookTicket = C.mascot(fx); B.hookTicket.svg.style.zIndex = 41;
  B.lvlSfx = C.sfx(fx, 'Level 1!', { size: L(120, 104), fill: 'hsl(123 46% 45%)', rot: -6 });
  B.popSfx = C.sfx(fx, 'Pop!', { size: L(84, 80), fill: 'hsl(120 8% 98.5%)', rot: 8 });
  B.hookBubble = C.bubble(s, { text: TXT.hi, w: L(520, 520), h: L(180, 180), tail: L({ x: -0.18, y: 0.8 }, { x: 0.22, y: 1.6 }), fs: L(44, 46) });
  box(B.hookBubble, L(1010, 420), L(470, 800));
}

function buildFind() {
  const s = scenes.find;
  const pL = div('panel green', s), pR = div('panel', s);
  if (!V) { box(pL, 60, 150, 880, 700); box(pR, 980, 150, 880, 700); } else { box(pL, 40, 400, 1000, 570); box(pR, 40, 990, 1000, 250); }
  pR.style.background = 'hsl(var(--card))';
  B.frCard = div('fr-panel', pL);
  B.frCard.innerHTML = `<svg class="fr-ring" viewBox="0 0 200 200"><circle cx="100" cy="100" r="80" fill="none" stroke="hsl(123 18% 86%)" stroke-width="16"/><circle cx="100" cy="100" r="80" fill="none" stroke="hsl(123 46% 34%)" stroke-width="16" stroke-linecap="round" transform="rotate(-90 100 100)" stroke-dasharray="502.65" stroke-dashoffset="330"/></svg>
    <div class="fr-ring-lbl">Example goal</div>
    <div class="goal-btn primary fr-donate">${ICON.heart}<span>Donate now</span></div>
    <div class="goal-btn ink fr-share">${ICON.share}<span>Share</span></div>`;
  box(B.frCard, L(90, 150), L(50, 0), 700, 700);
  if (V) { B.frCard.style.transformOrigin = '50% 0'; B.frCard.style.transform = 'scale(0.82)'; }
  const lbl = div('door-label serif', pR, 'or straight from the menu'); box(lbl, 0, L(110, 30), L(880, 1000)); lbl.style.textAlign = 'center'; lbl.style.fontSize = L('46px', '44px');
  const nav = div('real-nav', pR, `<a class="inline-flex items-center gap-2 bg-primary text-primary-foreground font-medium rounded-md px-5 py-2.5">${ICON.coins.replace('<svg ', '<svg class="w-5 h-5" ')}Start Donating</a>`);
  box(nav, 0, L(250, 110), L(880, 1000)); nav.style.textAlign = 'center';
  B.navBtn = $('a', nav); B.navBtn.style.fontSize = L('42px', '42px');
  const steps = div('find-steps', s, ['Choose Brands', 'Select Amount', 'See Impact'].map((l, i) => `<div class="flex items-center gap-2 border-b-2 px-3 py-2 ${i === 0 ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}"><span class="font-bold">${i + 1}</span><span class="font-medium">${l}</span></div>`).join(''));
  box(steps, 0, L(880, 1265), W); B.findSteps = steps;
  B.findNote = div('note-line', s, TXT.findNote); box(B.findNote, 0, L(975, 1345), W);
  B.findBubble = speech(s, TXT.find, 0, { x: 1110, y: 520, w: 640, h: 170, tail: { x: 0.92, y: 1.55 } });
}

async function buildStores() {
  const s = scenes.stores;
  const p = div('panel', s); p.style.background = 'hsl(var(--card))';
  if (!V) box(p, 700, 150, 1160, 890); else box(p, PANEL.x, PANEL.y, PANEL.w, PANEL.h);
  const [h0, h3] = await Promise.all(['../markup/donate-card-0.frag', '../markup/donate-card-3.frag'].map(fetchText));
  const card = strip(frag(h0)), card3 = strip(frag(h3));
  const inner = card.firstElementChild; // .space-y-6 (no card wrapper: avoids card-on-card)
  const chipBar = $('.flex.flex-wrap.gap-2.p-3', card3);
  const wrap = document.createElement('div'); wrap.className = 'chipbar-wrap'; wrap.style.overflow = 'hidden'; wrap.appendChild(chipBar);
  inner.insertBefore(wrap, inner.children[1]);
  $$(':scope > *', inner).slice(3).forEach((n) => n.remove());
  const ui = div('ui-scale', p); ui.appendChild(inner); ui.style.width = '688px';
  box(ui, L(90, 70), L(110, 130)); ui.style.transform = `scale(${L(1.42, 1.25)})`;
  B.chipWrap = wrap; B.chipBar = chipBar; B.chips = $$(':scope > div', chipBar); B.chipCount = $(':scope > span', chipBar);
  B.chipCount.style.fontSize = '20px';
  const sel3 = Object.fromEntries($$('.grid button', card3).map((b) => [$('img', b).alt, b]));
  B.brandBtns = ['Walmart', 'Target', 'Amazon'].map((name) => {
    const btn = $$('.grid button', inner).find((b) => $('img', b).alt === name);
    const bx = btn.firstElementChild, s3 = sel3[name];
    return { btn, box: bx, off: { b: btn.className, x: bx.className, i: bx.innerHTML }, on: { b: s3.className, x: s3.firstElementChild.className, i: s3.firstElementChild.innerHTML } };
  });
  const steps = div('flex justify-center gap-3', p, ['Choose Brands', 'Select Amount', 'See Impact'].map((l, i) => `<div class="flex items-center gap-2 border-b-2 px-3 py-2 text-sm ${i === 0 ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}"><span class="flex h-5 w-5 items-center justify-center text-xs font-bold">${i + 1}</span><span class="font-medium">${l}</span></div>`).join(''));
  box(steps, 0, 26, L(1160, 1000)); steps.style.transform = `scale(${L(1.3, 1.3)})`; steps.style.transformOrigin = '50% 0';
  B.storesNote = div('note-line', s, TXT.storesNote); box(B.storesNote, L(700, 40), L(960, 1300), L(1160, 1000));
  B.storesBubble = speech(s, TXT.stores, 0, { x: 50, y: 230, w: 600, h: 170, tail: { x: 0.45, y: 1.55 } });
  B.tapSfx = [0, 1, 2].map(() => C.sfx(fx, 'Tap!', { size: L(84, 84), fill: 'hsl(123 46% 45%)', rot: -8 }));
}

async function buildAmount() {
  const s = scenes.amount;
  const p = div('panel', s); p.style.background = 'hsl(var(--card))';
  if (!V) box(p, 60, 150, 1060, 890); else box(p, 40, 400, 1000, 580);
  const card = strip(frag(await fetchText('../markup/donate-step2.frag')));
  const inner = card.firstElementChild;
  // keep heading, big amount + counter, preset row (drop brand header, slider, breakdown, back/continue)
  const kids = $$(':scope > *', inner);
  const keep = kids.filter((n) => /Select Donation Amount|\$50(?!\d)|\$10(?!\d)/.test(n.textContent) && !/Breakdown|Back|\$500/.test(n.textContent));
  kids.forEach((n) => { if (!keep.includes(n)) n.remove(); });
  const ui = div('ui-scale', p); ui.appendChild(inner); ui.style.width = '688px';
  box(ui, L(80, 70), L(70, 40)); ui.style.transform = `scale(${L(1.32, 1.25)})`;
  B.presets = $$('button', inner).filter((b) => /^\$\d+$|^Custom$/.test(b.textContent.trim()));
  B.preset50 = B.presets.find((b) => b.textContent.trim() === '$50');
  B.bigAmount = $$('*', inner).find((n) => n.childElementCount === 0 && n.textContent.trim() === '$50' && n.tagName !== 'BUTTON');
  B.counter = $$('div', inner).find((n) => /^=\s*\d+ coupons for families$/.test(n.textContent.trim()));
  B.counterSpan = B.counter ? $('span', B.counter) : null;
  if (B.counter) B.counter.style.fontSize = '24px';
  // quiz: a narration caption (no speaker) + three answers; the real counter is the answer
  B.quizCap = div('caption quiz-cap', s, TXT.quizQ);
  if (!V) box(B.quizCap, 1170, 190, 690); else box(B.quizCap, 70, 1000, 870);
  B.quizCap.style.fontSize = L('44px', '42px');
  B.quizOpts = ['6', '9', '12'].map((n, i) => {
    const o = div('quiz-opt', s, `<span class="key">${String.fromCharCode(65 + i)}</span><span>${n} coupons</span><div class="strike"></div>`);
    if (!V) box(o, 1220, 400 + i * 135, 560, 108); else box(o, i === 2 ? 515 : 70 + i * 445, i === 2 ? 1290 : 1160, 410, 104);
    if (V && i === 2) box(o, 290, 1290, 410, 104);
    o.style.fontSize = L('42px', '40px');
    return o;
  });
  B.qSticker = div('q-sticker', fx, '?'); B.qSticker.style.zIndex = 45;
  B.quizSfx = C.sfx(fx, 'Nailed it!', { size: L(110, 84), fill: 'hsl(123 46% 45%)', rot: -6 });
}

function buildCoupons() {
  const s = scenes.coupons;
  const p = panel(s, 'green');
  const ht = div('halftone', p); ht.style.setProperty('--dot', 'hsl(123 46% 34% / 0.12)');
  B.speed = C.speedLines(p, { w: PANEL.w, h: PANEL.h, n: 72, color: 'hsl(123 46% 34%)' });
  const brands = ['/brand-logos/walmart.svg', '/brand-logos/target.svg', '/brand-logos/amazon.svg'];
  const deckX = V ? [215, 515, 815] : [400, 830, 1260], deckY = V ? 900 : 600;
  B.tickets = [];
  for (let j = 0; j < 3; j++) for (let b = 0; b < 3; b++) {
    const m = C.mascot(fx); m.svg.style.zIndex = 41;
    B.tickets.push({ m, b, j, start: T.deal + (j * 3 + b) * 0.075, to: { x: deckX[b] + (j - 1) * L(34, 22), y: deckY + (j - 1) * -14 }, seed: j * 3 + b });
  }
  B.deckLabels = brands.map((logo, b) => {
    const d = div(`deck-lbl${V ? ' col' : ''}`, s, `<img src="${logo}" alt=""><span>3 coupons</span>`);
    box(d, deckX[b] - L(200, 140), L(780, 1080), L(400, 280)); d.style.whiteSpace = 'nowrap'; return d;
  });
  B.stamp = div('stamp', s, '9 coupons for families');
  box(B.stamp, L(430, 110), L(190, 430), L(800, 820)); B.stamp.style.fontSize = L('76px', '64px');
  B.couponsBubble = speech(s, TXT.coupons, 0, { x: 1130, y: 870, w: 420, h: 170, tail: { x: 1.2, y: 0.3 } });
}

async function buildPay() {
  const s = scenes.pay;
  const sec = strip(frag(await fetchText('../markup/security.frag')));
  const p = panel(s, 'forest');
  const dg = div('halftone', p); dg.style.setProperty('--dot', 'hsl(120 8% 98.5% / 0.10)');
  const hh = div('big-serif serif', p, $('h2', sec).textContent); box(hh, L(80, 50), L(70, 60), L(900, 900)); hh.style.fontSize = L('92px', '84px');
  // comic padlock with a blue verification check (blue = verification only)
  const lock = C.svgEl('svg', { viewBox: '0 0 220 260', class: 'pay-lock' }, p);
  C.svgEl('path', { d: 'M60 112 V78 a50 50 0 0 1 100 0 V112', fill: 'none', stroke: 'hsl(123 20% 7%)', 'stroke-width': 22, 'stroke-linecap': 'round' }, lock);
  C.svgEl('path', { d: 'M60 112 V78 a50 50 0 0 1 100 0 V112', fill: 'none', stroke: 'hsl(120 8% 98.5%)', 'stroke-width': 9, 'stroke-linecap': 'round' }, lock);
  C.svgEl('rect', { x: 22, y: 106, width: 176, height: 138, rx: 22, fill: 'hsl(120 8% 98.5%)', stroke: 'hsl(123 20% 7%)', 'stroke-width': 9 }, lock);
  C.svgEl('circle', { cx: 110, cy: 176, r: 40, fill: 'hsl(212 80% 42%)', stroke: 'hsl(123 20% 7%)', 'stroke-width': 7 }, lock);
  C.svgEl('path', { d: 'M90 177 l14 14 26 -28', fill: 'none', stroke: '#fff', 'stroke-width': 11, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, lock);
  lock.style.position = 'absolute'; box(lock, L(700, 335), L(250, 260), L(330, 330), L(390, 390)); B.payLock = lock;
  // provider-neutral pay button (production may show Square, Stripe or both)
  B.payBtn = div('pay-btn', p, ICON.heart); box(B.payBtn, L(80, 350), L(700, 760));
  // the real thank-you page
  const succ = strip(frag(await fetchText('../markup/success-main.frag')));
  const sp = panel(s, '', 'hsl(var(--card))'); B.succPanel = sp;
  const st = div('big-serif serif', sp, $$('h1,h2', succ)[0].textContent); box(st, 0, L(250, 330), PANEL.w); st.style.textAlign = 'center'; st.style.fontSize = L('150px', '100px');
  const sub = [...$$('p', succ)].find((n) => /successfully processed/.test(n.textContent));
  const ss = div('note-line', sp, sub ? sub.textContent : ''); box(ss, L(0, 60), L(470, 640), L(PANEL.w, 820)); ss.style.fontSize = L('40px', '38px');
  B.succTitle = st;
  B.clickSfx = C.sfx(fx, 'Click!', { size: L(96, 90), fill: 'hsl(120 8% 98.5%)', rot: -10 });
  B.payBubble = speech(s, TXT.pay, 0, { x: 1010, y: 800, w: 520, h: 170, tail: { x: 1.22, y: 0.35 } });
}

function coinSvg(parent) {
  // Gold Coins are drawn in logo blue (the product's own styling), with no '$' (they carry no cash value)
  const svg = C.svgEl('svg', { viewBox: '-50 -50 100 100', class: 'coin' }, parent);
  C.svgEl('circle', { r: 40, fill: 'hsl(212 80% 93%)', stroke: 'hsl(212 80% 42%)', 'stroke-width': 8 }, svg);
  C.svgEl('circle', { r: 26, fill: 'none', stroke: 'hsl(212 80% 42%)', 'stroke-width': 5 }, svg);
  C.svgEl('path', { d: 'M0 -12 L3.5 -3.7 12 -3.7 5.2 1.6 7.6 10 0 5 -7.6 10 -5.2 1.6 -12 -3.7 -3.5 -3.7 Z', fill: 'hsl(212 80% 42%)' }, svg);
  return svg;
}
function buildCoins() {
  const s = scenes.coins;
  const p = panel(s, '', 'hsl(var(--card))');
  const dg = div('halftone', p); dg.style.setProperty('--dot', 'hsl(212 80% 42% / 0.10)');
  B.coinsBubble = speech(s, TXT.coinsQ, 0, { x: 560, y: 190, w: 700, h: 190, tail: { x: 0.15, y: 1.5 } });
  B.coinOpts = ['50', '500'].map((n, i) => {
    const o = div('quiz-opt', s, `<span class="key">${String.fromCharCode(65 + i)}</span><span>${n}</span><div class="strike"></div>`);
    if (!V) box(o, 620 + i * 420, 470, 360, 130); else box(o, 90 + i * 440, 1180, 400, 140);
    o.style.fontSize = L('64px', '62px'); return o;
  });
  B.coinLine = div('coin-line', s, `${ICON.coins}<span>Plus, earn 500 Gold Coins</span>`);
  box(B.coinLine, L(0, 40), L(690, 780), L(W, 900)); B.coinLine.style.fontSize = L('64px', '52px');
  B.coinNote = div('note-line', s, TXT.coinsNote); box(B.coinNote, L(0, 60), L(800, 880), L(W, 880)); B.coinNote.style.fontSize = L('38px', '38px');
  const under = B.coinsBubble.parentNode === s ? B.coinsBubble : B.coinOpts[0];
  B.coinsRain = Array.from({ length: 14 }, () => { const c = coinSvg(s); s.insertBefore(c, under); return c; }); // coins fall behind all text
  B.coinSfx = C.sfx(fx, 'Clink!', { size: L(96, 90), fill: 'hsl(212 80% 42%)', rot: 6 });
  B.bonusSfx = C.sfx(fx, 'Bonus round!', { size: L(100, 80), fill: 'hsl(212 80% 42%)', rot: -7 });
}

function buildTrack() {
  const s = scenes.track;
  panel(s, 'green');
  // fundraiser-gift confirmation (real subject template, example title)
  B.mail = div('mail-card', s, `<div class="mail-ico">${ICON.mail}</div><div><div class="mail-from">CouponDonation</div><div class="mail-subj">Your donation to “Example fundraiser” is confirmed</div></div>`);
  box(B.mail, L(200, 70), L(190, 425), L(1100, 870));
  // donor-facing per-coupon trail (Your impact): Donated -> Coupon created -> Received -> Used
  const labels = ['Donated', 'Coupon created', 'Received', 'Used'];
  const tw = L(1300, 700);
  B.trail = div('trail2', s); box(B.trail, L(200, 190), L(560, 760), tw); B.trailW = tw;
  const gap = tw / 3;
  B.trailLine = div('trail2-line', B.trail); box(B.trailLine, 0, 22, tw);
  B.trailProg = div('trail2-prog', B.trail); box(B.trailProg, 0, 22, tw);
  B.trailNodes = labels.map((l, i) => { const n = div('trail2-step', B.trail, `<div class="trail2-dot">${ICON.check}</div><div class="trail2-lbl">${l}</div>`); box(n, i * gap - L(120, 110), 0, L(240, 220)); return n; });
  B.trailTicket = C.mascot(fx); B.trailTicket.svg.style.zIndex = 41;
  B.trackNote = div('note-line', s, TXT.trackNote); box(B.trackNote, L(200, 80), L(770, 1010), L(860, 860)); B.trackNote.style.textAlign = L('left', 'center'); B.trackNote.style.fontSize = L('38px', '38px');
  B.trackBubble = speech(s, TXT.track, 0, { x: 1130, y: 850, w: 420, h: 170, tail: { x: 1.2, y: 0.35 } });
}

function buildGoal() {
  const s = scenes.goal;
  panel(s, 'green');
  const ring = C.svgEl('svg', { viewBox: '0 0 200 200', class: 'goal-ring' }, s);
  C.svgEl('circle', { cx: 100, cy: 100, r: 80, fill: 'none', stroke: 'hsl(123 18% 86%)', 'stroke-width': 16 }, ring);
  B.goalArc = C.svgEl('circle', { cx: 100, cy: 100, r: 80, fill: 'none', stroke: 'hsl(123 46% 34%)', 'stroke-width': 16, 'stroke-linecap': 'round', transform: 'rotate(-90 100 100)' }, ring);
  B.goalRing = ring;
  const rs = L(420, 400);
  ring.style.position = 'absolute'; box(ring, L(260, 340), L(250, 410), rs, rs);
  B.goalLbl = div('goal-lbl', s, 'Example goal'); box(B.goalLbl, L(260, 340), L(250 + 185, 410 + 180), rs); B.goalLbl.style.fontSize = L('38px', '38px');
  const bx = L(820, 140), by = L(330, 860), bw = L(560, 800);
  B.donateBtn = div('goal-btn primary', s, `${ICON.heart}<span>Donate now</span>`); box(B.donateBtn, bx, by, bw);
  B.fundedBtn = div('goal-btn funded', s, `${ICON.check}<span>Fully funded</span>`); box(B.fundedBtn, bx, by, bw);
  B.shareBtn = div('goal-btn ink', s, `${ICON.share}<span>Share</span>`); box(B.shareBtn, bx, by + L(130, 130), bw);
  B.goalNote = div('note-line', s, TXT.goalNote); box(B.goalNote, bx, by + L(290, 270), bw); B.goalNote.style.textAlign = L('left', 'center'); B.goalNote.style.fontSize = L('34px', '36px');
  B.ghosts = [0, 1].map(() => { const g = C.tapPrompt(fx); g.style.zIndex = 59; g.classList.add('ghost'); return g; });
  B.fundSfx = C.sfx(fx, 'Fully funded!', { size: L(96, 84), fill: 'hsl(123 46% 45%)', rot: -5 });
  B.levelStamp = div('stamp level-stamp', s, TXT.levelDone);
  box(B.levelStamp, L(70, 100), L(600, 520), L(640, 800)); B.levelStamp.style.fontSize = L('88px', '70px');
  B.goalBubble = speech(s, TXT.goal, 0, { x: 740, y: 800, w: 800, h: 170, tail: { x: 1.18, y: 0.35 } });
}

function buildCta() {
  const s = scenes.cta;
  const p = div('panel forest', s); box(p, 0, 0, W, H); p.style.borderRadius = '0';
  const dg = div('halftone', p); dg.style.setProperty('--dot', 'hsl(120 8% 98.5% / 0.10)');
  B.ctaHead = div('big-serif serif', s, TXT.cta); box(B.ctaHead, 0, L(150, 400), W); B.ctaHead.style.textAlign = 'center'; B.ctaHead.style.fontSize = L('190px', '180px'); B.ctaHead.style.color = 'hsl(120 8% 98.5%)';
  B.ctaBtn = div('cta-big', s, `<div class="cta-pill">${ICON.heart}<span>${TXT.ctaBtn}</span>${ICON.arrow}</div>`); box(B.ctaBtn, 0, L(440, 700), W);
  if (V) $('.cta-pill', B.ctaBtn).style.fontSize = '50px';
  B.ctaNote = div('note-line', s, TXT.ctaNote); box(B.ctaNote, 0, L(600, 860), W); B.ctaNote.style.color = 'hsl(120 8% 98.5% / 0.85)'; B.ctaNote.style.fontSize = L('40px', '42px');
  B.plate = div('badge2', s, `<img src="/favicon-512.png" alt=""><span class="wm"><span class="c">Coupon</span><span class="d">Donation</span></span>`);
  B.plate.style.fontSize = L('56px', '54px'); box(B.plate, W / 2, L(760, 1010));
  B.url = div('note-line', s, 'coupondonation.com'); box(B.url, 0, L(930, 1200), W); B.url.style.color = 'hsl(120 8% 98.5%)'; B.url.style.fontWeight = '600'; B.url.style.fontSize = L('46px', '50px');
}

// ------------------------------------------------------------------ Coupon (the tree) choreography
const ORDER = Object.keys(DURS);
function guideState(t) {
  let cur = ORDER[0];
  for (const n of ORDER) if (t >= SC[n][0] - 0.25) cur = n;
  const idx = ORDER.indexOf(cur), prev = ORDER[Math.max(0, idx - 1)];
  const [x1, y1, s1] = GUIDE[cur], [x0, y0, s0] = GUIDE[prev];
  const hop = idx === 0 ? 1 : k(t, SC[cur][0] - 0.25, SC[cur][0] + 0.3, E.inOutCubic);
  let x = lerp(x0, x1, hop), y = lerp(y0, y1, hop) - Math.sin(Math.PI * hop) * 160;
  const sc = idx === 0 ? s1 : lerp(s0, s1, hop);
  if (idx === 0) { const p = k(t, -0.2, 0.45, E.outBackBig); y = y1 + (1 - p) * 140; } // already mostly on screen at frame 0
  const tk = TALK[cur] ? C.talk(t, TALK[cur][0], TALK[cur][1], 7.5) : 0;
  const land = Math.max(0, 1 - Math.abs(t - (SC[cur][0] + 0.3)) / 0.12);
  const shake = t > T.trunk && t < T.trunk + 0.6 ? Math.sin((t - T.trunk) * 45) * 7 * (1 - (t - T.trunk) / 0.6) : 0;
  const wag = t > T.coinWrong && t < T.coinWrong + 0.5 ? Math.sin((t - T.coinWrong) * 30) * 25 : 0;
  const think = cur === 'amount' && t > T.quizQ && t < T.right;
  const cheer = cur === 'pay' && t > T.wipe + 0.3;
  const wave = cur === 'hook' || cur === 'cta' ? 150 + Math.sin(t * 9) * 18 : cur === 'stores' || cur === 'goal' ? 120 : think ? 165 : 40;
  return { x, y, rot: shake * 0.6, scale: sc * L(1, 1.05), squash: land * 0.5 - (hop > 0 && hop < 1 ? 0.2 : 0), mouth: tk, blink: C.blinkAt(t, 3), gaze: think ? [0.6, -0.6] : [0.35 * Math.sin(t * 0.7), 0.1], sway: Math.sin(t * 2.1) * 2.5 + shake, armL: cheer ? 150 : 40, armR: cheer ? 150 : wave + wag, brows: cheer ? 0.4 : tk > 0 || think ? 0.5 : 0, air: Math.sin(Math.PI * hop) * 160, legPhase: hop > 0 && hop < 1 ? hop * 8 : 0, cur };
}

// ------------------------------------------------------------------ tap-hand choreography
function center(el) { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }
const trunkPt = () => { const r = guide.svg.getBoundingClientRect(); return { x: r.left + r.width * 0.52, y: r.bottom - r.height * 0.18 }; };
const offB = () => ({ x: W * 0.62, y: H + 90 });
let PATH = [];
function cursorPlan() {
  const c = (sel) => () => center(sel());
  const payPt = () => { const r = B.payBtn.getBoundingClientRect(); return { x: r.left + r.width * 0.78, y: r.top + r.height * 0.72 }; }; // keep the heart visible
  return [
    { t: T.trunk - 0.6, at: () => ({ x: L(1250, 900), y: H + 60 }) }, { t: T.trunk - 0.05, at: trunkPt }, { t: T.trunk + 0.5, at: trunkPt },
    { t: T.door - 1.0, at: offB }, { t: T.door - 0.7, at: c(() => B.navBtn) }, { t: T.door - 0.45, at: c(() => B.navBtn) }, { t: T.door - 0.05, at: c(() => $('.fr-donate', B.frCard)) }, { t: T.door + 0.9, at: c(() => $('.fr-donate', B.frCard)) },
    { t: T.walmart - 0.15, at: c(() => $('img', B.brandBtns[0].btn)) }, { t: T.walmart + 0.1, at: c(() => $('img', B.brandBtns[0].btn)) },
    { t: T.target - 0.1, at: c(() => $('img', B.brandBtns[1].btn)) }, { t: T.target + 0.1, at: c(() => $('img', B.brandBtns[1].btn)) },
    { t: T.amazon - 0.1, at: c(() => $('img', B.brandBtns[2].btn)) }, { t: T.amazon + 0.6, at: c(() => $('img', B.brandBtns[2].btn)) },
    { t: T.preset - 0.15, at: c(() => B.preset50) }, { t: T.preset + 0.5, at: c(() => B.preset50) },
    // think time: hover A, then C, then pick B
    { t: T.wrong - 0.15, at: c(() => B.quizOpts[0]) }, { t: T.wrong + 0.3, at: c(() => B.quizOpts[0]) },
    { t: T.right - 0.65, at: c(() => B.quizOpts[2]) }, { t: T.right - 0.4, at: c(() => B.quizOpts[2]) },
    { t: T.right - 0.05, at: c(() => B.quizOpts[1]) }, { t: T.right + 0.6, at: c(() => B.quizOpts[1]) },
    { t: T.pay - 0.15, at: payPt }, { t: T.pay + 0.45, at: payPt },
    { t: T.coinWrong - 0.15, at: c(() => B.coinOpts[0]) }, { t: T.coinWrong + 0.3, at: c(() => B.coinOpts[0]) },
    { t: T.coin - 0.05, at: c(() => B.coinOpts[1]) }, { t: T.coin + 0.6, at: c(() => B.coinOpts[1]) },
    { t: T.g1 - 0.05, at: c(() => B.donateBtn) }, { t: T.g1 + 0.25, at: c(() => B.donateBtn) }, { t: T.g1 + 0.6, at: offB },
    { t: T.ctaBtn + 0.9, at: () => { const a = $('.cta-pill', B.ctaBtn).lastElementChild; return center(a); } },
  ];
}
const CURSOR_ON = [[T.trunk - 0.6, T.trunk + 0.7], [T.door - 1.0, T.door + 1.0], [T.walmart - 0.6, T.amazon + 0.8], [T.preset - 0.6, T.right + 0.8], [T.pay - 0.6, T.pay + 0.5], [T.coinWrong - 0.7, T.coin + 0.8], [T.g1 - 0.6, T.g1 + 0.6], [T.ctaBtn + 0.3, T.ctaBtn + 2.5]];
const TAP_TIMES = [T.trunk, T.door, T.walmart, T.target, T.amazon, T.preset, T.right, T.pay, T.coin, T.g1];
function setCursor(t) {
  const on = CURSOR_ON.find(([a, b]) => t >= a && t < b);
  vis(cursor, !!on);
  if (!on) return;
  let p = PATH[0].at();
  for (let i = 0; i < PATH.length - 1; i++) {
    const a = PATH[i], b = PATH[i + 1];
    if (t >= a.t && t <= b.t) { const e = E.inOutCubic(cl((t - a.t) / (b.t - a.t))); const pa = a.at(), pb = b.at(); p = { x: lerp(pa.x, pb.x, e), y: lerp(pa.y, pb.y, e) - Math.sin(Math.PI * e) * 40 }; break; }
    if (t > b.t) p = b.at();
  }
  const op = Math.min(k(t, on[0], on[0] + 0.2, E.outCubic), 1 - k(t, on[1] - 0.2, on[1], E.inCubic));
  const tp = TAP_TIMES.find((tt) => t > tt - 0.7 && t < tt + 0.45) ?? -9;
  const pr = Math.max(0, 1 - Math.abs(t - tp) / 0.1);
  cursor.style.opacity = op;
  cursor.style.transform = `translate(${p.x}px, ${p.y}px)`;
  $('.hand', cursor).style.transform = `translate(-12px, ${-pr * 12}px) scale(${1 - pr * 0.12})`;
  $$('.tap-ring', cursor).forEach((r, i) => {
    let s = 0, o = 0;
    if (t >= tp && t < tp + 0.45) { const q = k(t, tp, tp + 0.45, E.outCubic); s = lerp(0.4, 2.0, q); o = i ? 0 : (1 - q) * 0.9; }
    else if (t < tp && t > tp - 0.7) { const ph = ((t - (tp - 0.7)) * 1.8 + i * 0.5) % 1; s = lerp(0.35, 1.2, ph); o = (1 - ph) * 0.75; }
    r.style.transform = `translate(-50%, -50%) scale(${s})`; r.style.opacity = o;
  });
}

// ------------------------------------------------------------------ scene transitions: comic panel slam
function sceneIn(el, t, t0, t1, dir = 1) {
  const on = t >= t0 - 0.3 && t < t1 + 0.3;
  vis(el, on);
  if (!on) return;
  const pin = t0 <= 0 ? 1 : k(t, t0 - 0.12, t0 + 0.38, E.outBack);
  const pout = k(t, t1 - 0.12, t1 + 0.22, E.inCubic);
  el.style.opacity = cl(pin * 3);
  el.style.transformOrigin = '50% 50%';
  el.style.transform = `translate(${-pout * W * 1.1 * dir}px, 0) rotate(${lerp(-3 * dir, 0, pin) + pout * -4 * dir}deg) scale(${lerp(1.12, 1, pin)})`;
}
const live = (n, t) => t > SC[n][0] - 0.3 && t < SC[n][1] + 0.3;

// ------------------------------------------------------------------ frame
function renderFrame(t) {
  $$('.sfx', fx).forEach((el) => { if (el.style.display !== 'none') el.style.display = 'none'; });
  vis(B.hookTicket.svg, false); vis(B.qSticker, false); vis(B.trailTicket.svg, false);
  B.tickets.forEach((tk) => vis(tk.m.svg, false)); B.coinsRain.forEach((c) => vis(c, false)); B.ghosts.forEach((g) => vis(g, false));
  dots.style.transform = `translate(${(t * 6) % 26}px, ${(t * 4) % 26}px)`;

  // HUD: enters with the first lesson, celebrates each checkpoint, leaves before the end card
  const hudIn = k(t, T.hudIn, T.hudIn + 0.55, E.outBack), hudOut = k(t, SC.cta[0] - 0.15, SC.cta[0] + 0.3, E.inCubic);
  vis(hudLayer, t >= T.hudIn && hudOut < 1); // explicit: outBack(0) is ~2e-16, not 0
  hud.style.transform = `translateY(${(1 - hudIn) * -L(170, 360) - hudOut * L(200, 400)}px)`;
  const done = CHECK.filter((c) => t >= c).length;
  const prevC = done ? CHECK[done - 1] : 0;
  const frac = done === 0 ? 0 : (done - 1 + k(t, prevC, prevC + 0.45, E.outBack)) / HUD_STEPS.length;
  $('.hud-fill', hud).style.width = (frac * 100).toFixed(2) + '%';
  $('.hud-pct', hud).textContent = `${String(done).padStart(2, '0')}/08`;
  const lbls = $$('.hud-lbl', hud);
  $$('.hud-node', hud).forEach((n, i) => {
    n.classList.toggle('on', t >= CHECK[i]); lbls[i].classList.toggle('on', t >= CHECK[i]);
    const bump = t >= CHECK[i] ? Math.sin(Math.PI * cl((t - CHECK[i]) / 0.45)) * 0.6 : 0;
    n.style.transform = `scale(${1 + bump})`;
  });
  $('.hud-title', hud).textContent = t >= T.funded ? 'Level 1 complete' : 'Level 1 · Your first donation';

  // ---- hook (frame 0 is already a finished panel)
  sceneIn(scenes.hook, t, 0, SC.hook[1]);
  if (live('hook', t)) {
    const tp = k(t, -0.3, 0.3, E.outBackBig);
    B.hookTitle.style.transform = `scale(${lerp(1.3, 1, tp)}) rotate(${lerp(-4, 0, tp)}deg)`; B.hookTitle.style.opacity = cl(0.3 + tp);
    const bp = lerp(0.85, 1, k(t, 0, 0.5, E.outBack)) + (t > T.trunk && t < T.trunk + 0.4 ? Math.sin((t - T.trunk) * 30) * 0.04 : 0);
    const g0 = GUIDE.hook;
    B.hookBurst.style.transform = `translate(${g0[0] - L(338, 308)}px, ${g0[1] - L(560, 650)}px) scale(${bp}) rotate(${t * 12}deg)`;
    C.setBubble(B.hookBubble, t, T.hookBubble, 1e9);
    C.setSfx(B.lvlSfx, t, -0.2, 1.25, { x: L(560, 300), y: L(415, 680) });
    const tp0 = trunkPt(); C.setSfx(B.popSfx, t, T.trunk, 0.5, { x: tp0.x - L(170, 150), y: tp0.y - 30 }); // beside the tapping hand
    const gsc = g0[2] * L(1, 1.05);
    const drop = cl((t - T.ticketDrop) / (T.ticketLand - T.ticketDrop));
    const landX = g0[0] + L(300, 380), landY = g0[1];
    const tx = lerp(g0[0] + 60 * gsc, landX, E.outCubic(drop)), ty = drop < 1 ? lerp(g0[1] - 250 * gsc, landY, drop * drop) - Math.sin(Math.PI * drop) * 120 : landY;
    const landK = Math.max(0, 1 - Math.abs(t - T.ticketLand) / 0.12);
    const outH = k(t, SC.hook[1] - 0.12, SC.hook[1] + 0.22, E.inCubic);
    vis(B.hookTicket.svg, t >= T.ticketDrop && t < SC.hook[1] + 0.25);
    C.setMascot(B.hookTicket, { x: tx - outH * W * 1.1, y: ty, scale: L(0.75, 0.8) * lerp(0.5, 1, cl(drop * 2)), rot: drop < 1 ? drop * 360 : 0, squash: landK * 0.6, gaze: [-0.7, -0.1], blink: C.blinkAt(t, 11), mouth: 0, smile: 1, armL: t > T.ticketLand + 0.1 ? 150 + Math.sin(t * 10) * 15 : 40, armR: t > T.ticketLand + 0.1 ? 150 : 40, brows: 0.4 });
  }
  // ---- find
  sceneIn(scenes.find, t, ...SC.find);
  if (live('find', t)) {
    C.setBubble(B.findBubble, t, T.findBubble, 1e9);
    $('.fr-donate', B.frCard).style.transform = `scale(${press(t, T.door, 0.08)})`;
    B.navBtn.style.transform = `scale(${1 + 0.05 * Math.max(0, 1 - Math.abs(t - (T.door - 0.55)) / 0.25)})`;
    const st = k(t, T.findSteps, T.findSteps + 0.5, E.outBack);
    B.findSteps.style.opacity = cl(st * 2); B.findSteps.style.transform = `translateY(${(1 - st) * 40}px) scale(${L(1.7, 1.5)})`;
    B.findNote.style.opacity = k(t, T.findSteps + 0.15, T.findSteps + 0.5);
  }
  // ---- stores
  sceneIn(scenes.stores, t, ...SC.stores);
  if (live('stores', t)) {
    C.setBubble(B.storesBubble, t, T.storesBubble, 1e9);
    const clicks = [T.walmart, T.target, T.amazon];
    B.brandBtns.forEach((b, i) => {
      const st = t >= clicks[i] ? b.on : b.off;
      if (b.btn.className !== st.b) { b.btn.className = st.b; b.box.className = st.x; b.box.innerHTML = st.i; }
      b.btn.style.transform = `scale(${press(t, clicks[i], 0.07)})`;
      const r = b.btn.getBoundingClientRect();
      C.setSfx(B.tapSfx[i], t, clicks[i], 0.7, { x: r.left + r.width * 0.85, y: r.top + 4 - k(t, clicks[i], clicks[i] + 0.7) * 30, scale: 1 + i * 0.12 });
    });
    const cb = k(t, clicks[0], clicks[0] + 0.4, E.outExpo);
    B.chipWrap.style.height = (B.chipBar.offsetHeight * cb).toFixed(1) + 'px';
    B.chipWrap.style.marginTop = (24 * cb).toFixed(1) + 'px';
    B.chips.forEach((ch, i) => { vis(ch, t >= clicks[i], 'flex'); ch.style.transform = `scale(${lerp(0.6, 1, k(t, clicks[i], clicks[i] + 0.35, E.outBack))})`; });
    B.chipCount.textContent = `${clicks.filter((c) => t >= c).length} of 5 max`;
    B.storesNote.style.opacity = k(t, T.storesNote, T.storesNote + 0.35);
  }
  // ---- amount + quiz (think time between question and answer)
  sceneIn(scenes.amount, t, ...SC.amount);
  if (live('amount', t)) {
    B.preset50.style.transform = `scale(${press(t, T.preset)})`;
    if (B.bigAmount) B.bigAmount.style.transform = `scale(${t >= T.preset ? lerp(0.6, 1, k(t, T.preset, T.preset + 0.4, E.outBackBig)) : 1})`;
    if (B.counter) { B.counter.style.opacity = t >= T.right ? 1 : 0; B.counter.style.transform = `scale(${t >= T.right ? lerp(1.5, 1, k(t, T.right + 0.05, T.right + 0.45, E.outBackBig)) : 1})`; }
    const qc = k(t, T.quizQ, T.quizQ + 0.4, E.outBack); B.quizCap.style.opacity = cl(qc * 2); B.quizCap.style.transform = `scale(${lerp(0.7, 1, qc)}) rotate(-1.5deg)`;
    B.quizOpts.forEach((o, i) => {
      const a = k(t, T.quizOpts + i * 0.12, T.quizOpts + 0.4 + i * 0.12, E.outBack);
      const wrong = i !== 1;
      o.classList.toggle('right', !wrong && t >= T.right); o.classList.toggle('wrong', wrong && t >= T.right);
      let wob = i === 0 && t > T.wrong && t < T.wrong + 0.45 ? Math.sin((t - T.wrong) * 40) * 10 * (1 - (t - T.wrong) / 0.45) : 0;
      o.style.opacity = cl(a * 2); o.style.transform = `translateX(${(1 - a) * 80 + wob}px)`;
      $('.strike', o).style.width = '104%'; $('.strike', o).style.transform = `scaleX(${wrong ? k(t, T.right + 0.1 + i * 0.05, T.right + 0.35 + i * 0.05, E.outCubic) : 0})`;
    });
    if (B.counter) {
      const cr = (B.counterSpan || B.counter).getBoundingClientRect();
      const on = t >= T.sticker && t < T.right + 0.5;
      vis(B.qSticker, on, 'flex');
      if (on) {
        const sIn = k(t, T.sticker, T.sticker + 0.25, E.outBackBig), rip = k(t, T.right, T.right + 0.5, E.inCubic);
        Object.assign(B.qSticker.style, { left: (cr.left + cr.width / 2 - 8) + 'px', top: (cr.top + cr.height / 2) + 'px', width: (cr.width + 70) + 'px', height: Math.max(72, cr.height + 34) + 'px', opacity: 1 - k(t, T.right + 0.3, T.right + 0.5) });
        B.qSticker.style.transform = `translate(-50%, -50%) translate(${rip * 260}px, ${-rip * 380}px) rotate(${-6 + rip * 70}deg) scale(${lerp(1.6, 1, sIn)})`;
      }
    }
    const r = B.quizOpts[1].getBoundingClientRect();
    C.setSfx(B.quizSfx, t, T.right + 0.05, 1.2, { x: r.left + r.width * L(0.55, 0.42), y: r.top - L(40, 60) });
  }
  // ---- coupons: preview of what the gift becomes
  sceneIn(scenes.coupons, t, ...SC.coupons);
  if (live('coupons', t)) {
    C.setSpeedLines(B.speed, t, { cx: PANEL.w / 2, cy: L(400, 520), inner: L(230, 260), opacity: 0.22 * (1 - k(t, T.deal + 0.6, T.deal + 1.3)), seed: 5 });
    const out = k(t, SC.coupons[1] - 0.12, SC.coupons[1] + 0.22, E.inCubic);
    B.tickets.forEach((tk) => {
      if (t < tk.start) return;
      vis(tk.m.svg, true);
      const p = cl((t - tk.start) / 0.7), e = E.outExpo(p);
      const x = lerp(L(960, 540), tk.to.x, e) - out * W * 1.1, y = lerp(L(560, 900), tk.to.y, e) - Math.sin(Math.PI * cl(p * 1.05)) * 220 + Math.sin((t - tk.start) * 3 + tk.seed) * 4;
      const land = Math.max(0, 1 - Math.abs(t - tk.start - 0.42) / 0.12);
      const cheer = t > T.stamp && t < T.stamp + 0.6;
      C.setMascot(tk.m, { x, y: y + L(118, 100), scale: L(0.8, 0.6) * lerp(0.3, 1, e), rot: lerp((hash(tk.seed) - 0.5) * 90, (tk.j - 1) * 6, E.outBack(p)), squash: land * 0.5, gaze: [Math.sin(t * 1.3 + tk.seed) * 0.6, 0], blink: C.blinkAt(t, tk.seed + 20), mouth: cheer ? 0.7 : 0, smile: 1, armL: t > T.stamp ? 150 : 30, armR: t > T.stamp ? 150 : 30, brows: 0.3 });
    });
    B.deckLabels.forEach((d, b) => { const p = k(t, T.deckLbl + b * 0.08, T.deckLbl + 0.5 + b * 0.08, E.outBack); d.style.opacity = cl(p * 2); d.style.transform = `translateY(${(1 - p) * 40}px)`; });
    const sp = k(t, T.stamp, T.stamp + 0.25, E.outBackBig);
    B.stamp.style.opacity = t >= T.stamp ? 1 : 0; B.stamp.style.transform = `rotate(-4deg) scale(${lerp(2.2, 1, sp)})`;
    C.setBubble(B.couponsBubble, t, T.couponsBubble, 1e9);
  }
  // ---- pay: one tap opens the hosted checkout, then the real thank-you page
  sceneIn(scenes.pay, t, ...SC.pay);
  if (live('pay', t)) {
    const lk = k(t, T.lock, T.lock + 0.5, E.outBackBig);
    B.payLock.style.transform = `scale(${lerp(0.4, 1, lk)}) rotate(${lerp(-12, 0, lk) + (t > T.pay && t < T.pay + 0.4 ? Math.sin((t - T.pay) * 50) * 4 : 0)}deg)`; B.payLock.style.opacity = cl(lk * 2);
    B.payBtn.style.transform = `scale(${press(t, T.pay)})`;
    const r = B.payBtn.getBoundingClientRect();
    C.setSfx(B.clickSfx, t, T.pay, 0.6, { x: r.right + L(150, 70), y: r.top + L(-40, -50) });
    const wp = k(t, T.wipe, T.wipe + 0.45, E.inOutQuart);
    vis(B.succPanel, wp > 0);
    B.succPanel.style.clipPath = `inset(0 0 ${((1 - wp) * 100).toFixed(2)}% 0 round 24px)`;
    B.succTitle.style.transform = `scale(${lerp(1.4, 1, k(t, T.wipe + 0.25, T.wipe + 0.75, E.outBackBig))})`;
    C.setBubble(B.payBubble, t, T.payBubble, T.wipe - 0.1); // payment done: stop saying 'pay'
  }
  // ---- coins quiz
  sceneIn(scenes.coins, t, ...SC.coins);
  if (live('coins', t)) {
    C.setSfx(B.bonusSfx, t, T.bonus, 0.75, { x: L(1500, 540), y: L(250, 470) });
    C.setBubble(B.coinsBubble, t, T.coinsQ, 1e9);
    B.coinOpts.forEach((o, i) => {
      const a = k(t, T.coinOpts + i * 0.12, T.coinOpts + 0.4 + i * 0.12, E.outBack);
      o.classList.toggle('right', i === 1 && t >= T.coin); o.classList.toggle('wrong', i === 0 && t >= T.coin);
      const wob = i === 0 && t > T.coinWrong && t < T.coinWrong + 0.45 ? Math.sin((t - T.coinWrong) * 40) * 10 * (1 - (t - T.coinWrong) / 0.45) : 0;
      o.style.opacity = cl(a * 2); o.style.transform = `scale(${lerp(0.5, 1, a)}) translateX(${wob}px)`;
      $('.strike', o).style.width = '104%'; $('.strike', o).style.transform = `scaleX(${i === 0 ? k(t, T.coin + 0.1, T.coin + 0.35, E.outCubic) : 0})`;
    });
    const lp = k(t, T.coin + 0.25, T.coin + 0.7, E.outBackBig);
    B.coinLine.style.opacity = cl(lp * 2); B.coinLine.style.transform = `scale(${lerp(0.6, 1, lp)})`;
    B.coinNote.style.opacity = k(t, T.coin + 0.35, T.coin + 0.7);
    const r = B.coinOpts[1].getBoundingClientRect();
    C.setSfx(B.coinSfx, t, T.coin + 0.05, 1.0, { x: L(r.right + 150, r.left + r.width / 2), y: r.top - L(70, 90) });
    B.coinsRain.forEach((c, i) => {
      const t0 = T.coin + i * 0.05; if (t < t0 || t > t0 + 1.5) return;
      vis(c, true);
      const p = cl((t - t0) / 1.3), side = i % 2 ? 1 : -1;
      const x = r.left + r.width / 2 + side * (0.25 + 0.75 * hash(i * 3.1)) * L(900, 520) * E.outCubic(p);
      const y = r.top + r.height / 2 - Math.sin(Math.PI * Math.min(1, p * 1.2)) * L(160, 220) * (0.5 + hash(i * 7.7)) + p * p * L(900, 1100);
      c.style.transform = `translate(${x - 48}px, ${y - 48}px) rotate(${(hash(i) - 0.5) * 720 * p}deg) scaleX(${Math.cos(p * 14 + i)})`;
      c.style.opacity = 1 - k(t, t0 + 1.1, t0 + 1.4);
    });
  }
  // ---- track: confirmation, then the donor's coupon trail
  sceneIn(scenes.track, t, ...SC.track);
  if (live('track', t)) {
    const mp = k(t, T.mail, T.mail + 0.45, E.outBackBig);
    B.mail.style.opacity = cl(mp * 2); B.mail.style.transform = `translate(${(1 - mp) * -400}px, 0) rotate(${(1 - mp) * -10}deg)`;
    const gap = B.trailW / 3, h0 = T.hops[0], h3 = T.hops[3];
    B.trailProg.style.transform = `scaleX(${k(t, h0, h3, E.lin)})`;
    B.trailNodes.forEach((n, i) => {
      const on = t >= T.hops[i]; n.classList.toggle('on', on);
      n.style.opacity = cl(0.35 + k(t, T.hops[i] - 0.15, T.hops[i] + 0.3, E.outBack));
      $('.trail2-dot', n).style.transform = `scale(${on ? lerp(1.5, 1, k(t, T.hops[i], T.hops[i] + 0.3, E.outBackBig)) : 1})`;
    });
    if (t >= T.mail + 0.6 && t < SC.track[1] + 0.25) {
      vis(B.trailTicket.svg, true);
      const seg = Math.min(3, Math.max(0, Math.floor((t - h0) / 0.5))), sp = cl(((t - h0) - seg * 0.5) / 0.5);
      const tr = B.trail.getBoundingClientRect();
      const done = t >= h3, before = t < h0;
      const hx = tr.left + (before ? 0 : done ? 3 * gap : lerp(seg * gap, Math.min(3, seg + 1) * gap, E.inOutCubic(sp)));
      const hy = tr.top + 18 - (before || done ? 0 : Math.sin(Math.PI * sp) * 90);
      const out = k(t, SC.track[1] - 0.12, SC.track[1] + 0.22, E.inCubic);
      C.setMascot(B.trailTicket, { x: hx - out * W * 1.1, y: hy, scale: L(0.5, 0.42), gaze: [0.8, 0], blink: C.blinkAt(t, 40), mouth: 0, smile: 1, armL: done ? 150 : 60, armR: done ? 150 : 60, legPhase: sp * 6 });
    }
    const tn = k(t, T.trackNote, T.trackNote + 0.4); B.trackNote.style.opacity = tn; B.trackNote.style.transform = `translateY(${(1 - tn) * 20}px)`;
    C.setBubble(B.trackBubble, t, T.trackBubble, 1e9);
  }
  // ---- goal: you tap once, other donors fill the rest, the level completes with the goal
  sceneIn(scenes.goal, t, ...SC.goal);
  if (live('goal', t)) {
    C.setBubble(B.goalBubble, t, T.goalBubble, T.levelDone - 0.15);
    const fills = [[T.g1, 0.34], [T.g2, 0.67], [T.g3, 1.0]];
    let f = 0; for (const [tt, v] of fills) f = lerp(f, v, k(t, tt, tt + 0.5, E.outBack));
    f = Math.min(1, f);
    const Cc = 2 * Math.PI * 80;
    B.goalArc.setAttribute('stroke-dasharray', Cc.toFixed(2)); B.goalArc.setAttribute('stroke-dashoffset', (Cc * (1 - f)).toFixed(2)); B.goalArc.style.opacity = f > 0.003 ? 1 : 0;
    const funded = t >= T.funded;
    vis(B.donateBtn, !funded, 'flex'); vis(B.fundedBtn, funded, 'flex');
    B.fundedBtn.style.transform = `scale(${lerp(1.3, 1, k(t, T.funded, T.funded + 0.4, E.outBackBig))})`;
    B.donateBtn.style.transform = `scale(${Math.min(press(t, T.g1, 0.06), press(t, T.g2, 0.06), press(t, T.g3, 0.06))})`;
    B.goalNote.style.opacity = k(t, T.g1 + 0.3, T.g1 + 0.7);
    const ring = B.goalRing.getBoundingClientRect();
    C.setSfx(B.fundSfx, t, T.funded, 0.5, { x: ring.left + ring.width / 2, y: ring.top + L(-10, 40) });
    const ls = k(t, T.levelDone, T.levelDone + 0.3, E.outBackBig);
    B.levelStamp.style.opacity = t >= T.levelDone ? 1 : 0; B.levelStamp.style.transform = `rotate(-5deg) scale(${lerp(2.4, 1, ls)})`;
    // other donors: opaque ghost hands arriving from different edges (no names, no numbers)
    const db = B.donateBtn.getBoundingClientRect();
    B.ghosts.forEach((g, i) => {
      const tt = [T.g2, T.g3][i];
      if (!(t > tt - 0.55 && t < tt + 0.35)) return;
      vis(g, true);
      const a = k(t, tt - 0.55, tt - 0.1, E.outCubic);
      const from = i ? { x: W + 80, y: db.top - 200 } : { x: db.left - 260, y: H + 80 };
      const pr = Math.max(0, 1 - Math.abs(t - tt) / 0.1);
      g.style.opacity = 0.92 * Math.min(a * 2, 1 - k(t, tt + 0.15, tt + 0.35));
      g.style.transform = `translate(${lerp(from.x, db.left + db.width * (0.3 + i * 0.4), a)}px, ${lerp(from.y, db.top + db.height / 2, a)}px)`;
      $('.hand', g).style.transform = `translate(-12px, ${-pr * 12}px)`;
      $$('.tap-ring', g).forEach((rr) => { rr.style.opacity = 0; });
    });
  }
  // ---- CTA
  const ctaOn = t >= SC.cta[0] - 0.3;
  vis(scenes.cta, ctaOn);
  if (ctaOn) {
    const p = k(t, SC.cta[0] - 0.2, SC.cta[0] + 0.35, E.inOutQuart);
    scenes.cta.style.clipPath = p < 1 ? `circle(${(p * 120).toFixed(2)}% at 50% 50%)` : 'none';
    const hp = k(t, T.ctaHead, T.ctaHead + 0.5, E.outBackBig); B.ctaHead.style.transform = `scale(${lerp(1.7, 1, hp)})`; B.ctaHead.style.opacity = cl(hp * 2);
    const bp = k(t, T.ctaBtn, T.ctaBtn + 0.45, E.outBack); B.ctaBtn.style.opacity = cl(bp * 2); B.ctaBtn.style.transform = `translateY(${(1 - bp) * 50}px)`;
    B.ctaNote.style.opacity = k(t, T.ctaNote, T.ctaNote + 0.4);
    const pp = k(t, T.plate, T.plate + 0.5, E.outBack); B.plate.style.opacity = cl(pp * 2); B.plate.style.transform = `translate(-50%, ${(1 - pp) * 40}px)`;
    B.url.style.opacity = k(t, T.url, T.url + 0.4);
  }
  // ---- Coupon + tap hand
  const g = guideState(t);
  vis(guide.svg, g.scale > 0.02);
  C.setTreeGuide(guide, g);
  setCursor(t);
}

// ------------------------------------------------------------------ boot
async function init() {
  buildHook(); buildFind();
  await buildStores(); await buildAmount();
  buildCoupons(); await buildPay();
  buildCoins(); buildTrack(); buildGoal(); buildCta();
  PATH = cursorPlan();
  await document.fonts.load('400 100px "Instrument Serif"');
  await document.fonts.load('italic 400 100px "Instrument Serif"');
  await document.fonts.load('700 40px "Instrument Sans"');
  await document.fonts.load('600 40px "Instrument Sans"');
  await document.fonts.ready;
  await Promise.all($$('img').map((im) => (im.complete ? im.decode().catch(() => {}) : new Promise((r) => { im.onload = im.onerror = r; }))));
  window.compDuration = DUR;
  window.compReady = true;
}
window.renderFrame = async (t) => { renderFrame(t); await new Promise((r) => requestAnimationFrame(() => r())); };
init().catch((e) => { window.compError = String((e && e.stack) || e); });
