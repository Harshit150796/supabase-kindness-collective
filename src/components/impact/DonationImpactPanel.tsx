import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Separator } from '@/components/ui/separator';
import { DonorImpactView, type DonationImpact } from '@/components/impact/DonorImpactView';

/** Signed-in donor's per-donation impact timeline (fundraiser donations only). */
export function DonationImpactPanel({ donationId }: { donationId: string }) {
  const [impact, setImpact] = useState<DonationImpact | null>(null);
  useEffect(() => {
    let live = true;
    setImpact(null);
    (supabase.rpc as any)('get_donation_impact', { _donation_id: donationId }).then(({ data, error }: { data: DonationImpact | null; error: unknown }) => {
      if (live && !error && data?.fundraiser_id) setImpact(data);
    });
    return () => { live = false; };
  }, [donationId]);
  if (!impact) return null;
  return (
    <div className="pt-2">
      <Separator className="mb-4" />
      <p className="mb-3 font-display text-xl text-foreground">Your impact</p>
      <DonorImpactView impact={impact} mode="signed" />
    </div>
  );
}
