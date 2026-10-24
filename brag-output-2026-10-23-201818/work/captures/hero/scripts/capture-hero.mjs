// Settled live hero (no opening: ?intro=0), timed around the tree's first automatic coupon drop
// (AUTO_DROP_MS = 9s after the coupons are ready). 30 fps, deterministic fake clock.
// Usage: node capture-hero.mjs <night|day> [frames=240] [leadSeconds=1.0] [seed=7] [outDir] [tags=hide|show] [drop=1] [moment=any|dandelion|butterfly]
// (drop = which automatic drop to centre on; earlier drops play out during the 10 fps warm-up.)
import fs from 'node:fs';
import { launch, step, shot, frameName, moments, rmFrames } from './hero-lib.mjs';
const SKY = process.argv[2] || 'night';
const N = Number(process.argv[3] || 240);
const LEAD = Number(process.argv[4] || 1.0);
const SEED = Number(process.argv[5] || 7);
const OUT = (process.argv[6] && process.argv[6] !== '-') ? process.argv[6] : `/home/user/supabase-kindness-collective/brag-output-2026-10-23-201818/work/captures/hero/${SKY}-hero`;
const TAGS = process.argv[7] || 'hide';
const DROP = Number(process.argv[8] || 1);
const MOMENT = ['dandelion', 'butterfly'].includes(process.argv[9]) ? process.argv[9] : null;
// The fallback donor names (useFallingDonations FALLBACK: 'Sarah M.', 'James K.', ...) are made-up people:
// keep the name tags out of the picture; the plant, seeds and butterfly still play.
const HIDE_TAGS = `.gm-dandelion .gm-tagwrap, .gm-hang { visibility: hidden !important; }`;
rmFrames(OUT); fs.mkdirSync(OUT, { recursive: true });
const { browser, page, errors, url } = await launch({ query: `time3d=${SKY}&tier3d=high&intro=0`, seed: SEED, moment: MOMENT, css: TAGS === 'hide' ? HIDE_TAGS : '' });
const t0 = Date.now();
await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.evaluate(() => window.__capAdvance(0));
// Load: small fake steps with real-time gaps until the tree has revealed itself.
let m;
for (let k = 0; k < 80; k++) {
  await page.waitForTimeout(k < 3 ? 2500 : 1000);
  await step(page, 16);
  m = await moments(page);
  if (m.ready) break;
}
const drops = await page.evaluate(() => window.__capDrops || []);
if (!drops.length) throw new Error('no auto-drop interval found');
const firstDrop = drops[drops.length - 1].at + 9000 * DROP;
const recStart = firstDrop - LEAD * 1000;
console.log('ready at fake', m.t, 'drop interval at', drops.map(d => d.at), 'first drop', firstDrop, 'record from', recStart);
// Warm-up at 10 fps (drawn frames: shadow map goes to full size after 60 draws; headline settles).
let warm = 0;
while ((await page.evaluate(() => performance.now())) < recStart - 100) {
  const now = await page.evaluate(() => performance.now());
  // Warm-up steps of 50 ms keep falling coupons (dt is clamped to 0.05 s) at their real speed.
  const base = drops[drops.length - 1].at;
  const falling = [...Array(DROP - 1)].some((_, k) => now >= base + 9000 * (k + 1) - 50 && now < base + 9000 * (k + 1) + 2500);
  await step(page, Math.min(falling ? 50 : 100, Math.round(recStart - now)));
  warm++;
  if (warm % 20 === 0) console.log('warm', warm, JSON.stringify(await moments(page)));
}
// Land exactly on recStart.
const now = await page.evaluate(() => performance.now());
if (recStart - now >= 1) await step(page, Math.round(recStart - now));
console.log('warm frames', warm, 'real', ((Date.now() - t0) / 1000).toFixed(0) + 's');
const log = [];
let last = '';
for (let i = 0; i < N; i++) {
  if (i > 0) await step(page);
  m = await moments(page);
  await shot(page, frameName(OUT, i));
  const sig = JSON.stringify({ ...m, t: 0 });
  if (sig !== last) { log.push({ f: i, ...m }); console.log(i, JSON.stringify(m)); last = sig; }
  if (i % 30 === 0) console.log('frame', i, 'fake', m.t, 'real', ((Date.now() - t0) / 1000).toFixed(0) + 's');
}
fs.writeFileSync(OUT + '/timeline.json', JSON.stringify({ fps: 30, frames: N, sky: SKY, seed: SEED, tags: TAGS, drop: DROP, moment: MOMENT, firstDropFake: firstDrop, recordStartFake: recStart, log, errors: errors.slice(0, 20) }, null, 1));
console.log('done', N, 'frames in', ((Date.now() - t0) / 1000).toFixed(0), 's');
await browser.close();
