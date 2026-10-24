// LAYOUT REFERENCE ONLY. Shows how the three data-driven sections lay out when data exists, using
// obviously fake bracketed placeholders, served locally in place of the (blocked) Supabase responses.
// Every screenshot gets a burned-in "PLACEHOLDER DATA" watermark so it can never pass for real data.
// No HTML is saved from this pass on purpose.
import { chromium } from '/home/user/supabase-kindness-collective/brag-output/work/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import path from 'node:path';

const OUT = '/home/user/supabase-kindness-collective/brag-output-2026-10-23-201818/work/research/sections/layout-reference-PLACEHOLDER-DATA';
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';

const cats = ['food', 'utilities', 'health', 'food', 'education', 'food'];
const fundraisers = cats.map((c, i) => ({
  id: `00000000-0000-0000-0000-00000000000${i}`, title: `[Placeholder fundraiser title ${i + 1}]`, story: '[placeholder]', category: c,
  monthly_goal: 100, amount_raised: 0, donors_count: 0, unique_slug: `placeholder-${i}`, cover_photo_url: null, country: null, zip_code: null,
  status: 'active', created_at: new Date(Date.now() - i * 86400000).toISOString(), is_example: false, fundraiser_images: [],
}));
const cards = fundraisers.map((f) => ({ fundraiser_id: f.id, total_raised: 0, donations_count: 0, organizer_name: null, latest_donation_at: null }));
const voices = [1, 2, 3, 4].map((n) => ({
  id: `v${n}`, quote: `[Placeholder sentence one of published account ${n}.] [Placeholder sentence two of account ${n}.] [Placeholder sentence three of account ${n}.]`,
  name: `[Name ${n}]`, role_label: '[Role]', location: '[City, ST]', image_url: '', is_published: true, display_order: n,
}));
const stats = {
  donations_count: 1111, total_raised: 1111, coupons_created: 1111, coupons_claimed: 1111, coupons_received: 1111, coupons_pending: 1111,
  pending_value_total: 1111, coupons_used: 1111, issued_value_total: 1111, issued_value_month: 1111, used_month: 1111, allocated_total: 1111, active_fundraisers: 6,
  brands: ['Walmart', 'Target', 'Kroger', 'DoorDash', 'CVS', 'Starbucks'].map((name, i) => ({ name, total: 600 - i * 100 })),
};

const browser = await chromium.launch({ args: ['--disable-lcd-text'] });
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1, userAgent: UA, colorScheme: 'light' });
await ctx.addInitScript(() => { try { localStorage.setItem('cd_privacy_consent', JSON.stringify({ accepted: false, choice: 'essential', at: new Date().toISOString() })); } catch {} });
const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*', 'access-control-expose-headers': '*' };
await ctx.route(/supabase\.co/, (route) => {
  const req = route.request();
  const u = new globalThis.URL(req.url());
  if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
  const json = (body) => route.fulfill({ status: 200, headers: { ...cors, 'content-type': 'application/json' }, body: JSON.stringify(body) });
  if (u.pathname === '/rest/v1/fundraisers') return json(fundraisers);
  if (u.pathname === '/rest/v1/rpc/get_fundraiser_cards') return json(cards);
  if (u.pathname === '/rest/v1/cms_testimonials') return json(voices);
  if (u.pathname === '/rest/v1/rpc/get_landing_stats') return json(stats);
  if (u.pathname === '/rest/v1/rpc/get_recent_public_donations') return json([]);
  if (u.pathname === '/rest/v1/rpc/get_completed_fundraisers') return json([]);
  return route.abort();
});
const page = await ctx.newPage();
await page.goto('http://127.0.0.1:5173/?intro=0&time3d=night', { waitUntil: 'load', timeout: 90_000 });
await sleep(4000);
for (let y = 0; y < 13000; y += 360) { await page.evaluate((yy) => window.scrollTo(0, yy), y); await sleep(200); }
await sleep(5000);
await page.addStyleTag({ content: `nav[data-site-header]{visibility:hidden!important}.cursor-trail{display:none!important}
  body::after{content:"PLACEHOLDER DATA \\2014  LAYOUT REFERENCE ONLY \\2014  NOT REAL";position:fixed;left:50%;top:50%;transform:translate(-50%,-50%) rotate(-18deg);
  font:700 64px/1 Arial,sans-serif;color:rgba(220,0,0,.30);white-space:nowrap;pointer-events:none;z-index:2147483647;border:6px solid rgba(220,0,0,.30);padding:18px 30px}` });

const shots = [
  ['impact-stories-with-placeholder-cards', 'section[aria-labelledby="fundraisers-heading"]', 0],
  ['impact-stories-with-placeholder-cards-lower', 'section[aria-labelledby="fundraisers-heading"]', 900],
  ['testimonials-voices-with-placeholder-lines', 'section[data-voices]', -120],
  ['impact-dashboard-with-placeholder-numbers', 'section[aria-labelledby="impact-figures-heading"]', 0],
];
for (const [name, sel, off] of shots) {
  const el = await page.$(sel);
  if (!el) { console.log('missing', name); continue; }
  const top = await el.evaluate((n) => n.getBoundingClientRect().top + window.scrollY);
  await page.evaluate((t) => window.scrollTo(0, t), Math.max(0, Math.round(top + off)));
  await sleep(3500);
  await page.screenshot({ path: path.join(OUT, `${name}.png`) });
  console.log('shot', name);
}
fs.writeFileSync(path.join(OUT, 'README.txt'), 'LAYOUT REFERENCE ONLY. Every title, name, line and number in these images is a bracketed or artificial placeholder injected by scripts/capture-layout-reference.mjs in place of blocked Supabase responses. Not real data. Do not use on screen; use only to understand layout and motion, then re-render with real, verified data.\n');
await browser.close();
