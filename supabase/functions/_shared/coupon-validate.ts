// Shared validation for coupon credential lines (server side; mirrored in src/lib/couponCredentials.ts).
export type CredType = 'code' | 'gift_card' | 'prepaid_link' | 'prepaid_card';
export type PlainSecret = { code?: string; pin?: string; number?: string; cvv?: string; name?: string; zip?: string };

export function luhn(num: string): boolean {
  const d = num.replace(/\D/g, '');
  if (d.length < 12 || d.length > 19) return false;
  let sum = 0;
  for (let i = 0; i < d.length; i++) {
    let n = Number(d[d.length - 1 - i]);
    if (i % 2 === 1) { n *= 2; if (n > 9) n -= 9; }
    sum += n;
  }
  return sum % 10 === 0;
}

export function expiryOk(mmYY: string, now = new Date()): boolean {
  const m = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(mmYY);
  if (!m) return false;
  const end = new Date(Date.UTC(2000 + Number(m[2]), Number(m[1]), 1)); // first day of the following month
  return end.getTime() > now.getTime();
}

/** Returns an error message, or null when valid. Only checks what is supplied for a new credential. */
export function validateSecret(type: CredType, s: PlainSecret, opts: { url?: string | null; card_exp?: string | null; now?: Date } = {}): string | null {
  const t = (v?: string) => (v ?? '').trim();
  const has = (v?: string) => t(v).length > 0;
  if (type === 'code') {
    if (!has(s.code)) return 'Enter the code';
    if (t(s.code).length < 3 || t(s.code).length > 200) return 'Code needs 3–200 characters';
    if (has(s.pin) && !/^[0-9A-Za-z-]{3,16}$/.test(t(s.pin))) return 'PIN needs 3–16 letters or digits';
    if (has(s.number) || has(s.cvv)) return 'Codes have no card number or CVV';
  }
  if (type === 'gift_card') {
    if (!/^[0-9A-Za-z -]{8,30}$/.test(t(s.number))) return 'Gift card number needs 8–30 characters';
    if (!/^[0-9A-Za-z-]{3,16}$/.test(t(s.pin))) return 'Gift card PIN needs 3–16 letters or digits';
    if (has(s.cvv)) return 'Gift cards have no CVV';
  }
  if (type === 'prepaid_link') {
    if (!opts.url || !/^https:\/\//i.test(opts.url)) return 'Hosted prepaid cards need the provider’s https link';
    if (Object.values(s).some(has)) return 'Hosted prepaid cards store only the link — never the card number or CVV';
  }
  if (type === 'prepaid_card') {
    if (!luhn(t(s.number))) return 'That card number is not valid (check digit failed)';
    if (!/^\d{3,4}$/.test(t(s.cvv))) return 'CVV must be 3 or 4 digits';
    if (!opts.card_exp || !expiryOk(opts.card_exp, opts.now)) return 'Expiry must be MM/YY and not in the past';
    if (has(s.name) && t(s.name).length > 60) return 'Cardholder name is too long';
    if (has(s.zip) && !/^\d{5}(-\d{4})?$/.test(t(s.zip))) return 'Billing ZIP must be 5 digits (or ZIP+4)';
  }
  if (opts.url && (!/^https:\/\//i.test(opts.url) || opts.url.length > 1000)) return 'Redemption link must start with https://';
  return null;
}

export const last4Of = (type: CredType, s: PlainSecret) => {
  const src = type === 'code' ? t(s.code) : t(s.number).replace(/[\s-]/g, '');
  return src.slice(-4) || null;
};
function t(v?: string) { return (v ?? '').trim(); }
