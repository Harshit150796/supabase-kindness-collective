import { supabase } from '@/integrations/supabase/client';

/**
 * One place for the legal pages' shared facts. Bump LEGAL_VERSION whenever the Terms or Privacy Policy
 * change materially: people then accept the new version at their next sign-in, and it is recorded in
 * public.legal_acceptances.
 */
export const LEGAL_VERSION = '2026-10-24';
export const LEGAL_UPDATED = 'October 24, 2026';
export const COMPANY = 'CouponDonation Inc.';
export const COMPANY_FORM = 'a Delaware corporation';
export const LEGAL_EMAIL = 'support@coupondonation.com';
export const LEGAL_PHONE = '+1 (315) 898-6745';
/** The company's postal address for legal notices. Add it here and every legal page shows it. */
export const MAILING_ADDRESS: string | null = null;

export type AgreementContext = 'sign-up' | 'sign-in' | 'google' | 'apply-account' | 'fundraiser-submit' | 'card-donation';

const PENDING_KEY = 'cd_pending_agreement';

/**
 * Remembers that the person pressed a button showing the agreement notice, so the acceptance is
 * recorded once their sign-in completes (including Google's, which can leave and come back).
 */
export function markAgreement(context: AgreementContext) {
  try { sessionStorage.setItem(PENDING_KEY, JSON.stringify({ context, version: LEGAL_VERSION, at: Date.now() })); } catch { /* private mode */ }
}

/** Records an acceptance for this person. Never blocks or fails the flow it's part of. */
export async function recordAgreement(userId: string, context: AgreementContext, fundraiserId?: string | null) {
  try {
    await supabase.from('legal_acceptances' as never).upsert(
      { user_id: userId, terms_version: LEGAL_VERSION, context, fundraiser_id: fundraiserId ?? null } as never,
      { onConflict: 'user_id,terms_version,context,fundraiser_id', ignoreDuplicates: true },
    );
  } catch { /* the table may not exist yet */ }
}

/** Called when a session starts: records a pending acceptance from the last half hour, then clears it. */
export async function flushAgreement(userId: string) {
  let pending: { context?: AgreementContext; version?: string; at?: number } | null = null;
  try { pending = JSON.parse(sessionStorage.getItem(PENDING_KEY) || 'null'); sessionStorage.removeItem(PENDING_KEY); } catch { return; }
  if (!pending?.context || pending.version !== LEGAL_VERSION || Date.now() - (pending.at ?? 0) > 30 * 60_000) return;
  await recordAgreement(userId, pending.context);
}
