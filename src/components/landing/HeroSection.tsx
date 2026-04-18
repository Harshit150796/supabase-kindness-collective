import { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Tree3DScene = lazy(() =>
  import('@/components/landing/Tree3DScene').then((m) => ({ default: m.Tree3DScene }))
);

export function HeroSection() {
  return (
    <section className="relative w-full min-h-[88vh] overflow-hidden">
      {/* FULL-BLEED 3D TREE BACKGROUND */}
      <div className="absolute inset-0 z-0">
        <Suspense
          fallback={
            <div className="w-full h-full bg-gradient-to-b from-[#FFE9C7] via-[#FFF1D6] to-[#E8F0E8]" />
          }
        >
          <Tree3DScene />
        </Suspense>
      </div>

      {/* Left-side readability gradient — fades sky into text-friendly area */}
      <div
        aria-hidden
        className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-r from-background/95 via-background/70 to-transparent lg:from-background/90 lg:via-background/50 lg:to-transparent"
      />
      {/* Bottom fade so the section blends into the page below */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-32 z-10 pointer-events-none bg-gradient-to-t from-background to-transparent"
      />

      {/* TEXT OVERLAY */}
      <div className="container mx-auto px-4 py-16 md:py-24 lg:py-32 relative z-20">
        <div className="max-w-2xl text-center lg:text-left mx-auto lg:mx-0">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 backdrop-blur-sm text-primary text-xs font-semibold mb-5 border border-primary/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            Transparent · Traceable · Secure
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-foreground leading-[1.05] mb-5 drop-shadow-sm">
            From donations to <span className="text-primary">real meals</span> —
            <br className="hidden sm:block" /> track every coupon.
          </h1>
          <p className="text-base md:text-lg text-foreground/80 max-w-xl mx-auto lg:mx-0 mb-8">
            Watch your generosity bloom on our Tree of Coupons. Every fruit is a
            real grocery coupon delivered to a verified family — and every fall
            is someone's gift turning into food on a table.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
            <Button asChild size="lg" className="font-semibold shadow-lg shadow-primary/30">
              <Link to="/donate">
                Donate Now <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="font-semibold backdrop-blur-sm bg-background/60">
              <Link to="/how-it-works">See how it works</Link>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-6">
            95% of every dollar reaches a family. Powered by partners like
            Walmart, Uber Eats, DoorDash, Target & more.
          </p>
        </div>
      </div>
    </section>
  );
}
