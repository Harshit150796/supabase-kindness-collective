import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ArrowRight, Check, Heart, Gift, Users, Utensils, Search, Loader2, ExternalLink, Globe, CreditCard } from 'lucide-react';
import { brandList, popularBrands } from '@/data/brandLogos';
import { BrandSelectorModal } from './BrandSelectorModal';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Payment method icons as SVG components for brand accuracy
const PaymentMethodIcons = () => (
  <div className="flex flex-wrap items-center justify-center gap-3 py-3">
    {/* Visa */}
    <div className="h-8 w-12 bg-white rounded border border-border/50 flex items-center justify-center p-1" title="Visa">
      <svg viewBox="0 0 48 32" className="h-full w-full">
        <rect fill="#1A1F71" width="48" height="32" rx="4"/>
        <text x="24" y="20" fill="white" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="Arial">VISA</text>
      </svg>
    </div>
    {/* Mastercard */}
    <div className="h-8 w-12 bg-white rounded border border-border/50 flex items-center justify-center p-1" title="Mastercard">
      <svg viewBox="0 0 48 32" className="h-full w-full">
        <rect fill="#000" width="48" height="32" rx="4"/>
        <circle cx="18" cy="16" r="10" fill="#EB001B"/>
        <circle cx="30" cy="16" r="10" fill="#F79E1B"/>
        <path d="M24 8.5a10 10 0 010 15" fill="#FF5F00"/>
      </svg>
    </div>
    {/* Amex */}
    <div className="h-8 w-12 bg-white rounded border border-border/50 flex items-center justify-center p-1" title="American Express">
      <svg viewBox="0 0 48 32" className="h-full w-full">
        <rect fill="#016FD0" width="48" height="32" rx="4"/>
        <text x="24" y="18" fill="white" fontSize="6" fontWeight="bold" textAnchor="middle" fontFamily="Arial">AMEX</text>
      </svg>
    </div>
    {/* Apple Pay */}
    <div className="h-8 w-12 bg-black rounded border border-border/50 flex items-center justify-center p-1" title="Apple Pay">
      <svg viewBox="0 0 48 32" className="h-full w-full">
        <text x="24" y="20" fill="white" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="Arial"> Pay</text>
      </svg>
    </div>
    {/* Google Pay */}
    <div className="h-8 w-12 bg-white rounded border border-border/50 flex items-center justify-center p-1" title="Google Pay">
      <svg viewBox="0 0 48 32" className="h-full w-full">
        <text x="24" y="18" fill="#4285F4" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="Arial">G Pay</text>
      </svg>
    </div>
  </div>
);

const presetAmounts = [10, 25, 50, 100, 250];

// Impact equivalents
const getImpactMessage = (amount: number) => {
  if (amount >= 100) return { meals: amount * 2, text: `${amount * 2} meals for families in need` };
  if (amount >= 50) return { meals: amount * 2, text: `${amount * 2} meals for families in need` };
  if (amount >= 25) return { meals: amount * 2, text: `${amount * 2} meals for families in need` };
  return { meals: amount * 2, text: `${amount * 2} meals for families in need` };
};

export function DonationFlow() {
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [amount, setAmount] = useState(50);
  const [step, setStep] = useState(1);
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  const impact = getImpactMessage(amount);

  const handleContinue = async () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      // Process payment with Stripe
      setIsProcessing(true);
      setCheckoutUrl(null);
      
      try {
        const { data, error } = await supabase.functions.invoke('create-donation-checkout', {
          body: {
            amount,
            brandName: selectedBrandData?.name || '',
            brandId: selectedBrand || '',
          },
        });

        if (error) throw error;

        if (data?.url) {
          setCheckoutUrl(data.url);
          
          // Try to open in new tab first (more reliable for async handlers)
          const newWindow = window.open(data.url, '_blank');
          
          if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
            // Popup was blocked, try direct redirect
            toast({
              title: 'Redirecting to payment...',
              description: 'Opening Stripe checkout...',
            });
            window.location.href = data.url;
          } else {
            // New tab opened successfully
            toast({
              title: 'Payment page opened',
              description: 'Complete your donation in the new tab. If you don\'t see it, check for blocked popups.',
            });
            setIsProcessing(false);
          }
        } else {
          throw new Error('No checkout URL received from server');
        }
      } catch (error) {
        console.error('Checkout error:', error);
        toast({
          title: 'Payment Error',
          description: error instanceof Error ? error.message : 'Unable to start checkout. Please try again.',
          variant: 'destructive',
        });
        setIsProcessing(false);
      }
    }
  };

  const handleManualRedirect = () => {
    if (checkoutUrl) {
      window.open(checkoutUrl, '_blank');
    }
  };

  const selectedBrandData = brandList.find(b => b.name.toLowerCase().replace(/\s+/g, '') === selectedBrand);

  return (
    <section className="py-20 relative overflow-hidden bg-secondary/20">
      <div className="container mx-auto px-4 relative">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Simple 3-Step Process
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            Make an Impact in Seconds
          </h2>
          <p className="text-lg text-muted-foreground">
            Choose a brand, select an amount, and see exactly how your donation helps families.
          </p>
        </div>

        {/* Steps indicator */}
        <div className="flex justify-center gap-3 mb-10">
          {[
            { num: 1, label: 'Choose Brand' },
            { num: 2, label: 'Select Amount' },
            { num: 3, label: 'See Impact' }
          ].map((s) => (
            <div 
              key={s.num}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all text-sm ${
                s.num === step 
                  ? 'bg-primary text-primary-foreground' 
                  : s.num < step 
                    ? 'bg-primary/20 text-primary' 
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              {s.num < step ? (
                <Check className="w-4 h-4" />
              ) : (
                <span className="w-5 h-5 rounded-full bg-current/20 flex items-center justify-center text-xs font-bold">
                  {s.num}
                </span>
              )}
              <span className="font-medium hidden sm:inline">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Interactive Flow */}
        <Card className="max-w-3xl mx-auto p-6 md:p-10">
          {/* Step 1: Choose Brand */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center">
                <h3 className="text-xl font-bold mb-2 text-foreground">Choose a Partner Brand</h3>
                <p className="text-muted-foreground text-sm">Your donation purchases coupons from these trusted partners</p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {popularBrands.map((brand) => {
                  const brandId = brand.name.toLowerCase().replace(/\s+/g, '');
                  return (
                    <button
                      key={brand.name}
                      onClick={() => setSelectedBrand(brandId)}
                      className={`p-4 rounded-xl border-2 transition-all hover:shadow-md flex flex-col items-center gap-2 ${
                        selectedBrand === brandId 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-lg bg-background border border-border/50 flex items-center justify-center p-2">
                        <img 
                          src={brand.logo} 
                          alt={brand.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="font-medium text-foreground text-sm">{brand.name}</div>
                    </button>
                  );
                })}
              </div>

              {/* Browse All Brands Button */}
              <Button
                variant="ghost"
                className="w-full gap-2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowBrandModal(true)}
              >
                <Search className="w-4 h-4" />
                Browse all 25+ brands
              </Button>

              <Button 
                size="lg" 
                className="w-full"
                disabled={!selectedBrand}
                onClick={handleContinue}
              >
                Continue
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>

              {/* Brand Selector Modal */}
              <BrandSelectorModal
                open={showBrandModal}
                onOpenChange={setShowBrandModal}
                selectedBrand={selectedBrand}
                onSelectBrand={setSelectedBrand}
              />
            </div>
          )}

          {/* Step 2: Select Amount */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center">
                {selectedBrandData && (
                  <div className="inline-flex items-center gap-2 text-muted-foreground mb-3">
                    <div className="w-8 h-8 rounded bg-background border border-border/50 flex items-center justify-center p-1">
                      <img src={selectedBrandData.logo} alt={selectedBrandData.name} className="w-full h-full object-contain" />
                    </div>
                    <span className="font-medium">{selectedBrandData.name}</span>
                  </div>
                )}
                <h3 className="text-xl font-bold mb-2 text-foreground">Select Donation Amount</h3>
                <p className="text-muted-foreground text-sm">Every dollar provides real meals for families</p>
              </div>

              {/* Amount display with impact */}
              <div className="text-center py-6 bg-secondary/50 rounded-xl">
                <div className="text-5xl font-bold text-foreground mb-2">${amount}</div>
                <div className="flex items-center justify-center gap-2 text-primary font-medium">
                  <Utensils className="w-4 h-4" />
                  <span>= {impact.text}</span>
                </div>
              </div>

              {/* Preset amounts */}
              <div className="flex flex-wrap justify-center gap-2">
                {presetAmounts.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setAmount(preset)}
                    className={`px-5 py-2.5 rounded-lg font-medium transition-all text-sm ${
                      amount === preset 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted hover:bg-muted/80 text-foreground'
                    }`}
                  >
                    ${preset}
                  </button>
                ))}
              </div>

              {/* Slider */}
              <div className="px-2">
                <Slider
                  value={[amount]}
                  onValueChange={([v]) => setAmount(v)}
                  min={5}
                  max={500}
                  step={5}
                  className="py-4"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>$5</span>
                  <span>$500</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="flex-1"
                  onClick={() => setStep(1)}
                >
                  Back
                </Button>
                <Button 
                  size="lg" 
                  className="flex-1"
                  onClick={handleContinue}
                >
                  Continue
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: See Impact */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-foreground">Your Impact</h3>
                <p className="text-muted-foreground text-sm">Here's how your donation helps families</p>
              </div>

              {/* Impact Summary */}
              <div className="bg-secondary/50 rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-border/50">
                  <span className="text-muted-foreground">Donating to</span>
                  <div className="flex items-center gap-2 font-medium text-foreground">
                    {selectedBrandData && (
                      <div className="w-6 h-6 rounded bg-background border border-border/50 flex items-center justify-center p-0.5">
                        <img src={selectedBrandData.logo} alt={selectedBrandData.name} className="w-full h-full object-contain" />
                      </div>
                    )}
                    {selectedBrandData?.name}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-center py-4">
                  <div>
                    <div className="text-3xl font-bold text-foreground">${amount}</div>
                    <div className="text-sm text-muted-foreground">Your Donation (USD)</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-primary flex items-center justify-center gap-1">
                      <Utensils className="w-6 h-6" />
                      {impact.meals}
                    </div>
                    <div className="text-sm text-muted-foreground">Meals Provided</div>
                  </div>
                </div>

                {/* Payment Methods Section */}
                <div className="border-t border-border/50 pt-4">
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-2">
                    <CreditCard className="w-4 h-4" />
                    <span>Accepted Payment Methods</span>
                  </div>
                  <PaymentMethodIcons />
                  <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mt-2">
                    <Globe className="w-3 h-3" />
                    <span>International cards accepted · Your bank handles currency conversion</span>
                  </div>
                </div>

                {/* Real recipient preview */}
                <div className="bg-background rounded-lg p-4 flex items-center gap-4">
                  <img 
                    src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop&crop=face"
                    alt="Recipient"
                    className="w-14 h-14 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <p className="text-sm text-foreground">
                      Your donation helps families like Maria's get groceries every week.
                    </p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Users className="w-3 h-3" />
                      <span>Join 50,000+ donors making a difference</span>
                    </div>
                  </div>
                </div>

                {/* Secondary: Gold Coins mention */}
                <div className="text-center text-sm text-muted-foreground pt-2">
                  <Gift className="w-4 h-4 inline mr-1" />
                  Plus, earn {amount * 10} Gold Coins for exclusive rewards
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="flex-1"
                  onClick={() => setStep(2)}
                >
                  Back
                </Button>
              <Button 
                  size="lg" 
                  className="flex-1"
                  onClick={handleContinue}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Complete Donation
                      <Heart className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </div>

              {/* Fallback link if popup was blocked */}
              {checkoutUrl && !isProcessing && (
                <div className="text-center pt-4 border-t border-border/50 mt-4">
                  <p className="text-sm text-muted-foreground mb-2">
                    Payment page didn't open? Click below:
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleManualRedirect}
                    className="gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open Payment Page
                  </Button>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </section>
  );
}
