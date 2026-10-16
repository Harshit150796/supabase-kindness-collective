import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useMotionPreference } from "@/hooks/useMotionPreference";
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
  const preference = useMotionPreference();
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % ROTATING_WORDS.length), 2800);
    return () => clearInterval(id);
  }, [preference]);

  return (
    <div
      className="hero-headline absolute top-4 md:top-6 left-1/2 -translate-x-1/2 z-30 w-[92%] max-w-2xl text-center pointer-events-auto transform-gpu antialiased"
      style={{ textShadow: "0 2px 12px rgba(0,0,0,0.18)" }}
    >
      <h1 className="sr-only">CouponDonation — Turn Donations Into Grocery Coupons for Verified Families</h1>
      <div className="flex items-center justify-center gap-2 mb-2">
        <span className="hero-kicker-lead text-xs uppercase tracking-[0.2em] text-foreground/70 font-semibold">
          CouponDonation is
        </span>
        <span className="hero-kicker-word relative inline-grid text-xs uppercase tracking-[0.2em] font-bold text-primary">
          {ROTATING_WORDS.map((word, index) => <span key={word} aria-hidden={index !== idx} className={`col-start-1 row-start-1 transition-[opacity,transform] duration-500 ${preference === 'gentle' ? 'translate-y-0' : index === idx ? 'translate-y-0' : 'translate-y-1'} ${index === idx ? 'opacity-100' : 'opacity-0'}`}>{word}</span>)}
        </span>
      </div>
      <div className="mt-3 md:mt-4 flex flex-wrap items-center justify-center gap-2.5 md:gap-3" style={{ textShadow: "none" }}>
        <Link to="/donate" className="btn-tva">
          <span className="tva-label">Donate now</span> <ArrowRight className="h-4 w-4" />
        </Link>
        <Link to="/apply" className="btn-tva-ghost"><span>Apply as Recipient</span></Link>
      </div>
    </div>
  );
}
