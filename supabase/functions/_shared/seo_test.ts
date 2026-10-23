import { assert, assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { NEEDS, ASKING_FAQ } from '../../../src/data/needs.ts';
import { GIVE_PAGES, GIVING_FAQ } from '../../../src/data/givePages.ts';
import { sitemapXml, lastmodDate } from './sitemap.ts';
import { INDEXNOW_KEY, indexNowBody, indexNowUrls } from './indexnow.ts';

const root = new URL('../../../', import.meta.url);
const read = (path: string) => Deno.readTextFileSync(new URL(path, root));

Deno.test('robots.txt has one group for every crawler, hides private pages and names both sitemaps', () => {
  const robots = read('public/robots.txt');
  const groups = robots.match(/^User-agent:.*$/gim) ?? [];
  // A crawler with its own group ignores the "*" rules, which is how Googlebot used to see /admin.
  assertEquals(groups, ['User-agent: *']);
  for (const path of ['/admin', '/dashboard', '/auth', '/settings', '/messages', '/fundraiser/', '/impact/']) {
    assert(robots.includes(`Disallow: ${path}\n`), path);
  }
  assert(!/Disallow: \/(f|help|donate|apply|stories)\b/.test(robots));
  assert(robots.includes('Sitemap: https://coupondonation.com/sitemap.xml'));
  assert(robots.includes('Sitemap: https://vbnbacowuoeeojjdrzzp.supabase.co/functions/v1/sitemap'));
});

Deno.test('the static sitemap lists every public landing page, each with a route, and nothing private', () => {
  const xml = read('public/sitemap.xml');
  const app = read('src/App.tsx');
  const locs = [...xml.matchAll(/<loc>https:\/\/coupondonation\.com([^<]*)<\/loc>/g)].map((m) => m[1]);
  for (const need of NEEDS) assert(locs.includes(`/help/${need.slug}`), need.slug);
  for (const page of GIVE_PAGES) assert(locs.includes(page.path), page.path);
  assert(locs.includes('/gofundme-alternative'));
  for (const path of ['/auth', '/blog', '/dashboard', '/settings']) assert(!locs.includes(path), path);
  for (const loc of locs) {
    if (loc === '/' || loc.startsWith('/help/')) continue;
    assert(app.includes(`path="${loc}"`), `no route for ${loc}`);
  }
  assertEquals(new Set(locs).size, locs.length);
});

Deno.test('the live sitemap keeps to our pages, escapes text and writes plain dates', () => {
  const xml = sitemapXml([
    { loc: 'https://coupondonation.com/f/help-feed-my-family', lastmod: '2026-10-20T13:00:00Z' },
    { loc: 'https://coupondonation.com/f/help-feed-my-family', lastmod: null },
    { loc: 'https://evil.example/f/x' },
    { loc: 'https://coupondonation.com/blog/a&b' },
  ]);
  assert(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
  assertEquals((xml.match(/<url>/g) ?? []).length, 2);
  assert(xml.includes('<lastmod>2026-10-20</lastmod>'));
  assert(xml.includes('/blog/a&amp;b'));
  assert(!xml.includes('evil.example'));
  assertEquals(lastmodDate('not a date'), null);
  const fn = read('supabase/functions/sitemap/index.ts');
  assert(fn.includes('.eq("is_example", false)') && fn.includes('.eq("status", "active")'));
  assert(read('supabase/config.toml').includes('[functions.sitemap]\nverify_jwt = false'));
});

Deno.test('IndexNow key file is published and pings only our own pages', () => {
  assertEquals(read(`public/${INDEXNOW_KEY}.txt`), INDEXNOW_KEY);
  assertEquals(indexNowUrls(['https://coupondonation.com/f/a', 'https://other.example/x', 'https://coupondonation.com/f/a']), ['https://coupondonation.com/f/a']);
  assertEquals(indexNowBody([]).keyLocation, `https://coupondonation.com/${INDEXNOW_KEY}.txt`);
  const fn = read('supabase/functions/indexnow/index.ts');
  assert(fn.includes('f.is_example') && fn.includes('2 * HOUR') && fn.includes('overLimit('));
  assert(read('src/pages/ApplyRecipient.tsx').includes('pingSearchEngines('));
  assert(read('src/pages/FundraiserEdit.tsx').includes('pingSearchEngines(slug)'));
});

Deno.test('the HTML shell has true defaults that pages replace, and no per-route canonical', () => {
  const html = read('index.html');
  assert(!/rel="canonical"/.test(html), 'a shared canonical would point every route at the homepage');
  assert(!/property="og:url"/.test(html));
  assert(/<meta name="description"[^>]*data-rh="true"/.test(html));
  assert(!/name="keywords"/.test(html));
  assert(!/js\.stripe\.com/.test(html));
  assert(html.includes('https://coupondonation.com/og-image.png'));
  assert(!/verified families|95%\s*efficiency|partners"|partnering/i.test(html.split('<body>')[0]));
});

Deno.test('help and giving pages carry search-sized titles, snippets and complete answers', () => {
  for (const page of [...NEEDS, ...GIVE_PAGES]) {
    assert(page.title.length <= 60, `title too long: ${page.title}`);
    assert(page.description.length <= 160, `description too long (${page.description.length}): ${page.title}`);
    assert(page.h1.length > 10 && page.lead.length > 60, page.title);
  }
  for (const item of [...NEEDS.flatMap((n) => n.faq), ...ASKING_FAQ, ...GIVE_PAGES.flatMap((g) => g.faq), ...GIVING_FAQ]) {
    assert(item.q.endsWith('?'), item.q);
    assert(item.a.length > 30, item.q);
  }
  for (const resource of NEEDS.flatMap((n) => n.resources)) {
    if (resource.url) assert(resource.url.startsWith('https://'), resource.url);
  }
  assertEquals(new Set(NEEDS.map((n) => n.title)).size, NEEDS.length);
  assertEquals(new Set([...NEEDS.map((n) => n.description), ...GIVE_PAGES.map((g) => g.description)]).size, NEEDS.length + GIVE_PAGES.length);
});

Deno.test('every landing page has a route, footer links reach the giving pages, and answers stay in the page', () => {
  const app = read('src/App.tsx');
  assert(app.includes('path="/help/:need"'));
  for (const page of GIVE_PAGES) assert(app.includes(`path="${page.path}"`), page.path);
  assert(app.includes('path="/gofundme-alternative"'));
  const footer = read('src/components/layout/Footer.tsx');
  for (const page of GIVE_PAGES) assert(footer.includes(`to="${page.path}"`), page.path);
  assert(footer.includes('to="/gofundme-alternative"'));
  assert(read('src/pages/FAQ.tsx').includes('AccordionContent forceMount'));
  assert(!read('src/components/seo/HelpSections.tsx').includes('Accordion'));
});

Deno.test('private and example pages stay out of search', () => {
  const app = read('src/App.tsx');
  for (const path of ['/auth', '/dashboard', '/settings', '/donation-success', '/fundraiser/:id', '*']) {
    assert(new RegExp(`path="${path.replace(/[*]/g, '\\*')}" element=\\{<Private `).test(app), path);
  }
  const fundraiser = read('src/pages/PublicFundraiser.tsx');
  assert(fundraiser.includes('noindex={!!fundraiser.is_example}'));
  assert(fundraiser.includes('title="Fundraiser not found"'));
  assert(read('src/components/stories/FundraiserCard.tsx').includes('Example campaign'));
});
