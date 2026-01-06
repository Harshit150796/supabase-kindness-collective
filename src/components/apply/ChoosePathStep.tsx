import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, Gift, Megaphone, Check, Zap, Users, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ApplicationPath = 'coupons' | 'fundraiser';

interface ChoosePathStepProps {
  defaultValue?: ApplicationPath;
  onNext: (path: ApplicationPath) => void;
  onBack: () => void;
}

export function ChoosePathStep({ defaultValue, onNext, onBack }: ChoosePathStepProps) {
  const [selectedPath, setSelectedPath] = useState<ApplicationPath | null>(defaultValue || null);

  const handleContinue = () => {
    if (selectedPath) {
      onNext(selectedPath);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          Choose your path
        </h2>
        <p className="text-muted-foreground">
          Select how you'd like to receive support from our community.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Option A: Receive Coupons */}
        <Card
          className={cn(
            'p-6 cursor-pointer transition-all duration-300 border-2',
            selectedPath === 'coupons'
              ? 'border-primary bg-primary/5 shadow-lg'
              : 'border-border hover:border-primary/50 hover:shadow-md'
          )}
          onClick={() => setSelectedPath('coupons')}
        >
          <div className="flex justify-between items-start mb-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Gift className="w-7 h-7 text-primary" />
            </div>
            {selectedPath === 'coupons' && (
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                <Check className="w-4 h-4 text-primary-foreground" />
              </div>
            )}
          </div>
          
          <h3 className="text-xl font-bold text-foreground mb-2">Receive Coupons</h3>
          <p className="text-muted-foreground mb-6">
            Get verified to receive grocery and essential coupons from our partner brands.
          </p>

          <ul className="space-y-3">
            <li className="flex items-center gap-3 text-sm text-foreground">
              <Zap className="w-4 h-4 text-primary flex-shrink-0" />
              <span>Faster approval process</span>
            </li>
            <li className="flex items-center gap-3 text-sm text-foreground">
              <Gift className="w-4 h-4 text-primary flex-shrink-0" />
              <span>Direct coupon access</span>
            </li>
            <li className="flex items-center gap-3 text-sm text-foreground">
              <Check className="w-4 h-4 text-primary flex-shrink-0" />
              <span>Perfect for immediate needs</span>
            </li>
          </ul>

          <div className="mt-6 pt-4 border-t border-border">
            <span className="text-sm font-medium text-primary">Recommended for most applicants</span>
          </div>
        </Card>

        {/* Option B: Start Fundraiser */}
        <Card
          className={cn(
            'p-6 cursor-pointer transition-all duration-300 border-2',
            selectedPath === 'fundraiser'
              ? 'border-gold bg-gold/5 shadow-lg'
              : 'border-border hover:border-gold/50 hover:shadow-md'
          )}
          onClick={() => setSelectedPath('fundraiser')}
        >
          <div className="flex justify-between items-start mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gold/10 flex items-center justify-center">
              <Megaphone className="w-7 h-7 text-gold" />
            </div>
            {selectedPath === 'fundraiser' && (
              <div className="w-6 h-6 rounded-full bg-gold flex items-center justify-center">
                <Check className="w-4 h-4 text-gold-foreground" />
              </div>
            )}
          </div>
          
          <h3 className="text-xl font-bold text-foreground mb-2">Start a Fundraiser</h3>
          <p className="text-muted-foreground mb-6">
            Create a campaign page where friends, family, and donors can contribute.
          </p>

          <ul className="space-y-3">
            <li className="flex items-center gap-3 text-sm text-foreground">
              <Users className="w-4 h-4 text-gold flex-shrink-0" />
              <span>Rally community support</span>
            </li>
            <li className="flex items-center gap-3 text-sm text-foreground">
              <Share2 className="w-4 h-4 text-gold flex-shrink-0" />
              <span>Share with your network</span>
            </li>
            <li className="flex items-center gap-3 text-sm text-foreground">
              <Gift className="w-4 h-4 text-gold flex-shrink-0" />
              <span>Donations convert to coupons</span>
            </li>
          </ul>

          <div className="mt-6 pt-4 border-t border-border">
            <span className="text-sm font-medium text-gold">Best for larger goals ($500+)</span>
          </div>
        </Card>
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" size="lg" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-5 h-5" />
          Back
        </Button>
        <Button 
          size="lg" 
          onClick={handleContinue}
          disabled={!selectedPath}
          className="gap-2"
        >
          Continue
          <ArrowRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
