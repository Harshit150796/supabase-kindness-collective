import { chromium } from 'playwright';
import fs from 'node:fs';
const DRACO = '/home/user/supabase-kindness-collective/node_modules/three/examples/jsm/libs/draco/gltf/';
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36' });
await ctx.route('https://www.gstatic.com/draco/**', async (route) => {
  const f = route.request().url().split('/').pop();
  const body = fs.readFileSync(DRACO + f);
  await route.fulfill({ body, contentType: f.endsWith('.wasm') ? 'application/wasm' : 'text/javascript', headers: { 'access-control-allow-origin': '*' } });
});
await ctx.route(/supabase\.co/, (r) => r.abort());
const page = await ctx.newPage();
await page.goto('http://127.0.0.1:5173/?treeqa=1', { waitUntil: 'domcontentloaded' });
for (const s of [8, 16]) {
  await page.waitForTimeout(8000);
  await page.screenshot({ path: `shots/tree-${s}.png` });
  console.log('shot', s);
}
await browser.close();
