// Slow drag-orbit of the live tree with a gentle dolly-in (OrbitControls drag + the hero's wheel zoom),
// like brag-output/work/capture-tree.mjs but at 1920x1080 / 30 fps with one drawn frame per video frame.
// Usage: node capture-orbit.mjs [sky=day] [frames=120] [seed=7] [outDir] [startSeconds=4]
import fs from 'node:fs';
import { launch, step, shot, frameName, moments, rmFrames } from './hero-lib.mjs';
const SKY = process.argv[2] || 'day';
const N = Number(process.argv[3] || 120);
const SEED = Number(process.argv[4] || 7);
const OUT = process.argv[5] || '/home/user/supabase-kindness-collective/brag-output-2026-10-23-201818/work/captures/hero/orbit';
const START = Number(process.argv[6] || 4) * 1000; // fake ms after load to start (before the 9s auto drop)
const HIDE_TAGS = `.gm-dandelion .gm-tagwrap, .gm-hang { visibility: hidden !important; }`;
rmFrames(OUT); fs.mkdirSync(OUT, { recursive: true });
const { browser, page, errors, url } = await launch({ query: `time3d=${SKY}&tier3d=high&intro=0`, seed: SEED, css: HIDE_TAGS });
const t0 = Date.now();
await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.evaluate(() => window.__capAdvance(0));
let m;
for (let k = 0; k < 80; k++) {
  await page.waitForTimeout(k < 3 ? 2500 : 1000);
  await step(page, 16);
  m = await moments(page);
  if (m.ready) break;
}
console.log('ready at fake', m.t);
let warm = 0;
while ((await page.evaluate(() => performance.now())) < START - 100 || warm < 62) {
  await step(page, 100 * (warm < 62 ? 1 : 1));
  warm++;
}
console.log('warm frames', warm, 'fake', await page.evaluate(() => performance.now()), 'real', ((Date.now() - t0) / 1000).toFixed(0) + 's');
// Grab the grass right of the trunk (no hit zones there) and drag left: the camera orbits the tree.
const cx = 1260, cy = 800;
await page.mouse.move(cx, cy);
await page.mouse.down();
let x = cx;
const TOTAL_PX = 190; // ~85 degrees of orbit at this hero height
const w = []; for (let i = 0; i < N; i++) w.push(Math.sin(Math.PI * (i + 0.5) / N) ** 2 + 0.04);
const sum = w.reduce((a, b) => a + b, 0);
for (let i = 0; i < N; i++) {
  if (i > 0) {
    x -= TOTAL_PX * w[i] / sum;
    await page.mouse.move(Math.round(x * 100) / 100, cy);
    if (i % 3 === 0 && i < N * 0.7) await page.mouse.wheel(0, -4); // dolly in a little while orbiting
    await step(page);
  }
  await shot(page, frameName(OUT, i));
  if (i % 30 === 0) console.log('frame', i, 'real', ((Date.now() - t0) / 1000).toFixed(0) + 's', JSON.stringify(await moments(page)));
}
fs.writeFileSync(OUT + '/timeline.json', JSON.stringify({ fps: 30, frames: N, sky: SKY, seed: SEED, startFake: START, errors: errors.slice(0, 20) }, null, 1));
console.log('done', N, 'frames in', ((Date.now() - t0) / 1000).toFixed(0), 's');
await browser.close();
