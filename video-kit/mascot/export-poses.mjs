// Export Coupon's poses as transparent PNGs (680 x 820): poses/coupon-<name>.png.
// Needs the repo's dev server: npx vite --port 5173, then node video-kit/mascot/export-poses.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const ORIGIN = process.env.ORIGIN || 'http://127.0.0.1:5173';
const POSES = {
  wave: { armL: 40, armR: 132, gaze: [0, 0.1], smile: 1 },
  cheer: { armL: 150, armR: 150, mouth: 0.7, brows: 0.4, gaze: [0, 0.05] },
  point: { armL: 128, armR: 40, mouth: 0.35, brows: 0.4, gaze: [-0.6, 0.1] },
  rest: { armL: 40, armR: 40, gaze: [0, 0.1], smile: 1 },
};
fs.mkdirSync(path.join(here, 'poses'), { recursive: true });
const browser = await chromium.launch({ args: ['--disable-lcd-text'] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1400 }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.log('pageerror', e.message));
await page.goto(`${ORIGIN}/video-kit/mascot/preview.html`, { waitUntil: 'load' });
await page.waitForFunction(() => window.ready === true);
await page.addStyleTag({ content: 'html,body,#solo{background:transparent !important}' });
for (const [name, pose] of Object.entries(POSES)) {
  await page.evaluate((p) => window.setSolo(p), pose);
  await (await page.$('#solo')).screenshot({ path: path.join(here, 'poses', `coupon-${name}.png`), omitBackground: true });
  console.log('wrote poses/coupon-' + name + '.png');
}
await browser.close();
