/* Shared stage for the CouponDonation video ads.
   A version page loads its timeline (window.TL), this file, cast.js and sets.js, then calls CD.run({...}).
   render.mjs calls window.render(t) once per frame, so every frame is a pure function of t (no clocks, no randomness). */
(function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const CD = (window.CD = window.CD || {});

  const el = (CD.el = (tag, attrs, parent) => {
    const e = document.createElementNS(NS, tag);
    if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  });
  CD.html = (tag, cls, parent, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  };

  // ---- timing ----
  CD.clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  CD.prog = (t, a, b) => CD.clamp((t - a) / (b - a || 1e-6));
  CD.eo = (x) => 1 - Math.pow(1 - x, 3);
  CD.ei = (x) => x * x * x;
  CD.eio = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  CD.sine = (x) => 0.5 - 0.5 * Math.cos(Math.PI * x);
  CD.back = (x) => { const c = 1.6; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
  CD.lerp = (a, b, k) => a + (b - a) * k;
  /** 0→1→0 window between a and b with soft edges. */
  CD.win = (t, a, b, f = 0.3) => Math.min(CD.eo(CD.prog(t, a, a + f)), 1 - CD.eo(CD.prog(t, b - f, b)));
  const mix = (CD.mix = (a, b, k) => {
    if (typeof a === 'number' && typeof b === 'number') return a + (b - a) * k;
    if (Array.isArray(a) && Array.isArray(b)) return a.map((v, i) => mix(v, b[i], k));
    if (a && b && typeof a === 'object' && typeof b === 'object') {
      const o = {};
      for (const key in a) o[key] = key in b ? mix(a[key], b[key], k) : a[key];
      for (const key in b) if (!(key in a)) o[key] = b[key];
      return o;
    }
    return k < 0.5 ? a : b;
  });
  /** Keyframes [[t, value], ...] with eased interpolation; values may be numbers, arrays or objects. */
  CD.track = (keys, t, ease = CD.eio) => {
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) {
      if (t <= keys[i][0]) {
        const [t0, v0] = keys[i - 1], [t1, v1] = keys[i];
        return mix(v0, v1, ease((t - t0) / (t1 - t0 || 1e-6)));
      }
    }
    return keys[keys.length - 1][1];
  };

  // ---- layout per aspect ratio ----
  const W = (CD.W = innerWidth), H = (CD.H = innerHeight), AR = W / H;
  const mode = (CD.mode = AR < 0.8 ? 'portrait' : AR > 1.25 ? 'landscape' : 'square');
  document.documentElement.dataset.mode = mode;
  // The part of the screen the scene is framed into; captions use the rest.
  const REG = { portrait: [0, 0.255, 1, 0.745], landscape: [0.355, 0, 0.645, 1], square: [0, 0, 1, 0.79] }[mode];
  /** Pick a value per aspect: {portrait, landscape, square}; square falls back to landscape. */
  CD.pick = (o) => (o[mode] !== undefined ? o[mode] : o.landscape);
  /** Fit a world box [cx, cy, w, h] into the scene region (or the full screen) and return the SVG viewBox. */
  CD.viewBox = (box, full) => {
    const R = full ? [0, 0, 1, 1] : REG;
    const rx = R[0] * W, ry = R[1] * H, rw = R[2] * W, rh = R[3] * H;
    const [cx, cy, bw, bh] = box;
    const s = Math.min(rw / bw, rh / bh);
    const vx = cx - (rx + rw / 2) / s, vy = cy - (ry + rh / 2) / s;
    return `${vx.toFixed(2)} ${vy.toFixed(2)} ${(W / s).toFixed(2)} ${(H / s).toFixed(2)}`;
  };
  /** Camera from per-aspect keyframes {landscape: [[t, box]...], portrait: [...]} in shot-local time. */
  CD.cam = (o) => (lt) => CD.track(CD.pick(o), lt, CD.sine);

  let gid = 0;
  CD.uid = (p = 'u') => p + gid++;
  CD.vgrad = (top, bottom, x2 = 0, y2 = 1) => {
    const id = CD.uid('lg');
    const lg = el('linearGradient', { id, x1: 0, y1: 0, x2, y2 }, CD.defs);
    el('stop', { offset: 0, 'stop-color': top }, lg);
    el('stop', { offset: 1, 'stop-color': bottom }, lg);
    return `url(#${id})`;
  };
  CD.rgrad = (stops, cx = 0.5, cy = 0.5, r = 0.5) => {
    const id = CD.uid('rg');
    const rg = el('radialGradient', { id, cx, cy, r }, CD.defs);
    for (const [o, c, a] of stops) el('stop', { offset: o, 'stop-color': c, 'stop-opacity': a ?? 1 }, rg);
    return `url(#${id})`;
  };
  /** Deterministic pseudo-random numbers for set dressing. */
  CD.rand = (seed) => { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); };

  const norm = (w) => w.toLowerCase().replace(/[^a-z0-9$%&]/g, '');

  CD.run = function (cfg) {
    window.DURATION = cfg.duration;
    // make sure every face is requested now, even ones first used inside hidden shots
    for (const f of ['400 20px IS', '400 20px ISi', '500 20px IN', '700 20px IN', '700 20px Hand']) document.fonts.load(f);
    const stage = document.getElementById('stage');
    const svg = (CD.svg = el('svg', { id: 'world', width: W, height: H, viewBox: `0 0 ${W} ${H}` }, stage));
    CD.defs = el('defs', {}, svg);
    for (const s of cfg.shots) {
      s.g = el('g', {}, svg);
      s.build(s.g, s);
      s.g.style.display = 'none';
    }

    const vig = CD.html('div', 'vig', stage);
    const scrimL = CD.html('div', 'scrim light', stage);
    const scrimD = CD.html('div', 'scrim dark', stage);
    const capBox = CD.html('div', 'caps', stage);
    const fs = CD.pick({ portrait: W * 0.066, landscape: H * 0.074, square: W * 0.056 });
    capBox.style.setProperty('--fs', fs + 'px');
    const caps = (cfg.captions || []).map((c) => {
      const box = CD.html('div', 'cap ' + (c.theme || 'light'), capBox);
      if (c.size) box.style.fontSize = `calc(var(--fs) * ${c.size})`;
      const d = CD.html('div', 'txt', box);
      const hl = (c.hl || []).map(norm);
      const spans = [];
      c.text.split(' ').forEach((w, i, all) => {
        if (w === '/') { CD.html('br', '', d); return; }
        const s = CD.html('span', 'w' + (hl.includes(norm(w)) ? ' hl' : ''), d, w);
        spans.push(s);
        if (i < all.length - 1) d.appendChild(document.createTextNode(' '));
      });
      return { ...c, el: box, spans };
    });

    const disc = CD.html('div', 'disc', stage, cfg.disclosure?.text || 'Dramatization · illustrated characters');
    const flash = CD.html('div', 'flash', stage);

    // End card
    const end = CD.html('div', 'end', stage);
    end.style.display = 'none';
    let endKids = [];
    if (cfg.end) {
      const logo = CD.html('img', 'logo', end);
      logo.src = cfg.end.logo || '../../../public/favicon-512.png';
      const wm = CD.html('div', 'wm', end);
      CD.html('span', 'c', wm, 'Coupon');
      CD.html('span', 'd', wm, 'Donation');
      CD.html('div', 'eh', end, cfg.end.headline);
      CD.html('div', 'btn', end, cfg.end.cta || 'coupondonation.com');
      if (cfg.end.fine) CD.html('div', 'fine', end, cfg.end.fine);
      endKids = [...end.children];
    }

    window.render = function (t) {
      let active = null;
      for (const s of cfg.shots) {
        const on = t >= s.t0 && t < s.t1;
        s.g.style.display = on ? '' : 'none';
        if (on) active = s;
      }
      if (active) {
        const lt = t - active.t0;
        if (active.update) active.update(t, lt);
        let box = active.cam ? active.cam(lt) : [0, 0, 1000, 1000];
        if (active.shake) {
          const a = active.shake;
          box = [box[0] + Math.sin(t * 1.31) * a + Math.sin(t * 2.7) * a * 0.4, box[1] + Math.sin(t * 1.07 + 1) * a * 0.7, box[2], box[3]];
        }
        svg.setAttribute('viewBox', CD.viewBox(box, active.full));
        document.body.style.background = active.bg || '#f4f6f2';
      }

      // captions: words pop in one after another
      let wl = 0, wd = 0;
      for (const c of caps) {
        const on = t >= c.t0 && t < c.t1;
        c.el.style.display = on ? '' : 'none';
        if (!on) continue;
        const out = CD.eo(CD.prog(t, c.t1 - 0.18, c.t1));
        c.el.style.opacity = 1 - out;
        c.spans.forEach((s, i) => {
          const st = c.t0 + i * (c.rate || 0.075);
          const k = CD.prog(t, st, st + 0.22);
          s.style.opacity = CD.eo(k);
          s.style.transform = `translateY(${((1 - CD.eo(k)) * 0.32).toFixed(3)}em) scale(${(0.9 + 0.1 * CD.back(k)).toFixed(3)})`;
        });
        const vis = CD.win(t, c.t0 - 0.05, c.t1, 0.25);
        if ((c.theme || 'light') === 'dark') wd = Math.max(wd, vis); else wl = Math.max(wl, vis);
      }
      scrimL.style.opacity = wl * (cfg.scrim ?? 1);
      scrimD.style.opacity = wd * (cfg.scrim ?? 1);

      vig.style.opacity = cfg.vignette ? CD.track(cfg.vignette, t) : 0;
      let f = 0, fc = '#000';
      for (const [ft, dur, color, shape, max = 1] of cfg.flashes || []) {
        let v = 0;
        if (shape === 'dip') v = CD.win(t, ft - dur / 2, ft + dur / 2, dur / 2) * max;
        else if (t >= ft) v = (1 - CD.eo(CD.prog(t, ft, ft + dur))) * max;
        if (v > f) { f = v; fc = color; }
      }
      flash.style.opacity = f;
      flash.style.background = fc;

      const d = cfg.disclosure || {};
      disc.style.opacity = d.range ? CD.win(t, d.range[0], d.range[1], 0.2) * 0.85 : 0;
      disc.style.color = d.dark && d.dark(t) ? 'rgba(255,255,255,.8)' : 'rgba(20,32,25,.7)';

      if (cfg.end) {
        const e0 = cfg.end.t;
        end.style.opacity = CD.eo(CD.prog(t, e0, e0 + 0.35));
        end.style.display = t >= e0 ? '' : 'none';
        endKids.forEach((k, i) => {
          const p = CD.prog(t, e0 + 0.15 + i * 0.13, e0 + 0.75 + i * 0.13);
          k.style.opacity = CD.eo(p);
          k.style.transform = `translateY(${((1 - CD.eo(p)) * 30).toFixed(1)}px)` + (i === 0 ? ` scale(${(0.82 + 0.18 * CD.back(p)).toFixed(3)})` : '');
        });
        // the button breathes once to draw the eye
        const btn = end.querySelector('.btn');
        if (btn) btn.style.transform += ` scale(${(1 + 0.045 * Math.sin(Math.PI * CD.prog(t, e0 + 1.6, e0 + 2.2))).toFixed(3)})`;
      }
    };
    window.render(0);
  };
})();
