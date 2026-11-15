// Capture the real coupondonation.com screens at phone width (390 x 844 CSS px, 3x) from the repo's own dev server.
// Output: captures/mobile/*.png (full-page screenshots per state) and captures/mobile/boxes.json (element boxes in CSS px).
//   npx vite --port 5173   (in another shell), then   node capture-mobile.mjs
// The backend is blocked here, so only what the app renders locally appears (retailer catalogue, copy, layout); no live numbers.
import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
import fs from 'node:fs';

const ORIGIN = process.env.ORIGIN || 'http://127.0.0.1:5173';
const OUT = new URL('./captures/mobile/', import.meta.url).pathname;
fs.mkdirSync(OUT, { recursive: true });
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const browser = await chromium.launch({ args: ['--disable-lcd-text'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 1400 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: UA });
await ctx.route(/supabase\.co/, (r) => r.abort());
await ctx.addInitScript(() => localStorage.setItem('cd_privacy_consent', JSON.stringify({ accepted: true, at: new Date().toISOString() })));
const page = await ctx.newPage();
page.on('pageerror', (e) => console.log('pageerror', e.message.slice(0, 120)));
const boxes = {};
const settle = (ms = 700) => page.waitForTimeout(ms);
// keep the page free of floating widgets, banners and the fixed header, which would overlap element shots
const hideFloaters = () => page.evaluate(() => {
  const card = document.querySelector('[data-donate-card]');
  [...document.querySelectorAll('*')].forEach((e) => {
    const p = getComputedStyle(e).position;
    const outsideCard = !card || (!card.contains(e) && !e.contains(card));
    if (p === 'fixed' || (p === 'sticky' && outsideCard)) e.style.setProperty('display', 'none', 'important');
  });
});

// ---- donate flow: the card only, at each state, plus element boxes relative to the card (CSS px)
await page.goto(`${ORIGIN}/donate`, { waitUntil: 'domcontentloaded' });
await settle(2500);
await page.getByRole('button', { name: 'Okay' }).click({ timeout: 2000 }).catch(() => {});
await hideFloaters();
const card = () => page.locator('[data-donate-card]').first();
const cshot = async (name) => { await settle(); await hideFloaters(); await card().screenshot({ path: `${OUT}${name}.png` }); console.log('shot', name); };
const cbox = async (key, loc) => {
  const cb = await card().boundingBox(), b = await loc.first().boundingBox();
  if (cb && b) boxes[key] = { x: b.x - cb.x, y: b.y - cb.y, w: b.width, h: b.height };
  else console.log('no box for', key);
};
const tile = (n) => page.locator(`[data-retailer-tile="${n}"]`).first();
await cshot('donate-1-empty');
for (const [i, n] of ['walmart', 'doordash'].entries()) {
  await cbox(`tile-${n}`, tile(n));
  await tile(n).click(); await settle(400);
  await cshot(`donate-1-chosen-${i + 1}`);
}
await cbox('continue', page.getByRole('button', { name: /Choose amount/ }));
await page.getByRole('button', { name: /Choose amount/ }).first().click();
await settle(900);
await cshot('donate-2-amount');
const chip50 = page.locator('button', { hasText: /^\$50$/ }).first();
await cbox('chip-50', chip50);
await chip50.click();
await settle(900);
await cshot('donate-2-fifty');
await cbox('review-btn', page.getByRole('button', { name: /Review gift/ }));
await cbox('ledger', page.locator('[data-ledger-panel]'));
await cbox('shared-list', page.locator('[data-gift-ledger]'));
await cbox('chips-row', chip50.locator('xpath=..'));
await page.getByRole('button', { name: /Review gift/ }).first().click();
await settle(1000);
await cshot('donate-3-review');
await cbox('pay-btn', page.locator('button', { hasText: /^Donate \$/ }));
await cbox('charge-summary', page.locator('[data-charge-summary]'));
await cbox('cover-fee', page.locator('[data-cover-fee]'));
await cbox('email-line', page.getByText(/We email you as your coupons are given out and used/));
await cbox('square-line', page.getByText(/You finish on Square/));
await cbox('card-methods', page.getByText(/Card, Apple Pay or Google Pay/));
await cbox('tip', page.locator('[data-tip-picker]'));
await cbox('review-title', page.getByRole('heading', { name: /Review and donate/ }));
await cbox('lock-line', page.getByText(/Your receipt lists the gift, tip and fee separately/));
await cbox('monthly', page.getByText(/give .* every month/));
boxes.card = await card().boundingBox();

// ---- homepage: the follow-the-money journey and the "Give what people need" cards, at phone width
await page.goto(`${ORIGIN}/`, { waitUntil: 'domcontentloaded' });
await settle(3500);
for (let y = 0; y < 14000; y += 500) { await page.mouse.wheel(0, 500); await page.waitForTimeout(250); if (await page.locator('[data-journey-line]').count()) break; }
await settle(1500);
const journeySel = page.locator('section:has([data-journey-line]), div:has(> [data-journey-line])').first();
await page.locator('[data-journey-line]').first().scrollIntoViewIfNeeded().catch(() => {});
await settle(2000);
await hideFloaters();
const jl = page.locator('[data-journey-line]').first();
const jwrap = jl.locator('xpath=..');
const jb = await jwrap.boundingBox();
// full-width band around the journey, so the step icons are not clipped at the page margin
await page.screenshot({ path: `${OUT}home-journey.png`, clip: { x: 0, y: Math.max(0, jb.y - 24), width: 390, height: jb.height + 48 } });
console.log('shot home-journey');
boxes.journey = { x: 0, y: 24, w: 390, h: jb.height };
for (let y = 0; y < 3000; y += 400) { await page.mouse.wheel(0, -400); await page.waitForTimeout(150); }
const deal = page.locator('[data-deal-card], .giving-deal').first();
await deal.scrollIntoViewIfNeeded().catch(() => {});
await settle(2000);
await hideFloaters();
const dealWrap = page.locator('section:has(.giving-deal)').first();
await dealWrap.screenshot({ path: `${OUT}home-give.png` }).catch((e) => console.log('give shot failed', e.message.slice(0, 120)));
console.log('shot home-give');
fs.writeFileSync(`${OUT}boxes.json`, JSON.stringify(boxes, null, 2));
console.log(JSON.stringify(boxes));
await browser.close();
