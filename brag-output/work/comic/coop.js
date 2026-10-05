// "Co-op mode": comic explainer for CouponDonation showing both sides of one fundraiser.
// Player 1 asks for help (the real 4-step application), Player 2 gives (Donate now -> coupons),
// Player 1 reveals the code and marks the coupon used, Player 2 gets the update, and the goal
// fills together. Same toolkit, formats and render contract as film.js (?f=h | ?f=v,
// window.compT for the score, window.renderFrame for the renderer).
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
  coop: 'Co-op mode!',
  p1: 'I need help', p2: 'I want to help someone',                 // homepage split door (WhatWeDo.tsx)
  hi: 'Two players.<br><em>One goal.</em>',
  apply: 'Player 1 applies<br>in <em>4 steps</em>.',
  free: '<b>Free to apply.</b> You receive retail coupons only — never cash.', // BasicsStep.tsx
  steps: ['Who are we helping?', 'Tell donors your story', 'How much do you need?', 'Review and submit your request'],
  great: 'Great work!', created: 'Your fundraiser has been created',  // SuccessScreen.tsx
  shareH: 'Your fundraiser is ready to share.',                        // ShareScreen.tsx
  shareSub: 'Share with friends and family to increase your chances of receiving support.',
  shareBubble: 'Then <em>share</em> it.',
  copied: 'Link copied!',                                              // ShareModal.tsx
  give: 'Player 2 taps<br><em>Donate now</em>.',
  giveNote: 'Your donation becomes coupons for the organizer, and we will email you when they receive it.', // account-emails.ts
  notCash: 'Coupons, not cash',                                        // PublicFundraiser.tsx
  arriveSubj: 'A donation arrived for your fundraiser',                // owner-alerts.ts
  arriveFoot: 'Codes and card details are never included in email.',
  couponsSub: 'Coupons your fundraiser received. Codes stay hidden until you reveal them.', // OwnerCouponsSection.tsx
  arrive: 'Player 1 taps <em>Reveal code</em>,<br>then <em>Used</em>.',
  optional: 'Everything here is optional.',
  toastT: 'Marked as used', toastD: 'Your donor will get a short note.',
  updSubj: 'An update on your donation to “Help Feed My Family This Month”',      // impact-email.ts
  update: 'Player 2 gets<br>the update.',
  goal: 'Fill it<br><em>together.</em>',
  goalNote: 'Only completed donations count.',                        // totals count completed donations only (get_fundraiser_totals)
  done: 'Co-op complete!',
  ctaH: 'Help someone this week.<br>Or ask for help yourself.',        // CTASection.tsx
  ctaGive: 'Start donating', ctaApply: 'Apply for support', ctaNote: 'U.S. residents, free to apply.',
};
const TABS = ['Player 1 · I need help', 'Player 2 · I want to help someone'];

// ------------------------------------------------------------------ timeline (scene-relative cues)
const DURS = { hook: 3.0, apply: 7.5, share: 2.5, give: 4.5, arrive: 7.0, update: 3.5, goal: 4.0, cta: 4.5 };
const SC = {}; let acc = 0;
for (const [n, d] of Object.entries(DURS)) { SC[n] = [acc, acc + d]; acc += d; }
const DUR = acc; // 36.5 s
const at = (scene, dt) => SC[scene][0] + dt;
const T = {
  hookBubble: at('hook', 0.9), p1In: at('hook', -0.6), p2In: at('hook', -0.5),
  tabsIn: at('apply', -0.05), applyBubble: at('apply', 0.2),
  step: [0, 1.95, 3.55, 5.0].map((d) => at('apply', d)),
  tapFamily: at('apply', 0.75), tapFood: at('apply', 1.25), next1: at('apply', 1.7),
  cover: at('apply', 2.45), next2: at('apply', 3.3),
  chip: at('apply', 4.05), next3: at('apply', 4.75),
  submit: at('apply', 5.8), great: at('apply', 6.05),
  shareH: at('share', 0.1), shareBubble: at('share', 0.2), shareBtn: at('share', 0.35), shareTap: at('share', 1.25),
  giveBubble: at('give', 0.2), donateTap: at('give', 0.9), deal: at('give', 1.15), giveNote: at('give', 0.5), notCash: at('give', 2.1),
  mail: at('arrive', 0.15), arriveBubble: at('arrive', 0.3), couponsCard: at('arrive', 0.7),
  reveal: at('arrive', 1.6), usedTap: at('arrive', 2.55), dialog: at('arrive', 2.7), markTap: at('arrive', 4.6), toast: at('arrive', 4.8),
  updMail: at('update', 0.15), updBubble: at('update', 0.3), recv: at('update', 0.9), used: at('update', 1.5),
  goalBubble: at('goal', 0.2), g1: at('goal', 0.6), g2: at('goal', 1.1), g3: at('goal', 1.6), funded: at('goal', 2.1), done: at('goal', 2.5),
  ctaHead: at('cta', 0.2), ctaBtns: at('cta', 0.8), ctaNote: at('cta', 1.1), plate: at('cta', 1.4), url: at('cta', 1.6),
};
const TAPS = { tapFamily: T.tapFamily, tapFood: T.tapFood, next1: T.next1, cover: T.cover - 0.25, next2: T.next2, chip: T.chip, next3: T.next3, submit: T.submit,
  shareTap: T.shareTap, donateTap: T.donateTap, reveal: T.reveal, usedTap: T.usedTap, markTap: T.markTap, g1: T.g1 };
// whose turn it is (tabs): 1 = Player 1, 2 = Player 2, 3 = both
const TURN = [[SC.apply[0], 1], [SC.give[0], 2], [SC.arrive[0], 1], [SC.update[0], 2], [SC.goal[0], 3]];
window.compT = { SC, T, TAPS, TURN, DUR };

// ------------------------------------------------------------------ helpers
const stage = $('#stage');
stage.style.width = W + 'px'; stage.style.height = H + 'px';
const box = (el, x, y, w, h) => { el.style.left = x + 'px'; el.style.top = y + 'px'; if (w != null) el.style.width = w + 'px'; if (h != null) el.style.height = h + 'px'; return el; };
const layer = (cls = '') => div(`layer ${cls}`, stage);
const press = (t, tt, amt = 0.08) => { const d = t - tt; return d > -0.06 && d < 0.2 ? 1 - amt * Math.sin(Math.PI * cl((d + 0.06) / 0.26)) : 1; };
const pop = (t, t0, d = 0.4) => k(t, t0, t0 + d, E.outBack);
const ICON = {
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
  heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>',
  share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></svg>',
  mail: '<svg viewBox="0 0 64 44"><rect x="3" y="3" width="58" height="38" rx="4" fill="#fff" stroke="hsl(123 20% 7%)" stroke-width="5"/><path d="M5 6 32 26 59 6" fill="none" stroke="hsl(123 20% 7%)" stroke-width="5" stroke-linejoin="round"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/></svg>',
  users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20v-1a5 5 0 0 1 5-5h3a5 5 0 0 1 5 5v1"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a5 5 0 0 1 3.5 5v1"/></svg>',
  org: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M9 21v-4h6v4M8 7h2M14 7h2M8 11h2M14 11h2"/></svg>',
  cart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2.5 3h2.6l2.4 12h11l2-8H6.2"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></svg>',
  upload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/></svg>',
  eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>',
  copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>',
  megaphone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m3 11 15-6v14L3 13z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>',
};

// ------------------------------------------------------------------ geometry
// V keeps all text inside the social-safe area (y 220-1600, x <= 940).
const PANEL = L({ x: 60, y: 150, w: 1800, h: 890 }, { x: 40, y: 400, w: 1000, h: 1020 });
const BUB = L(null, { x: 330, y: 1425, w: 610, tail: { x: -0.13, y: 0.5 } });
const GUIDE = V
  ? { hook: [175, 1700, 0.85], apply: [175, 1700, 0.85], share: [175, 1700, 0.85], give: [175, 1700, 0.85], arrive: [175, 1700, 0.85], update: [175, 1700, 0.85], goal: [175, 1700, 0.85], cta: [540, 1720, 0.8] }
  : { hook: [960, 1075, 0.92], apply: [205, 1075, 0.78], share: [1720, 1070, 1.0], give: [1740, 1075, 0.9], arrive: [1745, 1075, 0.88], update: [1720, 1070, 1.0], goal: [1720, 1075, 0.95], cta: [300, 1075, 1.0] };
const TALK = { hook: [T.hookBubble + 0.2, T.hookBubble + 1.0], apply: [T.applyBubble, T.applyBubble + 1.1], share: [T.shareBubble, T.shareBubble + 0.7], give: [T.giveBubble, T.giveBubble + 0.9], arrive: [T.arriveBubble, T.arriveBubble + 1.0], update: [T.updBubble, T.updBubble + 0.9], goal: [T.goalBubble, T.goalBubble + 0.8] };
function speech(parent, text, opts = {}) {
  const o = V ? { w: BUB.w, h: opts.vh || 170, tail: BUB.tail, x: BUB.x, y: BUB.y } : opts;
  const b = C.bubble(parent, { text, w: o.w, h: o.h || 170, tail: o.tail, fs: L(40, 42) });
  box(b, o.x, o.y);
  return b;
}
function panel(scene, cls = '', bg, r = PANEL) { const p = div(`panel ${cls}`, scene); box(p, r.x, r.y, r.w, r.h); if (bg) p.style.background = bg; return p; }

// ------------------------------------------------------------------ persistent layers
const bg = layer(); vis(bg, true);
div('paper', bg);
const dots = div('halftone fade-b', bg); dots.style.setProperty('--dot', 'hsl(123 46% 34% / 0.13)'); dots.style.setProperty('--ds', '26px');
const scenes = {};
for (const name of Object.keys(DURS)) scenes[name] = layer(`scene-${name}`);
const fx = layer(); fx.style.zIndex = 40; vis(fx, true);
const hudLayer = layer(); hudLayer.style.zIndex = 30; vis(hudLayer, true);
const tabs = div('coop-tabs', hudLayer, TABS.map((s) => `<div class="coop-tab"><span>${s}</span></div>`).join(''));
box(tabs, 0, L(46, 262), W); tabs.style.fontSize = L('32px', '28px');
const guide = C.treeGuide(fx);
const cursor = C.tapPrompt(fx); cursor.style.zIndex = 60;
const B = {};

// ------------------------------------------------------------------ builders
function buildHook() {
  const s = scenes.hook;
  const doors = V ? [{ x: 40, y: 400, w: 1000, h: 470 }, { x: 40, y: 900, w: 1000, h: 470 }] : [{ x: 60, y: 190, w: 880, h: 640 }, { x: 980, y: 190, w: 880, h: 640 }];
  B.doors = doors.map((r, i) => {
    const p = panel(s, i ? '' : 'green', i ? 'hsl(var(--card))' : null, r);
    const h = div('big-serif serif', p, i ? TXT.p2 : TXT.p1); box(h, L(60, 50), L(170, 110), r.w - L(120, 100));
    h.style.textAlign = 'center'; h.style.fontSize = L(i ? '96px' : '112px', i ? '78px' : '96px');
    return p;
  });
  B.players = [0, 1].map(() => { const m = C.mascot(s); m.svg.style.zIndex = 41; return m; });
  B.doorRects = doors;
  B.coopSfx = C.sfx(fx, TXT.coop, { size: L(120, 100), fill: 'hsl(123 46% 45%)', rot: -5 });
  B.hookBubble = speech(s, TXT.hi, { x: 1125, y: 862, w: 440, h: 160, tail: { x: -0.12, y: 0.75 } });
}

// the application: one tonal 'headline' panel + one form card, four step contents
function buildApply() {
  const s = scenes.apply;
  const left = V ? { x: 40, y: 400, w: 1000, h: 330 } : { x: 60, y: 150, w: 700, h: 890 };
  const right = V ? { x: 40, y: 750, w: 1000, h: 670 } : { x: 790, y: 150, w: 1070, h: 890 };
  const pl = panel(s, 'green', null, left), pr = panel(s, '', 'hsl(var(--card))', right);
  B.wm = div('apply-wm', pl, `<img src="/favicon-512.png" alt=""><span class="wm"><span class="c">Coupon</span><span class="d">Donation</span></span>`);
  box(B.wm, L(50, 40), L(46, 34)); B.wm.style.fontSize = L('34px', '30px');
  B.counter = div('apply-count', pl, '<b>1</b><span>of 4</span>'); box(B.counter, L(50, 40), L(150, 100)); B.counter.style.fontSize = L('30px', '28px');
  B.stepHeads = TXT.steps.map((h) => { const d = div('big-serif serif apply-head', pl, h); box(d, L(50, 40), L(215, 160), L(600, 900)); d.style.fontSize = L('84px', '64px'); return d; });
  if (!V) {
    B.prog = div('apply-prog', pl, '<div class="apply-prog-lbl"><span>Progress</span><span class="pct">0%</span></div><div class="apply-prog-bar"><div></div></div>');
    box(B.prog, 50, 430, 600);
  }
  B.free = div('apply-free', pl, `${ICON.shield}<span>${TXT.free}</span>`);
  box(B.free, L(50, 40), L(520, 252), L(600, 920)); B.free.style.fontSize = L('28px', '26px');
  // form content at a fixed design size, scaled into the card
  const fw = L(960, 860), fh = L(780, 560);
  const form = div('apply-form', pr); box(form, L(55, 30), L(40, 26), fw, fh);
  if (V) form.classList.add('phone');
  B.forms = [form1(form), form2(form), form3(form), form4(form)];
  B.next = div('apply-next', pr, '<span>Continue</span>'); box(B.next, right.w - L(300, 360), right.h - L(120, 84), L(250, 240), L(84, 68)); B.next.style.fontSize = L('32px', '30px');
  B.great = C.sfx(fx, TXT.great, { size: L(130, 104), fill: 'hsl(123 46% 45%)', rot: -6 });
  B.created = div('apply-created', s, TXT.created); box(B.created, right.x, right.y + right.h / 2 + L(70, 40), right.w); B.created.style.fontSize = L('44px', '38px');
  B.applyBubble = speech(s, TXT.apply, { x: 335, y: 815, w: 400, h: 150, tail: { x: -0.13, y: 0.75 } });
}
function form1(form) {
  const f = div('apply-step', form);
  div('apply-lbl', f, 'Who needs help?');
  B.benef = [['Yourself', 'Coupons are delivered to your account for your own use', ICON.user], ['My Family', "You're applying on behalf of your household", ICON.users], ['Community Organization', 'Vouchers are issued to verified recipients referred by your organization', ICON.org]]
    .map(([t, d, ic]) => div('benef', f, `<div class="benef-ic">${ic}</div><div><div class="benef-t">${t}</div><div class="benef-d">${d}</div></div><div class="benef-r">${ICON.check}</div>`));
  div('apply-lbl', f, 'What kind of help do you need?');
  const chips = div('chips', f);
  B.cats = ['Food & Groceries', 'Healthcare', 'Education', 'Clothing', 'Transportation', 'Utilities', 'Emergency', 'Essentials'].map((c) => div('chip', chips, `<span>${c}</span>`));
  return f;
}
function form2(form) {
  const f = div('apply-step', form);
  div('apply-lbl', f, 'Add photos or videos <em>At least one photo required</em>');
  const media = div('media', f);
  B.upload = div('upload', media, `${ICON.upload}<div class="up-t">Upload photos or videos</div><div class="up-d">Add up to 5 — the first one becomes your cover</div>`);
  B.coverTile = div('cover-tile', media, `<div class="halftone" style="--dot:hsl(123 46% 34% / 0.22);--ds:18px"></div><div class="cover-ic">${ICON.heart}</div><div class="cover-badge">Cover</div>`);
  B.added = div('media-meta', f, '<span>1 of 5 added</span><span>1 ready</span>');
  B.story = div('story', f, 'Share why you need food assistance. Tell donors about your situation, your family, and how coupons will help you...');
  return f;
}
function form3(form) {
  const f = div('apply-step', form);
  div('apply-lbl', f, 'How much do you need?');
  div('apply-sub', f, "One goal. Once it's fully funded, your request closes.");
  B.amount = div('amount-in', f, '<span class="cur">$</span><span class="val"></span><span class="usd">USD total</span>');
  const chips = div('chips', f);
  B.amtChips = ['$100', '$250', '$500', '$1,000'].map((c) => div('chip', chips, `<span>${c}</span>`));
  div('apply-lbl', f, 'Where are you located?');
  div('apply-sub', f, 'Your ZIP code matches you with retailers near you. Vouchers are redeemable at US retailers only.');
  B.zip = div('zip-in', f, 'ZIP code');
  return f;
}
function form4(form) {
  const f = div('apply-step', form);
  div('review-title', f, 'Help Feed My Family This Month');
  const rows = div('review-rows', f);
  [['Category', 'Food & Groceries'], ['Beneficiary', 'My Family'], ['Goal', '<b>$250</b> total'], ['Location', '<i></i>'], ['Story', '<i></i>']]
    .forEach(([a, b]) => div('review-row', rows, `<span class="ra">${a}</span><span class="rb">${b}</span><span class="re">Edit</span>`));
  div('apply-sub', f, 'You can edit any detail after submitting.');
  return f;
}

function buildShare() {
  const s = scenes.share;
  const p = panel(s, '', 'hsl(123 46% 34%)');
  const ht = div('halftone', p); ht.style.setProperty('--dot', 'hsl(120 8% 98.5% / 0.10)');
  B.mega = div('share-mega', p, ICON.megaphone); box(B.mega, PANEL.w / 2 - L(70, 70), L(90, 120), L(140, 140), L(140, 140));
  B.shareH = div('big-serif serif', p, TXT.shareH); box(B.shareH, L(100, 50), L(260, 300), PANEL.w - L(200, 100));
  Object.assign(B.shareH.style, { textAlign: 'center', fontSize: L('100px', '70px'), color: 'hsl(120 8% 98.5%)' });
  B.shareSub = div('note-line', p, TXT.shareSub); box(B.shareSub, L(360, 70), L(420, 520), PANEL.w - L(720, 140));
  Object.assign(B.shareSub.style, { color: 'hsl(120 8% 98.5% / 0.88)', fontSize: L('36px', '36px') });
  // Share uses the campaign 'ink' token (the app's own ShareScreen button is verify-blue; blue stays verification-only here)
  B.shareBtn = div('goal-btn ink', p, `${ICON.share}<span>Share Fundraiser</span>`); box(B.shareBtn, PANEL.w / 2 - L(260, 280), L(580, 760), L(520, 560));
  B.copied = div('toast-real', s, `${ICON.check}<span>${TXT.copied}</span>`);
  B.shareBubble = speech(s, TXT.shareBubble, { x: 1250, y: 830, w: 380, h: 150, tail: { x: 1.2, y: 0.35 } });
}

function buildGive() {
  const s = scenes.give;
  const left = V ? { x: 40, y: 400, w: 1000, h: 470 } : { x: 60, y: 150, w: 700, h: 890 };
  const right = V ? { x: 40, y: 890, w: 1000, h: 530 } : { x: 790, y: 150, w: 1070, h: 890 };
  const pl = panel(s, 'green', null, left), pr = panel(s, '', 'hsl(var(--card))', right);
  // the example fundraiser card (number-free): ring + Donate now + Share
  const card = div('fr-panel', pl);
  card.innerHTML = `<svg class="fr-ring" viewBox="0 0 200 200"><circle cx="100" cy="100" r="80" fill="none" stroke="hsl(123 18% 86%)" stroke-width="16"/><circle cx="100" cy="100" r="80" fill="none" stroke="hsl(123 46% 34%)" stroke-width="16" stroke-linecap="round" transform="rotate(-90 100 100)" stroke-dasharray="502.65" stroke-dashoffset="502.65"/></svg>
    <div class="fr-ring-lbl">Example goal</div>
    <div class="goal-btn primary fr-donate">${ICON.heart}<span>Donate now</span></div>
    <div class="goal-btn ink fr-share">${ICON.share}<span>Share</span></div>`;
  box(card, L(0, 150), L(30, 0), 700, 700);
  if (V) { card.style.transformOrigin = '50% 0'; card.style.transform = 'scale(0.68)'; }
  B.donateBtn = $('.fr-donate', card); B.frArc = card.querySelectorAll('circle')[1];
  B.giveNote = div('note-line', s, TXT.giveNote);
  box(B.giveNote, L(100, 80), L(800, 1300), L(620, 860)); B.giveNote.style.fontSize = L('32px', '32px'); B.giveNote.style.textAlign = L('left', 'center');
  if (!V) B.giveNote.style.top = '850px';
  // three store decks
  const brands = ['/brand-logos/walmart.svg', '/brand-logos/target.svg', '/brand-logos/amazon.svg'];
  const deckX = V ? [230, 540, 830] : [960, 1240, 1520], deckY = V ? 1205 : 610;
  B.tickets = brands.map((logo, b) => { const m = C.mascot(s); m.svg.style.zIndex = 41; return { m, b, start: T.deal + b * 0.12, to: { x: deckX[b], y: deckY }, seed: b + 3 }; });
  B.deckLogos = brands.map((logo, b) => { const d = div('deck-logo', s, `<img src="${logo}" alt="">`); box(d, deckX[b] - 120, L(650, 1218), 240); return d; });
  B.notCash = div('stamp', s, TXT.notCash); box(B.notCash, L(880, 170), L(215, 908), L(900, 740)); B.notCash.style.fontSize = L('72px', '54px'); B.notCash.style.whiteSpace = 'nowrap';
  B.giveBubble = speech(s, TXT.give, { x: 1190, y: 830, w: 440, h: 160, tail: { x: 1.2, y: 0.35 } });
}

function buildArrive() {
  const s = scenes.arrive;
  panel(s, 'green');
  B.mail = div('mail-card', s, `<div class="mail-ico">${ICON.mail}</div><div><div class="mail-from">CouponDonation</div><div class="mail-subj">${TXT.arriveSubj}</div><div class="mail-body">${TXT.arriveFoot}</div></div>`);
  box(B.mail, L(110, 70), L(190, 425), L(1100, 860));
  const cw = L(1100, 860);
  B.couponsCard = div('cpn-card', s, `<div class="cpn-h serif">Coupons</div><div class="cpn-sub">${TXT.couponsSub}</div>
    <div class="cpn-row"><img src="/brand-logos/walmart.svg" alt=""><span class="cpn-name">Walmart</span><span class="cpn-status"></span></div>
    <div class="cpn-code"><span class="lbl">Code</span><span class="mask">•••• •••• ••••</span><span class="cpn-copy">${ICON.copy}<span>Copy</span></span></div>
    <div class="cpn-btns"><span class="cpn-reveal">${ICON.eye}<span>Reveal code</span></span><span class="cpn-used">Used</span></div>`);
  box(B.couponsCard, L(110, 70), L(470, 690), cw);
  B.status = $('.cpn-status', B.couponsCard); B.code = $('.cpn-code', B.couponsCard);
  B.revealBtn = $('.cpn-reveal', B.couponsCard); B.usedBtn = $('.cpn-used', B.couponsCard);
  B.dialog = div('cpn-dialog', s, `<div class="dlg-t">${TXT.optional}</div><div class="dlg-btn">Mark as used</div>`);
  box(B.dialog, L(1230, 110), L(330, 1170), L(560, 800));
  B.markBtn = $('.dlg-btn', B.dialog);
  B.toast = div('toast-real toast2', s, `${ICON.check}<div><b>${TXT.toastT}</b><span>${TXT.toastD}</span></div>`);
  box(B.toast, L(1230, 110), L(330, 1180), L(560, 800));
  B.arriveBubble = speech(s, TXT.arrive, { x: 1215, y: 790, w: 460, h: 190, tail: { x: 1.13, y: 0.6 } });
}

function buildUpdate() {
  const s = scenes.update;
  panel(s, 'green');
  B.updMail = div('mail-card', s, `<div class="mail-ico">${ICON.mail}</div><div><div class="mail-from">CouponDonation</div><div class="mail-subj">${TXT.updSubj}</div></div>`);
  box(B.updMail, L(200, 70), L(190, 425), L(1100, 860));
  const labels = ['Donated', 'Coupon created', 'Received', 'Used'];
  const tw = L(1300, 700);
  B.trail = div('trail2', s); box(B.trail, L(200, 190), L(560, 800), tw); B.trailW = tw;
  const gap = tw / 3;
  div('trail2-line', B.trail).style.width = tw + 'px';
  B.trailProg = div('trail2-prog', B.trail); box(B.trailProg, 0, 22, tw);
  B.trailNodes = labels.map((l, i) => { const n = div('trail2-step', B.trail, `<div class="trail2-dot">${ICON.check}</div><div class="trail2-lbl">${l}</div>`); box(n, i * gap - L(120, 110), 0, L(240, 220)); return n; });
  $('.trail2-line', B.trail).style.top = '22px';
  B.updBubble = speech(s, TXT.update, { x: 1130, y: 850, w: 420, h: 170, tail: { x: 1.2, y: 0.35 } });
}

function buildGoal() {
  const s = scenes.goal;
  panel(s, 'green');
  const ring = C.svgEl('svg', { viewBox: '0 0 200 200', class: 'goal-ring' }, s);
  C.svgEl('circle', { cx: 100, cy: 100, r: 80, fill: 'none', stroke: 'hsl(123 18% 86%)', 'stroke-width': 16 }, ring);
  B.goalArc = C.svgEl('circle', { cx: 100, cy: 100, r: 80, fill: 'none', stroke: 'hsl(123 46% 34%)', 'stroke-width': 16, 'stroke-linecap': 'round', transform: 'rotate(-90 100 100)' }, ring);
  B.goalRing = ring;
  const rs = L(420, 400);
  ring.style.position = 'absolute'; box(ring, L(260, 340), L(250, 450), rs, rs);
  const gl = div('goal-lbl', s, 'Example goal'); box(gl, L(260, 340), L(250 + 185, 450 + 180), rs); gl.style.fontSize = L('38px', '38px');
  const bx = L(820, 140), by = L(330, 900), bw = L(560, 800);
  B.goalDonate = div('goal-btn primary', s, `${ICON.heart}<span>Donate now</span>`); box(B.goalDonate, bx, by, bw);
  B.fundedBtn = div('goal-btn funded', s, `${ICON.check}<span>Fully funded</span>`); box(B.fundedBtn, bx, by, bw);
  B.goalShare = div('goal-btn ink', s, `${ICON.share}<span>Share</span>`); box(B.goalShare, bx, by + 130, bw);
  B.goalNote = div('note-line', s, TXT.goalNote); box(B.goalNote, bx, by + L(290, 270), bw); B.goalNote.style.textAlign = L('left', 'center'); B.goalNote.style.fontSize = L('34px', '36px');
  B.ghosts = [0, 1].map(() => { const g = C.tapPrompt(fx); g.style.zIndex = 59; g.classList.add('ghost'); return g; });
  B.fundSfx = C.sfx(fx, 'Fully funded!', { size: L(96, 84), fill: 'hsl(123 46% 45%)', rot: -5 });
  B.doneStamp = div('stamp level-stamp', s, TXT.done);
  box(B.doneStamp, L(70, 140), L(640, 730), L(640, 760)); B.doneStamp.style.fontSize = L('84px', '60px'); B.doneStamp.style.background = 'hsl(120 8% 98.5%)';
  B.goalBubble = speech(s, TXT.goal, { x: 1230, y: 820, w: 380, h: 170, tail: { x: 1.2, y: 0.35 } });
}

function buildCta() {
  const s = scenes.cta;
  const p = div('panel forest', s); box(p, 0, 0, W, H); p.style.borderRadius = '0';
  const dg = div('halftone', p); dg.style.setProperty('--dot', 'hsl(120 8% 98.5% / 0.10)');
  B.ctaHead = div('big-serif serif', s, TXT.ctaH); box(B.ctaHead, L(0, 60), L(130, 330), L(W, 960));
  Object.assign(B.ctaHead.style, { textAlign: 'center', fontSize: L('116px', '84px'), color: 'hsl(120 8% 98.5%)' });
  B.ctaBtns = div('cta-duo', s, `<div class="cta-pill">${ICON.heart}<span>${TXT.ctaGive}</span>${ICON.arrow}</div><div class="cta-pill alt">${ICON.org}<span>${TXT.ctaApply}</span>${ICON.arrow}</div>`);
  box(B.ctaBtns, 0, L(470, 640), W);
  if (V) B.ctaBtns.classList.add('col');
  B.ctaNote = div('note-line', s, TXT.ctaNote); box(B.ctaNote, 0, L(620, 950), W); B.ctaNote.style.color = 'hsl(120 8% 98.5% / 0.85)'; B.ctaNote.style.fontSize = L('40px', '40px');
  B.plate = div('badge2', s, `<img src="/favicon-512.png" alt=""><span class="wm"><span class="c">Coupon</span><span class="d">Donation</span></span>`);
  B.plate.style.fontSize = L('56px', '54px'); box(B.plate, W / 2, L(760, 1060));
  B.url = div('note-line', s, 'coupondonation.com'); box(B.url, 0, L(930, 1240), W); B.url.style.color = 'hsl(120 8% 98.5%)'; B.url.style.fontWeight = '600'; B.url.style.fontSize = L('46px', '50px');
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
  if (idx === 0) { const p = k(t, -0.2, 0.45, E.outBackBig); y = y1 + (1 - p) * 140; }
  const tk = TALK[cur] ? C.talk(t, TALK[cur][0], TALK[cur][1], 7.5) : 0;
  const land = Math.max(0, 1 - Math.abs(t - (SC[cur][0] + 0.3)) / 0.12);
  const cheer = (cur === 'apply' && t > T.great) || (cur === 'goal' && t > T.funded) || (cur === 'arrive' && t > T.toast);
  const wave = cur === 'hook' || cur === 'cta' ? 150 + Math.sin(t * 9) * 18 : cur === 'give' || cur === 'share' ? 120 : 40;
  return { x, y, rot: 0, scale: sc * L(1, 1.05), squash: land * 0.5 - (hop > 0 && hop < 1 ? 0.2 : 0), mouth: tk, blink: C.blinkAt(t, 3), gaze: [0.35 * Math.sin(t * 0.7), 0.1], sway: Math.sin(t * 2.1) * 2.5, armL: cheer ? 150 : 40, armR: cheer ? 150 : wave, brows: cheer ? 0.4 : tk > 0 ? 0.5 : 0, air: Math.sin(Math.PI * hop) * 160, legPhase: hop > 0 && hop < 1 ? hop * 8 : 0, cur };
}

// ------------------------------------------------------------------ tap-hand choreography
// tap point: lower right of the target so finger and palm hang below its label; null while the target is hidden
function center(el) { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 ? { x: r.left + r.width * 0.75, y: r.bottom - 4 } : null; }
const offB = () => ({ x: W * 0.62, y: H + 90 });
let PATH = [];
function cursorPlan() {
  const c = (sel) => { let last = null; return () => (last = center(sel()) || last) || offB(); }; // hidden target: keep its last position
  const hold = (tt, sel, a = 0.15, b = 0.3) => [{ t: tt - a, at: c(sel) }, { t: tt + b, at: c(sel) }];
  return [
    { t: T.tapFamily - 0.6, at: offB }, ...hold(T.tapFamily, () => $('.benef-t', B.benef[1])), ...hold(T.tapFood, () => B.cats[0], 0.12, 0.12),
    ...hold(T.next1, () => B.next, 0.12, 0.12), ...hold(TAPS.cover, () => B.upload, 0.15, 0.2), ...hold(T.next2, () => B.next, 0.15, 0.12),
    ...hold(T.chip, () => B.amtChips[1], 0.15, 0.15), ...hold(T.next3, () => B.next, 0.15, 0.12), ...hold(T.submit, () => B.next, 0.25, 0.3), { t: T.submit + 0.75, at: offB },
    { t: T.shareTap - 0.6, at: offB }, ...hold(T.shareTap, () => B.shareBtn, 0.12, 0.4),
    { t: T.donateTap - 0.6, at: offB }, ...hold(T.donateTap, () => B.donateBtn, 0.12, 0.35), { t: T.donateTap + 0.8, at: offB },
    { t: T.reveal - 0.6, at: offB }, ...hold(T.reveal, () => (B.revealBtn.style.display === 'none' ? B.usedBtn : B.revealBtn), 0.15, 0.3), ...hold(T.usedTap, () => B.usedBtn, 0.2, 0.2), ...hold(T.markTap, () => B.markBtn, 0.25, 0.3), { t: T.markTap + 0.9, at: offB },
    { t: T.g1 - 0.6, at: offB }, ...hold(T.g1, () => B.goalShare, 0.05, 0.25), { t: T.g1 + 0.6, at: offB },
  ];
}
const CURSOR_ON = [[T.tapFamily - 0.6, T.submit + 0.7], [T.shareTap - 0.6, T.shareTap + 0.6], [T.donateTap - 0.6, T.donateTap + 0.75], [T.reveal - 0.6, T.markTap + 0.85], [T.g1 - 0.6, T.g1 + 0.6]];
const TAP_TIMES = Object.values(TAPS).sort((a, b) => a - b);
function setCursor(t) {
  const on = CURSOR_ON.find(([a, b]) => t >= a && t < b);
  vis(cursor, !!on);
  if (!on) return;
  let p = PATH[0].at();
  for (let i = 0; i < PATH.length - 1; i++) {
    const a = PATH[i], b = PATH[i + 1];
    if (t >= a.t && t <= b.t) { const e = E.inOutCubic(cl((t - a.t) / (b.t - a.t))); const pa = a.at(), pb = b.at(); p = { x: lerp(pa.x, pb.x, e), y: lerp(pa.y, pb.y, e) - Math.sin(Math.PI * e) * Math.min(40, Math.hypot(pb.x - pa.x, pb.y - pa.y) * 0.2) }; break; }
    if (t > b.t) p = b.at();
  }
  const op = Math.min(k(t, on[0], on[0] + 0.2, E.outCubic), 1 - k(t, on[1] - 0.2, on[1], E.inCubic));
  const tp = TAP_TIMES.find((tt) => t > tt - 0.45 && t < tt + 0.45) ?? -9;
  const pr = Math.max(0, 1 - Math.abs(t - tp) / 0.1);
  cursor.style.opacity = op;
  cursor.style.transform = `translate(${p.x}px, ${p.y}px)`;
  $('.hand', cursor).style.transform = `translate(-12px, ${-pr * 12}px) scale(${1 - pr * 0.12})`;
  $$('.tap-ring', cursor).forEach((r, i) => {
    let s = 0, o = 0;
    if (t >= tp && t < tp + 0.45) { const q = k(t, tp, tp + 0.45, E.outCubic); s = lerp(0.4, 2.0, q); o = i ? 0 : (1 - q) * 0.9; }
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
const turnAt = (t) => { let w = 0; for (const [tt, p] of TURN) if (t >= tt - 0.1) w = p; return w; };

// ------------------------------------------------------------------ frame
function renderFrame(t) {
  $$('.sfx', fx).forEach((el) => { if (el.style.display !== 'none') el.style.display = 'none'; });
  B.players.forEach((m) => vis(m.svg, false)); B.tickets.forEach((tk) => vis(tk.m.svg, false)); B.ghosts.forEach((g) => vis(g, false));
  dots.style.transform = `translate(${(t * 6) % 26}px, ${(t * 4) % 26}px)`;

  // tabs: whose turn it is
  const tin = k(t, T.tabsIn, T.tabsIn + 0.5, E.outBack), tout = k(t, SC.cta[0] - 0.15, SC.cta[0] + 0.3, E.inCubic);
  vis(hudLayer, t >= T.tabsIn && tout < 1);
  tabs.style.transform = `translateY(${(1 - tin) * -L(160, 360) - tout * L(200, 400)}px)`;
  const turn = turnAt(t);
  $$('.coop-tab', tabs).forEach((el, i) => {
    const onNow = turn === 3 || turn === i + 1;
    el.classList.toggle('on', onNow);
    const sw = TURN.map(([tt]) => tt).find((tt) => t >= tt - 0.1 && t < tt + 0.4);
    el.style.transform = `scale(${onNow && sw != null ? 1 + 0.12 * Math.sin(Math.PI * cl((t - sw + 0.1) / 0.5)) : 1})`;
  });

  // ---- hook (frame 0 is a finished panel)
  sceneIn(scenes.hook, t, 0, SC.hook[1]);
  if (live('hook', t)) {
    C.setSfx(B.coopSfx, t, -0.5, 1.6, { x: L(W / 2, 480), y: L(140, 345) });
    C.setBubble(B.hookBubble, t, T.hookBubble, 1e9);
    B.players.forEach((m, i) => {
      const t0 = i ? T.p2In : T.p1In; if (t < t0) return;
      vis(m.svg, true);
      const r = B.doorRects[i], p = k(t, t0, t0 + 0.45, E.outBackBig);
      const x = r.x + r.w / 2, y = V ? r.y + r.h - 30 : r.y + r.h - 70;
      C.setMascot(m, { x, y: y + (1 - p) * 120, scale: L(0.85, 0.7) * lerp(0.4, 1, p), rot: 0, squash: Math.max(0, 1 - Math.abs(t - t0 - 0.3) / 0.12) * 0.5, gaze: [i ? -0.5 : 0.5, 0], blink: C.blinkAt(t, 11 + i), mouth: 0, smile: 1, armL: 150 + Math.sin(t * 9 + i) * 15, armR: 150, brows: 0.4 });
    });
  }
  // ---- apply: four steps in one card
  sceneIn(scenes.apply, t, ...SC.apply);
  if (live('apply', t)) {
    C.setBubble(B.applyBubble, t, T.applyBubble, 1e9);
    let si = 0; T.step.forEach((ts, i) => { if (t >= ts) si = i; });
    B.counter.innerHTML = `<b>${si + 1}</b><span>of 4</span>`;
    B.stepHeads.forEach((h, i) => { const on = i === si; vis(h, on); if (on) { const p = k(t, T.step[i], T.step[i] + 0.35, E.outBack); h.style.opacity = cl(p * 2); h.style.transform = `translateY(${(1 - p) * 30}px)`; } });
    B.forms.forEach((f, i) => { const on = i === si; vis(f, on, 'flex'); if (on) { const p = k(t, T.step[i], T.step[i] + 0.35, E.outCubic); f.style.opacity = cl(p * 1.5); f.style.transform = `translateX(${(1 - p) * 60}px)`; } });
    if (B.prog) {
      const pct = [0, 33, 67, 100][si], prev = [0, 0, 33, 67][si], pp = lerp(prev, pct, k(t, T.step[si], T.step[si] + 0.5, E.outCubic));
      $('.apply-prog-bar div', B.prog).style.width = pp.toFixed(1) + '%'; $('.pct', B.prog).textContent = Math.round(pp) + '%';
    }
    B.benef.forEach((b, i) => b.classList.toggle('on', i === 1 && t >= T.tapFamily));
    B.benef[1].style.transform = `scale(${press(t, T.tapFamily, 0.04)})`;
    B.cats.forEach((c, i) => c.classList.toggle('on', i === 0 && t >= T.tapFood));
    B.cats[0].style.transform = `scale(${press(t, T.tapFood, 0.1)})`;
    const cv = k(t, T.cover, T.cover + 0.35, E.outBackBig);
    vis(B.coverTile, t >= T.cover); vis(B.upload, t < T.cover, 'flex'); vis(B.added, t >= T.cover, 'flex');
    B.coverTile.style.transform = `scale(${lerp(0.6, 1, cv)})`;
    $('.val', B.amount).textContent = t >= T.chip ? '250' : '';
    B.amtChips.forEach((c, i) => c.classList.toggle('on', i === 1 && t >= T.chip));
    B.amtChips[1].style.transform = `scale(${press(t, T.chip, 0.1)})`;
    $('span', B.next).textContent = si === 3 ? 'Submit Fundraiser' : 'Continue';
    B.next.classList.toggle('wide', si === 3);
    const storyOn = t >= T.cover + 0.3, zipOn = t >= T.chip + 0.3;
    B.story.classList.toggle('filled', storyOn); B.zip.classList.toggle('filled', zipOn);
    const enabled = (si === 0 && t >= T.tapFood) || (si === 1 && storyOn) || (si === 2 && zipOn) || si === 3;
    B.next.classList.toggle('off', !enabled);
    B.next.style.transform = `scale(${Math.min(press(t, T.next1), press(t, T.next2), press(t, T.next3), press(t, T.submit))})`;
    const r = B.next.getBoundingClientRect();
    const g = k(t, T.great, T.great + 0.35, E.outBackBig);
    C.setSfx(B.great, t, T.great, 1.4, { x: L(1325, 540), y: L(520, 1010) });
    B.created.style.opacity = k(t, T.great + 0.2, T.great + 0.5);
    B.created.style.transform = `translateY(${(1 - g) * 20}px)`;
    vis(B.created, t >= T.great);
    B.forms[3].style.filter = t >= T.great ? `blur(${(6 * k(t, T.great, T.great + 0.3)).toFixed(2)}px)` : 'none';
    B.forms[3].style.opacity = t >= T.great ? String(1 - 0.75 * k(t, T.great, T.great + 0.3)) : B.forms[3].style.opacity;
    vis(B.next, t < T.great + 0.15, 'flex');
  }
  // ---- share
  sceneIn(scenes.share, t, ...SC.share);
  if (live('share', t)) {
    C.setBubble(B.shareBubble, t, T.shareBubble, 1e9);
    const hp = k(t, T.shareH, T.shareH + 0.45, E.outBackBig); B.shareH.style.transform = `scale(${lerp(1.3, 1, hp)})`; B.shareH.style.opacity = cl(hp * 2);
    B.mega.style.transform = `rotate(${Math.sin(t * 14) * 6 * (1 - k(t, T.shareH, T.shareH + 1.2))}deg) scale(${lerp(0.5, 1, hp)})`;
    B.shareSub.style.opacity = k(t, T.shareH + 0.3, T.shareH + 0.7);
    const bp = k(t, T.shareBtn, T.shareBtn + 0.4, E.outBack); B.shareBtn.style.opacity = cl(bp * 2);
    B.shareBtn.style.transform = `translateY(${(1 - bp) * 40}px) scale(${press(t, T.shareTap)})`;
    const cp = k(t, T.shareTap + 0.1, T.shareTap + 0.4, E.outBack);
    vis(B.copied, t >= T.shareTap + 0.1, 'flex');
    const br = B.shareBtn.getBoundingClientRect();
    Object.assign(B.copied.style, { left: (br.left + br.width / 2) + 'px', top: (br.bottom + L(40, 40)) + 'px', transform: `translate(-50%, ${(1 - cp) * 30}px)`, opacity: cl(cp * 2) });
  }
  // ---- give: Player 2 taps Donate now, the gift becomes coupons
  sceneIn(scenes.give, t, ...SC.give);
  if (live('give', t)) {
    C.setBubble(B.giveBubble, t, T.giveBubble, 1e9);
    B.donateBtn.style.transform = `scale(${press(t, T.donateTap)})`;
    B.giveNote.style.opacity = k(t, T.giveNote, T.giveNote + 0.4);
    B.frArc.setAttribute('stroke-dashoffset', (502.65 * (1 - 0.34 * k(t, T.deal, T.deal + 0.6, E.outCubic))).toFixed(2));
    const db = B.donateBtn.getBoundingClientRect();
    B.tickets.forEach((tk) => {
      if (t < tk.start) return;
      vis(tk.m.svg, true);
      const p = cl((t - tk.start) / 0.7), e = E.outExpo(p);
      const x = lerp(db.left + db.width / 2, tk.to.x, e), y = lerp(db.top, tk.to.y, e) - Math.sin(Math.PI * cl(p * 1.05)) * 220 + Math.sin((t - tk.start) * 3 + tk.seed) * 4;
      const land = Math.max(0, 1 - Math.abs(t - tk.start - 0.42) / 0.12);
      const cheer = t > T.notCash;
      C.setMascot(tk.m, { x, y, scale: L(1.0, 0.7) * lerp(0.3, 1, e), rot: lerp((hash(tk.seed) - 0.5) * 90, 0, E.outBack(p)), squash: land * 0.5, gaze: [Math.sin(t * 1.3 + tk.seed) * 0.6, 0], blink: C.blinkAt(t, tk.seed + 20), mouth: cheer ? 0.6 : 0, smile: 1, armL: cheer ? 150 : 30, armR: cheer ? 150 : 30, brows: 0.3 });
    });
    B.deckLogos.forEach((d, i) => { const p = k(t, SC.give[0] + 0.3 + i * 0.1, SC.give[0] + 0.7 + i * 0.1, E.outBack); d.style.opacity = cl(p * 2); d.style.transform = `translateY(${(1 - p) * 30}px)`; });
    const sp = k(t, T.notCash, T.notCash + 0.25, E.outBackBig);
    B.notCash.style.opacity = t >= T.notCash ? 1 : 0; B.notCash.style.transform = `rotate(-4deg) scale(${lerp(2.2, 1, sp)})`;
  }
  // ---- arrive: Player 1 gets the coupon, reveals it, marks it used
  sceneIn(scenes.arrive, t, ...SC.arrive);
  if (live('arrive', t)) {
    C.setBubble(B.arriveBubble, t, T.arriveBubble, T.dialog - 0.1);
    const mp = k(t, T.mail, T.mail + 0.45, E.outBackBig);
    B.mail.style.opacity = cl(mp * 2); B.mail.style.transform = `translate(${(1 - mp) * -400}px, 0) rotate(${(1 - mp) * -10}deg)`;
    const cp = k(t, T.couponsCard, T.couponsCard + 0.45, E.outBack);
    B.couponsCard.style.opacity = cl(cp * 2); B.couponsCard.style.transform = `translateY(${(1 - cp) * 60}px)`;
    const used = t >= T.markTap, recv = t >= T.reveal;
    B.status.textContent = used ? 'Used' : recv ? 'Received' : 'Ready';
    B.status.classList.toggle('on', recv);
    B.status.style.transform = `scale(${1 + 0.25 * Math.max(0, 1 - Math.abs(t - (used ? T.markTap : T.reveal) - 0.1) / 0.2) * (recv ? 1 : 0)})`;
    vis(B.code, recv, 'flex');
    vis(B.revealBtn, !recv, 'inline-flex'); vis(B.usedBtn, recv, 'inline-flex');
    B.revealBtn.style.transform = `scale(${press(t, T.reveal)})`;
    B.usedBtn.style.transform = `scale(${press(t, T.usedTap) * lerp(0.6, 1, k(t, T.reveal, T.reveal + 0.3, E.outBack))})`;
    B.usedBtn.classList.toggle('done', used);
    const dp = k(t, T.dialog, T.dialog + 0.4, E.outBack), dOut = k(t, T.markTap + 0.1, T.markTap + 0.35, E.inCubic);
    vis(B.dialog, t >= T.dialog && dOut < 1);
    B.dialog.style.opacity = cl(dp * 2) * (1 - dOut); B.dialog.style.transform = `scale(${lerp(0.85, 1, dp) * (1 - 0.1 * dOut)})`;
    B.markBtn.style.transform = `scale(${press(t, T.markTap)})`;
    const tp = k(t, T.toast, T.toast + 0.4, E.outBack);
    vis(B.toast, t >= T.toast, 'flex');
    B.toast.style.opacity = cl(tp * 2); B.toast.style.transform = `translateY(${(1 - tp) * 40}px)`;
  }
  // ---- update: Player 2 sees Received, then Used
  sceneIn(scenes.update, t, ...SC.update);
  if (live('update', t)) {
    C.setBubble(B.updBubble, t, T.updBubble, 1e9);
    const mp = k(t, T.updMail, T.updMail + 0.45, E.outBackBig);
    B.updMail.style.opacity = cl(mp * 2); B.updMail.style.transform = `translate(${(1 - mp) * -400}px, 0) rotate(${(1 - mp) * -10}deg)`;
    const f = lerp(1 / 3, 2 / 3, k(t, T.recv - 0.2, T.recv + 0.15, E.outCubic)) + (1 / 3) * k(t, T.used - 0.2, T.used + 0.15, E.outCubic);
    B.trailProg.style.transform = `scaleX(${f})`;
    B.trailNodes.forEach((n, i) => {
      const tt = [-9, -9, T.recv, T.used][i];
      n.classList.toggle('on', t >= tt);
      const b = t >= tt && tt > 0 ? Math.max(0, 1 - Math.abs(t - tt - 0.12) / 0.2) : 0;
      $('.trail2-dot', n).style.transform = `scale(${1 + b * 0.35})`;
    });
  }
  // ---- goal: fill it together
  sceneIn(scenes.goal, t, ...SC.goal);
  if (live('goal', t)) {
    C.setBubble(B.goalBubble, t, T.goalBubble, T.done - 0.15);
    const fills = [[T.g2, 0.67], [T.g3, 1.0]];
    let f = 0.34; for (const [tt, v] of fills) f = lerp(f, v, k(t, tt, tt + 0.5, E.outBack));
    f = Math.min(1, f);
    const Cc = 2 * Math.PI * 80;
    B.goalArc.setAttribute('stroke-dasharray', Cc.toFixed(2)); B.goalArc.setAttribute('stroke-dashoffset', (Cc * (1 - f)).toFixed(2)); B.goalArc.style.opacity = f > 0.003 ? 1 : 0;
    const funded = t >= T.funded;
    vis(B.goalDonate, !funded, 'flex'); vis(B.fundedBtn, funded, 'flex');
    B.fundedBtn.style.transform = `scale(${lerp(1.3, 1, k(t, T.funded, T.funded + 0.4, E.outBackBig))})`;
    B.goalDonate.style.transform = `scale(${Math.min(press(t, T.g2, 0.06), press(t, T.g3, 0.06))})`;
    B.goalShare.style.transform = `scale(${press(t, T.g1, 0.06)})`;
    B.goalNote.style.opacity = k(t, T.g1 + 0.3, T.g1 + 0.7);
    const ring = B.goalRing.getBoundingClientRect();
    C.setSfx(B.fundSfx, t, T.funded, 0.5, { x: ring.left + ring.width / 2, y: ring.top + L(-10, 40) });
    const ls = k(t, T.done, T.done + 0.3, E.outBackBig);
    B.doneStamp.style.opacity = t >= T.done ? 1 : 0; B.doneStamp.style.transform = `rotate(-5deg) scale(${lerp(2.4, 1, ls)})`;
    const db = B.goalDonate.getBoundingClientRect();
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
  // ---- CTA: both doors, one site
  const ctaOn = t >= SC.cta[0] - 0.3;
  vis(scenes.cta, ctaOn);
  if (ctaOn) {
    const p = k(t, SC.cta[0] - 0.2, SC.cta[0] + 0.35, E.inOutQuart);
    scenes.cta.style.clipPath = p < 1 ? `circle(${(p * 120).toFixed(2)}% at 50% 50%)` : 'none';
    const hp = k(t, T.ctaHead, T.ctaHead + 0.5, E.outBackBig); B.ctaHead.style.transform = `scale(${lerp(1.5, 1, hp)})`; B.ctaHead.style.opacity = cl(hp * 2);
    $$('.cta-pill', B.ctaBtns).forEach((el, i) => {
      const bp = k(t, T.ctaBtns + i * 0.15, T.ctaBtns + 0.45 + i * 0.15, E.outBack);
      const nud = t > T.url + 0.4 ? Math.max(0, Math.sin((t - T.url - 0.4) * Math.PI * 1.2 - i * Math.PI)) * 0.04 : 0;
      el.style.opacity = cl(bp * 2); el.style.transform = `translateY(${(1 - bp) * 50}px) scale(${1 + nud})`;
    });
    B.ctaNote.style.opacity = k(t, T.ctaNote, T.ctaNote + 0.4);
    if (!V) { const ar = $$('.cta-pill', B.ctaBtns)[1].getBoundingClientRect(); B.ctaNote.style.left = ar.left + 'px'; B.ctaNote.style.width = ar.width + 'px'; }
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
  buildHook(); buildApply(); buildShare(); buildGive(); buildArrive(); buildUpdate(); buildGoal(); buildCta();
  PATH = cursorPlan();
  await document.fonts.load('400 100px "Instrument Serif"');
  await document.fonts.load('italic 400 100px "Instrument Serif"');
  await document.fonts.load('700 40px "Instrument Sans"');
  await document.fonts.load('600 40px "Instrument Sans"');
  await document.fonts.ready;
  await Promise.all($$('img').map((im) => (im.complete ? im.decode().catch(() => {}) : new Promise((r) => { im.onload = im.onerror = r; }))));
  for (const tt of TAP_TIMES) renderFrame(tt); // measure every tap target while it is on screen (stills render out of order)
  window.compDuration = DUR;
  window.compReady = true;
}
window.renderFrame = async (t) => { renderFrame(t); await new Promise((r) => requestAnimationFrame(() => r())); };
init().catch((e) => { window.compError = String((e && e.stack) || e); });
