// Comic film renderer.
//   [PAGE=coop] node render-comic.mjs <h|v> stills 1.2,4.5  -> stills-[coop-]<fmt>/t-<t>.png
//   node render-comic.mjs <h|v> video <fps> <out.mp4>    -> high-quality master at <fps>
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const [fmt, mode, a1, a2] = process.argv.slice(2);
const W = fmt === 'v' ? 1080 : 1920, H = fmt === 'v' ? 1920 : 1080;
const PAGE = process.env.PAGE || 'index'; // index = Level 1, coop = Co-op mode
const URL = `http://127.0.0.1:5173/brag-output/work/comic/${PAGE}.html?f=${fmt}`;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.log('pageerror', e.message));
page.on('console', (m) => { if (m.type() === 'error') console.log('console', m.text()); });
await page.goto(URL, { waitUntil: 'load' });
await page.waitForFunction(() => window.compReady || window.compError, null, { timeout: 120000 });
const err = await page.evaluate(() => window.compError);
if (err) { console.log('compError', err); process.exit(1); }
const DUR = await page.evaluate(() => window.compDuration);
// a dev-server reload mid-render would capture blank or half-loaded frames: fail loudly instead
page.on('framenavigated', (f) => { if (f === page.mainFrame()) { console.log('Error: page reloaded mid-render'); process.exit(3); } });
const shot = async (t, opts = {}) => { await page.evaluate((tt) => window.renderFrame(tt), t); return page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: W, height: H }, ...opts }); };

if (mode === 'stills') {
  const dir = `stills-${PAGE === 'index' ? '' : PAGE + '-'}${fmt}`; fs.mkdirSync(dir, { recursive: true });
  for (const s of a1.split(',')) { const t = Number(s); await shot(Math.max(0, t - 0.05)); await shot(t, { path: `${dir}/t-${t.toFixed(2)}.png` }); }
  console.log('stills', a1);
} else {
  const fps = Number(a1 || 60), out = a2;
  const n = Math.round(DUR * fps);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-c:v', 'png', '-framerate', String(fps), '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '8', '-pix_fmt', 'yuv444p', '-r', String(fps), out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const start = Date.now();
  for (let i = 0; i < n; i++) {
    const buf = await shot(i / fps);
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % 120 === 0) console.log(`frame ${i}/${n} ${((Date.now() - start) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end(); await new Promise((r) => ff.on('close', r));
  console.log('done', out, DUR, ((Date.now() - start) / 1000).toFixed(0) + 's');
}
await browser.close();
