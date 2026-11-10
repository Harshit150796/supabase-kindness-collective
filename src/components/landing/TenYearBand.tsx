import { useEffect, useRef, useState } from 'react';

/**
 * The ten-year band under "Give what people need." (founder's pick, Nov 10, 2026: "C. Watch date window",
 * on white like the page around it): "Donate $10 today. Check where it went in" with the year set large
 * beside it, its last two digits in a watch-style date window. The window rolls once, from this year to ten
 * years on, when most of the band is in view (transform only); Pause animations shows the final year.
 * Years come from the visitor's clock, so the band never goes out of date.
 */
export function TenYearBand({ still }: { still: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  const from = new Date().getFullYear();
  const to = from + 10;
  const reel = Array.from({ length: to - from + 1 }, (_, i) => String(from + i).slice(-2));

  useEffect(() => {
    const node = ref.current;
    if (!node || seen) return;
    if (typeof IntersectionObserver === 'undefined') { setSeen(true); return; }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.intersectionRatio >= 0.6)) { setSeen(true); observer.disconnect(); }
    }, { threshold: [0, 0.6] });
    observer.observe(node);
    return () => observer.disconnect();
  }, [seen]);

  const rolled = still || seen;

  return (
    <section aria-labelledby="ten-year-heading" className="bg-background text-foreground" data-ten-year-band>
      {/* Phones read heading, year, note (the year finishes the sentence); wider screens put the year beside them. */}
      <div ref={ref} className="container mx-auto grid gap-x-12 gap-y-4 px-4 pb-4 pt-12 md:grid-cols-[minmax(0,1fr)_auto] md:items-center lg:pb-6 lg:pt-16">
        <h2 id="ten-year-heading" className="font-display text-[2.25rem] font-normal leading-[1.08] md:col-start-1 md:row-start-1 md:self-end md:text-[2.75rem] lg:text-[3.25rem]">
          Donate $10 today.<br />Check where it went in<span className="sr-only"> {to}.</span>
        </h2>
        <div aria-hidden="true" className="flex items-center font-display text-[88px] leading-none tabular-nums md:col-start-2 md:row-span-2 md:row-start-1 md:text-[112px] lg:text-[136px]">
          <span>{String(to).slice(0, 2)}</span>
          <span className="ml-2 inline-block rounded-xl border border-primary/35 bg-primary/[0.04] px-3 py-1 shadow-[inset_0_2px_8px_hsl(var(--ink)/0.08)] lg:px-3.5">
            <span className="block h-[1.05em] overflow-hidden">
              <span
                data-ten-year-reel={rolled ? 'rolled' : 'waiting'}
                className="block text-verify"
                style={{ transform: `translateY(${rolled ? -(reel.length - 1) * 1.05 : 0}em)`, transition: still ? 'none' : 'transform 2.8s cubic-bezier(0.16, 1, 0.3, 1) 0.3s' }}
              >
                {reel.map((digits, i) => <span key={i} className="block h-[1.05em]">{digits}</span>)}
              </span>
            </span>
          </span>
        </div>
        <p className="max-w-[520px] text-base leading-relaxed text-muted-foreground md:col-start-1 md:row-start-2 md:self-start md:text-[17px]">Every donation keeps its receipt, so the answer is still there ten years on.</p>
      </div>
    </section>
  );
}
