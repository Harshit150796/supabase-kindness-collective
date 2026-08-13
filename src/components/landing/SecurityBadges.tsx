import { Shield, ShieldCheck, Lock, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

type TrustBadge = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  sublabel?: string;
  description?: string;
  featured?: boolean;
};

const trustBadges: TrustBadge[] = [
  { icon: Lock, label: 'SSL Secure', sublabel: '256-bit encryption' },
  {
    icon: ShieldCheck,
    label: 'Verified Secure Platform',
    description:
      'Operating as a B2B2C technology provider, we utilize a zero-trust architecture to convert funds directly into restricted digital retail vouchers, ensuring complete transparency and zero cash disbursements.',
    featured: true,
  },
  { icon: CheckCircle2, label: 'PCI Compliant', sublabel: 'Secure payments' },
];

export function SecurityBadges() {
  return (
    <section className="py-16 bg-background border-t border-border">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary/70 mb-2">
              Platform Security
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Your Security Matters
            </h2>
            <p className="text-muted-foreground">
              Your donations are protected by industry-leading security standards
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-stretch">
            {trustBadges.map((badge) => {
              const Icon = badge.icon;
              return (
                <Card
                  key={badge.label}
                  className={[
                    'p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg',
                    badge.featured ? 'flex flex-col items-center' : 'flex flex-col items-center justify-center',
                  ].join(' ')}
                >
                  <div className="w-14 h-14 rounded-full bg-primary/10 ring-1 ring-primary/15 flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-7 h-7 text-primary" />
                  </div>
                  <div className="font-semibold text-foreground text-lg mb-1">
                    {badge.label}
                  </div>
                  {badge.sublabel && (
                    <div className="text-sm text-muted-foreground">{badge.sublabel}</div>
                  )}
                  {badge.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed mt-2 max-w-md mx-auto">
                      {badge.description}
                    </p>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
