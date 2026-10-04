// Client mirror of supabase/functions/_shared/coupon-validate.ts (server re-checks everything).
// Prepaid card numbers/CVVs are never accepted — prepaid cards are hosted links only.
export type CredType = 'code' | 'gift_card' | 'prepaid_link';
export type PlainSecret = { code?: string; pin?: string; number?: string };

/** Returns an error message, or null when valid. Only checks what is supplied for a new credential. */
export function validateSecret(type: CredType, s: PlainSecret & Record<string, unknown>, opts: { url?: string | null } = {}): string | null {
  const t = (v?: unknown) => String(v ?? '').trim();
  const has = (v?: unknown) => t(v).length > 0;
  if (['cvv', 'name', 'zip', 'card_exp'].some((k) => has(s[k])) || (type as string) === 'prepaid_card') return 'Prepaid card numbers and CVVs are not accepted. Use “Prepaid card — hosted link”.';
  if (type === 'code') {
    if (t(s.code).length < 3 || t(s.code).length > 200) return 'Code needs 3–200 characters';
    if (has(s.pin) && !/^[0-9A-Za-z-]{3,16}$/.test(t(s.pin))) return 'PIN needs 3–16 letters or digits';
    if (has(s.number)) return 'Codes have no card number';
  }
  if (type === 'gift_card') {
    if (!/^[0-9A-Za-z -]{8,30}$/.test(t(s.number))) return 'Gift card number needs 8–30 characters';
    if (!/^[0-9A-Za-z-]{3,16}$/.test(t(s.pin))) return 'Gift card PIN needs 3–16 letters or digits';
  }
  if (type === 'prepaid_link') {
    if (!opts.url || !/^https:\/\//i.test(opts.url)) return 'Hosted prepaid cards need the provider’s https link';
    if (Object.values(s).some(has)) return 'Hosted prepaid cards store only the link — never a card number or CVV';
  }
  if (opts.url && (!/^https:\/\//i.test(opts.url) || opts.url.length > 1000)) return 'Redemption link must start with https://';
  return null;
}
