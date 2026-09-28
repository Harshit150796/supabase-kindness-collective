import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { LineReveal, Reveal } from "@/components/ui/editorial-motion";

export function HeroHeadline() {
  return (
    <div
      className="absolute top-4 md:top-6 left-1/2 -translate-x-1/2 z-30 w-[92%] max-w-3xl text-center pointer-events-auto transform-gpu antialiased"
    >
      <LineReveal>
        <h1 className="font-display text-3xl leading-none text-foreground md:text-5xl">CouponDonation</h1>
      </LineReveal>
      <Reveal delay={0.08} className="mt-1 text-sm text-foreground/75 md:text-base">
        Donations that become useful, trackable coupons.
      </Reveal>
      <Reveal delay={0.16} className="mt-3 md:mt-4 inline-flex items-center justify-center gap-1.5 md:gap-2">
        <Button asChild size="sm" className="shadow-lg whitespace-nowrap">
          <Link to="/donate">
            Donate now <ArrowRight className="ml-1 w-3.5 h-3.5" />
          </Link>
        </Button>
        <Button
          asChild
          size="sm"
          variant="outline"
          className="whitespace-nowrap bg-background shadow-lg"
        >
          <Link to="/apply">Apply as Recipient</Link>
        </Button>
      </Reveal>
    </div>
  );
}
