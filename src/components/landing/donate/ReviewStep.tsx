import { motion } from 'motion/react';
import { Coins, Loader2, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EASE_OUT } from './tokens';
import { plainNumber, usd, type Retailer } from './retailers';

export type Provider = 'square' | 'stripe';

const PROVIDERS: Record<Provider, { name: string; hint: string }> = {
  square: { name: 'Square', hint: 'Card, Apple Pay or Google Pay' },
  stripe: { name: 'Stripe', hint: 'Card, Link or wallet' },
};

const NEXT = [
  'You pay on the secure Square or Stripe checkout.',
  "Our team turns each store's share into coupons sized for what families need: one full grocery card, or a few smaller meal coupons.",
  'We email you as your coupons are given out and used, with receipts.',
];

function listNames(retailers: Retailer[]) {
  const names = retailers.map((r) => r.name);
  if (names.length <= 2) return names.join(' and ');
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

interface ReviewStepProps {
  amount: number;
  retailers: Retailer[];
  providers: Provider[];
  busy: Provider | null;
  error: string | null;
  checkoutUrl: string | null;
  onPay: (provider: Provider) => void;
}

export function ReviewStep({ amount, retailers, providers, busy, error, checkoutUrl, onPay }: ReviewStepProps) {
  const single = providers.length === 1;
  return (
    <div>
      <h3 className="font-display text-[2rem] leading-[1.05] text-foreground sm:text-[2.5rem]">Review and donate</h3>
      <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
        {usd.format(amount)} for families, used at {listNames(retailers)}.
      </p>

      <h4 className="mt-7 text-[15px] font-medium text-foreground">What happens next</h4>
      <ol className="mt-3 space-y-3">
        {NEXT.map((line, i) => (
          <motion.li
            key={line}
            className="flex gap-3.5"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08 + i * 0.07, ease: EASE_OUT }}
          >
            <span className="w-4 shrink-0 font-display text-xl leading-6 text-primary tabular-nums">{i + 1}</span>
            <span className="text-[15px] leading-6 text-foreground/85">{line}</span>
          </motion.li>
        ))}
      </ol>

      <p className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
        <Coins className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        This gift earns {plainNumber.format(Math.floor(amount * 10))} Gold Coins.
      </p>

      <div className="mt-7">
        {providers.length === 0 ? (
          <p className="rounded-xl bg-muted/70 p-4 text-sm text-muted-foreground">Online payments are paused for a moment. Please check back soon.</p>
        ) : (
          <div className={cn('grid gap-2.5', providers.length > 1 && 'sm:grid-cols-2')}>
            {providers.map((id, i) => {
              const p = PROVIDERS[id];
              const loading = busy === id;
              return (
                <motion.button
                  key={id}
                  type="button"
                  data-pay-with={id}
                  onClick={() => onPay(id)}
                  disabled={busy !== null}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    'flex min-h-[3.75rem] flex-col items-center justify-center rounded-xl px-4 py-2.5 outline-none transition-colors',
                    'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-wait',
                    i === 0 ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-muted/70 text-foreground hover:bg-muted',
                    busy && !loading && 'opacity-50',
                  )}
                >
                  {loading ? (
                    <span className="flex items-center gap-2 text-[15px] font-medium"><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />Opening {p.name}…</span>
                  ) : (
                    <>
                      <span className="text-[15px] font-medium">{single ? `Donate ${usd.format(amount)}` : `Donate ${usd.format(amount)} with ${p.name}`}</span>
                      <span className="text-xs opacity-75">{single ? `${p.name} · ${p.hint}` : p.hint}</span>
                    </>
                  )}
                </motion.button>
              );
            })}
          </div>
        )}

        {error && (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {error}
            {checkoutUrl && <> <a href={checkoutUrl} className="font-medium underline underline-offset-2">Open the payment page</a>.</>}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-x-2.5 gap-y-2 text-xs text-muted-foreground">
          {(['visa', 'mastercard', 'amex'] as const).map((card) => (
            <span key={card} className="grid h-6 w-9 place-items-center rounded-md bg-white ring-1 ring-inset ring-foreground/10">
              <img src={`/brand-logos/${card}.svg`} alt={card === 'amex' ? 'American Express' : card === 'visa' ? 'Visa' : 'Mastercard'} width={20} height={20} className="h-5 w-5" loading="lazy" decoding="async" />
            </span>
          ))}
          <span>Apple Pay and Google Pay at checkout</span>
        </div>
        <p className="mt-2.5 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>You finish on {single ? `${PROVIDERS[providers[0]].name}'s` : "Square's or Stripe's"} secure page, so we never see your card. Cards from outside the US work too; your bank handles any currency conversion.</span>
        </p>
      </div>
    </div>
  );
}
