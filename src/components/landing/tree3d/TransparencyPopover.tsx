import { useEffect, useState } from 'react';
import { useInteraction } from './InteractionContext';
import { Button } from '@/components/ui/button';
import { X, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

// The whole gift reaches families; running costs come from optional tips, and the card fee is
// covered by the donor at checkout or paid from tips. Logo green and blue only.
const ROWS = [
  { label: 'Your gift, to families', pct: 100, note: '100%', color: 'bg-primary', text: 'text-primary' },
  { label: 'Taken from your gift', pct: 0, note: '0%', color: 'bg-verify', text: 'text-verify' },
];

export function TransparencyPopover() {
  const { transparencyOpen, closeTransparency } = useInteraction();
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (transparencyOpen) {
      setAnimate(false);
      const t = setTimeout(() => setAnimate(true), 50);
      return () => clearTimeout(t);
    }
  }, [transparencyOpen]);

  if (!transparencyOpen) return null;

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-md pointer-events-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="rounded-2xl border border-border bg-background/85 backdrop-blur-xl shadow-2xl p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-foreground">Where your money goes</h3>
            <p className="text-xs text-muted-foreground">Full transparency, every donation</p>
          </div>
          <button
            onClick={closeTransparency}
            className="p-1 rounded-md hover:bg-muted transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-3">
          {ROWS.map((r) => (
            <div key={r.label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-foreground">{r.label}</span>
                <span className={`font-bold ${r.text}`}>{r.note}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full ${r.color} rounded-full transition-all duration-700 ease-out`}
                  style={{ width: animate ? `${r.pct}%` : '0%' }}
                />
              </div>
            </div>
          ))}
        </div>

        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          An optional tip at checkout keeps the platform running (most donors leave about 10%). You can cover the card fee; if you don't, tips pay it.
        </p>

        <Button asChild size="sm" className="w-full mt-4">
          <Link to="/about" onClick={closeTransparency}>
            View full transparency report <ArrowRight className="ml-2 w-3 h-3" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
