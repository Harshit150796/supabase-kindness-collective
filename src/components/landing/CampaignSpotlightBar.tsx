import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useImpactStats, useSpotlightCampaign, useVoucherGoal } from '@/hooks/useSpotlight';

const money = (n: number) =>
  `$${Math.round(n).toLocaleString('en-US')}`;

/** Fills the rail once the bar scrolls into view (and immediately if already visible). */
function useRevealed<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setRevealed(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setRevealed(true);
          io.disconnect();
        }
      },
      { rootMargin: '0px 0px -10% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return { ref, revealed };
}

export const CampaignSpotlightBar = () => {
  const { data: stats, isLoading: statsLoading } = useImpactStats();
  const { data: campaign } = useSpotlightCampaign();
  const goal = useVoucherGoal();
  const { ref, revealed } = useRevealed<HTMLDivElement>();

  const funded = stats?.total_coupons ?? 0;
  const remaining = Math.max(goal - funded, 0);
  const pct = goal > 0 ? Math.min((funded / goal) * 100, 100) : 0;

  const campaignPct =
    campaign && campaign.goal > 0
      ? Math.min((campaign.raised / campaign.goal) * 100, 100)
      : 0;

  return (
    <section
      aria-label="Community voucher goal"
      className="relative border-b border-border/40 bg-gradient-to-r from-primary/[0.06] via-background to-accent/[0.07]"
    >
      <div className="container mx-auto px-4 py-4 md:py-5">
        <div
          ref={ref}
          className="grid gap-4 md:gap-6 lg:gap-8 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,auto)_auto] lg:items-center"
        >
          {/* 1 — Community goal + real progress */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Ticket className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
                Community goal
              </span>
            </div>

            <p className="mt-1 text-sm md:text-base font-semibold text-foreground truncate">
              Fund {goal.toLocaleString('en-US')} grocery vouchers for US families
            </p>

            <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full bg-gradient-to-r from-primary to-accent',
                  'transition-[width] duration-1000 ease-out motion-reduce:transition-none',
                )}
                style={{ width: `${revealed && !statsLoading ? pct : 0}%` }}
              />
            </div>

            <p className="mt-1.5 text-xs text-muted-foreground tabular-nums">
              {statsLoading ? (
                <span className="inline-block h-3 w-40 rounded bg-muted animate-pulse align-middle" />
              ) : (
                <>
                  <span className="font-semibold text-foreground">
                    {funded.toLocaleString('en-US')}
                  </span>{' '}
                  of {goal.toLocaleString('en-US')} funded
                  <span className="mx-1.5 text-border">·</span>
                  {remaining.toLocaleString('en-US')} to go
                </>
              )}
            </p>
          </div>

          {/* 2 — Spotlighted campaign */}
          {campaign && (
            <Link
              to={`/f/${campaign.slug}`}
              className={cn(
                'group min-w-0 flex items-center gap-3 rounded-xl border border-border/60 bg-background/70 backdrop-blur-sm',
                'px-3 py-2.5 transition-colors hover:bg-background hover:border-primary/40',
                'lg:border-transparent lg:bg-transparent lg:backdrop-blur-none lg:hover:bg-background/70',
              )}
            >
              <div className="w-11 h-11 rounded-lg overflow-hidden bg-muted/40 flex-shrink-0">
                {campaign.image ? (
                  <img
                    src={campaign.image}
                    alt=""
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Ticket className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
              </div>

              <div className="min-w-0 lg:max-w-[15rem]">
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Spotlight
                </div>
                <div className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                  {campaign.title}
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <div className="h-1 w-16 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary/70 transition-[width] duration-1000 ease-out motion-reduce:transition-none"
                      style={{ width: `${revealed ? campaignPct : 0}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-muted-foreground tabular-nums whitespace-nowrap">
                    {money(campaign.raised)} of {money(campaign.goal)}
                  </span>
                </div>
              </div>

              <ArrowRight className="hidden lg:block w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </Link>
          )}

          {/* 3 — Single action */}
          <div className="flex flex-col items-stretch lg:items-end gap-1">
            <Button asChild size="sm" className="w-full lg:w-auto">
              <Link to="/donate">Fund the next voucher</Link>
            </Button>
            <span className="text-[11px] text-muted-foreground text-center lg:text-right">
              $5 = one grocery voucher
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
