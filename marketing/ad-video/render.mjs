// Renders ad.html to MP4 frame by frame: node render.mjs <width> <height> <out.mp4> [audio.wav]
// or stills: node render.mjs <width> <height> --stills <dir> t1 t2 ...
import { createRequire } from 'module';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const here = path.dirname(fileURLToPath(import.meta.url));
const [w, h, out, ...rest] = process.argv.slice(2);
const W = +w, H = +h, FPS = 30, DUR = 30;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
await page.goto('file://' + path.join(here, 'ad.html'));
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(300);
if (out === '--stills') {
  const [dir, ...times] = rest;
  for (const t of times) { await page.evaluate(t => window.render(t), +t); await page.screenshot({ path: `${dir}/still-${W}x${H}-${t}.png` }); }
} else {
  const audio = rest[0];
  const args = ['-y', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-'];
  if (audio) args.push('-i', audio);
  args.push('-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart');
  if (audio) args.push('-c:a', 'aac', '-b:a', '192k', '-shortest');
  args.push(out);
  const ff = spawn('ffmpeg', args, { stdio: ['pipe', 'ignore', 'inherit'] });
  for (let f = 0; f < FPS * DUR; f++) {
    await page.evaluate(t => window.render(t), f / FPS);
    const buf = await page.screenshot({ type: 'jpeg', quality: 95 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
}
await browser.close();
