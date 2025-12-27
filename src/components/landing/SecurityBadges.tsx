import { Shield, Lock, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

const trustBadges = [
  { icon: Lock, label: 'SSL Secure', sublabel: '256-bit encryption' },
  { icon: Shield, label: 'Verified 501(c)(3)', sublabel: 'Tax-deductible' },
  { icon: CheckCircle2, label: 'PCI Compliant', sublabel: 'Secure payments' },
];

export function SecurityBadges() {
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Your Security Matters
            </h2>
            <p className="text-muted-foreground">
              Your donations are protected by industry-leading security standards
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {trustBadges.map((badge) => (
              <Card 
                key={badge.label}
                className="p-6 text-center hover:shadow-lg transition-shadow"
              >
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <badge.icon className="w-7 h-7 text-primary" />
                </div>
                <div className="font-semibold text-foreground text-lg mb-1">{badge.label}</div>
                <div className="text-sm text-muted-foreground">{badge.sublabel}</div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
