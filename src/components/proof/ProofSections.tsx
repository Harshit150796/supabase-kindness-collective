import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usd } from '@/hooks/useFundraiserLive';
import { FundraiserImageFallback, transformedFundraiserImage } from '@/lib/fundraiserImages';
import { ImageReveal, LineReveal, Reveal } from '@/components/ui/editorial-motion';

const sb = supabase as any;

export interface CompletedFundraiser { id: string; title: string; unique_slug: string; category: string; cover_photo_url: string | null; goal: number; raised: number; coupons_issued: number; coupons_redeemed: number }

export function useCompletedFundraisers() {
  return useQuery({ queryKey: ['completed-fundraisers'], queryFn: async () => {
    const { data, error } = await sb.rpc('get_completed_fundraisers'); if (error) throw error; return (data ?? []) as CompletedFundraiser[];
  }, staleTime: 60_000 });
}
export function useProofStats() {
  return useQuery({ queryKey: ['proof-stats'], queryFn: async () => {
    const { data, error } = await sb.rpc('get_proof_stats'); if (error) throw error;
    return data as { issued_value_month: number; redeemed_month: number; issued_value_total: number; redeemed_total: number };
  }, staleTime: 60_000 });
}

/** Completed campaigns with real totals; renders nothing when none exist. */
export function CompletedCampaigns({ limit, compact = false }: { limit?: number; compact?: boolean }) {
  const { data } = useCompletedFundraisers();
  if (!data?.length) return null;
  const rows = limit ? data.slice(0, limit) : data;
  return (
    <section className="bg-primary/5 py-16 md:py-20" aria-labelledby="completed-heading">
      <div className="container mx-auto px-4">
        <LineReveal><h2 id="completed-heading" className="font-display text-4xl md:text-5xl">Completed campaigns</h2></LineReveal>
        <Reveal><p className="mt-3 max-w-xl text-muted-foreground">Fundraisers that reached their goal, with totals from completed donations and issued coupons.</p></Reveal>
        <div className={`mt-10 grid gap-8 ${compact ? 'md:grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
          {rows.map((f, index) => (
            <Reveal key={f.id} delay={index * 0.06}><Link to={`/f/${f.unique_slug}`} className="group block">
              <ImageReveal className="aspect-[16/10] bg-muted">{f.cover_photo_url ? <img src={transformedFundraiserImage(f.cover_photo_url, 800) ?? f.cover_photo_url} alt={f.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]" /> : <FundraiserImageFallback category={f.category} />}</ImageReveal>
              <h3 className="mt-4 line-clamp-2 font-display text-2xl group-hover:underline">{f.title}</h3>
              <dl className="mt-3 grid grid-cols-3 gap-2 text-sm tabular-nums">
                <div><dt className="text-muted-foreground">Raised</dt><dd className="font-semibold">{usd(Number(f.raised))}</dd></div>
                {Number(f.coupons_issued) > 0 && <div><dt className="text-muted-foreground">Coupons issued</dt><dd className="font-semibold">{f.coupons_issued}</dd></div>}
                {Number(f.coupons_redeemed) > 0 && <div><dt className="text-muted-foreground">Redeemed</dt><dd className="font-semibold">{f.coupons_redeemed}</dd></div>}
              </dl>
            </Link></Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Site-wide aggregate proof figures; zero figures are omitted, whole band hidden if all zero. */
export function ProofFigures() {
  const { data } = useProofStats();
  const items = [
    { label: 'Value of coupons issued this month', v: data?.issued_value_month, money: true },
    { label: 'Coupons redeemed this month', v: data?.redeemed_month },
    { label: 'Value of coupons issued to date', v: data?.issued_value_total, money: true },
    { label: 'Coupons redeemed to date', v: data?.redeemed_total },
  ].filter((i) => Number(i.v) > 0);
  if (!items.length) return null;
  return (
    <section className="py-12" aria-label="Coupon totals">
      <div className="container mx-auto grid gap-6 px-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((i) => (
          <div key={i.label} className="border-t border-border pt-4"><p className="font-display text-5xl tabular-nums">{i.money ? usd(Number(i.v)) : Number(i.v).toLocaleString()}</p><p className="mt-1 text-sm text-muted-foreground">{i.label}</p></div>
        ))}
      </div>
    </section>
  );
}
