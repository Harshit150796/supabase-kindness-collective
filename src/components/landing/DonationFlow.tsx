import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { LineReveal, Reveal } from '@/components/ui/editorial-motion';
import { MAX_RETAILERS, MIN_SHARE, evenSplit, minTotal, percentages, resizeShares, setShare } from '@/lib/donationSplit';
import { BrandSelectorModal } from './BrandSelectorModal';
import { GiftLedger, StepTrack } from './donate/GiftLedger';
import { RetailerStep } from './donate/RetailerStep';
import { AmountStep } from './donate/AmountStep';
import { UpdatesOptIn, recordUpdatesConsent } from '@/components/UpdatesOptIn';
import { ReviewStep, type Provider, type TipChoice } from './donate/ReviewStep';
import { DEFAULT_TIP_PERCENT, MAX_TIP_CENTS, computeCharge, coveredFeeCents, tipCentsFor } from '../../../supabase/functions/_shared/checkout-total.ts';
import { AnimatedHeight } from './donate/motion';
import { PRESET_AMOUNTS, SPRING, amountProblem, type SplitMode } from './donate/tokens';
import { findRetailer, retailerId, usd, type Retailer } from './donate/retailers';
import { brandList } from '@/data/brandLogos';
import { DonateCardPromo } from './donate/DonateCardPromo';

const MAX_RETRIES = 2;
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const LEDGER_WIDTH = 400;

/** True from the laptop breakpoint (lg), where the gift panel sits beside the steps. */
function useWide() {
  const query = '(min-width: 1024px)';
  const [wide, setWide] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setWide(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return wide;
}

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
 * No amount is suggested: the gift panel opens only once the donor has chosen one on step 2.
 * Donors only ever see dollars per retailer; each retailer's share reaches the server as one coupon
 * slot, and the team sizes the real coupons by hand (supabase/functions/_shared/brand-split.ts).
 */
export function DonationFlow() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [ids, setIds] = useState<string[]>(() => {
    // "Give at Walmart" on a fundraiser page opens with that store chosen.
    const store = typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('store');
    return store && brandList.some((b) => retailerId(b.name) === retailerId(store)) ? [retailerId(store)] : [];
  });
  const [request, setRequest] = useState<{ title: string; stores: Retailer[]; similarOk: boolean } | null>(null);
  // Giving to a fundraiser: its requested stores come first in the store step.
  useEffect(() => {
    const fundraiserId = new URLSearchParams(window.location.search).get('fundraiser');
    if (!fundraiserId) return;
    let live = true;
    supabase
      .from('fundraisers')
      .select('title, preferred_brands, similar_stores_ok')
      .eq('id', fundraiserId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!live || error || !data) return;
        const stores = (data.preferred_brands ?? []).map(findRetailer).filter((r) => !!r.logo);
        if (stores.length) setRequest({ title: data.title, stores, similarOk: data.similar_stores_ok !== false });
      });
    return () => { live = false; };
  }, []);
  const [amount, setAmount] = useState(0); // 0 until the donor chooses
  const [other, setOther] = useState(false);
  const [otherText, setOtherText] = useState('');
  const [raisedNote, setRaisedNote] = useState<string | null>(null);
  const [mode, setMode] = useState<SplitMode>('even');
  const [custom, setCustom] = useState<number[]>([]);
  const [browse, setBrowse] = useState(false);
  // Square handles all payments; Stripe is retired.
  const [providers, setProviders] = useState<Provider[]>(['square']);
  const [provider, setProvider] = useState<Provider>('square');
  const [tip, setTip] = useState<TipChoice>(DEFAULT_TIP_PERCENT); // 15% starts selected (founder choice)
  const [otherTip, setOtherTip] = useState('');
  const [coverFee, setCoverFee] = useState(true); // ticked by default
  const [optIn, setOptIn] = useState(false);
  const [monthly, setMonthly] = useState(false); // donor must tick it themselves
  const [savedCards, setSavedCards] = useState<{ square_card_id: string; brand: string | null; last4: string | null }[]>([]);
  const [savedCard, setSavedCard] = useState<string | null>(null);
  useEffect(() => {
    setSavedCards([]); setSavedCard(null);
    if (!user) return;
    supabase.from('saved_cards' as never).select('square_card_id, brand, last4').then(({ data }) => setSavedCards((data as typeof savedCards | null) ?? []));
  }, [user]);
  const [busy, setBusy] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const wide = useWide();

  useEffect(() => {
    supabase
      .from('payment_settings' as never)
      .select('square_enabled')
      .eq('id', 1)
      .maybeSingle()
      .then(({ data }) => {
        const d = data as { square_enabled: boolean } | null;
        if (!d) return;
        setProviders(d.square_enabled ? ['square'] : []);
        setProvider('square');
      });
  }, []);

  // Back from the payment page without paying: the browser may restore this page as it was left,
  // with the button still spinning. Reset it so the donor can pay again (a fresh link is made).
  useEffect(() => {
    const reset = (e?: PageTransitionEvent) => {
      if (e && !e.persisted) return;
      setBusy(false);
      setCheckoutUrl(null);
    };
    const onVisible = () => { if (document.visibilityState === 'visible') reset(); };
    window.addEventListener('pageshow', reset);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('pageshow', reset);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  // Wake the checkout service when the donor reaches the review step, so the click is quick.
  useEffect(() => {
    if (step !== 3 || provider !== 'square') return;
    supabase.functions.invoke('create-donation-checkout', { body: { warm: true } }).catch(() => {});
  }, [step, provider]);

  const retailers = useMemo(() => ids.map(findRetailer), [ids]);
  const count = retailers.length;
  const minimum = minTotal(count);
  const shares = useMemo(() => {
    if (!count) return [];
    if (mode === 'even' || custom.length !== count) return evenSplit(amount, count);
    return sum(custom) === amount ? custom : resizeShares(custom, amount);
  }, [amount, count, custom, mode]);
  const problem = amountProblem(amount, minimum, count);
  const ledgerOpen = step >= 2 && amount > 0 && count > 0;

  // A new set of retailers starts from an even split, and the amount rises if it can no longer
  // give every retailer its minimum.
  const chooseRetailers = useCallback((next: string[]) => {
    setIds(next);
    setMode('even');
    setCustom([]);
    const min = minTotal(next.length);
    if (!other && amount > 0 && amount < min) {
      const raised = PRESET_AMOUNTS.find((p) => p >= min) ?? min;
      setAmount(raised);
      setRaisedNote(`Raised to ${usd.format(raised)} so each retailer gets at least ${usd.format(MIN_SHARE)}.`);
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

  // What the donor pays: the gift in full, plus an optional tip and (if ticked) the card fee.
  const giftCents = Math.round(amount * 100);
  const tipCents = Math.min(MAX_TIP_CENTS, tip === 'other' ? Math.max(0, Math.round((parseFloat(otherTip) || 0) * 100)) : tip ? tipCentsFor(giftCents, tip) : 0);
  const charge = useMemo(() => computeCharge({ gift: amount || 0.01, tip: tipCents / 100, coverFee, provider }), [amount, tipCents, coverFee, provider]);
  const feeIfCovered = coveredFeeCents(giftCents + tipCents, provider);

  const pay = async (attempt = 0): Promise<void> => {
    setBusy(true);
    setPayError(null);
    setCheckoutUrl(null);
    if (optIn && user?.email && attempt === 0) void recordUpdatesConsent(user.email, 'donate');
    try {
      const pct = percentages(shares);
      const brandAllocations = retailers.map((r, i) => ({ brand: r.name, brandId: r.id, percent: pct[i], amount: shares[i] }));
      const fundraiserId = new URLSearchParams(window.location.search).get('fundraiser');
      if (savedCard && !monthly) {
        const { data, error } = await supabase.functions.invoke('create-square-payment', {
          body: { amount, tipAmount: tipCents / 100, coverFee, brandName: brandAllocations[0]?.brand ?? '', brandId: brandAllocations[0]?.brandId ?? '', brandAllocations, userId: user?.id ?? null, userEmail: user?.email ?? null, fundraiserId: fundraiserId || null, savedCardId: savedCard },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        window.location.assign(`/donation-success?amount=${amount}`);
        return;
      }
      const { data, error } = await supabase.functions.invoke(provider === 'stripe' ? 'create-stripe-checkout' : 'create-donation-checkout', {
        body: {
          amount,
          tipAmount: tipCents / 100,
          coverFee,
          brandName: brandAllocations[0]?.brand ?? '',
          brandId: brandAllocations[0]?.brandId ?? '',
          brandAllocations,
          userId: user?.id ?? null,
          userEmail: user?.email ?? null,
          fundraiserId: fundraiserId || null,
          recurring: monthly,
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
        return pay(attempt + 1);
      }
      const unavailable = /payments are temporarily unavailable|payments_unavailable|cannot currently make live charges|currently turned off/i.test(message);
      setPayError(unavailable
        ? "We can't take donations through this checkout right now. Please try the other option or come back a little later."
        : message || 'Checkout did not open. Please try again.');
      setBusy(false);
    }
  };

  return (
    <section id="donation-flow" className="relative overflow-hidden py-16 lg:py-20" style={{ backgroundColor: 'hsl(var(--primary-93))' }}>
      <div className="container relative mx-auto px-4">
        <div className="mx-auto mb-10 max-w-3xl text-center md:mb-14">
          <LineReveal><h2 className="font-display text-[2.5rem] font-normal leading-[1.06] tracking-normal text-foreground md:text-[3.5rem] lg:text-[4.5rem]">Choose where your help can be used.</h2></LineReveal>
          <Reveal delay={0.1} className="mt-5"><p className="text-lg leading-relaxed text-muted-foreground">Pick retailers, choose an amount, and see exactly where every dollar goes.</p></Reveal>
        </div>

        <Reveal className="mx-auto max-w-5xl"><div ref={cardRef} data-donate-card className="flex scroll-mt-24 flex-col overflow-hidden rounded-[1.75rem] bg-card shadow-card-hover lg:flex-row">
          <div className="flex min-w-0 flex-1 flex-col p-5 sm:p-8 lg:p-10">
            <StepTrack step={step} reachable={reachable} onGo={go} />

            <AnimatedHeight className="mt-8">
              <AnimatePresence mode="popLayout" initial={false} custom={direction}>
                <motion.div key={step} custom={direction} variants={stepMotion} initial="enter" animate="center" exit="exit" transition={SPRING}>
                  {step === 1 && <RetailerStep chosen={retailers} onToggle={(r) => toggleRetailer(r.id)} onBrowse={() => setBrowse(true)} request={request} />}
                  {step === 2 && (
                    <AmountStep
                      retailers={retailers}
                      amount={amount}
                      minimum={minimum}
                      other={other}
                      otherText={otherText}
                      raisedNote={raisedNote}
                      onPreset={(value) => { setOther(false); setOtherText(''); setAmount(value); setRaisedNote(null); }}
                      onOther={() => { setOther(true); setOtherText(amount ? String(amount) : ''); setRaisedNote(null); }}
                      onOtherText={(text) => { setOtherText(text); setAmount(parseInt(text, 10) || 0); }}
                      shares={shares}
                      mode={mode}
                      onMode={(m) => { if (m === 'custom') setCustom(shares); setMode(m); }}
                      onShare={(i, value) => { setCustom(setShare(shares, i, value)); setMode('custom'); }}
                    />
                  )}
                  {step === 3 && (
                    <ReviewStep
                      amount={amount}
                      retailers={retailers}
                      providers={providers}
                      provider={provider}
                      onProvider={setProvider}
                      tip={tip}
                      otherTip={otherTip}
                      onTip={setTip}
                      onOtherTip={setOtherTip}
                      coverFee={coverFee}
                      onCoverFee={setCoverFee}
                      monthly={monthly}
                      onMonthly={setMonthly}
                      signedIn={!!user}
                      feeIfCovered={feeIfCovered}
                      charge={charge}
                      busy={busy}
                      error={payError}
                      checkoutUrl={checkoutUrl}
                      onPay={() => void pay()}
                      savedCards={savedCards}
                      savedCard={savedCard}
                      onSavedCard={setSavedCard}
                    />
                  )}
                  {step === 3 && user?.email && (
                    <div className="mt-4"><UpdatesOptIn id="donate-updates" checked={optIn} onChange={setOptIn} /></div>
                  )}
                </motion.div>
              </AnimatePresence>
            </AnimatedHeight>

            <div className="mt-8 flex items-center justify-between gap-3">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => go(step - 1)}
                  disabled={busy}
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

          {/* The gift panel stays closed on step 1 and opens once an amount is chosen. */}
          <AnimatePresence initial={false}>
            {ledgerOpen && (
              <motion.div
                key="ledger"
                data-ledger-panel
                className="order-first shrink-0 overflow-hidden lg:order-last"
                initial={wide ? { width: 0 } : { height: 0 }}
                animate={wide ? { width: LEDGER_WIDTH } : { height: 'auto' }}
                exit={wide ? { width: 0 } : { height: 0 }}
                transition={SPRING}
              >
                <motion.div
                  className="flex h-full lg:w-[400px]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { duration: 0.35, delay: 0.12 } }}
                  exit={{ opacity: 0, transition: { duration: 0.12 } }}
                >
                  <GiftLedger amount={amount} retailers={retailers} shares={shares} step={step} />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div></Reveal>

        {/* Founder request: people can also give a gift card or coupon they already have (to="/donate-a-card"). */}
        <DonateCardPromo />

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
