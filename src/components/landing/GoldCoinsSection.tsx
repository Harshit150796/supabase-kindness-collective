import { Card } from '@/components/ui/card';
import { Coins, Gift, Award, ShoppingBag, Sparkles } from 'lucide-react';

const benefits = [
  {
    icon: Gift,
    title: 'Redeem for Coupons',
    description: 'Convert your Gold Coins into coupons from partner brands',
  },
  {
    icon: Award,
    title: 'Exclusive Badges',
    description: 'Earn recognition badges for your generous contributions',
  },
  {
    icon: ShoppingBag,
    title: 'Partner Perks',
    description: 'Access exclusive deals and discounts from our partners',
  },
];

export function GoldCoinsSection() {
  return (
    <section className="py-24 bg-gradient-to-b from-background to-secondary/20 relative overflow-hidden">
      {/* Floating coins decoration */}
      <div className="absolute top-20 left-[10%] text-5xl opacity-10 float">🪙</div>
      <div className="absolute top-40 right-[15%] text-4xl opacity-15 float" style={{ animationDelay: '1s' }}>🪙</div>
      <div className="absolute bottom-32 left-[20%] text-3xl opacity-10 float" style={{ animationDelay: '3s' }}>🪙</div>
      
      <div className="container mx-auto px-4 relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          {/* Content */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/20 px-4 py-2 rounded-full">
              <Coins className="w-4 h-4 text-gold" />
              <span className="text-sm font-medium text-gold">Reward System</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold">
              <span className="text-foreground">Earn </span>
              <span className="text-gradient-gold">Gold Coins</span>
              <br />
              <span className="text-foreground">With Every Donation</span>
            </h2>
            
            <p className="text-lg text-muted-foreground leading-relaxed">
              Your generosity doesn't go unnoticed. Every dollar you donate earns you Gold Coins — 
              our platform currency that unlocks exclusive rewards and benefits.
            </p>

            {/* Conversion rate */}
            <Card className="p-6 bg-gold/5 border-gold/20">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-gold/20 flex items-center justify-center">
                  <Coins className="w-8 h-8 text-gold" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Conversion Rate</div>
                  <div className="text-2xl font-bold text-foreground">
                    $1 = <span className="text-gold">10 Gold Coins</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Benefits */}
            <div className="space-y-4">
              {benefits.map((benefit) => (
                <div key={benefit.title} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">{benefit.title}</div>
                    <div className="text-sm text-muted-foreground">{benefit.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Visual */}
          <div className="relative flex justify-center">
            {/* Large coin */}
            <div className="relative">
              <div className="w-64 h-64 md:w-80 md:h-80 rounded-full gold-shine flex items-center justify-center pulse-glow">
                <div className="text-center">
                  <div className="text-6xl md:text-7xl mb-2">🪙</div>
                  <div className="text-xl font-bold text-gold-foreground">GOLD</div>
                  <div className="text-sm text-gold-foreground/80">COIN</div>
                </div>
              </div>
              
              {/* Orbiting elements */}
              <div className="absolute -top-4 -right-4 animate-bounce-subtle">
                <div className="w-16 h-16 bg-card rounded-xl shadow-lg flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-gold" />
                </div>
              </div>
              
              <div className="absolute -bottom-4 -left-4 animate-bounce-subtle" style={{ animationDelay: '0.5s' }}>
                <div className="w-14 h-14 bg-card rounded-xl shadow-lg flex items-center justify-center">
                  <Gift className="w-7 h-7 text-primary" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
