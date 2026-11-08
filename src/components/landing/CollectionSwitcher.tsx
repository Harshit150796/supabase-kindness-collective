import { useState } from 'react';
import { Check, ChevronDown, Megaphone, Target, TrendingUp, Zap, type LucideIcon } from 'lucide-react';
import { COLLECTIONS, type CollectionId } from '@/lib/fundraiserCollections';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

const ICONS: Record<CollectionId, LucideIcon> = {
  trending: TrendingUp,
  close: Target,
  new: Megaphone,
  momentum: Zap,
};

/** The list of collections: an icon, the name and one line saying what it holds, like GoFundMe's menu. */
function Options({ value, onChoose }: { value: CollectionId; onChoose: (id: CollectionId) => void }) {
  return (
    <div role="radiogroup" aria-label="Show fundraisers" className="flex flex-col">
      {COLLECTIONS.map((c) => {
        const Icon = ICONS[c.id];
        const active = c.id === value;
        return (
          <button
            key={c.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChoose(c.id)}
            className={cn('flex min-h-[64px] w-full items-center gap-3.5 rounded-xl px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', active ? 'bg-[hsl(var(--primary-93))]' : 'hover:bg-muted')}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground"><Icon className="h-[18px] w-[18px]" strokeWidth={1.75} /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-semibold leading-tight text-foreground">{c.label}</span>
              <span className="mt-0.5 block text-sm leading-snug text-muted-foreground">{c.description}</span>
            </span>
            {active && <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />}
          </button>
        );
      })}
    </div>
  );
}

/**
 * The "Trending ▾" button above the homepage fundraisers. Laptops open a menu under it; phones open a
 * bottom sheet titled "Filter by", as GoFundMe does.
 */
export function CollectionSwitcher({ value, onChange }: { value: CollectionId; onChange: (id: CollectionId) => void }) {
  const [open, setOpen] = useState(false);
  const phone = useIsMobile();
  const current = COLLECTIONS.find((c) => c.id === value) ?? COLLECTIONS[0];
  const choose = (id: CollectionId) => { setOpen(false); if (id !== value) onChange(id); };
  const trigger = (
    <button
      type="button"
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-label={`Showing ${current.label}. Change which fundraisers are shown`}
      className="inline-flex min-h-[52px] items-center gap-2 self-start rounded-full border border-foreground/25 bg-card pl-5 pr-4 text-base font-semibold text-foreground transition-colors hover:border-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      onClick={phone ? () => setOpen(true) : undefined}
    >
      {current.label}
      <ChevronDown className={cn('h-4 w-4 transition-transform duration-200', open && 'rotate-180')} aria-hidden="true" />
    </button>
  );
  if (phone) {
    return (
      <>
        {trigger}
        <Drawer open={open} onOpenChange={setOpen} shouldScaleBackground={false}>
          <DrawerContent>
            <DrawerHeader className="border-b border-border text-left"><DrawerTitle>Filter by</DrawerTitle></DrawerHeader>
            <div className="p-3 pb-[max(1rem,env(safe-area-inset-bottom))]"><Options value={value} onChoose={choose} /></div>
          </DrawerContent>
        </Drawer>
      </>
    );
  }
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align="start" sideOffset={10} className="w-[380px] rounded-2xl p-2 shadow-xl">
        <Options value={value} onChoose={choose} />
      </PopoverContent>
    </Popover>
  );
}
