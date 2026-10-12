import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { brandList, categories, type BrandCategory } from '@/data/brandLogos';
import { RetailerLogo } from './donate/GiftLedger';
import { SPRING } from './donate/tokens';
import { CATEGORY_LABEL, findRetailer, retailerId } from './donate/retailers';

interface BrandSelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedBrands?: string[];
  onSelectBrands?: (brandIds: string[]) => void;
  maxBrands?: number;
  /** Kept for callers; the picker always chooses several. */
  multiSelect?: boolean;
}

const FILTERS: Record<BrandCategory, string> = {
  all: 'All',
  grocery: 'Groceries',
  'food-delivery': 'Meal delivery',
  retail: 'Essentials',
  coffee: 'Coffee',
  pharmacy: 'Pharmacy',
  restaurant: 'Meals out',
};

const RETAILERS = brandList.map((b) => findRetailer(retailerId(b.name)));

/** Every retailer, searchable and filterable; choices are applied together with the confirm button. */
export function BrandSelectorModal({ open, onOpenChange, selectedBrands = [], onSelectBrands, maxBrands = 5 }: BrandSelectorModalProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<BrandCategory>('all');
  const [picked, setPicked] = useState<string[]>(selectedBrands);

  // Start from the page's current choices every time the picker opens.
  useEffect(() => {
    if (open) { setPicked(selectedBrands); setSearch(''); setFilter('all'); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return RETAILERS.filter((r) => (filter === 'all' || r.category === filter) && (!q || r.name.toLowerCase().includes(q)));
  }, [search, filter]);

  const toggle = (id: string) =>
    setPicked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < maxBrands ? [...prev, id] : prev));
  const full = picked.length >= maxBrands;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-5 sm:max-h-[85vh] sm:max-w-2xl sm:rounded-[1.5rem]">
        <DialogHeader className="shrink-0 text-left">
          <DialogTitle className="font-display text-3xl font-normal leading-tight">All retailers</DialogTitle>
          <DialogDescription className="tabular-nums">
            Choose up to {maxBrands}. {picked.length} of {maxBrands} chosen.
          </DialogDescription>
        </DialogHeader>

        <label className="flex h-11 shrink-0 items-center gap-2 rounded-xl bg-muted/70 px-3 focus-within:ring-2 focus-within:ring-ring">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search retailers"
            aria-label="Search retailers"
            className="w-full min-w-0 bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted-foreground"
          />
        </label>

        <div role="radiogroup" aria-label="Kind of store" className="-mx-1 flex shrink-0 gap-1.5 overflow-x-auto px-1 pb-1">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={filter === c}
              onClick={() => setFilter(c)}
              className={cn(
                'relative shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring',
                filter === c ? 'text-primary-foreground' : 'bg-muted/70 text-muted-foreground hover:text-foreground',
              )}
            >
              {filter === c && <motion.span layoutId="retailer-filter" className="absolute inset-0 rounded-lg bg-primary" transition={SPRING} />}
              <span className="relative">{FILTERS[c]}</span>
            </button>
          ))}
        </div>

        <ScrollArea className="-mx-6 min-h-0 flex-1 px-6">
          <div className="grid grid-cols-2 gap-2.5 py-1 sm:grid-cols-3">
            {shown.map((r) => {
              const selected = picked.includes(r.id);
              const disabled = full && !selected;
              return (
                <button
                  key={r.id}
                  type="button"
                  aria-pressed={selected}
                  disabled={disabled}
                  onClick={() => toggle(r.id)}
                  className={cn(
                    'relative flex items-center gap-3 rounded-xl p-3 text-left outline-none transition-[background-color,box-shadow,opacity] focus-visible:ring-2 focus-visible:ring-ring active:scale-[.98]',
                    selected ? 'bg-[hsl(var(--primary-97))] shadow-[inset_0_0_0_2px_hsl(var(--primary))] dark:bg-primary/15' : 'bg-muted/70 hover:bg-muted',
                    disabled && 'cursor-not-allowed opacity-40',
                  )}
                >
                  <RetailerLogo retailer={r} className="h-9 w-9 p-1" />
                  <span className="min-w-0 pr-5">
                    <span className="block text-sm font-medium leading-snug text-foreground">{r.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{CATEGORY_LABEL[r.category]}</span>
                  </span>
                  <AnimatePresence>
                    {selected && (
                      <motion.span
                        aria-hidden="true"
                        className="absolute right-2.5 top-2.5 grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground"
                        initial={{ scale: 0.3, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.3, opacity: 0, transition: { duration: 0.12 } }}
                        transition={{ type: 'spring', stiffness: 640, damping: 30 }}
                      >
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              );
            })}
          </div>
          {shown.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No retailer matches "{search}". Try another name or the All filter.</p>}
        </ScrollArea>

        <div className="flex shrink-0 gap-2.5">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="h-12 flex-1 rounded-xl bg-muted/70 text-[15px] font-medium text-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => { onSelectBrands?.(picked); onOpenChange(false); }}
            disabled={picked.length === 0}
            className="h-12 flex-1 rounded-xl bg-primary text-[15px] font-medium text-primary-foreground outline-none hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-40"
          >
            {picked.length === 0 ? 'Choose a retailer' : `Use ${picked.length} retailer${picked.length === 1 ? '' : 's'}`}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
