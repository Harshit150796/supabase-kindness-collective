// Link previews for shared fundraisers (founder request, Nov 2026). Share buttons give out
// share.coupondonation.com/f/<slug>; the preview service there asks share-fundraiser for this page when a
// link-preview bot (WhatsApp, iMessage, Facebook, X, LinkedIn, Slack …) opens the link, and sends people
// straight on to coupondonation.com/f/<slug>. The text follows GoFundMe's pattern:
//   title        "Donate to <fundraiser>, organized by <organizer>"
//   description  "<start of the story>… <organizer> needs your support for <fundraiser>"
//   image        the fundraiser's main photo as a JPEG (4:3, and 16:9 for X), with exact sizes declared.
// Public data only (read with the anon key under row-level security). Pure helpers live here so tests can run them.

export const SITE = 'https://coupondonation.com';
export const SHARE_HOST = 'https://share.coupondonation.com';
export const FALLBACK_IMAGE = { url: `${SITE}/og-image.png`, width: 1200, height: 630, type: 'image/png' };
export const DEFAULT_TITLE = 'CouponDonation: Give Groceries & Gift Cards to Families in Need';
export const DEFAULT_DESCRIPTION = 'Help someone with a real need. Your donation becomes gift cards for the groceries, medicine and rides they asked for, and you get a receipt for every gift.';

/** og:image is 4:3 like GoFundMe's; X shows a 16:9 card. Neither is ever wider than 1200px. */
export const SHAPES = { og: 4 / 3, wide: 16 / 9 } as const;
export type Shape = keyof typeof SHAPES;
const MAX_WIDTH = 1200;

export type PreviewImage = { image_url: string; is_primary?: boolean | null; display_order?: number | null; created_at?: string | null };
export type PreviewFundraiser = {
  id: string;
  title: string;
  story: string | null;
  status: string | null;
  unique_slug: string | null;
  cover_photo_url: string | null;
  is_example: boolean | null;
  fundraiser_images?: PreviewImage[] | null;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (s: string) => UUID.test(s);

/** Slugs are lowercase words and dashes (ids are UUIDs); anything else is dropped. */
export function cleanSlug(raw: string | null | undefined): string {
  return String(raw ?? '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 120);
}

export const shareUrl = (slug: string) => `${SHARE_HOST}/f/${slug}`;
export const pageUrl = (slug: string) => `${SITE}/f/${slug}`;

/** The site's one photo rule: primary gallery photo, then the first in gallery order, then the legacy cover. */
export function mainPhoto(f: Pick<PreviewFundraiser, 'cover_photo_url' | 'fundraiser_images'>): string | null {
  const sorted = [...(f.fundraiser_images ?? [])].filter((i) => i?.image_url).sort((a, b) => {
    if (!!a.is_primary !== !!b.is_primary) return a.is_primary ? -1 : 1;
    const order = Number(a.display_order ?? Number.MAX_SAFE_INTEGER) - Number(b.display_order ?? Number.MAX_SAFE_INTEGER);
    if (order) return order;
    return String(a.created_at ?? '').localeCompare(String(b.created_at ?? ''));
  });
  return sorted[0]?.image_url ?? f.cover_photo_url ?? null;
}

/** Plain text from a story (markdown marks and links removed, spaces collapsed). */
export function plainText(s: string | null | undefined): string {
  return String(s ?? '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/[*_#>`~|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** The start of the story, cut at a word near `max` characters, with an ellipsis when cut. */
export function excerpt(s: string | null | undefined, max = 120): string {
  const t = plainText(s);
  if (t.length <= max) return t;
  const cut = t.slice(0, max + 1);
  const space = cut.lastIndexOf(' ');
  return `${(space > max * 0.6 ? cut.slice(0, space) : t.slice(0, max)).replace(/[\s,;:.!?–—-]+$/, '')}…`;
}

export type PreviewText = { pageTitle: string; title: string; description: string };

export function previewText(f: Pick<PreviewFundraiser, 'title' | 'story' | 'is_example'>, organizer: string | null): PreviewText {
  const name = plainText(f.title).slice(0, 140) || 'a fundraiser';
  const who = organizer ? plainText(organizer).slice(0, 60) : '';
  const start = excerpt(f.story);
  if (f.is_example) {
    return {
      pageTitle: `Example campaign: ${name}`,
      title: `${name} (example campaign)`,
      description: `${start ? `${start} ` : ''}This is an example campaign that shows how CouponDonation works. Giving is closed on example campaigns.`,
    };
  }
  return {
    pageTitle: who ? `Fundraiser by ${who} : ${name}` : `Fundraiser: ${name}`,
    title: who ? `Donate to ${name}, organized by ${who}` : `Donate to ${name}`,
    description: `${start ? `${start} ` : ''}${who ? `${who} needs your support for ${name}` : `Your support helps ${name}`}`,
  };
}

export type Size = { width: number; height: number };

/** Width and height from the first bytes of a JPEG, PNG or WebP file (null when unknown). */
export function imageSize(b: Uint8Array): Size | null {
  const u16be = (o: number) => (b[o] << 8) | b[o + 1];
  const u32be = (o: number) => ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0;
  const u24le = (o: number) => b[o] | (b[o + 1] << 8) | (b[o + 2] << 16);
  const ascii = (o: number, n: number) => String.fromCharCode(...b.subarray(o, o + n));
  const ok = (s: Size) => (s.width > 0 && s.height > 0 ? s : null);
  if (b.length >= 24 && b[0] === 0x89 && ascii(1, 3) === 'PNG') return ok({ width: u32be(16), height: u32be(20) });
  if (b.length >= 30 && ascii(0, 4) === 'RIFF' && ascii(8, 4) === 'WEBP') {
    const kind = ascii(12, 4);
    if (kind === 'VP8X') return ok({ width: u24le(24) + 1, height: u24le(27) + 1 });
    if (kind === 'VP8 ') return ok({ width: (b[26] | (b[27] << 8)) & 0x3fff, height: (b[28] | (b[29] << 8)) & 0x3fff });
    if (kind === 'VP8L' && b[20] === 0x2f) {
      const bits = (b[21] | (b[22] << 8) | (b[23] << 16) | (b[24] << 24)) >>> 0;
      return ok({ width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 });
    }
    return null;
  }
  if (b.length >= 4 && b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) { i++; continue; }
      const m = b[i + 1];
      if (m === 0xff) { i++; continue; }
      if (m === 0xd8 || m === 0x01 || (m >= 0xd0 && m <= 0xd7)) { i += 2; continue; }
      if (m === 0xd9 || m === 0xda) return null;
      const len = u16be(i + 2);
      // SOF0–SOF15 carry the size, except DHT (C4), JPG (C8) and DAC (CC).
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return ok({ width: u16be(i + 7), height: u16be(i + 5) });
      if (len < 2) return null;
      i += 2 + len;
    }
  }
  return null;
}

/** Facebook and LinkedIn show a large card only for images at least 600×315; smaller ones become a thumbnail. */
const LARGE_CARD = { width: 600, height: 315, ratio: 1.91 };

/**
 * The largest crop of the photo in this shape, never wider than 1200px and never larger than the photo
 * (Storage doesn't enlarge). A photo too narrow for a large 4:3 card is cropped to 1.91:1 instead when that
 * keeps it large.
 */
export function cropFor(size: Size | null, shape: Shape): Size {
  const fit = (ratio: number): Size => {
    if (!size) return { width: MAX_WIDTH, height: Math.round(MAX_WIDTH / ratio) };
    const width = Math.max(1, Math.min(MAX_WIDTH, size.width, Math.floor(size.height * ratio)));
    return { width, height: Math.max(1, Math.round(width / ratio)) };
  };
  const crop = fit(SHAPES[shape]);
  if (shape === 'og' && crop.width < LARGE_CARD.width) {
    const wider = fit(LARGE_CARD.ratio);
    if (wider.width >= LARGE_CARD.width && wider.height >= LARGE_CARD.height) return wider;
  }
  return crop;
}

export type PhotoSource =
  | { kind: 'storage'; original: string; render: (s: Size) => string }
  | { kind: 'site'; original: string; render: (s: Size) => string };

/**
 * Where a cropped JPEG of the photo comes from. Uploaded photos are WebP in Supabase Storage: its image
 * service crops them (never past the photo's own size) and answers JPEG when asked with Accept: image/jpeg.
 * Example campaigns use photos on the site's own file host (/__l5e/…), which crops, scales and converts with
 * w, h, fit=cover and format=jpg. Anything else (an outside link) isn't fetched.
 */
export function photoSource(url: string | null, supabaseUrl: string): PhotoSource | null {
  if (!url) return null;
  const base = supabaseUrl.replace(/\/$/, '');
  const storage = `${base}/storage/v1/object/public/`;
  if (url.startsWith(storage)) {
    const path = url.slice(storage.length).split('?')[0];
    if (!/^[A-Za-z0-9._\-/]+$/.test(path) || path.includes('..')) return null;
    return { kind: 'storage', original: `${storage}${path}`, render: (s) => `${base}/storage/v1/render/image/public/${path}?width=${s.width}&height=${s.height}&resize=cover&quality=82` };
  }
  const site = url.startsWith(`${SITE}/__l5e/`) ? url.slice(SITE.length) : url.startsWith('/__l5e/') ? url : null;
  if (site) {
    const path = site.split('?')[0];
    if (!/^\/__l5e\/[A-Za-z0-9._\-/]+$/.test(path) || path.includes('..')) return null;
    return { kind: 'site', original: `${SITE}${path}`, render: (s) => `${SITE}${path}?w=${s.width}&h=${s.height}&fit=cover&format=jpg` };
  }
  return null;
}

/** Image sizes as they will be served: the site's file host scales up to the full size; Storage only crops. */
export function servedSize(source: PhotoSource, original: Size | null, shape: Shape): Size {
  return source.kind === 'site' ? cropFor(null, shape) : cropFor(original, shape);
}

/** A short version tag for the image URLs, so a new main photo is a new URL that apps fetch again. */
export function version(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0).toString(36);
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export type PreviewPage = {
  /** The link that was shared (og:url). Facebook reads og:url as the page to show, so it must be this link. */
  url: string;
  /** Where people are sent. */
  destination: string;
  pageTitle: string;
  title: string;
  description: string;
  image: { url: string; width: number; height: number; type: string; alt: string };
  wideImage: { url: string; width: number; height: number };
};

/** The page link-preview bots read. People who open it are sent on (script and link), never a meta refresh. */
export function previewHtml(p: PreviewPage): string {
  const meta = (attr: 'property' | 'name', key: string, value: string | number) => `<meta ${attr}="${key}" content="${esc(String(value))}">`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(p.pageTitle)}</title>
${meta('name', 'description', p.description)}
${meta('name', 'robots', 'noindex, follow')}
<link rel="canonical" href="${esc(p.url)}">
<link rel="icon" href="${SITE}/favicon-32.png" sizes="32x32">
<link rel="apple-touch-icon" href="${SITE}/apple-touch-icon.png">
${meta('property', 'og:type', 'website')}
${meta('property', 'og:site_name', 'CouponDonation')}
${meta('property', 'og:locale', 'en_US')}
${meta('property', 'og:url', p.url)}
${meta('property', 'og:title', p.title)}
${meta('property', 'og:description', p.description)}
${meta('property', 'og:image', p.image.url)}
${meta('property', 'og:image:secure_url', p.image.url)}
${meta('property', 'og:image:type', p.image.type)}
${meta('property', 'og:image:width', p.image.width)}
${meta('property', 'og:image:height', p.image.height)}
${meta('property', 'og:image:alt', p.image.alt)}
${meta('name', 'twitter:card', 'summary_large_image')}
${meta('name', 'twitter:site', '@CouponDonation')}
${meta('name', 'twitter:title', p.title)}
${meta('name', 'twitter:description', p.description)}
${meta('name', 'twitter:image', p.wideImage.url)}
${meta('name', 'twitter:image:alt', p.image.alt)}
</head>
<body style="font-family:system-ui,sans-serif;max-width:40rem;margin:2rem auto;padding:0 1rem;color:#14231a">
<img src="${esc(p.image.url)}" width="${p.image.width}" height="${p.image.height}" alt="${esc(p.image.alt)}" style="width:100%;height:auto;border-radius:12px">
<h1 style="font-size:1.5rem">${esc(p.title)}</h1>
<p>${esc(p.description)}</p>
<p><a href="${esc(p.destination)}">Open this fundraiser on CouponDonation</a></p>
<script>location.replace(${JSON.stringify(p.destination).replace(/</g, '\\u003c')})</script>
</body>
</html>`;
}
