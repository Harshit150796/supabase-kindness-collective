// Usage:
//   node render.mjs stills 1.2,4.5,...        -> work/stills/t-<t>.png
//   node render.mjs video <fps> <out.mp4> [t0] [t1]
//      renders <fps> samples/sec into a high-quality master (deliver.sh blends to 30fps).
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const URL = 'http://127.0.0.1:5173/brag-output/work/composition/index.html';
const DUR = 25.0;
const [mode, a1, a2, a3, a4] = process.argv.slice(2);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.log('pageerror', e.message));
page.on('console', (m) => { if (m.type() === 'error') console.log('console', m.text()); });
await page.goto(URL, { waitUntil: 'load' });
await page.waitForFunction(() => window.compReady || window.compError, null, { timeout: 120000 });
const err = await page.evaluate(() => window.compError);
if (err) { console.log('compError', err); process.exit(1); }
const stage = page.locator('#stage');

async function shot(t, opts = {}) {
  await page.evaluate((tt) => window.renderFrame(tt), t);
  return page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: 1920, height: 1080 }, ...opts });
}

if (mode === 'stills') {
  fs.mkdirSync('stills', { recursive: true });
  for (const s of a1.split(',')) {
    const t = Number(s);
    // render a few frames before so any per-frame state settles exactly as in the film
    await shot(Math.max(0, t - 0.05));
    await shot(t, { path: `stills/t-${t.toFixed(2)}.png` });
    console.log('still', t);
  }
} else if (mode === 'video') {
  const fps = Number(a1 || 60);
  const out = a2 || 'brag-raw.mp4';
  const t0 = Number(a3 || 0), t1 = Number(a4 || DUR);
  const n = Math.round((t1 - t0) * fps);
  // lossless-ish master at the sampling rate; motion-blur blend happens in deliver.sh
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-c:v', 'png', '-framerate', String(fps), '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '8', '-pix_fmt', 'yuv444p', '-r', String(fps), out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const start = Date.now();
  for (let i = 0; i < n; i++) {
    // sample the frame interval so blended pairs straddle each 30fps frame (180° shutter)
    const t = t0 + i / fps;
    const buf = await shot(t);
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % 60 === 0) console.log(`frame ${i}/${n} t=${t.toFixed(2)} ${((Date.now() - start) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  console.log('done', out, ((Date.now() - start) / 1000).toFixed(0) + 's');
}
await browser.close();
