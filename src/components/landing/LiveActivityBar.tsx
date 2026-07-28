import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Heart, ShieldCheck, TrendingUp, Users } from 'lucide-react';
import { popularBrands } from '@/data/brandLogos';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  relativeTime,
  usePublicDonationActivity,
  type PublicDonation,
} from '@/hooks/usePublicDonationActivity';

/**
 * Live activity strip.
 *
 * Every figure shown here is a real completed donation read from the database.
 * Nothing is simulated — when there is no activity yet the bar shows a neutral
 * "be the first" state rather than invented names or totals.
 */
export const LiveActivityBar = () => {
  const isMobile = useIsMobile();
  const { stats, recent } = usePublicDonationActivity();
  const [cursor, setCursor] = useState(0);
  const scrollingRef = useRef(false);

  // Track scroll activity on mobile so we can pause text rotation during swipes
  useEffect(() => {
    if (!isMobile) return;
    let timer: number | undefined;
    const onScroll = () => {
      scrollingRef.current = true;
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        scrollingRef.current = false;
      }, 250);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (timer) window.clearTimeout(timer);
    };
  }, [isMobile]);

  // Cycle through the real recent donations only — no synthetic events.
  useEffect(() => {
    if (recent.length < 2) return;
    const interval = setInterval(() => {
      if (scrollingRef.current) return;
      setCursor((c) => (c + 1) % recent.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [recent.length]);

  const current: PublicDonation | null = recent.length
    ? recent[cursor % recent.length]
    : null;

  // De-duplicated brand list so the marquee never repeats the same logo twice.
  const marqueeBrands = useMemo(() => {
    const seen = new Set<string>();
    return popularBrands.filter((b) => {
      const key = b.name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, []);

  const hasActivity = Boolean(stats && stats.donationsCount > 0);

  const formatTotal = (n: number) =>
    n >= 1000 ? `$${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}K` : `$${Math.round(n)}`;

  return (
    <section className="relative bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 border-y border-border/50 overflow-x-clip">
      {/* Animated tint only on desktop — kept off mobile for stable rendering */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-accent/10 opacity-50 hidden md:block md:animate-pulse" />

      <div className="container mx-auto px-4 py-3 md:py-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4 min-h-[44px]">

          {/* Donation feed — real events only */}
          <div className="flex items-center gap-2 md:gap-3 min-w-0 w-full md:w-auto justify-center md:justify-start min-h-[32px]">
            {current ? (
              <>
                <div className="relative flex-shrink-0">
                  <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-green-500 rounded-full md:animate-pulse" />
                  <div className="absolute inset-0 w-2.5 h-2.5 md:w-3 md:h-3 bg-green-500 rounded-full opacity-0 md:opacity-100 md:animate-ping" />
                </div>
                <span className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wider">
                  Live
                </span>
                <DonationPill donation={current} />
              </>
            ) : (
              <div className="flex items-center gap-2 rounded-full border border-border/50 bg-background px-3 py-1.5 shadow-sm">
                <Heart className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary fill-primary flex-shrink-0" />
                <p className="text-xs md:text-sm font-medium text-foreground whitespace-nowrap">
                  Be the first to fund groceries today
                </p>
              </div>
            )}
          </div>

          {/* Verified totals */}
          <div className="flex items-center gap-4 md:gap-6">
            <div className="flex items-center gap-1.5 md:gap-2">
              <ShieldCheck className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary" />
              <span className="text-xs md:text-sm text-muted-foreground whitespace-nowrap">
                Verified totals
              </span>
            </div>

            <div className="flex items-center gap-1.5 md:gap-2">
              <Users className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary" />
              <span className="text-xs md:text-sm text-muted-foreground">
                <span className="font-semibold text-foreground tabular-nums">
                  {hasActivity ? stats!.donationsCount.toLocaleString() : '—'}
                </span>
                <span className="hidden sm:inline"> donations</span>
              </span>
            </div>

            <div className="flex items-center gap-1.5 md:gap-2">
              <TrendingUp className="w-3.5 h-3.5 md:w-4 md:h-4 text-green-500" />
              <span className="text-xs md:text-sm text-muted-foreground">
                <span className="font-semibold text-foreground tabular-nums">
                  {hasActivity ? formatTotal(stats!.totalRaised) : '—'}
                </span>
                <span className="hidden sm:inline"> raised</span>
              </span>
            </div>
          </div>

          {/* Scrolling Brand Logos — desktop inline */}
          <div className="hidden lg:flex items-center gap-3 overflow-hidden max-w-xs">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Powered by</span>
            <div className="flex gap-4 overflow-hidden">
              <div className="flex gap-4 animate-marquee">
                {[...marqueeBrands.slice(0, 6), ...marqueeBrands.slice(0, 6)].map((brand, i) => (
                  <div
                    key={`d-${brand.name}-${i}`}
                    className="flex items-center justify-center w-8 h-8 rounded-full bg-background border border-border/50 shadow-sm flex-shrink-0"
                    title={brand.name}
                  >
                    <img
                      src={brand.logo}
                      alt={i < 6 ? brand.name : ''}
                      aria-hidden={i >= 6}
                      className="w-5 h-5 object-contain"
                      width={20}
                      height={20}
                      loading="lazy"
                      decoding="async"
                    />
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
            {[...marqueeBrands, ...marqueeBrands].map((brand, i) => (
              <div
                key={`m-${brand.name}-${i}`}
                className="flex items-center justify-center w-7 h-7 rounded-full bg-background border border-border/50 shadow-sm flex-shrink-0"
              >
                <img
                  src={brand.logo}
                  alt=""
                  className="w-4 h-4 object-contain"
                  width={16}
                  height={16}
                  loading="lazy"
                  decoding="async"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// Memoised pill so the surrounding stats row and brand marquee don't reflow
// every few seconds when only the donation event changes.
const DonationPill = memo(function DonationPill({ donation }: { donation: PublicDonation }) {
  return (
    <div className="flex items-center gap-2 bg-background md:bg-background/80 md:backdrop-blur-sm rounded-full px-3 md:px-4 py-1.5 md:py-2 border border-border/50 shadow-sm max-w-[280px] md:max-w-none">
      <Heart className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary fill-primary md:animate-pulse flex-shrink-0" />
      <div className="overflow-hidden">
        <p className="text-xs md:text-sm font-medium text-foreground whitespace-nowrap truncate">
          <span className="font-semibold">{donation.displayName}</span>
          {' donated '}
          <span className="text-primary font-bold">${Math.round(donation.amount)}</span>
          {donation.brand ? (
            <span className="hidden sm:inline">
              {' via '}
              <span className="text-muted-foreground">{donation.brand}</span>
            </span>
          ) : null}
        </p>
      </div>
      <span className="text-xs text-muted-foreground whitespace-nowrap hidden sm:inline">
        {relativeTime(donation.createdAt)}
      </span>
    </div>
  );
});
