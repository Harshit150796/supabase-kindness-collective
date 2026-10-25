// Signs newsletter links so the click tracker forwards only to links a real campaign contained.

async function hmacKey(): Promise<CryptoKey> {
  const secret = `email-link:${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''}`;
  return crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
}

/** A short signature over the campaign id and the exact link. */
export async function linkSig(campaignId: string, url: string): Promise<string> {
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', await hmacKey(), new TextEncoder().encode(`${campaignId}|${url}`)));
  return btoa(String.fromCharCode(...mac.slice(0, 16))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Our own pages, which are always safe to forward to (links in emails sent before signing). */
export function isSiteUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && (u.hostname === 'coupondonation.com' || u.hostname.endsWith('.coupondonation.com'));
  } catch {
    return false;
  }
}

export function isWebUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}
