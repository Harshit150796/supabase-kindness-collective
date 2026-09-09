import { Link } from 'react-router-dom';
import { motion, useInView, useReducedMotion } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

/* ---------------------------------------------------------------- *
 * Shared timing — one 5.5s master loop keeps all four in phase
 * ---------------------------------------------------------------- */

const D = 5.5;

const loop = (times: number[]) => ({
  duration: D,
  times,
  repeat: Infinity,
  ease: 'easeInOut' as const,
});

const GOLD = 'hsl(var(--gold))';
const EMERALD = 'hsl(var(--primary))';
const VERIFY = 'hsl(var(--verify))';

type ArtProps = { still: boolean };

const svgProps = {
  viewBox: '0 0 120 120',
  className: 'h-full w-full overflow-hidden',
  'aria-hidden': true as const,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

/* ---------------------------------------------------------------- *
 * STEP 1 — You donate (gold): press, ripple, coin fountain exits right
 * ---------------------------------------------------------------- */

function GiveIllustration({ still }: ArtProps) {
  const coins = [0, 1, 2];

  return (
    <svg {...svgProps}>
      {/* phone / card surface */}
      <rect x="14" y="30" width="52" height="68" rx="10" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="2" />
      <rect x="24" y="40" width="24" height="4" rx="2" fill="hsl(var(--muted-foreground) / 0.35)" />
      <rect x="24" y="50" width="32" height="4" rx="2" fill="hsl(var(--muted-foreground) / 0.22)" />

      {/* ripple from the button */}
      {!still && (
        <motion.circle
          cx="40"
          cy="79"
          r="17"
          fill="none"
          stroke={GOLD}
          strokeWidth="2"
          style={{ transformOrigin: '40px 79px' }}
          initial={false}
          animate={{ scale: [0.4, 0.4, 1.8, 1.8], opacity: [0, 0.55, 0, 0] }}
          transition={loop([0, 0.1, 0.26, 1])}
        />
      )}

      {/* Give button */}
      <motion.g
        initial={false}
        style={{ transformOrigin: '40px 79px' }}
        animate={still ? { scale: 1 } : { scale: [1, 1, 0.86, 1.02, 1, 1] }}
        transition={still ? undefined : loop([0, 0.07, 0.11, 0.16, 0.22, 1])}
      >
        <rect x="22" y="70" width="36" height="18" rx="9" fill={GOLD} />
        <rect x="30" y="78" width="20" height="3" rx="1.5" fill="hsl(var(--gold-foreground) / 0.85)" />
      </motion.g>

      {/* coins arcing out to the right */}
      {!still &&
        coins.map((i) => {
          const t0 = 0.14 + i * 0.028;
          return (
            <motion.g
              key={i}
              initial={false}
              animate={{
                x: [0, 0, 16 + i * 3, 44 + i * 5, 84 + i * 6, 84 + i * 6],
                y: [0, 0, -32 - i * 5, -44 - i * 3, -6, -6],
                scaleX: [1, 1, 0.15, 1, 0.15, 0.15],
                opacity: [0, 0, 1, 1, 0, 0],
              }}
              transition={loop([0, t0, t0 + 0.1, t0 + 0.2, t0 + 0.32, 1])}
              style={{ transformOrigin: '40px 74px' }}
            >
              <circle cx="40" cy="74" r="9" fill="hsl(var(--gold) / 0.25)" stroke={GOLD} strokeWidth="2" />
              <text x="40" y="79" textAnchor="middle" fontSize="10" fontWeight="700" fill={GOLD}>
                $
              </text>
            </motion.g>
          );
        })}

      {/* soft heart bloom where they left */}
      <motion.path
        d="M98 46c0-4 6-6 8-2 2-4 8-2 8 2 0 5-8 11-8 11s-8-6-8-11z"
        fill="hsl(var(--gold) / 0.25)"
        stroke={GOLD}
        strokeWidth="2"
        style={{ transformOrigin: '106px 52px' }}
        initial={false}
        animate={still ? { scale: 1, opacity: 1 } : { scale: [0, 0, 1.15, 1, 0.9, 0], opacity: [0, 0, 1, 1, 0.6, 0] }}
        transition={still ? undefined : loop([0, 0.46, 0.53, 0.6, 0.7, 0.78])}
      />
    </svg>
  );
}

/* ---------------------------------------------------------------- *
 * STEP 2 — It becomes a coupon (gold -> emerald)
 * ---------------------------------------------------------------- */

function CouponIllustration({ still }: ArtProps) {
  const bars = [30, 35, 40, 46, 52, 57, 63, 68];

  return (
    <svg {...svgProps}>
      <motion.g
        initial={false}
        animate={still ? { x: 0 } : { x: [0, 0, 12, 12] }}
        transition={still ? undefined : loop([0, 0.9, 0.99, 1])}
      >
        <motion.g
          initial={false}
          style={{ transformOrigin: '60px 60px' }}
          animate={still ? { scaleX: 1, x: 0, y: 0 } : { x: [-78, -78, 0, 0, 0, 0], scaleX: [1, 1, 1, 0.05, 1, 1] }}
          transition={still ? undefined : loop([0, 0.4, 0.52, 0.6, 0.68, 1])}
        >
          {/* incoming coin stack */}
          {!still && (
            <motion.g
              initial={false}
              animate={{ opacity: [1, 1, 1, 1, 0, 0] }}
              transition={loop([0, 0.4, 0.52, 0.6, 0.61, 1])}
            >
              {[0, 1, 2].map((i) => (
                <g key={i}>
                  <ellipse cx="60" cy={76 - i * 9} rx="17" ry="7" fill="hsl(var(--gold) / 0.25)" stroke={GOLD} strokeWidth="2" />
                </g>
              ))}
            </motion.g>
          )}

          {/* the coupon */}
          <motion.g
            initial={false}
            animate={still ? { opacity: 1 } : { opacity: [0, 0, 0, 0, 1, 1] }}
            transition={still ? undefined : loop([0, 0.4, 0.52, 0.6, 0.61, 1])}
          >
            <motion.rect
              x="16"
              y="36"
              width="88"
              height="48"
              rx="10"
              fill="hsl(var(--card))"
              strokeWidth="2"
              initial={false}
              animate={still ? { stroke: EMERALD } : { stroke: [GOLD, GOLD, EMERALD, EMERALD] }}
              transition={still ? undefined : loop([0, 0.66, 0.76, 1])}
            />
            <line x1="78" y1="38" x2="78" y2="82" stroke="hsl(var(--primary) / 0.6)" strokeWidth="2" strokeDasharray="5 5" />
            <circle cx="78" cy="36" r="5" fill="hsl(var(--background))" stroke="hsl(var(--border))" strokeWidth="2" />
            <circle cx="78" cy="84" r="5" fill="hsl(var(--background))" stroke="hsl(var(--border))" strokeWidth="2" />

            {/* barcode brightening left to right */}
            {bars.map((x, i) => (
              <motion.rect
                key={x}
                x={x}
                y="50"
                width={i % 3 === 0 ? 3 : 2}
                height="20"
                rx="1"
                fill={EMERALD}
                initial={false}
                animate={still ? { opacity: 1 } : { opacity: [0.35, 0.35, 1, 1, 0.45, 0.45] }}
                transition={
                  still
                    ? undefined
                    : loop([0, 0.79 + i * 0.012, 0.83 + i * 0.012, 0.9, 0.96, 1])
                }
              />
            ))}

            {/* shimmer sweep */}
            {!still && (
              <motion.rect
                x="16"
                y="36"
                width="16"
                height="48"
                fill="hsl(var(--gold) / 0.55)"
                initial={false}
                animate={{ x: [0, 0, 74, 74], opacity: [0, 0.7, 0, 0] }}
                transition={loop([0, 0.65, 0.79, 1])}
              />
            )}
          </motion.g>
        </motion.g>

        {/* lock snapping shut + shockwave */}
        {!still && (
          <motion.circle
            cx="89"
            cy="60"
            r="12"
            fill="none"
            stroke={EMERALD}
            strokeWidth="2"
            style={{ transformOrigin: '89px 60px' }}
            initial={false}
            animate={{ scale: [0.3, 0.3, 1.9, 1.9], opacity: [0, 0.6, 0, 0] }}
            transition={loop([0, 0.79, 0.92, 1])}
          />
        )}
        <motion.g
          initial={false}
          style={{ transformOrigin: '89px 60px' }}
          animate={still ? { y: 0, opacity: 1 } : { y: [-52, -52, 5, -3, 0, 0], opacity: [0, 0, 1, 1, 1, 1] }}
          transition={still ? undefined : loop([0, 0.71, 0.79, 0.83, 0.87, 1])}
        >
          <rect x="82" y="57" width="14" height="12" rx="3" fill={EMERALD} />
          <path d="M84.5 57v-3.5a4.5 4.5 0 0 1 9 0V57" fill="none" stroke={EMERALD} strokeWidth="2" />
        </motion.g>
      </motion.g>
    </svg>
  );
}

/* ---------------------------------------------------------------- *
 * STEP 3 — They get what they needed (emerald): van, bag, groceries
 * ---------------------------------------------------------------- */

function DeliveryIllustration({ still }: ArtProps) {
  const items = [0, 1, 2];

  return (
    <svg {...svgProps}>
      {/* ground */}
      <line x1="8" y1="98" x2="112" y2="98" stroke="hsl(var(--border))" strokeWidth="2" />

      {/* van */}
      {!still && (
        <motion.g
          initial={false}
          animate={{ x: [-96, -96, -18, -14, -16, 130, 130] }}
          transition={loop([0, 0.01, 0.13, 0.18, 0.42, 0.58, 1])}
        >
          <motion.g
            initial={false}
            animate={{ y: [0, -1.6, 0, -1.6, 0] }}
            transition={{ duration: 0.55, repeat: Infinity, ease: 'easeInOut' }}
          >
            <rect x="30" y="58" width="46" height="30" rx="6" fill="hsl(var(--primary) / 0.12)" stroke={EMERALD} strokeWidth="2" />
            <path d="M76 68h12l8 10v10H76z" fill="hsl(var(--card))" stroke={EMERALD} strokeWidth="2" />
            <rect x="79" y="70" width="10" height="7" rx="2" fill="hsl(var(--primary) / 0.2)" stroke={EMERALD} strokeWidth="2" />
            {/* rear panel opens */}
            <motion.rect
              x="30"
              y="58"
              width="10"
              height="30"
              rx="4"
              fill="hsl(var(--card))"
              stroke={EMERALD}
              strokeWidth="2"
              style={{ transformOrigin: '40px 88px' }}
              initial={false}
              animate={{ rotate: [0, 0, -70, -70, 0, 0] }}
              transition={loop([0, 0.16, 0.22, 0.42, 0.48, 1])}
            />
          </motion.g>
          {[42, 68].map((cx) => (
            <motion.g
              key={cx}
              initial={false}
              style={{ transformOrigin: `${cx}px 92px` }}
              animate={{ rotate: 360 }}
              transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
            >
              <circle cx={cx} cy="92" r="7" fill="hsl(var(--card))" stroke={EMERALD} strokeWidth="2" />
              <path d={`M${cx} 87v10`} stroke="hsl(var(--primary) / 0.6)" strokeWidth="2" />
              <path d={`M${cx - 5} 92h10`} stroke="hsl(var(--primary) / 0.6)" strokeWidth="2" />
            </motion.g>
          ))}
        </motion.g>
      )}

      {/* grocery bag with items */}
      <motion.g
        initial={false}
        animate={still ? { y: 0, opacity: 1 } : { y: [30, 30, 0, -4, 0, 0], opacity: [0, 0, 1, 1, 1, 1] }}
        transition={still ? undefined : loop([0, 0.2, 0.28, 0.32, 0.36, 1])}
      >
        {items.map((i) => {
          const t0 = 0.34 + i * 0.027;
          const anim = still
            ? { y: 0, opacity: 1, scale: 1 }
            : { y: [18, 18, 0, 0], opacity: [0, 0, 1, 1], scale: [0.7, 0.7, 1, 1] };
          const tr = still ? undefined : loop([0, t0, t0 + 0.08, 1]);
          return (
            <motion.g key={i} initial={false} animate={anim} transition={tr} style={{ transformOrigin: '60px 50px' }}>
              {i === 0 && (
                <rect x="34" y="42" width="22" height="16" rx="7" fill="hsl(var(--gold) / 0.3)" stroke={GOLD} strokeWidth="2" />
              )}
              {i === 1 && (
                <path d="M60 58V44l6-6h8v20z" fill="hsl(var(--card))" stroke={EMERALD} strokeWidth="2" />
              )}
              {i === 2 && (
                <>
                  <circle cx="86" cy="50" r="9" fill="hsl(var(--primary) / 0.18)" stroke={EMERALD} strokeWidth="2" />
                  <path d="M86 41v-4" stroke={EMERALD} strokeWidth="2" />
                </>
              )}
            </motion.g>
          );
        })}
        <path
          d="M32 58h60l-5 38a6 6 0 0 1-6 5H43a6 6 0 0 1-6-5z"
          fill="hsl(var(--gold) / 0.12)"
          stroke={EMERALD}
          strokeWidth="2"
        />
        <path d="M32 58h60" stroke={EMERALD} strokeWidth="2" />
        <path d="M48 58v-8a14 14 0 0 1 28 0v8" fill="none" stroke="hsl(var(--primary) / 0.45)" strokeWidth="2" />
      </motion.g>

      {/* check above the bag */}
      <motion.g
        initial={false}
        style={{ transformOrigin: '60px 24px' }}
        animate={still ? { scale: 1, opacity: 1 } : { scale: [0, 0, 1.15, 1, 1, 0], opacity: [0, 0, 1, 1, 1, 0] }}
        transition={still ? undefined : loop([0, 0.6, 0.67, 0.72, 0.86, 0.94])}
      >
        <circle cx="60" cy="24" r="12" fill="hsl(var(--primary) / 0.12)" stroke={EMERALD} strokeWidth="2" />
        <path d="M54.5 24.5l4 4 7-8" fill="none" stroke={EMERALD} strokeWidth="2.6" />
      </motion.g>
    </svg>
  );
}

/* ---------------------------------------------------------------- *
 * STEP 4 — You get the receipt (verify blue)
 * ---------------------------------------------------------------- */

function ReceiptIllustration({ still }: ArtProps) {
  return (
    <svg {...svgProps}>
      {/* phone */}
      <rect x="30" y="20" width="60" height="80" rx="12" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="2" />
      <rect x="52" y="26" width="16" height="3" rx="1.5" fill="hsl(var(--muted-foreground) / 0.35)" />

      {/* envelope flying in from the right */}
      {!still && (
        <motion.g
          initial={false}
          animate={{ x: [78, 78, 0, 0, 0], y: [-34, -34, 0, 0, 0], rotate: [14, 14, 0, 0, 0], opacity: [0, 1, 1, 0, 0] }}
          transition={loop([0, 0.38, 0.52, 0.57, 1])}
          style={{ transformOrigin: '60px 50px' }}
        >
          <rect x="42" y="40" width="36" height="24" rx="4" fill="hsl(var(--card))" stroke={VERIFY} strokeWidth="2" />
          <path d="M42 44l18 13 18-13" fill="none" stroke={VERIFY} strokeWidth="2" />
        </motion.g>
      )}

      {/* notification card */}
      <motion.g
        initial={false}
        animate={still ? { y: 0, opacity: 1 } : { y: [-44, -44, 5, -3, 0, 0], opacity: [0, 0, 1, 1, 1, 1] }}
        transition={still ? undefined : loop([0, 0.54, 0.62, 0.66, 0.7, 1])}
      >
        <rect x="36" y="38" width="48" height="44" rx="8" fill="hsl(var(--background))" stroke="hsl(var(--border))" strokeWidth="2" />
        <circle cx="60" cy="52" r="10" fill="hsl(var(--verify) / 0.12)" stroke={VERIFY} strokeWidth="2" />
        <motion.path
          d="M55.5 52.5l3.5 3.5 6-7"
          fill="none"
          stroke={VERIFY}
          strokeWidth="2.6"
          initial={false}
          animate={still ? { pathLength: 1, opacity: 1 } : { pathLength: [0, 0, 1, 1], opacity: [0, 1, 1, 1] }}
          transition={still ? undefined : loop([0, 0.73, 0.85, 1])}
        />
        {[0, 1].map((i) => (
          <motion.rect
            key={i}
            x="44"
            y={68 + i * 8}
            width={i === 0 ? 32 : 22}
            height="4"
            rx="2"
            fill="hsl(var(--muted-foreground) / 0.35)"
            style={{ transformOrigin: '44px 70px' }}
            initial={false}
            animate={still ? { scaleX: 1, opacity: 1 } : { scaleX: [0, 0, 1, 1], opacity: [0, 0, 1, 1] }}
            transition={still ? undefined : loop([0, 0.85 + i * 0.03, 0.91 + i * 0.03, 1])}
          />
        ))}
      </motion.g>

      {/* badge dot + pulse */}
      {!still && (
        <motion.circle
          cx="88"
          cy="24"
          r="9"
          fill="none"
          stroke={VERIFY}
          strokeWidth="2"
          style={{ transformOrigin: '88px 24px' }}
          initial={false}
          animate={{ scale: [0.4, 0.4, 1.8, 1.8], opacity: [0, 0.6, 0, 0] }}
          transition={loop([0, 0.68, 0.82, 1])}
        />
      )}
      <motion.circle
        cx="88"
        cy="24"
        r="6"
        fill={VERIFY}
        style={{ transformOrigin: '88px 24px' }}
        initial={false}
        animate={still ? { scale: 1, opacity: 1 } : { scale: [0, 0, 1.25, 1, 1], opacity: [0, 0, 1, 1, 1] }}
        transition={still ? undefined : loop([0, 0.65, 0.71, 0.76, 1])}
      />
    </svg>
  );
}

/* ---------------------------------------------------------------- *
 * Year roll
 * ---------------------------------------------------------------- */

function YearRoll({ still }: { still: boolean }) {
  const [year, setYear] = useState(still ? 2036 : 2026);

  useEffect(() => {
    if (still) return;
    const id = window.setInterval(() => {
      setYear((y) => (y >= 2036 ? 2026 : y + 1));
    }, 700);
    return () => window.clearInterval(id);
  }, [still]);

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm text-foreground">
      <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden="true">
        <circle cx="12" cy="12" r="9" fill="hsl(var(--verify) / 0.12)" stroke="hsl(var(--verify))" strokeWidth="1.8" />
        <path d="M8 12.5l2.5 2.5L16 9.5" fill="none" stroke="hsl(var(--verify))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="text-muted-foreground">Verified</span>
      <span className="font-semibold tabular-nums">{year}</span>
    </span>
  );
}

/* ---------------------------------------------------------------- *
 * Steps data
 * ---------------------------------------------------------------- */

const steps = [
  {
    title: 'You donate',
    body: 'You pick a real need someone has posted and cover it. Any amount, toward one specific thing.',
    accent: 'hsl(var(--gold))',
    Art: GiveIllustration,
  },
  {
    title: 'It becomes a coupon',
    body: 'Your money converts into a gift card or credit that only works for that need. It can never be withdrawn as cash.',
    accent: 'hsl(var(--primary))',
    Art: CouponIllustration,
  },
  {
    title: 'They get what they needed',
    body: 'They redeem it at the store for groceries, medicine or a ride to work — the actual thing, not money.',
    accent: 'hsl(var(--primary))',
    Art: DeliveryIllustration,
  },
  {
    title: 'You get the receipt',
    body: 'A receipt comes back to you showing exactly what your money became, and when.',
    accent: 'hsl(var(--verify))',
    Art: ReceiptIllustration,
  },
];

/* ---------------------------------------------------------------- *
 * Section
 * ---------------------------------------------------------------- */

export function WhatWeDo() {
  const reduced = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { margin: '120px' });
  const still = !!reduced || !inView;

  const [replay, setReplay] = useState<number[]>([0, 0, 0, 0]);
  const restart = useCallback((i: number) => {
    if (typeof window !== 'undefined' && !window.matchMedia('(pointer: fine)').matches) return;
    setReplay((prev) => prev.map((v, idx) => (idx === i ? v + 1 : v)));
  }, []);

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-background py-20 md:py-28">
      {/* very soft washes */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(60% 40% at 12% 18%, hsl(var(--gold) / 0.05), transparent 70%), radial-gradient(60% 40% at 88% 82%, hsl(var(--primary) / 0.05), transparent 70%)',
        }}
      />

      <div className="container relative mx-auto px-4">
        {/* Intro */}
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">How it works</p>
          <h2 className="mt-3 text-4xl font-bold leading-tight text-foreground md:text-5xl">
            Give what people need.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            CouponDonation turns your donation into coupons, gift cards and credits — so it arrives as
            food, medicine or transport, never as cash. And you can always see exactly where it went.
          </p>
        </div>

        {/* Steps */}
        <div className="relative mt-14 md:mt-16">
          {/* connecting flow — desktop horizontal */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-[86px] hidden lg:block">
            <div className="relative mx-[12%] h-px bg-border">
              {!still && (
                <motion.span
                  className="absolute -top-[3px] h-[7px] w-[7px] rounded-full bg-primary/70"
                  initial={false}
                  animate={{ left: ['0%', '0%', '33%', '33%', '66%', '66%', '100%', '100%'] }}
                  transition={loop([0, 0.16, 0.28, 0.52, 0.62, 0.9, 0.99, 1])}
                />
              )}
            </div>
          </div>

          {/* connecting flow — mobile vertical */}
          <div aria-hidden="true" className="pointer-events-none absolute bottom-6 left-[7px] top-6 w-px bg-border lg:hidden">
            {!still && (
              <motion.span
                className="absolute -left-[3px] h-[7px] w-[7px] rounded-full bg-primary/70"
                initial={false}
                animate={{ top: ['0%', '0%', '33%', '33%', '66%', '66%', '100%', '100%'] }}
                transition={loop([0, 0.16, 0.28, 0.52, 0.62, 0.9, 0.99, 1])}
              />
            )}
          </div>

          <ol className="relative grid grid-cols-1 gap-10 sm:grid-cols-2 sm:gap-x-8 lg:grid-cols-4">
            {steps.map((step, i) => {
              const Art = step.Art;
              return (
                <li key={step.title} className="relative pl-8 lg:pl-0">
                  <motion.div
                    className="mx-auto h-[130px] w-[130px] overflow-hidden sm:h-[150px] sm:w-[150px] lg:mx-0"
                    whileHover={reduced ? undefined : { y: -4 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                    onMouseEnter={() => restart(i)}
                  >
                    <Art key={replay[i]} still={still} />
                  </motion.div>
                  <div className="mt-4 flex items-center gap-2">
                    <span
                      className="flex h-6 w-6 items-center justify-center rounded-full border text-xs font-semibold"
                      style={{ color: step.accent, borderColor: step.accent }}
                    >
                      {i + 1}
                    </span>
                    <h3 className="text-lg font-semibold text-foreground md:text-xl">{step.title}</h3>
                  </div>
                  <p className="mt-2 text-base leading-relaxed text-muted-foreground">{step.body}</p>
                </li>
              );
            })}
          </ol>
        </div>

        {/* Transparency statement */}
        <div className="mt-20 rounded-2xl border border-border bg-card/60 px-6 py-12 text-center md:mt-24 md:px-12">
          <p className="text-2xl font-semibold leading-snug text-foreground md:text-4xl">
            Donate $10 today. Check where it went in 2036.
          </p>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
            Every donation keeps its receipt. Permanently verifiable — not a promise, a record.
          </p>
          <div className="mt-6 flex justify-center">
            <YearRoll still={still} />
          </div>
        </div>

        {/* Dignity line */}
        <p className="mx-auto my-20 max-w-2xl text-center text-xl font-medium leading-relaxed text-foreground md:my-24 md:text-2xl">
          We don't track the person. We track the money.
        </p>

        {/* Two doors */}
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { to: '/donate', title: 'I want to help someone', body: 'Pick a real need and cover it.' },
            { to: '/apply', title: 'I need help', body: 'Tell us what you need. U.S. residents, free to apply.' },
          ].map((door) => (
            <Link
              key={door.to}
              to={door.to}
              className="group block rounded-2xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-[0_10px_30px_-12px_hsl(var(--primary)/0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <span className="block text-lg font-semibold text-foreground md:text-xl">{door.title}</span>
              <span className="mt-1 block text-base text-muted-foreground">{door.body}</span>
            </Link>
          ))}
        </div>

        {/* Closing */}
        <div className="mt-14 flex flex-col items-center gap-2 text-center">
          <p className="text-base text-muted-foreground">Real people are asking right now. Here's who.</p>
          <motion.span
            aria-hidden="true"
            animate={still ? undefined : { y: [0, 6, 0] }}
            transition={still ? undefined : { duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ChevronDown className="h-5 w-5 text-primary/70" />
          </motion.span>
        </div>
      </div>
    </section>
  );
}
