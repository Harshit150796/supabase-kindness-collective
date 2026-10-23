// Launch-film renderer: every frame is window.renderFrame(t) on the composition page.
//   node render.mjs stills 1.2,4.5         -> stills/t-<t>.png
//   node render.mjs video <fps> <out.mp4>  -> high-quality master at <fps> (deliver.sh blends to 30)
import { chromium } from '/home/user/supabase-kindness-collective/brag-output/work/node_modules/playwright/index.mjs';
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const [mode, a1, a2, a3, a4] = process.argv.slice(2);
const W = 1920, H = 1080;
const URL = 'http://127.0.0.1:5173/brag-output-2026-10-23-201818/work/composition/index.html';
// grayscale text antialiasing: LCD subpixel AA would put orange/blue fringes on every glyph
const browser = await chromium.launch({ args: ['--disable-lcd-text'] });
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.log('pageerror', e.message));
page.on('console', (m) => { if (m.type() === 'error') console.log('console', m.text()); });
await page.route(/supabase\.co/, (r) => r.abort());
await page.goto(URL, { waitUntil: 'load' });
await page.waitForFunction(() => window.compReady || window.compError, null, { timeout: 180000 });
const err = await page.evaluate(() => window.compError);
if (err) { console.log('compError', err); process.exit(1); }
const DUR = await page.evaluate(() => window.compDuration);
// a dev-server reload mid-render would capture blank or half-loaded frames: fail loudly instead
page.on('framenavigated', (f) => { if (f === page.mainFrame()) { console.log('Error: page reloaded mid-render'); process.exit(3); } });
const shot = async (t, opts = {}) => { await page.evaluate((tt) => window.renderFrame(tt), t); return page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: W, height: H }, ...opts }); };

if (mode === 'stills') {
  fs.mkdirSync('stills', { recursive: true });
  for (const s of a1.split(',')) { const t = Number(s); await shot(Math.max(0, t - 0.05)); await shot(t, { path: `stills/t-${t.toFixed(2)}.png` }); }
  console.log('stills', a1);
} else {
  const fps = Number(a1 || 60), out = a2 || 'video-60.mp4';
  const t0 = Number(a3 || 0), t1 = Number(a4 || DUR);
  const n0 = Math.round(t0 * fps), n1 = Math.round(t1 * fps);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-c:v', 'png', '-framerate', String(fps), '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '8', '-pix_fmt', 'yuv444p', '-r', String(fps), out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const start = Date.now();
  for (let i = n0; i < n1; i++) {
    const buf = await shot(i / fps);
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % 300 === 0) console.log(`frame ${i}/${n1} ${((Date.now() - start) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end(); await new Promise((r) => ff.on('close', r));
  console.log('done', out, DUR, ((Date.now() - start) / 1000).toFixed(0) + 's');
}
await browser.close();
