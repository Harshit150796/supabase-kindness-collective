import { useEffect, useState } from "react";

const ROTATING_WORDS = ["Transparent", "Trackable", "Real-time"];

export function HeroHeadline() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % ROTATING_WORDS.length), 2800);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="absolute top-3 md:top-5 left-1/2 -translate-x-1/2 z-30 w-[92%] max-w-xl text-center pointer-events-auto"
      style={{ textShadow: "0 1px 2px rgba(255,255,255,0.6)" }}
    >
      <div className="flex items-center justify-center gap-2 mb-1.5">
        <span className="text-[10px] md:text-xs uppercase tracking-[0.2em] text-emerald-900/60 font-semibold">
          CouponDonation is
        </span>
        <span
          key={ROTATING_WORDS[idx]}
          className="inline-block text-[10px] md:text-xs uppercase tracking-[0.2em] font-bold text-emerald-700 animate-in fade-in slide-in-from-bottom-1 duration-500"
        >
          {ROTATING_WORDS[idx]}
        </span>
      </div>
      <h1 className="text-base md:text-xl font-medium tracking-tight text-emerald-900/70 dark:text-emerald-100/80">
        Every donation grows into{" "}
        <span className="font-semibold text-emerald-700 dark:text-emerald-300">groceries</span>.
      </h1>
    </div>
  );
}
