import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useEffect, useState } from 'react';

/* ---------------------------------------------------------------- *
 * Step illustrations — inline SVG, gentle continuous loops
 * ---------------------------------------------------------------- */

function CoinIllustration({ still }: { still: boolean }) {
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden="true">
      <ellipse cx="60" cy="98" rx="20" ry="5" fill="hsl(var(--foreground) / 0.08)" />
      <motion.g
        initial={false}
        animate={still ? { y: 0 } : { y: [-22, 0, 0, -22] }}
        transition={still ? undefined : { duration: 3.6, times: [0, 0.35, 0.85, 1], repeat: Infinity, ease: 'easeInOut' }}
      >
        <circle cx="60" cy="62" r="26" fill="hsl(var(--gold) / 0.18)" stroke="hsl(var(--gold))" strokeWidth="2.5" />
        <circle cx="60" cy="62" r="19" fill="none" stroke="hsl(var(--gold) / 0.55)" strokeWidth="1.2" />
        <text
          x="60"
          y="70"
          textAnchor="middle"
          fontSize="22"
          fontWeight="700"
          fill="hsl(var(--gold))"
        >
          $
        </text>
      </motion.g>
    </svg>
  );
}

function CouponIllustration({ still }: { still: boolean }) {
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden="true">
      <g>
        <rect x="16" y="36" width="88" height="48" rx="8" fill="hsl(var(--card))" stroke="hsl(var(--primary))" strokeWidth="2" />
        <line x1="76" y1="38" x2="76" y2="82" stroke="hsl(var(--primary) / 0.7)" strokeWidth="1.5" strokeDasharray="4 4" />
        <circle cx="76" cy="36" r="4" fill="hsl(var(--background))" stroke="hsl(var(--primary))" strokeWidth="1.5" />
        <circle cx="76" cy="84" r="4" fill="hsl(var(--background))" stroke="hsl(var(--primary))" strokeWidth="1.5" />
        {[26, 31, 35, 40, 46, 51, 57, 62].map((x, i) => (
          <rect
            key={x}
            x={x}
            y="50"
            width={i % 3 === 0 ? 2.6 : 1.4}
            height="20"
            rx="0.6"
            fill="hsl(var(--primary) / 0.75)"
          />
        ))}
        <motion.g
          initial={false}
          animate={still ? { y: 0, scale: 1 } : { y: [-8, 0, 0, -8], scale: [0.9, 1.06, 1, 0.9] }}
          transition={still ? undefined : { duration: 3.6, times: [0, 0.32, 0.85, 1], repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: '89px 60px' }}
        >
          <rect x="83" y="58" width="12" height="10" rx="2" fill="hsl(var(--primary))" />
          <path d="M85.5 58v-3a3.5 3.5 0 0 1 7 0v3" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" />
        </motion.g>
      </g>
    </svg>
  );
}

function GroceriesIllustration({ still }: { still: boolean }) {
  const item = (delay: number) =>
    still
      ? undefined
      : { duration: 3.6, times: [0, 0.3, 0.85, 1], repeat: Infinity, ease: 'easeInOut' as const, delay };
  const anim = still ? { y: 0, opacity: 1 } : { y: [16, 0, 0, 16], opacity: [0, 1, 1, 0] };
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden="true">
      {/* items rising behind the bag rim */}
      <motion.g initial={false} animate={anim} transition={item(0)}>
        <rect x="34" y="44" width="20" height="14" rx="5" fill="hsl(var(--gold) / 0.35)" stroke="hsl(var(--gold))" strokeWidth="1.6" />
      </motion.g>
      <motion.g initial={false} animate={anim} transition={item(0.25)}>
        <path d="M58 58V46l5-5h6v17z" fill="hsl(var(--primary) / 0.15)" stroke="hsl(var(--primary))" strokeWidth="1.6" strokeLinejoin="round" />
      </motion.g>
      <motion.g initial={false} animate={anim} transition={item(0.5)}>
        <circle cx="80" cy="51" r="8" fill="hsl(var(--primary) / 0.18)" stroke="hsl(var(--primary))" strokeWidth="1.6" />
        <path d="M80 43v-4" stroke="hsl(var(--primary))" strokeWidth="1.6" strokeLinecap="round" />
      </motion.g>
      {/* bag */}
      <path
        d="M28 56h64l-5 42a6 6 0 0 1-6 5H39a6 6 0 0 1-6-5z"
        fill="hsl(var(--gold) / 0.12)"
        stroke="hsl(var(--primary))"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M28 56h64" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" />
      <path d="M46 56V48a14 14 0 0 1 28 0v8" fill="none" stroke="hsl(var(--primary) / 0.45)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ReceiptIllustration({ still }: { still: boolean }) {
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden="true">
      <rect x="26" y="26" width="68" height="72" rx="8" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="2" />
      <rect x="38" y="40" width="30" height="4" rx="2" fill="hsl(var(--muted-foreground) / 0.4)" />
      <rect x="38" y="50" width="44" height="4" rx="2" fill="hsl(var(--muted-foreground) / 0.25)" />
      <rect x="38" y="60" width="36" height="4" rx="2" fill="hsl(var(--muted-foreground) / 0.25)" />
      <circle cx="60" cy="82" r="12" fill="hsl(var(--verify) / 0.12)" stroke="hsl(var(--verify))" strokeWidth="2" />
      <motion.path
        d="M54.5 82.5l4 4 7-8"
        fill="none"
        stroke="hsl(var(--verify))"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={false}
        animate={still ? { pathLength: 1, opacity: 1 } : { pathLength: [0, 1, 1, 0], opacity: [0.4, 1, 1, 0.4] }}
        transition={still ? undefined : { duration: 3.6, times: [0, 0.4, 0.85, 1], repeat: Infinity, ease: 'easeInOut' }}
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
    Art: CoinIllustration,
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
    Art: GroceriesIllustration,
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
  const still = !!reduced;

  return (
    <section className="relative overflow-hidden bg-background py-20 md:py-28">
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
                  initial={{ left: '0%' }}
                  animate={{ left: ['0%', '100%'] }}
                  transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}
                />
              )}
            </div>
          </div>

          {/* connecting flow — mobile vertical */}
          <div aria-hidden="true" className="pointer-events-none absolute bottom-6 left-[7px] top-6 w-px bg-border lg:hidden">
            {!still && (
              <motion.span
                className="absolute -left-[3px] h-[7px] w-[7px] rounded-full bg-primary/70"
                initial={{ top: '0%' }}
                animate={{ top: ['0%', '100%'] }}
                transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}
              />
            )}
          </div>

          <ol className="relative grid grid-cols-1 gap-10 sm:grid-cols-2 sm:gap-x-8 lg:grid-cols-4">
            {steps.map((step, i) => {
              const Art = step.Art;
              return (
                <li key={step.title} className="relative pl-8 lg:pl-0">
                  <div className="mx-auto h-[130px] w-[130px] sm:h-[150px] sm:w-[150px] lg:mx-0">
                    <Art still={still} />
                  </div>
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
