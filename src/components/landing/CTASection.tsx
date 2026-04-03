import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Building2, Coins, Heart, Users, ShieldCheck, Lock, Eye } from 'lucide-react';
import earthHeartLogo from '@/assets/earth-heart-logo.png';

export function CTASection() {
  const navigate = useNavigate();

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gold/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative">
        {/* Earth-Heart Centerpiece */}
        <div className="flex flex-col items-center mb-16 animate-fade-in">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/10 rounded-full blur-3xl scale-150" />
            <img
              src={earthHeartLogo}
              alt="CouponDonation — Transparent & Secure Giving"
              className="relative w-[200px] md:w-[280px] h-auto drop-shadow-2xl"
            />
          </div>

          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mt-8 text-center">
            Transparent & Secure Donations
          </h2>
          <p className="text-muted-foreground mt-3 text-center max-w-lg text-base md:text-lg">
            Every dollar tracked. Every family helped. Zero hidden fees.
          </p>

          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>100% Transparent</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-primary" />
              <span>Secure Payments</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-primary" />
              <span>Track Your Impact</span>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* For Donors */}
          <Card className="p-6 md:p-8 lg:p-10 bg-primary text-primary-foreground border-0 hover:shadow-emerald transition-shadow">
            <div className="w-14 h-14 rounded-2xl bg-primary-foreground/20 flex items-center justify-center mb-6">
              <Heart className="w-7 h-7" />
            </div>
            <h3 className="text-2xl md:text-3xl font-bold mb-4">For Donors</h3>
            <p className="text-primary-foreground/80 mb-8 leading-relaxed">
              Start your giving journey today. Every donation earns Gold Coins and creates real impact for families in need.
            </p>
            <div className="flex items-center gap-4 mb-8">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5" />
                <span className="text-sm">Earn Gold Coins</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span className="text-sm">15K+ Families Helped</span>
              </div>
            </div>
            <Button 
              size="lg"
              variant="secondary"
              className="w-full gap-2"
              onClick={() => navigate('/donate')}
            >
              Start Donating
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Card>

          {/* For Companies */}
          <Card className="p-6 md:p-8 lg:p-10 border-2 border-gold/20 bg-card hover:shadow-gold transition-shadow">
            <div className="w-14 h-14 rounded-2xl bg-gold/10 flex items-center justify-center mb-6">
              <Building2 className="w-7 h-7 text-gold" />
            </div>
            <h3 className="text-2xl md:text-3xl font-bold mb-4 text-foreground">For Companies</h3>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Partner with us to amplify your social impact. Join DoorDash, Uber, and 50+ brands making a difference.
            </p>
            <div className="flex items-center gap-4 mb-8 text-foreground flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xl">🚗</span>
                <span className="text-sm">DoorDash</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl">🛒</span>
                <span className="text-sm">Walmart</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl">🚕</span>
                <span className="text-sm">Uber</span>
              </div>
            </div>
            <Button 
              size="lg"
              variant="outline"
              className="w-full gap-2 border-gold text-gold hover:bg-gold hover:text-gold-foreground"
              onClick={() => navigate('/about')}
            >
              Partner With Us
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Card>
        </div>

        {/* Bottom tagline */}
        <div className="text-center mt-16">
          <p className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground">
            Together, we've helped <span className="text-gradient-gold">15,000+ families</span> worldwide.
          </p>
          <p className="text-muted-foreground mt-2">Join the movement today.</p>
        </div>
      </div>
    </section>
  );
}
