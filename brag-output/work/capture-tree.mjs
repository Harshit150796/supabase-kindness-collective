// Deterministic capture of the real homepage 3D tree (Tree3DScene) under Playwright's fake clock.
import { chromium } from 'playwright';
import fs from 'node:fs';
const N = Number(process.argv[2] || 10);
const OUT = process.argv[3] || 'tree';
const DRACO = '/home/user/supabase-kindness-collective/node_modules/three/examples/jsm/libs/draco/gltf/';
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: 2304, height: 1296 }, userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36' });
await ctx.route('https://www.gstatic.com/draco/**', async (route) => {
  const f = route.request().url().split('/').pop();
  await route.fulfill({ body: fs.readFileSync(DRACO + f), contentType: f.endsWith('.wasm') ? 'application/wasm' : 'text/javascript', headers: { 'access-control-allow-origin': '*' } });
});
await ctx.route(/supabase\.co/, (r) => r.abort());
await ctx.addInitScript(() => {
  localStorage.setItem('cd_privacy_consent', JSON.stringify({ accepted: true, at: new Date().toISOString() }));
  const css = `
    nav, header, [class*="fixed"] { display: none !important; }
    main > section:first-child { height: 100vh !important; }
    main > section:first-child > div.pointer-events-none { display: none !important; }
    main > section:not(:first-child), footer { display: none !important; }
    html, body { overflow: hidden !important; }
    canvas ~ * { display: none !important; }
  `;
  document.addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s); });
});
const page = await ctx.newPage();
await page.clock.install();
await page.clock.pauseAt(Date.now() + 500);
await page.goto('http://127.0.0.1:5173/?treeqa=1', { waitUntil: 'commit' });
console.log('loaded');
// let assets load in real time while the fake clock flows; wait until the tree is actually painted
let ready = false;
for (let i = 0; i < 40 && !ready; i++) {
  await page.waitForTimeout(1500);
  await page.clock.runFor(67);
  const buf = await page.screenshot({ type: 'jpeg', quality: 60, clip: { x: 852, y: 300, width: 600, height: 500 } });
  ready = buf.length > 60000;
  console.log('probe', i, buf.length);
}
await page.waitForTimeout(1000);
await page.clock.runFor(200);
await page.evaluate(() => window.scrollTo(0, 0));
const cx = 1152, cy = 744;
await page.mouse.move(cx, cy);
await page.mouse.down();
const t0 = Date.now();
let x = cx;
for (let i = 0; i < N; i++) {
  const p = i / Math.max(1, N - 1);
  // ease the drag speed in/out so the orbit starts and settles smoothly
  const speed = 1.25 * Math.sin(Math.PI * Math.min(1, p * 1.0)) + 0.25;
  x -= speed;
  await page.mouse.move(x, cy);
  if (i % 2 === 0 && p < 0.75) await page.mouse.wheel(0, -3);
  await page.clock.runFor(1000 / 30);
  await page.screenshot({ path: `${OUT}/f${String(i).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 95 });
}
console.log('frames', N, 'ms/frame', ((Date.now() - t0) / N).toFixed(0));
await browser.close();
