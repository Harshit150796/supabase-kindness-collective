import { open, shot, html, log, BASE, OUT } from './lib.mjs';
import { signIn, USER } from './session.mjs';
import fs from 'node:fs';
const photo = `${OUT}/_scripts/stand-in-receipt.png`;
const png = fs.readFileSync(photo);
const { browser, ctx, page, supa, errors } = await open({
  stub: async (route, req) => {
    const u = req.url();
    if (/\/auth\/v1\/user/.test(u)) { await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(USER) }); return true; }
    if (/\/storage\/v1\/object\/public\//.test(u)) { await route.fulfill({ status: 200, contentType: 'image/png', body: png }); return true; }
    if (/\/storage\/v1\/object\//.test(u) && req.method() === 'POST') { await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ Key: 'x', Id: 'x' }) }); return true; }
    if (/\/rest\/v1\//.test(u) && req.method() === 'GET') { await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }); return true; }
    return false;
  },
});
await signIn(ctx);
const HIDE = '.cursor-trail{display:none!important} header a[href="/profile"]{visibility:hidden!important}';
const snap = async (name) => { await page.screenshot({ path: `${OUT}/${name}.png`, style: HIDE }); log('shot', name); };
await page.goto(BASE + '/apply', { waitUntil: 'domcontentloaded' });
await page.evaluate(() => { try { localStorage.setItem('ziploc:45402', JSON.stringify({ city: 'Dayton', stateCode: 'OH' })); } catch {} });
await page.waitForSelector('[data-who]');
await page.waitForTimeout(2500);
await page.click('[data-who="family"]'); await page.waitForTimeout(300);
await page.click('[data-need-tile="food"]'); await page.waitForTimeout(300);
await page.click('[data-need-tile="healthcare"]'); await page.waitForTimeout(600);
for (const id of ['walmart', 'kroger', 'cvs']) { await page.click(`[data-store-tile="${id}"]`); await page.waitForTimeout(300); }
await page.click('[data-apply-continue]'); await page.waitForTimeout(1200);
await page.fill('textarea[aria-label="Your story"]', 'We are a family of four. My hours were cut this spring, and after rent there is little left for groceries and prescriptions. Coupons at Walmart, Kroger and CVS would cover food and medicine for the next two months.');
const [chooser] = await Promise.all([page.waitForEvent('filechooser', { timeout: 5000 }).catch(() => null), page.getByRole('button', { name: /Choose photos or drop them here/ }).click()]);
if (chooser) await chooser.setFiles(photo);
await page.waitForTimeout(1500);
const dlg = page.locator('[role="dialog"]');
if (await dlg.count()) { await dlg.getByRole('button', { name: /Use this photo/ }).click(); }
await page.waitForTimeout(3000);
log('blocked reason', await page.evaluate(() => document.querySelector('[data-apply-continue]').disabled));
await page.click('[data-apply-continue]'); await page.waitForTimeout(1200);
await page.click('#apply-goal'); await page.keyboard.type('500');
await page.fill('input[aria-label="ZIP code"]', '45402');
await page.waitForTimeout(1500);
await page.click('[data-apply-continue]'); await page.waitForTimeout(1800);
await snap('apply-8');
// Title ideas
const ideas = page.getByRole('button', { name: /Title ideas/ });
if (await ideas.count()) { await ideas.click(); await page.waitForTimeout(700); }
await snap('apply-9');
const sugg = await page.$$eval('[aria-pressed]', (els) => els.map((e) => e.innerText).filter(Boolean));
log('suggestions', sugg);
// choose the first idea
const firstIdea = page.locator('section[aria-label="Title"] button[aria-pressed]').first();
if (await firstIdea.count()) { await firstIdea.click(); await page.waitForTimeout(600); }
await page.click('[data-apply-confirm] input'); await page.waitForTimeout(500);
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await page.waitForTimeout(900);
await snap('apply-10');
await html(page, 'main', 'apply-10');
await html(page, '[data-request-panel]', 'apply-panel-review');
log('REVIEW TEXT', await page.locator('main').innerText());
log('supa', [...new Set(supa)].slice(0, 30));
log('errors', errors.filter(e => !/ERR_FAILED|TUNNEL/.test(e)).slice(0, 20));
await browser.close();
