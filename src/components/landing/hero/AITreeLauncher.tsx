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
      className="absolute bottom-4 right-4 z-30 pointer-events-auto group flex items-center gap-2 pl-3 pr-4 py-2.5 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-2xl hover:shadow-emerald-500/40 hover:scale-105 transition-all duration-300"
      aria-label="Talk to Coupon, the AI tree"
    >
      <span className="relative flex items-center justify-center w-7 h-7 rounded-full bg-white/20">
        <Leaf className="w-4 h-4" />
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-300 animate-pulse" />
      </span>
      <span className="text-sm font-semibold whitespace-nowrap">Talk to Coupon</span>
    </button>
  );
}
