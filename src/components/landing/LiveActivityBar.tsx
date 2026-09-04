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

      <div className="container mx-auto px-4 py-3 md:py-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4 min-h-[44px]">

          {/* Latest donation (real, from the database) */}
          <div className="flex items-center min-w-0 w-full md:w-auto justify-center md:justify-start min-h-[32px]">
            {currentDonation && <DonationPill donation={currentDonation} />}
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-4 md:gap-6">
            <div className="flex items-center gap-1.5 md:gap-2">
              <Users className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary" />
              <span className="text-xs md:text-sm text-muted-foreground">
                <span className="font-semibold text-foreground tabular-nums">{donationCount.toLocaleString()}</span>
                <span className="hidden sm:inline"> donations</span>
              </span>
            </div>

            <div className="flex items-center gap-1.5 md:gap-2">
              <TrendingUp className="w-3.5 h-3.5 md:w-4 md:h-4 text-green-500" />
              <span className="text-xs md:text-sm text-muted-foreground">
                <span className="font-semibold text-foreground tabular-nums">${amountRaised.toLocaleString()}</span>
                <span className="hidden sm:inline"> raised to date</span>
              </span>
            </div>
          </div>

          {/* Scrolling Brand Logos — desktop inline */}
          <div className="hidden lg:flex items-center gap-3 overflow-hidden max-w-xs">
            <div className="flex gap-4 overflow-hidden">
              <div className="flex gap-4 animate-marquee">
                {popularBrands.slice(0, 6).map((brand) => (
                  <div
                    key={brand.name}
                    className="flex items-center justify-center w-8 h-8 rounded-full bg-background border border-border/50 shadow-sm flex-shrink-0"
                    title={brand.name}
                  >
                    <img src={brand.logo} alt={brand.name} className="w-5 h-5 object-contain" />
                  </div>
                ))}
                {popularBrands.slice(0, 6).map((brand) => (
                  <div
                    key={`${brand.name}-dup`}
                    className="flex items-center justify-center w-8 h-8 rounded-full bg-background border border-border/50 shadow-sm flex-shrink-0"
                    title={brand.name}
                  >
                    <img src={brand.logo} alt={brand.name} className="w-5 h-5 object-contain" />
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
    <div className="flex items-center gap-3 md:gap-3.5 bg-background rounded-full pl-4 pr-5 md:pl-5 md:pr-7 py-2.5 md:py-3 border border-border/40 shadow-[0_6px_24px_-12px_rgba(0,0,0,0.18)] max-w-full">
      <Heart className="w-5 h-5 md:w-[22px] md:h-[22px] text-primary fill-primary flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-[10px] md:text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground leading-none mb-1">
          Latest donation
        </p>
        <p className="text-sm md:text-base leading-tight whitespace-nowrap truncate">
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

