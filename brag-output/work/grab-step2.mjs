import { chromium } from 'playwright';
import fs from 'node:fs';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
await ctx.route(/supabase\.co/, (r) => r.abort());
await ctx.addInitScript(() => localStorage.setItem('cd_privacy_consent', JSON.stringify({ accepted: true, at: new Date().toISOString() })));
const page = await ctx.newPage();
await page.goto('http://127.0.0.1:5173/donate', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3000);
for (const b of ['Walmart', 'Target', 'Amazon']) { await page.getByText(b, { exact: true }).first().click(); await page.waitForTimeout(250); }
await page.getByRole('button', { name: /continue/i }).first().click(); await page.waitForTimeout(700);
const html = await page.evaluate(() => {
  const el = [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === '$50');
  let n = el; while (n && !(n.getBoundingClientRect().width > 700 && n.getBoundingClientRect().width < 800)) n = n.parentElement;
  return n.outerHTML;
});
fs.writeFileSync('markup/donate-step2.frag', html);
await page.screenshot({ path: 'shots/donate-step2-full.png', fullPage: true });
await browser.close();
