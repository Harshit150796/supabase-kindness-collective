/**
 * Links built from stored data (redemption links, receipts) are rendered only when they are http(s).
 * Anything else, such as a javascript: or data: address, is dropped instead of becoming a link.
 */
export function safeHref(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const u = new URL(url, window.location.origin);
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : undefined;
  } catch {
    return undefined;
  }
}
