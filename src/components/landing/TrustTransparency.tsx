import { useRef } from 'react';
import { Heart, PieChart, ShoppingCart, TicketCheck } from 'lucide-react';
import { motion, useInView } from 'motion/react';
import { Reveal } from '@/components/ui/editorial-motion';
import { CouponScrollPath } from './CouponScrollPath';

/**
 * "Every dollar you give reaches a family. All of it." (founder-chosen, Oct 2026: heading and colours
 * from the "Promise" concept, layout and the filling 100% from "The big number").
 * The whole gift reaches families; running costs come from optional tips and the card fee is covered
 * by the donor at checkout or paid from tips. Motion plays once, when the section comes into view.
 */
const EASE = [0.16, 1, 0.3, 1] as const;
const FILL = 1.6; // seconds for the 100% to fill

const promises = [
  { label: 'Your gift', title: 'Nothing taken out', text: 'Your whole gift becomes coupons at the stores you chose, with a receipt when each is used.', tone: 'text-primary' },
  { label: 'Your tip, optional', title: 'Tips keep us running', text: 'Added at checkout. Most donors leave about 10%, and every bit pays for the platform.', tone: 'text-verify' },
  { label: 'Card fee', title: 'The card fee is covered', text: "Tick the box to pay it yourself. If you don't, we pay it from tips, never from the gift.", tone: 'text-primary' },
];

const journey = [
  { title: 'Donation', text: 'Your gift is recorded in full.', Icon: Heart },
  { title: 'Allocation', text: 'Shared between the retailers you chose.', Icon: PieChart },
  { title: 'Coupon', text: 'Sized by our team for what a family needs.', Icon: TicketCheck },
  { title: 'Use', text: 'The receipt closes the trail.', Icon: ShoppingCart },
];

/** The outlined 100% that fills from the bottom with solid green. */
function FillingNumber({ play }: { play: boolean }) {
  return (
    <div data-fill-number className="relative select-none font-display text-[clamp(7.5rem,24vw,18.75rem)] leading-[0.9] tracking-[-0.03em]" aria-label="100%">
      <span aria-hidden="true" className="block text-transparent [-webkit-text-stroke:2px_hsl(var(--primary)/0.4)]">100%</span>
      <motion.span
        aria-hidden="true"
        className="absolute inset-0 block text-primary"
        initial={{ clipPath: 'inset(100% 0 0 0)' }}
        animate={play ? { clipPath: 'inset(0% 0 0 0)' } : undefined}
        transition={{ duration: FILL, ease: [0.65, 0, 0.35, 1] }}
      >
        100%
      </motion.span>
    </div>
  );
}

function Tick({ play, delay, tone }: { play: boolean; delay: number; tone: string }) {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true" className={tone}>
      <motion.path
        d="M7 17 l6 6 l12 -14"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={play ? { pathLength: 1, opacity: 1 } : undefined}
        transition={{ duration: 0.5, delay, ease: 'easeOut', opacity: { duration: 0.01, delay } }}
      />
    </svg>
  );
}

export function TrustTransparency() {
  // Each block plays when it is itself on screen, so tall phone layouts never wait on the whole section.
  const top = useRef<HTMLDivElement>(null);
  const cols = useRef<HTMLDivElement>(null);
  const play = useInView(top, { once: true, amount: 0.5 });
  const colsIn = useInView(cols, { once: true, amount: 0.25 });
  const colsDelay = play && colsIn ? FILL * 0.7 : 0;
  return (
    <section className="flex min-h-[var(--lazy-reserved-height,0px)] flex-col justify-center bg-background py-16 text-foreground lg:py-24">
      <div className="container mx-auto max-w-6xl px-4">
        <div ref={top} className="flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-14">
          <FillingNumber play={play} />
          <div className="min-w-0">
            <h2 className="font-display text-[2.6rem] font-normal leading-[1.02] sm:text-5xl lg:text-[3.6rem]">
              Every dollar you give reaches a family.{' '}
              <span data-promise-underline className="relative inline-block text-primary">
                All of it.
                <svg viewBox="0 0 600 30" preserveAspectRatio="none" aria-hidden="true" className="absolute -bottom-3 left-0 h-[0.3em] w-full overflow-visible">
                  <motion.path
                    d="M4 20 C 150 6, 420 6, 596 18"
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="5"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={play ? { pathLength: 1, opacity: 1 } : undefined}
                    transition={{ duration: 0.9, delay: FILL * 0.55, ease: [0.65, 0, 0.35, 1], opacity: { duration: 0.01, delay: FILL * 0.55 } }}
                  />
                </svg>
              </span>
            </h2>
            <motion.p
              className="mt-6 max-w-md text-lg leading-relaxed text-muted-foreground"
              initial={{ opacity: 0, y: 12 }}
              animate={play ? { opacity: 1, y: 0 } : undefined}
              transition={{ duration: 0.6, delay: 0.3, ease: EASE }}
            >
              Not 95. Not "most of it". Every dollar becomes coupons for families, with receipts.
            </motion.p>
          </div>
        </div>

        <div ref={cols} className="mt-14 grid gap-10 border-t border-border pt-10 md:grid-cols-3 md:gap-12">
          {promises.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 16 }}
              animate={colsIn ? { opacity: 1, y: 0 } : undefined}
              transition={{ duration: 0.6, delay: colsDelay + i * 0.15, ease: EASE }}
            >
              <Tick play={colsIn} delay={colsDelay + i * 0.15 + 0.2} tone={p.tone} />
              <p className={`mt-3 text-sm ${p.tone}`}>{p.label}</p>
              <h3 className="mt-1 font-display text-[2rem] font-normal leading-tight">{p.title}</h3>
              <p className="mt-2 text-[1.05rem] leading-relaxed text-muted-foreground">{p.text}</p>
            </motion.div>
          ))}
        </div>

        <div className="relative mt-14 grid gap-7 border-t border-border pt-10 md:grid-cols-4">
          <motion.div data-journey-line aria-hidden="true" className="absolute left-2.5 top-10 bottom-4 w-px origin-top bg-foreground/20 md:bottom-auto md:left-0 md:right-0 md:top-12 md:h-px md:w-auto md:origin-left" initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true, amount: .2 }} transition={{ duration: 1.2, ease: EASE }} />
          <CouponScrollPath />
          {journey.map(({ title, text, Icon }, index) => (
            <Reveal key={title} delay={index * 0.07} className="relative grid grid-cols-[28px_1fr] gap-x-3 md:block">
              <span data-journey-step className="relative z-10 block h-5 w-5 md:mb-7"><Icon className="h-5 w-5 text-primary" /></span>
              <div><span className="text-xs text-muted-foreground">0{index + 1}</span><h3 className="mt-1 font-display text-2xl font-normal">{title}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p></div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
