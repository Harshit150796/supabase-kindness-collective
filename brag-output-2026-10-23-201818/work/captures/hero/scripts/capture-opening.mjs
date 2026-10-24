// Opening lockup -> fly onto the nav brand -> hero settles (night sky), 30 fps, deterministic fake clock.
// Usage: node capture-opening.mjs [frames=180] [outDir]
import fs from 'node:fs';
import { launch, step, shot, frameName, moments, rmFrames, STEP } from './hero-lib.mjs';
const N = Number(process.argv[2] || 180);
const OUT = process.argv[3] || '/home/user/supabase-kindness-collective/brag-output-2026-10-23-201818/work/captures/hero/opening';
rmFrames(OUT); fs.mkdirSync(OUT, { recursive: true });
const { browser, page, errors, url } = await launch({ query: 'time3d=night&tier3d=high', seed: 7 });
const t0 = Date.now();
await page.goto(url, { waitUntil: 'domcontentloaded' });
// Fonts for the lockup (real time; the opening itself waits for them before the words rise).
await page.waitForFunction(() => document.documentElement.classList.contains('cd-words') || !document.getElementById('cd-intro'), null, { timeout: 60000 });
await page.evaluate(() => window.__capAdvance(0)); // register the animations that exist at first paint
const log = [];
let m = await moments(page);
log.push({ f: 0, ...m });
await shot(page, frameName(OUT, 0));
let last = JSON.stringify({ ...m, t: 0 });
for (let i = 1; i < N; i++) {
  // Until the tree has drawn, give the real (network/decode/compile) work time between frames, as a fast
  // machine would have; the fake clock still moves 1/30 s per frame.
  if (!m.ready) {
    for (let k = 0; k < 20 && !(await page.evaluate(() => !!window.__cdTreeReady)); k++) {
      await page.waitForTimeout(1500);
      if (k >= 1) break;
    }
  }
  await step(page);
  m = await moments(page);
  await shot(page, frameName(OUT, i));
  const sig = JSON.stringify({ ...m, t: 0 });
  if (sig !== last) { log.push({ f: i, ...m }); console.log(i, JSON.stringify(m)); last = sig; }
  if (i % 30 === 0) console.log('frame', i, 'fake', m.t, 'real', ((Date.now() - t0) / 1000).toFixed(0) + 's');
}
await shot(page, OUT + '/best-settled.png', { png: true });
fs.writeFileSync(OUT + '/timeline.json', JSON.stringify({ fps: 30, frames: N, log, errors: errors.slice(0, 20) }, null, 1));
console.log('done', N, 'frames in', ((Date.now() - t0) / 1000).toFixed(0), 's; errors', errors.length);
await browser.close();
