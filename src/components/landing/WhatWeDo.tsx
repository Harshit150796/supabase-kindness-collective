import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  ChevronDown,
  CircleDollarSign,
  CreditCard,
  FileCheck2,
  HandHeart,
  LockKeyhole,
  MessageCircleHeart,
  ShieldCheck,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const stages = [
  {
    title: 'Someone asks',
    description:
      'A verified person in the U.S. posts one real need: groceries for the month, a prescription, bus fare to a new job.',
    icon: MessageCircleHeart,
  },
  {
    title: 'You choose it',
    description:
      "You pick the need you want to cover. Ten dollars or a thousand — you're funding a specific thing, not a general pot.",
    icon: HandHeart,
  },
  {
    title: 'It locks',
    description:
      "Your money becomes a store card that only works on that need. It can't be withdrawn as cash. That's the whole point.",
    icon: LockKeyhole,
    emphasized: true,
  },
  {
    title: 'You get proof',
    description:
      'When it’s redeemed, the receipt comes back to you. You see what your money became.',
    icon: FileCheck2,
  },
];

const cashPoints = ['Can be spent anywhere', 'No proof it helped', 'You trust a promise'];
const lockedPoints = [
  'Only works on the stated need',
  'Receipt returns to the donor',
  'You trust the rails, not a promise',
];

export function WhatWeDo() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [phase, setPhase] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotionPreference = () => setReducedMotion(motionQuery.matches);
    updateMotionPreference();
    motionQuery.addEventListener('change', updateMotionPreference);
    return () => motionQuery.removeEventListener('change', updateMotionPreference);
  }, []);

  useEffect(() => {
    const element = sectionRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    if (reducedMotion) {
      setPhase(stages.length);
      return;
    }

    setPhase(1);
    const timers = [
      window.setTimeout(() => setPhase(2), 800),
      window.setTimeout(() => setPhase(3), 1600),
      window.setTimeout(() => setPhase(4), 2550),
    ];

    return () => timers.forEach(window.clearTimeout);
  }, [isVisible, reducedMotion]);

  const revealClass = (delay: string) =>
    cn(
      'transition-all duration-700 motion-reduce:transform-none motion-reduce:transition-none',
      isVisible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0',
      delay,
    );

  return (
    <section
      ref={sectionRef}
      aria-labelledby="what-we-do-title"
      className="relative overflow-hidden bg-gradient-to-b from-background via-primary/5 to-background py-24 md:py-32"
    >
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-6xl">
          <header className="mx-auto max-w-4xl text-center">
            <p className={revealClass('delay-0')}>
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                What we actually do
              </span>
            </p>
            <h2
              id="what-we-do-title"
              className={cn(
                'mt-6 text-4xl font-bold leading-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl',
                revealClass('delay-100'),
              )}
            >
              You don’t send money. You send groceries.
            </h2>
            <p
              className={cn(
                'mx-auto mt-7 max-w-[60ch] text-lg leading-relaxed text-muted-foreground md:text-xl',
                revealClass('delay-200'),
              )}
            >
              Or a prescription. Or a ride to work. On CouponDonation, someone tells you exactly what they need — and your donation arrives as that exact thing, not as cash.
            </p>
            <p
              className={cn(
                'mx-auto mt-6 max-w-2xl border-l-2 border-primary pl-4 text-left text-xl font-semibold leading-relaxed text-primary sm:text-center sm:border-l-0 sm:pl-0 md:text-2xl',
                revealClass('delay-300'),
              )}
            >
              And when it’s used, the receipt comes back to you.
            </p>
          </header>

          <div
            className={cn('relative mt-20 md:mt-24', revealClass('delay-500'))}
            aria-label="How a donation becomes locked help"
          >
            <div className="absolute bottom-10 left-6 top-6 w-px bg-border md:bottom-auto md:left-[12.5%] md:right-[12.5%] md:top-7 md:h-px md:w-auto" aria-hidden="true">
              <div
                className={cn(
                  'w-full origin-top bg-primary transition-[height] duration-700 ease-out motion-reduce:transition-none md:h-full md:origin-left md:transition-[width]',
                  phase === 0 && 'h-0 md:w-0',
                  phase === 1 && 'h-[12%] md:w-0',
                  phase === 2 && 'h-[38%] md:w-[34%]',
                  phase === 3 && 'h-[68%] md:w-[67%]',
                  phase >= 4 && 'h-full md:w-full',
                )}
              />
            </div>

            <ol className="relative grid gap-6 md:grid-cols-4 md:gap-5">
              {stages.map((stage, index) => {
                const Icon = stage.icon;
                const isReached = phase >= index + 1;
                const isCurrent = phase === index + 1;
                const isLockedToken = index >= 2;

                return (
                  <li key={stage.title} className="relative grid grid-cols-[3rem_1fr] gap-4 md:block">
                    <div className="relative z-10 flex h-12 w-12 items-center justify-center md:mx-auto md:h-14 md:w-14" aria-hidden="true">
                      <div
                        className={cn(
                          'absolute inset-0 rounded-full border bg-background transition-all duration-500 motion-reduce:transition-none',
                          isReached ? 'border-primary/40 shadow-emerald' : 'border-border',
                        )}
                      />
                      <Icon className={cn('relative h-5 w-5 transition-colors', isReached ? 'text-primary' : 'text-muted-foreground')} />

                      <div
                        className={cn(
                          'absolute z-20 flex items-center justify-center transition-all motion-reduce:transition-none',
                          isLockedToken ? 'h-8 w-11 rounded-md bg-primary text-primary-foreground' : 'h-8 w-8 rounded-full bg-accent text-accent-foreground',
                          isCurrent ? 'scale-100 opacity-100' : 'scale-50 opacity-0',
                          isCurrent && isLockedToken && 'duration-300 ease-out shadow-emerald',
                          isCurrent && !isLockedToken && 'duration-500',
                        )}
                      >
                        {isLockedToken ? (
                          <LockKeyhole className={cn('h-4 w-4', isCurrent && index === 2 && 'motion-safe:animate-bounce')} />
                        ) : (
                          <CircleDollarSign className="h-5 w-5" />
                        )}
                      </div>
                      {isCurrent && index === 2 && (
                        <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-primary/20 motion-reduce:hidden" />
                      )}
                    </div>

                    <Card
                      className={cn(
                        'h-full p-5 transition-all duration-500 motion-reduce:transition-none md:mt-6 md:p-6',
                        stage.emphasized
                          ? 'border-primary/40 bg-primary/5 shadow-emerald'
                          : 'border-border/80 bg-card/90',
                        isReached ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-60',
                      )}
                    >
                      <div className="mb-4 flex items-center gap-2">
                        {stage.emphasized && <CreditCard className="h-5 w-5 text-primary" aria-hidden="true" />}
                        <h3 className="text-lg font-semibold text-foreground">{stage.title}</h3>
                      </div>
                      <p className="text-sm leading-relaxed text-muted-foreground">{stage.description}</p>
                    </Card>
                  </li>
                );
              })}
            </ol>
          </div>

          <div className={cn('mx-auto mt-24 max-w-5xl md:mt-28', revealClass('delay-700'))}>
            <h3 className="text-center text-2xl font-bold text-foreground md:text-3xl">Why it’s built this way</h3>
            <div className="mt-8 grid gap-4 md:grid-cols-2 md:gap-6">
              <Card className="border-border/80 bg-muted/50 p-6 md:p-8">
                <h4 className="text-lg font-semibold text-muted-foreground">Sending cash</h4>
                <ul className="mt-5 space-y-4">
                  {cashPoints.map((point) => (
                    <li key={point} className="flex items-start gap-3 text-muted-foreground">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted">
                        <X className="h-3.5 w-3.5" aria-hidden="true" />
                      </span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              <Card className="border-primary/35 bg-primary/5 p-6 shadow-emerald md:p-8">
                <h4 className="text-lg font-semibold text-primary">Sending locked help</h4>
                <ul className="mt-5 space-y-4">
                  {lockedPoints.map((point) => (
                    <li key={point} className="flex items-start gap-3 text-foreground">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      </span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
            <p className="mt-6 text-center text-base text-muted-foreground">It’s a stricter way to give. That’s deliberate.</p>
          </div>

          <div className={cn('mx-auto mt-24 grid max-w-5xl gap-5 md:mt-28 md:grid-cols-2', revealClass('delay-700'))}>
            <Card className="flex h-full flex-col border-primary/25 bg-card p-7 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-emerald motion-reduce:transform-none md:p-8">
              <HandHeart className="h-8 w-8 text-primary" aria-hidden="true" />
              <h3 className="mt-5 text-2xl font-bold text-foreground">I want to help someone</h3>
              <p className="mt-2 flex-1 text-muted-foreground">Pick a real need and cover it.</p>
              <Button asChild size="lg" className="mt-7 w-full gap-2">
                <Link to="/donate">
                  Find a need <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </Card>

            <Card className="flex h-full flex-col border-primary/25 bg-card p-7 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-emerald motion-reduce:transform-none md:p-8">
              <MessageCircleHeart className="h-8 w-8 text-primary" aria-hidden="true" />
              <h3 className="mt-5 text-2xl font-bold text-foreground">I need help</h3>
              <p className="mt-2 flex-1 text-muted-foreground">Tell us what you need. U.S. residents, free to apply.</p>
              <Button asChild size="lg" className="mt-7 w-full gap-2">
                <Link to="/apply">
                  Start your request <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </Card>
          </div>

          <div className={cn('mt-20 text-center md:mt-24', revealClass('delay-700'))}>
            <p className="text-lg font-medium text-foreground md:text-xl">Real people are asking right now. Here’s who.</p>
            <ChevronDown className="mx-auto mt-3 h-5 w-5 text-primary motion-safe:animate-bounce" aria-hidden="true" />
          </div>
        </div>
      </div>
    </section>
  );
}
