import { Leaf } from "lucide-react";

interface Props {
  onClick: () => void;
  hidden?: boolean;
}

export function AITreeLauncher({ onClick, hidden }: Props) {
  if (hidden) return null;
  return (
    <button
      onClick={onClick}
      className="absolute bottom-3 right-3 md:bottom-4 md:right-4 z-30 pointer-events-auto group flex items-center gap-1.5 md:gap-2 pl-2 pr-3 py-1.5 md:pl-3 md:pr-4 md:py-2.5 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-lg md:shadow-2xl hover:shadow-emerald-500/40 hover:scale-105 transition-all duration-300"
      aria-label="Talk to Coupon, the AI tree"
    >
      <span className="relative flex items-center justify-center w-5 h-5 md:w-7 md:h-7 rounded-full bg-white/20">
        <Leaf className="w-3 h-3 md:w-4 md:h-4" />
        <span className="hidden md:block absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-300 animate-pulse" />
      </span>
      <span className="text-[11px] md:text-sm font-semibold whitespace-nowrap">
        <span className="md:hidden">Ask Coupon</span>
        <span className="hidden md:inline">Talk to Coupon</span>
      </span>
    </button>
  );
}
