import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Check } from 'lucide-react';
import { brandList, categories, type BrandCategory, type BrandInfo } from '@/data/brandLogos';

interface BrandSelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedBrand: string | null;
  onSelectBrand: (brandId: string) => void;
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
  onSelectBrand 
}: BrandSelectorModalProps) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<BrandCategory>('all');

  const filteredBrands = useMemo(() => {
    return brandList.filter((brand) => {
      const matchesSearch = brand.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = activeCategory === 'all' || brand.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [search, activeCategory]);

  const handleSelectBrand = (brand: BrandInfo) => {
    const brandId = brand.name.toLowerCase().replace(/\s+/g, '');
    onSelectBrand(brandId);
    onOpenChange(false);
  };

  const selectedBrandData = brandList.find(
    b => b.name.toLowerCase().replace(/\s+/g, '') === selectedBrand
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Select a Brand</DialogTitle>
        </DialogHeader>

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
              const isSelected = selectedBrand === brandId;
              
              return (
                <button
                  key={brand.name}
                  onClick={() => handleSelectBrand(brand)}
                  className={`relative p-3 rounded-xl border-2 transition-all hover:shadow-md flex flex-col items-center gap-2 ${
                    isSelected
                      ? 'border-primary bg-primary/5'
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
          {selectedBrandData ? (
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
