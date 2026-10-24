// (1) Stitched full-page homepage at 1920 wide (viewport-by-viewport, reveals settled per frame).
// (2) Deterministic frames of the "Give what people need." card deal (Web Animations seeked).
// Real state: all *.supabase.co requests aborted.
import { chromium } from '/home/user/supabase-kindness-collective/brag-output/work/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import path from 'node:path';

const OUT = '/home/user/supabase-kindness-collective/brag-output-2026-10-23-201818/work/research/sections';
const TILES = path.join(OUT, 'frames/full-page-tiles');
const DEAL = path.join(OUT, 'frames/what-we-do-card-deal');
fs.mkdirSync(TILES, { recursive: true }); fs.mkdirSync(DEAL, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';

const browser = await chromium.launch({ args: ['--disable-lcd-text'] });
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1, userAgent: UA, colorScheme: 'light', locale: 'en-US', timezoneId: 'America/New_York' });
await ctx.addInitScript(() => { try { localStorage.setItem('cd_privacy_consent', JSON.stringify({ accepted: false, choice: 'essential', at: new Date().toISOString() })); } catch {} });
await ctx.route(/supabase\.co/, (route) => route.abort());
const page = await ctx.newPage();
await page.goto('http://127.0.0.1:5173/?intro=0&time3d=night', { waitUntil: 'load', timeout: 90_000 });
await sleep(4000);
const scrollTo = (y) => page.evaluate((yy) => window.scrollTo(0, yy), y);

// Mount everything and let the fallbacks settle, as in capture.mjs.
for (let y = 0; y < 13000; y += 360) { await scrollTo(y); await sleep(200); }
await sleep(45_000);
await page.addStyleTag({ content: '.cursor-trail{display:none!important}[data-sonner-toaster]{display:none!important}' });

const TILES_ONLY = process.argv.includes('tiles-only');
if (!TILES_ONLY) {
// ---- (2) card deal frames first (needs the row to go below the viewport, then come back) ----
const list = await page.$('ol[data-giving-steps="deal"]');
const listTop = await list.evaluate((n) => n.getBoundingClientRect().top + window.scrollY);
await scrollTo(Math.round(listTop - 300)); await sleep(1200);   // visible (already dealt)
await scrollTo(0); await sleep(1500);                            // below viewport -> re-stacks
const stackedState = await list.getAttribute('data-deal');
await page.addStyleTag({ content: 'nav[data-site-header]{visibility:hidden!important}' });
const secTop = await list.evaluate((n) => n.closest('section').getBoundingClientRect().top + window.scrollY);
await scrollTo(Math.round(secTop));
let found = 0;
for (let i = 0; i < 80 && !found; i++) { await sleep(25); found = await list.evaluate((n) => n.getAnimations({ subtree: true }).length); }
console.log('stacked state before deal:', stackedState, 'animations:', found);
if (found) {
  await list.evaluate((n) => { window.__deal = n.getAnimations({ subtree: true }); window.__deal.forEach((a) => a.pause()); });
  const total = await list.evaluate(() => Math.max(...window.__deal.map((a) => a.effect.getComputedTiming().endTime)));
  console.log('deal total ms', total);
  let f = 0;
  for (let t = 0; t <= total; t += 100) {
    await list.evaluate((n, tt) => window.__deal.forEach((a) => { a.currentTime = tt; }), t);
    await sleep(80);
    await page.screenshot({ path: path.join(DEAL, `deal-${String(f++).padStart(3, '0')}-${String(t).padStart(4, '0')}ms.png`) });
  }
  await list.evaluate(() => window.__deal.forEach((a) => a.play()));
  await sleep(1000);
  fs.writeFileSync(path.join(DEAL, 'timing.json'), JSON.stringify({ frames: f, stepMs: 100, totalMs: total, source: 'src/lib/cardDealTiming.ts {hold:180,duration:750,stagger:500}; easing cubic-bezier(.2,.85,.25,1); WAAPI transform-only' }, null, 2));
}

}
// ---- (1) stitched full page ----
await page.addStyleTag({ content: 'nav[data-site-header]{visibility:visible!important}' });
await scrollTo(0); await sleep(2500);
const H = await page.evaluate(() => document.documentElement.scrollHeight);
const tiles = [];
for (let y = 0, i = 0; y < H; y += 1080, i++) {
  const yy = Math.min(y, H - 1080);
  if (i === 1) await page.addStyleTag({ content: 'nav[data-site-header]{visibility:hidden!important}' });
  await scrollTo(yy); await sleep(3200);
  const actual = await page.evaluate(() => window.scrollY);
  const file = path.join(TILES, `tile-${String(i).padStart(2, '0')}-y${actual}.png`);
  try { await page.screenshot({ path: file, timeout: 120_000 }); tiles.push({ file, y: actual }); }
  catch (e) { console.log('tile failed', i, yy, String(e.message).slice(0, 80)); tiles.push({ file: null, y: actual, failed: true }); }
}
fs.writeFileSync(path.join(TILES, 'tiles.json'), JSON.stringify({ height: H, tiles }, null, 2));
console.log('tiles', tiles.length, 'height', H);
await browser.close();
