import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Heart } from 'lucide-react';
import { popularBrands } from '@/data/brandLogos';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

const VOUCHER_GOAL = 1000;

interface LatestDonation {
  display_name: string;
  amount: number;
  brand_partner: string | null;
  created_at: string;
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

/** Relative age only while genuinely recent; otherwise an absolute date. */
function timeLabel(iso: string): { text: string; isRecent: boolean } {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const hour = 3_600_000;
  const day = 24 * hour;

  if (diff < hour) {
    const m = Math.max(1, Math.floor(diff / 60_000));
    return { text: `${m}m ago`, isRecent: true };
  }
  if (diff < day) return { text: `${Math.floor(diff / hour)}h ago`, isRecent: true };
  if (diff < 7 * day) return { text: `${Math.floor(diff / day)}d ago`, isRecent: true };

  return {
    text: new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    isRecent: false,
  };
}

export const HeroActivityStrip = () => {
  const reducedMotion = usePrefersReducedMotion();
  const [donation, setDonation] = useState<LatestDonation | null>(null);
  const [vouchers, setVouchers] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [filled, setFilled] = useState(false);
  const barRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const [recent, stats] = await Promise.all([
        supabase.rpc('get_recent_public_donations', { _limit: 1 }),
        supabase.rpc('get_impact_stats'),
      ]);
      if (cancelled) return;

      const row = (recent.data as any[] | null)?.[0];
      if (row) {
        setDonation({
          display_name: row.display_name,
          amount: Number(row.amount) || 0,
          brand_partner: row.brand_partner,
          created_at: row.created_at,
        });
      }

      const s = (stats.data as any[] | null)?.[0];
      if (s) setVouchers(Number(s.total_coupons) || 0);

      setLoading(false);
    };

    load();
    const poll = setInterval(load, 60_000);

    const channel = supabase
      .channel('hero-activity-strip')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'donations' },
        () => load(),
      )
      .subscribe();

    return () => {
      cancelled = true;
      clearInterval(poll);
      supabase.removeChannel(channel);
    };
  }, []);

  // Fill the bar once, when it first scrolls into view.
  useEffect(() => {
    if (vouchers === null) return;
    if (reducedMotion) {
      setFilled(true);
      return;
    }
    const el = barRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setFilled(true);
          io.disconnect();
        }
      },
      { rootMargin: '0px 0px -10% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [vouchers, reducedMotion]);

  const funded = vouchers ?? 0;
  const remaining = Math.max(0, VOUCHER_GOAL - funded);
  const percent = Math.min(100, (funded / VOUCHER_GOAL) * 100);
  const time = donation ? timeLabel(donation.created_at) : null;

  return (
    <section
      aria-label="Platform activity"
      className="relative bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 border-y border-border/50 overflow-hidden"
    >
      <div className="container mx-auto px-4 py-3 md:py-4">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)_auto] items-center gap-3 lg:gap-8">

          {/* Zone 1 — latest real donation */}
          <div className="min-w-0 flex justify-center lg:justify-start">
            {loading ? (
              <div className="h-[46px] w-full max-w-[320px] rounded-full bg-muted/50 animate-pulse" />
            ) : donation ? (
              <div className="flex items-center gap-2.5 min-w-0 w-full max-w-[340px] lg:max-w-none bg-background rounded-full pl-3 pr-3.5 py-2 border border-border/60 shadow-sm">
                <span className="relative flex-shrink-0">
                  <Heart className="w-4 h-4 text-primary fill-primary" />
                  {time?.isRecent && !reducedMotion && (
                    <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  )}
                </span>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground leading-none mb-0.5">
                    Latest donation
                  </div>
                  <p className="text-xs md:text-sm text-foreground truncate leading-tight">
                    <span className="font-semibold">{donation.display_name}</span>
                    <span className="text-muted-foreground"> · </span>
                    <span className="text-primary font-bold tabular-nums">${donation.amount}</span>
                    {donation.brand_partner && (
                      <span className="text-muted-foreground hidden sm:inline">
                        {' '}
                        {donation.brand_partner}
                      </span>
                    )}
                    {time && (
                      <span className="text-muted-foreground"> · {time.text}</span>
                    )}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">Vouchers are issued as donations arrive</div>
            )}
          </div>

          {/* Zone 2 — progress to goal */}
          <Link
            to="/donate"
            ref={barRef as any}
            className="group min-w-0 w-full rounded-xl px-1 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="flex items-baseline justify-between gap-3 mb-1.5">
              <span className="text-xs md:text-sm font-semibold text-foreground truncate">
                {loading ? 'Fund 1,000 grocery vouchers' : `${remaining.toLocaleString()} vouchers to go`}
              </span>
              <span className="text-[11px] md:text-xs text-muted-foreground tabular-nums flex-shrink-0">
                {funded.toLocaleString()} of {VOUCHER_GOAL.toLocaleString()} funded
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative h-2.5 flex-1 min-w-[120px] rounded-full bg-muted overflow-hidden">
                {/* milestone ticks */}
                {[25, 50, 75].map((t) => (
                  <span
                    key={t}
                    className="absolute top-0 bottom-0 w-px bg-border"
                    style={{ left: `${t}%` }}
                  />
                ))}
                <div
                  className={cn(
                    'relative h-full rounded-full bg-gradient-to-r from-primary to-accent',
                    !reducedMotion && 'transition-[width] duration-[900ms] ease-out',
                  )}
                  style={{ width: filled ? `${percent}%` : '0%' }}
                >
                  {!reducedMotion && (
                    <span className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-primary-foreground/30 to-transparent animate-sheen-once" />
                  )}
                </div>
              </div>

              <span className="hidden sm:inline-flex items-center gap-1 flex-shrink-0 rounded-full bg-primary text-primary-foreground text-xs font-semibold px-3 py-1.5 shadow-sm transition-transform group-hover:translate-x-0.5">
                Fund the next voucher
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>

            <span className="sm:hidden mt-2 flex items-center justify-center gap-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold px-3 py-2 shadow-sm">
              Fund the next voucher
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>

          {/* Zone 3 — retailer rail (desktop) */}
          <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground whitespace-nowrap">
              Redeemable at
            </span>
            <div
              className="flex gap-3 overflow-hidden w-[168px]"
              style={{
                maskImage: 'linear-gradient(to right, black 80%, transparent)',
                WebkitMaskImage: 'linear-gradient(to right, black 80%, transparent)',
              }}
            >
              <div className={cn('flex gap-3 w-max', !reducedMotion && 'animate-marquee')}>
                {[...popularBrands, ...popularBrands].map((brand, i) => (
                  <div
                    key={`d-${brand.name}-${i}`}
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

        {/* Retailer rail — mobile / tablet */}
        <div className="lg:hidden mt-2.5">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground text-center mb-1.5">
            Redeemable at
          </div>
          <div
            aria-hidden="true"
            className="-mx-4 overflow-hidden"
            style={{
              maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
              WebkitMaskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
            }}
          >
            <div className={cn('flex gap-3 w-max px-4', !reducedMotion && 'animate-marquee')}>
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
      </div>
    </section>
  );
};
