import { Card } from '@/components/ui/card';
import { Globe, Users, ShoppingBag, Heart } from 'lucide-react';
import { useEffect, useState } from 'react';

const impactStats = [
  { icon: Heart, value: '$2.5M+', label: 'Total Donated', color: 'text-primary' },
  { icon: Users, value: '15,000+', label: 'Families Helped', color: 'text-gold' },
  { icon: ShoppingBag, value: '50,000+', label: 'Coupons Delivered', color: 'text-primary' },
  { icon: Globe, value: '25+', label: 'Countries Reached', color: 'text-gold' },
];

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
  return (
    <section className="py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-2 rounded-full mb-6">
            <Globe className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Global Impact</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-foreground">See the </span>
            <span className="text-gradient-emerald">Real Impact</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Every donation creates a ripple effect. Watch how your generosity transforms lives across the globe.
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
                <AnimatedNumber value={stat.value} />
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </Card>
          ))}
        </div>

      </div>
    </section>
  );
}
