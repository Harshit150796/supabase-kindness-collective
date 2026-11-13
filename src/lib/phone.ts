/** The ten national digits of a US number, without a leading country code 1. */
export function usPhoneDigits(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  return digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits.slice(0, 10);
}

/** Formats as the person types: 3155550123 → (315) 555-0123. */
export function formatUsPhone(raw: string): string {
  const d = usPhoneDigits(raw);
  if (d.length < 4) return d.length ? `(${d}` : '';
  if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

/** North American numbering: area code and exchange both start with 2–9. */
export function isUsPhone(raw: string): boolean {
  return /^[2-9]\d{2}[2-9]\d{6}$/.test(usPhoneDigits(raw));
}

/**
 * Account phone numbers (founder request, Nov 12, 2026): optional at sign-up, when launching a
 * fundraiser and in Settings; kept on profiles.phone as +1 and ten digits, the same form as the
 * contact form. Only the person and the CouponDonation team can read it; it is never shown publicly.
 */
export const PHONE_ERROR = 'Enter a 10-digit US number, or leave this blank.';

/** The stored form (+13155550123), or null when blank. Throws nothing: check isUsPhone first. */
export function toStoredPhone(raw: string | null | undefined): string | null {
  if (!raw || !raw.trim() || !isUsPhone(raw)) return null;
  return `+1${usPhoneDigits(raw)}`;
}

/** True when the field is blank or holds a valid US number. */
export const phoneOk = (raw: string) => !raw.trim() || isUsPhone(raw);

/** (315) 555-0123 for US numbers; anything older stored another way is shown as it was typed. */
export function showPhone(stored: string | null | undefined): string | null {
  if (!stored || !stored.trim()) return null;
  return isUsPhone(stored) ? formatUsPhone(stored) : stored.trim();
}

/** A tel: link for any stored number. */
export const telHref = (stored: string) => `tel:${stored.replace(/[^\d+]/g, '')}`;
