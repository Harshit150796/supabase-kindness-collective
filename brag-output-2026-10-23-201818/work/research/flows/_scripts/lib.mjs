import { chromium } from '/home/user/supabase-kindness-collective/brag-output/work/node_modules/playwright/index.mjs';
import fs from 'node:fs';
export const OUT = '/home/user/supabase-kindness-collective/brag-output-2026-10-23-201818/work/research/flows';
export const BASE = 'http://127.0.0.1:5173';
export const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';
export const log = (...a) => console.log(...a);

/** stub: optional fn(route, request) returning true if handled; otherwise supabase requests are aborted. */
export async function open({ stub, width = 1920, height = 1080, reducedMotion } = {}) {
  const browser = await chromium.launch({ args: ['--disable-lcd-text'] });
  const ctx = await browser.newContext({ viewport: { width, height }, userAgent: UA, deviceScaleFactor: 1, reducedMotion, locale: 'en-US', timezoneId: 'America/New_York' });
  const supa = [];
  await ctx.route(/supabase\.co/, async (route) => {
    const req = route.request();
    supa.push(req.method() + ' ' + req.url().replace(/^https:\/\/[^/]+/, ''));
    if (stub && (await stub(route, req))) return;
    return route.abort();
  });
  // Block third-party analytics etc. that won't resolve anyway
  await ctx.route(/(googletagmanager|google-analytics|accounts\.google\.com|gstatic\.com\/recaptcha)/, (r) => r.abort());
  await ctx.addInitScript(() => { try { localStorage.setItem('cd_privacy_consent', JSON.stringify({ accepted: false, choice: 'essential', at: new Date().toISOString() })); } catch {} });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror ' + e.message.slice(0, 200)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console ' + m.text().slice(0, 200)); });
  return { browser, ctx, page, supa, errors };
}

export async function shot(page, name) {
  await page.screenshot({ path: `${OUT}/${name}.png`, style: '.cursor-trail{display:none!important}' });
  log('shot', name);
}

/** Save outerHTML of a selector, scripts stripped, with absolute asset URLs. */
export async function html(page, selector, name) {
  const h = await page.evaluate(({ selector, base }) => {
    const el = document.querySelector(selector);
    if (!el) return null;
    const clone = el.cloneNode(true);
    clone.querySelectorAll('script').forEach((s) => s.remove());
    clone.querySelectorAll('[src]').forEach((n) => { const v = n.getAttribute('src'); if (v && v.startsWith('/')) n.setAttribute('src', base + v); });
    clone.querySelectorAll('[href]').forEach((n) => { const v = n.getAttribute('href'); if (v && v.startsWith('/')) n.setAttribute('href', base + v); });
    clone.querySelectorAll('*').forEach((n) => { for (const a of [...n.attributes]) if (/^on/i.test(a.name)) n.removeAttribute(a.name); });
    return clone.outerHTML;
  }, { selector, base: 'http://127.0.0.1:5173' });
  if (!h) { log('NO ELEMENT for', selector, name); return false; }
  fs.writeFileSync(`${OUT}/${name}.html`, `<!-- source: ${selector} on live dev server; scripts stripped; uses site CSS (load ${'http://127.0.0.1:5173'} styles to re-render) -->\n` + h);
  log('html', name, h.length);
  return true;
}

/** Dump every readable CSS rule on the page into one file (for re-rendering saved HTML). */
export async function dumpCss(page, name = 'site') {
  const css = await page.evaluate(() => [...document.styleSheets].map((s) => { try { return [...s.cssRules].map((r) => r.cssText).join('\n'); } catch { return s.href ? `@import url("${s.href}");` : ''; } }).join('\n'));
  fs.writeFileSync(`${OUT}/${name}.css`, css.replace(/url\((['"]?)\//g, 'url($1http://127.0.0.1:5173/'));
  log('css', name, css.length);
}
