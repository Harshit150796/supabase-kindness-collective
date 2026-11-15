// "Hope vs. Know": vertical chat video for coupondonation.com. Every frame is a pure function of t (seconds).
// ?cut=full (56 s) or ?cut=short (30 s). 120 BPM: beat 0.5 s, so every plate cut sits on a beat.
// Speakers: the viewer's phone (JHK's lines: what viewers are thinking) and Coupon, the AI tree (MA's lines: the answers).
// Real material only: the app's tokens and fonts, phone-width captures of the live donate flow and the homepage journey
// (../captures/mobile), and source cards that quote the dossier's figures verbatim with outlet and year on every one.
import { couponTree, setCouponTree, WAVE, talk, blinkAt } from '/video-kit/mascot/coupon-tree.js';

const $ = (s, r = document) => r.querySelector(s);
const cl = (x) => Math.max(0, Math.min(1, x));
const lerp = (a, b, x) => a + (b - a) * x;
const E = {
  lin: (x) => x,
  outCubic: (x) => 1 - Math.pow(1 - x, 3),
  outQuart: (x) => 1 - Math.pow(1 - x, 4),
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
const NSV = 'http://www.w3.org/2000/svg';

const CUT = new URLSearchParams(location.search).get('cut') === 'short' ? 'short' : 'full';
const INK = 'var(--k-ink)', PAPER = 'var(--k-paper)', FOREST = 'var(--k-forest)', BLUEC = 'var(--k-blue)', SOFT = 'var(--k-soft)';
const MOB = '../captures/mobile/';

// ------------------------------------------------------------------ the two cuts
// lines: [who, t0, t1, text]; *word* = emphasis. who: 'you' (the viewer's phone) | 'coupon'.
// Wording follows the dossier's fixes: "Most donors can't easily find out" (Zeffy 2025 supports it, "never find out" has no study)
// and the site's own words for the product ("gift cards", "a receipt for every gift").
const CUTS = {
  full: {
    dur: 56.0,
    lines: [
      ['you', 0.25, 3.0, 'I donated last week… no idea what it actually did.'],
      ['coupon', 3.2, 5.65, "Honestly? Most donors can't easily find out."],
      ['you', 6.15, 7.25, 'Because of scams?'],
      ['coupon', 7.45, 8.45, 'Rarely, actually.'],
      ['coupon', 8.55, 11.05, 'GoFundMe says *under 1 in 1,000* campaigns are fraud.'],
      ['coupon', 11.25, 12.85, 'But the fakes are convincing.'],
      ['coupon', 13.05, 14.85, 'One made-up story raised *$400,000*…'],
      ['coupon', 14.95, 17.15, '…and paid for a *BMW* and *casino trips*.'],
      ['you', 17.35, 17.85, 'Oof.'],
      ['you', 18.65, 19.95, "Then what's the problem?"],
      ['coupon', 20.15, 20.95, 'Not knowing.'],
      ['coupon', 21.05, 23.2, 'Cash is easy to give, *hard to follow*.'],
      ['you', 23.5, 25.3, "So I'm just hoping for the best?"],
      ['coupon', 25.5, 26.3, 'Pretty much.'],
      ['you', 27.1, 30.4, "I don't need a thank-you. I just want to know it helped."],
      ['coupon', 30.65, 31.85, "Maybe that's why"],
      ['coupon', 31.95, 34.7, '*fewer than 1 in 5* first-time donors come back.'],
      ['you', 35.6, 37.55, 'So what does CouponDonation do differently?'],
      ['coupon', 37.75, 40.45, 'Your donation becomes *gift cards for essentials*, not cash.'],
      ['coupon', 40.6, 42.75, 'You get a *receipt for every gift*.'],
      ['you', 43.35, 45.2, "So it can't end up at a casino?"],
      ['coupon', 45.4, 47.6, "A grocery gift card can't buy a *BMW*."],
      ['you', 49.0, 50.65, "So I don't have to hope."],
      ['coupon', 50.95, 51.85, "You'll know."],
    ],
    plates: [
      { type: 'hook', t0: 0, t1: 3.0 },
      { type: 'stat', t0: 3.0, t1: 6.0, o: { bg: BLUEC, lead: 'Only', num: '36%', size: 360, cap: 'of donors can easily see what their gift did', credit: 'Zeffy donor survey · 2025' } },
      { type: 'wall', t0: 6.0, t1: 7.8, o: { cards: [
        { credit: 'Global News · Apr 2025', text: 'Lapu Lapu festival tragedy: GoFundMe pulls down fake post about alleged victim after public outcry' },
        { credit: 'KPRC 2 Houston · Jul 2026', text: "Florida woman who faked GoFundMe for Camp Mystic flood victim's family sentenced to 3 years" } ] } },
      { type: 'stat', t0: 7.8, t1: 10.9, o: { bg: INK, lead: 'Under', num: '0.1%', size: 340, cap: 'of campaigns, GoFundMe says', credit: 'GoFundMe, via NPR · 2018', note: '“less than a 10th of a percent of all campaigns”' } },
      { type: 'card', t0: 10.9, t1: 12.9, o: { bg: PAPER, credit: 'NBC Nightly News · Nov 2018', text: 'Viral GoFundMe Campaign For Homeless Veteran Was A [[Hoax]], Prosecutors Say', size: 96 } },
      { type: 'stat', t0: 12.9, t1: 14.9, o: { bg: FOREST, num: '$400K', size: 300, cap: '14,000+ donors.<br>One fake story.', credit: 'U.S. Attorney, District of New Jersey · 2019', note: 'All donors were later refunded. GoFundMe, via NPR · 2018' } },
      { type: 'card', t0: 14.9, t1: 18.5, o: { bg: PAPER, credit: 'NPR · Nov 2018', text: 'They splurged on a [[BMW]], spent lavishly on vacations, purchased high-end handbags and [[‘hit the casinos.’]]', size: 78, oof: 17.35 } },
      { type: 'cash', t0: 18.5, t1: 19.9 },
      { type: 'card', t0: 19.9, t1: 21.7, o: { bg: PAPER, credit: 'FTC consumer alert · Sept 25, 2025', text: 'Before you donate, [[find out where the money is going]]', size: 104 } },
      { type: 'stat', t0: 21.7, t1: 24.4, o: { bg: BLUEC, lead: 'Only', num: '1 in 4', size: 330, cap: 'say disaster appeals are “very clear”', credit: 'BBB Give.org · 2019', note: 'Survey of 2,100+ U.S. adults' } },
      { type: 'guess', t0: 24.4, t1: 27.0 },
      { type: 'phoneTight', t0: 27.0, t1: 30.4 },
      { type: 'success', t0: 30.4, t1: 32.4 },
      { type: 'stat', t0: 32.4, t1: 35.5, o: { bg: FOREST, lead: 'Fewer than', num: '1 in 5', size: 330, cap: 'first-time donors give again the next year', credit: 'Fundraising Effectiveness Project · 2025', note: '18.9%, data via Bloomerang' } },
      { type: 'stores', t0: 35.5, t1: 37.4 },
      { type: 'amount', t0: 37.4, t1: 39.2 },
      { type: 'review', t0: 39.2, t1: 41.0 },
      { type: 'trail', t0: 41.0, t1: 43.6 },
      { type: 'gag', t0: 43.6, t1: 48.5 },
      { type: 'hopeknow', t0: 48.5, t1: 52.5, o: { knowAt: 50.95 } },
      { type: 'end', t0: 52.5, t1: 56.0 },
    ],
    cp: { enter: 2.85, receiptAt: 40.6, knowAt: 50.95 },
  },
  short: {
    dur: 30.0,
    lines: [
      ['you', 0.25, 2.85, 'I donated last week… no idea what it actually did.'],
      ['coupon', 3.05, 5.25, "Honestly? Most donors can't easily find out."],
      ['coupon', 5.4, 8.0, 'Scams are rare, but one made-up story raised *$400,000*…'],
      ['coupon', 8.1, 10.0, '…and paid for a *BMW* and *casino trips*.'],
      ['you', 10.2, 10.7, 'Oof.'],
      ['you', 11.3, 12.95, "So I'm just hoping for the best?"],
      ['coupon', 13.2, 14.3, 'Not on CouponDonation.'],
      ['coupon', 14.4, 16.5, 'Your donation becomes *gift cards for essentials*,'],
      ['coupon', 16.6, 18.4, 'with a *receipt for every gift*.'],
      ['you', 18.9, 20.6, "So it can't end up at a casino?"],
      ['coupon', 20.8, 22.8, "A grocery gift card can't buy a *BMW*."],
      ['you', 23.3, 24.8, "So I don't have to hope."],
      ['coupon', 25.0, 25.9, "You'll know."],
    ],
    plates: [
      { type: 'hook', t0: 0, t1: 2.9 },
      { type: 'stat', t0: 2.9, t1: 5.2, o: { bg: BLUEC, lead: 'Only', num: '36%', size: 360, cap: 'of donors can easily see what their gift did', credit: 'Zeffy donor survey · 2025' } },
      { type: 'stat', t0: 5.2, t1: 7.0, o: { bg: INK, lead: 'Under', num: '0.1%', size: 340, cap: 'of campaigns, GoFundMe says', credit: 'GoFundMe, via NPR · 2018' } },
      { type: 'stat', t0: 7.0, t1: 9.0, o: { bg: FOREST, num: '$400K', size: 300, cap: '14,000+ donors.<br>One fake story.', credit: 'U.S. Attorney, District of New Jersey · 2019', note: 'All donors were later refunded. GoFundMe, via NPR · 2018' } },
      { type: 'card', t0: 9.0, t1: 11.3, o: { bg: PAPER, credit: 'NPR · Nov 2018', text: 'They splurged on a [[BMW]], spent lavishly on vacations, purchased high-end handbags and [[‘hit the casinos.’]]', size: 78, oof: 10.2 } },
      { type: 'guess', t0: 11.3, t1: 13.2 },
      { type: 'stores', t0: 13.2, t1: 14.5 },
      { type: 'amount', t0: 14.5, t1: 15.8 },
      { type: 'review', t0: 15.8, t1: 17.4 },
      { type: 'trail', t0: 17.4, t1: 19.8 },
      { type: 'gag', t0: 19.8, t1: 23.2 },
      { type: 'hopeknow', t0: 23.2, t1: 27.0, o: { knowAt: 25.0 } },
      { type: 'end', t0: 27.0, t1: 30.0 },
    ],
    cp: { enter: 2.7, receiptAt: 16.6, knowAt: 25.0 },
  },
};
const CFG = CUTS[CUT];
const DUR = CFG.dur;
const CUES = [];
const cue = (t, kind, extra = {}) => CUES.push({ t, kind, ...extra });
window.compT = { cut: CUT, dur: DUR, lines: CFG.lines.map(([who, t0, t1, text]) => ({ who, t0, t1, text })), plates: CFG.plates.map((p) => ({ type: p.type, t0: p.t0, t1: p.t1 })), cues: CUES, beat: 0.5 };

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
const checkSvg = (size, stroke = 'var(--k-green)') => `<svg viewBox="0 0 120 120" width="${size}" height="${size}"><path class="ck" d="M22 62 L50 90 L98 32" fill="none" stroke="${stroke}" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="0"/></svg>`;

// ------------------------------------------------------------------ plate builders: each returns update(t)
// hook: a generic mock fundraiser (grey bars, no real platform, no story) on a phone: scroll, tap Donate, "Payment successful", then nothing
function bHook(P) {
  const { pin } = mkPlate(P, INK, true);
  const title = div('abs serif', pin);
  title.style.cssText = 'left:70px;top:146px;width:940px;font-size:96px;line-height:1.03;color:var(--k-paper)';
  title.textContent = 'Where did your donation actually go?';
  const ph = div('abs', pin); ph.style.cssText = 'left:240px;top:420px;width:600px;height:1100px;border-radius:84px;background:hsl(123 12% 14%)';
  const scr = div('abs', ph); scr.style.cssText = 'left:14px;top:14px;right:14px;bottom:14px;border-radius:72px;overflow:hidden;background:#f4f6f3';
  const bar = (w, h, extra = '') => `<i style="display:block;width:${w};height:${h}px;border-radius:${h / 2}px;background:rgb(18 30 20 / .15);${extra}"></i>`;
  const page = div('abs', scr); page.style.cssText = 'left:0;top:0;width:572px';
  page.innerHTML = `
    <div style="height:64px;display:flex;align-items:center;padding:0 28px">${bar('120px', 16)}</div>
    <div style="height:220px;background:repeating-linear-gradient(135deg,hsl(123 20% 88%) 0 22px,hsl(123 20% 91%) 22px 44px)"></div>
    <div style="padding:28px 28px 0">
      ${bar('90%', 24)}<div style="height:12px"></div>${bar('70%', 24)}<div style="height:12px"></div>${bar('45%', 24)}
      <div style="height:30px"></div>
      <div style="height:14px;border-radius:7px;background:rgb(18 30 20 / .1)"><div style="width:62%;height:100%;border-radius:7px;background:var(--k-green)"></div></div>
      <div style="height:22px"></div>${bar('30%', 18)}<div style="height:10px"></div>${bar('24%', 18)}
      <div style="height:34px"></div>
      <div class="don" style="height:76px;border-radius:20px;background:var(--k-green);display:flex;align-items:center;justify-content:center;font:700 34px 'Instrument Sans',sans-serif;color:#fff">Donate</div>
      <div style="height:36px"></div>${bar('100%', 16)}<div style="height:12px"></div>${bar('86%', 16)}<div style="height:12px"></div>${bar('62%', 16)}
    </div>`;
  const don = $('.don', page);
  const dot = div('touch', scr), rip = div('ripple', scr);
  const sheet = div('abs', scr); sheet.style.cssText = 'left:0;top:0;right:0;bottom:0;background:#fff;display:flex;flex-direction:column;align-items:center;gap:22px;padding-top:70px;box-sizing:border-box;text-align:center';
  sheet.innerHTML = `${checkSvg(150)}<div style="font:700 46px 'Instrument Sans',sans-serif;color:var(--k-ink);letter-spacing:0">Payment successful</div>`;
  const ck = $('.ck', sheet);
  const S = { scroll: [0.15, 0.85], tap: 1.2, sheet: [1.45, 1.8], check: [1.75, 2.2] };
  cue(P.t0 + S.tap, 'tap'); cue(P.t0 + S.sheet[0], 'success');
  return (t) => {
    const tl = t - P.t0;
    page.style.transform = `translateY(${(-250 * k(tl, S.scroll[0], S.scroll[1], E.inOutCubic)).toFixed(1)}px)`;
    // finger: drags up while the page scrolls, lands on Donate, taps
    const drag = k(tl, 0.1, 0.9, E.inOutCubic), land = k(tl, 0.95, 1.15, E.inOutCubic);
    const dx = lerp(lerp(470, 440, drag), 286, land), dy = lerp(lerp(380, 130, drag), 308, land);
    const on = tl > 0.08 && tl < 1.55;
    vis(dot, on); dot.style.transform = `translate(${dx.toFixed(1)}px,${dy.toFixed(1)}px) scale(${(tl > S.tap - 0.05 && tl < S.tap + 0.15 ? 0.85 : 1).toFixed(2)})`;
    const rp = k(tl, S.tap, S.tap + 0.4, E.outCubic);
    rip.style.opacity = tl > S.tap && tl < S.tap + 0.4 ? (1 - rp).toFixed(2) : 0; rip.style.transform = `translate(286px,308px) scale(${lerp(0.5, 1.8, rp).toFixed(2)})`;
    don.style.transform = `scale(${(tl > S.tap - 0.04 && tl < S.tap + 0.18 ? 0.95 : 1)})`;
    sheet.style.transform = `translateY(${((1 - k(tl, S.sheet[0], S.sheet[1], E.outCubic)) * 105).toFixed(1)}%)`;
    ck.setAttribute('stroke-dashoffset', (1 - k(tl, S.check[0], S.check[1], E.inOutCubic)).toFixed(3));
  };
}

// stat: outlined numerals that fill (the site's 100% band), with the claim and its credit
function bStat(P) {
  const o = P.o;
  const { pin } = mkPlate(P, o.bg, true);
  let y = 150;
  let lead = null;
  if (o.lead) { lead = div('abs serif', pin); lead.style.cssText = `left:70px;top:${y}px;font-size:88px;line-height:1;color:var(--k-paper)`; lead.textContent = o.lead; y += 96; }
  const num = numeral(pin, o.num, o.size, y);
  const cap = div('abs serif', pin);
  cap.style.cssText = `left:70px;top:${(y + o.size * 0.92 + 18).toFixed(0)}px;width:940px;font-size:${o.size > 320 ? 66 : 80}px;line-height:1.06;color:var(--k-paper)`;
  cap.innerHTML = o.cap;
  const cr = div('credit', pin); cr.style.cssText = 'position:absolute;left:70px;top:796px;color:rgb(255 255 255 / .92)'; cr.textContent = o.credit;
  let note = null;
  if (o.note) { note = div('sans', pin); note.style.cssText = 'position:absolute;left:70px;top:842px;font-size:26px;line-height:1.25;color:rgb(255 255 255 / .72);width:900px'; note.textContent = o.note; }
  cue(P.t0 + 0.3, 'fill');
  return (t) => {
    const tl = t - P.t0;
    const pop = k(tl, 0.05, 0.55, E.outBack);
    num.el.style.transform = `scale(${lerp(0.9, 1, pop).toFixed(4)})`; num.el.style.opacity = k(tl, 0.0, 0.2).toFixed(2);
    setFill(num, k(tl, 0.3, 1.1, E.inOutSine));
    if (lead) fadeUp(lead, t, P.t0 + 0.0, 0.4, 16);
    fadeUp(cap, t, P.t0 + 0.55, 0.5, 18);
    fadeUp(cr, t, P.t0 + 0.8, 0.45, 12);
    if (note) fadeUp(note, t, P.t0 + 1.0, 0.45, 10);
  };
}

// wall: a couple of real headlines, each with its outlet and date
function bWall(P) {
  const { pin } = mkPlate(P, PAPER);
  const cards = P.o.cards.map((c, i) => {
    const d = div('abs', pin);
    d.style.cssText = `left:60px;width:960px;top:${160 + i * 365}px;height:335px;border-radius:40px;background:var(--k-soft);padding:38px 44px;box-sizing:border-box`;
    d.innerHTML = `<div class="credit" style="color:var(--k-blue)">${c.credit}</div><div class="serif" style="font-size:58px;line-height:1.07;margin-top:14px;color:var(--k-ink)">${c.text}</div>`;
    return d;
  });
  return (t) => {
    cards.forEach((d, i) => { const p = k(t, P.t0 + i * 0.4, P.t0 + i * 0.4 + 0.5, E.site); d.style.opacity = p.toFixed(3); d.style.transform = `translateY(${((1 - p) * 360).toFixed(1)}px)`; });
  };
}

// card: one real quote or headline, big, with the words that matter marked
function bCard(P) {
  const o = P.o;
  const { pin } = mkPlate(P, o.bg);
  // the credit and the quote sit as one block, centred in the plate
  const wrap = div('abs', pin); wrap.style.cssText = 'left:70px;top:150px;width:940px;height:740px;display:flex;flex-direction:column;justify-content:center;gap:34px';
  const cr = div('credit', wrap); cr.style.cssText = 'color:var(--k-blue);font-size:36px'; cr.textContent = o.credit;
  const tx = div('serif', wrap);
  tx.style.cssText = `font-size:${o.size}px;line-height:1.06;color:var(--k-ink)`;
  const parts = o.text.split(/(\[\[.*?\]\])/).filter(Boolean);
  let wi = 0; const hls = [];
  tx.classList.add('words');
  // words keep their own spacing: punctuation after a marked phrase stays attached to it
  tx.innerHTML = parts.map((p) => {
    const isH = p.startsWith('[[');
    const body = isH ? p.slice(2, -2) : p;
    const inner = body.split(' ').filter(Boolean).map((w) => `<span class="w"><span>${w}</span></span>`).join(' ');
    if (isH) return `<span class="hl">${inner}</span>`;
    return (body.startsWith(' ') ? ' ' : '') + inner + (body.endsWith(' ') ? ' ' : '');
  }).join('');
  const spans = [...tx.querySelectorAll('.w > span')];
  const hlEls = [...tx.querySelectorAll('.hl')];
  const hlAt = hlEls.map((_, i) => 0.75 + i * 0.5);
  return (t) => {
    const tl = t - P.t0;
    fadeUp(cr, t, P.t0 + 0.05, 0.35, 10);
    rise(spans, t, P.t0 + 0.12, 0.045, 0.55);
    hlEls.forEach((h, i) => { h.style.backgroundSize = `${(k(tl, hlAt[i], hlAt[i] + 0.45, E.inOutCubic) * 100).toFixed(1)}% 100%`; });
    if (o.oof) { const d = t - o.oof; pin.style.marginTop = (d > 0 && d < 0.7 ? 28 * Math.exp(-d * 7) * Math.cos(d * 24) : 0).toFixed(1) + 'px'; }
  };
}

// cash: easy to give, hard to follow: it drifts up and out of frame
function bCash(P) {
  const { pin } = mkPlate(P, PAPER);
  const defs = [[-250, 40, -12, 0.0], [190, -10, 9, 0.06], [-60, 160, 4, 0.12], [260, 190, -7, 0.18], [-230, -150, 14, 0.24], [30, -190, -5, 0.3]];
  const bills = defs.map(([x, y, r], i) => {
    const b = div('abs', pin);
    b.style.cssText = 'left:375px;top:392px;width:330px;height:156px;border-radius:18px;background:var(--k-green);box-shadow:inset 0 0 0 9px hsl(123 46% 46%)';
    b.innerHTML = '<div class="serif" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:100px;color:var(--k-paper)">$</div>';
    return { b, x, y, r, d: defs[i][3] };
  });
  return (t) => {
    const tl = t - P.t0;
    bills.forEach((o) => {
      const p = k(tl, 0.05 + o.d, 1.3 + o.d, E.inOutCubic), pin_ = k(tl, 0, 0.25 + o.d, E.outBack);
      o.b.style.opacity = (1 - k(tl, 0.75 + o.d, 1.35 + o.d)).toFixed(3);
      o.b.style.transform = `translate(${(o.x * pin_ * 0.55 + o.x * p * 0.9).toFixed(1)}px,${(o.y * pin_ * 0.4 - 430 * p).toFixed(1)}px) rotate(${(o.r * (0.5 + p)).toFixed(1)}deg) scale(${lerp(0.7, 1, pin_).toFixed(3)})`;
    });
  };
}

// guess: "Giving shouldn't mean guessing."
function bGuess(P) {
  const { pin } = mkPlate(P, INK, true);
  const tx = div('abs serif', pin); tx.style.cssText = 'left:70px;top:230px;width:940px;font-size:132px;line-height:1.02;color:var(--k-paper)';
  tx.classList.add('words');
  tx.innerHTML = `<span class="w"><span>Giving</span></span> <span class="w"><span>shouldn’t</span></span> <span class="w"><span>mean</span></span> <span style="position:relative;display:inline-block"><span class="w"><span>guessing.</span></span><svg viewBox="0 0 600 30" preserveAspectRatio="none" style="position:absolute;left:0;bottom:-0.04em;width:100%;height:0.16em;overflow:visible"><path d="M4 20 C 150 6, 420 6, 596 18" fill="none" stroke="hsl(123 46% 62%)" stroke-width="6" stroke-linecap="round" vector-effect="non-scaling-stroke" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/></svg></span>`;
  const spans = [...tx.querySelectorAll('.w > span')], path = $('path', tx);
  return (t) => {
    const tl = t - P.t0;
    rise(spans, t, P.t0 + 0.05, 0.12, 0.6);
    path.setAttribute('stroke-dashoffset', (1 - k(tl, 0.9, 1.5, E.inOutCubic)).toFixed(3));
  };
}

// the phone's own screen, used by the viewer avatar, the tight shot and the cut-back
const SUCCESS_HTML = (sz, fs) => `${checkSvg(sz)}<div style="font:700 ${fs}px 'Instrument Sans',sans-serif;color:var(--k-ink);letter-spacing:0;text-align:center">Payment successful</div>`;
function bPhoneTight(P) {
  const { pin } = mkPlate(P, PAPER);
  const ph = div('abs', pin); ph.style.cssText = 'left:270px;top:150px;width:540px;height:1100px;border-radius:78px;background:hsl(123 12% 14%)';
  const scr = div('abs', ph); scr.style.cssText = 'left:14px;top:14px;right:14px;bottom:14px;border-radius:66px;overflow:hidden;background:#fff;display:flex;flex-direction:column;align-items:center;gap:30px;padding-top:240px;box-sizing:border-box';
  scr.innerHTML = SUCCESS_HTML(170, 44);
  return () => {};
}
function bSuccess(P) {
  const { pin } = mkPlate(P, INK, true);
  const card = div('abs', pin); card.style.cssText = 'left:60px;top:150px;width:960px;height:720px;border-radius:64px;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:46px';
  card.innerHTML = SUCCESS_HTML(260, 76);
  return () => {};
}

// real phone-width screens of the live donate flow and the homepage journey
const IMG_CACHE = {};
function img(parent, name, w) {
  const im = document.createElement('img'); im.src = `${MOB}${name}.png`; im.style.width = w + 'px'; im.style.opacity = 0; parent.appendChild(im);
  (IMG_CACHE[name] = IMG_CACHE[name] || []).push(im); return im;
}
const SW = 788, SH = 590, S0 = SW / 358; // screen frame size; CSS px of the card -> screen px
function bSite(P, def) {
  const { pin } = mkPlate(P, PAPER);
  const label = div('abs serif', pin); label.style.cssText = 'left:70px;top:146px;width:940px;font-size:92px;line-height:1;color:var(--k-ink)';
  const lab = words(label, def.label);
  const fr = div('screenf', pin); fr.style.top = '290px';
  const frames = {};
  def.states.forEach((s) => { if (!frames[s.img]) frames[s.img] = img(fr, s.img, def.imgW || SW); });
  const dot = div('touch', fr), rip = div('ripple', fr);
  const marks = (def.marks || []).map((m) => ({ ...m, el: div('marker', fr) }));
  const D = P.t1 - P.t0;
  const camAt = (f) => {
    const c = def.cams; let a = c[0], b = c[0];
    for (let i = 0; i < c.length; i++) { if (f >= c[i].at) { a = c[i]; b = c[Math.min(i + 1, c.length - 1)]; } }
    const e = a === b ? 0 : E.inOutCubic(cl((f - a.at) / (b.at - a.at)));
    return { y: lerp(a.y, b.y, e), z: lerp(a.z || 1, b.z || 1, e), x: lerp(a.x || 0, b.x || 0, e) };
  };
  const toScreen = (cam, x, y) => ({ x: (x - cam.x) * (def.imgW ? def.imgW / 358 : S0) * cam.z, y: (y - cam.y) * (def.imgW ? def.imgW / 358 : S0) * cam.z });
  (def.taps || []).forEach((tp) => cue(P.t0 + tp.at * D, 'tap'));
  return (t) => {
    const f = (t - P.t0) / D;
    rise(lab, t, P.t0 + 0.05, 0.1, 0.55);
    const cam = camAt(f), s = (def.imgW ? def.imgW / 358 : S0) * cam.z;
    let cur = def.states[0];
    def.states.forEach((st) => { if (f >= st.at) cur = st; });
    Object.entries(frames).forEach(([name, im]) => {
      const show = name === cur.img;
      im.style.opacity = show ? 1 : 0;
      im.style.transform = `translate(${(-cam.x * s).toFixed(1)}px,${(-cam.y * s).toFixed(1)}px) scale(${cam.z.toFixed(4)})`;
      im.style.transformOrigin = '0 0';
    });
    // finger: fades in before each tap, moves between taps in screen space, presses on the tap
    const taps = def.taps || [];
    let on = false, px = 0, py = 0, press = 1, rp = 1, rpos = null;
    for (let i = 0; i < taps.length; i++) {
      const tp = taps[i], c0 = camAt(tp.at), pos = toScreen(c0, tp.x, tp.y);
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

let BOX = {};
const bStores = (P) => bSite(P, {
  label: 'Pick your stores.',
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

// trail: the homepage's own journey, a ticket riding it step by step; "The receipt closes the trail."
function bTrail(P) {
  const { pin } = mkPlate(P, BLUEC, true);
  const label = div('abs serif', pin); label.style.cssText = 'left:70px;top:146px;width:940px;font-size:92px;line-height:1;color:var(--k-paper)';
  const lab = words(label, 'Follow the trail.');
  const win = div('abs', pin); win.style.cssText = 'left:150px;top:290px;width:780px;height:600px;overflow:hidden';
  const im = img(win, 'home-journey', 780); im.style.opacity = 1;
  const SC = 780 / 390; // css px -> screen px
  const tk = div('abs', win); tk.innerHTML = `<svg viewBox="0 0 44 30" width="66" height="45"><rect x="1.5" y="1.5" width="41" height="27" rx="6" fill="hsl(123 46% 34%)" stroke="#fff" stroke-width="2"/><circle cx="1.5" cy="15" r="4.5" fill="var(--k-blue)"/><circle cx="42.5" cy="15" r="4.5" fill="var(--k-blue)"/><path d="M14 15.5 l5 5 10-11" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  tk.style.cssText += ';left:0;top:0;width:66px;height:45px;z-index:3';
  const hl = div('abs', win); hl.style.cssText = 'border-radius:12px;background:rgb(255 255 255 / .16);outline:4px solid #fff;z-index:2';
  const stepY = [67, 185, 303, 421]; // icon centres in css px of the capture
  const D = P.t1 - P.t0;
  const camY = (f) => lerp(18, 230, E.inOutCubic(cl((f - 0.42) / 0.2)));
  [0.12, 0.3, 0.55, 0.72].forEach((f) => cue(P.t0 + f * D, 'step'));
  return (t) => {
    const f = (t - P.t0) / D;
    rise(lab, t, P.t0 + 0.05, 0.1, 0.55);
    const cy = camY(f);
    im.style.transform = `translateY(${(-cy * SC).toFixed(1)}px)`;
    // ticket hops from step to step
    const marks = [0.12, 0.3, 0.55, 0.72];
    let i = 0; marks.forEach((m, j) => { if (f >= m - 0.07) i = j; });
    const prev = Math.max(0, i - 1), e = i === 0 ? 1 : E.inOutCubic(cl((f - (marks[i] - 0.07)) / 0.07));
    const y = lerp(stepY[prev], stepY[i], e);
    const hop = i === 0 ? 0 : Math.sin(Math.PI * e) * 26;
    tk.style.transform = `translate(${(26 * SC - 33).toFixed(1)}px,${((y - cy) * SC - 22 - hop).toFixed(1)}px) scale(${lerp(0.4, 1, k(f, 0.02, 0.12, E.outBack)).toFixed(2)})`;
    // the closing line: boxed once the ticket arrives
    const hp = k(f, 0.8, 0.9, E.outBack);
    vis(hl, hp > 0.01);
    const ly = 474, lh = 36; // "The receipt closes the trail." in css px of the capture
    hl.style.left = (48 * SC) + 'px'; hl.style.top = ((ly - cy) * SC).toFixed(1) + 'px'; hl.style.width = (216 * SC) + 'px'; hl.style.height = (lh * SC).toFixed(1) + 'px'; hl.style.opacity = hp.toFixed(2);
  };
}

// gag: a grocery gift card is not a BMW
function bGag(P) {
  const { pin } = mkPlate(P, PAPER);
  const D = P.t1 - P.t0;
  const tk = div('abs', pin); tk.style.cssText = 'left:420px;top:150px;width:240px;height:164px';
  tk.innerHTML = `<svg viewBox="0 0 44 30" width="240" height="164"><rect x="1.5" y="1.5" width="41" height="27" rx="6" fill="hsl(123 46% 34%)"/><circle cx="1.5" cy="15" r="4.5" fill="hsl(120 8% 98.5%)"/><circle cx="42.5" cy="15" r="4.5" fill="hsl(120 8% 98.5%)"/><path d="M14 15.5 l5 5 10-11" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const t1 = div('abs serif', pin); t1.style.cssText = 'left:0;right:0;top:346px;text-align:center;font-size:104px;line-height:1;color:var(--k-ink)';
  const w1 = words(t1, 'Grocery gift card');
  const ne = div('abs serif', pin); ne.style.cssText = 'left:0;right:0;top:456px;text-align:center;font-size:150px;line-height:1;color:var(--k-green)'; ne.textContent = '≠';
  const bmw = div('abs serif', pin); bmw.style.cssText = 'left:0;right:0;top:612px;text-align:center;font-size:210px;line-height:1;color:var(--k-ink)';
  bmw.innerHTML = `<span style="position:relative;display:inline-block">BMW<i class="strike" style="position:absolute;left:-4%;top:52%;width:108%;height:12px;border-radius:6px;background:var(--k-green);transform-origin:0 50%;transform:scaleX(0)"></i></span>`;
  const strike = $('.strike', bmw);
  const F = { tk: 0.03, t1: 0.09, ne: 0.62, bmw: 0.7, st: 0.84 };
  cue(P.t0 + F.st * D, 'strike');
  return (t) => {
    const f = (t - P.t0) / D;
    const p = k(f, F.tk, F.tk + 0.1, E.outBack);
    tk.style.transform = `scale(${p.toFixed(3)}) rotate(${((1 - p) * -14).toFixed(1)}deg)`;
    rise(w1, t, P.t0 + F.t1 * D, 0.1, 0.55);
    const np = k(f, F.ne, F.ne + 0.07, E.outBack); ne.style.opacity = np.toFixed(2); ne.style.transform = `scale(${lerp(0.5, 1, np).toFixed(3)})`;
    const bp = k(f, F.bmw, F.bmw + 0.08, E.site); bmw.style.opacity = bp.toFixed(2); bmw.style.transform = `translateY(${((1 - bp) * 50).toFixed(1)}px)`;
    strike.style.transform = `scaleX(${k(f, F.st, F.st + 0.06, E.inOutCubic).toFixed(3)})`;
  };
}

// hope -> know: "Hope." gets crossed out the moment the answer lands
function bHopeKnow(P) {
  const { pin } = mkPlate(P, INK, true);
  const hope = div('abs serif', pin); hope.style.cssText = 'left:70px;top:150px;font-size:300px;line-height:1;color:var(--k-paper)';
  hope.innerHTML = `<span style="position:relative;display:inline-block"><span class="hp">Hope.</span><i class="strk" style="position:absolute;left:-2%;top:56%;width:104%;height:14px;border-radius:7px;background:hsl(123 46% 62%);transform-origin:0 50%;transform:scaleX(0)"></i></span>`;
  const know = numeral(pin, 'Know.', 300, 470);
  know.el.style.textAlign = 'left'; know.el.style.left = '70px';
  const ul = div('abs', pin); ul.style.cssText = 'left:76px;top:768px;width:560px;height:12px;border-radius:6px;background:hsl(123 46% 62%);transform-origin:0 50%;transform:scaleX(0)';
  const hp = $('.hp', hope), strk = $('.strk', hope);
  const K = P.o.knowAt;
  cue(K, 'know');
  return (t) => {
    fadeUp(hope, t, P.t0 + 0.0, 0.5, 40);
    const d = k(t, K, K + 0.25, E.inOutCubic);
    strk.style.transform = `scaleX(${d.toFixed(3)})`; hp.style.opacity = (1 - 0.65 * d).toFixed(2);
    know.el.style.opacity = k(t, K - 0.1, K + 0.2).toFixed(2);
    know.el.style.transform = `translateY(${((1 - k(t, K - 0.1, K + 0.4, E.site)) * 60).toFixed(1)}px)`;
    setFill(know, k(t, K + 0.1, K + 0.8, E.inOutSine));
    ul.style.transform = `scaleX(${k(t, K + 0.7, K + 1.2, E.inOutCubic).toFixed(3)})`;
  };
}

// ------------------------------------------------------------------ end card (above the chat): logo, "Stop hoping. Start knowing.", the site, the trademark note
let END = null;
function buildEnd(P) {
  const el = div('abs', stage); el.style.cssText = 'left:0;top:0;width:1080px;height:1920px;background:var(--k-paper);z-index:300;display:none;overflow:hidden';
  const h = div('abs serif', el); h.style.cssText = 'left:40px;top:300px;width:1000px;font-size:156px;line-height:0.98;color:var(--k-ink);text-align:center';
  h.innerHTML = '<span class="w"><span>Stop</span></span> <span class="w"><span>hoping.</span></span><br><span class="w"><span>Start</span></span> <span class="w"><span>knowing.</span></span>';
  const spans = [...h.querySelectorAll('.w > span')];
  const lock = div('lockup', el, `<img src="/brand/logo-256.webp" alt=""><div><div class="wm"><span class="c">Coupon</span><span class="d">Donation</span></div><div class="tag">Transforming Giving</div></div>`);
  lock.style.cssText += ';left:100px;top:720px';
  const tagl = div('abs sans', el); tagl.style.cssText = 'left:0;right:0;top:1010px;text-align:center;font-size:42px;font-weight:600;color:var(--k-ink)'; tagl.textContent = 'Give what people need.  ·  coupondonation.com';
  const fine = div('fine', el); fine.style.cssText += ';position:absolute;left:70px;top:1215px;width:600px';
  fine.innerHTML = 'Store names and logos shown on CouponDonation are trademarks of their owners. Those stores are not affiliated with, and do not sponsor or endorse, CouponDonation. CouponDonation Inc. is not a registered charity, and gifts are not tax-deductible.';
  const host = div('abs', el); host.style.cssText = 'left:0;top:0;width:0;height:0';
  const m = couponTree(host); m.svg.style.zIndex = 5;
  END = { el, spans, lock, tagl, fine, m, P };
  cue(P.t0 + 0.2, 'end');
}
function updateEnd(t) {
  const P = END.P, tl = t - P.t0;
  const on = tl > -0.2;
  vis(END.el, on);
  if (!on) return;
  const w = k(t, P.t0 - 0.15, P.t0 + 0.2, E.inOutQuart);
  END.el.style.clipPath = w < 1 ? `inset(${((1 - w) * 100).toFixed(2)}% 0 0 0)` : 'none';
  rise(END.spans, t, P.t0 + 0.25, 0.1, 0.6);
  const lw = END.lock.offsetWidth || 780;
  END.lock.style.left = ((1080 - lw) / 2).toFixed(1) + 'px';
  fadeUp(END.lock, t, P.t0 + 0.75, 0.55, 30);
  fadeUp(END.tagl, t, P.t0 + 1.1, 0.5, 18);
  fadeUp(END.fine, t, P.t0 + 1.4, 0.5, 10);
  const pr = k(t, P.t0 + 0.6, P.t0 + 1.15, E.outBack);
  setCouponTree(END.m, { x: 850 + (1 - pr) * 260, y: 1440 - Math.sin(Math.PI * Math.min(1, pr)) * 60, scale: 0.9 * Math.max(0.001, pr), squash: Math.max(0, 1 - Math.abs(tl - 1.05) / 0.12) * 0.4, sway: Math.sin(t * 2.1) * 2.5, blink: blinkAt(t, 5), ...WAVE(t), gaze: [-0.4, 0.1] });
}

// ------------------------------------------------------------------ the chat: panel, the viewer's phone, Coupon and the subtitle bubbles
const CHAT = {};
function buildChat() {
  CHAT.panel = div('', stage); CHAT.panel.id = 'panel';
  CHAT.phone = div('', stage); CHAT.phone.id = 'phone';
  CHAT.phone.innerHTML = `<div class="body"></div><div class="screen"><div class="scr succ">${SUCCESS_HTML(70, 22)}</div><div class="scr know" style="opacity:0"><svg viewBox="0 0 120 120" width="64" height="64"><path d="M22 62 L50 90 L98 32" fill="none" stroke="var(--k-green)" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/></svg><div class="t">Receipt for every gift</div></div></div>`;
  CHAT.succ = $('.succ', CHAT.phone); CHAT.know = $('.know', CHAT.phone);
  const host = div('abs', stage); host.style.cssText = 'left:0;top:0;width:0;height:0;z-index:126';
  CHAT.m = couponTree(host);
  // one bubble per speaker; text is rebuilt per line and measured once
  CHAT.bub = { you: mkBubble('you'), coupon: mkBubble('coupon') };
  CHAT.lines = CFG.lines.map(([who, t0, t1, text], i) => prepLine({ who, t0, t1, text, i }));
}
function mkBubble(who) {
  const b = div(`bubble ${who}`, stage);
  const tail = div('tail', b);
  b.style.transformOrigin = who === 'you' ? '120px 100%' : 'calc(100% - 150px) 100%';
  tail.style[who === 'you' ? 'left' : 'right'] = who === 'you' ? '96px' : '128px';
  return { el: b, tail, cur: -1 };
}
function parseWords(text) {
  const out = []; let em = false;
  text.split(' ').forEach((tok) => {
    let w = '';
    for (const ch of tok) { if (ch === '*') { em = !em; } else w += ch; }
    if (w) out.push({ w, em: em || tok.includes('*') });
    if (tok.endsWith('*')) em = false;
  });
  return out;
}
function prepLine(L) {
  const ws = parseWords(L.text);
  // spoken time of each word: proportional to its length, with a little weight for punctuation pauses
  const wts = ws.map((x) => Math.max(2, x.w.length) + (/[,.?…]$/.test(x.w) ? 2.5 : 0));
  const sum = wts.reduce((a, b) => a + b, 0);
  let acc = 0; L.wt = wts.map((wgt) => { const a = L.t0 + (L.t1 - L.t0) * (acc / sum); acc += wgt; return a; });
  L.ws = ws;
  L.html = ws.map((x, i) => `<span class="wd${x.em ? ' em' : ''}" data-i="${i}">${x.w}</span>`).join(' ');
  L.has_em = ws.some((x) => x.em);
  return L;
}
function measureLines() {
  const probe = mkBubble('coupon'); probe.el.style.visibility = 'hidden'; probe.el.style.display = 'block';
  CHAT.lines.forEach((L) => {
    const b = L.who === 'you' ? CHAT.bub.you : CHAT.bub.coupon;
    probe.el.className = `bubble ${L.who}`; probe.el.innerHTML = L.html; probe.el.appendChild(div('tail', probe.el));
    L.w = probe.el.offsetWidth; L.h = probe.el.offsetHeight;
  });
  probe.el.remove();
}
const BUB_BOTTOM = 1176;
function activeLine(t) {
  let a = null;
  CHAT.lines.forEach((L, i) => {
    const next = CHAT.lines[i + 1];
    const end = Math.min(L.t1 + 0.45, next ? next.t0 - 0.06 : 1e9);
    if (t >= L.t0 - 0.02 && t < end) a = L;
  });
  return a;
}
function updateBubbles(t) {
  const L = activeLine(t);
  ['you', 'coupon'].forEach((w) => { if (!L || L.who !== w) vis(CHAT.bub[w].el, false); });
  if (!L) return;
  const B = CHAT.bub[L.who], el = B.el;
  if (B.cur !== L.i) { el.innerHTML = L.html; el.appendChild(B.tail); B.cur = L.i; B.wd = [...el.querySelectorAll('.wd')]; }
  vis(el, true);
  const left = L.who === 'you' ? 60 : 960 - L.w;
  el.style.left = left + 'px'; el.style.top = (BUB_BOTTOM - L.h) + 'px';
  const next = CHAT.lines[L.i + 1], end = Math.min(L.t1 + 0.45, next ? next.t0 - 0.06 : 1e9);
  const pop = k(t, L.t0, L.t0 + 0.22, E.outBack), out = k(t, end - 0.1, end, E.inCubic);
  const prev = CHAT.lines[L.i - 1]; const swap = prev && prev.who === L.who && L.t0 - prev.t1 < 0.6;
  const s = swap ? lerp(0.96, 1, k(t, L.t0, L.t0 + 0.12)) : lerp(0.6, 1, pop);
  el.style.transform = `scale(${(s * (1 - 0.12 * out)).toFixed(4)})`;
  el.style.opacity = (swap ? 1 : cl(pop * 1.6)) * (1 - out);
  B.wd.forEach((n, i) => n.classList.toggle('on', t >= L.wt[i]));
}
const lineAt = (t, who) => CHAT.lines.find((L) => L.who === who && t >= L.t0 && t < L.t1 + 0.3);
function poseChars(t) {
  const C = CFG.cp;
  // Coupon: hops in on its first line, listens when the phone talks, points when it names a number, cheers on "You'll know."
  const pin = k(t, C.enter, C.enter + 0.55, E.outBack);
  const speak = lineAt(t, 'coupon'), ask = lineAt(t, 'you');
  const oof = ask && ask.text === 'Oof.';
  const know = speak && speak.text === "You'll know.";
  const sx = 780 + (1 - pin) * 330, sy = 1526 - Math.sin(Math.PI * Math.min(1, pin)) * 80;
  let pose = { sway: Math.sin(t * 2.1) * 2.5, blink: blinkAt(t, 3), gaze: [-0.9, 0.45], smile: 1, armL: 40, armR: 40, brows: 0.15 };
  if (speak) {
    const d = t - speak.t0, dd = speak.t1 - speak.t0;
    pose.mouth = talk(t, speak.t0 + 0.05, speak.t1 - 0.05, 7.5); pose.gaze = [-0.55, 0.1]; pose.brows = 0.45;
    const pt = speak.has_em ? k(t, speak.t0 + 0.25, speak.t0 + 0.7, E.inOutCubic) * (1 - k(t, speak.t1 - 0.25, speak.t1, E.inCubic)) : 0;
    pose.armL = lerp(40, 128, pt) + Math.sin(t * 9) * 3 * pt;
    pose.armR = 40 + 10 * Math.sin(t * 3.3);
    if (know) { const c = k(t, speak.t0, speak.t0 + 0.3, E.outCubic); pose.armL = lerp(pose.armL, 150, c); pose.armR = 150 + Math.sin(t * 11) * 10; pose.mouth = Math.max(pose.mouth, 0.5); pose.brows = 0.4; }
  } else if (oof) {
    const d = t - ask.t0; const c = k(t, ask.t0 - 0.05, ask.t0 + 0.15, E.outCubic);
    pose.brows = 1; pose.mouth = 0.18 * c; pose.rot = -5 * c; pose.squash = 0.3 * c; pose.gaze = [-0.9, 0.6]; pose.smile = 0.1; pose.armL = 40; pose.armR = 40 + 20 * c;
  } else if (ask) {
    pose.brows = 0.3; pose.squash = 0.05 * Math.abs(Math.sin((t - ask.t0) * 5));
  }
  vis(CHAT.m.svg, pin > 0.001);
  setCouponTree(CHAT.m, { x: sx, y: sy, scale: 0.98 * Math.max(0.001, pin), squash: (pose.squash || 0) + Math.max(0, 1 - Math.abs(t - C.enter - 0.55) / 0.12) * 0.35, ...pose });
  // the phone: wobbles on its own "Oof.", pulses lightly while it talks; its screen finally changes when the product explains itself
  let rot = 0, sc = 1;
  if (ask) { sc = 1 + 0.025 * Math.sin((t - ask.t0) * 9); if (oof) rot = 5 * Math.exp(-(t - ask.t0) * 6) * Math.sin((t - ask.t0) * 30); }
  CHAT.phone.style.transform = `rotate(${rot.toFixed(2)}deg) scale(${sc.toFixed(4)})`;
  const kp = k(t, C.receiptAt, C.receiptAt + 0.35, E.inOutCubic);
  CHAT.succ.style.opacity = (1 - kp).toFixed(2); CHAT.know.style.opacity = kp.toFixed(2);
}

// ------------------------------------------------------------------ build + frame
const BUILD = { hook: bHook, stat: bStat, wall: bWall, card: bCard, cash: bCash, guess: bGuess, phoneTight: bPhoneTight, success: bSuccess,
  stores: bStores, amount: bAmount, review: bReview, trail: bTrail, gag: bGag, hopeknow: bHopeKnow };
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
  updateBubbles(t);
  poseChars(t);
  updateEnd(t);
}

async function init() {
  CFG.plates.forEach((p, i) => {
    if (p.type === 'end') { buildEnd({ ...p, i }); return; }
    const P = { ...p, i };
    const built = BUILD[p.type](P);
    // builders create their own plate element: find it (the last .plate added)
    const el = stage.querySelectorAll('.plate'); P.el = el[el.length - 1]; P.pin = P.el.querySelector('.pin');
    P.update = built;
    PL.push(P);
  });
  buildChat();
  await document.fonts.load('400 100px "Instrument Serif"');
  await document.fonts.load('600 40px "Instrument Sans"');
  await document.fonts.load('700 40px "Instrument Sans"');
  await document.fonts.ready;
  await Promise.all([...document.images].map((im) => (im.complete ? im.decode().catch(() => {}) : new Promise((r) => { im.onload = im.onerror = r; }))));
  measureLines();
  CHAT.lines.forEach((L) => { cue(L.t0, 'line', { who: L.who, n: L.ws.length, em: L.has_em }); });
  cue(CFG.cp.enter, 'enter');
  const oofL = CHAT.lines.find((L) => L.text === 'Oof.'); if (oofL) cue(oofL.t0, 'oof');
  cue(CFG.cp.receiptAt, 'receipt');
  renderFrame(0);
  window.compDuration = DUR;
  window.compReady = true;
}
window.renderFrame = async (t) => {
  renderFrame(t);
  await new Promise((r) => requestAnimationFrame(() => r()));
};
init().catch((e) => { window.compError = String((e && e.stack) || e); });
