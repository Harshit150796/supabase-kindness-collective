import { supabase } from '@/integrations/supabase/client';

export type OptInSource = 'signup' | 'contact' | 'donate';

/** Records an explicit "Email me helpful updates" tick. Never throws; never blocks the form. */
export async function recordUpdatesConsent(email: string, source: OptInSource) {
  try {
    let distinctId: string | null = null;
    try {
      const { default: posthog } = await import('posthog-js');
      distinctId = (posthog as any).__loaded ? posthog.get_distinct_id() : null;
    } catch { /* tracking not started */ }
    await supabase.functions.invoke('public-submit', {
      body: { action: 'consent', email: email.trim(), source, distinct_id: distinctId },
    });
  } catch (e) {
    console.error('updates opt-in failed', e);
  }
}

/** Unticked by default; the visitor must choose it. */
export function UpdatesOptIn({ checked, onChange, id = 'updates-opt-in' }: { checked: boolean; onChange: (v: boolean) => void; id?: string }) {
  return (
    <label htmlFor={id} className="flex min-h-11 cursor-pointer items-start gap-3 text-sm leading-snug text-muted-foreground">
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-5 w-5 shrink-0 accent-[hsl(var(--primary))]" />
      <span><span className="font-medium text-foreground">Email me helpful updates.</span> Occasional notes about CouponDonation. Unsubscribe any time.</span>
    </label>
  );
}
