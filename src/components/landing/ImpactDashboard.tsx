import { Card } from '@/components/ui/card';
import { Globe, Users, ShoppingBag, Heart, Store } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLandingStats } from '@/hooks/useLandingStats';
import { popularBrands } from '@/data/brandLogos';

function AnimatedNumber({ value }: { value: string }) {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <span className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      {value}
    </span>
  );
}

export function ImpactDashboard() {
  const stats = useLandingStats();
  const impactStats = [
    { icon: ShoppingBag, value: stats ? stats.coupons_created.toLocaleString() : null, label: 'Coupons Created', color: 'text-primary' },
    // Families Helped appears only once coupons are genuinely claimed.
    stats && stats.coupons_claimed > 0
      ? { icon: Users, value: stats.coupons_claimed.toLocaleString(), label: 'Coupons Claimed', color: 'text-gold' }
      : { icon: Heart, value: stats ? stats.active_fundraisers.toLocaleString() : null, label: 'Active Fundraisers', color: 'text-gold' },
    { icon: Store, value: String(popularBrands.length), label: 'Retailers Available', color: 'text-primary' },
    { icon: Globe, value: 'US', label: 'Communities Served', color: 'text-gold' },
  ];
  return (
    <section className="py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-2 rounded-full mb-6">
            <Globe className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Community Impact</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-foreground">See the </span>
            <span className="text-gradient-emerald">Real Impact</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Every donation creates a ripple effect. Watch how your generosity transforms lives in communities across the United States.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto mb-12">
          {impactStats.map((stat, i) => (
            <Card 
              key={i}
              className="p-6 text-center hover:shadow-card-hover transition-all duration-300 group"
            >
              <div className={`w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                <stat.icon className={`w-7 h-7 ${stat.color}`} />
              </div>
              <div className={`text-3xl md:text-4xl font-bold mb-1 ${stat.color}`}>
                {stat.value === null ? (
                  <span className="inline-block h-9 w-16 rounded bg-muted animate-pulse" />
                ) : (
                  <AnimatedNumber value={stat.value} />
                )}
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </Card>
          ))}
        </div>

      </div>
    </section>
  );
}
