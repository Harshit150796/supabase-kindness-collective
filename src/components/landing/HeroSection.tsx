import { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const Tree3DScene = lazy(() =>
  import('@/components/landing/Tree3DScene').then((m) => ({ default: m.Tree3DScene }))
);

export function HeroSection() {
  return (
    <section className="relative min-h-[80vh] flex items-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-secondary/40 via-background to-background" />
      <div
        aria-hidden
        className="absolute -top-24 -left-24 w-[28rem] h-[28rem] rounded-full bg-primary/10 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute bottom-0 right-0 w-[32rem] h-[32rem] rounded-full bg-accent/20 blur-3xl"
      />

      <div className="container mx-auto px-4 py-12 md:py-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* LEFT: Copy + CTAs */}
          <div className="text-center lg:text-left order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Transparent · Traceable · Secure
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.05] mb-5">
              From donations to <span className="text-primary">real meals</span> —
              <br className="hidden sm:block" /> track every coupon.
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-8">
              Watch your generosity bloom on our Tree of Coupons. Every fruit is a
              real grocery coupon delivered to a verified family — and every fall is
              someone's gift turning into food on a table.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Button asChild size="lg" className="font-semibold">
                <Link to="/donate">
                  Donate Now <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="font-semibold">
                <Link to="/how-it-works">See how it works</Link>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-6">
              95% of every dollar reaches a family. Powered by partners like
              Walmart, Uber Eats, DoorDash, Target & more.
            </p>
          </div>

          {/* RIGHT: 3D Tree */}
          <div className="order-1 lg:order-2 w-full">
            <Suspense
              fallback={
                <div className="w-full h-[420px] sm:h-[500px] md:h-[600px] lg:h-[680px] flex items-center justify-center">
                  <Skeleton className="w-3/4 h-3/4 rounded-3xl" />
                </div>
              }
            >
              <Tree3DScene />
            </Suspense>
          </div>
        </div>
      </div>
    </section>
  );
}
