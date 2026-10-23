import { AnimatePresence, motion } from 'motion/react';
import { Check, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MAX_RETAILERS } from '@/lib/donationSplit';
import { brandList } from '@/data/brandLogos';
import { RetailerLogo } from './GiftLedger';
import { SPRING } from './tokens';
import { CATEGORY_LABEL, POPULAR_RETAILERS, type Retailer } from './retailers';

const POP = { type: 'spring', stiffness: 640, damping: 30 } as const;

function RetailerTile({ retailer, selected, disabled, requested = false, onToggle }: { retailer: Retailer; selected: boolean; disabled: boolean; requested?: boolean; onToggle: () => void }) {
  return (
    <motion.button
      type="button"
      layout="position"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onToggle}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      transition={SPRING}
      data-retailer-tile={retailer.id}
      className={cn(
        'relative flex min-h-[7.5rem] flex-col items-start justify-between gap-3 rounded-2xl p-4 text-left outline-none transition-[background-color,box-shadow,opacity] duration-200',
        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        selected
          ? 'bg-[hsl(var(--primary-97))] shadow-[inset_0_0_0_2px_hsl(var(--primary))] dark:bg-primary/15'
          : 'bg-muted/70 hover:bg-muted',
        disabled && 'cursor-not-allowed opacity-40 hover:bg-muted/70',
      )}
    >
      <RetailerLogo retailer={retailer} className="h-11 w-11 p-1.5" />
      <span className="block min-w-0">
        <span className="block truncate text-[15px] font-medium text-foreground">{retailer.name}</span>
        {requested
          ? <span className="block truncate text-xs font-medium text-primary">Requested</span>
          : <span className="block truncate text-xs text-muted-foreground">{CATEGORY_LABEL[retailer.category]}</span>}
      </span>
      <AnimatePresence>
        {selected && (
          <motion.span
            aria-hidden="true"
            className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full bg-primary text-primary-foreground"
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.3, opacity: 0, transition: { duration: 0.12 } }}
            transition={POP}
          >
            <Check className="h-3.5 w-3.5" strokeWidth={3} />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

interface FundraiserRequest {
  title: string;
  /** The stores the fundraiser asked for, in its own order. */
  stores: Retailer[];
  similarOk: boolean;
}

export function RetailerStep({ chosen, onToggle, onBrowse, request }: { chosen: Retailer[]; onToggle: (r: Retailer) => void; onBrowse: () => void; request?: FundraiserRequest | null }) {
  const ids = new Set(chosen.map((r) => r.id));
  const requested = request?.stores ?? [];
  const requestedIds = new Set(requested.map((r) => r.id));
  // The fundraiser's own stores first, then popular stores, then anything picked from the full list,
  // so every choice stays visible.
  const tiles: Retailer[] = [];
  for (const r of [...requested, ...POPULAR_RETAILERS, ...chosen]) if (!tiles.some((t) => t.id === r.id)) tiles.push(r);
  const full = chosen.length >= MAX_RETAILERS;
  return (
    <div>
      <h3 className="font-display text-[2rem] leading-[1.05] text-foreground sm:text-[2.5rem]">Where should your gift be used?</h3>
      <p className="mt-2 max-w-[34rem] text-[15px] leading-relaxed text-muted-foreground">
        {requested.length > 0
          ? <>Choose up to {MAX_RETAILERS} stores. <span className="text-foreground">{request?.title ? <>“{request.title}”</> : 'This fundraiser'} asked for the stores marked Requested.</span>{request?.similarOk ? ' Other stores are welcome too.' : ''}</>
          : <>Choose up to {MAX_RETAILERS} stores. Families use your gift there for food and everyday essentials.</>}
      </p>
      <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
        {tiles.map((r) => (
          <RetailerTile key={r.id} retailer={r} selected={ids.has(r.id)} disabled={full && !ids.has(r.id)} requested={requestedIds.has(r.id)} onToggle={() => onToggle(r)} />
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <button
          type="button"
          onClick={onBrowse}
          className="inline-flex items-center gap-2 rounded-md py-1 text-sm font-medium text-primary outline-none hover:text-primary/80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Search className="h-4 w-4" aria-hidden="true" />
          Browse all {brandList.length} retailers
        </button>
        <p className="text-sm tabular-nums text-muted-foreground" aria-live="polite">
          {full ? `${MAX_RETAILERS} chosen, the most for one gift` : `${chosen.length} of ${MAX_RETAILERS} chosen`}
        </p>
      </div>
    </div>
  );
}
