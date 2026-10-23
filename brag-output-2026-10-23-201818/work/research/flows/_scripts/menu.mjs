import { open, shot, html, log, BASE, OUT } from './lib.mjs';
const { browser, page, ctx, errors } = await open();
if (ctx.routeWebSocket) await ctx.routeWebSocket(/supabase\.co/, (ws) => ws.close());
await page.goto(BASE + '/how-it-works', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3500);
await shot(page, 'header-2');
await html(page, '[data-site-header]', 'header-2');
const btn = page.locator('[data-site-header] button[aria-label^="Open menu"]').first();
log('menu button count', await btn.count());
await btn.click();
await page.waitForTimeout(200);
await shot(page, 'menu-1'); // sheet growing from the Menu button
await page.waitForTimeout(250);
await shot(page, 'menu-1b');
await page.waitForTimeout(1600);
await shot(page, 'menu-2'); // open, settled
await html(page, '#site-menu', 'menu-2');
log('MENU TEXT', await page.locator('#site-menu').innerText());
await page.keyboard.press('Escape');
await page.waitForTimeout(1500);
log('errors', errors.filter(e => !/ERR_FAILED|TUNNEL|WebSocket/.test(e)).slice(0, 10));
await browser.close();
