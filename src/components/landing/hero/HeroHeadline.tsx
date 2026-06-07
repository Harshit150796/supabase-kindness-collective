import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const ROTATING_WORDS = ["Transparent", "Trackable", "Real-time"];

export function HeroHeadline() {
  const isMobile = useIsMobile();
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (isMobile) return; // static on mobile — avoids 2.8s "blink" over the tree
    const id = setInterval(() => setIdx((i) => (i + 1) % ROTATING_WORDS.length), 2800);
    return () => clearInterval(id);
  }, [isMobile]);

  return (
    <div
      className="absolute top-4 md:top-6 left-1/2 -translate-x-1/2 z-30 w-[92%] max-w-2xl text-center pointer-events-auto"
      style={{ textShadow: "0 2px 12px rgba(0,0,0,0.18)" }}
    >
      <div className="flex items-center justify-center gap-2 mb-2">
        <span className="text-xs uppercase tracking-[0.2em] text-foreground/70 font-semibold">
          CouponDonation is
        </span>
        {isMobile ? (
          <span className="inline-block text-xs uppercase tracking-[0.2em] font-bold text-emerald-700">
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
      <div className="mt-3 md:mt-4 inline-flex items-center justify-center gap-2 bg-background/60 backdrop-blur-sm rounded-full px-2 py-1 md:bg-transparent md:backdrop-blur-0 md:p-0">
        <Button asChild size="sm" className="shadow-lg">
          <Link to="/donate">
            Donate now <ArrowRight className="ml-1 w-3.5 h-3.5" />
          </Link>
        </Button>
        <Button
          asChild
          size="sm"
          variant="outline"
          className="hidden md:inline-flex bg-background/70 backdrop-blur-sm"
        >
          <Link to="/how-it-works">How it works</Link>
        </Button>
      </div>
    </div>
  );
}
