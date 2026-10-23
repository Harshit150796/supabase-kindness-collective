import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { AnimatedAmount } from './motion';
import { SPRING } from './tokens';
import { SHARE_TONES, usd, type Retailer } from './retailers';

/** The donation as one bar, one segment per retailer, each as wide as its dollars. */
export function SplitBar({ retailers, shares, className }: { retailers: Retailer[]; shares: number[]; className?: string }) {
  const label = retailers.length
    ? retailers.map((r, i) => `${r.name} ${usd.format(shares[i] ?? 0)}`).join(', ')
    : 'No retailers chosen yet';
  return (
    <div role="img" aria-label={label} className={cn('flex h-3 gap-[3px] overflow-hidden rounded-full bg-white/10', className)}>
      <AnimatePresence initial={false}>
        {retailers.map((r, i) => (
          <motion.span
            key={r.id}
            data-split-segment
            className="block h-full"
            style={{ flexBasis: 0, background: SHARE_TONES[i % SHARE_TONES.length] }}
            initial={{ flexGrow: 0 }}
            animate={{ flexGrow: shares[i] ?? 0 }}
            exit={{ flexGrow: 0 }}
            transition={SPRING}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

export function RetailerLogo({ retailer, className }: { retailer: Retailer; className?: string }) {
  return (
    <span className={cn('grid shrink-0 place-items-center overflow-hidden rounded-lg bg-white', className)}>
      {retailer.logo
        ? <img src={retailer.logo} alt="" width={48} height={48} loading="lazy" decoding="async" className="h-full w-full object-contain" />
        : <span className="text-sm font-semibold text-primary-20">{retailer.name.charAt(0)}</span>}
    </span>
  );
}

/**
 * The deep-green "Your gift" panel: the amount, the split bar and each retailer's dollars.
 * On phones it is a compact strip above the steps and lists the retailers only on the review step.
 */
export function GiftLedger({ amount, retailers, shares, step }: { amount: number; retailers: Retailer[]; shares: number[]; step: number }) {
  const listOnPhone = step === 3;
  return (
    <aside aria-label="Your gift" data-gift-ledger className="flex w-full flex-col bg-primary-20 px-5 py-5 text-white sm:px-8 sm:py-7 lg:px-10 lg:py-10">
      <div className="flex items-end justify-between gap-4 lg:block">
        <div>
          <p className="text-sm text-white/70">Your gift</p>
          <AnimatedAmount value={amount} className="mt-1 block font-display text-[3.25rem] leading-[0.95] tabular-nums sm:text-6xl lg:mt-2 lg:text-[5.5rem]" />
        </div>
        <p className="pb-1 text-sm text-white/70 lg:hidden">
          {retailers.length === 0 ? 'No retailers yet' : retailers.length === 1 ? retailers[0].name : `${retailers.length} retailers`}
        </p>
      </div>

      <SplitBar retailers={retailers} shares={shares} className="mt-4 lg:mt-8" />

      <div className={cn('mt-6', !listOnPhone && 'hidden lg:block')}>
        {retailers.length === 0 ? (
          <p className="text-[15px] leading-relaxed text-white/70">Choose up to five retailers. Each one shows here with its share of your gift.</p>
        ) : (
          <ul className="space-y-3.5">
            <AnimatePresence initial={false}>
              {retailers.map((r, i) => (
                <motion.li
                  key={r.id}
                  layout="position"
                  className="flex items-center gap-3"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12, transition: { duration: 0.15 } }}
                  transition={SPRING}
                >
                  <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ background: SHARE_TONES[i % SHARE_TONES.length] }} />
                  <RetailerLogo retailer={r} className="h-8 w-8 p-1" />
                  <span className="min-w-0 flex-1 truncate text-[15px] text-white/90">{r.name}</span>
                  <AnimatedAmount value={shares[i] ?? 0} className="font-display text-[1.65rem] leading-none tabular-nums" />
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>

      <p className="mt-auto hidden pt-10 text-sm leading-relaxed text-white/65 lg:block">
        All of it reaches families as coupons for these stores, sized by our team for what is needed. Nothing is taken out for fees.
      </p>
    </aside>
  );
}

const STEPS = ['Retailers', 'Amount', 'Review'] as const;

/** Three steps with a track that fills as you go; finished steps can be revisited. */
export function StepTrack({ step, reachable, onGo }: { step: number; reachable: (n: number) => boolean; onGo: (n: number) => void }) {
  return (
    <ol className="grid grid-cols-3 gap-2 sm:gap-3" aria-label="Donation steps">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const current = n === step;
        const done = n < step;
        return (
          <li key={label}>
            <button
              type="button"
              onClick={() => onGo(n)}
              disabled={current || !reachable(n)}
              aria-current={current ? 'step' : undefined}
              className="group w-full rounded-md pb-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 disabled:cursor-default"
            >
              <span className="block h-[3px] overflow-hidden rounded-full bg-border">
                <motion.span className="block h-full rounded-full bg-primary" initial={false} animate={{ width: n <= step ? '100%' : '0%' }} transition={SPRING} />
              </span>
              <span className="mt-3 flex items-baseline gap-1.5 text-sm">
                <span className={cn('tabular-nums', current || done ? 'text-primary' : 'text-muted-foreground')}>{n}</span>
                <span className={cn(current ? 'font-medium text-foreground' : done ? 'text-foreground group-hover:text-primary' : 'text-muted-foreground')}>{label}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
