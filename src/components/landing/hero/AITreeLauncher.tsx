import { Button } from "@/components/ui/button";
import { Leaf } from "lucide-react";

interface Props {
  onClick: () => void;
  hidden?: boolean;
}

export function AITreeLauncher({ onClick, hidden }: Props) {
  if (hidden) return null;
  return (
    <Button
      onClick={onClick}
      className="absolute bottom-[max(12px,env(safe-area-inset-bottom))] right-[max(12px,env(safe-area-inset-right))] min-h-11 md:bottom-4 md:right-4 z-30 pointer-events-auto group flex items-center gap-1.5 md:gap-2 pl-2 pr-3 py-1.5 md:pl-3 md:pr-4 md:py-2.5 rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-105 transition-all duration-300"
      aria-label="Talk to Coupon, the AI tree"
    >
      <span className="relative flex items-center justify-center w-5 h-5 md:w-7 md:h-7 rounded-full bg-primary-foreground/20">
        <Leaf className="w-3 h-3 md:w-4 md:h-4" />
        <span className="hidden md:block absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-verify animate-pulse" />
      </span>
      <span className="text-[11px] md:text-sm font-semibold whitespace-nowrap">
        <span className="md:hidden">Ask Coupon</span>
        <span className="hidden md:inline">Talk to Coupon</span>
      </span>
    </Button>
  );
}
