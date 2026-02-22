import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Check, X } from 'lucide-react';
import { brandList, categories, type BrandCategory, type BrandInfo } from '@/data/brandLogos';

interface BrandSelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Single select mode (legacy)
  selectedBrand?: string | null;
  onSelectBrand?: (brandId: string) => void;
  // Multi-select mode
  selectedBrands?: string[];
  onSelectBrands?: (brandIds: string[]) => void;
  maxBrands?: number;
  multiSelect?: boolean;
}

const categoryLabels: Record<BrandCategory, string> = {
  all: 'All',
  grocery: 'Grocery',
  'food-delivery': 'Food Delivery',
  retail: 'Retail',
  coffee: 'Coffee',
  pharmacy: 'Pharmacy',
  restaurant: 'Restaurant',
};

export function BrandSelectorModal({ 
  open, 
  onOpenChange, 
  selectedBrand,
  onSelectBrand,
  selectedBrands = [],
  onSelectBrands,
  maxBrands = 5,
  multiSelect = false,
}: BrandSelectorModalProps) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<BrandCategory>('all');
  // Local state for multi-select before confirming
  const [localSelected, setLocalSelected] = useState<string[]>(selectedBrands);

  // Sync local state when modal opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setLocalSelected(selectedBrands);
    }
    onOpenChange(isOpen);
  };

  const filteredBrands = useMemo(() => {
    return brandList.filter((brand) => {
      const matchesSearch = brand.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = activeCategory === 'all' || brand.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [search, activeCategory]);

  const handleSelectBrand = (brand: BrandInfo) => {
    const brandId = brand.name.toLowerCase().replace(/\s+/g, '');
    
    if (multiSelect) {
      // Multi-select mode
      const isSelected = localSelected.includes(brandId);
      if (isSelected) {
        setLocalSelected(prev => prev.filter(id => id !== brandId));
      } else if (localSelected.length < maxBrands) {
        setLocalSelected(prev => [...prev, brandId]);
      }
    } else {
      // Single-select mode (legacy)
      if (onSelectBrand) {
        onSelectBrand(brandId);
      }
      onOpenChange(false);
    }
  };

  const handleConfirmSelection = () => {
    if (onSelectBrands) {
      onSelectBrands(localSelected);
    }
    onOpenChange(false);
  };

  const removeBrand = (brandId: string) => {
    setLocalSelected(prev => prev.filter(id => id !== brandId));
  };

  // For display purposes
  const selectedBrandData = !multiSelect 
    ? brandList.find(b => b.name.toLowerCase().replace(/\s+/g, '') === selectedBrand)
    : null;

  const localSelectedBrands = brandList.filter(
    b => localSelected.includes(b.name.toLowerCase().replace(/\s+/g, ''))
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {multiSelect ? 'Select Brands' : 'Select a Brand'}
          </DialogTitle>
          {multiSelect && (
            <p className="text-sm text-muted-foreground">
              Choose up to {maxBrands} brands for your donation
            </p>
          )}
        </DialogHeader>

        {/* Selected brands chips (multi-select only) */}
        {multiSelect && localSelected.length > 0 && (
          <div className="flex flex-wrap gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
            {localSelectedBrands.map((brand) => (
              <div
                key={brand.name}
                className="flex items-center gap-2 px-3 py-1.5 bg-background rounded-full border border-border"
              >
                <div className="w-5 h-5 rounded bg-white p-0.5 flex items-center justify-center">
                  <img src={brand.logo} alt={brand.name} className="w-full h-full object-contain" />
                </div>
                <span className="text-sm font-medium text-foreground">{brand.name}</span>
                <button
                  onClick={() => removeBrand(brand.name.toLowerCase().replace(/\s+/g, ''))}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <span className="text-xs text-muted-foreground self-center ml-2">
              {localSelected.length} of {maxBrands} max
            </span>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search brands..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                activeCategory === category
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {categoryLabels[category]}
            </button>
          ))}
        </div>

        {/* Brand Grid */}
        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 py-2">
            {filteredBrands.map((brand) => {
              const brandId = brand.name.toLowerCase().replace(/\s+/g, '');
              const isSelected = multiSelect 
                ? localSelected.includes(brandId)
                : selectedBrand === brandId;
              const isDisabled = multiSelect && !isSelected && localSelected.length >= maxBrands;
              
              return (
                <button
                  key={brand.name}
                  onClick={() => handleSelectBrand(brand)}
                  disabled={isDisabled}
                  className={`relative p-3 rounded-xl border-2 transition-all hover:shadow-md flex flex-col items-center gap-2 ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : isDisabled
                        ? 'border-border bg-muted/50 opacity-50 cursor-not-allowed'
                        : 'border-border hover:border-primary/50'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                  <div className="w-10 h-10 rounded-lg bg-background border border-border/50 flex items-center justify-center p-1.5">
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
                  <div className="font-medium text-foreground text-xs text-center leading-tight">
                    {brand.name}
                  </div>
                </button>
              );
            })}
          </div>
          
          {filteredBrands.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No brands found matching "{search}"
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="pt-4 border-t border-border">
          {multiSelect ? (
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1" 
                onClick={handleConfirmSelection}
                disabled={localSelected.length === 0}
              >
                Select {localSelected.length} Brand{localSelected.length !== 1 ? 's' : ''}
              </Button>
            </div>
          ) : selectedBrandData ? (
            <Button className="w-full" onClick={() => onOpenChange(false)}>
              Select {selectedBrandData.name}
            </Button>
          ) : (
            <p className="text-center text-sm text-muted-foreground">
              Choose a brand from the list above
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
