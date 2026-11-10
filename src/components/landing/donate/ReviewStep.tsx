import { AnimatePresence, motion } from 'motion/react';
import { Check, Coins, Loader2, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TIP_PERCENTS, TYPICAL_TIP_PERCENT, tipCentsFor, type Charge, type Provider } from '../../../../supabase/functions/_shared/checkout-total.ts';
import { EASE_OUT, SPRING } from './tokens';
import { plainNumber, usd, type Retailer } from './retailers';
import { AgreementNotice } from '@/components/legal/AgreementNotice';

export type { Provider };
/** null = nothing chosen yet (no tip), a number = that percent, 'other' = a typed dollar amount. */
export type TipChoice = null | 0 | (typeof TIP_PERCENTS)[number] | 'other';

const PROVIDERS: Record<Provider, { name: string; hint: string }> = {
  square: { name: 'Square', hint: 'Card, Apple Pay or Google Pay' },
  stripe: { name: 'Stripe', hint: 'Card, Link or wallet' },
};

const cents = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
const money = (c: number) => (c % 100 ? cents : usd).format(c / 100);

const NEXT = [
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
  provider: Provider;
  onProvider: (p: Provider) => void;
  tip: TipChoice;
  otherTip: string;
  onTip: (choice: TipChoice) => void;
  onOtherTip: (text: string) => void;
  coverFee: boolean;
  onCoverFee: (on: boolean) => void;
  monthly: boolean;
  onMonthly: (on: boolean) => void;
  signedIn: boolean;
  /** The fee that would be added if covered, for the chosen processor. */
  feeIfCovered: number;
  charge: Charge;
  busy: boolean;
  error: string | null;
  checkoutUrl: string | null;
  onPay: () => void;
  /** Signed-in donor's saved cards; choosing one pays right here instead of on Square's page. */
  savedCards?: { square_card_id: string; brand: string | null; last4: string | null }[];
  savedCard?: string | null;
  onSavedCard?: (id: string | null) => void;
}

function Row({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className={cn('flex items-baseline justify-between gap-4', strong ? 'pt-3 text-foreground' : 'text-muted-foreground')}>
      <span className={strong ? 'text-[15px] font-medium' : 'text-sm'}>{label}</span>
      <span className={cn('tabular-nums', strong ? 'font-display text-[1.9rem] leading-none text-foreground' : 'text-sm')}>{money(value)}</span>
    </div>
  );
}

export function ReviewStep(props: ReviewStepProps) {
  const { amount, retailers, providers, provider, onProvider, tip, otherTip, onTip, onOtherTip, coverFee, onCoverFee, monthly, onMonthly, signedIn, feeIfCovered, charge, busy, error, checkoutUrl, onPay, savedCards = [], savedCard = null, onSavedCard } = props;
  const giftCents = Math.round(amount * 100);
  const choices: { id: TipChoice; label: string; sub?: string }[] = [
    { id: 0, label: 'No tip' },
    ...TIP_PERCENTS.map((p) => ({ id: p, label: `${p}%`, sub: money(tipCentsFor(giftCents, p)) })),
    { id: 'other', label: 'Other' },
  ];
  return (
    <div>
      <h3 className="font-display text-[2rem] leading-[1.05] text-foreground sm:text-[2.5rem]">Review and donate</h3>
      <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
        All {usd.format(amount)} goes to families, used at {listNames(retailers)}.
      </p>

      <ol className="mt-5 space-y-2.5">
        {NEXT.map((line, i) => (
          <motion.li key={line} className="flex gap-3.5" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.08 + i * 0.07, ease: EASE_OUT }}>
            <span className="w-4 shrink-0 font-display text-xl leading-6 text-primary tabular-nums">{i + 1}</span>
            <span className="text-[15px] leading-6 text-foreground/85">{line}</span>
          </motion.li>
        ))}
      </ol>

      {/* Optional tip: 15% starts selected; donors can change it. */}
      <div className="mt-7" data-tip-picker>
        <h4 className="text-[15px] font-medium text-foreground">Add a tip for CouponDonation (optional)</h4>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Your gift goes to families in full, so tips are how we pay for running the platform. Most donors leave about {TYPICAL_TIP_PERCENT}%.
        </p>
        <div role="radiogroup" aria-label="Tip" className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
          {choices.map((c) => {
            const on = tip === c.id;
            return (
              <button
                key={String(c.id)}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => onTip(c.id)}
                data-tip-choice={String(c.id)}
                className={cn('relative flex h-14 flex-col items-center justify-center rounded-xl text-sm font-medium tabular-nums outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[.98]', on ? 'text-primary-foreground' : 'bg-muted/70 text-foreground hover:bg-muted')}
              >
                {on && <motion.span layoutId="donate-tip-choice" className="absolute inset-0 rounded-xl bg-primary" transition={SPRING} />}
                <span className="relative">{c.label}</span>
                {c.sub && <span className={cn('relative text-xs font-normal', on ? 'opacity-80' : 'text-muted-foreground')}>{c.sub}</span>}
              </button>
            );
          })}
        </div>
        <AnimatePresence initial={false}>
          {tip === 'other' && (
            <motion.label key="other-tip" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={SPRING} className="block overflow-hidden">
              <span className="mt-3 flex h-12 items-center gap-1 rounded-xl bg-muted/70 px-3 focus-within:ring-2 focus-within:ring-ring">
                <span className="text-muted-foreground" aria-hidden="true">$</span>
                <input
                  autoFocus
                  inputMode="decimal"
                  aria-label="Tip in dollars"
                  placeholder="0"
                  value={otherTip}
                  onChange={(e) => onOtherTip(e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1').slice(0, 7))}
                  className="w-full min-w-0 bg-transparent text-[15px] tabular-nums text-foreground outline-none"
                />
              </span>
            </motion.label>
          )}
        </AnimatePresence>
      </div>

      {/* Card fee: ticked by default. */}
      <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl bg-muted/50 p-4" data-cover-fee>
        <span className="relative mt-0.5 grid h-5 w-5 shrink-0 place-items-center">
          <input type="checkbox" checked={coverFee} onChange={(e) => onCoverFee(e.target.checked)} className="peer absolute inset-0 m-0 cursor-pointer appearance-none rounded-md border-2 border-primary bg-background checked:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
          <Check className="pointer-events-none relative h-3.5 w-3.5 text-primary-foreground opacity-0 peer-checked:opacity-100" strokeWidth={3} aria-hidden="true" />
        </span>
        <span className="text-[15px] leading-relaxed">
          <span className="font-medium text-foreground">Cover the card processing fee ({money(feeIfCovered)})</span>
          <span className="block text-sm text-muted-foreground">
            {coverFee ? `${PROVIDERS[provider].name}'s fee is added on top, so nothing comes out of the gift.` : 'We pay the fee from tips instead, so families still get the full gift.'}
          </span>
        </span>
      </label>

      {providers.length > 1 && (
        <div className="mt-5">
          <h4 className="text-[15px] font-medium text-foreground">Pay with</h4>
          <div role="radiogroup" aria-label="Payment" className="mt-2 grid gap-2 sm:grid-cols-2">
            {providers.map((id) => {
              const on = provider === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => onProvider(id)}
                  data-provider={id}
                  className={cn('flex flex-col items-start rounded-xl px-4 py-3 text-left outline-none transition-[background-color,box-shadow] focus-visible:ring-2 focus-visible:ring-ring', on ? 'bg-[hsl(var(--primary-97))] shadow-[inset_0_0_0_2px_hsl(var(--primary))] dark:bg-primary/15' : 'bg-muted/70 hover:bg-muted')}
                >
                  <span className="text-[15px] font-medium text-foreground">{PROVIDERS[id].name}</span>
                  <span className="text-xs text-muted-foreground">{PROVIDERS[id].hint}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-6 space-y-1.5 border-t border-border pt-4" data-charge-summary>
        <Row label="Gift for families (100%)" value={charge.giftCents} />
        <Row label="Tip to CouponDonation" value={charge.tipCents} />
        <Row label={coverFee ? 'Card processing fee you cover' : 'Card processing fee (paid from tips)'} value={charge.feeCents} />
        <Row label={monthly ? 'Total today, then every month' : 'Total today'} value={charge.totalCents} strong />
      </div>

      <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
        <Coins className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        This gift earns {plainNumber.format(Math.floor(amount * 10))} Gold Coins.
      </p>

      {/* Monthly: unticked by default; the donor must choose it. */}
      <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl bg-muted/50 p-4" data-monthly>
        <span className="relative mt-0.5 grid h-5 w-5 shrink-0 place-items-center">
          <input type="checkbox" checked={monthly} onChange={(e) => onMonthly(e.target.checked)} className="peer absolute inset-0 m-0 cursor-pointer appearance-none rounded-md border-2 border-primary bg-background checked:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
          <Check className="pointer-events-none relative h-3.5 w-3.5 text-primary-foreground opacity-0 peer-checked:opacity-100" strokeWidth={3} aria-hidden="true" />
        </span>
        <span className="text-[15px] leading-relaxed">
          <span className="font-medium text-foreground">Yes, give {money(charge.totalCents)} every month</span>
          <span className="block text-sm text-muted-foreground">
            {monthly
              ? `Square saves your card and charges this same amount each month until you cancel. Cancel any time from your dashboard${signedIn ? '' : ' (sign up with the email you pay with)'} or from Square's monthly receipt.`
              : 'Optional. Leave unticked to give once.'}
          </span>
        </span>
      </label>

      {savedCards.length > 0 && !monthly && onSavedCard && (
        <fieldset className="mt-5 space-y-2" data-saved-cards>
          <legend className="mb-2 text-sm font-medium text-foreground">Pay with</legend>
          {[{ square_card_id: '', brand: null, last4: null }, ...savedCards].map((c) => (
            <label key={c.square_card_id || 'new'} className="flex cursor-pointer items-center gap-3 rounded-xl bg-muted/50 px-4 py-3 text-[15px]">
              <input type="radio" name="saved-card" className="accent-primary" checked={(savedCard ?? '') === c.square_card_id} onChange={() => onSavedCard(c.square_card_id || null)} />
              {c.square_card_id ? <span className="tabular-nums">{c.brand ?? 'Card'} •••• {c.last4 ?? '----'}</span> : <span>A new card or wallet (Square's page)</span>}
            </label>
          ))}
        </fieldset>
      )}

      <div className="mt-5">
        {providers.length === 0 ? (
          <p className="rounded-xl bg-muted/70 p-4 text-sm text-muted-foreground">Online payments are paused for a moment. Please check back soon.</p>
        ) : (
          <>
          <AgreementNotice action="Donate" donate className="mb-3 text-[13px]" />
          <motion.button
            type="button"
            data-pay-with={provider}
            onClick={onPay}
            disabled={busy}
            whileTap={{ scale: 0.98 }}
            className="flex min-h-[3.75rem] w-full flex-col items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-primary-foreground outline-none transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-wait"
          >
            {busy ? (
              <span className="flex items-center gap-2 text-[15px] font-medium"><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />Opening {PROVIDERS[provider].name}…</span>
            ) : (
              <>
                <span className="text-[15px] font-medium tabular-nums">Donate {money(charge.totalCents)}{monthly ? ' monthly' : ''}</span>
                <span className="text-xs opacity-75">with {PROVIDERS[provider].name} · {PROVIDERS[provider].hint}</span>
              </>
            )}
          </motion.button>
          </>
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
          <span>Apple Pay and Google Pay appear automatically on phones and browsers that support them</span>
        </div>
        <p className="mt-2.5 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>You finish on {PROVIDERS[provider].name}'s secure page, so we never see your card. Your receipt lists the gift, tip and fee separately.</span>
        </p>
      </div>
    </div>
  );
}
