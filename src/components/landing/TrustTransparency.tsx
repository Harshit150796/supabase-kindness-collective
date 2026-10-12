import { useRef } from 'react';
import { Heart, PieChart, ShoppingCart, TicketCheck } from 'lucide-react';
import { motion, useInView, useMotionTemplate, useScroll, useSpring, useTransform } from 'motion/react';
import { Reveal } from '@/components/ui/editorial-motion';
import { CouponScrollPath } from './CouponScrollPath';

/**
 * "Every dollar you give reaches a family. All of it." (founder-chosen, Oct 2026: heading, underline
 * and colours from the "Promise" concept as the headline, then the scroll-filled 100% from "The big number").
 * The whole gift reaches families; running costs come from optional tips and the card fee is covered
 * by the donor at checkout or paid from tips.
 */
const EASE = [0.16, 1, 0.3, 1] as const;

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

/**
 * The outlined 100% fills with green as it scrolls up the screen and drains as it scrolls back down,
 * so it is always in motion with the page. A soft spring makes the level follow the scroll slowly.
 */
function FillingNumber() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const level = useSpring(useTransform(scrollYProgress, [0.12, 0.62], [0, 100], { clamp: true }), { stiffness: 38, damping: 18, mass: 1.2 });
  const clipPath = useMotionTemplate`inset(${useTransform(level, (v) => 100 - v)}% 0 0 0)`;
  return (
    <div ref={ref} data-fill-number className="relative select-none font-display text-[clamp(7.5rem,24vw,18.75rem)] leading-[0.9] tracking-[-0.03em]" aria-label="100%">
      <span aria-hidden="true" className="block text-transparent [-webkit-text-stroke:2px_hsl(var(--primary)/0.4)]">100%</span>
      <motion.span aria-hidden="true" className="absolute inset-0 block text-primary" style={{ clipPath }}>
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
  const top = useRef<HTMLHeadingElement>(null);
  const cols = useRef<HTMLDivElement>(null);
  const play = useInView(top, { once: true, amount: 0.5 });
  const colsIn = useInView(cols, { once: true, amount: 0.25 });
  return (
    <section className="flex min-h-[var(--lazy-reserved-height,0px)] flex-col justify-center bg-background py-16 text-foreground lg:py-24">
      <div className="container mx-auto max-w-6xl px-4">
        {/* The Promise's headline, with its hand-drawn underline redrawing like the concept. */}
        <h2 ref={top} className="max-w-5xl font-display text-[2.9rem] font-normal leading-[0.98] sm:text-6xl lg:text-[6.5rem]">
          Every dollar you give reaches a family.{' '}
          <span data-promise-underline className="relative inline-block text-primary">
            All of it.
            <svg viewBox="0 0 600 30" preserveAspectRatio="none" aria-hidden="true" className="absolute -bottom-[0.18em] left-0 h-[0.3em] w-full overflow-visible">
              <motion.path
                d="M4 20 C 150 6, 420 6, 596 18"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="5"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={play ? { pathLength: [0, 0, 1, 1], opacity: [0, 1, 1, 1] } : undefined}
                transition={{ duration: 7, times: [0, 0.1, 0.4, 1], ease: [0.65, 0, 0.35, 1], repeat: Infinity }}
              />
            </svg>
          </span>
        </h2>

        <div className="mt-12 flex flex-col gap-6 lg:mt-14 lg:flex-row lg:items-end lg:gap-14">
          <FillingNumber />
          <motion.p
            className="max-w-md pb-4 text-lg leading-relaxed text-muted-foreground lg:text-xl"
            initial={{ opacity: 0, y: 12 }}
            animate={play ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 0.6, delay: 0.3, ease: EASE }}
          >
            Not 95. Not "most of it". Every dollar becomes coupons for families, with receipts.
          </motion.p>
        </div>

        <div ref={cols} className="mt-14 grid gap-10 border-t border-border pt-10 md:grid-cols-3 md:gap-12">
          {promises.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 16 }}
              animate={colsIn ? { opacity: 1, y: 0 } : undefined}
              transition={{ duration: 0.6, delay: i * 0.15, ease: EASE }}
            >
              <Tick play={colsIn} delay={i * 0.15 + 0.2} tone={p.tone} />
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
