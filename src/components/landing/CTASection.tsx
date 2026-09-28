import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Building2, Coins, Heart } from 'lucide-react';
import { LineReveal, Reveal } from '@/components/ui/editorial-motion';
import { brandLogos } from '@/data/brandLogos';

export function CTASection() {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden border-t border-border bg-background py-24 md:py-36">
      <div className="container relative mx-auto px-4">
        <div className="mx-auto mb-14 max-w-4xl text-center"><LineReveal><h2 className="font-display text-5xl font-normal leading-none text-foreground md:text-6xl">Help someone this week. Or ask for help yourself.</h2></LineReveal></div>
        <div className="mx-auto grid max-w-5xl border-y border-border md:grid-cols-2 md:divide-x md:divide-border">
          {/* For Donors */}
          <Reveal className="p-8 md:p-10 lg:p-12">
            <Heart className="mb-6 h-7 w-7 text-primary" />
            <h3 className="font-display text-3xl font-normal mb-4 text-foreground md:text-4xl">For donors</h3>
            <p className="mb-8 leading-relaxed text-muted-foreground">
              Choose a real need, decide where the coupon can be used, and keep the record.
            </p>
            <div className="flex items-center gap-4 mb-8">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5" />
                <span className="text-sm">Earn Gold Coins</span>
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
          </Reveal>

          {/* For Companies */}
          <Reveal delay={0.08} className="p-8 md:p-10 lg:p-12">
            <Building2 className="mb-6 h-7 w-7 text-verify" />
            <h3 className="font-display text-3xl font-normal mb-4 text-foreground md:text-4xl">For companies</h3>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Help fund restricted coupons through the retailers people already use.
            </p>
            <div className="flex items-center gap-4 mb-8 text-foreground flex-wrap">
              <div className="flex items-center gap-2">
                <img src={brandLogos.DoorDash?.logo} alt="" className="h-5 w-5 object-contain" />
                <span className="text-sm">DoorDash</span>
              </div>
              <div className="flex items-center gap-2">
                <img src={brandLogos.Walmart?.logo} alt="" className="h-5 w-5 object-contain" />
                <span className="text-sm">Walmart</span>
              </div>
              <div className="flex items-center gap-2">
                <img src={brandLogos.Uber?.logo} alt="" className="h-5 w-5 object-contain" />
                <span className="text-sm">Uber</span>
              </div>
            </div>
            <Button 
              size="lg"
              variant="outline"
              className="w-full gap-2 border-verify text-verify hover:bg-verify hover:text-verify-foreground"
              onClick={() => navigate('/about')}
            >
              Partner With Us
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
