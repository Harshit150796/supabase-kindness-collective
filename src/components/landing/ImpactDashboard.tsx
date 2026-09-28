import { Heart, ShoppingBag, Users, CircleDollarSign } from 'lucide-react';
import { useLandingStats, formatUSD } from '@/hooks/useLandingStats';
import { CountUp, LineReveal, Reveal } from '@/components/ui/editorial-motion';

export function ImpactDashboard() {
  const stats = useLandingStats();
  const impactStats = stats ? [
    { icon: CircleDollarSign, value: stats.total_raised, label: 'Donated', currency: true },
    { icon: Heart, value: stats.donations_count, label: 'Completed Donations' },
    { icon: ShoppingBag, value: stats.coupons_created, label: 'Coupons Created' },
    { icon: Users, value: stats.coupons_claimed, label: 'Coupons Claimed' },
  ].filter((item) => item.value > 0) : [];
  return (
    <section className="bg-background py-24 md:py-36">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-12 max-w-3xl text-center md:mb-16">
          <LineReveal><h2 className="font-display text-5xl font-normal leading-none text-foreground md:text-6xl">The numbers, as they are.</h2></LineReveal>
          <Reveal delay={0.1} className="mt-5"><p className="text-lg text-muted-foreground">Only completed donations and coupons recorded by the platform appear here.</p></Reveal>
        </div>

        {/* Stats Grid */}
        <div className="mx-auto grid max-w-5xl grid-cols-2 border-y border-border lg:grid-cols-4 lg:divide-x lg:divide-border">
          {impactStats.map((stat, i) => (
            <Reveal
              key={i}
              delay={i * 0.07}
              className="border-b border-border p-6 text-center lg:border-b-0"
            >
              <stat.icon className="mx-auto mb-5 h-6 w-6 text-primary" />
              <div className="mb-1 font-display text-4xl text-foreground md:text-5xl">
                {stat.currency ? formatUSD(stat.value) : <CountUp value={stat.value} />}
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </Reveal>
          ))}
        </div>
        {stats && impactStats.length === 0 && <p className="mx-auto max-w-5xl border-y border-border py-10 text-center text-muted-foreground">Verified platform totals will appear after the first completed donation.</p>}

      </div>
    </section>
  );
}
