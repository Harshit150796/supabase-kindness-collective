import { useEffect, useRef } from 'react';
import { Heart, PieChart, ShoppingCart, TicketCheck } from 'lucide-react';
import { motion, useAnimationControls, useInView, useMotionTemplate, useScroll, useSpring, useTransform } from 'motion/react';
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
    <div ref={ref} data-fill-number className="relative shrink-0 select-none font-display text-[8rem] leading-[0.9] tracking-normal md:text-[12rem] lg:text-[15rem]" aria-label="100%">
      <span aria-hidden="true" className="block text-transparent [-webkit-text-stroke:1.5px_hsl(var(--foreground)/0.55)]">100%</span>
      <motion.span aria-hidden="true" className="absolute inset-0 block text-foreground" style={{ clipPath }}>
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
  const topVisible = useInView(top, { amount: 0 });
  const underline = useAnimationControls();
  useEffect(() => {
    const sync = () => {
      if (topVisible && !document.hidden) {
        void underline.start({ pathLength: [0, 0, 1, 1], opacity: [0, 1, 1, 1], transition: { duration: 7, times: [0, 0.1, 0.4, 1], ease: [0.65, 0, 0.35, 1], repeat: Infinity } });
      } else underline.stop();
    };
    sync();
    document.addEventListener('visibilitychange', sync);
    return () => { underline.stop(); document.removeEventListener('visibilitychange', sync); };
  }, [topVisible, underline]);
  return (
    <section data-every-dollar className="transparency-band flex min-h-[var(--lazy-reserved-height,0px)] flex-col justify-center bg-background py-12 text-foreground md:py-16 lg:py-20">
      <div className="container mx-auto max-w-6xl px-4">
        {/* The Promise's headline, with its hand-drawn underline redrawing like the concept. */}
        <h2 ref={top} className="max-w-5xl font-display text-[2.5rem] font-normal leading-[1.06] tracking-normal md:text-[3.5rem] lg:text-[4.5rem] xl:text-[5rem]">
          Every dollar you give reaches a family.{' '}
          <span data-promise-underline className="relative inline-block text-foreground">
            All of it.
            <svg viewBox="0 0 600 30" preserveAspectRatio="none" aria-hidden="true" className="absolute -bottom-[0.18em] left-0 h-[0.3em] w-full overflow-visible">
              <motion.path
                d="M4 20 C 150 6, 420 6, 596 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="5"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={underline}
              />
            </svg>
          </span>
        </h2>

        <div className="mt-10 flex flex-col gap-5 md:flex-row md:items-end md:gap-10 lg:mt-12 lg:gap-14">
          <FillingNumber />
          <motion.p
            className="max-w-md text-base leading-relaxed text-muted-foreground md:pb-3 md:text-lg"
            initial={{ opacity: 0, y: 12 }}
            animate={play ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 0.6, delay: 0.3, ease: EASE }}
          >
            Not 95. Not "most of it". Every dollar becomes coupons for families, with receipts.
          </motion.p>
        </div>

        <div ref={cols} className="mt-10 grid gap-7 border-t border-border pt-8 md:grid-cols-3 md:gap-8 lg:mt-12">
          {promises.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 16 }}
              animate={colsIn ? { opacity: 1, y: 0 } : undefined}
              transition={{ duration: 0.6, delay: i * 0.15, ease: EASE }}
            >
              <Tick play={colsIn} delay={i * 0.15 + 0.2} tone="text-foreground" />
              <p className="mt-2 text-base text-muted-foreground">{p.label}</p>
              <h3 className="mt-1 font-display text-[1.75rem] font-normal leading-tight lg:text-[2rem]">{p.title}</h3>
              <p className="mt-2 text-base leading-relaxed text-muted-foreground">{p.text}</p>
            </motion.div>
          ))}
        </div>

        <div className="relative mt-10 grid gap-6 border-t border-border pt-8 md:grid-cols-4 lg:mt-12">
          <motion.div data-journey-line aria-hidden="true" className="absolute left-2.5 top-8 bottom-4 w-px origin-top bg-foreground/20 md:bottom-auto md:left-0 md:right-0 md:top-10 md:h-px md:w-auto md:origin-left" initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true, amount: .2 }} transition={{ duration: 1.2, ease: EASE }} />
          <CouponScrollPath />
          {journey.map(({ title, text, Icon }, index) => (
            <Reveal key={title} delay={index * 0.07} className="relative grid grid-cols-[28px_1fr] gap-x-3 md:block">
              <span data-journey-step className="relative z-10 block h-5 w-5 opacity-100 md:mb-6"><Icon className="h-5 w-5 text-foreground opacity-100" strokeWidth={2.25} /></span>
              <div><span className="text-sm text-muted-foreground">0{index + 1}</span><h3 className="mt-1 font-display text-2xl font-normal">{title}</h3><p className="mt-2 text-base leading-relaxed text-muted-foreground">{text}</p></div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
