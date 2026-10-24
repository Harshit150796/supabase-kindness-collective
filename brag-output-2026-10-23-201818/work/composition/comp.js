// The new coupondonation.com: launch film. Every frame is a pure function of t (seconds).
// Real material only: the app's compiled CSS/tokens/fonts (/src/index.css), section markup captured
// from the running site (./markup/*.frag), and frame sequences of the homepage opening and live 3D
// hero captured deterministically from the dev server (../captures/hero/*).
// 100 BPM: beat 0.6 s, bar 2.4 s; every scene cut sits on a bar line.

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const cl = (x) => Math.max(0, Math.min(1, x));
const lerp = (a, b, x) => a + (b - a) * x;
const E = {
  lin: (x) => x,
  outExpo: (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x)),
  outCubic: (x) => 1 - Math.pow(1 - x, 3),
  outQuart: (x) => 1 - Math.pow(1 - x, 4),
  inCubic: (x) => x * x * x,
  inOutCubic: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  inOutQuart: (x) => (x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2),
  inOutSine: (x) => -(Math.cos(Math.PI * x) - 1) / 2,
  site: (x) => { // cubic-bezier(.16,1,.3,1), the site's editorial ease (approximation)
    return 1 - Math.pow(1 - x, 4.2);
  },
  outBack: (x) => { const c1 = 1.4, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); },
};
const k = (t, a, b, e = E.outCubic) => e(cl((t - a) / (b - a)));
const vis = (el, on, d = 'block') => { const v = on ? d : 'none'; if (el.style.display !== v) el.style.display = v; };
function rng(seed) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let x = Math.imul(seed ^ (seed >>> 15), 1 | seed); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; }

// ------------------------------------------------------------------ timeline
const BEAT = 0.6, BAR = 2.4;
const SC = {
  hook: [0, 4.8], brand: [4.8, 9.6], tree: [9.6, 14.4], give: [14.4, 24.0], donate: [24.0, 36.0],
  every: [36.0, 43.2], track: [43.2, 52.8], apply: [52.8, 62.4], secure: [62.4, 67.2],
  day: [67.2, 69.6], cta: [69.6, 74.4], end: [74.4, 79.2],
};
const DUR = 79.2;
const T = {
  hookWords: 0.2, allOf: 2.4, underline: 2.7,
  introCap: 5.45,
  giveHead: 14.75, giveSub: 15.3, deal: [16.8, 17.4, 18.0, 18.6],
  donHead: 24.25, taps: [25.2, 25.8, 26.4], toAmount: 27.0, amt50: 28.2, ledger: 28.35, toReview: 31.2, summary: 33.0,
  everyHead: 36.3, fill: [37.4, 39.8], noFee: 38.6, promises: 40.4,
  trackLine: 43.45, journey: 48.0, stops: [48.6, 49.2, 49.8, 50.4],
  applyIn: 52.8, needs: [53.7, 54.3], stores: [55.2, 55.8, 56.4], freeLine: 58.2,
  secHead: 62.6, badges: [63.2, 63.6, 64.0],
  ctaHead: 70.4, ctaBtns: 71.4,
  endLock: 74.7, endUrl: 75.6, endFine: 76.2,
};
window.compT = { SC, T, DUR, BEAT, BAR };

// ------------------------------------------------------------------ stage + helpers
const stage = $('#stage');
const layer = (name) => { const d = document.createElement('div'); d.className = `layer scene-${name}`; stage.appendChild(d); return d; };
const div = (cls, parent, html = '') => { const d = document.createElement('div'); if (cls) d.className = cls; if (html) d.innerHTML = html; if (parent) parent.appendChild(d); return d; };
const box = (el, x, y, w, h) => { el.style.left = x + 'px'; el.style.top = y + 'px'; if (w != null) el.style.width = w + 'px'; if (h != null) el.style.height = h + 'px'; return el; };
async function frag(name) {
  const r = await fetch(`./markup/${name}.frag`);
  if (!r.ok) throw new Error('missing markup ' + name);
  const tpl = document.createElement('template');
  tpl.innerHTML = (await r.text()).replace(/<!--[\s\S]*?-->/g, '').trim();
  const el = tpl.content.firstElementChild;
  $$('script', el).forEach((s) => s.remove());
  $$('img[loading]', el).forEach((im) => im.removeAttribute('loading')); // hidden layers must still load their images
  // captured mid-animation: settle everything to its final, visible pose
  [el, ...$$('*', el)].forEach((n) => {
    const st = n.getAttribute && n.getAttribute('style');
    if (st && /opacity:\s*0(?![.\d])/.test(st)) n.setAttribute('style', st.replace(/opacity:\s*0(?![.\d]);?/g, ''));
  });
  // headings with painted line overlays: show the real text, drop the overlay
  $$('.heading-line-overlay', el).forEach((o) => o.remove());
  $$('.line-reveal-active', el).forEach((h) => h.classList.remove('line-reveal-active'));
  return el;
}
function words(el, text) {
  el.classList.add('words');
  el.innerHTML = text.split(' ').map((w) => `<span class="w"><span>${w}</span></span>`).join(' ');
  return $$('.w > span', el);
}
function rise(spans, t, t0, step = 0.09, dur = 0.7) {
  spans.forEach((s, i) => { const p = k(t, t0 + i * step, t0 + i * step + dur, E.site); s.style.transform = `translateY(${(1 - p) * 110}%)`; });
}
const fadeUp = (el, t, t0, dur = 0.6, dy = 24) => { const p = k(t, t0, t0 + dur, E.site); el.style.opacity = p; el.style.transform = `translateY(${(1 - p) * dy}px)`; };

// frame sequences: one <img> per sequence; src set per frame, decoded before capture
const SEQ = {
  opening: { dir: '../captures/hero/opening', n: 180 },
  night: { dir: '../captures/hero/night-hero', n: 161 },
  day: { dir: '../captures/hero/day-hero', n: 120 },
};
const pending = [];
function seqImg(parent) { const im = document.createElement('img'); im.className = 'abs'; im.style.width = '1920px'; im.style.height = '1080px'; im.style.transformOrigin = '0 0'; parent.appendChild(im); return im; }
function setSeq(im, seq, f, s = 1, cx = 960, cy = 540, maxY = 1080) {
  const n = Math.max(0, Math.min(seq.n - 1, Math.round(f)));
  const src = `${seq.dir}/f${String(n).padStart(4, '0')}.jpg`;
  if (im.dataset.src !== src) { im.dataset.src = src; im.src = src; pending.push(im.decode().catch(() => {})); }
  // focus (cx, cy) at stage centre, clamped so the frame covers the stage and nothing below maxY shows
  let tx = 960 - s * cx, ty = 540 - s * cy;
  tx = Math.min(0, Math.max(1920 - 1920 * s, tx));
  ty = Math.min(0, Math.max(1080 - maxY * s, ty));
  im.style.transform = `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${s.toFixed(5)})`;
}

// cursor: a visitor's pointer, with a click ring
const cursor = div('cursor', stage, `<span class="ring"></span><svg viewBox="0 0 34 40"><path d="M3 2 L3 31 L10 24.5 L15 36 L20.5 33.6 L15.6 22.4 L25 22.4 Z" fill="#fff" stroke="hsl(123 20% 7%)" stroke-width="2.2" stroke-linejoin="round"/></svg>`);
cursor.style.zIndex = 60;

// ------------------------------------------------------------------ scenes
const L = {}; const U = {};

function buildHook() {
  const s = L.hook = layer('hook');
  div('sky', s);
  const r = rng(11);
  U.stars = [];
  for (let i = 0; i < 140; i++) {
    const st = div('star', s); const x = r() * 1920, y = r() * 1080, z = 0.4 + r() * 0.9;
    box(st, x, y); st.style.width = st.style.height = (1 + z * 1.6).toFixed(1) + 'px';
    U.stars.push({ el: st, x, y, z, ph: r() * 6.28, a: 0.25 + r() * 0.6 });
  }
  const l1 = div('hook-line serif', s); box(l1, 0, 300); U.hook1 = words(l1, 'Every dollar you give');
  const l2 = div('hook-line serif', s); box(l2, 0, 437); U.hook2 = words(l2, 'reaches a family.');
  const l3 = div('hook-line serif', s); box(l3, 0, 600);
  l3.innerHTML = `<span style="position:relative;display:inline-block" class="words"><span class="w"><span>All of it.</span></span><svg class="underline-svg" viewBox="0 0 600 30" preserveAspectRatio="none"><path d="M4 20 C 150 6, 420 6, 596 18" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" vector-effect="non-scaling-stroke" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/></svg></span>`;
  U.allOf = $('.w > span', l3); U.underline = $('path', l3);
  U.hookLines = [l1, l2, l3];
}

function buildBrand() {
  const s = L.brand = layer('brand');
  s.style.background = 'rgb(246 245 240)';
  U.open = seqImg(s);
  U.introCap = div('intro-cap sans', s, 'Introducing the new coupondonation.com');
}

function buildTree() { const s = L.tree = layer('tree'); s.style.background = 'rgb(3 5 22)'; U.night = seqImg(s); }
function buildDay() { const s = L.day = layer('day'); s.style.background = 'rgb(160 200 230)'; U.dayImg = seqImg(s); }

async function buildGive() {
  const s = L.give = layer('give');
  const sec = await frag('whatwedo');
  sec.style.minHeight = '1080px';
  const host = div('site', s); host.appendChild(sec);
  // laptop deal only (the phone list is hidden by the site's own lg: classes); hide the receipt band and doors below
  [...$('.container', sec).children].slice(3).forEach((n) => n.remove());
  // card bodies stay out: the first one says "Any amount", which the $10-per-store minimum contradicts
  $$('[data-deal-face] p', sec).forEach((p) => { p.style.visibility = 'hidden'; });
  $$('[data-deal-face] .mt-6', sec).forEach((h) => { h.style.fontSize = '25px'; h.style.lineHeight = '1.15'; });
  U.giveHost = host; U.giveSec = sec;
  U.giveH = $('h2', sec); U.giveP = $('p', $('.max-w-3xl', sec).children[1]);
  U.dealList = $('ol.giving-deal', sec);
  U.dealList.dataset.deal = 'dealing';
  U.deal = $$('[data-deal-card]', sec).map((c) => ({ face: $('[data-deal-face]', c), back: $('[data-deal-back]', c), li: c.parentElement }));
}

async function buildDonate() {
  const s = L.donate = layer('donate');
  s.style.background = 'hsl(var(--primary-97))';
  const head = div('abs serif', s, 'Choose where your help can be used.');
  head.style.cssText += 'left:0;right:0;top:54px;text-align:center;font-size:76px;line-height:1.05;color:hsl(var(--foreground));';
  const sub = div('abs sans', s, 'Pick retailers, choose an amount, and see exactly where every dollar goes.');
  sub.style.cssText += 'left:0;right:0;top:150px;text-align:center;font-size:27px;color:hsl(var(--muted-foreground));';
  U.donHead = head; U.donSub = sub;
  const names = ['empty', 'chosen', 'amount', 'ledger', 'review'];
  U.cards = {};
  for (const n of names) {
    const el = await frag('donate-' + n);
    const host = div('abs', s); host.style.width = '1024px'; host.style.transformOrigin = '0 0';
    host.appendChild(el); U.cards[n] = host;
  }
  // step 1 taps: the chosen tiles come from the captured "chosen" state, swapped in at each tap
  const tile = (root, name) => $(`[data-retailer-tile="${name}"]`, root);
  U.tapNames = ['walmart', 'target', 'doordash'];
  U.tiles = U.tapNames.map((nm) => ({ el: tile(U.cards.empty, nm), off: tile(U.cards.empty, nm).outerHTML, on: tile(U.cards.chosen, nm).outerHTML, state: 'off' }));
  const findText = (root, re) => $$('*', root).find((n) => n.childElementCount === 0 && re.test(n.textContent.trim()));
  U.counter = findText(U.cards.empty, /^\d+ of 5 chosen$/);
  const cont = (root) => $$('button', root).find((b) => /Choose amount/.test(b.textContent));
  U.contBtn = cont(U.cards.empty); U.contOff = U.contBtn.outerHTML; U.contOn = cont(U.cards.chosen).outerHTML; U.contState = 'off';
  // step 2: $50 chip, ledger panel opening, split bar growing
  U.chip50 = (root) => $$('button', root).find((b) => b.textContent.trim() === '$50');
  U.ledgerPanel = $('[data-ledger-panel]', U.cards.ledger);
  U.segs = $$('[data-split-segment]', U.cards.ledger).map((sg) => ({ el: sg, grow: parseFloat(sg.style.flexGrow || '1') }));
  U.ledgerRows = $$('[data-gift-ledger] li', U.cards.ledger);
  U.reviewBtn = $$('button', U.cards.ledger).find((b) => /Review gift/.test(b.textContent));
  U.summary = $('[data-charge-summary]', U.cards.review);
  U.feeBox = $('[data-cover-fee]', U.cards.review);
  U.marker = div('marker', s); U.marker.style.zIndex = 5;
}

async function buildEvery() {
  const s = L.every = layer('every');
  s.style.background = 'hsl(var(--verify))';
  const sec = await frag('everydollar');
  const host = div('site', s); host.appendChild(sec);
  sec.style.minHeight = '1080px';
  host.style.transformOrigin = '960px 0px'; host.style.transform = 'translateY(-232px) scale(1.35)';
  U.everySec = sec;
  const h2 = $('h2', sec); U.everyH = h2;
  // headline words rise in; "All of it." keeps its hand-drawn underline
  const ul = $('[data-promise-underline]', h2);
  const ulHtml = ul.outerHTML; ul.remove();
  const txt = h2.textContent.trim();
  h2.innerHTML = '';
  U.everyWords = words(h2, txt);
  h2.insertAdjacentHTML('beforeend', ' ' + ulHtml);
  const ul2 = $('[data-promise-underline]', h2);
  ul2.classList.add('words');
  const label = ul2.firstChild; const w = document.createElement('span'); w.className = 'w'; w.innerHTML = `<span>${label.textContent.trim()}</span>`; ul2.replaceChild(w, label);
  U.everyAll = $('.w > span', ul2);
  U.everyPath = $('svg path', ul2); U.everyPath.setAttribute('pathLength', '1'); U.everyPath.setAttribute('stroke-dasharray', '1');
  U.fillNum = $('[data-fill-number] span.absolute', sec);
  // the "Not 95…" line compares against an older claim: show the FAQ's own words instead
  const p = $('[data-fill-number]', sec).parentElement.querySelector('p');
  p.textContent = '100% of your gift goes to the family as store coupons and gift cards. We take no platform fee.';
  U.noFee = p; p.style.fontSize = '23px'; p.style.maxWidth = '34rem';
  const cols = [...$('.md\\:grid-cols-3', sec).children];
  cols[1].style.visibility = 'hidden'; // tip column: the site gives two different "most donors" figures
  U.promises = [cols[0], cols[2]];
  // journey row moves to the next scene
  const journey = $('.md\\:grid-cols-4', sec); U.journeyHtml = journey.outerHTML; journey.remove();
}

async function buildTrack() {
  const s = L.track = layer('track');
  s.style.background = 'hsl(var(--background))';
  const line = div('abs serif', s); line.style.cssText += 'left:180px;right:180px;top:330px;font-size:118px;line-height:1.08;color:hsl(var(--foreground));';
  U.trackWords = words(line, "We don't track the person. We track the money.");
  U.trackLine = line;
  const jhost = div('abs', s); box(jhost, 180, 620, 1560); jhost.innerHTML = U.journeyHtml;
  const j = jhost.firstElementChild; j.style.marginTop = '0';
  U.jhost = jhost; U.jline = $('[data-journey-line]', j);
  U.jsteps = $$('[data-reveal]', j);
  U.jsvg = $('svg[data-journey-stop]', j); if (U.jsvg) U.jsvg.style.display = 'none';
  // coupon marker that travels between the four icons (the site's journey coupon)
  U.jcoupon = div('abs', jhost, `<svg viewBox="0 0 44 30" width="44" height="30"><rect x="1.5" y="1.5" width="41" height="27" rx="6" fill="hsl(123 46% 34%)"/><circle cx="1.5" cy="15" r="4.5" fill="hsl(var(--background))"/><circle cx="42.5" cy="15" r="4.5" fill="hsl(var(--background))"/><path d="M14 15.5 l5 5 10-11" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`);
  U.jcoupon.style.zIndex = 5;
  $$('h3', j).forEach((h) => { h.style.fontSize = '44px'; });
  $$('p', j).forEach((p) => { p.style.fontSize = '24px'; });
  $$('span.text-sm', j).forEach((p) => { p.style.fontSize = '20px'; });
}

async function buildApply() {
  const s = L.apply = layer('apply');
  s.style.background = 'hsl(var(--background))';
  const main = await frag('apply-step1');
  const host = div('abs', s); box(host, 150, 0, 1060); host.style.transformOrigin = '0 0'; host.appendChild(main);
  U.applyHost = host; U.applyMain = main;
  $$('p', main).filter((p) => /about 3 minutes/.test(p.textContent)).forEach((p) => { p.style.visibility = 'hidden'; }); // timing promise stays off screen
  // the sticky Continue bar sits at the viewport bottom on the site; here it would cover the store tiles
  const contBar = $$('button', main).find((b) => /^Continue/.test(b.textContent.trim()));
  if (contBar) { let n = contBar; while (n.parentElement && n.parentElement !== main && !/sticky|fixed|bottom-0/.test(n.parentElement.className)) n = n.parentElement; (n.parentElement && n.parentElement !== main ? n.parentElement : n).style.visibility = 'hidden'; }
  const pEmpty = await frag('apply-panel-empty'); const pFull = await frag('apply-panel-step1');
  const ph = div('abs', s); box(ph, 1300, 0, 620, 1080); ph.appendChild(pFull); pFull.style.height = '1080px';
  U.panelHost = ph; U.panelFull = pFull;
  // panel rows fill in as the taps land: map each row in the filled panel to its empty twin
  const rowsF = $$('dl > div, ul > li, [data-request-row]', pFull);
  U.panelRows = rowsF;
  U.panelEmptyHtml = pEmpty.innerHTML; U.panelFullHtml = pFull.innerHTML;
  // need + store tiles: unselected look borrowed from an unselected sibling of the same grid
  const btn = (re) => $$('button, label', main).find((b) => re.test(b.textContent.replace(/\s+/g, ' ').trim()));
  U.needTiles = [btn(/^Food & groceries/), btn(/^Health & pharmacy/)];
  U.storeTiles = [btn(/^Walmart$/), btn(/^Kroger$/), btn(/^CVS$/)];
  const offFor = (el, re) => { const sib = $$(el.tagName, el.parentElement).find((b) => re.test(b.textContent.trim())); return sib ? sib.className : el.className; };
  U.needTiles.forEach((el) => { el.dataset.on = el.className; el.dataset.off = offFor(el, /^Meals|^Baby|^Clothing/); });
  U.storeTiles.forEach((el) => { el.dataset.on = el.className; el.dataset.off = offFor(el, /^Aldi|^Costco|^Publix|^Safeway|^Walgreens/); });
  // the panel's own footer line, set large as the panel grows to fill the frame
  const fc = div('abs', s); fc.style.cssText += 'inset:0;background:hsl(var(--primary-20));z-index:4;';
  const f1 = div('abs serif', fc); f1.style.cssText += 'left:200px;right:200px;top:330px;font-size:150px;line-height:1;color:hsl(120 8% 98.5%);';
  U.freeW1 = words(f1, 'Free to apply.');
  const f2 = div('abs serif', fc); f2.style.cssText += 'left:200px;right:200px;top:520px;font-size:84px;line-height:1.1;color:hsl(120 8% 98.5% / .82);';
  U.freeW2 = words(f2, 'Help arrives as store coupons, never cash.');
  U.freeCard = fc;
}

async function buildSecure() {
  const s = L.secure = layer('secure');
  s.style.background = 'hsl(var(--primary-20))';
  const sec = await frag('security');
  const host = div('site', s); host.appendChild(sec); sec.style.minHeight = '1080px';
  host.style.transformOrigin = '960px 540px'; host.style.transform = 'scale(1.24)';
  U.secH = $('h2', sec); U.secP = $('p', sec);
  U.badges = $$('.rounded-\\[1\\.5rem\\]', sec);
}

async function buildCta() {
  const s = L.cta = layer('cta');
  s.style.background = 'hsl(var(--background))';
  const sec = await frag('cta');
  const host = div('site', s); host.appendChild(sec); sec.style.minHeight = '1080px';
  $('.container', sec).style.minHeight = '1080px';
  host.style.transformOrigin = '960px 540px'; host.style.transform = 'scale(1.15)';
  U.ctaSec = sec; U.ctaWipe = $('.cta-wipe', sec);
  U.ctaH = $('h2', sec);
  const txt = U.ctaH.textContent.trim(); U.ctaH.innerHTML = ''; U.ctaWords = words(U.ctaH, txt);
  U.ctaBtns = [...$('.mt-10.flex', sec).children];
  U.ctaCard = $('.relative.overflow-hidden.rounded-\\[1\\.5rem\\]', sec);
}

function buildEnd() {
  const s = L.end = layer('end');
  s.style.background = 'rgb(246 245 240)';
  const lock = div('lockup', s, `<img src="/brand/logo-256.webp" alt=""><div><div class="wm"><span class="c">Coupon</span><span class="d">Donation</span></div><div class="tag">Transforming Giving</div></div>`);
  U.lock = lock;
  const url = div('abs sans', s, 'coupondonation.com'); url.style.cssText += 'left:0;right:0;top:640px;text-align:center;font-size:44px;font-weight:600;color:hsl(var(--foreground));';
  U.url = url;
  const fine = div('fine sans', s, 'Store names and logos shown on CouponDonation are trademarks of their owners.<br>Those stores are not affiliated with, and do not sponsor or endorse, CouponDonation.');
  box(fine, 0, 960); U.fine = fine;
}

// ------------------------------------------------------------------ transitions
function scene(name, t, pre = 0.6, post = 0.6) { const [a, b] = SC[name]; const on = t >= a - pre && t < b + post; vis(L[name], on); return on; }
// page scroll between homepage sections: out goes up, in comes from below
function scrollPair(outEl, inEl, t, t0, dur = 0.55) {
  const p = k(t, t0 - dur / 2, t0 + dur / 2, E.inOutQuart);
  if (outEl) outEl.style.transform = `translateY(${(-p * 1080).toFixed(1)}px)`;
  if (inEl) inEl.style.transform = `translateY(${((1 - p) * 1080).toFixed(1)}px)`;
  return p;
}
const wipeUp = (el, t, t0, dur = 0.5) => { const p = k(t, t0, t0 + dur, E.inOutQuart); el.style.clipPath = p < 1 ? `inset(${((1 - p) * 100).toFixed(2)}% 0 0 0)` : 'none'; return p; };

// ------------------------------------------------------------------ cursor plan
const center = (el, fx = 0.5, fy = 0.55) => { const r = el.getBoundingClientRect(); return r.width ? { x: r.left + r.width * fx, y: r.top + r.height * fy } : null; };
let PATH = [], TAPS = [];
function cursorPlan() {
  const c = (fn, fx, fy) => { let last = null; return () => (last = center(fn(), fx, fy) || last) || { x: 1980, y: 1100 }; };
  const off = (x, y) => () => ({ x, y });
  const P = [];
  // donate
  P.push({ t: 24.6, at: off(1700, 1140) });
  T.taps.forEach((tt, i) => { const f = c(() => U.tiles[i].el, 0.42, 0.5); P.push({ t: tt - 0.22, at: f }, { t: tt + 0.12, at: f }); });
  { const f = c(() => U.contBtn, 0.6, 0.55); P.push({ t: T.toAmount - 0.25, at: f }, { t: T.toAmount + 0.1, at: f }); }
  { const f = c(() => U.chip50(U.cards.amount), 0.5, 0.6); P.push({ t: T.amt50 - 0.35, at: f }, { t: T.amt50 + 0.35, at: f }); }
  { const f = c(() => U.reviewBtn, 0.55, 0.6); P.push({ t: T.toReview - 0.4, at: f }, { t: T.toReview + 0.15, at: f }); }
  P.push({ t: T.toReview + 0.75, at: off(1980, 1160) });
  // apply
  P.push({ t: 53.2, at: off(1500, 1150) });
  [...T.needs.map((tt, i) => [tt, () => U.needTiles[i]]), ...T.stores.map((tt, i) => [tt, () => U.storeTiles[i]])].forEach(([tt, fn]) => {
    const f = c(fn, 0.45, 0.55); P.push({ t: tt - 0.25, at: f }, { t: tt + 0.12, at: f });
  });
  P.push({ t: 57.2, at: off(1980, 1150) });
  PATH = P;
  TAPS = [...T.taps, T.toAmount, T.amt50, T.toReview, ...T.needs, ...T.stores];
}
const CURSOR_ON = [[24.6, 31.95], [53.2, 57.2]];
function setCursor(t) {
  const on = CURSOR_ON.find(([a, b]) => t >= a && t < b);
  vis(cursor, !!on);
  if (!on) return;
  let p = PATH[0].at();
  for (let i = 0; i < PATH.length - 1; i++) {
    const a = PATH[i], b = PATH[i + 1];
    if (t >= a.t && t <= b.t) { const e = E.inOutCubic(cl((t - a.t) / (b.t - a.t))); const pa = a.at(), pb = b.at(); p = { x: lerp(pa.x, pb.x, e), y: lerp(pa.y, pb.y, e) }; break; }
    if (t > b.t) p = b.at();
  }
  const tp = TAPS.find((tt) => t >= tt && t < tt + 0.45);
  const pr = TAPS.reduce((m, tt) => Math.max(m, 1 - Math.abs(t - tt) / 0.08), 0);
  cursor.style.transform = `translate(${(p.x - 3).toFixed(1)}px, ${(p.y - 2).toFixed(1)}px) scale(${(1 - 0.12 * Math.max(0, pr)).toFixed(3)})`;
  const ring = $('.ring', cursor);
  if (tp != null) { const q = k(t, tp, tp + 0.45, E.outCubic); ring.style.opacity = (1 - q) * 0.85; ring.style.transform = `scale(${lerp(0.4, 1.6, q)})`; } else ring.style.opacity = 0;
}
const press = (t, tt, amt = 0.05) => { const d = t - tt; return d > -0.06 && d < 0.22 ? 1 - amt * Math.sin(Math.PI * cl((d + 0.06) / 0.28)) : 1; };

// ------------------------------------------------------------------ frame
function renderFrame(t) {
  // ---- hook
  if (scene('hook', t, 0, 0.3)) {
    U.stars.forEach((s) => { s.el.style.opacity = (s.a * (0.65 + 0.35 * Math.sin(t * 1.7 + s.ph))).toFixed(3); s.el.style.transform = `translate(${(-t * 6 * s.z).toFixed(1)}px, ${(t * 2 * s.z).toFixed(1)}px)`; });
    rise(U.hook1, t, T.hookWords, 0.11, 0.75);
    rise(U.hook2, t, T.hookWords + 0.44, 0.11, 0.75);
    rise([U.allOf], t, T.allOf, 0, 0.6);
    U.underline.setAttribute('stroke-dashoffset', (1 - k(t, T.underline, T.underline + 0.65, E.inOutCubic)).toFixed(4));
    const out = k(t, 4.45, 4.85, E.inCubic);
    U.hookLines.forEach((l, i) => { l.style.transform = `translateY(${(-out * (90 + i * 30)).toFixed(1)}px)`; l.style.opacity = 1 - out; });
    const push = 1 + 0.035 * (t / 4.8);
    L.hook.style.transform = `scale(${push.toFixed(4)})`; L.hook.style.transformOrigin = '50% 45%';
  }
  // ---- brand: the site's own opening (paper cover, lockup, sheen, fly onto the navbar)
  if (scene('brand', t, 0.4, 0)) {
    wipeUp(L.brand, t, 4.45, 0.4);
    // time remap of the capture: build (f2-40) at speed, hold the finished lockup in slow motion while the
    // caption reads and the camera pushes in, then the fly onto the navbar (f47 iris, f76 landed) at speed
    const f = t < 6.07 ? 2 + (t - 4.8) * 30 : t < 7.27 ? 40 + (t - 6.07) * 5 : 46 + (t - 7.27) * 30;
    const zq = k(t, 6.15, 7.3, E.inOutSine), zs = lerp(1, 1.25, zq);
    setSeq(U.open, SEQ.opening, f, zs, 960, lerp(540, 455, zq), lerp(1080, 870, zq));
    const cp = k(t, T.introCap, T.introCap + 0.5, E.site), co = k(t, 6.95, 7.2);
    U.introCap.style.top = (640 + (zs - 1) * 380).toFixed(1) + 'px'; U.introCap.style.fontSize = (30 * zs).toFixed(2) + 'px';
    U.introCap.style.opacity = cp * (1 - co); U.introCap.style.transform = `translateY(${((1 - cp) * 14).toFixed(1)}px)`;
  }
  // ---- tree: the live homepage hero, slow push-in (marquee kept below the frame)
  if (scene('tree', t, 0, 0.3)) {
    const f = 16 + (t - 9.6) * 30;
    const s = lerp(1.25, 1.42, E.inOutSine(cl((t - 9.6) / 5.0)));
    setSeq(U.night, SEQ.night, f, s, 960, 455, 870);
  }
  // ---- give: scroll from the hero to "Give what people need."
  if (scene('give', t, 0.3, 0.3)) {
    const sp = scrollPair(L.tree, L.give, t, 14.4);
    if (t > 14.4 + 0.3) L.tree.style.transform = '';
    const drift = 1 + 0.025 * k(t, 16.0, 24.0, E.inOutSine);
    U.giveHost.style.transform = `translateY(${(70).toFixed(1)}px) scale(${(1.28 * drift).toFixed(4)})`;
    U.giveHost.style.transformOrigin = '960px 0px';
    const hp = k(t, T.giveHead, T.giveHead + 0.8, E.site);
    U.giveH.style.clipPath = `inset(0 0 ${((1 - hp) * 100).toFixed(1)}% 0)`; U.giveH.style.transform = `translateY(${((1 - hp) * 30).toFixed(1)}px)`;
    fadeUp(U.giveP, t, T.giveSub, 0.7);
    const sw = (U.deal[0].li.offsetWidth || 300) + 32;
    U.deal.forEach((d, i) => {
      const t0 = T.deal[i];
      const p = k(t, t0, t0 + 0.75, (x) => { // cubic-bezier(.2,.85,.25,1)
        return 1 - Math.pow(1 - x, 3.4);
      });
      const dx = (1.5 - i) * sw * (1 - p), dy = 28 * (1 - p), rot = [-5, 4, -3, 6][i] * (1 - p);
      const turnF = -180 * (1 - p), turnB = 180 * p;
      const pre = t < t0 ? 1 : 0;
      d.face.style.transform = `perspective(1600px) translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0) rotate(${rot.toFixed(2)}deg) rotateY(${turnF.toFixed(1)}deg)`;
      d.back.style.transform = `perspective(1600px) translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0) rotate(${rot.toFixed(2)}deg) rotateY(${turnB.toFixed(1)}deg)`;
      d.back.style.display = p >= 1 ? 'none' : 'flex';
      d.li.style.zIndex = pre ? 10 - i : i + 1;
      const stackIn = k(t, 15.6, 16.3, E.site);
      d.li.style.opacity = stackIn;
    });
  }
  // ---- donate
  if (scene('donate', t, 0.3, 0.3)) {
    scrollPair(L.give, L.donate, t, 24.0);
    if (t > 24.3) L.give.style.transform = '';
    fadeUp(U.donHead, t, T.donHead, 0.7, 30); fadeUp(U.donSub, t, T.donHead + 0.25, 0.7, 20);
    const S = 1.2;
    const place = (host, w, y) => { host.style.transform = `translate(${((1920 - w * S) / 2).toFixed(1)}px, ${y}px) scale(${S})`; };
    const step = t < T.toAmount + 0.15 ? 1 : t < T.toReview + 0.2 ? 2 : 3;
    // step 1: tiles flip to chosen at each tap
    U.tiles.forEach((tl, i) => {
      const want = t >= T.taps[i] ? 'on' : 'off';
      if (tl.state !== want) { const tmp = document.createElement('template'); tmp.innerHTML = tl[want]; const n = tmp.content.firstElementChild; tl.el.replaceWith(n); tl.el = n; tl.state = want; }
      tl.el.style.transform = `scale(${press(t, T.taps[i], 0.06)})`;
    });
    const nChosen = T.taps.filter((tt) => t >= tt).length;
    if (U.counter) U.counter.textContent = `${nChosen} of 5 chosen`;
    const wantC = nChosen > 0 ? 'on' : 'off';
    if (U.contState !== wantC) { const tmp = document.createElement('template'); tmp.innerHTML = wantC === 'on' ? U.contOn : U.contOff; const n = tmp.content.firstElementChild; U.contBtn.replaceWith(n); U.contBtn = n; U.contState = wantC; }
    U.contBtn.style.transform = `scale(${press(t, T.toAmount, 0.06)})`;
    const cardIn = k(t, 24.45, 25.0, E.site);
    // step slides (the site slides steps ±28px with a fade)
    const s12 = k(t, T.toAmount + 0.1, T.toAmount + 0.45, E.outCubic);
    vis(U.cards.empty, step === 1); vis(U.cards.chosen, false);
    vis(U.cards.amount, step === 2 && t < T.amt50); vis(U.cards.ledger, step === 2 && t >= T.amt50); vis(U.cards.review, step === 3);
    place(U.cards.empty, 1024, 230 + (1 - cardIn) * 60); U.cards.empty.style.opacity = cardIn;
    if (step === 2) {
      const host = t < T.amt50 ? U.cards.amount : U.cards.ledger;
      place(host, 1024, 230);
      host.style.opacity = s12;
      $('[data-donate-card] > div', host).style.transform = `translateX(${((1 - s12) * 28).toFixed(1)}px)`;
      const chip = U.chip50(host); if (chip) chip.style.transform = `scale(${press(t, T.amt50, 0.08)})`;
      if (t >= T.amt50) {
        const lp = k(t, T.ledger, T.ledger + 0.6, E.outQuart);
        U.ledgerPanel.style.width = (400 * lp).toFixed(1) + 'px';
        U.segs.forEach((sg, i) => { const g = k(t, T.ledger + 0.35 + i * 0.08, T.ledger + 0.9 + i * 0.08, E.outCubic); sg.el.style.flexGrow = (sg.grow * Math.max(0.0001, g)).toFixed(4); });
        U.ledgerRows.forEach((r, i) => fadeUp(r, t, T.ledger + 0.5 + i * 0.1, 0.45, 10));
        if (U.reviewBtn) U.reviewBtn.style.transform = `scale(${press(t, T.toReview, 0.06)})`;
      }
    }
    if (step === 3) {
      const rp = k(t, T.toReview + 0.2, T.toReview + 0.55, E.outCubic);
      const card = U.cards.review;
      // the review card is taller than the frame: glide down to the "Gift for families (100%)" summary
      const sr = U.summary.getBoundingClientRect(), cr = card.getBoundingClientRect();
      const sumY = (sr.top - cr.top) / 1.2; // unscaled offset of the summary in the card
      const scroll = k(t, T.toReview + 0.9, T.summary, E.inOutCubic);
      const y = 230 - scroll * (sumY * 1.2 - 470);
      place(card, 1024, y.toFixed(1)); card.style.opacity = rp;
      $('[data-donate-card] > div', card).style.transform = `translateX(${((1 - rp) * 28).toFixed(1)}px)`;
      const hd = k(t, T.toReview + 0.9, T.toReview + 1.6);
      U.donHead.style.opacity = U.donSub.style.opacity = (1 - hd).toFixed(3);
      // a hand-drawn marker under the first summary row once it has landed
      const row = U.summary.firstElementChild, rr = row.getBoundingClientRect();
      const mp = k(t, T.summary + 0.2, T.summary + 0.75, E.inOutCubic);
      vis(U.marker, mp > 0); box(U.marker, rr.left, rr.bottom + 3, rr.width); U.marker.style.transform = `scaleX(${mp.toFixed(4)})`;
    } else vis(U.marker, false);
  }
  // ---- every dollar: the blue band wipes up
  if (scene('every', t, 0.4, 0.3)) {
    if (t < 36.3) { L.every.style.transform = ''; wipeUp(L.every, t, 35.75, 0.5); } else L.every.style.clipPath = 'none';
    rise(U.everyWords, t, T.everyHead, 0.08, 0.7);
    rise([U.everyAll], t, T.everyHead + 0.62, 0, 0.6);
    U.everyPath.setAttribute('stroke-dashoffset', (1 - k(t, T.everyHead + 1.0, T.everyHead + 1.6, E.inOutCubic)).toFixed(4));
    const fp = k(t, T.fill[0], T.fill[1], E.inOutSine);
    U.fillNum.style.clipPath = `inset(${((1 - fp) * 100).toFixed(2)}% 0 0 0)`;
    fadeUp(U.noFee, t, T.noFee, 0.7, 16);
    U.promises.forEach((p, i) => fadeUp(p, t, T.promises + i * 0.3, 0.7, 20));
  }
  // ---- we track the money (scroll from the band to the line)
  if (scene('track', t, 0.3, 0.4)) {
    scrollPair(L.every, L.track, t, 43.2);
    if (t > 43.5) L.every.style.transform = '';
    rise(U.trackWords, t, T.trackLine, 0.075, 0.7);
    // the line lifts to make room for the journey
    const up = k(t, T.journey - 0.3, T.journey + 0.4, E.inOutCubic);
    U.trackLine.style.transform = `translateY(${(-up * 210).toFixed(1)}px) scale(${lerp(1, 0.78, up).toFixed(4)})`;
    U.trackLine.style.transformOrigin = '0 0';
    U.jhost.style.opacity = k(t, T.journey, T.journey + 0.4);
    U.jline.style.transform = `scaleX(${k(t, T.journey + 0.1, T.journey + 1.3, E.site).toFixed(4)})`; U.jline.style.transformOrigin = '0 50%';
    U.jsteps.forEach((st, i) => fadeUp(st, t, T.stops[i], 0.6, 18));
    // coupon travels icon to icon, landing on each stop
    const icons = U.jsteps.map((st) => $('[data-journey-step]', st));
    const hr = U.jhost.getBoundingClientRect();
    const pos = icons.map((ic) => { const r = ic.getBoundingClientRect(); return { x: r.left - hr.left + r.width / 2, y: r.top - hr.top + r.height / 2 }; });
    let seg = 0, f = 0;
    for (let i = 0; i < 4; i++) if (t >= T.stops[i] - 0.35) { seg = i; f = k(t, T.stops[i] - 0.35, T.stops[i], E.inOutCubic); }
    const a = pos[Math.max(0, seg - 1)], b = pos[seg];
    const x = seg === 0 ? b.x - 60 * (1 - f) : lerp(a.x, b.x, f), y = seg === 0 ? b.y : lerp(a.y, b.y, f) - Math.sin(Math.PI * f) * 26;
    box(U.jcoupon, x - 22, y - 15 - 52);
    U.jcoupon.style.opacity = k(t, T.stops[0] - 0.4, T.stops[0] - 0.1);
  }
  // ---- apply: slides in like a new page
  if (scene('apply', t, 0.4, 0.3)) {
    const ip = k(t, 52.45, 52.95, E.inOutQuart);
    if (t < 53.0) { L.apply.style.transform = `translateX(${((1 - ip) * 1920).toFixed(1)}px)`; L.track.style.transform = `translateX(${(-ip * 640).toFixed(1)}px)`; } else { L.apply.style.transform = ''; }
    const S = 1.18;
    if (U.storeOffset == null) { const a = U.applyMain.getBoundingClientRect(), b = U.storeTiles[0].getBoundingClientRect(); if (b.height) U.storeOffset = (b.top - a.top) / S; }
    const sc = k(t, T.needs[1] + 0.35, T.stores[0] - 0.3, E.inOutCubic);
    const scrollY = lerp(108, (U.storeOffset || 900) * S - 520, sc);
    U.applyHost.style.transform = `translate(0px, ${(-scrollY).toFixed(1)}px) scale(${S})`;
    U.needTiles.forEach((el, i) => { el.className = t >= T.needs[i] ? el.dataset.on : el.dataset.off; el.style.transform = `scale(${press(t, T.needs[i], 0.05)})`; });
    U.storeTiles.forEach((el, i) => { el.className = t >= T.stores[i] ? el.dataset.on : el.dataset.off; el.style.transform = `scale(${press(t, T.stores[i], 0.05)})`; });
    const full = t >= T.stores[2] + 0.2;
    if (U.panelState !== full) { U.panelFull.innerHTML = full ? U.panelFullHtml : U.panelEmptyHtml; U.panelState = full; }
    const pz = k(t, T.freeLine, T.freeLine + 0.7, E.inOutQuart);
    vis(U.freeCard, pz > 0);
    U.freeCard.style.clipPath = `inset(0 0 0 ${((1 - pz) * 1300).toFixed(1)}px)`;
    rise(U.freeW1, t, T.freeLine + 0.45, 0.09, 0.7);
    rise(U.freeW2, t, T.freeLine + 0.9, 0.07, 0.7);
  }
  // ---- security band
  if (scene('secure', t, 0.4, 0.3)) {
    if (t < 62.6) wipeUp(L.secure, t, 62.05, 0.5); else L.secure.style.clipPath = 'none';
    const hp = k(t, T.secHead, T.secHead + 0.8, E.site);
    U.secH.style.clipPath = `inset(0 0 ${((1 - hp) * 100).toFixed(1)}% 0)`; U.secH.style.transform = `translateY(${((1 - hp) * 26).toFixed(1)}px)`;
    fadeUp(U.secP, t, T.secHead + 0.4, 0.6, 14);
    U.badges.forEach((b, i) => { const p = k(t, T.badges[i], T.badges[i] + 0.55, E.site); b.style.opacity = p; b.style.transform = `scale(${lerp(0.92, 1, p).toFixed(4)}) rotate(${lerp(-4, 0, p).toFixed(2)}deg)`; });
  }
  // ---- day: the tree by daylight, opening as an iris
  if (scene('day', t, 0.45, 0.3)) {
    const ip = k(t, 66.75, 67.35, E.inOutQuart);
    L.day.style.clipPath = ip < 1 ? `circle(${(ip * 75).toFixed(2)}% at 50% 48%)` : 'none';
    const f = (t - 66.75) * 30 + (SEQ.day.n > 100 ? 18 : 0);
    const s = lerp(1.36, 1.26, E.inOutSine(cl((t - 66.75) / 3.2)));
    setSeq(U.dayImg, SEQ.day, f, s, 960, 455, 870);
  }
  // ---- CTA: the site's own deep-green wipe from the bottom
  if (scene('cta', t, 0.3, 0.3)) {
    U.ctaWipe.style.clipPath = `inset(${((1 - k(t, 69.6, 70.5, E.site)) * 100).toFixed(2)}% 0 0 0)`;
    L.cta.style.clipPath = t < 69.6 ? 'inset(100% 0 0 0)' : 'none';
    rise(U.ctaWords, t, T.ctaHead, 0.07, 0.75);
    U.ctaBtns.forEach((b, i) => fadeUp(b, t, T.ctaBtns + i * 0.15, 0.6, 16));
    const cp = k(t, T.ctaHead + 0.2, T.ctaHead + 1.1, E.site);
    if (U.ctaCard) { U.ctaCard.style.opacity = cp; U.ctaCard.style.transform = `translateY(${((1 - cp) * 36).toFixed(1)}px) rotate(${lerp(-2, 0, cp).toFixed(2)}deg)`; }
  }
  // ---- end card: back to the opening's paper and lockup
  if (scene('end', t, 0.4, 0)) {
    wipeUp(L.end, t, 74.05, 0.45);
    const lp = k(t, T.endLock, T.endLock + 0.8, E.site);
    const lw = U.lock.offsetWidth || 900;
    U.lock.style.left = ((1920 - lw) / 2).toFixed(1) + 'px'; U.lock.style.top = '380px';
    U.lock.style.opacity = lp; U.lock.style.transform = `translateY(${((1 - lp) * 30).toFixed(1)}px)`;
    fadeUp(U.url, t, T.endUrl, 0.6, 16);
    U.fine.style.opacity = k(t, T.endFine, T.endFine + 0.6);
  }
  setCursor(t);
}

// ------------------------------------------------------------------ boot
async function init() {
  buildHook(); buildBrand(); buildTree(); buildDay();
  await buildGive(); await buildDonate(); await buildEvery(); await buildTrack(); await buildApply(); await buildSecure(); await buildCta(); buildEnd();
  cursorPlan();
  await document.fonts.load('400 100px "Instrument Serif"');
  await document.fonts.load('600 40px "Instrument Sans"');
  await document.fonts.load('700 40px "Instrument Sans"');
  await document.fonts.ready;
  await Promise.all($$('img').filter((im) => !im.dataset.src && im.src).map((im) => (im.complete ? im.decode().catch(() => {}) : new Promise((r) => { im.onload = im.onerror = r; }))));
  // warm every cursor waypoint while its target is on screen (stills render out of order)
  for (const p of PATH) { renderFrame(p.t); p.at(); }
  window.compDuration = DUR;
  window.compReady = true;
}
window.renderFrame = async (t) => {
  renderFrame(t);
  if (pending.length) { await Promise.all(pending.splice(0)); }
  await new Promise((r) => requestAnimationFrame(() => r()));
};
init().catch((e) => { window.compError = String((e && e.stack) || e); });
