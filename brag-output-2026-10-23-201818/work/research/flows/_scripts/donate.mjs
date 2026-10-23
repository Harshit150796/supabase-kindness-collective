import { open, shot, html, log, BASE, dumpCss } from './lib.mjs';
const { browser, page, supa, errors } = await open();
await page.goto(BASE + '/donate', { waitUntil: 'domcontentloaded' });
await page.waitForSelector('[data-donate-card]');
await page.waitForTimeout(3500);
await dumpCss(page, 'site');
await shot(page, 'donate-1');
const card = page.locator('[data-donate-card]');
const scrollCard = async (offset = 0) => {
  await page.evaluate((offset) => { const el = document.querySelector('[data-donate-card]'); const r = el.getBoundingClientRect(); window.scrollTo(0, window.scrollY + r.top - 40 + offset); }, offset);
  await page.waitForTimeout(900);
};
await scrollCard();
await shot(page, 'donate-2');
await html(page, '[data-donate-card]', 'donate-2');
for (const id of ['walmart', 'target', 'doordash']) { await page.click(`[data-retailer-tile="${id}"]`); await page.waitForTimeout(450); }
await page.waitForTimeout(700);
await shot(page, 'donate-3');
await html(page, '[data-donate-card]', 'donate-3');
// Browse all modal
await page.getByRole('button', { name: /Browse all/ }).click();
await page.waitForTimeout(1200);
await shot(page, 'donate-4');
await html(page, '[role="dialog"]', 'donate-4');
await page.keyboard.press('Escape');
await page.waitForTimeout(700);
// Step 2
await page.click('[data-donate-continue]');
await page.waitForTimeout(1200);
await shot(page, 'donate-5'); // amount step, nothing chosen, $10/$25 disabled
await html(page, '[data-donate-card]', 'donate-5');
await page.click('[data-amount-choice="50"]');
await page.waitForTimeout(1600);
await scrollCard();
await shot(page, 'donate-6'); // ledger open, evenly
await html(page, '[data-donate-card]', 'donate-6');
await page.getByRole('radio', { name: "I'll choose" }).click();
await page.waitForTimeout(700);
await page.getByRole('button', { name: /more for Walmart/ }).click();
await page.waitForTimeout(350);
await page.getByRole('button', { name: /more for Walmart/ }).click();
await page.waitForTimeout(350);
await page.getByRole('button', { name: /more for Walmart/ }).click();
await page.waitForTimeout(1200);
await shot(page, 'donate-7'); // custom split
await html(page, '[data-donate-card]', 'donate-7');
const box = await card.boundingBox(); log('card box step2', box);
// Step 3 review
await page.click('[data-donate-continue]');
await page.waitForTimeout(1800);
await scrollCard();
await shot(page, 'donate-8');
const box3 = await card.boundingBox(); log('card box step3', box3);
await html(page, '[data-donate-card]', 'donate-8');
await html(page, '[data-gift-ledger]', 'donate-ledger');
// lower part: charge summary, monthly, donate button
await page.evaluate(() => { const el = document.querySelector('[data-charge-summary]'); const r = el.getBoundingClientRect(); window.scrollTo(0, window.scrollY + r.top - 300); });
await page.waitForTimeout(900);
await shot(page, 'donate-9');
await page.click('[data-monthly] input');
await page.waitForTimeout(900);
await shot(page, 'donate-10');
await html(page, '[data-donate-card]', 'donate-10');
const texts = await page.evaluate(() => document.querySelector('[data-donate-card]').innerText);
log('REVIEW TEXT\n', texts);
log('supa', [...new Set(supa)]);
log('errors', errors.filter(e => !/ERR_FAILED|TUNNEL/.test(e)).slice(0, 20));
await browser.close();
