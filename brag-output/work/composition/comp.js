// CouponDonation launch film: every frame is a pure function of t (seconds).
// Real assets are reused straight from the repo: compiled Tailwind/tokens (/src/index.css),
// fonts, logo, brand artwork, the homepage 3D tree (captured frames) and the
// donate/apply flows (their rendered markup, captured from the running app).

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const cl = (x) => Math.max(0, Math.min(1, x));
const lerp = (a, b, x) => a + (b - a) * x;
const E = {
  lin: (x) => x,
  outExpo: (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x)),
  outQuart: (x) => 1 - Math.pow(1 - x, 4),
  outCubic: (x) => 1 - Math.pow(1 - x, 3),
  inCubic: (x) => x * x * x,
  inQuad: (x) => x * x,
  inOutCubic: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  inOutQuart: (x) => (x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2),
  inOutSine: (x) => -(Math.cos(Math.PI * x) - 1) / 2,
  outBack: (x) => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); },
};
const k = (t, a, b, e = E.outExpo) => e(cl((t - a) / (b - a)));
const vis = (el, on, d = 'block') => { const v = on ? d : 'none'; if (el.style.display !== v) el.style.display = v; };
function rng(seed) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let x = Math.imul(seed ^ (seed >>> 15), 1 | seed); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; }
const rand = rng(20261005);

const TREE_FRAMES = 150;
const T = {
  // scene windows
  aEnd: 7.45, bIn: 6.7, bOut: 10.75, cIn: 10.75, cOut: 14.8, dIn: 14.8, dOut: 18.25, eIn: 18.25, eOut: 21.3, fIn: 21.3,
  burst: 3.0,
  clicksC: [11.7, 12.15, 12.6], contC: 13.05, impactIn: 13.3,
  clicksE: [19.3, 19.9], contE: 20.5,
};

const SHIELD = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>';
const CHECK = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"></path></svg>';

// ---------------------------------------------------------------- setup
const ui = {};

function barcode(r) {
  let y = 0, s = '';
  while (y < 108) { const h = 1 + Math.floor(r() * 3.2); s += `<rect x="0" y="${y}" width="60" height="${h}"/>`; y += h + 1 + Math.floor(r() * 2.6); }
  return `<svg class="cpn-bars" viewBox="0 0 60 112" fill="hsl(123 20% 7%)">${s}</svg>`;
}

function buildHook() {
  const q = 'Where does your donation actually go?'.split(' ');
  $('#a-q').innerHTML = q.map((w) => `<span class="w mask"><span>${w}</span></span>`).join('');
  ui.qWords = $$('#a-q .w > span');

  const brands = [
    { name: 'Walmart', logo: '/brand-logos/walmart.svg' },
    { name: 'Target', logo: '/brand-logos/target.svg' },
    { name: 'Amazon', logo: '/brand-logos/amazon.svg', wide: true },
  ];
  const deckX = [485, 960, 1435], deckY = 610;
  const fan = [{ dx: -30, dy: -26, r: -7 }, { dx: -10, dy: -10, r: -2.5 }, { dx: 12, dy: 8, r: 3 }];
  ui.cpns = [];
  const decks = $('#a-decks');
  for (let j = 0; j < 3; j++) {
    for (let b = 0; b < 3; b++) {
      const br = brands[b];
      const el = document.createElement('div');
      el.className = 'cpn';
      el.innerHTML = `<div class="cpn-l"><div class="cpn-logo${br.wide ? ' wide' : ''}"><img src="${br.logo}" alt=""></div><div><div class="cpn-v serif">$5</div><div class="cpn-t">${br.name} coupon</div></div></div><div class="cpn-r">${barcode(rand)}<div class="cpn-ok">${SHIELD}Verified</div></div>`;
      decks.appendChild(el);
      const i = j * 3 + b; // flight order: one card per deck, three rounds
      ui.cpns.push({ el, b, j, start: T.burst + 0.04 + i * 0.0625, from: { r: (rand() - 0.5) * 80 }, to: { x: deckX[b] + fan[j].dx, y: deckY + fan[j].dy, r: fan[j].r }, exitSign: rand() < 0.5 ? -1 : 1 });
    }
  }
  ui.labels = brands.map((br, b) => {
    const el = document.createElement('div');
    el.className = 'deck-label';
    el.style.left = deckX[b] + 'px';
    el.innerHTML = `<b>${br.name}</b> · 3 × $5`;
    decks.appendChild(el);
    return el;
  });
}

async function fetchText(u) { const r = await fetch(u); if (!r.ok) throw new Error(u); return r.text(); }
function frag(html) { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstElementChild; }
function stripAnim(root) { $$('.animate-fade-in', root).forEach((n) => n.classList.remove('animate-fade-in')); if (root.classList) root.classList.remove('animate-fade-in'); }

async function buildDonate() {
  const [h0, h3, hi] = await Promise.all(['../markup/donate-card-0.frag', '../markup/donate-card-3.frag', '../markup/donate-impact.frag'].map(fetchText));
  const card = frag(h0), card3 = frag(h3), impact = frag(hi);
  [card, card3, impact].forEach(stripAnim);
  const body = card.firstElementChild; // .space-y-6
  // chip bar (from the real 3-selected state) slots in under the header, as in the app
  const chipBar = $('.flex.flex-wrap.gap-2.p-3', card3);
  const wrap = document.createElement('div');
  wrap.className = 'chipbar-wrap';
  wrap.appendChild(chipBar);
  body.insertBefore(wrap, body.children[1]);
  ui.chipWrap = wrap; ui.chipBar = chipBar;
  ui.chips = $$(':scope > div', chipBar);
  ui.chipCount = $(':scope > span', chipBar);
  // the card's own Continue button (disabled until a brand is picked, like the app)
  ui.contC = $$('button', card).find((b) => b.textContent.trim().startsWith('Continue'));
  // brand buttons: unselected (card-0) vs selected (card-3) class lists
  const sel3 = Object.fromEntries($$('.grid button', card3).map((b) => [$('img', b).alt, b]));
  ui.brandBtns = ['Walmart', 'Target', 'Amazon'].map((name) => {
    const btn = $$('.grid button', card).find((b) => $('img', b).alt === name);
    const box = btn.firstElementChild;
    const s = sel3[name];
    return { btn, box, off: { btn: btn.className, box: box.className, inner: box.innerHTML }, on: { btn: s.className, box: s.firstElementChild.className, inner: s.firstElementChild.innerHTML } };
  });
  $('#c-card').appendChild(card);
  ui.card = card;

  // impact card: keep the header, totals and coupon breakdown
  const ibody = impact.firstElementChild;
  const sec = $$(':scope > div', ibody)[1];
  $$(':scope > div', sec).forEach((d) => { if (/Accepted Payment|Gold Coins/.test(d.textContent)) d.remove(); });
  $$(':scope > *', ibody).slice(2).forEach((d) => d.remove());
  $('#c-impact').appendChild(impact);
  ui.impact = impact;
  const nine = $$('.text-3xl.text-primary', impact)[0];
  ui.nineText = [...nine.childNodes].find((n) => n.nodeType === 3);

  // step tabs: same classes as DonationFlow's indicator
  ui.steps = [1, 2, 3].map((n, i) => {
    const el = document.createElement('div');
    el.dataset.n = n;
    el.dataset.label = ['Choose Brands', 'Select Amount', 'See Impact'][i];
    $('#c-steps').appendChild(el);
    return el;
  });
  ui.stepState = -1;
}

function setSteps(step) {
  if (ui.stepState === step) return;
  ui.stepState = step;
  ui.steps.forEach((el) => {
    const n = +el.dataset.n;
    el.className = `flex items-center gap-2 border-b-2 px-3 py-2 text-sm transition-colors ${n === step ? 'border-primary text-primary' : n < step ? 'border-primary/30 text-primary' : 'border-transparent text-muted-foreground'}`;
    el.innerHTML = (n < step ? CHECK.replace('<svg ', '<svg class="w-4 h-4" ') : `<span class="flex h-5 w-5 items-center justify-center text-xs font-bold">${n}</span>`) + `<span class="font-medium">${el.dataset.label}</span>`;
  });
}

async function buildApply() {
  const htmls = await Promise.all(['../markup/apply-form-0.frag', '../markup/apply-form-1.frag', '../markup/apply-form-2.frag', '../markup/apply-continue-0.frag', '../markup/apply-continue-2.frag'].map(fetchText));
  ui.eStates = htmls.slice(0, 3).map((h) => { const d = document.createElement('div'); d.className = 'state'; d.appendChild(frag(h)); stripAnim(d); $('#e-right').appendChild(d); return d; });
  ui.eCont = htmls.slice(3).map((h) => { const d = document.createElement('div'); d.className = 'state'; d.appendChild(frag(h)); $('#e-cont').appendChild(d); return d; });
  ui.eCont[1].style.position = 'absolute'; ui.eCont[1].style.right = '0'; ui.eCont[1].style.bottom = '0';
  const findText = (root, txt) => $$('*', root).find((n) => n.childElementCount === 0 && n.textContent.trim() === txt);
  const card = (root) => { let n = findText(root, 'My Family'); while (n && !(n.tagName === 'BUTTON' || n.tagName === 'LABEL' || /rounded/.test(n.className) && n.getBoundingClientRect().width > 800)) n = n.parentElement; return n; };
  const chip = (root) => { let n = findText(root, 'Food & Groceries'); while (n && n.tagName !== 'BUTTON') n = n.parentElement; return n; };
  ui.eFamily = ui.eStates.map(card);
  ui.eFood = ui.eStates.map(chip);
}

function buildTrace() {
  const labels = ['Donation received', 'Coupon issued', 'Coupon redeemed', 'Receipt recorded'];
  ui.trace = labels.map((l, i) => {
    const el = document.createElement('div');
    el.className = 'step';
    el.style.left = i * 255 + 'px';
    el.innerHTML = `<div class="node"></div><div class="n"><span>0${i + 1}</span>${CHECK}</div><div class="l">${l.replace(' ', '<br>')}</div>`;
    $('#d-trace').appendChild(el);
    return { el, node: $('.node', el), n: $('.n', el), chk: $('.n svg', el), l: $('.l', el) };
  });
  $('#d-track').style.width = 3 * 255 + 'px';
  $('#d-prog').style.width = 3 * 255 + 'px';
}

const treeImgs = [];
async function preloadTree() {
  const jobs = [];
  for (let i = 0; i < TREE_FRAMES; i++) {
    const img = new Image();
    img.src = `../tree/f${String(i).padStart(4, '0')}.jpg`;
    treeImgs.push(img);
    jobs.push(img.decode().catch(() => {}));
  }
  await Promise.all(jobs);
}

async function init() {
  buildHook();
  buildTrace();
  await Promise.all([buildDonate(), buildApply(), preloadTree()]);
  await document.fonts.load('400 100px "Instrument Serif"');
  await document.fonts.load('600 40px "Instrument Sans"');
  await document.fonts.load('700 40px "Instrument Sans"');
  await document.fonts.ready;
  await Promise.all($$('img').map((im) => (im.complete ? im.decode().catch(() => {}) : new Promise((r) => { im.onload = im.onerror = r; }))));
  window.compReady = true;
}

// ---------------------------------------------------------------- cursor
const cur = { el: null, tap: null };
function center(el) { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }
// path: [{t, at: () => {x,y}}...]; clicks: [t...]
function cursorAt(t, path, clicks, fadeIn, fadeOut) {
  const c = $('#cursor'), tap = $('#tap');
  if (t < fadeIn[0] || t > fadeOut[1]) { vis(c, false); return; }
  vis(c, true);
  let p = path[0].at();
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i], b = path[i + 1];
    if (t >= a.t && t <= b.t) { const pa = a.at(), pb = b.at(); const e = E.inOutCubic(cl((t - a.t) / (b.t - a.t))); p = { x: lerp(pa.x, pb.x, e), y: lerp(pa.y, pb.y, e) - Math.sin(Math.PI * e) * 26 }; break; }
    if (t > b.t) p = b.at();
  }
  let s = 1;
  for (const ct of clicks) { const d = t - ct; if (d > -0.06 && d < 0.16) s = Math.min(s, 1 - 0.18 * Math.sin(Math.PI * cl((d + 0.06) / 0.22))); }
  const op = Math.min(k(t, fadeIn[0], fadeIn[1], E.outCubic), 1 - k(t, fadeOut[0], fadeOut[1], E.inCubic));
  c.style.opacity = op;
  c.style.transform = `translate(${p.x - 8}px, ${p.y - 6}px) scale(${s})`;
  // tap ring at the most recent click
  const last = clicks.filter((ct) => t >= ct && t < ct + 0.5).pop();
  if (last !== undefined) {
    const q = k(t, last, last + 0.5, E.outCubic);
    vis(tap, true);
    tap.style.left = p.x + 'px'; tap.style.top = p.y + 'px';
    tap.style.transform = `scale(${lerp(0.25, 1.25, q)})`;
    tap.style.opacity = (1 - q) * 0.7;
  } else vis(tap, false);
}

// ---------------------------------------------------------------- frame
function lineIn(spans, t, t0, stagger = 0.08, dur = 0.85) {
  spans.forEach((s, i) => { const p = k(t, t0 + i * stagger, t0 + i * stagger + dur); s.style.transform = `translateY(${(1 - p) * 108}%)`; });
}

function renderFrame(t) {
  const W = 1920, H = 1080;
  // ===== A: hook + burst
  const aOn = t < T.aEnd;
  vis($('#a-bg'), aOn); vis($('#a-fg'), aOn);
  if (aOn) {
    const amt = $('#a-amt'), amtIn = $('#a-amt-in');
    amtIn.style.transform = `translateY(${(1 - k(t, 0.0, 0.95)) * 100}%)`;
    let s = lerp(1, 1.06, E.inOutSine(cl(t / 2.6)));
    s *= lerp(1, 0.9, k(t, 2.45, 3.0, E.inCubic));
    const burst = k(t, T.burst, T.burst + 0.4, E.outCubic);
    amt.style.transform = `scale(${s * lerp(1, 1.9, burst)})`;
    amt.style.opacity = 1 - burst;
    amt.style.filter = burst > 0.001 ? `blur(${(burst * 26).toFixed(1)}px)` : 'none';
    vis(amt, t < T.burst + 0.45);

    const q = $('#a-q');
    ui.qWords.forEach((w, i) => { const p = k(t, 0.15 + i * 0.06, 0.15 + i * 0.06 + 0.8); w.style.transform = `translateY(${(1 - p) * 110}%)`; });
    const qo = k(t, 2.62, 2.98, E.inCubic);
    q.style.opacity = 1 - qo;
    q.style.transform = `translateY(${-qo * 40}px) scale(${lerp(1, 1.025, E.inOutSine(cl(t / 2.6)))})`;
    vis(q, t < 3.0);

    [['#a-ring1', 0.0, 0.75, 1500, 0.85], ['#a-ring2', 0.08, 0.9, 1080, 0.7]].forEach(([id, d0, d1, size, op]) => {
      const el = $(id); const p = k(t, T.burst + d0, T.burst + d1, E.outExpo);
      vis(el, t >= T.burst + d0 && t < T.burst + d1);
      el.style.width = el.style.height = lerp(60, size, p) + 'px';
      el.style.opacity = (1 - k(t, T.burst + d0, T.burst + d1, E.outCubic)) * op;
    });

    const exitTxt = k(t, 6.42, 6.85, E.inCubic);
    const head = $('#a-head'), sub = $('#a-sub');
    lineIn([$('#a-head .line > span')], t, 3.28, 0, 0.9);
    lineIn([$('#a-sub .line > span')], t, 3.5, 0, 0.9);
    head.style.opacity = sub.style.opacity = 1 - exitTxt;
    head.style.transform = `translateY(${-exitTxt * 70}px)`;
    sub.style.transform = `translateY(${-exitTxt * 50}px)`;
    vis(head, t >= 3.2); vis(sub, t >= 3.2);

    const drift = lerp(14, -14, E.inOutSine(cl((t - 3.4) / 3.2)));
    ui.cpns.forEach((c) => {
      const p = cl((t - c.start) / 0.85);
      if (t < c.start) { vis(c.el, false); return; }
      vis(c.el, true, 'flex');
      const e = E.outExpo(p), er = E.outBack(cl((t - c.start) / 0.95));
      const fx = 960, fy = 330;
      let x = lerp(fx, c.to.x, e), y = lerp(fy, c.to.y, e) - Math.sin(Math.PI * cl(p * 1.1)) * 110 * (c.b === 1 ? 0.4 : 1);
      let r = lerp(c.from.r, c.to.r, er), sc = lerp(0.22, 1, e);
      y += drift * (0.6 + c.j * 0.2) + Math.sin((t - 4) * 1.4 + c.b * 1.7) * 3;
      const ex = k(t, 6.45 + c.b * 0.035 + c.j * 0.02, 7.05, E.inCubic);
      if (ex > 0) { const dx = c.to.x - 960, dy = c.to.y - 540; const n = Math.hypot(dx, dy) || 1; x += (dx / n || c.exitSign) * ex * 1500 + (c.b === 1 ? c.exitSign * ex * 300 : 0); y += (dy / n) * ex * 900 + (c.b === 1 ? ex * 700 : 0); r += c.exitSign * ex * 24; sc *= 1 + ex * 0.5; }
      c.el.style.opacity = cl((t - c.start) / 0.1);
      c.el.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) rotate(${r.toFixed(2)}deg) scale(${sc.toFixed(4)})`;
    });
    ui.labels.forEach((l, b) => { const p = k(t, 4.05 + b * 0.08, 4.8 + b * 0.08); const o = Math.min(p, 1 - k(t, 6.4, 6.65, E.inCubic)); l.style.opacity = o; l.style.transform = `translateY(${(1 - p) * 24 + drift * 0.7}px)`; });
  }

  // ===== B: the Giving Tree
  const bOn = t >= T.bIn && t < T.cIn + 0.6;
  vis($('#b'), bOn);
  if (bOn) {
    const fi = Math.max(0, Math.min(TREE_FRAMES - 1, Math.round((t - T.bIn) * 30)));
    const tree = $('#tree');
    const want = treeImgs[fi].src;
    if (tree.src !== want) tree.src = want;
    const iris = k(t, T.bIn, T.bIn + 0.75, E.outQuart);
    const clip = $('#b-clip');
    clip.style.clipPath = iris < 1 ? `inset(${lerp(31, 0, iris)}% ${lerp(37, 0, iris)}% round ${lerp(44, 0, iris)}px)` : 'none';
    const s = lerp(0.865, 0.925, E.inOutSine(cl((t - T.bIn) / 4.5))) * lerp(1.07, 1, iris);
    tree.style.transform = `translate(-50%, -50%) scale(${s.toFixed(4)})`;

    const kick = $('#b-kick');
    const ki = k(t, 7.15, 7.85);
    kick.style.opacity = ki; kick.style.transform = `translateY(${(1 - ki) * 30}px)`;
    const words = $$('.kw span:not(.sizer)', kick);
    const sw = [7.15, 8.55, 9.85];
    words.forEach((w, i) => {
      const pin = i === 0 ? 1 : k(t, sw[i], sw[i] + 0.5);
      const pout = i === 2 ? 0 : k(t, sw[i + 1], sw[i + 1] + 0.45, E.outCubic);
      w.style.transform = `translateY(${((1 - pin) - pout) * 105}%)`;
    });
    const bd = $('#b-badge');
    const bi = k(t, 7.55, 8.35);
    bd.style.opacity = cl(bi * 1.6);
    bd.style.transform = `translate(-50%, ${(1 - bi) * 70}px) scale(${lerp(0.94, 1, bi)})`;

    const out = k(t, T.bOut, T.bOut + 0.55, E.inOutQuart);
    $('#b').style.transform = `translateY(${-out * 380}px)`;
    $('#b-dim').style.opacity = out * 0.55;
  }

  // ===== C: donate flow
  const cOn = t >= T.cIn && t < T.dIn + 0.6;
  vis($('#c'), cOn);
  if (cOn) {
    const pin = k(t, T.cIn, T.cIn + 0.55, E.inOutQuart);
    const pout = k(t, T.dIn, T.dIn + 0.55, E.inOutQuart);
    $('#c').style.transform = `translateY(${(1 - pin) * H - pout * 240}px)`;
    lineIn($$('#c-left h2 .line > span'), t, 11.0, 0.08, 0.9);
    lineIn($$('#c-left p .line > span'), t, 11.3, 0.08, 0.9);
    const rIn = k(t, 11.0, 11.75);
    $('#c-right').style.transform = `translateY(${(1 - rIn) * 90}px) scale(1.28)`;
    $('#c-right').style.opacity = cl(rIn * 1.4);

    const nSel = T.clicksC.filter((ct) => t >= ct).length;
    ui.brandBtns.forEach((b, i) => {
      const on = t >= T.clicksC[i];
      const st = on ? b.on : b.off;
      if (b.btn.className !== st.btn) { b.btn.className = st.btn; b.box.className = st.box; b.box.innerHTML = st.inner; }
      const d = t - T.clicksC[i];
      const press = d > -0.06 && d < 0.2 ? 1 - 0.045 * Math.sin(Math.PI * cl((d + 0.06) / 0.26)) : 1;
      b.btn.style.transform = `scale(${press})`;
    });
    // chip bar slides open on first pick
    const cb = k(t, T.clicksC[0], T.clicksC[0] + 0.4, E.outExpo);
    const natural = ui.chipBar.offsetHeight;
    ui.chipWrap.style.height = (natural * cb).toFixed(1) + 'px';
    ui.chipWrap.style.marginTop = (24 * cb).toFixed(1) + 'px';
    ui.chipWrap.style.opacity = cb;
    ui.chips.forEach((ch, i) => {
      const on = t >= T.clicksC[i];
      vis(ch, on, 'flex');
      const p = k(t, T.clicksC[i], T.clicksC[i] + 0.35, E.outBack);
      ch.style.transform = `scale(${lerp(0.6, 1, p)})`; ch.style.opacity = cl(p * 2);
    });
    ui.chipCount.textContent = `${nSel} of 5 max`;
    if (nSel > 0) ui.contC.removeAttribute('disabled'); else ui.contC.setAttribute('disabled', '');
    const dc = t - T.contC;
    ui.contC.style.transform = `scale(${dc > -0.06 && dc < 0.2 ? 1 - 0.035 * Math.sin(Math.PI * cl((dc + 0.06) / 0.26)) : 1})`;

    // card -> impact: old out, then new in (dip through the background, never a double exposure)
    const o = k(t, T.impactIn - 0.12, T.impactIn + 0.1, E.inCubic);
    const n = k(t, T.impactIn + 0.06, T.impactIn + 0.6, E.outExpo);
    ui.card.style.opacity = 1 - o; ui.card.style.transform = `translateX(${-o * 70}px)`;
    vis(ui.card, o < 1);
    vis(ui.impact, n > 0);
    ui.impact.style.opacity = n; ui.impact.style.transform = `translateX(${(1 - n) * 80}px)`;
    setSteps(t >= T.impactIn ? 3 : 1);
    const cnt = Math.round(9 * k(t, T.impactIn + 0.15, T.impactIn + 0.85, E.outCubic));
    ui.nineText.textContent = String(cnt);

    cursorAt(t, [
      { t: 11.15, at: () => ({ x: 1700, y: 1130 }) },
      { t: 11.66, at: () => center($('img', ui.brandBtns[0].btn)) },
      { t: 11.8, at: () => center($('img', ui.brandBtns[0].btn)) },
      { t: 12.11, at: () => center($('img', ui.brandBtns[1].btn)) },
      { t: 12.25, at: () => center($('img', ui.brandBtns[1].btn)) },
      { t: 12.56, at: () => center($('img', ui.brandBtns[2].btn)) },
      { t: 12.68, at: () => center($('img', ui.brandBtns[2].btn)) },
      { t: 13.01, at: () => { const c = center(ui.contC); return { x: c.x + 40, y: c.y + 4 }; } },
      { t: 13.6, at: () => ({ x: 1560, y: 1000 }) },
    ], [...T.clicksC, T.contC], [11.15, 11.35], [13.25, 13.5]);
  }

  // ===== D: trust
  const dOn = t >= T.dIn && t < T.eIn + 0.6;
  vis($('#d'), dOn);
  if (dOn) {
    const p = k(t, T.dIn, T.dIn + 0.55, E.inOutQuart);
    const pout = k(t, T.eIn, T.eIn + 0.55, E.inOutQuart);
    const d = $('#d');
    d.style.clipPath = p < 1 ? `inset(${((1 - p) * 100).toFixed(2)}% 0 0 0)` : 'none';
    d.style.transform = `translateX(${-pout * 560}px)`;
    const lift = (1 - k(t, T.dIn, T.dIn + 0.9, E.outExpo)) * 140;
    $('#d-ring').style.transform = `translateY(${lift}px)`;
    $('#d-head').style.transform = `translateY(${lift * 0.8}px)`;
    $('#d-trace').style.transform = `translateY(${lift * 0.6}px)`;
    const q = k(t, 15.2, 16.55, E.outCubic);
    const C = 2 * Math.PI * 82;
    $('#d-arc').setAttribute('stroke-dasharray', C.toFixed(2));
    $('#d-arc').setAttribute('stroke-dashoffset', (C * (1 - 0.95 * q)).toFixed(2));
    $('#d-arc').style.opacity = q > 0.002 ? 1 : 0;
    $('#d-num').textContent = `${Math.round(95 * q)}¢`;
    lineIn($$('#d-head .line > span'), t, 15.15, 0.09, 0.9);
    const lp = k(t, 15.9, 17.2, E.inOutCubic);
    $('#d-prog').style.transform = `scaleX(${lp})`;
    ui.trace.forEach((s, i) => {
      const ti = 15.9 + i * (1.3 / 3);
      const on = t >= ti - 0.02;
      s.node.classList.toggle('on', on);
      const a = k(t, ti - 0.12, ti + 0.6);
      s.l.style.transform = `translateY(${(1 - a) * 30}px)`; s.l.style.opacity = a;
      s.n.style.opacity = cl(a * 1.3);
      const ck = k(t, ti, ti + 0.35, E.outBack);
      s.chk.style.transform = `scale(${ck})`; s.chk.style.opacity = ck > 0 ? 1 : 0;
    });
  }

  // ===== E: apply flow
  const eOn = t >= T.eIn && t < T.fIn + 0.6;
  vis($('#e'), eOn);
  if (eOn) {
    const p = k(t, T.eIn, T.eIn + 0.55, E.inOutQuart);
    const pout = k(t, T.fIn, T.fIn + 0.55, E.inOutQuart);
    $('#e').style.transform = `translate(${((1 - p) * 1920).toFixed(1)}px, ${(-pout * 240).toFixed(1)}px)`;
    lineIn($$('#e-head .line > span'), t, 18.55, 0.08, 0.9);
    lineIn($$('#e-sub .line > span'), t, 18.85, 0.08, 0.9);
    const ri = k(t, 18.5, 19.1);
    $('#e-right').style.transform = `translateX(${(1 - ri) * 120}px) scale(1.06)`;
    ui.eStates.forEach((s) => $$(':scope > div > *', s).forEach((sec, i) => { const q = k(t, 18.62 + i * 0.09, 19.3 + i * 0.09); sec.style.opacity = cl(q * 1.4); sec.style.transform = `translateY(${(1 - q) * 50}px)`; }));
    const st = t >= T.clicksE[1] ? 2 : t >= T.clicksE[0] ? 1 : 0;
    ui.eStates.forEach((s, i) => vis(s, i === st));
    ui.eCont.forEach((s, i) => vis(s, i === (st === 2 ? 1 : 0)));
    const pulse = (ct) => { const d = t - ct; return d > -0.06 && d < 0.2 ? 1 - 0.03 * Math.sin(Math.PI * cl((d + 0.06) / 0.26)) : 1; };
    ui.eFamily.forEach((el) => el && (el.style.transform = `scale(${pulse(T.clicksE[0])})`));
    ui.eFood.forEach((el) => el && (el.style.transform = `scale(${pulse(T.clicksE[1])})`));
    const ci = k(t, 18.9, 19.5);
    $('#e-cont').style.opacity = ci;
    $('#e-cont').style.transform = `scale(${1.5 * pulse(T.contE)})`;
    cursorAt(t, [
      { t: 18.8, at: () => ({ x: 1820, y: 1120 }) },
      { t: 19.26, at: () => { const c = center(ui.eFamily[st]); return { x: c.x - 150, y: c.y + 6 }; } },
      { t: 19.45, at: () => { const c = center(ui.eFamily[st]); return { x: c.x - 150, y: c.y + 6 }; } },
      { t: 19.86, at: () => center(ui.eFood[st]) },
      { t: 20.02, at: () => center(ui.eFood[st]) },
      { t: 20.46, at: () => center($('button', ui.eCont[st === 2 ? 1 : 0])) },
      { t: 21.2, at: () => ({ x: 1680, y: 880 }) },
    ], [...T.clicksE, T.contE], [18.8, 19.0], [20.85, 21.15]);
  }
  if (!(t >= 11.1 && t <= 13.5) && !(t >= 18.8 && t <= 21.15)) { vis($('#cursor'), false); vis($('#tap'), false); }

  // ===== F: outro
  const fOn = t >= T.fIn;
  vis($('#f'), fOn);
  if (fOn) {
    const p = k(t, T.fIn, T.fIn + 0.55, E.inOutQuart);
    $('#f').style.clipPath = p < 1 ? `inset(${((1 - p) * 100).toFixed(2)}% 0 0 0)` : 'none';
    const push = lerp(1, 1.03, E.inOutSine(cl((t - 21.5) / 3.5)));
    const lines = $$('#f-head .line > span');
    lineIn(lines, t, 21.55, 0.16, 0.95);
    $('#f-head').style.transform = `scale(${push})`;
    const btn = (id, t0) => { const q = k(t, t0, t0 + 0.7); const el = $(id); el.style.opacity = cl(q * 1.5); el.style.transform = `translateY(${(1 - q) * 46}px)`; };
    btn('#f-b1', 22.45); btn('#f-b2', 22.57);
    const bq = k(t, 22.9, 23.6);
    const bd = $('#f-badge');
    bd.style.opacity = cl(bq * 1.6);
    bd.style.transform = `translate(-50%, ${(1 - bq) * 50}px) scale(${lerp(0.92, 1, bq) * lerp(1, 1.015, E.inOutSine(cl((t - 23) / 2)))})`;
    const uq = k(t, 23.1, 23.8);
    $('#f-url').style.opacity = uq; $('#f-url').style.transform = `translateY(${(1 - uq) * 24}px)`;
  }
}

// Render one frame and resolve once every image on screen is decoded.
window.renderFrame = async (t) => {
  renderFrame(t);
  const tree = $('#tree');
  if ($('#b').style.display !== 'none' && !tree.complete) await new Promise((r) => { tree.onload = tree.onerror = r; });
  await new Promise((r) => requestAnimationFrame(() => r()));
};
window.compT = T;
init().catch((e) => { window.compError = String(e && e.stack || e); });
