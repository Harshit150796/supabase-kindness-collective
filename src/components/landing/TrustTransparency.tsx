import { CheckCircle, Heart, PieChart, ShoppingCart, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LineReveal, Reveal } from '@/components/ui/editorial-motion';
import { useMotionPreference } from '@/hooks/useMotionPreference';
import { cn } from '@/lib/utils';

const breakdownItems = [
  { label: 'Direct to Recipients', percent: 95, color: 'bg-primary', icon: Heart },
  { label: 'Platform Operations', percent: 3, color: 'bg-verify', icon: PieChart },
  { label: 'Payment Processing', percent: 2, color: 'bg-verify/45', icon: CheckCircle },
];

const journeySteps = [
  { title: 'You Donate', description: 'Choose a brand and amount', icon: Heart },
  { title: 'We Purchase', description: 'Buy coupons at wholesale', icon: ShoppingCart },
  { title: 'Families Receive', description: 'Direct distribution', icon: Users },
  { title: 'Impact Verified', description: 'Transparent tracking', icon: CheckCircle },
];

function AllocationRing() {
  const preference = useMotionPreference();
  const radius = 72;
  const circumference = 2 * Math.PI * radius;
  const segments = [
    { percent: 95, stroke: 'hsl(var(--primary))' },
    { percent: 3, stroke: 'hsl(var(--verify))' },
    { percent: 2, stroke: 'hsl(var(--verify) / 0.45)' },
  ];
  let cumulative = 0;

  return (
    <div className="relative mx-auto h-44 w-44">
      <svg viewBox="0 0 168 168" className="h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="84" cy="84" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="14" />
        {segments.map((segment) => {
          const rotation = cumulative * 3.6;
          cumulative += segment.percent;
          return (
            <motion.circle
              key={segment.percent}
              cx="84"
              cy="84"
              r={radius}
              fill="none"
              stroke={segment.stroke}
              strokeWidth="14"
              strokeLinecap="butt"
              strokeDasharray={circumference}
              initial={preference === 'full' ? { strokeDashoffset: circumference, opacity: 0 } : { opacity: 0 }}
              whileInView={{ strokeDashoffset: circumference * (1 - segment.percent / 100), opacity: 1 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: preference === 'full' ? 1 : 0.3, ease: 'easeOut' }}
              style={{ transformOrigin: 'center', transform: `rotate(${rotation}deg)` }}
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-5xl text-primary">95¢</span>
        <span className="text-xs text-muted-foreground">of every $1</span>
      </div>
    </div>
  );
}

export function TrustTransparency() {
  const [activeTab, setActiveTab] = useState<'breakdown' | 'journey'>('breakdown');

  return (
    <section className="border-y border-border bg-background py-24 md:py-36">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 border-b border-border pb-12 md:grid-cols-[1.1fr_0.9fr] md:items-end md:pb-16">
            <LineReveal>
              <h2 className="font-display text-5xl font-normal leading-none text-foreground md:text-6xl">See where every dollar goes.</h2>
            </LineReveal>
            <Reveal delay={0.1}>
              <p className="text-lg leading-relaxed text-muted-foreground">The allocation and coupon trail stay visible, from donation to use.</p>
            </Reveal>
          </div>

          <div className="flex gap-6 border-b border-border py-6" role="tablist" aria-label="Donation transparency views">
            <Button type="button" variant="ghost" className={cn('rounded-none px-0', activeTab === 'breakdown' && 'border-b-2 border-primary text-primary')} onClick={() => setActiveTab('breakdown')} role="tab" aria-selected={activeTab === 'breakdown'}>
              Breakdown
            </Button>
            <Button type="button" variant="ghost" className={cn('rounded-none px-0', activeTab === 'journey' && 'border-b-2 border-primary text-primary')} onClick={() => setActiveTab('journey')} role="tab" aria-selected={activeTab === 'journey'}>
              The Journey
            </Button>
          </div>

          {activeTab === 'breakdown' ? (
            <div className="grid gap-12 py-12 md:grid-cols-[0.8fr_1.2fr] md:items-center md:py-16">
              <Reveal><AllocationRing /></Reveal>
              <div className="divide-y divide-border border-y border-border">
                {breakdownItems.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <Reveal key={item.label} delay={index * 0.08} className="grid grid-cols-[auto_1fr_auto] items-center gap-4 py-6">
                      <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                      <div>
                        <div className="font-medium text-foreground">{item.label}</div>
                        <div className="mt-2 h-1.5 overflow-hidden bg-muted"><div className={cn('h-full', item.color)} style={{ width: `${item.percent}%` }} /></div>
                      </div>
                      <span className="font-display text-3xl text-foreground">{item.percent}%</span>
                    </Reveal>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="grid divide-y divide-border border-b border-border md:grid-cols-4 md:divide-x md:divide-y-0">
              {journeySteps.map((item, index) => {
                const Icon = item.icon;
                return (
                  <Reveal key={item.title} delay={index * 0.08} className="px-5 py-10">
                    <div className="mb-8 flex items-center justify-between"><span className="text-sm tabular-nums text-muted-foreground">0{index + 1}</span><Icon className="h-5 w-5 text-primary" /></div>
                    <h3 className="font-display text-2xl font-normal text-foreground">{item.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                  </Reveal>
                );
              })}
            </div>
          )}

          <Reveal className="border-b border-border py-8 text-center">
            <p className="text-foreground"><strong className="text-primary">95¢ of every dollar</strong> goes directly to purchasing coupons for families in need.</p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}