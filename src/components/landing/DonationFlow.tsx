import { useState, useMemo, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ArrowRight, Check, Heart, Gift, Users, Search, Loader2, ExternalLink, Globe, CreditCard, X } from 'lucide-react';
import { brandList, popularBrands, brandLogos, BrandInfo } from '@/data/brandLogos';
import { BrandSelectorModal } from './BrandSelectorModal';
import { BrandAllocationSliders, BrandAllocation } from './BrandAllocationSliders';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

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
const MAX_BRANDS = 5;
const MIN_AMOUNT_PER_BRAND = 5;

// Helper to get brand info from ID
const getBrandInfo = (brandId: string): BrandInfo | null => {
  for (const [key, info] of Object.entries(brandLogos)) {
    if (key.toLowerCase().replace(/\s+/g, '') === brandId.toLowerCase().replace(/\s+/g, '')) {
      return info;
    }
  }
  return null;
};

// Calculate total coupons across all brand allocations
const getTotalCoupons = (amount: number, allocations: BrandAllocation[]) => {
  if (allocations.length === 0) {
    const couponValue = amount >= 50 ? 10 : 5;
    return Math.floor(amount / couponValue);
  }
  return allocations.reduce((total, alloc) => {
    const brandAmount = (amount * alloc.percentage) / 100;
    const couponValue = brandAmount >= 50 ? 10 : 5;
    return total + Math.floor(brandAmount / couponValue);
  }, 0);
};

export function DonationFlow() {
  const { user } = useAuth();
  // Multi-brand selection state
  const [selectedBrands, setSelectedBrands] = useState<BrandAllocation[]>([]);
  const [useCustomAllocation, setUseCustomAllocation] = useState(false);
  const [amount, setAmount] = useState(50);
  const [customAmountText, setCustomAmountText] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const customInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(1);
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  // totalCoupons moved after currentAllocations

  // Calculate max brands allowed based on amount
  const maxBrandsForAmount = Math.min(MAX_BRANDS, Math.floor(amount / MIN_AMOUNT_PER_BRAND));

  // Calculate equal split allocations
  const equalSplitAllocations = useMemo(() => {
    if (selectedBrands.length === 0) return [];
    const equalPercent = Math.floor(100 / selectedBrands.length);
    const remainder = 100 - (equalPercent * selectedBrands.length);
    
    return selectedBrands.map((brand, index) => ({
      ...brand,
      percentage: equalPercent + (index === 0 ? remainder : 0),
    }));
  }, [selectedBrands]);

  // Get current allocations (custom or equal)
  const currentAllocations = useMemo(() => {
    if (!useCustomAllocation || selectedBrands.length === 0) {
      return equalSplitAllocations;
    }
    return selectedBrands;
  }, [useCustomAllocation, selectedBrands, equalSplitAllocations]);

  const totalCoupons = getTotalCoupons(amount, currentAllocations);

  // Toggle brand selection
  const toggleBrand = (brandId: string, brandName: string) => {
    const exists = selectedBrands.find(b => b.brandId === brandId);
    
    if (exists) {
      // Remove brand
      setSelectedBrands(prev => prev.filter(b => b.brandId !== brandId));
    } else {
      // Add brand if under limit
      if (selectedBrands.length < maxBrandsForAmount) {
        const newBrand: BrandAllocation = {
          brandId,
          brandName,
          percentage: 0, // Will be calculated by equal split
        };
        setSelectedBrands(prev => [...prev, newBrand]);
      } else {
        toast({
          title: 'Maximum brands reached',
          description: `You can select up to ${maxBrandsForAmount} brands for a $${amount} donation (minimum $${MIN_AMOUNT_PER_BRAND} per brand).`,
          variant: 'destructive',
        });
      }
    }
  };

  // Remove brand chip
  const removeBrand = (brandId: string) => {
    setSelectedBrands(prev => prev.filter(b => b.brandId !== brandId));
  };

  // Handle brands selected from modal (multi-select mode)
  const handleBrandsFromModal = (brandIds: string[]) => {
    const newBrands: BrandAllocation[] = brandIds.map(brandId => {
      const info = getBrandInfo(brandId);
      return {
        brandId,
        brandName: info?.name || brandId,
        percentage: 0,
      };
    });
    setSelectedBrands(newBrands);
  };

  // Handle custom allocation changes
  const handleAllocationsChange = (allocations: BrandAllocation[]) => {
    setSelectedBrands(allocations);
  };

  // Validate allocations before continuing
  const validateAllocations = (): boolean => {
    if (selectedBrands.length === 0) return false;
    
    if (useCustomAllocation) {
      const total = selectedBrands.reduce((sum, b) => sum + b.percentage, 0);
      if (total !== 100) {
        toast({
          title: 'Invalid allocation',
          description: 'Percentages must add up to 100%.',
          variant: 'destructive',
        });
        return false;
      }
      
      // Check minimum per brand
      for (const brand of selectedBrands) {
        const brandAmount = (amount * brand.percentage) / 100;
        if (brandAmount < MIN_AMOUNT_PER_BRAND) {
          toast({
            title: 'Minimum not met',
            description: `${brand.brandName} allocation ($${brandAmount.toFixed(2)}) is below the $${MIN_AMOUNT_PER_BRAND} minimum.`,
            variant: 'destructive',
          });
          return false;
        }
      }
    }
    
    return true;
  };

  const MAX_RETRIES = 2;

  const handleContinue = async (retryCount: number = 0): Promise<void> => {
    if (step === 1) {
      if (!validateAllocations()) return;
      setStep(2);
      return;
    }
    
    if (step < 3) {
      setStep(step + 1);
      return;
    }
    
    // Process payment with Stripe
    setIsProcessing(true);
    setCheckoutUrl(null);
    
    try {
      // Prepare brand allocations for the edge function
      const brandAllocations = currentAllocations.map(a => ({
        brand: a.brandName,
        brandId: a.brandId,
        percent: a.percentage,
        amount: Number(((amount * a.percentage) / 100).toFixed(2)),
      }));

      const { data, error } = await supabase.functions.invoke('create-donation-checkout', {
        body: {
          amount,
          // For backward compatibility, send primary brand
          brandName: brandAllocations[0]?.brand || '',
          brandId: brandAllocations[0]?.brandId || '',
          // New: send all brand allocations
          brandAllocations,
          userId: user?.id || null,
          userEmail: user?.email || null,
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
      console.error('Checkout error (attempt ' + (retryCount + 1) + '):', error);
      
      // Retry on transient network errors
      const errorMessage = error instanceof Error ? error.message : '';
      const isNetworkError = errorMessage.includes('network') || 
                             errorMessage.includes('timeout') || 
                             errorMessage.includes('fetch') ||
                             errorMessage.includes('Failed to fetch');
      
      if (retryCount < MAX_RETRIES && isNetworkError) {
        toast({
          title: 'Connection issue',
          description: 'Retrying...',
        });
        // Wait 1 second before retry
        await new Promise(resolve => setTimeout(resolve, 1000));
        return handleContinue(retryCount + 1);
      }
      
      toast({
        title: 'Payment Error',
        description: error instanceof Error ? error.message : 'Unable to start checkout. Please try again.',
        variant: 'destructive',
      });
      setIsProcessing(false);
    }
  };

  const handleManualRedirect = () => {
    if (checkoutUrl) {
      window.open(checkoutUrl, '_blank');
    }
  };

  return (
    <section id="donation-flow" className="py-20 relative overflow-hidden bg-secondary/20">
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
            Choose brands, select an amount, and see exactly how your donation helps families.
          </p>
        </div>

        {/* Steps indicator */}
        <div className="flex justify-center gap-3 mb-10">
          {[
            { num: 1, label: 'Choose Brands' },
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
          {/* Step 1: Choose Brands (Multi-Select) */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center">
                <h3 className="text-xl font-bold mb-2 text-foreground">Choose Partner Brands</h3>
                <p className="text-muted-foreground text-sm">Select one or more brands for your donation (up to {maxBrandsForAmount})</p>
              </div>
              
              {/* Selected brands chips */}
              {selectedBrands.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
                  {selectedBrands.map((brand) => {
                    const info = getBrandInfo(brand.brandId);
                    return (
                      <div
                        key={brand.brandId}
                        className="flex items-center gap-2 px-3 py-1.5 bg-background rounded-full border border-border"
                      >
                        {info && (
                          <div className="w-5 h-5 rounded bg-white p-0.5 flex items-center justify-center">
                            <img src={info.logo} alt={info.name} className="w-full h-full object-contain" />
                          </div>
                        )}
                        <span className="text-sm font-medium text-foreground">{brand.brandName}</span>
                        <button
                          onClick={() => removeBrand(brand.brandId)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                  <span className="text-xs text-muted-foreground self-center ml-2">
                    {selectedBrands.length} of {maxBrandsForAmount} max
                  </span>
                </div>
              )}

              {/* Brand grid with checkboxes */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {popularBrands.map((brand) => {
                  const brandId = brand.name.toLowerCase().replace(/\s+/g, '');
                  const isSelected = selectedBrands.some(b => b.brandId === brandId);
                  const isDisabled = !isSelected && selectedBrands.length >= maxBrandsForAmount;
                  
                  return (
                    <button
                      key={brand.name}
                      onClick={() => toggleBrand(brandId, brand.name)}
                      disabled={isDisabled}
                      className={`p-4 rounded-xl border-2 transition-all hover:shadow-md flex flex-col items-center gap-2 relative ${
                        isSelected 
                          ? 'border-primary bg-primary/5' 
                          : isDisabled
                            ? 'border-border bg-muted/50 opacity-50 cursor-not-allowed'
                            : 'border-border hover:border-primary/50'
                      }`}
                    >
                      {/* Checkbox indicator */}
                      <div className={`absolute top-2 right-2 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                        isSelected 
                          ? 'bg-primary border-primary' 
                          : 'border-muted-foreground/30'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                      </div>
                      
                      <div className="w-12 h-12 rounded-lg bg-background border border-border/50 flex items-center justify-center p-2">
                        <img 
                          src={brand.logo} 
                          alt={brand.name}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            const target = e.currentTarget;
                            target.style.display = 'none';
                            const fallback = document.createElement('div');
                            fallback.className = 'w-full h-full rounded flex items-center justify-center text-white font-bold text-sm';
                            fallback.style.backgroundColor = brand.color;
                            fallback.textContent = brand.name.charAt(0);
                            target.parentElement?.appendChild(fallback);
                          }}
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

              {/* Allocation preview (when multiple brands selected) */}
              {selectedBrands.length > 1 && (
                <div className="border-t border-border pt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="custom-allocation"
                        checked={useCustomAllocation}
                        onCheckedChange={setUseCustomAllocation}
                      />
                      <Label htmlFor="custom-allocation" className="text-sm text-muted-foreground cursor-pointer">
                        Customize split percentages
                      </Label>
                    </div>
                  </div>

                  {useCustomAllocation ? (
                    <BrandAllocationSliders
                      selectedBrands={selectedBrands}
                      amount={amount}
                      onAllocationsChange={handleAllocationsChange}
                    />
                  ) : (
                    <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                      <div className="text-sm font-medium text-foreground">Equal Split Preview</div>
                      <div className="space-y-1">
                        {equalSplitAllocations.map((allocation) => {
                          const brandAmount = (amount * allocation.percentage) / 100;
                          return (
                            <div key={allocation.brandId} className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">{allocation.brandName}</span>
                              <span className="font-medium text-foreground">
                                {allocation.percentage}% = ${brandAmount.toFixed(2)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <Button 
                size="lg" 
                className="w-full"
                disabled={selectedBrands.length === 0}
                onClick={() => handleContinue()}
              >
                Continue
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>

              {/* Brand Selector Modal (Multi-Select Mode) */}
              <BrandSelectorModal
                open={showBrandModal}
                onOpenChange={setShowBrandModal}
                selectedBrands={selectedBrands.map(b => b.brandId)}
                onSelectBrands={handleBrandsFromModal}
                maxBrands={maxBrandsForAmount}
                multiSelect={true}
              />
            </div>
          )}

          {/* Step 2: Select Amount */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center">
                {/* Show selected brands */}
                <div className="inline-flex items-center gap-1 text-muted-foreground mb-3 flex-wrap justify-center">
                  {currentAllocations.slice(0, 3).map((allocation, index) => {
                    const info = getBrandInfo(allocation.brandId);
                    return (
                      <span key={allocation.brandId} className="inline-flex items-center gap-1">
                        {index > 0 && <span className="mx-1">+</span>}
                        {info && (
                          <div className="w-6 h-6 rounded bg-background border border-border/50 flex items-center justify-center p-0.5">
                            <img src={info.logo} alt={info.name} className="w-full h-full object-contain" />
                          </div>
                        )}
                        <span className="font-medium text-sm">{allocation.brandName}</span>
                      </span>
                    );
                  })}
                  {currentAllocations.length > 3 && (
                    <span className="text-sm text-muted-foreground ml-1">
                      +{currentAllocations.length - 3} more
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold mb-2 text-foreground">Select Donation Amount</h3>
                <p className="text-muted-foreground text-sm">Your donation creates coupons for families to use at partner brands</p>
              </div>

              {/* Amount display with impact */}
              <div className="text-center py-6 bg-secondary/50 rounded-xl">
                <div className="text-5xl font-bold text-foreground mb-2">${amount}</div>
                <div className="flex items-center justify-center gap-2 text-primary font-medium">
                  <Gift className="w-4 h-4" />
                  <span>= {totalCoupons} coupons for families</span>
                </div>
                {selectedBrands.length > 1 && (
                  <div className="text-xs text-muted-foreground mt-2">
                    Split across {selectedBrands.length} brands
                  </div>
                )}
              </div>

              {/* Preset amounts + Custom */}
              <div className="flex flex-wrap justify-center gap-2">
                {presetAmounts.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => {
                      setAmount(preset);
                      setCustomAmountText('');
                      setIsCustomMode(false);
                    }}
                    className={`px-5 py-2.5 rounded-lg font-medium transition-all text-sm ${
                      amount === preset && !isCustomMode
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted hover:bg-muted/80 text-foreground'
                    }`}
                  >
                    ${preset}
                  </button>
                ))}
                <button
                  onClick={() => {
                    setIsCustomMode(true);
                    setTimeout(() => customInputRef.current?.focus(), 50);
                  }}
                  className={`px-5 py-2.5 rounded-lg font-medium transition-all text-sm ${
                    isCustomMode
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted hover:bg-muted/80 text-foreground'
                  }`}
                >
                  Custom
                </button>
              </div>

              {/* Custom amount input */}
              {isCustomMode && (
                <div className="flex items-center gap-2 max-w-xs mx-auto">
                  <span className="text-2xl font-bold text-foreground">$</span>
                  <Input
                    ref={customInputRef}
                    type="text"
                    inputMode="numeric"
                    placeholder="Enter amount..."
                    value={customAmountText}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setCustomAmountText(val);
                      const num = parseInt(val, 10);
                      if (!isNaN(num) && num > 0) {
                        setAmount(Math.min(num, 10000));
                      }
                    }}
                    onBlur={() => {
                      const num = parseInt(customAmountText, 10);
                      if (isNaN(num) || num < 5) {
                        toast({
                          title: 'Minimum $5',
                          description: 'The minimum donation amount is $5.',
                          variant: 'destructive',
                        });
                        if (isNaN(num) || num < 5) {
                          setAmount(5);
                          setCustomAmountText('5');
                        }
                      } else if (num > 10000) {
                        setAmount(10000);
                        setCustomAmountText('10000');
                      }
                    }}
                    className="text-xl font-semibold text-center"
                  />
                </div>
              )}

              {/* Slider */}
              <div className="px-2">
                <Slider
                  value={[Math.min(amount, 500)]}
                  onValueChange={([v]) => {
                    setAmount(v);
                    setCustomAmountText('');
                    setIsCustomMode(false);
                  }}
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

              {/* Per-brand breakdown */}
              {selectedBrands.length > 1 && (
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <div className="text-sm font-medium text-foreground">Breakdown by Brand</div>
                  <div className="space-y-1">
                    {currentAllocations.map((allocation) => {
                      const brandAmount = (amount * allocation.percentage) / 100;
                      const couponValue = brandAmount >= 50 ? 10 : 5;
                      const coupons = Math.floor(brandAmount / couponValue);
                      return (
                        <div key={allocation.brandId} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{allocation.brandName}</span>
                          <span className="text-foreground">
                            ${brandAmount.toFixed(2)} → {coupons} coupon{coupons !== 1 ? 's' : ''}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

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
                  onClick={() => handleContinue()}
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
                {/* Show all selected brands */}
                <div className="flex items-center justify-between pb-4 border-b border-border/50">
                  <span className="text-muted-foreground">Donating to</span>
                  <div className="flex items-center gap-1 font-medium text-foreground flex-wrap justify-end">
                    {currentAllocations.map((allocation, index) => {
                      const info = getBrandInfo(allocation.brandId);
                      return (
                        <span key={allocation.brandId} className="inline-flex items-center gap-1">
                          {index > 0 && <span className="text-muted-foreground mx-0.5">+</span>}
                          {info && (
                            <div className="w-6 h-6 rounded bg-background border border-border/50 flex items-center justify-center p-0.5">
                              <img src={info.logo} alt={info.name} className="w-full h-full object-contain" />
                            </div>
                          )}
                        </span>
                      );
                    })}
                    <span className="ml-2 text-sm">
                      {currentAllocations.length === 1 
                        ? currentAllocations[0].brandName 
                        : `${currentAllocations.length} brands`}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-center py-4">
                  <div>
                    <div className="text-3xl font-bold text-foreground">${amount}</div>
                    <div className="text-sm text-muted-foreground">Your Donation (USD)</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-primary flex items-center justify-center gap-1">
                      <Gift className="w-6 h-6" />
                      {totalCoupons}
                    </div>
                    <div className="text-sm text-muted-foreground">Coupons Created</div>
                  </div>
                </div>

                {/* Coupon breakdown per brand */}
                {selectedBrands.length > 0 && (
                  <div className="border-t border-border/50 pt-4">
                    <div className="text-sm font-medium text-foreground mb-3">Coupon Breakdown</div>
                    <div className="space-y-2">
                      {currentAllocations.map((allocation) => {
                        const brandAmount = (amount * allocation.percentage) / 100;
                        const couponValue = brandAmount >= 50 ? 10 : 5;
                        const coupons = Math.floor(brandAmount / couponValue);
                        const info = getBrandInfo(allocation.brandId);
                        return (
                          <div key={allocation.brandId} className="flex items-center justify-between text-sm bg-background/50 rounded-lg p-2">
                            <div className="flex items-center gap-2">
                              {info && (
                                <div className="w-6 h-6 rounded bg-white p-0.5 flex items-center justify-center">
                                  <img src={info.logo} alt={info.name} className="w-full h-full object-contain" />
                                </div>
                              )}
                              <span className="text-foreground">{allocation.brandName}</span>
                            </div>
                            <span className="text-muted-foreground text-xs sm:text-sm truncate">
                              ${brandAmount.toFixed(2)} → {coupons} × ${couponValue} coupon{coupons !== 1 ? 's' : ''}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

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
                      <span>Family of 4, Los Angeles</span>
                    </div>
                  </div>
                </div>

                {/* Gold coins bonus */}
                <div className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 rounded-lg p-4 border border-amber-500/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center">
                      <Gift className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Plus, earn {amount * 10} Gold Coins</p>
                      <p className="text-xs text-muted-foreground">Redeem for exclusive rewards and recognition</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="flex-1"
                  onClick={() => setStep(2)}
                  disabled={isProcessing}
                >
                  Back
                </Button>
                <Button 
                  size="lg" 
                  className="flex-1 relative"
                  onClick={() => handleContinue()}
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

              {/* Manual redirect fallback */}
              {checkoutUrl && !isProcessing && (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    Didn't see the payment page?
                  </p>
                  <Button 
                    variant="link" 
                    className="text-primary gap-1"
                    onClick={handleManualRedirect}
                  >
                    Open payment page
                    <ExternalLink className="w-4 h-4" />
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
