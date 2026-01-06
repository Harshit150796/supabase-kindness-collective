import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Building2, Coins, Heart, Users } from 'lucide-react';

export function CTASection() {
  const navigate = useNavigate();

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gold/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative">
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* For Donors */}
          <Card className="p-6 md:p-8 bg-primary text-primary-foreground border-0 hover:shadow-emerald transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-primary-foreground/20 flex items-center justify-center mb-5">
              <Heart className="w-6 h-6" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold mb-3">For Donors</h3>
            <p className="text-primary-foreground/80 mb-6 leading-relaxed text-sm">
              Start your giving journey today. Every donation creates real impact for families in need.
            </p>
            <div className="flex items-center gap-3 mb-6 text-sm">
              <div className="flex items-center gap-1.5">
                <Coins className="w-4 h-4" />
                <span>Earn Gold Coins</span>
              </div>
            </div>
            <Button 
              size="lg"
              variant="secondary"
              className="w-full gap-2"
              onClick={() => navigate('/auth?mode=signup&role=donor')}
            >
              Start Donating
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Card>

          {/* For Recipients - NEW */}
          <Card className="p-6 md:p-8 border-2 border-emerald-500/20 bg-emerald-500/5 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-5">
              <Users className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold mb-3 text-foreground">Need Help?</h3>
            <p className="text-muted-foreground mb-6 leading-relaxed text-sm">
              Apply to receive grocery coupons or start a fundraising campaign for your family.
            </p>
            <div className="flex items-center gap-3 mb-6 text-sm text-foreground">
              <div className="flex items-center gap-1.5">
                <span className="text-lg">🛒</span>
                <span>Grocery Coupons</span>
              </div>
            </div>
            <Button 
              size="lg"
              className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => navigate('/apply')}
            >
              Apply Now
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Card>

          {/* For Companies */}
          <Card className="p-6 md:p-8 border-2 border-gold/20 bg-card hover:shadow-gold transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-gold/10 flex items-center justify-center mb-5">
              <Building2 className="w-6 h-6 text-gold" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold mb-3 text-foreground">For Companies</h3>
            <p className="text-muted-foreground mb-6 leading-relaxed text-sm">
              Partner with us to amplify your social impact. Join 50+ brands making a difference.
            </p>
            <div className="flex items-center gap-3 mb-6 text-sm text-foreground">
              <div className="flex items-center gap-1.5">
                <span className="text-lg">🚗</span>
                <span>DoorDash</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg">🛒</span>
                <span>Walmart</span>
              </div>
            </div>
            <Button 
              size="lg"
              variant="outline"
              className="w-full gap-2 border-gold text-gold hover:bg-gold hover:text-gold-foreground"
              onClick={() => navigate('/about')}
            >
              Partner With Us
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Card>
        </div>

        {/* Bottom tagline */}
        <div className="text-center mt-16">
          <p className="text-2xl md:text-3xl font-bold text-foreground">
            Together, we've helped <span className="text-gradient-gold">15,000+ families</span> worldwide.
          </p>
          <p className="text-muted-foreground mt-2">Join the movement today.</p>
        </div>
      </div>
    </section>
  );
}
