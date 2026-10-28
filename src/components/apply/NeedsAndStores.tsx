import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, Search } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { HELP_NEEDS, MAX_PREFERRED_STORES, storesByNeed } from '@/lib/helpNeeds';
import { brandList } from '@/data/brandLogos';
import { BrandSelectorModal } from '@/components/landing/BrandSelectorModal';
import { RetailerLogo } from '@/components/landing/donate/GiftLedger';
import { findRetailer, retailerId } from '@/components/landing/donate/retailers';
import { SPRING } from '@/components/landing/donate/tokens';
import { NeedIcon } from '@/components/needs/NeedIcon';

export { NeedIcon };

const POP = { type: 'spring', stiffness: 640, damping: 30 } as const;

function Tick({ show, small = false }: { show: boolean; small?: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.span
          aria-hidden="true"
          className={cn('absolute grid place-items-center rounded-full bg-primary text-primary-foreground', small ? 'right-2 top-2 h-5 w-5' : 'right-3 top-3 h-6 w-6')}
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.3, opacity: 0, transition: { duration: 0.12 } }}
          transition={POP}
        >
          <Check className={small ? 'h-3 w-3' : 'h-3.5 w-3.5'} strokeWidth={3} />
        </motion.span>
      )}
    </AnimatePresence>
  );
}

const tile = (selected: boolean) => cn(
  'relative rounded-2xl text-left outline-none transition-[background-color,box-shadow,opacity,transform] duration-200',
  'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[.98]',
  selected
    ? 'bg-[hsl(var(--primary-97))] shadow-[inset_0_0_0_2px_hsl(var(--primary))] dark:bg-primary/15'
    : 'bg-muted/70 hover:bg-muted',
);

interface Props {
  needs: string[];
  onNeeds: (next: string[]) => void;
  /** Chosen stores as retailer ids (see retailerId). */
  stores: string[];
  onStores: (next: string[]) => void;
  similarOk: boolean;
  onSimilarOk: (value: boolean) => void;
}

/**
 * The recipient's needs (several allowed) and, as soon as one is chosen, the stores that fit it.
 * Stores are the donor catalogue's own, so every request matches something a donor can give to.
 */
export function NeedsAndStores({ needs, onNeeds, stores, onStores, similarOk, onSimilarOk }: Props) {
  const [browse, setBrowse] = useState(false);
  const groups = storesByNeed(needs);
  const grouped = new Set(groups.flatMap((g) => g.stores.map(retailerId)));
  const extra = stores.filter((id) => !grouped.has(id));
  const full = stores.length >= MAX_PREFERRED_STORES;

  const toggleNeed = (id: string) => onNeeds(needs.includes(id) ? needs.filter((n) => n !== id) : [...needs, id]);
  const toggleStore = (id: string) => {
    if (stores.includes(id)) onStores(stores.filter((s) => s !== id));
    else if (!full) onStores([...stores, id]);
  };

  const storeTile = (id: string) => {
    const retailer = findRetailer(id);
    const selected = stores.includes(id);
    const disabled = full && !selected;
    return (
      <button
        key={id}
        type="button"
        aria-pressed={selected}
        disabled={disabled}
        onClick={() => toggleStore(id)}
        data-store-tile={id}
        className={cn(tile(selected), 'flex min-h-[4.25rem] items-center gap-3 p-3 pr-8', disabled && 'cursor-not-allowed opacity-40 active:scale-100')}
      >
        <RetailerLogo retailer={retailer} className="h-10 w-10 p-1.5" />
        <span className="min-w-0 text-[15px] font-medium leading-snug text-foreground">{retailer.name}</span>
        <Tick show={selected} small />
      </button>
    );
  };

  return (
    <div className="space-y-12">
      <section aria-labelledby="needs-heading">
        <h2 id="needs-heading" className="font-display text-[1.75rem] font-normal leading-tight text-foreground sm:text-[2rem]">What do you need help with?</h2>
        <p className="mt-1.5 text-[15px] text-muted-foreground">Choose all that apply.</p>
        <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 xl:grid-cols-5">
          {HELP_NEEDS.map((need) => {
            const selected = needs.includes(need.id);
            return (
              <button
                key={need.id}
                type="button"
                aria-pressed={selected}
                onClick={() => toggleNeed(need.id)}
                data-need-tile={need.id}
                title={need.hint}
                className={cn(tile(selected), 'flex min-h-[3.75rem] items-center gap-3 p-3.5 pr-9 sm:min-h-[6.5rem] sm:flex-col sm:items-start sm:justify-between sm:p-4')}
              >
                <NeedIcon id={need.id} className={cn('h-5 w-5 shrink-0 transition-colors sm:h-6 sm:w-6', selected ? 'text-primary' : 'text-foreground/70')} />
                <span className="text-[15px] font-medium leading-snug text-foreground sm:pr-4">{need.label}</span>
                <Tick show={selected} />
              </button>
            );
          })}
        </div>
      </section>

      <AnimatePresence initial={false}>
        {needs.length > 0 && (
          <motion.section
            key="stores"
            aria-labelledby="stores-heading"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8, transition: { duration: 0.15 } }}
            transition={SPRING}
          >
            <h2 id="stores-heading" className="font-display text-[1.75rem] font-normal leading-tight text-foreground sm:text-[2rem]">Which stores would help most?</h2>
            <p className="mt-1.5 max-w-[36rem] text-[15px] leading-relaxed text-muted-foreground">
              Pick up to {MAX_PREFERRED_STORES}. Donors see these stores on your page and can give to them directly.
            </p>

            <div className="mt-6 space-y-7">
              <AnimatePresence initial={false}>
                {groups.map(({ need, stores: ids }) => (
                  <motion.div
                    key={need.id}
                    layout="position"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, transition: { duration: 0.12 } }}
                    transition={SPRING}
                  >
                    <h3 className="flex items-center gap-2 font-sans text-sm font-medium text-foreground">
                      <NeedIcon id={need.id} className="h-4 w-4 text-primary" />
                      For {need.label.toLowerCase()}
                    </h3>
                    <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-4">{ids.map((name) => storeTile(retailerId(name)))}</div>
                  </motion.div>
                ))}
                {extra.length > 0 && (
                  <motion.div key="extra" layout="position" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={SPRING}>
                    <h3 className="font-sans text-sm font-medium text-foreground">Other stores you chose</h3>
                    <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-4">{extra.map(storeTile)}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <button
                type="button"
                onClick={() => setBrowse(true)}
                className="inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-medium text-primary outline-none hover:text-primary/80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <Search className="h-4 w-4" aria-hidden="true" />
                Browse all {brandList.length} stores
              </button>
              <p className="text-sm tabular-nums text-muted-foreground" aria-live="polite">
                {stores.length === 0 ? 'Choose at least one store' : `${stores.length} of ${MAX_PREFERRED_STORES} chosen`}
              </p>
            </div>

            <label className="mt-8 flex cursor-pointer items-start justify-between gap-5 rounded-2xl bg-muted/50 p-4 sm:p-5">
              <span>
                <span className="block text-[15px] font-medium text-foreground">Other stores are welcome too</span>
                <span className="mt-0.5 block text-sm leading-relaxed text-muted-foreground">
                  Your page tells donors that gifts to stores you didn't pick still help.
                </span>
              </span>
              <Switch checked={similarOk} onCheckedChange={onSimilarOk} aria-label="Other stores are welcome too" className="mt-0.5 shrink-0" />
            </label>
          </motion.section>
        )}
      </AnimatePresence>

      <BrandSelectorModal
        open={browse}
        onOpenChange={setBrowse}
        selectedBrands={stores}
        onSelectBrands={(next) => onStores(next.slice(0, MAX_PREFERRED_STORES))}
        maxBrands={MAX_PREFERRED_STORES}
      />
    </div>
  );
}
