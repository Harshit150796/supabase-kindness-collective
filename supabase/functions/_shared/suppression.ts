// One shared "unsubscribed" list for every optional email (newsletters, follow-ups, impact updates).
// Account emails (receipts, sign-in codes, password resets, fundraiser notices) never check it.
// deno-lint-ignore no-explicit-any
type Db = any;

export const UNSUB_FUNCTION_URL = 'https://vbnbacowuoeeojjdrzzp.supabase.co/functions/v1/email-unsubscribe';
export const UNSUB_PAGE_URL = 'https://coupondonation.com/unsubscribe';

export const norm = (email: string) => email.trim().toLowerCase();

export async function isSuppressed(db: Db, email: string): Promise<boolean> {
  const { data } = await db.from('email_suppressions').select('email').eq('email', norm(email)).maybeSingle();
  return !!data;
}

/** Emails (lowercased) on the list, from a batch. */
export async function suppressedSet(db: Db, emails: string[]): Promise<Set<string>> {
  const list = [...new Set(emails.filter(Boolean).map(norm))];
  const out = new Set<string>();
  for (let i = 0; i < list.length; i += 500) {
    const { data } = await db.from('email_suppressions').select('email').in('email', list.slice(i, i + 500));
    for (const r of data ?? []) out.add(r.email);
  }
  return out;
}

/** Puts the address on the shared list and mirrors it into each older per-list flag. */
export async function suppress(db: Db, email: string, source: string) {
  const e = norm(email);
  const now = new Date().toISOString();
  await db.from('email_suppressions').upsert({ email: e, source }, { onConflict: 'email', ignoreDuplicates: true });
  await db.from('email_subscribers').update({ subscribed: false, unsubscribed_at: now }).ilike('email', e).eq('subscribed', true);
  await db.from('visitor_consents').update({ consent_status: 'opted_out', opted_out_at: now, updated_at: now }).ilike('email', e).is('opted_out_at', null);
  await db.from('impact_email_optouts').upsert({ email: e }, { onConflict: 'email', ignoreDuplicates: true });
}

/** A fresh, explicit tick of "Email me helpful updates" is new consent. */
export async function unsuppress(db: Db, email: string) {
  await db.from('email_suppressions').delete().eq('email', norm(email));
}

/** Pure filter used by senders (tested). */
export function withoutSuppressed<T extends { email: string }>(rows: T[], blocked: Set<string>): T[] {
  return rows.filter((r) => r.email && !blocked.has(norm(r.email)));
}
