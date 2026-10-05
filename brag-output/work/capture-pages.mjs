import { chromium } from 'playwright';
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36' });
const page = await ctx.newPage();
page.on('pageerror', e => console.log('pageerror', e.message.slice(0, 160)));
for (const [name, url, wait] of [['home', '/?treeqa=1', 9000], ['donate', '/donate', 4000], ['apply', '/apply', 4000], ['how', '/how-it-works', 4000]]) {
  await page.goto('http://127.0.0.1:5173' + url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(wait);
  await page.screenshot({ path: `shots/${name}.png` });
  console.log('shot', name);
}
await browser.close();
