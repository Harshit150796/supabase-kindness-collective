// Renders an ad page to MP4, frame by frame, with headless Chromium and ffmpeg.
//   node render.mjs <page.html> <width> <height> <out.mp4> [audio.wav]
//   node render.mjs <page.html> <width> <height> --stills <dir> <t1> <t2> ...
// The page must define window.render(t); window.DURATION (seconds) defaults to 30.
import { createRequire } from 'module';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const [pageArg, w, h, out, ...rest] = process.argv.slice(2);
const W = +w, H = +h, FPS = 30;
const pagePath = path.resolve(pageArg);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => { console.error('page error:', e.message); process.exitCode = 1; });
await page.goto('file://' + pagePath);
await page.evaluate(() => document.fonts.ready);
await page.waitForFunction(() => typeof window.render === 'function');
await page.waitForTimeout(400);
const DUR = await page.evaluate(() => window.DURATION || 30);
const tag = path.basename(pagePath, '.html');

if (out === '--stills') {
  const [dir, ...times] = rest;
  fs.mkdirSync(dir, { recursive: true });
  for (const t of times) {
    await page.evaluate((t) => window.render(t), +t);
    await page.screenshot({ path: `${dir}/${tag}-${W}x${H}-${t}.png` });
  }
} else {
  const audio = rest[0];
  const args = ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-'];
  if (audio) args.push('-i', audio);
  args.push('-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart');
  if (audio) args.push('-c:a', 'aac', '-b:a', '192k', '-shortest');
  args.push(out);
  const ff = spawn('ffmpeg', args, { stdio: ['pipe', 'ignore', 'inherit'] });
  const frames = Math.round(FPS * DUR);
  for (let f = 0; f < frames; f++) {
    await page.evaluate((t) => window.render(t), f / FPS);
    const buf = await page.screenshot({ type: 'jpeg', quality: 95 });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
}
await browser.close();
