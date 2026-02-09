import { useState, useEffect, useMemo } from 'react';
import { Slider } from '@/components/ui/slider';
import { brandLogos, BrandInfo } from '@/data/brandLogos';

export interface BrandAllocation {
  brandId: string;
  brandName: string;
  percentage: number;
}

interface BrandAllocationSlidersProps {
  selectedBrands: BrandAllocation[];
  amount: number;
  onAllocationsChange: (allocations: BrandAllocation[]) => void;
}

const getBrandInfo = (brandId: string): BrandInfo | null => {
  // Try to find by key matching
  for (const [key, info] of Object.entries(brandLogos)) {
    if (key.toLowerCase().replace(/\s+/g, '') === brandId.toLowerCase().replace(/\s+/g, '')) {
      return info;
    }
  }
  return null;
};

export function BrandAllocationSliders({
  selectedBrands,
  amount,
  onAllocationsChange,
}: BrandAllocationSlidersProps) {
  // Local state for allocations during editing
  const [localAllocations, setLocalAllocations] = useState<BrandAllocation[]>(selectedBrands);

  // Sync with parent when selectedBrands changes externally
  useEffect(() => {
    setLocalAllocations(selectedBrands);
  }, [selectedBrands.length]);

  // Calculate total percentage
  const totalPercentage = useMemo(() => {
    return localAllocations.reduce((sum, a) => sum + a.percentage, 0);
  }, [localAllocations]);

  const handleSliderChange = (index: number, newValue: number) => {
    const newAllocations = [...localAllocations];
    newAllocations[index] = { ...newAllocations[index], percentage: newValue };
    
    // Auto-normalize if we have exactly 2 brands
    if (newAllocations.length === 2) {
      const otherIndex = index === 0 ? 1 : 0;
      newAllocations[otherIndex] = {
        ...newAllocations[otherIndex],
        percentage: 100 - newValue,
      };
    }
    
    setLocalAllocations(newAllocations);
    onAllocationsChange(newAllocations);
  };

  // Calculate amount per brand
  const getAmountForBrand = (percentage: number) => {
    return Number(((amount * percentage) / 100).toFixed(2));
  };

  // Calculate coupon details per brand
  const getCouponDetails = (brandAmount: number) => {
    const couponValue = brandAmount >= 50 ? 10 : 5;
    const count = Math.floor(brandAmount / couponValue);
    return { count, value: couponValue };
  };

  return (
    <div className="space-y-6 pt-4">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">Custom Allocation</span>
        <span className={`font-medium ${totalPercentage === 100 ? 'text-emerald-600' : 'text-amber-500'}`}>
          {totalPercentage}% / 100%
        </span>
      </div>

      <div className="space-y-5">
        {localAllocations.map((allocation, index) => {
          const brandInfo = getBrandInfo(allocation.brandId);
          const allocatedAmount = getAmountForBrand(allocation.percentage);
          const couponDetails = getCouponDetails(allocatedAmount);

          return (
            <div key={allocation.brandId} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {brandInfo ? (
                    <div className="w-6 h-6 rounded bg-white border border-border/50 p-0.5 flex items-center justify-center">
                      <img
                        src={brandInfo.logo}
                        alt={brandInfo.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : null}
                  <span className="font-medium text-foreground text-sm">
                    {allocation.brandName}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground">
                    {allocation.percentage}%
                  </span>
                  <span className="font-medium text-foreground min-w-[60px] text-right">
                    ${allocatedAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              <Slider
                value={[allocation.percentage]}
                onValueChange={([v]) => handleSliderChange(index, v)}
                min={5}
                max={95}
                step={5}
                className="py-1"
              />

              <div className="text-xs text-muted-foreground text-right">
                → {couponDetails.count} × ${couponDetails.value} coupon{couponDetails.count !== 1 ? 's' : ''}
              </div>
            </div>
          );
        })}
      </div>

      {totalPercentage !== 100 && (
        <div className="text-xs text-amber-600 bg-amber-500/10 px-3 py-2 rounded-lg">
          Allocations should add up to 100%. Currently at {totalPercentage}%.
        </div>
      )}

      {/* Summary */}
      <div className="bg-muted/50 rounded-lg p-3 space-y-1">
        <div className="text-sm font-medium text-foreground">Summary</div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {localAllocations.map((allocation) => {
            const allocatedAmount = getAmountForBrand(allocation.percentage);
            const couponDetails = getCouponDetails(allocatedAmount);
            return (
              <span key={allocation.brandId}>
                {allocation.brandName}: {couponDetails.count} × ${couponDetails.value}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
