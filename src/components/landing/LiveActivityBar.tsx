import { memo, useEffect, useState } from 'react';
import { Heart, TrendingUp, Users } from 'lucide-react';
import { popularBrands } from '@/data/brandLogos';
import { supabase } from '@/integrations/supabase/client';

interface DonationEvent {
  id: string;
  name: string;
  amount: number;
  brand: string;
  createdAt: string;
}

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

export const LiveActivityBar = () => {
  const [currentDonation, setCurrentDonation] = useState<DonationEvent | null>(null);
  // Fixed baseline figures — no simulated growth.
  const donationCount = 24;
  const amountRaised = 1250;

  // Real most-recent donation from the database; refreshed quietly every 60s.
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const { data, error } = await supabase.rpc('get_recent_public_donations', { _limit: 1 });
      if (cancelled || error || !data || data.length === 0) return;
      const row = data[0];
      setCurrentDonation({
        id: row.id,
        name: row.display_name || 'A supporter',
        amount: Number(row.amount) || 0,
        brand: row.brand_partner || '',
        createdAt: row.created_at,
      });
    };

    load();
    const interval = setInterval(load, 60000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);


  return (
    <section className="relative bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 border-y border-border/50 overflow-hidden">
      {/* Animated tint only on desktop — kept off mobile for stable rendering */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-accent/10 opacity-50 hidden md:block md:animate-pulse" />

      <div className="container mx-auto px-4 py-1.5 md:py-2">
        <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 min-h-[40px]">

          {/* Latest donation (real, from the database) — anchored left */}
          <div className="flex items-center min-w-0 w-full md:w-auto md:flex-1 justify-center md:justify-start min-h-[32px]">
            {currentDonation && <DonationPill donation={currentDonation} />}
          </div>

          {/* Quick Stats — optically centered */}
          <div className="flex items-center justify-center gap-2.5 md:gap-3 flex-shrink-0">
            <div className="flex items-center gap-1.5 md:gap-2">
              <Users className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary" />
              <span className="text-xs md:text-sm text-muted-foreground whitespace-nowrap">
                <span className="font-semibold text-foreground tabular-nums">{donationCount.toLocaleString()}</span>
                <span className="hidden sm:inline"> donations</span>
              </span>
            </div>

            <span aria-hidden="true" className="h-4 w-px bg-border/70" />

            <div className="flex items-center gap-1.5 md:gap-2">
              <TrendingUp className="w-3.5 h-3.5 md:w-4 md:h-4 text-green-500" />
              <span className="text-xs md:text-sm text-muted-foreground whitespace-nowrap">
                <span className="font-semibold text-foreground tabular-nums">${amountRaised.toLocaleString()}</span>
                <span className="hidden sm:inline"> raised to date</span>
              </span>
            </div>
          </div>

          {/* Redeemable-at label + scrolling brand logos — pinned to the right edge */}
          <div className="hidden lg:flex items-center justify-end gap-2.5 flex-1 min-w-0">
            <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground/80 whitespace-nowrap flex-shrink-0">
              Redeemable at
            </span>
            <div
              className="overflow-hidden max-w-[180px]"
              style={{
                maskImage: 'linear-gradient(to right, transparent, black 14%, black 100%)',
                WebkitMaskImage: 'linear-gradient(to right, transparent, black 14%, black 100%)',
              }}
            >
              <div className="flex gap-4 animate-marquee w-max">
                {[...popularBrands.slice(0, 4), ...popularBrands.slice(0, 4)].map((brand, i) => (
                  <div
                    key={`d-${brand.name}-${i}`}
                    className="flex items-center justify-center w-8 h-8 rounded-full bg-background border border-border/50 shadow-sm flex-shrink-0"
                    title={brand.name}
                  >
                    <img src={brand.logo} alt={i < 4 ? brand.name : ''} className="w-5 h-5 object-contain" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile-only brand marquee row */}
        <div
          aria-hidden="true"
          className="lg:hidden mt-2 -mx-4 overflow-hidden"
          style={{
            maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
            WebkitMaskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
          }}
        >
          <div className="flex gap-3 animate-marquee w-max px-4">
            {[...popularBrands, ...popularBrands].map((brand, i) => (
              <div
                key={`m-${brand.name}-${i}`}
                className="flex items-center justify-center w-7 h-7 rounded-full bg-background border border-border/50 shadow-sm flex-shrink-0"
              >
                <img src={brand.logo} alt="" className="w-4 h-4 object-contain" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// Memoised pill so the surrounding stats row and brand marquee don't reflow
// when the donation record refreshes.
const DonationPill = memo(function DonationPill({ donation }: { donation: DonationEvent }) {
  return (
    <div className="flex items-center gap-3 md:gap-3.5 bg-background rounded-full pl-3.5 pr-4 md:pl-4 md:pr-5 py-1 md:py-1.5 border border-border/40 shadow-[0_6px_24px_-12px_rgba(0,0,0,0.18)] max-w-full">
      <Heart className="w-4 h-4 md:w-[18px] md:h-[18px] text-primary fill-primary flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-[9px] md:text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground leading-none mb-0.5">
          Latest donation
        </p>
        <p className="text-xs md:text-sm leading-tight whitespace-nowrap truncate">
          <span className="font-bold text-foreground">{donation.name}</span>
          <span className="text-muted-foreground"> · </span>
          <span className="font-bold text-primary">${donation.amount}</span>
          {donation.brand && (
            <span className="text-muted-foreground"> {donation.brand}</span>
          )}
          <span className="text-muted-foreground"> · {shortDate(donation.createdAt)}</span>
        </p>
      </div>
    </div>
  );
});

