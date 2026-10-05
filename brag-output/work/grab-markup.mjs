import { chromium } from 'playwright';
import fs from 'node:fs';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
await ctx.route(/supabase\.co/, (r) => r.abort());
await ctx.addInitScript(() => localStorage.setItem('cd_privacy_consent', JSON.stringify({ accepted: true, at: new Date().toISOString() })));
const page = await ctx.newPage();
const grabCard = (text, minW, maxW) => page.evaluate(([text, minW, maxW]) => {
  const el = [...document.querySelectorAll('h1,h2,h3,h4,p,span,div')].find(e => e.childElementCount === 0 && e.textContent.trim() === text);
  let n = el; while (n && !(n.getBoundingClientRect().width >= minW && n.getBoundingClientRect().width <= maxW)) n = n.parentElement;
  return n ? n.outerHTML : 'NOTFOUND';
}, [text, minW, maxW]);
await page.goto('http://127.0.0.1:5173/donate', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3000);
fs.writeFileSync('markup/donate-hero.html', await page.evaluate(() => { const h = [...document.querySelectorAll('h1,h2')].find(e => e.textContent.includes('Choose where')); return h.parentElement.outerHTML; }));
fs.writeFileSync('markup/donate-card-0.html', await grabCard('Select Available Retailers', 700, 800));
for (const b of ['Walmart', 'Target', 'Amazon']) { await page.getByText(b, { exact: true }).first().click(); await page.waitForTimeout(300); }
fs.writeFileSync('markup/donate-card-3.html', await grabCard('Select Available Retailers', 700, 800));
await page.getByRole('button', { name: /continue/i }).first().click(); await page.waitForTimeout(600);
await page.getByRole('button', { name: /continue/i }).first().click(); await page.waitForTimeout(800);
fs.writeFileSync('markup/donate-impact.html', await grabCard('Your Impact', 700, 800));
await page.goto('http://127.0.0.1:5173/apply', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3000);
fs.writeFileSync('markup/apply-page.html', await page.evaluate(() => document.querySelector('#root').innerHTML));
await page.getByText('My Family', { exact: true }).click(); await page.waitForTimeout(300);
await page.getByText('Food & Groceries', { exact: true }).click(); await page.waitForTimeout(400);
fs.writeFileSync('markup/apply-page-selected.html', await page.evaluate(() => document.querySelector('#root').innerHTML));
await page.screenshot({ path: 'shots/apply-selected.png' });
await browser.close();
