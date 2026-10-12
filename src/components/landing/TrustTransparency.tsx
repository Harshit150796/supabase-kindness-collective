import { useRef } from 'react';
import { CheckCircle, Heart, PieChart, ShoppingCart, TicketCheck } from 'lucide-react';
import { motion, useInView } from 'motion/react';
import { LineReveal, MotionBar, Reveal } from '@/components/ui/editorial-motion';
import { CouponScrollPath } from './CouponScrollPath';

// The whole gift reaches families. Running costs come from optional tips; the card fee is covered by
// the donor at checkout or paid from tips. (Interim copy until the redesign is chosen.)
const breakdown = [
  { label: 'Your gift, to families as coupons', percent: 100, Icon: Heart },
  { label: 'Taken from your gift for fees or operations', percent: 0, Icon: PieChart },
];
const extras = [
  { label: 'Tip at checkout', text: 'Optional. It pays for running CouponDonation; most donors leave about 10%.', Icon: CheckCircle },
  { label: 'Card processing fee', text: 'You can cover it at checkout. If you don\'t, we pay it from tips.', Icon: CheckCircle },
];

const journey = [
  { title: 'Donation', text: 'A completed contribution enters the record.', Icon: Heart },
  { title: 'Allocation', text: 'Value is assigned to the selected retailer.', Icon: PieChart },
  { title: 'Coupon', text: 'A restricted coupon is issued to the recipient.', Icon: TicketCheck },
  { title: 'Use', text: 'Recipient-reported use completes the visible trail.', Icon: ShoppingCart },
];

function AllocationRing() {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref, { once: true, amount: 0.45 });
  const circumference = 2 * Math.PI * 82;
  return (
    <div ref={ref} data-allocation-ring className="relative mx-auto h-56 w-56 sm:h-64 sm:w-64">
      <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="100" cy="100" r="82" fill="none" stroke="hsl(var(--primary-foreground) / 0.14)" strokeWidth="16" />
        <motion.circle
          cx="100"
          cy="100"
          r="82"
          fill="none"
          stroke="hsl(var(--primary-foreground))"
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={visible ? { strokeDashoffset: 0 } : undefined}
          transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <strong className="font-display text-7xl font-normal text-primary-foreground">100¢</strong>
        <span className="mt-1 text-sm text-primary-foreground/70">of each $1 you give</span>
      </div>
    </div>
  );
}

export function TrustTransparency() {
  return (
    <section data-cursor="light" className="flex min-h-[var(--lazy-reserved-height,0px)] flex-col justify-center bg-[hsl(var(--primary-20))] py-14 text-primary-foreground lg:py-20">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
          <Reveal><AllocationRing /></Reveal>
          <div>
            <LineReveal><h2 className="font-display text-4xl md:text-6xl">See where every dollar goes.</h2></LineReveal>
            <Reveal delay={0.05}><p className="mt-5 text-primary-foreground/75">Every dollar you give becomes coupons for families, with a receipt when each one is used. Nothing is taken out of the gift.</p></Reveal>
            <div className="mt-8 space-y-5">
              {breakdown.map(({ label, percent, Icon }, index) => (
                <Reveal key={label} delay={index * 0.07}>
                  <div className="flex items-end justify-between gap-4 text-sm">
                    <span className="flex items-center gap-2"><Icon className="h-4 w-4" />{label}</span>
                    <strong className="font-display text-3xl font-normal">{percent}%</strong>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden bg-primary-foreground/15">
                    <MotionBar value={percent} className="h-full w-full bg-primary-foreground" />
                  </div>
                </Reveal>
              ))}
              {extras.map(({ label, text, Icon }, index) => (
                <Reveal key={label} delay={(index + 2) * 0.07}>
                  <div className="flex items-start gap-2 text-sm">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                    <span><span className="font-medium">{label}.</span> <span className="text-primary-foreground/75">{text}</span></span>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>

        <div className="relative mt-12 grid gap-7 border-t border-primary-foreground/20 pt-10 md:grid-cols-4">
          <motion.div data-journey-line aria-hidden="true" className="absolute left-2.5 top-10 bottom-4 w-px origin-top bg-primary-foreground/25 md:bottom-auto md:left-0 md:right-0 md:top-12 md:h-px md:w-auto md:origin-left" initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true, amount: .2 }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }} />
          <CouponScrollPath />
          {journey.map(({ title, text, Icon }, index) => (
            <Reveal key={title} delay={index * 0.07} className="relative grid grid-cols-[28px_1fr] gap-x-3 md:block">
              <span data-journey-step className="relative z-10 block h-5 w-5 md:mb-7"><Icon className="h-5 w-5 text-primary-foreground" /></span>
              <div><span className="text-xs text-primary-foreground/55">0{index + 1}</span><h3 className="mt-1 font-display text-2xl font-normal">{title}</h3><p className="mt-2 text-sm leading-relaxed text-primary-foreground/70">{text}</p></div>
            </Reveal>
          ))}
        </div>
        <Reveal><p className="mt-10 border-t border-primary-foreground/20 pt-7 text-primary-foreground/75">The coupon trail stays visible, from donation to recipient-reported use.</p></Reveal>
      </div>
    </section>
  );
}
