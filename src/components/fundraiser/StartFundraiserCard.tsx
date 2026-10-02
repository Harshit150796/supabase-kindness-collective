import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export function StartFundraiserCard({ className = '' }: { className?: string }) {
  return (
    <Link to="/apply" className={`group flex h-full min-h-[22rem] snap-start flex-col justify-between bg-primary p-8 text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${className}`}>
      <div className="h-1 w-16 bg-primary-foreground/70" />
      <div>
        <h3 className="font-display text-4xl leading-[1.05]">Start your own fundraiser</h3>
        <p className="mt-3 max-w-xs text-sm text-primary-foreground/80">Raise coupon-locked support for yourself, your family or someone you help. It takes a few minutes.</p>
        <span className="mt-6 inline-flex items-center gap-2 font-semibold">Start a fundraiser <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
      </div>
    </Link>
  );
}
