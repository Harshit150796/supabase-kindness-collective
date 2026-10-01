// Server-side safety rules for user-written text (messages, comments, updates).
// BLOCK: off-platform payment solicitation. REDACT: emails and phone numbers.

export interface ModerationResult {
  blocked: boolean;
  blockRules: string[];
  redactRules: string[];
  text: string; // cleaned + redacted text (only meaningful when not blocked)
}

const BLOCK_RULES: Array<[string, RegExp]> = [
  ['venmo', /\bvenmo\b|\bvenmo\.com\b/i],
  ['cashapp', /\bcash\s*app\b|\bcashapp\b|cash\.app/i],
  ['cashtag', /(^|[^\w$])\$[a-z][a-z0-9_]{1,19}\b/i],
  ['zelle', /\bzelle\b/i],
  ['paypal', /\bpay\s*pal\b|paypal\.me/i],
  ['western_union', /\bwestern\s*union\b/i],
  ['moneygram', /\bmoney\s*gram\b/i],
  ['wire_transfer', /\bwire\s*(transfer|me|the money|funds)\b|\bbank\s*transfer\b|\bswift\s*code\b/i],
  ['gift_card_request', /\b(send|buy|give|share|need|get)\b[^.!?\n]{0,40}\bgift\s*cards?\b|\bgift\s*card\s*(code|number|pin)s?\b/i],
  ['crypto', /\b(bitcoin|btc|ethereum|eth|usdt|tether|crypto(currency)?|wallet\s*address|dogecoin|solana)\b/i],
  ['crypto_address', /\b(bc1[a-z0-9]{20,}|[13][a-km-zA-HJ-NP-Z1-9]{25,34}|0x[a-fA-F0-9]{40})\b/],
  ['iban', /\b[A-Z]{2}\d{2}(?:\s?[A-Z0-9]{4}){3,7}\b/],
  ['bank_numbers', /\b(routing|account|acct|aba)\s*(number|no\.?|#)?\s*[:#]?\s*\d{6,17}\b/i],
  ['pay_me_directly', /\b(pay|send|donate)\s+(me|to me|us)\s+(directly|direct|outside|off)\b/i],
];

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE_RE = /(?:\+?\d{1,3}[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}\b/g;

export function stripHtml(input: string): string {
  return input
    .replace(/<[^>]*>/g, '')
    .replace(/&lt;|&gt;|&amp;|&quot;|&#39;/g, ' ')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .trim();
}

export function moderate(raw: string): ModerationResult {
  const clean = stripHtml(raw);
  const blockRules = BLOCK_RULES.filter(([, re]) => re.test(clean)).map(([n]) => n);
  const redactRules: string[] = [];
  let text = clean;
  if (EMAIL_RE.test(text)) { redactRules.push('email'); text = text.replace(EMAIL_RE, '[removed]'); }
  EMAIL_RE.lastIndex = 0;
  if (PHONE_RE.test(text)) { redactRules.push('phone'); text = text.replace(PHONE_RE, '[removed]'); }
  PHONE_RE.lastIndex = 0;
  return { blocked: blockRules.length > 0, blockRules, redactRules, text };
}

/** Short excerpt for admins with digits/handles masked. */
export function maskedExcerpt(raw: string): string {
  return stripHtml(raw).slice(0, 200).replace(/\d/g, '•').replace(/@\w+/g, '@•••').replace(/\$\w+/g, '$•••');
}

export const BLOCKED_EXPLANATION =
  'This message was not sent. For everyone’s safety, all support must go through CouponDonation — please don’t share payment apps, gift card codes, crypto or bank details.';
