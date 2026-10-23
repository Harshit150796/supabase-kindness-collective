import { open, shot, html, log, BASE, OUT } from './lib.mjs';
import fs from 'node:fs';
const { browser, ctx, page, supa, errors } = await open();
// A neutral stand-in "photo" (grocery receipt graphic, no people) for the required cover photo.
const photo = `${OUT}/_scripts/stand-in-receipt.png`;
if (!fs.existsSync(photo)) {
  const p2 = await ctx.newPage();
  await p2.setViewportSize({ width: 1200, height: 900 });
  await p2.setContent(`<body style="margin:0;background:#e8f1e8;display:grid;place-items:center;height:900px;font-family:monospace"><div style="background:#fff;width:420px;padding:36px 32px;box-shadow:0 10px 30px #0002;transform:rotate(-4deg)"><div style="font-size:26px;font-weight:700;text-align:center">GROCERY RECEIPT</div><div style="border-top:2px dashed #999;margin:16px 0"></div>${['Milk 2.49','Bread 3.19','Eggs 4.29','Rice 5.99','Apples 3.80','Beans 1.29'].map(l=>{const [a,b]=l.split(' ');return `<div style="display:flex;justify-content:space-between;font-size:22px;margin:8px 0"><span>${a}</span><span>${b}</span></div>`}).join('')}<div style="border-top:2px dashed #999;margin:16px 0"></div><div style="display:flex;justify-content:space-between;font-size:24px;font-weight:700"><span>TOTAL</span><span>21.05</span></div></div></body>`);
  await p2.screenshot({ path: photo });
  await p2.close();
}
await page.goto(BASE + '/apply', { waitUntil: 'domcontentloaded' });
await page.waitForSelector('[data-who]');
await page.evaluate(() => { try { localStorage.setItem('ziploc:45402', JSON.stringify({ city: 'Dayton', stateCode: 'OH' })); } catch {} });
await page.waitForTimeout(2500);
await shot(page, 'apply-1');
await html(page, '[data-request-panel]', 'apply-panel-empty');
await page.click('[data-who="family"]'); await page.waitForTimeout(400);
await page.click('[data-need-tile="food"]'); await page.waitForTimeout(400);
await page.click('[data-need-tile="healthcare"]'); await page.waitForTimeout(800);
await page.evaluate(() => { const el = document.querySelector('#stores-heading'); el && window.scrollTo(0, window.scrollY + el.getBoundingClientRect().top - 120); });
await page.waitForTimeout(800);
const storeIds = await page.$$eval('[data-store-tile]', (els) => els.map((e) => e.getAttribute('data-store-tile')));
log('store tiles', storeIds);
for (const id of ['walmart', 'kroger', 'cvs']) { if (storeIds.includes(id)) { await page.click(`[data-store-tile="${id}"]`); await page.waitForTimeout(400); } }
await page.waitForTimeout(800);
await shot(page, 'apply-2');
await html(page, 'main', 'apply-2');
await html(page, '[data-request-panel]', 'apply-panel-step1');
await page.click('[data-apply-continue]');
await page.waitForTimeout(1500);
await shot(page, 'apply-3');
await page.fill('textarea[aria-label="Your story"]', 'We are a family of four. My hours were cut this spring, and after rent there is little left for groceries and prescriptions. Coupons at Walmart, Kroger and CVS would cover food and medicine for the next two months.');
await page.waitForTimeout(600);
const [chooser] = await Promise.all([page.waitForEvent('filechooser', { timeout: 5000 }).catch(() => null), page.getByRole('button', { name: /Choose photos or drop them here/ }).click()]);
if (chooser) await chooser.setFiles(photo);
else await page.setInputFiles('input[type=file][accept="image/*"]', photo);
await page.waitForTimeout(1500);
await shot(page, 'apply-4-crop');
// confirm crop dialog if present
const dlg = page.locator('[role="dialog"]');
if (await dlg.count()) {
  const btns = await dlg.locator('button').allInnerTexts();
  log('crop dialog buttons', btns);
  const use = dlg.getByRole('button', { name: /Use|Save|Done|Apply|Crop/i }).last();
  if (await use.count()) { await use.click(); await page.waitForTimeout(1500); }
}
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(600);
await shot(page, 'apply-4');
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(800);
await shot(page, 'apply-5');
await html(page, 'main', 'apply-5');
log('blocked?', await page.$eval('[data-apply-continue]', (b) => b.disabled));
await page.click('[data-apply-continue]');
await page.waitForTimeout(1500);
await page.click('#apply-goal');
await page.keyboard.type('500');
await page.fill('input[aria-label="ZIP code"]', '45402');
await page.waitForTimeout(2000);
await shot(page, 'apply-6');
await html(page, 'main', 'apply-6');
await html(page, '[data-request-panel]', 'apply-panel-step3');
await page.click('[data-apply-continue]');
await page.waitForTimeout(1800);
await shot(page, 'apply-7');
await html(page, '[role="dialog"]', 'apply-7');
log('DIALOG TEXT', await page.locator('[role="dialog"]').first().innerText().catch(() => 'none'));
log('supa', [...new Set(supa)]);
log('errors', errors.filter(e => !/ERR_FAILED|TUNNEL/.test(e)).slice(0, 20));
await browser.close();
