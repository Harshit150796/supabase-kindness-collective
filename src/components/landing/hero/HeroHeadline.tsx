import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const MOBILE_BREAKPOINT = 768;
const ROTATING_WORDS = ["Transparent", "Trackable", "Real-time"];

// FIX #4: Initialise isMobile synchronously on the client so the first
// render already picks the correct mobile/desktop branch.  The previous
// useIsMobile() hook started as `undefined` (coerced to false), triggering
// a second render after the effect fired — causing a brief flash of the
// animated word path on mobile devices.
function getIsMobile() {
  if (typeof window === "undefined") return false;
  return window.innerWidth < MOBILE_BREAKPOINT;
}

export function HeroHeadline() {
  const [isMobile, setIsMobile] = useState(getIsMobile);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (isMobile) return; // static on mobile — avoids 2.8s "blink" over the tree
    const id = setInterval(() => setIdx((i) => (i + 1) % ROTATING_WORDS.length), 2800);
    return () => clearInterval(id);
  }, [isMobile]);

  return (
    <div
      className="absolute top-4 md:top-6 left-1/2 -translate-x-1/2 z-30 w-[92%] max-w-2xl text-center pointer-events-auto transform-gpu antialiased"
      style={{ textShadow: "0 2px 12px rgba(0,0,0,0.18)" }}
    >
      <h1 className="text-[19px] leading-tight sm:text-2xl md:text-3xl font-extrabold text-foreground">
        Turn your donation into groceries
        <span className="sr-only">
          {' '}— CouponDonation converts donations into grocery coupons for verified US families
        </span>
      </h1>
      <p className="mt-1.5 text-[13px] sm:text-sm text-foreground/75 font-medium">
        100% of your gift becomes grocery coupons for verified families.
      </p>
      <div className="flex items-center justify-center gap-2 mt-2">
        <span className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-foreground/70 font-semibold">
          CouponDonation is
        </span>
        {isMobile ? (
          <span className="inline-block text-[10px] sm:text-xs uppercase tracking-[0.2em] font-bold text-emerald-700">
            {ROTATING_WORDS[0]}
          </span>
        ) : (
          <span
            key={ROTATING_WORDS[idx]}
            className="inline-block text-xs uppercase tracking-[0.2em] font-bold text-emerald-700 animate-in fade-in slide-in-from-bottom-1 duration-500"
          >
            {ROTATING_WORDS[idx]}
          </span>
        )}
      </div>

      <div className="mt-3 md:mt-4 inline-flex items-center justify-center gap-1.5 md:gap-2">
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
      </div>
    </div>
  );
}
