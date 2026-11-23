// What the team may see of an email the site sent (Admin > Emails, founder request Nov 23, 2026): the whole email
// as it went out, minus the parts that would let a reader act as the recipient. Sign-in codes and one-time links
// (password reset, co-organizer invitations, donors' private impact pages, unsubscribe and "stop" links) are
// replaced with "hidden" before the copy is saved or shown, so they are never stored in our database or shown in
// the admin portal. Pure and tested (email-redact_test.ts).

export const HIDDEN = '[hidden]';
const CODE_MASK = '••••••';

/** Query values that are safe to show: they only say which page or view a link opens. */
const SAFE_PARAMS = new Set(['share', 'fundraiser', 'store', 'view', 'tab', 'need', 'state', 'sort', 'q', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'subject']);
/** Paths whose next segment is a private key to someone's page. */
const PRIVATE_PATHS = [/^(\/impact\/)([^/?#]+)/i];

/** One link with its private parts hidden. Links we can't read are left as they are. */
export function redactUrl(raw: string): { url: string; hidden: boolean } {
  const ampEscaped = raw.includes('&amp;');
  let u: URL;
  try { u = new URL(ampEscaped ? raw.replace(/&amp;/g, '&') : raw); } catch { return { url: raw, hidden: false }; }
  if (u.protocol === 'mailto:') return { url: raw, hidden: false };
  let hidden = false;
  for (const re of PRIVATE_PATHS) {
    const m = u.pathname.match(re);
    if (m && m[2] !== 'sample') { u.pathname = u.pathname.replace(re, `$1${HIDDEN}`); hidden = true; }
  }
  const params = [...u.searchParams.keys()];
  for (const key of new Set(params)) {
    if (SAFE_PARAMS.has(key.toLowerCase())) continue;
    u.searchParams.set(key, HIDDEN);
    hidden = true;
  }
  let out = u.toString().replace(/%5Bhidden%5D/gi, HIDDEN);
  if (ampEscaped) out = out.replace(/&/g, '&amp;');
  return { url: hidden ? out : raw, hidden };
}

const URL_RE = /https?:\/\/[^\s"'<>()]+[^\s"'<>().,;:!?]/gi;

/** Whether an email is a sign-in code, so its six-digit numbers are the code. */
export const isCodeEmail = (subject: string | null | undefined) => /\b(code|verification)\b/i.test(subject ?? '');

/**
 * The email as the team may see it. Returns the redacted html and text, the links it contains (already
 * redacted) and whether anything was hidden, so the viewer can say so.
 */
export function redactEmail(e: { subject?: string | null; html?: string | null; text?: string | null }) {
  let hiddenCount = 0;
  const links: string[] = [];
  const add = (url: string) => { const plain = url.replace(/&amp;/g, '&'); if (!links.includes(plain)) links.push(plain); };
  const fixUrls = (s: string, collect: boolean) => s.replace(URL_RE, (m) => {
    const r = redactUrl(m);
    if (r.hidden) hiddenCount++;
    if (collect) add(r.url);
    return r.url;
  });
  const maskCodes = (s: string) => isCodeEmail(e.subject) ? s.replace(/\b\d{6}\b/g, () => { hiddenCount++; return CODE_MASK; }) : s;
  // In HTML, only text between tags carries the code (never attribute values such as colors or sizes).
  const maskHtmlCodes = (s: string) => isCodeEmail(e.subject) ? s.replace(/>([^<]*)</g, (_m, t: string) => `>${maskCodes(t)}<`) : s;
  const html = e.html ? maskHtmlCodes(fixUrls(e.html, false)) : null;
  // Links a reader can follow: buttons and links in the HTML (not images), or every address in a text-only email.
  if (html) for (const m of html.matchAll(/href="(https?:[^"]+)"/gi)) add(m[1]);
  const text = e.text ? maskCodes(fixUrls(e.text, !e.html)) : null;
  return { html, text, links, hidden: hiddenCount > 0 };
}
