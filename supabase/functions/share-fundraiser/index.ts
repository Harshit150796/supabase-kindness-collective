// Link previews for shared fundraisers, read by the share.coupondonation.com preview service (a separate
// Lovable project) when a link-preview bot opens share.coupondonation.com/f/<slug>. People never land here:
// the preview service sends them straight to coupondonation.com/f/<slug>.
//   GET ?slug=<slug>               the preview page (og and twitter tags; see _shared/share-preview.ts)
//   GET ?slug=<slug>&image=og      the main photo as a 4:3 JPEG (og:image)
//   GET ?slug=<slug>&image=wide    the main photo as a 16:9 JPEG (twitter:image)
// Public data only, read with the anon key under row-level security.
import { createClient } from 'npm:@supabase/supabase-js@2';
import {
  cleanSlug, DEFAULT_DESCRIPTION, DEFAULT_TITLE, FALLBACK_IMAGE, imageSize, isUuid, mainPhoto, pageUrl, photoSource,
  previewHtml, type PreviewFundraiser, previewText, servedSize, SHARE_HOST, shareUrl, SITE, type Size, version,
} from '../_shared/share-preview.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const db = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, { auth: { persistSession: false } });

async function loadFundraiser(slug: string): Promise<PreviewFundraiser | null> {
  const { data, error } = await db.from('fundraisers')
    .select('id,title,story,status,unique_slug,cover_photo_url,is_example,fundraiser_images(image_url,is_primary,display_order,created_at)')
    .eq(isUuid(slug) ? 'id' : 'unique_slug', slug)
    .maybeSingle();
  if (error) console.error('share-fundraiser: fundraiser read failed', error.message);
  // The fundraiser page itself shows open and pending fundraisers only.
  return data && (data.status === 'active' || data.status === 'pending') ? (data as PreviewFundraiser) : null;
}

/** The organizer's public name, exactly as the fundraiser page shows it. */
async function organizerName(id: string): Promise<string | null> {
  try {
    const { data } = await db.rpc('get_fundraiser_team_public', { _fundraiser_id: id });
    const team = (data ?? []) as Array<{ role: string; display_name: string | null }>;
    const lead = team.find((t) => t.role === 'organizer')?.display_name;
    if (lead?.trim()) return lead.trim();
    if (team.length) return null;
    const { data: o } = await db.rpc('get_fundraiser_organizer', { _fundraiser_id: id });
    const name = (o as Array<{ display_name: string | null }> | null)?.[0]?.display_name;
    return name?.trim() || null;
  } catch (error) {
    console.error('share-fundraiser: organizer read failed', error instanceof Error ? error.message : error);
    return null;
  }
}

/** Size of the original photo from its first 64 KB (a ranged read; stops early if the server sends it all). */
async function originalSize(url: string): Promise<Size | null> {
  try {
    const r = await fetch(url, { headers: { Range: 'bytes=0-65535' }, signal: AbortSignal.timeout(5000) });
    if (!r.ok || !r.body) return null;
    const reader = r.body.getReader();
    const parts: Uint8Array[] = []; let n = 0;
    while (n < 65536) {
      const { done, value } = await reader.read();
      if (done || !value) break;
      parts.push(value); n += value.length;
    }
    await reader.cancel().catch(() => {});
    const bytes = new Uint8Array(n); let o = 0;
    for (const p of parts) { bytes.set(p, o); o += p.length; }
    return imageSize(bytes);
  } catch {
    return null;
  }
}

const html = (body: string | null, status = 200) => new Response(body, {
  status,
  headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=300', 'X-Robots-Tag': 'noindex' },
});

async function previewPage(slug: string, head: boolean): Promise<Response> {
  const f = slug ? await loadFundraiser(slug) : null;
  if (!f) {
    const fallback = { ...FALLBACK_IMAGE, alt: 'CouponDonation logo with the line Give what people need' };
    return html(head ? null : previewHtml({
      url: slug ? shareUrl(slug) : SHARE_HOST, destination: slug ? pageUrl(slug) : SITE,
      pageTitle: DEFAULT_TITLE, title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION,
      image: fallback, wideImage: fallback,
    }));
  }
  const photo = mainPhoto(f);
  const source = photoSource(photo, SUPABASE_URL);
  const [organizer, original] = await Promise.all([
    f.is_example ? Promise.resolve(null) : organizerName(f.id),
    source?.kind === 'storage' ? originalSize(source.original) : Promise.resolve(null),
  ]);
  const text = previewText(f, organizer);
  const alt = f.title.trim();
  let image = { ...FALLBACK_IMAGE, alt };
  let wideImage: { url: string; width: number; height: number } = FALLBACK_IMAGE;
  if (source && photo) {
    const v = version(photo);
    image = { url: `${SHARE_HOST}/f/${slug}/photo.jpg?v=${v}`, type: 'image/jpeg', alt, ...servedSize(source, original, 'og') };
    wideImage = { url: `${SHARE_HOST}/f/${slug}/photo-wide.jpg?v=${v}`, ...servedSize(source, original, 'wide') };
  }
  return html(head ? null : previewHtml({ url: shareUrl(slug), destination: pageUrl(slug), ...text, image, wideImage }));
}

async function photo(slug: string, shape: 'og' | 'wide', head: boolean): Promise<Response> {
  const fallback = () => Response.redirect(FALLBACK_IMAGE.url, 302);
  const f = slug ? await loadFundraiser(slug) : null;
  const source = f ? photoSource(mainPhoto(f), SUPABASE_URL) : null;
  if (!source) return fallback();
  const original = source.kind === 'storage' ? await originalSize(source.original) : null;
  try {
    const r = await fetch(source.render(servedSize(source, original, shape)), { headers: { Accept: 'image/jpeg' }, signal: AbortSignal.timeout(10000) });
    if (!r.ok || !(r.headers.get('content-type') ?? '').startsWith('image/')) { await r.body?.cancel(); return fallback(); }
    return new Response(head ? null : r.body, {
      headers: { 'Content-Type': r.headers.get('content-type')!, 'Cache-Control': 'public, max-age=86400' },
    });
  } catch (error) {
    console.error('share-fundraiser: photo fetch failed', error instanceof Error ? error.message : error);
    return fallback();
  }
}

Deno.serve(async (req) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return new Response('Method not allowed', { status: 405 });
  const params = new URL(req.url).searchParams;
  const slug = cleanSlug(params.get('slug'));
  const image = params.get('image');
  const head = req.method === 'HEAD';
  if (image === 'og' || image === 'wide') return photo(slug, image, head);
  return previewPage(slug, head);
});
