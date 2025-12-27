import { Card } from '@/components/ui/card';
import { Building2, CheckCircle } from 'lucide-react';

const partners = [
  { name: 'DoorDash', emoji: '🚗', contribution: '$450K+', category: 'Food Delivery' },
  { name: 'Uber', emoji: '🚕', contribution: '$320K+', category: 'Transportation' },
  { name: 'Walmart', emoji: '🛒', contribution: '$380K+', category: 'Groceries' },
  { name: 'Amazon', emoji: '📦', contribution: '$290K+', category: 'Shopping' },
  { name: 'Target', emoji: '🎯', contribution: '$250K+', category: 'Retail' },
  { name: 'Starbucks', emoji: '☕', contribution: '$210K+', category: 'Food & Drink' },
  { name: 'Nike', emoji: '👟', contribution: '$180K+', category: 'Apparel' },
  { name: 'CVS', emoji: '💊', contribution: '$160K+', category: 'Healthcare' },
];

const trustBadges = [
  '100% Donation Transparency',
  'Verified Recipients',
  'Secure Transactions',
  'Real-time Tracking',
];

export function PartnerBrands() {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-2 rounded-full mb-6">
            <Building2 className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Trusted Partners</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-foreground">World-Leading </span>
            <span className="text-gradient-gold">Brands</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Join 50+ industry leaders making a difference. Your donation is backed by the world's most trusted companies.
          </p>
        </div>

        {/* Partners Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto mb-16">
          {partners.map((partner) => (
            <Card 
              key={partner.name}
              className="p-6 text-center hover:shadow-card-hover transition-all duration-300 group cursor-pointer"
            >
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">{partner.emoji}</div>
              <div className="font-bold text-foreground mb-1">{partner.name}</div>
              <div className="text-xs text-muted-foreground mb-2">{partner.category}</div>
              <div className="text-sm font-semibold text-primary">{partner.contribution}</div>
            </Card>
          ))}
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap justify-center gap-4 md:gap-8">
          {trustBadges.map((badge) => (
            <div key={badge} className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">{badge}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
