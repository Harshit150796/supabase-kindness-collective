import { Link } from 'react-router-dom';
import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from 'motion/react';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

const GOLD = 'hsl(var(--gold))';
const EMERALD = 'hsl(var(--primary))';
const VERIFY = 'hsl(var(--verify))';

type ArtProps = { progress: MotionValue<number>; still: boolean; offset: number };

const svgProps = {
  viewBox: '0 0 120 120',
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
      <circle cx="40" cy="74" r="9" fill="hsl(var(--gold) / 0.22)" stroke={GOLD} strokeWidth="2" />
      <text x="40" y="79" textAnchor="middle" fontSize="10" fontWeight="700" fill={GOLD}>$</text>
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
      {!still && <motion.circle cx="40" cy="79" r="17" fill="none" stroke={GOLD} strokeWidth="2" style={{ scale: rippleScale, opacity: rippleOpacity, transformOrigin: '40px 79px' }} />}
      <motion.g style={{ scale: still ? 1 : press, transformOrigin: '40px 79px' }}>
        <rect x="22" y="70" width="36" height="18" rx="9" fill={GOLD} />
        <text x="40" y="82.5" textAnchor="middle" fontSize="8" fontWeight="700" fill="hsl(var(--gold-foreground))">Give</text>
      </motion.g>
      {!still && [0, 1, 2].map((index) => <Coin key={index} phase={phase} index={index} />)}
      <motion.path d="M98 46c0-4 6-6 8-2 2-4 8-2 8 2 0 5-8 11-8 11s-8-6-8-11z" fill="hsl(var(--gold) / 0.22)" stroke={GOLD} strokeWidth="2" style={{ scale: still ? 1 : heartScale, opacity: still ? 1 : heartOpacity, transformOrigin: '106px 52px' }} />
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
        {!still && <motion.rect x="14" y="34" width="18" height="52" rx="9" fill="hsl(var(--gold) / 0.28)" style={{ x: shimmerX, opacity: shimmerOpacity }} />}
      </motion.g>
      {!still && (
        <motion.g style={{ x: incomingX, opacity: incomingOpacity }}>
          {[0, 1, 2].map((index) => <ellipse key={index} cx={36 + index * 15} cy={25 + index * 5} rx="8" ry="5" fill="hsl(var(--gold) / 0.25)" stroke={GOLD} strokeWidth="2" />)}
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
        <path d="M30 50c0-7 5-12 12-12h8c6 0 11 5 11 11v9H30z" fill="hsl(var(--gold) / 0.28)" stroke={GOLD} strokeWidth="2" />
        <path d="M35 43c5 2 9 2 14 0" fill="none" stroke={GOLD} strokeWidth="2" />
      </GroceryItem>
      <GroceryItem phase={phase} index={1}>
        <path d="M53 58V39l7-7h10l5 7v19z" fill="hsl(var(--card))" stroke={EMERALD} strokeWidth="2" />
        <path d="M60 32v9h15M58 48h12" fill="none" stroke={EMERALD} strokeWidth="2" />
      </GroceryItem>
      <GroceryItem phase={phase} index={2}>
        <circle cx="84" cy="48" r="10" fill="hsl(var(--primary) / 0.16)" stroke={EMERALD} strokeWidth="2" />
        <path d="M84 38v-5m0 2c4-4 7-2 8 0" fill="none" stroke={EMERALD} strokeWidth="2" />
      </GroceryItem>
      <path d="M27 57h66l-6 42a6 6 0 0 1-6 5H43a6 6 0 0 1-6-5z" fill="hsl(var(--gold) / 0.12)" stroke={EMERALD} strokeWidth="2" />
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
  { title: 'You donate', body: 'You pick a real need someone has posted and cover it. Any amount, toward one specific thing.', accent: GOLD, offset: 0, Art: GiveIllustration },
  { title: 'It becomes a coupon', body: 'Your money converts into a gift card or credit that only works for that need. It can never be withdrawn as cash.', accent: EMERALD, offset: 0.12, Art: CouponIllustration },
  { title: 'They get what they needed', body: 'They redeem it at the store for groceries, medicine or a ride to work — the actual thing, not money.', accent: EMERALD, offset: 0.24, Art: DeliveryIllustration },
  { title: 'You get the receipt', body: 'A receipt comes back to you showing exactly what your money became, and when.', accent: VERIFY, offset: 0.36, Art: ReceiptIllustration },
];

function DonateDoorIcon() {
  return <svg viewBox="0 0 40 40" className="h-10 w-10 text-primary" aria-hidden="true"><circle cx="20" cy="20" r="16" fill="hsl(var(--primary) / 0.1)" stroke="currentColor" strokeWidth="2" /><path d="M20 29s-9-5.5-9-12a5 5 0 0 1 9-3.2A5 5 0 0 1 29 17c0 6.5-9 12-9 12z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function ApplyDoorIcon() {
  return <svg viewBox="0 0 40 40" className="h-10 w-10 text-gold" aria-hidden="true"><circle cx="20" cy="20" r="16" fill="hsl(var(--gold) / 0.12)" stroke="currentColor" strokeWidth="2" /><path d="M12 19h16l-2 11H14zm3 0v-3a5 5 0 0 1 10 0v3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

type Step = (typeof steps)[number];

function MobileJourneyStep({ step, index, progress }: { step: Step; index: number; progress: MotionValue<number> }) {
  const Art = step.Art;
  const bandStart = index / steps.length;
  const bandEnd = (index + 1) / steps.length;
  const localProgress = useTransform(progress, [bandStart, bandEnd], [0, 0.99], { clamp: true });
  const opacity = useTransform(progress, (value) => {
    const local = (value - bandStart) / (bandEnd - bandStart);
    if (index > 0 && local < 0) return Math.max(0, 1 + local * 8);
    if (index < steps.length - 1 && local > 0.86) return Math.max(0, (1 - local) / 0.14);
    return local >= 0 || index === 0 ? 1 : 0;
  });
  const y = useTransform(progress, (value) => {
    const local = (value - bandStart) / (bandEnd - bandStart);
    if (local < 0) return Math.min(18, -local * 144);
    if (index < steps.length - 1 && local > 0.86) return Math.max(-18, -(local - 0.86) * 129);
    return 0;
  });

  return (
    <motion.li className="absolute inset-0 flex flex-col items-center justify-center text-center" style={{ opacity, y }} aria-hidden={undefined}>
      <div className="h-[min(55vw,260px)] w-[min(55vw,260px)] overflow-hidden">
        <Art progress={localProgress} still={false} offset={0} />
      </div>
      <div className="mt-5 flex items-center justify-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold" style={{ color: step.accent, borderColor: step.accent }}>{index + 1}</span>
        <h3 className="text-xl font-semibold text-foreground sm:text-2xl">{step.title}</h3>
      </div>
      <p className="mt-3 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">{step.body}</p>
    </motion.li>
  );
}

function ProgressSegment({ progress, index }: { progress: MotionValue<number>; index: number }) {
  const start = index / steps.length;
  const end = (index + 1) / steps.length;
  const scaleX = useTransform(progress, [start, end], [0, 1], { clamp: true });

  return (
    <span className="relative block h-1.5 w-full overflow-hidden rounded-full bg-border">
      <motion.span className="absolute inset-0 origin-left rounded-full bg-primary" style={{ scaleX }} />
    </span>
  );
}

export function WhatWeDo() {
  const reduced = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const mobileJourneyRef = useRef<HTMLDivElement>(null);
  const progress = useMotionValue(0);
  const still = !!reduced;
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches);
  const { scrollYProgress: desktopScroll } = useScroll({ target: sectionRef, offset: ['start end', 'end start'] });
  const { scrollYProgress: mobileScroll } = useScroll({ target: mobileJourneyRef, offset: ['start start', 'end end'] });
  const idleTimerRef = useRef<number | null>(null);
  const idleAnimationRef = useRef<ReturnType<typeof animate> | null>(null);

  useEffect(() => {
    const query = window.matchMedia('(min-width: 1024px)');
    const update = () => setIsDesktop(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  const startIdleMotion = useCallback(() => {
    if (still || !isDesktop) return;
    idleAnimationRef.current?.stop();
    const current = progress.get();
    idleAnimationRef.current = animate(progress, current + 1, {
      duration: 12,
      ease: 'linear',
      repeat: Infinity,
    });
  }, [isDesktop, progress, still]);

  useMotionValueEvent(desktopScroll, 'change', (value) => {
    if (still || !isDesktop) return;
    idleAnimationRef.current?.stop();
    progress.set(Math.max(0, Math.min(1, (value - 0.12) / 0.66)));
    if (idleTimerRef.current !== null) window.clearTimeout(idleTimerRef.current);
    idleTimerRef.current = window.setTimeout(startIdleMotion, 1500);
  });

  useMotionValueEvent(mobileScroll, 'change', (value) => {
    if (!still && !isDesktop) progress.set(value);
  });

  useEffect(() => () => {
    idleAnimationRef.current?.stop();
    if (idleTimerRef.current !== null) window.clearTimeout(idleTimerRef.current);
  }, []);

  const connectorPhase = useTransform(progress, (value) => ((value % 1) + 1) % 1);
  const connectorPosition = mapValue(connectorPhase, [0, 0.12, 0.24, 0.36, 0.62, 1], [0, 0, 33, 66, 100, 100]);
  const connectorLeft = useTransform(connectorPosition, (value) => `${value}%`);
  const chevronY = mapValue(progress, [0, 0.5, 1], [0, 5, 0]);

  const restartSharedClock = () => {
    if (!still && isDesktop && typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches) {
      idleAnimationRef.current?.stop();
      progress.set(0);
      startIdleMotion();
    }
  };

  const jumpToStep = (index: number) => {
    const container = mobileJourneyRef.current;
    if (!container) return;
    const scrollable = container.offsetHeight - window.innerHeight;
    window.scrollTo({ top: container.offsetTop + scrollable * (index / 4), behavior: 'smooth' });
  };

  return (
    <section ref={sectionRef} className="relative overflow-x-hidden bg-background py-20 md:py-28">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(60% 40% at 12% 18%, hsl(var(--gold) / 0.05), transparent 70%), radial-gradient(60% 40% at 88% 82%, hsl(var(--primary) / 0.05), transparent 70%)' }} />
      <div className="container relative mx-auto px-4">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">How it works</p>
          <h2 className="mt-3 text-4xl font-bold leading-tight text-foreground md:text-5xl">Give what people need.</h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">CouponDonation turns your donation into coupons, gift cards and credits — so it arrives as food, medicine or transport, never as cash. And you can always see exactly where it went.</p>
        </div>

        {still ? (
          <div className="relative mt-14 md:mt-16">
            <ol className="relative grid grid-cols-1 gap-10 sm:grid-cols-2 sm:gap-x-8 lg:grid-cols-4">
              {steps.map((step, index) => {
                const Art = step.Art;
                return (
                  <li key={step.title} className="relative pl-8 lg:pl-0">
                    <div className="mx-auto h-[130px] w-[130px] overflow-hidden sm:h-[150px] sm:w-[150px] lg:mx-0">
                      <Art progress={progress} still offset={step.offset} />
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full border text-xs font-semibold" style={{ color: step.accent, borderColor: step.accent }}>{index + 1}</span>
                      <h3 className="text-lg font-semibold text-foreground md:text-xl">{step.title}</h3>
                    </div>
                    <p className="mt-2 text-base leading-relaxed text-muted-foreground">{step.body}</p>
                  </li>
                );
              })}
            </ol>
          </div>
        ) : (
          <>
            <div ref={mobileJourneyRef} className="relative mt-8 h-[240svh] lg:hidden">
              <div className="sticky top-0 flex h-[100svh] flex-col items-center justify-center overflow-hidden py-6">
                <ol className="relative h-[min(68svh,620px)] w-full">
                  {steps.map((step, index) => (
                    <MobileJourneyStep key={step.title} step={step} index={index} progress={mobileScroll} />
                  ))}
                </ol>
                <div className="mt-3 grid w-full max-w-sm grid-cols-4 gap-2" role="navigation" aria-label="How it works steps">
                  {steps.map((step, index) => (
                    <Button key={step.title} type="button" variant="ghost" size="sm" className="group h-11 min-w-11 px-1" onClick={() => jumpToStep(index)} aria-label={`Go to step ${index + 1}: ${step.title}`}>
                      <ProgressSegment progress={mobileScroll} index={index} />
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="relative mt-14 hidden md:mt-16 lg:block">
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-[86px] hidden lg:block">
            <div className="relative mx-[12%] h-px bg-border">
              {!still && <motion.span className="absolute -top-[3px] h-[7px] w-[7px] rounded-full bg-primary/70" style={{ left: connectorLeft }} />}
            </div>
          </div>
          <ol className="relative grid grid-cols-1 gap-10 sm:grid-cols-2 sm:gap-x-8 lg:grid-cols-4">
            {steps.map((step, index) => {
              const Art = step.Art;
              return (
                <li key={step.title} className="relative pl-8 lg:pl-0">
                  <motion.div className="mx-auto h-[130px] w-[130px] overflow-hidden sm:h-[150px] sm:w-[150px] lg:mx-0" whileHover={still ? undefined : { y: -4 }} transition={{ type: 'spring', stiffness: 260, damping: 20 }} onMouseEnter={restartSharedClock}>
                    <Art progress={progress} still={still} offset={step.offset} />
                  </motion.div>
                  <div className="mt-4 flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full border text-xs font-semibold" style={{ color: step.accent, borderColor: step.accent }}>{index + 1}</span>
                    <h3 className="text-lg font-semibold text-foreground md:text-xl">{step.title}</h3>
                  </div>
                  <p className="mt-2 text-base leading-relaxed text-muted-foreground">{step.body}</p>
                </li>
              );
            })}
          </ol>
            </div>
          </>
        )}

        <div className="mt-12 overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.06] to-gold/[0.05] px-6 py-8 shadow-[0_18px_48px_-30px_hsl(var(--primary)/0.45)] md:mt-16 md:px-10 md:py-10">
          <div className="grid items-center gap-8 md:grid-cols-[minmax(0,1fr)_280px] md:gap-12">
            <div className="text-center md:text-left">
              <p className="text-2xl font-semibold leading-snug text-foreground md:text-4xl">Donate $10 today. Check where it went in 2036.</p>
              <p className="mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">Every donation keeps its receipt. Permanently verifiable — not a promise, a record.</p>
            </div>
            <ProofReceipt progress={progress} still={still} />
          </div>
        </div>

        <div className="mx-auto my-10 flex max-w-2xl flex-col items-center gap-5 text-center md:my-12">
          <span aria-hidden="true" className="h-px w-12 bg-primary/30" />
          <p className="text-xl font-medium leading-relaxed text-foreground md:text-2xl">We don't track the person. We track the money.</p>
          <span aria-hidden="true" className="h-px w-12 bg-primary/30" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link to="/donate" className="group flex min-h-32 items-center gap-4 rounded-2xl border border-primary/20 bg-primary/[0.04] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_12px_32px_-16px_hsl(var(--primary)/0.38)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <DonateDoorIcon />
            <span className="min-w-0 flex-1"><span className="flex items-center gap-2 text-lg font-semibold text-foreground md:text-xl">I want to help someone <ArrowRight className="h-4 w-4 shrink-0 text-primary transition-transform group-hover:translate-x-1" /></span><span className="mt-1 block text-base text-muted-foreground">Pick a real need and cover it.</span></span>
          </Link>
          <Link to="/apply" className="group flex min-h-32 items-center gap-4 rounded-2xl border border-gold/25 bg-gold/[0.05] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-gold/45 hover:shadow-[0_12px_32px_-16px_hsl(var(--gold)/0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <ApplyDoorIcon />
            <span className="min-w-0 flex-1"><span className="flex items-center gap-2 text-lg font-semibold text-foreground md:text-xl">I need help <ArrowRight className="h-4 w-4 shrink-0 text-gold transition-transform group-hover:translate-x-1" /></span><span className="mt-1 block text-base text-muted-foreground">Tell us what you need. U.S. residents, free to apply.</span></span>
          </Link>
        </div>

        <div className="mt-10 flex flex-col items-center gap-2 text-center">
          <p className="text-base text-muted-foreground">Real people are asking right now. Here's who.</p>
          <motion.span aria-hidden="true" style={{ y: still ? 0 : chevronY }}><ChevronDown className="h-5 w-5 text-primary/70" /></motion.span>
        </div>
      </div>
    </section>
  );
}
