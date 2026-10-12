import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { LineReveal, Reveal } from '@/components/ui/editorial-motion';
import { MAX_RETAILERS, evenSplit, minTotal, percentages, resizeShares, setShare } from '@/lib/donationSplit';
import { BrandSelectorModal } from './BrandSelectorModal';
import { GiftLedger, StepTrack } from './donate/GiftLedger';
import { RetailerStep } from './donate/RetailerStep';
import { AmountStep } from './donate/AmountStep';
import { ReviewStep, type Provider } from './donate/ReviewStep';
import { AnimatedHeight } from './donate/motion';
import { PRESET_AMOUNTS, SPRING, amountProblem, type SplitMode } from './donate/tokens';
import { findRetailer, usd } from './donate/retailers';

const DEFAULT_AMOUNT = 50;
const MAX_RETRIES = 2;
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

/** The message an edge function sent back with a non-2xx status, when there is one. */
async function functionError(error: unknown): Promise<string> {
  const context = (error as { context?: Response } | null)?.context;
  if (context && typeof context.clone === 'function') {
    try {
      const body = await context.clone().json();
      if (body?.error) return String(body.error);
    } catch { /* not JSON */ }
  }
  return error instanceof Error ? error.message : '';
}

const stepMotion = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 28 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir * -28 }),
};

/**
 * Three steps: retailers, amount (with a dollar split that always adds up), review and pay.
 * Donors only ever see dollars per retailer; each retailer's share reaches the server as one coupon
 * slot, and the team sizes the real coupons by hand (supabase/functions/_shared/brand-split.ts).
 */
export function DonationFlow() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [ids, setIds] = useState<string[]>([]);
  const [amount, setAmount] = useState(DEFAULT_AMOUNT);
  const [other, setOther] = useState(false);
  const [otherText, setOtherText] = useState('');
  const [raisedNote, setRaisedNote] = useState<string | null>(null);
  const [mode, setMode] = useState<SplitMode>('even');
  const [custom, setCustom] = useState<number[]>([]);
  const [browse, setBrowse] = useState(false);
  const [providers, setProviders] = useState<Provider[]>(['square', 'stripe']);
  const [busy, setBusy] = useState<Provider | null>(null);
  const [payError, setPayError] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase
      .from('payment_settings' as never)
      .select('square_enabled, stripe_enabled')
      .eq('id', 1)
      .maybeSingle()
      .then(({ data }) => {
        const d = data as { square_enabled: boolean; stripe_enabled: boolean } | null;
        if (d) setProviders([d.square_enabled && 'square', d.stripe_enabled && 'stripe'].filter(Boolean) as Provider[]);
      });
  }, []);

  const retailers = useMemo(() => ids.map(findRetailer), [ids]);
  const count = retailers.length;
  const minimum = minTotal(count);
  const shares = useMemo(() => {
    if (!count) return [];
    if (mode === 'even' || custom.length !== count) return evenSplit(amount, count);
    return sum(custom) === amount ? custom : resizeShares(custom, amount);
  }, [amount, count, custom, mode]);
  const problem = amountProblem(amount, minimum, count);

  // A new set of retailers starts from an even split, and the amount rises if it can no longer
  // give every retailer its minimum.
  const chooseRetailers = useCallback((next: string[]) => {
    setIds(next);
    setMode('even');
    setCustom([]);
    const min = minTotal(next.length);
    if (!other && amount < min) {
      const raised = PRESET_AMOUNTS.find((p) => p >= min) ?? min;
      setAmount(raised);
      setRaisedNote(`Raised to ${usd.format(raised)} so each retailer gets at least $5.`);
    } else {
      setRaisedNote(null);
    }
  }, [amount, other]);

  const toggleRetailer = (id: string) => {
    if (ids.includes(id)) chooseRetailers(ids.filter((x) => x !== id));
    else if (ids.length < MAX_RETAILERS) chooseRetailers([...ids, id]);
  };

  const reachable = (n: number) => n === 1 || (n === 2 && count > 0) || (n === 3 && count > 0 && !problem);
  const go = (n: number) => {
    if (!reachable(n) || n === step) return;
    setDirection(n > step ? 1 : -1);
    setStep(n);
    setPayError(null);
    // Bring the card's top into view when the new step starts above the fold (long lists on phones).
    const top = cardRef.current?.getBoundingClientRect().top ?? 0;
    if (top < 0) cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const pay = async (provider: Provider, attempt = 0): Promise<void> => {
    setBusy(provider);
    setPayError(null);
    setCheckoutUrl(null);
    try {
      const pct = percentages(shares);
      const brandAllocations = retailers.map((r, i) => ({ brand: r.name, brandId: r.id, percent: pct[i], amount: shares[i] }));
      const fundraiserId = new URLSearchParams(window.location.search).get('fundraiser');
      const { data, error } = await supabase.functions.invoke(provider === 'stripe' ? 'create-stripe-checkout' : 'create-donation-checkout', {
        body: {
          amount,
          brandName: brandAllocations[0]?.brand ?? '',
          brandId: brandAllocations[0]?.brandId ?? '',
          brandAllocations,
          userId: user?.id ?? null,
          userEmail: user?.email ?? null,
          fundraiserId: fundraiserId || null,
        },
      });
      if (error) throw error;
      if (!data?.url) throw new Error('No checkout page came back. Please try again.');
      setCheckoutUrl(data.url);
      // Same tab only: never open a new tab for payments.
      window.location.assign(data.url);
    } catch (error) {
      const message = await functionError(error);
      if (attempt < MAX_RETRIES && /network|timeout|fetch/i.test(message)) {
        toast({ title: 'Connection issue', description: 'Trying again…' });
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return pay(provider, attempt + 1);
      }
      const unavailable = /payments are temporarily unavailable|payments_unavailable|cannot currently make live charges|currently turned off/i.test(message);
      setPayError(unavailable
        ? "We can't take donations through this checkout right now. Please try the other option or come back a little later."
        : message || 'Checkout did not open. Please try again.');
      setBusy(null);
    }
  };

  return (
    <section id="donation-flow" className="relative overflow-hidden py-24 md:py-36" style={{ backgroundColor: 'hsl(var(--primary-93))' }}>
      <div className="container relative mx-auto px-4">
        <div className="mx-auto mb-10 max-w-3xl text-center md:mb-14">
          <LineReveal><h2 className="font-display text-5xl font-normal leading-none text-foreground md:text-6xl">Choose where your help can be used.</h2></LineReveal>
          <Reveal delay={0.1} className="mt-5"><p className="text-lg leading-relaxed text-muted-foreground">Pick retailers, choose an amount, and see exactly where every dollar goes.</p></Reveal>
        </div>

        <Reveal className="mx-auto max-w-5xl"><div ref={cardRef} data-donate-card className="grid scroll-mt-24 overflow-hidden rounded-[1.75rem] bg-card shadow-card-hover lg:grid-cols-[minmax(0,1fr)_minmax(0,25rem)]">
          <div className="order-2 flex flex-col p-5 sm:p-8 lg:order-1 lg:p-10">
            <StepTrack step={step} reachable={reachable} onGo={go} />

            <AnimatedHeight className="mt-8">
              <AnimatePresence mode="popLayout" initial={false} custom={direction}>
                <motion.div key={step} custom={direction} variants={stepMotion} initial="enter" animate="center" exit="exit" transition={SPRING}>
                  {step === 1 && <RetailerStep chosen={retailers} onToggle={(r) => toggleRetailer(r.id)} onBrowse={() => setBrowse(true)} />}
                  {step === 2 && (
                    <AmountStep
                      retailers={retailers}
                      amount={amount}
                      minimum={minimum}
                      other={other}
                      otherText={otherText}
                      raisedNote={raisedNote}
                      onPreset={(value) => { setOther(false); setOtherText(''); setAmount(value); setRaisedNote(null); }}
                      onOther={() => { setOther(true); setOtherText(String(amount)); setRaisedNote(null); }}
                      onOtherText={(text) => { setOtherText(text); setAmount(parseInt(text, 10) || 0); }}
                      shares={shares}
                      mode={mode}
                      onMode={(m) => { if (m === 'custom') setCustom(shares); setMode(m); }}
                      onShare={(i, value) => { setCustom(setShare(shares, i, value)); setMode('custom'); }}
                    />
                  )}
                  {step === 3 && (
                    <ReviewStep amount={amount} retailers={retailers} providers={providers} busy={busy} error={payError} checkoutUrl={checkoutUrl} onPay={(p) => void pay(p)} />
                  )}
                </motion.div>
              </AnimatePresence>
            </AnimatedHeight>

            <div className="mt-8 flex items-center justify-between gap-3">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => go(step - 1)}
                  disabled={busy !== null}
                  className="inline-flex h-12 items-center gap-2 rounded-xl px-3 text-[15px] font-medium text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 sm:-ml-3"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  Back
                </button>
              ) : <span />}
              {step < 3 && (
                <motion.button
                  type="button"
                  onClick={() => go(step + 1)}
                  disabled={!reachable(step + 1)}
                  whileTap={{ scale: 0.98 }}
                  data-donate-continue
                  className="inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-6 text-[15px] font-medium text-primary-foreground outline-none transition-[background-color,opacity] hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {step === 1 ? 'Choose amount' : 'Review gift'}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </motion.button>
              )}
            </div>
          </div>

          <div className="order-1 lg:order-2 lg:flex">
            <GiftLedger amount={amount} retailers={retailers} shares={shares} step={step} />
          </div>
        </div></Reveal>

        <BrandSelectorModal
          open={browse}
          onOpenChange={setBrowse}
          selectedBrands={ids}
          onSelectBrands={(next) => chooseRetailers(next.slice(0, MAX_RETAILERS))}
          maxBrands={MAX_RETAILERS}
          multiSelect
        />
      </div>
    </section>
  );
}
