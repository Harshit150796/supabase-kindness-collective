// Rules for public profiles (usernames, names, bios, links, causes). Pure functions, so they are
// unit-tested in profile-rules_test.ts and the profile-actions function stays small.
import { moderate } from './moderation.ts';

export const USERNAME_RE = /^[a-z0-9][a-z0-9_.]{1,28}[a-z0-9]$/;

/** Names people could use to pass as CouponDonation, its team or a site page. */
const RESERVED = new Set([
  'admin', 'administrator', 'root', 'system', 'support', 'help', 'helpdesk', 'staff', 'team', 'official', 'moderator', 'mod',
  'security', 'billing', 'payments', 'refunds', 'legal', 'privacy', 'terms', 'about', 'contact', 'settings', 'profile', 'profiles',
  'people', 'dashboard', 'donate', 'donations', 'donation', 'donor', 'donors', 'fundraiser', 'fundraisers', 'apply', 'stories',
  'blog', 'faq', 'api', 'www', 'mail', 'email', 'null', 'undefined', 'me', 'you', 'everyone', 'coupon', 'coupons',
]);
const IMPERSONATION = /coupon[._]?donation|^(admin|support|official|staff|team|moderator)[._]|[._](admin|support|official|staff)$/;

export const NEED_IDS = ['food', 'meals', 'healthcare', 'childcare', 'clothing', 'education', 'transportation', 'utilities', 'essentials', 'emergency'];
export const LINK_KEYS = ['website', 'instagram', 'facebook', 'tiktok', 'x', 'youtube', 'linkedin'] as const;
export type LinkKey = typeof LINK_KEYS[number];

export type Check<T> = { ok: true; value: T } | { ok: false; error: string };

export function checkUsername(raw: unknown): Check<string> {
  const u = String(raw ?? '').trim().replace(/^@/, '').toLowerCase();
  if (!USERNAME_RE.test(u)) return { ok: false, error: 'Use 3 to 30 letters, numbers, dots or underscores, starting and ending with a letter or number.' };
  if (/[._]{2}/.test(u)) return { ok: false, error: 'Dots and underscores can’t sit next to each other.' };
  if (RESERVED.has(u) || IMPERSONATION.test(u)) return { ok: false, error: 'That username is reserved. Please choose another.' };
  return { ok: true, value: u };
}

/** Free text a person writes about themselves: no payment handles, no contact details. */
function checkText(raw: unknown, max: number, label: string, allowEmpty: boolean): Check<string | null> {
  const s = String(raw ?? '').replace(/\s+/g, ' ').trim();
  if (!s) return allowEmpty ? { ok: true, value: null } : { ok: false, error: `Add your ${label}.` };
  if ([...s].length > max) return { ok: false, error: `Keep your ${label} to ${max} characters.` };
  const m = moderate(s);
  if (m.blocked) return { ok: false, error: `Your ${label} can’t include payment apps, gift card codes, crypto or bank details.` };
  if (m.redactRules.length) return { ok: false, error: `Please leave email addresses and phone numbers out of your ${label}.` };
  if (m.text !== s) return { ok: false, error: `Your ${label} can’t include HTML.` };
  return { ok: true, value: s };
}

export function checkDisplayName(raw: unknown): Check<string | null> {
  const r = checkText(raw, 60, 'name', true);
  if (r.ok && r.value && /coupon\s*donation/i.test(r.value)) return { ok: false, error: 'Your name can’t include CouponDonation.' };
  return r;
}

export const checkBio = (raw: unknown) => checkText(raw, 160, 'bio', true);

export function checkCauses(raw: unknown): Check<string[]> {
  if (!Array.isArray(raw)) return { ok: false, error: 'Choose causes from the list.' };
  const list = Array.from(new Set(raw.map((x) => String(x))));
  if (list.length > 5) return { ok: false, error: 'Choose up to 5 causes.' };
  if (!list.every((x) => NEED_IDS.includes(x))) return { ok: false, error: 'Choose causes from the list.' };
  return { ok: true, value: list };
}

const HANDLE_HOSTS: Record<Exclude<LinkKey, 'website'>, RegExp> = {
  instagram: /^(?:https?:\/\/)?(?:www\.)?instagram\.com\//i,
  facebook: /^(?:https?:\/\/)?(?:www\.|m\.)?facebook\.com\//i,
  tiktok: /^(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@?/i,
  x: /^(?:https?:\/\/)?(?:www\.)?(?:x|twitter)\.com\//i,
  youtube: /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/@?/i,
  linkedin: /^(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\//i,
};

/** Social links are stored as handles (the site builds the URL); the website as an https link. */
export function checkLinks(raw: unknown): Check<Record<string, string>> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { ok: false, error: 'Links are not valid.' };
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!(LINK_KEYS as readonly string[]).includes(k)) return { ok: false, error: 'Links are not valid.' };
    const s = String(v ?? '').trim();
    if (!s) continue;
    if (k === 'website') {
      let url: URL;
      try { url = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`); } catch { return { ok: false, error: 'Enter a valid website address.' }; }
      if (!['http:', 'https:'].includes(url.protocol) || !url.hostname.includes('.') || s.length > 200) return { ok: false, error: 'Enter a valid website address.' };
      url.protocol = 'https:';
      if (moderate(url.href).blocked) return { ok: false, error: 'Payment app links can’t go on your profile.' };
      out.website = url.href;
    } else {
      const handle = s.replace(HANDLE_HOSTS[k as Exclude<LinkKey, 'website'>], '').replace(/^@/, '').replace(/[/?#].*$/, '');
      if (!/^[A-Za-z0-9_.-]{1,40}$/.test(handle)) return { ok: false, error: `Enter your ${k === 'x' ? 'X' : k[0].toUpperCase() + k.slice(1)} username.` };
      out[k] = handle;
    }
  }
  return { ok: true, value: out };
}

/** Our own bucket, the person's own folder, a file name the uploader makes. */
export function checkMediaPath(raw: unknown, uid: string, kind: 'avatar' | 'cover'): Check<string> {
  const p = String(raw ?? '');
  const re = new RegExp(`^${uid}/${kind}-[a-z0-9-]{8,64}\\.(webp|jpg|jpeg|png)$`);
  return re.test(p) ? { ok: true, value: p } : { ok: false, error: 'Upload the photo again.' };
}

export const REPORT_REASONS = ['Impersonation', 'Scam or fraud', 'Harassment or hate', 'Inappropriate photo', 'Spam', 'Other'];
