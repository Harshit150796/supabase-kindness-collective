// Shared helpers for deterministic captures of the CouponDonation homepage hero (opening lockup + live 3D tree).
//
// Determinism model
// - page.clock (Playwright fake timers) owns Date, performance.now, setTimeout/Interval and requestAnimationFrame,
//   so React timers, the opening's inline timers and the R3F render loop only move when we call runFor().
// - CSS animations/transitions and WAAPI run on the document timeline, which the fake clock does NOT control.
//   We freeze the document timeline through CDP (Animation.setPlaybackRate 0) and advance every running
//   animation by exactly the frame step ourselves (window.__capAdvance), so CSS motion follows the same clock.
// - Math.random is replaced by a seeded PRNG so drop order / garden moment kind are reproducible.
import { chromium } from '/home/user/supabase-kindness-collective/brag-output/work/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import path from 'node:path';

export const ORIGIN = process.env.CAP_ORIGIN || 'http://127.0.0.1:5173'; // capture-only server: CAP_ORIGIN=http://127.0.0.1:5174
export const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';
export const FPS = 30;
export const STEP = 1000 / FPS;

export function initScript({ seed = 1, css = '', moment = null }) {
  // Runs in the page before any page script.
  return `(() => {
    try {
      localStorage.setItem('cd_privacy_consent', JSON.stringify({ accepted: false, choice: 'essential', at: '2026-10-23T12:00:00.000Z' }));
      localStorage.removeItem('cd_motion_paused');
    } catch (e) {}
    // Seeded Math.random (mulberry32) for reproducible drops / moments.
    let s = ${Number(seed) >>> 0} || 1;
    const rnd = function () { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    // Optional: choose which of the garden's two real moments plays first (PlantsLayer picks it with
    // Math.random() < 0.5 ? 'dandelion' : 'butterfly'; after that they alternate as on the site).
    const MOMENT = ${JSON.stringify(moment)};
    Math.random = MOMENT ? function () { const v = rnd(); const st = new Error().stack || ''; return st.includes('PlantsLayer') ? (MOMENT === 'dandelion' ? 0.25 : 0.75) : v; } : rnd;
    // One requestAnimationFrame per video frame: callbacks queue here and __capFrame() flushes them at the
    // current fake time (so the tree draws exactly once per captured frame, at the frame's own time).
    const rafQ = new Map(); let rafId = 0;
    const raf = (cb) => { const i = ++rafId; rafQ.set(i, cb); return i; };
    const caf = (i) => { rafQ.delete(i); };
    Object.defineProperty(window, 'requestAnimationFrame', { get: () => raf, set: () => {}, configurable: false });
    Object.defineProperty(window, 'cancelAnimationFrame', { get: () => caf, set: () => {}, configurable: false });
    window.__capFrame = () => {
      const cbs = [...rafQ.values()]; rafQ.clear();
      const now = performance.now();
      for (const cb of cbs) { try { cb(now); } catch (e) { console.error('raf cb', e && e.stack || e); } }
      return cbs.length;
    };
    // Log the tree's 9s auto-drop interval (AUTO_DROP_MS) so captures can be timed around a falling coupon.
    let si = window.setInterval;
    const siWrap = function (fn, ms, ...rest) { const id = si.call(window, fn, ms, ...rest); if (ms === 9000) (window.__capDrops ||= []).push({ id, at: performance.now() }); return id; };
    Object.defineProperty(window, 'setInterval', { configurable: true, get: () => siWrap, set: (v) => { si = v; } });
    // Advance every running animation on the (frozen) document timeline by dt ms.
    const seen = new WeakSet();
    window.__capAdvance = (dt) => {
      let n = 0;
      for (const a of document.getAnimations()) {
        if (!seen.has(a)) { seen.add(a); continue; }       // born during this step: starts at the frame boundary
        if (a.playState !== 'running') continue;
        const ct = a.currentTime;
        if (ct === null) continue;
        a.currentTime = ct + dt * (a.playbackRate || 1);
        n++;
      }
      return n;
    };
    const css = ${JSON.stringify(css)};
    const add = () => { if (!css) return; const st = document.createElement('style'); st.id = 'cap-style'; st.textContent = css; (document.head || document.documentElement).appendChild(st); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', add); else add();
  })();`;
}

// Things that are not part of the site's real look in a capture.
export const BASE_CSS = `
  vite-error-overlay, .cursor-trail { display: none !important; }
  [data-sonner-toaster], [role="dialog"][aria-label="Privacy information"] { display: none !important; }
`;

export async function launch({ query = 'time3d=night&tier3d=high', seed = 1, css = '', moment = null, width = 1920, height = 1080, dpr = 1 } = {}) {
  const browser = await chromium.launch({
    args: ['--disable-lcd-text', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  });
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: dpr, userAgent: UA });
  // Everything off-box is blocked anyway (supabase/coupondonation 403); abort it so nothing hangs.
  await ctx.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, (r) => r.abort());
  await ctx.addInitScript({ content: initScript({ seed, moment, css: BASE_CSS + css }) });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 300)); });
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Animation.enable');
  await cdp.send('Animation.setPlaybackRate', { playbackRate: 0 });
  await page.clock.install({ time: new Date('2026-10-23T20:00:00Z') });
  await page.clock.pauseAt(new Date('2026-10-23T20:00:01Z'));
  const url = `${ORIGIN}/?${query}`;
  return { browser, ctx, page, cdp, errors, url };
}

/** One video frame: fake clock + CSS timeline both move by STEP. */
// Integer fake-clock steps that add up to exactly 1000/30 ms per frame on average (33, 33, 34, ...).
let acc = 0;
export function nextDt(fps = FPS) {
  const before = Math.round(acc);
  acc += 1000 / fps;
  return Math.round(acc) - before;
}
export async function step(page, ms = nextDt()) {
  await page.clock.runFor(ms);
  return page.evaluate((dt) => [window.__capFrame(), window.__capAdvance(dt)], ms);
}

export async function shot(page, file, { png = false, quality = 93 } = {}) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  if (png) return page.screenshot({ path: file, type: 'png' });
  return page.screenshot({ path: file, type: 'jpeg', quality });
}

export const frameName = (dir, i) => path.join(dir, `f${String(i).padStart(4, '0')}.jpg`);

export async function state(page) {
  return page.evaluate(() => {
    const root = document.documentElement;
    const c = document.querySelector('canvas[data-tree-reveal-reason], canvas');
    const wrap = document.querySelector('[data-tree-tier]');
    return {
      t: performance.now().toFixed(0),
      cls: root.className,
      introMs: root.dataset.introMs,
      introReason: root.dataset.introReason,
      treeReady: !!window.__cdTreeReady,
      reveal: c?.dataset.treeRevealReason,
      compiled: c?.dataset.treeCompiledMs,
      tier: wrap?.dataset.treeTier,
      fps: c?.dataset.treeFps,
      play: !!document.querySelector('.hero-headline[data-play]'),
      word: document.querySelector('.hero-kicker-word [data-state="on"]')?.textContent,
      tags: [...document.querySelectorAll('.gm')].map((g) => g.className + ' :: ' + g.textContent),
    };
  });
}

// Compact per-frame state used to timestamp key moments.
export async function moments(page) {
  return page.evaluate(() => {
    const root = document.documentElement;
    const on = document.querySelector('.hero-kicker-word [data-state="on"]');
    const gm = [...document.querySelectorAll('.gm')].map((g) => (g.classList.contains('gm-dandelion') ? 'dandelion' : 'butterfly') + ':' + g.textContent.trim());
    const c = document.querySelector('canvas');
    return {
      t: Math.round(performance.now()),
      cls: ['cd-intro', 'cd-words', 'cd-wait', 'cd-iris', 'cd-fly', 'cd-fade', 'cd-landed'].filter((k) => root.classList.contains(k)).join(' '),
      intro: !!document.getElementById('cd-intro'),
      ready: !!window.__cdTreeReady,
      play: !!document.querySelector('.hero-headline[data-play]'),
      word: on ? on.textContent : null,
      brands: c?.dataset.treeBrands?.split('|').length ?? 0,
      gm: gm.join(' | '),
      plants: document.querySelectorAll('.gm').length,
    };
  });
}

export function rmFrames(dir) {
  if (!fs.existsSync(dir)) return;
  for (const f of fs.readdirSync(dir)) if (/^f\d{4}\.jpg$/.test(f) || f.endsWith('.png')) fs.unlinkSync(path.join(dir, f));
}
