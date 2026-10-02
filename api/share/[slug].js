// Vercel function: link-preview HTML for social crawlers on coupondonation.com/f/:slug.
// Only bots are rewritten here (see vercel.json); people get the normal app.
const SITE = 'https://coupondonation.com';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://vbnbacowuoeeojjdrzzp.supabase.co';
const KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZibmJhY293dW9lZW9qamRyenpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3ODU0NjIsImV4cCI6MjA4MjM2MTQ2Mn0.9zk-njOwZ6YrG0HKwpUj6rvK-rsGKkxIukh0XydlcOU';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export default async function handler(req, res) {
  const raw = Array.isArray(req.query.slug) ? req.query.slug[0] : req.query.slug;
  const slug = String(raw || '').replace(/[^a-z0-9-]/gi, '').slice(0, 120);
  let f = null;
  if (slug) {
    try {
      const r = await fetch(
        `${SUPABASE_URL}/rest/v1/fundraisers?unique_slug=eq.${encodeURIComponent(slug)}&select=title,story,cover_photo_url,status,fundraiser_images(image_url,is_primary,display_order)&limit=1`,
        { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } },
      );
      if (r.ok) f = (await r.json())[0] || null;
    } catch { /* fall back to generic preview */ }
  }
  const url = f ? `${SITE}/f/${slug}` : SITE;
  const title = f ? `${f.title} — CouponDonation` : 'CouponDonation';
  const desc = f && f.story ? f.story.replace(/[*_#>`]/g, '').replace(/\s+/g, ' ').trim().slice(0, 180) : 'Donations that become coupons at real retailers.';
  const gallery = (f?.fundraiser_images || []).sort((a, b) => Number(!!b.is_primary) - Number(!!a.is_primary) || Number(a.display_order ?? 999) - Number(b.display_order ?? 999));
  const img = gallery[0]?.image_url || (f && f.cover_photo_url) || `${SITE}/favicon-512.png`;
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(title)}</title>
<link rel="canonical" href="${esc(url)}"><meta name="description" content="${esc(desc)}">
<meta property="og:type" content="website"><meta property="og:url" content="${esc(url)}"><meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}"><meta property="og:image" content="${esc(img)}"><meta property="og:site_name" content="CouponDonation">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc)}"><meta name="twitter:image" content="${esc(img)}">
<meta http-equiv="refresh" content="0;url=${esc(url)}"></head><body><a href="${esc(url)}">Continue to CouponDonation</a></body></html>`;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=300, max-age=300');
  res.status(200).send(html);
}
