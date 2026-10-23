import { open, shot, html, log, BASE, OUT } from './lib.mjs';
const { browser, page, ctx, errors } = await open();
if (ctx.routeWebSocket) await ctx.routeWebSocket(/supabase\.co/, (ws) => ws.close());
// No WebGL in this capture (software GL cannot draw the tree in time): the site shows its designed
// HeroBackdrop fallback (the tree's own sky and ground). Live-tree footage must come from a GPU capture.
await ctx.addInitScript(() => {
  const orig = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, ...rest) { if (/webgl/i.test(String(type))) return null; return orig.call(this, type, ...rest); };
});
await page.goto(BASE + '/?intro=0&time3d=night', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(7000);
log('state', await page.evaluate(() => ({ sky: document.documentElement.dataset.sky, backdrop: !!document.querySelector('[data-hero-backdrop], .hero-backdrop'), play: document.querySelector('[data-play]') ? 'yes' : 'no' })));
await page.mouse.move(960, 700);
await shot(page, 'home-1');
await html(page, '[data-site-header]', 'home-header-night');
await page.waitForTimeout(3100);
await shot(page, 'home-1b'); // next rotating word
// Talk to Coupon entry
const launcher = page.getByRole('button', { name: 'Talk to Coupon, the AI tree' });
log('launcher', await launcher.count());
await launcher.click();
await page.waitForTimeout(1500);
await shot(page, 'chat-1');
const chatSel = 'div:has(> div > div > div > [aria-label="Close chat"])';
log('chat text', await page.locator('[aria-label="Close chat"]').locator('xpath=ancestor::div[contains(@class,"rounded-2xl")][1]').innerText().catch(() => 'n/a'));
const chatHtml = await page.locator('[aria-label="Close chat"]').locator('xpath=ancestor::div[contains(@class,"rounded-2xl")][1]').evaluate((el) => el.outerHTML).catch(() => null);
if (chatHtml) { (await import('node:fs')).writeFileSync(`${OUT}/chat-1.html`, '<!-- Talk to Coupon panel, scripts stripped -->\n' + chatHtml); log('html chat-1'); }
await page.getByRole('button', { name: 'Close chat' }).click();
await page.waitForTimeout(800);
// Day sky
await page.goto(BASE + '/?intro=0&time3d=day', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(7000);
await page.mouse.move(960, 700);
await shot(page, 'home-2');
log('errors', errors.filter(e => !/ERR_FAILED|TUNNEL|WebSocket/.test(e)).slice(0, 10));
await browser.close();
