import { Shield, ShieldCheck, Lock, CheckCircle2 } from 'lucide-react';
import { LineReveal, Reveal } from '@/components/ui/editorial-motion';

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
    <section className="border-y border-border bg-background py-24 md:py-32">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="mx-auto mb-12 max-w-3xl text-center md:mb-16">
            <LineReveal><h2 className="font-display text-5xl font-normal leading-none text-foreground md:text-6xl">Security without shortcuts.</h2></LineReveal>
            <Reveal delay={0.1} className="mt-5"><p className="text-lg text-muted-foreground">
              Your donations are protected by industry-leading security standards
            </p></Reveal>
          </div>

          <div className="grid grid-cols-1 border-y border-border sm:grid-cols-3 sm:divide-x sm:divide-border">
            {trustBadges.map((badge) => {
              const Icon = badge.icon;
              return (
                <Reveal
                  key={badge.label}
                  className="flex flex-col items-center justify-center border-b border-border p-8 text-center last:border-b-0 sm:border-b-0"
                >
                  <div className="mb-5 flex h-12 w-12 items-center justify-center">
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
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
