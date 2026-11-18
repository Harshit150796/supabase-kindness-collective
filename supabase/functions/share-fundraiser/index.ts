// Link previews for shared fundraisers, read by the share.coupondonation.com preview service (a separate
// Lovable project) when a link-preview bot opens share.coupondonation.com/f/<slug>. People never land here:
// the preview service sends them straight to coupondonation.com/f/<slug>.
//   GET ?slug=<slug>               the preview page (og and twitter tags; see _shared/share-preview.ts)
//   GET ?slug=<slug>&prepare=1     makes the preview photo now, so the first share of a link is fast. The site
//                                  calls this (fire and forget) when someone opens a share menu or adds photos.
//   GET ?slug=<slug>&image=og|wide the preview photo itself, for previews made before Nov 17 2026 that still
//                                  point at share.coupondonation.com/f/<slug>/photo.jpg
// The preview photo is the whole main photo as a JPEG, made once per photo and kept in the public
// fundraiser-covers bucket under share-cards/<fundraiser id>/, so apps fetch it straight from the storage CDN (no
// function in the way). If it can't be stored, previews point at share.coupondonation.com/f/<slug>/photo.jpg,
// which this function answers by making the photo on the spot, as before.
// Fundraiser data is public data read with the anon key under row-level security; only share-cards/ is written,
// with the service key.
import { createClient } from 'npm:@supabase/supabase-js@2';
import {
  CARD_BUCKET, cardName, cardPath, cardUrl, cleanSlug, DEFAULT_DESCRIPTION, DEFAULT_TITLE, FALLBACK_IMAGE, imageSize, isUuid, mainPhoto,
  MAX_CARD_BYTES, pageUrl, parseCardName, photoSource, previewHtml, type PreviewFundraiser, previewText, SHARE_HOST, shareUrl,
  SITE, version,
} from '../_shared/share-preview.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const db = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, { auth: { persistSession: false } });
const admin = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });

type Card = { url: string; width: number; height: number };

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

/** Downloads the whole photo as a JPEG (one retry at lower quality if it is too heavy for WhatsApp). */
async function renderPhoto(whole: (quality: number) => string): Promise<{ bytes: Uint8Array; width: number; height: number } | null> {
  let best: { bytes: Uint8Array; width: number; height: number } | null = null;
  for (const quality of [82, 68]) {
    const r = await fetch(whole(quality), { headers: { Accept: 'image/jpeg' }, signal: AbortSignal.timeout(8000) });
    if (!r.ok || !(r.headers.get('content-type') ?? '').startsWith('image/jpeg')) { await r.body?.cancel(); break; }
    const bytes = new Uint8Array(await r.arrayBuffer());
    const size = imageSize(bytes);
    if (!size) break;
    best = { bytes, ...size };
    if (bytes.length <= MAX_CARD_BYTES) break;
  }
  return best;
}

type Stored = { name: string; width: number; height: number };

/** This photo's stored preview, if it was made before. `others` are older ones for the same fundraiser. */
async function storedCard(id: string, v: string): Promise<{ found: Stored | null; others: string[] }> {
  const { data, error } = await admin.storage.from(CARD_BUCKET).list(cardPath(id), { limit: 50 })
    .catch((e: unknown) => ({ data: null, error: { message: e instanceof Error ? e.message : String(e) } }));
  if (error) console.error('share-fundraiser: card list failed', error.message);
  let found: Stored | null = null;
  const others: string[] = [];
  for (const o of data ?? []) {
    const card = parseCardName(o.name);
    if (card?.version === v && !found) found = { name: o.name, width: card.width, height: card.height };
    else if (card) others.push(o.name);
  }
  return { found, others };
}

/**
 * The fundraiser's preview photo: the stored one, or made and stored now (older ones of the same fundraiser are
 * then removed). If storing fails, the photo is still shown, made on the spot behind the old share-host address.
 * Null when there is no usable photo.
 */
async function ensureCard(f: PreviewFundraiser, slug: string): Promise<Card | null> {
  const photo = mainPhoto(f);
  const source = photoSource(photo, SUPABASE_URL);
  if (!photo || !source) return null;
  const v = version(photo);
  try {
    const { found, others } = await storedCard(f.id, v);
    if (found) return { url: cardUrl(SUPABASE_URL, f.id, found.name), width: found.width, height: found.height };
    const made = await renderPhoto(source.whole);
    if (!made) return null;
    const name = cardName(v, made);
    const { error } = await admin.storage.from(CARD_BUCKET).upload(cardPath(f.id, name), made.bytes, { contentType: 'image/jpeg', cacheControl: '31536000', upsert: true })
      .catch((e: unknown) => ({ error: { message: e instanceof Error ? e.message : String(e) } }));
    if (error) {
      console.error('share-fundraiser: card upload failed', error.message);
      return { url: `${SHARE_HOST}/f/${slug}/photo.jpg?v=${v}`, width: made.width, height: made.height };
    }
    if (others.length) await admin.storage.from(CARD_BUCKET).remove(others.map((n) => cardPath(f.id, n))).catch(() => undefined);
    return { url: cardUrl(SUPABASE_URL, f.id, name), width: made.width, height: made.height };
  } catch (error) {
    console.error('share-fundraiser: card failed', error instanceof Error ? error.message : error);
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
    const fallback = { ...FALLBACK_IMAGE, alt: 'CouponDonation logo with the line Transform Lives Through Giving' };
    return html(head ? null : previewHtml({
      url: slug ? shareUrl(slug) : SHARE_HOST, destination: slug ? pageUrl(slug) : SITE,
      pageTitle: DEFAULT_TITLE, title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION, image: fallback,
    }));
  }
  const [organizer, card] = await Promise.all([f.is_example ? Promise.resolve(null) : organizerName(f.id), ensureCard(f, slug)]);
  const text = previewText(f, organizer);
  const alt = f.title.trim();
  const image = card ? { ...card, type: 'image/jpeg', alt } : { ...FALLBACK_IMAGE, alt };
  return html(head ? null : previewHtml({ url: shareUrl(slug), destination: pageUrl(slug), ...text, image }));
}

/** Preview photos behind share.coupondonation.com/f/<slug>/photo.jpg: the stored file, or made on the spot. */
async function legacyPhoto(slug: string, head: boolean): Promise<Response> {
  const fallback = () => Response.redirect(FALLBACK_IMAGE.url, 302);
  const f = slug ? await loadFundraiser(slug) : null;
  const photo = f ? mainPhoto(f) : null;
  const source = photoSource(photo, SUPABASE_URL);
  if (!f || !photo || !source) return fallback();
  const send = (body: BodyInit | null) => new Response(head ? null : body, { headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=86400' } });
  try {
    const { found } = await storedCard(f.id, version(photo));
    if (found) {
      const r = await fetch(cardUrl(SUPABASE_URL, f.id, found.name), { signal: AbortSignal.timeout(8000) });
      if (r.ok) { if (head) await r.body?.cancel(); return send(r.body); }
      await r.body?.cancel();
    }
    const made = await renderPhoto(source.whole);
    return made ? send(new Blob([made.bytes as Uint8Array<ArrayBuffer>], { type: "image/jpeg" })) : fallback();
  } catch (error) {
    console.error('share-fundraiser: photo failed', error instanceof Error ? error.message : error);
    return fallback();
  }
}

async function prepare(slug: string): Promise<Response> {
  const f = slug ? await loadFundraiser(slug) : null;
  const card = f ? await ensureCard(f, slug) : null;
  return new Response(null, { status: card ? 204 : 404, headers: { 'Cache-Control': 'no-store' } });
}

Deno.serve(async (req) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return new Response('Method not allowed', { status: 405 });
  const params = new URL(req.url).searchParams;
  const slug = cleanSlug(params.get('slug'));
  const image = params.get('image');
  const head = req.method === 'HEAD';
  if (params.get('prepare') === '1') return prepare(slug);
  if (image === 'og' || image === 'wide') return legacyPhoto(slug, head);
  return previewPage(slug, head);
});
