import { TrendingUp, Users, Globe, Award } from 'lucide-react';

const stats = [
  { icon: TrendingUp, value: '$2.5M+', label: 'Total Value Donated', sublabel: 'And growing daily' },
  { icon: Users, value: '15,000+', label: 'Families Supported', sublabel: 'Across 25 countries' },
  { icon: Globe, value: '50+', label: 'Partner Brands', sublabel: 'Trusted retailers' },
  { icon: Award, value: '98%', label: 'Satisfaction Rate', sublabel: 'From recipients' },
];

export function ImpactSection() {
  return (
    <section className="py-20 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Our Collective Impact
          </h2>
          <p className="text-primary-foreground/80 max-w-2xl mx-auto">
            Together, our community of donors and partners is making a measurable difference in lives around the world.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div 
              key={stat.label}
              className="text-center p-6 rounded-2xl bg-primary-foreground/10 backdrop-blur"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary-foreground/20 flex items-center justify-center mx-auto mb-4">
                <stat.icon className="w-7 h-7" />
              </div>
              <div className="text-4xl font-bold mb-2">{stat.value}</div>
              <div className="font-medium mb-1">{stat.label}</div>
              <div className="text-sm text-primary-foreground/70">{stat.sublabel}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
