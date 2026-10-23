import { chromium } from '/home/user/supabase-kindness-collective/brag-output/work/node_modules/playwright/index.mjs';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ args: ['--disable-lcd-text'] });
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', colorScheme: 'light' });
await ctx.addInitScript(() => { try { localStorage.setItem('cd_privacy_consent', JSON.stringify({ accepted: false, choice: 'essential', at: new Date().toISOString() })); } catch {} });
const t0 = Date.now();
await ctx.route(/supabase\.co/, (route) => { console.log(((Date.now()-t0)/1000).toFixed(1), 'abort', route.request().url().slice(0,110)); return route.abort(); });
const page = await ctx.newPage();
page.on('console', (m) => { if (m.text().includes('fundraisers')) console.log(((Date.now()-t0)/1000).toFixed(1), 'console', m.text().slice(0, 80)); });
await page.goto('http://127.0.0.1:5173/?intro=0&time3d=night', { waitUntil: 'load' });
await sleep(3000);
await page.evaluate(() => window.scrollTo(0, 2300));
for (let i = 0; i < 16; i++) {
  await sleep(2500);
  const s = await page.evaluate(() => { const sec = document.querySelector('section[aria-labelledby="fundraisers-heading"]'); return sec ? (sec.querySelector('[role=status] h3')?.textContent ?? (sec.querySelector('.animate-pulse') ? 'skeleton' : 'other')) : 'none'; });
  const vis = await page.evaluate(() => document.visibilityState + ' focus=' + document.hasFocus());
  console.log(((Date.now()-t0)/1000).toFixed(1), s, vis);
}
await browser.close();
