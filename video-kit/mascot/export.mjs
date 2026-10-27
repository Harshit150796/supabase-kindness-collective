// Export Coupon's master art from the live module: coupon-tree.svg, coupon-tree.png (transparent, 680 x 820)
// and poses.png (the pose sheet). Needs the repo's dev server: npx vite --port 5173, then node video-kit/mascot/export.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '../../brag-output/work/node_modules/playwright/index.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const ORIGIN = process.env.ORIGIN || 'http://127.0.0.1:5173';
const browser = await chromium.launch({ args: ['--disable-lcd-text'] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1400 }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.log('pageerror', e.message));
await page.goto(`${ORIGIN}/video-kit/mascot/preview.html`, { waitUntil: 'load' });
await page.waitForFunction(() => window.ready === true);
fs.writeFileSync(path.join(here, 'coupon-tree.svg'), (await page.evaluate(() => window.masterSvg())) + '\n');
await (await page.$('#sheet')).screenshot({ path: path.join(here, 'poses.png') }); // the reference sheet keeps its paper background
// the master art is transparent: the page's own background (the app's CSS sets one) has to go too, not just the default white
await page.addStyleTag({ content: 'html,body,#solo{background:transparent !important}' });
await (await page.$('#solo')).screenshot({ path: path.join(here, 'coupon-tree.png'), omitBackground: true });
await browser.close();
console.log('wrote coupon-tree.svg, coupon-tree.png, poses.png');
