import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { SEO } from '@/components/SEO';
import { Skeleton } from '@/components/ui/skeleton';
import { callFn } from '@/lib/serverActions';
import { DonorImpactView, type DonationImpact } from '@/components/impact/DonorImpactView';

/** Read-only impact page for one donation, opened from a private, expiring email link. */
export default function ImpactLink() {
  const { token = '' } = useParams();
  const [state, setState] = useState<{ impact?: DonationImpact; email_hint?: string | null; error?: string } | null>(null);
  const sample = token === 'sample';

  useEffect(() => {
    if (sample) { setState({ error: 'This is the link from a sample email. Real emails open the donor’s own impact page here.' }); return; }
    callFn<{ impact: DonationImpact; email_hint: string | null }>('impact-actions', { action: 'guest_view', token })
      .then((r) => setState(r.error ? { error: r.error } : { impact: r.data!.impact, email_hint: r.data!.email_hint }));
  }, [token, sample]);

  return (
    <div className="min-h-dvh bg-background">
      <SEO title="Your impact | CouponDonation" description="Follow the coupons your donation created." noindex />
      <Navbar />
      <main className="mx-auto max-w-xl px-5 pb-20 pt-28">
        <h1 className="font-display text-4xl font-normal text-foreground">Your impact</h1>
        <div className="mt-6">
          {!state ? <div className="space-y-3"><Skeleton className="h-6 w-2/3" /><Skeleton className="h-40 w-full" /></div>
            : state.error ? <p className="text-muted-foreground">{state.error}</p>
            : <>
                <DonorImpactView impact={state.impact!} mode="guest" token={token} returnTo="/my-impact" />
                {state.email_hint && <p className="mt-6 text-xs text-muted-foreground">This private page belongs to the donor at {state.email_hint}. The link expires 30 days after the email was sent.</p>}
              </>}
        </div>
      </main>
      <Footer />
    </div>
  );
}
