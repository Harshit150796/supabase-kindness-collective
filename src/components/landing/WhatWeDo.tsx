import { Link } from 'react-router-dom';
import {
  animate,
  motion,
  useMotionValue,
  useTransform,
  type MotionValue,
} from 'motion/react';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useMotionPreference } from '@/hooks/useMotionPreference';
import { LineReveal, Reveal, useEarlyReveal } from '@/components/ui/editorial-motion';

const BLUE = 'hsl(var(--verify))';
const EMERALD = 'hsl(var(--primary))';
const VERIFY = 'hsl(var(--verify))';

type ArtProps = { progress: MotionValue<number>; still: boolean; offset: number };

const svgProps = {
  viewBox: '0 0 120 120',
  focusable: 'false' as const,
  className: 'h-full w-full overflow-hidden',
  'aria-hidden': true as const,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

function usePhase(progress: MotionValue<number>, offset: number, still: boolean) {
  return useTransform(progress, (value) => (still ? 0.82 : (value - offset + 1) % 1));
}

function mapValue(
  value: MotionValue<number>,
  input: number[],
  output: number[],
) {
  return useTransform(value, input, output, { clamp: true });
}

function Coin({ phase, index }: { phase: MotionValue<number>; index: number }) {
  const start = 0.14 + index * 0.025;
  const x = mapValue(phase, [0, start, start + 0.09, start + 0.22, start + 0.34, 1], [0, 0, 13, 43, 88, 88]);
  const y = mapValue(phase, [0, start, start + 0.1, start + 0.22, start + 0.34, 1], [0, 0, -34 - index * 4, -42, -6, -6]);
  const scaleX = mapValue(phase, [0, start, start + 0.07, start + 0.14, start + 0.22, start + 0.29, 1], [1, 1, 0.12, 1, 0.12, 1, 1]);
  const opacity = mapValue(phase, [0, start, start + 0.025, start + 0.3, start + 0.34, 1], [0, 0, 1, 1, 0, 0]);

  return (
    <motion.g style={{ x, y, scaleX, opacity, transformOrigin: '40px 74px' }}>
      <circle cx="40" cy="74" r="9" fill="hsl(var(--verify) / 0.14)" stroke={BLUE} strokeWidth="2" />
      <text x="40" y="79" textAnchor="middle" fontSize="10" fontWeight="700" fill={BLUE}>$</text>
    </motion.g>
  );
}

function GiveIllustration({ progress, still, offset }: ArtProps) {
  const phase = usePhase(progress, offset, still);
  const press = mapValue(phase, [0, 0.07, 0.11, 0.17, 0.23, 1], [1, 1, 0.87, 1.04, 1, 1]);
  const rippleScale = mapValue(phase, [0, 0.08, 0.25, 1], [0.4, 0.4, 1.8, 1.8]);
  const rippleOpacity = mapValue(phase, [0, 0.08, 0.12, 0.25, 1], [0, 0, 0.55, 0, 0]);
  const heartScale = mapValue(phase, [0, 0.43, 0.5, 0.58, 0.72, 1], [0, 0, 1.15, 1, 0, 0]);
  const heartOpacity = mapValue(phase, [0, 0.43, 0.5, 0.65, 0.72, 1], [0, 0, 1, 0.7, 0, 0]);

  return (
    <svg {...svgProps}>
      <rect x="14" y="30" width="52" height="68" rx="10" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="2" />
      <rect x="24" y="40" width="24" height="4" rx="2" fill="hsl(var(--muted-foreground) / 0.35)" />
      <rect x="24" y="50" width="32" height="4" rx="2" fill="hsl(var(--muted-foreground) / 0.22)" />
      {!still && <motion.circle cx="40" cy="79" r="17" fill="none" stroke={BLUE} strokeWidth="2" style={{ scale: rippleScale, opacity: rippleOpacity, transformOrigin: '40px 79px' }} />}
      <motion.g style={{ scale: still ? 1 : press, transformOrigin: '40px 79px' }}>
        <rect x="22" y="70" width="36" height="18" rx="9" fill={BLUE} />
        <text x="40" y="82.5" textAnchor="middle" fontSize="8" fontWeight="700" fill="hsl(var(--verify-foreground))">Give</text>
      </motion.g>
      {!still && [0, 1, 2].map((index) => <Coin key={index} phase={phase} index={index} />)}
          <motion.path d="M98 46c0-4 6-6 8-2 2-4 8-2 8 2 0 5-8 11-8 11s-8-6-8-11z" fill="hsl(var(--verify) / 0.14)" stroke={BLUE} strokeWidth="2" style={{ scale: still ? 1 : heartScale, opacity: still ? 1 : heartOpacity, transformOrigin: '106px 52px' }} />
    </svg>
  );
}

function CouponIllustration({ progress, still, offset }: ArtProps) {
  const phase = usePhase(progress, offset, still);
  const bars = [28, 33, 39, 45, 50, 56, 62, 67];
  const incomingX = mapValue(phase, [0, 0.04, 0.16, 0.22, 1], [-72, -72, 0, 0, 0]);
  const incomingOpacity = mapValue(phase, [0, 0.04, 0.08, 0.2, 0.25, 1], [0, 0, 1, 1, 0, 0]);
  const couponScaleX = mapValue(phase, [0, 0.2, 0.25, 0.31, 1], [1, 1, 0.88, 1, 1]);
  const shimmerX = mapValue(phase, [0, 0.29, 0.43, 1], [-24, -24, 90, 90]);
  const shimmerOpacity = mapValue(phase, [0, 0.29, 0.32, 0.42, 0.44, 1], [0, 0, 0.55, 0.55, 0, 0]);
  const lockY = mapValue(phase, [0, 0.39, 0.47, 0.51, 0.55, 1], [-40, -40, 5, -3, 0, 0]);
  const lockOpacity = mapValue(phase, [0, 0.39, 0.42, 1], [0, 0, 1, 1]);
  const ringScale = mapValue(phase, [0, 0.48, 0.62, 1], [0.4, 0.4, 1.9, 1.9]);
  const ringOpacity = mapValue(phase, [0, 0.48, 0.51, 0.62, 1], [0, 0, 0.55, 0, 0]);

  return (
    <svg {...svgProps}>
      <motion.g style={{ scaleX: couponScaleX, transformOrigin: '60px 60px' }}>
        <rect x="14" y="34" width="92" height="52" rx="10" fill="hsl(var(--card))" stroke={EMERALD} strokeWidth="2" />
        <path d="M78 36v48" stroke="hsl(var(--primary) / 0.55)" strokeWidth="2" strokeDasharray="5 5" />
        <circle cx="78" cy="34" r="5" fill="hsl(var(--background))" stroke="hsl(var(--border))" strokeWidth="2" />
        <circle cx="78" cy="86" r="5" fill="hsl(var(--background))" stroke="hsl(var(--border))" strokeWidth="2" />
        <text x="46" y="47" textAnchor="middle" fontSize="7" fontWeight="700" fill={EMERALD}>COUPON</text>
        {bars.map((x, index) => {
          const opacity = mapValue(phase, [0, 0.57 + index * 0.018, 0.61 + index * 0.018, 1], [0.32, 0.32, 1, 1]);
          return <motion.rect key={x} x={x} y="55" width={index % 3 === 0 ? 3 : 2} height="20" rx="1" fill={EMERALD} style={{ opacity: still ? 1 : opacity }} />;
        })}
        {!still && <motion.rect x="14" y="34" width="18" height="52" rx="9" fill="hsl(var(--verify) / 0.16)" style={{ x: shimmerX, opacity: shimmerOpacity }} />}
      </motion.g>
      {!still && (
        <motion.g style={{ x: incomingX, opacity: incomingOpacity }}>
          {[0, 1, 2].map((index) => <ellipse key={index} cx={36 + index * 15} cy={25 + index * 5} rx="8" ry="5" fill="hsl(var(--verify) / 0.14)" stroke={BLUE} strokeWidth="2" />)}
        </motion.g>
      )}
      {!still && <motion.circle cx="90" cy="59" r="12" fill="none" stroke={EMERALD} strokeWidth="2" style={{ scale: ringScale, opacity: ringOpacity, transformOrigin: '90px 59px' }} />}
      <motion.g style={{ y: still ? 0 : lockY, opacity: still ? 1 : lockOpacity, transformOrigin: '90px 59px' }}>
        <rect x="83" y="56" width="14" height="13" rx="3" fill={EMERALD} />
        <path d="M85.5 56v-4a4.5 4.5 0 0 1 9 0v4" fill="none" stroke={EMERALD} strokeWidth="2" />
      </motion.g>
    </svg>
  );
}

function GroceryItem({ phase, index, children }: { phase: MotionValue<number>; index: number; children: React.ReactNode }) {
  const start = 0.1 + index * 0.09;
  const y = mapValue(phase, [0, start, start + 0.08, start + 0.12, start + 0.16, 0.9, 0.96, 1], [-72, -72, 5, -3, 0, 0, -72, -72]);
  const scaleY = mapValue(phase, [0, start, start + 0.08, start + 0.12, start + 0.16, 0.9, 0.96, 1], [1, 1, 0.82, 1.08, 1, 1, 1, 1]);
  const opacity = mapValue(phase, [0, start, start + 0.025, 0.9, 0.96, 1], [0, 0, 1, 1, 0, 0]);
  return <motion.g style={{ y, scaleY, opacity, transformOrigin: '60px 58px' }}>{children}</motion.g>;
}

function DeliveryIllustration({ progress, still, offset }: ArtProps) {
  const phase = usePhase(progress, offset, still);
  const checkScale = mapValue(phase, [0, 0.48, 0.55, 0.62, 0.86, 0.92, 1], [0, 0, 1.14, 1, 1, 0, 0]);
  const checkOpacity = mapValue(phase, [0, 0.48, 0.53, 0.86, 0.92, 1], [0, 0, 1, 1, 0, 0]);

  return (
    <svg {...svgProps}>
      <GroceryItem phase={phase} index={0}>
        <path d="M30 50c0-7 5-12 12-12h8c6 0 11 5 11 11v9H30z" fill="hsl(var(--verify) / 0.14)" stroke={BLUE} strokeWidth="2" />
        <path d="M35 43c5 2 9 2 14 0" fill="none" stroke={BLUE} strokeWidth="2" />
      </GroceryItem>
      <GroceryItem phase={phase} index={1}>
        <path d="M53 58V39l7-7h10l5 7v19z" fill="hsl(var(--card))" stroke={EMERALD} strokeWidth="2" />
        <path d="M60 32v9h15M58 48h12" fill="none" stroke={EMERALD} strokeWidth="2" />
      </GroceryItem>
      <GroceryItem phase={phase} index={2}>
        <circle cx="84" cy="48" r="10" fill="hsl(var(--primary) / 0.16)" stroke={EMERALD} strokeWidth="2" />
        <path d="M84 38v-5m0 2c4-4 7-2 8 0" fill="none" stroke={EMERALD} strokeWidth="2" />
      </GroceryItem>
      <path d="M27 57h66l-6 42a6 6 0 0 1-6 5H43a6 6 0 0 1-6-5z" fill="hsl(var(--verify) / 0.08)" stroke={EMERALD} strokeWidth="2" />
      <path d="M27 57h66M45 57v-8a15 15 0 0 1 30 0v8" fill="none" stroke={EMERALD} strokeWidth="2" />
      <motion.g style={{ scale: still ? 1 : checkScale, opacity: still ? 1 : checkOpacity, transformOrigin: '101px 32px' }}>
        <circle cx="101" cy="32" r="11" fill="hsl(var(--primary) / 0.12)" stroke={EMERALD} strokeWidth="2" />
        <path d="M96 32l3.5 3.5 6.5-8" fill="none" stroke={EMERALD} strokeWidth="2.6" />
      </motion.g>
    </svg>
  );
}

function ReceiptIllustration({ progress, still, offset }: ArtProps) {
  const phase = usePhase(progress, offset, still);
  const envelopeX = mapValue(phase, [0, 0.04, 0.17, 0.22, 1], [80, 80, 0, 0, 0]);
  const envelopeY = mapValue(phase, [0, 0.04, 0.12, 0.17, 1], [-24, -24, -10, 0, 0]);
  const envelopeRotate = mapValue(phase, [0, 0.04, 0.17, 1], [14, 14, 0, 0]);
  const envelopeOpacity = mapValue(phase, [0, 0.04, 0.08, 0.2, 0.25, 1], [0, 0, 1, 1, 0, 0]);
  const notificationY = mapValue(phase, [0, 0.23, 0.31, 0.35, 0.4, 1], [-42, -42, 5, -3, 0, 0]);
  const notificationOpacity = mapValue(phase, [0, 0.23, 0.27, 1], [0, 0, 1, 1]);
  const badgeScale = mapValue(phase, [0, 0.37, 0.43, 0.48, 1], [0, 0, 1.25, 1, 1]);
  const badgeOpacity = mapValue(phase, [0, 0.37, 0.4, 1], [0, 0, 1, 1]);
  const ringScale = mapValue(phase, [0, 0.42, 0.56, 1], [0.4, 0.4, 1.8, 1.8]);
  const ringOpacity = mapValue(phase, [0, 0.42, 0.45, 0.56, 1], [0, 0, 0.6, 0, 0]);
  const checkLength = mapValue(phase, [0, 0.48, 0.62, 1], [0, 0, 1, 1]);
  const lineOne = mapValue(phase, [0, 0.58, 0.68, 1], [0, 0, 1, 1]);
  const lineTwo = mapValue(phase, [0, 0.64, 0.74, 1], [0, 0, 1, 1]);

  return (
    <svg {...svgProps}>
      <rect x="29" y="18" width="62" height="84" rx="12" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="2" />
      <rect x="51" y="25" width="18" height="3" rx="1.5" fill="hsl(var(--muted-foreground) / 0.35)" />
      {!still && (
        <motion.g style={{ x: envelopeX, y: envelopeY, rotate: envelopeRotate, opacity: envelopeOpacity, transformOrigin: '60px 49px' }}>
          <rect x="42" y="38" width="36" height="24" rx="4" fill="hsl(var(--card))" stroke={VERIFY} strokeWidth="2" />
          <path d="M42 42l18 13 18-13" fill="none" stroke={VERIFY} strokeWidth="2" />
        </motion.g>
      )}
      <motion.g style={{ y: still ? 0 : notificationY, opacity: still ? 1 : notificationOpacity }}>
        <rect x="35" y="36" width="50" height="48" rx="8" fill="hsl(var(--background))" stroke="hsl(var(--border))" strokeWidth="2" />
        <circle cx="60" cy="51" r="10" fill="hsl(var(--verify) / 0.12)" stroke={VERIFY} strokeWidth="2" />
        <motion.path d="M55.5 51.5l3.5 3.5 6-7" fill="none" stroke={VERIFY} strokeWidth="2.6" style={{ pathLength: still ? 1 : checkLength }} />
        <motion.rect x="43" y="67" width="34" height="4" rx="2" fill="hsl(var(--muted-foreground) / 0.35)" style={{ scaleX: still ? 1 : lineOne, transformOrigin: '43px 69px' }} />
        <motion.rect x="43" y="75" width="24" height="4" rx="2" fill="hsl(var(--muted-foreground) / 0.25)" style={{ scaleX: still ? 1 : lineTwo, transformOrigin: '43px 77px' }} />
      </motion.g>
      {!still && <motion.circle cx="89" cy="24" r="9" fill="none" stroke={VERIFY} strokeWidth="2" style={{ scale: ringScale, opacity: ringOpacity, transformOrigin: '89px 24px' }} />}
      <motion.circle cx="89" cy="24" r="6" fill={VERIFY} style={{ scale: still ? 1 : badgeScale, opacity: still ? 1 : badgeOpacity, transformOrigin: '89px 24px' }} />
    </svg>
  );
}

function ProofReceipt({ progress, still }: { progress: MotionValue<number>; still: boolean }) {
  const yearValue = useTransform(progress, (value) => (still || value >= 0.66 ? 2036 : 2026 + Math.min(10, Math.floor(value / 0.066))));
  const floatY = mapValue(progress, [0, 0.25, 0.5, 0.75, 1], [0, -3, 0, 3, 0]);
  const shimmerX = mapValue(progress, [0, 0.1, 0.28, 1], [-42, -42, 150, 150]);
  const shimmerOpacity = mapValue(progress, [0, 0.1, 0.14, 0.26, 0.3, 1], [0, 0, 0.35, 0.35, 0, 0]);
  const displayedYear = useTransform(yearValue, (value) => String(value));

  return (
    <motion.div className="relative mx-auto w-full max-w-[260px] overflow-hidden rounded-xl border border-verify/30 bg-card px-6 py-6 shadow-[0_16px_40px_-22px_hsl(var(--verify)/0.4)]" style={{ y: still ? 0 : floatY }}>
      {!still && <motion.div aria-hidden="true" className="pointer-events-none absolute inset-y-0 w-10 bg-verify/10" style={{ x: shimmerX, opacity: shimmerOpacity }} />}
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Donation receipt</p>
          <motion.p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{displayedYear}</motion.p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-verify/30 bg-verify/10">
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
            <path d="M6.5 12.5l3.5 3.5 7.5-8" fill="none" stroke={VERIFY} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
      <div className="relative mt-5 space-y-2.5">
        <div className="h-2 w-full rounded-full bg-muted" />
        <div className="h-2 w-4/5 rounded-full bg-muted" />
        <div className="h-2 w-3/5 rounded-full bg-muted" />
      </div>
      <div className="relative mt-5 flex items-center gap-2 border-t border-dashed border-border pt-4 text-sm font-semibold text-verify">
        <span className="h-2 w-2 rounded-full bg-verify" /> Verified record
      </div>
      <svg className="absolute -bottom-px left-0 h-2 w-full text-background" viewBox="0 0 240 8" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 8L6 2l6 6 6-6 6 6 6-6 6 6 6-6 6 6 6-6 6 6 6-6 6 6 6-6 6 6 6-6 6 6 6-6 6 6 6-6 6 6 6-6 6 6 6-6 6 6 6-6 6 6 6-6 6 6 6-6 6 6 6-6 6 6 6-6 6 6 6-6 6 6 6-6 6 6 6-6 6 6 6-6 6 6 6-6 6 6 6-6 6 6 6-6 6 6V8z" fill="currentColor" />
      </svg>
    </motion.div>
  );
}

const steps = [
  { title: 'You donate', body: 'You pick a real need someone has posted and cover it. Any amount, toward one specific thing.', accent: BLUE, offset: 0, Art: GiveIllustration },
  { title: 'It becomes a coupon', body: 'Your money converts into a gift card or credit that only works for that need. It can never be withdrawn as cash.', accent: EMERALD, offset: 0.12, Art: CouponIllustration },
  { title: 'They get what they needed', body: 'They redeem it at the store for groceries, medicine or a ride to work — the actual thing, not money.', accent: EMERALD, offset: 0.24, Art: DeliveryIllustration },
  { title: 'You get the receipt', body: 'A receipt comes back to you showing exactly what your money became, and when.', accent: VERIFY, offset: 0.36, Art: ReceiptIllustration },
];

function DonateDoorIcon() {
  return <svg viewBox="0 0 40 40" className="h-10 w-10 text-primary" aria-hidden="true"><circle cx="20" cy="20" r="16" fill="hsl(var(--primary) / 0.1)" stroke="currentColor" strokeWidth="2" /><path d="M20 29s-9-5.5-9-12a5 5 0 0 1 9-3.2A5 5 0 0 1 29 17c0 6.5-9 12-9 12z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function ApplyDoorIcon() {
  return <svg viewBox="0 0 40 40" className="h-10 w-10 text-verify" aria-hidden="true"><circle cx="20" cy="20" r="16" fill="hsl(var(--verify) / 0.12)" stroke="currentColor" strokeWidth="2" /><path d="M12 19h16l-2 11H14zm3 0v-3a5 5 0 0 1 10 0v3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

type Step = (typeof steps)[number];

function MobileInViewStep({ step, index, reduced, onRegister, onNavigate }: {
  step: Step;
  index: number;
  reduced: boolean;
  onRegister: (index: number, node: HTMLLIElement | null) => void;
  onNavigate: (index: number) => void;
}) {
  const itemRef = useRef<HTMLLIElement>(null);
  const progress = useMotionValue(step.offset);
  const { visible: inView, instant } = useEarlyReveal(itemRef);
  const animationRef = useRef<ReturnType<typeof animate> | null>(null);
  const Art = step.Art;

  useEffect(() => {
    onRegister(index, itemRef.current);
    return () => onRegister(index, null);
  }, [index, onRegister]);

  useEffect(() => {
    animationRef.current?.stop();
    if (reduced) {
      progress.set(step.offset + 0.82);
      return;
    }
    if (inView) {
      progress.set(step.offset);
      // Keep each compact story visibly alive while it is near the viewport.
      // A one-shot 1.8s run was often over before phone users looked at the row.
      animationRef.current = animate(progress, step.offset + 1, {
        duration: 6,
        ease: 'linear',
        repeat: Infinity,
      });
    } else {
      progress.set(step.offset);
    }
    return () => animationRef.current?.stop();
  }, [inView, instant, progress, reduced, step.offset]);

  return (
    <li ref={itemRef} data-mobile-step={index + 1} data-in-view={inView ? 'true' : 'false'} className="grid grid-cols-[76px_minmax(0,1fr)] items-center gap-4 py-5 sm:grid-cols-[100px_minmax(0,1fr)]">
      <motion.div
        data-mobile-step-art
        initial={reduced ? { opacity: 0.7 } : { opacity: 0, scale: 0.94, y: 4 }}
        animate={inView || reduced ? (reduced ? { opacity: 1, scale: 1, y: 0 } : { opacity: 1, scale: 1, y: [0, -3, 0] }) : undefined}
        transition={reduced ? { duration: 0.18 } : { opacity: { duration: 0.55 }, scale: { duration: 0.55, ease: [0.16, 1, 0.3, 1] }, y: { duration: 3, ease: 'easeInOut', repeat: Infinity } }}
        className="h-[76px] w-[76px] overflow-hidden sm:h-[100px] sm:w-[100px]"
      >
        <Art progress={progress} still={reduced} offset={step.offset} />
      </motion.div>
      <motion.div initial={reduced ? { opacity: 0.7 } : { opacity: 0, y: 12 }} animate={inView || reduced ? { opacity: 1, y: 0 } : undefined} transition={{ duration: reduced ? 0.18 : 0.55, delay: reduced ? 0 : 0.12 }}>
        <h3 className="font-sans text-lg font-semibold text-foreground"><span className="mr-2 text-sm tabular-nums text-primary">0{index + 1}</span>{step.title}</h3>
        <p className="mt-2 text-[15px] leading-[23px] text-muted-foreground">{step.body}</p>
      </motion.div>
    </li>
  );
}

// Laptops and wide screens: the four stories play one after another and hand a baton along
// the connector (step 1's coins fly out toward step 2, which takes them in from the left),
// then each rests in its finished picture. The run repeats only while the row is on screen.
// It used to scrub every illustration from the scroll position and also loop them all on a
// shared 12s clock: the two fought (jumps), stopping mid-scroll froze half-drawn pictures,
// and the loop kept running off screen.
const STORY_STEP_GAP = 1.9; // seconds between one step starting and the next
const STORY_LOOP = 12.5; // seconds from one run to the next
const STORY_END = [0.6, 0.84, 0.84, 0.84]; // storyboard point where each picture is complete
const STORY_LENGTH = [1.6, 2.3, 2.3, 2.3]; // seconds each picture takes to get there

function StoryConnector({ progress, show, still }: { progress: MotionValue<number>; show: MotionValue<number>; still: boolean }) {
  const x = useTransform(progress, (value) => `${value * 100}%`);
  const dotOpacity = mapValue(progress, [0, 0.05, 0.95, 1], [0, 1, 1, 0]);
  return (
    <motion.div aria-hidden="true" data-giving-connector className="pointer-events-none absolute left-[170px] right-[-12px] top-[74px] h-[2px]" style={{ opacity: show }}>
      <div className="absolute inset-0 rounded-full bg-border" />
      <motion.div className="absolute inset-0 origin-left rounded-full bg-primary/55" style={{ scaleX: still ? 1 : progress }} />
      {!still && (
        <motion.div className="absolute inset-0" style={{ x }}>
          <motion.span className="absolute -left-1 -top-[3px] h-2 w-2 rounded-full bg-primary" style={{ opacity: dotOpacity }} />
        </motion.div>
      )}
    </motion.div>
  );
}

function DesktopStory({ still }: { still: boolean }) {
  const listRef = useRef<HTMLOListElement>(null);
  const phase0 = useMotionValue(0), phase1 = useMotionValue(0), phase2 = useMotionValue(0), phase3 = useMotionValue(0);
  const link0 = useMotionValue(0), link1 = useMotionValue(0), link2 = useMotionValue(0);
  const show = useMotionValue(0);
  const phases = useMemo(() => [phase0, phase1, phase2, phase3], [phase0, phase1, phase2, phase3]);
  const links = useMemo(() => [link0, link1, link2], [link0, link1, link2]);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    if (still) {
      phases.forEach((phase, index) => phase.set(STORY_END[index]));
      links.forEach((link) => link.set(1));
      show.set(1);
      return;
    }
    let timers: number[] = [];
    let running: Array<{ stop: () => void }> = [];
    const clear = () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      running.forEach((animation) => animation.stop());
      timers = [];
      running = [];
    };
    const later = (seconds: number, run: () => void) => { timers.push(window.setTimeout(run, seconds * 1000)); };
    // One run: fade in from the empty pictures, play the steps in turn, rest, fade out, repeat.
    const play = () => {
      clear();
      phases.forEach((phase) => phase.set(0));
      links.forEach((link) => link.set(0));
      running.push(animate(show, 1, { duration: 0.45, ease: 'easeOut' }));
      phases.forEach((phase, index) => later(0.2 + index * STORY_STEP_GAP, () => {
        running.push(animate(phase, STORY_END[index], { duration: STORY_LENGTH[index], ease: 'linear' }));
      }));
      links.forEach((link, index) => later(0.2 + index * STORY_STEP_GAP + 1.2, () => {
        running.push(animate(link, 1, { duration: 0.8, ease: [0.65, 0, 0.35, 1] }));
      }));
      later(STORY_LOOP, () => { running.push(animate(show, 0, { duration: 0.45, ease: 'easeIn', onComplete: play })); });
    };
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { if (!timers.length && !running.length) { show.set(0); play(); } }
      else clear(); // nothing animates off screen
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.25 });
    observer.observe(list);
    return () => { observer.disconnect(); clear(); };
  }, [still, phases, links, show]);

  return (
    <div className="relative mt-16 hidden lg:block">
      <ol ref={listRef} className="relative grid grid-cols-4 gap-x-8" data-giving-steps="story">
        {steps.map((step, index) => {
          const Art = step.Art;
          return (
            <li key={step.title} className="relative" data-desktop-step={index + 1}>
              <motion.div
                className="relative h-[150px] w-[150px] [&_svg]:overflow-visible"
                style={{ opacity: show }}
                whileHover={still ? undefined : { y: -4 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              >
                <Art progress={phases[index]} still={still} offset={0} />
              </motion.div>
              {index < steps.length - 1 && <StoryConnector progress={links[index]} show={show} still={still} />}
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-sm font-medium tabular-nums text-muted-foreground">0{index + 1}</span>
                <h3 className="font-display text-[1.375rem] font-normal leading-tight text-foreground xl:text-2xl">{step.title}</h3>
              </div>
              <p className="mt-2 text-base leading-relaxed text-muted-foreground">{step.body}</p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function WhatWeDo() {
  // The founder-approved motion hook currently returns full on every device.
  const preference = useMotionPreference();
  const sectionRef = useRef<HTMLElement>(null);
  const mobileStepRefs = useRef<Array<HTMLLIElement | null>>([]);
  // Phones keep the receipt on this still clock; laptops count it up once when it arrives.
  const progress = useMotionValue(0);
  const receiptProgress = useMotionValue(0);
  const receiptRef = useRef<HTMLDivElement>(null);
  const { visible: receiptVisible } = useEarlyReveal(receiptRef);
  const still = preference === 'gentle';
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches);

  useEffect(() => {
    const query = window.matchMedia('(min-width: 1024px)');
    const update = () => setIsDesktop(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!isDesktop || still || !receiptVisible) return;
    const animation = animate(receiptProgress, 1, { duration: 2.6, ease: [0.16, 1, 0.3, 1] });
    return () => animation.stop();
  }, [isDesktop, still, receiptVisible, receiptProgress]);

  const chevronY = mapValue(progress, [0, 0.5, 1], [0, 5, 0]);

  const registerMobileStep = useCallback((index: number, node: HTMLLIElement | null) => {
    mobileStepRefs.current[index] = node;
  }, []);

  const jumpToStep = useCallback((index: number) => {
    mobileStepRefs.current[index]?.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'center' });
  }, [still]);

  return (
    <section ref={sectionRef} className="relative py-12 lg:py-24" style={{ backgroundColor: 'hsl(var(--primary-97))' }}>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(60% 40% at 12% 18%, hsl(var(--verify) / 0.04), transparent 70%), radial-gradient(60% 40% at 88% 82%, hsl(var(--primary) / 0.05), transparent 70%)' }} />
      </div>
      <div className="container relative mx-auto px-4">
        <div className="max-w-3xl">
          <LineReveal><h2 className="font-display text-5xl font-normal leading-[1.02] text-foreground md:text-6xl">Give what people need.</h2></LineReveal>
          <Reveal delay={0.06}><p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">CouponDonation turns your donation into coupons, gift cards and credits — so it arrives as food, medicine or transport, never as cash. And you can always see exactly where it went.</p></Reveal>
        </div>

        <div className="relative mt-6 lg:hidden">
          <ol className="divide-y divide-border" data-giving-steps="compact">
            {steps.map((step, index) => (
              <MobileInViewStep key={step.title} step={step} index={index} reduced={still} onRegister={registerMobileStep} onNavigate={jumpToStep} />
            ))}
          </ol>
        </div>

        <DesktopStory still={still} />

        <Reveal className="mt-8 overflow-hidden border-y border-primary/20 bg-primary/[0.03] px-0 py-6 lg:mt-20 lg:px-10 lg:py-12">
          <div className="grid items-center gap-5 sm:grid-cols-[minmax(0,1fr)_220px] lg:gap-12">
            <div className="text-center md:text-left">
               <p className="font-display text-3xl font-normal leading-snug text-foreground md:text-5xl">Donate $10 today. Check where it went in 2036.</p>
              <p className="mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">Every donation keeps its receipt. Permanently verifiable — not a promise, a record.</p>
            </div>
            <div ref={receiptRef}><ProofReceipt progress={isDesktop ? receiptProgress : progress} still={still} /></div>
          </div>
        </Reveal>

        <Reveal className="grid border-y border-border sm:grid-cols-2 sm:divide-x sm:divide-border">
          <Link to="/donate" className="group flex min-h-24 items-center gap-4 border-b border-border p-4 transition-colors hover:bg-primary/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:border-b-0">
            <DonateDoorIcon />
            <span className="min-w-0 flex-1"><span className="flex items-center gap-2 text-lg font-semibold text-foreground md:text-xl">I want to help someone <ArrowRight className="h-4 w-4 shrink-0 text-primary transition-transform group-hover:translate-x-1" /></span><span className="mt-1 block text-base text-muted-foreground">Pick a real need and cover it.</span></span>
          </Link>
          <Link to="/apply" className="group flex min-h-24 items-center gap-4 p-4 transition-colors hover:bg-verify/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <ApplyDoorIcon />
            <span className="min-w-0 flex-1"><span className="flex items-center gap-2 text-lg font-semibold text-foreground md:text-xl">I need help <ArrowRight className="h-4 w-4 shrink-0 text-verify transition-transform group-hover:translate-x-1" /></span><span className="mt-1 block text-base text-muted-foreground">Tell us what you need. U.S. residents, free to apply.</span></span>
          </Link>
        </Reveal>

        <div className="mt-6 flex flex-col items-center gap-2 text-center">
          <p className="text-base text-muted-foreground">Real people are asking right now. Here's who.</p>
          <motion.span aria-hidden="true" style={{ y: still ? 0 : chevronY }}><ChevronDown className="h-5 w-5 text-primary/70" /></motion.span>
        </div>
      </div>
    </section>
  );
}
