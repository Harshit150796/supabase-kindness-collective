// Public preview page for link crawlers: og/twitter tags, then redirects people to coupondonation.com/f/:slug.
// Not used as a share URL until it is served from a coupondonation.com address (see roadmap Phase 4).
import { createClient } from 'npm:@supabase/supabase-js@2';

const SITE = 'https://coupondonation.com';
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

Deno.serve(async (req) => {
  const slug = (new URL(req.url).searchParams.get('slug') ?? '').replace(/[^a-z0-9-]/gi, '').slice(0, 120);
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!);
  const { data: f } = slug ? await admin.from('fundraisers').select('title, story, cover_photo_url, status').eq('unique_slug', slug).maybeSingle() : { data: null };
  const url = f ? `${SITE}/f/${slug}` : SITE;
  const title = f ? `${f.title} — CouponDonation` : 'CouponDonation';
  const desc = f ? f.story.replace(/\s+/g, ' ').slice(0, 180) : 'Donations that become coupons at real retailers.';
  const img = f?.cover_photo_url ?? `${SITE}/favicon-512.png`;
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
<link rel="canonical" href="${esc(url)}"><meta name="description" content="${esc(desc)}">
<meta property="og:type" content="website"><meta property="og:url" content="${esc(url)}"><meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}"><meta property="og:image" content="${esc(img)}"><meta property="og:site_name" content="CouponDonation">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc)}"><meta name="twitter:image" content="${esc(img)}">
<meta http-equiv="refresh" content="0;url=${esc(url)}"></head><body><a href="${esc(url)}">Continue to CouponDonation</a><script>location.replace(${JSON.stringify(url)})</script></body></html>`;
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=300' } });
});
