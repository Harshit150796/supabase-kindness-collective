import { Check, CircleDollarSign, ReceiptText, ShieldCheck, TicketCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { Reveal } from '@/components/ui/editorial-motion';
import { useMotionPreference } from '@/hooks/useMotionPreference';
import { cn } from '@/lib/utils';

type ProductTraceVisualProps = {
  className?: string;
  mode?: 'coupon' | 'receipt' | 'trace';
  inverse?: boolean;
};

const traceSteps = [
  { label: 'Donation received', icon: CircleDollarSign },
  { label: 'Coupon issued', icon: TicketCheck },
  { label: 'Coupon redeemed', icon: Check },
  { label: 'Receipt recorded', icon: ReceiptText },
];

export function ProductTraceVisual({ className, mode = 'trace', inverse = false }: ProductTraceVisualProps) {
  const gentle = useMotionPreference() === 'gentle';
  const surface = inverse ? 'bg-primary-foreground/10 text-primary-foreground' : 'bg-secondary text-foreground';
  const inset = inverse ? 'bg-primary-foreground text-foreground' : 'bg-background text-foreground';

  if (mode === 'coupon') {
    return (
      <Reveal className={cn('relative overflow-hidden rounded-[1.5rem] p-6 sm:p-9', surface, className)}>
        <div aria-hidden="true" className="absolute -right-20 -top-20 h-56 w-56 rounded-full border border-current opacity-10" />
        <motion.div
          className={cn('relative mx-auto max-w-md overflow-hidden rounded-[1.5rem] p-7 sm:p-9', inset)}
          initial={{ opacity: 0, y: gentle ? 16 : 36, rotate: gentle ? 0 : -2 }}
          whileInView={{ opacity: 1, y: 0, rotate: 0 }}
          viewport={{ once: true, amount: 0.45 }}
          transition={{ duration: gentle ? 0.5 : 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="font-display text-3xl text-primary sm:text-4xl">CouponDonation</p>
              <p className="mt-2 text-sm text-muted-foreground">Restricted coupon value</p>
            </div>
            <TicketCheck className="h-9 w-9 shrink-0 text-verify" />
          </div>
          <div className="mt-12 flex items-end justify-between border-t border-border pt-5">
            <div><p className="text-xs text-muted-foreground">STATUS</p><p className="mt-1 font-medium">Ready to use</p></div>
            <div className="flex items-center gap-2 text-sm font-medium text-primary"><ShieldCheck className="h-4 w-4" /> Verified</div>
          </div>
        </motion.div>
      </Reveal>
    );
  }

  if (mode === 'receipt') {
    return (
      <Reveal className={cn('relative overflow-hidden rounded-[1.5rem] p-6 sm:p-9', surface, className)}>
        <motion.div
          className={cn('mx-auto max-w-sm rounded-[1.5rem] p-7 sm:p-9', inset)}
          initial={{ opacity: 0, y: gentle ? 16 : 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: gentle ? 0.5 : 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex items-center justify-between"><ReceiptText className="h-8 w-8 text-primary" /><ShieldCheck className="h-6 w-6 text-verify" /></div>
          <p className="mt-8 font-display text-3xl">Donation receipt</p>
          <p className="mt-2 text-sm text-muted-foreground">A durable record from donation to coupon use.</p>
          <div className="mt-8 space-y-4">
            {['Payment confirmed', 'Retailer selected', 'Coupon recorded'].map((label, index) => (
              <motion.div key={label} className="flex items-center gap-3" initial={{ opacity: 0, x: gentle ? 0 : -18 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.12, duration: gentle ? 0.45 : 0.7 }}>
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground"><Check className="h-3.5 w-3.5" /></span>
                <span className="text-sm font-medium">{label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </Reveal>
    );
  }

  return (
    <Reveal className={cn('relative overflow-hidden rounded-[1.5rem] p-6 sm:p-9', surface, className)}>
      <div className="relative mx-auto max-w-xl py-3">
        <div aria-hidden="true" className={cn('absolute left-5 top-8 h-[calc(100%-4rem)] w-px sm:left-8', inverse ? 'bg-primary-foreground/25' : 'bg-primary/20')} />
        <motion.div aria-hidden="true" className="absolute left-5 top-8 h-[calc(100%-4rem)] w-px origin-top bg-verify sm:left-8" initial={{ scaleY: 0, opacity: 0 }} whileInView={{ scaleY: 1, opacity: 1 }} viewport={{ once: true, amount: 0.35 }} transition={{ duration: gentle ? 0.7 : 1.4, ease: [0.16, 1, 0.3, 1] }} />
        <ol className="relative space-y-5">
          {traceSteps.map((step, index) => (
            <motion.li key={step.label} className="flex items-center gap-5" initial={{ opacity: 0, y: gentle ? 12 : 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.5 }} transition={{ duration: gentle ? 0.5 : 0.75, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}>
              <span className={cn('relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full sm:h-16 sm:w-16', inset)}><step.icon className="h-5 w-5 text-primary sm:h-6 sm:w-6" /></span>
              <div><p className="font-medium">{step.label}</p><p className={cn('mt-1 text-sm', inverse ? 'text-primary-foreground/70' : 'text-muted-foreground')}>A visible step in the giving record</p></div>
            </motion.li>
          ))}
        </ol>
      </div>
    </Reveal>
  );
}